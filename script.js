"use strict";

/* ==============================
   STORAGE
============================== */

const STORAGE_KEY = "expenseflow_transactions_v2";
const BUDGET_KEY = "expenseflow_budget_v2";
const THEME_KEY = "expenseflow_theme_v2";

let transactions = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

let budget = Number(
    localStorage.getItem(BUDGET_KEY) || 0
);

let editingId = null;


/* ==============================
   ELEMENTS
============================== */

const $ = id => document.getElementById(id);

const form = $("transactionForm");
const type = $("type");
const description = $("description");
const amount = $("amount");
const category = $("category");
const date = $("date");
const payment = $("payment");
const notes = $("notes");

const search = $("search");
const typeFilter = $("typeFilter");
const categoryFilter = $("categoryFilter");
const dateFilter = $("dateFilter");
const sortFilter = $("sortFilter");

const transactionList = $("transactionList");
const emptyTable = $("emptyTable");

const toast = $("toast");


/* ==============================
   INITIALIZATION
============================== */

document.addEventListener("DOMContentLoaded", () => {

    date.value = today();

    loadTheme();
    populateCategories();
    updateAll();

    $("year").textContent = new Date().getFullYear();

    document.querySelectorAll("[data-open-form]").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelector(".form-card")
                .scrollIntoView({ behavior: "smooth", block: "start" });

            setTimeout(() => description.focus(), 400);
        });
    });
});
  


/* ==============================
   NAVIGATION ACTIVE BAR
============================== */

const navLinks = document.querySelectorAll(".main-nav a");

navLinks.forEach(link => {

    link.addEventListener("click", function () {

        navLinks.forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});


/* Change active navigation while scrolling */

const sections = [
    document.getElementById("dashboard"),
    document.getElementById("transactions"),
    document.getElementById("analytics")
];

window.addEventListener("scroll", () => {

    let currentSection = "dashboard";

    sections.forEach(section => {

        if (!section) return;

        const sectionTop =
            section.getBoundingClientRect().top;

        if (sectionTop <= 180) {
            currentSection = section.id;
        }
    });

    navLinks.forEach(link => {

        link.classList.remove("active");

        const href =
            link.getAttribute("href");

        if (href === `#${currentSection}`) {
            link.classList.add("active");
        }
    });
});


/* ==============================
   DATE
============================== */

function today() {
    const d = new Date();

    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${d.getFullYear()}-${month}-${day}`;
}

function formatDate(value) {
    if (!value) return "-";

    return new Date(value + "T00:00:00")
        .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
}


/* ==============================
   CURRENCY
============================== */

function money(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}


/* ==============================
   STORAGE
============================== */

function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        BUDGET_KEY,
        String(budget)
    );
}


/* ==============================
   FORM
============================== */

form.addEventListener("submit", event => {

    event.preventDefault();

    const title = description.value.trim();
    const value = Number(amount.value);

    if (!title) {
        showToast("Please enter a description.");
        description.focus();
        return;
    }

    if (!value || value <= 0) {
        showToast("Please enter a valid amount.");
        amount.focus();
        return;
    }

    if (!date.value) {
        showToast("Please select a date.");
        return;
    }

    if (editingId) {

        const transaction = transactions.find(
            item => item.id === editingId
        );

        if (transaction) {
            transaction.type = type.value;
            transaction.description = title;
            transaction.amount = value;
            transaction.category = category.value;
            transaction.date = date.value;
            transaction.payment = payment.value;
            transaction.notes = notes.value.trim();
        }

        showToast("Transaction updated.");

    } else {

        transactions.push({
            id: Date.now().toString(),
            type: type.value,
            description: title,
            amount: value,
            category: category.value,
            date: date.value,
            payment: payment.value,
            notes: notes.value.trim(),
            createdAt: Date.now()
        });

        showToast(
            type.value === "income"
                ? "Income added successfully."
                : "Expense added successfully."
        );
    }

    saveData();
    resetForm();
    updateAll();
});


/* ==============================
   RESET FORM
============================== */

$("clearForm").addEventListener("click", resetForm);

function resetForm() {

    editingId = null;

    form.reset();

    date.value = today();

    $("formTitle").textContent = "Add a transaction";
    $("saveButton").textContent = "Save Expense";
}


/* ==============================
   EDIT
============================== */

function editTransaction(id) {

    const item = transactions.find(
        transaction => transaction.id === id
    );

    if (!item) return;

    editingId = id;

    type.value = item.type;
    description.value = item.description;
    amount.value = item.amount;
    category.value = item.category;
    date.value = item.date;
    payment.value = item.payment;
    notes.value = item.notes || "";

    $("formTitle").textContent = "Edit transaction";
    $("saveButton").textContent = "Update Transaction";

    document.querySelector(".form-card")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    setTimeout(() => description.focus(), 400);
}


/* ==============================
   DELETE
============================== */

function deleteTransaction(id) {

    const item = transactions.find(
        transaction => transaction.id === id
    );

    if (!item) return;

    if (!confirm(`Delete "${item.description}"?`)) {
        return;
    }

    transactions = transactions.filter(
        transaction => transaction.id !== id
    );

    saveData();
    updateAll();

    showToast("Transaction deleted.");
}


/* ==============================
   CATEGORY FILTER
============================== */

function populateCategories() {

    const categories = [
        ...new Set(transactions.map(item => item.category))
    ].sort();

    categoryFilter.innerHTML =
        `<option value="all">All Categories</option>`;

    categories.forEach(item => {

        const option = document.createElement("option");

        option.value = item;
        option.textContent = item;

        categoryFilter.appendChild(option);
    });
}


/* ==============================
   FILTERS
============================== */

[
    search,
    typeFilter,
    categoryFilter,
    dateFilter,
    sortFilter
].forEach(element => {
    element.addEventListener("input", renderTransactions);
    element.addEventListener("change", renderTransactions);
});

$("resetFilters").addEventListener("click", () => {

    search.value = "";
    typeFilter.value = "all";
    categoryFilter.value = "all";
    dateFilter.value = "";
    sortFilter.value = "newest";

    renderTransactions();
});


function getFilteredTransactions() {

    let result = [...transactions];

    const query = search.value
        .trim()
        .toLowerCase();

    if (query) {

        result = result.filter(item =>
            item.description.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            item.payment.toLowerCase().includes(query) ||
            (item.notes || "").toLowerCase().includes(query)
        );
    }

    if (typeFilter.value !== "all") {
        result = result.filter(
            item => item.type === typeFilter.value
        );
    }

    if (categoryFilter.value !== "all") {
        result = result.filter(
            item => item.category === categoryFilter.value
        );
    }

    if (dateFilter.value) {
        result = result.filter(
            item => item.date === dateFilter.value
        );
    }

    switch (sortFilter.value) {

        case "oldest":
            result.sort((a, b) =>
                a.date.localeCompare(b.date)
            );
            break;

        case "highest":
            result.sort((a, b) =>
                b.amount - a.amount
            );
            break;

        case "lowest":
            result.sort((a, b) =>
                a.amount - b.amount
            );
            break;

        default:
            result.sort((a, b) =>
                b.date.localeCompare(a.date) ||
                b.createdAt - a.createdAt
            );
    }

    return result;
}


/* ==============================
   TRANSACTION TABLE
============================== */

function renderTransactions() {

    const result = getFilteredTransactions();

    transactionList.innerHTML = "";

    $("transactionCount").textContent =
        `${result.length} transaction${result.length === 1 ? "" : "s"}`;

    emptyTable.style.display =
        result.length ? "none" : "block";

    result.forEach(item => {

        const row = document.createElement("tr");

        const sign = item.type === "income" ? "+" : "-";

        row.innerHTML = `
            <td>
                <div class="transaction-name">
                    <strong>${escapeHTML(item.description)}</strong>
                    <small>${escapeHTML(item.notes || "No notes")}</small>
                </div>
            </td>

            <td>${escapeHTML(item.category)}</td>

            <td>${formatDate(item.date)}</td>

            <td>${escapeHTML(item.payment)}</td>

            <td class="${item.type === "income"
                ? "amount-income"
                : "amount-expense"}">
                ${sign}${money(item.amount)}
            </td>

            <td>
                <button class="action-btn"
                    onclick="editTransaction('${item.id}')">
                    Edit
                </button>

                <button class="action-btn delete-btn"
                    onclick="deleteTransaction('${item.id}')">
                    Delete
                </button>
            </td>
        `;

        transactionList.appendChild(row);
    });
}


/* ==============================
   RECENT ACTIVITY
============================== */

function renderRecent() {

    const list = $("recent");

    list.innerHTML = "";

    const recent = [...transactions]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    if (!recent.length) {

        list.innerHTML =
            `<p class="empty">No recent transactions.</p>`;

        return;
    }

    recent.forEach(item => {

        const div = document.createElement("div");

        div.className = "recent-item";

        div.innerHTML = `
            <div>
                <strong>${escapeHTML(item.description)}</strong>
                <small>${formatDate(item.date)}</small>
            </div>

            <b class="${item.type === "income"
                ? "income-text"
                : "expense-text"}">
                ${item.type === "income" ? "+" : "-"}${money(item.amount)}
            </b>
        `;

        list.appendChild(div);
    });
}


/* ==============================
   DASHBOARD
============================== */

function updateDashboard() {

    const currentMonth = new Date()
        .toISOString()
        .slice(0, 7);

    const monthly = transactions.filter(
        item => item.date.startsWith(currentMonth)
    );

    const income = monthly
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const expenses = monthly
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    const balance = income - expenses;

    const rate = income
        ? Math.round((balance / income) * 100)
        : 0;

    $("balance").textContent = money(balance);
    $("income").textContent = money(income);
    $("expenses").textContent = money(expenses);
    $("savingRate").textContent = `${Math.max(0, rate)}%`;

    $("heroSpending").textContent = money(expenses);

    let activity = budget
        ? Math.round((expenses / budget) * 100)
        : 0;

    activity = Math.min(activity, 100);

    $("heroActivity").textContent = `${activity}%`;
    $("heroProgress").style.width = `${activity}%`;

    $("balanceNote").textContent =
        income || expenses
            ? "Based on this month's activity."
            : "Add income and expenses to begin.";
}


/* ==============================
   BUDGET
============================== */

$("setBudget").addEventListener("click", () => {

    $("budgetInput").value = budget || "";

    $("budgetModal").classList.remove("hidden");

    setTimeout(() => $("budgetInput").focus(), 100);
});


$("closeBudget").addEventListener(
    "click",
    closeBudget
);

$("cancelBudget").addEventListener(
    "click",
    closeBudget
);

function closeBudget() {
    $("budgetModal").classList.add("hidden");
}


$("saveBudget").addEventListener("click", () => {

    const value = Number($("budgetInput").value);

    if (value < 0 || Number.isNaN(value)) {
        showToast("Enter a valid budget.");
        return;
    }

    budget = value;

    saveData();
    updateBudget();

    closeBudget();

    showToast("Monthly budget saved.");
});


function updateBudget() {

    const currentMonth = new Date()
        .toISOString()
        .slice(0, 7);

    const spent = transactions
        .filter(item =>
            item.type === "expense" &&
            item.date.startsWith(currentMonth)
        )
        .reduce((sum, item) => sum + item.amount, 0);

    $("budgetAmount").textContent = money(budget);
    $("budgetSpent").textContent = money(spent);

    if (!budget) {

        $("budgetRemaining").textContent = money(0);
        $("budgetPercent").textContent = "0%";
        $("budgetProgress").style.width = "0%";

        $("budgetStatus").textContent =
            "Set a monthly budget to track your progress.";

        return;
    }

    const percent = Math.round(
        (spent / budget) * 100
    );

    const progress = Math.min(percent, 100);

    const remaining = budget - spent;

    $("budgetRemaining").textContent =
        money(Math.max(remaining, 0));

    $("budgetPercent").textContent =
        `${percent}%`;

    $("budgetProgress").style.width =
        `${progress}%`;

    if (spent > budget) {

        $("budgetStatus").textContent =
            `You are ${money(spent - budget)} over budget.`;

    } else {

        $("budgetStatus").textContent =
            `${money(remaining)} remaining this month.`;
    }
}


/* ==============================
   ANALYTICS
============================== */

function updateAnalytics() {

    const expenses = transactions.filter(
        item => item.type === "expense"
    );

    const total = expenses.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    const average = expenses.length
        ? total / expenses.length
        : 0;

    const largest = expenses.length
        ? expenses.reduce((a, b) =>
            a.amount > b.amount ? a : b
        )
        : null;

    const categories = {};

    expenses.forEach(item => {
        categories[item.category] =
            (categories[item.category] || 0) +
            item.amount;
    });

    let top = null;

    Object.entries(categories).forEach(
        ([name, value]) => {

            if (!top || value > top.value) {
                top = { name, value };
            }
        }
    );

    $("topCategory").textContent =
        top ? top.name : "—";

    $("topCategoryAmount").textContent =
        top ? money(top.value) : "₹0.00";

    $("averageExpense").textContent =
        money(average);

    $("largestExpense").textContent =
        largest ? money(largest.amount) : "₹0.00";

    $("largestName").textContent =
        largest ? largest.description : "No expense yet";

    $("totalTransactions").textContent =
        transactions.length;

    drawCategoryChart(categories);
    drawTrendChart();
}


/* ==============================
   CATEGORY CHART
============================== */

function drawCategoryChart(data) {

    const canvas = $("categoryChart");
    const ctx = canvas.getContext("2d");

    resizeCanvas(canvas);

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const entries = Object.entries(data);

    $("categoryEmpty").style.display =
        entries.length ? "none" : "grid";

    $("legend").innerHTML = "";

    if (!entries.length) return;

    const total = entries.reduce(
        (sum, [, value]) => sum + value,
        0
    );

    const colors = [
        "#155eef",
        "#12b76a",
        "#f79009",
        "#f04438",
        "#7f56d9",
        "#06b6d4",
        "#ec4899",
        "#667085"
    ];

    const width = canvas.width;
    const height = canvas.height;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * .34;

    let start = -Math.PI / 2;

    entries.forEach(([name, value], index) => {

        const angle =
            (value / total) * Math.PI * 2;

        ctx.beginPath();

        ctx.moveTo(cx, cy);

        ctx.arc(
            cx,
            cy,
            radius,
            start,
            start + angle
        );

        ctx.closePath();

        ctx.fillStyle =
            colors[index % colors.length];

        ctx.fill();

        start += angle;

        const legend =
            document.createElement("span");

        legend.innerHTML =
            `● ${escapeHTML(name)} ${money(value)}`;

        legend.style.color =
            colors[index % colors.length];

        $("legend").appendChild(legend);
    });

    ctx.beginPath();
    ctx.arc(
        cx,
        cy,
        radius * .58,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        getComputedStyle(document.body)
            .getPropertyValue("--surface");

    ctx.fill();

    ctx.fillStyle =
        getComputedStyle(document.body)
            .getPropertyValue("--text");

    ctx.textAlign = "center";

    ctx.font = "700 18px Arial";

    ctx.fillText(
        money(total),
        cx,
        cy + 5
    );

    ctx.font = "12px Arial";

    ctx.fillStyle =
        getComputedStyle(document.body)
            .getPropertyValue("--muted");

    ctx.fillText(
        "Total spending",
        cx,
        cy + 27
    );
}


/* ==============================
   TREND CHART
============================== */

function drawTrendChart() {

    const canvas = $("trendChart");
    const ctx = canvas.getContext("2d");

    resizeCanvas(canvas);

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const days = [];

    for (let i = 6; i >= 0; i--) {

        const d = new Date();

        d.setDate(d.getDate() - i);

        const key =
            d.toISOString().slice(0, 10);

        const value =
            transactions
                .filter(item =>
                    item.type === "expense" &&
                    item.date === key
                )
                .reduce(
                    (sum, item) => sum + item.amount,
                    0
                );

        days.push({
            date: d,
            value
        });
    }

    const hasData =
        days.some(day => day.value > 0);

    $("trendEmpty").style.display =
        hasData ? "none" : "grid";

    if (!hasData) return;

    const width = canvas.width;
    const height = canvas.height;

    const pad = 45;

    const max =
        Math.max(...days.map(day => day.value), 1);

    ctx.strokeStyle =
        getComputedStyle(document.body)
            .getPropertyValue("--border");

    ctx.lineWidth = 1;

    for (let i = 0; i < 4; i++) {

        const y =
            pad +
            ((height - pad * 2) / 3) * i;

        ctx.beginPath();

        ctx.moveTo(pad, y);
        ctx.lineTo(width - pad, y);

        ctx.stroke();
    }

    const points = days.map((day, index) => {

        const x =
            pad +
            (index * (width - pad * 2)) /
            (days.length - 1);

        const y =
            height -
            pad -
            (day.value / max) *
            (height - pad * 2);

        return { x, y, day };
    });

    ctx.beginPath();

    points.forEach((point, index) => {

        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });

    ctx.strokeStyle = "#155eef";
    ctx.lineWidth = 3;
    ctx.stroke();

    points.forEach(point => {

        ctx.beginPath();

        ctx.arc(
            point.x,
            point.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#155eef";
        ctx.fill();

        ctx.fillStyle =
            getComputedStyle(document.body)
                .getPropertyValue("--muted");

        ctx.font = "10px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            point.day.date.toLocaleDateString(
                "en-IN",
                { weekday: "short" }
            ),
            point.x,
            height - 15
        );
    });
}


/* ==============================
   CANVAS
============================== */

function resizeCanvas(canvas) {

    const rect =
        canvas.getBoundingClientRect();

    const ratio =
        window.devicePixelRatio || 1;

    canvas.width =
        rect.width * ratio;

    canvas.height =
        rect.height * ratio;

    canvas.getContext("2d")
        .scale(ratio, ratio);

    canvas.widthCSS = rect.width;
    canvas.heightCSS = rect.height;
}


/* ==============================
   CSV EXPORT
============================== */

$("exportCSV").addEventListener(
    "click",
    exportCSV
);

function exportCSV() {

    if (!transactions.length) {
        showToast("No transactions to export.");
        return;
    }

    const headers = [
        "Description",
        "Type",
        "Amount",
        "Category",
        "Date",
        "Payment Method",
        "Notes"
    ];

    const rows = transactions.map(item => [
        item.description,
        item.type,
        item.amount,
        item.category,
        item.date,
        item.payment,
        item.notes || ""
    ]);

    const csv = [
        headers,
        ...rows
    ]
        .map(row =>
            row.map(value =>
                `"${String(value)
                    .replace(/"/g, '""')}"`
            ).join(",")
        )
        .join("\n");

    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        `expenseflow-${today()}.csv`;

    link.click();

    URL.revokeObjectURL(url);

    showToast("CSV exported successfully.");
}


/* ==============================
   CLEAR ALL
============================== */

$("clearAll").addEventListener(
    "click",
    () => {

        if (!transactions.length) {
            showToast("There are no transactions.");
            return;
        }

        if (!confirm(
            "Delete all transactions? This cannot be undone."
        )) {
            return;
        }

        transactions = [];

        saveData();
        populateCategories();
        updateAll();

        showToast("All transactions deleted.");
    }
);


/* ==============================
   THEME
============================== */

$("themeToggle").addEventListener(
    "click",
    () => {

        document.body.classList.toggle("dark");

        const dark =
            document.body.classList.contains("dark");

        localStorage.setItem(
            THEME_KEY,
            dark ? "dark" : "light"
        );

        $("themeToggle").textContent =
            dark ? "☾" : "☼";

        updateAnalytics();
    }
);


function loadTheme() {

    const theme =
        localStorage.getItem(THEME_KEY);

    if (theme === "dark") {
        document.body.classList.add("dark");
        $("themeToggle").textContent = "☾";
    }
}


/* ==============================
   UPDATE EVERYTHING
============================== */

function updateAll() {

    populateCategories();
    renderTransactions();
    renderRecent();
    updateDashboard();
    updateBudget();
    updateAnalytics();
}


/* ==============================
   TOAST
============================== */

let toastTimer;

function showToast(message) {

    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* ==============================
   SECURITY
============================== */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==============================
   WINDOW EVENTS
============================== */

window.addEventListener(
    "resize",
    () => updateAnalytics()
);

window.addEventListener(
    "storage",
    () => {

        transactions = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        budget = Number(
            localStorage.getItem(BUDGET_KEY) || 0
        );

        updateAll();
    }
);


/* ==============================
   KEYBOARD
============================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !$("budgetModal").classList.contains("hidden")
        ) {
            closeBudget();
        }
    }
);