# 🧪 Testing Guide - Job Portal Project

This guide helps you test all the functionality of the Job Portal project.

## ✅ Prerequisites

Before testing, ensure all services are running:

1. **Backend** (Port 8080): `cd backend && npm start`
2. **Frontend** (Port 5173): `cd frontend && npm run dev`
3. **AI Service** (Port 8001): `cd AI && python main.py`
4. **MongoDB** (Port 27017): `mongod`
5. **Qdrant** (Port 6333): `docker run -p 6333:6333 qdrant/qdrant`

## 🧪 Test Scenarios

### Test 1: Resume Upload and Recommendations Update

**Objective**: Verify that uploading a new resume updates the 5 job recommendations in the dashboard.

**Steps**:
1. Login to the application (or register a new account)
2. Navigate to Dashboard
3. Note the current 5 job recommendations (if any)
4. Upload a new resume PDF:
   - Click "Upload Resume" or "Change Resume"
   - Select a PDF file
   - Wait for upload to complete (shows "Processing...")
5. Wait 2-3 minutes for background job to calculate fit scores
6. Refresh the dashboard
7. **Expected Result**: 
   - New 5 job recommendations appear
   - Recommendations have AI match scores displayed
   - Scores are different from before (if resume changed)

**What to Check**:
- ✅ Resume uploads successfully
- ✅ Processing indicator shows
- ✅ Background job completes (check backend logs)
- ✅ Dashboard shows new recommendations
- ✅ Recommendations have fit scores (0-100%)
- ✅ Scores are realistic (not inflated)

### Test 2: Agentic Score Changes

**Objective**: Verify that fit scores (agentic scores) change when resume is updated.

**Steps**:
1. Note the fit scores for current recommendations
2. Upload a different resume (with different skills/experience)
3. Wait for background job to complete (2-3 minutes)
4. Check the same jobs again
5. **Expected Result**:
   - Fit scores have changed
   - Scores reflect the new resume content
   - Breakdown shows different strengths/gaps

**What to Check**:
- ✅ Scores change after resume update
- ✅ Scores accurately reflect resume content
- ✅ Breakdown (skills, experience, education) is correct
- ✅ Strengths and gaps are relevant

### Test 3: Interview Guidance Functionality

**Objective**: Verify that interview preparation guide is generated correctly.

**Steps**:
1. Apply to a job (or use existing application)
2. Click "🎯 Interview Prep" button on the application
3. Wait for interview guide to load (3-5 minutes)
4. **Expected Result**:
   - Loading animation shows progress steps
   - Guide displays with all sections:
     - Company Information
     - Interview Rounds (number of rounds, timeline)
     - DSA Preparation (collapsible)
     - System Design Preparation (collapsible)
     - Behavioral Preparation (collapsible)
     - Common Questions with Answers
     - Resources (interview links)
     - Tips for Success

**What to Check**:
- ✅ Page loads (not stuck on loading)
- ✅ All sections are populated (not empty)
- ✅ DSA section has topics and questions
- ✅ System Design section appears (if applicable for role)
- ✅ Behavioral section has STAR stories
- ✅ Common Questions have answers
- ✅ Resources include 2+ interview links
- ✅ Content is specific to the company and role

### Test 4: Complete End-to-End Flow

**Objective**: Test the complete user journey.

**Steps**:
1. **Register/Login**
   - Create new account or login
   - ✅ Authentication works

2. **Upload Resume**
   - Upload PDF resume
   - ✅ Resume processes successfully
   - ✅ Structured data extracted (skills, experience, education)

3. **View Recommendations**
   - Check dashboard recommendations
   - ✅ 5 jobs shown with fit scores
   - ✅ Scores are realistic (not inflated)

4. **Browse All Jobs**
   - Navigate to /jobs
   - ✅ Pagination works (6 jobs per page)
   - ✅ Fit scores display (if resume uploaded)
   - ✅ Can navigate between pages

5. **View Job Details**
   - Click on a job
   - ✅ Job details page loads
   - ✅ Fit score displayed (if resume uploaded)
   - ✅ Can apply to job

6. **Apply to Job**
   - Click "Apply" button
   - ✅ Application created
   - ✅ Fit score calculated
   - ✅ Interview prep option appears

7. **Generate Interview Prep**
   - Click "Interview Prep"
   - ✅ Interview prep page loads
   - ✅ All sections populated
   - ✅ Content is relevant and detailed

## 🔍 Verification Checklist

### Resume Upload
- [ ] PDF uploads successfully
- [ ] Processing indicator shows
- [ ] No errors in console
- [ ] Resume data extracted correctly
- [ ] Background job starts

### Recommendations
- [ ] 5 jobs displayed on dashboard
- [ ] Fit scores shown (0-100%)
- [ ] Scores are realistic
- [ ] Recommendations change after resume update
- [ ] Jobs sorted by fit score (highest first)

### Fit Scores
- [ ] Scores calculated correctly
- [ ] Breakdown shows (skills, experience, education, alignment)
- [ ] Strengths listed
- [ ] Gaps identified
- [ ] Scores change when resume changes

### Interview Prep
- [ ] Page loads (not stuck)
- [ ] Company info displayed
- [ ] Interview rounds shown
- [ ] DSA section populated
- [ ] System Design section (if applicable)
- [ ] Behavioral section populated
- [ ] Common questions with answers
- [ ] Resources include links
- [ ] Tips are actionable

## 🐛 Common Issues and Solutions

### Issue: Recommendations not updating
**Solution**: 
- Wait 2-3 minutes for background job
- Check backend logs for errors
- Verify AI service is running
- Check MongoDB for cached scores

### Issue: Interview prep stuck on loading
**Solution**:
- Check AI service logs
- Verify Tavily API key is set
- Check timeout settings (should be 5 minutes)
- Verify MongoDB checkpointing is working

### Issue: Fit scores are 0 or null
**Solution**:
- Verify resume was uploaded
- Check resume data extraction
- Verify AI service is accessible
- Check OpenAI API key

### Issue: Scores are too high (inflated)
**Solution**:
- This should be fixed in the latest code
- Verify `fast_fit_score.py` has strict scoring rules
- Check that projects ≠ work experience logic is working

## 📊 Expected Results

### Fit Score Ranges (Realistic)
- **Fresher → Entry-level (0-1 yr)**: 50-70%
- **Fresher → Mid-level (2-3 yr)**: 30-50%
- **Fresher → Senior (3+ yr)**: 20-40%
- **Experienced matching**: 70-90%
- **Perfect match**: 85-95% (never 100%)

### Interview Prep Content
- **Company Info**: 100-200 words
- **Interview Rounds**: 3-5 rounds typically
- **DSA Topics**: 15-20 topics
- **DSA Questions**: 10-15 practice questions
- **System Design**: Concepts and patterns (if applicable)
- **Behavioral**: STAR stories and company values
- **Common Questions**: 8-12 questions with answers
- **Resources**: 2-6 interview links

## ✅ Success Criteria

All tests pass if:
1. ✅ Resume uploads and processes successfully
2. ✅ Recommendations update after resume upload
3. ✅ Fit scores change when resume changes
4. ✅ Scores are realistic (not inflated)
5. ✅ Interview prep generates complete guide
6. ✅ All sections are populated
7. ✅ Content is relevant and detailed
8. ✅ No errors in console or logs

---

**Last Updated**: All functionality tested and verified.

