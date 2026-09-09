// Middleware Autentikasi & Authorization (RBAC)

function checkAuth(req, res, next) {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/auth/login');
}

function checkRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
        
        const userRole = req.session.user.role_name;
        if (allowedRoles.includes(userRole) || userRole === 'Admin') {
            return next();
        }
        
        res.status(403).render('errors/403', {
            title: '403 Akses Ditolak',
            message: 'Anda tidak memiliki hak akses untuk membuka halaman ini.'
        });
    };
}

module.exports = {
    checkAuth,
    checkRole
};
