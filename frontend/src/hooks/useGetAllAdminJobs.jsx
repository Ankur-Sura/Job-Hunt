/**
 * ===================================================================================
 *                    useGetAllAdminJobs - Custom Hook for Fetching Admin Jobs
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Custom React hook that fetches all jobs for admin/hirer view.
 * 
 * ===================================================================================
 */

// Line 1: Import setAllAdminJobs action from Redux job slice
import { setAllAdminJobs } from '@/redux/jobSlice'
// Line 2: Import JOB_API_END_POINT constant
import { JOB_API_END_POINT } from '@/utils/constants'
// Line 3: Import axios for HTTP requests
import axios from 'axios'
// Line 4: Import useEffect hook
import { useEffect } from 'react'
// Line 5: Import useDispatch hook from Redux
import { useDispatch } from 'react-redux'

// Line 7: Define custom hook useGetAllAdminJobs
const useGetAllAdminJobs = () => {
    // Line 8: Get dispatch function from Redux
    const dispatch = useDispatch();
    
    // Line 10: useEffect hook runs when component mounts
    useEffect(() => {
        // Line 11: Define async function to fetch admin jobs
        const fetchAdminJobs = async () => {
            try {
                // Line 12: Make GET request to jobs API endpoint
                const res = await axios.get(`${JOB_API_END_POINT}`, {
                    headers: {
                        // Line 13: Add Authorization header with JWT token
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Line 18: If response contains jobs array, dispatch to Redux
                if (res.data.jobs) {
                    // Line 19: Dispatch setAllAdminJobs action with jobs array
                    dispatch(setAllAdminJobs(res.data.jobs));
                }
            } catch (error) {
                // Line 21: Log error if API call fails
                console.log('Error fetching admin jobs:', error);
            }
        }
        // Line 24: Call fetchAdminJobs function
        fetchAdminJobs();
    }, [dispatch]) // Line 25: Dependencies: re-run when dispatch changes
}

// Line 28: Export the hook as default
export default useGetAllAdminJobs

