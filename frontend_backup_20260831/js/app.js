
        // ============ 全局变量 ============
        let currentChar = 'lengxufan';
let characterList = [];
let groupMode = false;
        let currentUser = null;
        let latestState = null;
        let bgIndex = 0;
        const backgrounds = [
            '/assets/backgrounds/snow-palace.webp',
            '/assets/backgrounds/crimson-nocturne.webp',
            '/assets/backgrounds/crystal-swan.webp',
            '/assets/backgrounds/rose-vow.webp',
            '/assets/backgrounds/verdant-dawnsong.webp'
        ];

        // ============ 登录逻辑 ============
        async function apiFetch(url, method='GET', body=null) {
            const opts = { method, headers:{'Content-Type':'application/json'}, credentials:'same-origin' };
            if (body) opts.body = JSON.stringify(body);
            const res = await fetch(url, opts);
            if (!res.ok) {
                const err = await res.json().catch(()=>({}));
                throw new Error(err.error || res.statusText);
            }
            return res.json();
        }

        async function login() {
            const u = document.getElementById('login-username').value.trim();
            const p = document.getElementById('login-password').value.trim();
            if (!u || !p) return alert('请输入用户名和密码');
            try {
                currentUser = await apiFetch('/api/auth/login', 'POST', {username:u, password:p});
                updateUserUI();
                closeLoginModal();
            } catch(e) { alert(e.message); }
        }

        async function register() {
            const u = document.getElementById('login-username').value.trim();
            const p = document.getElementById('login-password').value.trim();
            if (!u || !p) return alert('请输入用户名和密码');
            try {
                currentUser = await apiFetch('/api/auth/register', 'POST', {username:u, password:p});
                updateUserUI();
                closeLoginModal();
            } catch(e) { alert(e.message); }
        }

        async function guestLogin() {
            try {
                currentUser = await apiFetch('/api/auth/guest', 'POST');
                updateUserUI();
                closeLoginModal();
            } catch(e) { alert(e.message); }
        }

        async function logout() {
            try { await apiFetch('/api/auth/logout', 'POST'); } catch(e) {}
            currentUser = null;
            updateUserUI();
        }

        function updateUserUI() {
            const loginBtn = document.getElementById('btn-login');
            const userDisplay = document.getElementById('user-display');
            const logoutBtn = document.getElementById('btn-logout');
            const devBtn = document.getElementById('btn-dev');
            if (currentUser) {
                loginBtn.style.display = 'none';
                userDisplay.style.display = 'inline';
                userDisplay.textContent = `${currentUser.username} (${currentUser.role === 'developer' ? '开发者' : '用户'})`;
                logoutBtn.style.display = 'inline';
                if (currentUser.role === 'developer') {
                    devBtn.style.display = 'inline-block';
                } else {
                    devBtn.style.display = 'none';
                }
            } else {
                loginBtn.style.display = 'inline-block';
                userDisplay.style.display = 'none';
                logoutBtn.style.display = 'none';
                devBtn.style.display = 'none';
            }
        }

        function openLoginModal() {
            document.getElementById('login-modal').classList.add('active');
        }
        function closeLoginModal() {
            document.getElementById('login-modal').classList.remove('active');
        }

        // 页面加载时检查是否已登录，若未登录则自动游客登录（demo 模式）
        (async function initAuth() {
            try {
                currentUser = await apiFetch('/api/auth/me');
                updateUserUI();
            } catch(e) {
                // 未登录，自动游客登录
                try {
                    currentUser = await apiFetch('/api/auth/guest', 'POST');
                    updateUserUI();
                } catch(err) {
                    console.error('自动游客登录失败', err);
                }
            }
        })();

        // ============ 聊天逻辑 ============
        const messagesContainer = document.getElementById('chat-messages');
        const inputField = document.getElementById('chat-input');
        const sendButton = document.getElementById('chat-send');
        let isProcessing = false;

        function addMessage(role, content, speakerName) {
            const div = document.createElement('div');
            div.className = 'msg ' + role;
            if (role === 'ai' && content.includes('💭')) {
                const parts = content.split('💭');
                div.textContent = parts[0].trim();
                if (parts.length > 1) {
                    const mono = document.createElement('div');
                    mono.className = 'monologue';
                    mono.textContent = '💭 ' + parts.slice(1).join('💭').trim();
                    div.appendChild(mono);
                }
            } else {
                div.textContent = speakerName ? speakerName + '：' + content : content;
            }
            messagesContainer.appendChild(div);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showTyping() {
            const div = document.createElement('div');
            div.className = 'msg typing';
            div.id = 'typing-indicator';
            div.textContent = '角色正在输入...';
            messagesContainer.appendChild(div);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        function hideTyping() {
            const el = document.getElementById('typing-indicator');
            if (el) el.remove();
        }

        async function sendMessage() {
            const text = inputField.value.trim();
            if (!text || isProcessing) return;
            inputField.value = '';
            isProcessing = true;
            addMessage('user', text);

            if (groupMode) {
                // 群聊模式：依次让所有角色回复，并传递上下文
                showTyping();
                let groupContext = '';
                for (const c of characterList) {
                    try {
                        const res = await fetch('/api/chat', {
                            method: 'POST',
                            headers: {'Content-Type':'application/json'},
                            body: JSON.stringify({message:text, char_id:c.id, group_context:groupContext})
                        });
                        const data = await res.json();
                        hideTyping();
                        let cleanReply = data.reply.replace(/💭 身体没有异常/g, '').trim();
                        addMessage('ai', cleanReply || '……（他沉默着，没有回答）', c.name);
                        groupContext += `${c.name}：${data.reply}\n`;
                        showTyping();
                    } catch(err) {
                        hideTyping();
                        addMessage('ai', '……（他沉默着，没有回答）', c.name);
                    }
                }
                hideTyping();
                isProcessing = false;
            } else {
                // 单人模式
                showTyping();
                try {
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({message:text, char_id:currentChar})
                    });
                    const data = await res.json();
                    hideTyping();
                    addMessage('ai', data.reply);
                } catch(err) {
                    hideTyping();
                    addMessage('ai', '……（他沉默着，没有回答）');
                    console.error(err);
                } finally {
                    isProcessing = false;
                }
            }
        }

        sendButton.addEventListener('click', sendMessage);
        inputField.addEventListener('keydown', e => { if(e.key==='Enter') sendMessage(); });

        // 欢迎消息
        setTimeout(() => addMessage('ai', '（他抬眼看了你一下，指尖无意识摩挲着护腕边缘）……嗯。'), 500);

        // ============ 角色切换 ============
        function switchChar(charId) {
    currentChar = charId;
    document.querySelectorAll('#char-buttons .char-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === 'btn-' + charId);
    });
    const char = characterList.find(c => c.id === charId);
    addMessage('ai', '（切换到' + (char ? char.name : charId) + '）');
}


        function toggleGroupMode() {
            groupMode = !groupMode;
            const btn = document.getElementById('btn-group-mode');
            if (btn) {
                btn.classList.toggle('active', groupMode);
                btn.textContent = groupMode ? '退出群聊' : '群聊模式';
            }
            addMessage('ai', groupMode ? '（已进入群聊模式，所有角色将依次回复）' : '（已退出群聊模式）');
        }
async function loadCharacters() {
    try {
        const chars = await API.getCharacters();
        characterList = chars;
        const container = document.getElementById('char-buttons');
        if (!container) return;
        container.innerHTML = '';
        chars.forEach(c => {
            const btn = document.createElement('button');
            btn.id = 'btn-' + c.id;
            btn.className = 'char-btn';
            if (c.id === currentChar) btn.classList.add('active');
            btn.textContent = c.name;
            btn.onclick = () => switchChar(c.id);
            container.appendChild(btn);
        });
    } catch(e) {
        console.error('加载角色列表失败:', e);
    }
}// ============ 背景切换 ============
        function cycleBackground() {
            bgIndex = (bgIndex + 1) % backgrounds.length;
            document.getElementById('bg-layer').style.backgroundImage = `url('${backgrounds[bgIndex]}')`;
        }

        // ============ 情绪曲线 ============
        const emotionHistory = [];
        const MAX_POINTS = 50;
        function addEmotionPoint(emotion, trust) {
            emotionHistory.push({time: Date.now(), emotion: emotion, trust: trust});
            if (emotionHistory.length > MAX_POINTS) emotionHistory.shift();
            drawCurve();
        }
        function drawCurve() {
            const canvas = document.getElementById('emotion-curve');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = '#2d333b';
            ctx.lineWidth = 0.5;
            for (let i=0; i<=4; i++) {
                const y = (height/4)*i;
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
            }
            if (emotionHistory.length < 2) return;
            const stepX = width / (MAX_POINTS - 1);
            ctx.beginPath();
            ctx.strokeStyle = '#58a6ff';
            ctx.lineWidth = 2;
            emotionHistory.forEach((point, idx) => {
                const x = width - (emotionHistory.length - 1 - idx) * stepX;
                const y = height - ((point.emotion - 0) / 100) * height;
                if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
            const hasTrust = emotionHistory.some(p => p.trust !== undefined && p.trust !== null);
            if (hasTrust) {
                ctx.beginPath();
                ctx.strokeStyle = '#3fb950';
                ctx.lineWidth = 1.5;
                emotionHistory.forEach((point, idx) => {
                    if (point.trust === undefined || point.trust === null) return;
                    const x = width - (emotionHistory.length - 1 - idx) * stepX;
                    const y = height - ((point.trust - 0) / 100) * height;
                    if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();
            }
        }

        // ============ 状态轮询 ============
        const EMOTION_MAP = [
            { min:0, max:20, emoji:'😞', label:'低落' },
            { min:21, max:40, emoji:'😐', label:'平静' },
            { min:41, max:60, emoji:'🙂', label:'稍好' },
            { min:61, max:80, emoji:'😊', label:'不错' },
            { min:81, max:100, emoji:'😄', label:'高涨' },
        ];
        function getEmotion(v) {
            for (const r of EMOTION_MAP) if (v>=r.min && v<=r.max) return r;
            return EMOTION_MAP[1];
        }

        let trustValue = null;
        async function fetchState() {
            try {
                const res = await fetch('/api/state');
                const state = await res.json();
                latestState = state;
                document.getElementById('emotion-value').textContent = state.emotion?.toFixed(0) || '--';
                const emo = getEmotion(state.emotion || 50);
                document.getElementById('lxf-emotion').textContent = emo.emoji + ' ' + emo.label;
                document.getElementById('body-value').textContent = state.body || '--';
                document.getElementById('mind-value').textContent = state.mind || '--';
                document.getElementById('relation-value').textContent = state.relationship || '--';
                if (state.world) {
                    document.getElementById('weather-value').textContent = state.world.weather || '--';
                    document.getElementById('time-value').textContent = state.world.time_of_day || '--';
                    document.getElementById('day-value').textContent = state.world.day ? '第'+state.world.day+'天' : '--';
                    const timeOfDay = state.world.time_of_day;
                    if (timeOfDay === '清晨' || timeOfDay === '上午') {
                        document.getElementById('bg-layer').style.backgroundImage = "url('/assets/backgrounds/verdant-dawnsong.webp')";
                    } else if (timeOfDay === '中午' || timeOfDay === '下午') {
                        document.getElementById('bg-layer').style.backgroundImage = "url('/assets/backgrounds/crystal-swan.webp')";
                    } else if (timeOfDay === '傍晚') {
                        document.getElementById('bg-layer').style.backgroundImage = "url('/assets/backgrounds/rose-vow.webp')";
                    } else if (timeOfDay === '夜晚') {
                        document.getElementById('bg-layer').style.backgroundImage = "url('/assets/backgrounds/crimson-nocturne.webp')";
                    } else {
                        document.getElementById('bg-layer').style.backgroundImage = "url('/assets/backgrounds/snow-palace.webp')";
                    }
                    const roomEl = document.getElementById('room-activity');
                    if (roomEl && state.dorm_activities) {
                        const acts = Object.entries(state.dorm_activities).slice(0, 3).map(([name, act]) => `${name}${act}`).join('；');
                        roomEl.textContent = '室友们：' + (acts || '没有动静');
                    }
                }
                if (state.wang_claim) {
                    trustValue = state.wang_trust;
                } else if (state.relationship) {
                    const match = state.relationship.match(/信任(\d+)/);
                    trustValue = match ? parseInt(match[1]) : null;
                }
                addEmotionPoint(state.emotion || 50, trustValue);

                if (state.last_milestone && state.last_milestone !== window.lastShownMilestone) {
                    window.lastShownMilestone = state.last_milestone;
                    showMilestoneToast(state.last_milestone);
                }

                // 立绘表情
                const lxfSprite = document.getElementById('sprite-lengxufan').querySelector('img');
                if (lxfSprite) {
                    const emotion = state.emotion || 50;
                    if (emotion < 20) lxfSprite.src = '/assets/characters/E.png';
                    else if (emotion < 40) lxfSprite.src = '/assets/characters/D.png';
                    else if (emotion < 60) lxfSprite.src = '/assets/characters/A.png';
                    else if (emotion < 80) lxfSprite.src = '/assets/characters/B.png';
                    else lxfSprite.src = '/assets/characters/C.png';
                }
            } catch(e) {}
        }

        function openProfileModal() {
            if (!currentUser) {
                alert('请先登录或游客进入');
                openLoginModal();
                return;
            }
            document.getElementById('profile-modal').classList.add('active');
            loadProfile();
        }
        function closeProfileModal() {
            document.getElementById('profile-modal').classList.remove('active');
        }
        async function loadProfile() {
            const infoEl = document.getElementById('profile-info');
            const listEl = document.getElementById('memory-list');
            infoEl.textContent = '用户名：' + currentUser.username + ' | 角色：' + (currentUser.role === 'developer' ? '开发者' : '用户');
            listEl.innerHTML = '<div style="color:#8b949e;">加载中...</div>';
            try {
                const conversations = await apiFetch('/api/conversations');
                if (!conversations || conversations.length === 0) {
                    listEl.innerHTML = '<div style="color:#8b949e;">还没有对话记录。</div>';
                    return;
                }
                // 只显示最近30条
                const recent = conversations.slice(-30).reverse();
                listEl.innerHTML = '';
                recent.forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'memory-item';
                    const who = c.role === 'user' ? '你' : (c.role === 'lxf' ? '冷旭帆' : c.role);
                    const timeStr = c.created_at ? new Date(c.created_at).toLocaleString('zh-CN', {hour12:false}) : '';
                    const content = c.content || '';
                    const preview = content.length > 50 ? content.substring(0,50) + '...' : content;
                    div.innerHTML = '<span class="who">[' + who + ']</span> ' + preview + '<span class="time">' + timeStr + '</span>';
                    listEl.appendChild(div);
                });
            } catch(e) {
                listEl.innerHTML = '<div style="color:#8b949e;">加载失败：' + e.message + '</div>';
            }
        }

        function openProfileModal() {
            if (!currentUser) {
                alert('请先登录或游客进入');
                openLoginModal();
                return;
            }
            document.getElementById('profile-modal').classList.add('active');
            loadProfile();
        }
        function closeProfileModal() {
            document.getElementById('profile-modal').classList.remove('active');
        }
        async function loadProfile() {
            const infoEl = document.getElementById('profile-info');
            const listEl = document.getElementById('memory-list');
            infoEl.textContent = '用户名：' + currentUser.username + ' | 角色：' + (currentUser.role === 'developer' ? '开发者' : '用户');
            listEl.innerHTML = '<div style="color:#8b949e;">加载中...</div>';
            try {
                const conversations = await apiFetch('/api/conversations');
                if (!conversations || conversations.length === 0) {
                    listEl.innerHTML = '<div style="color:#8b949e;">还没有对话记录。</div>';
                    return;
                }
                const recent = conversations.slice(-30).reverse();
                listEl.innerHTML = '';
                recent.forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'memory-item';
                    const who = c.role === 'user' ? '你' : (c.role === 'lxf' ? '冷旭帆' : c.role);
                    const timeStr = c.created_at ? new Date(c.created_at).toLocaleString('zh-CN', {hour12:false}) : '';
                    const content = c.content || '';
                    const preview = content.length > 50 ? content.substring(0,50) + '...' : content;
                    div.innerHTML = '<span class="who">[' + who + ']</span> ' + preview + '<span class="time">' + timeStr + '</span>';
                    listEl.appendChild(div);
                });
            } catch(e) {
                listEl.innerHTML = '<div style="color:#8b949e;">加载失败：' + e.message + '</div>';
            }
        }

        function showMilestoneToast(text) {
            const toast = document.createElement('div');
            toast.className = 'milestone-toast';
            toast.textContent = '✨ ' + text;
            document.body.appendChild(toast);
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
        }

        function openDevPanel() {
            if (!currentUser || currentUser.role !== 'developer') return;
            document.getElementById('dev-modal').classList.add('active');
            updateDevPanel();
        }
        function closeDevPanel() {
            document.getElementById('dev-modal').classList.remove('active');
        }
        function updateDevPanel() {
            if (!latestState) return;
            document.getElementById('dev-emotion').textContent = latestState.emotion?.toFixed(1) + ' (' + (latestState.emotion_label || '') + ')';
            document.getElementById('dev-body').textContent = latestState.body || '--';
            document.getElementById('dev-mind').textContent = latestState.mind || '--';
            document.getElementById('dev-relation').textContent = latestState.relationship || '--';
            if (latestState.wang_claim) {
                document.getElementById('dev-wang').textContent = '信任:' + latestState.wang_trust + ' | 证据:' + (latestState.verified_evidence?.join(', ') || '无');
            } else {
                document.getElementById('dev-wang').textContent = '未触发';
            }
            document.getElementById('dev-thought').textContent = latestState.last_thought || '--';
            document.getElementById('dev-events').textContent = latestState.recent_events?.join(' | ') || '--';
            if (latestState.dorm_activities) {
                const acts = Object.entries(latestState.dorm_activities).slice(0, 5).map(([n,a]) => n+a).join('；');
                document.getElementById('dev-dorm').textContent = acts || '--';
            } else {
                document.getElementById('dev-dorm').textContent = '--';
            }
            document.getElementById('dev-milestone').textContent = latestState.last_milestone || '--';
        }

        fetchState();
        setInterval(fetchState, 2000);
        setInterval(() => { if (document.getElementById('dev-modal')?.classList.contains('active')) updateDevPanel(); }, 2000);

        // 开场动画
        setTimeout(() => {
            const overlay = document.getElementById('intro-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
                setTimeout(() => { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 1500);
            }
        }, 2800);

loadCharacters();
