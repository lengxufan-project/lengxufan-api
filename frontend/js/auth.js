let currentUser = null;

async function initAuth() {
    try {
        currentUser = await API.me();
        if (currentUser.user_id) enterChat();
    } catch(e) {
        // 未登录，显示登录页
        document.getElementById('login-screen').style.display = 'flex';
    }
}

document.getElementById('login-btn').onclick = async () => {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    if (!u || !p) return alert('请输入用户名和密码');
    try {
        currentUser = await API.login(u, p);
        enterChat();
    } catch(e) { alert(e.message); }
};

document.getElementById('register-btn').onclick = async () => {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    if (!u || !p) return alert('请输入用户名和密码');
    try {
        currentUser = await API.register(u, p);
        enterChat();
    } catch(e) { alert(e.message); }
};

document.getElementById('guest-link').onclick = async () => {
    try {
        currentUser = await API.guest();
        enterChat();
    } catch(e) { alert(e.message); }
};

function enterChat() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'flex';
    loadHistory();
    document.getElementById('msg-input').focus();
}

async function loadHistory() {
    try {
        const history = await API.getConversations();
        window.messages = history;
        renderMessages();
    } catch(e) {}
}

initAuth();
