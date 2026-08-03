let selectedMsgId = null;

function openAnnotationModal(idx) {
    selectedMsgId = messages[idx]?.id;
    document.getElementById('annotation-text').value = messages[idx]?.annotation || '';
    document.getElementById('annotation-modal').style.display = 'flex';
}

document.getElementById('annotation-cancel').onclick = () => {
    document.getElementById('annotation-modal').style.display = 'none';
    selectedMsgId = null;
};

document.getElementById('annotation-save').onclick = async () => {
    if (selectedMsgId == null) return;
    const text = document.getElementById('annotation-text').value.trim();
    try {
        await API.annotateMessage(selectedMsgId, text);
        const msg = messages.find(m => m.id === selectedMsgId);
        if (msg) msg.annotation = text;
        renderMessages();
        document.getElementById('annotation-modal').style.display = 'none';
    } catch(e) { alert(e.message); }
};
