// API Key Card Component

class ApiKeyCard {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.element = null;
    }
    
    render() {
        const element = document.createElement('div');
        element.className = 'card';
        element.innerHTML = this.getCardHTML();
        
        this.element = element;
        this.attachEventListeners();
        
        return element;
    }
    
    getCardHTML() {
        const { apiKey } = this;
        const statusIndicator = apiKey.is_active ? 
            '<div class="w-2 h-2 bg-green-500 rounded-full"></div>' :
            '<div class="w-2 h-2 bg-red-500 rounded-full"></div>';
        
        const lastUsed = apiKey.last_used ? 
            this.formatRelativeTime(apiKey.last_used) : 
            'Never';
        
        return `
            <div class="card-content">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-slate-900 mb-1">${this.escapeHtml(apiKey.name)}</h3>
                        <p class="text-sm text-slate-500 line-clamp-2">${this.escapeHtml(apiKey.description || 'No description')}</p>
                    </div>
                    <div class="flex items-center gap-2 ml-3">
                        ${statusIndicator}
                        <span class="text-xs text-slate-500 font-medium">${apiKey.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
                
                <div class="space-y-3 mb-4">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Created</span>
                        <span class="text-slate-900">${this.formatDateTime(apiKey.created_at)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Rate Limit</span>
                        <span class="text-slate-900">${apiKey.rate_limit}/hour</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Last Used</span>
                        <span class="text-slate-900">${lastUsed}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">Total Requests</span>
                        <span class="text-slate-900 font-medium">${(apiKey.total_requests || 0).toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="pt-3 border-t border-slate-100">
                    <div class="flex gap-2">
                        <button class="btn-copy btn btn-outline flex-1" data-key-id="${apiKey.key_id}">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                            Copy Key
                        </button>
                        <button class="btn-edit btn btn-outline" data-api-key-id="${apiKey.id}">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button class="btn-delete btn btn-outline text-red-600" data-api-key-id="${apiKey.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        if (!this.element) return;
        
        // Copy button
        const copyBtn = this.element.querySelector('.btn-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyApiKey());
        }
        
        // Edit button
        const editBtn = this.element.querySelector('.btn-edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editApiKey());
        }
        
        // Delete button
        const deleteBtn = this.element.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteApiKey());
        }
    }
    
    async copyApiKey() {
        const keyToCopy = this.apiKey.key_id;
        
        try {
            await navigator.clipboard.writeText(keyToCopy);
            this.showCopySuccess();
            
            if (window.showToast) {
                window.showToast('API key copied to clipboard', 'success');
            }
        } catch (err) {
            // Fallback for older browsers
            this.fallbackCopy(keyToCopy);
        }
    }
    
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess();
            if (window.showToast) {
                window.showToast('API key copied to clipboard', 'success');
            }
        } catch (err) {
            if (window.showToast) {
                window.showToast('Failed to copy API key', 'error');
            }
        }
        
        document.body.removeChild(textArea);
    }
    
    showCopySuccess() {
        const copyBtn = this.element.querySelector('.btn-copy');
        if (copyBtn) {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Copied!';
            copyBtn.disabled = true;
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.disabled = false;
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }, 2000);
        }
    }
    
    editApiKey() {
        if (window.editApiKey) {
            window.editApiKey(this.apiKey.id);
        } else {
            console.log('Edit API key:', this.apiKey.id);
            if (window.showToast) {
                window.showToast('Edit functionality coming soon', 'info');
            }
        }
    }
    
    deleteApiKey() {
        if (window.deleteApiKey) {
            window.deleteApiKey(this.apiKey.id);
        } else {
            console.log('Delete API key:', this.apiKey.id);
            if (window.showToast) {
                window.showToast('Delete functionality coming soon', 'info');
            }
        }
    }
    
    update(updatedApiKey) {
        this.apiKey = { ...this.apiKey, ...updatedApiKey };
        if (this.element) {
            const newElement = this.render();
            this.element.replaceWith(newElement);
        }
    }
    
    // Utility methods
    formatDateTime(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    formatRelativeTime(dateString) {
        if (!dateString) return 'Never';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Static methods
    static renderMultiple(apiKeys, container) {
        if (!container || !Array.isArray(apiKeys)) return [];
        
        container.innerHTML = '';
        
        if (apiKeys.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="key" class="w-12 h-12 text-slate-400 mx-auto mb-4"></i>
                    <h3 class="text-lg font-medium text-slate-900 mb-2">No API Keys</h3>
                    <p class="text-slate-500 mb-4">Create your first API key to get started</p>
                    <button class="btn btn-primary" onclick="showCreateKeyModal()">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        Create API Key
                    </button>
                </div>
            `;
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
            return [];
        }
        
        const cards = apiKeys.map(apiKey => {
            const card = new ApiKeyCard(apiKey);
            const element = card.render();
            container.appendChild(element);
            return card;
        });
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        return cards;
    }
    
    static createLoadingSkeleton(container, count = 4) {
        if (!container) return;
        
        const skeletonHTML = Array.from({ length: count }, () => `
            <div class="card">
                <div class="card-content">
                    <div class="flex justify-between mb-4">
                        <div class="space-y-2">
                            <div class="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                            <div class="h-3 bg-slate-200 rounded animate-pulse w-32"></div>
                        </div>
                        <div class="h-4 bg-slate-200 rounded animate-pulse w-12"></div>
                    </div>
                    <div class="space-y-3 mb-4">
                        <div class="flex justify-between">
                            <div class="h-3 bg-slate-200 rounded animate-pulse w-16"></div>
                            <div class="h-3 bg-slate-200 rounded animate-pulse w-20"></div>
                        </div>
                        <div class="flex justify-between">
                            <div class="h-3 bg-slate-200 rounded animate-pulse w-20"></div>
                            <div class="h-3 bg-slate-200 rounded animate-pulse w-16"></div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <div class="h-8 bg-slate-200 rounded animate-pulse flex-1"></div>
                        <div class="h-8 bg-slate-200 rounded animate-pulse w-8"></div>
                        <div class="h-8 bg-slate-200 rounded animate-pulse w-8"></div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = skeletonHTML;
    }
}

// Export for global use
window.ApiKeyCard = ApiKeyCard;