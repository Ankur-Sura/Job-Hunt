const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8005';
const AI_TIMEOUT = 300000; // 5 minutes for regular operations
const AI_LONG_TIMEOUT = 300000; // 5 minutes for LangGraph operations

/**
 * Centralized AI Service Client
 * Handles all communication with the AI service with retry logic
 */
class AIService {
  constructor() {
    this.baseURL = AI_SERVICE_URL;
    this.timeout = AI_TIMEOUT;
    this.longTimeout = AI_LONG_TIMEOUT;
    this.isHealthy = false;
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 30000; // Check every 30 seconds
  }

  /**
   * Retry wrapper for API calls
   */
  async withRetry(operation, retries = 2, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const isConnectionError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
        
        if (isLastAttempt || (!isTimeout && !isConnectionError)) {
          throw error;
        }
        
        console.log(`⚠️ AI Service attempt ${attempt}/${retries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  /**
   * Health check for AI service (with caching and retry logic)
   */
  async healthCheck(force = false) {
    const now = Date.now();
    
    // Return cached result if recent (unless forced)
    if (!force && now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isHealthy;
    }
    
    // Retry logic: try up to 3 times with increasing timeouts
    const retries = 3;
    const timeouts = [5000, 10000, 15000]; // 5s, 10s, 15s
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.get(`${this.baseURL}/health`, {
          timeout: timeouts[attempt],
          validateStatus: (status) => status < 500 // Accept 4xx as "service is up"
        });
        
        // Check if response indicates service is running
        if (response.data && (response.data.status === 'ok' || response.status === 200)) {
          this.isHealthy = true;
          this.lastHealthCheck = now;
          return true;
        }
      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const isConnectionError = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT';
        
        // If it's the last attempt, log and return false
        if (attempt === retries - 1) {
          if (isTimeout) {
            console.warn('⚠️ AI Service health check timed out after all retries');
          } else if (isConnectionError) {
            console.warn('⚠️ AI Service is not reachable (connection refused)');
          } else {
            console.error('AI Service health check failed:', error.message);
          }
          this.isHealthy = false;
          this.lastHealthCheck = now;
          return false;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    this.isHealthy = false;
    this.lastHealthCheck = now;
    return false;
  }

  /**
   * Check if AI service is available before operations
   */
  async ensureServiceAvailable() {
    const isAvailable = await this.healthCheck();
    if (!isAvailable) {
      console.warn('⚠️ AI Service not available, operations may fail');
    }
    return isAvailable;
  }

  /**
   * Upload PDF to AI service for OCR and indexing
   */
  async uploadPDF(fileBuffer, filename, mimetype) {
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('file', fileBuffer, {
        filename,
        contentType: mimetype
      });

      const response = await axios.post(`${this.baseURL}/pdf/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        },
        timeout: this.timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PDF upload error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Delete PDF from Qdrant
   * Removes all chunks associated with a pdf_id from Qdrant
   */
  async deletePDF(pdfId) {
    try {
      const response = await axios.delete(`${this.baseURL}/pdf/delete/${pdfId}`, {
        timeout: 30000 // 30 seconds
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Don't fail if deletion fails - it might not exist
      console.warn('PDF deletion warning:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Query PDF using RAG
   */
  async queryPDF(pdfId, question, threadId = null) {
    try {
      const response = await axios.post(
        `${this.baseURL}/pdf/query`,
        {
          pdf_id: pdfId,
          question,
          thread_id: threadId || `default-${Date.now()}`
        },
        {
          timeout: this.timeout
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PDF query error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        data: null
      };
    }
  }

  /**
   * Extract structured resume data
   */
  async extractResumeData(pdfId, userId) {
    const extractionPrompt = `Extract all information from this resume and return ONLY a valid JSON object with this exact structure:

{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number if available",
    "location": "city, country if available"
  },
  "skills": ["skill1", "skill2", "skill3"],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/College",
      "year": "Graduation year",
      "field": "Field of study"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End dates",
      "description": "Job description"
    }
  ],
  "internships": [
    {
      "title": "Internship Title",
      "company": "Company Name",
      "duration": "Duration"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["language1", "language2"],
  "summary": "Professional summary if available"
}

IMPORTANT: Return ONLY the JSON object, no additional text or explanation.`;

    const result = await this.queryPDF(pdfId, extractionPrompt, `resume-extract-${userId}`);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        data: null
      };
    }

    // Parse JSON from response
    try {
      const answer = result.data.answer;
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const resumeData = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: resumeData
        };
      } else {
        // Fallback: return raw text
        return {
          success: true,
          data: {
            rawText: answer,
            extracted: false
          }
        };
      }
    } catch (parseError) {
      console.error('Resume data parsing error:', parseError);
      return {
        success: true,
        data: {
          rawText: result.data.answer,
          extracted: false
        }
      };
    }
  }

  /**
   * =============================================================================
   *                     CALCULATE FIT SCORE
   * =============================================================================
   * 
   * 📖 WHAT IT DOES:
   * ----------------
   * Calculates how well a resume matches a job requirement (0-100%).
   * Uses AI (GPT-4) to analyze resume and job data.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Checks if candidate has real work experience (not just projects)
   * 2. Builds detailed prompt with resume and job data
   * 3. Calls AI service to analyze and calculate score
   * 4. Parses JSON response with score breakdown
   * 5. Returns structured fit score data
   * 
   * 📌 SCORING COMPONENTS (Weighted):
   * ---------------------------------
   * - Skills Match: 40% (how many required skills match)
   * - Experience Match: 30% (years of experience alignment)
   * - Education Match: 20% (degree/qualification match)
   * - Overall Alignment: 10% (general fit assessment)
   * 
   * ⚠️ IMPORTANT:
   * -------------
   * - Projects are NOT work experience (heavily penalized for senior roles)
   * - Internships count as 50% of real experience
   * - Freshers get realistic scores based on job requirements
   * 
   * 📌 PARAMETERS:
   * --------------
   * @param {string} pdfId - PDF ID in Qdrant for RAG retrieval
   * @param {Object} resumeData - Extracted resume data (skills, experience, etc.)
   * @param {Object} job - Job document from MongoDB
   * @param {string} userId - User ID for caching
   * @param {string} jobId - Job ID for caching
   * 
   * 📌 RETURNS:
   * -----------
   * {
   *   fitScore: 75,
   *   breakdown: {
   *     skillsMatch: 80,
   *     experienceMatch: 70,
   *     educationMatch: 90,
   *     overallAlignment: 60
   *   },
   *   strengths: ["Strong Python skills", "Relevant projects"],
   *   gaps: ["Missing React experience"],
   *   recommendation: "Recommended"
   * }
   * 
   * =============================================================================
   */
  /**
   * Calculate fit score using fast endpoint (preferred method)
   * Falls back to direct AI call if fast endpoint fails
   */
  async calculateFitScoreFast(resumeData, job) {
    try {
      const response = await axios.post(
        `${this.baseURL}/fast/batch-fit-scores`,
        {
          resume_data: resumeData,
          jobs: [{
            _id: job._id?.toString() || 'temp',
            title: job.title,
            company: job.company,
            description: job.description,
            skills: job.skills || [],
            experience: job.experience || {},
            qualifications: job.qualifications || {}
          }]
        },
        {
          timeout: 30000 // 30 seconds
        }
      );

      if (response.data.success && response.data.scores && response.data.scores.length > 0) {
        const scoreData = response.data.scores[0];
        return {
          success: true,
          fitScore: scoreData.fitScore || 0,
          breakdown: scoreData.breakdown || {},
          strengths: scoreData.strengths || [],
          gaps: scoreData.gaps || [],
          recommendation: scoreData.recommendation || 'Consider'
        };
      }
      throw new Error('No score returned from fast endpoint');
    } catch (error) {
      console.error('Fast fit score calculation failed:', error.message);
      throw error;
    }
  }

  async calculateFitScore(pdfId, resumeData, job, userId, jobId) {
    // Check if candidate has real work experience
    const hasWorkExperience = resumeData?.experience && 
      Array.isArray(resumeData.experience) && 
      resumeData.experience.length > 0;
    const hasInternships = resumeData?.internships && 
      Array.isArray(resumeData.internships) && 
      resumeData.internships.length > 0;
    const projectCount = resumeData?.projects?.length || 0;
    
    const experienceContext = hasWorkExperience 
      ? `Has ${resumeData.experience.length} work experience(s)` 
      : `⚠️ NO WORK EXPERIENCE (only ${projectCount} projects, ${hasInternships ? 'has' : 'no'} internships)`;

    const fitScorePrompt = `You are a STRICT and REALISTIC recruiter. Analyze this candidate's resume against the job requirements and calculate an ACCURATE fit score.

CANDIDATE RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

EXPERIENCE STATUS: ${experienceContext}

JOB REQUIREMENTS:
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description}
- Required Skills: ${job.skills?.join(', ') || 'Not specified'}
- Experience Required: ${job.experience?.display || 'Not specified'}
- Basic Qualifications: ${JSON.stringify(job.qualifications?.basic || [], null, 2)}
- Preferred Qualifications: ${JSON.stringify(job.qualifications?.preferred || [], null, 2)}

⚠️ CRITICAL SCORING RULES - BE STRICT AND REALISTIC:

1. **Skills Match (40% weight)**
   - Only count skills explicitly mentioned in resume
   - Missing critical skills = major penalty

2. **Experience Match (30% weight)** - MOST IMPORTANT
   - REAL WORK EXPERIENCE = Jobs at companies (e.g., "Software Engineer at Google")
   - ❌ PROJECTS ARE NOT WORK EXPERIENCE - they show potential but NOT professional experience
   - If candidate has NO work experience:
     * For jobs requiring 0-1 years: Give 40-60% experience score
     * For jobs requiring 1-3 years: Give 20-40% experience score  
     * For jobs requiring 3+ years: Give 0-20% experience score
   - Internships = 50% of real experience value
   - Projects = 20-30% of real experience value (shows skills only)

3. **Education Match (20% weight)**
   - CS/IT degree = 100%, Related field (Math) = 70-80%, Unrelated = 40-50%

4. **Overall Alignment (10% weight)**

📊 REALISTIC SCORE RANGES:
- Fresher (no exp) + entry-level job (0-1 yr): 50-70%
- Fresher + mid-level job (2-3 yr): 30-50%
- Fresher + senior job (3+ yr): 20-40%
- Experienced matching requirements: 70-90%

🚫 DO NOT inflate scores for projects - they are NOT work experience!

Return ONLY a valid JSON object in this exact format:
{
  "fitScore": 55,
  "breakdown": {
    "skillsMatch": 80,
    "experienceMatch": 30,
    "educationMatch": 70,
    "overallAlignment": 50
  },
  "strengths": ["Strong technical skills", "Good projects"],
  "gaps": ["No professional work experience", "Job requires 2 years experience"],
  "recommendation": "Consider"
}

recommendation values: "Highly recommended" (80%+), "Recommended" (65-79%), "Consider" (50-64%), "Not recommended" (<50%)

IMPORTANT: Return ONLY the JSON object, no additional text. BE REALISTIC about experience gaps!`;

    // Try fast endpoint first (most reliable, doesn't require PDF in Qdrant)
    let result;
    try {
      console.log('🚀 Trying fast fit score endpoint...');
      const fastResult = await this.calculateFitScoreFast(resumeData, job);
      return fastResult; // Return immediately if fast method works
    } catch (fastError) {
      console.log('⚠️ Fast endpoint failed, trying direct AI call:', fastError.message);
      
      // Fallback 1: Direct AI call (doesn't require PDF in Qdrant)
      try {
        const aiResponse = await this.callAI(fitScorePrompt, 'gpt-4o-mini');
        
        // Parse JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const fitData = JSON.parse(jsonMatch[0]);
          result = {
            success: true,
            data: {
              answer: JSON.stringify(fitData)
            }
          };
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (directError) {
        console.log('⚠️ Direct AI call failed, trying queryPDF as last fallback:', directError.message);
        // Fallback 2: queryPDF (requires PDF in Qdrant)
        result = await this.queryPDF(
          pdfId,
          fitScorePrompt,
          `fit-${userId}-${jobId}`
        );
      }
    }

    if (!result.success) {
      console.error(`Fit score calculation failed for job ${jobId}:`, result.error);
      // Try to provide a basic score based on skills matching if RAG fails
      const resumeSkills = resumeData?.skills || [];
      const jobSkills = job.skills || [];
      const hasWorkExperience = resumeData?.experience && 
        Array.isArray(resumeData.experience) && 
        resumeData.experience.length > 0;
      const hasInternships = resumeData?.internships && 
        Array.isArray(resumeData.internships) && 
        resumeData.internships.length > 0;
      
      if (resumeSkills.length > 0 && jobSkills.length > 0) {
        // Improved skills matching as fallback
        const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase().trim());
        const jobSkillsLower = jobSkills.map(s => s.toLowerCase().trim());
        
        // Find matching skills (case-insensitive, partial matches)
        const matchingSkills = resumeSkillsLower.filter(rs => 
          jobSkillsLower.some(js => 
            js.includes(rs) || rs.includes(js) ||
            // Also check for common variations
            (rs.includes('javascript') && js.includes('js')) ||
            (rs.includes('react') && js.includes('react')) ||
            (rs.includes('node') && js.includes('node'))
          )
        );
        
        // Calculate match percentage
        const skillMatchPercent = jobSkills.length > 0 
          ? (matchingSkills.length / jobSkills.length) * 100 
          : 0;
        
        // Calculate REALISTIC experience score based on actual experience
        let experienceScore = 0;
        const gaps = [];
        
        if (hasWorkExperience) {
          experienceScore = 70; // Has real work experience
        } else if (hasInternships) {
          experienceScore = 45; // Internships count as partial experience
          gaps.push('No full-time work experience (has internships)');
        } else {
          experienceScore = 25; // Only projects, no real experience
          gaps.push('No professional work experience');
        }
        
        // Parse job experience requirement and adjust score
        const expRequired = (job.experience?.display || '').toLowerCase();
        if (expRequired.includes('3+') || expRequired.includes('3-5') || expRequired.includes('senior')) {
          if (!hasWorkExperience) {
            experienceScore = Math.min(experienceScore, 15);
            gaps.push('Job requires 3+ years experience');
          }
        } else if (expRequired.includes('2') || expRequired.includes('1-3')) {
          if (!hasWorkExperience) {
            experienceScore = Math.min(experienceScore, 30);
            gaps.push('Job requires 1-3 years experience');
          }
        }
        
        // Calculate final score with REALISTIC weights
        // Skills: 40%, Experience: 35%, Education: 15%, Base: 10%
        const skillsComponent = (skillMatchPercent / 100) * 40;
        const experienceComponent = (experienceScore / 100) * 35;
        const educationComponent = 12; // Assume decent education match
        const baseComponent = 8;
        
        const finalScore = Math.min(Math.round(
          skillsComponent + experienceComponent + educationComponent + baseComponent
        ), hasWorkExperience ? 90 : 70); // Cap at 70 for no experience
        
        // Add missing skills to gaps
        const missingSkills = jobSkillsLower
          .filter(js => !resumeSkillsLower.some(rs => js.includes(rs) || rs.includes(js)))
          .slice(0, 3)
          .map(g => `Missing skill: ${g}`);
        gaps.push(...missingSkills);
        
        return {
          success: true,
          fitScore: finalScore,
          breakdown: {
            skillsMatch: Math.round(skillMatchPercent),
            experienceMatch: experienceScore,
            educationMatch: 65,
            overallAlignment: finalScore
          },
          strengths: matchingSkills.length > 0 
            ? [`Matching skills: ${matchingSkills.slice(0, 5).join(', ')}`] 
            : ['Skills-based matching used'],
          gaps: gaps,
          recommendation: finalScore >= 80 ? 'Highly recommended' : 
                         finalScore >= 65 ? 'Recommended' : 
                         finalScore >= 50 ? 'Consider' : 'Not recommended'
        };
      }
      
      return {
        success: false,
        error: result.error,
        fitScore: 0,
        breakdown: {},
        strengths: [],
        gaps: [],
        recommendation: 'Error calculating fit'
      };
    }

    // Parse JSON response
    try {
      const answer = result.data.answer;
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const fitData = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          ...fitData
        };
      } else {
        // Fallback: extract number
        const scoreMatch = answer.match(/\b(\d{1,3})\b/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        return {
          success: true,
          fitScore: score,
          breakdown: {},
          strengths: [],
          gaps: [],
          recommendation: score >= 70 ? 'Recommended' : score >= 50 ? 'Consider' : 'Not recommended'
        };
      }
    } catch (parseError) {
      console.error('Fit score parsing error:', parseError);
      return {
        success: false,
        error: 'Failed to parse fit score',
        fitScore: 0,
        breakdown: {},
        strengths: [],
        gaps: [],
        recommendation: 'Error'
      };
    }
  }

  /**
   * Generate interview preparation guide using LangGraph
   */
  async generateInterviewPrep(pdfId, resumeData, job, applicationId) {
    // Check if AI service is available
    const isAvailable = await this.ensureServiceAvailable();
    
    if (!isAvailable) {
      console.log('⚠️ AI service unavailable, using fallback interview prep');
      return await this.generateInterviewPrepFallback(pdfId, resumeData, job, applicationId);
    }
    
    try {
      // Prepare job data for LangGraph
      const jobData = {
        title: job.title,
        company: job.company,
        description: job.description,
        skills: job.skills || [],
        experience: job.experience || {},
        qualifications: job.qualifications || {},
        location: job.location,
        jobType: job.jobType,
        jobMode: job.jobMode
      };

      console.log(`🎯 Starting interview prep for ${job.title} at ${job.company}...`);

      // Use retry mechanism for better reliability
      const response = await this.withRetry(async () => {
        return await axios.post(
          `${this.baseURL}/interview/prepare`,
          {
            resume_data: resumeData,
            job_data: jobData,
            application_id: applicationId
          },
          {
            timeout: this.longTimeout // 5 minutes timeout for LangGraph processing
          }
        );
      }, 2, 2000); // 2 retries, 2 second initial delay

      if (response.data.success) {
        console.log('✅ Interview prep generated successfully using round-based LangGraph');
        return {
          success: true,
          // Company research
          company_info: response.data.company_info,
          interview_links: response.data.interview_links || [],
          role_level: response.data.role_level || 'SDE-1',
          
          // Interview rounds
          interview_rounds: response.data.interview_rounds || null,
          
          // Round-by-round preparation
          dsa_prep: response.data.dsa_prep || null,
          system_design_prep: response.data.system_design_prep || null,
          behavioral_prep: response.data.behavioral_prep || null,
          
          // Questions
          common_questions: response.data.common_questions || [],
          prepared_answers: response.data.prepared_answers || [],
          
          // Final guide
          preparation: response.data.final_guide || response.data.preparation,
          final_guide: response.data.final_guide || response.data.preparation,
          
          // Legacy
          role_analysis: response.data.role_analysis
        };
      } else {
        console.log('⚠️ LangGraph returned unsuccessful, using fallback');
        return await this.generateInterviewPrepFallback(pdfId, resumeData, job, applicationId);
      }
    } catch (error) {
      console.error('❌ LangGraph interview prep error:', error.message);
      console.error('   Error details:', error.response?.data || error.message);
      // Fallback to old method
      return await this.generateInterviewPrepFallback(pdfId, resumeData, job, applicationId);
    }
  }

  /**
   * Fallback interview preparation (old method)
   */
  async generateInterviewPrepFallback(pdfId, resumeData, job, applicationId) {
    const interviewPrompt = `Create a comprehensive interview preparation guide for this candidate applying for this position.

CANDIDATE RESUME:
${JSON.stringify(resumeData, null, 2)}

JOB POSITION:
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description}
- Required Skills: ${job.skills?.join(', ') || 'Not specified'}
- Experience: ${job.experience?.display || 'Not specified'}

Provide a detailed interview preparation guide with the following sections:

## 1. Common Interview Questions
List 5-7 common questions they might ask and how to answer them based on the candidate's resume.

## 2. Technical Questions
Based on the required skills (${job.skills?.join(', ') || 'N/A'}), provide 5-7 technical questions they might ask and suggested answers.

## 3. Highlighting Your Experience
How to effectively highlight relevant experience from the resume that matches the job requirements.

## 4. Questions to Ask the Interviewer
5-7 thoughtful questions the candidate should ask to show interest and gather information.

## 5. Tips for Success
Practical tips for interview success, including how to address any gaps in experience or skills.

Format the response in clear markdown with proper headings and bullet points.`;

    const result = await this.queryPDF(
      pdfId,
      interviewPrompt,
      `interview-${applicationId}`
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        preparation: 'Failed to generate interview preparation guide.'
      };
    }

    return {
      success: true,
      preparation: result.data.answer
    };
  }

  /**
   * Use agent service for enhanced chat
   */
  async agentChat(message, threadId = null) {
    try {
      const response = await axios.post(
        `${this.baseURL}/agent/web-search`,
        {
          query: message,
          thread_id: threadId || `chat-${Date.now()}`
        },
        {
          timeout: this.timeout
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Agent chat error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Use OCR for image uploads
   */
  async ocrImage(imageBuffer, filename) {
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('image', imageBuffer, {
        filename,
        contentType: 'image/png'
      });

      const response = await axios.post(`${this.baseURL}/ocr/image`, formData, {
        headers: formData.getHeaders(),
        timeout: this.timeout
      });

      return {
        success: true,
        text: response.data.text
      };
    } catch (error) {
      console.error('OCR error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * =============================================================================
   *                     CALL AI (GENERIC AI ANALYSIS)
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Makes a generic call to OpenAI API for analysis tasks.
   * Used for ATS analysis, project analysis, etc.
   * 
   * 📌 PARAMETERS:
   * --------------
   * @param {string} prompt - The prompt to send to OpenAI
   * @param {string} model - Model to use (default: gpt-4o-mini)
   * 
   * 📌 RETURNS:
   * -----------
   * String response from OpenAI
   * 
   * =============================================================================
   */
  async callAI(prompt, model = 'gpt-4o-mini') {
    try {
      // Call AI service endpoint instead of OpenAI directly
      // This avoids needing openai package in backend
      const response = await axios.post(
        `${this.baseURL}/ai/analyze`,
        {
          prompt,
          model,
          system_message: 'You are an expert resume analyst. Always return valid JSON when requested.'
        },
        {
          timeout: this.timeout
        }
      );

      return response.data.response || response.data.answer || '';
    } catch (error) {
      console.error('AI call error:', error.message);
      // If AI service endpoint doesn't exist, try OpenAI directly as fallback
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume analyst. Always return valid JSON when requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        return response.choices[0].message.content;
      } catch (fallbackError) {
        console.error('Fallback AI call also failed:', fallbackError.message);
        throw new Error('AI analysis unavailable. Please ensure AI service is running and OPENAI_API_KEY is set.');
      }
    }
  }

  /**
   * =============================================================================
   *                     GET RECRUITER DECISION (LANGGRAPH WORKFLOW)
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Calls the LangGraph workflow for AI-powered hiring recommendations.
   * Considers: ATS, Agentic score, Projects, Profile, Experience, College tier.
   * 
   * 📌 PARAMETERS:
   * --------------
   * @param {Object} resumeData - Candidate's resume data
   * @param {Object} jobData - Job requirements
   * @param {number} agenticScore - Fit score (0-100)
   * @param {Object} agenticDetails - Fit score breakdown
   * @param {Object} projectAnalysis - Project analysis results (pre-calculated)
   * @param {string} applicationId - Application ID
   * @param {string} candidateName - Candidate name
   * @param {Object} atsAnalysis - Pre-calculated ATS analysis (optional, to avoid duplicate work)
   * 
   * 📌 RETURNS:
   * -----------
   * {
   *   success: true,
   *   recommendation: "Strong Accept" | "Accept" | "Consider" | "Reject",
   *   confidence_score: 85,
   *   reasoning: "...",
   *   key_factors: [...],
   *   analysis: {...}
   * }
   * 
   * =============================================================================
   */
  async getRecruiterDecision(resumeData, jobData, agenticScore, agenticDetails, projectAnalysis, applicationId, candidateName, atsAnalysis = null) {
    try {
      const response = await this.withRetry(async () => {
        return await axios.post(
          `${this.baseURL}/recruiter/decision`,
          {
            resume_data: resumeData,
            job_data: jobData,
            agentic_score: agenticScore,
            agentic_details: agenticDetails,
            project_analysis: projectAnalysis,
            ats_analysis: atsAnalysis,  // Pass pre-calculated ATS analysis
            application_id: applicationId,
            candidate_name: candidateName
          },
          {
            timeout: this.longTimeout  // 5 minutes for LangGraph workflow
          }
        );
      });

      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('Recruiter decision error:', error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        recommendation: 'Consider',
        confidence_score: 0,
        reasoning: 'Unable to generate AI recommendation'
      };
    }
  }
}

// Export singleton instance
module.exports = new AIService();

