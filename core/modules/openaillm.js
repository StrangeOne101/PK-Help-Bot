const OpenAI = require('openai');

const OPENAI_API_KEY = "input api key here";
const LLM_MODEL = 'gpt-4o-mini'; // the cheapest model they offer, its $0.15/1m tokens

let instance = null;

function getInstance() {
    if (!instance) {
        instance = new OpenAIAsyncClient();
    }
    return instance;
}

class OpenAIAsyncClient {

    constructor() {
        this.client = new OpenAI({
            apiKey: OPENAI_API_KEY
        });
        this.model = LLM_MODEL;
    }

    // parameters and even model could be more configurable
    async callOpenAI(prompt) {
        let completed = false;
        let tries = 0;
        console.log(`\n⏲️  -- Requesting (${LLM_MODEL}):\n${prompt}\n`);

        while (!completed && tries <= 5) {
            try {
                tries += 1;
                const response = await this.client.chat.completions.create({
                    model: this.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 350, // the max length in tokens of the AI response. 600 seems ok for more detailed responses. 300-350 is good for more concise ones.
                    temperature: 0.25 // a value 0.00-1.00, lower is more focused and deterministic and higher is more random and creative
                });

                completed = true;
                const result = response.choices[0].message.content.trim();

                console.log(`\n✔️  -- Finished (${LLM_MODEL}):\n${result}\n`);
                return { model: this.model, response: result };

            } catch (error) {
                console.error(`Error occurred: ${error}`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        console.error("Exceeded OpenAI retry limit.");
        return { model: "None", response: "None" };
    }

    async analyzeStackTrace(prompt) {
        try {
            // here is the base prompt providing instructions and any extra context about ProjectKorra
            const { model, response } = await this.callOpenAI(
                    `Analyze the following stacktrace/request and if it is related to ProjectKorra in any way, provide a possible cause, keep it short, concise, accessible and end-user friendly format. Your goal is to be helpful and precise about the most possible cause. If, and only if, it seems they should update the plugin, point the user to beta builds of ProjectKorra here (https://discord.com/channels/292809844803502080/922939387635957800) and let them know why their ProjectKorra and Minecraft versions are incompatible, and for reference here is an image with a compatibility chart (https://media.discordapp.net/attachments/300990411353358336/1242356995894542396/image.png?ex=66d9f25d&is=66d8a0dd&hm=ceac17619e9fdbc27a3f893bc0f8a8a314cd13a605f4b9e842ba5aea5fe3b20c&=&format=webp&quality=lossless). The latest beta build is 1.12.0-BETA-13. ProjectKorra 1.11.3 supports Minecraft 1.16-LATEST. ProjectKorra 1.11.2 supports 1.16-1.20.2. ProjectKorra 1.10.X supports 1.16-1.19.3. 1.9.3 supports 1.16-1.19.3 with manual configuration edits for bendable blocks. 1.8.9 supports 1.14-1.15.X. Finally, 1.8.8 supports 1.13.X only. If, and only if, the stacktrace contains information about timings, ensure the user this is normal. If, and only if, the stacktrace contains errors related to getColor() let them know the addon in question is probably out of date:\n${prompt}`
                );
            return { model: model, response: response}
        } catch (error) {
            console.error(`\n❌  -- Error (${LLM_MODEL}):\n${error}\n`);
            return { model: "None", response: "There was an error while analyzing your stack trace." };
        }
    }
}

module.exports = {
    getInstance
};
