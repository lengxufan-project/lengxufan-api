/* ============================================================
 * demo-mode.js · 「世界入口的预告片」演示模式控制脚本
 * ============================================================
 * 六幕时间线（总长 90s，循环播放）：
 *   幕一  0-10s  开场：发光球脉动 ·「世界入口」逐字显现 · 粒子汇聚
 *   幕二 10-25s  场景引入：307室 · 室友活动 · 状态栏跳动
 *   幕三 25-45s  对话展示：3 条预设消息 → /api/chat · 打字机 · 心理独白
 *   幕四 45-60s  角色切换：冷旭帆 → 黄景云 → 叶清辞 · 档案卡悬停
 *   幕五 60-75s  功能展示：情绪曲线 · 温度计 · 仪表盘 · 事件日志
 *   幕六 75-90s  收束：元素淡出 · 发光球飞向右下角 · 进入世界按钮
 *
 * 交互：点击 / 空格 = 暂停·继续；Esc = 退出；移动端双击退出
 * API：/api/state、/api/chat、/api/characters（不可用时使用预设数据）
 * ============================================================ */

(function () {
    'use strict';

    // ============ DOM ============
    const $ = (id) => document.getElementById(id);
    const el = {
        container:    $('demoContainer'),
        intro:        $('demoIntro'),
        introTitle:   $('demoIntroTitle'),
        introSub:     $('demoIntroSub'),
        particles:    $('demoParticles'),
        orbWrap:      $('demoOrbWrap'),
        scenePanel:   $('demoScenePanel'),
        sceneRoom:    $('demoSceneRoom'),
        sceneMeta:    $('demoSceneMeta'),
        acts:         $('demoActs'),
        status:       $('demoStatus'),
        statusChar:   $('statusCharacter'),
        statusEmo:    $('statusEmotion'),
        statusEmoBar: $('statusEmotionBar'),
        statusBody:   $('statusBody'),
        statusRel:    $('statusRelation'),
        chat:         $('demoChat'),
        chatMsgs:     $('demoChatMessages'),
        cardsPanel:   $('demoCardsPanel'),
        cards:        $('demoCards'),
        featPanel:    $('demoFeaturesPanel'),
        chartLine:    $('demoChartLine'),
        thermoFill:   $('demoThermoFill'),
        thermoVal:    $('demoThermoVal'),
        gaugeArc:     $('demoGaugeArc'),
        gaugeVal:     $('demoGaugeVal'),
        events:       $('demoEvents'),
        finale:       $('demoFinale'),
        enter:        $('demoEnter'),
        replaySec:    $('demoReplaySec'),
        skip:         $('demoSkip'),
        hint:         $('demoHint'),
        progressFill: $('demoProgressFill'),
        progressText: $('demoProgressText'),
    };

    // ============ 时间线常量（秒） ============
    const STAGE_STARTS = [0, 10, 25, 45, 60, 75];
    const TOTAL_S = 90;
    const TOTAL_MS = TOTAL_S * 1000;
    const GAUGE_CIRC = 314.16; // r=50 的周长

    // ============ 预设数据（API 不可用时的兜底） ============
    const PRESET = {
        world: { day: 1, time_of_day: '深夜', weather: '小雨' },
        emotion: 46,
        body: '左肩隐隐发酸，眼皮有些沉',
        relation: '初步的信任正在生长',
        activities: [
            ['向云舟', '蹲在地上修一盏台灯，镊子尖正对着一颗松动的螺丝'],
            ['黄景云', '趴在床上打电话，用粤语说了一句什么'],
            ['叶清辞', '坐在书桌前发呆，手表摘下来放在桌面上，秒针一下一下地走'],
            ['陆华望', '坐在窗台上，一条腿屈着，另一条腿垂下来'],
            ['冉昭然', '坐在他旁边，手里拿着一张对折了三次的纸条'],
        ],
        chat: [
            {
                user: '冷旭帆，最近压力好大，我总觉得自己什么都做不好。',
                reply: '……先别急着否定自己。压力大的时候，先做三次深呼吸——你不需要一下子解决所有问题，只需要陪自己度过这一分钟。你今天能开口，已经很勇敢了。',
                mono: '她又把「什么都做不好」挂在嘴边了。左肩有点酸……这次，先别让她一个人扛。',
            },
            {
                user: '有没有什么办法，能让我冷静下来？',
                reply: '把注意力放到脚底，感受它撑住你的重量。吸气四秒，屏息两秒，呼气六秒——重复三次。世界不会立刻安静，但你会。',
                mono: '她愿意开口求助，已经是信任了。别浪费这一句。',
            },
            {
                user: '谢谢你，感觉确实好多了。',
                reply: '不用谢。记住，「好多了」本身就是一次小小的胜利——下次再遇到这样的夜晚，你会知道自己走得过去。',
                mono: '那句「谢谢」落进来的时候，心里有点烫。原来陪伴是有形状的。',
            },
        ],
        events: [
            ['第 1 天', '向云舟修好了那盏台灯，灯光落在每个人脸上'],
            ['第 1 天', '黄景云挂了电话，把省下的半块蛋糕分给了全屋'],
            ['第 2 天', '叶清辞把手表重新戴上，说「时间该走了」'],
        ],
    };

    const CHARACTERS = {
        lengxufan:    { name: '冷旭帆', tag: 'LENG',  title: '机械系 · 沉默的观察者', desc: '左肩有旧伤，习惯把话咽回去。凌晨的天台，是他唯一敢喘气的地方。' },
        huangjingyun: { name: '黄景云', tag: 'HUANG', title: '金融系 · 温柔的倾听者', desc: '粤语很轻，永远先递出一杯热水。他的台灯，总是最后一盏熄灭。' },
        yeqingci:     { name: '叶清辞', tag: 'YE',    title: '文学系 · 清醒的旁观者', desc: '手表的秒针声比心跳清楚。她记得每个人说过的每句反话。' },
    };

    // ============ 全局状态 ============
    const S = {
        runId: 0,        // 每次 run 递增，用于中止旧时间线
        paused: false,
        running: false,
        progressMs: 0,   // 进度条时间轴（暂停时冻结）
        emotion: 0,
        finaleRunning: false,
    };

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
    const now = () => performance.now();

    // ============ 可暂停延时器 ============
    // 暂停：冻结所有未完成的 setTimeout；恢复：以剩余时间重新启动
    const activeDelays = new Set();

    function delay(ms) {
        return new Promise((resolve) => {
            let remaining = Math.max(0, ms);
            let timer = null;
            let startedAt = 0;
            const entry = {
                onPause() {
                    if (timer !== null) {
                        clearTimeout(timer);
                        timer = null;
                        remaining -= now() - startedAt;
                        if (remaining < 0) remaining = 0;
                    }
                },
                onResume() { arm(); },
                cancel() { cleanup(); resolve(); },
            };
            function arm() {
                startedAt = now();
                if (remaining <= 0) { finish(); return; }
                timer = setTimeout(finish, remaining);
            }
            function finish() {
                timer = null;
                cleanup();
                resolve();
            }
            function cleanup() {
                if (timer !== null) { clearTimeout(timer); timer = null; }
                activeDelays.delete(entry);
            }
            activeDelays.add(entry);
            if (!S.paused) arm();
        });
    }

    function cancelAllDelays() {
        Array.from(activeDelays).forEach((e) => e.cancel());
    }

    function setPaused(p) {
        if (S.paused === p) return;
        S.paused = p;
        if (p) {
            activeDelays.forEach((e) => e.onPause && e.onPause());
        } else {
            Array.from(activeDelays).forEach((e) => e.onResume && e.onResume());
        }
    }

    function togglePause() { setPaused(!S.paused); }

    /** 中止检查：runId 不匹配说明本轮已被跳过/重置 */
    function check(rid) {
        if (rid !== S.runId) throw 'aborted';
    }

    // ============ 进度条（rAF 驱动，暂停时冻结） ============
    function renderProgress() {
        const pct = clamp(S.progressMs / TOTAL_MS * 100, 0, 100);
        el.progressFill.style.width = pct + '%';
        el.progressText.textContent = Math.round(pct) + '%';
    }

    let lastFrame = 0;
    function frame(t) {
        const dt = lastFrame ? t - lastFrame : 0;
        lastFrame = t;
        if (!S.paused && S.running) {
            S.progressMs = Math.min(S.progressMs + dt, TOTAL_MS);
            renderProgress();
        }
        requestAnimationFrame(frame);
    }

    // ============ API（超时 + 失败兜底） ============
    async function fetchJSON(url, opts = {}, timeout = 8000) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeout);
        try {
            const res = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (err) {
            console.warn('[demo] API 请求失败，使用预设数据：', url, err);
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    const fetchState = () => fetchJSON('/api/state');
    const fetchCharacters = () => fetchJSON('/api/characters');

    const sendChat = (message, charId) =>
        fetchJSON('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, char_id: charId }),
        }, 10000);

    // ============ UI：面板显隐 / 转场 ============
    function showPanel(node, visible) {
        node.classList.toggle('is-visible', !!visible);
        node.classList.toggle('is-gone', !visible);
    }

    /** 全屏模糊脉冲（阶段切换转场） */
    function flashTransition() {
        el.container.classList.remove('demo-flash');
        void el.container.offsetWidth;
        el.container.classList.add('demo-flash');
        setTimeout(() => el.container.classList.remove('demo-flash'), 700);
    }

    // ============ UI：开场标题打字机 ============
    async function typeTitle(rid, text, gapMs) {
        el.introTitle.innerHTML = '';
        const cursor = document.createElement('span');
        cursor.className = 'demo-cursor';
        el.introTitle.appendChild(cursor);
        for (const ch of text) {
            check(rid);
            const s = document.createElement('span');
            s.className = 'demo-char';
            s.textContent = ch;
            el.introTitle.insertBefore(s, cursor);
            await delay(gapMs);
        }
    }

    // ============ UI：汇聚粒子 ============
    function spawnConvergeParticles(count) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'demo-particle';
            // 从屏幕四边随机出发，向中心汇聚
            const edge = Math.floor(Math.random() * 4);
            let x, y;
            if (edge === 0) { x = Math.random() * w; y = -10; }
            else if (edge === 1) { x = w + 10; y = Math.random() * h; }
            else if (edge === 2) { x = Math.random() * w; y = h + 10; }
            else { x = -10; y = Math.random() * h; }
            const dx = w / 2 - x;
            const dy = h / 2 - y;
            const size = 2 + Math.random() * 3;
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.setProperty('--dx', dx + 'px');
            p.style.setProperty('--dy', dy + 'px');
            p.style.animationDelay = (Math.random() * 800) + 'ms';
            p.style.animationDuration = (2200 + Math.random() * 1200) + 'ms';
            frag.appendChild(p);
        }
        el.particles.appendChild(frag);
        setTimeout(() => { el.particles.innerHTML = ''; }, 5200);
    }

    // ============ UI：状态栏 ============
    function tickValue(node) {
        node.classList.remove('tick');
        void node.offsetWidth;
        node.classList.add('tick');
        setTimeout(() => node.classList.remove('tick'), 500);
    }

    function setEmotion(v, withTick) {
        if (typeof v !== 'number' || isNaN(v)) return;
        S.emotion = clamp(Math.round(v), 0, 100);
        el.statusEmo.textContent = S.emotion;
        el.statusEmoBar.style.width = S.emotion + '%';
        if (withTick) tickValue(el.statusEmo);
    }

    function setCharacter(name) {
        if (el.statusChar.textContent !== name) {
            el.statusChar.textContent = name;
            tickValue(el.statusChar);
        }
    }

    function applyWorldState(st) {
        const world = (st && st.world) || PRESET.world;
        el.sceneRoom.textContent = '307室 · ' + (world.time_of_day || PRESET.world.time_of_day);
        el.sceneMeta.textContent = '第' + (world.day || PRESET.world.day) + '天 · ' + (world.weather || PRESET.world.weather);
        setCharacter(CHARACTERS.lengxufan.name);
        setEmotion(st && typeof st.emotion === 'number' ? st.emotion : PRESET.emotion, true);
        el.statusBody.textContent = (st && st.body) || PRESET.body;
        el.statusRel.textContent = (st && st.relationship) || PRESET.relation;
    }

    /** 状态栏跳动（API 在线拉真实值，离线微幅波动） */
    async function jitterStatus() {
        const st = await fetchState();
        if (st && typeof st.emotion === 'number') {
            setEmotion(st.emotion, true);
            el.statusBody.textContent = st.body || PRESET.body;
            el.statusRel.textContent = st.relationship || PRESET.relation;
        } else {
            setEmotion(S.emotion + rnd(-3, 3), true);
        }
    }

    // ============ UI：室友活动 ============
    function extractActivities(st) {
        const acts = st && st.dorm_activities && typeof st.dorm_activities === 'object'
            ? Object.entries(st.dorm_activities).slice(0, 5)
            : null;
        return acts && acts.length ? acts : PRESET.activities;
    }

    function addAct(name, desc) {
        const li = document.createElement('li');
        li.className = 'demo-act';
        const n = document.createElement('span');
        n.className = 'demo-act-name';
        n.textContent = name;
        const d = document.createElement('span');
        d.className = 'demo-act-desc';
        d.textContent = desc;
        li.appendChild(n);
        li.appendChild(d);
        el.acts.appendChild(li);
    }

    // ============ UI：聊天气泡 / 打字机 / 独白 ============
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function addBubble(role, text, tagName) {
        const bubble = document.createElement('div');
        bubble.className = 'demo-bubble ' + (role === 'user' ? 'user' : 'assistant');
        const tag = document.createElement('span');
        tag.className = 'demo-bubble-tag';
        tag.textContent = tagName || (role === 'user' ? 'YOU' : 'AI');
        const content = document.createElement('span');
        content.innerHTML = escapeHtml(text);
        bubble.appendChild(tag);
        bubble.appendChild(content);
        el.chatMsgs.appendChild(bubble);
        scrollChat();
        return bubble;
    }

    /** AI 回复逐字打字机 */
    async function typeBubble(rid, text, tagName) {
        const bubble = document.createElement('div');
        bubble.className = 'demo-bubble assistant';
        const tag = document.createElement('span');
        tag.className = 'demo-bubble-tag';
        tag.textContent = tagName || 'AI';
        const content = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 'demo-type-cursor';
        bubble.appendChild(tag);
        bubble.appendChild(content);
        bubble.appendChild(cursor);
        el.chatMsgs.appendChild(bubble);
        scrollChat();

        for (const ch of String(text)) {
            check(rid);
            content.innerHTML += escapeHtml(ch);
            if (Math.random() < 0.12) scrollChat();
            await delay(38);
        }
        cursor.remove();
        scrollChat();
    }

    function addTyping() {
        const t = document.createElement('div');
        t.className = 'demo-typing';
        t.innerHTML = '<i></i><i></i><i></i>';
        el.chatMsgs.appendChild(t);
        scrollChat();
        return t;
    }

    function addMonologue(text) {
        const m = document.createElement('div');
        m.className = 'demo-monologue';
        m.textContent = text;
        el.chatMsgs.appendChild(m);
        scrollChat();
    }

    function scrollChat() {
        requestAnimationFrame(() => {
            el.chat.scrollTop = el.chat.scrollHeight;
        });
    }

    // ============ UI：角色档案卡 ============
    function buildCards() {
        el.cards.innerHTML = '';
        Object.values(CHARACTERS).forEach((c, i) => {
            const card = document.createElement('div');
            card.className = 'demo-card';
            card.style.animationDelay = (i * 380) + 'ms';
            card.innerHTML =
                '<div class="demo-card-tag">' + c.tag + '</div>' +
                '<div class="demo-card-name">' + escapeHtml(c.name) + '</div>' +
                '<div class="demo-card-title">' + escapeHtml(c.title) + '</div>' +
                '<div class="demo-card-desc">' + escapeHtml(c.desc) + '</div>';
            el.cards.appendChild(card);
        });
    }

    function focusCard(index) {
        const cards = el.cards.children;
        Array.from(cards).forEach((c, i) => c.classList.toggle('is-focus', i === index));
        const ids = Object.keys(CHARACTERS);
        setCharacter(CHARACTERS[ids[index]].name);
        flashTransition();
    }

    // ============ UI：功能展示部件 ============
    function drawChart() {
        const line = el.chartLine;
        const len = line.getTotalLength();
        line.style.transition = 'none';
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        void line.getBoundingClientRect();
        line.style.transition = 'stroke-dashoffset 2800ms ease-in-out';
        line.style.strokeDashoffset = '0';
    }

    async function fillThermo(rid, target) {
        el.thermoFill.style.height = target + '%';
        for (let v = 0; v <= target; v += 2) {
            el.thermoVal.textContent = Math.min(v, target) + '%';
            await delay(56);
        }
        el.thermoVal.textContent = target + '%';
    }

    async function spinGauge(rid, target) {
        el.gaugeArc.style.strokeDashoffset = GAUGE_CIRC * (1 - target / 100);
        for (let v = 0; v <= target; v += 2) {
            el.gaugeVal.textContent = Math.min(v, target);
            await delay(60);
        }
        el.gaugeVal.textContent = target;
    }

    function addEvent(day, text) {
        const ev = document.createElement('div');
        ev.className = 'demo-event';
        ev.innerHTML =
            '<div class="demo-event-day">' + escapeHtml(day) + '</div>' +
            '<div class="demo-event-text">' + escapeHtml(text) + '</div>';
        el.events.appendChild(ev);
    }

    // ============ 提示条 ============
    let hintTimer = null;
    function showHint() {
        el.hint.classList.add('is-visible');
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => el.hint.classList.remove('is-visible'), 9000);
    }
    function hideHint() {
        clearTimeout(hintTimer);
        el.hint.classList.remove('is-visible');
    }

    // ============ 幕一 · 开场（0-10s） ============
    async function stage1Intro(rid) {
        S.progressMs = 0;
        // 发光球中心出现并脉动（重启动画）
        el.orbWrap.classList.remove('is-hidden');
        el.orbWrap.classList.remove('is-finale');
        el.orbWrap.classList.remove('is-visible');
        void el.orbWrap.offsetWidth;
        el.orbWrap.classList.add('is-visible');
        showPanel(el.intro, true);

        spawnConvergeParticles(46);
        showHint();
        await delay(1800); check(rid);

        // 「世界入口」逐字显现（每字 0.5s）
        await typeTitle(rid, '世界入口', 500); check(rid);
        el.introSub.classList.add('is-visible');

        await delay(900); check(rid);
        spawnConvergeParticles(30);
        await delay(4300); check(rid); // 至 ~10s
    }

    // ============ 幕二 · 场景引入（10-25s） ============
    async function stage2Scene(rid) {
        S.progressMs = STAGE_STARTS[1] * 1000;
        // 开场层模糊淡出，场景与状态栏淡入
        showPanel(el.intro, false);
        el.orbWrap.classList.add('is-hidden');
        el.introSub.classList.remove('is-visible');
        flashTransition();
        showPanel(el.scenePanel, true);
        showPanel(el.status, true);
        await delay(850); check(rid);

        // 拉取世界状态（失败用预设）
        const st = await fetchState(); check(rid);
        applyWorldState(st);

        // 室友活动逐条出现
        const acts = extractActivities(st);
        for (const [name, desc] of acts) {
            addAct(name, desc);
            await delay(1650); check(rid);
        }

        // 状态栏数据跳动更新
        for (let i = 0; i < 3; i++) {
            await delay(1100); check(rid);
            await jitterStatus(); check(rid);
        }

        showPanel(el.scenePanel, false);
        await delay(750); check(rid);
    }

    // ============ 幕三 · 对话展示（25-45s） ============
    async function stage3Chat(rid) {
        S.progressMs = STAGE_STARTS[2] * 1000;
        flashTransition();
        showPanel(el.chat, true);
        await delay(700); check(rid);

        const leng = CHARACTERS.lengxufan;
        for (let i = 0; i < PRESET.chat.length; i++) {
            const m = PRESET.chat[i];

            // 1. 用户消息
            addBubble('user', m.user, 'YOU');
            await delay(900); check(rid);

            // 2. 「正在输入」+ 请求 /api/chat
            const typing = addTyping();
            const res = await sendChat(m.user, 'lengxufan'); check(rid);
            typing.remove();

            let reply = m.reply;
            let mono = m.mono;
            let emotion = null;
            if (res && res.reply) {
                reply = res.reply;
                if (res.state) {
                    if (typeof res.state.emotion === 'number') emotion = res.state.emotion;
                    if (res.state.last_thought) mono = res.state.last_thought;
                }
            }

            // 3. AI 回复打字机
            await typeBubble(rid, reply, leng.name); check(rid);

            // 4. 状态同步（情绪波动）+ 心理独白
            setEmotion(emotion != null ? emotion : S.emotion + rnd(-5, 10), true);
            addMonologue(mono);

            // 5. 每条间隔 4 秒
            if (i < PRESET.chat.length - 1) {
                await delay(4000); check(rid);
            }
        }

        await delay(900); check(rid);
        showPanel(el.chat, false);
        await delay(750); check(rid);
    }

    // ============ 幕四 · 角色切换（45-60s） ============
    async function stage4Cards(rid) {
        S.progressMs = STAGE_STARTS[3] * 1000;
        // 尝试用 API 数据修正角色名
        const chars = await fetchCharacters(); check(rid);
        if (Array.isArray(chars)) {
            chars.forEach((c) => {
                if (c && c.id && CHARACTERS[c.id] && c.name) CHARACTERS[c.id].name = c.name;
            });
        }

        buildCards();
        flashTransition();
        showPanel(el.cardsPanel, true);
        await delay(1400); check(rid);

        // 依次聚焦（含场景过渡 + 档案卡悬停效果）
        const ids = Object.keys(CHARACTERS);
        for (let i = 0; i < ids.length; i++) {
            focusCard(i); check(rid);
            await delay(i < ids.length - 1 ? 4200 : 2200); check(rid);
        }

        showPanel(el.cardsPanel, false);
        await delay(750); check(rid);
    }

    // ============ 幕五 · 功能展示（60-75s） ============
    async function stage5Features(rid) {
        S.progressMs = STAGE_STARTS[4] * 1000;
        flashTransition();
        showPanel(el.featPanel, true);
        await delay(850); check(rid);

        // 情绪曲线动态描画
        drawChart();
        await delay(500); check(rid);

        // 关系温度计填充
        await fillThermo(rid, 68); check(rid);

        // 状态仪表盘转动
        await spinGauge(rid, S.emotion || 62); check(rid);

        // 事件日志依次弹出
        for (const [day, text] of PRESET.events) {
            addEvent(day, text);
            await delay(1250); check(rid);
        }

        await delay(2600); check(rid);
        showPanel(el.featPanel, false);
        showPanel(el.status, false);
        await delay(750); check(rid);
    }

    // ============ 幕六 · 收束（75-90s） ============
    async function stage6Finale(rid) {
        S.progressMs = STAGE_STARTS[5] * 1000;

        // 发光球从中心重现
        el.orbWrap.classList.remove('is-hidden');
        await delay(900); check(rid);

        // 缩小飞向右下角，变为悬浮球
        el.orbWrap.classList.add('is-finale');
        await delay(1400); check(rid);

        // 「进入世界」按钮浮现
        el.finale.classList.add('is-visible');
        S.progressMs = TOTAL_MS;
        renderProgress();

        // 倒计时后循环重播
        for (let s = 6; s >= 1; s--) {
            el.replaySec.textContent = s;
            await delay(1000); check(rid);
        }
        el.finale.classList.remove('is-visible');
        el.orbWrap.classList.remove('is-finale');
    }

    // ============ 循环重置 ============
    function resetAll() {
        el.chatMsgs.innerHTML = '';
        el.acts.innerHTML = '';
        el.events.innerHTML = '';
        el.cards.innerHTML = '';
        el.introTitle.innerHTML = '';
        el.introSub.classList.remove('is-visible');
        el.particles.innerHTML = '';
        el.finale.classList.remove('is-visible');

        [el.intro, el.scenePanel, el.cardsPanel, el.featPanel, el.chat, el.status]
            .forEach((p) => showPanel(p, false));

        // 发光球复位：隐藏 + 移除飞行姿态
        el.orbWrap.classList.remove('is-finale');
        el.orbWrap.classList.add('is-hidden');

        // 曲线 / 温度计 / 仪表盘复位
        el.chartLine.style.transition = 'none';
        el.chartLine.style.strokeDashoffset = el.chartLine.getTotalLength();
        el.thermoFill.style.height = '0%';
        el.thermoVal.textContent = '0%';
        el.gaugeArc.style.strokeDashoffset = GAUGE_CIRC;
        el.gaugeVal.textContent = '0';

        // 状态栏复位
        el.statusChar.textContent = '—';
        el.statusEmo.textContent = '0';
        el.statusEmoBar.style.width = '0%';
        el.statusBody.textContent = '—';
        el.statusRel.textContent = '—';
        S.emotion = 0;

        // 跳过按钮恢复
        el.skip.classList.remove('is-hidden');
        el.replaySec.textContent = '6';

        S.progressMs = 0;
        renderProgress();
    }

    // ============ 主流程 ============
    async function runDemo() {
        const rid = ++S.runId;
        S.running = true;
        resetAll();

        try {
            await stage1Intro(rid);
            await stage2Scene(rid);
            await stage3Chat(rid);
            await stage4Cards(rid);
            await stage5Features(rid);
            await stage6Finale(rid);
        } catch (err) {
            if (err !== 'aborted') console.error('[demo] 演示异常：', err);
            return; // 被跳过/退出中断，不再循环
        }

        // 循环播放：重置所有状态后重头开始
        await delay(1200);
        if (rid !== S.runId) return;
        runDemo();
    }

    /** 「跳过」：中止当前时间线，直接进入收束幕 */
    async function goFinale() {
        if (S.finaleRunning) return;
        S.finaleRunning = true;
        S.runId++;              // 使当前 run 的时间线全部失效
        cancelAllDelays();
        hideHint();
        el.skip.classList.add('is-hidden');

        const rid = S.runId;
        [el.intro, el.scenePanel, el.cardsPanel, el.featPanel, el.chat, el.status]
            .forEach((p) => showPanel(p, false));
        await delay(700);

        try {
            await stage6Finale(rid);
        } catch (err) { /* 忽略 */ }

        S.finaleRunning = false;
        if (rid === S.runId) {
            S.running = false;
            runDemo(); // 重开一轮（内部会 resetAll）
        }
    }

    function exitDemo() {
        S.runId++;
        cancelAllDelays();
        window.location.href = 'index.html';
    }

    // ============ 事件绑定 ============
    function bindEvents() {
        // 点击任意位置：暂停 / 继续（按钮除外）
        el.container.addEventListener('click', (e) => {
            if (e.target.closest('button, a')) return;
            togglePause();
        });

        el.skip.addEventListener('click', (e) => {
            e.stopPropagation();
            goFinale();
        });

        el.enter.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = 'index.html';
        });

        // 键盘：空格 = 暂停/继续；Esc = 退出
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                togglePause();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                exitDemo();
            }
        });

        // 移动端：单击暂停（click 已覆盖），双击退出
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            if (e.target.closest('button, a')) return;
            const t = Date.now();
            if (t - lastTouchEnd < 320) {
                e.preventDefault(); // 拦截第二次 click，避免重复触发暂停
                exitDemo();
            }
            lastTouchEnd = t;
        }, { passive: false });

        // 页面切走自动暂停
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !S.paused) setPaused(true);
        });
    }

    // ============ 启动 ============
    function boot() {
        bindEvents();
        renderProgress();
        requestAnimationFrame(frame);
        setTimeout(() => { if (!S.finaleRunning) runDemo(); }, 400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
