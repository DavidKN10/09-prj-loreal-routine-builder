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

// Store chat history for follow-up questions
let chatHistory = [];

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
  <div id="descModalOverlay">
    <div id="descModalContent">
      <button id="descModalClose">&times;</button>
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

// Load selected products from localStorage (if any)
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}

// Save selected products to localStorage
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

// Call loadSelectedProducts on page load
loadSelectedProducts();

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
      saveSelectedProducts(); // Save after change
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
    .join("") +
    `<button id="clearAllBtn" class="generate-btn" style="background:#e74c3c;margin-top:10px;"><i class="fa-solid fa-trash"></i> Clear All</button>`;

  // Add event listeners to remove buttons
  const removeBtns = selectedProductsList.querySelectorAll(".remove-btn");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = parseInt(btn.getAttribute("data-id"));
      selectedProducts = selectedProducts.filter((p) => p.id !== productId);
      saveSelectedProducts();
      // Re-render both sections
      if (window.currentProducts) {
        displayProducts(window.currentProducts);
      }
      updateSelectedProductsList();
    });
  });

  // Add event listener to Clear All button
  const clearAllBtn = document.getElementById("clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      selectedProducts = [];
      saveSelectedProducts();
      if (window.currentProducts) {
        displayProducts(window.currentProducts);
      }
      updateSelectedProductsList();
    });
  }
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

// Helper function to render chat history in the chat window
function renderChat() {
  chatWindow.innerHTML = chatHistory
    .filter(msg => msg.role === "user" || msg.role === "assistant")
    .map(msg => {
      if (msg.role === "user") {
        return `<div class="chat-message user-message">${msg.content}</div>`;
      } else {
        return `<div class="chat-message ai-message">${msg.content}</div>`;
      }
    })
    .join("");
}

// Function to generate routine using OpenAI API
async function generateRoutine() {
  // Only collect selected products
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = "Please select products before generating a routine.";
    return;
  }

  // Prepare product data for the AI
  const productData = selectedProducts.map(product => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description
  }));

  // Create messages for OpenAI API
  const messages = [
    {
      role: "system",
      content: "You are a routine builder and product advisor expert for L'Oreal. Generate a routine using the provided products. Explain the order and purpose for each product. If the user asks something off topic, say that you cannot help with that and try to redirect them."
    },
    {
      role: "user",
      content: `Here are the selected products:\n${JSON.stringify(productData, null, 2)}`
    }
  ];

  // Save initial system and user messages to chatHistory
  chatHistory = [...messages];

  // Show loading message
  chatWindow.innerHTML = "Generating your routine...";

  try {
    // Send request to Cloudflare Worker
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    // Check for AI response
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Add AI response to chatHistory
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content
      });
      // Render chat history
      renderChat();
    } else {
      chatWindow.innerHTML = "Sorry, no routine was generated. Please try again.";
    }
  } catch (error) {
    chatWindow.innerHTML = "Error generating routine. Please try again.";
  }
}

// Add event listener to Generate Routine button
const generateRoutineBtn = document.getElementById("generateRoutine");
if (generateRoutineBtn) {
  generateRoutineBtn.addEventListener("click", generateRoutine);
}

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's question from input
  const userInput = document.getElementById("userInput").value.trim();

  // Only allow questions after a routine is generated
  if (chatHistory.length === 0) {
    chatWindow.innerHTML = "Please generate a routine first!";
    return;
  }

  // Simple check for allowed topics (skincare, haircare, makeup, fragrance, routine)
  const allowedTopics = [
    "routine", "skincare", "haircare", "makeup", "fragrance", "product", "beauty", "treatment", "men's grooming", "suncare", "hair color", "hair styling"
  ];
  const isAllowed = allowedTopics.some(topic =>
    userInput.toLowerCase().includes(topic)
  );

  if (!isAllowed) {
    chatWindow.innerHTML = "Please ask about your routine or beauty topics like skincare, haircare, makeup, or fragrance.";
    return;
  }

  // Add user's question to chatHistory
  chatHistory.push({
    role: "user",
    content: userInput
  });

  // Show loading message
  renderChat();
  chatWindow.innerHTML += `<div class="chat-message loading-message">Thinking...</div>`;

  try {
    // Send updated chatHistory to OpenAI API
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: chatHistory })
    });

    const data = await response.json();

    // Check for AI response
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Add AI response to chatHistory
      chatHistory.push({
        role: "assistant",
        content: data.choices[0].message.content
      });
      // Render chat history
      renderChat();
    } else {
      chatWindow.innerHTML = "Sorry, no answer was generated. Please try again.";
    }
  } catch (error) {
    chatWindow.innerHTML = "Error getting response. Please try again.";
  }

  // Clear input box
  document.getElementById("userInput").value = "";
});
