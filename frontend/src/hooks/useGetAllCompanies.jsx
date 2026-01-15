/**
 * ===================================================================================
 *                    useGetAllCompanies - Custom Hook for Fetching All Companies
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Custom React hook that fetches all companies from the backend API.
 * 
 * ===================================================================================
 */

// Line 1: Import setCompanies action from Redux company slice
import { setCompanies } from '@/redux/companySlice'
// Line 2: Import COMPANY_API_END_POINT constant
import { COMPANY_API_END_POINT } from '@/utils/constants'
// Line 3: Import axios for HTTP requests
import axios from 'axios'
// Line 4: Import useEffect hook
import { useEffect } from 'react'
// Line 5: Import useDispatch hook from Redux
import { useDispatch } from 'react-redux'

// Line 7: Define custom hook useGetAllCompanies
const useGetAllCompanies = () => {
    // Line 8: Get dispatch function from Redux
    const dispatch = useDispatch();
    
    // Line 10: useEffect hook runs when component mounts
    useEffect(() => {
        // Line 11: Define async function to fetch companies
        const fetchCompanies = async () => {
            try {
                // Line 12: Make GET request to companies API endpoint
                const res = await axios.get(`${COMPANY_API_END_POINT}/get`, {
                    headers: {
                        // Line 13: Add Authorization header with JWT token
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Line 18: If response indicates success, dispatch companies to Redux
                if (res.data.success) {
                    // Line 19: Dispatch setCompanies action with companies array
                    dispatch(setCompanies(res.data.companies));
                }
            } catch (error) {
                // Line 21: Log error if API call fails
                console.log('Error fetching companies:', error);
            }
        }
        // Line 24: Call fetchCompanies function
        fetchCompanies();
    }, [dispatch]) // Line 25: Dependencies: re-run when dispatch changes
}

// Line 28: Export the hook as default
export default useGetAllCompanies

