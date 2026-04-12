// simulation.html
document.querySelectorAll(".sim-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
        const mode = btn.getAttribute("data-mode");
        // Redireciona para a página de grupos/partidas com o modo escolhido
        console.log("Modo selecionado:", mode);

        const response = await fetch("http://localhost:8000/simulation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode })
        });

        if(mode === "real"){
            window.location.href = "game-real.html";
        }
    });
});