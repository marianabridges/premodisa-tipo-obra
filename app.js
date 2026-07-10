const types = ["I", "II", "III", "IV", "V"];

const pieces = [
  ["Fundação", ["I", "II", "III", "IV", "V"]],
  ["Terças", ["II", "III", "V"]],
  ["Calhas", ["II", "III", "V"]],
  ["Viga de cobertura", ["II", "III", "V"]],
  ["Pilaretes", ["II", "III", "V"]],
  ["Escadas", ["III", "IV", "V"]],
  ["Painéis", ["II", "III", "IV", "V"]],
  ["Viga de mezanino", ["III", "IV", "V"]],
  ["Pilares", ["I", "II", "III", "IV", "V"]],
  ["Pilares especiais", ["III", "IV", "V"]],
  ["Acessórios", ["II", "III", "IV", "V"]],
  ["Peças especiais", ["III", "IV", "V"]],
].map(([name, allowed], index) => ({
  id: `piece-${index}`,
  name,
  allowed,
  common: allowed.length === types.length,
}));

const selected = new Set();
const taskGrid = document.querySelector("#taskGrid");
const mainType = document.querySelector("#mainType");
const mainReason = document.querySelector("#mainReason");
const selectedCount = document.querySelector("#selectedCount");
const verticalToggle = document.querySelector("#verticalToggle");

function analyze() {
  const marked = pieces.filter((piece) => selected.has(piece.id));
  const markedSpecific = marked.filter((piece) => !piece.common);
  const isVertical = verticalToggle.checked;

  const ranked = types
    .map((type) => {
      const conflicts = marked.filter((piece) => !piece.allowed.includes(type));
      const matches = marked.length - conflicts.length;
      const specificMatches = markedSpecific.filter((piece) => piece.allowed.includes(type)).length;
      const expectedSpecific = pieces.filter((piece) => !piece.common && piece.allowed.includes(type)).length;
      const score = matches * 10 + specificMatches * 3 - conflicts.length * 20 - Math.abs(expectedSpecific - specificMatches);
      return { type, score, conflicts };
    })
    .sort((a, b) => b.score - a.score);

  let best = ranked[0];
  const typeIII = ranked.find((item) => item.type === "III");
  const typeV = ranked.find((item) => item.type === "V");

  if (isVertical && typeV && typeIII && typeV.conflicts.length === typeIII.conflicts.length) {
    best = typeV;
  }

  return { marked, best, isVertical };
}

function renderPieces() {
  taskGrid.innerHTML = "";

  pieces.forEach((piece) => {
    const label = document.createElement("label");
    label.className = `piece-card${selected.has(piece.id) ? " selected" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${selected.has(piece.id) ? "checked" : ""} />
      <span>${piece.name}</span>
    `;

    label.querySelector("input").addEventListener("change", (event) => {
      if (event.target.checked) {
        selected.add(piece.id);
      } else {
        selected.delete(piece.id);
      }
      render();
    });

    taskGrid.appendChild(label);
  });
}

function renderResult() {
  const result = analyze();
  const count = result.marked.length;

  selectedCount.textContent = `${count} ${count === 1 ? "peça marcada" : "peças marcadas"}`;
  mainType.textContent = `Tipo ${result.best.type}`;

  if (count === 0) {
    mainReason.textContent = "Marque as peças que aparecem no projeto.";
  } else if (result.best.type === "V" && result.isVertical) {
    mainReason.textContent = "Obra vertical marcada: priorizando Tipo V.";
  } else if (result.best.conflicts.length > 0) {
    mainReason.textContent = "Pode ter exceção. Confira as peças marcadas.";
  } else {
    mainReason.textContent = "Melhor encaixe pelas peças selecionadas.";
  }
}

function render() {
  renderPieces();
  renderResult();
}

verticalToggle.addEventListener("change", renderResult);

document.querySelector("#resetButton").addEventListener("click", () => {
  selected.clear();
  verticalToggle.checked = false;
  render();
});

render();

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js");
}
