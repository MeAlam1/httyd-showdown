import Loader from "../server/Loader.js";

class UUIDUtils {
    constructor(apiBaseUrl = '/api/uuid') {
        this.apiBaseUrl = apiBaseUrl;
        this.uuid = null;
    }

    async fetchUUID() {
        const data = await Loader.load(`${this.apiBaseUrl}/generate`);
        this.uuid = data.uuid;
        return this.uuid;
    }

    async validateUUID(uuid = this.uuid) {
        const data = await Loader.load(`${this.apiBaseUrl}/validate`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({uuid})
        });
        return data.valid;
    }

    async consumeUUID(uuid = this.uuid) {
        await Loader.load(`${this.apiBaseUrl}/consume`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({uuid})
        });
    }

    getUUID() {
        return this.uuid;
    }
}

export default UUIDUtils;