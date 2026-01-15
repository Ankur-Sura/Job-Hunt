/**
 * ===================================================================================
 *                    COMPANY CONTROLLER - Business Logic for Company Operations
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Contains controller functions for company-related operations.
 * Controllers handle business logic (separate from routes).
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Routes receive HTTP requests
 * 2. Routes call controller functions
 * 3. Controllers process business logic
 * 4. Controllers return responses
 * 
 * 📌 FUNCTIONS:
 * -------------
 * - registerCompany: Create new company
 * - getCompany: Get all companies for user
 * - getCompanyById: Get single company by ID
 * - updateCompany: Update company info + upload logo
 * - getAllCompanies: Get all companies (public)
 * 
 * ===================================================================================
 */

// Line 1: Import Company model
// Company = Mongoose model for company documents
const Company = require('../models/Company');
// Line 2: Import getDataUri utility function
// getDataUri = Converts file buffer to Data URI format
// Used for uploading company logos to Cloudinary
const getDataUri = require('../utils/datauri');
// Line 3: Import Cloudinary instance
// cloudinary = Configured Cloudinary SDK
// Used to upload images to Cloudinary service
const cloudinary = require('../utils/cloudinary');

/**
 * =============================================================================
 *                     REGISTER COMPANY FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Creates a new company for the logged-in user.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Extract companyName from request body
 * 2. Validate companyName exists
 * 3. Check if company with same name already exists
 * 4. Create new company document
 * 5. Return success response
 * 
 * 📌 REQUEST:
 * -----------
 * POST /api/company/register
 * Body: { companyName: "Amazon" }
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * { success: true, company: {...}, message: "..." }
 * 
 * =============================================================================
 */
// Line 5: Define async function to register a new company
// exports.registerCompany = Makes function available to routes
// async = Allows use of 'await' keyword
// req = Express request object (contains body, user, etc.)
// res = Express response object (used to send responses)
exports.registerCompany = async (req, res) => {
    // Line 6: try block for error handling
    try {
        // Line 7: Extract companyName from request body
        // Destructuring = Extracts companyName property from req.body
        // req.body = Contains data sent in POST request
        const { companyName } = req.body;
        // Line 8: Validate that companyName exists
        // If companyName is empty/null/undefined, return 400 error
        if (!companyName) {
            // Line 9: Return 400 Bad Request error
            // status(400) = Sets HTTP status code to 400
            // json() = Sends JSON response
            return res.status(400).json({
                message: "Company name is required.",  // Error message
                success: false                        // Operation failed
            });
        }
        // Line 14: Check if company with same name already exists
        // findOne() = Finds first document matching query
        // { name: companyName } = Query: find company with this name
        // await = Wait for database query to complete
        let company = await Company.findOne({ name: companyName });
        // Line 15: If company exists, return error
        // Prevents duplicate company names
        if (company) {
            // Line 16: Return 400 Bad Request error
            return res.status(400).json({
                message: "You can't register same company.",  // Error message
                success: false                                // Operation failed
            });
        }
        // Line 21: Create new company document
        // Company.create() = Creates new document in database
        // { name, userId } = Company data to save
        // req.user._id = ID of logged-in user (from auth middleware)
        company = await Company.create({
            name: companyName,      // Company name from request
            userId: req.user._id    // Owner of the company (logged-in user)
        });

        // Line 26: Return success response
        // status(201) = HTTP status code 201 (Created)
        return res.status(201).json({
            message: "Company registered successfully.",  // Success message
            company,                                     // Created company object
            success: true                                // Operation successful
        });
    } catch (error) {
        // Line 32: If error occurs (database error, validation error, etc.)
        // Log error to console for debugging
        console.log(error);
        // Line 33: Return 500 Internal Server Error
        res.status(500).json({ 
            message: 'Server error',  // Generic error message
            success: false            // Operation failed
        });
    }
};

/**
 * =============================================================================
 *                     GET COMPANY FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Gets all companies owned by the logged-in user.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Get user ID from request (from auth middleware)
 * 2. Find all companies where userId matches
 * 3. Return companies array
 * 
 * 📌 REQUEST:
 * -----------
 * GET /api/company/get
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * { success: true, companies: [...] }
 * 
 * =============================================================================
 */
// Line 37: Define async function to get all companies for logged-in user
exports.getCompany = async (req, res) => {
    // Line 38: try block for error handling
    try {
        // Line 39: Get user ID from request
        // req.user = User object attached by auth middleware
        // req.user._id = MongoDB ObjectId of logged-in user
        const userId = req.user._id;
        // Line 40: Find all companies owned by this user
        // Company.find() = Finds all documents matching query
        // { userId } = Query: find companies where userId matches
        // await = Wait for database query to complete
        const companies = await Company.find({ userId });
        // Line 41: Check if companies found
        // Note: find() returns empty array if none found, not null
        // This check is actually unnecessary (find() never returns null)
        if (!companies) {
            // Line 42: Return 404 Not Found error
            return res.status(404).json({
                message: "Companies not found.",  // Error message
                success: false                   // Operation failed
            });
        }
        // Line 47: Return success response with companies array
        // status(200) = HTTP status code 200 (OK)
        return res.status(200).json({
            companies,      // Array of company objects
            success: true   // Operation successful
        });
    } catch (error) {
        // Line 52: If error occurs, log and return 500 error
        console.log(error);
        res.status(500).json({ 
            message: 'Server error',  // Generic error message
            success: false            // Operation failed
        });
    }
};

/**
 * =============================================================================
 *                     GET COMPANY BY ID FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Gets a single company by its ID.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Extract company ID from URL parameters
 * 2. Find company by ID in database
 * 3. Return company data
 * 
 * 📌 REQUEST:
 * -----------
 * GET /api/company/get/:id
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * { success: true, company: {...} }
 * 
 * =============================================================================
 */
// Line 57: Define async function to get company by ID
exports.getCompanyById = async (req, res) => {
    // Line 58: try block for error handling
    try {
        // Line 59: Extract company ID from URL parameters
        // req.params = Object containing route parameters
        // req.params.id = Company ID from URL (e.g., /api/company/get/123 → id = "123")
        const companyId = req.params.id;
        // Line 60: Find company by ID in database
        // Company.findById() = Finds document by MongoDB ObjectId
        // companyId = ID to search for
        // await = Wait for database query to complete
        const company = await Company.findById(companyId);
        // Line 61: Check if company exists
        // If company not found, findById returns null
        if (!company) {
            // Line 62: Return 404 Not Found error
            return res.status(404).json({
                message: "Company not found.",  // Error message
                success: false                 // Operation failed
            });
        }
        // Line 67: Return success response with company data
        // status(200) = HTTP status code 200 (OK)
        return res.status(200).json({
            company,       // Company object
            success: true  // Operation successful
        });
    } catch (error) {
        // Line 72: If error occurs, log and return 500 error
        console.log(error);
        res.status(500).json({ 
            message: 'Server error',  // Generic error message
            success: false            // Operation failed
        });
    }
};

/**
 * =============================================================================
 *                     UPDATE COMPANY FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Updates company information and optionally uploads a new logo.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Extract update data from request body
 * 2. Check if file (logo) was uploaded
 * 3. If file exists → Convert to Data URI → Upload to Cloudinary → Get URL
 * 4. Update company document in database
 * 5. Return updated company
 * 
 * 📌 REQUEST:
 * -----------
 * PUT /api/company/update/:id
 * Body: { name, description, website, location }
 * File: logo (multipart/form-data)
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * { success: true, company: {...}, message: "..." }
 * 
 * =============================================================================
 */
// Line 77: Define async function to update company
exports.updateCompany = async (req, res) => {
    // Line 78: try block for error handling
    try {
        // Line 79: Extract update data from request body
        // Destructuring = Extracts properties from req.body
        // name, description, website, location = Company fields to update
        const { name, description, website, location } = req.body;
        // Line 80: Get uploaded file from request
        // req.file = File object from multer middleware (if file was uploaded)
        // Contains: buffer, originalname, mimetype, etc.
        // null if no file uploaded
        const file = req.file;
        
        // Line 82: Create update data object
        // Contains all fields to update (name, description, website, location)
        const updateData = { name, description, website, location };
        
        // Line 84: Check if file (logo) was uploaded
        // If file exists, process it and add logo URL to updateData
        if (file) {
            // Line 85: Convert file buffer to Data URI
            // getDataUri() = Utility function that converts Buffer to Data URI
            // file = File object from multer
            // Returns: { content: "data:image/png;base64,..." }
            const fileUri = getDataUri(file);
            // Line 86: Upload image to Cloudinary
            // cloudinary.uploader.upload() = Uploads image to Cloudinary service
            // fileUri.content = Data URI string (e.g., "data:image/png;base64,...")
            // await = Wait for upload to complete
            // Returns: { secure_url: "https://res.cloudinary.com/.../logo.png", ... }
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            // Line 87: Add logo URL to update data
            // cloudResponse.secure_url = HTTPS URL to uploaded image
            // This URL will be saved in the company document
            updateData.logo = cloudResponse.secure_url;
        }

        // Line 90: Update company document in database
        // Company.findByIdAndUpdate() = Finds company by ID and updates it
        // req.params.id = Company ID from URL
        // updateData = Object containing fields to update
        // { new: true } = Return updated document (not original)
        // await = Wait for update to complete
        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        // Line 92: Check if company exists
        // If company not found, findByIdAndUpdate returns null
        if (!company) {
            // Line 93: Return 404 Not Found error
            return res.status(404).json({
                message: "Company not found.",  // Error message
                success: false                  // Operation failed
            });
        }
        // Line 98: Return success response with updated company
        // status(200) = HTTP status code 200 (OK)
        return res.status(200).json({
            message: "Company information updated.",  // Success message
            company,                                  // Updated company object
            success: true                            // Operation successful
        });
    } catch (error) {
        // Line 104: If error occurs, log and return 500 error
        console.log(error);
        res.status(500).json({ 
            message: 'Server error',  // Generic error message
            success: false            // Operation failed
        });
    }
};

/**
 * =============================================================================
 *                     GET ALL COMPANIES FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Gets all companies in the database (public endpoint).
 * Used for displaying company list on job listings.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Find all companies in database
 * 2. Populate userId field (get user name and email)
 * 3. Return companies array
 * 
 * 📌 REQUEST:
 * -----------
 * GET /api/company/all
 * No auth required = Public endpoint
 * 
 * 📌 RESPONSE:
 * ------------
 * { success: true, companies: [...] }
 * 
 * =============================================================================
 */
// Line 109: Define async function to get all companies
exports.getAllCompanies = async (req, res) => {
    // Line 110: try block for error handling
    try {
        // Line 111: Find all companies and populate user data
        // Company.find() = Finds all documents (empty query = match all)
        // .populate('userId', 'name email') = Replaces userId ObjectId with user data
        // Instead of userId: ObjectId("123"), returns userId: { name: "...", email: "..." }
        // 'name email' = Only include name and email fields from User model
        // await = Wait for database query to complete
        const companies = await Company.find().populate('userId', 'name email');
        // Line 112: Return success response with companies array
        // status(200) = HTTP status code 200 (OK)
        return res.status(200).json({
            companies,      // Array of all company objects
            success: true   // Operation successful
        });
    } catch (error) {
        // Line 117: If error occurs, log and return 500 error
        console.log(error);
        res.status(500).json({ 
            message: 'Server error',  // Generic error message
            success: false            // Operation failed
        });
    }
};

