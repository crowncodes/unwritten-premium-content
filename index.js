
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const { getDatabase } = require('firebase-admin/database');
const { configure } = require('@genkit-ai/core');
const { defineFlow, run } = require('@genkit-ai/flow');
const { firebase } = require('@genkit-ai/firebase');
const { googleAI } = require('@genkit-ai/googleai');
const { z } = require('zod');
const express = require('express');
const { generate }.
const { generate } = require('@genkit-ai/ai');


// Initialize Firebase
initializeApp({
  credential: applicationDefault(),
  databaseURL: `https://crowncodes.firebaseio.com`,
  storageBucket: `crowncodes.appspot.com`
});

// Configure Genkit
configure({
  plugins: [
    firebase,
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracing: true,
});

// Define a Genkit flow
const exampleFlow = defineFlow(
  {
    name: 'exampleFlow',
    inputSchema: z.object({
      uid: z.string(),
      prompt: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { uid, prompt } = input;

    // Interact with Realtime Database
    const db = getDatabase();
    const ref = db.ref(`users/${uid}/prompts`);
    await ref.push(prompt);

    // Interact with Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(`user-files/${uid}/prompt.txt`);
    await file.save(prompt);

    // Use a Genkit model
    const llmResponse = await generate({
        prompt: `You are a helpful assistant. The user said: ${prompt}`,
        model: googleAI('gemini-1.5-flash'),
    });

    return llmResponse.text();
  }
);


const app = express();
app.use(express.json());

// Expose the flow as an HTTP endpoint
app.post('/run-flow', async (req, res) => {
    const { authorization } = req.headers;
    const { prompt } = req.body;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized');
    }

    const token = authorization.split('Bearer ')[1];

    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        const result = await run(exampleFlow, { uid, prompt });
        res.status(200).send({ result });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


const port = process.env.PORT || 3000;
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server listening on port ${port}`);
});
