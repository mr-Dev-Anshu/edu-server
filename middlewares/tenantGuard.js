export const tenantGuard = (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        return res.status(403).json({ message: 'Tenant ID missing in headers' });
    }
    req.tenantId = tenantId;
    next();
};