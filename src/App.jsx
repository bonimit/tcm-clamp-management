import React, { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   TCM · CLAMP MANAGEMENT — Corporate Dark
   Mirrors the original GC tool's IA & functions:
   Dashboard / Map / Online leak sealing request /
   Monitoring Schedule / Permanent repairs / Clamp inventory
   + AI Assist (predictive layer, Claude API).
   Type: IBM Plex Sans + IBM Plex Mono. Token system inspired
   by IBM Carbon dark (g100) — precise, enterprise, restrained.
   All custom values inline (no Tailwind compiler in artifacts).
   ============================================================ */

const T = {
  bg0: "#0D1117",       // canvas
  bg1: "#141A22",       // layer 01 — panels
  bg2: "#1B2330",       // layer 02 — raised / hover
  bg3: "#232D3D",       // fields, chips
  line: "#26303E",
  line2: "#354153",
  text: "#E7EDF4",
  dim: "#93A1B3",
  faint: "#5D6B7E",
  blue: "#F2F4F8",      // corporate primary — monochrome ink (was blue), bright on this dark canvas
  blueSoft: "#C7CFDA",
  blueDim: "rgba(255,255,255,0.07)",
  yellow: "#F1C21B",    // draft / on-plan
  orange: "#FF832B",    // approvals
  red: "#FA4D56",       // overdue / extreme
  green: "#42BE65",     // good / installed
  teal: "#3DDBD9",
  sans: "'IBM Plex Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: ${T.bg0}; }
::-webkit-scrollbar-thumb { background: ${T.line2}; border-radius: 5px; border: 2px solid ${T.bg0}; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes ping { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(2.1); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid ${T.blue}; outline-offset: 2px; }
select option { background: ${T.bg2}; color: ${T.text}; }
input::placeholder { color: ${T.faint}; }
`;

/* ---------------- DATA ---------------- */

const PLANTS = ["GC2", "GC5", "GC6", "GC7", "GC10", "GC13"];

const REQUESTS = [
  { no: "A-P1-2026/128", plant: "GC6",  unit: "250", fluid: "Hydrocarbon (C6 – C9)", risk: "Very Low", status: "Draft",                tag: 'Valve – 458-H3#10', photos: "083/5469", ai: 12, pin: { n: 1, x: 452, y: 198 } },
  { no: "A-P1-2026/131", plant: "GC6",  unit: "432", fluid: "Hydrocarbon (> C9)",    risk: "Very Low", status: "VP approval",          tag: 'Valve – 469-169#06', photos: "065/1469", ai: 18, pin: { n: 2, x: 322, y: 318 } },
  { no: "A-P2-2026/145", plant: "GC6",  unit: "910", fluid: "Hydrocarbon (> C9)",    risk: "Medium",   status: "Waiting installation", tag: 'Valve – 432-L5#12', photos: "085/2498", ai: 46, pin: { n: 3, x: 528, y: 398 } },
  { no: "A-Q1-2026/152", plant: "GC6",  unit: "325", fluid: "Hydrogen (H2)",         risk: "Low",      status: "Design approval",      tag: 'Valve – 447-H2#04', photos: "082/3153", ai: 31, pin: { n: 4, x: 196, y: 436 } },
  { no: "A-P1-2026/136", plant: "GC11", unit: "275", fluid: "Hydrocarbon (C6 – C9)", risk: "Low",      status: "Design approval",      tag: 'Line – 2" CM940005-MS-11', photos: "014/0231", ai: 28 },
  { no: "A-P1-2026/139", plant: "GC9",  unit: "431", fluid: "Other Utilities (N2, Air)", risk: "High", status: "VP approval",          tag: 'Flange – 318-F2#08', photos: "041/1104", ai: 64 },
  { no: "A-P1-2026/141", plant: "GC2",  unit: "850", fluid: "Steam",                 risk: "High",     status: "Design approval",      tag: 'Elbow – 500-AT-227', photos: "096/2210", ai: 71 },
  { no: "A-P1-2026/143", plant: "GC7",  unit: "250", fluid: "Chemical",              risk: "Extreme",  status: "Design approval",      tag: 'Tee – 118-C4#02', photos: "121/3320", ai: 88 },
  { no: "A-P1-2026/144", plant: "GC8",  unit: "431", fluid: "Other Utilities (N2, Air)", risk: "Extreme", status: "Design approval",   tag: 'Valve – 227-N1#09', photos: "038/0980", ai: 83 },
  { no: "A-P1-2026/119", plant: "GC5",  unit: "275", fluid: "Hydrocarbon (C6 – C9)", risk: "Medium",   status: "Installed",            tag: 'Line – MP Steam condensate', photos: "112/4110", ai: 22 },
  { no: "A-P1-2026/122", plant: "GC13", unit: "910", fluid: "Hydrocarbon (> C9)",    risk: "Medium",   status: "Draft",                tag: 'Valve – 391-H6#01', photos: "009/0114", ai: 35 },
  { no: "A-P1-2026/125", plant: "GC10", unit: "432", fluid: "Hydrogen (H2)",         risk: "Low",      status: "Draft",                tag: 'Flange – 402-H2#11', photos: "027/0650", ai: 26 },
];

const STATUS = {
  "Draft":                { c: T.dim,    bg: "rgba(147,161,179,0.14)" },
  "Design approval":      { c: T.orange, bg: "rgba(255,131,43,0.14)" },
  "VP approval":          { c: "#FFB784", bg: "rgba(255,131,43,0.22)" },
  "Waiting installation": { c: T.yellow, bg: "rgba(241,194,27,0.13)" },
  "Installed":            { c: T.green,  bg: "rgba(66,190,101,0.13)" },
};

const RISK = {
  "Very Low": T.teal, "Low": T.green, "Medium": T.yellow, "High": T.orange, "Extreme": T.red,
};

const MONITORING = [
  { no: "A-P1-2026/128", method: "VOC check", freq: "Bi-weekly", last: "Good condition", next: "14/07/2026", status: "On plan" },
  { no: "A-P1-2026/131", method: "VOC check", freq: "Bi-weekly", last: "Good condition", next: "14/07/2026", status: "On plan" },
  { no: "A-P1-2026/119", method: "IR thermography", freq: "Weekly", last: "Weep at gasket edge", next: "11/07/2026", status: "Overdue" },
  { no: "A-P2-2026/145", method: "VOC check", freq: "Bi-weekly", last: "Good condition", next: "18/07/2026", status: "On plan" },
  { no: "A-Q1-2026/152", method: "H2 sniff test", freq: "Weekly", last: "Good condition", next: "17/07/2026", status: "Due today" },
  { no: "A-P1-2026/141", method: "UT thickness (4 pts)", freq: "Monthly", last: "0.2 mm loss vs. baseline", next: "12/07/2026", status: "Overdue" },
  { no: "A-P1-2026/143", method: "VOC check", freq: "Weekly", last: "Good condition", next: "19/07/2026", status: "On plan" },
  { no: "A-P1-2026/136", method: "VOC check", freq: "Bi-weekly", last: "Good condition", next: "22/07/2026", status: "On plan" },
  { no: "A-P1-2026/139", method: "Vibration trend", freq: "Weekly", last: "+12% WoW", next: "17/07/2026", status: "Due today" },
  { no: "A-P1-2026/125", method: "VOC check", freq: "Bi-weekly", last: "Good condition", next: "24/07/2026", status: "On plan" },
];

const MON_STATUS = {
  "On plan":  { c: T.yellow, bg: "rgba(241,194,27,0.13)" },
  "Due today":{ c: T.blueSoft, bg: T.blueDim },
  "Overdue":  { c: T.red, bg: "rgba(250,77,86,0.14)" },
};

const INVENTORY = [
  { size: '2" – 4"', type: "Bolt-on enclosure", store: "S-2 · Bin 08–14", total: 64, avail: 38, reserved: 12, level: 0.59 },
  { size: '6" – 8"', type: "Bolt-on enclosure", store: "S-2 · Bin 15–19", total: 30, avail: 9,  reserved: 6,  level: 0.30 },
  { size: '10" – 12"', type: "Split-sleeve",    store: "S-4 · Bin 02–05", total: 14, avail: 3,  reserved: 2,  level: 0.21 },
  { size: '14" +',   type: "Engineered (custom)", store: "S-4 · Bin 06",  total: 6,  avail: 1,  reserved: 1,  level: 0.17 },
  { size: "Sealant", type: "Injection compound (kg)", store: "S-2 · Cabinet A", total: 120, avail: 74, reserved: 20, level: 0.62 },
];

/* ---------------- PRIMITIVES ---------------- */

const Panel = ({ children, style, pad = 20 }) => (
  <div style={{ background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 8, padding: pad, ...style }}>{children}</div>
);

const Eyebrow = ({ children, color = T.faint }) => (
  <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.12em", color, textTransform: "uppercase" }}>{children}</div>
);

const Chip = ({ c, bg, children }) => (
  <span style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, color: c, background: bg, borderRadius: 999, padding: "4px 11px", whiteSpace: "nowrap" }}>{children}</span>
);

const Th = ({ children, style }) => (
  <th style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.1em", color: T.faint, textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${T.line}`, fontWeight: 400, ...style }}>{children}</th>
);
const Td = ({ children, style }) => (
  <td style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, padding: "13px 16px", borderBottom: `1px solid ${T.line}`, ...style }}>{children}</td>
);

const BtnPrimary = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: "#0B1220", background: T.blue, border: "none", borderRadius: 6, padding: "10px 18px", cursor: "pointer", ...style }}>{children}</button>
);
const BtnGhost = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{ fontFamily: T.sans, fontSize: 13, color: T.text, background: T.bg3, border: `1px solid ${T.line2}`, borderRadius: 6, padding: "10px 18px", cursor: "pointer", ...style }}>{children}</button>
);

const Field = ({ label, children }) => (
  <div>
    <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.faint, marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);
const inputStyle = { width: "100%", fontFamily: T.sans, fontSize: 13, color: T.text, background: T.bg3, border: `1px solid ${T.line2}`, borderRadius: 6, padding: "10px 12px" };

/* ---------------- SIDEBAR ---------------- */

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "map", label: "Map" },
  { id: "requests", label: "Online leak sealing request" },
  { id: "monitoring", label: "Monitoring Schedule" },
  { id: "repairs", label: "Permanent repairs" },
  { id: "inventory", label: "Clamp inventory" },
  { id: "assist", label: "AI Assist" },
];

function Sidebar({ view, setView }) {
  return (
    <div style={{ width: 232, flexShrink: 0, background: T.bg1, borderRight: `1px solid ${T.line}`, display: "flex", flexDirection: "column", padding: "20px 0" }}>
      <div style={{ padding: "0 22px 20px", borderBottom: `1px solid ${T.line}`, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <path d="M15 3 C10 9 7 12.5 7 17.5 A8 8 0 0 0 23 17.5 C23 12.5 20 9 15 3 Z" fill={T.blue} />
            <path d="M15 9 C12.5 12.4 11 14.6 11 17.6 A4 4 0 0 0 19 17.6 C19 14.6 17.5 12.4 15 9 Z" fill={T.bg1} />
          </svg>
          <div>
            <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 15.5, color: T.text, letterSpacing: "-0.01em" }}>TCM Clamp Management</div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.faint, letterSpacing: "0.1em", marginTop: 2 }}>GC · MAP TA PHUT COMPLEX</div>
          </div>
        </div>
      </div>
      {NAV.map((n) => {
        const on = view === n.id;
        return (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
            background: on ? T.blueDim : "transparent", border: "none",
            borderLeft: `3px solid ${on ? T.blue : "transparent"}`,
            color: on ? T.text : T.dim, fontFamily: T.sans, fontSize: 13.5, fontWeight: on ? 600 : 450,
            padding: "11px 20px", cursor: "pointer",
          }}>
            {n.label}
            {n.id === "assist" && <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 9, color: T.blueSoft, border: `1px solid ${T.blue}55`, borderRadius: 4, padding: "2px 6px", letterSpacing: "0.08em" }}>AI</span>}
          </button>
        );
      })}
      <div style={{ marginTop: "auto", padding: "16px 22px 2px", borderTop: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.bg3, border: `1px solid ${T.line2}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.blueSoft }}>BO</div>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.text }}>Bo · Operations</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.faint }}>Branch 6 (GC6): Refinery</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- TOP BAR ---------------- */

function TopBar({ title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: `1px solid ${T.line}`, background: T.bg1 }}>
      <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 19, color: T.text, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>FRI 17 JUL 2026 · 09:42</span>
        {right}
      </div>
    </div>
  );
}

function PlantSelect() {
  return (
    <select defaultValue="all" style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: T.text, background: T.bg3, border: `1px solid ${T.line2}`, borderRadius: 6, padding: "8px 12px" }}>
      <option value="all">ALL PLANTS</option>
      {PLANTS.map((p) => <option key={p}>{p}</option>)}
    </select>
  );
}

/* ---------------- DASHBOARD ---------------- */

function KPI({ value, label, sub, subColor }) {
  return (
    <Panel style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 32, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.dim, marginTop: 8 }}>{label}</div>
      {sub && <div style={{ fontFamily: T.mono, fontSize: 11, color: subColor || T.faint, marginTop: 6 }}>{sub}</div>}
    </Panel>
  );
}

function ChartCard({ title, right, children, style }) {
  return (
    <Panel style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.text }}>{title}</div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.blueSoft, letterSpacing: "0.08em", cursor: "pointer" }}>{right || "YEAR ▾"}</div>
      </div>
      {children}
    </Panel>
  );
}

function PredictionChart() {
  const W = 620, H = 190;
  const installed = [330, 465, 355, 490, 480, 300, 465, 270, 660];
  const predicted = [130, 215, 255, 160, 480, 630, 165, 605, 370];
  const labels = ["Jan 1", "Jan 7", "Jan 14", "Jan 21", "Jan 28", "Feb 4", "Feb 11", "Feb 18", "Feb 25"];
  const max = 800, step = W / (installed.length - 1);
  const y = (v) => H - (v / max) * H;
  const path = (arr) => arr.map((v, i) => `${i ? "L" : "M"}${i * step},${y(v)}`).join(" ");
  return (
    <svg viewBox={`-34 -8 ${W + 44} ${H + 40}`} style={{ width: "100%", display: "block" }}>
      {[200, 400, 600, 800].map((g) => (
        <g key={g}>
          <line x1="0" x2={W} y1={y(g)} y2={y(g)} stroke={T.line} strokeDasharray="2 5" />
          <text x="-8" y={y(g) + 3} fill={T.faint} fontSize="9.5" fontFamily={T.mono} textAnchor="end">{g}</text>
        </g>
      ))}
      {/* AI forecast band on last segment */}
      <rect x={step * 7} y="0" width={step * 2} height={H} fill={T.blue} opacity="0.06" />
      <text x={step * 8} y="12" fill={T.blueSoft} fontSize="9.5" fontFamily={T.mono} textAnchor="middle" letterSpacing="1">AI FORECAST</text>
      <path d={path(installed)} fill="none" stroke={T.blueSoft} strokeWidth="1.8" />
      <path d={path(predicted)} fill="none" stroke={T.teal} strokeWidth="1.8" strokeDasharray="1 0" opacity="0.85" />
      {installed.map((v, i) => <circle key={"a" + i} cx={i * step} cy={y(v)} r="2.6" fill={T.bg1} stroke={T.blueSoft} strokeWidth="1.4" />)}
      {predicted.map((v, i) => <circle key={"b" + i} cx={i * step} cy={y(v)} r="2.6" fill={T.bg1} stroke={T.teal} strokeWidth="1.4" />)}
      {labels.map((l, i) => <text key={l} x={i * step} y={H + 20} fill={T.faint} fontSize="9.5" fontFamily={T.mono} textAnchor="middle">{l}</text>)}
    </svg>
  );
}

function ScatterChart() {
  const W = 300, H = 170;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const pts = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  days.forEach((_, d) => { for (let i = 0; i < 5; i++) pts.push({ d, v: 60 + rnd() * 420, big: d === 2 && i === 2 }); });
  const y = (v) => H - (v / 500) * H;
  const x = (d) => 24 + d * ((W - 40) / 6);
  return (
    <svg viewBox={`-30 -6 ${W + 40} ${H + 36}`} style={{ width: "100%", display: "block" }}>
      {[100, 200, 300, 400, 500].map((g) => (
        <g key={g}>
          <line x1="0" x2={W} y1={y(g)} y2={y(g)} stroke={T.line} strokeDasharray="2 5" />
          <text x="-8" y={y(g) + 3} fill={T.faint} fontSize="9.5" fontFamily={T.mono} textAnchor="end">{g}</text>
        </g>
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={x(p.d) + (i % 5) * 7 - 14} cy={y(p.v)} r={p.big ? 5 : 2.6}
          fill={p.big ? T.blue : (i % 2 ? T.blueSoft : T.teal)} opacity={p.big ? 1 : 0.75} />
      ))}
      {days.map((l, i) => <text key={l} x={x(i)} y={H + 18} fill={T.faint} fontSize="9.5" fontFamily={T.mono} textAnchor="middle">{l}</text>)}
    </svg>
  );
}

function PlantBars() {
  const W = 620, H = 180;
  const data = [[1900, 1050], [950, 0], [1350, 1200], [2200, 1100], [1640, 1130], [1650, 1140], [1620, 1150], [1660, 1150], [1650, 1180]];
  const labels = ["GC2", "GC3", "GC5", "GC6", "GC7", "GC8", "GC9", "GC10", "GC13"];
  const max = 2500, gw = W / data.length;
  const y = (v) => H - (v / max) * H;
  return (
    <svg viewBox={`-38 -6 ${W + 48} ${H + 36}`} style={{ width: "100%", display: "block" }}>
      {[1000, 1500, 2000, 2500].map((g) => (
        <g key={g}>
          <line x1="0" x2={W} y1={y(g)} y2={y(g)} stroke={T.line} strokeDasharray="2 5" />
          <text x="-8" y={y(g) + 3} fill={T.faint} fontSize="9.5" fontFamily={T.mono} textAnchor="end">{g}</text>
        </g>
      ))}
      {data.map(([a, b], i) => (
        <g key={i}>
          <rect x={i * gw + gw / 2 - 16} y={y(a)} width="13" height={H - y(a)} rx="2" fill={T.blue} />
          {b > 0 && <rect x={i * gw + gw / 2 + 1} y={y(b)} width="13" height={H - y(b)} rx="2" fill={T.teal} opacity="0.8" />}
          <text x={i * gw + gw / 2} y={H + 18} fill={T.faint} fontSize="9.5" fontFamily={T.mono} textAnchor="middle">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function ChemDonut() {
  const segs = [
    { label: "Hydrogen (H2)", v: 14, c: "#A6C8FF" },
    { label: "Steam", v: 22, c: T.blue },
    { label: "Hydrocarbon (> C9)", v: 38, c: "#33B1FF" },
    { label: "Hydrocarbon (C1 – C5)", v: 26, c: T.teal },
  ];
  const total = segs.reduce((s, x) => s + x.v, 0);
  let acc = 0;
  const R = 62, C = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <svg viewBox="0 0 160 160" style={{ width: 150, flexShrink: 0 }}>
        {segs.map((s) => {
          const frac = s.v / total, off = acc; acc += frac;
          return <circle key={s.label} cx="80" cy="80" r={R} fill="none" stroke={s.c} strokeWidth="22"
            strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-off * C} transform="rotate(-90 80 80)" />;
        })}
        <text x="80" y="76" fill={T.text} fontSize="19" fontWeight="600" fontFamily={T.sans} textAnchor="middle">945</text>
        <text x="80" y="93" fill={T.faint} fontSize="9" fontFamily={T.mono} textAnchor="middle" letterSpacing="1">CLAMPS</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {segs.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.c, flexShrink: 0 }} />
            <span style={{ fontFamily: T.sans, fontSize: 12, color: T.dim }}>{s.label}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.faint, marginLeft: "auto", paddingLeft: 14 }}>{s.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ setView }) {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      {/* AI insight strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: `linear-gradient(90deg, ${T.blueDim}, transparent 70%)`, border: `1px solid ${T.blue}44`, borderRadius: 8, padding: "12px 18px" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue, animation: "blink 2.2s infinite", flexShrink: 0 }} />
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text }}>
          <b>AI Assist:</b> Leak-likelihood model flags <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.blueSoft }}>A-P1-2026/143</span> (Extreme, GC7 Chemical) and 2 overdue monitoring items. Predicted clamp demand for August exceeds 10″+ stock — 1 unit remaining.
        </div>
        <button onClick={() => setView("assist")} style={{ marginLeft: "auto", fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.blueSoft, background: "transparent", border: `1px solid ${T.blue}66`, borderRadius: 6, padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>Open AI Assist</button>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <KPI value="945" label="Total active clamps" sub="▲ 12 this month" />
        <KPI value="223" label="Recycled clamps" sub="Return rate 96%" subColor={T.green} />
        <KPI value="121" label="Clamp repairs · GC5" sub="Avg cycle 4.1 d" />
        <KPI value="103" label="Clamp repairs · GC6" sub="Avg cycle 3.8 d" subColor={T.green} />
        <KPI value="156" label="Clamp repairs · GC7" sub="2 overdue" subColor={T.red} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16 }}>
        <ChartCard title="Clamp prediction">
          <PredictionChart />
          <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
            <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.dim }}><span style={{ color: T.blueSoft }}>—</span> Installed</span>
            <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.dim }}><span style={{ color: T.teal }}>—</span> Predicted leak reports</span>
          </div>
        </ChartCard>
        <ChartCard title="Compare data" right="SORT BY ▾">
          <ScatterChart />
        </ChartCard>
        <ChartCard title="GC Plant comparison">
          <PlantBars />
          <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
            <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.dim }}><span style={{ color: T.blue }}>■</span> Installed 2026</span>
            <span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.dim }}><span style={{ color: T.teal }}>■</span> Removed 2026</span>
          </div>
        </ChartCard>
        <ChartCard title="Chemical" right="SORT BY ▾">
          <ChemDonut />
        </ChartCard>
      </div>
    </div>
  );
}

/* ---------------- ONLINE LEAK SEALING REQUEST ---------------- */

function Requests({ openCreate, toast }) {
  const [tab, setTab] = useState("All reports");
  const [q, setQ] = useState("");
  const tabs = ["All reports", "Draft", "Design approval", "VP approval", "Waiting installation"];
  const counts = {
    "Draft": REQUESTS.filter((r) => r.status === "Draft").length,
    "Design approval": REQUESTS.filter((r) => r.status === "Design approval").length,
    "VP approval": REQUESTS.filter((r) => r.status === "VP approval").length,
    "Waiting installation": REQUESTS.filter((r) => r.status === "Waiting installation").length,
  };
  const rows = REQUESTS.filter((r) =>
    (tab === "All reports" || r.status === tab) &&
    (r.no + r.plant + r.fluid + r.tag).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      {/* pipeline */}
      <div style={{ display: "flex", gap: 14 }}>
        {Object.entries(counts).map(([k, v], i) => (
          <Panel key={k} style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderColor: tab === k ? T.blue + "66" : T.line }} pad={18}>
            <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 28, color: T.text }}>{v}</span>
            <span onClick={() => setTab(k)} style={{ fontFamily: T.sans, fontSize: 12.5, color: T.dim, lineHeight: 1.35 }}>{k === "Draft" ? "Draft reports" : k === "Waiting installation" ? "Waiting for installation" : `Waiting for ${k.toLowerCase()}`}</span>
            {i < 3 && <span style={{ marginLeft: "auto", color: T.faint }}>→</span>}
          </Panel>
        ))}
      </div>

      <Panel style={{ borderColor: T.blue + "44" }}>
        <Eyebrow color={T.blueSoft}>AI prioritization</Eyebrow>
        <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.text, lineHeight: 1.6, marginTop: 8 }}>
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.blueSoft }}>A-P1-2026/143</span> ranks highest across the pipeline — AI leak score 88, Extreme risk, Chemical service at GC7. Model recommends fast-tracking design approval ahead of the two High-risk items below it.
        </div>
        <button onClick={() => { setTab("Design approval"); setQ("A-P1-2026/143"); toast?.("Pipeline sorted to surface A-P1-2026/143 for review."); }} style={{ marginTop: 12, fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: "#0B1220", background: T.blue, border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer" }}>Review flagged report</button>
      </Panel>

      <Panel pad={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${T.line}` }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search report, plant, fluid, or tag…" style={{ ...inputStyle, maxWidth: 320 }} />
          <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                fontFamily: T.sans, fontSize: 12.5, fontWeight: tab === t ? 600 : 450,
                color: tab === t ? "#0B1220" : T.dim, background: tab === t ? T.blue : "transparent",
                border: "none", borderRadius: 999, padding: "7px 14px", cursor: "pointer",
              }}>{t}</button>
            ))}
          </div>
          <button onClick={openCreate} style={{ marginLeft: "auto", fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: "#0B1220", background: T.green, border: "none", borderRadius: 6, padding: "9px 16px", cursor: "pointer" }}>CREATE REQUEST</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <Th style={{ width: 40 }}><input type="checkbox" aria-label="Select all" /></Th>
            <Th>Report No.</Th><Th>Plant</Th><Th>Unit</Th><Th>Fluid type</Th><Th>Risk</Th><Th>AI leak score</Th><Th>Status</Th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bg2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Td><input type="checkbox" aria-label={`Select ${r.no}`} /></Td>
                <Td style={{ fontFamily: T.mono, fontSize: 12.5, color: T.text }}>{r.no}</Td>
                <Td>{r.plant}</Td>
                <Td style={{ fontFamily: T.mono, fontSize: 12.5 }}>{r.unit}</Td>
                <Td>{r.fluid}</Td>
                <Td><span style={{ color: RISK[r.risk], fontWeight: 500 }}>{r.risk}</span></Td>
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: T.bg3, borderRadius: 2 }}>
                      <div style={{ width: `${r.ai}%`, height: "100%", background: r.ai >= 70 ? T.red : r.ai >= 40 ? T.orange : T.teal, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 11.5, color: r.ai >= 70 ? T.red : T.dim }}>{r.ai}</span>
                  </div>
                </Td>
                <Td><Chip c={STATUS[r.status].c} bg={STATUS[r.status].bg}>{r.status}</Chip></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/* ---------------- CREATE REQUEST MODAL ---------------- */

function CreateModal({ onClose, toast }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,9,13,0.68)", zIndex: 60 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 760, maxHeight: "88vh", overflowY: "auto", background: T.bg1, border: `1px solid ${T.line2}`, borderRadius: 10, zIndex: 70, padding: 28, animation: "fadeUp .2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 17, color: T.text }}>Online leak sealing request</div>
          <button onClick={onClose} aria-label="Close" style={{ background: T.bg3, border: `1px solid ${T.line2}`, borderRadius: 6, color: T.dim, width: 30, height: 30, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Eyebrow color={T.blueSoft}>Plant information</Eyebrow>
            <Field label="Location">
              <select style={inputStyle} defaultValue="gc5"><option value="gc5">Branch 5 (GC5): Aromatics 2 Plant</option><option>Branch 6 (GC6): Refinery</option></select>
            </Field>
            <Field label="Plant VP"><input style={inputStyle} defaultValue="Pratit Sirivarin" /></Field>
            <Field label="Unit"><select style={inputStyle} defaultValue="275"><option>275</option><option>250</option><option>431</option></select></Field>

            <Eyebrow color={T.blueSoft}>Risk assessment</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Severity"><select style={inputStyle} defaultValue="High"><option>Low</option><option>Medium</option><option>High</option></select></Field>
              <Field label="Consequence"><select style={inputStyle} defaultValue="Environment"><option>Safety</option><option>Environment</option><option>Production</option></select></Field>
              <Field label="Likelihood"><select style={inputStyle} defaultValue="Likely"><option>Unlikely</option><option>Possible</option><option>Likely</option></select></Field>
              <Field label="Risk level"><input style={{ ...inputStyle, color: T.orange }} value="3 — auto-calculated" readOnly /></Field>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Eyebrow color={T.blueSoft}>Leak details</Eyebrow>
            <Field label="Fluid type"><select style={inputStyle} defaultValue="hc"><option value="hc">Hydrocarbon (C6 – C9)</option><option>Steam</option><option>Hydrogen (H2)</option><option>Chemical</option></select></Field>
            <Field label="Fluid description"><input style={inputStyle} defaultValue="MP Cond" /></Field>
            <Field label="Equipment / piping tag no."><input style={inputStyle} defaultValue={'2" CM940005-MS-11'} /></Field>
            <Field label="Repair location detail"><input style={inputStyle} defaultValue="Line MP Steam condensate above 500-AT-227 steam elbow leak" /></Field>
            <Field label="Leaking picture">
              <div style={{ border: `1px dashed ${T.line2}`, borderRadius: 6, padding: "22px 12px", textAlign: "center", fontFamily: T.sans, fontSize: 12.5, color: T.faint, background: T.bg2 }}>
                img_20260717_0942.jpg attached · <span style={{ color: T.blueSoft, cursor: "pointer" }}>Replace</span>
              </div>
            </Field>
            <div style={{ background: T.blueDim, border: `1px solid ${T.blue}44`, borderRadius: 6, padding: "10px 14px", fontFamily: T.sans, fontSize: 12.5, color: T.text, lineHeight: 1.55 }}>
              <b>AI pre-fill:</b> tag and location parsed from the photo EXIF + P&ID match. Suggested severity <b>High</b> — steam service, personnel route below.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <BtnGhost onClick={onClose}>Save as draft</BtnGhost>
          <BtnPrimary onClick={() => { onClose(); toast("Request A-P1-2026/146 submitted for design approval."); }}>Submit request</BtnPrimary>
        </div>
      </div>
    </>
  );
}

/* ---------------- MAP ---------------- */

const MON_POINTS = [
  { x: 418, y: 236, no: "A-P1-2026/128", m: "VOC · bi-weekly" },
  { x: 344, y: 296, no: "A-P1-2026/131", m: "VOC · bi-weekly" },
  { x: 502, y: 412, no: "A-P2-2026/145", m: "IR thermography" },
  { x: 214, y: 458, no: "A-Q1-2026/152", m: "H2 sniff test" },
  { x: 476, y: 188, no: "A-P1-2026/119", m: "UT thickness" },
  { x: 560, y: 240, no: "A-P1-2026/141", m: "Vibration trend" },
];

const W_MAP = 800, H_MAP = 600;

function SiteScene({ layers }) {
  return (
    <g>
      <defs>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.56  0 0 0 0 0.52  0 0 0 0.06 0" />
        </filter>
        <radialGradient id="tankTop" cx="0.38" cy="0.34" r="0.85">
          <stop offset="0%" stopColor="#A7ADB4" />
          <stop offset="55%" stopColor="#767E87" />
          <stop offset="100%" stopColor="#4C545E" />
        </radialGradient>
        <radialGradient id="sphereTop" cx="0.4" cy="0.32" r="0.9">
          <stop offset="0%" stopColor="#C4C9CF" />
          <stop offset="100%" stopColor="#5A626C" />
        </radialGradient>
        <linearGradient id="roofBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F6096" />
          <stop offset="100%" stopColor="#1E4066" />
        </linearGradient>
        <linearGradient id="roofBlue2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#27517E" />
          <stop offset="100%" stopColor="#183353" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#17414A" />
          <stop offset="100%" stopColor="#0D2429" />
        </linearGradient>
        <radialGradient id="heat">
          <stop offset="0%" stopColor="#FA4D56" stopOpacity="0.34" />
          <stop offset="60%" stopColor="#FA4D56" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FA4D56" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="flareGlow">
          <stop offset="0%" stopColor="#FFC46B" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#FF8A3C" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FF8A3C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ---- terrain base ---- */}
      <rect width={W_MAP} height={H_MAP} fill="#181B15" />
      {/* vegetation belts */}
      <path d="M0 0 H800 V96 Q640 128 470 92 Q300 60 140 104 Q60 122 0 96 Z" fill="#1C2818" />
      <path d="M660 60 Q760 140 780 300 Q796 430 760 600 H800 V0 H640 Z" fill="#1B2717" />
      <path d="M0 470 Q80 500 60 600 H0 Z" fill="#1B2717" />
      {/* tree clusters */}
      {[[40,40],[86,58],[150,34],[240,52],[540,44],[600,66],[700,40],[736,120],[758,210],[742,330],[762,430],[730,520],[28,520],[60,556]].map(([x, y], i) => (
        <g key={i} fill={i % 2 ? "#243A1E" : "#1E3019"}>
          <circle cx={x} cy={y} r="10" /><circle cx={x + 11} cy={y + 5} r="8" /><circle cx={x - 9} cy={y + 7} r="7" /><circle cx={x + 3} cy={y + 12} r="8" />
        </g>
      ))}
      {/* waste-water ponds */}
      <path d="M70 130 q54 -22 108 -4 q40 14 30 46 q-10 30 -66 30 q-70 0 -84 -30 q-10 -26 12 -42 Z" fill="url(#water)" stroke="#26575F" strokeWidth="1.4" />
      <path d="M212 156 q40 -14 74 2 q26 12 16 34 q-12 24 -56 22 q-48 -2 -52 -26 q-3 -20 18 -32 Z" fill="url(#water)" stroke="#26575F" strokeWidth="1.2" />
      <path d="M86 142 q46 -16 92 -2" stroke="#3A7C86" strokeWidth="1" fill="none" opacity="0.5" />

      {/* main plant pad */}
      <rect x="120" y="120" width="560" height="440" rx="10" fill="#24272B" />
      <rect x="132" y="132" width="536" height="416" rx="8" fill="#26292E" />
      <rect x="300" y="140" width="250" height="150" fill="#2A2D31" opacity="0.7" />
      <rect x="150" y="350" width="180" height="190" fill="#292C2E" opacity="0.7" />

      {/* ---- roads ---- */}
      <g>
        <path d="M100 100 H700 M100 100 V560 M700 100 V440 M100 560 H620 M100 320 H700 M420 100 V560 M620 320 V560 M700 440 H620" stroke="#3B4046" strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100 100 H700 M100 100 V560 M700 100 V440 M100 560 H620 M100 320 H700 M420 100 V560 M620 320 V560" stroke="#5A6068" strokeWidth="1" strokeDasharray="8 10" fill="none" opacity="0.7" />
        {/* road exit to south */}
        <path d="M260 560 V600" stroke="#3B4046" strokeWidth="13" />
        <path d="M260 560 V600" stroke="#5A6068" strokeWidth="1" strokeDasharray="8 10" opacity="0.7" />
      </g>

      {/* ---- pipe racks ---- */}
      <g stroke="#4E555E" strokeWidth="1.6" opacity="0.9">
        <path d="M290 250 H560 M290 254 H560 M290 258 H560" />
        <path d="M380 260 V470 M384 260 V470 M388 260 V470" />
        <path d="M240 470 H500 M240 474 H500" />
        <path d="M560 254 H660 V180" fill="none" />
      </g>
      {[300, 340, 380, 420, 460, 500, 540].map((x) => <rect key={x} x={x} y={248} width="2" height="12" fill="#333940" />)}

      {/* ---- tank farm (south-west) ---- */}
      <g>
        <rect x="130" y="360" width="220" height="185" fill="none" stroke="#3A3E36" strokeWidth="2.5" rx="4" />
        <rect x="130" y="360" width="220" height="185" fill="#22251F" opacity="0.5" rx="4" />
        {[[172, 402], [244, 402], [316, 402], [172, 476], [244, 476], [316, 476]].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x + 6} cy={y + 8} rx="27" ry="25" fill="#0B0D10" opacity="0.45" />
            <circle cx={x} cy={y} r="26" fill="url(#tankTop)" />
            <circle cx={x} cy={y} r="26" fill="none" stroke="#3E454E" strokeWidth="1.4" />
            <circle cx={x} cy={y} r="17" fill="none" stroke="#8A9099" strokeWidth="0.8" opacity="0.7" />
            <circle cx={x} cy={y} r="3" fill="#3C434C" />
            <path d={`M${x} ${y - 26} V${y - 17} M${x + 26} ${y} H${x + 17}`} stroke="#565E68" strokeWidth="1" />
          </g>
        ))}
      </g>
      {/* LPG spheres */}
      {[[392, 520], [424, 520], [456, 520]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x + 4} cy={y + 7} rx="13" ry="11" fill="#0B0D10" opacity="0.45" />
          <circle cx={x} cy={y} r="12" fill="url(#sphereTop)" stroke="#454C55" strokeWidth="1" />
        </g>
      ))}

      {/* ---- process area ---- */}
      {/* main blue-roof building */}
      <g>
        <rect x="386" y="156" width="158" height="86" fill="#0B0D10" opacity="0.5" transform="translate(6 8)" />
        <rect x="386" y="156" width="158" height="86" rx="3" fill="url(#roofBlue)" stroke="#3D6FA6" strokeWidth="1" />
        <rect x="398" y="166" width="134" height="12" rx="2" fill="#3A6C9F" opacity="0.9" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={400 + i * 22} y={192} width="13" height="13" rx="2" fill="#B9C2CB" opacity="0.85" />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={400 + i * 22} y={214} width="13" height="13" rx="2" fill="#9AA5B0" opacity="0.7" />)}
      </g>
      {/* secondary blue building */}
      <g>
        <rect x="452" y="258" width="92" height="52" fill="#0B0D10" opacity="0.5" transform="translate(5 7)" />
        <rect x="452" y="258" width="92" height="52" rx="3" fill="url(#roofBlue2)" stroke="#33608F" strokeWidth="1" />
        <rect x="462" y="268" width="72" height="8" rx="2" fill="#2E5A88" />
      </g>
      {/* reformer furnace train */}
      <g>
        <rect x="168" y="170" width="104" height="126" fill="#0B0D10" opacity="0.5" transform="translate(5 7)" />
        <rect x="168" y="170" width="104" height="126" rx="3" fill="#32363B" stroke="#454B52" strokeWidth="1" />
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
          <circle key={r + "-" + c} cx={188 + c * 22} cy={192 + r * 40} r="8" fill="#22262B" stroke="#4E555E" strokeWidth="1.2" />
        )))}
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
          <circle key={"s" + r + c} cx={188 + c * 22} cy={192 + r * 40} r="2.4" fill="#5E666F" />
        )))}
      </g>
      {/* compressor shed */}
      <g>
        <rect x="292" y="336" width="112" height="72" fill="#0B0D10" opacity="0.5" transform="translate(5 6)" />
        <rect x="292" y="336" width="112" height="72" rx="3" fill="#383225" stroke="#4E4733" strokeWidth="1" />
        <path d="M292 372 H404" stroke="#4E4733" strokeWidth="1" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={302 + i * 26} y={346} width="16" height="18" rx="2" fill="#2A2519" />)}
      </g>
      {/* cooling tower bank */}
      <g>
        <rect x="470" y="376" width="126" height="52" fill="#0B0D10" opacity="0.5" transform="translate(5 6)" />
        <rect x="470" y="376" width="126" height="52" rx="3" fill="#2F343A" stroke="#454C54" strokeWidth="1" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={488 + i * 30} cy={402} r="12" fill="#20252B" stroke="#4E565F" strokeWidth="1.2" />
            <circle cx={488 + i * 30} cy={402} r="4.5" fill="#39424C" />
            <path d={`M${488 + i * 30 - 8} ${402} h16 M${488 + i * 30} ${402 - 8} v16`} stroke="#4E565F" strokeWidth="0.8" opacity="0.7" />
          </g>
        ))}
        {/* steam plumes */}
        <ellipse cx="500" cy="388" rx="16" ry="7" fill="#C9D2DA" opacity="0.10" />
        <ellipse cx="548" cy="384" rx="20" ry="8" fill="#C9D2DA" opacity="0.08" />
      </g>
      {/* substation */}
      <g>
        <rect x="620" y="356" width="56" height="56" fill="#26292D" stroke="#3E434A" strokeWidth="1" rx="2" />
        <path d="M628 364 h40 M628 380 h40 M628 396 h40" stroke="#3E434A" strokeWidth="1.4" />
        {[0, 1, 2].map((i) => <rect key={i} x={632 + i * 14} y={366} width="8" height="34" fill="#31363C" />)}
      </g>
      {/* warehouse (store S-2) */}
      <g>
        <rect x="150" y="486" width="0" height="0" fill="none" />
        <rect x="486" y="470" width="110" height="62" fill="#0B0D10" opacity="0.5" transform="translate(5 6)" />
        <rect x="486" y="470" width="110" height="62" rx="3" fill="#3A3F45" stroke="#50565E" strokeWidth="1" />
        <path d="M486 486 H596 M486 502 H596 M486 518 H596" stroke="#4A5058" strokeWidth="2" />
      </g>
      {/* flare stack */}
      <g>
        <circle cx="712" cy="118" r="30" fill="url(#flareGlow)" />
        <rect x="710" y="118" width="4" height="66" fill="#4A5058" />
        <rect x="704" y="180" width="16" height="8" fill="#3A4046" />
        <circle cx="712" cy="114" r="5" fill="#FFC46B" />
        <circle cx="712" cy="110" r="2.4" fill="#FFE9BF" />
      </g>
      {/* parking */}
      <g>
        <rect x="132" y="524" width="96" height="26" fill="#2B2E32" rx="2" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={137 + i * 11.4} y={527} width="7" height="12" rx="1" fill={i % 3 ? "#494F57" : "#5B6B7C"} />)}
      </g>

      {/* film grain over everything */}
      <rect width={W_MAP} height={H_MAP} filter="url(#grain)" pointerEvents="none" />
      {/* vignette */}
      <rect width={W_MAP} height={H_MAP} fill="none" pointerEvents="none" />

      {/* ---- area labels ---- */}
      {layers.labels && (
        <g fontFamily={T.mono} fontSize="9" letterSpacing="2" fill="#B9C2CB" opacity="0.55" pointerEvents="none">
          <text x="240" y="392">TANK FARM SOUTH</text>
          <text x="392" y="150">PROCESS · UNIT 250</text>
          <text x="168" y="164">REFORMER · UNIT 432</text>
          <text x="470" y="370">COOLING</text>
          <text x="486" y="464">WAREHOUSE S-2</text>
          <text x="70" y="126">WWT PONDS</text>
          <text x="688" y="200">FLARE</text>
          <text x="292" y="330">COMP. SHED</text>
        </g>
      )}
    </g>
  );
}

function MapView() {
  const [selected, setSelected] = useState("A-P1-2026/128");
  const [hover, setHover] = useState(null);
  const [layers, setLayers] = useState({ heat: true, requests: true, monitoring: false, labels: true });
  const [cam, setCam] = useState({ k: 1, tx: 0, ty: 0 });
  const [anim, setAnim] = useState(false);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const pins = REQUESTS.filter((r) => r.pin);

  const toWorld = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const vx = ((clientX - rect.left) / rect.width) * W_MAP;
    const vy = ((clientY - rect.top) / rect.height) * H_MAP;
    return { x: (vx - cam.tx) / cam.k, y: (vy - cam.ty) / cam.k };
  };

  const zoomAt = (clientX, clientY, factor) => {
    setCam((c) => {
      const k = Math.min(5, Math.max(1, c.k * factor));
      if (k === c.k) return c;
      const rect = svgRef.current.getBoundingClientRect();
      const vx = ((clientX - rect.left) / rect.width) * W_MAP;
      const vy = ((clientY - rect.top) / rect.height) * H_MAP;
      const wx = (vx - c.tx) / c.k, wy = (vy - c.ty) / c.k;
      return clampCam({ k, tx: vx - wx * k, ty: vy - wy * k });
    });
  };

  const clampCam = (c) => ({
    k: c.k,
    tx: Math.min(0, Math.max(W_MAP - W_MAP * c.k, c.tx)),
    ty: Math.min(0, Math.max(H_MAP - H_MAP * c.k, c.ty)),
  });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.16 : 1 / 1.16); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const flyTo = (x, y, k = 2.4) => {
    setAnim(true);
    setCam(clampCam({ k, tx: W_MAP / 2 - x * k, ty: H_MAP / 2 - y * k }));
    setTimeout(() => setAnim(false), 620);
  };

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, tx: cam.tx, ty: cam.ty, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.x) / rect.width) * W_MAP;
    const dy = ((e.clientY - drag.current.y) / rect.height) * H_MAP;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true;
    setCam((c) => clampCam({ k: c.k, tx: drag.current.tx + dx, ty: drag.current.ty + dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  const chip = (key, label) => (
    <button key={key} onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))} style={{
      fontFamily: T.sans, fontSize: 11.5, fontWeight: layers[key] ? 600 : 450,
      color: layers[key] ? "#0B1220" : T.dim, background: layers[key] ? T.blueSoft : "rgba(20,26,34,0.85)",
      border: `1px solid ${layers[key] ? T.blueSoft : T.line2}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer", backdropFilter: "blur(4px)",
    }}>{label}</button>
  );

  const zoomBtn = (label, fn, aria) => (
    <button onClick={fn} aria-label={aria} style={{ width: 32, height: 32, fontFamily: T.sans, fontSize: 15, color: T.text, background: "rgba(20,26,34,0.9)", border: `1px solid ${T.line2}`, borderRadius: 6, cursor: "pointer" }}>{label}</button>
  );

  const inv = 1 / cam.k;

  return (
    <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, animation: "fadeUp .3s ease" }}>
      <Panel pad={0} style={{ position: "relative", overflow: "hidden" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W_MAP} ${H_MAP}`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
          onDoubleClick={(e) => zoomAt(e.clientX, e.clientY, 1.5)}
          style={{ width: "100%", display: "block", background: "#14170F", borderRadius: 8, cursor: drag.current ? "grabbing" : "grab", touchAction: "none", userSelect: "none" }}>
          <g transform={`translate(${cam.tx} ${cam.ty}) scale(${cam.k})`} style={{ transition: anim ? "transform .6s cubic-bezier(.3,.7,.3,1)" : "none" }}>
            <SiteScene layers={layers} />

            {/* risk heat layer */}
            {layers.heat && pins.filter((r) => r.ai >= 30).map((r) => (
              <circle key={"h" + r.no} cx={r.pin.x} cy={r.pin.y} r={26 + r.ai * 0.55} fill="url(#heat)" pointerEvents="none" />
            ))}

            {/* monitoring layer */}
            {layers.monitoring && MON_POINTS.map((m, i) => (
              <g key={i} transform={`translate(${m.x} ${m.y}) scale(${inv})`}
                onMouseEnter={() => setHover({ x: m.x, y: m.y, title: m.no, sub: m.m, kind: "MONITORING POINT" })}
                onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="#0F2A28" stroke={T.teal} strokeWidth="1.6" />
                <circle r="1.8" fill={T.teal} />
              </g>
            ))}

            {/* request pins */}
            {layers.requests && pins.map((r) => {
              const on = selected === r.no;
              return (
                <g key={r.no} transform={`translate(${r.pin.x} ${r.pin.y}) scale(${inv})`}
                  onClick={() => { if (!drag.current?.moved) { setSelected(r.no); flyTo(r.pin.x, r.pin.y); } }}
                  onMouseEnter={() => setHover({ x: r.pin.x, y: r.pin.y, title: r.no, sub: r.tag, kind: r.status.toUpperCase(), ai: r.ai })}
                  onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                  {on && <circle r="14" fill="none" stroke={T.blueSoft} strokeWidth="1.5" style={{ animation: "ping 1.6s ease-out infinite" }} />}
                  <path d="M0 10 C -9 0 -11 -5 -11 -10 A 11 11 0 1 1 11 -10 C 11 -5 9 0 0 10 Z" fill={on ? T.blue : T.line2} stroke={on ? "#FFFFFF" : T.blueSoft} strokeWidth="1.4" transform="translate(0 -4)" />
                  <text y="-9" fill="#fff" fontSize="11" fontWeight="600" fontFamily={T.sans} textAnchor="middle">{r.pin.n}</text>
                </g>
              );
            })}

            {/* tooltip */}
            {hover && (
              <g transform={`translate(${hover.x} ${hover.y}) scale(${inv})`} pointerEvents="none">
                <g transform={`translate(${hover.x > 560 ? -186 : 16} ${hover.y < 120 ? 12 : -58})`}>
                  <rect width="172" height="52" rx="6" fill="rgba(13,17,23,0.95)" stroke={T.line2} />
                  <text x="12" y="19" fill={T.text} fontSize="11.5" fontFamily={T.mono}>{hover.title}</text>
                  <text x="12" y="33" fill={T.dim} fontSize="9.5" fontFamily={T.sans}>{hover.sub.length > 30 ? hover.sub.slice(0, 30) + "…" : hover.sub}</text>
                  <text x="12" y="45" fill={hover.ai >= 70 ? T.red : T.blueSoft} fontSize="8.5" fontFamily={T.mono} letterSpacing="1">{hover.kind}{hover.ai != null ? ` · AI ${hover.ai}` : ""}</text>
                </g>
              </g>
            )}
          </g>
        </svg>

        {/* overlays */}
        <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}>
          {chip("requests", "Requests")}
          {chip("heat", "Risk heat")}
          {chip("monitoring", "Monitoring")}
          {chip("labels", "Labels")}
        </div>
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {zoomBtn("+", () => { const r = svgRef.current.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.35); }, "Zoom in")}
          {zoomBtn("−", () => { const r = svgRef.current.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.35); }, "Zoom out")}
          {zoomBtn("⌂", () => { setAnim(true); setCam({ k: 1, tx: 0, ty: 0 }); setTimeout(() => setAnim(false), 620); }, "Reset view")}
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 14, fontFamily: T.mono, fontSize: 10.5, color: T.dim, background: "rgba(20,26,34,0.85)", border: `1px solid ${T.line2}`, borderRadius: 5, padding: "4px 9px" }}>
          {Math.round(cam.k * 100)}% · drag to pan · scroll to zoom
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 14, fontFamily: T.mono, fontSize: 9.5, letterSpacing: "0.14em", color: T.faint, background: "rgba(20,26,34,0.85)", borderRadius: 5, padding: "4px 9px" }}>
          BRANCH 6 (GC6) · REFINERY · AERIAL
        </div>
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <select style={{ ...inputStyle }} defaultValue="gc6"><option value="gc6">Branch 6 (GC6): Refinery</option><option>Branch 5 (GC5): Aromatics 2</option></select>
        <Panel style={{ borderColor: T.blue + "44" }} pad={16}>
          <Eyebrow color={T.blueSoft}>AI risk heatmap</Eyebrow>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.text, lineHeight: 1.55, marginTop: 7 }}>
            Highest concentration of AI-flagged leak risk sits around unit 910 — pin 3 scores 46 and is trending up week over week.
          </div>
          <button onClick={() => { const p = pins.find((r) => r.no === "A-P2-2026/145"); if (p) { setSelected(p.no); flyTo(p.pin.x, p.pin.y); } }} style={{ marginTop: 10, fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, color: "#0B1220", background: T.blue, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>Fly to hotspot</button>
        </Panel>
        {pins.map((r) => {
          const on = selected === r.no;
          return (
            <button key={r.no} onClick={() => { setSelected(r.no); flyTo(r.pin.x, r.pin.y); }} style={{ textAlign: "left", background: on ? T.bg2 : T.bg1, border: `1px solid ${on ? T.blue + "77" : T.line}`, borderRadius: 8, padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: T.mono, fontSize: 13.5, color: T.text }}>{r.no}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>◫ {r.photos}</span>
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.dim, margin: "6px 0 10px" }}>{r.tag}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Chip c={STATUS[r.status].c} bg={STATUS[r.status].bg}>{r.status.toUpperCase()}</Chip>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: r.ai >= 70 ? T.red : T.faint, marginLeft: "auto" }}>AI {r.ai}</span>
              </div>
            </button>
          );
        })}
        <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.faint, lineHeight: 1.55, padding: "2px 4px" }}>
          Click a card or pin to fly to its location. Toggle the monitoring layer to see today's inspection points.
        </div>
      </div>
    </div>
  );
}

/* ---------------- MONITORING ---------------- */

function Monitoring({ toast }) {
  const [tab, setTab] = useState("All reports");
  const rows = MONITORING.filter((m) =>
    tab === "All reports" ? true : tab === "Overdue" ? m.status === "Overdue" : m.status !== "Overdue"
  );
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16, alignItems: "start" }}>
        <Panel pad={0}>
          <div style={{ display: "flex", gap: 4, padding: "14px 18px", borderBottom: `1px solid ${T.line}` }}>
            {["All reports", "Upcoming", "Overdue"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                fontFamily: T.sans, fontSize: 12.5, fontWeight: tab === t ? 600 : 450,
                color: tab === t ? "#0B1220" : T.dim, background: tab === t ? T.blue : "transparent",
                border: "none", borderRadius: 999, padding: "7px 14px", cursor: "pointer",
              }}>{t}</button>
            ))}
            <input placeholder="Search…" style={{ ...inputStyle, maxWidth: 200, marginLeft: "auto", padding: "7px 12px" }} />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <Th>Report No.</Th><Th>Method</Th><Th>Frequency</Th><Th>Last inspection result</Th><Th>Next inspection</Th><Th>Status</Th>
            </tr></thead>
            <tbody>
              {rows.map((m, i) => (
                <tr key={i}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.bg2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Td style={{ fontFamily: T.mono, fontSize: 12.5, color: T.text }}>{m.no}</Td>
                  <Td>{m.method}</Td>
                  <Td>{m.freq}</Td>
                  <Td style={{ color: m.last.includes("Good") ? T.dim : T.orange }}>{m.last}</Td>
                  <Td style={{ fontFamily: T.mono, fontSize: 12.5 }}>{m.next}</Td>
                  <Td><Chip c={MON_STATUS[m.status].c} bg={MON_STATUS[m.status].bg}>{m.status}</Chip></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>Monitoring record · A-P1-2026/128</div>
            {[
              { cond: "Good", file: "img_20260712_0812", due: "12/07/2026", c: T.green },
              { cond: "Good", file: "img_20260628_1104", due: "28/06/2026", c: T.green },
              { cond: "Leak", file: "img_20260514_2147", due: "14/05/2026", c: T.red },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
                <span style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, color: r.c, width: 44 }}>{r.cond}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.blueSoft, flex: 1 }}>⎘ {r.file}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.faint }}>{r.due}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <select style={{ ...inputStyle, flex: 1, padding: "8px 10px" }}><option>Condition</option><option>Good</option><option>Leak</option></select>
              <input placeholder="DD/MM/YYYY" style={{ ...inputStyle, width: 118, padding: "8px 10px" }} />
              <button onClick={() => toast("Monitoring record added and synced to QSHE dashboard.")} style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: "#0B1220", background: T.blue, border: "none", borderRadius: 6, padding: "0 18px", cursor: "pointer" }}>ADD</button>
            </div>
          </Panel>
          <Panel style={{ borderColor: T.blue + "44" }}>
            <Eyebrow color={T.blueSoft}>AI schedule optimization</Eyebrow>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.text, lineHeight: 1.6, marginTop: 8 }}>
              Two overdue items sit within 40 m of today's H2 sniff-test route. Merging them into one mobilization saves an estimated 2.5 crew-hours.
            </div>
            <button onClick={() => toast("Routes merged. Inspector notified — 3 items, one mobilization.")} style={{ marginTop: 12, fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: "#0B1220", background: T.blue, border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer" }}>Apply proposal</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PERMANENT REPAIRS ---------------- */

function Repairs({ toast }) {
  const rows = [
    { no: "A-P1-2026/119", scope: "Replace MP steam condensate elbow spool", window: "TA-2026-03 · Day 24", crew: "Crew 2", status: "Scheduled" },
    { no: "A-P1-2026/141", scope: "Weld overlay + re-rate 850 steam line",   window: "TA-2026-03 · Day 26", crew: "Crew 1", status: "Scheduled" },
    { no: "A-P1-2026/143", scope: "Section replacement — chemical tee",       window: "Awaiting shutdown slot", crew: "—", status: "Pending slot" },
    { no: "A-P1-2026/122", scope: "Flange refacing, unit 910",                window: "21/02/2027 (next TA)",  crew: "—", status: "Deferred" },
  ];
  const rc = { "Scheduled": T.green, "Pending slot": T.orange, "Deferred": T.dim };
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Panel>
          <div style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 12 }}>Permanent repair schedule</div>
          <Field label="Date">
            <input style={{ ...inputStyle, fontFamily: T.mono }} defaultValue="21/02/2027" />
          </Field>
          <div style={{ fontFamily: T.sans, fontSize: 12, color: T.faint, marginTop: 10, lineHeight: 1.55 }}>Every temporary clamp carries a committed permanent-repair date. AI flags any clamp whose predicted life ends before its scheduled slot.</div>
        </Panel>
        <Panel style={{ borderColor: T.red + "55" }}>
          <Eyebrow color={T.red}>AI predicted-life risk</Eyebrow>
          <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.text, lineHeight: 1.6, marginTop: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.blueSoft }}>A-P1-2026/143</span> is still awaiting a shutdown slot, but the clamp's predicted-life model puts failure risk before the next turnaround window — Extreme risk, Chemical service at GC7. Recommend requesting an earlier slot.
          </div>
          <button onClick={() => toast("Earlier repair slot requested for A-P1-2026/143 — planning notified.")} style={{ marginTop: 12, fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: "#0B1220", background: T.blue, border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer" }}>Request earlier slot</button>
        </Panel>
      </div>
      <Panel pad={0}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Report No.</Th><Th>Repair scope</Th><Th>Window</Th><Th>Crew</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bg2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Td style={{ fontFamily: T.mono, fontSize: 12.5, color: T.text }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {r.no}
                    {r.no === "A-P1-2026/143" && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.red, border: `1px solid ${T.red}55`, borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em" }}>AI</span>}
                  </div>
                </Td>
                <Td style={{ color: T.text }}>{r.scope}</Td>
                <Td style={{ fontFamily: T.mono, fontSize: 12 }}>{r.window}</Td>
                <Td>{r.crew}</Td>
                <Td><span style={{ color: rc[r.status], fontWeight: 500 }}>{r.status}</span></Td>
                <Td style={{ textAlign: "right" }}>
                  <button onClick={() => toast(`Work order generated for ${r.no} and sent to planning.`)} style={{ fontFamily: T.sans, fontSize: 12, color: T.blueSoft, background: "transparent", border: `1px solid ${T.blue}55`, borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>Generate WO</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/* ---------------- INVENTORY ---------------- */

function Inventory() {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .3s ease" }}>
      <Panel pad={0}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Clamp size</Th><Th>Type</Th><Th>Store · location</Th><Th>Total</Th><Th>Reserved</Th><Th>Available</Th><Th style={{ width: 220 }}>Stock level</Th></tr></thead>
          <tbody>
            {INVENTORY.map((r) => {
              const c = r.level < 0.25 ? T.red : r.level < 0.45 ? T.orange : T.green;
              return (
                <tr key={r.size}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.bg2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Td style={{ fontFamily: T.mono, fontSize: 12.5, color: T.text }}>{r.size}</Td>
                  <Td>{r.type}</Td>
                  <Td style={{ fontFamily: T.mono, fontSize: 12 }}>{r.store}</Td>
                  <Td style={{ fontFamily: T.mono, fontSize: 12.5 }}>{r.total}</Td>
                  <Td style={{ fontFamily: T.mono, fontSize: 12.5 }}>{r.reserved}</Td>
                  <Td style={{ fontFamily: T.mono, fontSize: 12.5, color: c }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {r.avail}
                      {r.level < 0.25 && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.red, border: `1px solid ${T.red}55`, borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em" }}>AI: REORDER</span>}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 5, background: T.bg3, borderRadius: 3 }}>
                        <div style={{ width: `${r.level * 100}%`, height: "100%", background: c, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint, width: 32 }}>{Math.round(r.level * 100)}%</span>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <Panel style={{ borderColor: T.orange + "55" }}>
        <Eyebrow color={T.orange}>AI demand forecast · next 45 days</Eyebrow>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text, lineHeight: 1.6, marginTop: 8 }}>
          Predicted demand of <b>3× 10″–12″</b> clamps (GC6 unit 910 corrosion circuit trend) exceeds available stock of 1. Recommended purchase requisition lead time is 6 weeks — raise PR by <b>24 July</b> to avoid an uncovered window.
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- AI ASSIST (Claude API) ---------------- */

function Assist({ apiKey, onNeedKey }) {
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: "AI Assist online. I have the full TCM dataset in context — 945 active clamps, 12 open leak-sealing requests, monitoring schedules, and store inventory. Ask about risk, approvals, scheduling, stock, or draft a report." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const context = useMemo(() => JSON.stringify({ requests: REQUESTS.map(({ pin, ...r }) => r), monitoring: MONITORING, inventory: INVENTORY }), []);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const history = [...msgs, { role: "user", text: q }];
    setMsgs(history);
    setBusy(true);
    try {
      if (!apiKey) { onNeedKey(); setBusy(false); return; }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: "You are AI Assist inside TCM Clamp Management, GC's internal tool for temporary clamp management across the Map Ta Phut complex. Today is Friday 17 July 2026. Voice: precise plant engineer — short paragraphs, concrete report numbers and tags, no markdown headers, no fluff. AI leak scores are 0-100 (>=70 urgent). Approval flow: Draft → Design approval → VP approval → Waiting installation → Installed. Live dataset (JSON): " + context,
          messages: history.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      const out = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "No response received — try again.";
      setMsgs((m) => [...m, { role: "assistant", text: out }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: "Connection to the analysis service failed. Check network and retry." }]);
    }
    setBusy(false);
  };

  const suggestions = [
    "Which requests need attention today?",
    "Summarize approval bottlenecks for the Plant VP",
    "Do we have stock for the extreme-risk requests?",
    "Draft the weekly QSHE compliance note",
  ];

  return (
    <div style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column", animation: "fadeUp .3s ease" }}>
      <Panel style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }} pad={0}>
        <div style={{ padding: "15px 22px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue, animation: "blink 2.2s infinite" }} />
          <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.text }}>AI Assist</span>
          <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint, letterSpacing: "0.08em" }}>· LIVE DATASET IN CONTEXT · REQUESTS, MONITORING, INVENTORY</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "74%" }}>
              <div style={{
                fontFamily: T.sans, fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
                color: m.role === "user" ? "#0B1220" : T.text,
                background: m.role === "user" ? T.blue : T.bg2,
                border: m.role === "user" ? "none" : `1px solid ${T.line2}`,
                borderRadius: m.role === "user" ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
                padding: "11px 15px",
              }}>{m.text}</div>
            </div>
          ))}
          {busy && (
            <div style={{ alignSelf: "flex-start", fontFamily: T.mono, fontSize: 12, color: T.blueSoft }}>
              <span style={{ animation: "blink 1s infinite" }}>▮</span> analyzing…
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.line}` }}>
          {!apiKey && (
            <div style={{ background: T.amberDim || "rgba(255,131,43,0.12)", border: `1px solid ${T.orange}55`, borderRadius: 6, padding: "10px 14px", marginBottom: 10, fontFamily: T.sans, fontSize: 12.5, color: T.text }}>
              Add an Anthropic API key to enable live AI responses. <button onClick={onNeedKey} style={{ color: T.blueSoft, background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, padding: 0 }}>Set key →</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={busy} style={{ fontFamily: T.sans, fontSize: 11.5, color: T.dim, background: T.bg3, border: `1px solid ${T.line2}`, borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>{s}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about requests, monitoring, stock, or reports…"
              style={{ ...inputStyle, flex: 1 }} />
            <BtnPrimary onClick={() => send()} style={{ opacity: busy ? 0.5 : 1 }}>Send</BtnPrimary>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- TOAST ---------------- */

function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 90, width: 340, background: T.bg2, border: `1px solid ${T.line2}`, borderLeft: `3px solid ${T.blue}`, borderRadius: 8, padding: "14px 16px", display: "flex", gap: 12, animation: "toastIn .25s ease", boxShadow: "0 12px 32px rgba(0,0,0,0.45)" }}>
      <span style={{ color: T.blueSoft, fontSize: 15 }}>▤</span>
      <div>
        <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.text }}>Request updated</div>
        <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.dim, marginTop: 4, lineHeight: 1.5 }}>{msg}</div>
      </div>
      <button onClick={onClose} aria-label="Dismiss" style={{ marginLeft: "auto", background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 13, alignSelf: "flex-start" }}>✕</button>
    </div>
  );
}

/* ---------------- APP ---------------- */

const TITLES = {
  dashboard: "TCM Clamp Management",
  map: "Map",
  requests: "Online leak sealing request",
  monitoring: "TCM Monitoring",
  repairs: "Permanent repairs",
  inventory: "Clamp inventory",
  assist: "AI Assist",
};

export default function App() {
  const [view, setView] = useState("dashboard");
  const [createOpen, setCreateOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Vendor has submitted the quotation for A-P1-2026/131 — please review and respond.");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("tcm_api_key") || "");
  const [keyInput, setKeyInput] = useState("");
  const [keyPrompt, setKeyPrompt] = useState(false);

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    localStorage.setItem("tcm_api_key", k);
    setApiKey(k);
    setKeyPrompt(false);
    setKeyInput("");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg0, color: T.text, fontFamily: T.sans, overflow: "hidden" }}>
      <style>{CSS}</style>
      <Sidebar view={view} setView={setView} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          title={TITLES[view]}
          right={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {view === "dashboard" && <PlantSelect />}
              <button onClick={() => { setKeyInput(apiKey); setKeyPrompt(true); }} style={{ fontFamily: T.sans, fontSize: 11.5, color: apiKey ? T.green : T.orange, background: T.bg3, border: `1px solid ${apiKey ? T.green + "55" : T.orange + "55"}`, borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>
                {apiKey ? "● API key set" : "○ Set API key"}
              </button>
            </div>
          }
        />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {view === "dashboard" && <Dashboard setView={setView} />}
          {view === "map" && <MapView />}
          {view === "requests" && <Requests openCreate={() => setCreateOpen(true)} toast={setToastMsg} />}
          {view === "monitoring" && <Monitoring toast={setToastMsg} />}
          {view === "repairs" && <Repairs toast={setToastMsg} />}
          {view === "inventory" && <Inventory />}
          {view === "assist" && <Assist apiKey={apiKey} onNeedKey={() => setKeyPrompt(true)} />}
        </div>
      </div>
      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} toast={setToastMsg} />}
      <Toast msg={toastMsg} onClose={() => setToastMsg("")} />
      {keyPrompt && (
        <>
          <div onClick={() => setKeyPrompt(false)} style={{ position: "fixed", inset: 0, background: "rgba(6,9,13,0.7)", zIndex: 80 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 480, background: T.bg1, border: `1px solid ${T.line2}`, borderRadius: 10, zIndex: 90, padding: 28, animation: "fadeUp .2s ease" }}>
            <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 6 }}>Anthropic API Key</div>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.dim, lineHeight: 1.6, marginBottom: 18 }}>
              The AI Assist feature calls the Anthropic API directly from your browser. Your key is stored only in your browser's localStorage — it is never sent anywhere else.
              <br /><br />
              Get a free key at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: T.blueSoft }}>console.anthropic.com</a> (free tier is sufficient for demo use).
            </div>
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
              placeholder="sk-ant-api03-…"
              type="password"
              style={{ ...inputStyle, width: "100%", marginBottom: 14, fontFamily: T.mono, fontSize: 12 }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {apiKey && <button onClick={() => { localStorage.removeItem("tcm_api_key"); setApiKey(""); setKeyPrompt(false); }} style={{ fontFamily: T.sans, fontSize: 12.5, color: T.red, background: "transparent", border: `1px solid ${T.red}44`, borderRadius: 6, padding: "9px 16px", cursor: "pointer" }}>Remove key</button>}
              <button onClick={() => setKeyPrompt(false)} style={{ fontFamily: T.sans, fontSize: 12.5, color: T.dim, background: T.bg3, border: `1px solid ${T.line2}`, borderRadius: 6, padding: "9px 16px", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveKey} style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: "#0B1220", background: T.blue, border: "none", borderRadius: 6, padding: "9px 16px", cursor: "pointer" }}>Save & connect</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
