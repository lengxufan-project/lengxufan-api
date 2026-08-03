document.getElementById('export-btn').onclick = () => {
    let preview = '';
    messages.forEach(m => {
        const label = m.role === 'user' ? '你' : '冷旭帆';
        preview += `[${label}] ${m.content}\n`;
        if (m.annotation) preview += `[标注] ${m.annotation}\n`;
        preview += '\n';
    });
    document.getElementById('export-preview').textContent = preview;
    document.getElementById('export-modal').style.display = 'flex';
};

function download(content, filename, mime) {
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('export-txt').onclick = () => {
    let text = '=== 冷旭帆 · 对话记录 ===\n\n';
    messages.forEach(m => {
        const label = m.role === 'user' ? '你' : '冷旭帆';
        text += `[${label}] ${m.content}\n`;
        if (m.annotation) text += `[标注] ${m.annotation}\n`;
        text += '\n';
    });
    download(text, `冷旭帆_对话_${new Date().toISOString().slice(0,10)}.txt`, 'text/plain');
};

document.getElementById('export-md').onclick = () => {
    let md = '# 冷旭帆 · 对话记录\n\n';
    messages.forEach(m => {
        const label = m.role === 'user' ? '**你**' : '**冷旭帆**';
        md += `${label}: ${m.content}\n\n`;
        if (m.annotation) md += `> 标注: ${m.annotation}\n\n`;
    });
    download(md, `冷旭帆_对话_${new Date().toISOString().slice(0,10)}.md`, 'text/markdown');
};

document.getElementById('export-cancel').onclick = () => document.getElementById('export-modal').style.display = 'none';
document.getElementById('export-modal').addEventListener('click', e => { if (e.target === document.getElementById('export-modal')) document.getElementById('export-modal').style.display = 'none'; });
document.getElementById('annotation-modal').addEventListener('click', e => { if (e.target === document.getElementById('annotation-modal')) document.getElementById('annotation-modal').style.display = 'none'; });
