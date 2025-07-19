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

/* --- Modal window for product description --- */
// Create modal HTML and add to body (only once)
let modal = document.createElement("div");
modal.id = "descModal";
modal.style.display = "none";
modal.innerHTML = `
  <div id="descModalOverlay" style="
    position: fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.3); z-index:1000; display:flex; align-items:center; justify-content:center;">
    <div id="descModalContent" style="
      background:#fff; padding:30px; border-radius:8px; max-width:400px; box-shadow:0 2px 16px rgba(0,0,0,0.2); position:relative;">
      <button id="descModalClose" style="
        position:absolute; top:10px; right:10px; font-size:22px; background:none; border:none; cursor:pointer;">&times;</button>
      <h3 id="descModalTitle"></h3>
      <p id="descModalText"></p>
    </div>
  </div>
`;
document.body.appendChild(modal);

// Function to show modal with product info
function showDescriptionModal(product) {
  // Fill modal content
  document.getElementById("descModalTitle").textContent = product.name;
  document.getElementById("descModalText").textContent = product.description;
  modal.style.display = "block";
}

// Function to hide modal
function hideDescriptionModal() {
  modal.style.display = "none";
}

// Close modal when clicking close button
document.getElementById("descModalClose").addEventListener("click", hideDescriptionModal);

// Close modal when clicking outside modal content
document.getElementById("descModalOverlay").addEventListener("click", function(e) {
  if (e.target === this) {
    hideDescriptionModal();
  }
});

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
        <!-- Show Description button -->
        <button class="show-desc-btn" data-id="${product.id}">Show Description</button>
      </div>
    </div>
  `;
      }
    )
    .join("");

  // Add click event listeners to product cards for selection
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      // Prevent selection if clicking the Show Description button
      if (event.target.classList.contains("show-desc-btn")) return;

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

  // Add click event listeners to Show Description buttons
  const descBtns = productsContainer.querySelectorAll(".show-desc-btn");
  descBtns.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent card selection
      const productId = parseInt(btn.getAttribute("data-id"));
      const product = products.find((p) => p.id === productId);
      if (product) {
        showDescriptionModal(product);
      }
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
