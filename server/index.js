require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Groq uses an OpenAI compatible structure!
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Initialize Groq Client
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log(`Received message from frontend: ${message}`);

  try {
    const completion = await groq.chat.completions.create({
      // Provide system context so the bot knows how to act natively
      messages: [
        { role: "system", content: "You are a helpful, versatile AI assistant built into a sleek application interface." },
        { role: "user", content: message }
      ],
      // LLaMA 3 8B model is blisteringly fast on Groq!
      model: "llama-3.3-70b-versatile", 
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Groq API Error:", error.message || error);
    res.status(500).json({ reply: `AI Generation Error: ${error.message || 'Check terminal logs'}` });
  }
});

app.listen(PORT, () => {
  console.log(`AI Chat Backend is running completely functionally on http://localhost:${PORT}`);
});
