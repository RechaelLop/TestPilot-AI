from ai_service import analyze_log, normalize_result
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

# MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["testpilot"]
collection = db["failures"]

# -----------------------
# ROOT
# -----------------------
@app.get("/")
def root():
    return {"message": "TestPilot AI Backend Running"}

# -----------------------
# UPLOAD + ANALYSIS
# -----------------------
@app.post("/upload")
async def upload_log(file: UploadFile = File(...)):

    content = await file.read()
    log_text = content.decode("utf-8")

    # ✅ STEP 1: run AI analysis properly
    analysis = analyze_log(log_text)

    # Optional normalization (ONLY ONCE)
    analysis = normalize_result(analysis)

    timestamp = datetime.utcnow().isoformat()

    document = {
        "filename": file.filename,
        "log": log_text,
        "analysis": analysis,
        "created_at": timestamp
    }

    collection.insert_one(document)

    bug_report = f"""
BUG TITLE:
{analysis.get('root_cause')}

SEVERITY:
{analysis.get('severity')}

AFFECTED MODULE:
{analysis.get('module')}

DESCRIPTION:
{analysis.get('summary')}

SUGGESTED FIX:
{analysis.get('suggested_fix')}
"""

    return {
        "message": "Log analyzed successfully",
        "analysis": analysis,
        "bug_report": bug_report
    }
# -----------------------
# FAILURES DASHBOARD API
# -----------------------
@app.get("/failures")
def get_failures():

    raw_failures = collection.find().sort("created_at", -1).limit(20)

    failures = []

    for f in raw_failures:

        # 🔥 FULL SANITIZATION
        f["_id"] = str(f["_id"])

        if "analysis" in f and isinstance(f["analysis"], dict):
            # remove any nested ObjectId if accidentally present
            if "_id" in f["analysis"]:
                f["analysis"]["_id"] = str(f["analysis"]["_id"])

        failures.append(f)

    return failures