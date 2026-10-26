// Gera todos os SVGs do perfil (banner, cards, títulos, métricas) em tema claro e escuro.
// As métricas vêm da API do GitHub; sem rede, caem para FALLBACK.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));
const DIR = "v1";
const USER = process.env.PROFILE_USER || "Erickware";
const TOKEN = process.env.GITHUB_TOKEN;

const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const THEMES = {
  light: { bg: "#FFFFFF", card: "#FCFDFD", line: "#E4E7EA", text: "#0B0F14", muted: "#5B6470", faint: "#A3AAB3", ghost: "#EEF2F4", accent: "#0891B2", accent2: "#155E75" },
  dark: { bg: "#0D1117", card: "#0F1620", line: "#222B36", text: "#EEF2F6", muted: "#97A1AE", faint: "#5A6573", ghost: "#141C27", accent: "#22D3EE", accent2: "#0E7490" },
};

// ---------------------------------------------------------------- dados

const NAME = "Erickware";
const FOOT = "(*(int64 (fastcall **))";
const FALLBACK = { repos: 5, stars: 1, langs: 6, since: 2023 };

const W3 = 418;

// Layout dos cards; o texto de cada um fica em TEXT[lang].cards.
const LAYOUT = {
  "pil-web": { w: 300, h: 214, kicker: "0x01", meta: "REACT · NODE.JS · LARAVEL" },
  "pil-reverse": { w: 300, h: 214, kicker: "0x02", meta: "X86-64 · PE" },
  "pil-windows": { w: 300, h: 214, kicker: "0x03", meta: "C · C++ · ASM · WIN32" },
  "pil-security": { w: 300, h: 214, kicker: "0x04", meta: "RUST · PYTHON" },
  "feat-injector": { w: W3, h: 236, link: 1, kicker: "windows", meta: "C++20 · IMGUI · DX11" },
  "feat-inertia": { w: W3, h: 236, link: 1, kicker: "network", meta: "RUST · PYTHON" },
  "feat-kernel": { w: W3, h: 236, link: 1, kicker: "kernel", meta: "C · C++ · ASM" },
};

const TEXT = {
  en: {
    hero: {
      eyebrow: "WEB · REVERSE ENGINEERING · SECURITY",
      sub1: "Web development, reverse engineering, and security research.",
      sub2: "From browser-based applications to the inner workings of Windows.",
    },
    cards: {
      "pil-web": ["Web", "Browser-based", "applications, from the", "interface to the server."],
      "pil-reverse": ["Reverse engineering", "Native binaries, the", "PE format, disassembly", "and live debugging."],
      "pil-windows": ["Windows internals", "Processes, memory,", "drivers and the kernel.", "The OS from the inside."],
      "pil-security": ["Security", "Network recon and", "auditing tools.", "Authorized use only."],
      "feat-injector": ["Injector", "x64 DLL injector with", "LoadLibrary, Manual Map", "and Thread Hijack, in a", "Dear ImGui interface."],
      "feat-inertia": ["inertia", "TCP and UDP port scanner", "with an async Rust core", "and a Python interface.", "Available on PyPI."],
      "feat-kernel": ["Kernel Driver", "Windows kernel driver", "written in C, with parts", "in C++ and Assembly."],
    },
    headings: { "h-featured": ["0x10", "Featured"], "h-oss": ["0x20", "Open source"], "h-stack": ["0x30", "Stack"] },
    metrics: ["repositories", "stars", "languages", "on GitHub since"],
  },
  pt: {
    hero: {
      eyebrow: "WEB · ENGENHARIA REVERSA · SEGURANÇA",
      sub1: "Desenvolvimento web, engenharia reversa e pesquisa em segurança.",
      sub2: "De aplicações no navegador ao funcionamento interno do Windows.",
    },
    cards: {
      "pil-web": ["Web", "Aplicações que rodam", "no navegador, da", "interface ao servidor."],
      "pil-reverse": ["Engenharia reversa", "Binários nativos, o", "formato PE, disassembly", "e debug ao vivo."],
      "pil-windows": ["Windows internals", "Processos, memória,", "drivers e o kernel.", "O sistema por dentro."],
      "pil-security": ["Segurança", "Recon de rede e", "ferramentas de auditoria.", "Só uso autorizado."],
      "feat-injector": ["Injector", "Injetor de DLL x64 com", "LoadLibrary, Manual Map", "e Thread Hijack, numa", "interface Dear ImGui."],
      "feat-inertia": ["inertia", "Scanner de portas TCP e", "UDP com núcleo assíncrono", "em Rust e interface em", "Python. Está no PyPI."],
      "feat-kernel": ["Kernel Driver", "Driver de kernel para", "Windows escrito em C, com", "partes em C++ e Assembly."],
    },
    headings: { "h-featured": ["0x10", "Destaques"], "h-oss": ["0x20", "Código aberto"], "h-stack": ["0x30", "Stack"] },
    metrics: ["repositórios", "estrelas", "linguagens", "no GitHub desde"],
  },
};

// ---------------------------------------------------------------- métricas

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { accept: "application/vnd.github+json", "user-agent": `${USER}-profile`, ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

const NOT_A_LANGUAGE = new Set(["CMake", "Makefile", "Batchfile", "HTML", "CSS", "Dockerfile", "Shell"]);

async function stats() {
  try {
    const user = await gh(`/users/${USER}`);
    const own = (await gh(`/users/${USER}/repos?per_page=100`)).filter((r) => !r.fork && r.name.toLowerCase() !== USER.toLowerCase());
    const langs = new Set();
    for (const r of own) for (const l of Object.keys(await gh(`/repos/${USER}/${r.name}/languages`))) if (!NOT_A_LANGUAGE.has(l)) langs.add(l);
    return {
      repos: own.length,
      stars: own.reduce((n, r) => n + r.stargazers_count, 0),
      langs: langs.size,
      since: new Date(user.created_at).getFullYear(),
    };
  } catch (e) {
    console.warn(`métricas indisponíveis (${e.message}); usando fallback`);
    return FALLBACK;
  }
}

// ---------------------------------------------------------------- peças

function card(theme, { w, h, kicker, title, lines, meta, link }) {
  const c = THEMES[theme];
  const pad = 28;
  let g = `<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="10" fill="${c.card}" stroke="${c.line}" stroke-width="1.5"/>`;
  g += `<rect x="${pad}" y="1" width="44" height="3" rx="1.5" fill="url(#bar)"/>`;

  let y = pad + 17;
  if (kicker) {
    g += `<text x="${pad}" y="${y}" font-family="${MONO}" font-size="10.5" letter-spacing="2.4" fill="${c.accent}">${esc(kicker.toUpperCase())}</text>`;
    y += 33;
  }
  g += `<text x="${pad}" y="${y + 5}" font-family="${SANS}" font-size="22" font-weight="600" letter-spacing="-.4" fill="${c.text}">${esc(title)}</text>`;
  if (link) g += `<text x="${w - pad}" y="${pad + 17}" text-anchor="end" font-family="${SANS}" font-size="15" fill="${c.faint}">↗</text>`;
  y += 37;
  for (const ln of lines) {
    g += `<text x="${pad}" y="${y}" font-family="${SANS}" font-size="14.5" fill="${c.muted}">${esc(ln)}</text>`;
    y += 22;
  }
  if (meta) g += `<text x="${pad}" y="${h - pad + 5}" font-family="${MONO}" font-size="10.5" letter-spacing="1.5" fill="${c.faint}">${esc(meta)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<defs><linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${c.accent}"/><stop offset="1" stop-color="${c.accent2}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="${c.bg}"/>
${g}
</svg>`;
}

// Hex dump do lado direito do banner. Bytes determinísticos (o SVG não muda entre builds),
// uma barra de "instrução atual" que desce linha a linha e "Erickware" escondido em ASCII.
function hexDump(x0, y0, c) {
  const rows = 14, cols = 16, cw = 23, lh = 22, addrW = 82;
  let seed = 0x45726963;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const PROLOGUE = [0x48, 0x89, 0x5c, 0x24, 0x08, 0x57, 0x48, 0x83, 0xec, 0x20, 0x48, 0x8b, 0xf9, 0x33, 0xc0, 0xc3];
  const EGG = [...NAME].map((ch) => ch.charCodeAt(0));
  const eggRow = 7, eggCol = 4;

  let out = `<rect class="ip" x="${x0 - 10}" y="${y0 - 15}" width="${addrW + cols * cw + 8}" height="${lh}" rx="3" fill="${c.accent}" opacity=".10"/>`;
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * lh;
    out += `<text x="${x0}" y="${y}" font-family="${MONO}" font-size="12" fill="${c.faint}" opacity=".7">${(0x140001000 + r * 16).toString(16).toUpperCase().padStart(9, "0")}</text>`;
    for (let q = 0; q < cols; q++) {
      const x = x0 + addrW + q * cw;
      const egg = r === eggRow && q >= eggCol && q < eggCol + EGG.length;
      const b = egg ? EGG[q - eggCol] : r === 0 ? PROLOGUE[q] : rnd() < 0.18 ? 0 : Math.floor(rnd() * 256);
      const hex = b.toString(16).toUpperCase().padStart(2, "0");
      if (egg) {
        out += `<text x="${x}" y="${y}" font-family="${MONO}" font-size="13" font-weight="600" fill="${c.accent}">${hex}</text>`;
      } else if (rnd() < 0.07) {
        out += `<text x="${x}" y="${y}" font-family="${MONO}" font-size="13" fill="${c.accent}" style="animation:pulse 4.6s ${(rnd() * 4.6).toFixed(2)}s ease-in-out infinite">${hex}</text>`;
      } else {
        out += `<text x="${x}" y="${y}" font-family="${MONO}" font-size="13" fill="${b === 0 ? c.faint : c.muted}" opacity="${b === 0 ? ".45" : ".8"}">${hex}</text>`;
      }
    }
  }
  return { svg: out, w: addrW + cols * cw, h: rows * lh, rows, lh };
}

function hero(theme, s) {
  const c = THEMES[theme];
  const W = 1280, h = 430;
  const dump = hexDump(752, 76, c);
  const cx = 752 + dump.w / 2, cy = 76 + dump.h / 2 - 15;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(s.name)}">
<defs>
<radialGradient id="wash" cx="0" cy="0" r="1" gradientTransform="translate(260 215) scale(720 320)">
<stop offset="0" stop-color="${c.accent}" stop-opacity="${theme === "dark" ? ".08" : ".05"}"/>
<stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="fade" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${cx} ${cy}) scale(${dump.w * 0.72} ${dump.h * 0.78})">
<stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
<mask id="m"><rect width="${W}" height="${h}" fill="url(#fade)"/></mask>
</defs>
<style>
  @keyframes rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
  @keyframes pulse { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
  @keyframes step { from { transform: translateY(0) } to { transform: translateY(${dump.rows * dump.lh}px) } }
  @keyframes sweep { 0% { transform: translateX(-160px); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateX(560px); opacity: 0 } }
  @keyframes blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
  .r { animation: rise 1s cubic-bezier(.22,1,.36,1) }
  .d1 { animation-delay: .05s } .d2 { animation-delay: .2s } .d3 { animation-delay: .36s } .d4 { animation-delay: .52s }
  .ip { animation: step 9.8s steps(${dump.rows}) infinite }
  .sw { animation: sweep 3.8s 1s ease-in-out infinite }
</style>
<rect width="${W}" height="${h}" fill="${c.bg}"/>
<rect width="${W}" height="${h}" fill="url(#wash)"/>
<g mask="url(#m)">${dump.svg}</g>
<rect x="0" y="0" width="${W}" height="1" fill="${c.line}"/>
<rect x="0" y="${h - 1}" width="${W}" height="1" fill="${c.line}"/>
<g class="r d1"><text x="96" y="126" font-family="${MONO}" font-size="12" letter-spacing="4.2" fill="${c.accent}">${esc(s.eyebrow)}</text></g>
<g class="r d2"><text x="92" y="228" font-family="${SANS}" font-size="94" font-weight="300" letter-spacing="-3.6" fill="${c.text}">${esc(s.name)}</text></g>
<rect x="96" y="254" width="520" height="2" fill="${c.accent}"/>
<clipPath id="bc"><rect x="96" y="251" width="520" height="8"/></clipPath>
<g clip-path="url(#bc)"><rect class="sw" x="96" y="251" width="140" height="8" fill="${c.text}" opacity=".45"/></g>
<g class="r d3"><text x="96" y="308" font-family="${SANS}" font-size="19" fill="${c.muted}">${esc(s.sub1)}</text></g>
<g class="r d3"><text x="96" y="338" font-family="${SANS}" font-size="19" fill="${c.muted}">${esc(s.sub2)}</text></g>
<g class="r d4">
  <text x="96" y="${h - 36}" font-family="${MONO}" font-size="12" letter-spacing="1.6" fill="${c.faint}">${esc(s.foot)}</text>
  <rect x="${(100 + s.foot.length * 8.9).toFixed(1)}" y="${h - 46}" width="8" height="13" fill="${c.accent}" style="animation:blink 1.1s step-end infinite"/>
</g>
</svg>`;
}

function metrics(theme, items) {
  const c = THEMES[theme];
  const w = 1280, h = 172;
  const colW = w / items.length;
  let g = "";
  items.forEach((it, i) => {
    const x = colW * i + colW / 2;
    if (i > 0) g += `<rect x="${(colW * i).toFixed(1)}" y="40" width="1" height="92" fill="${c.line}"/>`;
    g += `<text x="${x.toFixed(1)}" y="96" text-anchor="middle" font-family="${SANS}" font-size="52" font-weight="300" letter-spacing="-2" fill="${c.text}">${esc(it.v)}</text>`;
    g += `<text x="${x.toFixed(1)}" y="122" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="2.6" fill="${c.muted}">${esc(it.k.toUpperCase())}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(items.map((i) => `${i.v} ${i.k}`).join(", "))}">
<rect width="${w}" height="${h}" fill="${c.bg}"/>
<rect x="0" y="0" width="${w}" height="1" fill="${c.line}"/>
<rect x="0" y="${h - 1}" width="${w}" height="1" fill="${c.line}"/>
${g}
</svg>`;
}

function heading(theme, [offset, text]) {
  const c = THEMES[theme];
  const w = 1280, h = 56;
  const label = text.toUpperCase();
  const textX = 30 + offset.length * 10.9 + 18;
  const end = textX + label.length * 11 + 14;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(text)}">
<rect width="${w}" height="${h}" fill="${c.bg}"/>
<rect x="0" y="34" width="18" height="2" fill="${c.accent}"/>
<text x="30" y="41" font-family="${MONO}" font-size="12.5" letter-spacing="3.4" fill="${c.accent}">${esc(offset)}</text>
<text x="${textX}" y="41" font-family="${MONO}" font-size="12.5" letter-spacing="3.4" fill="${c.text}">${esc(label)}</text>
<rect x="${end}" y="35" width="${w - end}" height="1" fill="${c.line}"/>
</svg>`;
}

function rule(theme) {
  const c = THEMES[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1" viewBox="0 0 1280 1" role="presentation"><rect width="1280" height="1" fill="${c.line}"/></svg>`;
}

// ---------------------------------------------------------------- build

const s = await stats();
const values = [s.repos, s.stars, s.langs, s.since].map(String);

for (const [lang, t] of Object.entries(TEXT)) {
  const dir = join(OUT, DIR, lang);
  mkdirSync(dir, { recursive: true });
  const heroSpec = { ...t.hero, name: NAME, foot: FOOT };
  const metricItems = t.metrics.map((k, i) => ({ v: values[i], k }));
  for (const theme of ["light", "dark"]) {
    writeFileSync(join(dir, `hero-${theme}.svg`), hero(theme, heroSpec));
    writeFileSync(join(dir, `metrics-${theme}.svg`), metrics(theme, metricItems));
    writeFileSync(join(dir, `rule-${theme}.svg`), rule(theme));
    for (const [name, spec] of Object.entries(LAYOUT)) {
      const [title, ...lines] = t.cards[name];
      writeFileSync(join(dir, `${name}-${theme}.svg`), card(theme, { ...spec, title, lines }));
    }
    for (const [name, spec] of Object.entries(t.headings)) writeFileSync(join(dir, `${name}-${theme}.svg`), heading(theme, spec));
  }
}
console.log(`cards gerados (${s.repos} repos, ${s.stars} ★, ${s.langs} linguagens)`);
