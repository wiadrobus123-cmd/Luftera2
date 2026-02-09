// ===== ELEMENTY =====
const columnsEl = document.getElementById("columns");
const editBtn = document.getElementById("editBtn");

const loginModal = document.getElementById("loginModal");
const cardModal = document.getElementById("cardModal");

const loginInput = document.getElementById("login");
const passwordInput = document.getElementById("password");
const errorEl = document.getElementById("error");

const cardTitleEl = document.getElementById("cardTitle");
const cardDescEl = document.getElementById("cardDesc");

// ===== USERS =====
const users = [{ login: "admin", password: "1234" }];

// ===== STATE =====
let activeCard = null;

// ===== INIT =====
updateEditButton();
renderBoard();

// ===== AUTH =====
function isEditor() {
  return localStorage.getItem("isEditor") === "true";
}

function updateEditButton() {
  editBtn.textContent = isEditor() ? "Wyloguj" : "Edytuj";
  editBtn.onclick = isEditor()
    ? logout
    : () => loginModal.classList.remove("hidden");
}

function loginUser() {
  if (
    users.find(
      u => u.login === loginInput.value && u.password === passwordInput.value
    )
  ) {
    localStorage.setItem("isEditor", "true");
    loginModal.classList.add("hidden");
    updateEditButton();
    renderBoard();
  } else {
    errorEl.textContent = "Zły login lub hasło";
  }
}

function logout() {
  localStorage.removeItem("isEditor");
  updateEditButton();
  renderBoard();
}

// ===== DATA =====
function getData() {
  return JSON.parse(localStorage.getItem("board")) || [
    {
      name: "Do kupienia",
      color: "#38bdf8",
      cards: [
        { title: "Produkt A", description: "Sprawdzić ceny u dostawców" }
      ]
    }
  ];
}

function saveData(data) {
  localStorage.setItem("board", JSON.stringify(data));
}

// ===== BOARD =====
function renderBoard() {
  columnsEl.innerHTML = "";
  const data = getData();

  data.forEach((col, colIndex) => {
    const column = document.createElement("div");
    column.className = "column";

    column.innerHTML = `
      <div class="columnHeader" style="background:${col.color}"></div>
      <div class="columnTitle">
        <h3>${col.name}</h3>
        ${
          isEditor()
            ? `<div class="columnActions">
                <button class="colorBtn" onclick="changeColor(event, ${colIndex})">🎨</button>
                <button class="colorBtn" onclick="deleteColumn(event, ${colIndex})">🗑</button>
               </div>`
            : ""
        }
      </div>
    `;

    col.cards.forEach((card, cardIndex) => {
      const c = document.createElement("div");
      c.className = "card";
      c.innerHTML = `
        <div class="cardTitle">${card.title}</div>
        ${
          card.description
            ? `<div class="cardDescPreview">${card.description.slice(0, 60)}...</div>`
            : ""
        }
      `;
      c.onclick = () => openCard(colIndex, cardIndex);
      column.appendChild(c);
    });

    // Inline add card
    if (isEditor()) {
      const addDiv = document.createElement("div");
      addDiv.className = "addCardInput";

      const input = document.createElement("input");
      input.placeholder = "Dodaj kartę...";
      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && input.value.trim() !== "") {
          addCardInline(colIndex, input.value.trim());
          input.value = "";
        }
        if (e.key === "Escape") input.value = "";
      });

      addDiv.appendChild(input);
      column.appendChild(addDiv);
    }

    columnsEl.appendChild(column);
  });

  // Add new column
  if (isEditor()) {
    const addCol = document.createElement("button");
    addCol.textContent = "Dodaj status";
    addCol.onclick = addColumn;
    columnsEl.appendChild(addCol);
  }
}

// ===== ACTIONS =====
function addColumn() {
  const name = prompt("Nazwa statusu:");
  const color = prompt("Kolor (HEX):", "#64748b");
  if (!name) return;

  const data = getData();
  data.push({ name, color, cards: [] });
  saveData(data);
  renderBoard();
}

function deleteColumn(e, colIndex) {
  e.stopPropagation();
  if (!confirm("Usunąć cały status i jego zakładki?")) return;

  const data = getData();
  data.splice(colIndex, 1);
  saveData(data);
  renderBoard();
}

function addCardInline(colIndex, title) {
  const data = getData();
  data[colIndex].cards.push({ title, description: "" });
  saveData(data);
  renderBoard();
}

function changeColor(e, colIndex) {
  e.stopPropagation();
  const color = prompt("Nowy kolor (HEX):");
  if (!color) return;

  const data = getData();
  data[colIndex].color = color;
  saveData(data);
  renderBoard();
}

// ===== CARD MODAL =====
function openCard(colIndex, cardIndex) {
  activeCard = { colIndex, cardIndex };
  const card = getData()[colIndex].cards[cardIndex];

  cardTitleEl.textContent = card.title;
  cardDescEl.value = card.description || "";
  cardDescEl.readOnly = !isEditor();

  cardModal.classList.remove("hidden");
}

function saveCard() {
  if (!isEditor() || !activeCard) return;

  const data = getData();
  data[activeCard.colIndex].cards[activeCard.cardIndex].description =
    cardDescEl.value;

  saveData(data);
  closeCard();
}

function deleteCard() {
  if (!isEditor() || !activeCard) return;
  if (!confirm("Usunąć tę zakładkę?")) return;

  const data = getData();
  data[activeCard.colIndex].cards.splice(activeCard.cardIndex, 1);

  saveData(data);
  closeCard();
  renderBoard();
}

function closeCard() {
  cardModal.classList.add("hidden");
  activeCard = null;
}
