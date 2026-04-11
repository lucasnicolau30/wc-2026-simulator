const translations = {
pt: {
    // index.html
    simulations: "Simulações",
    lang: "EN",

    // simulacao.html
    simTitle: "Escolha o Modo de Simulação",
    simSubtitle: "Selecione entre simulação automática com base em estatísticas reais ou simule manualmente as partidas.",
    realTitle: "Simulação Real",
    realDesc: "Simule os torneios usando estatísticas e dados reais para resultados mais precisos.",
    manualTitle: "Simulação Manual",
    manualDesc: "Simule cada partida manualmente, escolhendo os vencedores a cada confronto.",
    continue: "Continuar"
},

en: {
    // index.html
    simulations: "Simulations",
    lang: "PT",

    // simulacao.html
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

    const t = translations[current];

    // index.html
    const btnText = document.querySelector(".button-text");
    if (btnText) btnText.textContent = t.simulations;

    btnLang.textContent = t.lang;

    btnLang.classList.remove("pop");
    void btnLang.offsetWidth; // reinicia a animação se clicar rápido
    btnLang.classList.add("pop");

    // simulacao.html
    applyTranslation();
});

// simulacao.html
function applyTranslation() {
    const t = translations[current];
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) el.textContent = t[key];
    });
}

// simulacao.html
document.querySelectorAll(".sim-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        // Futuramente: redirecionar para a página de grupos/partidas com o modo escolhido
        console.log("Modo selecionado:", mode);
    });
});
