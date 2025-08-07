// Recent Activity Component for Dashboard

class RecentActivity {
    constructor(container) {
        this.container = container;
        this.activities = [];
        this.init();
    }
    
    init() {
        this.render();
    }
    
    render() {
        if (!this.container) return;
        
        if (this.activities.length === 0) {
            this.container.innerHTML = `
                <div class="text-center py-8">
                    <i data-lucide="activity" class="w-12 h-12 text-slate-400 mx-auto mb-4"></i>
                    <p class="text-slate-500">No recent activity</p>
                </div>
            `;
        } else {
            this.container.innerHTML = this.activities.map(activity => this.renderActivity(activity)).join('');
        }
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    renderActivity(activity) {
        const icon = this.getActivityIcon(activity);
        const statusIndicator = activity.success ? 
            '<div class="w-2 h-2 bg-green-500 rounded-full"></div>' :
            '<div class="w-2 h-2 bg-red-500 rounded-full"></div>';
        
        const timeAgo = this.getTimeAgo(activity.created_at);
        const fileSize = this.formatFileSize(activity.file_size);
        
        return `
            <div class="activity-item flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <i data-lucide="${icon}" class="w-5 h-5 text-white"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-slate-900 truncate" title="${activity.url}">
                        ${this.truncateUrl(activity.url)}
                    </p>
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                        <span class="uppercase font-medium">${activity.format}</span>
                        <span>•</span>
                        <span>${fileSize}</span>
                        <span>•</span>
                        <span>${timeAgo}</span>
                        ${activity.api_key_name ? `
                            <span>•</span>
                            <span class="font-medium">${activity.api_key_name}</span>
                        ` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${statusIndicator}
                    <button class="activity-actions p-1 rounded hover:bg-slate-100" onclick="window.recentActivity.showDetails('${activity.id}')">
                        <i data-lucide="more-horizontal" class="w-4 h-4 text-slate-400"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    getActivityIcon(activity) {
        if (activity.capture_type === 'scrolling-gif') {
            return 'film';
        }
        if (activity.format === 'pdf') {
            return 'file-text';
        }
        return 'camera';
    }
    
    truncateUrl(url, maxLength = 50) {
        if (!url || url.length <= maxLength) return url || 'Unknown URL';
        
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const path = urlObj.pathname;
            
            if (domain.length + path.length <= maxLength) {
                return domain + path;
            }
            
            if (domain.length >= maxLength - 3) {
                return domain.substring(0, maxLength - 3) + '...';
            }
            
            const remainingLength = maxLength - domain.length - 3;
            return domain + path.substring(0, remainingLength) + '...';
        } catch (e) {
            // Fallback for invalid URLs
            return url.substring(0, maxLength - 3) + '...';
        }
    }
    
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    getTimeAgo(dateString) {
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
    
    updateActivities(newActivities) {
        this.activities = Array.isArray(newActivities) ? newActivities : [];
        this.render();
        
        // Animate new items
        if (window.animations) {
            const items = this.container.querySelectorAll('.activity-item');
            window.animations.staggerAnimation(Array.from(items), 50);
        }
    }
    
    addActivity(activity) {
        this.activities.unshift(activity);
        // Keep only the latest 20 activities
        if (this.activities.length > 20) {
            this.activities = this.activities.slice(0, 20);
        }
        this.render();
    }
    
    setLoading(loading = true) {
        if (loading) {
            this.container.innerHTML = `
                <div class="space-y-3">
                    ${Array.from({ length: 5 }, () => `
                        <div class="flex items-center gap-3 p-3">
                            <div class="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                                <div class="h-3 bg-slate-200 rounded animate-pulse w-1/2"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    showDetails(activityId) {
        const activity = this.activities.find(a => a.id.toString() === activityId);
        if (!activity) return;
        
        // Show activity details modal or expand inline
        console.log('Show activity details:', activity);
        
        if (window.showToast) {
            const message = activity.success ? 
                `Successfully captured ${activity.format.toUpperCase()}` :
                `Failed: ${activity.error_message || 'Unknown error'}`;
            window.showToast(message, activity.success ? 'success' : 'error');
        }
    }
    
    // Static method to create and manage recent activity
    static create(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`RecentActivity: Container with ID '${containerId}' not found`);
            return null;
        }
        
        return new RecentActivity(container);
    }
}

// Export for global use
window.RecentActivity = RecentActivity;