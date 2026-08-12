import os
from dotenv import load_dotenv, find_dotenv
import random
from pymongo import MongoClient
from openai import OpenAI

# -----------------------------------------------------------------------------
# Configuration
# Uses .env file in project root
# -----------------------------------------------------------------------------

load_dotenv(find_dotenv())

MONGO_URI = os.getenv("MONGODB_URI")

DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLL_RESPONSES")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not MONGO_URI or not OPENAI_API_KEY:
    raise ValueError("MONGO_URI or OPENAI_API_KEY not set in project root .env file!")

print(f"Adding embeddings to {DB_NAME}.{COLLECTION_NAME} at")
print(f"{MONGO_URI}")

# Start

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# -----------------------------------------------------------------------------
# Generate Vector Embeddings using OpenAI text-embedding-3-small (1536 dims)
# -----------------------------------------------------------------------------
def embed_claim_responses():
    docs = list(collection.find({"embedding": {"$exists": False}}))
    total = len(docs)
    
    if total == 0:
        print("✅ All documents already have embeddings generated!")
        return

    print(f"⚡ Generating embeddings for {total} documents using OpenAI 'text-embedding-3-small'...")
    
    batch_size = 50
    for i in range(0, total, batch_size):
        batch = docs[i:i + batch_size]
        texts_to_embed = [
            doc.get("processNote", [{}])[0].get("text", "") 
            for doc in batch
        ]
        
        # Call OpenAI Embeddings API
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=texts_to_embed
        )
        
        # Write embeddings back to MongoDB Atlas
        for j, doc in enumerate(batch):
            vector = response.data[j].embedding
            collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"embedding": vector}}
            )
        
        print(f"Processed {min(i + batch_size, total)} / {total} documents...")

    print("🎉 Successfully generated and saved all embeddings in Atlas!")

if __name__ == "__main__":
    embed_claim_responses()
