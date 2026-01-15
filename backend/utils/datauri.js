/**
 * ===================================================================================
 *                    DATA URI UTILITY - File to Data URI Converter
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Utility function to convert uploaded files to Data URI format.
 * Data URI = Base64-encoded file data embedded in a string.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. File uploaded via multer → Stored as Buffer in memory
 * 2. getDataUri() called → Converts Buffer to Data URI
 * 3. Data URI sent to Cloudinary → Cloudinary processes image
 * 
 * 📌 WHAT IS DATA URI?
 * --------------------
 * Data URI format: data:image/png;base64,iVBORw0KGgoAAAANS...
 * - data: = Protocol identifier
 * - image/png = MIME type
 * - base64 = Encoding type
 * - iVBORw0KGgo... = Base64-encoded file data
 * 
 * 📌 WHY IT'S NEEDED:
 * -------------------
 * Cloudinary uploader.upload() accepts Data URI format.
 * Multer provides files as Buffers, so conversion is needed.
 * 
 * ===================================================================================
 */

// Line 1: Import DataUriParser class
// datauri/parser = Library for converting files to Data URI format
// Parser = Class that handles the conversion
const DataUriParser = require('datauri/parser');
// Line 2: Import path module
// path = Node.js built-in module for working with file paths
// Used to extract file extension from filename
const path = require('path');

// Line 4: Define function to convert file to Data URI
// getDataUri = Function that takes a file object and returns Data URI string
// file = File object from multer (contains buffer, originalname, etc.)
const getDataUri = (file) => {
    // Line 5: Create new DataUriParser instance
    // parser = Parser object that will convert file to Data URI
    const parser = new DataUriParser();
    // Line 6: Extract file extension from original filename
    // path.extname() = Gets file extension (e.g., ".png", ".jpg")
    // file.originalname = Original filename from upload (e.g., "logo.png")
    // .toString() = Converts to string (ensures it's a string)
    // Example: "logo.png" → ".png"
    const extName = path.extname(file.originalname).toString();
    // Line 7: Convert file buffer to Data URI
    // parser.format() = Converts buffer to Data URI string
    // extName = File extension (used to determine MIME type)
    // file.buffer = File data as Buffer (binary data in memory)
    // Returns: "data:image/png;base64,iVBORw0KGgo..." format
    return parser.format(extName, file.buffer);
};

// Line 10: Export function
// Makes getDataUri available for use in other files
// Other files can import this and use it to convert files to Data URI
module.exports = getDataUri;

