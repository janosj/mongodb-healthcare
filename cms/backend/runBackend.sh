# Runs the Node Express Backend
# Set environment variables in the repo root .env file

node --env-file=$(git rev-parse --show-toplevel)/cms/.env server.js

# To check that it's running:
# From the browser:
#http://127.0.0.1:5050/api/claims
#Or:
#curl http://127.0.0.1:5050/api/claims

