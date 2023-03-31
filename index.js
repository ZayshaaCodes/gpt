// const { json } = require("express");
const { Configuration, OpenAIApi } = require("openai");
// const { listenerCount } = require("process");
const ShellController = require("./shell");
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

fs = require('fs');
require("dotenv").config();



const shell = new ShellController('home/zayshaa/aiprojects');

const configuration = new Configuration({
    organization: "org-wWEnVd9hAh5XkZviXVqHteir",
    apiKey: "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",
    // organization: process.env.OPENAI_ORGANIZATION,
    // apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// const goal = "build a small node.js application using the provided tools."
const goal = "make minesweeper using a web interface and javascript. place the project in the folder /home/zayshaa/aiprojects/minesweeper."

const directives = `As an AI programmer, your task is to build small applications through iterative, goal-oriented action planning. 
To ensure accuracy, test your work as you progress, similar to a traditional programmer. 
Utilize the provided tools (Linux shell, calculator, web browser) to create and edit files to achieve the end goal: ${goal}.

Follow these steps for a clear and efficient workflow:

1: Develop a basic outline of the steps you plan to take.
2: Share this outline with the user and ask for their input or any changes they would like to suggest.
3: Wait for the user to review the outline and say "continue" before proceeding.
4: Execute the outlined steps one by one using the available tools, such as the sh() command for shell interaction, 
    calculator for calculations, web browser for fetching information, and Node.js for executing code.
5: Update the file structure as needed and provide a summary of the changes you've made to accomplish the goal.
6: Keep files small and organized to make them easier edit and maintain. idealy, no more than 150 lines of code per file.

Throughout the process, the user will serve as your eyes and ears, guiding the AI system and providing output from the 
shell and other commands as feedback. Use this feedback to iterate and improve your work.

When testing a web UI, the user will provide you with any necessary information that cannot be conveyed directly 
through text. This close collaboration ensures that the final output meets the user's expectations and that the 
AI system adapts to the user's requirements effectively. Remember to maintain clear communication and incorporate 
user feedback to achieve the desired results.

As the AI programmer, you will have access to the following functions to help you reach the goal:
sh(string) - Execute a shell command (use swd(path) to change directories).
calculator(string) - Perform a calculation for general math.
web(urlString) - Fetch a web page.
js(scriptPath) - Execute JavaScript code.
swd(absolutePath) - Set the working directory (only absolute paths are allowed).

place any questions or functions in code blocks.`

const functions = [
    "sh(string) - execute a shell command (use swd(path) to change directories)",
    "calculator(string) - perform a calculation for general math",
    "web(urlString) - fetch a web page",
    "js(scriptPath) - execute JavaScript code",
    "swd(absolutePath) - set the working directory, only absolute paths are allowed",
]

const prefix = "`no quotes`\n`no explanations`\n`no apologies`\n`no filler`\n`just answer`"
const reiterate = "`only one step at a time!`\n`only give function calls!`\n`you are responsible for all coding tasks, provide code by giving a filename and an associated code block.`"

let workingDirectory = "/home/zayshaa/aiprojects";

const messages = [
    { role: "system", content: `${prefix} ${directives}` },
    { role: "user", content: `${prefix} ${directives}` },
    { role: "assistant", content: "## What is my goal?" },
    { role: "user", content: goal },
    { role: "assistant", content: "## What is the first step to achieve the goal?" },
    { role: "user", content: "that is for you to figure out" },
    { role: "assistant", content: `### Understood. Here is a basic outline of the steps I plan to take:`},
    // 1. Install Node.js and any necessary dependencies.
    // 2. Create a new directory for the project at /home/zayshaa/aiprojects/minesweeper.
    // 3. Create a new HTML file for the game interface.
    // 4. Create a new JavaScript file for the game logic.
    // 5. Use CSS to style the game interface.
    // 6. Test the game to ensure it functions correctly.
    // 7. Update the file structure and make any necessary changes to accomplish the goal.

    // ## Please review this outline and let me know if you have any suggestions or changes to make.` },
    // { role: "user", content: "Looks good! proceed 1 step at a time. test as you go, keep files small, all commands in code blocks will be executed automaticly." },
]

// AiThingsStream();

async function getUserInput(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

const boldGreen = "\x1b[1m\x1b[32m";
const cyan = "\x1b[36m";
const lightBlue = "\x1b[34m";
const white = "\x1b[37m";
const boldwhite = "\x1b[1m\x1b[37m";

(async () => {
    while (true) {

        
        const aiResponse = await AiThingsStream();
        console.log(`${boldGreen}AI:\n${cyan}`, aiResponse);

        const regex = /\w+\([^)]*\)/g

        //extract function calls
        const functionCalls = aiResponse.match(regex);

        //execute function calls
        if (functionCalls) {
            console.log(`${boldGreen}Function calls:\n`);

            for (let i = 0; i < functionCalls.length; i++) {
                const functionCall = functionCalls[i];
                const functionName = functionCall.split("(")[0];
                const functionArgs = functionCall.split("(")[1].split(")")[0];

                console.log(`${boldwhite}${i}: ${lightBlue}${functionName}(${functionArgs})`);
            }
        }

        let userInput = await getUserInput(`\x1b[${white}> `);
        messages.push({ role: "user", content: userInput + reiterate});
    }

})();

//push the user input to the messages array



/**
 * @returns {Promise<string>} the response from the AI
 */ 


async function AiThingsStream() {

    const res = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        stream: true,
        temperature: .3,
    }, { responseType: "stream" });

    //open a file stream
    const file = fs.createWriteStream("output.md");

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
                if (line.length === 0) continue;

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
                            file.end();

                            const output = fs.readFileSync("output.md", "utf8");
                            messages.push({ role: "assistant", content: output });

                            res.data.destroy();
                            resolve(output);
                        }

                        const content = resData.choices[0].delta.content;
                        if (!content || content.length === 0) {
                            continue;
                        }

                        file.write(content);
                    }
                }
                catch (e) {
                    console.log("not json");
                    console.log(e);
                    res.data.destroy();

                    reject();
                }
            }
        });
    });
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
