import express from 'express';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';
import {Worker} from 'worker_threads';
import {DragonsCache} from './json/cache/DragonCache.js';

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/dragons', (req, res) => {
    res.json(Object.values(DragonsCache));
});

function preloadDragonData() {
    return new Promise((resolve, reject) => {
        console.log('[Server] Spawning preload worker...');
        const worker = new Worker(path.join(__dirname, 'DragonLoader.js'));

        worker.on('message', (data) => {
            Object.assign(DragonsCache, data);
            console.log(`[Cache] Loaded ${Object.keys(data).length} dragons.`);
            console.log('[Cache] Full data:', DragonsCache);
            resolve();
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

console.log('[Server] Starting preload of dragon data...');
preloadDragonData().then(() => {
    console.log('[Server] Preload complete. Starting server...');
    server.listen(3000, () => {
        console.log('Server running on port 3000');
    });
}).catch((err) => {
    console.error('[Server] Failed to preload dragon data:', err);
});