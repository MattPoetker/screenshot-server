// Usage Chart Component for Dashboard

class UsageChart {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.canvasId = canvasId;
        this.chart = null;
        this.config = {
            type: 'line',
            responsive: true,
            maintainAspectRatio: false,
            ...config
        };
        
        this.init();
    }
    
    init() {
        if (!this.canvas) {
            console.error(`UsageChart: Canvas with ID '${this.canvasId}' not found`);
            return;
        }
        
        if (!window.Chart) {
            console.error('UsageChart: Chart.js library not found');
            return;
        }
        
        this.setupChart();
    }
    
    setupChart(data = null) {
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        const ctx = this.canvas.getContext('2d');
        
        // Default empty data
        const chartData = data || {
            labels: [],
            datasets: [{
                label: 'Requests',
                data: [],
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };
        
        this.chart = new Chart(ctx, {
            type: this.config.type,
            data: chartData,
            options: {
                responsive: this.config.responsive,
                maintainAspectRatio: this.config.maintainAspectRatio,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                return `Date: ${context[0].label}`;
                            },
                            label: (context) => {
                                const value = context.parsed.y;
                                return `Requests: ${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)'
                        },
                        ticks: {
                            color: 'rgb(100, 116, 139)',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)'
                        },
                        ticks: {
                            color: 'rgb(100, 116, 139)',
                            maxTicksLimit: 7
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    line: {
                        borderWidth: 2
                    },
                    point: {
                        borderWidth: 2,
                        backgroundColor: 'white'
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    updateData(chartData) {
        if (!this.chart || !chartData) return;
        
        // Process the data
        const processedData = this.processChartData(chartData);
        
        // Update chart data
        this.chart.data.labels = processedData.labels;
        this.chart.data.datasets[0].data = processedData.data;
        
        // Animate the update
        this.chart.update('active');
    }
    
    processChartData(rawData) {
        if (!Array.isArray(rawData)) {
            return { labels: [], data: [] };
        }
        
        const labels = rawData.map(item => {
            // Format date for display
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        });
        
        const data = rawData.map(item => item.requests || 0);
        
        return { labels, data };
    }
    
    setLoading(loading = true) {
        if (loading) {
            // Show loading skeleton
            this.setupChart({
                labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
                datasets: [{
                    label: 'Loading...',
                    data: Array.from({ length: 7 }, () => Math.random() * 100),
                    borderColor: 'rgba(226, 232, 240, 0.5)',
                    backgroundColor: 'rgba(226, 232, 240, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            });
            
            // Disable interactions
            if (this.chart) {
                this.chart.options.plugins.tooltip.enabled = false;
                this.chart.options.animation.duration = 0;
                this.chart.update();
            }
        } else {
            // Re-enable interactions
            if (this.chart) {
                this.chart.options.plugins.tooltip.enabled = true;
                this.chart.options.animation.duration = 1000;
            }
        }
    }
    
    addDataPoint(label, value) {
        if (!this.chart) return;
        
        this.chart.data.labels.push(label);
        this.chart.data.datasets[0].data.push(value);
        
        // Keep only last 30 points
        if (this.chart.data.labels.length > 30) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        
        this.chart.update();
    }
    
    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }
    
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
    
    // Create multiple chart types
    static createLineChart(canvasId, data = null) {
        return new UsageChart(canvasId, {
            type: 'line'
        });
    }
    
    static createBarChart(canvasId, data = null) {
        return new UsageChart(canvasId, {
            type: 'bar'
        });
    }
    
    static createDoughnutChart(canvasId, data = null) {
        return new UsageChart(canvasId, {
            type: 'doughnut',
            options: {
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Export for global use
window.UsageChart = UsageChart;

// Handle window resize
window.addEventListener('resize', () => {
    if (window.usageChart && window.usageChart.resize) {
        window.usageChart.resize();
    }
});