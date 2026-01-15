/**
 * ===================================================================================
 *                    COMPANY MODEL - Company Information
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Mongoose schema for storing company information.
 * Used by hirers/recruiters to register their companies before posting jobs.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Hirer registers a company → Company document created
 * 2. Hirer posts jobs → Jobs linked to company
 * 3. Company logo uploaded → Stored in Cloudinary, URL saved here
 * 
 * 📌 KEY FIELDS:
 * --------------
 * - name: Company name (unique, required)
 * - userId: Owner of the company (hirer who registered it)
 * - logo: URL to company logo (stored in Cloudinary)
 * 
 * ===================================================================================
 */

// Line 1: Import mongoose library
// mongoose = MongoDB object modeling library for Node.js
const mongoose = require('mongoose');

// Line 3: Define Mongoose schema for Company collection
// Schema = Blueprint for documents in MongoDB collection
const companySchema = new mongoose.Schema({
    // Line 4: name field - Company name
    // unique = Ensures no two companies have the same name
    // required = Must be provided when creating company
    name: {
        type: String,      // String type
        required: true,    // Must be provided
        unique: true       // No duplicate company names allowed
    },
    // Line 9: description field - Company description (optional)
    // Can be empty, used for company bio/about section
    description: {
        type: String  // String type, optional
    },
    // Line 12: website field - Company website URL (optional)
    // Example: "https://www.amazon.com"
    website: {
        type: String  // String type, optional
    },
    // Line 15: location field - Company location (optional)
    // Example: "Bangalore, India"
    location: {
        type: String  // String type, optional
    },
    // Line 18: logo field - URL to company logo image
    // Logo is uploaded to Cloudinary, URL is stored here
    // Example: "https://res.cloudinary.com/.../logo.png"
    logo: {
        type: String  // String type (URL), optional
    },
    // Line 21: userId field - Reference to User who owns this company
    // Links company to the hirer/recruiter who registered it
    userId: {
        type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId type
        ref: 'User',                            // Reference to User model
        required: true                           // Must be provided
    }
}, { 
    // Line 26: Schema options
    // timestamps = Automatically adds createdAt and updatedAt fields
    // createdAt = When company was registered
    // updatedAt = When company info was last updated
    timestamps: true 
});

// Line 28: Export Mongoose model
// Model = Constructor function for creating/querying documents
// 'Company' = Model name (collection name will be 'companies')
// companySchema = Schema definition to use
module.exports = mongoose.model('Company', companySchema);

