require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const multer = require('multer');
const fetch = require('node-fetch');
const xml2js = require('xml2js');

// Polyfill missing DOMMatrix natively impacting older pdf-parse versions on Node 20 environments natively
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix { };
}
const pdfParse = require('pdf-parse');                 

const app = express();
app.use(cors());
app.use(express.json());

// Production Deployment Setting: Server hosts the compiled React GUI files natively via Static Hosting
app.use(express.static(path.join(__dirname, '../dist')));

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Configure Multer to hold uploaded binary buffers safely in secure RAM memory (limit 5MB to respect LLM Token sizes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

const { search } = require('duck-duck-scrape');

app.post('/api/chat', upload.single('file'), async (req, res) => {
  try {
    const { message, mode, userProfile, language } = req.body;
    let finalMessageContent = message;
    let selectedModel = "llama-3.3-70b-versatile"; 
    let systemPrompt = "You are a helpful, versatile AI assistant built into a sleek application interface. Format your answers clearly using markdown.";

    // STEP 1: Handle Multimodal File Formats (Images vs PDFs)
    if (req.file) {
      const mime = req.file.mimetype;
      
      if (mime.startsWith('image/')) {
        // Use Groq's LLaMA 4 Scout Vision model for image understanding
        try {
          const base64Image = req.file.buffer.toString('base64');
          const imageDataUrl = `data:${mime};base64,${base64Image}`;
          const visionCompletion = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: imageDataUrl } },
                  { type: 'text', text: message || 'Describe this image in detail. What do you see?' }
                ]
              }
            ],
            max_tokens: 1024,
          });
          const visionReply = visionCompletion.choices[0].message.content;
          return res.json({ reply: visionReply });
        } catch (visionErr) {
          console.error('Vision model error:', visionErr.message);
          // Fallback: treat as text-only with description request
          finalMessageContent = `[User uploaded an image but vision analysis failed. Please let the user know and suggest they describe the image in text instead.]\n\nUser message: ${message || 'Analyze this image.'}`;
        }
        
      } else if (mime === 'application/pdf') {
        try {
          const pdfdata = await pdfParse(req.file.buffer);
          const textExtract = pdfdata.text?.trim();
          if (!textExtract || textExtract.length < 10) {
            finalMessageContent = `[PDF was uploaded but no readable text could be extracted — it may be a scanned/image-based PDF.]\n\nUser question: ${message || 'Please explain the document.'}`;
          } else {
            finalMessageContent = `[USER PROVIDED ATTACHED DOCUMENT EXTRACT (${Math.round(textExtract.length/1000)}k chars)]:\n\n${textExtract.slice(0, 8000)}\n\n[USER QUERY/INSTRUCTION]:\n${message || 'Summarize this document comprehensively.'}`;
          }
        } catch (pdfErr) {
          console.error('PDF parse error:', pdfErr.message);
          finalMessageContent = `[PDF parsing failed. Please try a different PDF.]\n\nUser question: ${message || 'Help me with this document.'}`;
        }
        
      } else if (mime === 'text/plain') {
        const textExtract = req.file.buffer.toString('utf-8');
        finalMessageContent = `[USER PROVIDED ATTACHED TEXT FILE]:\n\n${textExtract}\n\n[USER QUERY/INSTRUCTION]:\n${message || 'Explain this text.'}`;
      } else {
        return res.status(400).json({ reply: "Unsupported file format. Please attach Images (JPG/PNG), PDFs, or Text files." });
      }
    } else if (!message || !message.trim()) {
      return res.status(400).json({ reply: 'Please type a message or attach a file.' });
    }


    // STEP 2: Configure System Personality Identity based on Front-end Pills
    if (mode === 'notes') {
      systemPrompt = "You are an expert tutor and summarizer. Create highly structured, comprehensive text notes on the following topic. Always use rich markdown formatting: use main headers (##), bold text for key terms, nested bullet points, and numbered lists where appropriate logically.";
    } else if (mode === 'qa') {
      systemPrompt = "You are a specialized technical problem solver. Answer the following user doubt directly. Cut out introductory fluff, state the core solution concisely, and explain the logic clearly step by step.";
    } else if (mode === 'explain') {
       systemPrompt = "You are a master teacher. Explain the following concept natively from the ground up so a complete absolute beginner or a 5-year-old can understand it fundamentally. Use engaging analogies from daily life where perfectly applicable.";
    } else if (mode === 'questions') {
       systemPrompt = "You are a university examiner. Generate exactly 5 challenging, analytical, and highly relevant questions based strictly on the provided topic. Provide the exact answer key clearly grouped at the very bottom.";
    } else if (mode === 'symptom') {
       systemPrompt = `You are a knowledgeable AI health assistant. When given symptoms, you must:
1. List possible conditions that match (from most to least likely)
2. Rate urgency: 🟢 Low / 🟡 Moderate / 🔴 High
3. Suggest 3-5 simple home remedies or immediate actions
4. Clearly state: "⚠️ This is an AI analysis only — please consult a real doctor for diagnosis."
Be empathetic, clear, and structured. Never refuse to analyze symptoms.`;
    } else if (mode === 'fitness') {
       systemPrompt = `You are a certified fitness coach and nutritionist. When given a user's fitness goal, weight, height or age, you must:
1. Create a 7-day workout plan (day-by-day, specific exercises with sets/reps)
2. Create a simple meal plan for the week (breakfast, lunch, dinner)
3. Give 3 key tips for success
4. Keep it practical for Indian users (use desi foods like dal, roti, sabzi in meal plans)
Be motivating and structured. Format clearly with headings.`;
    } else if (mode === 'web') {
       const currentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
       systemPrompt = `You are a powerful Live Internet Research Agent. Today's exact date is: ${currentDate}. You will be given REAL-TIME search results fetched right now from the internet. Use this data as your primary source. Always state facts with confidence. Reference the year 2026 where relevant. If the data mentions dates, use them. Be precise and up-to-date.`;
       
       // ── Dual-Source Real-Time Search Engine ──
       try {
          let searchContext = '';

          // SOURCE 1: Google News RSS (most reliable for breaking 2026 news)
          try {
            const query = encodeURIComponent(message);
            const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
            const rssRes = await fetch(rssUrl, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
              timeout: 6000 
            });
            const rssText = await rssRes.text();
            const parsed = await xml2js.parseStringPromise(rssText, { explicitArray: false });
            const items = parsed?.rss?.channel?.item;
            if (items) {
              const articles = Array.isArray(items) ? items.slice(0, 5) : [items];
              searchContext += `[GOOGLE NEWS - LIVE RESULTS as of ${currentDate}]\n`;
              articles.forEach((item, i) => {
                const pubDate = item.pubDate ? ` (${item.pubDate})` : '';
                searchContext += `${i+1}. ${item.title}${pubDate}\n   Source: ${item.link}\n\n`;
              });
            }
          } catch (rssErr) {
            console.log('Google News RSS failed, trying DuckDuckGo...', rssErr.message);
          }

          // SOURCE 2: DuckDuckGo Instant Answer API (backup general knowledge)
          try {
            const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(message)}&format=json&no_html=1&skip_disambig=1`;
            const ddgRes = await fetch(ddgUrl, { timeout: 5000 });
            const ddgData = await ddgRes.json();
            if (ddgData.AbstractText) {
              searchContext += `[DUCKDUCKGO SUMMARY]\n${ddgData.AbstractText}\nSource: ${ddgData.AbstractURL}\n\n`;
            }
            if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
              searchContext += '[RELATED INSIGHTS]\n';
              ddgData.RelatedTopics.slice(0, 3).forEach(t => {
                if (t.Text) searchContext += `- ${t.Text}\n`;
              });
            }
          } catch (ddgErr) {
            console.log('DuckDuckGo fallback skipped:', ddgErr.message);
          }

          if (searchContext.trim().length > 50) {
            finalMessageContent = `[REAL-TIME INTERNET DATA - Fetched on ${currentDate}]\n\n${searchContext}\n\n[USER QUESTION]: ${message}`;
          } else {
            // Final fallback: date-aware prompt even without search data
            finalMessageContent = `[Today is ${currentDate}. No external data could be fetched but answer based on your latest knowledge for 2026.]\n\nQuestion: ${message}`;
          }

       } catch (err) {
          console.error('Deep Search Engine Error:', err);
          finalMessageContent = `[Today is ${new Date().toLocaleDateString()}. Live search failed. Please answer from your most recent knowledge.]\n\n${message}`;
       }
    } else if (mode === 'image') {
       // Force GROQ to formulate a cinematic prompt bridging plain user directives into complex arrays
       const visualSystemPrompt = "You are an expert at writing highly detailed, cinematic 4K prompts for text-to-image AI generators. The user will give you a basic idea. Your ONLY job is to output a single, highly descriptive prompt phrase without any intro, outro, or conversation. Just the raw, expanded visual prompt string separated by commas. Make it hyper-realistic, 8k resolution, Unreal Engine 5 styling.";
       
       const enhancedPromptCompletion = await groq.chat.completions.create({
         messages: [
           { role: "system", content: visualSystemPrompt },
           { role: "user", content: finalMessageContent }
         ],
         model: "llama-3.3-70b-versatile",
       });
       
       let enhancedString = enhancedPromptCompletion.choices[0].message.content.trim();
       enhancedString = enhancedString.replace(/^(Here is your prompt:|Prompt:|Output:)/gi, '').trim();

       // Native unauthenticated connection scaling seamlessly without rate-limit constraints globally
       const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedString)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random()*100000)}`;

       return res.json({ 
          reply: `Here is the visual masterpiece you requested!\n\n![${enhancedString}](${imageUrl})\n\n*(Note: Enhanced Prompt generated by LLaMA: "${enhancedString}")*` 
       });
    }

    // Embed absolute identity overrides preventing hallucination divergence globally
    systemPrompt = `Your name is Arise, a highly capable AI assistant. If asked who you are or what your name is, boldly state that your name is Arise. \n\n${systemPrompt}`;
    
    // Inject Permanent Brain Profile Memory natively preventing context loss
    if (userProfile && userProfile.trim().length > 0) {
       systemPrompt += `\n\n[CRITICAL USER CONTEXT PROFILE - ALWAYS KEEP THIS IN MIND]: \n${userProfile}`;
    }

    // Language Override — AI must respond in the user-selected language
    const languageInstructions = {
      english:    'IMPORTANT: Always respond in clear, fluent English only.',
      hinglish:   'IMPORTANT: Always respond in Hinglish — a natural mix of Hindi and English, the way Indian youth speak casually. Use Roman script (not Devanagari). Example: "Yeh topic bohot interesting hai, let me explain it step by step."',
      hindi:      'IMPORTANT: Always respond in pure Hindi using Devanagari script only (हिन्दी में जवाब दो).',
      spanish:    'IMPORTANT: Always respond in fluent Spanish only. (Responde siempre en español.)',
      french:     'IMPORTANT: Always respond in fluent French only. (Réponds toujours en français.)',
      arabic:     'IMPORTANT: Always respond in fluent Modern Standard Arabic only. (أجب دائمًا باللغة العربية.)',
      japanese:   'IMPORTANT: Always respond in fluent Japanese only. (常に日本語で返答してください。)',
      german:     'IMPORTANT: Always respond in fluent German only. (Antworte immer auf Deutsch.)',
      portuguese: 'IMPORTANT: Always respond in fluent Portuguese only. (Responda sempre em português.)',
      chinese:    'IMPORTANT: Always respond in fluent Simplified Chinese only. (请始终用简体中文回答。)',
    };

    if (language && languageInstructions[language]) {
       systemPrompt += `\n\n${languageInstructions[language]}`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: finalMessageContent }
      ],
      model: selectedModel, 
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });
    
  } catch (error) {
    console.error("Groq Network Logic Error:\n", error);
    res.status(500).json({ reply: `Server Generative Process Error: ${error.message || 'Generation critically failed.'}` });
  }
});

// Wildcard Fallback Controller (Express 5 Compatible) 
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// Structural Binding using Render-supported PORT environment variables
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Arise AI Engine Application Logic mapped and operational over port ${PORT}`);
});
