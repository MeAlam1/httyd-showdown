import {parentPort} from 'worker_threads';
import path from 'path';
import {fileURLToPath} from 'url';
import {BaseJsonLoader} from './json/JsonLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public/api/dragons');

class DragonLoader extends BaseJsonLoader {
    constructor() {
        super(PUBLIC_DIR);
    }
}

async function main() {
    const loader = new DragonLoader();
    const dragons = await loader.loadAll();
    parentPort && parentPort.postMessage(dragons);
}

main().catch((e) => {
    console.error('[DragonWorker] Failed:', e);
    process.exit(1);
});