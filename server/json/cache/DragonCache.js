export class DragonsCache {
    static cache = {};

    static setAll(dragons) {
        this.cache = dragons;
    }

    static getById(id) {
        return this.cache[id] || null;
    }

    static getAll() {
        return Object.values(this.cache);
    }
}