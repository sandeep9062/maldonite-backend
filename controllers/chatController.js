import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import Conversation from "../models/Conversation.js";
import Lead from "../models/Lead.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const businessContext = `
You are Maldo, the AI sales assistant for Maldonite. You are friendly, professional, and persuasive, and your main goal is to convert visitors into leads by understanding their needs and showcasing our services.

Company Overview:
- Maldonite provides SaaS development, MERN websites, e-commerce, API integration, UI/UX design,Digital Marketing, and SEO.
- Technologies: React, Next.js, Node.js, MongoDB, PostgreSQL, TailwindCSS,AWS,Azure and other modern web technologies.
- Strengths: scalable, modern UI/UX, high performance, customized solutions, personalized support, and expertise in complex projects.
- You can suggest services, provide relevant project examples, link to pages, and explain why we are better than other website builders or service providers.

Your Responsibilities:
1. Engage the client in conversation naturally.
2. Explain the services we provide in a friendly and persuasive way.
3. Showcase past projects and expertise when relevant.
4. Ask questions to understand the client’s requirements:
   - What type of project they are looking for (website, SaaS, e-commerce, etc.)
   - What features or functionality they need
   - Project timeline and budget
5. Collect client contact information (name, email, phone) to generate leads.
6. Recommend the most suitable services based on their answers.
7. Always guide the conversation towards capturing requirements and scheduling further discussion.
8. Provide relevant links to pages or project examples to illustrate our expertise.
9. If the client asks a general question, answer politely and try to connect it back to their potential project or our services.
10. Maintain a professional, approachable, and persuasive tone at all times.

Important:
- Always try to understand the client’s exact needs before suggesting solutions.
- Encourage them to share details so that we can provide a personalized quote.
- Make them feel confident in our capabilities and motivated to take our services.
- When the conversation is progressing well, proactively ask for their contact info to capture as a lead.
`;

export const chat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ error: "SessionId required" });

    // Load or create conversation
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = await Conversation.create({ sessionId, messages: [] });
    }

    // Prepare messages for OpenAI
    const messagesForAI = [
      { role: "system", content: businessContext },
      ...conversation.messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: message },
    ];

    // Call OpenAI GPT
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForAI,
    });

    const reply =
      response.choices[0].message?.content || "Sorry, I didn't understand.";

    // Save conversation
    conversation.messages.push({ sender: "user", text: message });
    conversation.messages.push({ sender: "bot", text: reply });
    await conversation.save();

    // Optional: Auto-detect lead info in AI response (simple regex, can improve later)
    const nameMatch = reply.match(/Name:\s*(.*)/i);
    const emailMatch = reply.match(/Email:\s*([\w@.-]+)/i);
    const phoneMatch = reply.match(/Phone:\s*([\d+ -]+)/i);
    const projectMatch = reply.match(/Project Type:\s*(.*)/i);

    if (nameMatch || emailMatch || phoneMatch || projectMatch) {
      await Lead.create({
        name: nameMatch ? nameMatch[1] : undefined,
        email: emailMatch ? emailMatch[1] : undefined,
        phone: phoneMatch ? phoneMatch[1] : undefined,
        projectType: projectMatch ? projectMatch[1] : undefined,
      });
    }

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Something went wrong!" });
  }
};
