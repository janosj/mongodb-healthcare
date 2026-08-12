import sys
import uvicorn
from fastapi import FastAPI

app = FastAPI()

# Read API version from command line argument (default to v1)
API_VERSION = "2.0" if "--v2" in sys.argv else "1.0"

@app.get("/api/device-registry/{device_id}")
def verify_device(device_id: str):
    base_response = {
        "api_version": API_VERSION,
        "fda_device_id": device_id,
        "approval_status": "CLEARED",
        "device_class": "Class II",
        "last_inspected": "2026-01-15"
    }

    # If running in V2 mode, append the new security audit payload
    if API_VERSION == "2.0":
        base_response["security_audit"] = {
            "firmware_version": "v4.1.2",
            "cybersecurity_vulnerability_flag": False,
            "recalibration_interval_days": 10
        }

    return base_response

# THIS KEEPS THE SERVER RUNNING:
# FastAPI doesn't start an HTTP web server on its own just by running python server.py.
# It requires an ASGI web server runner called Uvicorn to listen on a port and keep running in the background.
if __name__ == "__main__":
    print(f"Starting fictitious FDA Device Registry API in Version {API_VERSION} mode on port 5001...")
    print(f"To check that it's running, try: http://localhost:5001/api/device-registry/DEV-CGM-9982\n")
    uvicorn.run(app, host="0.0.0.0", port=5001)

