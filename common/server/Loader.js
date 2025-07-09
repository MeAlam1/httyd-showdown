class Loader {
    static cache = {};

    static async load(pEndpoint, options = {}) {
        const isGet = !options.method || options.method === 'GET';
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const url = `${apiUrl}${pEndpoint}`;

        if (isGet && Loader.cache[pEndpoint]) {
            return Loader.cache[pEndpoint];
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (isGet) {
            Loader.cache[pEndpoint] = data;
        }
        return data;
    }
}

export default Loader;