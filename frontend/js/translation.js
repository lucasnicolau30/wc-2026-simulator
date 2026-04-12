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
    continue: "Continuar"
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
    continue: "Continue"
}
};

let current = "pt";

const btnLang = document.getElementById("btnLang");

btnLang.addEventListener("click", () => {
    if (current === "pt"){
        current = "en";
    }
    else{
        current = "pt";
    }

    btnLang.classList.remove("pop");
    void btnLang.offsetWidth; // reinicia a animação se clicar rápido
    btnLang.classList.add("pop");

    // translation 
    applyTranslation();
});

function applyTranslation() {
    const t = translations[current];
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) el.textContent = t[key];
    });
    btnLang.textContent = t.lang;
}

applyTranslation();