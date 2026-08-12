#!/bin/bash

source venv/bin/activate

python3 server.py --port 5001 -- --v2
# or: uvicorn server:app --port 5001 --extra-cli-args --v2

