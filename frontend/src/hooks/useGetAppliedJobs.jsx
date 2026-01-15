/**
 * ===================================================================================
 *                    useGetAppliedJobs - Custom Hook for Fetching Applied Jobs
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Custom React hook that fetches all jobs the user has applied to.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. On mount, fetches user's applications from API
 * 2. Dispatches applications to Redux store
 * 
 * ===================================================================================
 */

// Line 1: Import setAllAppliedJobs action from Redux job slice
import { setAllAppliedJobs } from '@/redux/jobSlice'
// Line 2: Import APPLICATION_API_END_POINT constant
import { APPLICATION_API_END_POINT } from '@/utils/constants'
// Line 3: Import axios for HTTP requests
import axios from 'axios'
// Line 4: Import useEffect hook
import { useEffect } from 'react'
// Line 5: Import useDispatch hook from Redux
import { useDispatch } from 'react-redux'

// Line 7: Define custom hook useGetAppliedJobs
const useGetAppliedJobs = () => {
    // Line 8: Get dispatch function from Redux
    const dispatch = useDispatch();
    
    // Line 10: useEffect hook runs when component mounts
    useEffect(() => {
        // Line 11: Define async function to fetch applied jobs
        const fetchAppliedJobs = async () => {
            try {
                // Line 12: Make GET request to applications API endpoint
                const res = await axios.get(`${APPLICATION_API_END_POINT}`, {
                    headers: {
                        // Line 13: Add Authorization header with JWT token
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Line 18: If response contains applications array, dispatch to Redux
                if (res.data.applications) {
                    // Line 19: Dispatch setAllAppliedJobs action with applications array
                    dispatch(setAllAppliedJobs(res.data.applications));
                }
            } catch (error) {
                // Line 21: Log error if API call fails
                console.log('Error fetching applied jobs:', error);
            }
        }
        // Line 24: Call fetchAppliedJobs function
        fetchAppliedJobs();
    }, [dispatch]) // Line 25: Dependencies: re-run when dispatch changes
}

// Line 28: Export the hook as default
export default useGetAppliedJobs

