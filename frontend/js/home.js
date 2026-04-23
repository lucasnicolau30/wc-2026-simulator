const btn = document.getElementById("startSimulation");
const loader = document.getElementById("pageLoader");

btn.addEventListener("click", () => {
    loader.classList.add("active");

    setTimeout(() => {
        window.location.href = "simulation.html";
    }, 750);
});

window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        loader.classList.remove("active");
    }
});