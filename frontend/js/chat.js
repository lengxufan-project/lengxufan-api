let messages = [];
let currentCharId = 'lengxufan';

async function loadCharacters() {
    try {
        const chars = await API.getCharacters();
        const select = document.getElementById('char-select');
        if (!select) return;
        select.innerHTML = '';
        chars.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            if (c.id === currentCharId) option.selected = true;
            select.appendChild(option);
        });
    } catch(e) {}
}

function switchCharacter(charId) {
    currentCharId = charId;
    messages = [];
    document.getElementById('messages').innerHTML = '';
}

async function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    messages.push({ role:'user', content: text });
    renderMessages();
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    try {
        const res = await API.chat(text, currentCharId);
        messages.push({ role:'lxf', content: res.reply, state: res.state });
        renderMessages();
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        if (window.showDevPanel) updateDevPanel(res.state);
    } catch(e) {
        messages.push({ role:'lxf', content: '……（他沉默着，没有回答）' });
        renderMessages();
    }
}

document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('msg-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

function renderMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';
    messages.forEach((msg, idx) => {
        const div = document.createElement('div');
        div.className = 'message ' + (msg.role === 'user' ? 'user' : 'lxf');
        div.dataset.index = idx;
        if (msg.role === 'lxf' && msg.content.includes('💭')) {
            const parts = msg.content.split('💭');
            div.textContent = parts[0].trim();
            const mono = document.createElement('div');
            mono.className = 'monologue';
            mono.textContent = '💭 ' + parts.slice(1).join('💭').trim();
            div.appendChild(mono);
        } else {
            div.textContent = msg.content;
        }
        if (msg.annotation) {
            const badge = document.createElement('span');
            badge.className = 'annotation-badge';
            badge.style.display = 'block';
            badge.textContent = 'i';
            div.appendChild(badge);
        }
        div.addEventListener('contextmenu', e => { e.preventDefault(); openAnnotationModal(idx); });
        let pressTimer;
        div.addEventListener('touchstart', e => { pressTimer = setTimeout(() => openAnnotationModal(idx), 600); });
        div.addEventListener('touchend', () => clearTimeout(pressTimer));
        div.addEventListener('touchmove', () => clearTimeout(pressTimer));
        container.appendChild(div);
    });
}

loadCharacters();
