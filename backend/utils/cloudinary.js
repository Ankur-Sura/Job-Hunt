/**
 * ===================================================================================
 *                    CLOUDINARY CONFIGURATION - Image Upload Service
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Configures Cloudinary SDK for uploading images (company logos).
 * Cloudinary is a cloud-based image management service.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Company logo uploaded → Converted to Data URI
 * 2. Data URI sent to Cloudinary → Image stored in cloud
 * 3. Cloudinary returns URL → URL saved in database
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Logo uploaded → Stored in Cloudinary → URL returned
 * - URL saved in Company document → Used to display logo
 * 
 * 📌 ENVIRONMENT VARIABLES:
 * -------------------------
 * CLOUD_NAME - Cloudinary cloud name
 * API_KEY - Cloudinary API key
 * API_SECRET - Cloudinary API secret
 * 
 * ===================================================================================
 */

// Line 1: Import Cloudinary SDK version 2
// cloudinary = Library for interacting with Cloudinary service
// .v2 = Version 2 of the SDK (latest stable version)
const cloudinary = require('cloudinary').v2;
// Line 2: Load environment variables from .env file
// dotenv = Library for loading environment variables
// config() = Reads .env file and sets process.env variables
require('dotenv').config();

// Line 4: Configure Cloudinary with credentials
// cloudinary.config() = Sets up Cloudinary SDK with API credentials
// These credentials are used to authenticate with Cloudinary service
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,    // Cloudinary cloud name (from .env file)
    api_key: process.env.API_KEY,           // Cloudinary API key (from .env file)
    api_secret: process.env.API_SECRET      // Cloudinary API secret (from .env file)
});

// Line 10: Export configured Cloudinary instance
// Makes cloudinary object available for use in other files
// Other files can import this and use cloudinary.uploader.upload() to upload images
module.exports = cloudinary;

