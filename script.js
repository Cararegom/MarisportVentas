import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://ktbkqqiqeogwfnxjnpxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YmtxcWlxZW9nd2ZueGpucHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDYyNTEsImV4cCI6MjA2NDIyMjI1MX0.z84-xZz2H-VwpeqjITrjLDnEg35Slv485H534Ur7qbo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Wompi config
const WOMPI_PUBLIC_KEY = 'pub_test_ZHPvWKzKQSDwDKT0HQqVbWbdrnkrW7ll';

// Global state
let products = [];
let categories = [];
let cart = [];
let currentCategory = 'all';

// DOM elements
const productsGrid = document.getElementById('productsGrid');
const categoryButtons = document.getElementById('categoryButtons');
const cartToggle = document.getElementById('cartToggle');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const productModal = document.getElementById('productModal');
const checkoutModal = document.getElementById('checkoutModal');
const successModal = document.getElementById('successModal');
const notification = document.getElementById('notification');
const loading = document.getElementById('loading');
const motivationalPhrase = document.getElementById('motivationalPhrase');

// Motivational phrases
const motivationalPhrases = [
    "💪 ¡Tu único límite eres tú misma!",
    "🏋️‍♀️ Cada día es una nueva oportunidad para mejorar",
    "✨ Fuerza, belleza y determinación en una sola mujer",
    "🔥 Convierte tus metas en logros",
    "💖 Entrena como una guerrera, luce como una diosa",
    "🌟 El poder está en ti, solo debes activarlo",
    "🏃‍♀️ Supérate a ti misma cada día",
    "💜 Fuerte, valiente e imparable",
    "🧘‍♀️ Mente sana, cuerpo fuerte",
    "⚡ Despierta la atleta que llevas dentro"
];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    await loadCategories();
    setupEventListeners();
    updateCartUI();
    startMotivationalPhrases();
});

// Load products from Supabase
async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('creado_en', { ascending: false });

        if (error) throw error;
        
        products = data || [];
        renderProducts();
        loading.style.display = 'none';
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error al cargar productos', 'error');
        loading.style.display = 'none';
    }
}

// Load categories
async function loadCategories() {
    try {
        const uniqueCategories = [...new Set(products.map(p => p.categoria).filter(Boolean))];
        categories = uniqueCategories;
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render products
function renderProducts() {
    const filteredProducts = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.categoria === currentCategory);

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            <div class="product-image">
                ${product.imagen_url 
                    ? `<img src="${product.imagen_url}" alt="${product.nombre}">`
                    : ''
                }
            </div>
            <div class="product-info">
                <div class="product-name">${product.nombre}</div>
                <div class="product-category">${product.categoria || 'Sin categoría'}</div>
                <div class="product-price">$${parseFloat(product.precio).toLocaleString()}</div>
                <div class="product-stock">Stock: ${product.stock}</div>
                <button class="buy-button" onclick="event.stopPropagation(); openProductModal('${product.id}')" 
                        ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock <= 0 ? 'Agotado' : 'Comprar'}
                </button>
            </div>
        </div>
    `).join('');
}

// Render categories
function renderCategories() {
    const categoryHTML = categories.map(category => 
        `<button class="category-btn" data-category="${category}">${category}</button>`
    ).join('');
    
    categoryButtons.innerHTML = `
        <button class="category-btn active" data-category="all">Todos</button>
        ${categoryHTML}
    `;
}

// Open product modal
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-image">
                ${product.imagen_url 
                    ? `<img src="${product.imagen_url}" alt="${product.nombre}">`
                    : ''
                }
            </div>
            <h3>${product.nombre}</h3>
            <div class="product-detail-price">$${parseFloat(product.precio).toLocaleString()}</div>
            <p>${product.descripcion || 'Sin descripción'}</p>
            <div class="product-options">
                <div class="option-group">
                    <label>Cantidad:</label>
                    <input type="number" id="quantity" value="1" min="1" max="${product.stock}">
                </div>
                ${product.talla ? `
                    <div class="option-group">
                        <label>Talla:</label>
                        <select id="size">
                            <option value="${product.talla}">${product.talla}</option>
                        </select>
                    </div>
                ` : ''}
                ${product.color ? `
                    <div class="option-group">
                        <label>Color:</label>
                        <select id="color">
                            <option value="${product.color}">${product.color}</option>
                        </select>
                    </div>
                ` : ''}
            </div>
            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" 
                    ${product.stock <= 0 ? 'disabled' : ''}>
                ${product.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
            </button>
        </div>
    `;

    productModal.classList.add('visible');
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const size = document.getElementById('size')?.value || product.talla || null;
    const color = document.getElementById('color')?.value || product.color || null;

    const cartItem = {
        id: `${productId}-${size}-${color}`,
        productId,
        name: product.nombre,
        price: parseFloat(product.precio),
        quantity,
        size,
        color,
        image: product.imagen_url
    };

    const existingItem = cart.find(item => item.id === cartItem.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push(cartItem);
    }

    updateCartUI();
    showNotification('Producto agregado al carrito');
    productModal.classList.remove('visible');
}

// Update cart UI
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toLocaleString();
    
    document.getElementById('checkoutTotal').textContent = totalPrice.toLocaleString();

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-options">
                    ${item.size ? `Talla: ${item.size}` : ''} 
                    ${item.color ? ` - Color: ${item.color}` : ''}
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button class="quantity-btn" onclick="removeFromCart('${item.id}')" style="margin-left: 10px; background: #ff6b6b; color: white;">×</button>
                </div>
            </div>
            <div class="cart-item-price">$${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `).join('');

    checkoutBtn.disabled = cart.length === 0;
}

// Update quantity
function updateQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        updateCartUI();
    }
}

// Remove from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
}

// Open checkout
function openCheckout() {
    if (cart.length === 0) return;

    const orderSummary = document.getElementById('orderSummary');
    orderSummary.innerHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.name} (${item.quantity}x)</span>
            <span>$${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');

    checkoutModal.classList.add('visible');
}

// INTEGRACIÓN REAL CON WOMPI:
function pagarConWompi({ total, customerData, cart }) {
    const valorCentavos = Math.round(total * 100);
    const referencia = 'MSPORT-' + Date.now();

    // Guardar info de la orden en localStorage (para mostrar resumen en success.html)
    localStorage.setItem('orderInfo', JSON.stringify({
        customerData,
        cart,
        referencia,
        total
    }));

    // URL de redirección después del pago (ajusta si tu dominio cambia)
    const redirectUrl = window.location.origin + '/success.html?ref=' + referencia;

    // Redirigir al checkout de Wompi
    const checkoutUrl = `https://checkout.wompi.co/p/?public-key=${WOMPI_PUBLIC_KEY}` +
        `&currency=COP&amount-in-cents=${valorCentavos}` +
        `&reference=${referencia}` +
        `&redirect-url=${encodeURIComponent(redirectUrl)}`;

    window.location.href = checkoutUrl;
}

// Checkout form: enviar a Wompi
document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const customerData = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value,
        whatsapp: document.getElementById('customerWhatsapp').value
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    pagarConWompi({ total, customerData, cart });
});

// Show notification
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Start motivational phrases rotation
function startMotivationalPhrases() {
    const phraseElement = document.getElementById('motivationalPhrase');
    let currentIndex = 0;
    
    function updatePhrase() {
        phraseElement.style.opacity = '0';
        setTimeout(() => {
            phraseElement.textContent = motivationalPhrases[currentIndex];
            phraseElement.style.opacity = '1';
            currentIndex = (currentIndex + 1) % motivationalPhrases.length;
        }, 300);
    }
    
    // Change phrase every 4 seconds
    setInterval(updatePhrase, 4000);
}

// Setup event listeners
function setupEventListeners() {
    // Cart toggle
    cartToggle.addEventListener('click', () => {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('visible');
    });

    // Close cart
    closeCart.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('visible');
    });

    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('visible');
    });

    // Category filters
    categoryButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            renderProducts();
        }
    });

    // Checkout
    checkoutBtn.addEventListener('click', openCheckout);

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('visible');
        });
    });

    document.getElementById('closeCheckoutModal').addEventListener('click', () => {
        checkoutModal.classList.remove('visible');
    });

    document.getElementById('closeSuccess').addEventListener('click', () => {
        successModal.classList.remove('visible');
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
            }
        });
    });
}

// Make functions global for onclick handlers
window.openProductModal = openProductModal;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.openCheckout = openCheckout;
