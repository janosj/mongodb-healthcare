import os
from dotenv import load_dotenv, find_dotenv
import random
from pymongo import MongoClient
from faker import Faker

fake = Faker()

# -----------------------------------------------------------------------------
# Configuration
# Uses .env file in project root
# -----------------------------------------------------------------------------

load_dotenv(find_dotenv())

MONGO_URI = os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise ValueError("MONGODB_URI is not set in project root .env file!")

DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLL_RESPONSES")
RECORD_COUNT = 1

print(f"Writing to {DB_NAME}.{COLLECTION_NAME} at")
print(f"{MONGO_URI}")

# -----------------------------------------------------------------------------
# Clinical Knowledge Base for ePA Note Generation
# -----------------------------------------------------------------------------
MEDICAL_DEVICES = [
    {
        "device": "Continuous Glucose Monitor (CGM)",
        "cpt": "95251",
        "cpt_desc": "Ambulatory CGM data analysis and interpretation",
        "loinc": "45536-0",
        "loinc_desc": "Glucose [Mass/volume] in Blood",
        "lcd": "LCD L33822",
        "diagnosis": "Type 1 Diabetes Mellitus"
    },
    {
        "device": "Automated Insulin Delivery System",
        "cpt": "E0784",
        "cpt_desc": "External ambulatory infusion pump, insulin",
        "loinc": "14749-6",
        "loinc_desc": "Glucose [Moles/volume] in Serum or Plasma",
        "lcd": "LCD L33824",
        "diagnosis": "Type 2 Diabetes Mellitus with Insulin Dependence"
    },
    {
        "device": "Implantable Cardiac Monitor",
        "cpt": "33285",
        "cpt_desc": "Insertion of subcutaneous cardiac rhythm monitor",
        "loinc": "8867-4",
        "loinc_desc": "Heart rate observation",
        "lcd": "LCD L34001",
        "diagnosis": "Unexplained Syncope and Atrial Fibrillation"
    },
    {
        "device": "CPAP Respiratory Assist Device",
        "cpt": "E0601",
        "cpt_desc": "Continuous positive airway pressure device",
        "loinc": "80323-9",
        "loinc_desc": "Apnea hypopnea index [AHI]",
        "lcd": "LCD L33718",
        "diagnosis": "Obstructive Sleep Apnea"
    }
]

STATES = ["GA", "CA", "NY", "FL", "TX", "IL", "OH", "PA", "NC", "MI"]
STATUSES = ["approved", "denied", "pended"]

def generate_claim_response(index):
    state = random.choice(STATES)
    device_info = random.choice(MEDICAL_DEVICES)
    status = random.choices(STATUSES, weights=[0.7, 0.2, 0.1])[0]
    claim_id = f"{state.lower()}-pa-2026-{index:06d}"
    
    # Construct ePA process note with clinical prose and embedded CPT/LOINC codes
    note_text = (
        f"Prior Authorization {status.upper()} under CMS {device_info['lcd']} "
        f"for {device_info['device']}. "
        f"CPT: {device_info['cpt']} ({device_info['cpt_desc']}). "
        f"LOINC: {device_info['loinc']} ({device_info['loinc_desc']}). "
        f"Primary indication: {device_info['diagnosis']}. "
        f"Determination notes: Patient documentation reviewed by Medical Officer. "
        f"Criteria met for coverage under regional Medicare Administrative Contractor (MAC) guidelines."
    )

    doc = {
        "_id": f"resp-{claim_id}",
        "resourceType": "ClaimResponse",
        "identifier": [
            {
                "system": "https://cms.gov/epa/claim-response-ids",
                "value": f"CR-{fake.uuid4()[:8]}"
            }
        ],
        "status": "active",
        "outcome": "complete" if status != "pended" else "queued",
        "use": "preauthorization",
        "patient": {
            "reference": f"Patient/PT-{fake.bothify(text='######')}", # FIXED HERE
            "display": f"{fake.first_name()} {fake.last_name()} ({state})"
        },
        "created": fake.date_time_between(start_date="-1y", end_date="now").isoformat() + "Z",
        "insurer": {
            "display": f"CMS Regional Oversight Division - Zone {random.randint(1, 5)}"
        },
        "request": {
            "reference": f"Claim/{claim_id}"
        },
        "processNote": [
            {
                "number": 1,
                "type": "display",
                "text": note_text,
                "language": {
                    "coding": [
                        {
                            "system": "urn:ietf:bcp:47",
                            "code": "en-US"
                        }
                    ]
                }
            }
        ],
        "item": [
            {
                "itemSequence": 1,
                "adjudication": [
                    {
                        "category": {
                            "coding": [
                                {
                                    "system": "http://terminology.hlth.gov/CodeSystem/adjudication",
                                    "code": "eligible"
                                }
                            ]
                        },
                        "amount": {
                            "value": round(random.uniform(250.0, 4500.0), 2),
                            "currency": "USD"
                        }
                    }
                ]
            }
        ]
    }
    return doc

def seed_database():
    print(f"Connecting to MongoDB Atlas...\n")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    print(f"Generating {RECORD_COUNT} synthetic FHIR ClaimResponse records...")
    records = [generate_claim_response(i + 1) for i in range(RECORD_COUNT)]

    print(f"Inserting into '{DB_NAME}.{COLLECTION_NAME}'...")
    collection.delete_many({})  # Reset collection for clean re-runs
    result = collection.insert_many(records)

    print(f"Successfully seeded {len(result.inserted_ids)} records!")

if __name__ == "__main__":
    seed_database()


