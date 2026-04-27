sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("ai.interviewerai.controller.Home", {

   onInit: function () {
      this.getView().setModel(new JSONModel({
        messages: [],
        totalScore: 0,
        count: 0,
         evaluation: ""
      }), "chat");

      this._initSpeech();

  // 🔊 Proper voice loading (production way)
  this._loadVoices();
    },

    _loadVoices: function () {

  this.availableVoices = [];

  const load = () => {
    this.availableVoices = speechSynthesis.getVoices();
  };

  load();

  // 🔥 important: handle async load
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = load;
  }
},
_getFiller: function () {

  const fillers = [
    "Hmm… okay…",
    "Alright… got it…",
    "Interesting…",
    "Makes sense…",
    "Okay… I see…"
  ];

  return fillers[Math.floor(Math.random() * fillers.length)];
},
    // 🎤 Speech Recognition
    _initSpeech: function () {

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = "en-US";
        this.recognition.interimResults = false;
        this.recognition.continuous = false;
        this.recognition.maxAlternatives = 1;

          // 🔥 Increase tolerance
          this.recognition.onend = () => {
            console.log("Mic ended");
          };

this.recognition.onresult = (event) => {

  const transcript = event.results[0][0].transcript;

  console.log("You:", transcript);

  // 🧠 prevents cutting user mid-sentence
  setTimeout(() => {
    this._handleAnswer(transcript);
  }, 300);
};

        this.recognition.onerror = () => {
          MessageToast.show("Mic error");
        };

      } else {
        MessageToast.show("Speech not supported");
      }
    },

    // 🔊 AI Speech (only question)
speakText: function (text) {

  // 🔥 Extract only question
  let clean = text.split("Next:")[1] || text;

  clean = clean.trim();

  // 🎯 Use Eleven only for short text
  // if (clean.length < 120) {
  //   this._speakWithEleven(clean);
  // } else {
    this._browserSpeak(clean);
  // }
},

_speakWithEleven: async function (text) {

  try {

    const oModel = this.getView().getModel();
    const oAction = oModel.bindContext("/speak(...)");

    oAction.setParameter("text", text);

    await oAction.execute();

    const audioData = oAction.getBoundContext().getObject();

    // ❗ fallback if empty (quota over)
    if (!audioData || !audioData.value || audioData.value.length === 0) {
      this._browserSpeak(text);
      return;
    }

    const blob = new Blob([audioData.value], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);

    audio.play();

    audio.onended = () => {
      this._startListening();
    };

  } catch (e) {

    console.warn("Fallback to browser voice");

    this._browserSpeak(text);
  }
},
_browserSpeak: function (text) {

  const utter = new SpeechSynthesisUtterance(text);

  const voices = speechSynthesis.getVoices();

  const preferred = voices.find(v =>
    v.name.includes("Google") ||
    v.name.includes("Microsoft")
  );

  if (preferred) {
    utter.voice = preferred;
  }

  utter.rate = 0.93;
  utter.pitch = 1;

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);

  utter.onend = () => {
    this._startListening();
  };
},
_startListening: function () {
  setTimeout(() => {
    if (this.recognition) {
      this.recognition.start();
    }
  }, 250);
},
    // ▶ Start Interview
    onStartInterview: async function () {

      const oModel = this.getView().getModel();
      const chatModel = this.getView().getModel("chat");

      try {

        chatModel.setProperty("/messages", []);
        chatModel.setProperty("/totalScore", 0);
        chatModel.setProperty("/count", 0);

        const oAction = oModel.bindContext("/nextStep(...)");

        oAction.setParameter("userAnswer", "Start interview");

        await oAction.execute();

        const oData = oAction.getBoundContext().getObject();
        const aiReply = oData.value;

        let messages = chatModel.getProperty("/messages");

        messages.push({
          role: "ai",
          text: aiReply,
          score: 0
        });

        chatModel.setProperty("/messages", messages);

       setTimeout(() => {
  this.speakText(aiReply);
}, 300);

      } catch (e) {
        console.error(e);
        MessageToast.show("Error starting interview");
      }
    },

    // 🧠 Handle Answer
_handleAnswer: async function (userInput) {

  const oModel = this.getView().getModel();
  const chatModel = this.getView().getModel("chat");

  try {

    // ✅ STEP 1: Count check BEFORE API call
    let count = chatModel.getProperty("/count") || 0;

    if (count >= 8) {
      this.speakText("Great, I think we have enough. Let's wrap up.");

      this.onFinishInterview(); // triggers evaluation
      return;
    }

    // ✅ Increment count early
    chatModel.setProperty("/count", count + 1);


    // ✅ STEP 2: Store user message
    let messages = chatModel.getProperty("/messages");

    messages.push({
      role: "user",
      text: userInput
    });

    chatModel.setProperty("/messages", messages);


    // ✅ STEP 3: Call CAP action
    const oAction = oModel.bindContext("/nextStep(...)");
    oAction.setParameter("userAnswer", userInput);

    await oAction.execute();

    const oData = oAction.getBoundContext().getObject();
    const aiReply = oData.value;


    // ✅ STEP 4: Detect "wrap up" intent
    if (/wrap|finish|end|close/i.test(userInput)) {
      this.speakText("Sure, let's wrap up the interview.");
      this.onFinishInterview();
      return;
    }


    // ✅ STEP 5: Push AI response
    messages.push({
      role: "ai",
      text: aiReply
    });

    chatModel.setProperty("/messages", messages);


    // ✅ STEP 6: Speak response
    this.speakText(aiReply);

  } catch (e) {
    console.error(e);
    sap.m.MessageToast.show("Error during interview");
  }
},

onFinishInterview: async function () {

  const oModel = this.getView().getModel();
  const chatModel = this.getView().getModel("chat");

  try {

    const messages = chatModel.getProperty("/messages");

    // ✅ Convert to proper transcript string
    const transcript = messages.map(m => {
      return `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.text}`;
    }).join("\n");

    console.log("Transcript being sent:", transcript);

    const oAction = oModel.bindContext("/evaluateInterview(...)");

    oAction.setParameter("transcript", transcript); // MUST be string

    await oAction.execute();

    const result = oAction.getBoundContext().getObject();

    chatModel.setProperty("/evaluation", result.value);

  } catch (e) {
    console.error(e);
    sap.m.MessageToast.show("Error generating evaluation");
  }
},
_isEndIntent: function (text) {
  const t = text.toLowerCase();

  return (
    t.includes("end") ||
    t.includes("stop") ||
    t.includes("wrap up") ||
    t.includes("close interview") ||
    t.includes("finish")
  );
}

  });
});