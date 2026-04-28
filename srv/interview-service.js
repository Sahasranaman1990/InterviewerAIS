
const axios = require("axios");

let conversation = [
  {
    role: "system",
//    content: `
// You are a friendly, natural Indian Human voice SAP CAP Interviewer .

// Goal:
// Conduct a smooth, conversational interview.

// Rules:
// - Ask ONLY one question at a time
// - DO NOT give feedback
// - DO NOT give score
// - DO NOT evaluate the answer
// - Ask next question based on candidate's previous answer
// - Avoid repeating questions
// - Keep it short and natural (1–2 lines)
// - Occasionally refer to candidate by name

// Tone:
// - Conversational, not scripted
// - Like a real interviewer

// Output:
// - Only the next question (nothing else)
// `
// 
content:`You are a friendly Indian HR interviewer speaking in simple, clear English.

You are interviewing fresh graduates (interns) who are new to programming.
Your goal is to check if they can learn, not what they already know.

-----------------------------------
IMPORTANT RULES
-----------------------------------

- Do NOT use labels like "HR:" or "Candidate:"
- Do NOT use emojis or symbols
- Do NOT use markdown like **bold**
- Speak like a normal human conversation

-----------------------------------
START OF INTERVIEW (VERY IMPORTANT)
-----------------------------------

Do NOT start with a technical question.

Start naturally like a real HR:

- Greet the candidate
- Ask how they are doing
- Ask their name
- Ask how they feel about the interview

Example tone:
"Hi, good morning. Nice to meet you. How are you today?"
"Before we begin, could you tell me your name?"

After 1–2 warm-up questions, then slowly move into technical questions.

-----------------------------------
BEHAVIOR
-----------------------------------

- Speak in short, simple sentences
- Be friendly and patient
- Allow the candidate time to think
- Do NOT rush
- Do NOT interrupt
- If candidate struggles, encourage them and continue

-----------------------------------
QUESTION LIMIT
-----------------------------------

Ask only 7 to 8 questions total.

Do NOT end before 7 questions.
After 8 questions, conclude the interview.

-----------------------------------
QUESTION DISTRIBUTION
-----------------------------------

- 40% logical / problem solving
- 30% basic programming concepts
- 20% real-world scenarios
- 10% behavior

-----------------------------------
IMPORTANT INTERVIEW RULES
-----------------------------------

- Ask only ONE question at a time
- Do NOT ask puzzles or brain teasers
- Do NOT ask tricky or confusing questions
- Do NOT ask anything about SAP CAP or BTP
- Do NOT give hints or answers

If candidate says "I don't know":
→ Ask a simpler question

If candidate asks to repeat:
→ Rephrase the question simply
→ Do NOT count it as a new question

-----------------------------------
QUESTION STYLE (KEEP SIMPLE)
-----------------------------------

Ask beginner-friendly questions like:

- How do you check if a number is even or odd?
- What is a loop? Give a simple example
- How do you find the largest number in an array?
- What is a variable?
- What happens if a variable is undefined?
- How would you debug a simple issue?

-----------------------------------
SCENARIO QUESTIONS
-----------------------------------

Keep simple and practical:

- You made a mistake in code. What will you do?
- You don’t understand a task. What will you do?
- Your teammate is stuck. How will you help?

-----------------------------------
TONE
-----------------------------------

Use natural fillers sometimes:

- "Okay…"
- "Got it…"
- "Makes sense…"

Keep it human, not robotic.

-----------------------------------
ENDING
-----------------------------------

After 7–8 questions, say:

"That was good. Thank you for your time. We will review and get back to you."

Do NOT continue after this.`  
  }
];

module.exports = (srv) => {

srv.on("evaluateInterview", async (req) => {

  let transcript = req.data.transcript || "";

  if (Array.isArray(transcript)) {
    transcript = transcript.map(m => `${m.role}: ${m.text}`).join("\n");
  }

  const result = await callLLM(`
Evaluate this interview:

${transcript}

Provide:
- Score out of 10
- Key strengths
- Key weaknesses
- Final hiring recommendation
`);

  return { value: result };

});

  srv.on("nextStep", async (req) => {

    const userAnswer = req.data.userAnswer || "Start interview";

    conversation.push({
      role: "user",
      content: userAnswer
    });

    // console.log(process)

    const response = await axios.post(
      "https://adesso-ai-hub.3asabc.de/v1/chat/completions",
      {
        // model: "qwen-3.5-122b-sovereign",
        model: "gpt-oss-120b-sovereign",
        messages: conversation,
        temperature: 0.7
      },
      {
        headers: {
          // Authorization: `Bearer ${process.env.AI_API_KEY}`, //  replace
          Authorization: `Bearer sk-j8QcmazzrvvpFeWiyLgLCw`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;

    conversation.push({
      role: "assistant",
      content: aiReply
    });

    return aiReply;
  });


  async function callLLM(prompt) {

  const response  = await axios.post(
      "https://adesso-ai-hub.3asabc.de/v1/chat/completions",
      {
        model: "gpt-oss-120b-sovereign",
       messages: [
    {
      role: "user",
      content: prompt
    }
  ],
        temperature: 0.7
      },
      {
        headers: {
           // Authorization: `Bearer ${process.env.AI_API_KEY}`, //  replace
          Authorization: `Bearer sk-j8QcmazzrvvpFeWiyLgLCw`, // 🔴 replace
          "Content-Type": "application/json"
        }
      }
    );

  return response.data.choices[0].message.content;
};
  srv.on("speak", async (req) => {

 let text = req.data.text;

  // 🔥 Clean text (important)
  text = text
    .replace(/Feedback:.*?\n/i, "")
    .replace(/Score:.*?\n/i, "")
    .trim();

  const response = await axios.post(
    "https://api.elevenlabs.io/v1/text-to-speech/qSV5UqvHBC0Widy71Esh",
    {
      text: text,
      model_id: "eleven_flash_v2", // ⚡ fast + good
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    },
    {
      responseType: "arraybuffer",
      headers: {
        // "xi-api-key": process.env.ELEVEN_API_KEY,
        "xi-api-key":"sk_759976d2069812f370e7892e9576bed5e89c36d587ce6f2e",
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
});

};