# OpenRouter Setup Guide

## Step 1 — Install the SDK

Open a terminal in your project root and run:

```bash
npm install openai
```

Project structure:

```text
my-project/
├── src/
│   ├── lib/
│   │   └── openrouter.js
│   ├── app/
│   └── components/
├── .env.local
├── package.json
└── ...
```

---

## Step 2 — Add Your OpenRouter API Key

Create a `.env.local` file in the project root:

```env
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
```

⚠️ Never hardcode API keys directly into your source code.

---

## Step 3 — Create the OpenRouter Client

Create the file:

```text
src/lib/openrouter.js
```

Add the following code:

```javascript
import OpenAI from "openai";

export const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "YOUR_OPENROUTER_API_KEY",
});
```

---

## Step 4 — Configure Available Models

In the same file (`src/lib/openrouter.js`), add:

```javascript
export const MODELS = {
  fast: "minimax/minimax-m1",
  smart: "minimax/minimax-m3",
  reasoning: "deepseek/deepseek-r1",
  premium: "openai/gpt-5",
};
```

---

## Step 5 — Make Your First LLM Request

Create or update:

```text
src/lib/chat.js
```

```javascript
import { client, MODELS } from "./openrouter";

export async function generateResponse(messages) {
  const response = await client.chat.completions.create({
    model: MODELS.smart,
    messages,
  });

  return response.choices[0].message.content;
}
```

Example:

```javascript
const reply = await generateResponse([
  {
    role: "user",
    content: "Explain RAG in simple terms",
  },
]);

console.log(reply);
```

---

## Step 6 — Streaming Responses (Recommended)

For chat applications, use streaming:

```javascript
import { client, MODELS } from "./openrouter";

const stream = await client.chat.completions.create({
  model: MODELS.smart,
  messages,
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(
    chunk.choices[0]?.delta?.content || ""
  );
}
```

---

## Suggested Models

| Use Case        | Model                |
| --------------- | -------------------- |
| Fast & Low Cost | minimax/minimax-m1   |
| General Purpose | minimax/minimax-m3   |
| Deep Reasoning  | deepseek/deepseek-r1 |
| Premium Quality | openai/gpt-5         |

---

## Important Notes

* Store all OpenRouter-related code inside `src/lib/`.
* Keep API keys only in `.env.local`.
* Never expose API keys in frontend code.
* Use `MODELS.smart` as the default model unless your use case requires otherwise.
* You may switch models dynamically depending on your application's needs.