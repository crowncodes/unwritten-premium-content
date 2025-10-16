import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { runFlow } from 'genkit/flow';
import { initializeGenkit } from 'genkit';
import { googleCloud } from '@genkit-ai/google-cloud';

// Keep this import for plugins
import genkitConfig from '../genkit.json' assert { type: 'json' };

import { authMiddleware } from './authMiddleware.js';
import { getPersonalizedGreeting } from './flows.js';

// Initialize Genkit
await initializeGenkit({
  plugins: [googleCloud()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Initialize Firebase Admin SDK
// On Cloud Run, this will use Application Default Credentials.
// For local dev, set GOOGLE_APPLICATION_CREDENTIALS env var.
admin.initializeApp();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/greet', authMiddleware, async (req, res) => {
  const uid = req.user.uid;
  try {
    const greeting = await runFlow(getPersonalizedGreeting, { uid });
    res.json({ greeting });
  } catch (error) {
    console.error('Error running flow from API:', error);
    res.status(500).send('An error occurred while generating the greeting.');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
