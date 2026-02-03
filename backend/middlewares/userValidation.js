const Joi = require("joi");
const jwt = require("jsonwebtoken");

const userSchema = Joi.object({
  Username: Joi.string().min(1).max(50).required().messages({
    "string.base": "Username must be a string",
    "string.empty": "Username cannot be empty",
    "string.min": "Username must be at least 1 character long",
    "string.max": "Username cannot exceed 50 characters",
    "any.required": "Username is required",
  }),
  Password: Joi.string().min(8).max(255).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 255 characters",
    "any.required": "Password is required",
  }),
  Role: Joi.string().valid("Admin", "User").required().messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either 'Admin' or 'User'",
    "any.required": "Role is required",
  }),
});

function validateUser(req, res, next) {
  //Validate the request body against the userSchema
  const { error } = userSchema.validate(req.body, { abortEarly: false }); //abortEarly: false collects all errors

  if (error) {
    //If validation fails, format the error messages and send a 400 response
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ error: errorMessage });
  }

  //If validation succeeds, pass control to the next middleware/route handler
  next();
}

function validateId(req, res, next) {
  //Parse the ID from request parameters
  const id = parseInt(req.params.id);

  //Check if the parsed ID is a valid positive number
  if (isNaN(id) || id <= 0) {
    //If not valid, send a 400 response
    return res
      .status(400)
      .json({ error: "Invalid user ID. ID must be a positive number" });
  }

  //If validation succeeds, pass control to the next middleware/route handler
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
    validateUser,   
    validateId,
    verifyJWT,
}