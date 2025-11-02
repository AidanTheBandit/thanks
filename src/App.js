import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { loadSentimentModel, getSentimentScore } from './sentiment';
import GratitudeBloom from './components/GratitudeBloom';

const styles = {
  app: {
    fontFamily: "'Merriweather', serif",
    textAlign: 'center',
    color: '#4a4a4a',
    backgroundColor: '#f0e4d7', // Soft pastel background
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  header: {
    marginBottom: '2rem',
  },
  h1: {
    fontSize: '3.5rem',
    color: '#d35400', // Muted orange
    fontFamily: "'Pacifico', cursive",
  },
  p: {
    fontSize: '1.3rem',
    color: '#7f8c8d',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '900px',
  },
  inputSection: {
    width: '100%',
    marginBottom: '2rem',
  },
  textarea: {
    width: '95%',
    padding: '1rem',
    fontSize: '1.1rem',
    borderRadius: '15px',
    border: '2px solid #e5cba8',
    marginBottom: '1rem',
    resize: 'vertical',
    backgroundColor: '#fffcf7',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  button: {
    padding: '0.8rem 1.8rem',
    fontSize: '1rem',
    backgroundColor: '#e67e22', // Carrot orange
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  canvasSection: {
    width: '100%',
    height: '450px',
    backgroundColor: '#d3c4b4',
    borderRadius: '20px',
    marginBottom: '2rem',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
  },
  downloadSection: {
    width: '100%',
  },
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

function App() {
  const [text, setText] = useState('Thank you for everything!');
  const [score, setScore] = useState(0.5);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bloomRef = useRef();

  useEffect(() => {
    async function loadModel() {
      await loadSentimentModel();
      setModelLoaded(true);
      // Initial generation
      const initialScore = getSentimentScore('Thank you for everything!');
      setScore(initialScore);
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
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  if (recognition) {
    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setText(speechResult);
      setIsRecording(false);
      handleGenerate(); // Auto-generate after speech
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsRecording(false);
    };
  }

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
      document.body.removeChild(link);
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.h1}>ThankerTokens</h1>
        <p style={styles.p}>A unique 3D token to show your gratitude.</p>
      </header>
      <main style={styles.main}>
        <div style={styles.inputSection}>
          <textarea
            style={styles.textarea}
            placeholder="Type your thank you message here..."
            rows="4"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={styles.buttons}>
            <button style={{...styles.button, backgroundColor: '#27ae60'}} onClick={handleGenerate} disabled={!modelLoaded}>
              {modelLoaded ? 'Generate Token' : 'Loading AI...'}
            </button>
            {recognition && <button style={styles.button} onClick={handleRecord}>
              {isRecording ? 'Listening...' : 'Record Voice'}
            </button>}
          </div>
        </div>
        <div style={styles.canvasSection}>
          <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={1} />
            <Suspense fallback={null}>
              <GratitudeBloom score={score} text={text} ref={bloomRef} />
            </Suspense>
            <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} />
          </Canvas>
        </div>
        <div style={styles.downloadSection}>
          <button style={{...styles.button, backgroundColor: '#8e44ad'}} onClick={handleDownload}>Download STL</button>
        </div>
      </main>
    </div>
  );
}

export default App;
