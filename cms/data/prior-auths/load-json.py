import json
import os
import sys
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
from pymongo import MongoClient

# -----------------------------------------------------------------------------
# Configuration
# Uses .env file in project root
# -----------------------------------------------------------------------------

load_dotenv(find_dotenv())

MONGO_URI = os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise ValueError("MONGODB_URI is not set in project root .env file!")

DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLL_CLAIMS")


# Path to the directory containing your JSON files
JSON_DIR = "."  # Update to your folder path


def load_json_files_to_mongo():

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    folder_path = Path(JSON_DIR)

    if not folder_path.exists() or not folder_path.is_dir():
        print(f"Directory not found: {folder_path.resolve()}")
        return

    # Find all .json files in the specified directory
    json_files = list(folder_path.glob("*.json"))

    if not json_files:
        print(f"No JSON files found in {folder_path.resolve()}")
        return

    print(f"Found {len(json_files)} JSON file(s) in '{folder_path}'")

    # Delete any existing records, to avoid duplicate key errors.

    existing_count = collection.count_documents({})

    print(f"\nWARNING: Existing data found in '{DB_NAME}.{COLLECTION_NAME}'.")
    print(f"To avoid duplicate key errors, these need to be deleted.")
    confirm = input(f"\nOk to delete? Current record count is {existing_count}. Type 'y' to proceed: ").strip().lower()

    if confirm != "y":
        print("Operation cancelled. No records were deleted.")
        client.close()
        sys.exit(0)

    print(f"\n  Deleting existing records from '{DB_NAME}.{COLLECTION_NAME}'...")
    delete_result = collection.delete_many({})
    print(f"  Deleted {delete_result.deleted_count} record(s).")

    # Proceed with data upload.

    documents_to_insert = []

    for file_path in json_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

                # Handle both single document objects and arrays of documents
                if isinstance(data, list):
                    documents_to_insert.extend(data)
                elif isinstance(data, dict):
                    documents_to_insert.append(data)

            print(f"  ✓ Loaded: {file_path.name}")
        except Exception as e:
            print(f"  Failed to parse {file_path.name}: {e}")

    # 3. Bulk insert into MongoDB
    if documents_to_insert:
        print(
            f"\nInserting {len(documents_to_insert)} document(s) into '{DB_NAME}.{COLLECTION_NAME}'..."
        )
        result = collection.insert_many(documents_to_insert)
        print(
            f"Successfully inserted {len(result.inserted_ids)} document(s)!"
        )
    else:
        print("No valid documents found to insert.")

    client.close()


if __name__ == "__main__":
    load_json_files_to_mongo()

