// Monta README.md (inglês, o principal) e README.pt-BR.md a partir dos SVGs de assets/v1/<lang>.
// A tabela entre os marcadores OSS é preenchida depois por scripts/update-readme.mjs.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = "v1";
const USER = "Erickware";

const L = {
  en: {
    file: "README.md",
    other: ["README.pt-BR.md", "Português"],
    intro: [
      "I build web applications and Windows tools, exploring reverse engineering, drivers, and low-level security.",
      "This is where I share projects involving software development, reverse engineering, and security. Some explore how binaries work, while others dig deeper into Windows, down to drivers and the kernel.",
    ],
    ossFallback: "Nothing public yet.",
    index: "All repositories →",
    contact: [
      ["GitHub", `https://github.com/${USER}`],
      ["Repositories", `https://github.com/${USER}?tab=repositories`],
      ["Stars", `https://github.com/${USER}?tab=stars`],
    ],
  },
  pt: {
    file: "README.pt-BR.md",
    other: ["README.md", "English"],
    intro: [
      "Desenvolvo aplicações web e ferramentas para Windows, explorando engenharia reversa, drivers e segurança de baixo nível.",
      "Aqui compartilho projetos de desenvolvimento de software, engenharia reversa e segurança. Alguns exploram como os binários funcionam; outros vão mais fundo no Windows, até os drivers e o kernel.",
    ],
    ossFallback: "Nada público ainda.",
    index: "Todos os repositórios →",
    contact: [
      ["GitHub", `https://github.com/${USER}`],
      ["Repositórios", `https://github.com/${USER}?tab=repositories`],
      ["Estrelas", `https://github.com/${USER}?tab=stars`],
    ],
  },
};

const PILLARS = ["pil-web", "pil-reverse", "pil-windows", "pil-security"];
const FEATURED = [
  ["feat-injector", `https://github.com/${USER}/Injector`],
  ["feat-inertia", `https://github.com/${USER}/inertia`],
  ["feat-kernel", `https://github.com/${USER}/Kernel-Driver-Bypass`],
];

const STACK = [
  ["TypeScript", "JavaScript", "Python", "SQL", "PHP"],
  ["Laravel", "React", "Node.js", "PostgreSQL"],
  ["Linux", "nginx", "systemd", "GitHub Actions", "Playwright"],
];

function build(lang) {
  const t = L[lang];

  const pic = (name, width, href) => {
    const img = `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${DIR}/${lang}/${name}-dark.svg"><img width="${width}" src="assets/${DIR}/${lang}/${name}-light.svg" alt=""></picture>`;
    return href ? `<a href="${href}">${img}</a>` : img;
  };
  const grid = (items, width) =>
    `<p align="center">\n${items.map((i) => "  " + (Array.isArray(i) ? pic(i[0], width, i[1]) : pic(i, width))).join("\n")}\n</p>`;
  const full = (n) => pic(n, "100%");

  return `${full("hero")}

<p align="center">
  <a href="${t.other[0]}"><b>${t.other[1]}</b></a>
</p>

${full("rule")}

<img align="left" width="150" src="https://github.com/${USER}.png" alt="${USER}">

${t.intro.join("\n\n")}

<br clear="left">

${grid(PILLARS, "24.3%")}

${full("metrics")}

${full("h-featured")}

${grid(FEATURED, "32.3%")}

${full("h-oss")}

<!-- OSS:START -->
${t.ossFallback}
<!-- OSS:END -->

<p align="right"><a href="https://github.com/${USER}?tab=repositories"><b>${t.index}</b></a></p>

${full("h-stack")}

<p align="center">
${STACK.map((row) => "  " + row.map((x) => `<code>${x}</code>`).join(" ")).join("<br>\n")}
</p>

${full("rule")}

<p align="center">
${t.contact.map(([n, h]) => `  <a href="${h}">${n}</a>`).join("\n  &nbsp;·&nbsp;\n")}
</p>
`;
}

for (const lang of Object.keys(L)) writeFileSync(join(ROOT, L[lang].file), build(lang));
console.log("readmes gerados");
