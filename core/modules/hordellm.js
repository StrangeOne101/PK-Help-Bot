const axios = require('axios');

// This is leftover from my use-case. This probably wouldnt be used here, but is an option.
const BLACKLISTED_MODELS = [];

let LLM = "";
const HORDE_API_KEY_FREE = "0000000000";

async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null;
    }
}

async function promptLLM(prompt) {
    if (!LLM) {
        LLM = await getBestModel();
    }

    if (LLM === "None") {
        return "No models are available to handle this request.";
    }

    console.log(`\n⏲️  -- Requesting (${LLM}):\n${prompt}\n`);

    // here is the base prompt providing instructions and any extra context about ProjectKorra
    const llmPrompt = `Analyze the following stacktrace/request and provide a possible cause in a user friendly way, like they are five years old.\n\n${prompt}\n\n### Response:\n`;

    const headers = {
        "Content-Type": "application/json",
        "Client-Agent": "testing",
        "apikey": HORDE_API_KEY_FREE
    };

    // parameters could be more configurable
    const payload = {
        "prompt": llmPrompt,
        "params": {
            "n": 1,
            "frmtadsnsp": true, // payload parameter info can be found here: https://aihorde.net/api/ @ /generate/text/async
            "frmtrmblln": true,
            "frmtrmspch": false,
            "frmttriminc": true,
            "max_context_length": 2048,  // The max length of your input prompt in tokens. This is the max for free usage. It includes the users prompt and the base prompt.
            "max_length": 150, // the max length in tokens of the reply. It cant go much higher than this without paying 'kudos'. this is free and unlimited.
            "rep_pen": 1.2,
            "rep_pen_range": 2048,
            "rep_pen_slope": 0.8,
            "singleline": true,
            "temperature": 0.35, // a number 0.00-1.00, where lower is more deterministic and focused, higher is more random and creative
            "tfs": 0.88,
            "top_a": 0,
            "top_k": 40,
            "top_p": 0.9,
            "typical": 0.95,
            "use_default_badwordsids": false
        },
        "trusted_workers": false,
        "slow_workers": true,
        "workers": [],
        "worker_blacklist": false,
        "models": [LLM],
        "dry_run": false
    };

    try {
        const response = await axios.post('https://aihorde.net/api/v2/generate/text/async', payload, { headers, timeout: 20000 });
        const responseId = response.data.id;

        console.log(`\n🔍  -- Polling job ID ${responseId}`);

        const responseText = await pollForCompletion(responseId);

        if (!responseText || !responseText.generations || responseText.generations.length === 0) {
            console.error(`\n❌  -- Error (${LLM}): Invalid response format\nResponse:`, responseText);
            return "Failed to analyze the stack trace. Please try again.";
        }

        const text = responseText.generations[0].text;
        console.log(`\n✔️  -- Finished (${LLM}):\n${text}\n`);
        return text;

    } catch (err) {
        console.error(`\n❌  -- Error (${LLM}):\n${err}\n`);
        return "An error occurred while processing the request. Please check the console.";
    }
}

async function pollForCompletion(jobId) {
    const startTime = Date.now();

    while (true) {
        try {
            const response = await axios.get(`https://aihorde.net/api/v2/generate/text/status/${jobId}`, { timeout: 20000 });

            if (!response.data) {
                console.error(`Error: No data returned for job ID ${jobId}`);
                return null;
            }

            if (!response.data.is_possible || response.data.faulted) {
                console.error(`Error: Job ${jobId} is not possible or has faulted.`);
                return null;
            }

            if (response.data.done) {
                return response.data;
            }

        } catch (error) {
            console.error(`Error polling job ${jobId}:`, error);
            return null;
        }

        if (Date.now() - startTime > 20000) {
            console.error(`Timeout: Polling for job ${jobId} exceeded 20 seconds.`);
            return null;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function scoreModel(model) {
    const bValueMatch = model.name.match(/(\d+)B/);
    if (bValueMatch) {
        const bValue = parseInt(bValueMatch[1], 10);
        const count = model.count;
        const eta = model.eta;

        if (bValue >= 8 && bValue <= 16) {
            let score = count - (eta / 10);
            return { score, model };
        }
    }
    return { score: 0, model };
}

// model availability on the stable horde is ever changing. we want to get whatever is fastest and would give decent responses
async function getBestModel() {
    const apiUrl = "https://stablehorde.net/api/v2/status/models?type=text";
    const data = await fetchData(apiUrl);

    const filteredModels = data.filter(model =>
        BLACKLISTED_MODELS.every(blItem => !model.name.includes(blItem)) &&
        Array.from({ length: 9 }, (_, i) => `${i + 8}B`).some(b => model.name.includes(b))
    );

    if (filteredModels.length === 0) {
        return "None";
    }

    const scoredModels = await Promise.all(filteredModels.map(model => scoreModel(model)));
    const sortedModels = scoredModels.sort((a, b) => (b.score - a.score) || (b.model.queued - a.model.queued));

    return sortedModels.length > 0 ? sortedModels[0].model.name : "None";
}

module.exports = {
    promptLLM
};
