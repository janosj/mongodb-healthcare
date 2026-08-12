import React, { useState, useEffect } from 'react';

// Handles code syntax highlighting and search term highlighting
// in the right-hand inspection window
function highlightJSON(json, searchTerm = '') {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 1. First, apply JSON syntax highlighting (keys, strings, numbers)
  let html = json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = '#f43f5e';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = '#38bdf8'; // JSON Keys
        } else {
          cls = '#34d399'; // String values
        }
      } else if (/true|false/.test(match)) {
        cls = '#fbbf24';
      } else if (/null/.test(match)) {
        cls = '#9ca3af';
      }
      return `<span style="color: ${cls};">${match}</span>`;
    }
  );

  // 2. Next, highlight search terms inside string values (Lexical Mode)
  if (searchTerm && searchTerm.trim().length > 0) {
    // Escape special regex characters in the user's search query
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');

    // Replace matching text with glowing neon highlight tag
    html = html.replace(regex, (match) => {
      return `<mark style="background-color: rgba(253, 224, 71, 0.35); color: #fde047; padding: 1px 4px; border-radius: 3px; font-weight: 700; border: 1px solid #fde047;">${match}</mark>`;
    });
  }

  return html;
}


// Helper to render Atlas Search highlights (<mark> tags)
function renderHighlightedNote(doc) {
  if (doc.highlights && doc.highlights.length > 0) {
    const snippet = doc.highlights[0].texts.map((t) => {
      return t.type === 'hit' 
        ? `<mark style="background-color: rgba(253, 224, 71, 0.3); color: #fde047; padding: 1px 4px; border-radius: 3px; font-weight: 600;">${t.value}</mark>` 
        : t.value;
    }).join('');

    return <span dangerouslySetInnerHTML={{ __html: `"${snippet}"` }} />;
  }

  const defaultNote = doc.processNote?.[0]?.text || 'No processNote present.';
  return `"${defaultNote}"`;
}



// Separate presets for Lexical vs Vector search
const LEXICAL_PRESETS = [
  { label: 'CPT 95251 (CGM Analysis)', query: '95251' },
  { label: 'LOINC 45536-0 (Glucose)', query: '45536-0' },
  { label: 'LCD L33822 (Policy)', query: 'L33822' },
  { label: 'Obstructive Sleep Apnea', query: 'Obstructive Sleep Apnea' }
];

const VECTOR_PRESETS = [
  { label: 'Unstable blood sugar monitoring', query: 'unstable blood sugar monitoring' },
  { label: 'Breathing difficulty during sleep', query: 'breathing difficulty during sleep' },
  { label: 'Irregular heart rhythm tracking', query: 'irregular heart rhythm tracking' },
  { label: 'Insulin dependence management', query: 'insulin dependence management' }
];

function SearchApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('lexical'); // Defaulted to 'lexical'
  const [results, setResults] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamically switch presets based on current mode
  const currentPresets = searchMode === 'vector' ? VECTOR_PRESETS : LEXICAL_PRESETS;

  const executeSearch = async (queryText, mode = searchMode) => {
    setLoading(true);
    setErrorMsg('');
    
    const endpoint = mode === 'vector' 
      ? '/api/claim-responses/vector-search' 
      : '/api/claim-responses/search';

    try {
      const res = await fetch(`http://127.0.0.1:5050${endpoint}?q=${encodeURIComponent(queryText)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setResults(data);
      if (data.length > 0) setSelectedDoc(data[0]);
      else setSelectedDoc(null);
    } catch (err) {
      console.error("Search failed:", err);
      setErrorMsg("Failed to connect to search endpoint at http://127.0.0.1:5050");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch('', searchMode);
  }, [searchMode]);

  const handlePresetClick = (q) => {
    setSearchQuery(q);
    executeSearch(q, searchMode);
  };

  const handleModeSwitch = (newMode) => {
    setSearchMode(newMode);
    setSearchQuery(''); // Clear search input on mode switch
    executeSearch('', newMode);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={styles.badge}>ATLAS SEARCH & VECTOR DEMO</div>
            <h1 style={styles.title}>CMS Clinical Notes Inspector</h1>
            <p style={styles.subtitle}>
              Lexical Keyword Search ($search) and Semantic Vector Search ($vectorSearch) in MongoDB
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div style={styles.toggleContainer}>
            <button
              style={{ ...styles.toggleBtn, ...(searchMode === 'lexical' ? styles.toggleActive : {}) }}
              onClick={() => handleModeSwitch('lexical')}
            >
              🔤 Lexical (Keyword)
            </button>
            <button
              style={{ ...styles.toggleBtn, ...(searchMode === 'vector' ? styles.toggleActiveVector : {}) }}
              onClick={() => handleModeSwitch('vector')}
            >
              🧠 Vector (Semantic)
            </button>
          </div>
        </div>
      </header>

      {/* Search Input Bar */}
      <div style={styles.searchSection}>
        <div style={styles.searchBarContainer}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder={
              searchMode === 'vector' 
                ? "Describe clinical intent (e.g. 'unstable blood sugar monitoring')..." 
                : "Search exact keywords, CPT codes (e.g. '95251'), or LCD policies..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchQuery, searchMode)}
          />
          <button 
            style={{ ...styles.searchBtn, backgroundColor: searchMode === 'vector' ? '#8b5cf6' : '#2563eb' }} 
            onClick={() => executeSearch(searchQuery, searchMode)}
          >
            {searchMode === 'vector' ? '🧠 Vector Search' : '🔍 Lexical Search'}
          </button>
        </div>

        {/* Preset Chips (Dynamically rendered per mode) */}
        <div style={styles.chipContainer}>
          <span style={styles.chipLabel}>
            {searchMode === 'vector' ? 'Demo Semantic Scenarios:' : 'Demo Keyword Searches:'}
          </span>
          {currentPresets.map((preset, i) => (
            <button
              key={i}
              style={{
                ...styles.chip,
                color: searchMode === 'vector' ? '#c084fc' : '#38bdf8',
                borderColor: searchMode === 'vector' ? 'rgba(192, 132, 252, 0.3)' : 'rgba(56, 189, 248, 0.3)'
              }}
              onClick={() => handlePresetClick(preset.query)}
            >
              ⚡ {preset.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div style={styles.errorBox}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <main style={styles.grid}>
        
        {/* LEFT COLUMN: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>
                {searchMode === 'vector' ? 'Semantic Matches ($vectorSearch)' : 'Lexical Matches ($search)'}
              </h2>
              <span style={searchMode === 'vector' ? styles.vectorBadge : styles.countBadge}>
                {results.length} Matches
              </span>
            </div>

            {loading && <p style={styles.loadingText}>Running Query across Atlas Cluster...</p>}
            
            {!loading && results.length === 0 && (
              <p style={styles.loadingText}>No records matched your search query in {searchMode} mode.</p>
            )}

            <div style={styles.cardList}>
              {results.map((doc) => {
                const isSelected = selectedDoc?._id === doc._id;
                const noteText = doc.processNote?.[0]?.text || 'No processNote present.';

                return (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    style={{
                      ...styles.card,
                      // Only apply border color if selected, otherwise set to transparent
                      borderColor: isSelected 
                        ? (searchMode === 'vector' ? '#8b5cf6' : '#38bdf8') 
                        : 'transparent',
                      backgroundColor: isSelected 
                        ? (searchMode === 'vector' ? '#1f1a30' : '#182232') 
                        : '#1f2937'
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.cardId}>{doc._id}</span>
                      {doc.score && searchMode === 'vector' && (
                        <span style={styles.scoreTag}>
                          Score: {(doc.score * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>

                    <p style={styles.patientText}>
                      Patient: <strong>{doc.patient?.display || 'Unknown'}</strong>
                    </p>

                    <div style={styles.notePreview}>
                      {renderHighlightedNote(doc)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Full FHIR JSON Inspection Window */}
        <section style={styles.panel}>
          <div style={styles.inspectorHeader}>
            <h2 style={styles.panelTitle}>Full FHIR Document</h2>
            {selectedDoc && (
              <span style={styles.docBadge}>
                {selectedDoc.resourceType}
              </span>
            )}
          </div>

          <div style={styles.codeContainer}>
            {selectedDoc ? (
              <pre 
                style={styles.codeBlock}
                dangerouslySetInnerHTML={{ 
                  __html: highlightJSON(
                    selectedDoc, 
                    searchMode === 'lexical' ? searchQuery : '' // Highlight terms in Lexical mode!
                  ) 
                }}
              />
            ) : (
              <p style={styles.loadingText}>Select a result to inspect FHIR JSON payload.</p>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0b0f19',
    color: '#f3f4f6',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '32px 48px',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '20px',
    borderBottom: '1px solid #1f2937',
    paddingBottom: '16px',
  },
  badge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '4px 10px',
    borderRadius: '12px',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: '#ffffff',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#9ca3af',
  },
  toggleContainer: {
    display: 'flex',
    backgroundColor: '#111827',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #374151',
    gap: '4px',
  },
  toggleBtn: {
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  toggleActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  toggleActiveVector: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
  },
  searchSection: {
    marginBottom: '28px',
    backgroundColor: '#111827',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #1f2937',
  },
  searchBarContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '14px',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#030712',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  searchBtn: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  chipContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  chipLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '600',
  },
  chip: {
    backgroundColor: '#1f2937',
    borderRadius: '16px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid',
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
    gridTemplateColumns: '480px 1fr',
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
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  panelTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#f9fafb',
  },
  countBadge: {
    fontSize: '11px',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '2px 8px',
    borderRadius: '8px',
    fontWeight: '700',
  },
  vectorBadge: {
    fontSize: '11px',
    color: '#c084fc',
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    padding: '2px 8px',
    borderRadius: '8px',
    fontWeight: '700',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: 'calc(100vh - 380px)',
    overflowY: 'auto',
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    padding: '14px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.15s ease-in-out',
  },
  cardActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#182232',
  },
  cardActiveVector: {
    borderColor: '#8b5cf6',
    backgroundColor: '#1f1a30',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  cardId: {
    fontWeight: '700',
    fontSize: '13px',
    color: '#a78bfa',
    fontFamily: 'monospace',
  },
  scoreTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  patientText: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#d1d5db',
  },
  notePreview: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
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
    color: '#9ca3af',
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
};

export default SearchApp;

