/**
 * ===================================================================================
 *                    COMPANY ROUTES - Company Management Endpoints
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Express router for company-related API endpoints.
 * Handles company registration, retrieval, and updates.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Hirer registers company → POST /api/company/register
 * 2. Hirer views their companies → GET /api/company/get
 * 3. Hirer updates company info → PUT /api/company/update/:id
 * 4. Public company list → GET /api/company/all
 * 
 * 📌 ROUTES:
 * ----------
 * POST /register - Register new company (requires auth)
 * GET /get - Get all companies for logged-in user (requires auth)
 * GET /get/:id - Get company by ID (requires auth)
 * PUT /update/:id - Update company info + logo (requires auth, file upload)
 * GET /all - Get all companies (public, no auth)
 * 
 * ===================================================================================
 */

// Line 1: Import Express framework
// express = Web framework for Node.js
const express = require('express');
// Line 2: Create Express router
// router = Mini-app for handling routes
// Allows grouping related routes together
const router = express.Router();
// Line 3: Import authentication middleware
// auth = Middleware function that verifies JWT token
// Protects routes - only logged-in users can access
const auth = require('../middleware/auth');
// Line 4: Import multer library
// multer = Middleware for handling multipart/form-data (file uploads)
// Used for uploading company logos
const multer = require('multer');
// Line 5: Import company controller
// companyController = Contains business logic for company operations
// Separates route definitions from business logic
const companyController = require('../controllers/company.controller');

// Line 7: Configure multer storage
// memoryStorage = Stores uploaded files in memory (as Buffer)
// Files are not saved to disk, processed in memory
const storage = multer.memoryStorage();
// Line 8: Create multer upload middleware
// upload = Middleware function for handling file uploads
// .single('file') = Accepts single file with field name 'file'
const upload = multer({ storage });

// Line 10: POST /api/company/register - Register new company
// auth = Requires user to be logged in
// companyController.registerCompany = Handler function
// Flow: User logged in → Creates company → Returns company data
router.post('/register', auth, companyController.registerCompany);

// Line 11: GET /api/company/get - Get all companies for logged-in user
// auth = Requires user to be logged in
// companyController.getCompany = Handler function
// Flow: User logged in → Returns all companies owned by user
router.get('/get', auth, companyController.getCompany);

// Line 12: GET /api/company/get/:id - Get company by ID
// :id = Route parameter (company ID from URL)
// auth = Requires user to be logged in
// companyController.getCompanyById = Handler function
// Flow: User logged in → Returns specific company details
router.get('/get/:id', auth, companyController.getCompanyById);

// Line 13: PUT /api/company/update/:id - Update company information
// :id = Route parameter (company ID from URL)
// auth = Requires user to be logged in
// upload.single('file') = Handles file upload (company logo)
// companyController.updateCompany = Handler function
// Flow: User logged in → Updates company → Uploads logo to Cloudinary → Returns updated company
router.put('/update/:id', auth, upload.single('file'), companyController.updateCompany);

// Line 14: GET /api/company/all - Get all companies (public)
// No auth = Anyone can access (used for public company listings)
// companyController.getAllCompanies = Handler function
// Flow: Returns all companies in database (for job listings, etc.)
router.get('/all', companyController.getAllCompanies);

// Line 16: Export router
// Makes this router available for use in server.js
// server.js imports this and mounts it at /api/company
module.exports = router;

