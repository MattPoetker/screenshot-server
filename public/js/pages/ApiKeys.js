// API Keys Page Component

class ApiKeys {
    constructor() {
        this.apiKeys = [];
        this.apiKeyCards = [];
        this.container = null;
        this.isLoaded = false;
    }
    
    async init() {
        if (this.isLoaded) return;
        
        console.log('Initializing API Keys page...');
        
        this.container = document.getElementById('api-keys-grid');
        if (!this.container) {
            console.error('API Keys container not found');
            return;
        }
        
        // Load API keys data
        await this.loadData();
        
        this.isLoaded = true;
        console.log('API Keys page initialized successfully');
    }
    
    async loadData() {
        try {
            console.log('Loading API keys...');
            
            // Show loading state
            this.setLoadingState(true);
            
            // Load API keys from server
            const apiKeys = await api.getApiKeys();
            
            // Update the display
            this.updateApiKeys(apiKeys);
            
            console.log(`Loaded ${apiKeys.length} API keys`);
            
        } catch (error) {
            console.error('Failed to load API keys:', error);
            this.showErrorState(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    updateApiKeys(apiKeys) {
        this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [];
        
        // Clear existing cards
        this.apiKeyCards = [];
        
        // Render API key cards
        this.apiKeyCards = ApiKeyCard.renderMultiple(this.apiKeys, this.container);
        
        // Update grid layout based on number of keys
        this.updateGridLayout();
    }
    
    updateGridLayout() {
        if (!this.container) return;
        
        const keyCount = this.apiKeys.length;
        
        // Remove all grid classes
        this.container.classList.remove('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
        
        // Add appropriate grid classes based on count
        if (keyCount === 0) {
            this.container.classList.add('grid-cols-1');
        } else if (keyCount === 1) {
            this.container.classList.add('grid-cols-1', 'md:grid-cols-1');
        } else if (keyCount === 2) {
            this.container.classList.add('grid-cols-1', 'md:grid-cols-2');
        } else if (keyCount === 3) {
            this.container.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
        } else {
            this.container.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
        }
    }
    
    setLoadingState(loading) {
        if (!this.container) return;
        
        if (loading) {
            ApiKeyCard.createLoadingSkeleton(this.container, 4);
        }
    }
    
    showErrorState(errorMessage) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i data-lucide="alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-slate-900 mb-2">Failed to Load API Keys</h3>
                <p class="text-slate-500 mb-4">${errorMessage}</p>
                <button class="btn btn-outline" onclick="window.apiKeysPage.refresh()">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    Try Again
                </button>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    // CRUD operations
    async createApiKey(keyData) {
        try {
            console.log('Creating new API key...', keyData);
            
            const newKey = await api.createApiKey(keyData);
            
            // Add to local array
            this.apiKeys.unshift(newKey);
            
            // Re-render the grid
            this.updateApiKeys(this.apiKeys);
            
            if (window.showToast) {
                window.showToast('API key created successfully', 'success');
            }
            
            return newKey;
        } catch (error) {
            console.error('Failed to create API key:', error);
            if (window.showToast) {
                window.showToast(`Failed to create API key: ${error.message}`, 'error');
            }
            throw error;
        }
    }
    
    async updateApiKey(keyId, updates) {
        try {
            console.log('Updating API key:', keyId, updates);
            
            const updatedKey = await api.updateApiKey(keyId, updates);
            
            // Update local array
            const index = this.apiKeys.findIndex(key => key.id === keyId);
            if (index !== -1) {
                this.apiKeys[index] = updatedKey;
            }
            
            // Update the corresponding card
            const cardIndex = this.apiKeyCards.findIndex(card => card.apiKey.id === keyId);
            if (cardIndex !== -1 && this.apiKeyCards[cardIndex]) {
                this.apiKeyCards[cardIndex].update(updatedKey);
            }
            
            if (window.showToast) {
                window.showToast('API key updated successfully', 'success');
            }
            
            return updatedKey;
        } catch (error) {
            console.error('Failed to update API key:', error);
            if (window.showToast) {
                window.showToast(`Failed to update API key: ${error.message}`, 'error');
            }
            throw error;
        }
    }
    
    async deleteApiKey(keyId) {
        try {
            // Show confirmation dialog
            const confirmed = await this.showDeleteConfirmation();
            if (!confirmed) return;
            
            console.log('Deleting API key:', keyId);
            
            await api.deleteApiKey(keyId);
            
            // Remove from local array
            this.apiKeys = this.apiKeys.filter(key => key.id !== keyId);
            
            // Re-render the grid
            this.updateApiKeys(this.apiKeys);
            
            if (window.showToast) {
                window.showToast('API key deleted successfully', 'success');
            }
            
        } catch (error) {
            console.error('Failed to delete API key:', error);
            if (window.showToast) {
                window.showToast(`Failed to delete API key: ${error.message}`, 'error');
            }
        }
    }
    
    async showDeleteConfirmation() {
        return new Promise((resolve) => {
            const result = confirm('Are you sure you want to delete this API key? This action cannot be undone.');
            resolve(result);
        });
    }
    
    // Refresh data
    async refresh() {
        console.log('Refreshing API keys...');
        await this.loadData();
    }
    
    // Search and filter
    filterKeys(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            this.updateApiKeys(this.apiKeys);
            return;
        }
        
        const term = searchTerm.toLowerCase();
        const filtered = this.apiKeys.filter(key => 
            key.name.toLowerCase().includes(term) ||
            (key.description && key.description.toLowerCase().includes(term))
        );
        
        this.updateApiKeys(filtered);
    }
    
    // Sort keys
    sortKeys(criteria = 'created_at', direction = 'desc') {
        const sorted = [...this.apiKeys].sort((a, b) => {
            let aValue = a[criteria];
            let bValue = b[criteria];
            
            // Handle different data types
            if (criteria === 'created_at' || criteria === 'last_used') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            } else if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = (bValue || '').toLowerCase();
            }
            
            if (direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        this.updateApiKeys(sorted);
    }
    
    // Get API key by ID
    getApiKey(keyId) {
        return this.apiKeys.find(key => key.id === keyId);
    }
    
    // Static method to create instance
    static async create() {
        const apiKeys = new ApiKeys();
        await apiKeys.init();
        return apiKeys;
    }
}

// Export for global use
window.ApiKeys = ApiKeys;

// Global instance
window.apiKeysPage = null;

// Initialize API Keys page
window.initializeApiKeys = async function() {
    if (!window.apiKeysPage) {
        window.apiKeysPage = await ApiKeys.create();
    }
    return window.apiKeysPage;
};

// Global functions for onclick handlers (referenced in HTML and components)
window.showCreateKeyModal = function() {
    console.log('Show create API key modal');
    if (window.showToast) {
        window.showToast('Create API key modal coming soon', 'info');
    }
};

window.editApiKey = function(keyId) {
    console.log('Edit API key:', keyId);
    if (window.showToast) {
        window.showToast('Edit API key modal coming soon', 'info');
    }
};

window.deleteApiKey = function(keyId) {
    if (window.apiKeysPage) {
        window.apiKeysPage.deleteApiKey(keyId);
    }
};

window.copyApiKey = function(keyId) {
    console.log('Copy API key:', keyId);
    // This is handled by the ApiKeyCard component
};