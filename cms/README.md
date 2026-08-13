# CMS Oversight & Clinical Notes Search Demo

A full-stack demonstration platform showcasing modern data architecture for healthcare oversight using **MongoDB Atlas**, **Express.js**, **React**, and **OpenAI**.

This demo highlights how CMS (Centers for Medicare & Medicaid Services) can move away from rigid legacy relational models to handle **Schema Evolution / Zero-ETL Ingestion**, while unifying **Exact Keyword (Lexical)** and **AI-powered Semantic Vector Search** on unstructured clinical notes—all within a single, secure database environment.

---

## Overview

Modern healthcare claims and FHIR datasets require both rigid code precision (CPT, LOINC, LCD guidelines) and deep understanding of unstructured clinical narratives written by doctors and auditors.

This platform consists of two unified interactive applications:

1. **⚡ Operational Data Layer (ODL) & Schema Evolution:** Demonstrates real-time data enrichment and dynamic schema evolution (`$set`) via external FDA API integrations without requiring downtime or database migrations.
2. **🔍 CMS Clinical Notes Inspector:** Demonstrates a side-by-side comparison between traditional Lucene Lexical Search (`$search`) and OpenAI-backed Semantic Vector Search (`$vectorSearch`) across FHIR `ClaimResponse` process notes.

---

## Demo Highlights

* **Dynamic Schema Evolution (`$set`):** Trigger real-time FDA device verification endpoints to dynamically mutate document schemas on the fly without breaking existing readers.
* **Lexical Keyword Search (`$search`):** Precise matching for CPT codes (e.g., `95251`), LOINC identifiers (`45536-0`), and LCD policy numbers (`L33822`) with neon-highlighted text snippets.
* **Semantic Vector Search (`$vectorSearch`):** Uses OpenAI (`text-embedding-3-small`) to understand clinical intent (e.g., matching *"unstable blood sugar monitoring"* to notes discussing continuous glucose tracking, even when exact words don't match).
* **Live JSON Inspector:** Interactive syntax-highlighted viewer to inspect complete FHIR document payloads alongside calculated vector cosine similarity scores.
* **Multi-Window Routing:** Built-in client-side routing allowing side-by-side execution in separate browser windows (`/odl` vs `/search`).

---

## Installation

### Prerequisites

* **Node.js** (v18+)
* **Python** (v3.9+)
* **MongoDB Atlas** cluster (`cms_oversight` database)
* **OpenAI API Key**

### 1. Clone & Install Node Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd <repo-folder>

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

```

### 2. Set Up Python Virtual Environment (for Embeddings)

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install required Python packages
python3 -m pip install pymongo openai

```

---

## Configuration & Index Setup

### 1. Environment Variables

Create a `.env` file in the root directory (or export them in your terminal):

```bash
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
OPENAI_API_KEY="sk-proj-..."

```

### 2. Load Sample Data & Generate Vector Embeddings

This demo uses two collections: `federal_claims` and `claim_responses`. Loading the first collection (`federal_claims`) is part of the demonstration. Two records can be found in `/data/prior-auths`. For the demo, load these records individually using MongoDB Compass, noting the simplicity of loading JSON and the differences between the two records (the CA record using the `extension` field whereas the GA record does not). That directory also contains a Python data loader - useful during testing, and also to show that working programmatically is equally simple. 

The second collection (`claim_responses`) should be loaded in advance, and vector embeddings should be generated. A working data set can found in `data\claim-responses`. That folder also includes scripts to generate new records and add the vector embeddings. 

Run the embedding script to vectorize all process notes in your `claim_responses` collection:

```bash
source venv/bin/activate
python3 generate_embeddings.py

```

### 3. Create Search Indexes in MongoDB Atlas UI

* **Lexical Index (`default`):**
* Database: `cms_oversight` | Collection: `claim_responses`
* Index Type: **Atlas Search** (Default JSON configuration with dynamic mapping).


* **Vector Index (`vector_index`):**
* Database: `cms_oversight` | Collection: `claim_responses`
* Index Type: **Atlas Vector Search**
* Definition:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}

```





---

## Running the Demo

### 1. Start the Backend Server

```bash
cd cms/backend
./install.sh

# Runs Express backend on http://localhost:5050
./runBackend.sh
```

### 2. Start the React Frontend

In a separate terminal window:

```bash
cd cms/frontend
./install.sh
./runFrontend.sh
```

### 3. Launch Version 1 of the fictitious external API

In a separate terminal window:

```bash
cd cms/fictitious-api
./1-dependencies.sh
./runV1api.sh
```

### 4. Launch UI Windows for Live Presentation

Launching the frontend will automatically open your browser to present both capabilities side-by-side:

* **Window A (Left Screen - ODL Demo):** `http://localhost:3000/odl`
* Click **"Verify Device (FDA API)"** to trigger schema mutation (`$set`) live on screen.


* **Window B (Right Screen - Vector Search Demo):** `http://localhost:3000/search`
* Toggle between **Lexical** and **Vector** search modes to demonstrate exact code matching versus semantic intent understanding.


---

## Demo Walkthrough

### Load the prior authorization records. 


