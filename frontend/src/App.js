import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'https://txg2r8rk27.execute-api.us-east-1.amazonaws.com/prod';

// Safe render helper to prevent object rendering errors
const safeRender = (value) => {
  if (value === null || value === undefined) return 'Not found';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

function App() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');
    setExtractedData(null);

    try {
      // Get upload URL
      const uploadResponse = await axios.post(`${API_BASE_URL}/upload`, {
        fileName: file.name,
        fileType: file.type
      });

      const { jobId: newJobId, uploadUrl } = uploadResponse.data;
      setJobId(newJobId);
      setStatus('Uploading...');

      // Upload file to S3
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      setStatus('Processing...');
      
      // Poll for results
      pollForResults(newJobId);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Upload failed');
      setLoading(false);
    }
  };

  const pollForResults = async (jobId) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const statusResponse = await axios.get(`${API_BASE_URL}/status/${jobId}`);
        const jobStatus = statusResponse.data.status;

        setStatus(`Processing... (${jobStatus})`);

        if (jobStatus === 'completed') {
          const resultsResponse = await axios.get(`${API_BASE_URL}/results/${jobId}`);
          setExtractedData(resultsResponse.data.extractedData);
          setStatus('Completed');
          setLoading(false);
        } else if (jobStatus === 'failed') {
          setError(statusResponse.data.errorMessage || 'Processing failed');
          setLoading(false);
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError('Processing timeout');
          setLoading(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError('Failed to get results');
          setLoading(false);
        }
      }
    };

    poll();
  };

  const resetForm = () => {
    setFile(null);
    setJobId(null);
    setStatus('');
    setExtractedData(null);
    setLoading(false);
    setError('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Image OCR System</h1>
        <p>Upload product images to automatically extract specifications</p>
      </header>

      <main className="App-main">
        <div className="upload-section">
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <p>Drag and drop an image here, or</p>
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="file-select-button">
                Choose File
              </label>
            </div>
          </div>

          {file && (
            <div className="file-info">
              <p><strong>Selected file:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {file.type}</p>
            </div>
          )}

          <button
            onClick={uploadFile}
            disabled={!file || loading}
            className="upload-button"
          >
            {loading ? 'Processing...' : 'Upload Image'}
          </button>

          {status && (
            <div className="status">
              <p><strong>Status:</strong> {status}</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
        </div>

        {extractedData && (
          <div className="results-section">
            <h2>Extracted Product Information</h2>
            <div className="product-data">
              <div className="data-field">
                <strong>Product Name:</strong> {safeRender(extractedData.productName)}
              </div>
              <div className="data-field">
                <strong>Brand:</strong> {safeRender(extractedData.brand)}
              </div>
              <div className="data-field">
                <strong>Category:</strong> {safeRender(extractedData.category)}
              </div>
              <div className="data-field">
                <strong>Price:</strong> {safeRender(extractedData.price)}
              </div>
              <div className="data-field">
                <strong>Dimensions:</strong> {safeRender(extractedData.dimensions)}
              </div>
              <div className="data-field">
                <strong>Weight:</strong> {safeRender(extractedData.weight)}
              </div>
              <div className="data-field">
                <strong>Description:</strong> {safeRender(extractedData.description)}
              </div>
              {extractedData.additionalDetails && (
                <div className="data-field">
                  <strong>Additional Details:</strong> 
                  {typeof extractedData.additionalDetails === 'object' 
                    ? JSON.stringify(extractedData.additionalDetails, null, 2)
                    : extractedData.additionalDetails}
                </div>
              )}
            </div>
            <button onClick={resetForm} className="reset-button">
              Process Another Image
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
