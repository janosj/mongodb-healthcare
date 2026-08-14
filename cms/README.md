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

## Prerequisites

* **Node.js** (v18+)
* **Python** (v3.9+)
* **MongoDB Atlas** cluster (`cms_oversight` database)
* **OpenAI API Key**


## Configuration & Setup

### 1. Environment Variables

Copy the file `cms\dot-env.EXAMPLE` to `cms\.env` and modify the values to match your environment. Specify your Atlas connect string and your OpenAI API Key.


### 2. Load Sample Data & Generate Vector Embeddings

This demo uses two collections: `federal_claims` and `claim_responses`. Loading the first collection (`federal_claims`) is part of the demonstration. Two records can be found in `/data/prior-auths`. For the demo, load these records individually using MongoDB Compass, noting the simplicity of loading JSON and the differences between the two records (the CA record using the `extension` field whereas the GA record does not). That directory also contains a Python data loader - useful during testing, and also to show that working programmatically is equally simple. 

The second collection (`claim_responses`) should be loaded in advance, and vector embeddings should be generated. A working data set can found in `data\claim-responses`. That folder also includes scripts to generate new records and add the vector embeddings. 

Run the embedding script to vectorize all process notes in your `claim_responses` collection:

```bash
source venv/bin/activate
python3 generate_embeddings.py

```

### 3. Create Search & Vector Search Indexes

The *Clinical Notes Inspector* application will be used to demonstrate Search & Vector Search. These two indexes can be created in advance, or as part of the demo (but it will take a few minutes). Index definitions are in the repo (`data/claim-responses/index-defs`).


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

Launching the frontend will automatically display the two demo applications in your web browser (using two separate tabs):

* **Tab 1** will have the ODL portion of the demo, hosted at `http://localhost:3000/odl`.

* **Tab 2** with have the Clinical Notes Inspector for demonstrating Search and Vector Search, hosted at `http://localhost:3000/search`


### 3. Launch Version 1 of the (fictitious) External API

In a separate terminal window:

```bash
cd cms/fictitious-api
./1-dependencies.sh
./runV1api.sh
```

---

## Demo Walkthrough

### 1. MongoDB Atlas (or Atlas for Government)

Although you will already have a preconfigured demo cluster running, walk through the Atlas Launch Cluster page, reviewing any salient points with your audience. 

### 2. Load the prior authorization records. 

Using MongoDB Compass, connect to your database and load the two prior authorization records. If this is your first time running through the demo, you will have to create a new database (cms_oversight) and collection (federal_claims). Then, cick the `Import data` button and navigate to your Georgia (GA) claim record. Load the second (CA) record, noting the differences and the ability to handle non-uniform data. Walk through the data loader code, if you want to show things from the programmatic point of view. 

### 3. Incorporate Data from Evolving External Services

Switch to the front-end application (*CMS Federal Oversight Platform*). The two records you just loaded should be listed in the lower-left panel (*Select a Claim*). Click the **panel** of either one (not the Verify button) to select it, displaying the full JSON document in the right-side Document Inspector. The top-right of the Document Inspector displays the schema version - this will say *Base* until you call the (fictitious) external FDA service. The top-right of the selector will also display a status (*Unverified*).

Click the `Verify Device` button for the selected record. The response will be appended to the JSON document (you may have to scroll down to see it). The status labels will be updated to say *FDA Verified* and *Enriched (V1.0)*.

Walk through The actual code that does the update (displayed in the top-left corner). Note how you can easily incorporate this data into your data model, exactly as received. The data provenance is embedded in the document: what external service was called, what version, what date, and the exact response. 

Now, simulate a service upgrade. From the terminal window where the V1 service is running, shut it down and launch Version 2 (`runV2api.sh`). Click `re-Verify`. The updated data model is incorporated immediately, without requiring any back-end database schema modifications.

What if the customer *doesn't* want these kind of changes coming into their system unannounced? Clearly, they'd still want to test, and they may want to make application-level code changes to work with the new data format. They can prevent new versions hitting their system unexpectedly by using **Schema Validation**. The syntax is hard to get right, so just click on the `clipboard` link in the lower-left corner. Then, navigate back to MongoDB Compass. With the *federal_claims* collection still selected, navigate to the *Validation* tab and click `Add rule`. Highlight the existing sample rule and replace it by pasting the actual rule from your clipboard. This rule states the the API version must be 1.0. Click `Apply` to apply the new rule. Back in the front-end application, select the second record and click the `Verify` button. You should now receive an error that the update failed, because the API version no longer satisfies the business requirement. 


