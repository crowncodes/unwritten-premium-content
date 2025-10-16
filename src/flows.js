import { flow } from 'genkit';
import { geminiPro } from '@genkit-ai/google-cloud';
import * as z from 'zod';
import * as admin from 'firebase-admin';

export const getPersonalizedGreeting = flow(
  {
    name: 'getPersonalizedGreeting',
    inputSchema: z.object({ uid: z.string() }),
    outputSchema: z.string(),
  },
  async ({ uid }) => {
    try {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      const userName = userDoc.exists && userDoc.data().name ? userDoc.data().name : 'friend';

      const llmResponse = await geminiPro.generate({
        prompt: `Generate a short, friendly greeting for ${userName}.`,
      });

      return llmResponse.text();
    } catch (error) {
      console.error('Error in getPersonalizedGreeting flow:', error);
      throw new Error('Failed to generate greeting.');
    }
  }
);
