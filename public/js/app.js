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
    console.log('Create API key modal');
    showToast('Create API key functionality coming soon', 'info');
};

window.copyApiKey = function(keyId) {
    console.log('Copy API key:', keyId);
    showToast('API key copied to clipboard', 'success');
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});