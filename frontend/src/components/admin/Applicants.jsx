import React, { useEffect } from 'react'
import Header from '../Header'
import ApplicantsTable from './ApplicantsTable'
import axios from 'axios';
import { APPLICATION_API_END_POINT } from '@/utils/constants';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAllApplicants } from '@/redux/applicationSlice';

const Applicants = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const { applicants } = useSelector(store => store.application);

    useEffect(() => {
        const fetchAllApplicants = async () => {
            try {
                const res = await axios.get(`${APPLICATION_API_END_POINT}?jobId=${params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (res.data.applications) {
                    // Format data to match expected structure
                    dispatch(setAllApplicants({
                        applications: res.data.applications
                    }));
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchAllApplicants();
    }, [params.id, dispatch]);

    return (
        <div>
            <Header showLogin={false} />
            <div className='max-w-7xl mx-auto px-6'>
                <h1 className='font-bold text-xl my-5'>Applicants {applicants?.applications?.length || 0}</h1>
                <ApplicantsTable />
            </div>
        </div>
    )
}

export default Applicants

