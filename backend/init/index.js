/**
 * =============================================================================
 *                    INDEX.JS - Database Initialization Script
 * =============================================================================
 *
 * 📚 WHAT IS THIS FILE?
 * ---------------------
 * This is a DATABASE SEEDING SCRIPT. It populates your MongoDB with sample data.
 * Think of it as "setting up the initial state" of your database.
 *
 * 🔗 HOW TO RUN:
 * -------------
 *     cd "/Users/ankursura/Desktop/Job Portal Project /backend"
 *     node init/index.js
 *
 * ⚠️ WARNING: This will DELETE all existing jobs and replace them with
 * the sample data from data.js!
 *
 * 📌 WHAT IT DOES:
 * ---------------
 * 1. Connects to MongoDB (jobportal database)
 * 2. Deletes ALL existing jobs (clean slate)
 * 3. Inserts ALL sample jobs from data.js
 * 4. Closes connection and exits
 *
 * 🔗 YOUR NOTES CONNECTION:
 * -------------------------
 * This is a common pattern in Node.js projects:
 *   - mongoose.connect() → Connect to DB
 *   - Model.deleteMany({}) → Delete all documents
 *   - Model.insertMany([]) → Insert multiple documents
 *
 * 📖 INTERVIEW TIP:
 * ----------------
 * "I created a database seeding script to initialize the application with
 * sample data. This is useful for development, testing, and demos. The script
 * follows best practices by properly closing the MongoDB connection after
 * completion."
 *
 * =============================================================================
 */

// Line 1: Import mongoose library
// mongoose = MongoDB object modeling library for Node.js
// Provides schema validation, middleware, and query building
const mongoose = require("mongoose");
// Line 2: Import sample jobs data from data.js file
// require("./data.js") = Import the data.js file from the same directory
// initData = Object containing the sampleJobs array (exported from data.js)
const initData = require("./data.js");
// Line 3: Import Job model
// Job = Mongoose model for job documents in MongoDB
// Used to interact with the jobs collection in the database
const Job = require("../models/Job.js");

// Line 5: Comment explaining next section
// MongoDB Connection URL
// - 127.0.0.1 = localhost (your local machine)
// - 27017 = default MongoDB port
// - jobportal = database name (created automatically if doesn't exist)
// Line 6: Define MongoDB connection URI
// MONGO_URL = Connection string for MongoDB database
// process.env.MONGODB_URI = Get URI from environment variables (if set)
// || = Logical OR operator (fallback)
// "mongodb://127.0.0.1:27017/jobportal" = Default local MongoDB URI
// 127.0.0.1:27017 = Local MongoDB host and port
// jobportal = Database name
const MONGO_URL = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jobportal";

// Line 8: Comment explaining next section
// Connect to MongoDB
// Using async/await pattern with .then()/.catch() for error handling
// Line 9: Call main function and handle promise
// main() = Call the async main function
// .then() = Handle successful connection
// .catch() = Handle connection errors
main()
  // Line 10: Success handler (runs when connection succeeds)
  // .then(async () => { ... }) = Promise success callback
  // async = Arrow function can use await (though not needed here)
  .then(async () => {
    // Line 11: Log success message
    // console.log = Output message to terminal
    // "✅ Connected to MongoDB" = Success message with checkmark emoji
    console.log("✅ Connected to MongoDB");
  })
  // Line 12: Error handler (runs when connection fails)
  // .catch((err) => { ... }) = Promise error callback
  // err = Error object containing error details
  .catch((err) => {
    // Line 13: Log error message
    // console.log = Output message to terminal
    // "❌ MongoDB connection error:" = Error prefix with X emoji
    // err = Error object containing error details
    console.log("❌ MongoDB connection error:", err);
    // Line 14: Exit the script with error code
    // process.exit(1) = Terminate Node.js process with exit code 1 (error)
    // Exit code 1 indicates failure
    process.exit(1);
  })

// Line 16: Define async function to connect to MongoDB
// async function = Function that can use await keyword for asynchronous operations
// main = Function name
async function main() {
  // Line 17: Connect to MongoDB database
  // await = Wait for asynchronous operation to complete
  // mongoose.connect(MONGO_URL) = Establish connection to MongoDB
  // MONGO_URL = Connection string (defined above)
  await mongoose.connect(MONGO_URL);
}

// Line 20: Comment explaining next section
// Initialize Database Function
// 
// Steps:
// 1. deleteMany({}) - Empty filter means "delete ALL documents"
// 2. insertMany() - Insert array of documents
// 3. Close connection - Important for scripts (not servers)!
// 4. Exit process - Clean exit with code 0 (success)
// Line 21: Define async function to initialize database
// const initDB = async () => { ... } = Arrow function that can use await
// initDB = Function name (stands for "initialize database")
const initDB = async () => {
  // Line 22: Start try-catch block for error handling
  // try { ... } = Block of code to attempt execution
  // catch (error) { ... } = Block to handle any errors that occur
  try {
    // Line 23: Comment explaining next section
    // Delete existing data (clean slate)
    // Line 24: Delete all existing job documents from database
    // await = Wait for database operation to complete
    // Job.deleteMany({}) = Mongoose method to delete multiple documents
    //   {} = Empty filter object means "delete ALL documents" (no conditions)
    // This ensures a clean slate before inserting new data
    await Job.deleteMany({});
    // Line 25: Log success message
    // console.log = Output message to terminal
    // "🗑️  Cleared existing jobs" = Success message with trash emoji
    console.log("🗑️  Cleared existing jobs");
    
    // Line 27: Comment explaining next section
    // Insert sample data from data.js
    // Line 28: Insert all sample jobs into database
    // await = Wait for database operation to complete
    // Job.insertMany(initData.data) = Mongoose method to insert multiple documents
    //   initData.data = Array of job objects from data.js file
    //   insertMany = Efficiently inserts all documents in one operation
    await Job.insertMany(initData.data);
    // Line 29: Log success message with count
    // console.log = Output message to terminal
    // Template literal (backticks) = Allows string interpolation with ${}
    // `✅ Inserted ${initData.data.length} sample jobs` = Shows number of jobs inserted
    // initData.data.length = Number of job objects in the array
    console.log(`✅ Inserted ${initData.data.length} sample jobs`);
    
    // Line 31: Comment explaining next section
    // Close MongoDB connection (important for scripts!)
    // Line 32: Close the MongoDB connection
    // await = Wait for connection to close
    // mongoose.connection.close() = Mongoose method to close database connection
    // Important: Scripts should close connections, servers keep them open
    await mongoose.connection.close();
    // Line 33: Log success message
    // console.log = Output message to terminal
    // "🔌 MongoDB connection closed" = Success message with plug emoji
    console.log("🔌 MongoDB connection closed");
    
    // Line 35: Comment explaining next section
    // Exit the script
    // Line 36: Exit the script successfully
    // process.exit(0) = Terminate Node.js process with exit code 0 (success)
    // Exit code 0 indicates successful completion
    process.exit(0);
  // Line 37: Catch block to handle errors
  // catch (error) { ... } = Block executed if any error occurs in try block
  } catch (error) {
    // Line 38: Log error message
    // console.error = Output error message to terminal (usually in red)
    // "❌ Error initializing database:" = Error prefix with X emoji
    // error = Error object containing error details
    console.error("❌ Error initializing database:", error);
    // Line 39: Close MongoDB connection even on error
    // await = Wait for connection to close
    // mongoose.connection.close() = Close database connection
    // Important: Always close connection, even when errors occur
    await mongoose.connection.close();
    // Line 40: Exit the script with error code
    // process.exit(1) = Terminate Node.js process with exit code 1 (error)
    // Exit code 1 indicates failure
    process.exit(1);
  }
};

// Line 43: Comment explaining next line
// Run the initialization
// Line 44: Call the function to execute the script
// initDB() = Invoke the async function
// This starts the database initialization when file is run with: node init/index.js
initDB();
