from dotenv import load_dotenv
import os
import certifi
from pymongo import MongoClient

load_dotenv()

def test_connection():
    mongo_uri = os.getenv("MONGO_URI")
    print(f"Using URI: {mongo_uri[:50]}...")  # Only show first 50 chars
    
    try:
        client = MongoClient(
            mongo_uri,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        client.admin.command('ping')
        print("✅ Connection successful!")
        
        # List databases
        print("Databases:", client.list_database_names())
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_connection()