// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyCWnkcqC7MoECJeGKxQZPpcNzQTw8xkAuw",
  authDomain: "stock-updater-a13f7.firebaseapp.com",
  databaseURL: "https://stock-updater-a13f7-default-rtdb.firebaseio.com",
  projectId: "stock-updater-a13f7",
  storageBucket: "stock-updater-a13f7.firebasestorage.app",
  messagingSenderId: "578119428340",
  appId: "1:578119428340:web:90d9cb6a98d3ee779396a1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let stock = [];
let prices = {};
let buyers = [];

function fetchData() {
    db.ref("stock").on("value", snapshot => {
        stock = snapshot.val() || [];
        renderTable();
        renderPricingTable();
        renderBillTypeOptions();
    });
    db.ref("prices").on("value", snapshot => {
        prices = snapshot.val() || {};
        renderPricingTable();
    });
    db.ref("buyers").on("value", snapshot => {
        buyers = snapshot.val() || [];
        renderBuyersTable();
    });
}

function saveStock() {
    db.ref("stock").set(stock);
}
function savePrices() {
    db.ref("prices").set(prices);
}
function saveBuyers() {
    db.ref("buyers").set(buyers);
}

function renderTable() {
    const tbody = document.querySelector("#stockTable tbody");
    tbody.innerHTML = "";
    stock.forEach((item, idx) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.type}</td>
            <td>${item.quantity}</td>
            <td><button class="updateBtn" data-idx="${idx}">Update</button></td>
        `;
        tbody.appendChild(row);
    });
}

function renderPricingTable() {
    const tbody = document.querySelector("#pricingTable tbody");
    tbody.innerHTML = "";
    stock.forEach((item, idx) => {
        const price = prices[item.type];
        const priceDisplay = price !== undefined ? `₹${price}` : '<span style="color:#ffb300;">Set price</span>';
        const btnLabel = price !== undefined ? "Update" : "Set";
        tbody.innerHTML += `
            <tr>
                <td>${item.type}</td>
                <td>${priceDisplay}</td>
                <td><button class="priceBtn" data-type="${item.type}">${btnLabel}</button></td>
            </tr>
        `;
    });
}

function renderBillTypeOptions() {
    const select = document.getElementById("billTypeSelect");
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select Bill Roll Type</option>';
    stock.forEach(item => {
        const option = document.createElement("option");
        option.value = item.type;
        option.textContent = item.type;
        select.appendChild(option);
    });
}

function renderBuyersTable() {
    const tbody = document.querySelector("#buyersTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    buyers.forEach(buyer => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${buyer.shopName}</td>
            <td>${buyer.billType}</td>
        `;
        tbody.appendChild(row);
    });
}

function openModal(idx) {
    document.getElementById("modal").style.display = "block";
    document.getElementById("mainContent").classList.add("blur");
    document.getElementById("updateIndex").value = idx;
    document.getElementById("updateQuantity").value = stock[idx].quantity;
}

function openPriceModal(type) {
    document.getElementById("modal").style.display = "block";
    document.getElementById("mainContent").classList.add("blur");
    document.querySelector(".modal-content h2").textContent = `Set Price for ${type}`;
    document.getElementById("updateForm").innerHTML = `
        <div class="input-row">
            <label for="updatePrice">Price (₹):</label>
            <input type="number" id="updatePrice" min="0" required>
        </div>
        <input type="hidden" id="updateType">
        <button type="submit">Update</button>
    `;
    document.getElementById("updateType").value = type;
    document.getElementById("updatePrice").value = prices[type] !== undefined ? prices[type] : "";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("mainContent").classList.remove("blur");
}

document.addEventListener("DOMContentLoaded", () => {
    fetchData();

    document.querySelector("#stockTable").addEventListener("click", (e) => {
        if (e.target.classList.contains("updateBtn")) {
            openModal(e.target.dataset.idx);
        }
    });

    document.getElementById("closeModal").onclick = closeModal;

    document.getElementById("updateForm").onsubmit = function(e) {
        e.preventDefault();
        const idx = document.getElementById("updateIndex").value;
        const qty = parseInt(document.getElementById("updateQuantity").value, 10);
        if (!isNaN(qty) && qty >= 0) {
            stock[idx].quantity = qty;
            saveStock();
            closeModal();
        }
    };

    // Close modal when clicking outside content
    window.onclick = function(event) {
        if (event.target == document.getElementById("modal")) {
            closeModal();
        }
    };

    // Add new item
    document.getElementById("addItemForm").onsubmit = function(e) {
        e.preventDefault();
        const type = document.getElementById("newType").value.trim();
        const qty = parseInt(document.getElementById("newQuantity").value, 10);
        if (type && !isNaN(qty) && qty >= 0) {
            stock.push({ type, quantity: qty });
            saveStock();
            document.getElementById("addItemForm").reset();
        }
    };

    // Pricing table actions
    document.querySelector("#pricingTable").addEventListener("click", (e) => {
        if (e.target.classList.contains("priceBtn")) {
            openPriceModal(e.target.dataset.type);
        }
    });

    // Handle price update in modal
    document.getElementById("modal").addEventListener("submit", function(e) {
        if (e.target.id === "updateForm" && document.getElementById("updatePrice")) {
            e.preventDefault();
            const type = document.getElementById("updateType").value;
            const price = parseFloat(document.getElementById("updatePrice").value);
            if (!isNaN(price) && price >= 0) {
                prices[type] = price;
                savePrices();
                closeModal();
            }
        }
    });

    // Buyers form
    const buyerForm = document.getElementById("buyerForm");
    if (buyerForm) {
        buyerForm.onsubmit = function(e) {
            e.preventDefault();
            const shopName = document.getElementById("shopName").value.trim();
            const billType = document.getElementById("billTypeSelect").value;
            if (shopName && billType) {
                buyers.push({ shopName, billType });
                saveBuyers();
                buyerForm.reset();
            }
        };
    }
});
