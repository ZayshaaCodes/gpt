const dotenv = require('dotenv');
dotenv.config({ path: './.env' })
fs = require('fs');

const { Configuration, OpenAIApi } = require("openai");
const ShellController = require("./shell");
const readline = require('readline');

require("dotenv").config();
const read = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const shell = new ShellController('home/zayshaa/aiprojects');
const org = process.env.OPENAI_ORGANIZATION;
const apiKey = process.env.OPENAI_API;
const configuration = new Configuration({
    organization: org,
    apiKey: apiKey,
});


const openai = new OpenAIApi(configuration);

// const goal = "build a small node.js application using the provided tools."
const goal = "fully explore the project in /home/zayshaa/discord/, read the files and understand the code."

const exploreDirectives = fs.readFileSync('exploreDirectives.txt', 'utf8');

const buildDirectives = fs.readFileSync('programmerDirectives.txt', 'utf8');

const functions = [
    "sh(string) - execute a shell command (use swd(path) to change directories)",
    "calculator(string) - perform a calculation for general math",
    "web(urlString) - fetch a web page",
    "js(scriptPath) - execute JavaScript code",
    "swd(absolutePath) - set the working directory, only absolute paths are allowed",
]

const prefix = "`no quotes`\n`no explanations`\n`no apologies`\n`no filler`\n`just answer`";
const reiterate = "`only one step at a time!`\n`only give function calls!`\n`you are responsible for all coding tasks, provide code by giving a filename and an associated code block.`";

let workingDirectory = "/home/zayshaa/aiprojects";

const messages = [
    { role: "system", content: exploreDirectives },
    { role: "user", content: exploreDirectives },
    { role: "assistant", content: "I'm ready to help you with your project. What would you like to do?" },
    { role: "user", content: goal + " " + prefix  + " " + reiterate },
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
        read.question(prompt, (answer) => {
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

        let didcall = false;
        let funcOutput = "";
        //execute function calls
        if (functionCalls) {
            console.log(`${boldGreen}Function calls:\n`);

            for (let i = 0; i < functionCalls.length; i++) {
                const functionCall = functionCalls[i];
                const functionName = functionCall.split("(")[0];
                let functionArgs = functionCall.split("(")[1].split(")")[0];
                //remove "'s from args
                functionArgs = functionArgs.replace(/[\"\'\`]/g, "");

                console.log(`${boldwhite}${i}: ${lightBlue}${functionName}(${functionArgs})`);
                //call the function in this file
                if (functionName === "list_files") {
                    const path = functionArgs.split(",")[0];
                    //if more than one argument is provided, use the first one
                    funcOutput += shell.executeCommand(`ls ${path}`);
                }
                // // read a file, add it to funcOutput
                // if (functionName === "read_file") {
                //     await fs.readFile(functionArgs, 'utf8', function (err, data) {
                //         if (err) {
                //             return console.log(err);
                //         }
                //         funcOutput += data;
                //     } );
                //     didcall = true;
                // }
            }
        }

        if (didcall) {
            console.log(`${boldGreen}Function output2:\n${cyan}`, funcOutput);
            messages.push({ role: "user", content: `\`\`\`${funcOutput}\`\`\`` });
        } else {
            let userInput = await getUserInput(`\x1b[${white}> `);
            messages.push({ role: "user", content: userInput });
        }
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
