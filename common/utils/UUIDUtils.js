import Loader from "../server/Loader.js";

class UUIDUtils {
    constructor(apiBaseUrl = '/api/uuid', purpose = '404') {
        this.apiBaseUrl = apiBaseUrl;
        this.defaultPurpose = purpose;
        this.uuid = null;
    }

    static withPurpose(purpose) {
        return new UUIDUtils('/api/uuid', purpose);
    }

    async fetchUUID(purpose = this.defaultPurpose) {
        const data = await Loader.load(
            `${this.apiBaseUrl}/generate?pPurpose=${encodeURIComponent(purpose)}`
        );
        this.uuid = data.uuid;
        return this.uuid;
    }

    async validateUUID(uuid = this.uuid, purpose = this.defaultPurpose) {
        const data = await Loader.load(`${this.apiBaseUrl}/validate`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({uuid, purpose: purpose})
        });
        return data.valid;
    }

    async removeUUID(uuid = this.uuid, purpose = this.defaultPurpose) {
        await Loader.load(`${this.apiBaseUrl}/remove`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({uuid, purpose})
        });
    }

    getUUID() {
        return this.uuid;
    }

    getPurpose() {
        return this.defaultPurpose;
    }
}

export default UUIDUtils;