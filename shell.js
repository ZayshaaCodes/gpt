const { spawn } = require("child_process");

class ShellController {
    constructor(startingDirectory = process.cwd()) {
        this.cwd = this.setWorkingDirectory(startingDirectory);
    }

    //log to the console with some colors!
    async executeCommand(command) {
        console.log("\x1b[32m", "Executing command: " + command, "\x1b[0m");
        const shell = spawn(command, {
            shell: true, // this is important to run the command in the shell 
            cwd: this.cwd,
        });

        shell.stdout.on("data", (data) => {
            //log with some colors!
            console.log("\x1b[36m", "log: " + data.toString(), "\x1b[0m");
        });

        shell.stderr.on("data", (data) => {
            //log with some colors!
            console.log("\x1b[31m", "err: " + data.toString(), "\x1b[0m");
        });

        await new Promise((resolve, reject) => {
            shell.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject();
                }
            });
        });
    }

    async setWorkingDirectory(dir) {
        this.cwd = dir;
    }
}

module.exports = ShellController;