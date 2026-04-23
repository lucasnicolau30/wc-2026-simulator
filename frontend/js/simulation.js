const loader = document.getElementById("pageLoader");

document.querySelectorAll(".sim-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
        const mode = btn.getAttribute("data-mode");

        loader.classList.add("active");

        try {
            await fetch(`${API_BASE_URL}/simulation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode })
            });
        } catch {
            loader.classList.remove("active");
            return;
        }

        setTimeout(() => {
            if (mode === "real") {
                window.location.href = "game-real.html";
            } else {
                window.location.href = "game-manual.html";
            }
        }, 700);
    });
});

window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        loader.classList.remove("active");
    }
});