const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

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

/* shootouts em memória — matchId → { winner, goalsA, goalsB, eventsA, eventsB, homeTeam, awayTeam } */
const shootoutCache = new Map();

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

/* traduções PT → EN dos nomes */
const teamNames = {
  "México": "Mexico", "África do Sul": "South Africa", "Coreia do Sul": "South Korea",
  "República Tcheca": "Czech Republic", "Canadá": "Canada", "Bósnia e Herzegovina": "Bosnia",
  "Catar": "Qatar", "Suíça": "Switzerland", "Brasil": "Brazil", "Marrocos": "Morocco",
  "Haiti": "Haiti", "Escócia": "Scotland", "Estados Unidos": "United States",
  "Paraguai": "Paraguay", "Austrália": "Australia", "Turquia": "Turkey",
  "Alemanha": "Germany", "Curaçao": "Curaçao", "Costa do Marfim": "Ivory Coast",
  "Equador": "Ecuador", "Holanda": "Netherlands", "Japão": "Japan",
  "Suécia": "Sweden", "Tunísia": "Tunisia", "Bélgica": "Belgium",
  "Egito": "Egypt", "Irã": "Iran", "Nova Zelândia": "New Zealand",
  "Espanha": "Spain", "Uruguai": "Uruguay", "Arábia Saudita": "Saudi Arabia",
  "Cabo Verde": "Cape Verde", "França": "France", "Senegal": "Senegal",
  "Iraque": "Iraq", "Noruega": "Norway", "Argentina": "Argentina",
  "Áustria": "Austria", "Argélia": "Algeria", "Jordânia": "Jordan",
  "Portugal": "Portugal", "Colômbia": "Colombia", "Uzbequistão": "Uzbekistan",
  "Congo": "Congo", "Inglaterra": "England", "Croácia": "Croatia",
  "Gana": "Ghana", "Panamá": "Panama"
};

/* abreviações FIFA */
const teamAbbr = {
  "México": "MEX", "África do Sul": "RSA", "Coreia do Sul": "KOR",
  "República Tcheca": "CZE", "Canadá": "CAN", "Bósnia e Herzegovina": "BIH",
  "Catar": "QAT", "Suíça": "SUI", "Brasil": "BRA", "Marrocos": "MAR",
  "Haiti": "HAI", "Escócia": "SCO", "Estados Unidos": "USA",
  "Paraguai": "PAR", "Austrália": "AUS", "Turquia": "TUR",
  "Alemanha": "GER", "Curaçao": "CUW", "Costa do Marfim": "CIV",
  "Equador": "ECU", "Holanda": "NED", "Japão": "JPN",
  "Suécia": "SWE", "Tunísia": "TUN", "Bélgica": "BEL",
  "Egito": "EGY", "Irã": "IRN", "Nova Zelândia": "NZL",
  "Espanha": "ESP", "Uruguai": "URU", "Arábia Saudita": "KSA",
  "Cabo Verde": "CPV", "França": "FRA", "Senegal": "SEN",
  "Iraque": "IRQ", "Noruega": "NOR", "Argentina": "ARG",
  "Áustria": "AUT", "Argélia": "ALG", "Jordânia": "JOR",
  "Portugal": "POR", "Colômbia": "COL", "Uzbequistão": "UZB",
  "Congo": "CGO", "Inglaterra": "ENG", "Croácia": "CRO",
  "Gana": "GHA", "Panamá": "PAN"
};

function getFlagSrc(countryName) {
  const flagCode = countryFlags[countryName];
  if (!flagCode) return "https://via.placeholder.com/24x24?text=?";
  if (flagCode === "scotland") return "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg";
  if (flagCode === "england") return "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg";
  return `https://flagcdn.com/w40/${flagCode}.png`;
}

const ptOverrides = { "Bósnia e Herzegovina": "Bósnia" };

function getDisplayName(ptName) {
  if (current === "en") return teamNames[ptName] || ptName;
  return ptOverrides[ptName] || ptName;
}

/* groups */
async function loadGroups(){
    const response = await fetch(`${API_BASE_URL}/selections`);
    if(!response.ok) return;
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

    const standingsMap = {};
    const grid = document.getElementById("groups-grid");
    await Promise.all(Object.entries(groupIds).map(async ([groupName, groupId]) => {
          const response = await fetch(`${API_BASE_URL}/standings/${groupId}`);
          if(!response.ok) return;
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

      const t = translations[current];

      const teamsHtml = groups[groupName]
        .slice()
        .sort((a, b) => {
          const sa = standingsMap[groupName]?.[a.id];
          const sb = standingsMap[groupName]?.[b.id];
          return (sb?.total_points ?? 0) - (sa?.total_points ?? 0)
            || (sb?.total_goal_difference ?? 0) - (sa?.total_goal_difference ?? 0);
        })
        .map((selection, index) => {
          const standing = standingsMap[groupName]?.[selection.id];
          const played = standing ? standing.total_played : 0;
          const pts = standing ? standing.total_points : 0;
          const gd = standing ? standing.total_goal_difference : 0;
          const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
          const displayName = getDisplayName(selection.name);

          return `
            <div class="group-team">
              <span class="group-team-pos pos-${index + 1}">${index + 1}.</span>
              <span class="group-team-name">
                <img src="${getFlagSrc(selection.name)}" alt="${selection.name}" class="group-team-flag" />
                <span>${displayName}</span>
              </span>
              <div class="group-team-pts">
                <span>${played}</span>
                <span>${gdStr}</span>
                <span>${pts}</span>
              </div>
            </div>
          `;
        }).join("");

      card.innerHTML = `
        <div class="group-card-header">
          <h3>${current === "pt" ? `Grupo ${groupName}` : `Group ${groupName}`}</h3>
          <div class="group-stats-header">
            <span>${t.statP}</span><span>${t.statGD}</span><span>${t.statPts}</span>
          </div>
        </div>
        ${teamsHtml}
      `;

      grid.appendChild(card);
    }
}

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
    const filterBtns = document.querySelectorAll("#performance-filter .round-btn");
    const activeBtn = document.querySelector("#performance-filter .round-btn.active");

    if(!activeBtn){
        filterBtns[0]?.classList.add("active");
    }

    const metric = document.querySelector("#performance-filter .round-btn.active")?.dataset.metric ?? "rating";
    const searchTerm = document.getElementById("performance-search")?.value.trim() ?? "";

    const url = new URL(`${API_BASE_URL}/performance/${metric}`);
    if(searchTerm){
        url.searchParams.set("search", searchTerm);
    }

    const response = await fetch(url.toString());
    if(!response.ok) return;
    const players = await response.json();

    const list = document.getElementById("performance-list");

    if(players.length === 0){
        list.innerHTML = `<p class="knockout-placeholder">${translations[current].performanceEmpty}</p>`;
        return;
    }

    list.innerHTML = players.map((player, index) => `
        <article class="performance-card">
            <div class="performance-rank">#${index + 1}.</div>
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

let performanceSearchDebounce = null;

document.querySelectorAll("#performance-filter .round-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#performance-filter .round-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderPerformance();
  });
});

document.getElementById("performance-search")?.addEventListener("input", () => {
  clearTimeout(performanceSearchDebounce);
  performanceSearchDebounce = setTimeout(() => {
    renderPerformance();
  }, 300);
});

/* ===== matches (grupos + mata-mata) ===== */

let matchesLoadToken = 0;

async function hydrateShootoutsFromDb(matches){
    const toFetch = [];
    for(const match of matches){
        if(match.shootout_home_score === null || match.shootout_home_score === undefined) continue;
        if(shootoutCache.has(match.id)) continue;
        toFetch.push(match);
    }

    if(toFetch.length === 0) return;

    const shootouts = await Promise.all(
        toFetch.map(async (match) => {
            const response = await fetch(`${API_BASE_URL}/matches/${match.id}/shootout`);
            if(!response.ok) return null;
            return response.json();
        })
    );

    for(let i = 0; i < toFetch.length; i++){
        const match = toFetch[i];
        const data = shootouts[i];
        if(!data) continue;
        shootoutCache.set(match.id, {
            winner: data.winner,
            goalsA: data.goalsA,
            goalsB: data.goalsB,
            eventsA: data.eventsA,
            eventsB: data.eventsB,
            homeTeam: match.home_name,
            awayTeam: match.away_name
        });
    }
}

async function loadMatches(){
    const token = ++matchesLoadToken;

    const activeBtn = document.querySelector("#matches-round-filter .round-btn.active");
    let phase = "group";
    if(activeBtn){
        phase = activeBtn.dataset.phase;
    }
    const container = document.getElementById("matches-list");

    container.innerHTML = "";
    container.classList.remove("single-match");

    if(phase === "group"){
        const round = activeBtn.dataset.round;
        const response = await fetch(`${API_BASE_URL}/matches`);
        if(!response.ok || token !== matchesLoadToken) return;
        const matches = await response.json();
        if(token !== matchesLoadToken) return;
        const filtered = matches.filter(m => m.round == round);
        if(filtered.length === 0){
            if(token !== matchesLoadToken) return;
            container.innerHTML = `<p class="knockout-placeholder">${translations[current].matchesEmpty}</p>`;
            return;
        }
        await renderMatchCards(filtered, container, token);
        return;
    }

    const stage = activeBtn.dataset.stage;

    const response = await fetch(`${API_BASE_URL}/knockout-matches`);
    if(!response.ok || token !== matchesLoadToken) return;
    const allKnockout = await response.json();
    if(token !== matchesLoadToken) return;
    let filtered = allKnockout.filter(m => m.stage === stage);

    if(filtered.length === 0){
        const generated = await tryGenerateStage(stage);
        if(token !== matchesLoadToken) return;
        if(!generated){
            let placeholder;
            if(current === "pt"){
                placeholder = "Simule a fase anterior primeiro.";
            }
            else{
                placeholder = "Simulate the previous stage first.";
            }
            container.innerHTML = `<p class="knockout-placeholder">${placeholder}</p>`;
            return;
        }

        const response2 = await fetch(`${API_BASE_URL}/knockout-matches`);
        if(!response2.ok || token !== matchesLoadToken) return;
        const allKnockout2 = await response2.json();
        if(token !== matchesLoadToken) return;
        filtered = allKnockout2.filter(m => m.stage === stage);
    }

    if(stage === "final" || stage === "3rd"){
        if(filtered.length === 1){
            container.classList.add("single-match");
        }
    }

    await hydrateShootoutsFromDb(filtered);
    if(token !== matchesLoadToken) return;

    await renderMatchCards(filtered, container, token);
}

function buildShootoutHtml(shootout){
    if(!shootout) return '';

    const homeEvents = shootout.eventsA ?? [];
    const awayEvents = shootout.eventsB ?? [];

    const homeBalls = homeEvents.map(h => {
        const cls = h.scored ? 'pk-scored' : 'pk-missed';
        return `<span class="pk-kick ${cls}"><span class="pk-ball"></span><span class="pk-name">${h.player}</span></span>`;
    }).join('');

    const awayBalls = awayEvents.map(a => {
        const cls = a.scored ? 'pk-scored' : 'pk-missed';
        return `<span class="pk-kick ${cls}"><span class="pk-ball"></span><span class="pk-name">${a.player}</span></span>`;
    }).join('');

    const label = current === 'pt' ? 'Pênaltis' : 'Penalties';

    return `
        <div class="match-penalties">
            <div class="pk-col pk-col-home">${homeBalls}</div>
            <div class="pk-header">
                <span class="pk-label">${label}</span>
                <span class="pk-score">${shootout.goalsA} – ${shootout.goalsB}</span>
            </div>
            <div class="pk-col pk-col-away">${awayBalls}</div>
        </div>
    `;
}

async function renderMatchCards(matches, container, token){
    const eventsPerMatch = await Promise.all(
        matches.map(async (match) => {
            const eventsResponse = await fetch(`${API_BASE_URL}/matches/${match.id}/events`);
            if(!eventsResponse.ok) return [];
            return eventsResponse.json();
        })
    );

    if(token !== undefined && token !== matchesLoadToken) return;

    const cards = matches.map((match, idx) => {
        const events = eventsPerMatch[idx] ?? [];
        const homeGoals = events.filter(e => e.team_name === match.home_name);
        const awayGoals = events.filter(e => e.team_name === match.away_name);

        const homeGoalsHtml = homeGoals.map(e => `<span>${e.player_name} ${e.minute}'</span>`).join("");
        const awayGoalsHtml = awayGoals.map(e => `<span>${e.player_name} ${e.minute}'</span>`).join("");

        let shootout = null;
        if(shootoutCache.has(match.id)){
            shootout = shootoutCache.get(match.id);
        }
        const shootoutHtml = buildShootoutHtml(shootout);

        let scoreText;
        if(match.home_score !== null){
            scoreText = `${match.home_score} — ${match.away_score}`;
        }
        else{
            scoreText = 'vs';
        }

        return `
            <article class="match-card">
                <div class="match-main">
                    <div class="match-team">
                        <img class="match-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
                        <span class="match-team-name">${getDisplayName(match.home_name)}</span>
                    </div>
                    <div class="match-score">${scoreText}</div>
                    <div class="match-team away">
                        <img class="match-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
                        <span class="match-team-name">${getDisplayName(match.away_name)}</span>
                    </div>
                </div>
                <div class="match-events">
                    <div class="match-goals home-goals">${homeGoalsHtml}</div>
                    <div></div>
                    <div class="match-goals away-goals">${awayGoalsHtml}</div>
                </div>
                ${shootoutHtml}
            </article>
        `;
    });

    container.innerHTML = cards.join("");
}

/* tenta gerar os confrontos de uma fase do mata-mata */
/* retorna true se gerou com sucesso, false se faltam pré-condições */
async function tryGenerateStage(stage){
    let route;
    if(stage === '3rd' || stage === 'final'){
        route = 'generate-final';
    }
    else{
        route = `generate-${stage}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${route}`, { method: 'POST' });
        if(!response.ok) return false;
        return true;
    }
    catch(err){
        return false;
    }
}

document.querySelectorAll("#matches-round-filter .round-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#matches-round-filter .round-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadMatches();
  });
});

document.getElementById("simulate-all-matches").addEventListener("click", async () => {
    const activeBtn = document.querySelector("#matches-round-filter .round-btn.active");
    const phase = activeBtn?.dataset.phase ?? "group";

    if(phase === "group"){
        const round = activeBtn.dataset.round;
        const response = await fetch(`${API_BASE_URL}/matches`);
        if(!response.ok) return;
        const matches = await response.json();
        const filtered = matches.filter(m => m.round == round && m.home_score === null);

        for(const match of filtered){
            await fetch(`${API_BASE_URL}/simulate/match`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId: match.id })
            });
        }

        loadMatches();
        loadGroups();
        return;
    }

    // phase === "knockout"
    const stage = activeBtn.dataset.stage;

    const kResponse = await fetch(`${API_BASE_URL}/knockout-matches`);
    if(!kResponse.ok) return;
    const allKnockout = await kResponse.json();
    const existing = allKnockout.filter(m => m.stage === stage);

    if(existing.length === 0){
        await tryGenerateStage(stage);
    }

    const simResponse = await fetch(`${API_BASE_URL}/simulate/all-knockouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: stage })
    });
    if(!simResponse.ok) return;
    const simData = await simResponse.json();

    if(simData.results){
        const refreshRes = await fetch(`${API_BASE_URL}/knockout-matches`);
        if(!refreshRes.ok) return;
        const refreshed = await refreshRes.json();

        const matchMap = {};
        for(const m of refreshed){
            matchMap[m.id] = m;
        }

        for(const r of simData.results){
            if(r.shootout){
                const m = matchMap[r.matchId];

                let homeTeam = null;
                if(m){
                    homeTeam = m.home_name;
                }

                let awayTeam = null;
                if(m){
                    awayTeam = m.away_name;
                }

                shootoutCache.set(r.matchId, {
                    winner: r.shootout.winner,
                    goalsA: r.shootout.goalsA,
                    goalsB: r.shootout.goalsB,
                    eventsA: r.shootout.eventsA,
                    eventsB: r.shootout.eventsB,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam
                });
            }
        }
    }

    loadMatches();
    loadKnockout();
    renderPerformance();
});

/* ===== knockout bracket (só visualização) ===== */

const BRACKET_LAYOUT = {
  r32Left:  [74, 77, 73, 75, 76, 78, 79, 80],
  r32Right: [83, 84, 86, 88, 81, 82, 85, 87],
  r16Left:  [89, 90, 91, 92],
  r16Right: [93, 95, 94, 96],
  qfLeft:   [97, 99],
  qfRight:  [98, 100],
  sfLeft:   [101],
  sfRight:  [102],
  finalMatch: 104,
  thirdMatch: 103
};

function renderBracketMatch(match, label = null, shootout = null){
  if(!match){
    return `<div class="bracket-match"><div class="bracket-tbd">—</div></div>`;
  }

  const played = match.home_score !== null;
  let homeWon = false;
  let awayWon = false;
  if(played){
    if(shootout){
      homeWon = shootout.winner === match.home_name;
      awayWon = shootout.winner === match.away_name;
    } else {
      homeWon = match.home_score > match.away_score;
      awayWon = match.away_score > match.home_score;
    }
  }

  const homeClasses = [];
  const awayClasses = [];
  if(homeWon) homeClasses.push('winner');
  if(played && !homeWon) homeClasses.push('loser');
  if(awayWon) awayClasses.push('winner');
  if(played && !awayWon) awayClasses.push('loser');

  const homeAbbr = teamAbbr[match.home_name] || match.home_name;
  const awayAbbr = teamAbbr[match.away_name] || match.away_name;

  const playedClass = played ? 'played' : '';
  const labelHtml = label ? `<div class="bracket-match-label">${label}</div>` : '';

  const homeScore = played ? match.home_score : '-';
  const awayScore = played ? match.away_score : '-';

  const homePk = (shootout && played) ? ` <span class="bracket-pk">(${shootout.goalsA})</span>` : '';
  const awayPk = (shootout && played) ? ` <span class="bracket-pk">(${shootout.goalsB})</span>` : '';

  return `
    <div class="bracket-match ${playedClass}">
      ${labelHtml}
      <div class="bracket-team ${homeClasses.join(' ')}">
        <img class="bracket-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
        <span class="bracket-team-name">${homeAbbr}${homePk}</span>
        <span class="bracket-score">${homeScore}</span>
      </div>
      <div class="bracket-team ${awayClasses.join(' ')}">
        <img class="bracket-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
        <span class="bracket-team-name">${awayAbbr}${awayPk}</span>
        <span class="bracket-score">${awayScore}</span>
      </div>
    </div>
  `;
}

async function loadKnockout(){
  const wrap = document.getElementById('knockout-wrap');

  const response = await fetch(`${API_BASE_URL}/knockout-matches`);
  if(!response.ok) return;
  const matches = await response.json();

  if(matches.length === 0){
    wrap.innerHTML = `<p class="knockout-placeholder">${translations[current].knockoutPlaceholder}</p>`;
    return;
  }

  await hydrateShootoutsFromDb(matches);

  const byNum = {};
  for(const m of matches){
    byNum[m.match_number] = m;
  }

  const buildCol = (nums, label) => nums.map(n => {
    const m = byNum[n];
    const so = m ? shootoutCache.get(m.id) || null : null;
    return renderBracketMatch(m, label, so);
  }).join('');

  const thirdMatch = byNum[BRACKET_LAYOUT.thirdMatch];
  const finalMatch = byNum[BRACKET_LAYOUT.finalMatch];

  let thirdHtml = '';
  if(thirdMatch){
      const thirdSo = shootoutCache.get(thirdMatch.id) || null;
      thirdHtml = `
        <div class="bracket-third">
          ${renderBracketMatch(thirdMatch, translations[current].bracket3rd, thirdSo)}
        </div>
      `;
  }

  const finalSo = finalMatch ? shootoutCache.get(finalMatch.id) || null : null;

  let championHtml = '';
  if (finalMatch && finalMatch.home_score !== null) {
    let championName;
    if (finalSo) {
      championName = finalSo.winner;
    } else if (finalMatch.home_score > finalMatch.away_score) {
      championName = finalMatch.home_name;
    } else {
      championName = finalMatch.away_name;
    }
    championHtml = `
      <div class="bracket-champion">
        <div class="champion-label">${translations[current].bracketChampion}</div>
        <div class="champion-team">
          <img src="${getFlagSrc(championName)}" class="champion-flag" alt="${championName}" />
          <span>${getDisplayName(championName)}</span>
        </div>
      </div>
    `;
  }

  wrap.innerHTML = `
    <div class="knockout-bracket">
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.r32Left, translations[current].bracketR32)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.r16Left, translations[current].bracketR16)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.qfLeft, translations[current].bracketQF)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.sfLeft, translations[current].bracketSF)}</div>
      <div class="bracket-col final-col">${championHtml}${renderBracketMatch(finalMatch, translations[current].bracketFinal, finalSo)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.sfRight, translations[current].bracketSF)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.qfRight, translations[current].bracketQF)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.r16Right, translations[current].bracketR16)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.r32Right, translations[current].bracketR32)}</div>
    </div>
    ${thirdHtml}
  `;
}

document.querySelector('[data-tab="knockout"]').addEventListener('click', () => {
  loadKnockout();
});

document.querySelector('[data-tab="performance"]').addEventListener('click', () => {
  renderPerformance();
});

/* re-render ao trocar idioma */
document.getElementById("btnLang").addEventListener("click", () => {
  loadGroups();
  loadMatches();
  loadKnockout();
  renderPerformance();
});

/* init */
setBodyBackground("groups");
loadGroups();
loadMatches();
renderPerformance();

/* refresh */

const resetModal = document.getElementById("resetModal");
const resetCancel = document.getElementById("resetCancel");
const resetConfirm = document.getElementById("resetConfirm");

function openResetModal(){
  resetModal.classList.add("active");
  resetModal.setAttribute("aria-hidden", "false");
}

function closeResetModal(){
  resetModal.classList.remove("active");
  resetModal.setAttribute("aria-hidden", "true");
}

document.getElementById("btnRefresh").addEventListener("click", openResetModal);
resetCancel.addEventListener("click", closeResetModal);
resetModal.addEventListener("click", (e) => {
  if(e.target === resetModal) closeResetModal();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && resetModal.classList.contains("active")) closeResetModal();
});

resetConfirm.addEventListener("click", async () => {
  closeResetModal();

  await fetch(`${API_BASE_URL}/reset`, { method: "POST" });

  await fetch(`${API_BASE_URL}/simulation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "real" })
  });

  shootoutCache.clear();

  loadGroups();
  loadMatches();
  loadKnockout();
  renderPerformance();
});