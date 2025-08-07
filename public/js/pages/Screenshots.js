// Screenshots Page Component

class Screenshots {
    constructor() {
        this.screenshots = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {};
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.container = null;
        this.isLoaded = false;
    }
    
    async init() {
        if (this.isLoaded) return;
        
        console.log('Initializing Screenshots page...');
        
        this.container = document.getElementById('screenshots-grid');
        if (!this.container) {
            console.error('Screenshots container not found');
            return;
        }
        
        // Load screenshots data
        await this.loadData();
        
        this.isLoaded = true;
        console.log('Screenshots page initialized successfully');
    }
    
    async loadData(page = 1) {
        try {
            console.log('Loading screenshots...', { page, filters: this.filters });
            
            // Show loading state
            this.setLoadingState(true);
            
            // Load screenshots from server
            const response = await api.getScreenshots(this.filters, page);
            
            this.screenshots = response.screenshots || [];
            this.currentPage = response.pagination?.page || 1;
            this.totalPages = response.pagination?.pages || 1;
            
            // Update the display
            this.renderScreenshots();
            this.updatePagination();
            
            console.log(`Loaded ${this.screenshots.length} screenshots`);
            
        } catch (error) {
            console.error('Failed to load screenshots:', error);
            this.showErrorState(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    renderScreenshots() {
        if (!this.container) return;
        
        if (this.screenshots.length === 0) {
            this.showEmptyState();
            return;
        }
        
        const screenshotsHTML = this.screenshots.map(screenshot => 
            this.renderScreenshot(screenshot)
        ).join('');
        
        this.container.innerHTML = screenshotsHTML;
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Apply view mode
        this.applyViewMode();
    }
    
    renderScreenshot(screenshot) {
        const statusBadge = screenshot.success ? 
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Success</span>' :
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>';
        
        const formatBadge = `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">${screenshot.format.toUpperCase()}</span>`;
        
        const captureTypeBadge = screenshot.capture_type === 'scrolling-gif' ?
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">GIF</span>' :
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Screenshot</span>';
        
        return `
            <div class="screenshot-card card" data-screenshot-id="${screenshot.id}">
                <div class="card-content">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1 min-w-0">
                            <h3 class="font-medium text-slate-900 truncate mb-1" title="${screenshot.url}">
                                ${this.truncateUrl(screenshot.url)}
                            </h3>
                            <div class="flex items-center gap-2 flex-wrap">
                                ${statusBadge}
                                ${formatBadge}
                                ${captureTypeBadge}
                            </div>
                        </div>
                        <div class="flex items-center gap-1 ml-2">
                            <button class="p-1 rounded hover:bg-slate-100" onclick="window.screenshotsPage.viewScreenshot('${screenshot.id}')">
                                <i data-lucide="eye" class="w-4 h-4 text-slate-400"></i>
                            </button>
                            <button class="p-1 rounded hover:bg-slate-100" onclick="window.screenshotsPage.downloadScreenshot('${screenshot.id}')">
                                <i data-lucide="download" class="w-4 h-4 text-slate-400"></i>
                            </button>
                            <button class="p-1 rounded hover:bg-red-100" onclick="window.screenshotsPage.deleteScreenshot('${screenshot.id}')">
                                <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                            <span class="text-slate-500">Size:</span>
                            <span class="text-slate-900">${screenshot.width}x${screenshot.height}</span>
                        </div>
                        <div>
                            <span class="text-slate-500">File Size:</span>
                            <span class="text-slate-900">${this.formatFileSize(screenshot.file_size)}</span>
                        </div>
                        <div>
                            <span class="text-slate-500">API Key:</span>
                            <span class="text-slate-900">${screenshot.api_key_name || 'Unknown'}</span>
                        </div>
                        <div>
                            <span class="text-slate-500">Created:</span>
                            <span class="text-slate-900">${this.formatRelativeTime(screenshot.created_at)}</span>
                        </div>
                    </div>
                    
                    ${!screenshot.success && screenshot.error_message ? `
                        <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Error:</strong> ${screenshot.error_message}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    showEmptyState() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i data-lucide="image" class="w-12 h-12 text-slate-400 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-slate-900 mb-2">No Screenshots Found</h3>
                <p class="text-slate-500">Try adjusting your filters or create a new screenshot</p>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    setLoadingState(loading) {
        if (!this.container) return;
        
        if (loading) {
            const skeletonHTML = Array.from({ length: 8 }, () => `
                <div class="card">
                    <div class="card-content">
                        <div class="space-y-3">
                            <div class="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                            <div class="flex gap-2">
                                <div class="h-5 bg-slate-200 rounded animate-pulse w-16"></div>
                                <div class="h-5 bg-slate-200 rounded animate-pulse w-12"></div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="h-3 bg-slate-200 rounded animate-pulse"></div>
                                <div class="h-3 bg-slate-200 rounded animate-pulse"></div>
                                <div class="h-3 bg-slate-200 rounded animate-pulse"></div>
                                <div class="h-3 bg-slate-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            this.container.innerHTML = skeletonHTML;
        }
    }
    
    showErrorState(errorMessage) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i data-lucide="alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-slate-900 mb-2">Failed to Load Screenshots</h3>
                <p class="text-slate-500 mb-4">${errorMessage}</p>
                <button class="btn btn-outline" onclick="window.screenshotsPage.refresh()">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    Try Again
                </button>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    updatePagination() {
        // TODO: Implement pagination UI
        console.log('Pagination:', {
            current: this.currentPage,
            total: this.totalPages
        });
    }
    
    applyViewMode() {
        if (!this.container) return;
        
        // Remove existing view mode classes
        this.container.classList.remove('grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 
                                        'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
                                        'lg:grid-cols-3', 'lg:grid-cols-4',
                                        'xl:grid-cols-4');
        
        if (this.viewMode === 'list') {
            this.container.classList.add('grid-cols-1');
        } else {
            this.container.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
        }
    }
    
    // Actions
    viewScreenshot(screenshotId) {
        const screenshot = this.screenshots.find(s => s.id.toString() === screenshotId);
        if (!screenshot) return;
        
        console.log('View screenshot:', screenshot);
        
        // TODO: Show screenshot modal or navigate to view
        if (window.showToast) {
            window.showToast('Screenshot viewer coming soon', 'info');
        }
    }
    
    downloadScreenshot(screenshotId) {
        const screenshot = this.screenshots.find(s => s.id.toString() === screenshotId);
        if (!screenshot || !screenshot.file_path) return;
        
        console.log('Download screenshot:', screenshot);
        
        // TODO: Implement download functionality
        if (window.showToast) {
            window.showToast('Download functionality coming soon', 'info');
        }
    }
    
    async deleteScreenshot(screenshotId) {
        const confirmed = confirm('Are you sure you want to delete this screenshot?');
        if (!confirmed) return;
        
        try {
            await api.deleteScreenshot(screenshotId);
            
            // Remove from local array
            this.screenshots = this.screenshots.filter(s => s.id.toString() !== screenshotId);
            
            // Re-render
            this.renderScreenshots();
            
            if (window.showToast) {
                window.showToast('Screenshot deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to delete screenshot:', error);
            if (window.showToast) {
                window.showToast(`Failed to delete screenshot: ${error.message}`, 'error');
            }
        }
    }
    
    // Filtering and pagination
    setFilters(filters) {
        this.filters = { ...filters };
        this.currentPage = 1;
        this.loadData(1);
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.loadData(this.currentPage + 1);
        }
    }
    
    prevPage() {
        if (this.currentPage > 1) {
            this.loadData(this.currentPage - 1);
        }
    }
    
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.loadData(page);
        }
    }
    
    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        this.applyViewMode();
        
        // Update toggle button
        const toggleBtn = document.querySelector('[onclick="toggleView()"]');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', this.viewMode === 'grid' ? 'list' : 'grid');
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }
        }
    }
    
    // Refresh data
    async refresh() {
        console.log('Refreshing screenshots...');
        await this.loadData(this.currentPage);
    }
    
    // Utility methods
    truncateUrl(url, maxLength = 40) {
        if (!url || url.length <= maxLength) return url || 'Unknown URL';
        
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + (urlObj.pathname !== '/' ? '...' : '');
        } catch (e) {
            return url.substring(0, maxLength - 3) + '...';
        }
    }
    
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    formatRelativeTime(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }
    
    // Static method
    static async create() {
        const screenshots = new Screenshots();
        await screenshots.init();
        return screenshots;
    }
}

// Export for global use
window.Screenshots = Screenshots;

// Global instance
window.screenshotsPage = null;

// Initialize Screenshots page
window.initializeScreenshots = async function() {
    if (!window.screenshotsPage) {
        window.screenshotsPage = await Screenshots.create();
    }
    return window.screenshotsPage;
};

// Global functions for onclick handlers
window.showFilters = function() {
    console.log('Show filters modal');
    if (window.showToast) {
        window.showToast('Filters coming soon', 'info');
    }
};

window.toggleView = function() {
    if (window.screenshotsPage) {
        window.screenshotsPage.toggleViewMode();
    }
};