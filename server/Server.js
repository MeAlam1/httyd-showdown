import express from 'express';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';
import {Worker} from 'worker_threads';
import {DragonsCache} from './json/cache/DragonCache.js';
import {Logger} from '../common/utils/logger/Logger.js';
import {LogLevel} from '../common/utils/logger/LogLevel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Server {
    #app;
    #server;
    #logger;

    constructor(pPort = 3000) {
        this.port = pPort;
        this.#app = express();
        this.#server = http.createServer(this.#app);
        this.#logger = new Logger();

        this.#setupMiddleware();
        this.#setupRoutes();
    }

    #setupMiddleware() {
        this.#app.use(express.static(path.join(__dirname, '../public')));
    }

    #setupRoutes() {
        this.#app.get('/api/dragons', (req, res) => {
            res.json(DragonsCache.getAll());
        });
    }

    preloadDragonData() {
        return new Promise((resolve, reject) => {
            this.#logger.log(LogLevel.INFO, 'Spawning preload worker...');
            const worker = new Worker(path.join(__dirname, 'DragonLoader.js'));

            worker.on('message', (data) => {
                DragonsCache.setAll(data);
                this.#logger.log(LogLevel.SUCCESS, `Loaded ${Object.keys(data).length} dragons.`);
                //this.#logger.log(LogLevel.INFO, 'Full data: ' + JSON.stringify(DragonsCache.getAll()));
                resolve();
            });

            worker.on('error', (err) => {
                this.#logger.log(LogLevel.ERROR, 'Worker error', err);
                reject(err);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    const err = new Error(`Worker stopped with exit code ${code}`);
                    this.#logger.log(LogLevel.ERROR, err.message, err);
                    reject(err);
                }
            });
        });
    }

    start() {
        this.#logger.log(LogLevel.INFO, 'Starting preload of dragon data...');
        this.preloadDragonData().then(() => {
            this.#logger.log(LogLevel.SUCCESS, 'Preload complete. Starting server...');
            this.#server.listen(this.port, () => {
                this.#logger.log(LogLevel.SUCCESS, `Server running on port ${this.port}`);
            });
        }).catch((err) => {
            this.#logger.log(LogLevel.ERROR, 'Failed to preload dragon data', err);
        });
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const server = new Server(3000);
    server.start();
}