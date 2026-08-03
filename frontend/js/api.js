const API = {
    _fetch: async (url, method='GET', body=null) => {
        const opts = { method, headers: {'Content-Type':'application/json'}, credentials:'same-origin' };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || res.statusText);
        }
        return res.json();
    },
    register: (username, password) => API._fetch('/api/auth/register', 'POST', {username, password}),
    login: (username, password) => API._fetch('/api/auth/login', 'POST', {username, password}),
    guest: () => API._fetch('/api/auth/guest', 'POST'),
    me: () => API._fetch('/api/auth/me'),
    chat: (message, charId = null) => {
        const body = { message };
        if (charId) body.char_id = charId;
        return API._fetch('/api/chat', 'POST', body);
    },
    getCharacters: () => API._fetch('/api/characters'),
    getConversations: () => API._fetch('/api/conversations'),
    annotateMessage: (id, annotation) => API._fetch(`/api/conversations/${id}/annotate`, 'PUT', {annotation}),
};
