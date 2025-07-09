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
            const errorText = await response.text();
            throw new Error(errorText || 'Network response was not ok');
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (isGet) Loader.cache[pEndpoint] = data;
            return data;
        } else {
            const data = await response.text();
            if (isGet) Loader.cache[pEndpoint] = data;
            return data;
        }
    }
}

export default Loader;