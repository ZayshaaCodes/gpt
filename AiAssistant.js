const { Configuration, OpenAIApi } = require("openai");

class AiAssistant {
    constructor(outputFile = "output.md", model = "gpt-3.5-turbo", 
        organization = process.env.OPENAI_ORGANIZATION,
        apiKey = process.env.OPENAI_API,
        temperature = .3
    ) {
        this.model = model;
        const configuration = new Configuration({
            organization: organization,
            apiKey: apiKey,
        });
        this.openai = new OpenAIApi(configuration);
        this.messages = []; // message history for the conversation with the assistant, this maintains the conversation context
        this.outputFilepath = outputFile;
        this.currentResponseArr = [];
        this.isRunning = false;
        this.temperature = temperature;
    }

    setDirective(directive) { // by setting the second message to be the directive, the assistant will respond to the directive
        this.messages[1] = { role: "user", content: directive };
    }

    setSystemDirective(directive) { // by setting the second message to be the directive, the assistant will respond to the directive
        this.messages[0] = { role: "system", content: directive };
    }

    giveExample(prompt, response) {
        this.messages.push({ role: "user", content: prompt });
        this.messages.push({ role: "assistant", content: response });
    }

    // add a user message to the conversation
    pushUserMessage(message) {
        this.messages.push({ role: "user", content: message });
    }

    // add a message from the assistant to the conversation
    addAssistantMessage(message) {
        this.messages.push({ role: "assistant", content: message });
    }

    // add a message to the conversation and get response, then pop the message
    async query(prompt) {
        this.pushUserMessage(prompt);
        const res = await this.generateResponse();
        this.messages.pop();
        return res;
    }

    // add a message to the conversation and get response, also add the response to the conversation
    async chat(prompt) {
        this.pushUserMessage(prompt);
        const res = await this.generateResponse();
        this.addAssistantMessage(res);
        return res;
    }

    // generate a response from the assistant
    async generateResponse() {
        //clear the out array
        this.currentResponseArr = [];

        const res = await this.openai.createChatCompletion({
            model: this.model,
            messages: this.messages,
            stream: true,
            temperature: this.temperature
        }, { responseType: "stream" });

        let fileStream = null;
        //open a file stream
        if (this.outputFilepath !== null || this.outputFilepath !== undefined || this.outputFilepath !== "") {
            fileStream = fs.createWriteStream(this.outputFilepath);
        }

        this.isRunning = true;
        return new Promise((resolve, reject) => {
            res.data.on("data", (data) => {
                // console.log(data);
                const lines = data.toString().split("\n")
                    .map((line) => line.substring(6).trim())
                    .filter((line) => line.length > 0);

                for (let i = 0; i < lines.length; i++) {
                    // console.log(i + " | " + lines[i]);
                    const line = lines[i];
                    if (line === "[DONE]") {
                        console.log(";");
                        // res.data.destroy();
                        // resolve();
                        break;
                    }
                    // if the line is blank, skip it
                    if (line.length === 0)
                        continue;

                    //try to parse the line as JSON
                    try {
                        const json = JSON.parse(line);
                        // console.log(json);
                        if (json.object === "chat.completion.chunk") {
                            const resData = toResData(line);
                            if (resData.choices.length === 0) {
                                console.log("no choices");
                                return "";
                            } else if (resData.choices[0].finish_reason === "stop") {
                                if (fileStream !== null) { fileStream.end(); }
                                res.data.destroy();
                                this.isRunning = false;
                                resolve(this.currentResponseArr.join(""));
                            }

                            const content = resData.choices[0].delta.content;
                            if (!content || content.length === 0) {
                                continue;
                            }

                            if (fileStream !== null) { fileStream.write(content); }
                            this.currentResponseArr.push(content);
                        }
                    }
                    catch (e) {
                        console.log("not json");
                        console.log(e);
                        res.data.destroy();

                        this.isRunning = false;
                        reject();
                    }
                }

            });
            this.isRunning = false;
        });
    }

}

/**
 * {"id":"chatcmpl-6zL3DqNfNpAR9oisZwPtEc2eE2YCq","object":"chat.completion.chunk",
 * "created":1680076947,"model":"gpt-3.5-turbo-0301","choices":
 * [{"delta":{"content":"')\n\n"},"index":0,"finish_reason":null}]}
 * @param {string} jsonString
 * @returns {{id: string, object: string, created: number, model: string, choices: [{delta: {content: string}, index: number, finish_reason: string}]}}
 */
function toResData(jsonString) {
    const json = JSON.parse(jsonString);
    return {
        id: json.id,
        object: json.object,
        created: json.created,
        model: json.model,
        choices: json.choices
    };
}

module.exports = AiAssistant;