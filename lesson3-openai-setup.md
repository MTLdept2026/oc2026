# Lesson 3 Site Setup

## What This Package Includes

- `wartawan-cilik-lesson3.html`: the student-facing lesson site
- `lesson3-server.mjs`: a tiny local server that serves the site and safely forwards chat requests to OpenAI
- `lesson3-running-sheet.md`: the teacher running sheet
- three mystery guests are supported: Hang Nadim, Mahsuri, and Mat Jenin

## Why The Site Uses A Local Server

OpenAI's docs state that API keys are secrets and must not be exposed in client-side code such as browsers or apps. That means the browser page should not contain your real API key. Instead, the page sends messages to a local server, and the server sends the request to OpenAI.

Official references:

- Developer quickstart: [https://developers.openai.com/api/docs/quickstart](https://developers.openai.com/api/docs/quickstart)
- Authentication guidance: [https://developers.openai.com/api/reference/overview#authentication](https://developers.openai.com/api/reference/overview#authentication)
- Models guide: [https://developers.openai.com/api/docs/models](https://developers.openai.com/api/docs/models)
- Conversation state: [https://developers.openai.com/api/docs/guides/conversation-state](https://developers.openai.com/api/docs/guides/conversation-state)
- Responses migration guide: [https://developers.openai.com/api/docs/guides/migrate-to-responses](https://developers.openai.com/api/docs/guides/migrate-to-responses)

## 1. Create An OpenAI API Key

The official quickstart says to create an API key in the dashboard and export it as an environment variable.

Do this in the browser:

1. Go to the API dashboard: [https://platform.openai.com](https://platform.openai.com)
2. Create or open your project
3. Open the API keys page and create a key
4. Copy the key once and store it safely

Important:

- Do not paste the key into the HTML file
- Do not commit or share the key
- Keep it only in your terminal environment or another secure secret store

## 2. Export The API Key On Your Mac

In Terminal:

```bash
export OPENAI_API_KEY="your_api_key_here"
```

If you want that variable available in future terminal sessions, add it to your shell profile such as `~/.zshrc`.

## 3. Choose A Model

OpenAI's current models guide says:

- `gpt-5.4` is the flagship model for complex reasoning
- `gpt-5.4-mini` is the lower-latency, lower-cost option

For this lesson site, `gpt-5.4-mini` is the best default because it is fast enough for classroom turn-taking while still strong at following instructions.

Optional:

```bash
export OPENAI_MODEL="gpt-5.4-mini"
```

If you do not set `OPENAI_MODEL`, the server already defaults to `gpt-5.4-mini`.

## 4. Start The Lesson Server

Open Terminal in this folder and run:

```bash
node lesson3-server.mjs
```

You should see a local address such as:

```text
Lesson 3 server running at http://localhost:4173
```

Then open that address in your browser.

## 5. How The Embedded Chat Works

The site sends each student message to `POST /api/chat` on the local server.

The server then calls OpenAI's Responses API. This is the recommended API for new projects, according to OpenAI's migration guide. The server also keeps track of `previous_response_id` so the mystery guest can remember the ongoing conversation.

That means:

- students see one continuous interview
- the API key stays off the page
- the site remains simple to run in class
- the chat can switch between 3 mystery guests while keeping each guest's instructions separate
- the AI is guided to resist revealing its name too early and to steer students toward story, motivation, and lesson first

## 6. Demo Mode

If `OPENAI_API_KEY` is missing, the server falls back to built-in mock mystery guests. This is useful for:

- testing the page layout before class
- rehearsing the lesson without spending tokens
- having a backup if the network or API is unavailable

For the real open classroom, set the API key so the live AI mode is used.

## 7. Recommended Teacher Workflow Before Class

1. Open Terminal
2. Export `OPENAI_API_KEY`
3. Start `node lesson3-server.mjs`
4. Visit `http://localhost:4173`
5. Test 3 questions in the chat:
- `Apakah yang berlaku dalam cerita kamu?`
- `Mengapa kamu bertindak begitu?`
- `Apakah pengajaran yang kamu mahu orang ingat?`
6. Reset the chat before students begin
7. Keep one teacher tab open on the projector

## 8. If You Want To Use The Official SDK Instead

The OpenAI quickstart recommends the official JavaScript SDK and shows:

```bash
npm install openai
```

This package does not require that dependency because the local server uses Node's built-in `fetch` for simplicity. That keeps the lesson more portable. If you later want a fuller app with streaming or more structured tooling, the official SDK is the next step.

## 9. Classroom Safety Notes

- Tell students clearly that the character voice is AI-generated.
- Remind them to keep questions on-topic.
- If the AI gives a strange or weak answer, treat that as a literacy moment: students should compare it against clues and evidence rather than accept it automatically.

## 10. Troubleshooting

If the site loads but chat does not reply:

- Check that `OPENAI_API_KEY` is set in the same terminal session where you started the server
- Restart `node lesson3-server.mjs`
- Look at the terminal for error messages

If you get a permissions or billing-style API error:

- verify the key belongs to the correct project
- verify your API project is active
- verify you copied the full key correctly

If you want to switch to a different model:

```bash
export OPENAI_MODEL="gpt-5.4"
node lesson3-server.mjs
```

## 11. Deploying On Netlify

The package now also includes Netlify-ready files:

- `netlify.toml`
- `netlify/functions/chat.mjs`
- `netlify/functions/health.mjs`

Use the dedicated deployment guide here:

- `netlify-deployment.md`

In short:

1. Push the folder to a Git repository
2. Import that repo into Netlify
3. Leave the build command empty
4. Use `.` as the publish directory
5. Add `OPENAI_API_KEY` and `OPENAI_MODEL` in Netlify's Environment Variables UI
6. Redeploy

On Netlify, the page stays static and the AI chat runs through a Netlify Function so the browser never sees your secret key.

## Notes On The Official Sources

The setup above is based on current official OpenAI docs:

- Quickstart says to create an API key, export `OPENAI_API_KEY`, and use the Responses API in JavaScript.
- Authentication docs say API keys must not be exposed in client-side code.
- Models docs currently recommend `gpt-5.4` as the flagship model and `gpt-5.4-mini` for lower latency and cost.
- Conversation-state docs show using `previous_response_id` to chain turns.
- The migration guide says the Responses API is recommended for all new projects.
