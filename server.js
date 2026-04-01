require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');
const path = require('path');

const app = express();
const PORT = 3000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/recommend', async (req, res) => {
  try {
    const { age, gender, skinType, concerns, allergies, budget } = req.body;

    const prompt = `You are an expert dermatologist and skincare consultant. Based on the following user profile, create a comprehensive, personalized skincare routine with specific product recommendations.

USER PROFILE:
- Age Range: ${age}
- Gender: ${gender}
- Skin Type: ${skinType}
- Skin Concerns: ${concerns.join(', ')}
- Allergies/Sensitivities: ${allergies.join(', ')}
- Budget Preference: ${budget}

INSTRUCTIONS:
1. Create a morning routine and an evening routine with 4-6 steps each.
2. Recommend specific, real products that are commonly available on Amazon India.
3. For each step, provide the step name, a specific product name, a brief explanation of why it helps, and the product's approximate price range in INR.
4. Also suggest 1-2 weekly treatments.
5. Provide 3-4 general skincare tips personalized for this profile.
6. IMPORTANT: Ensure all recommended products are safe given the user's allergies/sensitivities.
7. Consider the user's budget preference when recommending products.

Respond ONLY with valid JSON in exactly this format (no markdown, no code fences, just raw JSON):
{
  "summary": "A 1-2 sentence personalized summary of the user's skin profile and what the routine targets.",
  "morningRoutine": [
    {
      "step": 1,
      "name": "Step Name (e.g., Cleanser)",
      "product": "Specific Product Name",
      "brand": "Brand Name",
      "reason": "Why this product helps your specific concerns",
      "priceRange": "₹XXX - ₹XXX"
    }
  ],
  "eveningRoutine": [
    {
      "step": 1,
      "name": "Step Name",
      "product": "Specific Product Name",
      "brand": "Brand Name",
      "reason": "Why this product helps your specific concerns",
      "priceRange": "₹XXX - ₹XXX"
    }
  ],
  "weeklyTreatments": [
    {
      "name": "Treatment Name",
      "product": "Specific Product Name",
      "brand": "Brand Name",
      "frequency": "How often (e.g., Once a week)",
      "reason": "Why this helps"
    }
  ],
  "tips": [
    "Personalized tip 1",
    "Personalized tip 2",
    "Personalized tip 3"
  ]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert dermatologist AI assistant. You always respond with valid JSON only. Never include markdown formatting, code fences, or any text outside the JSON object.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', responseText);
      return res.status(500).json({ error: 'Failed to parse recommendation. Please try again.' });
    }

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Groq API Error:', error.message);
    res.status(500).json({ error: 'Failed to generate recommendations. Please try again.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✨ Skincare Assist running at http://localhost:${PORT}`);
});
