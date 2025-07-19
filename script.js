
/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");

// worker URL
const workerURL = "https://wonderbot-worker.davidrs23178.workers.dev/";

// Array to keep track of selected products
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => {
        // Check if product is selected
        const isSelected = selectedProducts.some((p) => p.id === product.id);
        return `
    <div class="product-card${isSelected ? ' selected' : ''}" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `;
      }
    )
    .join("");

  // Add click event listeners to product cards
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const productId = parseInt(card.getAttribute("data-id"));
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      // If already selected, remove; else add
      const index = selectedProducts.findIndex((p) => p.id === productId);
      if (index > -1) {
        selectedProducts.splice(index, 1);
      } else {
        selectedProducts.push(product);
      }
      // Update UI
      displayProducts(products);
      updateSelectedProductsList();
    });
  });
}

/* Update the selected products section */
function updateSelectedProductsList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected</div>`;
    return;
  }
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-item">
        <img src="${product.image}" alt="${product.name}" style="width:40px;height:40px;object-fit:contain;vertical-align:middle;">
        <span>${product.name}</span>
        <button class="remove-btn" data-id="${product.id}" title="Remove">&times;</button>
      </div>
    `
    )
    .join("");

  // Add event listeners to remove buttons
  const removeBtns = selectedProductsList.querySelectorAll(".remove-btn");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = parseInt(btn.getAttribute("data-id"));
      selectedProducts = selectedProducts.filter((p) => p.id !== productId);
      // Re-render both sections
      // If products are currently filtered, re-display them
      if (window.currentProducts) {
        displayProducts(window.currentProducts);
      }
      updateSelectedProductsList();
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  window.currentProducts = filteredProducts; // Save for later use
  displayProducts(filteredProducts);
});

// Initial selected products list
updateSelectedProductsList();

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
