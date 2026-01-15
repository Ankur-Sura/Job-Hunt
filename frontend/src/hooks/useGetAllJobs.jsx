/**
 * ===================================================================================
 *                    useGetAllJobs - Custom Hook for Fetching All Jobs
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Custom React hook that fetches all jobs from the backend API and stores them in Redux.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. On mount or when searchedQuery changes, fetches jobs from API
 * 2. Dispatches jobs to Redux store
 * 3. Components using this hook automatically get updated jobs
 * 
 * ===================================================================================
 */

// Line 1: Import setAllJobs action from Redux job slice
import { setAllJobs } from '@/redux/jobSlice'
// Line 2: Import JOB_API_END_POINT constant for API URL
import { JOB_API_END_POINT } from '@/utils/constants'
// Line 3: Import axios for HTTP requests
import axios from 'axios'
// Line 4: Import useEffect hook for side effects
import { useEffect } from 'react'
// Line 5: Import useDispatch and useSelector hooks from Redux
import { useDispatch, useSelector } from 'react-redux'

// Line 7: Define custom hook useGetAllJobs
const useGetAllJobs = () => {
    // Line 8: Get dispatch function from Redux
    const dispatch = useDispatch();
    // Line 9: Get searchedQuery from Redux job state
    const { searchedQuery } = useSelector(store => store.job);
    
    // Line 11: useEffect hook runs when component mounts or searchedQuery changes
    useEffect(() => {
        // Line 12: Define async function to fetch all jobs
        const fetchAllJobs = async () => {
            try {
                // Line 13: Make GET request to jobs API endpoint with limit=100
                const res = await axios.get(`${JOB_API_END_POINT}?limit=100`, {
                    headers: {
                        // Line 14: Add Authorization header with JWT token from localStorage
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Line 19: If response contains jobs array, dispatch to Redux
                if (res.data.jobs) {
                    // Line 20: Dispatch setAllJobs action with jobs array
                    dispatch(setAllJobs(res.data.jobs));
                }
            } catch (error) {
                // Line 22: Log error if API call fails
                console.log('Error fetching jobs:', error);
            }
        }
        // Line 25: Call fetchAllJobs function
        fetchAllJobs();
    }, [dispatch, searchedQuery]) // Line 26: Dependencies: re-run when dispatch or searchedQuery changes
}

// Line 29: Export the hook as default
export default useGetAllJobs

