import {parentPort} from 'worker_threads';
import path from 'path';
import {fileURLToPath} from 'url';
import {BaseJsonLoader} from './json/JsonLoader.js';
import {Logger} from '../common/utils/logger/Logger.js';
import {LogLevel} from '../common/utils/logger/LogLevel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public/api/dragons');

class DragonLoader extends BaseJsonLoader {
    constructor() {
        super(PUBLIC_DIR);
        this.logger = new Logger();
    }

    async loadAndSend() {
        try {
            const dragons = await this.loadAll();
            parentPort && parentPort.postMessage(dragons);
        } catch (e) {
            this.logger.log(LogLevel.ERROR, '[DragonWorker] Failed:', e);
            process.exit(1);
        }
    }
}

if (parentPort) {
    const loader = new DragonLoader();
    loader.loadAndSend();
}