const translations = {
pt: {
    simulations: "Simulações",
    lang: "EN"
},

en: {
    simulations: "Simulations",
    lang: "PT"
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

    document.querySelector(".button-text").textContent = t.simulations;
    btnLang.textContent = t.lang;

    btnLang.classList.remove("pop");
    void btnLang.offsetWidth; // reinicia a animação se clicar rápido
    btnLang.classList.add("pop");
});
