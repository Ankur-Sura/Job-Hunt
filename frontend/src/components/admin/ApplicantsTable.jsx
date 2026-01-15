/**
 * =============================================================================
 *                    APPLICANTSTABLE.JSX - Applicants Table Component
 * =============================================================================
 *
 * 📖 WHAT IS THIS COMPONENT?
 * --------------------------
 * This component displays a table of job applicants for recruiters/hirers.
 * It shows applicant details (name, email, contact, resume) and allows
 * recruiters to accept or reject applications.
 *
 * 🔗 WHERE IT'S USED:
 * -------------------
 * Used in the recruiter/admin dashboard to manage job applications.
 *
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Displays applicant information in a table format
 * 2. Allows viewing applicant resumes
 * 3. Provides actions to accept/reject applications
 * 4. Uses Redux to get applicant data
 * 5. Makes API calls to update application status
 *
 * =============================================================================
 */

// Line 1: Import React library for creating React components
import React from 'react'
// Line 2: Import table components from the UI library (shadcn/ui)
// Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow = Reusable table components
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
// Line 3: Import Popover components for dropdown menu
// Popover, PopoverContent, PopoverTrigger = Components for showing a popup menu
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
// Line 4: Import MoreHorizontal icon from lucide-react icon library
// MoreHorizontal = Three horizontal dots icon (hamburger menu icon)
import { MoreHorizontal } from 'lucide-react';
// Line 5: Import useSelector hook from react-redux
// useSelector = Hook to access Redux store state
import { useSelector } from 'react-redux';
// Line 6: Import toast function from sonner library
// toast = Function to show toast notifications (success/error messages)
import { toast } from 'sonner';
// Line 7: Import APPLICATION_API_END_POINT constant from constants file
// APPLICATION_API_END_POINT = API endpoint URL for application-related requests
import { APPLICATION_API_END_POINT } from '@/utils/constants';
// Line 8: Import axios library for making HTTP requests
// axios = HTTP client library for API calls
import axios from 'axios';

// Line 10: Define array of possible application statuses
// shortlistingStatus = Array containing "Accepted" and "Rejected" status options
const shortlistingStatus = ["Accepted", "Rejected"];

// Line 12: Define ApplicantsTable functional component
// const ApplicantsTable = () => { ... } = Arrow function component that returns JSX
const ApplicantsTable = () => {
    // Line 13: Get applicants data from Redux store
    // useSelector = Hook to access Redux store
    // store => store.application = Access the 'application' slice from Redux store
    // { applicants } = Destructure 'applicants' from the application slice
    const { applicants } = useSelector(store => store.application);

    // Line 15: Define async function to handle status updates (accept/reject)
    // statusHandler = Function that updates application status
    // async = Makes the function asynchronous (can use await)
    // (status, id) = Parameters: status = "Accepted" or "Rejected", id = application ID
    const statusHandler = async (status, id) => {
        // Line 16: Start try-catch block for error handling
        try {
            // Line 17: Make PATCH request to update application status
            // axios.patch = HTTP PATCH method to update a resource
            // `${APPLICATION_API_END_POINT}/${id}` = API endpoint with application ID (e.g., /api/applications/123)
            // { status } = Request body containing the new status
            // { headers: { ... } } = Request headers for authentication
            const res = await axios.patch(`${APPLICATION_API_END_POINT}/${id}`, { status }, {
                // Line 18: Define request headers object
                headers: {
                    // Line 19: Add Authorization header with JWT token
                    // 'Authorization' = HTTP header name for authentication
                    // `Bearer ${localStorage.getItem('token')}` = JWT token from browser's local storage
                    // Bearer = Authentication scheme indicating token-based auth
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            // Line 22: Check if response contains data
            // res.data = Response data from the API
            // if (res.data) = Only proceed if response has data
            if (res.data) {
                // Line 23: Show success toast notification
                // toast.success = Display a green success toast message
                // `Application ${status.toLowerCase()} successfully` = Message showing status update (e.g., "Application accepted successfully")
                // status.toLowerCase() = Convert "Accepted" to "accepted" for the message
                toast.success(`Application ${status.toLowerCase()} successfully`);
                // Line 24: Comment explaining page refresh
                // Refresh the page or update state
                // Line 25: Reload the entire page to refresh data
                // window.location.reload() = Browser method to reload the current page
                // This ensures the table shows updated status after change
                window.location.reload();
            }
        // Line 27: Catch block to handle errors
        } catch (error) {
            // Line 28: Show error toast notification
            // toast.error = Display a red error toast message
            // error.response?.data?.error = Get error message from API response (if available)
            // || "Failed to update status" = Fallback error message if API error not available
            // ?. = Optional chaining to safely access nested properties
            toast.error(error.response?.data?.error || "Failed to update status");
        }
    }

    // Line 32: Return JSX to render the component
    return (
        <div>
            {/* Line 34: Table component from UI library - <Table> is a reusable table component with styling */}
            <Table>
                {/* Line 35: Table caption - "A list of your recent applied users" describes what the table shows */}
                <TableCaption>A list of your recent applied users</TableCaption>
                {/* Line 36: Table header section (column headers) */}
                <TableHeader>
                    {/* Line 37: Table header row */}
                    <TableRow>
                        {/* Line 38: Header cell for "FullName" column */}
                        <TableHead>FullName</TableHead>
                        {/* Line 39: Header cell for "Email" column */}
                        <TableHead>Email</TableHead>
                        {/* Line 40: Header cell for "Contact" column */}
                        <TableHead>Contact</TableHead>
                        {/* Line 41: Header cell for "Resume" column */}
                        <TableHead>Resume</TableHead>
                        {/* Line 42: Header cell for "Date" column */}
                        <TableHead>Date</TableHead>
                        {/* Line 43: Header cell for "Action" column (right-aligned) - className="text-right" aligns text to the right */}
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                {/* Line 46: Table body section (data rows) */}
                <TableBody>
                    {/* Line 47: Conditional rendering - check if applicants exist - ternary operator shows table rows or "No applicants" */}
                    {
                        applicants && applicants?.applications?.length > 0 ? (
                            /* Line 49: Map over applications array to create table rows - applicants.applications.map iterates over each application */
                            applicants.applications.map((item) => (
                                /* Line 50: Table row for each application - key={item._id} is React key prop using application ID */
                                <TableRow key={item._id}>
                                    {/* Line 51: Cell displaying applicant's full name - {item?.user?.name || 'N/A'} displays user's name or 'N/A' */}
                                    <TableCell>{item?.user?.name || 'N/A'}</TableCell>
                                    {/* Line 52: Cell displaying applicant's email - {item?.user?.email || 'N/A'} displays user's email or 'N/A' */}
                                    <TableCell>{item?.user?.email || 'N/A'}</TableCell>
                                    {/* Line 53: Cell displaying applicant's phone number - {item?.user?.phone || 'N/A'} displays user's phone or 'N/A' */}
                                    <TableCell>{item?.user?.phone || 'N/A'}</TableCell>
                                    {/* Line 54: Cell for resume link */}
                                    <TableCell>
                                        {/* Line 55: Conditional rendering - check if resume exists - if resumeId exists, show link, else show "NA" */}
                                        {
                                            item?.user?.resumeId ? (
                                                /* Line 57: Link to view resume - href points to resume PDF, target="_blank" opens in new tab */
                                                <a className="text-blue-600 cursor-pointer" href={`/api/resume/${item.user.resumeId}`} target="_blank" rel="noopener noreferrer">
                                                    View Resume
                                                </a>
                                            ) : <span>NA</span>
                                        }
                                    </TableCell>
                                    {/* Line 63: Cell displaying application date - {item?.createdAt?.split("T")[0]} extracts date part from ISO timestamp */}
                                    <TableCell>{item?.createdAt?.split("T")[0]}</TableCell>
                                    {/* Line 64: Cell for action buttons (right-aligned, clickable) - className="float-right cursor-pointer" floats right and shows pointer cursor */}
                                    <TableCell className="float-right cursor-pointer">
                                        {/* Line 65: Popover component for dropdown menu */}
                                        <Popover>
                                            {/* Line 66: Trigger button for popover - MoreHorizontal icon opens the popover */}
                                            <PopoverTrigger>
                                                <MoreHorizontal />
                                            </PopoverTrigger>
                                            {/* Line 69: Popover content (dropdown menu) - className="w-32" sets width to 128px */}
                                            <PopoverContent className="w-32">
                                                {/* Line 70: Map over status options to create menu items - shortlistingStatus.map iterates over ["Accepted", "Rejected"] */}
                                                {
                                                    shortlistingStatus.map((status, index) => {
                                                        /* Line 72: Return menu item div - onClick calls statusHandler with status and application ID */
                                                        return (
                                                            /* Line 73: Clickable menu item div - className includes flex, w-fit, items-center, my-2, cursor-pointer */
                                                            <div onClick={() => statusHandler(status, item?._id)} key={index} className='flex w-fit items-center my-2 cursor-pointer'>
                                                                {/* Line 74: Display status text - {status} displays "Accepted" or "Rejected" */}
                                                                <span>{status}</span>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            /* Line 84: Fallback row when no applicants found */
                            <TableRow>
                                {/* Line 86: Cell spanning all columns with "No applicants" message - colSpan={6} spans across 6 columns, className="text-center" centers text */}
                                <TableCell colSpan={6} className="text-center">No applicants found</TableCell>
                            </TableRow>
                        )
                    }
                </TableBody>
            </Table>
        </div>
    )
}

// Line 96: Export component as default export
// export default = Make this component available for import in other files
export default ApplicantsTable
