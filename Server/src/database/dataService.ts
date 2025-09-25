import {Worker} from 'worker_threads';
import path from 'path';
import logger from '../logger';

class DataService {
worker: Worker | null = null;
updateIntervalMinute: NodeJS.Timeout | null = null;
updateIntervalDay: NodeJS.Timeout | null = null;
config: any;

constructor(config: any) {
    this.config = config;
}

public run(): void {
    this.worker = new Worker(path.join(__dirname, 'worker.ts'), {workerData: this.config});
    this.worker.on('message', (msg) => {
        logger.info(msg);
    });
    this.worker.on('error', (err) => {
        logger.error('Data service ERROR: ', err);
    });
    this.worker.on('exit', (code) => {
        if (code !== 0) {
            logger.error(`Data service stopped with exit code ${code}`);
        }
    });
    this.worker.postMessage('start');
    logger.info("Data worker started.");
    this.worker.postMessage('check-updates');
    this.worker.postMessage('check-updates-lists');
    setTimeout(() => {
        this.updateIntervalMinute = setInterval(() => {
            this.worker?.postMessage('check-updates');
        }, 60_000); // 1 minute
    }, 60_000 - (Date.now() % 60_000));
    setTimeout(() => {
        this.updateIntervalDay = setInterval(() => {
            this.worker?.postMessage('check-updates-lists');
        }, 1000*3600*24); // 1 day
    }, 1000*3600*24 - (Date.now() % (1000*3600*24))); // Align to midnight
}

public stop(): void {
    if (this.worker) {
        this.worker.postMessage('stop');
        this.worker = null;
    }
}

public query(): any {
    
}

}

export default function dataService(config: any): DataService {
    return new DataService(config);
}