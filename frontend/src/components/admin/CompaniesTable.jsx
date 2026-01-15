/**
 * =============================================================================
 *                    COMPANIESTABLE.JSX - Companies Table Component
 * =============================================================================
 *
 * 📖 WHAT IS THIS COMPONENT?
 * --------------------------
 * This component displays a table of companies registered by the admin/recruiter.
 * It shows company details (logo, name, date) and allows editing company information.
 * It also includes search/filter functionality.
 *
 * 🔗 WHERE IT'S USED:
 * -------------------
 * Used in the admin/recruiter dashboard to manage registered companies.
 *
 * 📌 KEY FEATURES:
 * ----------------
 * 1. Displays all companies registered by the logged-in recruiter
 * 2. Shows company logo (or fallback initial if no logo)
 * 3. Filters companies based on search text (company name)
 * 4. Provides navigation to edit company details
 * 5. Uses Redux to get company data
 * 6. Real-time filtering as user types
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
// Line 3: Import Avatar components for displaying company logo
// Avatar, AvatarImage, AvatarFallback = Components for displaying user/company images with fallback
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
// Line 4: Import Popover components for dropdown menu
// Popover, PopoverContent, PopoverTrigger = Components for showing a popup menu
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
// Line 5: Import icons from lucide-react
// Edit2 = Edit icon (pencil)
// MoreHorizontal = Three horizontal dots icon (menu)
import { Edit2, MoreHorizontal } from 'lucide-react'
// Line 6: Import useSelector hook from react-redux
// useSelector = Hook to access Redux store state
import { useSelector } from 'react-redux'
// Line 7: Import useNavigate hook from react-router-dom
// useNavigate = Hook for programmatic navigation
import { useNavigate } from 'react-router-dom'

// Line 9: Define CompaniesTable functional component
// const CompaniesTable = () => { ... } = Arrow function component that returns JSX
const CompaniesTable = () => {
    // Line 10: Get companies data and search text from Redux store
    // useSelector = Hook to access Redux store
    // store => store.company = Access the 'company' slice from Redux store
    // { companies, searchCompanyByText } = Destructure 'companies' array and 'searchCompanyByText' string
    const { companies, searchCompanyByText } = useSelector(store => store.company);
    // Line 11: State to store filtered companies
    // useState = Hook to create state variable
    // companies = Initial value (all companies before filtering)
    // filterCompany = State variable containing filtered companies
    // setFilterCompany = Function to update filterCompany state
    const [filterCompany, setFilterCompany] = useState(companies);
    // Line 12: Get navigate function for routing
    // useNavigate = Hook that returns a function to navigate to different routes
    // navigate = Function to programmatically navigate (e.g., navigate('/path'))
    const navigate = useNavigate();
    
    // Line 14: useEffect hook to filter companies when search text or companies change
    // useEffect = Hook that runs after component renders
    // (() => { ... }, [dependencies]) = Function to run and array of dependencies
    // [companies, searchCompanyByText] = Dependencies: re-run effect when these change
    useEffect(() => {
        // Line 15: Filter companies based on search text
        // companies.length >= 0 = Check if companies array exists (always true, but ensures array exists)
        // && = Logical AND operator (short-circuit evaluation)
        // companies.filter = Array method to create new array with filtered items
        // (company) => { ... } = Arrow function that returns true/false for each company
        const filteredCompany = companies.length >= 0 && companies.filter((company) => {
            // Line 16: If no search text, show all companies
            // if (!searchCompanyByText) = Check if search text is empty/null/undefined
            // ! = Logical NOT operator
            if (!searchCompanyByText) {
                // Line 17: Return true to include this company in filtered results
                return true
            };
            // Line 19: Check if company name matches search text
            // return = Return boolean: true if match found, false otherwise
            // company?.name?.toLowerCase() = Get company name in lowercase (safely)
            // .includes(searchCompanyByText.toLowerCase()) = Check if name contains search text (case-insensitive)
            // ?. = Optional chaining to safely access nested properties
            return company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase());
        });
        // Line 21: Update filterCompany state with filtered results
        // setFilterCompany = Function to update state
        // filteredCompany = New array containing only matching companies
        setFilterCompany(filteredCompany);
    // Line 22: Dependencies array: re-run effect when companies or searchCompanyByText changes
    }, [companies, searchCompanyByText])

    // Line 24: Return JSX to render the component
    return (
        <div>
            {/* Line 26: Table component from UI library - <Table> is a reusable table component with styling */}
            <Table>
                {/* Line 27: Table caption - "A list of your recent registered companies" describes what the table shows */}
                <TableCaption>A list of your recent registered companies</TableCaption>
                {/* Line 28: Table header section (column headers) */}
                <TableHeader>
                    {/* Line 29: Table header row */}
                    <TableRow>
                        {/* Line 30: Header cell for "Logo" column */}
                        <TableHead>Logo</TableHead>
                        {/* Line 31: Header cell for "Name" column */}
                        <TableHead>Name</TableHead>
                        {/* Line 32: Header cell for "Date" column */}
                        <TableHead>Date</TableHead>
                        {/* Line 33: Header cell for "Action" column (right-aligned) - className="text-right" aligns text to the right */}
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                {/* Line 36: Table body section (data rows) */}
                <TableBody>
                    {/* Line 37: Map over filtered companies to create table rows - filterCompany?.map iterates over filtered companies array */}
                    {
                        filterCompany?.map((company) => (
                            /* Line 39: Table row for each company - key={company._id} is React key prop using company ID */
                            <TableRow key={company._id}>
                                {/* Line 40: Cell displaying company logo */}
                                <TableCell>
                                    {/* Line 41: Avatar component for company logo - <Avatar> displays circular image/icon */}
                                    <Avatar>
                                        {/* Line 42: Company logo image - src={company.logo} is image source URL from company object */}
                                        <AvatarImage src={company.logo} />
                                        {/* Line 43: Fallback initial if logo doesn't load - {company.name?.charAt(0)} shows first letter of company name */}
                                        <AvatarFallback>{company.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                {/* Line 46: Cell displaying company name - {company.name} displays company name */}
                                <TableCell>{company.name}</TableCell>
                                {/* Line 47: Cell displaying company registration date - {company.createdAt?.split("T")[0]} extracts date part from ISO timestamp */}
                                <TableCell>{company.createdAt?.split("T")[0]}</TableCell>
                                {/* Line 48: Cell for action buttons (right-aligned, clickable) - className="text-right cursor-pointer" right-aligns text and shows pointer cursor */}
                                <TableCell className="text-right cursor-pointer">
                                    {/* Line 49: Popover component for dropdown menu */}
                                    <Popover>
                                        {/* Line 50: Trigger button for popover - MoreHorizontal icon opens the popover */}
                                        <PopoverTrigger><MoreHorizontal /></PopoverTrigger>
                                        {/* Line 51: Popover content (dropdown menu) - className="w-32" sets width to 128px */}
                                        <PopoverContent className="w-32">
                                            {/* Line 52: Menu item to edit company - onClick navigates to company edit page */}
                                            <div onClick={() => navigate(`/admin/companies/${company._id}`)} className='flex items-center gap-2 w-fit cursor-pointer'>
                                                {/* Line 53: Edit icon for "Edit" action - className='w-4' sets width to 16px */}
                                                <Edit2 className='w-4' />
                                                {/* Line 54: Menu item text */}
                                                <span>Edit</span>
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

// Line 68: Export component as default export
// export default = Make this component available for import in other files
export default CompaniesTable
