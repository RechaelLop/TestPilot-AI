# TestPilot AI - Hackathon Submission

## Quick Start (No Setup Required!)

1. Install Python 3.11+
2. Run: `pip install -r requirements.txt`
3. Run: `python -m uvicorn main:app --reload`
4. Open http://localhost:8000/docs to test API

The system works out-of-the-box with sample data!

1. RULE-BASED ENGINE (Fast path)
   - Checks for keywords: "timeout", "500", "database", "auth", etc.
   - Instantly classifies without AI
   - Used for common, predictable errors

2. AI-POWERED ENGINE (Deep analysis)
   - Calls Ollama Llama3 when rules don't match
   - Provides deeper insights for complex logs
   - Generates more detailed analysis