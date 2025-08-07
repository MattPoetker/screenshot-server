// Stats Card Component for Dashboard

class StatsCard {
    constructor(element, config = {}) {
        this.element = element;
        this.config = {
            title: config.title || 'Stat',
            value: config.value || '0',
            trend: config.trend || null,
            icon: config.icon || 'bar-chart',
            color: config.color || 'indigo',
            animated: config.animated !== false,
            ...config
        };
        
        this.currentValue = 0;
        this.init();
    }
    
    init() {
        this.render();
        if (this.config.animated) {
            this.animate();
        }
    }
    
    render() {
        const { title, value, trend, icon, color } = this.config;
        
        const trendHTML = trend ? `
            <div class="stats-card-trend ${trend.direction}">
                <i data-lucide="trending-${trend.direction === 'positive' ? 'up' : 'down'}" class="w-3 h-3"></i>
                <span>${trend.value}</span>
            </div>
        ` : '';
        
        this.element.innerHTML = `
            <div class="stats-card-icon bg-${color}-100 text-${color}-600">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
            </div>
            <div class="stats-card-content">
                <h3 class="stats-card-title">${title}</h3>
                <div class="stats-card-value" data-value="${value}">0</div>
                ${trendHTML}
            </div>
        `;
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    animate() {
        const valueElement = this.element.querySelector('.stats-card-value');
        const targetValue = this.config.value;
        
        if (valueElement && window.animations) {
            window.animations.animateValue(valueElement, '0', targetValue.toString());
        }
    }
    
    updateValue(newValue, animate = true) {
        this.config.value = newValue;
        const valueElement = this.element.querySelector('.stats-card-value');
        
        if (valueElement) {
            if (animate && window.animations) {
                const currentValue = valueElement.textContent;
                window.animations.animateValue(valueElement, currentValue, newValue.toString());
            } else {
                valueElement.textContent = newValue;
            }
        }
    }
    
    updateTrend(trendData) {
        this.config.trend = trendData;
        const trendElement = this.element.querySelector('.stats-card-trend');
        
        if (trendElement && trendData) {
            trendElement.innerHTML = `
                <i data-lucide="trending-${trendData.direction === 'positive' ? 'up' : 'down'}" class="w-3 h-3"></i>
                <span>${trendData.value}</span>
            `;
            trendElement.className = `stats-card-trend ${trendData.direction}`;
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }
    
    setLoading(loading = true) {
        const valueElement = this.element.querySelector('.stats-card-value');
        
        if (loading) {
            if (window.animations) {
                window.animations.createSkeleton(valueElement);
            }
        } else {
            if (window.animations) {
                window.animations.removeSkeleton(valueElement);
            }
        }
    }
    
    // Static method to create multiple stats cards
    static createMultiple(container, statsData) {
        if (!container || !Array.isArray(statsData)) return [];
        
        const cards = statsData.map(data => {
            const cardElement = document.createElement('div');
            cardElement.className = 'stats-card';
            container.appendChild(cardElement);
            
            return new StatsCard(cardElement, data);
        });
        
        // Stagger the animations
        if (window.animations) {
            const cardElements = container.querySelectorAll('.stats-card');
            window.animations.staggerAnimation(Array.from(cardElements), 100);
        }
        
        return cards;
    }
    
    // Static method to update all stats cards
    static updateAll(cards, newData) {
        if (!Array.isArray(cards) || !Array.isArray(newData)) return;
        
        cards.forEach((card, index) => {
            if (newData[index]) {
                if (newData[index].value !== undefined) {
                    card.updateValue(newData[index].value);
                }
                if (newData[index].trend) {
                    card.updateTrend(newData[index].trend);
                }
            }
        });
    }
}

// Export for global use
window.StatsCard = StatsCard;