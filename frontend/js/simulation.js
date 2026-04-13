const loader = document.getElementById("pageLoader");

document.querySelectorAll(".sim-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
    const mode = btn.getAttribute("data-mode");

    loader.classList.add("active");

    await fetch("http://localhost:8000/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
    });

    setTimeout(() => {
        if (mode === "real") {
            window.location.href = "game-real.html";
        }
        else{
            window.location.href = "game-manual.html";
        }

        if (mode === "manual") {
            loader.classList.remove("active");
        }
        }, 700);
    });
});