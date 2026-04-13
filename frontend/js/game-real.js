// navegação entre abas
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    pages.forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(`page-${tab.dataset.tab}`).classList.add("active");
  });
});

// mapa de bandeiras
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
  "Escócia": "scotland", // exceção local
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
  "Congo": "cd", // se você estiver usando RD Congo

  "Inglaterra": "england", // exceção local
  "Croácia": "hr",
  "Gana": "gh",
  "Panamá": "pa"
};

function getFlagSrc(countryName) {
  const flagCode = countryFlags[countryName];

  if (!flagCode) {
    return "https://via.placeholder.com/24x24?text=?";
  }

  // exceções que não funcionam bem em CDNs de país padrão
  if (flagCode === "scotland") {
    return "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg";
  }

  if (flagCode === "england") {
    return "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg";
  }

  return `https://flagcdn.com/w40/${flagCode}.png`;
}

// busca as seleções da API e monta os grupos
async function loadGroups() {
  const response = await fetch("http://localhost:8000/selections");
  const selections = await response.json();

  const groups = {};
  for (const selection of selections) {
    if (!groups[selection.group_name]) {
      groups[selection.group_name] = [];
    }
    groups[selection.group_name].push(selection);
  }

  const grid = document.getElementById("groups-grid");
  grid.innerHTML = "";

  for (const groupName of Object.keys(groups).sort()) {
    const card = document.createElement("div");
    card.className = "group-card";

    card.innerHTML = `
      <div class="group-card-header">
        <h3>Group ${groupName}</h3>
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
}

loadGroups();