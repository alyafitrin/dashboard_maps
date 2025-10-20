// auth.js - Extended authentication functions dengan fitur tambahan

const Auth = {
    // Check if user has permission
    hasPermission(permission) {
        const user = JSON.parse(localStorage.getItem('userData'));
        if (!user) return false;
        
        const permissions = {
            'region': ['admin', 'view_all', 'export_data', 'manage_users', 'edit_data'],
            'cabang': ['view_limited', 'view_branches', 'view_reports']
        };
        
        return permissions[user.role]?.includes(permission) || false;
    },
    
    // Get current user
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('userData'));
    },
    
    // Check if user is region
    isRegion() {
        const user = this.getCurrentUser();
        return user && user.role === 'region';
    },
    
    // Check if user is cabang
    isCabang() {
        const user = this.getCurrentUser();
        return user && user.role === 'cabang';
    },
    
    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.getCurrentUser()) {
            window.location.href = 'login.html';
        }
    },
    
    // Get user permissions list
    getUserPermissions() {
        const user = this.getCurrentUser();
        if (!user) return [];
        
        const permissions = {
            'region': ['admin', 'view_all', 'export_data', 'manage_users', 'edit_data'],
            'cabang': ['view_limited', 'view_branches', 'view_reports']
        };
        
        return permissions[user.role] || [];
    },
    
    // Check if route is accessible
    canAccess(route) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const routePermissions = {
            '/admin': ['region'],
            '/admin/users': ['region'],
            '/reports': ['region', 'cabang'],
            '/dashboard': ['region', 'cabang']
        };
        
        return routePermissions[route]?.includes(user.role) || false;
    }
};

// Export untuk penggunaan modul
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}