import { GenerateIdentity } from "@concurrent-world/client";
import { parentPort } from 'worker_threads';


let attempts = 0;
let workerID = 0;
let running = false;

async function startWorker(target) {
    while (running) {
        attempts++;
        const identity = GenerateIdentity();
        if (identity.CCID.startsWith("con1"+target)) {
            parentPort.postMessage({
                'type': 'completed',
                'result': identity,
                'workerId': workerID
            });
            running = false;
        }
        await new Promise(resolve => setImmediate(resolve));
    }
    process.exit(0);
}

parentPort.on('message', (message) => {
    switch (message.type) {
        case 'start':
            workerID = message.workerId;
            if (!running) {
                console.log(`Worker ${workerID} started`);
                running = true;
                startWorker(message.target);
            }
            break;
        case 'progress':
            if (running) {
                parentPort.postMessage({
                    'type': 'progress',
                    'result': attempts,
                    'workerId': workerID,
                });
            }
            break;
        case 'stop':
            running = false;
            break;
        default:
            console.log('Unknown message type: ' + message.type);
            break;
    }
});

