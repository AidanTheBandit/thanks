import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { loadSentimentModel, getSentimentScore } from './sentiment';
import GratitudeBloom from './components/GratitudeBloom';

const styles = {
  // ... (styles from before)
  app: {
    fontFamily: "'Merriweather', serif",
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: '2rem',
  },
  h1: {
    fontSize: '3rem',
    color: '#2c3e50',
    marginBottom: '0.5rem',
  },
  p: {
    fontSize: '1.2rem',
    color: '#7f8c8d',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '800px',
  },
  inputSection: {
    width: '100%',
    marginBottom: '2rem',
  },
  textarea: {
    width: '95%',
    padding: '1rem',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginBottom: '1rem',
    resize: 'vertical',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  button: {
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  canvasSection: {
    width: '100%',
    height: '400px',
    backgroundColor: '#ecf0f1',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  downloadSection: {
    width: '100%',
  },
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;


function App() {
  const [text, setText] = useState('Thank you!');
  const [score, setScore] = useState(0.5); // Start with a neutral score
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bloomRef = useRef();

  useEffect(() => {
    async function loadModel() {
      await loadSentimentModel();
      setModelLoaded(true);
    }
    loadModel();
  }, []);

  const handleGenerate = () => {
    if (modelLoaded) {
      const newScore = getSentimentScore(text);
      setScore(newScore);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    setText(speechResult);
    setIsRecording(false);
  };

  recognition.onspeechend = () => {
    recognition.stop();
    setIsRecording(false);
  };

  const handleDownload = () => {
    const exporter = new STLExporter();
    const scene = bloomRef.current;
    if (scene) {
      const stlString = exporter.parse(scene);
      const blob = new Blob([stlString], { type: 'text/plain' });
      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.href = URL.createObjectURL(blob);
      link.download = 'ThankerToken.stl';
      link.click();
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.h1}>ThankerTokens</h1>
        <p style={styles.p}>Create a unique 3D token to show your gratitude.</p>
      </header>
      <main style={styles.main}>
        <div style={styles.inputSection}>
          <textarea
            style={styles.textarea}
            placeholder="Type your thank you message here..."
            rows="5"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={styles.buttons}>
            <button style={styles.button} onClick={handleGenerate} disabled={!modelLoaded}>
              {modelLoaded ? 'Generate' : 'Loading Model...'}
            </button>
            <button style={styles.button} onClick={handleRecord}>
              {isRecording ? 'Stop Recording' : 'Record Voice'}
            </button>
          </div>
        </div>
        <div style={styles.canvasSection}>
          <Canvas>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            <Suspense fallback={null}>
              <GratitudeBloom score={score} text={text} ref={bloomRef} />
            </Suspense>
            <OrbitControls />
          </Canvas>
        </div>
        <div style={styles.downloadSection}>
          <button style={styles.button} onClick={handleDownload}>Download STL</button>
        </div>
      </main>
    </div>
  );
}

export default App;
