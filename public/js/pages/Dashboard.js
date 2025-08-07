// Dashboard Page Component

class Dashboard {
    constructor() {
        this.statsCards = [];
        this.recentActivity = null;
        this.usageChart = null;
        this.isLoaded = false;
    }
    
    async init() {
        if (this.isLoaded) return;
        
        console.log('Initializing Dashboard page...');
        
        // Initialize components
        this.initializeStatsCards();
        this.initializeRecentActivity();
        this.initializeUsageChart();
        
        // Load data
        await this.loadData();
        
        this.isLoaded = true;
        console.log('Dashboard page initialized successfully');
    }
    
    initializeStatsCards() {
        // Stats cards are already in the HTML, we just need to track them
        this.statsCards = {
            totalRequests: document.getElementById('total-requests'),
            activeKeys: document.getElementById('active-keys'),
            successRate: document.getElementById('success-rate'),
            avgTime: document.getElementById('avg-time')
        };
    }
    
    initializeRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (container) {
            this.recentActivity = new RecentActivity(container);
        }
    }
    
    initializeUsageChart() {
        const canvas = document.getElementById('usage-chart');
        if (canvas) {
            this.usageChart = new UsageChart('usage-chart');
        }
    }
    
    async loadData() {
        try {
            console.log('Loading dashboard data...');
            
            // Set loading states
            this.setLoadingState(true);
            
            // Load all data in parallel
            const [stats, activity, chartData] = await Promise.all([
                this.loadStats(),
                this.loadActivity(),
                this.loadChartData()
            ]);
            
            // Update components with loaded data
            this.updateStats(stats);
            this.updateActivity(activity);
            this.updateChart(chartData);
            
            console.log('Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showErrorState(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    async loadStats() {
        try {
            return await api.getDashboardStats();
        } catch (error) {
            console.warn('Failed to load stats, using defaults:', error.message);
            return {
                totalScreenshots: 0,
                activeApiKeys: 0,
                successRate: 100,
                avgProcessingTime: 0
            };
        }
    }
    
    async loadActivity() {
        try {
            return await api.getRecentActivity();
        } catch (error) {
            console.warn('Failed to load activity, using empty array:', error.message);
            return [];
        }
    }
    
    async loadChartData() {
        try {
            return await api.getUsageChart();
        } catch (error) {
            console.warn('Failed to load chart data, using empty array:', error.message);
            return [];
        }
    }
    
    updateStats(stats) {
        if (!stats) return;
        
        // Update each stat with animation
        if (this.statsCards.totalRequests) {
            this.animateStatValue(this.statsCards.totalRequests, stats.totalScreenshots || 0);
        }
        
        if (this.statsCards.activeKeys) {
            this.animateStatValue(this.statsCards.activeKeys, stats.activeApiKeys || 0);
        }
        
        if (this.statsCards.successRate) {
            this.animateStatValue(this.statsCards.successRate, `${Math.round(stats.successRate || 100)}%`);
        }
        
        if (this.statsCards.avgTime) {
            this.animateStatValue(this.statsCards.avgTime, `${Math.round(stats.avgProcessingTime || 0)}ms`);
        }
    }
    
    animateStatValue(element, newValue) {
        if (!element) return;
        
        const currentValue = element.textContent || '0';
        
        if (window.animations && window.animations.animateValue) {
            window.animations.animateValue(element, currentValue, newValue.toString());
        } else {
            element.textContent = newValue;
        }
    }
    
    updateActivity(activities) {
        if (this.recentActivity) {
            this.recentActivity.updateActivities(activities);
        }
    }
    
    updateChart(chartData) {
        if (this.usageChart && chartData) {
            this.usageChart.updateData(chartData);
        }
    }
    
    setLoadingState(loading) {
        // Stats loading
        Object.values(this.statsCards).forEach(card => {
            if (card) {
                if (loading) {
                    card.textContent = '-';
                    card.classList.add('animate-pulse');
                } else {
                    card.classList.remove('animate-pulse');
                }
            }
        });
        
        // Activity loading
        if (this.recentActivity) {
            this.recentActivity.setLoading(loading);
        }
        
        // Chart loading
        if (this.usageChart) {
            this.usageChart.setLoading(loading);
        }
    }
    
    showErrorState(errorMessage) {
        // Show error toast
        if (window.showToast) {
            window.showToast(`Dashboard error: ${errorMessage}`, 'error');
        }
        
        // Update stats to show error state
        Object.values(this.statsCards).forEach(card => {
            if (card) {
                card.textContent = 'Error';
                card.classList.add('text-red-500');
            }
        });
    }
    
    // Refresh data
    async refresh() {
        console.log('Refreshing dashboard data...');
        await this.loadData();
    }
    
    // Real-time updates (if WebSocket or polling is implemented)
    startRealTimeUpdates() {
        // Placeholder for real-time functionality
        console.log('Real-time updates not implemented yet');
    }
    
    stopRealTimeUpdates() {
        // Placeholder for stopping real-time updates
        console.log('Stopping real-time updates');
    }
    
    // Cleanup
    destroy() {
        if (this.usageChart) {
            this.usageChart.destroy();
        }
        this.stopRealTimeUpdates();
        this.isLoaded = false;
    }
    
    // Static method to create dashboard instance
    static async create() {
        const dashboard = new Dashboard();
        await dashboard.init();
        return dashboard;
    }
}

// Export for global use
window.Dashboard = Dashboard;

// Global dashboard instance
window.dashboard = null;

// Initialize dashboard when page is shown
window.initializeDashboard = async function() {
    if (!window.dashboard) {
        window.dashboard = await Dashboard.create();
    }
    return window.dashboard;
};

// Refresh dashboard data
window.refreshDashboard = async function() {
    if (window.dashboard) {
        await window.dashboard.refresh();
    }
};