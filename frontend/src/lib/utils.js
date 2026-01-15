/**
 * =============================================================================
 *                    UTILS.JS - Utility Functions
 * =============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file contains utility functions used throughout the application.
 * Currently, it provides a function to merge Tailwind CSS classes.
 *
 * 🔗 WHERE IT'S USED:
 * -------------------
 * Used across the frontend to combine CSS classes dynamically.
 *
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Combines multiple CSS class strings
 * 2. Handles conditional classes
 * 3. Merges Tailwind classes intelligently (prevents conflicts)
 * 4. Used by shadcn/ui components
 *
 * =============================================================================
 */

// Line 1: Import clsx library
// clsx = Utility for constructing className strings conditionally
// Allows combining classes: clsx('foo', { bar: true }) => 'foo bar'
import { clsx } from "clsx"
// Line 2: Import twMerge function from tailwind-merge
// twMerge = Utility to merge Tailwind CSS classes intelligently
// Prevents conflicts: twMerge('p-2 p-4') => 'p-4' (last one wins)
import { twMerge } from "tailwind-merge"

// Line 4: Export cn function (class name utility)
// export function = Make function available for import in other files
// cn = Common name for this utility (stands for "class names")
// (...inputs) = Rest parameter: accepts any number of arguments
export function cn(...inputs) {
  // Line 5: Return merged class names
  // twMerge = Merge Tailwind classes (handles conflicts)
  // clsx(...inputs) = Combine all input classes into a single string
  // clsx handles conditional classes and arrays
  // twMerge then resolves any Tailwind class conflicts
  // Example: cn('p-2', 'p-4') => 'p-4' (p-4 overrides p-2)
  // Example: cn('text-red-500', condition && 'text-blue-500') => conditional class
  return twMerge(clsx(inputs))
}
