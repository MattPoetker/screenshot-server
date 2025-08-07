// Analytics Page Component

class Analytics {
    constructor() {
        this.trendsChart = null;
        this.formatChart = null;
        this.data = null;
        this.isLoaded = false;
    }
    
    async init() {
        if (this.isLoaded) return;
        
        console.log('Initializing Analytics page...');
        
        // Initialize charts
        this.initializeCharts();
        
        // Load analytics data
        await this.loadData();
        
        this.isLoaded = true;
        console.log('Analytics page initialized successfully');
    }
    
    initializeCharts() {
        // Initialize trends chart (line chart)
        const trendsCanvas = document.getElementById('trends-chart');
        if (trendsCanvas && window.Chart) {
            this.trendsChart = new Chart(trendsCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Total Requests',
                        data: [],
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Successful Requests',
                        data: [],
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(226, 232, 240, 0.5)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(226, 232, 240, 0.5)'
                            }
                        }
                    }
                }
            });
        }
        
        // Initialize format chart (doughnut chart)
        const formatCanvas = document.getElementById('format-chart');
        if (formatCanvas && window.Chart) {
            this.formatChart = new Chart(formatCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            'rgb(99, 102, 241)',   // Indigo
                            'rgb(34, 197, 94)',    // Green
                            'rgb(251, 191, 36)',   // Yellow
                            'rgb(239, 68, 68)',    // Red
                            'rgb(168, 85, 247)',   // Purple
                            'rgb(59, 130, 246)',   // Blue
                        ],
                        borderWidth: 2,
                        borderColor: 'white'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
    }
    
    async loadData() {
        try {
            console.log('Loading analytics data...');
            
            // Set loading states
            this.setLoadingState(true);
            
            // Load analytics data
            const data = await api.getAnalytics();
            this.data = data;
            
            // Update charts
            this.updateTrendsChart(data.usage_stats || []);
            this.updateFormatChart(data.format_distribution || []);
            
            console.log('Analytics data loaded successfully');
            
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showErrorState(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    updateTrendsChart(usageStats) {
        if (!this.trendsChart || !Array.isArray(usageStats)) return;
        
        const labels = usageStats.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const totalRequests = usageStats.map(item => item.total_requests || 0);
        const successfulRequests = usageStats.map(item => item.successful_requests || 0);
        
        this.trendsChart.data.labels = labels;
        this.trendsChart.data.datasets[0].data = totalRequests;
        this.trendsChart.data.datasets[1].data = successfulRequests;
        
        this.trendsChart.update('active');
    }
    
    updateFormatChart(formatDistribution) {
        if (!this.formatChart || !Array.isArray(formatDistribution)) return;
        
        const labels = formatDistribution.map(item => item.format.toUpperCase());
        const data = formatDistribution.map(item => item.count || 0);
        
        this.formatChart.data.labels = labels;
        this.formatChart.data.datasets[0].data = data;
        
        this.formatChart.update('active');
    }
    
    setLoadingState(loading) {
        if (loading) {
            // Show loading skeletons for charts
            if (this.trendsChart) {
                this.trendsChart.data.labels = Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`);
                this.trendsChart.data.datasets[0].data = Array.from({ length: 7 }, () => Math.random() * 100);
                this.trendsChart.data.datasets[1].data = Array.from({ length: 7 }, () => Math.random() * 80);
                this.trendsChart.options.animation.duration = 0;
                this.trendsChart.update();
            }
            
            if (this.formatChart) {
                this.formatChart.data.labels = ['Loading...'];
                this.formatChart.data.datasets[0].data = [100];
                this.formatChart.data.datasets[0].backgroundColor = ['rgba(226, 232, 240, 0.5)'];
                this.formatChart.options.animation.duration = 0;
                this.formatChart.update();
            }
        } else {
            // Re-enable animations
            if (this.trendsChart) {
                this.trendsChart.options.animation.duration = 1000;
            }
            if (this.formatChart) {
                this.formatChart.options.animation.duration = 1000;
                this.formatChart.data.datasets[0].backgroundColor = [
                    'rgb(99, 102, 241)', 'rgb(34, 197, 94)', 'rgb(251, 191, 36)',
                    'rgb(239, 68, 68)', 'rgb(168, 85, 247)', 'rgb(59, 130, 246)'
                ];
            }
        }
    }
    
    showErrorState(errorMessage) {
        console.error('Analytics error:', errorMessage);
        
        if (window.showToast) {
            window.showToast(`Analytics error: ${errorMessage}`, 'error');
        }
        
        // Show error message on charts
        if (this.trendsChart) {
            this.trendsChart.data.labels = ['Error'];
            this.trendsChart.data.datasets[0].data = [0];
            this.trendsChart.data.datasets[1].data = [0];
            this.trendsChart.update();
        }
        
        if (this.formatChart) {
            this.formatChart.data.labels = ['No Data'];
            this.formatChart.data.datasets[0].data = [1];
            this.formatChart.data.datasets[0].backgroundColor = ['rgba(239, 68, 68, 0.5)'];
            this.formatChart.update();
        }
    }
    
    // Filter data by date range
    async filterByDateRange(days = 30) {
        try {
            console.log(`Loading analytics for ${days} days...`);
            
            const data = await api.getAnalytics(days);
            this.data = data;
            
            this.updateTrendsChart(data.usage_stats || []);
            this.updateFormatChart(data.format_distribution || []);
            
        } catch (error) {
            console.error('Failed to filter analytics:', error);
            if (window.showToast) {
                window.showToast(`Failed to load analytics: ${error.message}`, 'error');
            }
        }
    }
    
    // Export analytics data
    exportData(format = 'json') {
        if (!this.data) {
            if (window.showToast) {
                window.showToast('No data to export', 'warning');
            }
            return;
        }
        
        const filename = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        
        if (format === 'json') {
            this.downloadJSON(this.data, filename);
        } else if (format === 'csv') {
            this.downloadCSV(this.data, filename);
        }
    }
    
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }
    
    downloadCSV(data, filename) {
        // Convert usage stats to CSV
        let csv = 'Date,Total Requests,Successful Requests,Success Rate,Avg Processing Time\n';
        
        if (data.usage_stats) {
            data.usage_stats.forEach(row => {
                const successRate = row.total_requests > 0 ? 
                    ((row.successful_requests / row.total_requests) * 100).toFixed(2) : '0';
                csv += `${row.date},${row.total_requests || 0},${row.successful_requests || 0},${successRate}%,${Math.round(row.avg_processing_time || 0)}ms\n`;
            });
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, filename);
    }
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.showToast) {
            window.showToast(`Downloaded ${filename}`, 'success');
        }
    }
    
    // Refresh data
    async refresh() {
        console.log('Refreshing analytics...');
        await this.loadData();
    }
    
    // Resize charts (useful for responsive design)
    resize() {
        if (this.trendsChart) {
            this.trendsChart.resize();
        }
        if (this.formatChart) {
            this.formatChart.resize();
        }
    }
    
    // Cleanup
    destroy() {
        if (this.trendsChart) {
            this.trendsChart.destroy();
            this.trendsChart = null;
        }
        if (this.formatChart) {
            this.formatChart.destroy();
            this.formatChart = null;
        }
        this.isLoaded = false;
    }
    
    // Static method
    static async create() {
        const analytics = new Analytics();
        await analytics.init();
        return analytics;
    }
}

// Export for global use
window.Analytics = Analytics;

// Global instance
window.analyticsPage = null;

// Initialize Analytics page
window.initializeAnalytics = async function() {
    if (!window.analyticsPage) {
        window.analyticsPage = await Analytics.create();
    }
    return window.analyticsPage;
};

// Handle window resize
window.addEventListener('resize', () => {
    if (window.analyticsPage && window.analyticsPage.resize) {
        window.analyticsPage.resize();
    }
});

// Global functions for analytics controls
window.filterAnalytics = function(days) {
    if (window.analyticsPage) {
        window.analyticsPage.filterByDateRange(parseInt(days));
    }
};

window.exportAnalytics = function(format = 'json') {
    if (window.analyticsPage) {
        window.analyticsPage.exportData(format);
    } else {
        if (window.showToast) {
            window.showToast('Analytics not loaded yet', 'warning');
        }
    }
};