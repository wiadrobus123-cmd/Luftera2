// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyDt6N_UFAG0lbQslq3a2l5DAmeJmRr5XSo",
  authDomain: "luftera-e07c7.firebaseapp.com",
  databaseURL: "https://luftera-e07c7-default-rtdb.firebaseio.com",
  projectId: "luftera-e07c7",
  storageBucket: "luftera-e07c7.firebasestorage.app",
  messagingSenderId: "1042469877468",
  appId: "1:1042469877468:web:d7190d7d9e84bdcbffe619"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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
listenBoardChanges();

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
  } else {
    errorEl.textContent = "Zły login lub hasło";
  }
}

function logout() {
  localStorage.removeItem("isEditor");
  updateEditButton();
}

// ===== BOARD =====
function listenBoardChanges() {
  const boardRef = db.ref("board");
  boardRef.on("value", snapshot => {
    const data = snapshot.val() || [];
    renderBoard(data);
  });
}

function saveBoard(data) {
  db.ref("board").set(data);
}

function renderBoard(data) {
  columnsEl.innerHTML = "";

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
      c.onclick = () => openCard(colIndex, cardIndex, card);
      column.appendChild(c);
    });

    if (isEditor()) {
      const addDiv = document.createElement("div");
      addDiv.className = "addCardInput";

      const input = document.createElement("input");
      input.placeholder = "Dodaj kartę...";
      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && input.value.trim() !== "") {
          addCardInline(colIndex, input.value.trim(), data);
          input.value = "";
        }
        if (e.key === "Escape") input.value = "";
      });

      addDiv.appendChild(input);
      column.appendChild(addDiv);
    }

    columnsEl.appendChild(column);
  });

  if (isEditor()) {
    const addCol = document.createElement("button");
    addCol.textContent = "Dodaj status";
    addCol.onclick = () => addColumn(data);
    columnsEl.appendChild(addCol);
  }
}

// ===== ACTIONS =====
function addColumn(data) {
  const name = prompt("Nazwa statusu:");
  const color = prompt("Kolor (HEX):", "#64748b");
  if (!name) return;

  data.push({ name, color, cards: [] });
  saveBoard(data);
}

function deleteColumn(e, colIndex) {
  e.stopPropagation();
  if (!confirm("Usunąć cały status i jego zakładki?")) return;

  db.ref(`board/${colIndex}`).remove();
}

function addCardInline(colIndex, title, data) {
  data[colIndex].cards.push({ title, description: "" });
  saveBoard(data);
}

function changeColor(e, colIndex) {
  e.stopPropagation();
  const color = prompt("Nowy kolor (HEX):");
  if (!color) return;

  db.ref(`board/${colIndex}/color`).set(color);
}

// ===== CARD MODAL =====
function openCard(colIndex, cardIndex, card) {
  activeCard = { colIndex, cardIndex };
  cardTitleEl.textContent = card.title;
  cardDescEl.value = card.description || "";
  cardDescEl.readOnly = !isEditor();
  cardModal.classList.remove("hidden");
}

function saveCard() {
  if (!isEditor() || !activeCard) return;
  const val = cardDescEl.value;
  db.ref(`board/${activeCard.colIndex}/cards/${activeCard.cardIndex}/description`).set(val);
  closeCard();
}

function deleteCard() {
  if (!isEditor() || !activeCard) return;
  if (!confirm("Usunąć tę zakładkę?")) return;

  db.ref(`board/${activeCard.colIndex}/cards/${activeCard.cardIndex}`).remove();
  closeCard();
}

function closeCard() {
  cardModal.classList.add("hidden");
  activeCard = null;
}
