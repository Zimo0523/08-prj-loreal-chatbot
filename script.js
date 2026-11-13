/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

/* Cloudflare Worker endpoint */
const WORKER_URL = "https://loreal-beauty-chatbot.zimo20079.workers.dev";

/* System prompt */
const SYSTEM_PROMPT = `
You are a friendly and professional L'Oreal beauty advisor.

Your job is to help customers learn about L'Oreal products,
including skincare, makeup, haircare, and fragrances.

You can recommend beauty products and personalized routines
based on the customer's needs and preferences.

Only answer questions related to L'Oreal products,
beauty routines, and relevant beauty topics.

If a user asks an unrelated question, politely explain
that you can only help with beauty and L'Oreal products.

Be helpful, clear, friendly, and concise.
Ask follow-up questions when useful.

Do not invent product names, prices, or ingredients.
Do not claim to have checked live product availability.
`;

/* Conversation history */
const messages = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

/* Display a chat bubble */
function addMessage(text, role) {
  const messageDiv = document.createElement("div");

  messageDiv.classList.add("msg", role);
  messageDiv.textContent = text;

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return messageDiv;
}

/* Initial welcome message */
chatWindow.innerHTML = "";

addMessage(
  "👋 Welcome to L'Oréal Beauty Advisor! How can I help you today?",
  "ai",
);

/* Handle form submission */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();

  if (!question || sendBtn.disabled) {
    return;
  }

  /* Update latest user question */
  latestQuestion.textContent = `Your latest question: ${question}`;
  latestQuestion.hidden = false;

  /* Display the user's question */
  addMessage(question, "user");

  /* Clear input */
  userInput.value = "";

  /* Disable form while waiting */
  sendBtn.disabled = true;
  userInput.disabled = true;

  /* Temporary loading message */
  const loadingMessage = addMessage("Thinking...", "ai");

  try {
    /* Prepare conversation history */
    const requestMessages = [
      ...messages,
      {
        role: "user",
        content: question,
      },
    ];

    /* Send request to Cloudflare */
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: requestMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    /* Extract the AI response */
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No AI response received.");
    }

    /* Display AI response */
    loadingMessage.textContent = aiResponse;

    /* Save conversation history */
    messages.push({
      role: "user",
      content: question,
    });

    messages.push({
      role: "assistant",
      content: aiResponse,
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    loadingMessage.textContent =
      "Sorry, I couldn't connect to the beauty advisor. Please try again later.";
  } finally {
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
});
