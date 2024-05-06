import os from "os";
import { Worker } from "worker_threads";

if (process.argv.length < 3) {
    console.log("Usage: node main.mjs <target>");
    process.exit(1);
}

const cpuCores = os.cpus().length;
console.log(`CPU cores: ${cpuCores}`);

const target = process.argv[2];

const bech32table = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

if (!target.match(new RegExp(`^[${bech32table}]{1,38}$`))) {
    console.log("Invalid target");
    process.exit(1);
}

const workercount = cpuCores;
const workers = [];
for (let i = 0; i < workercount; i++) {
    workers.push(new Worker("./worker.mjs"));
}


const attempts = new Array(cpuCores).fill(0);
const checker = setInterval((attempts) => {
    workers.forEach((worker) => {
        worker.postMessage({
            "type": "progress",
        });
    });
    const totalAttempts = attempts.reduce((acc, val) => acc + val);
    console.log(`Attempts: ${totalAttempts}`);
}, 3000, attempts);

workers.forEach((worker, i) => {
    worker.on("message", (message) => {
        switch (message.type) {
            case "completed":
                console.log(message.result);
                workers.forEach((w) => w.postMessage({"type": "stop"}));
                clearInterval(checker);
                break;
            case "progress":
                attempts[message.workerId] = message.result;
                break;
            default:
                console.log(message);
        }
    });

    worker.postMessage({
        "type": "start",
        "target": target,
        "workerId": i,
    });
});


