const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5050;

const uri = process.env.MONGODB_URI;
const db_name = process.env.DB_NAME;
const claims_collection = process.env.COLL_CLAIMS;
const responses_collection = process.env.COLL_RESPONSES;
console.log(`Connecting to : ${uri}`);
const client = new MongoClient(uri);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let claimsCollection;
let claimResponsesCollection;

async function connectDB() {
  await client.connect();
  const db = client.db(db_name);
  claimsCollection = db.collection(claims_collection);
  claimResponsesCollection = db.collection(responses_collection);
  console.log("Connected to MongoDB Atlas!");
}
connectDB().catch(console.error);

// Endpoint 1: Fetch all claims
app.get('/api/claims', async (req, res) => {
  const claims = await claimsCollection.find({}).toArray();
  res.json(claims);
});

// Endpoint 2: Dynamic FDA Verification ($set)
app.post('/api/claims/:id/verify-device', async (req, res) => {
  const claimId = req.params.id;
  const deviceId = req.body.deviceId || 'DEV-CGM-9982';

  try {
    const apiResponse = await axios.get(`http://localhost:5001/api/device-registry/${deviceId}`);
    const deviceData = apiResponse.data;

    await claimsCollection.updateOne(
      { _id: claimId },
      { $set: { device_verification: deviceData } }
    );

    const updatedDoc = await claimsCollection.findOne({ _id: claimId });
    res.json({ success: true, document: updatedDoc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Endpoint 3: Lexical Search (Atlas Search with Highlighting & FULL FHIR Doc)
app.get('/api/claim-responses/search', async (req, res) => {
  try {
    const { q } = req.query;
    let pipeline = [];

    if (q && q.trim().length > 0) {
      pipeline.push({
        $search: {
          index: 'default',
          text: {
            query: q,
            path: ['processNote.text', 'patient.display', 'request.reference'],
            matchCriteria: 'all'
          },
          highlight: {
            path: 'processNote.text'
          }
        }
      });

      // 1. Keep ALL original document fields and append search metadata
      pipeline.push({
        $addFields: {
          score: { $meta: 'searchScore' },
          highlights: { $meta: 'searchHighlights' }
        }
      });
    } else {
      pipeline.push({ $match: {} });
    }

    // 2. Exclude the raw 1,536 float array so the inspector view stays clean
    pipeline.push({
      $project: {
        embedding: 0
      }
    });

    pipeline.push({ $limit: 20 });
    const results = await claimResponsesCollection.aggregate(pipeline).toArray();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Endpoint 4: Semantic Vector Search ($vectorSearch)
app.get('/api/claim-responses/vector-search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      const results = await claimResponsesCollection.find({}).limit(20).toArray();
      return res.json(results);
    }

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: q,
    });
    const queryVector = embeddingResponse.data[0].embedding;

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: 100,
          limit: 20
        }
      },
      // Keep ALL original document fields and append vector score
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' }
        }
      },
      // Exclude the huge raw array of 1,536 float numbers so the inspector view stays clean
      {
        $project: {
          embedding: 0 
        }
      }
    ];

    const results = await claimResponsesCollection.aggregate(pipeline).toArray();
    res.json(results);
  } catch (error) {
    console.error("Vector search error:", error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://127.0.0.1:${PORT} and http://localhost:${PORT}`);
});

