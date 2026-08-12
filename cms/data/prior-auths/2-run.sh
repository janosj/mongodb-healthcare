#!/bin/bash
set -e

# 1. Verify venv exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run './setup_env.sh' first."
    exit 1
fi

# 2. Activate virtual environment
source venv/bin/activate

# 3. Run the seed generator
echo "Loading documents..."
python3 load-json.py

deactivate
echo "Seeding script finished successfully!"

