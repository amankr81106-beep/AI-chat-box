require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Production Deployment Setting: Server hosts the compiled React GUI files natively via Static Hosting!
app.use(express.static(path.join(__dirname, '../dist')));

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

app.post('/api/chat', async (req, res) => {
  const { message, mode } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let systemPrompt = "You are a helpful, versatile AI assistant built into a sleek application interface. Format your answers clearly using markdown.";
  
  if (mode === 'notes') {
    systemPrompt = "You are an expert tutor and summarizer. Create highly structured, comprehensive text notes on the following topic. Always use rich markdown formatting: use main headers (##), bold text for key terms, nested bullet points, and numbered lists where appropriate logically.";
  } else if (mode === 'qa') {
    systemPrompt = "You are a specialized technical problem solver. Answer the following user doubt directly. Cut out introductory fluff, state the core solution concisely, and explain the logic clearly step by step.";
  } else if (mode === 'explain') {
    systemPrompt = "You are a master teacher. Explain the following concept natively from the ground up so a complete absolute beginner or a 5-year-old can understand it fundamentally. Use engaging analogies from daily life where perfectly applicable.";
  } else if (mode === 'questions') {
    systemPrompt = "You are a university examiner. Generate exactly 5 challenging, analytical, and highly relevant questions based strictly on the provided topic. Provide the exact answer key clearly grouped at the very bottom.";
  }

  // Forcefully inject the identity into every single prompt block
  systemPrompt = `Your name is Arise, a highly capable AI assistant. If asked who you are or what your name is, boldly state that your name is Arise. \n\n${systemPrompt}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile", 
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Groq Formatted Error:", error.message || error);
    res.status(500).json({ reply: `Generation Context Error: ${error.message || 'Fatal generation error.'}` });
  }
});

// Wildcard Fallback Controller: Ensure client-side internal links and 404s route properly through the HTML
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// Structural Binding using Render-supported PORT environment variables
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Arise AI Application Engine active on port ${PORT}`);
});
