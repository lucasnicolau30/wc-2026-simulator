const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

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
  "México": "mx", "África do Sul": "za", "Coreia do Sul": "kr",
  "República Tcheca": "cz", "Canadá": "ca", "Bósnia e Herzegovina": "ba",
  "Catar": "qa", "Suíça": "ch", "Brasil": "br", "Marrocos": "ma",
  "Haiti": "ht", "Escócia": "scotland", "Estados Unidos": "us",
  "Paraguai": "py", "Austrália": "au", "Turquia": "tr",
  "Alemanha": "de", "Curaçao": "cw", "Costa do Marfim": "ci",
  "Equador": "ec", "Holanda": "nl", "Japão": "jp",
  "Suécia": "se", "Tunísia": "tn", "Bélgica": "be",
  "Egito": "eg", "Irã": "ir", "Nova Zelândia": "nz",
  "Espanha": "es", "Uruguai": "uy", "Arábia Saudita": "sa",
  "Cabo Verde": "cv", "França": "fr", "Senegal": "sn",
  "Iraque": "iq", "Noruega": "no", "Argentina": "ar",
  "Áustria": "at", "Argélia": "dz", "Jordânia": "jo",
  "Portugal": "pt", "Colômbia": "co", "Uzbequistão": "uz",
  "Congo": "cd", "Inglaterra": "england", "Croácia": "hr",
  "Gana": "gh", "Panamá": "pa"
};

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

function getFlagSrc(name){
  const code = countryFlags[name];
  if(!code) return "https://via.placeholder.com/24x24?text=?";
  if(code === "scotland") return "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg";
  if(code === "england") return "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg";
  return `https://flagcdn.com/w40/${code}.png`;
}

const ptOverrides = { "Bósnia e Herzegovina": "Bósnia" };

function getDisplayName(ptName){
  if(current === "en") return teamNames[ptName] || ptName;
  return ptOverrides[ptName] || ptName;
}

/* ===== grupos ===== */
async function loadGroups(){
  const res = await fetch(`${API_BASE_URL}/selections`);
  const selectionsRes = await res.json();

  const groups = {};
  const groupIds = {};
  for(const s of selectionsRes){
    if(!groups[s.group_name]){ groups[s.group_name] = []; groupIds[s.group_name] = s.group_id; }
    groups[s.group_name].push(s);
  }

  const standingsMap = {};
  await Promise.all(Object.entries(groupIds).map(async ([groupName, groupId]) => {
    const r = await fetch(`${API_BASE_URL}/standings/${groupId}`);
    const data = await r.json();
    standingsMap[groupName] = {};
    for(const row of data) standingsMap[groupName][row.selection_id] = row;
  }));

  const grid = document.getElementById("groups-grid");
  grid.innerHTML = "";
  const t = translations[current];

  for(const groupName of Object.keys(groups).sort()){
    const card = document.createElement("div");
    card.className = "group-card";

    const teamsHtml = groups[groupName]
      .slice()
      .sort((a, b) => {
        const sa = standingsMap[groupName]?.[a.id];
        const sb = standingsMap[groupName]?.[b.id];
        return (sb?.total_points ?? 0) - (sa?.total_points ?? 0)
          || (sb?.total_goal_difference ?? 0) - (sa?.total_goal_difference ?? 0);
      })
      .map((sel, i) => {
        const s = standingsMap[groupName]?.[sel.id];
        const played = s ? s.total_played : 0;
        const pts = s ? s.total_points : 0;
        const gd = s ? s.total_goal_difference : 0;
        const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
        return `
          <div class="group-team">
            <span class="group-team-pos pos-${i+1}">${i+1}.</span>
            <span class="group-team-name">
              <img src="${getFlagSrc(sel.name)}" alt="${sel.name}" class="group-team-flag" />
              <span>${getDisplayName(sel.name)}</span>
            </span>
            <div class="group-team-pts">
              <span>${played}</span><span>${gdStr}</span><span>${pts}</span>
            </div>
          </div>`;
      }).join("");

    card.innerHTML = `
      <div class="group-card-header">
        <h3>${current === "pt" ? `Grupo ${groupName}` : `Group ${groupName}`}</h3>
        <div class="group-stats-header">
          <span>${t.statP}</span><span>${t.statGD}</span><span>${t.statPts}</span>
        </div>
      </div>
      ${teamsHtml}`;
    grid.appendChild(card);
  }
}

/* ===== partidas ===== */
let matchesLoadToken = 0;

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
    const res = await fetch(`${API_BASE_URL}/matches`);
    if(token !== matchesLoadToken) return;
    const matches = await res.json();
    if(token !== matchesLoadToken) return;
    renderGroupMatches(matches.filter(m => m.round == round), container);
    return;
  }

  const stage = activeBtn.dataset.stage;
  const res = await fetch(`${API_BASE_URL}/knockout-matches`);
  if(token !== matchesLoadToken) return;
  const all = await res.json();
  if(token !== matchesLoadToken) return;
  let filtered = all.filter(m => m.stage === stage);

  if(filtered.length === 0){
    const generated = await tryGenerateStage(stage);
    if(token !== matchesLoadToken) return;
    if(!generated){
      let placeholder;
      if(current === "pt"){
        placeholder = "Insira os resultados da fase anterior primeiro.";
      }
      else{
        placeholder = "Enter the previous stage results first.";
      }
      container.innerHTML = `<p class="knockout-placeholder">${placeholder}</p>`;
      return;
    }
    const res2 = await fetch(`${API_BASE_URL}/knockout-matches`);
    if(token !== matchesLoadToken) return;
    const all2 = await res2.json();
    if(token !== matchesLoadToken) return;
    filtered = all2.filter(m => m.stage === stage);
  }

  if((stage === "final" || stage === "3rd") && filtered.length === 1){
    container.classList.add("single-match");
  }

  renderKnockoutMatches(filtered, container);
}

function renderGroupMatches(matches, container){
  for(const match of matches){
    const played = match.home_score !== null;

    if(played){
      const homeWon = match.home_score > match.away_score;
      const awayWon = match.away_score > match.home_score;
      container.innerHTML += `
        <article class="match-card">
          <div class="match-main">
            <div class="match-team ${homeWon ? 'match-team--winner' : ''}">
              <img class="match-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
              <span class="match-team-name">${getDisplayName(match.home_name)}</span>
            </div>
            <div class="match-score">${match.home_score} — ${match.away_score}</div>
            <div class="match-team away ${awayWon ? 'match-team--winner' : ''}">
              <img class="match-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
              <span class="match-team-name">${getDisplayName(match.away_name)}</span>
            </div>
          </div>
        </article>`;
    } else {
      container.innerHTML += `
        <article class="match-card">
          <div class="match-main">
            <div class="match-team">
              <img class="match-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
              <span class="match-team-name">${getDisplayName(match.home_name)}</span>
            </div>
            <div class="match-score-form">
              <input type="number" class="score-input score-home" min="0" max="99" value="0" inputmode="numeric" pattern="[0-9]*" />
              <span class="score-sep">—</span>
              <input type="number" class="score-input score-away" min="0" max="99" value="0" inputmode="numeric" pattern="[0-9]*" />
            </div>
            <div class="match-team away">
              <img class="match-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
              <span class="match-team-name">${getDisplayName(match.away_name)}</span>
            </div>
          </div>
          <div class="match-card-footer">
            <button class="save-btn" data-match-id="${match.id}" data-home-id="${match.home_id}" data-away-id="${match.away_id}" data-type="group">
              ${current === "pt" ? "Salvar" : "Save"}
            </button>
          </div>
        </article>`;
    }
  }
  attachSaveListeners(container);
}

function renderKnockoutMatches(matches, container){
  for(const match of matches){
    const played = match.home_score !== null;

    if(played){
      const homeWon = match.home_score > match.away_score;
      const awayWon = match.away_score > match.home_score;
      container.innerHTML += `
        <article class="match-card">
          <div class="match-main">
            <div class="match-team ${homeWon ? 'match-team--winner' : ''}">
              <img class="match-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
              <span class="match-team-name">${getDisplayName(match.home_name)}</span>
            </div>
            <div class="match-score">${match.home_score} — ${match.away_score}</div>
            <div class="match-team away ${awayWon ? 'match-team--winner' : ''}">
              <img class="match-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
              <span class="match-team-name">${getDisplayName(match.away_name)}</span>
            </div>
          </div>
        </article>`;
    } else {
      container.innerHTML += `
        <article class="match-card">
          <div class="match-main">
            <div class="match-team">
              <img class="match-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
              <span class="match-team-name">${getDisplayName(match.home_name)}</span>
            </div>
            <div class="match-score-form">
              <input type="number" class="score-input score-home" min="0" max="99" value="0" inputmode="numeric" pattern="[0-9]*" />
              <span class="score-sep">—</span>
              <input type="number" class="score-input score-away" min="0" max="99" value="0" inputmode="numeric" pattern="[0-9]*" />
            </div>
            <div class="match-team away">
              <img class="match-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
              <span class="match-team-name">${getDisplayName(match.away_name)}</span>
            </div>
          </div>
          <div class="match-card-footer">
            <button class="save-btn" data-match-id="${match.id}" data-home-id="${match.home_id}" data-away-id="${match.away_id}" data-type="knockout">
              ${current === "pt" ? "Salvar" : "Save"}
            </button>
          </div>
        </article>`;
    }
  }
  attachSaveListeners(container);
}

function attachSaveListeners(container){
  container.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".match-card");
      const homeScore = parseInt(card.querySelector(".score-home").value) || 0;
      const awayScore = parseInt(card.querySelector(".score-away").value) || 0;
      const matchId = parseInt(btn.dataset.matchId);
      const homeId = parseInt(btn.dataset.homeId);
      const awayId = parseInt(btn.dataset.awayId);
      const type = btn.dataset.type;

      // Validar empate no knockout
      if(type === "knockout" && homeScore === awayScore){
        let errorEl = card.querySelector(".match-error");
        if(!errorEl){
          errorEl = document.createElement("p");
          errorEl.className = "match-error";
          btn.closest(".match-card-footer").appendChild(errorEl);
        }
        errorEl.textContent = current === "pt"
          ? "Empate não permitido no mata-mata. Um time deve vencer."
          : "Draws not allowed in knockout. One team must win.";
        return;
      }

      btn.disabled = true;
      btn.style.opacity = "0.6";

      if(type === "group"){
        await fetch(`${API_BASE_URL}/manual/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, homeScore, awayScore })
        });
      } else {
        const winnerId = homeScore > awayScore ? homeId : awayId;
        await fetch(`${API_BASE_URL}/manual/knockout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, homeScore, awayScore, winnerId })
        });
      }

      const list = document.getElementById("matches-list");
      const scrollTop = list.scrollTop;
      await loadMatches();
      list.scrollTop = scrollTop;
      loadGroups();
    });
  });
}

async function tryGenerateStage(stage){
  const route = (stage === "3rd" || stage === "final") ? "generate-final" : `generate-${stage}`;
  try {
    const res = await fetch(`${API_BASE_URL}/${route}`, { method: "POST" });
    return res.ok;
  } catch { return false; }
}

/* ===== bracket ===== */
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

function renderBracketMatch(match, label = null){
  if(!match) return `<div class="bracket-match"><div class="bracket-tbd">—</div></div>`;

  const played = match.home_score !== null;
  const homeWon = played && match.home_score > match.away_score;
  const awayWon = played && match.away_score > match.home_score;

  const homeAbbr = teamAbbr[match.home_name] || match.home_name;
  const awayAbbr = teamAbbr[match.away_name] || match.away_name;
  const labelHtml = label ? `<div class="bracket-match-label">${label}</div>` : '';

  return `
    <div class="bracket-match ${played ? 'played' : ''}">
      ${labelHtml}
      <div class="bracket-team ${homeWon ? 'winner' : played ? 'loser' : ''}">
        <img class="bracket-flag" src="${getFlagSrc(match.home_name)}" alt="${match.home_name}" />
        <span class="bracket-team-name">${homeAbbr}</span>
        <span class="bracket-score">${played ? match.home_score : '-'}</span>
      </div>
      <div class="bracket-team ${awayWon ? 'winner' : played ? 'loser' : ''}">
        <img class="bracket-flag" src="${getFlagSrc(match.away_name)}" alt="${match.away_name}" />
        <span class="bracket-team-name">${awayAbbr}</span>
        <span class="bracket-score">${played ? match.away_score : '-'}</span>
      </div>
    </div>`;
}

async function loadKnockout(){
  const wrap = document.getElementById("knockout-wrap");
  const res = await fetch(`${API_BASE_URL}/knockout-matches`);
  const matches = await res.json();

  if(matches.length === 0){
    const t = translations[current];
    wrap.innerHTML = `<p class="knockout-placeholder">${t.manualKnockoutPlaceholder}</p>`;
    return;
  }

  const byNum = {};
  for(const m of matches) byNum[m.match_number] = m;

  const buildCol = (nums, label) => nums.map(n => renderBracketMatch(byNum[n] || null, label)).join("");

  const thirdMatch = byNum[BRACKET_LAYOUT.thirdMatch];
  const finalMatch = byNum[BRACKET_LAYOUT.finalMatch];
  const thirdHtml = thirdMatch ? `<div class="bracket-third">${renderBracketMatch(thirdMatch, translations[current].bracket3rd)}</div>` : '';

  let championHtml = '';
  if (finalMatch && finalMatch.home_score !== null) {
    let championName;
    if (finalMatch.home_score > finalMatch.away_score) {
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
      <div class="bracket-col final-col">${championHtml}${renderBracketMatch(finalMatch, translations[current].bracketFinal)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.sfRight, translations[current].bracketSF)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.qfRight, translations[current].bracketQF)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.r16Right, translations[current].bracketR16)}</div>
      <div class="bracket-col">${buildCol(BRACKET_LAYOUT.r32Right, translations[current].bracketR32)}</div>
    </div>
    ${thirdHtml}`;
}

document.querySelector('[data-tab="knockout"]').addEventListener("click", loadKnockout);

document.querySelectorAll("#matches-round-filter .round-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#matches-round-filter .round-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadMatches();
  });
});

document.getElementById("btnLang").addEventListener("click", () => {
  loadGroups();
  loadMatches();
  loadKnockout();
});

/* ===== reset modal ===== */
const resetModal = document.getElementById("resetModal");
const resetCancel = document.getElementById("resetCancel");
const resetConfirm = document.getElementById("resetConfirm");

function openResetModal(){ resetModal.classList.add("active"); resetModal.setAttribute("aria-hidden","false"); }
function closeResetModal(){ resetModal.classList.remove("active"); resetModal.setAttribute("aria-hidden","true"); }

document.getElementById("btnRefresh").addEventListener("click", openResetModal);
resetCancel.addEventListener("click", closeResetModal);
resetModal.addEventListener("click", e => { if(e.target === resetModal) closeResetModal(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && resetModal.classList.contains("active")) closeResetModal(); });

resetConfirm.addEventListener("click", async () => {
  closeResetModal();
  await fetch(`${API_BASE_URL}/simulation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "manual" })
  });
  loadGroups();
  loadMatches();
});

document.getElementById("matches-list").addEventListener("input", e => {
  if(!e.target.classList.contains("score-input")) return;
  const input = e.target;
  const raw = input.value.replace(/[^0-9]/g, "");
  const clamped = raw === "" ? "" : Math.min(99, Math.max(0, parseInt(raw, 10)));
  input.value = clamped;
});

/* ===== init ===== */
setBodyBackground("groups");
loadGroups();
loadMatches();
loadKnockout();