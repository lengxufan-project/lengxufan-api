/* ============================================================
 * demo-mode.js · 演示模式控制脚本
 * ============================================================
 * 功能：
 *  1. 开场：发光球放大 + 粒子效果
 *  2. 自动登录游客（/api/auth/guest）
 *  3. 依次发送 7 段预设对话（char_id 依次切换
 *     lengxufan → huangjingyun → yeqingci）
 *  4. 每次回复后同步情绪/身体/关系状态
 *  5. 暂停/继续（按钮 / 空格键）
 *  6. 退出（按钮 / Esc 键）
 *  7. 进度条随演示进程自动推进
 *  8. 演示结束后循环重播
 * ============================================================ */

(function () {
    'use strict';

    // ============ DOM ============
    const $ = (id) => document.getElementById(id);
    const el = {
        container: $('demoContainer'),
        scene: $('demoScene'),
        sceneTitle: $('demoSceneTitle'),
        glowOrb: $('demoGlowOrb'),
        particles: $('demoParticles'),
        chatMessages: $('demoChatMessages'),
        statusCharacter: $('statusCharacter'),
        statusEmotion: $('statusEmotion'),
        statusEmotionBar: $('statusEmotionBar'),
        statusBody: $('statusBody'),
        statusBodyBar: $('statusBodyBar'),
        statusRelation: $('statusRelation'),
        statusRelationBar: $('statusRelationBar'),
        exit: $('demoExit'),
        pause: $('demoPause'),
        progress: $('demoProgress'),
        progressFill: $('demoProgressFill'),
        progressText: $('demoProgressText'),
    };

    const pauseLabel = el.pause.querySelector('.demo-pause-label');
    const iconPause  = el.pause.querySelector('.icon-pause');
    const iconPlay   = el.pause.querySelector('.icon-play');

    // ============ 角色配置 ============
    const CHARACTERS = {
        lengxufan:   { name: '冷旭凡', tag: 'LENG'   },
        huangjingyun:{ name: '黄靖云', tag: 'HUANG'  },
        yeqingci:    { name: '叶青辞', tag: 'YE'     },
    };

    // ============ 演示脚本（7 段对话） ============
    // 每段间隔 delay_ms，char_id 依次切换
    const DEMO_SCRIPT = [
        {
            char_id: 'lengxufan',
            scene_title: '第一幕 · 冷旭凡',
            user: '冷旭凡，最近工作压力好大，我总觉得自己什么都做不好。',
            assistant: null,   // 调用 /api/chat 获取
            delay_ms: 2400,
            highlight: ['压力', '做不好'],
        },
        {
            char_id: 'lengxufan',
            scene_title: '第一幕 · 冷旭凡',
            user: '你有没有什么办法能让我冷静下来？',
            assistant: null,
            delay_ms: 2800,
            highlight: ['冷静'],
        },
        {
            char_id: 'lengxufan',
            scene_title: '第一幕 · 冷旭凡',
            user: '谢谢你，感觉确实好多了。',
            assistant: null,
            delay_ms: 2400,
            highlight: ['谢谢', '好多了'],
        },
        {
            char_id: 'huangjingyun',
            scene_title: '第二幕 · 黄靖云',
            user: '靖云，我最近失眠很严重，脑子里的想法停不下来。',
            assistant: null,
            delay_ms: 2600,
            highlight: ['失眠', '想法停不下来'],
        },
        {
            char_id: 'huangjingyun',
            scene_title: '第二幕 · 黄靖云',
            user: '能陪我做一个简短的呼吸练习吗？',
            assistant: null,
            delay_ms: 2600,
            highlight: ['呼吸练习'],
        },
        {
            char_id: 'yeqingci',
            scene_title: '第三幕 · 叶青辞',
            user: '青辞，我和最好的朋友吵架了，不知道该不该先开口道歉。',
            assistant: null,
            delay_ms: 2800,
            highlight: ['吵架', '道歉'],
        },
        {
            char_id: 'yeqingci',
            scene_title: '第三幕 · 叶青辞',
            user: '我明白了，真挚比面子重要。我会主动联系她的。',
            assistant: null,
            delay_ms: 2400,
            highlight: ['真挚', '主动联系'],
        },
    ];

    // ============ 状态 ============
    const state = {
        current: 0,          // 当前步骤索引
        paused: false,
        running: false,
        resumeResolver: null,// 暂停时挂起的 Promise resolver
        stepTimers: [],      // 本步骤内的定时器，用于暂停时清理
        aborted: false,      // 是否被退出中断
    };

    // ============ 工具函数 ============
    const sleep = (ms) => new Promise((resolve) => {
        const t = setTimeout(() => {
            // 暂停时不立即 resolve，等 resume
            if (state.paused) {
                state.resumeResolver = () => resolve();
            } else {
                resolve();
            }
        }, ms);
        state.stepTimers.push({ timer: t, resolve });
    });

    function clearStepTimers() {
        state.stepTimers.forEach(({ timer }) => clearTimeout(timer));
        state.stepTimers = [];
    }

    /** 可被暂停/中断的等待 */
    async function waitWithPause(ms) {
        if (state.aborted) return;
        if (!state.paused) {
            await sleep(ms);
        } else {
            // 暂停状态下，把 resolve 存起来
            await new Promise((resolve) => { state.resumeResolver = resolve; });
            // 恢复后再等待剩余时间（简化处理：等待同样时长）
            if (!state.aborted) await sleep(ms);
        }
    }

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    // ============ UI：进度条 ============
    function updateProgress() {
        const total = DEMO_SCRIPT.length;
        // 每一步占 1/total；当前步骤内部已完成的用小数表示
        const ratio = clamp(state.current / total, 0, 1);
        const pct = Math.round(ratio * 100);
        el.progressFill.style.width = pct + '%';
        el.progressText.textContent = pct + '%';
    }

    // ============ UI：状态 ============
    function setStatus({ emotion, body, relation, character }) {
        if (character != null && CHARACTERS[character]) {
            el.statusCharacter.textContent = CHARACTERS[character].name;
        }
        const setBar = (value, labelEl, barEl) => {
            if (typeof value !== 'number') return;
            const v = clamp(Math.round(value), 0, 100);
            labelEl.textContent = v;
            barEl.style.width = v + '%';
        };
        setBar(emotion,  el.statusEmotion,  el.statusEmotionBar);
        setBar(body,     el.statusBody,     el.statusBodyBar);
        setBar(relation, el.statusRelation, el.statusRelationBar);
    }

    // ============ UI：聊天气泡 ============
    function highlightText(text, words) {
        if (!Array.isArray(words) || words.length === 0) return escapeHtml(text);
        let out = escapeHtml(text);
        words.forEach((w) => {
            if (!w) return;
            const safe = escapeHtml(w);
            out = out.split(safe).join(`<span class="hl">${safe}</span>`);
        });
        return out;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function addBubble(role, text, { character, highlight } = {}) {
        const bubble = document.createElement('div');
        bubble.className = 'demo-bubble ' + (role === 'user' ? 'user' : 'assistant');

        const tagLabel = document.createElement('span');
        tagLabel.className = 'demo-bubble-tag';
        if (role === 'user') {
            tagLabel.textContent = 'YOU';
        } else if (character && CHARACTERS[character]) {
            tagLabel.textContent = CHARACTERS[character].tag;
        } else {
            tagLabel.textContent = 'AI';
        }

        const content = document.createElement('span');
        content.innerHTML = highlightText(text, highlight || []);

        bubble.appendChild(tagLabel);
        bubble.appendChild(content);
        el.chatMessages.appendChild(bubble);

        // 自动滚动到底部
        requestAnimationFrame(() => {
            el.chatMessages.parentElement.scrollTop = el.chatMessages.parentElement.scrollHeight;
        });
        return bubble;
    }

    function clearChat() {
        el.chatMessages.innerHTML = '';
    }

    // ============ UI：场景 & 粒子 ============
    function setSceneTitle(title) {
        if (!title) return;
        el.sceneTitle.style.opacity = '0';
        setTimeout(() => {
            el.sceneTitle.textContent = title;
            el.sceneTitle.style.opacity = '1';
        }, 280);
    }

    function switchScene() {
        // 转场：先模糊淡出
        el.container.classList.remove('demo-fade-in');
        el.container.classList.add('demo-fade-out');
        return new Promise((resolve) => {
            setTimeout(() => {
                el.container.classList.remove('demo-fade-out');
                el.container.classList.add('demo-fade-in');
                clearChat();
                resolve();
            }, 620);
        });
    }

    function spawnParticles(count = 40) {
        const rect = el.scene.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const frag = document.createDocumentFragment();

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'demo-particle';
            const angle = Math.random() * Math.PI * 2;
            const dist  = 80 + Math.random() * 260;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist - 40; // 偏向上
            const size = 2 + Math.random() * 4;
            const delay = Math.random() * 500;
            p.style.left = (cx + (Math.random() - 0.5) * 40) + 'px';
            p.style.top  = (cy + (Math.random() - 0.5) * 40) + 'px';
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.setProperty('--dx', dx + 'px');
            p.style.setProperty('--dy', dy + 'px');
            p.style.animationDelay = delay + 'ms';
            p.style.animationDuration = (2200 + Math.random() * 1400) + 'ms';
            frag.appendChild(p);
        }
        el.particles.appendChild(frag);

        // 动画结束后移除
        setTimeout(() => { el.particles.innerHTML = ''; }, 4500);
    }

    // ============ API：游客登录 ============
    async function guestLogin() {
        try {
            const res = await fetch('/api/auth/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({}),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json().catch(() => ({}));
            // 存入内存，后续请求可能需要
            state.session = data || {};
            return data;
        } catch (err) {
            console.warn('[demo] 游客登录失败，继续（可能为离线演示）：', err);
            state.session = { ok: false, offline: true };
            return null;
        }
    }

    // ============ API：发送聊天消息 ============
    async function sendChat({ char_id, message }) {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ char_id, message }),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            return data;
        } catch (err) {
            console.warn('[demo] 调用 /api/chat 失败，使用本地兜底回复：', err);
            return null;
        }
    }

    // ============ 本地兜底回复（服务不可用时使用） ============
    const FALLBACK_REPLIES = {
        lengxufan: [
            '压力大的时候，先试着做三次深呼吸。你不需要一下子解决所有问题，只需要陪自己度过这一分钟就好。你今天能开口，已经很勇敢了。',
            '我陪你做一个小练习：把注意力放到脚底，感受它支撑你的感觉。再慢慢地吸气四秒，屏息两秒，呼气六秒。重复三次，世界会安静一些。',
            '不用谢。记住：感觉「好多了」本身就是一次小小的胜利。把今天的这一步记在心里，下次遇到同样的时刻，你就知道自己可以走过去。',
        ],
        huangjingyun: [
            '失眠的时候，我们越想「快点睡着」就越清醒。可以试试：不强迫自己睡，只是闭上眼睛，任由想法飘过，像看云一样，不抓住，也不推开。',
            '好，我们一起做三分钟。吸气——感受腹部隆起；屏息——停一下；呼气——让肩膀慢慢下沉。把节奏交给呼吸，剩下的我陪你。',
        ],
        yeqingci: [
            '吵架之后的沉默，其实是两个人都在等台阶。道歉不是认输，是在说「这段关系对我来说比胜负重要」。如果你还珍惜她，先开口并不会吃亏。',
            '这就对了。真心的人不会在意谁先低头，只会在意彼此还在不在。去联系她吧，她大概也等了很久。',
        ],
    };
    let fallbackCursor = { lengxufan: 0, huangjingyun: 0, yeqingci: 0 };
    function getFallbackReply(char_id) {
        const pool = FALLBACK_REPLIES[char_id] || ['嗯，我听到了。'];
        const idx = fallbackCursor[char_id] % pool.length;
        fallbackCursor[char_id] = idx + 1;
        return pool[idx];
    }

    // 兜底状态生成
    function getFallbackStatus(char_id, step) {
        // 随剧情推进，数值逐渐上升
        const base = 38 + step * 8;
        return {
            emotion:  clamp(base + Math.round(Math.random() * 10), 0, 100),
            body:     clamp(base - 4 + Math.round(Math.random() * 10), 0, 100),
            relation: clamp(base + 2 + Math.round(Math.random() * 10), 0, 100),
        };
    }

    // ============ 暂停/继续 ============
    function setPaused(paused) {
        state.paused = paused;
        el.pause.classList.toggle('is-paused', paused);
        pauseLabel.textContent = paused ? '继续' : '暂停';
        if (!paused && state.resumeResolver) {
            const fn = state.resumeResolver;
            state.resumeResolver = null;
            fn();
        }
    }

    function togglePause() {
        setPaused(!state.paused);
    }

    // ============ 退出 ============
    function exitDemo() {
        state.aborted = true;
        state.running = false;
        clearStepTimers();
        if (state.resumeResolver) {
            const fn = state.resumeResolver;
            state.resumeResolver = null;
            fn();
        }
        // 如果链接可用就跳转，否则回到首页
        try {
            window.location.href = 'index.html';
        } catch (_) {
            history.back();
        }
    }

    // ============ 核心：执行单步演示 ============
    async function runStep(step, index) {
        if (state.aborted) return;

        // 切换角色时做转场
        if (index === 0 || DEMO_SCRIPT[index - 1].char_id !== step.char_id) {
            setSceneTitle(step.scene_title);
            // 非第一步做转场
            if (index !== 0) {
                await switchScene();
            }
        }

        // 1. 用户气泡
        addBubble('user', step.user, { highlight: step.highlight });
        updateProgress();
        await waitWithPause(step.delay_ms);
        if (state.aborted) return;

        // 2. 请求 /api/chat
        let reply = null;
        if (!state.session || !state.session.offline) {
            reply = await sendChat({ char_id: step.char_id, message: step.user });
        }

        let assistantText;
        let emotion, body, relation;

        if (reply && (reply.reply || reply.message || reply.text)) {
            assistantText = reply.reply || reply.message || reply.text;
            emotion  = reply.emotion  != null ? reply.emotion  : reply.mood;
            body     = reply.body     != null ? reply.body     : reply.physical;
            relation = reply.relation != null ? reply.relation : reply.relationship;
        } else {
            assistantText = getFallbackReply(step.char_id);
        }
        if (emotion == null || body == null || relation == null) {
            const fb = getFallbackStatus(step.char_id, index);
            if (emotion  == null) emotion  = fb.emotion;
            if (body     == null) body     = fb.body;
            if (relation == null) relation = fb.relation;
        }

        // 3. 助手气泡
        addBubble('assistant', assistantText, { character: step.char_id });

        // 4. 更新状态
        setStatus({ character: step.char_id, emotion, body, relation });

        // 推进进度（用户 + 助手 都显示了）
        state.current = index + 1;
        updateProgress();

        // 稍微停顿再进入下一步
        await waitWithPause(1400);
    }

    // ============ 开场动画 ============
    async function opening() {
        setSceneTitle('演示模式 · 即将开始');
        // 发光球已在 CSS 中动画放大，这里额外触发粒子
        spawnParticles(60);
        await waitWithPause(1000);
    }

    // ============ 主流程 ============
    async function runDemo() {
        if (state.running) return;
        state.running = true;
        state.current = 0;
        updateProgress();

        try {
            // 1. 开场动画（1s）
            await opening();
            if (state.aborted) return;

            // 2. 游客登录
            setSceneTitle('正在建立连接…');
            await guestLogin();
            await waitWithPause(500);
            if (state.aborted) return;

            // 3. 依次发送预设消息
            for (let i = 0; i < DEMO_SCRIPT.length; i++) {
                if (state.aborted) return;
                await runStep(DEMO_SCRIPT[i], i);
            }

            // 4. 完成 100%
            state.current = DEMO_SCRIPT.length;
            updateProgress();
            setSceneTitle('演示完成 · 3 秒后重播');

            // 5. 循环播放
            await waitWithPause(3000);
            if (state.aborted) return;

            // 重置并再次开始
            state.running = false;
            fallbackCursor = { lengxufan: 0, huangjingyun: 0, yeqingci: 0 };
            clearChat();
            setStatus({ emotion: 0, body: 0, relation: 0 });
            runDemo();
        } catch (err) {
            console.error('[demo] 运行出错：', err);
            state.running = false;
            setSceneTitle('演示已中断');
        }
    }

    // ============ 事件绑定 ============
    function bindEvents() {
        // 暂停按钮
        el.pause.addEventListener('click', (e) => {
            e.preventDefault();
            togglePause();
        });

        // 退出按钮
        el.exit.addEventListener('click', (e) => {
            e.preventDefault();
            exitDemo();
        });

        // 键盘：空格 暂停/继续；Esc 退出
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                togglePause();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                exitDemo();
            }
        });

        // 页面隐藏时自动暂停，回来再继续（可选体验优化）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !state.paused) {
                setPaused(true);
            }
        });
    }

    // ============ 启动 ============
    function boot() {
        // 初始状态
        setStatus({ emotion: 0, body: 0, relation: 0 });
        bindEvents();

        // 等首屏动画开始后再启动主流程
        setTimeout(() => {
            runDemo();
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
