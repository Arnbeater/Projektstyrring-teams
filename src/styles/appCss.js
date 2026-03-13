const css = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap');

:root {
  --bg:#0F1117; --surface:#181B25; --surface2:#1F2330; --surface3:#272B38;
  --border:#2A2E3D; --border-light:#353A4C;
  --text:#E8E9ED; --text-muted:#6B7089; --text-dim:#484D63;
  --accent:#FF6B35; --accent-soft:rgba(255,107,53,0.12); --accent-hover:#FF8255;
  --blue:#4B8BF5; --green:#34C77B; --yellow:#F5C542; --red:#F54B5E;
  --font-display:'Sora',system-ui,sans-serif;
  --font-mono:'JetBrains Mono',monospace;
}
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:var(--font-display); background:var(--bg); color:var(--text); }
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-thumb { background:var(--border-light); border-radius:3px; }

.btn { font-family:var(--font-display); border:none; cursor:pointer; font-size:12px; font-weight:500; border-radius:6px; transition:all 0.12s; padding:7px 14px; white-space:nowrap; }
.btn-dark { background:var(--surface3); color:var(--text-muted); border:1px solid var(--border); }
.btn-dark:hover { color:var(--text); border-color:var(--border-light); }
.btn-dark.active { background:var(--accent-soft); color:var(--accent); border-color:var(--accent); }
.btn-accent { background:var(--accent); color:#FFF; border:none; }
.btn-accent:hover { background:var(--accent-hover); }
.btn-sm { padding:4px 10px; font-size:11px; }
.btn-danger { background:rgba(245,75,94,0.12); color:var(--red); border:none; }

.fl-input, .fl-select, .fl-textarea {
  width:100%; background:var(--surface2); border:1px solid var(--border);
  border-radius:6px; padding:9px 11px; font-size:13px; color:var(--text);
  font-family:var(--font-display); outline:none; transition:border-color 0.12s;
}
.fl-input:focus, .fl-select:focus, .fl-textarea:focus { border-color:var(--accent); }
.fl-textarea { resize:vertical; min-height:80px; }

input[type=range] { -webkit-appearance:none; width:100%; height:6px; background:var(--surface3); border-radius:3px; outline:none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:var(--accent); cursor:pointer; border:2px solid var(--bg); }

@keyframes slideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }

@media print {
  @page { size: landscape; margin: 6mm; }
  body { background: #FFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
  .no-print { display: none !important; }
  
  /* Unfold all containers */
  *, *::before, *::after {
    overflow: visible !important;
    max-height: none !important;
  }
  
  /* Remove fixed/sticky positioning */
  div[style*="position: sticky"],
  div[style*="position:sticky"],
  div[style*="position: fixed"],
  div[style*="position:fixed"] {
    position: static !important;
  }
  
  /* Remove height constraints on wrappers */
  div[style*="height: 100vh"],
  div[style*="height:100vh"],
  div[style*="height: 100%"],
  div[style*="height:100%"] {
    height: auto !important;
  }
  
  /* Gantt area: show everything, scale to fit */
  .gantt-print-area {
    display: flex !important;
    overflow: visible !important;
    height: auto !important;
    width: max-content !important;
    transform: scale(var(--print-scale, 0.5)) !important;
    transform-origin: top left !important;
  }
  
  /* Preserve flex and positioning inside gantt */  
  .gantt-print-area div[style*="display: flex"],
  .gantt-print-area div[style*="display:flex"] { display: flex !important; }
  .gantt-print-area div[style*="position: relative"],
  .gantt-print-area div[style*="position:relative"] { position: relative !important; }
  .gantt-print-area div[style*="position: absolute"],
  .gantt-print-area div[style*="position:absolute"] { position: absolute !important; }
  
  /* Preserve specific row heights */
  .gantt-print-area div[style*="height: 82px"] { height: 82px !important; }
  .gantt-print-area div[style*="height: 36px"] { height: 36px !important; }
  .gantt-print-area div[style*="height: 32px"] { height: 32px !important; }
  .gantt-print-area div[style*="height: 28px"] { height: 28px !important; }
  .gantt-print-area div[style*="height: 24px"] { height: 24px !important; }
  .gantt-print-area div[style*="height: 22px"] { height: 22px !important; }
  .gantt-print-area div[style*="height: 20px"] { height: 20px !important; }
  
  /* Hide detail panel and modals */
  div[style*="width: 460px"],
  div[style*="width:460px"] { display: none !important; }
}
`;

export { css };
