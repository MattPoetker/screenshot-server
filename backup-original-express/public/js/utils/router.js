// Simple SPA Router for Screenshot Dashboard
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        
        // Listen for popstate events (back/forward buttons)
        window.addEventListener('popstate', (e) => {
            this.handleRoute(window.location.pathname);
        });
    }
    
    // Register a route
    register(path, handler) {
        this.routes.set(path, handler);
    }
    
    // Navigate to a route
    navigate(path, pushState = true) {
        if (pushState) {
            history.pushState({ path }, '', path);
        }
        this.handleRoute(path);
    }
    
    // Handle route change
    handleRoute(path) {
        const handler = this.routes.get(path);
        
        if (handler) {
            this.currentRoute = path;
            handler();
        } else {
            // Default to dashboard if route not found
            this.navigate('/dashboard', false);
        }
    }
    
    // Initialize router
    init() {
        const currentPath = window.location.pathname;
        this.handleRoute(currentPath || '/dashboard');
    }
}

// Create global router instance
window.router = new Router();

// Export for use in other modules
window.Router = Router;