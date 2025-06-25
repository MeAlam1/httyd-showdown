export class DragonsCache {
    static cache = {};

    static setAll(pDragons) {
        this.cache = pDragons;
    }

    static getById(pId) {
        return this.cache[pId] || null;
    }

    static getAll() {
        return Object.values(this.cache);
    }
}