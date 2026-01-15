/**
 * ===================================================================================
 *                    useGetCompanyById - Custom Hook for Fetching Single Company
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Custom React hook that fetches a single company by ID from the backend API.
 * 
 * ===================================================================================
 */

// Line 1: Import setSingleCompany action from Redux company slice
import { setSingleCompany } from '@/redux/companySlice'
// Line 2: Import COMPANY_API_END_POINT constant
import { COMPANY_API_END_POINT } from '@/utils/constants'
// Line 3: Import axios for HTTP requests
import axios from 'axios'
// Line 4: Import useEffect hook
import { useEffect } from 'react'
// Line 5: Import useDispatch hook from Redux
import { useDispatch } from 'react-redux'

// Line 7: Define custom hook useGetCompanyById that takes companyId as parameter
const useGetCompanyById = (companyId) => {
    // Line 8: Get dispatch function from Redux
    const dispatch = useDispatch();
    
    // Line 10: useEffect hook runs when component mounts or companyId changes
    useEffect(() => {
        // Line 11: Early return if companyId is not provided
        if (!companyId) return;
        
        // Line 13: Define async function to fetch company by ID
        const fetchCompany = async () => {
            try {
                // Line 14: Make GET request to company API endpoint with companyId
                const res = await axios.get(`${COMPANY_API_END_POINT}/get/${companyId}`, {
                    headers: {
                        // Line 15: Add Authorization header with JWT token
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Line 20: If response indicates success, dispatch company to Redux
                if (res.data.success) {
                    // Line 21: Dispatch setSingleCompany action with company object
                    dispatch(setSingleCompany(res.data.company));
                }
            } catch (error) {
                // Line 23: Log error if API call fails
                console.log('Error fetching company:', error);
            }
        }
        // Line 26: Call fetchCompany function
        fetchCompany();
    }, [dispatch, companyId]) // Line 27: Dependencies: re-run when dispatch or companyId changes
}

// Line 30: Export the hook as default
export default useGetCompanyById

