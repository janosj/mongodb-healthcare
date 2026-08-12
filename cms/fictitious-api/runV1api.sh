#!/bin/bash

source venv/bin/activate

python3 server.py --port 5001
# or: uvicorn server:app --port 5001

