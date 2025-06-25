import fs from 'fs/promises';
import path from 'path';

export class BaseJsonLoader {
    constructor(baseDir) {
        this.baseDir = baseDir;
    }

    async loadAll() {
        const result = {};
        const folders = await fs.readdir(this.baseDir, {withFileTypes: true});
        for (const folder of folders) {
            if (!folder.isDirectory()) continue;
            const folderPath = path.join(this.baseDir, folder.name);
            const files = await fs.readdir(folderPath);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const filePath = path.join(folderPath, file);
                const jsonRaw = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(jsonRaw);
                result[data.id] = data;
            }
        }
        return result;
    }
}