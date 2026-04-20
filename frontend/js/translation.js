const translations = {
pt: {
    // home.html
    homeHeader: "WC2026 Simulador",
    homeTitle: "SIMULADOR DA COPA DO MUNDO",
    homeDescription: "Simule o maior torneio do mundo.",
    loading: "Carregando modos...",
    startSimulation: "Simular Agora",
    lang: "EN",

    // simulation.html
    simHeader: "Escolha o Modo de Simulação — WC2026",
    simTitle: "Escolha o Modo de Simulação",
    simSubtitle: "Selecione entre simulação automática com base em estatísticas reais ou simule manualmente as partidas.",
    realTitle: "Simulação Real",
    realDesc: "Simule os torneios usando estatísticas e dados reais para resultados mais precisos.",
    manualTitle: "Simulação Manual",
    manualDesc: "Simule cada partida manualmente, escolhendo os vencedores a cada confronto.",
    loadingSimulation: "Carregando simulação...",
    continue: "Continuar",

    // game-real.html — navbar
    gameHeader: "WC2026 — Fase de Grupos",
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

    // game-real.html — performance
    performancePageTitle: "Desempenhos",
    performanceRating: "Média de Nota",
    performanceGoals: "Artilheiros",
    performanceAssists: "Assistências",
    performanceCleanSheets: "Clean Sheets",

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
    saveMatch: "Salvar",
    drawNotAllowed: "Empate não permitido no mata-mata. Um time deve vencer.",
    },

en: {
    // home.html
    homeHeader: "WC2026 Simulator",
    homeTitle: "WORLD CUP SIMULATOR",
    homeDescription: "Simulate the biggest tournament in the world.",
    loading: "Loading modes...",
    startSimulation: "Simulate Now",
    lang: "PT",

    // simulation.html
    simHeader: "Choose Simulation Mode — WC2026",
    simTitle: "Choose Simulation Mode",
    simSubtitle: "Select between automatic simulation based on real statistics or manually simulate each match.",
    realTitle: "Real Simulation",
    realDesc: "Simulate tournaments using real statistics and data for more accurate results.",
    manualTitle: "Manual Simulation",
    manualDesc: "Simulate each match manually, choosing the winners at each matchup.",
    loadingSimulation: "Loading simulation...",
    continue: "Continue",

    // game-real.html — navbar
    gameHeader: "WC2026 — Group Stage",
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

    // game-real.html — performance
    performancePageTitle: "Performance",
    performanceRating: "Average Rating",
    performanceGoals: "Top Scorers",
    performanceAssists: "Assists",
    performanceCleanSheets: "Clean Sheets",

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
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if(t[key]){
            el.textContent = t[key];
        }
    });
    btnLang.textContent = t.lang;
}

applyTranslation();