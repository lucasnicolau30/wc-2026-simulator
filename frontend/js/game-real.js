const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");
const performanceFilter = document.getElementById("performance-filter");

/* navegação entre abas */
function setBodyBackground(tabName){
  document.body.classList.remove("bg-groups", "bg-matches", "bg-knockout", "bg-performance");
  document.body.classList.add(`bg-${tabName}`);
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    pages.forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(`page-${tab.dataset.tab}`).classList.add("active");
    setBodyBackground(tab.dataset.tab);
  });
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
  if (flagCode === "scotland") return "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg";
  if (flagCode === "england") return "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg";
  return `https://flagcdn.com/w40/${flagCode}.png`;
}

/* groups */
async function loadGroups(){
    const response = await fetch("http://localhost:8000/selections");

    const selectionsRes = await response.json();

    const groups = {};
    const groupIds = {};

    for (const selection of selectionsRes) {
      if (!groups[selection.group_name]) {
        groups[selection.group_name] = [];
        groupIds[selection.group_name] = selection.group_id;
      }
      groups[selection.group_name].push(selection);
    }

    // busca standings de cada grupo
    const standingsMap = {};
    const grid = document.getElementById("groups-grid");
    await Promise.all(Object.entries(groupIds).map(async ([groupName, groupId]) => {
          const response = await fetch(`http://localhost:8000/standings/${groupId}`);
          const data = await response.json();

          standingsMap[groupName] = {};

            for(const row of data){
                standingsMap[groupName][row.selection_id] = row;
            }
        })
    );

    grid.innerHTML = "";

    for (const groupName of Object.keys(groups).sort()) {
      const card = document.createElement("div");
      card.className = "group-card";

      const teamsHtml = groups[groupName].map(selection => {
        const standing = standingsMap[groupName]?.[selection.id];
        const played = standing ? standing.total_played : 0;
        const pts = standing ? standing.total_points : 0;
        const gd = standing ? standing.total_goal_difference : 0;
        const gdStr = gd > 0 ? `+${gd}` : `${gd}`;

        return `
          <div class="group-team">
            <span class="group-team-name">
              <img src="${getFlagSrc(selection.name)}" alt="${selection.name}" class="group-team-flag" />
              <span>${selection.name}</span>
            </span>
            <span class="group-team-pts">
              <span>${played}</span>
              <span>${gdStr}</span>
              <span>${pts}</span>
            </span>
          </div>
        `;
      }).join("");

      card.innerHTML = `
        <div class="group-card-header">
          <h3>${current === "pt" ? `Grupo ${groupName}` : `Group ${groupName}`}</h3>
          <span style="display:flex;gap:18px;font-size:0.95rem;color:rgba(255,255,255,0.6);">
            <span>P</span><span>SG</span><span>Pts</span>
          </span>
        </div>
        ${teamsHtml}
      `;

      grid.appendChild(card);
    }
} 

async function loadMatches(){
    const round = document.getElementById("matches-round-filter").value;

    const response = await fetch("http://localhost:8000/matches");
    const matches = await response.json();

    const filtered = matches.filter(m => m.round == round);

    const container = document.getElementById("matches-list");
    container.innerHTML = "";

    for(const match of filtered){
        const eventsResponse = await fetch(`http://localhost:8000/matches/${match.id}/events`);
        const events = await eventsResponse.json();

        const homeGoals = events.filter(e => e.team_name === match.home_name);
        const awayGoals = events.filter(e => e.team_name === match.away_name);

        const homeGoalsHtml = homeGoals.map(e => `<span>${e.player_name} ${e.minute}'</span>`).join("");
        const awayGoalsHtml = awayGoals.map(e => `<span>${e.player_name} ${e.minute}'</span>`).join("");

        container.innerHTML += `
            <article class="match-card">
                <div class="match-main">
                    <div class="match-team">
                        <img class="match-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
                        <span class="match-team-name">${match.home_name}</span>
                    </div>
                    <div class="match-score">${match.home_score !== null ? `${match.home_score} — ${match.away_score}` : 'vs'}</div>
                    <div class="match-team away">
                        <img class="match-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
                        <span class="match-team-name">${match.away_name}</span>
                    </div>
                </div>
                <div class="match-events">
                    <div class="match-goals home-goals">${homeGoalsHtml}</div>
                    <div class="match-goals away-goals">${awayGoalsHtml}</div>
                </div>
            </article>
        `;
    }
}
document.getElementById("matches-round-filter").addEventListener("change", loadMatches);

document.getElementById("simulate-all-matches").addEventListener("click", async () => {
    console.log("clicou");
    const round = document.getElementById("matches-round-filter").value;
    
    const response = await fetch("http://localhost:8000/matches");
    const matches = await response.json();

    const filtered = matches.filter(m => m.round == round && m.home_score === null);

    for(const match of filtered){
        await fetch("http://localhost:8000/simulate/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchId: match.id })
        });
    }

    loadMatches();
    loadGroups();
});

function getValue(player, metric){
    if(metric === 'goals'){
      return player.total_goals;
    } 
    if(metric === 'assists'){
      return player.total_assists;
    } 
    if(metric === 'cleanSheets'){
      return player.total_clean_sheets;
    } 
    if(metric === 'rating'){
      return parseFloat(player.average_rating).toFixed(1);
    } 
}

async function renderPerformance(){
    const metric = performanceFilter.value;
    
    const response = await fetch(`http://localhost:8000/performance/${metric}`);
    const players = await response.json();

    const list = document.getElementById("performance-list");

    list.innerHTML = players.map((player, index) => `
        <article class="performance-card">
            <div class="performance-rank">#${index + 1}</div>
            <div class="performance-player">
                <img class="performance-flag" src="${getFlagSrc(player.selection_name)}" alt="${player.selection_name}" />
                <div class="performance-player-info">
                    <div class="performance-player-name">${player.player_name}</div>
                    <div class="performance-player-meta">${player.selection_name}</div>
                </div>
            </div>
            <div class="performance-team"><span>${player.selection_name}</span></div>
            <div class="performance-pos">${player.position}</div>
            <div class="performance-value">${getValue(player, metric)}</div>
        </article>
    `).join("");
}

performanceFilter.addEventListener("change", renderPerformance);

/* init */
setBodyBackground("groups");
loadGroups();
loadMatches();
renderPerformance();