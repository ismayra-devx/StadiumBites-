// Mock Data for the V4 Prototype (Local Images, AI-First)
const foodData = [
    {
        id: 1,
        name: "Classic Cheeseburger",
        vendor: "Gate 4 Grill",
        image: "images/stadium_cheeseburger.png",
        tasteRating: 4.8,
        hygieneRating: 92,
        reviews: 342,
        waitTime: 12,
        freshness: "Just Grilled"
    },
    {
        id: 2,
        name: "Spicy Paneer Wrap",
        vendor: "The Pavilion Wraps",
        image: "images/spicy_paneer_wrap.png",
        tasteRating: 4.6,
        hygieneRating: 98,
        reviews: 215,
        waitTime: 3,
        freshness: "Fresh Ingredients"
    },
    {
        id: 3,
        name: "Margherita Pizza Slice",
        vendor: "Slice of the Action",
        image: "images/woodfired_pizza_slice.png",
        tasteRating: 4.5,
        hygieneRating: 85,
        reviews: 189,
        waitTime: 8,
        freshness: "Hot out the oven"
    }
];

// DOM Elements
const trendingGrid = document.getElementById('trending-grid');
const template = document.getElementById('food-card-template');

// Modal Elements
const modal = document.getElementById('rating-modal');
const closeModalBtn = document.getElementById('close-modal');
const stars = document.querySelectorAll('.star-rate');
const hygieneSlider = document.getElementById('hygiene-slider');
const hygieneValueDisplay = document.getElementById('hygiene-value-display');
const hygieneShieldIcon = document.getElementById('hygiene-shield');
const tasteValueDisplay = document.getElementById('taste-value-display');
const submitBtn = document.getElementById('submit-rating');
const toast = document.getElementById('toast');

// AI Elements
const globalInsightText = document.getElementById('global-insight-text');
const chatFab = document.getElementById('open-chat-btn');
const chatPanel = document.getElementById('chat-panel');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');

// State
let currentSelectedFoodId = null;
let currentSelectedTaste = 0;
let currentSelectedHygiene = 50;

// Backend API URL
const API_BASE_URL = 'http://localhost:8000';

// Initialize Application
function init() {
    renderTrending();
    setupEventListeners();
    
    // Kick off the AI Global Scan
    fetchGlobalInsight();
}

// --- FastAPI Integration ---
async function fetchGlobalInsight() {
    globalInsightText.innerHTML = 'Connecting to AI Core... scanning stadium logistics...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: foodData })
        });

        if (response.ok) {
            const data = await response.json();
            globalInsightText.innerHTML = data.insight;
        } else {
            globalInsightText.innerHTML = "AI Backend offline. Running in local mode.";
        }
    } catch (error) {
        console.error("Error fetching AI insight:", error);
        globalInsightText.innerHTML = "<span style='color: var(--danger-color);'><i class='fa-solid fa-triangle-exclamation'></i> Connection Error</span>: Please start the Python backend (<code>python -m uvicorn api:app --reload</code>) and refresh.";
    }
}

async function sendChatMessage() {
    const query = chatInput.value.trim();
    if (!query) return;

    // Append User Message
    appendChatMessage(query, 'user');
    chatInput.value = '';

    // Append "Thinking" indicator
    const thinkingId = appendChatMessage('...', 'bot');

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query, items: foodData })
        });

        if (response.ok) {
            const data = await response.json();
            updateChatMessage(thinkingId, data.response);
        } else {
            updateChatMessage(thinkingId, "Error connecting to AI Core.");
        }
    } catch (error) {
        updateChatMessage(thinkingId, "Server unreachable. Is the Python backend running?");
    }
}

function appendChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.textContent = text;
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
}

function updateChatMessage(id, text) {
    const msgDiv = document.getElementById(id);
    if (msgDiv) {
        msgDiv.textContent = text;
    }
}

// --- Chat UI Listeners ---
chatFab.addEventListener('click', () => {
    chatPanel.classList.add('active');
    chatInput.focus();
});

closeChatBtn.addEventListener('click', () => {
    chatPanel.classList.remove('active');
});

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// Helper: Determine Wait Time Color Class
function getWaitTimeClass(minutes) {
    if (minutes < 5) return 'text-success';
    if (minutes <= 10) return 'text-warning';
    return 'text-danger';
}

// Render Trending Items using <template>
function renderTrending() {
    trendingGrid.innerHTML = '';
    
    foodData.forEach(item => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.food-image').src = item.image;
        clone.querySelector('.food-title').textContent = item.name;
        clone.querySelector('.food-vendor').textContent = item.vendor;
        clone.querySelector('.freshness-tag span').textContent = item.freshness;
        
        const waitBadge = clone.querySelector('.wait-time-badge');
        waitBadge.classList.add(getWaitTimeClass(item.waitTime));
        clone.querySelector('.time-text').textContent = `${item.waitTime}m`;
        
        clone.querySelector('.taste-score').textContent = item.tasteRating.toFixed(1);
        clone.querySelector('.hygiene-score').textContent = `${Math.round(item.hygieneRating)}%`;
        
        const rateBtn = clone.querySelector('.rate-btn');
        rateBtn.addEventListener('click', () => openModal(item.id));
        
        trendingGrid.appendChild(clone);
    });
}

// Modal Logic
window.openModal = function(foodId) {
    const food = foodData.find(item => item.id === foodId);
    if (!food) return;

    currentSelectedFoodId = foodId;
    currentSelectedTaste = 0;
    currentSelectedHygiene = 50; 

    document.getElementById('modal-title').textContent = food.name;
    document.getElementById('modal-vendor').textContent = food.vendor;
    
    resetStars();
    hygieneSlider.value = 50;
    updateHygieneUI(50);
    tasteValueDisplay.textContent = '0';
    
    submitBtn.disabled = true;
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

// Event Listeners for Rating
function setupEventListeners() {
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = this.getAttribute('data-value');
            highlightStars(val);
        });
        star.addEventListener('mouseout', function() {
            highlightStars(currentSelectedTaste);
        });
        star.addEventListener('click', function() {
            currentSelectedTaste = parseInt(this.getAttribute('data-value'));
            tasteValueDisplay.textContent = currentSelectedTaste;
            highlightStars(currentSelectedTaste);
            stars.forEach((s, idx) => {
                if(idx < currentSelectedTaste) {
                    s.classList.remove('fa-regular');
                    s.classList.add('fa-solid');
                } else {
                    s.classList.remove('fa-solid');
                    s.classList.add('fa-regular');
                }
            });
            checkSubmitState();
        });
    });
    
    hygieneSlider.addEventListener('input', (e) => {
        currentSelectedHygiene = parseInt(e.target.value);
        updateHygieneUI(currentSelectedHygiene);
        checkSubmitState();
    });

    submitBtn.addEventListener('click', () => {
        if (currentSelectedTaste > 0 && currentSelectedFoodId) {
            submitRating(currentSelectedFoodId, currentSelectedTaste, currentSelectedHygiene);
        }
    });
}

function highlightStars(val) {
    stars.forEach(star => {
        if (star.getAttribute('data-value') <= val) {
            star.classList.add('hovered');
        } else {
            star.classList.remove('hovered');
        }
    });
}

function resetStars() {
    stars.forEach(star => {
        star.classList.remove('hovered', 'selected', 'fa-solid');
        star.classList.add('fa-regular');
    });
}

function updateHygieneUI(val) {
    hygieneValueDisplay.textContent = val;
    if (val < 40) {
        hygieneShieldIcon.style.color = 'var(--danger-color)';
    } else if (val < 75) {
        hygieneShieldIcon.style.color = 'var(--warning-color)';
    } else {
        hygieneShieldIcon.style.color = 'var(--shield-color)'; 
    }
}

function checkSubmitState() {
    if (currentSelectedTaste > 0) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Simulate Backend Submission
function submitRating(foodId, newTaste, newHygiene) {
    const food = foodData.find(item => item.id === foodId);
    const totalTaste = (food.tasteRating * food.reviews) + newTaste;
    const totalHygiene = (food.hygieneRating * food.reviews) + newHygiene;
    
    food.reviews += 1;
    food.tasteRating = totalTaste / food.reviews;
    food.hygieneRating = totalHygiene / food.reviews;

    closeModal();
    renderTrending(); 
    fetchGlobalInsight(); // Re-scan the stadium after data changes!
    showToast();
}

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Boot the app
init();
