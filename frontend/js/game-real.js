// navegação entre abas
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    pages.forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(`page-${tab.dataset.tab}`).classList.add("active");
  });
});

// busca as seleções da API e monta os grupos
async function loadGroups(){
  // fetch retorna o envelope HTTP, com (status, headers, body cru)
  const response = await fetch("http://localhost:8000/selections");
  // transforma em objeto JS a partir do JSON retornado pelo backend
  const selections = await response.json();

  // agrupa por group_name
  const groups = {};
  for (const selection of selections){
    if (!groups[selection.group_name]){
      groups[selection.group_name] = [];
    }
    groups[selection.group_name].push(selection);
  }

  const grid = document.getElementById("groups-grid");
  grid.innerHTML = "";

  for (const groupName of Object.keys(groups).sort()){
    const card = document.createElement("div");
    card.className = "group-card";

    card.innerHTML = `
      <div class="group-card-header">
        <h3>Group ${groupName}</h3>
        <span>Pts</span>
      </div>
      ${groups[groupName].map(selection => `
        <div class="group-team">
          <span class="group-team-name">${selection.name}</span>
          <span class="group-team-pts">
            <span>0</span>
            <span>0</span>
          </span>
        </div>
      `).join("")}
    `;    

    grid.appendChild(card);
  }
}

loadGroups();
