const OpenAI = require('openai');
const tiktoken = require('tiktoken');
const fs = require('fs');
var config = require("../config.js");
const API = require("../api.js");

const logFiles = config["file-logging"] || false;

const LLM_MODEL = 'gpt-4o-mini'; // best and most affordable openai model for stack trace analysis
const BASE_PROMPT = fs.readFileSync('./config/base_stacktrace_prompt.txt', 'utf8');

let instance = null;

function getGPTInstance() {
    if (!instance) {
        instance = new OpenAIAsyncClient();
    }
    return instance;
}

class OpenAIAsyncClient {

    constructor() {
        this.client = new OpenAI({
            apiKey: config.getOpenAIToken()
        });
        this.model = LLM_MODEL;
    }

    // gpt-4o-mini actually doesnt work with this yet, but its a very close estimate.
    // TODO: update this when there is a tokenizer supporting gpt-4o-mini
    async countTokens(text, model = 'gpt-4') {
        const encoding = tiktoken.encoding_for_model(model);
        return encoding.encode(text).length;
    }

    async callOpenAI(systemPrompt, userPrompt, maxTokens, temperature, model) {
        let completed = false;
        let tries = 0;

        console.log(`\n⏲️  -- Requesting (${model}):\n${userPrompt}\n`);

        // retry their request up to 5 times, this is not any sort of OpenAI rate limit and can be changed
        while (!completed && tries <= 5) {
            try {
                tries += 1;
                const response = await this.client.chat.completions.create({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: maxTokens, // the max length in tokens of the AI response. 600 seems ok for more detailed responses. 300-350 is good for more concise ones.
                    temperature: temperature // a value 0.00-1.00, lower is more focused and deterministic and higher is more random and creative
                });

                completed = true;
                const result = response.choices[0].message.content.trim();

                console.log(`\n✔️  -- Finished (${model}):\n${result}\n`);

                const currentTime = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `./responses/${currentTime}.json`;

                if (logFiles) {
                    fs.mkdirSync('./responses', { recursive: true });

                    const jsonData = JSON.stringify({ prompt: [userPrompt, systemPrompt].join('\n'), response: result, model: model }, null, 2);
                    fs.writeFileSync(filename, jsonData);
    
                    console.log(`\n💾  -- Saved response as ${filename}\n`);
                }
                
                return { model: model, response: result };

            } catch (error) {
                console.error(`Error occurred: ${error}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        console.error("Exceeded OpenAI retry limit.");
        return { model: "None", response: "None" };
    }

    async analyzeStackTrace(stackTraceMessage) {
        try {
            const { model, response } = await this.callOpenAI(
                    BASE_PROMPT, stackTraceMessage, 420, 0.37, LLM_MODEL
                );
            return { model: model, response: response}
        } catch (error) {
            console.error(`\n❌  -- Error (${LLM_MODEL}):\n${error}\n`);
            return { model: "None", response: "There was an error while analyzing your stack trace." };
        }
    }
}

module.exports = {
    getGPTInstance,
    BASE_PROMPT
};

API.subscribe("reload", () => {
    console.log("Reloading stack trace analyzer prompt...");
    BASE_PROMPT = fs.readFileSync('./config/base_stacktrace_prompt.txt', 'utf8');
});
