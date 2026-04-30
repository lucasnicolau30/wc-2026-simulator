const translations = {
pt: {
    // simulation.html
    homeTitle: "SIMULADOR DA COPA DO MUNDO 2026",
    lang: "EN",
    simTitle: "Escolha o Modo de Simulação",
    simSubtitle: "Selecione entre simulação automática com base em estatísticas reais ou simule manualmente as partidas.",
    realTitle: "Simulação Real",
    realDesc: "Simule os torneios usando estatísticas e dados reais para resultados mais precisos.",
    manualTitle: "Simulação Manual",
    manualDesc: "Simule cada partida manualmente, escolhendo os vencedores a cada confronto.",
    loadingSimulation: "Carregando simulação...",
    continue: "Continuar",

    // game-real.html — navbar
    groupsTab: "Grupos",
    matchesTab: "Partidas",
    knockoutTab: "Eliminatórias",
    performanceTab: "Desempenhos",

    // game-real.html — groups
    groupStageTitle: "Fase de Grupos",
    loadingGroups: "Carregando grupos...",
    statP: "PJ",
    statGD: "SG",
    statPts: "Pts",

    // game-real.html — matches
    matchesTitle: "Partidas",
    loadingMatches: "Carregando partidas...",
    simulateAll: "Simular Todas",
    round1: "Rodada 1",
    round2: "Rodada 2",
    round3: "Rodada 3",

    // game-real.html — knockout
    knockoutStageTitle: "Fase Eliminatória",
    roundOf16: "Oitavas de Final",
    quarterFinals: "Quartas de Final",
    semiFinals: "Semifinais",
    finalTab: "Final",
    knockoutPlaceholder: "Simule a fase de grupos primeiro.",
    manualKnockoutPlaceholder: "Insira os resultados da fase de grupos primeiro.",
    stageR32: "16 Avos",
    stageR16: "Oitavas",
    stageQF: "Quartas",
    stageSF: "Semis",
    stage3rd: "3º Lugar",
    stageFinal: "Final",
    bracketR32: "16 AVOS",
    bracketR16: "OITAVAS",
    bracketQF: "QUARTAS",
    bracketSF: "SEMIS",
    bracketFinal: "FINAL",
    bracket3rd: "3º LUGAR",
    bracketChampion: "Campeão",

    // game-real.html — performance
    performancePageTitle: "Desempenhos",
    performanceRating: "Média de Nota",
    performanceGoals: "Artilheiros",
    performanceAssists: "Assistências",
    performanceCleanSheets: "Clean Sheets",
    performanceSearch: "Pesquisar atleta...",
    performanceEmpty: "Os dados de desempenho são gerados a partir da primeira partida simulada.",
    matchesEmpty: "Simule a primeira partida para ver os resultados aqui.",

    // game-real.html - reset button
    reset: "REINICIAR",
    resetTitle: "Reiniciar simulação?",
    resetText: "Isso apagará todos os jogos, pênaltis e estatísticas. As seleções e jogadores serão mantidos.",
    cancel: "Cancelar",
    confirm: "Reiniciar",

    // game-manual.html
    manualGameHeader: "WC2026 — Manual",
    manualResetTitle: "Reiniciar simulação?",
    manualResetText: "Isso apagará todos os jogos e resultados. As seleções e jogadores serão mantidos.",
    },

en: {
    // simulation.html
    homeTitle: "WORLD CUP SIMULATOR 2026",
    lang: "PT",
    simTitle: "Choose Simulation Mode",
    simSubtitle: "Select between automatic simulation based on real statistics or manually simulate each match.",
    realTitle: "Real Simulation",
    realDesc: "Simulate tournaments using real statistics and data for more accurate results.",
    manualTitle: "Manual Simulation",
    manualDesc: "Simulate each match manually, choosing the winners at each matchup.",
    loadingSimulation: "Loading simulation...",
    continue: "Continue",

    // game-real.html — navbar
    groupsTab: "Groups",
    matchesTab: "Matches",
    knockoutTab: "Knockout",
    performanceTab: "Performance",

    // game-real.html — groups
    groupStageTitle: "Group Stage",
    loadingGroups: "Loading groups...",
    statP: "MP",
    statGD: "GD",
    statPts: "Pts",

    // game-real.html — matches
    matchesTitle: "Matches",
    loadingMatches: "Loading matches...",
    simulateAll: "Simulate All",
    round1: "Round 1",
    round2: "Round 2",
    round3: "Round 3",

    // game-real.html — knockout
    knockoutStageTitle: "Knockout Stage",
    roundOf16: "Round of 16",
    quarterFinals: "Quarter-finals",
    semiFinals: "Semi-finals",
    finalTab: "Final",
    knockoutPlaceholder: "Simulate the group stage first.",
    manualKnockoutPlaceholder: "Enter the group stage results first.",
    stageR32: "R32",
    stageR16: "R16",
    stageQF: "QF",
    stageSF: "SF",
    stage3rd: "3rd Place",
    stageFinal: "Final",
    bracketR32: "R32",
    bracketR16: "R16",
    bracketQF: "QF",
    bracketSF: "SF",
    bracketFinal: "FINAL",
    bracket3rd: "3RD PLACE",
    bracketChampion: "Champion",

    // game-real.html — performance
    performancePageTitle: "Performance",
    performanceRating: "Average Rating",
    performanceGoals: "Top Scorers",
    performanceAssists: "Assists",
    performanceCleanSheets: "Clean Sheets",
    performanceSearch: "Search athlete...",
    performanceEmpty: "Performance data is generated from the first simulated match.",
    matchesEmpty: "Simulate the first match to see results here.",

    // game-real.html - reset button
    reset: "RESET",
    resetTitle: "Reset simulation?",
    resetText: "This will erase all matches, penalties and stats. Teams and players will be kept.",
    cancel: "Cancel",
    confirm: "Reset",

    // game-manual.html
    manualGameHeader: "WC2026 — Manual",
    manualResetTitle: "Reset simulation?",
    manualResetText: "This will erase all matches and results. Teams and players will be kept.",
    saveMatch: "Save",
    drawNotAllowed: "Draws not allowed in knockout. One team must win.",
    }
};

const SEO = {
    pt: {
        title: "Simulador Copa do Mundo 2026 | Simule grupos e campeão",
        description: "Simule a Copa do Mundo 2026 completa. Fase de grupos com 48 seleções, mata-mata e campeão. Modo automático com estatísticas reais e modo manual.",
        ogTitle: "Simulador Copa do Mundo 2026",
        ogDescription: "Simule a Copa do Mundo 2026 completa. 48 seleções, fase de grupos e mata-mata.",
    },
    en: {
        title: "World Cup 2026 Simulator | Simulate groups and champion",
        description: "Simulate the full 2026 World Cup. 48 teams, group stage, knockout rounds and champion. Automatic mode with real stats and manual mode.",
        ogTitle: "World Cup 2026 Simulator",
        ogDescription: "Simulate the full 2026 World Cup. 48 teams, group stage and knockout rounds.",
    }
};

let current = localStorage.getItem("lang") || "pt";

const btnLang = document.getElementById("btnLang");

btnLang.addEventListener("click", () => {
    if(current === "pt"){
    current = "en";
    } 
    else{
    current = "pt";
    }
    localStorage.setItem("lang", current);

    btnLang.classList.remove("pop");
    void btnLang.offsetWidth;
    btnLang.classList.add("pop");

    applyTranslation();
});

function applyTranslation() {
    const t = translations[current];
    const seo = SEO[current];

    // Atualiza lang do HTML (importante pro Google)
    document.documentElement.lang = current === "pt" ? "pt-BR" : "en";

    // Atualiza title e meta description dinamicamente
    if (seo) {
        document.title = seo.title;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", seo.description);

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute("content", seo.ogTitle);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute("content", seo.ogDescription);

        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle) twTitle.setAttribute("content", seo.ogTitle);

        const twDesc = document.querySelector('meta[name="twitter:description"]');
        if (twDesc) twDesc.setAttribute("content", seo.ogDescription);
    }

    // Aplica traduções nos elementos
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) el.textContent = t[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (t[key]) el.placeholder = t[key];
    });
    btnLang.textContent = t.lang;
}

applyTranslation();