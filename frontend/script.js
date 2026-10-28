const shoppingForm = document.getElementById("shoppingForm");
const itemNameInput = document.getElementById("itemName");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");

const shoppingList = document.getElementById("shoppingList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");

const totalItemsElement = document.getElementById("totalItems");
const pendingItemsElement = document.getElementById("pendingItems");
const purchasedItemsElement = document.getElementById("purchasedItems");
const totalCostElement = document.getElementById("totalCost");

const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const clearAllButton = document.getElementById("clearAllButton");
const filterButtons = document.querySelectorAll(".filter-btn");

let items = loadItems();
let editingId = null;
let currentFilter = "all";

// Load saved shopping items from localStorage.
function loadItems() {
    try {
        const savedItems = JSON.parse(
            localStorage.getItem("shoppingListItems")
        );

        return Array.isArray(savedItems)
            ? savedItems.filter(item =>
                item &&
                Number.isInteger(item.id) &&
                typeof item.name === "string" &&
                Number.isFinite(item.quantity) &&
                Number.isFinite(item.price) &&
                typeof item.purchased === "boolean"
            )
            : [];
    } catch (error) {
        return [];
    }
}

// Save items in the browser.
function saveItems() {
    localStorage.setItem("shoppingListItems", JSON.stringify(items));
}

// Format prices in Indian Rupees.
function formatPrice(amount) {
    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR"
    });
}

// Add or update an item.
shoppingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = itemNameInput.value.trim();
    const quantity = Number(quantityInput.value);
    const price = Number(priceInput.value);

    if (!name) {
        alert("Please enter an item name.");
        itemNameInput.focus();
        return;
    }

    if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(quantity * price)
    ) {
        alert("Enter a valid quantity and price.");
        return;
    }

    if (editingId !== null) {
        const item = items.find(item => item.id === editingId);

        if (item) {
            item.name = name;
            item.quantity = quantity;
            item.price = price;
        }

        cancelEditing();
    } else {
        items.push({
            id: createId(),
            name: name,
            quantity: quantity,
            price: price,
            purchased: false
        });
    }

    saveItems();
    renderItems();
    shoppingForm.reset();
    quantityInput.value = 1;
    itemNameInput.focus();
});

// Generate a unique item ID.
function createId() {
    let id;

    do {
        id = Date.now() + Math.floor(Math.random() * 1000000);
    } while (items.some(item => item.id === id));

    return id;
}

// Display items based on the search and selected filter.
function renderItems() {
    shoppingList.replaceChildren();

    const searchText = searchInput.value.trim().toLowerCase();

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchText);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "pending" && !item.purchased) ||
            (currentFilter === "purchased" && item.purchased);

        return matchesSearch && matchesFilter;
    });

    filteredItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";

        if (item.purchased) {
            card.classList.add("purchased");
        }

        const details = document.createElement("div");
        details.className = "item-details";

        const name = document.createElement("div");
        name.className = "item-name";
        name.textContent = item.name;

        const info = document.createElement("div");
        info.className = "item-info";
        info.textContent =
            `Quantity: ${item.quantity} | ` +
            `Price: ${formatPrice(item.price)} each | ` +
            `Subtotal: ${formatPrice(item.quantity * item.price)}`;

        details.append(name, info);

        const actions = document.createElement("div");
        actions.className = "item-actions";

        const purchasedLabel = document.createElement("label");
        purchasedLabel.className = "purchased-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.purchased;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${item.name} as purchased`
        );

        checkbox.addEventListener("change", function () {
            item.purchased = checkbox.checked;
            saveItems();
            renderItems();
        });

        purchasedLabel.append(
            checkbox,
            document.createTextNode("Purchased")
        );

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            startEditing(item.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteItem(item.id);
        });

        actions.append(purchasedLabel, editButton, deleteButton);
        card.append(details, actions);
        shoppingList.appendChild(card);
    });

    emptyMessage.hidden = filteredItems.length > 0;

    if (items.length === 0) {
        emptyMessage.textContent =
            "Your shopping list is empty. Add your first item!";
    } else if (filteredItems.length === 0) {
        emptyMessage.textContent = "No matching shopping items found.";
    }

    updateSummary();
}

// Update the summary cards.
function updateSummary() {
    const totalItems = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const pendingItems = items
        .filter(item => !item.purchased)
        .reduce((total, item) => total + item.quantity, 0);

    const purchasedItems = items
        .filter(item => item.purchased)
        .reduce((total, item) => total + item.quantity, 0);

    const totalCost = items.reduce(
        (total, item) => total + item.quantity * item.price,
        0
    );

    totalItemsElement.textContent = totalItems;
    pendingItemsElement.textContent = pendingItems;
    purchasedItemsElement.textContent = purchasedItems;
    totalCostElement.textContent = formatPrice(totalCost);
}

// Start editing an item.
function startEditing(id) {
    const item = items.find(item => item.id === id);

    if (!item) return;

    editingId = id;

    itemNameInput.value = item.name;
    quantityInput.value = item.quantity;
    priceInput.value = item.price;

    submitButton.textContent = "Update Item";
    cancelEditButton.classList.remove("hidden");

    itemNameInput.focus();
    shoppingForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Cancel editing.
function cancelEditing() {
    editingId = null;
    submitButton.textContent = "+ Add Item";
    cancelEditButton.classList.add("hidden");
    shoppingForm.reset();
    quantityInput.value = 1;
}

// Cancel edit button.
cancelEditButton.addEventListener("click", function () {
    cancelEditing();
});

// Delete one item.
function deleteItem(id) {
    const item = items.find(item => item.id === id);

    if (!item) return;

    if (confirm(`Delete "${item.name}" from your shopping list?`)) {
        items = items.filter(item => item.id !== id);

        if (editingId === id) {
            cancelEditing();
        }

        saveItems();
        renderItems();
    }
}

// Search items.
searchInput.addEventListener("input", function () {
    renderItems();
});

// Filter items.
filterButtons.forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => {
            btn.classList.toggle("active", btn === button);
        });

        renderItems();
    });
});

// Clear all items.
clearAllButton.addEventListener("click", function () {
    if (items.length === 0) {
        alert("Your shopping list is already empty.");
        return;
    }

    if (confirm("Are you sure you want to delete all shopping items?")) {
        items = [];
        cancelEditing();
        saveItems();
        renderItems();
    }
});

// Display the list when the page opens.
renderItems(); 