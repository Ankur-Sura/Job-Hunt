# Job Portal Project - AI-Powered Job Matching Platform

A comprehensive job portal with AI-powered resume matching, job recommendations, and interview preparation.

## Features

1. **User Authentication** - Login/Register with JWT
2. **Dashboard** - Profile completion, recommendations, performance metrics
3. **Resume Upload** - OCR and RAG integration for resume processing
4. **100 IT Jobs** - Pre-seeded database with real IT job listings
5. **AI Job Recommendations** - Personalized job suggestions based on resume
6. **Fit Score** - Percentage match between resume and job requirements
7. **Internship Prioritization** - Automatically prioritizes internships if no internship experience
8. **Hirer Dashboard** - View candidates with fit scores
9. **Interview Preparation** - AI-generated interview prep guide after applying

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- Multer (File uploads)

### Frontend
- React 18
- React Router
- Vite
- Axios

### AI Service
- FastAPI (Python)
- OpenAI GPT-4
- Qdrant Vector Database
- OCR (Tesseract)
- RAG (Retrieval Augmented Generation)

## Project Structure

```
Job Portal Project/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Seed scripts
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Auth context
│   │   └── App.jsx
│   └── package.json
└── AI/                  # Existing AI service
    ├── main.py
    ├── rag_service.py
    └── tools_service.py
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB (running locally or connection string)
- Qdrant (running on port 6333)
- OpenAI API Key

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET
npm start
```

Backend runs on `http://localhost:8080`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. AI Service Setup

```bash
cd AI
pip install -r requirements.txt
# Create .env file with OPENAI_API_KEY and QDRANT_URL
python main.py
```

AI Service runs on `http://localhost:8001`

### 4. Seed Jobs Database

```bash
cd backend
node scripts/seedJobs.js
```

This will populate the database with 100 IT jobs.

### 5. Start Qdrant (Vector Database)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

## Environment Variables

### Backend (.env)
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/jobportal
JWT_SECRET=your-secret-key
AI_SERVICE_URL=http://localhost:8001
NODE_ENV=development
```

### AI Service (.env)
```
OPENAI_API_KEY=sk-your-key-here
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=learning_vectors
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `GET /api/jobs/:id` - Get job details
- `GET /api/jobs/recommended/list` - Get recommended jobs (with fit scores)

### Resume
- `POST /api/resume/upload` - Upload resume (PDF)
- `GET /api/resume/data` - Get resume data
- `POST /api/resume/query` - Query resume with AI

### Applications
- `POST /api/applications/apply/:jobId` - Apply for job
- `GET /api/applications/my-applications` - Get user's applications

### Recommendations
- `GET /api/recommendations` - Get AI-powered job recommendations

### Interview
- `GET /api/interview/prepare/:applicationId` - Get interview preparation guide

### Hirer (for hirers only)
- `GET /api/hirer/job/:jobId/candidates` - Get candidates with fit scores
- `PATCH /api/hirer/application/:applicationId/status` - Update application status

## Key Features Explained

### 1. Resume Upload & OCR
- Upload PDF resume
- OCR extracts text (handles scanned PDFs)
- RAG chunks and indexes in Qdrant
- Extracts structured data (skills, experience, education)

### 2. AI Job Recommendations
- Compares resume with job descriptions
- Calculates fit score (0-100%)
- Prioritizes internships if no internship experience
- Shows fit percentage on job cards

### 3. Fit Score Calculation
- Skills match (40% weight)
- Experience match (30% weight)
- Education match (20% weight)
- Overall alignment (10% weight)

### 4. Hirer Dashboard
- View all candidates for a job
- See fit scores for each candidate
- Filter and sort by fit score
- Update application status

### 5. Interview Preparation
- After applying, get AI-generated prep guide
- Includes common questions, technical questions
- Tips for highlighting relevant experience
- Questions to ask interviewer

## Usage Flow

1. **Register/Login** - Create account or login
2. **Upload Resume** - Upload PDF resume on dashboard
3. **View Recommendations** - See AI-recommended jobs with fit scores
4. **Browse Jobs** - Filter and search jobs
5. **Apply** - Apply to jobs (fit score calculated automatically)
6. **Interview Prep** - Get personalized interview preparation
7. **Track Applications** - View application status on dashboard

## Notes

- Fit scores are calculated using AI comparing resume with job requirements
- Internship jobs are prioritized if user has no internship experience
- Resume data is stored in Qdrant for fast similarity search
- All AI operations use the existing AI service in the `/AI` folder

## Troubleshooting

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env

2. **AI Service Not Responding**
   - Check if AI service is running on port 8001
   - Verify OPENAI_API_KEY is set
   - Ensure Qdrant is running on port 6333

3. **Resume Upload Fails**
   - Check file size (max 10MB)
   - Ensure file is PDF format
   - Verify AI service is accessible

## License

MIT

