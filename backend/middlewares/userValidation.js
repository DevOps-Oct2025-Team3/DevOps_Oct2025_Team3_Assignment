const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {  
        if (err) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Check user role for authorization
        const authorizedRoles = {
            // Everyone
            "GET /login": ["Admin", "User"],
            "GET /logout": ["Admin", "User"],

            // Admin
            // Only admins can view users
            "GET /admin": ["Admin"],             
            // Only admins can create users
            "POST /admin/create_user": ["Admin"], 
            // Only admins can delete users
            "DELETE /admin/delete_user/[0-9]+": ["Admin"], 

            // User
        };

        const requestedEndpoint = `${req.method} ${req.url}`; // Include method in endpoint;
        const userRole = decoded.role;

        const authorizedRole = Object.entries(authorizedRoles).find(
            ([endpoint, roles]) => {
                const regex = new RegExp(`^${endpoint}$`); // Create RegExp from endpoint
                return regex.test(requestedEndpoint) && roles.includes(userRole);
            }
        );

        if (!authorizedRole) {
        return res.status(403).json({ message: "Forbidden" });
        }

        req.user = decoded; // Attach decoded user information to the request object
        next();
    });
}

module.exports = {
    verifyJWT,
};