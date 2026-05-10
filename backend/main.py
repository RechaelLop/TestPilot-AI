from ai_service import analyze_log
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client["testpilot"]
collection = db["failures"]

# Root route
@app.get("/")
def root():
    return {"message": "TestPilot AI Backend Running"}

# Upload + AI analysis route
@app.post("/upload")
async def upload_log(file: UploadFile = File(...)):

    # Read uploaded file
    content = await file.read()
    log_text = content.decode("utf-8")

    # Analyze log using OpenAI
    analysis = analyze_log(log_text)

    bug_report = f"""
    BUG TITLE:
    {analysis['root_cause']}

    SEVERITY:
    {analysis['severity']}

    AFFECTED MODULE:
    {analysis['module']}

    DESCRIPTION:
    {analysis['summary']}

    STEPS TO REPRODUCE:
    1. Run failing test
    2. Observe system behavior
    3. Review generated logs

    EXPECTED RESULT:
    System should execute successfully without failures.

    ACTUAL RESULT:
    Failure detected during QA execution.

    SUGGESTED FIX:
    {analysis['suggested_fix']}
    """

    # Store in MongoDB
    document = {
        "filename": file.filename,
        "log": log_text,
        "analysis": analysis,
        "created_at": datetime.utcnow()
    }

    result = collection.insert_one(document)

    # Return response
    return {
        "message": "Log analyzed successfully",
        "analysis": analysis,
        "bug_report": bug_report,
        "id": str(result.inserted_id)
    }