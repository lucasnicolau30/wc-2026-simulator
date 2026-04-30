const backModal = document.getElementById("backModal");
const backCancelBtn = document.getElementById("backCancel");
const backConfirmBtn = document.getElementById("backConfirmBtn");

function openBackModal() {
  backModal.classList.add("active");
  backModal.setAttribute("aria-hidden", "false");
}

function closeBackModal() {
  backModal.classList.remove("active");
  backModal.setAttribute("aria-hidden", "true");
}

document.getElementById("btnBack").addEventListener("click", openBackModal);
backCancelBtn.addEventListener("click", closeBackModal);
backModal.addEventListener("click", (e) => {
  if (e.target === backModal) closeBackModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && backModal.classList.contains("active")) closeBackModal();
});

backConfirmBtn.addEventListener("click", () => {
  window.location.href = "simulation.html";
});
