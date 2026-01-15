import React, { useState, useEffect } from 'react'
import Header from '../Header'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useSelector } from 'react-redux'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constants'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useGetAllCompanies from '@/hooks/useGetAllCompanies'

const PostJob = () => {
    const { user } = useAuth();
    const [input, setInput] = useState({
        title: "",
        description: "",
        requirements: "",
        skills: "",  // Added skills field
        salary: "",
        location: "",
        jobType: "Full Time",
        jobMode: "On-Site",  // Added jobMode field
        experience: "",
        position: 0,
        companyId: ""
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    useGetAllCompanies();
    const { companies } = useSelector(store => store.company);
    
    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const selectChangeHandler = (value) => {
        const selectedCompany = companies.find((company) => company.name.toLowerCase() === value);
        setInput({ ...input, companyId: selectedCompany._id });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Get token from auth context or localStorage
            const token = user?.token || localStorage.getItem('token');
            
            // Parse skills and requirements into arrays
            const skillsArray = input.skills ? input.skills.split(',').map(s => s.trim()).filter(s => s) : [];
            
            const res = await axios.post(`${JOB_API_END_POINT}`, {
                ...input,
                skills: skillsArray,  // Send skills as array
                salary: Number(input.salary),
                position: Number(input.position),
                experience: Number(input.experience),
                companyId: input.companyId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.data.job || res.data.success) {
                toast.success("Job posted successfully!");
                // Navigate to recruiter dashboard if user is hirer, otherwise admin jobs
                if (user?.role === 'hirer') {
                    navigate("/recruiter/dashboard");
                } else {
                    navigate("/admin/jobs");
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to post job");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Header showLogin={false} />
            <div className='flex items-center justify-center w-screen my-5'>
                <form onSubmit={submitHandler} className='p-8 max-w-4xl border border-gray-200 shadow-lg rounded-md'>
                    <div className='grid grid-cols-2 gap-2'>
                        <div>
                            <Label>Title</Label>
                            <Input
                                type="text"
                                name="title"
                                value={input.title}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <Label>Description</Label>
                            <textarea
                                name="description"
                                value={input.description}
                                onChange={changeEventHandler}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all my-1 min-h-[150px] resize-y"
                                placeholder="Enter detailed job description including responsibilities, requirements, and what the company offers..."
                                required
                            />
                        </div>
                        <div>
                            <Label>Requirements (comma separated)</Label>
                            <Input
                                type="text"
                                name="requirements"
                                value={input.requirements}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                placeholder="Bachelor's degree, Strong problem-solving skills"
                                required
                            />
                        </div>
                        <div>
                            <Label>Skills (comma separated) *</Label>
                            <Input
                                type="text"
                                name="skills"
                                value={input.skills}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                placeholder="React, Node.js, MongoDB, Python"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Required for AI match score calculation</p>
                        </div>
                        <div>
                            <Label>Salary</Label>
                            <Input
                                type="number"
                                name="salary"
                                value={input.salary}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input
                                type="text"
                                name="location"
                                value={input.location}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>Job Type</Label>
                            <Select 
                                name="jobType"
                                value={input.jobType}
                                onValueChange={(value) => setInput({ ...input, jobType: value })}
                            >
                                <SelectTrigger className="w-full my-1">
                                    <SelectValue placeholder="Select Job Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Full Time">Full Time</SelectItem>
                                    <SelectItem value="Part Time">Part Time</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                    <SelectItem value="Internship">Internship</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Work Mode</Label>
                            <Select 
                                name="jobMode"
                                value={input.jobMode}
                                onValueChange={(value) => setInput({ ...input, jobMode: value })}
                            >
                                <SelectTrigger className="w-full my-1">
                                    <SelectValue placeholder="Select Work Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="On-Site">On-Site</SelectItem>
                                    <SelectItem value="Remote">Remote</SelectItem>
                                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    <SelectItem value="Work From Home">Work From Home</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Experience Level (years)</Label>
                            <Input
                                type="number"
                                name="experience"
                                value={input.experience}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>No of Positions</Label>
                            <Input
                                type="number"
                                name="position"
                                value={input.position}
                                onChange={changeEventHandler}
                                className="focus-visible:ring-offset-0 focus-visible:ring-0 my-1"
                                required
                            />
                        </div>
                        {
                            companies.length > 0 && (
                                <div className="col-span-2">
                                    <Label>Select Company</Label>
                                    <Select onValueChange={selectChangeHandler}>
                                        <SelectTrigger className="w-full my-1">
                                            <SelectValue placeholder="Select a Company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {
                                                    companies.map((company) => {
                                                        return (
                                                            <SelectItem key={company._id} value={company?.name?.toLowerCase()}>{company.name}</SelectItem>
                                                        )
                                                    })
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )
                        }
                    </div>
                    {
                        loading ? <Button className="w-full my-4" disabled> <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Please wait </Button> : <Button type="submit" className="w-full my-4">Post New Job</Button>
                    }
                    {
                        companies.length === 0 && <p className='text-xs text-red-600 font-bold text-center my-3'>*Please register a company first, before posting a job</p>
                    }
                </form>
            </div>
        </div>
    )
}

export default PostJob

