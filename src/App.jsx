import { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, deleteDoc, getDocs, query, orderBy, where } from "firebase/firestore";

// ============================================================
// 🔧 FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAPmJ5sE80NMggGXoB8bkvJJlTneLpt-R0",
  authDomain: "projektstyring-teams.firebaseapp.com",
  projectId: "projektstyring-teams",
  storageBucket: "projektstyring-teams.firebasestorage.app",
  messagingSenderId: "123029693625",
  appId: "1:123029693625:web:5a2aa3cae9b74564e3e768",
  measurementId: "G-CPJKJFTLMT"
};

// ============================================================
// Firebase init
// ============================================================
const fb = initializeApp(firebaseConfig);
const fbAuth = getAuth(fb);
const fbDb = getFirestore(fb);

// ============================================================
// Constants
// ============================================================
const TC = ["#FF6B35","#4B8BF5","#34C77B","#F5C542","#A47BF5","#35D0BA","#F54B5E","#FF8FA3","#5EEAD4","#FBBF24"];
const STS = ["Ikke startet","I gang","Til review","Afsluttet"];
const SS = {
  "Ikke startet": { bg:"rgba(107,112,137,0.15)", c:"#6B7089", s:"Ny" },
  "I gang": { bg:"rgba(75,139,245,0.15)", c:"#4B8BF5", s:"Aktiv" },
  "Til review": { bg:"rgba(245,197,66,0.15)", c:"#F5C542", s:"Review" },
  "Afsluttet": { bg:"rgba(52,199,123,0.15)", c:"#34C77B", s:"✓" }
};
const PRI = ["Lav","Normal","Høj","Kritisk"];
const PC = { Lav:"#6B7089", Normal:"#4B8BF5", Høj:"#FF6B35", Kritisk:"#F54B5E" };
const DK = ["søn","man","tir","ons","tor","fre","lør"];
const MK = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
const GROUP_COLORS = [
  { name:"Rød", bg:"#FEE2E2", bar:"#F87171", border:"#FECACA", text:"#B91C1C" },
  { name:"Grøn", bg:"#DCFCE7", bar:"#86EFAC", border:"#BBF7D0", text:"#166534" },
  { name:"Blå", bg:"#DBEAFE", bar:"#93C5FD", border:"#BFDBFE", text:"#1E40AF" },
  { name:"Orange", bg:"#FFF7ED", bar:"#FDBA74", border:"#FED7AA", text:"#C2410C" },
  { name:"Lilla", bg:"#F3E8FF", bar:"#C4B5FD", border:"#DDD6FE", text:"#6D28D9" },
  { name:"Cyan", bg:"#ECFEFF", bar:"#67E8F9", border:"#A5F3FC", text:"#0E7490" },
  { name:"Pink", bg:"#FDF2F8", bar:"#F9A8D4", border:"#FBCFE8", text:"#BE185D" },
  { name:"Gul", bg:"#FEFCE8", bar:"#FDE047", border:"#FEF08A", text:"#A16207" },
];

// Helpers
const toD = s => s ? new Date(s+"T00:00:00") : null;
const toS = d => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";
const td = () => toS(new Date());
const addD = (s,n) => { const d=toD(s); d.setDate(d.getDate()+n); return toS(d); };
const fmtD = s => { if(!s) return "—"; const d=toD(s); return `${d.getDate()}. ${MK[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDs = s => { if(!s) return ""; const d=toD(s); return `${d.getDate()} ${MK[d.getMonth()]}`; };
const isWe = s => { if(!s) return false; const d=toD(s).getDay(); return d===0||d===6; };
const weDays = (s,e) => { if(!s||!e) return 0; let c=s,n=0; while(c<=e){if(isWe(c))n++;c=addD(c,1)} return n; };
const getWeekNum = s => { const d=toD(s); const t=new Date(d.valueOf()); t.setDate(t.getDate()+3-(t.getDay()+6)%7); const w=new Date(t.getFullYear(),0,4); return 1+Math.round(((t.getTime()-w.getTime())/86400000-3+(w.getDay()+6)%7)/7); };
const getWeeks = (days) => {
  const weeks = [];
  let cur = null;
  days.forEach(day => {
    const wn = getWeekNum(day);
    const d = toD(day);
    const mo = MK[d.getMonth()];
    if (!cur || cur.num !== wn) {
      cur = { num: wn, month: mo, days: [day] };
      weeks.push(cur);
    } else {
      cur.days.push(day);
    }
  });
  return weeks;
};

// ============================================================
// STYLES
// ============================================================
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
  @page { size: landscape; margin: 10mm; }
  body { background: #FFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .detail-panel-wrap > div:last-child { display: none !important; }
  * { overflow: visible !important; }
  .gantt-print-area { 
    position: static !important; 
    height: auto !important; 
    overflow: visible !important;
    flex: none !important;
  }
  .gantt-print-area * { 
    position: static !important;
    overflow: visible !important;
  }
  .gantt-print-area [style*="sticky"] { position: static !important; }
}
`;

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin, error, loading }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)" }}>
      <style>{css}</style>
      <div style={{ width:400, maxWidth:"90vw" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:64, height:64, borderRadius:16,
            background:"var(--accent-soft)", marginBottom:16,
            fontSize:24, fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent)"
          }}>PM</div>
          <h1 style={{ fontSize:28, fontWeight:600, letterSpacing:"-0.02em", color:"var(--text)" }}>Projektstyring</h1>
          <p style={{ fontSize:13, color:"var(--text-muted)", marginTop:6 }}>Log ind for at se dine projekter</p>
        </div>
        
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24 }}>
          {error && (
            <div style={{
              background:"rgba(245,75,94,0.1)", border:"1px solid rgba(245,75,94,0.2)",
              borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--red)"
            }}>{error}</div>
          )}
          
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>Email</label>
            <input className="fl-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="din@email.dk"
              onKeyDown={e => e.key === "Enter" && onLogin(email, pass)} />
          </div>
          
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>Adgangskode</label>
            <input className="fl-input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && onLogin(email, pass)} />
          </div>
          
          <button className="btn btn-accent" style={{ width:"100%", padding:"10px 14px", fontSize:14 }}
            onClick={() => onLogin(email, pass)} disabled={loading}>
            {loading ? "Logger ind..." : "Log ind"}
          </button>
        </div>
        
        <p style={{ textAlign:"center", fontSize:11, color:"var(--text-dim)", marginTop:16 }}>
          Kontakt din administrator for at få en konto
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DEMO / OFFLINE MODE (when Firebase not configured)
// ============================================================
function useDemoMode() {
  const isDemo = firebaseConfig.apiKey === "DIN_API_KEY";
  return isDemo;
}

// ============================================================
// MAIN APP — Auth + Workspace + Project router
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const isDemo = useDemoMode();

  // Navigation state
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWs, setActiveWs] = useState(null); // workspace object
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState([]);

  // Modals
  const [showNewWs, setShowNewWs] = useState(false);
  const [showJoinWs, setShowJoinWs] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showWsSettings, setShowWsSettings] = useState(false);

  // Auth
  useEffect(() => {
    if (isDemo) {
      setUser({ email: "demo@lokal" });
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(fbAuth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  // Load workspaces where user is member
  useEffect(() => {
    if (!user || isDemo) return;
    const q = query(collection(fbDb, "workspaces"), where("memberEmails", "array-contains", user.email));
    const unsub = onSnapshot(q, snap => {
      setWorkspaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, isDemo]);

  // Load projects when workspace is selected
  useEffect(() => {
    if (!activeWs || isDemo) return;
    const q = query(collection(fbDb, "workspaces", activeWs.id, "projects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [activeWs, isDemo]);

  // Demo mode persistence
  useEffect(() => {
    if (isDemo && user) {
      try { const d = JSON.parse(localStorage.getItem("pm6_ws")); if (d) setWorkspaces(d); } catch(e) {}
    }
  }, [isDemo, user]);
  useEffect(() => {
    if (isDemo && user && workspaces.length > 0) {
      try { localStorage.setItem("pm6_ws", JSON.stringify(workspaces)); } catch(e) {}
    }
  }, [workspaces, isDemo, user]);

  async function handleLogin(email, pass) {
    if (isDemo) { setUser({ email }); return; }
    setLoginLoading(true); setAuthError("");
    try { await signInWithEmailAndPassword(fbAuth, email, pass); }
    catch(e) {
      const msgs = { "auth/user-not-found":"Bruger ikke fundet", "auth/wrong-password":"Forkert adgangskode", "auth/invalid-email":"Ugyldig email", "auth/invalid-credential":"Forkert email eller adgangskode", "auth/too-many-requests":"For mange forsøg" };
      setAuthError(msgs[e.code] || `Fejl: ${e.message}`);
    }
    setLoginLoading(false);
  }
  async function handleLogout() {
    if (!isDemo) await signOut(fbAuth);
    setUser(isDemo ? null : user); setActiveWs(null); setActiveProjectId(null); setProjects([]);
    if (isDemo) setUser(null);
  }

  // Workspace CRUD
  function generateInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code.slice(0,4) + "-" + code.slice(4);
  }

  async function createWorkspace(name) {
    const inviteCode = generateInviteCode();
    const ws = {
      name: name || "Nyt workspace",
      members: [{ email: user.email, role: "admin" }],
      memberEmails: [user.email],
      inviteCode,
      createdBy: user.email,
      createdAt: new Date().toISOString()
    };
    if (isDemo) {
      const id = "ws" + Date.now();
      const full = { id, ...ws, projects: [] };
      setWorkspaces(prev => [...prev, full]);
      setActiveWs(full);
    } else {
      const ref = await addDoc(collection(fbDb, "workspaces"), ws);
      setActiveWs({ id: ref.id, ...ws });
    }
    setShowNewWs(false);
    setProjects([]);
  }

  async function joinWorkspace(code) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return "Indtast en invitationskode";

    if (isDemo) {
      const ws = workspaces.find(w => w.inviteCode === trimmed);
      if (!ws) return "Ugyldig invitationskode";
      if (ws.memberEmails?.includes(user.email)) return "Du er allerede medlem";
      const newMembers = [...ws.members, { email: user.email, role: "member" }];
      const newEmails = [...ws.memberEmails, user.email];
      setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, members: newMembers, memberEmails: newEmails } : w));
      return null;
    }

    // Search all workspaces for the invite code
    const q = query(collection(fbDb, "workspaces"), where("inviteCode", "==", trimmed));
    const snap = await getDocs(q);
    if (snap.empty) return "Ugyldig invitationskode";

    const wsDoc = snap.docs[0];
    const wsData = wsDoc.data();
    if (wsData.memberEmails?.includes(user.email)) return "Du er allerede medlem af dette workspace";

    const newMembers = [...(wsData.members || []), { email: user.email, role: "member" }];
    const newEmails = [...(wsData.memberEmails || []), user.email];
    await setDoc(doc(fbDb, "workspaces", wsDoc.id), { members: newMembers, memberEmails: newEmails }, { merge: true });
    return null;
  }

  async function regenerateInviteCode(wsId) {
    const newCode = generateInviteCode();
    if (isDemo) {
      setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, inviteCode: newCode } : w));
      if (activeWs?.id === wsId) setActiveWs(prev => ({ ...prev, inviteCode: newCode }));
    } else {
      await setDoc(doc(fbDb, "workspaces", wsId), { inviteCode: newCode }, { merge: true });
    }
    return newCode;
  }

  async function deleteWorkspace(id) {
    if (isDemo) {
      setWorkspaces(prev => prev.filter(w => w.id !== id));
    } else {
      await deleteDoc(doc(fbDb, "workspaces", id));
    }
    if (activeWs?.id === id) { setActiveWs(null); setProjects([]); setActiveProjectId(null); }
  }

  async function updateWsMembers(wsId, newMembers) {
    const memberEmails = newMembers.map(m => m.email);
    if (isDemo) {
      setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, members: newMembers, memberEmails } : w));
      if (activeWs?.id === wsId) setActiveWs(prev => ({ ...prev, members: newMembers, memberEmails }));
    } else {
      await setDoc(doc(fbDb, "workspaces", wsId), { members: newMembers, memberEmails }, { merge: true });
    }
  }

  // Project CRUD (within workspace)
  async function createProject(name) {
    if (!activeWs) return;
    const proj = {
      projectName: name || "Nyt Projekt", tasks: [], milestones: [],
      members: [user.email],
      createdAt: new Date().toISOString(), createdBy: user.email,
      updatedAt: new Date().toISOString(), updatedBy: user.email
    };
    if (isDemo) {
      const id = "p" + Date.now();
      setProjects(prev => [{ id, ...proj }, ...prev]);
      setWorkspaces(prev => prev.map(w => w.id === activeWs.id ? { ...w, projects: [...(w.projects||[]), { id, ...proj }] } : w));
      setActiveProjectId(id);
    } else {
      const ref = await addDoc(collection(fbDb, "workspaces", activeWs.id, "projects"), proj);
      setActiveProjectId(ref.id);
    }
    setShowNewProject(false);
  }

  async function deleteProject(id) {
    if (!activeWs) return;
    if (isDemo) {
      setProjects(prev => prev.filter(p => p.id !== id));
    } else {
      await deleteDoc(doc(fbDb, "workspaces", activeWs.id, "projects", id));
    }
    if (activeProjectId === id) setActiveProjectId(null);
  }

  const wsRole = activeWs?.members?.find(m => m.email === user?.email)?.role || "member";
  const isWsAdmin = wsRole === "admin";

  // ---- LOADING ----
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"#0F1117", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{css}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, fontFamily:"var(--font-mono)", fontWeight:700, color:"#FF6B35", animation:"pulse 1.5s infinite" }}>PM</div>
        <div style={{ fontSize:12, color:"#6B7089", marginTop:8 }}>Indlæser...</div>
      </div>
    </div>
  );

  // ---- LOGIN ----
  if (!user) return <LoginScreen onLogin={handleLogin} error={authError} loading={loginLoading} />;

  // ---- PROJECT VIEW ----
  if (activeWs && activeProjectId) {
    return <ProjectView
      workspaceId={activeWs.id} projectId={activeProjectId}
      user={user} isDemo={isDemo} projects={projects} setProjects={setProjects}
      onBack={() => setActiveProjectId(null)}
      onLogout={handleLogout} wsName={activeWs.name}
    />;
  }

  // ---- PROJECT LIST (inside workspace) ----
  if (activeWs) {
    const visibleProjects = projects.filter(p => !p.members || p.members.includes(user?.email));
    return (
      <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"var(--font-display)" }}>
        <style>{css}</style>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"40px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
            <div>
              <button className="btn btn-dark btn-sm" onClick={() => { setActiveWs(null); setProjects([]); }} style={{ marginBottom:8 }}>← Workspaces</button>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <h1 style={{ fontSize:28, fontWeight:600, letterSpacing:"-0.02em" }}>{activeWs.name}</h1>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:10, padding:"3px 8px", borderRadius:4, background: isWsAdmin ? "var(--accent-soft)" : "var(--surface3)", color: isWsAdmin ? "var(--accent)" : "var(--text-muted)" }}>{wsRole.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {isWsAdmin && <button className="btn btn-dark btn-sm" onClick={() => setShowWsSettings(true)}>⚙ Indstillinger</button>}
              <UserBadge email={user.email} />
              <button className="btn btn-dark btn-sm" onClick={handleLogout}>Log ud</button>
            </div>
          </div>

          <button className="btn btn-accent" style={{ marginBottom:24, padding:"10px 20px", fontSize:14 }} onClick={() => setShowNewProject(true)}>+ Nyt projekt</button>

          {visibleProjects.length === 0 ? (
            <Empty icon="📁" title="Ingen projekter endnu" sub="Opret dit første projekt i dette workspace" />
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
              {visibleProjects.map(p => <ProjectCard key={p.id} p={p} user={user} onClick={() => setActiveProjectId(p.id)} onDelete={() => { if(confirm("Slet dette projekt?")) deleteProject(p.id); }} />)}
            </div>
          )}
        </div>

        {showNewProject && <NewProjectModal onCreate={createProject} onClose={() => setShowNewProject(false)} />}
        {showWsSettings && <WorkspaceSettingsModal ws={activeWs} user={user} onUpdateMembers={(m) => updateWsMembers(activeWs.id, m)} onRegenerateCode={() => regenerateInviteCode(activeWs.id)} onDelete={() => { if(confirm("Slet hele dette workspace og alle projekter?")) deleteWorkspace(activeWs.id); }} onClose={() => setShowWsSettings(false)} />}
      </div>
    );
  }

  // ---- WORKSPACE LIST ----
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"var(--font-display)" }}>
      <style>{css}</style>
      <div style={{ maxWidth:700, margin:"0 auto", padding:"60px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:40 }}>
          <div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>Projektstyring</div>
            <h1 style={{ fontSize:32, fontWeight:600, letterSpacing:"-0.02em" }}>Dine workspaces</h1>
            <p style={{ fontSize:13, color:"var(--text-muted)", marginTop:4 }}>Vælg et workspace eller opret et nyt</p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <UserBadge email={user.email} />
            <button className="btn btn-dark btn-sm" onClick={handleLogout}>Log ud</button>
          </div>
        </div>

        {isDemo && (
          <div style={{ marginBottom:20, padding:"8px 14px", background:"rgba(245,197,66,0.1)", border:"1px solid rgba(245,197,66,0.2)", borderRadius:8, fontSize:11, color:"var(--yellow)" }}>
            ⚠ Demo-tilstand: Data gemmes kun lokalt.
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          <button className="btn btn-accent" style={{ padding:"10px 20px", fontSize:14 }} onClick={() => setShowNewWs(true)}>+ Nyt workspace</button>
          <button className="btn btn-dark" style={{ padding:"10px 20px", fontSize:14 }} onClick={() => setShowJoinWs(true)}>🔗 Join med kode</button>
        </div>

        {workspaces.length === 0 ? (
          <Empty icon="🏢" title="Ingen workspaces endnu" sub="Opret dit første workspace for at samle dit team" />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {workspaces.map(ws => {
              const memberCount = (ws.members || []).length;
              const myRole = ws.members?.find(m => m.email === user.email)?.role || "member";
              return (
                <div key={ws.id} onClick={() => { setActiveWs(ws); setProjects([]); }}
                  style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"20px 24px", cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:16 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-light)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  <div style={{ width:48, height:48, borderRadius:10, background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"var(--accent)", flexShrink:0 }}>
                    {(ws.name || "W")[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:17, fontWeight:600, marginBottom:2 }}>{ws.name}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                      {memberCount} medlem{memberCount !== 1 ? "mer" : ""} · oprettet af {ws.createdBy}
                    </div>
                  </div>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:9, padding:"3px 8px", borderRadius:4, background: myRole === "admin" ? "var(--accent-soft)" : "var(--surface3)", color: myRole === "admin" ? "var(--accent)" : "var(--text-muted)" }}>{myRole.toUpperCase()}</span>
                  <span style={{ fontSize:18, color:"var(--text-dim)" }}>→</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewWs && <NewWsModal onCreate={createWorkspace} onClose={() => setShowNewWs(false)} />}
      {showJoinWs && <JoinWsModal onJoin={joinWorkspace} onClose={() => setShowJoinWs(false)} />}
    </div>
  );
}

// ============================================================
// WORKSPACE COMPONENTS
// ============================================================
function UserBadge({ email }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:28, height:28, borderRadius:6, background:"var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"var(--accent)" }}>{(email||"?")[0].toUpperCase()}</div>
      <span style={{ fontSize:11, color:"var(--text-muted)", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{email}</span>
    </div>
  );
}

function ProjectCard({ p, user, onClick, onDelete }) {
  const taskCount = (p.tasks || []).length;
  const doneCount = (p.tasks || []).filter(t => t.status === "Afsluttet").length;
  const msCount = (p.milestones || []).length;
  const memberCount = (p.members || []).length;
  const pct = taskCount > 0 ? Math.round(doneCount / taskCount * 100) : 0;
  const isOwner = p.createdBy === user?.email;
  return (
    <div onClick={onClick}
      style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:20, cursor:"pointer", transition:"all 0.15s", position:"relative" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-light)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
      <div style={{ fontSize:16, fontWeight:600, marginBottom:6, paddingRight:24 }}>{p.projectName || "Uden navn"}</div>
      <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:12 }}>
        {taskCount} opgave{taskCount !== 1 ? "r" : ""} · {msCount} milepæl{msCount !== 1 ? "e" : ""} · {memberCount} medlem{memberCount !== 1 ? "mer" : ""}
      </div>
      {taskCount > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ flex:1, height:4, background:"var(--surface3)", borderRadius:2, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:"var(--accent)", borderRadius:2 }} />
          </div>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", fontWeight:600 }}>{pct}%</span>
        </div>
      )}
      <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>
        Opdateret {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("da-DK") : "—"}
      </div>
      {isOwner && <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{ position:"absolute", top:12, right:12, fontSize:10, padding:"2px 8px" }}>✕</button>}
    </div>
  );
}

function NewWsModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:420, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Nyt workspace</div>
        <Field label="Workspace-navn">
          <input ref={ref} className="fl-input" value={name} onChange={e => setName(e.target.value)} placeholder="Fx 'Marketing Team' eller 'Wayfinding Q2'"
            onKeyDown={e => e.key === "Enter" && onCreate(name)} />
        </Field>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button className="btn btn-dark" onClick={onClose}>Annuller</button>
          <button className="btn btn-accent" onClick={() => onCreate(name)}>Opret</button>
        </div>
      </div>
    </div>
  );
}

function JoinWsModal({ onJoin, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  async function handleJoin() {
    setError(""); setLoading(true);
    const err = await onJoin(code);
    setLoading(false);
    if (err) { setError(err); }
    else { setSuccess(true); setTimeout(() => onClose(), 1200); }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:420, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:4 }}>Join workspace</div>
        <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:16 }}>Indtast invitationskoden du har fået fra en workspace-admin</p>

        {error && <div style={{ background:"rgba(245,75,94,0.1)", border:"1px solid rgba(245,75,94,0.2)", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:12, color:"var(--red)" }}>{error}</div>}
        {success && <div style={{ background:"rgba(52,199,123,0.1)", border:"1px solid rgba(52,199,123,0.2)", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:12, color:"var(--green)" }}>Du er nu medlem! Workspace vises i din oversigt.</div>}

        {!success && (
          <>
            <Field label="Invitationskode">
              <input ref={ref} className="fl-input" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX" style={{ fontFamily:"var(--font-mono)", fontSize:18, textAlign:"center", letterSpacing:"0.15em" }}
                onKeyDown={e => e.key === "Enter" && handleJoin()} maxLength={9} />
            </Field>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button className="btn btn-dark" onClick={onClose}>Annuller</button>
              <button className="btn btn-accent" onClick={handleJoin} disabled={loading}>{loading ? "Joiner..." : "Join"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WorkspaceSettingsModal({ ws, user, onUpdateMembers, onRegenerateCode, onDelete, onClose }) {
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [copied, setCopied] = useState(false);
  const members = ws.members || [];
  const inviteCode = ws.inviteCode || "—";

  function addMember() {
    const email = newEmail.toLowerCase().trim();
    if (!email || members.find(m => m.email === email)) return;
    onUpdateMembers([...members, { email, role: newRole }]);
    setNewEmail(""); setNewRole("member");
  }
  function removeMember(email) {
    if (email === ws.createdBy) return;
    onUpdateMembers(members.filter(m => m.email !== email));
  }
  function changeRole(email, role) {
    if (email === ws.createdBy) return;
    onUpdateMembers(members.map(m => m.email === email ? { ...m, role } : m));
  }
  function copyCode() {
    navigator.clipboard.writeText(inviteCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:520, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease", maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:600 }}>Workspace-indstillinger</div>
          <button className="btn btn-dark btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* INVITE LINK SECTION */}
        <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:8 }}>Invitationskode</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, fontFamily:"var(--font-mono)", fontSize:22, fontWeight:700, color:"var(--accent)", letterSpacing:"0.15em", textAlign:"center", padding:"8px 0" }}>{inviteCode}</div>
            <button className="btn btn-dark btn-sm" onClick={copyCode} style={{ whiteSpace:"nowrap" }}>{copied ? "✓ Kopieret" : "Kopiér"}</button>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
            <div style={{ fontSize:10, color:"var(--text-dim)" }}>Del denne kode med folk der skal join'e dit workspace</div>
            <button className="btn btn-dark btn-sm" onClick={onRegenerateCode} style={{ fontSize:10 }}>Ny kode</button>
          </div>
        </div>

        <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>Medlemmer ({members.length})</div>

        {members.map(m => (
          <div key={m.email} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:32, height:32, borderRadius:6, background: m.role === "admin" ? "var(--accent-soft)" : "var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color: m.role === "admin" ? "var(--accent)" : "var(--text-muted)", flexShrink:0 }}>
              {m.email[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{m.email}</div>
              {m.email === ws.createdBy && <div style={{ fontSize:9, color:"var(--accent)", fontFamily:"var(--font-mono)" }}>OPRETTET AF</div>}
            </div>
            {m.email !== ws.createdBy ? (
              <select className="fl-select" style={{ width:100, fontSize:11, padding:"4px 8px" }} value={m.role} onChange={e => changeRole(m.email, e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            ) : (
              <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", padding:"4px 8px" }}>ADMIN</span>
            )}
            {m.email !== ws.createdBy && (
              <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.email)} style={{ fontSize:10, padding:"2px 8px" }}>Fjern</button>
            )}
          </div>
        ))}

        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>Tilføj medlem direkte</div>
          <div style={{ display:"flex", gap:8 }}>
            <input className="fl-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="bruger@email.dk" style={{ flex:1 }} onKeyDown={e => e.key === "Enter" && addMember()} />
            <select className="fl-select" style={{ width:100, fontSize:11 }} value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-accent" onClick={addMember}>Tilføj</button>
          </div>
        </div>

        <div style={{ marginTop:24, paddingTop:16, borderTop:"1px solid var(--border)" }}>
          <button className="btn btn-danger" onClick={onDelete} style={{ width:"100%" }}>Slet workspace</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NEW PROJECT MODAL
// ============================================================
function NewProjectModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:420, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Nyt projekt</div>
        <Field label="Projektnavn">
          <input ref={ref} className="fl-input" value={name} onChange={e => setName(e.target.value)} placeholder="Hvad hedder projektet?"
            onKeyDown={e => e.key === "Enter" && onCreate(name)} />
        </Field>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button className="btn btn-dark" onClick={onClose}>Annuller</button>
          <button className="btn btn-accent" onClick={() => onCreate(name)}>Opret</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MEMBERS MODAL
// ============================================================
function MembersModal({ members, createdBy, isOwner, onAdd, onRemove, onClose }) {
  const [newEmail, setNewEmail] = useState("");
  const ref = useRef(null);

  function handleAdd() {
    if (newEmail.trim()) { onAdd(newEmail.trim()); setNewEmail(""); ref.current?.focus(); }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:440, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:600 }}>Projektmedlemmer</div>
          <button className="btn btn-dark btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Member list */}
        <div style={{ marginBottom:16 }}>
          {members.map(email => (
            <div key={email} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
              <div style={{ width:32, height:32, borderRadius:6, background: email === createdBy ? "var(--accent-soft)" : "var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color: email === createdBy ? "var(--accent)" : "var(--text-muted)", flexShrink:0 }}>
                {email[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{email}</div>
                {email === createdBy && <div style={{ fontSize:10, color:"var(--accent)", fontFamily:"var(--font-mono)" }}>EJER</div>}
              </div>
              {isOwner && email !== createdBy && (
                <button className="btn btn-danger btn-sm" onClick={() => onRemove(email)} style={{ fontSize:10, padding:"2px 8px" }}>Fjern</button>
              )}
            </div>
          ))}
        </div>

        {/* Add member */}
        {isOwner && (
          <div>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>Tilføj medlem</div>
            <div style={{ display:"flex", gap:8 }}>
              <input ref={ref} className="fl-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="bruger@email.dk" onKeyDown={e => e.key === "Enter" && handleAdd()} style={{ flex:1 }} />
              <button className="btn btn-accent" onClick={handleAdd}>Tilføj</button>
            </div>
            <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:6 }}>
              Brugeren skal have en konto i systemet (oprettet i Firebase Authentication)
            </div>
          </div>
        )}

        {!isOwner && (
          <div style={{ fontSize:11, color:"var(--text-dim)", textAlign:"center", padding:"8px 0" }}>
            Kun projektejeren kan tilføje og fjerne medlemmer
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PROJECT VIEW — Single project (existing logic)
// ============================================================
function ProjectView({ workspaceId, projectId, user, isDemo, projects, setProjects, onBack, onLogout, wsName }) {
  const [projectName, setProjectName] = useState("Nyt Projekt");
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [members, setMembers] = useState([]);
  const [createdBy, setCreatedBy] = useState("");
  const [view, setView] = useState("gantt");
  const [selTask, setSelTask] = useState(null);
  const [selMs, setSelMs] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMs, setShowAddMs] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const savingRef = useRef(false);

  const projRef = () => isDemo ? null : doc(fbDb, "workspaces", workspaceId, "projects", projectId);

  useEffect(() => {
    if (isDemo) {
      const p = projects.find(x => x.id === projectId);
      if (p) {
        setProjectName(p.projectName || "Nyt Projekt");
        setTasks(p.tasks || []);
        setMilestones(p.milestones || []);
        setMembers(p.members || []);
        setCreatedBy(p.createdBy || "");
      }
      return;
    }
    const unsub = onSnapshot(projRef(), snap => {
      if (savingRef.current) return;
      if (snap.exists()) {
        const data = snap.data();
        setProjectName(data.projectName || "Nyt Projekt");
        setTasks(data.tasks || []);
        setMilestones(data.milestones || []);
        setMembers(data.members || []);
        setCreatedBy(data.createdBy || "");
      }
    });
    return () => unsub();
  }, [projectId, workspaceId]);

  async function saveProject(newTasks, newMilestones, newName) {
    const data = {
      projectName: newName ?? projectName,
      tasks: newTasks ?? tasks,
      milestones: newMilestones ?? milestones,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || "unknown"
    };
    if (isDemo) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p));
    } else {
      savingRef.current = true;
      await setDoc(projRef(), data, { merge: true });
      setTimeout(() => { savingRef.current = false; }, 500);
    }
  }

  async function addMember(email) {
    if (!email || members.includes(email)) return;
    const newMembers = [...members, email.toLowerCase().trim()];
    setMembers(newMembers);
    if (isDemo) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, members: newMembers } : p));
    } else {
      await setDoc(projRef(), { members: newMembers }, { merge: true });
    }
  }

  async function removeMember(email) {
    if (email === createdBy) return;
    const newMembers = members.filter(m => m !== email);
    setMembers(newMembers);
    if (isDemo) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, members: newMembers } : p));
    } else {
      await setDoc(projRef(), { members: newMembers }, { merge: true });
    }
  }

  const isOwner = createdBy === user?.email;

  function updateTasks(fn) {
    setTasks(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      saveProject(next, null, null);
      return next;
    });
  }
  function updateMilestones(fn) {
    setMilestones(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      saveProject(null, next, null);
      return next;
    });
  }
  function updateProjectName(name) {
    setProjectName(name);
    saveProject(null, null, name);
  }

  function addTask(name, start, end, desc, owner, group) {
    updateTasks(prev => [...prev, {
      id: Date.now(), name: name || "Ny opgave", start: start || td(), end: end || addD(td(),7),
      status: "Ikke startet", priority: "Normal", owner: owner || "", desc: desc || "",
      group: group || "", progress: 0, color: TC[tasks.length % TC.length], createdBy: user?.email || ""
    }]);
    setShowAddTask(false);
  }
  function updTask(id, field, value) {
    updateTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  }
  function delTask(id) {
    updateTasks(prev => prev.filter(t => t.id !== id));
    setSelTask(null);
  }
  function addMilestone(name, date) {
    updateMilestones(prev => [...prev, {
      id: Date.now(), name: name || "Milepæl", date: date || td(), desc: "", color: "#F5C542"
    }]);
    setShowAddMs(false);
  }
  function updMs(id, field, value) {
    updateMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  }
  function delMs(id) {
    updateMilestones(prev => prev.filter(m => m.id !== id));
    setSelMs(null);
  }

  // Drag
  const dragRef = useRef({ dragId:null, overId:null, pos:null });
  function handleDragStart(e, id) { dragRef.current.dragId = id; e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e, id) {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    dragRef.current.overId = id;
    dragRef.current.pos = e.clientY < r.top + r.height/2 ? "top" : "bottom";
  }
  function handleDragEnd() {
    const { dragId, overId, pos } = dragRef.current;
    if (dragId != null && overId != null && dragId !== overId) {
      updateTasks(prev => {
        const arr = [...prev];
        const fi = arr.findIndex(t => t.id === dragId);
        const [task] = arr.splice(fi, 1);
        let ins = arr.findIndex(t => t.id === overId);
        if (pos === "bottom") ins++;
        arr.splice(ins, 0, task);
        return arr;
      });
    }
    dragRef.current = { dragId:null, overId:null, pos:null };
  }

  function ganttRange() {
    const a = [];
    tasks.forEach(t => { if(t.start) a.push(t.start); if(t.end) a.push(t.end); });
    milestones.forEach(m => { if(m.date) a.push(m.date); });
    if (!a.length) { const t = td(); return { s: addD(t,-3), e: addD(t,30) }; }
    a.sort();
    return { s: addD(a[0], -3), e: addD(a[a.length-1], 5) };
  }
  function daysArr(s, e) { const d = []; let c = s; while(c <= e) { d.push(c); c = addD(c,1); } return d; }

  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape") {
        if (showAddTask) setShowAddTask(false);
        else if (showAddMs) setShowAddMs(false);
        else { setSelTask(null); setSelMs(null); }
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [showAddTask, showAddMs]);

  const tk = td();
  const tot = tasks.length;
  const don = tasks.filter(t => t.status === "Afsluttet").length;
  const inp = tasks.filter(t => t.status === "I gang").length;
  const ov = tasks.filter(t => t.end < tk && t.status !== "Afsluttet").length;
  const selTaskObj = selTask != null ? tasks.find(t => t.id === selTask) : null;
  const selMsObj = selMs != null ? milestones.find(m => m.id === selMs) : null;
  const rng = ganttRange();
  const days = daysArr(rng.s, rng.e);
  const dw = 40;
  const weeks = getWeeks(days);
  
  // Derive groups from tasks
  const groupNames = [...new Set(tasks.map(t => t.group || "").filter(Boolean))];
  const ungrouped = tasks.filter(t => !t.group);
  const groupColorMap = {};
  groupNames.forEach((g, i) => { groupColorMap[g] = GROUP_COLORS[i % GROUP_COLORS.length]; });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", fontFamily:"var(--font-display)" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div className="no-print" style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"12px 24px", flexShrink:0, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,107,53,0.04) 0%,transparent 50%,rgba(75,139,245,0.03) 100%)", pointerEvents:"none" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", zIndex:1, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button className="btn btn-dark btn-sm" onClick={onBack} style={{ padding:"5px 10px" }}>← {wsName || "Projekter"}</button>
            <input value={projectName} onChange={e => updateProjectName(e.target.value)} spellCheck={false}
              style={{ background:"transparent", border:"none", color:"var(--text)", fontSize:20, fontWeight:600, letterSpacing:"-0.02em", outline:"none", fontFamily:"var(--font-display)", borderBottom:"1px dashed var(--border)", paddingBottom:2, width:280 }} />
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <button className={`btn btn-dark ${view==="gantt"?"active":""}`} onClick={()=>{setView("gantt");setSelTask(null);setSelMs(null)}}>◧ Gantt</button>
            <button className={`btn btn-dark ${view==="timeline"?"active":""}`} onClick={()=>{setView("timeline");setSelTask(null);setSelMs(null)}}>▤ Tidslinje</button>
            <button className={`btn btn-dark ${view==="list"?"active":""}`} onClick={()=>{setView("list");setSelTask(null);setSelMs(null)}}>☰ Opgaver</button>
            <div style={{ width:1, height:24, background:"var(--border)", margin:"0 4px" }} />
            <button className="btn btn-dark btn-sm" onClick={() => setShowMembers(true)} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ display:"flex" }}>
                {members.slice(0, 3).map((m, i) => (
                  <div key={i} style={{ width:20, height:20, borderRadius:4, background: m === createdBy ? "var(--accent-soft)" : "var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:600, color: m === createdBy ? "var(--accent)" : "var(--text-muted)", marginLeft: i > 0 ? -4 : 0, border:"1.5px solid var(--surface)", position:"relative", zIndex:3-i }}>{m[0].toUpperCase()}</div>
                ))}
              </div>
              {members.length} medlem{members.length !== 1 ? "mer" : ""}
            </button>
            <div style={{ width:1, height:24, background:"var(--border)", margin:"0 4px" }} />
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:"var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"var(--accent)" }}>
                {(user.email || "?")[0].toUpperCase()}
              </div>
              <span style={{ fontSize:11, color:"var(--text-muted)", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</span>
              <button className="btn btn-dark btn-sm" onClick={onLogout}>Log ud</button>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="no-print" style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"8px 24px", display:"flex", gap:10, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
        <button className="btn btn-accent btn-sm" onClick={()=>setShowAddTask(true)}>+ Opgave</button>
        <button className="btn btn-dark btn-sm" onClick={()=>setShowAddMs(true)}>◆ Milepæl</button>
        <div style={{ width:1, height:24, background:"var(--border)", margin:"0 4px" }} />
        <Stat label="Opgaver" value={tot} />
        <Stat label="Afsluttet" value={don} color="var(--green)" />
        <Stat label="I gang" value={inp} color="var(--blue)" />
        {ov > 0 && <Stat label="Forsinket" value={ov} color="var(--red)" />}
        {tot > 0 && <div style={{ marginLeft:"auto", fontFamily:"var(--font-mono)", fontSize:11, padding:"4px 10px", borderRadius:4, background:"var(--surface3)" }}>
          <span style={{ color:"var(--text-muted)" }}>Fremgang </span>
          <span style={{ fontWeight:700, color:"var(--accent)" }}>{Math.round(don/tot*100)}%</span>
        </div>}
        {view === "gantt" && <>
          <div style={{ width:1, height:24, background:"var(--border)", margin:"0 4px" }} />
          <button className="btn btn-dark btn-sm" onClick={()=>window.print()}>🖨 Udskriv Gantt</button>
        </>}
      </div>

      {/* BODY */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex:1, overflow:"auto" }}>

          {/* GANTT VIEW */}
          {view === "gantt" && (
            tasks.length === 0 && milestones.length === 0 ? (
              <Empty icon="◧" title="Ingen opgaver endnu" sub="Tilføj din første opgave for at se Gantt-diagrammet" />
            ) : (
              <>
              {/* Print-only header */}
              <div style={{ display:"none" }} className="print-title">
                <style>{`.print-title { display: none; } @media print { .print-title { display: block !important; padding: 16px 12px 8px; } }`}</style>
                <div style={{ fontSize:20, fontWeight:700, color:"#111", marginBottom:2 }}>{projectName}</div>
                <div style={{ fontSize:11, color:"#666" }}>Gantt-diagram · udskrevet {new Date().toLocaleDateString("da-DK")}</div>
              </div>
              <div className="gantt-print-area" style={{ display:"flex", minHeight:"100%", background:"#FAFAFA" }}>
                {/* Sidebar */}
                <div style={{ width:260, minWidth:260, background:"#FFF", borderRight:"1px solid #E5E7EB", flexShrink:0, position:"sticky", left:0, zIndex:10 }}>
                  {/* Header spacer */}
                  <div style={{ height:82, borderBottom:"1px solid #E5E7EB", background:"#FAFAFA", display:"flex", alignItems:"flex-end", padding:"0 12px 6px", fontSize:10, fontWeight:600, color:"#999", letterSpacing:"0.08em", textTransform:"uppercase" }}>Tidslinje</div>
                  {/* Milestone labels row */}
                  <div style={{ height:32, borderBottom:"1px solid #E5E7EB", background:"#FAFAFA" }} />
                  
                  {/* Group sections */}
                  {groupNames.map(gName => {
                    const gc = groupColorMap[gName];
                    const gTasks = tasks.filter(t => t.group === gName);
                    return (
                      <div key={gName}>
                        {/* Group header */}
                        <div style={{ height:28, display:"flex", alignItems:"center", padding:"0 12px", background:gc.bg, borderBottom:`1px solid ${gc.border}`, borderLeft:`3px solid ${gc.bar}` }}>
                          <span style={{ fontSize:12, fontWeight:600, color:gc.text }}>{gName}</span>
                        </div>
                        {/* Group tasks */}
                        {gTasks.map(t => (
                          <div key={t.id} onClick={()=>{setSelTask(t.id);setSelMs(null)}}
                            style={{ height:32, display:"flex", alignItems:"center", padding:"0 12px 0 18px", borderBottom:"1px solid #F3F4F6", cursor:"pointer", background:selTask===t.id?"#F0F4FF":"#FFF", transition:"background 0.1s", borderLeft:`3px solid transparent` }}>
                            <span style={{ fontSize:11, color:"#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {/* Ungrouped tasks */}
                  {ungrouped.length > 0 && (
                    <div>
                      {groupNames.length > 0 && <div style={{ height:28, display:"flex", alignItems:"center", padding:"0 12px", background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#6B7280" }}>Uden gruppe</span>
                      </div>}
                      {ungrouped.map(t => (
                        <div key={t.id} onClick={()=>{setSelTask(t.id);setSelMs(null)}}
                          style={{ height:32, display:"flex", alignItems:"center", padding:"0 12px 0 18px", borderBottom:"1px solid #F3F4F6", cursor:"pointer", background:selTask===t.id?"#F0F4FF":"#FFF", transition:"background 0.1s" }}>
                          <span style={{ fontSize:11, color:"#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chart area */}
                <div style={{ flex:1, position:"relative", overflow:"auto" }}>
                  {/* Month + Week headers */}
                  <div style={{ position:"sticky", top:0, zIndex:5 }}>
                    {/* Month row */}
                    <div style={{ height:24, display:"flex", background:"#F3F4F6", borderBottom:"1px solid #E5E7EB" }}>
                      {(() => {
                        let prevMo = "";
                        return weeks.map((w, wi) => {
                          const mo = toD(w.days[0]).toLocaleDateString("da-DK", { month:"long" });
                          const showMo = mo !== prevMo;
                          prevMo = mo;
                          return <div key={wi} style={{ minWidth: w.days.length * dw, display:"flex", alignItems:"center", paddingLeft:4, borderRight:"1px solid #E5E7EB" }}>
                            {showMo && <span style={{ fontSize:11, fontWeight:600, color:"#374151", textTransform:"capitalize" }}>{mo}</span>}
                          </div>;
                        });
                      })()}
                    </div>
                    {/* Week number row */}
                    <div style={{ height:22, display:"flex", background:"#FAFAFA", borderBottom:"1px solid #E5E7EB" }}>
                      {weeks.map((w, wi) => (
                        <div key={wi} style={{ minWidth: w.days.length * dw, display:"flex", alignItems:"center", justifyContent:"center", borderRight:"1px solid #E5E7EB", fontSize:9, fontWeight:500, color:"#9CA3AF" }}>
                          uge {String(w.num).padStart(2,"0")}
                        </div>
                      ))}
                    </div>
                    {/* Individual dates row */}
                    <div style={{ height:36, display:"flex", background:"#FFF", borderBottom:"1px solid #E5E7EB" }}>
                      {days.map(day => {
                        const d = toD(day), dow = d.getDay(), we = dow===0||dow===6, isT = day===tk;
                        return (
                          <div key={day} style={{ minWidth:dw, width:dw, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRight:"1px solid #F3F4F6", background: isT ? "rgba(239,68,68,0.06)" : we ? "rgba(0,0,0,0.015)" : "transparent" }}>
                            <div style={{ fontSize:10, fontWeight: isT ? 700 : 500, color: isT ? "#EF4444" : we ? "#C0C0C0" : "#6B7280" }}>{d.getDate()}</div>
                            <div style={{ fontSize:8, fontWeight:500, color: we ? "#D1D5DB" : "#9CA3AF", textTransform:"uppercase" }}>{DK[dow]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Milestone labels row */}
                  <div style={{ height:32, display:"flex", position:"relative", borderBottom:"1px solid #E5E7EB" }}>
                    {days.map(day => <div key={day} style={{ minWidth:dw, width:dw, height:32, borderRight:"1px solid #F3F4F6" }} />)}
                    {milestones.map(m => {
                      const mi = days.indexOf(m.date);
                      if (mi < 0) return null;
                      return <div key={m.id} onClick={()=>{setSelMs(m.id);setSelTask(null)}} style={{ position:"absolute", top:4, left:mi*dw+dw/2, transform:"translateX(-50%)", cursor:"pointer", textAlign:"center", zIndex:3 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#4338CA", whiteSpace:"nowrap" }}>{m.name}</div>
                        <div style={{ fontSize:9, color:"#6366F1", fontFamily:"var(--font-mono)" }}>{fmtDs(m.date)}</div>
                      </div>;
                    })}
                  </div>

                  {/* Chart body with groups */}
                  <div style={{ position:"relative" }}>
                    {/* Milestone vertical lines spanning full height */}
                    {milestones.map(m => {
                      const mi = days.indexOf(m.date);
                      if (mi < 0) return null;
                      return <div key={`ml-${m.id}`} style={{ position:"absolute", top:0, bottom:0, left:mi*dw+dw/2, width:1, background:"#C7D2FE", zIndex:1, pointerEvents:"none" }}>
                        <div style={{ position:"absolute", top:0, width:1, height:"100%", background:"#C7D2FE", borderLeft:"1px dashed #A5B4FC" }} />
                      </div>;
                    })}

                    {/* Today line */}
                    {days.indexOf(tk) >= 0 && (
                      <div style={{ position:"absolute", top:0, bottom:0, width:2, background:"#EF4444", zIndex:4, pointerEvents:"none", left:days.indexOf(tk)*dw+dw/2, opacity:0.6 }} />
                    )}

                    {/* Weekend shading columns */}
                    {days.map((day, di) => {
                      if (!isWe(day)) return null;
                      return <div key={`we-${day}`} style={{ position:"absolute", top:0, bottom:0, left:di*dw, width:dw, background:"rgba(0,0,0,0.02)", zIndex:0, pointerEvents:"none" }} />;
                    })}

                    {/* Group sections with task rows */}
                    {groupNames.map(gName => {
                      const gc = groupColorMap[gName];
                      const gTasks = tasks.filter(t => t.group === gName);
                      return (
                        <div key={gName}>
                          {/* Group header row */}
                          <div style={{ height:28, display:"flex", position:"relative", background:gc.bg, borderBottom:`1px solid ${gc.border}` }}>
                            {days.map(day => <div key={day} style={{ minWidth:dw, width:dw, height:28 }} />)}
                          </div>
                          {/* Task rows */}
                          {gTasks.map(t => {
                            const si = days.indexOf(t.start), ei = days.indexOf(t.end);
                            return (
                              <div key={t.id} style={{ height:32, display:"flex", position:"relative", borderBottom:"1px solid #F3F4F6" }}>
                                {days.map(day => <div key={day} style={{ minWidth:dw, width:dw, height:32 }} />)}
                                {si >= 0 && ei >= 0 && (
                                  <div onClick={()=>{setSelTask(t.id);setSelMs(null)}}
                                    style={{ position:"absolute", height:20, top:6, left:si*dw+2, width:Math.max((ei-si+1)*dw-4,16), borderRadius:10, display:"flex", alignItems:"center", padding:"0 6px", fontSize:9, fontWeight:600, color:gc.text, cursor:"pointer", background:gc.bar, opacity:0.8, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", zIndex:2, transition:"opacity 0.12s" }}
                                    onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.8"}>
                                    {/* Progress fill */}
                                    <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${t.progress}%`, borderRadius:10, background:"rgba(255,255,255,0.4)" }} />
                                    {/* Date label */}
                                    {(ei-si+1)*dw > 80 && <span style={{ position:"relative", zIndex:1 }}>{fmtDs(t.end)}</span>}
                                  </div>
                                )}
                                {/* Milestone dot on task */}
                                {si >= 0 && si === ei && (
                                  <div style={{ position:"absolute", top:10, left:si*dw+dw/2-6, width:12, height:12, borderRadius:"50%", background:gc.bar, border:"2px solid #FFF", zIndex:3 }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    
                    {/* Ungrouped tasks */}
                    {ungrouped.length > 0 && (
                      <div>
                        {groupNames.length > 0 && <div style={{ height:28, display:"flex", background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                          {days.map(day => <div key={day} style={{ minWidth:dw, width:dw, height:28 }} />)}
                        </div>}
                        {ungrouped.map(t => {
                          const si = days.indexOf(t.start), ei = days.indexOf(t.end);
                          return (
                            <div key={t.id} style={{ height:32, display:"flex", position:"relative", borderBottom:"1px solid #F3F4F6" }}>
                              {days.map(day => <div key={day} style={{ minWidth:dw, width:dw, height:32 }} />)}
                              {si >= 0 && ei >= 0 && (
                                <div onClick={()=>{setSelTask(t.id);setSelMs(null)}}
                                  style={{ position:"absolute", height:20, top:6, left:si*dw+2, width:Math.max((ei-si+1)*dw-4,16), borderRadius:10, display:"flex", alignItems:"center", padding:"0 6px", fontSize:9, fontWeight:500, color:"#374151", cursor:"pointer", background:"#D1D5DB", opacity:0.7, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", zIndex:2 }}
                                  onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.7"}>
                                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${t.progress}%`, borderRadius:10, background:"rgba(255,255,255,0.5)" }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </>
            )
          )}

          {/* TIMELINE VIEW */}
          {view === "timeline" && <TimelineView tasks={tasks} milestones={milestones} onSelTask={id=>{setSelTask(id);setSelMs(null)}} onSelMs={id=>{setSelMs(id);setSelTask(null)}} />}

          {/* LIST VIEW */}
          {view === "list" && <ListView tasks={tasks} tk={tk} onSelTask={id=>{setSelTask(id);setSelMs(null)}} />}
        </div>

        {/* DETAIL PANEL */}
        {selTaskObj && (
          <DetailTask task={selTaskObj} members={members} groups={groupNames} onUpdate={updTask} onDelete={delTask} onClose={()=>setSelTask(null)} />
        )}
        {selMsObj && (
          <DetailMs ms={selMsObj} onUpdate={updMs} onDelete={delMs} onClose={()=>setSelMs(null)} />
        )}
      </div>

      {/* MODALS */}
      {showAddTask && <AddTaskModal members={members} groups={groupNames} onAdd={addTask} onClose={()=>setShowAddTask(false)} />}
      {showAddMs && <AddMsModal onAdd={addMilestone} onClose={()=>setShowAddMs(false)} />}
      {showMembers && <MembersModal members={members} createdBy={createdBy} isOwner={isOwner} onAdd={addMember} onRemove={removeMember} onClose={() => setShowMembers(false)} />}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function Stat({ label, value, color }) {
  const bgMap = {
    "var(--green)": "rgba(52,199,123,0.12)",
    "var(--blue)": "rgba(75,139,245,0.12)",
    "var(--red)": "rgba(245,75,94,0.12)",
  };
  return (
    <div style={{ fontFamily:"var(--font-mono)", fontSize:11, padding:"4px 10px", borderRadius:4, display:"flex", alignItems:"center", gap:5, background: bgMap[color] || "var(--surface3)" }}>
      {color && <div style={{ width:6, height:6, borderRadius:"50%", background:color }} />}
      <span style={{ color: color || "var(--text-muted)" }}>{label} {value}</span>
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", color:"var(--text-dim)" }}>
      <div style={{ fontSize:48, marginBottom:12, opacity:0.4 }}>{icon}</div>
      <div style={{ fontSize:18, fontWeight:600, color:"var(--text-muted)" }}>{title}</div>
      <div style={{ fontSize:13, marginTop:4 }}>{sub}</div>
    </div>
  );
}

function TimelineView({ tasks, milestones, onSelTask, onSelMs }) {
  const items = [
    ...tasks.map(t => ({ tp:"t", d:t.start, o:t })),
    ...milestones.map(m => ({ tp:"m", d:m.date, o:m }))
  ].sort((a,b) => (a.d||"").localeCompare(b.d||""));

  if (!items.length) return <Empty icon="▤" title="Tom tidslinje" sub="Tilføj opgaver og milepæle" />;

  return (
    <div style={{ padding:24, maxWidth:800 }}>
      <div style={{ fontSize:24, fontWeight:600, marginBottom:20, letterSpacing:"-0.02em" }}>Tidslinje</div>
      <div style={{ position:"relative", paddingLeft:32, borderLeft:"2px solid var(--border)", marginLeft:12 }}>
        {items.map((it, i) => {
          if (it.tp === "m") {
            const m = it.o, mwe = isWe(m.date);
            return (
              <div key={m.id} style={{ position:"relative", marginBottom:20 }}>
                <div style={{ position:"absolute", left:-39, top:4, width:14, height:14, borderRadius:"50%", border:"2px solid var(--bg)", background:m.color }} />
                <div onClick={()=>onSelMs(m.id)} style={{ background:"rgba(245,197,66,0.08)", border:"1px solid rgba(245,197,66,0.3)", borderRadius:8, padding:"14px 16px", cursor:"pointer" }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>
                    ◆ MILEPÆL · {fmtD(m.date)}{mwe && <span style={{ fontFamily:"var(--font-mono)", fontSize:8, fontWeight:600, padding:"1px 5px", borderRadius:3, background:"rgba(255,255,255,0.05)", color:"var(--text-dim)", marginLeft:4 }}>WEEKEND</span>}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--yellow)" }}>{m.name}</div>
                  {m.desc && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:6, paddingTop:6, borderTop:"1px solid var(--border)", whiteSpace:"pre-wrap" }}>{m.desc}</div>}
                </div>
              </div>
            );
          }
          const t = it.o, ss = SS[t.status], wd = weDays(t.start, t.end), swe = isWe(t.start), ewe = isWe(t.end);
          const dur = t.start && t.end ? Math.max(1, Math.round((toD(t.end)-toD(t.start))/86400000)+1) : 0;
          return (
            <div key={t.id} style={{ position:"relative", marginBottom:20 }}>
              <div style={{ position:"absolute", left:-39, top:4, width:14, height:14, borderRadius:"50%", border:"2px solid var(--bg)", background:t.color }} />
              <div onClick={()=>onSelTask(t.id)} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"14px 16px", cursor:"pointer", transition:"border-color 0.15s" }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>
                  {fmtD(t.start)}{swe && <WeTag />} → {fmtD(t.end)}{ewe && <WeTag />}
                </div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{t.name}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  <span style={{ background:ss.bg, color:ss.c, padding:"2px 8px", borderRadius:3, fontSize:10, fontWeight:600 }}>{t.status}</span>
                  {t.owner && <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>· <span style={{ width:16, height:16, borderRadius:3, background:"var(--accent-soft)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:600, color:"var(--accent)" }}>{t.owner[0].toUpperCase()}</span> {t.owner}</span>}
                  <span>· {t.progress}%</span>
                </div>
                {wd > 0 && <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-dim)", marginTop:6, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:"var(--text-dim)", opacity:0.5 }} />
                  Inkl. {wd} weekenddag{wd>1?"e":""} af {dur} dage total
                </div>}
                {t.desc && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:6, paddingTop:6, borderTop:"1px solid var(--border)", whiteSpace:"pre-wrap" }}>{t.desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeTag() {
  return <span style={{ fontFamily:"var(--font-mono)", fontSize:8, fontWeight:600, padding:"1px 5px", borderRadius:3, background:"rgba(255,255,255,0.05)", color:"var(--text-dim)", marginLeft:4 }}>WEEKEND</span>;
}

function ListView({ tasks, tk, onSelTask }) {
  if (!tasks.length) return <Empty icon="☰" title="Ingen opgaver" sub="Klik &quot;+ Opgave&quot; for at komme i gang" />;
  return (
    <div style={{ padding:"20px 24px" }}>
      {STS.map(status => {
        const filtered = tasks.filter(t => t.status === status);
        if (!filtered.length) return null;
        const ss = SS[status];
        return (
          <div key={status} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:ss.c }} />
              <span style={{ fontSize:13, fontWeight:600, color:ss.c }}>{status}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-dim)" }}>{filtered.length}</span>
            </div>
            {filtered.map(t => {
              const isOv = t.end < tk && t.status !== "Afsluttet";
              return (
                <div key={t.id} onClick={()=>onSelTask(t.id)}
                  style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"12px 16px", marginBottom:6, display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"border-color 0.12s" }}>
                  <div style={{ width:4, height:32, borderRadius:2, background:t.color, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.name}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:4 }}>{fmtDs(t.start)} → {fmtDs(t.end)}{t.owner && <><span style={{ width:16, height:16, borderRadius:3, background:"var(--accent-soft)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:600, color:"var(--accent)", marginLeft:4 }}>{t.owner[0].toUpperCase()}</span> {t.owner}</>}</div>
                    {t.desc && <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:300 }}>{t.desc}</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    {isOv && <span style={{ fontSize:9, fontWeight:700, color:"var(--red)", fontFamily:"var(--font-mono)" }}>FORSINKET</span>}
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:600, color:PC[t.priority] }}>{t.priority}</span>
                    <div style={{ width:48, height:6, background:"var(--surface3)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${t.progress}%`, height:"100%", background:t.color, borderRadius:3 }} />
                    </div>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-dim)" }}>{t.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DetailTask({ task: t, members, groups, onUpdate, onDelete, onClose }) {
  const ss = SS[t.status];
  const wd = weDays(t.start, t.end);
  const dur = t.start && t.end ? Math.max(1, Math.round((toD(t.end)-toD(t.start))/86400000)+1) : 0;
  const [name, setName] = useState(t.name);
  const [desc, setDesc] = useState(t.desc);
  const [newGroup, setNewGroup] = useState("");
  useEffect(() => { setName(t.name); setDesc(t.desc); }, [t.id]);

  return (
    <div style={{ width:460, minWidth:460, background:"var(--surface)", borderLeft:"1px solid var(--border)", overflowY:"auto", flexShrink:0, animation:"slideIn 0.2s ease" }}>
      <div style={{ padding:20, borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:t.color }} />
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)" }}>Rediger opgave</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button className="btn btn-danger btn-sm" onClick={()=>onDelete(t.id)}>Slet</button>
          <button className="btn btn-dark btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ padding:20 }}>
        <Field label="Opgavenavn">
          <input className="fl-input" style={{ fontSize:15, fontWeight:600 }} value={name} onChange={e=>{setName(e.target.value);onUpdate(t.id,"name",e.target.value)}} />
        </Field>
        <Field label="Gruppe">
          <div style={{ display:"flex", gap:6 }}>
            <select className="fl-select" value={t.group || ""} onChange={e=>onUpdate(t.id,"group",e.target.value)} style={{ flex:1 }}>
              <option value="">Ingen gruppe</option>
              {(groups || []).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input className="fl-input" value={newGroup} onChange={e=>setNewGroup(e.target.value)} placeholder="Ny gruppe..." style={{ width:120 }}
              onKeyDown={e => { if(e.key==="Enter" && newGroup.trim()) { onUpdate(t.id,"group",newGroup.trim()); setNewGroup(""); }}} />
          </div>
        </Field>
        <Field label="Kort beskrivelse">
          <textarea className="fl-textarea" placeholder="Beskriv opgavens indhold, formål og leverancer..." value={desc} onChange={e=>{setDesc(e.target.value);onUpdate(t.id,"desc",e.target.value)}} />
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <Field label="Status">
            <select className="fl-select" style={{ borderColor:ss.c, borderWidth:2 }} value={t.status} onChange={e=>onUpdate(t.id,"status",e.target.value)}>
              {STS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Prioritet">
            <select className="fl-select" style={{ borderColor:PC[t.priority], borderWidth:2 }} value={t.priority} onChange={e=>onUpdate(t.id,"priority",e.target.value)}>
              {PRI.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <Field label="Startdato"><input type="date" className="fl-input" value={t.start} onChange={e=>onUpdate(t.id,"start",e.target.value)} /></Field>
          <Field label="Slutdato"><input type="date" className="fl-input" value={t.end} onChange={e=>onUpdate(t.id,"end",e.target.value)} /></Field>
        </div>
        <Field label="Tildelt til">
          <select className="fl-select" value={t.owner} onChange={e=>onUpdate(t.id,"owner",e.target.value)}>
            <option value="">Ikke tildelt</option>
            {(members || []).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {t.owner && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, padding:"6px 10px", background:"var(--surface2)", borderRadius:6 }}>
              <div style={{ width:24, height:24, borderRadius:5, background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600, color:"var(--accent)" }}>{t.owner[0].toUpperCase()}</div>
              <span style={{ fontSize:12, color:"var(--text)" }}>{t.owner}</span>
            </div>
          )}
        </Field>
        <Field label={<>Fremgang — <span style={{ color:"var(--accent)", fontFamily:"var(--font-mono)" }}>{t.progress}%</span></>}>
          <input type="range" min={0} max={100} step={5} value={t.progress} style={{ accentColor:t.color }} onChange={e=>onUpdate(t.id,"progress",parseInt(e.target.value))} />
        </Field>
        <Field label="Farve">
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {TC.map(c => <div key={c} onClick={()=>onUpdate(t.id,"color",c)} style={{ width:28, height:28, borderRadius:6, background:c, cursor:"pointer", border:`2px solid ${t.color===c?"#FFF":"transparent"}`, transition:"all 0.12s" }} />)}
          </div>
        </Field>
        <div style={{ marginTop:8, paddingTop:14, borderTop:"1px solid var(--border)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-dim)" }}>
          Varighed: {dur} dage{wd > 0 && ` · heraf ${wd} weekenddag${wd>1?"e":""}`}
          {t.createdBy && <> · oprettet af {t.createdBy}</>}
        </div>
        <button className="btn btn-accent" onClick={onClose} style={{ width:"100%", marginTop:16, padding:"10px 14px", fontSize:14 }}>✓ Færdig</button>
      </div>
    </div>
  );
}

function DetailMs({ ms: m, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState(m.name);
  const [desc, setDesc] = useState(m.desc);
  useEffect(() => { setName(m.name); setDesc(m.desc); }, [m.id]);

  return (
    <div style={{ width:460, minWidth:460, background:"var(--surface)", borderLeft:"1px solid var(--border)", overflowY:"auto", flexShrink:0, animation:"slideIn 0.2s ease" }}>
      <div style={{ padding:20, borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ color:"var(--yellow)", fontSize:14 }}>◆</span>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)" }}>Rediger milepæl</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button className="btn btn-danger btn-sm" onClick={()=>onDelete(m.id)}>Slet</button>
          <button className="btn btn-dark btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ padding:20 }}>
        <Field label="Milepælsnavn">
          <input className="fl-input" style={{ fontSize:15, fontWeight:600 }} value={name} onChange={e=>{setName(e.target.value);onUpdate(m.id,"name",e.target.value)}} />
        </Field>
        <Field label="Dato">
          <input type="date" className="fl-input" value={m.date} onChange={e=>onUpdate(m.id,"date",e.target.value)} />
        </Field>
        <Field label="Beskrivelse">
          <textarea className="fl-textarea" placeholder="Beskriv milepælen..." value={desc} onChange={e=>{setDesc(e.target.value);onUpdate(m.id,"desc",e.target.value)}} />
        </Field>
        <button className="btn btn-accent" onClick={onClose} style={{ width:"100%", marginTop:4, padding:"10px 14px", fontSize:14 }}>✓ Færdig</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

function AddTaskModal({ members, groups, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState(td());
  const [end, setEnd] = useState(addD(td(),7));
  const [owner, setOwner] = useState("");
  const [group, setGroup] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const finalGroup = newGroup.trim() || group;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:460, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Ny opgave</div>
        <Field label="Opgavenavn"><input ref={ref} className="fl-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Hvad skal laves?" onKeyDown={e=>e.key==="Enter"&&onAdd(name,start,end,desc,owner,finalGroup)} /></Field>
        <Field label="Gruppe">
          <div style={{ display:"flex", gap:6 }}>
            <select className="fl-select" value={group} onChange={e=>setGroup(e.target.value)} style={{ flex:1 }}>
              <option value="">Ingen gruppe</option>
              {(groups || []).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input className="fl-input" value={newGroup} onChange={e=>setNewGroup(e.target.value)} placeholder="Ny..." style={{ width:100 }} />
          </div>
        </Field>
        <Field label="Kort beskrivelse"><textarea className="fl-textarea" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Beskriv opgaven..." rows={2} /></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <Field label="Start"><input type="date" className="fl-input" value={start} onChange={e=>setStart(e.target.value)} /></Field>
          <Field label="Slut"><input type="date" className="fl-input" value={end} onChange={e=>setEnd(e.target.value)} /></Field>
        </div>
        <Field label="Tildel til">
          <select className="fl-select" value={owner} onChange={e=>setOwner(e.target.value)}>
            <option value="">Ikke tildelt</option>
            {(members || []).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="btn btn-dark" onClick={onClose}>Annuller</button>
          <button className="btn btn-accent" onClick={()=>onAdd(name,start,end,desc,owner,finalGroup)}>Tilføj</button>
        </div>
      </div>
    </div>
  );
}

function AddMsModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(td());
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:460, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Ny milepæl</div>
        <Field label="Milepælsnavn"><input ref={ref} className="fl-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Hvad markerer denne milepæl?" onKeyDown={e=>e.key==="Enter"&&onAdd(name,date)} /></Field>
        <Field label="Dato"><input type="date" className="fl-input" value={date} onChange={e=>setDate(e.target.value)} /></Field>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button className="btn btn-dark" onClick={onClose}>Annuller</button>
          <button className="btn btn-accent" onClick={()=>onAdd(name,date)}>Tilføj</button>
        </div>
      </div>
    </div>
  );
}
