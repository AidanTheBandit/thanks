import * as tf from '@tensorflow/tfjs';

const URLS = {
  model: 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json',
  metadata: 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json',
};

let model;
let metadata;

export async function loadSentimentModel() {
  if (model && metadata) {
    return;
  }
  try {
    model = await tf.loadLayersModel(URLS.model);
    const metadataJson = await fetch(URLS.metadata);
    metadata = await metadataJson.json();
    console.log('Model and metadata loaded successfully');
  } catch (err) {
    console.error('Failed to load model and metadata', err);
  }
}

function padSequences(sequences, maxLen, padding = 'pre', truncating = 'pre', value = 0) {
  return sequences.map(seq => {
    if (seq.length > maxLen) {
      if (truncating === 'pre') {
        seq.splice(0, seq.length - maxLen);
      } else {
        seq.splice(maxLen, seq.length - maxLen);
      }
    }
    if (seq.length < maxLen) {
      const pad = [];
      for (let i = 0; i < maxLen - seq.length; ++i) {
        pad.push(value);
      }
      if (padding === 'pre') {
        seq = pad.concat(seq);
      } else {
        seq = seq.concat(pad);
      }
    }
    return seq;
  });
}

export function getSentimentScore(text) {
  if (!model || !metadata) {
    console.error('Model or metadata not loaded');
    return null;
  }

  const inputText = text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
  const sequence = inputText.map(word => {
    let wordIndex = metadata.word_index[word] + metadata.index_from;
    if (wordIndex > metadata.vocabulary_size) {
      wordIndex = 2; // OOV_INDEX
    }
    return wordIndex;
  });

  const paddedSequence = padSequences([sequence], metadata.max_len);
  const input = tf.tensor2d(paddedSequence, [1, metadata.max_len]);

  const predictOut = model.predict(input);
  const score = predictOut.dataSync()[0];
  predictOut.dispose();

  return score;
}
