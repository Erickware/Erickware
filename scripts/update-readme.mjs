// Preenche a tabela de repositórios dos dois READMEs com os repositórios públicos da conta,
// do mais recente ao mais antigo. Forks, arquivados e o repo do perfil ficam de fora.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const USER = process.env.PROFILE_USER || "Erickware";
const TOKEN = process.env.GITHUB_TOKEN;
const START = "<!-- OSS:START -->";
const END = "<!-- OSS:END -->";
const LIMIT = 12;

const TEXT = {
  "README.md": {
    lang: "en",
    head: ["Repository", "What it is", "Stack", "Updated"],
    empty: "Nothing public yet.",
    day: (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    synced: (d) => `Synced ${d} · public repositories only`,
  },
  "README.pt-BR.md": {
    lang: "pt",
    head: ["Repositório", "O que é", "Stack", "Atualizado"],
    empty: "Nada público ainda.",
    day: (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "").replace(/ de /g, " "),
    synced: (d) => `Atualizado em ${d} · apenas repositórios públicos`,
  },
};

// Descrição (por idioma) e stack por repositório; sem override, vale a descrição do GitHub
// e a linguagem principal + os dois primeiros topics.
const OVERRIDES = (() => {
  try {
    return JSON.parse(readFileSync("assets/repos.json", "utf8"));
  } catch {
    return {};
  }
})();

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": `${USER}-profile`,
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

const repos = (await api(`/users/${USER}/repos?per_page=100&sort=pushed`))
  .filter((r) => !r.private && !r.fork && !r.archived && r.name.toLowerCase() !== USER.toLowerCase())
  .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();

function block(t) {
  const synced = `<sub>${t.synced(t.day(Date.now()))}</sub>`;
  if (!repos.length) return `${t.empty}\n\n${synced}`;

  const rows = repos.slice(0, LIMIT).map((r) => {
    const ov = OVERRIDES[r.name] ?? {};
    const stack = (ov.stack ?? [r.language, ...(r.topics || []).slice(0, 2)]).filter(Boolean).map((x) => `\`${x}\``).join(" ");
    const about = ov[t.lang] ?? r.description;
    const stars = r.stargazers_count ? ` · ${r.stargazers_count} ★` : "";
    return `| **[${cell(r.name)}](${r.html_url})**${stars} | ${cell(about) || "—"} | ${stack || "—"} | ${t.day(r.pushed_at)} |`;
  });

  return [`| ${t.head.join(" | ")} |`, "|:--|:--|:--|:--|", ...rows, "", synced].join("\n");
}

let changed = 0;
for (const [file, t] of Object.entries(TEXT)) {
  if (!existsSync(file)) continue;
  const src = readFileSync(file, "utf8");
  const a = src.indexOf(START);
  const b = src.indexOf(END);
  if (a === -1 || b === -1) throw new Error(`marcadores OSS ausentes em ${file}`);
  const next = `${src.slice(0, a + START.length)}\n${block(t)}\n${src.slice(b)}`;
  if (next !== src) {
    writeFileSync(file, next);
    changed++;
  }
}

console.log(changed ? `tabelas atualizadas (${repos.length} repositórios públicos)` : "sem mudanças");
