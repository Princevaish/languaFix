// static/js/main.js

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initCharCounter();
    initFileUpload();
    initTabs();
    initForms();
    initClearButton();
    initApiMode();
    initMobileMenu();
    initScrollEffects();
    
    // Auto-dismiss error notifications after 5 seconds
    const errorNotification = document.getElementById('errorNotification');
    if (errorNotification) {
        setTimeout(() => {
            errorNotification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => errorNotification.remove(), 300);
        }, 5000);
    }
}

function initCharCounter() {
    const textarea = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        textarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
        });
    }
}

function initFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileDropZone = document.getElementById('fileDropZone');
    const fileSelected = document.getElementById('fileSelected');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFile');
    
    if (!fileInput || !fileDropZone) return;
    
    // Click to upload
    fileDropZone.addEventListener('click', function(e) {
        if (e.target !== removeFileBtn) {
            fileInput.click();
        }
    });
    
    // File selection
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            fileName.textContent = file.name;
            fileDropZone.querySelector('.file-drop-content').style.display = 'none';
            fileSelected.style.display = 'flex';
        }
    });
    
    // Remove file
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            fileInput.value = '';
            fileDropZone.querySelector('.file-drop-content').style.display = 'block';
            fileSelected.style.display = 'none';
        });
    }
    
    // Drag and drop
    fileDropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    fileDropZone.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });
    
    fileDropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            const file = files[0];
            fileName.textContent = file.name;
            this.querySelector('.file-drop-content').style.display = 'none';
            fileSelected.style.display = 'flex';
        }
    });
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const activeContent = document.getElementById(targetTab + 'Tab');
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}

function initForms() {
    const textForm = document.getElementById('textForm');
    const fileForm = document.getElementById('fileForm');
    
    if (textForm) {
        textForm.addEventListener('submit', function(e) {
            const button = this.querySelector('.btn-neon');
            setButtonLoading(button, true);
        });
    }
    
    if (fileForm) {
        fileForm.addEventListener('submit', function(e) {
            const fileInput = document.getElementById('fileInput');
            
            if (!fileInput.files || fileInput.files.length === 0) {
                e.preventDefault();
                showNotification('Please select a file to upload', 'error');
                return;
            }
            
            const button = this.querySelector('.btn-neon');
            setButtonLoading(button, true);
        });
    }
}

function initClearButton() {
    const clearBtn = document.getElementById('clearText');
    const textarea = document.getElementById('textInput');
    
    if (clearBtn && textarea) {
        clearBtn.addEventListener('click', function() {
            textarea.value = '';
            textarea.dispatchEvent(new Event('input'));
            textarea.focus();
        });
    }
}

function initApiMode() {
    const useApiBtn = document.getElementById('useApiBtn');
    const textForm = document.getElementById('textForm');
    const textInput = document.getElementById('textInput');
    
    if (useApiBtn && textForm && textInput) {
        useApiBtn.addEventListener('click', async function() {
            const text = textInput.value.trim();
            
            if (!text) {
                showNotification('Please enter some text to check', 'error');
                return;
            }
            
            setButtonLoading(this, true);
            
            try {
                const response = await fetch('/api/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: text })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    displayApiResults(data.data);
                    showNotification('Analysis completed successfully!', 'success');
                } else {
                    showNotification(data.error || 'An error occurred', 'error');
                }
            } catch (error) {
                console.error('API Error:', error);
                showNotification('Failed to connect to API', 'error');
            } finally {
                setButtonLoading(this, false);
            }
        });
    }
}

function displayApiResults(data) {
    const modal = document.getElementById('apiResultsModal');
    const modalBody = document.getElementById('apiResultsBody');
    
    if (!modal || !modalBody) return;
    
    let html = '<div class="api-results">';
    
    // Statistics
    html += '<div class="api-section">';
    html += '<h4 class="api-section-title">Statistics</h4>';
    html += '<div class="stats-grid">';
    
    const stats = data.statistics;
    html += `
        <div class="stat-detail-card">
            <div class="stat-detail-label">Words</div>
            <div class="stat-detail-value">${stats.word_count}</div>
        </div>
        <div class="stat-detail-card">
            <div class="stat-detail-label">Characters</div>
            <div class="stat-detail-value">${stats.character_count}</div>
        </div>
        <div class="stat-detail-card">
            <div class="stat-detail-label">Score</div>
            <div class="stat-detail-value">${stats.grammar_score}%</div>
        </div>
        <div class="stat-detail-card">
            <div class="stat-detail-label">Errors</div>
            <div class="stat-detail-value">${stats.total_errors}</div>
        </div>
    `;
    
    html += '</div></div>';
    
    // Corrected Text
    html += '<div class="api-section">';
    html += '<h4 class="api-section-title">Corrected Text</h4>';
    html += `<div class="api-code">${escapeHtml(data.corrected_text)}</div>`;
    html += '</div>';
    
    // Grammar Errors
    if (data.grammar_errors && data.grammar_errors.length > 0) {
        html += '<div class="api-section">';
        html += '<h4 class="api-section-title">Grammar Errors</h4>';
        html += '<div class="errors-list">';
        
        data.grammar_errors.forEach((error, index) => {
            html += `
                <div class="error-item">
                    <div class="error-indicator"></div>
                    <div class="error-details">
                        <div class="error-message">${escapeHtml(error.message)}</div>
                        <div class="error-suggestion">Suggestion: ${escapeHtml(error.replacements[0] || 'N/A')}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    // Spelling Errors
    if (data.spelling_errors && data.spelling_errors.length > 0) {
        html += '<div class="api-section">';
        html += '<h4 class="api-section-title">Spelling Errors</h4>';
        html += '<div class="errors-list">';
        
        data.spelling_errors.forEach((error, index) => {
            html += `
                <div class="error-item">
                    <div class="error-indicator"></div>
                    <div class="error-details">
                        <div class="error-message">${escapeHtml(error.original)}</div>
                        <div class="error-suggestion">Correction: ${escapeHtml(error.correction)}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    html += '</div>';
    
    modalBody.innerHTML = html;
    modal.classList.add('active');
}

function closeApiModal() {
    const modal = document.getElementById('apiResultsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('apiResultsModal');
    if (e.target === modal) {
        closeApiModal();
    }
});

function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
        error: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
        info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${icons[type] || icons.info}
            </svg>
        </div>
        <div class="notification-content">
            <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
}

function copyResults() {
    const correctedText = document.querySelector('.tab-content.active .result-content');
    if (correctedText) {
        const text = correctedText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Results copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy results', 'error');
        });
    }
}

function downloadResults() {
    const correctedText = document.querySelector('.tab-content.active .result-content');
    if (correctedText) {
        const text = correctedText.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'languafix-corrected-text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Results downloaded!', 'success');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Additional CSS for API modal sections
const style = document.createElement('style');
style.textContent = `
    .api-results {
        max-width: 100%;
    }
    
    .api-section {
        margin-bottom: 2rem;
    }
    
    .api-section-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--neon-cyan);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .api-section-title::before {
        content: '';
        width: 4px;
        height: 20px;
        background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
        border-radius: 2px;
    }
    
    .api-code {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 1.5rem;
        font-family: 'Inter', monospace;
        font-size: 0.9rem;
        line-height: 1.8;
        white-space: pre-wrap;
        word-break: break-word;
        color: var(--text-secondary);
    }
    
    @keyframes slideOutRight {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    @media (max-width: 768px) {
        .nav-links.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(10, 10, 15, 0.98);
            backdrop-filter: blur(20px);
            padding: 2rem;
            border-bottom: 1px solid var(--glass-border);
            gap: 1.5rem;
        }
    }
`;
document.head.appendChild(style);

/* ============================================
   PREMIUM VISUAL ENHANCEMENTS
   ============================================ */

// Initialize all premium effects
function initPremiumEffects() {
    initCursorGlow();
    initNeuralMesh();
    initFloatingParticles();
    initMagneticButtons();
    initCardTiltEffect();
    initStatCardsAnimation();
}

// Add to existing initializeApp function
const originalInitializeApp = initializeApp;
initializeApp = function() {
    originalInitializeApp();
    
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        initPremiumEffects();
    }
};

// ============================================
// 1. Cursor Reactive Glow Effect
// ============================================
function initCursorGlow() {
    const cursorGlow = document.createElement('div');
    cursorGlow.id = 'cursorGlow';
    document.body.appendChild(cursorGlow);
    
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    
    // Smooth interpolation
    function animate() {
        const dx = mouseX - currentX;
        const dy = mouseY - currentY;
        
        currentX += dx * 0.1;
        currentY += dy * 0.1;
        
        cursorGlow.style.transform = `translate(${currentX}px, ${currentY}px)`;
        requestAnimationFrame(animate);
    }
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX - 300;
        mouseY = e.clientY - 300;
    });
    
    // Hide on mobile
    if (window.innerWidth <= 768) {
        cursorGlow.style.display = 'none';
    }
    
    animate();
}

// ============================================
// 2. Neural Network Mesh Overlay
// ============================================
function initNeuralMesh() {
    const canvas = document.createElement('canvas');
    canvas.id = 'neuralMesh';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Nodes
    const nodes = [];
    const nodeCount = window.innerWidth > 768 ? 30 : 15;
    const maxDistance = 150;
    
    class Node {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = 2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.fill();
        }
    }
    
    // Initialize nodes
    for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node());
    }
    
    // Draw connections
    function drawConnections() {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        nodes.forEach(node => {
            node.update();
            node.draw();
        });
        
        drawConnections();
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ============================================
// 3. Floating Particles
// ============================================
function initFloatingParticles() {
    const container = document.createElement('div');
    container.id = 'particlesContainer';
    document.body.appendChild(container);
    
    const particleCount = window.innerWidth > 768 ? 20 : 10;
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        
        // Random starting position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = '-10px';
        
        // Random animation duration
        const duration = 15 + Math.random() * 10;
        particle.style.animationDuration = `${duration}s`;
        
        // Random horizontal drift
        particle.style.setProperty('--drift', `${(Math.random() - 0.5) * 100}px`);
        
        // Random delay
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        container.appendChild(particle);
        
        // Remove and recreate after animation
        setTimeout(() => {
            particle.remove();
            createParticle();
        }, duration * 1000);
    }
    
    // Create initial particles
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => createParticle(), i * 300);
    }
}

// ============================================
// 4. Magnetic Button Effect
// ============================================
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-neon, .btn-primary, .btn-api');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.classList.add('magnetic');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('magnetic');
            this.style.setProperty('--mouse-x', '0px');
            this.style.setProperty('--mouse-y', '0px');
        });
        
        button.addEventListener('mousemove', function(e) {
            if (!this.classList.contains('magnetic')) return;
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = 50;
            
            if (distance < maxDistance) {
                const strength = (maxDistance - distance) / maxDistance;
                const moveX = x * strength * 0.3;
                const moveY = y * strength * 0.3;
                
                this.style.setProperty('--mouse-x', `${moveX}px`);
                this.style.setProperty('--mouse-y', `${moveY}px`);
            }
        });
    });
}

// ============================================
// 5. Glass Card Parallax Tilt Effect
// ============================================
function initCardTiltEffect() {
    const cards = document.querySelectorAll('.glass-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('tilt-active');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('tilt-active');
            this.style.setProperty('--tilt-x', '0deg');
            this.style.setProperty('--tilt-y', '0deg');
        });
        
        card.addEventListener('mousemove', function(e) {
            if (!this.classList.contains('tilt-active')) return;
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            this.style.setProperty('--tilt-x', `${rotateX}deg`);
            this.style.setProperty('--tilt-y', `${rotateY}deg`);
        });
    });
}

// ============================================
// 6. Stat Cards Sequential Animation
// ============================================
function initStatCardsAnimation() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        card.style.setProperty('--index', index);
    });
    
    // Trigger animation on scroll for results section
    const resultsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.stat-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.animation = 'statsSlideIn 0.6s ease forwards';
                    }, index * 100);
                });
                resultsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
        resultsObserver.observe(resultsContainer);
    }
}

// ============================================
// Performance Monitoring
// ============================================
let frameCount = 0;
let lastTime = performance.now();

function monitorPerformance() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // If FPS drops below 30, disable heavy effects
        if (fps < 30) {
            console.warn('Low FPS detected. Disabling heavy effects.');
            document.getElementById('neuralMesh')?.remove();
            document.getElementById('particlesContainer')?.remove();
        }
        
        frameCount = 0;
        lastTime = currentTime;
    }
    
    requestAnimationFrame(monitorPerformance);
}

// Start monitoring only in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    monitorPerformance();
}