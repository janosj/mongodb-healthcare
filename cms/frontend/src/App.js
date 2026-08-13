import React, { useState, useEffect } from 'react';

const validationRule = `{ 
  $jsonSchema: {
    bsonType: "object",
    properties: {
      device_verification: {
        bsonType: "object",
        properties: {
          api_version: {
            enum: ["1.0"],
            description: "API version must strictly be 1.0"
          }
        }
      }
    }
  }
}`;


// Formats raw JSON string into syntax-highlighted HTML spans
function highlightJSON(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  
  // Escape HTML entities
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = '#f43f5e'; // default number (coral/red)
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = '#38bdf8'; // JSON Keys (Bright Cyan)
        } else {
          cls = '#34d399'; // String Values (Emerald Green)
        }
      } else if (/true|false/.test(match)) {
        cls = '#fbbf24'; // Booleans (Amber Yellow)
      } else if (/null/.test(match)) {
        cls = '#9ca3af'; // Nulls (Gray)
      }
      return `<span style="color: ${cls};">${match}</span>`;
    }
  );
}

function App() {
  const [claims, setClaims] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationError, setValidationError] = useState(null);

  const fetchClaims = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5050/api/claims');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setClaims(data);
      
      if (data.length > 0) {
        setSelectedDoc((prevSelected) => {
          // If a document was already selected, find its updated version in the fresh data array
          if (prevSelected) {
            const updatedMatch = data.find((doc) => doc._id === prevSelected._id);
            if (updatedMatch) return updatedMatch;
          }
          // Otherwise default to the first document
          return data[0];
        });
      }
    } catch (err) {
      console.error("Failed to fetch claims:", err);
      setErrorMsg("Failed to connect to backend at http://127.0.0.1:5050");
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleVerifyDevice = async (claimId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5050/api/claims/${claimId}/verify-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'DEV-CGM-9982' })
      });
      const result = await res.json();

      // Catch 400 Bad Request or result.success === false
      if (!res.ok || !result.success) {
        setValidationError({
          title: result.message || 'Document Failed Validation',
          raw: result.rawError || result.error || 'Unknown Mongo Error'
        });
        return;
      }

      // Success path: update local state with the modified claim document
      setClaims((prevClaims) =>
        prevClaims.map((c) => (c._id === claimId ? result.document : c))
      );

      if (result.document) {
        setSelectedDoc(result.document);
        fetchClaims();
      }

    } catch (err) {
      console.error("API verification failed:", err);
    }

  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          {/* <div style={styles.badge}>OPERATIONAL DATA LAYER DEMO</div> */}
          <h1 style={styles.title}>CMS Federal Oversight Platform</h1>
          <p style={styles.subtitle}>
            An Operational Data Layer Demo featuring Zero-ETL Dynamic Schema Evolution & Seamless API Integration
          </p>
        </div>
      </header>

      {/* Error Alert */}
      {errorMsg && (
        <div style={styles.errorBox}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}


      {/* Schema Validation Error Pop-up Modal */}
      {validationError && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '650px' }}>
            <div style={styles.modalHeader}>
              <span style={styles.modalIcon}>🚫</span>
              <h3 style={styles.modalTitle}>MongoServerError</h3>
            </div>
      
            <p style={styles.modalText}>
              <strong>Message:</strong> {validationError.title}
            </p>

            {/* Raw Unsanitized MongoDB Driver Output */}
            <pre style={{
              backgroundColor: '#0f172a',
              border: '1px solid #ef4444',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#f87171',
              overflowX: 'auto',
              maxHeight: '220px',
              fontFamily: 'monospace'
            }}>
              <code>{typeof validationError.raw === 'string' ? validationError.raw : JSON.stringify(validationError.raw, null, 2)}</code>
            </pre>

            <button 
              style={styles.closeBtn} 
              onClick={() => setValidationError(null)}
            >
              Close Window
            </button>
          </div>
        </div>
      )}


      {/* Main Grid */}
      <main style={styles.grid}>
        
        {/* LEFT COLUMN: Claims Selector + ODL Ingestion Pipeline Code Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

         
          {/* Service Integration Code Snippet Panel */}
          <section style={styles.codeSnippetPanel}>
            <div style={styles.codeSnippetHeader}>
              <span style={styles.codeSnippetTitle}>⚡ Integrate Evolving Data Services</span>
            </div>
            <div style={styles.codeSnippetHeader}>
              <span style={styles.zeroEtlTag}>ZERO ETL</span>&nbsp;
              <span style={styles.zeroEtlTag}>ZERO CODE CHANGES</span>
            </div>
            <pre style={styles.codeSnippetBlock}>
              <code>
                <span style={{ color: '#9ca3af' }}>// 1. Capture payload</span>{'\n'}
                const <span style={{ color: '#38bdf8' }}>deviceData</span> = <span style={{ color: '#10B981' }}>apiResponse.data;</span>{'\n\n'}
                <span style={{ color: '#9ca3af' }}>// 2. Incorporate data exactly as received</span>{'\n'}
                await claimsCollection.<span style={{ color: '#fbbf24' }}>updateOne</span>({'\n'}
                {'  '}&#123; <span style={{ color: '#38bdf8' }}>_id</span>: claimId &#125;,{'\n'}
                {'  '}&#123; <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>$set</span>: &#123; <span style={{ color: '#38bdf8' }}>device_verification</span>: <span style={{ color: '#38bdf8' }}>deviceData</span> &#125; &#125;{'\n'}
                );
              </code>
            </pre>
          </section>

 
          {/* Claims Selection List */}
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Select a Claim</h2>
            {claims.length === 0 && !errorMsg && (
              <p style={styles.loadingText}>Loading claims from Atlas...</p>
            )}

            <div style={styles.cardList}>
              {claims.map((claim) => {
                const isSelected = selectedDoc?._id === claim._id;

                return (
                  <div
                    key={claim._id}
                    onClick={() => setSelectedDoc(claim)}
                    style={{
                      ...styles.card,
                      // Keeps original dark card style, glowing blue only when selected
                      borderColor: isSelected ? '#38bdf8' : 'transparent',
                      backgroundColor: isSelected ? '#182232' : '#1f2937'
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.cardId}>{claim._id}</span>
        
                      {/* Restored Verified Badge */}
                      {claim.device_verification ? (
                        <span style={styles.verifiedBadge}>
                          ⚡ FDA Verified
                        </span>
                      ) : (
                        <span style={styles.unverifiedBadge}>
                          Unverified
                        </span>
                      )}
                    </div>

                    <p style={styles.patientText}>
                      Patient: <strong>{claim.patient?.display || claim.patient_name || 'Unknown'}</strong>
                    </p>

                    {/* API Verification Button */}
                    <button
                      style={{
                        ...styles.verifyBtn,
                        // Optional: give it a green subtle background if already verified
                        backgroundColor: claim.device_verification ? '#059669' : '#2563eb'
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents card selection trigger when clicking button
                        handleVerifyDevice(claim._id); // Calls FDA API V2 Endpoint
                      }}
                    >
                      {claim.device_verification ? '🔄 Re-Verify Device (FDA API)' : '🔍 Verify Device (FDA API)'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Schema Validation Link */}
            <div style={styles.copyBanner}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                Looking for schema validation? Try this:
              </span>{' '}
              <a
                href="#copy"
                style={styles.copyLink}
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(validationRule);
                  alert('📋 MongoDB Schema Validation rule copied to clipboard!');
                }}
              >
                clipboard
              </a>
            </div>

          </section>

        </div>

        {/* RIGHT COLUMN: Atlas Document Inspection Window */}
        <section style={styles.panel}>
          <div style={styles.inspectorHeader}>
            <h2 style={styles.panelTitle}>Document Inspector</h2>
            {selectedDoc && (
              <span style={styles.docBadge}>
                {selectedDoc.device_verification
                  ? `Schema: Enriched (V${selectedDoc.device_verification.api_version})`
                  : 'Schema: Base'}
              </span>
            )}
          </div>

          <div style={styles.codeContainer}>
            {selectedDoc ? (
              <pre 
                style={styles.codeBlock}
                dangerouslySetInnerHTML={{ __html: highlightJSON(selectedDoc) }}
              />
            ) : (
              <p style={styles.loadingText}>Select a claim on the left to inspect JSON.</p>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

// Stylesheet
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0b0f19',
    color: '#f3f4f6',
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '32px 48px',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '24px',
    borderBottom: '1px solid #1f2937',
    paddingBottom: '16px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 10px',
    borderRadius: '12px',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '25px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: '#ffffff',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#9ca3af',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '28px',
    alignItems: 'start',
  },
  panel: {
    backgroundColor: '#111827',
    borderRadius: '12px',
    border: '1px solid #1f2937',
    padding: '20px 24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  panelTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#f9fafb',
  },
  codeSnippetPanel: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '2px solid #fbbf24',
    padding: '16px 20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  codeSnippetHeader: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: '10px',
  },
  codeSnippetTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  zeroEtlTag: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  codeSnippetBlock: {
    margin: 0,
    fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
    fontSize: '11px',
    lineHeight: '1.4',
    color: '#f8fafc',
    backgroundColor: '#020617',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #0f172a',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.15s ease-in-out',
  },
  cardActive: {
    borderColor: '#10B981',
    backgroundColor: '#182232',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  cardId: {
    fontWeight: '700',
    fontSize: '14px',
    color: '#60a5fa',
    fontFamily: 'monospace',
  },
  verifiedBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    border: '1px solid #34d399',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  unverifiedBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9ca3af',
    backgroundColor: '#374151',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  versionBadge: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  },
  patientText: {
    margin: '0 0 14px 0',
    fontSize: '13px',
    color: '#d1d5db',
  },
  verifyBtn: {
    marginTop: '8px',
    width: '100%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  inspectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  docBadge: {
    fontSize: '12px',
    fontFamily: 'monospace',
    backgroundColor: '#1f2937',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  codeContainer: {
    backgroundColor: '#030712',
    borderRadius: '8px',
    border: '1px solid #1f2937',
    padding: '16px',
    maxHeight: 'calc(100vh - 280px)',
    overflowY: 'auto',
  },
  codeBlock: {
    margin: 0,
    fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
    fontSize: '11px',
    lineHeight: '1.4',
    color: '#34d399',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    border: '2px solid #ef4444',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.25)',
    color: '#f9fafb',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  modalIcon: {
    fontSize: '24px',
  },
  modalTitle: {
    margin: 0,
    color: '#f87171',
    fontSize: '18px',
    fontWeight: '700',
  },
  modalText: {
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  codeSnippet: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#fde047',
    marginBottom: '20px',
    fontFamily: 'monospace',
  },
  closeBtn: {
    width: '100%',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  copyBanner: {
    marginTop: '16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', // <-- Centers the text and link horizontally!
    gap: '6px',
  },
  copyLink: {
    color: '#38bdf8',
    textDecoration: 'underline',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
};

export default App;

