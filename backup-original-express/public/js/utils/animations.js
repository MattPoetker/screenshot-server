// Animation utilities for the Screenshot Dashboard

// Intersection Observer for scroll animations
const observeElements = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe all elements with animation classes
    document.querySelectorAll('.stats-card, .card').forEach(el => {
        observer.observe(el);
    });
};

// Number counter animation
const animateValue = (element, start, end, duration = 2000) => {
    const startNum = parseFloat(start) || 0;
    const endNum = parseFloat(end) || 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        const current = startNum + (endNum - startNum) * easedProgress;
        
        // Format the number appropriately
        if (end.includes('%')) {
            element.textContent = Math.round(current) + '%';
        } else if (end.includes('ms')) {
            element.textContent = Math.round(current) + 'ms';
        } else if (end.includes('K') || end.includes('M')) {
            element.textContent = formatNumber(Math.round(current));
        } else {
            element.textContent = Math.round(current).toString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
};

// Format number with K, M suffixes
const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

// Stagger animation for multiple elements
const staggerAnimation = (elements, delay = 100) => {
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('animate-in');
        }, index * delay);
    });
};

// Fade in animation
const fadeIn = (element, duration = 300) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    setTimeout(() => {
        element.style.opacity = '1';
    }, 10);
};

// Slide in from bottom animation
const slideInUp = (element, duration = 400) => {
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    
    setTimeout(() => {
        element.style.transform = 'translateY(0)';
        element.style.opacity = '1';
    }, 10);
};

// Pulse animation for status indicators
const pulse = (element, color = '#10b981') => {
    element.style.animation = 'none';
    element.style.backgroundColor = color;
    
    setTimeout(() => {
        element.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
    }, 10);
};

// Loading skeleton animation
const createSkeleton = (element) => {
    element.classList.add('animate-pulse');
    element.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
    element.style.backgroundSize = '200% 100%';
    element.style.animation = 'shimmer 1.5s infinite';
};

const removeSkeleton = (element) => {
    element.classList.remove('animate-pulse');
    element.style.background = '';
    element.style.backgroundSize = '';
    element.style.animation = '';
};

// Page transition animation
const pageTransition = (fromPage, toPage) => {
    if (fromPage) {
        fromPage.style.animation = 'fadeOut 0.2s ease-in-out forwards';
        
        setTimeout(() => {
            fromPage.classList.remove('active');
            fromPage.style.animation = '';
        }, 200);
    }
    
    setTimeout(() => {
        toPage.classList.add('active');
        toPage.style.animation = 'fadeIn 0.3s ease-in-out forwards';
        
        setTimeout(() => {
            toPage.style.animation = '';
        }, 300);
    }, fromPage ? 200 : 0);
};

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .animate-in {
            animation: slideInUp 0.6s ease-out forwards;
        }
        
        .animate-in:nth-child(1) { animation-delay: 0.1s; }
        .animate-in:nth-child(2) { animation-delay: 0.2s; }
        .animate-in:nth-child(3) { animation-delay: 0.3s; }
        .animate-in:nth-child(4) { animation-delay: 0.4s; }
    `;
    document.head.appendChild(style);
    
    // Initialize intersection observer
    observeElements();
});

// Export functions
window.animations = {
    observeElements,
    animateValue,
    formatNumber,
    staggerAnimation,
    fadeIn,
    slideInUp,
    pulse,
    createSkeleton,
    removeSkeleton,
    pageTransition
};