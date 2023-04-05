
const { Configuration, OpenAIApi } = require("openai");
const AiAssistant = require('./AiAssistant');
require("dotenv").config();
fs = require('fs');
const ShellController = require("./shell");
const readline = require('readline');
const { log } = require("console");
const aiPersonas = require('./aiPersonas.json');

const read = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function getUserInput(prompt) {
    return new Promise((resolve) => {
        read.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

// bots
const arch = spawnAi("Architect", true);
const coder = spawnAi("Coder", true);

// main loop
(async () => {
    let res = await arch.chat(`human@architect: make a very simple and creative game (pick anything) using html, css, and javascript. proceed unless you have questions.`);
    //log with colors, light blue for architect, light green for coder
    console.log("\x1b[36m%s\x1b[0m", res);

    while (true) {

        let user = await getUserInput("human: ");

        //regex for the chat pattern <role>@<role>:
        const chatPattern = /([a-zA-Z]+)@([a-zA-Z]+):\s/g;

        //if the user string is just >, use the last response
        if (user === ">") {
            user = res;
        }

        let source = "human";
        let target = "architect";
        const match = chatPattern.exec(user);
        if (match) {
            source = match[1];
            target = match[2];
        }
        log(`${source}@${target}`);

        //role@role: <message>
        const messageinfo = source + "@" + target + ": ";

        if (target === "architect") {
            res = await arch.chat(messageinfo + user);
            console.log("\x1b[36m%s\x1b[0m", res);
        }
        else if (target === "coder") {
            res = await coder.chat(messageinfo + user);
            console.log("\x1b[32m%s\x1b[0m", res);
        }


    }
})();

/**
 * 
 * @param {string} id
 * @returns {AiAssistant}
 */
function spawnAi(id, appendExamples = true) {
    const persona = aiPersonas[id];
    if (!persona) {
        console.log("no persona found for id: " + id);
        return;
    }

    const newAi = new AiAssistant("id.md", "gpt-3.5-turbo", process.env.OPENAI_ORGANIZATION, process.env.OPENAI_API, .0);
    const directive = persona["Directive"].join("\n");

    newAi.setSystemDirective(directive);
    newAi.setDirective(directive);

    if (appendExamples) {
        const examples = persona["Examples"];
        for (let i = 0; i < examples.length; i++) {
            const example = examples[i];
            newAi.giveExample(example["Prompt"], example["Response"]);
        }
    }

    return newAi;
}

