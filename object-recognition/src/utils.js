export const dom = {
    $:  (selector, parent = document) =>      parent.querySelector   (selector),
    $$: (selector, parent = document) => [ ...parent.querySelectorAll(selector) ],

    on: (target, event, handler, options = false) => {
        target.addEventListener(event, handler, options);

        return () => target.removeEventListener(event, handler, options);
    },

    create: (tagName, attributes = {}) => {
        const element = document.createElement(tagName);

        for(const [ key, value ] of Object.entries(attributes)) {
            switch(key) {
                case 'text':
                    element.textContent = value;
                    break;

                case 'html':
                    element.innerHTML = value;
                    break;

                default:
                    element.setAttribute(key, value);
            }
        }

        return element;
    }
};

export const url = {
    params: {
        set: (name = '', value = '', urlString = window.location.href) => {
            const url = new URL(urlString);

            url.searchParams.set(name, value);

            return url.toString();
        },

        get: (name = '', urlString = window.location.href) => {
            return (new URL(urlString)).searchParams.get(name);
        },

        remove: (name = '', urlString = window.location.href) => {
            const url = new URL(urlString);

            url.searchParams.delete(name);

            return url.toString();
        },

        has: (name = '', urlString = window.location.href) => {
            return (new URL(urlString)).searchParams.has(name);
        },

        toObject: (urlString = window.location.href) => {
            return Object.fromEntries((new URL(urlString)).searchParams.entries());
        },

        fromObject: (params = {}, urlString = window.location.href) => {
            const url = new URL(urlString);

            for(const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

            return url.toString();
        },

        clear: (urlString = window.location.href) => {
            const url = new URL(urlString);

            url.search = '';

            return url.toString();
        }
    },

    hash: {
        set(name = '', value = '', urlString = window.location.href) {
            const url  = new URL(urlString);
            const hash = new URLSearchParams(url.hash.slice(1));

            hash.set(name, value);

            url.hash = hash.toString().replace(/=$/, '');

            return url.toString();
        },

        get(name = '', urlString = window.location.href) {
            const url  = new URL(urlString);
            const hash = new URLSearchParams(url.hash.slice(1));

            return hash.get(name);
        },

        remove(name = '', urlString = window.location.href) {
            const url  = new URL(urlString);
            const hash = new URLSearchParams(url.hash.slice(1));

            hash.delete(name);

            url.hash = hash.toString();

            return url.toString();
        },

        has(name = '', urlString = window.location.href) {
            return new URLSearchParams(new URL(urlString).hash.slice(1)).has(name);
        },

        toObject(urlString = window.location.href) {
            const hash = new URLSearchParams(new URL(urlString).hash.slice(1));

            return Object.fromEntries([ ...hash.entries() ].map(([ k, v ]) => [ k, v ]));
        },

        clear(urlString = window.location.href) {
            const url = new URL(urlString);

            url.hash = '';

            return url.toString();
        }
    }
};

export const storage = {
    set: (setData = {}, sKey = window.location.pathname, session = false) => {
        setData = JSON.stringify(setData);

        session ? sessionStorage.setItem(sKey, setData) : localStorage.setItem(sKey, setData);

        return true;
    },

    get: (key = '', sKey = window.location.pathname, session = false) => {
        let sData = session ? sessionStorage.getItem(sKey) : localStorage.getItem(sKey);

        if(!sData) return null;

        sData = JSON.parse(sData);

        if(key) return key in sData ? sData[key] : null;

        return sData;
    },

    remove: (sKey = window.location.pathname, session = false) => {
        session ? sessionStorage.removeItem(sKey) : localStorage.removeItem(sKey);
    }
};