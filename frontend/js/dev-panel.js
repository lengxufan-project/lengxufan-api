let showDevPanel = false;

document.getElementById('dev-toggle').onclick = () => {
    showDevPanel = !showDevPanel;
    document.getElementById('dev-panel').style.display = showDevPanel ? 'block' : 'none';
    if (showDevPanel) {
        const lastLxf = [...messages].reverse().find(m => m.role === 'lxf');
        if (lastLxf && lastLxf.state) updateDevPanel(lastLxf.state);
    }
};

function updateDevPanel(state) {
    if (!state) return;
    let html = '';
    html += '<div class="dev-section"><h4>情绪</h4><span class="dev-value">'+state.emotion.toFixed(1)+' ('+getEmotionLabel(state.emotion)+')</span></div>';
    html += '<div class="dev-section"><h4>身体</h4><span class="dev-value">'+state.body+'</span></div>';
    html += '<div class="dev-section"><h4>心理</h4><span class="dev-value">'+state.mind+'</span></div>';
    html += '<div class="dev-section"><h4>关系</h4><span class="dev-value">'+state.relationship+'</span></div>';
    if (state.wang_claim) {
        html += '<div class="dev-section"><h4>望仔验证</h4><span class="dev-value">信任值:'+state.wang_trust+' | 证据:'+state.verified_evidence.join(', ')+'</span></div>';
        if (state.pending_question) html += '<div class="dev-section"><h4>追问</h4><span class="dev-value">'+state.pending_question+'</span></div>';
    }
    if (state.last_thought) html += '<div class="dev-section"><h4>思考链</h4><span class="dev-value">'+state.last_thought+'</span></div>';
    document.getElementById('dev-panel').innerHTML = html;
}

function getEmotionLabel(val) {
    if (val < 30) return '低落';
    if (val < 50) return '平静';
    if (val < 70) return '稍好';
    return '高涨';
}
