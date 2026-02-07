const Joi = require("joi");
const jwt = require("jsonwebtoken");

const userSchema = Joi.object({
  username: Joi.string().min(1).max(50).required().messages({
    "string.base": "Username must be a string",
    "string.empty": "Username cannot be empty",
    "string.min": "Username must be at least 1 character long",
    "string.max": "Username cannot exceed 50 characters",
    "any.required": "Username is required",
  }),
  password: Joi.string().min(8).max(255).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 255 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("Admin", "User").required().messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either 'Admin' or 'User'",
    "any.required": "Role is required",
  }),
});

function validateUser(req, res, next) {
  const { error } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ error: errorMessage });
  }

  next();
}

function validateId(req, res, next) {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid user ID. ID must be a positive number" });
  }

  next();
}

function verifyJWT(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {  
        if (err) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const authorizedRoles = {
            // Everyone
            "GET /login": ["Admin", "User"],
            "GET /logout": ["Admin", "User"],
            
            // Admin
            "GET /admin": ["Admin"],             
            "POST /admin/create_user": ["Admin"], 
            "DELETE /admin/delete_user/[0-9]+": ["Admin"], 
        };

        const requestedEndpoint = `${req.method} ${req.url}`; 
        const userRole = decoded.role;

        const authorizedRole = Object.entries(authorizedRoles).find(
            ([endpoint, roles]) => {
                // The regex logic handles the dynamic ID part
                const regex = new RegExp(`^${endpoint}$`); 
                return regex.test(requestedEndpoint) && roles.includes(userRole);
            }
        );

        if (!authorizedRole) {
            return res.status(403).json({ message: "Forbidden" });
        }

        req.user = decoded; 
        next();
    });
}

module.exports = {
    validateUser,   
    validateId,
    verifyJWT,
};