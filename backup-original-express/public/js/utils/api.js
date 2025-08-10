// API Client for Screenshot Dashboard
class ApiClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token && !endpoint.startsWith('/auth/')) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.setToken(null);
                showLoginModal();
                throw new Error('Authentication required');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success && response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async logout() {
        this.setToken(null);
        showLoginModal();
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return await this.request('/admin/dashboard');
    }

    async getRecentActivity() {
        return await this.request('/admin/activity');
    }

    async getUsageChart(days = 30) {
        return await this.request(`/admin/usage-chart?days=${days}`);
    }

    // API Keys endpoints
    async getApiKeys() {
        return await this.request('/admin/api-keys');
    }

    async createApiKey(keyData) {
        return await this.request('/admin/api-keys', {
            method: 'POST',
            body: JSON.stringify(keyData)
        });
    }

    async updateApiKey(keyId, updates) {
        return await this.request(`/admin/api-keys/${keyId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteApiKey(keyId) {
        return await this.request(`/admin/api-keys/${keyId}`, {
            method: 'DELETE'
        });
    }

    // Screenshots endpoints
    async getScreenshots(filters = {}, page = 1, limit = 20) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        
        return await this.request(`/admin/screenshots?${params}`);
    }

    async deleteScreenshot(screenshotId) {
        return await this.request(`/admin/screenshots/${screenshotId}`, {
            method: 'DELETE'
        });
    }

    // Analytics endpoints
    async getAnalytics(days = 30) {
        return await this.request(`/admin/analytics?days=${days}`);
    }

    async getFormatStats() {
        return await this.request('/admin/analytics/formats');
    }

    async getUsageStats() {
        return await this.request('/admin/analytics/usage');
    }

    // Health endpoint
    async getHealth() {
        return await this.request('/health');
    }
}

// Global API client instance
const api = new ApiClient();

// Utility functions for API handling
function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'x-circle' : 
                 type === 'warning' ? 'alert-circle' : 'info';
    
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Initialize Lucide icons in the toast
    lucide.createIcons();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Export for use in other modules
window.api = api;
window.showLoading = showLoading;
window.showToast = showToast;
window.formatNumber = formatNumber;
window.formatBytes = formatBytes;
window.formatDateTime = formatDateTime;
window.formatRelativeTime = formatRelativeTime;