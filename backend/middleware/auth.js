/**
 * ===================================================================================
 *                    AUTHENTICATION MIDDLEWARE - JWT Token Verification
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This middleware protects routes that require authentication.
 * It verifies JWT tokens and attaches user data to the request.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token using JWT_SECRET
 * 3. Extracts userId from token
 * 4. Finds user in database
 * 5. Attaches user to req.user
 * 6. Calls next() to continue to route handler
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Valid token → User attached to req.user, request continues
 * - No token → 401 error, request stops
 * - Invalid token → 401 error, request stops
 * - User not found → 401 error, request stops
 * 
 * 📌 USAGE:
 * ---------
 * router.get('/dashboard', auth, async (req, res) => {
 *   // req.user is available here (set by middleware)
 *   const userId = req.user._id;
 * });
 * 
 * ===================================================================================
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * =============================================================================
 *                     AUTHENTICATION MIDDLEWARE FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Verifies JWT token and attaches authenticated user to request.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Extract token from Authorization header
 * 2. Verify token signature using JWT_SECRET
 * 3. Extract userId from decoded token
 * 4. Find user in database
 * 5. Attach user to req.user
 * 6. Continue to next middleware/route handler
 * 
 * ⚠️ IF ANY STEP FAILS:
 * ---------------------
 * Returns 401 Unauthorized and stops request processing.
 * 
 * =============================================================================
 */
const auth = async (req, res, next) => {
  try {
    // Step 1: Extract token from Authorization header
    // Format: "Bearer <token>"
    // req.header('Authorization') gets the header value
    // ?.replace('Bearer ', '') safely removes "Bearer " prefix (if header exists)
    // Result: Just the token string, or undefined if no header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Step 2: Check if token exists
    // If no token provided, user is not authenticated
    // Return 401 Unauthorized and stop processing
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Step 3: Verify token signature
    // jwt.verify() checks:
    //   - Token signature is valid (signed with JWT_SECRET)
    //   - Token hasn't expired
    //   - Token structure is correct
    // If valid: Returns decoded payload { userId: "...", ... }
    // If invalid: Throws error (caught in catch block)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Step 4: Find user in database
    // decoded.userId = User ID from token payload
    // .select('-password') = Exclude password field from result (security)
    // Result: User document without password, or null if not found
    const user = await User.findById(decoded.userId).select('-password');
    
    // Step 5: Check if user exists
    // If user was deleted but token is still valid, user will be null
    // Return 401 Unauthorized and stop processing
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Step 6: Attach user to request object
    // This makes user data available in route handlers
    // Route handlers can access: req.user._id, req.user.email, etc.
    req.user = user;
    
    // Step 7: Continue to next middleware or route handler
    // next() passes control to the next function in the chain
    // Without this, request would hang
    next();
  } catch (error) {
    // Catch any errors (invalid token, expired token, etc.)
    // Return 401 Unauthorized
    // This handles:
    //   - Token signature invalid
    //   - Token expired
    //   - Token malformed
    //   - Any other JWT verification errors
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Export the middleware function
// Used in routes like: router.get('/dashboard', auth, handler)
module.exports = auth;

