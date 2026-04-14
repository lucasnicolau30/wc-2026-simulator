const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");
const body = document.body;

/* idioma local desta página */
let gameLang = "pt";

function getTranslations() {
  return window.translations || null;
}

function syncGameLangFromGlobal() {
  if (typeof window.current === "string") {
    gameLang = window.current;
  }
}

function applyTranslationLocal() {
  const translations = getTranslations();
  if (!translations) return;

  syncGameLangFromGlobal();

  const t = translations[gameLang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });
}

function setBodyBackground(tabName) {
  body.classList.remove("bg-groups", "bg-matches", "bg-knockout", "bg-performance");

  if (tabName === "groups") body.classList.add("bg-groups");
  if (tabName === "matches") body.classList.add("bg-matches");
  if (tabName === "knockout") body.classList.add("bg-knockout");
  if (tabName === "performance") body.classList.add("bg-performance");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    pages.forEach((p) => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(`page-${tab.dataset.tab}`).classList.add("active");
    setBodyBackground(tab.dataset.tab);
  });
});

/* usa o botão já existente sem redeclarar */
document.getElementById("btnLang")?.addEventListener("click", () => {
  setTimeout(() => {
    syncGameLangFromGlobal();
    applyTranslationLocal();
    loadGroups();
    renderPerformance();
  }, 0);
});

/* mapa de bandeiras */
const countryFlags = {
  "México": "mx",
  "África do Sul": "za",
  "Coreia do Sul": "kr",
  "República Tcheca": "cz",
  "Canadá": "ca",
  "Bósnia e Herzegovina": "ba",
  "Catar": "qa",
  "Suíça": "ch",
  "Brasil": "br",
  "Marrocos": "ma",
  "Haiti": "ht",
  "Escócia": "scotland",
  "Estados Unidos": "us",
  "Paraguai": "py",
  "Austrália": "au",
  "Turquia": "tr",
  "Alemanha": "de",
  "Curaçao": "cw",
  "Costa do Marfim": "ci",
  "Equador": "ec",
  "Holanda": "nl",
  "Japão": "jp",
  "Suécia": "se",
  "Tunísia": "tn",
  "Bélgica": "be",
  "Egito": "eg",
  "Irã": "ir",
  "Nova Zelândia": "nz",
  "Espanha": "es",
  "Uruguai": "uy",
  "Arábia Saudita": "sa",
  "Cabo Verde": "cv",
  "França": "fr",
  "Senegal": "sn",
  "Iraque": "iq",
  "Noruega": "no",
  "Argentina": "ar",
  "Áustria": "at",
  "Argélia": "dz",
  "Jordânia": "jo",
  "Portugal": "pt",
  "Colômbia": "co",
  "Uzbequistão": "uz",
  "Congo": "cd",
  "Inglaterra": "england",
  "Croácia": "hr",
  "Gana": "gh",
  "Panamá": "pa"
};

function getFlagSrc(countryName) {
  const flagCode = countryFlags[countryName];

  if (!flagCode) return "https://via.placeholder.com/24x24?text=?";

  if (flagCode === "scotland") {
    return "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg";
  }

  if (flagCode === "england") {
    return "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg";
  }

  return `https://flagcdn.com/w40/${flagCode}.png`;
}

/* groups */
async function loadGroups() {
  const grid = document.getElementById("groups-grid");
  grid.innerHTML = `<div class="loading">${gameLang === "pt" ? "Carregando grupos..." : "Loading groups..."}</div>`;

  try {
    const response = await fetch("http://localhost:8000/selections");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const selections = await response.json();

    const groups = {};
    for (const selection of selections) {
      if (!groups[selection.group_name]) {
        groups[selection.group_name] = [];
      }
      groups[selection.group_name].push(selection);
    }

    grid.innerHTML = "";

    for (const groupName of Object.keys(groups).sort()) {
      const card = document.createElement("div");
      card.className = "group-card";

      card.innerHTML = `
        <div class="group-card-header">
          <h3>${gameLang === "pt" ? `Grupo ${groupName}` : `Group ${groupName}`}</h3>
          <span>Pts</span>
        </div>

        ${groups[groupName].map(selection => `
          <div class="group-team">
            <span class="group-team-name">
              <img
                src="${getFlagSrc(selection.name)}"
                alt="Bandeira de ${selection.name}"
                class="group-team-flag"
              />
              <span>${selection.name}</span>
            </span>

            <span class="group-team-pts">
              <span>0</span>
              <span>0</span>
            </span>
          </div>
        `).join("")}
      `;

      grid.appendChild(card);
    }
  } catch (error) {
    console.error("Erro ao carregar grupos:", error);
    grid.innerHTML = `
      <div class="loading">
        ${gameLang === "pt" ? "Erro ao carregar grupos." : "Failed to load groups."}
      </div>
    `;
  }
}

/* matches mock */
const mockMatches = [
  { time: "DOM, 04/04 — 18:30", home: "Brasil", away: "Argentina", score: "0 - 0" },
  { time: "DOM, 04/04 — 18:30", home: "França", away: "México", score: "0 - 0" },
  { time: "DOM, 04/04 — 21:00", home: "Alemanha", away: "Japão", score: "0 - 0" },
  { time: "SEG, 05/04 — 16:00", home: "Espanha", away: "Cabo Verde", score: "0 - 0" },
  { time: "SEG, 05/04 — 18:00", home: "Arábia Saudita", away: "Irã", score: "0 - 0" },
  { time: "SEG, 05/04 — 19:00", home: "Uruguai", away: "Panamá", score: "0 - 0" }
];

function loadMatches() {
  const container = document.getElementById("matches-list");

  container.innerHTML = mockMatches.map(match => `
    <article class="match-card">
      <div class="match-meta">${match.time}</div>

      <div class="match-main">
        <div class="match-team">
          <img class="match-flag" src="${getFlagSrc(match.home)}" alt="${match.home}" />
          <span class="match-team-name">${match.home}</span>
        </div>

        <div class="match-score">${match.score}</div>

        <div class="match-team away">
          <img class="match-flag" src="${getFlagSrc(match.away)}" alt="${match.away}" />
          <span class="match-team-name">${match.away}</span>
        </div>
      </div>
    </article>
  `).join("");
}

/* performance mock */
const performanceData = {
  rating: [
    { rank: 1, name: "Vinícius Júnior", team: "Brasil", position: "FW", value: "7.8" },
    { rank: 2, name: "Kylian Mbappé", team: "França", position: "FW", value: "7.7" },
    { rank: 3, name: "Lionel Messi", team: "Argentina", position: "FW", value: "7.6" },
    { rank: 4, name: "Jude Bellingham", team: "Inglaterra", position: "MF", value: "7.5" },
    { rank: 5, name: "Rodri", team: "Espanha", position: "MF", value: "7.4" }
  ],
  goals: [
    { rank: 1, name: "Kylian Mbappé", team: "França", position: "FW", value: "5" },
    { rank: 2, name: "Harry Kane", team: "Inglaterra", position: "FW", value: "4" },
    { rank: 3, name: "Vinícius Júnior", team: "Brasil", position: "FW", value: "4" },
    { rank: 4, name: "Julián Álvarez", team: "Argentina", position: "FW", value: "3" },
    { rank: 5, name: "Morata", team: "Espanha", position: "FW", value: "3" }
  ],
  assists: [
    { rank: 1, name: "De Bruyne", team: "Bélgica", position: "MF", value: "4" },
    { rank: 2, name: "Messi", team: "Argentina", position: "FW", value: "3" },
    { rank: 3, name: "Bruno Fernandes", team: "Portugal", position: "MF", value: "3" },
    { rank: 4, name: "Bellingham", team: "Inglaterra", position: "MF", value: "2" },
    { rank: 5, name: "Valverde", team: "Uruguai", position: "MF", value: "2" }
  ],
  cleanSheets: [
    { rank: 1, name: "Alisson", team: "Brasil", position: "GK", value: "4" },
    { rank: 2, name: "Maignan", team: "França", position: "GK", value: "3" },
    { rank: 3, name: "Emiliano Martínez", team: "Argentina", position: "GK", value: "3" },
    { rank: 4, name: "Unai Simón", team: "Espanha", position: "GK", value: "2" },
    { rank: 5, name: "Courtois", team: "Bélgica", position: "GK", value: "2" }
  ]
};

const performanceFilter = document.getElementById("performance-filter");

function renderPerformance() {
  const list = document.getElementById("performance-list");
  const metric = performanceFilter.value;
  const items = performanceData[metric];

  list.innerHTML = items.map(player => `
    <article class="performance-card">
      <div class="performance-rank">#${player.rank}</div>

      <div class="performance-player">
        <img class="performance-flag" src="${getFlagSrc(player.team)}" alt="${player.team}" />
        <div class="performance-player-info">
          <div class="performance-player-name">${player.name}</div>
          <div class="performance-player-meta">${player.team}</div>
        </div>
      </div>

      <div class="performance-team">
        <span>${player.team}</span>
      </div>

      <div class="performance-pos">${player.position}</div>

      <div class="performance-value">${player.value}</div>
    </article>
  `).join("");
}

performanceFilter.addEventListener("change", renderPerformance);

/* init */
syncGameLangFromGlobal();
applyTranslationLocal();
setBodyBackground("groups");
loadGroups();
loadMatches();
renderPerformance();