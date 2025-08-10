// Main Application Controller
class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.user = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeIcons();
        
        // Check authentication
        if (api.token) {
            await this.loadUserData();
            this.showDashboard();
        } else {
            this.showLoginModal();
        }

        // Initialize dashboard if authenticated
        if (this.user) {
            await this.loadDashboard();
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });

        // User menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userMenu = document.getElementById('user-menu');
        
        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('hidden');
            });

            document.addEventListener('click', () => {
                userMenu.classList.add('hidden');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    initializeIcons() {
        // Initialize Lucide icons
        lucide.createIcons();
    }

    async loadUserData() {
        try {
            // For now, we'll use a simple approach
            // In a real app, you might want to decode the JWT or make a /me request
            this.user = { username: 'Admin', role: 'admin' };
            
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = this.user.username;
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.logout();
        }
    }

    navigateTo(page) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-page="${page}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show/hide pages
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        this.currentPage = page;

        // Load page-specific data
        this.loadPageData(page);
    }

    async loadPageData(page) {
        try {
            showLoading(true);
            
            switch (page) {
                case 'dashboard':
                    await initializeDashboard();
                    break;
                case 'api-keys':
                    await initializeApiKeys();
                    break;
                case 'screenshots':
                    await initializeScreenshots();
                    break;
                case 'analytics':
                    await initializeAnalytics();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${page} data:`, error);
            showToast(`Failed to load ${page} data: ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    }



    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            showToast('Please enter both username and password', 'error');
            return;
        }

        try {
            showLoading(true);
            const result = await api.login(username, password);
            
            if (result.success) {
                this.user = result.user;
                this.hideLoginModal();
                this.showDashboard();
                await this.loadDashboard();
                showToast('Welcome back!', 'success');
            } else {
                showToast(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('Login failed: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    logout() {
        api.logout();
        this.user = null;
        this.showLoginModal();
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showDashboard() {
        this.hideLoginModal();
        this.navigateTo('dashboard');
    }

    toggleTheme() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
}

// Global functions for onclick handlers
window.showCreateKeyModal = function() {
    const modal = document.getElementById('create-key-modal');
    
    if (modal) {
        // Reset form
        const form = document.getElementById('create-key-form');
        if (form) {
            form.reset();
            // Set minimum date to today
            const dateInput = document.getElementById('key-expires');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.setAttribute('min', today);
            }
        }
        
        // Show modal with proper CSS class system
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Re-initialize lucide icons for the modal
        if (window.lucide && window.lucide.createIcons) {
            window.lucide.createIcons();
        }
    } else {
        console.error('❌ create-key-modal element not found!');
    }
};

window.closeCreateKeyModal = function() {
    const modal = document.getElementById('create-key-modal');
    if (modal) {
        modal.classList.remove('show');
        // Hide modal after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

window.handleCreateApiKey = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const keyData = {
        name: formData.get('name').trim(),
        description: formData.get('description').trim(),
        rate_limit: parseInt(formData.get('rate_limit')),
        expires_at: formData.get('expires_at') || null,
        created_by: 1 // Assuming admin user ID is 1
    };
    
    // Validate required fields
    if (!keyData.name) {
        showToast('API key name is required', 'error');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 mr-2 animate-spin"></i> Creating...';
        submitBtn.disabled = true;
        
        // Ensure API keys page is initialized
        if (!window.apiKeysPage) {
            console.log('Initializing API keys page...');
            await initializeApiKeys();
        }
        
        // Get the API keys page instance and create the key
        if (window.apiKeysPage && window.apiKeysPage.createApiKey) {
            await window.apiKeysPage.createApiKey(keyData);
            closeCreateKeyModal();
        } else {
            showToast('Failed to initialize API keys page', 'error');
        }
    } catch (error) {
        console.error('Error creating API key:', error);
        showToast(`Failed to create API key: ${error.message}`, 'error');
    } finally {
        // Reset button state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i data-lucide="key" class="w-4 h-4 mr-2"></i> Create API Key';
            submitBtn.disabled = false;
            lucide.createIcons(); // Re-initialize icons
        }
    }
};

// API Key Created Modal Functions
window.showApiKeyCreatedModal = function(apiKeyData) {
    const modal = document.getElementById('api-key-created-modal');
    const keyNameInput = document.getElementById('created-key-name');
    const apiKeyInput = document.getElementById('created-api-key');
    const exampleKeySpan = document.getElementById('example-key');
    
    if (modal && keyNameInput && apiKeyInput && exampleKeySpan) {
        keyNameInput.value = apiKeyData.name || 'Unnamed Key';
        apiKeyInput.value = apiKeyData.raw_key || '';
        exampleKeySpan.textContent = apiKeyData.raw_key || 'your-api-key';
        
        // Show modal with proper CSS class system
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Store the key data for download functionality
        window.currentApiKeyData = apiKeyData;
        
        // Re-initialize lucide icons
        if (window.lucide && window.lucide.createIcons) {
            window.lucide.createIcons();
        }
        
        // Focus the API key input for easy selection
        setTimeout(() => {
            apiKeyInput.select();
        }, 100);
    }
};

window.closeApiKeyModal = function() {
    const modal = document.getElementById('api-key-created-modal');
    if (modal) {
        modal.classList.remove('show');
        // Hide modal after animation completes
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        // Clear the stored key data for security
        delete window.currentApiKeyData;
    }
};

window.copyApiKey = function() {
    const apiKeyInput = document.getElementById('created-api-key');
    if (apiKeyInput && apiKeyInput.value) {
        navigator.clipboard.writeText(apiKeyInput.value).then(() => {
            showToast('API key copied to clipboard!', 'success');
            
            // Update the button text temporarily
            const copyBtn = event.target.closest('button');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> Copied!';
            copyBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            copyBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                copyBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                lucide.createIcons(); // Re-initialize lucide icons
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            apiKeyInput.select();
            document.execCommand('copy');
            showToast('API key copied to clipboard!', 'success');
        });
    }
};

window.downloadApiKeyInfo = function() {
    if (!window.currentApiKeyData) {
        showToast('No API key data available', 'error');
        return;
    }
    
    const keyData = window.currentApiKeyData;
    const info = {
        name: keyData.name,
        api_key: keyData.raw_key,
        created_at: new Date().toISOString(),
        rate_limit: keyData.rate_limit || 1000,
        usage_example: {
            curl: `curl -X POST http://localhost:3000/screenshot \\
  -H "Authorization: Bearer ${keyData.raw_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`,
            javascript: `fetch('http://localhost:3000/screenshot', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${keyData.raw_key}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://example.com' })
})`
        },
        important_notes: [
            "This is the only time you'll see your API key",
            "Store this key securely - it cannot be recovered if lost",
            "Keep your API key private and don't share it publicly",
            "Use environment variables to store the key in your applications"
        ]
    };
    
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-key-${keyData.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('API key information downloaded', 'success');
};

window.editApiKey = function(keyId) {
    console.log('Edit API key:', keyId);
    showToast('Edit API key functionality coming soon', 'info');
};

window.deleteApiKey = function(keyId) {
    console.log('Delete API key:', keyId);
    showToast('Delete API key functionality coming soon', 'info');
};

window.closeModal = function() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.classList.remove('show');
    }
};

// Global function for showing login modal (called by api.js)
window.showLoginModal = function() {
    if (window.app && window.app.showLoginModal) {
        window.app.showLoginModal();
    } else {
        // Fallback if app not initialized yet
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});