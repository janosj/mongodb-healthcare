#!/bin/bash
set -e

echo "Setting up Python virtual environment..."
python3 -m venv venv

source venv/bin/activate
pip3 install --quiet pymongo python-dotenv

echo "Setup complete! Run './2-run.sh' to seed the database."
deactivate

