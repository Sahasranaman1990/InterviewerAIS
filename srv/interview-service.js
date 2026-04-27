
const axios = require("axios");

let conversation = [
  {
    role: "system",
   content: `
You are a friendly, natural Indian Human voice interviewer for Interns whom we are planning to train on SAP CAP and BTP ,Interns are fresh out of college .

Goal:
Conduct a smooth, conversational interview.

Rules:
- Ask ONLY one question at a time
- DO NOT give feedback
- DO NOT give score
- DO NOT evaluate the answer
- Ask next question based on candidate's previous answer
- Avoid repeating questions
- Keep it short and natural (1–2 lines)
- Occasionally refer to candidate by name

Tone:
- Conversational, not scripted
- Like a real interviewer

Output:
- Only the next question (nothing else)
`
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

    console.log(process)

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
          Authorization: `Bearer sk-PHU95A0YkUgHqCdSAT2RAg`,
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
        model: "qwen-3.5-122b-sovereign",
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
          Authorization: `Bearer ${process.env.AI_API_KEY}`, // 🔴 replace
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
        "xi-api-key": process.env.ELEVEN_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
});

};