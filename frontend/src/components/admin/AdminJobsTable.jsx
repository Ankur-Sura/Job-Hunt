/**
 * =============================================================================
 *                    ADMINJOBSTABLE.JSX - Admin Jobs Table Component
 * =============================================================================
 *
 * 📖 WHAT IS THIS COMPONENT?
 * --------------------------
 * This component displays a table of jobs posted by the admin/recruiter.
 * It shows job details (company, role, date) and allows viewing applicants
 * for each job. It also includes search/filter functionality.
 *
 * 🔗 WHERE IT'S USED:
 * -------------------
 * Used in the admin/recruiter dashboard to manage posted jobs.
 *
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Displays all jobs posted by the logged-in recruiter
 * 2. Filters jobs based on search text (job title or company name)
 * 3. Provides navigation to view applicants for each job
 * 4. Uses Redux to get job data
 * 5. Real-time filtering as user types
 *
 * =============================================================================
 */

// Line 1: Import React library and hooks
// React = Core React library
// useEffect = Hook for side effects (runs after render)
// useState = Hook for managing component state
import React, { useEffect, useState } from 'react'
// Line 2: Import table components from UI library
// Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow = Reusable table components
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
// Line 3: Import Popover components for dropdown menu
// Popover, PopoverContent, PopoverTrigger = Components for showing a popup menu
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
// Line 4: Import icons from lucide-react
// Edit2 = Edit icon (pencil)
// Eye = Eye icon (view)
// MoreHorizontal = Three horizontal dots icon (menu)
import { Edit2, Eye, MoreHorizontal } from 'lucide-react'
// Line 5: Import useSelector hook from react-redux
// useSelector = Hook to access Redux store state
import { useSelector } from 'react-redux'
// Line 6: Import useNavigate hook from react-router-dom
// useNavigate = Hook for programmatic navigation
import { useNavigate } from 'react-router-dom'

// Line 8: Define AdminJobsTable functional component
// const AdminJobsTable = () => { ... } = Arrow function component that returns JSX
const AdminJobsTable = () => {
    // Line 9: Get jobs data and search text from Redux store
    // useSelector = Hook to access Redux store
    // store => store.job = Access the 'job' slice from Redux store
    // { allAdminJobs, searchJobByText } = Destructure 'allAdminJobs' array and 'searchJobByText' string
    const { allAdminJobs, searchJobByText } = useSelector(store => store.job);
    // Line 10: State to store filtered jobs
    // useState = Hook to create state variable
    // allAdminJobs = Initial value (all jobs before filtering)
    // filterJobs = State variable containing filtered jobs
    // setFilterJobs = Function to update filterJobs state
    const [filterJobs, setFilterJobs] = useState(allAdminJobs);
    // Line 11: Get navigate function for routing
    // useNavigate = Hook that returns a function to navigate to different routes
    // navigate = Function to programmatically navigate (e.g., navigate('/path'))
    const navigate = useNavigate();

    // Line 13: useEffect hook to filter jobs when search text or jobs change
    // useEffect = Hook that runs after component renders
    // (() => { ... }, [dependencies]) = Function to run and array of dependencies
    // [allAdminJobs, searchJobByText] = Dependencies: re-run effect when these change
    useEffect(() => {
        // Line 14: Filter jobs based on search text
        // allAdminJobs.filter = Array method to create new array with filtered items
        // (job) => { ... } = Arrow function that returns true/false for each job
        const filteredJobs = allAdminJobs.filter((job) => {
            // Line 15: If no search text, show all jobs
            // if (!searchJobByText) = Check if search text is empty/null/undefined
            // ! = Logical NOT operator
            if (!searchJobByText) {
                // Line 16: Return true to include this job in filtered results
                return true;
            };
            // Line 18: Check if job title or company name matches search text
            // return = Return boolean: true if match found, false otherwise
            // job?.title?.toLowerCase() = Get job title in lowercase (safely)
            // .includes(searchJobByText.toLowerCase()) = Check if title contains search text (case-insensitive)
            // || = Logical OR operator
            // job?.company?.name?.toLowerCase() = Get company name in lowercase (safely)
            // .includes(searchJobByText.toLowerCase()) = Check if company name contains search text
            // ?. = Optional chaining to safely access nested properties
            return job?.title?.toLowerCase().includes(searchJobByText.toLowerCase()) || 
                   job?.company?.name?.toLowerCase().includes(searchJobByText.toLowerCase());
        });
        // Line 21: Update filterJobs state with filtered results
        // setFilterJobs = Function to update state
        // filteredJobs = New array containing only matching jobs
        setFilterJobs(filteredJobs);
    // Line 22: Dependencies array: re-run effect when allAdminJobs or searchJobByText changes
    }, [allAdminJobs, searchJobByText])

    // Line 24: Return JSX to render the component
    return (
        <div>
            {/* Line 26: Table component from UI library */}
            {/* <Table> = Reusable table component with styling */}
            <Table>
                {/* Line 27: Table caption (description text above table) */}
                {/* <TableCaption> = Component for table description */}
                {/* "A list of your recent posted jobs" = Text describing what the table shows */}
                <TableCaption>A list of your recent posted jobs</TableCaption>
                {/* Line 28: Table header section (column headers) */}
                {/* <TableHeader> = Component wrapping table header row */}
                <TableHeader>
                    {/* Line 29: Table header row */}
                    {/* <TableRow> = Component for a table row */}
                    <TableRow>
                        {/* Line 30: Header cell for "Company Name" column */}
                        {/* <TableHead> = Component for table header cell */}
                        <TableHead>Company Name</TableHead>
                        {/* Line 31: Header cell for "Role" column */}
                        <TableHead>Role</TableHead>
                        {/* Line 32: Header cell for "Date" column */}
                        <TableHead>Date</TableHead>
                        {/* Line 33: Header cell for "Action" column (right-aligned) */}
                        {/* className="text-right" = Tailwind CSS class to align text to the right */}
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                {/* Line 36: Table body section (data rows) */}
                {/* <TableBody> = Component wrapping table data rows */}
                <TableBody>
                    {/* Line 37: Map over filtered jobs to create table rows - filterJobs?.map iterates over filtered jobs array */}
                    {
                        filterJobs?.map((job) => (
                            <TableRow key={job._id}>
                                {/* Line 40: Cell displaying company name - {job?.company?.name || 'N/A'} displays company name or 'N/A' if not available */}
                                <TableCell>{job?.company?.name || 'N/A'}</TableCell>
                                {/* Line 41: Cell displaying job title/role */}
                                <TableCell>{job?.title}</TableCell>
                                {/* Line 42: Cell displaying job creation date - {job?.createdAt?.split("T")[0]} extracts date part from ISO timestamp */}
                                <TableCell>{job?.createdAt?.split("T")[0]}</TableCell>
                                {/* Line 43: Cell for action buttons (right-aligned, clickable) */}
                                <TableCell className="text-right cursor-pointer">
                                    {/* Line 44: Popover component for dropdown menu */}
                                    <Popover>
                                        {/* Line 45: Trigger button for popover - MoreHorizontal icon opens the popover */}
                                        <PopoverTrigger><MoreHorizontal /></PopoverTrigger>
                                        {/* Line 46: Popover content (dropdown menu) - className="w-32" sets width to 128px */}
                                        <PopoverContent className="w-32">
                                            {/* Line 47: Menu item to view applicants - onClick navigates to applicants page for this job */}
                                            <div onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)} className='flex items-center w-fit gap-2 cursor-pointer mt-2'>
                                                {/* Line 48: Eye icon for "View" action - className='w-4' sets width to 16px */}
                                                <Eye className='w-4' />
                                                {/* Line 49: Menu item text */}
                                                <span>Applicants</span>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </TableRow>
                        ))
                    }
                </TableBody>
            </Table>
        </div>
    )
}

// Line 63: Export component as default export
// export default = Make this component available for import in other files
export default AdminJobsTable
