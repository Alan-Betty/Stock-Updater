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
let accounts = [];

function fetchData() {
    db.ref("stock").on("value", snapshot => {
        stock = snapshot.val() || [];
        renderTable();
        renderPricingTable();
        renderBillTypeOptions();
        renderAccountProductOptions();
    });
    db.ref("prices").on("value", snapshot => {
        prices = snapshot.val() || {};
        renderPricingTable();
    });
    db.ref("buyers").on("value", snapshot => {
        buyers = snapshot.val() || [];
        renderBuyersTable();
        renderAccountShopOptions();
    });
    db.ref("accounts").on("value", snapshot => {
        accounts = snapshot.val() || [];
        renderAccountsList();
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
function saveAccounts() {
    db.ref("accounts").set(accounts);
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

function renderAccountShopOptions() {
    const select = document.getElementById("accountShop");
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select Shop</option>';
    buyers.forEach(buyer => {
        const option = document.createElement("option");
        option.value = buyer.shopName;
        option.textContent = buyer.shopName;
        select.appendChild(option);
    });
}

function renderAccountProductOptions() {
    const select = document.getElementById("accountProduct");
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select Product</option>';
    stock.forEach(item => {
        const option = document.createElement("option");
        option.value = item.type;
        option.textContent = item.type;
        select.appendChild(option);
    });
}

function renderAccountsList() {
    const list = document.getElementById("accountsList");
    if (!list) return;
    list.innerHTML = "";
    if (accounts.length === 0) {
        list.innerHTML = `<div class="account-empty">No account entries yet.</div>`;
        return;
    }
    accounts.slice().reverse().forEach(acc => {
        const card = document.createElement("div");
        card.className = "account-card";
        card.innerHTML = `
            <div class="account-card-header">
                <span class="account-shop">${acc.shop}</span>
                <span class="account-date">${formatDateDMY(acc.date)}</span>
            </div>
            <div class="account-card-body">
                <div class="account-product">${acc.product}</div>
                <div class="account-qty">Qty: <b>${acc.qty}</b></div>
                <div class="account-amount">Earned: <b>₹${acc.amount}</b></div>
                <div class="account-payment">Payment: <b>${acc.payment || "—"}</b></div>
            </div>
        `;
        list.appendChild(card);
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

function formatDateDMY(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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

    // Accounts form
    const accountForm = document.getElementById("accountForm");
    if (accountForm) {
        accountForm.onsubmit = function(e) {
            e.preventDefault();
            const shop = document.getElementById("accountShop").value;
            const product = document.getElementById("accountProduct").value;
            const qty = parseInt(document.getElementById("accountQty").value, 10);
            const amount = parseFloat(document.getElementById("accountAmount").value);
            const dateRaw = document.getElementById("accountDate").value;
            const payment = document.getElementById("accountPayment").value;
            const date = formatDateDMY(dateRaw);
            if (shop && product && qty > 0 && amount >= 0 && date && payment) {
                accounts.push({ shop, product, qty, amount, date, payment });
                saveAccounts();
                accountForm.reset();
            }
        };
    }

    // Calculator logic
    const calcForm = document.getElementById("calcForm");
    if (calcForm) {
        calcForm.onsubmit = function(e) {
            e.preventDefault();
            const num1 = parseFloat(document.getElementById("calcNum1").value);
            const num2 = parseFloat(document.getElementById("calcNum2").value);
            const op = document.getElementById("calcOp").value;
            let result = "";
            if (!isNaN(num1) && !isNaN(num2)) {
                switch (op) {
                    case "+": result = num1 + num2; break;
                    case "-": result = num1 - num2; break;
                    case "*": result = num1 * num2; break;
                    case "/": result = num2 !== 0 ? num1 / num2 : "∞"; break;
                }
            }
            document.getElementById("calcResult").textContent = result;
        };
    }

    // Real calculator logic
    let calcInput = "";
    let calcResultDisplayed = false;
    const calcDisplay = document.getElementById("calcDisplay");
    const calcButtons = document.querySelectorAll(".calc-btn");

    function updateCalcDisplay(val) {
        calcDisplay.textContent = val || "0";
    }

    function getLastNumber(str) {
        const match = str.match(/(-?\d*\.?\d*)$/);
        return match ? match[1] : "";
    }

    function replaceLastNumber(str, newNum) {
        return str.replace(/(-?\d*\.?\d*)$/, newNum);
    }

    calcButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            const value = btn.dataset.value;
            if (btn.id === "calcBackspace") {
                if (calcResultDisplayed) {
                    calcInput = "";
                    calcResultDisplayed = false;
                } else {
                    calcInput = calcInput.slice(0, -1);
                }
                updateCalcDisplay(calcInput);
            } else if (btn.id === "calcClear") {
                calcInput = "";
                updateCalcDisplay(calcInput);
                calcResultDisplayed = false;
            } else if (btn.id === "calcPercent") {
                // Convert last number to percent
                let lastNum = getLastNumber(calcInput);
                if (lastNum && !isNaN(lastNum)) {
                    lastNum = (parseFloat(lastNum) / 100).toString();
                    calcInput = replaceLastNumber(calcInput, lastNum);
                    updateCalcDisplay(calcInput);
                }
            } else if (btn.id === "calcEquals") {
                try {
                    if (/^[\d+\-*/.()% ]+$/.test(calcInput)) {
                        // eslint-disable-next-line no-eval
                        let result = eval(calcInput.replace(/÷/g, "/").replace(/×/g, "*"));
                        if (result === Infinity || result === -Infinity) result = "∞";
                        updateCalcDisplay(result);
                        calcInput = result.toString();
                        calcResultDisplayed = true;
                    }
                } catch {
                    updateCalcDisplay("Err");
                    calcInput = "";
                    calcResultDisplayed = false;
                }
            } else if (!btn.hasAttribute("data-value")) {
                // Do nothing for invisible/empty buttons
                return;
            } else {
                if (calcResultDisplayed && !isNaN(value)) {
                    calcInput = value;
                } else {
                    // Prevent multiple decimals in a number
                    if (value === ".") {
                        const lastNum = getLastNumber(calcInput);
                        if (lastNum.includes(".")) return;
                    }
                    calcInput += value;
                }
                updateCalcDisplay(calcInput);
                calcResultDisplayed = false;
            }
        });
    });

    // --- Navbar active link logic with animated underline ---
    const navLinks = document.querySelectorAll('.navbar-links a');
    const sections = Array.from(navLinks).map(link => document.querySelector(link.getAttribute('href')));
    const underline = document.querySelector('.navbar-underline');

    function moveUnderlineTo(link) {
        if (!link || !underline) return;
        const rect = link.getBoundingClientRect();
        const parentRect = link.parentElement.parentElement.getBoundingClientRect();
        underline.style.width = rect.width + "px";
        underline.style.transform = `translateX(${rect.left - parentRect.left}px)`; // always use transform
    }

    function setActiveNav() {
        let scrollPos = window.scrollY || window.pageYOffset;
        let offset = 90; // match scroll-padding-top
        let activeIdx = 0;
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            if (sec && sec.offsetTop - offset <= scrollPos) {
                activeIdx = i;
            }
        }
        navLinks.forEach((link, idx) => {
            if (idx === activeIdx) {
                link.classList.add('active');
                moveUnderlineTo(link);
            } else {
                link.classList.remove('active');
            }
        });
    }

    setActiveNav();
    window.addEventListener('scroll', setActiveNav);

    // Also set active on click for instant feedback
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Smooth scroll to section with offset for navbar
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                moveUnderlineTo(this);

                // Offset scroll by navbar height (e.g. 80px)
                const navbarHeight = document.querySelector('.futuristic-navbar').offsetHeight || 80;
                const sectionTop = targetSection.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: sectionTop - navbarHeight + 8, // +8 for a little gap
                    behavior: 'smooth'
                });
            } else {
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                moveUnderlineTo(this);
            }
        });
    });

    // After navLinks logic, add for drawer links:
    const drawerLinks = document.querySelectorAll('.navbar-drawer a');

    drawerLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Smooth scroll to section with offset for navbar
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                e.preventDefault();
                drawerLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                // Move underline in drawer
                const drawerUnderline = drawer.querySelector('.navbar-underline');
                if (drawerUnderline) {
                    const rect = this.getBoundingClientRect();
                    const parentRect = drawer.querySelector('ul').getBoundingClientRect();
                    drawerUnderline.style.width = rect.width + "px";
                    drawerUnderline.style.transform = `translateY(${rect.top - parentRect.top + rect.height}px) translateX(${rect.left - parentRect.left}px)`;
                }
                // Scroll to section with offset
                const navbarHeight = document.querySelector('.futuristic-navbar').offsetHeight || 80;
                const sectionTop = targetSection.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: sectionTop - navbarHeight + 8,
                    behavior: 'smooth'
                });
                // Hide the drawer after click
                navbar.classList.remove('open');
                isDrawerOpen = false;
                document.body.style.overflow = '';
            }
        });
    });

    // On resize, reposition underline
    window.addEventListener('resize', () => {
        const active = document.querySelector('.navbar-links a.active');
        if (active) moveUnderlineTo(active);
    });

    // Move these up so they're always defined before use
    const hamburger = document.getElementById('navbarHamburger');
    const drawer = document.getElementById('navbarDrawer');
    const navbar = document.querySelector('.futuristic-navbar');
    const drawerClose = document.getElementById('navbarDrawerClose');
    let isDrawerOpen = false;

    // Hamburger menu logic
    if (hamburger) {
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            isDrawerOpen = !navbar.classList.contains('open');
            if (isDrawerOpen) {
                navbar.classList.add('open');
                const activeDrawer = drawer.querySelector('a.active') || drawer.querySelector('a');
                if (activeDrawer) {
                    // Move underline in drawer if needed
                    const drawerUnderline = drawer.querySelector('.navbar-underline');
                    if (drawerUnderline) {
                        const rect = activeDrawer.getBoundingClientRect();
                        const parentRect = drawer.querySelector('ul').getBoundingClientRect();
                        drawerUnderline.style.width = rect.width + "px";
                        drawerUnderline.style.transform = `translateY(${rect.top - parentRect.top + rect.height}px) translateX(${rect.left - parentRect.left}px)`;
                    }
                }
                document.body.style.overflow = 'hidden';
            } else {
                navbar.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }
    // Drawer close button logic
    if (drawerClose) {
        drawerClose.addEventListener('click', function (e) {
            e.stopPropagation();
            navbar.classList.remove('open');
            isDrawerOpen = false;
            document.body.style.overflow = '';
        });
    }
    // Close drawer when clicking outside
    document.addEventListener('click', function (e) {
        if (isDrawerOpen && !drawer.contains(e.target) && !hamburger.contains(e.target)) {
            navbar.classList.remove('open');
            isDrawerOpen = false;
            document.body.style.overflow = '';
        }
    });
    // Prevent scroll on touch devices when drawer is open
    drawer && drawer.addEventListener('touchmove', function(e) {
        if (navbar.classList.contains('open')) e.stopPropagation();
    }, { passive: false });
});
