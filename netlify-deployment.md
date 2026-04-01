# Netlify Deployment Guide

## What Changes For Netlify

Locally, the lesson uses `lesson3-server.mjs` as a small server. On Netlify, the HTML page stays static and the AI call moves into a Netlify Function. The browser still calls `/api/chat`, but `netlify.toml` rewrites that path to `/.netlify/functions/chat`.

That means:

- the site stays simple and fast
- your OpenAI key stays on the server side
- the lesson can be deployed as one Netlify project

## Files Already Prepared

- `wartawan-cilik-lesson3.html`
- `netlify.toml`
- `netlify/functions/chat.mjs`
- `netlify/functions/health.mjs`

## Recommended Netlify Setup

This setup follows Netlify's current docs:

- Functions live in a functions directory such as `netlify/functions`
- `netlify.toml` can define the functions directory and redirects
- environment variables for Functions should be added in the Netlify UI, CLI, or API, not in `netlify.toml`

Official references:

- Functions get started: [https://docs.netlify.com/functions/get-started/](https://docs.netlify.com/functions/get-started/)
- Optional function configuration: [https://docs.netlify.com/build/functions/optional-configuration/](https://docs.netlify.com/build/functions/optional-configuration/)
- Environment variables for functions: [https://docs.netlify.com/functions/environment-variables/](https://docs.netlify.com/functions/environment-variables/)
- File-based configuration: [https://docs.netlify.com/configure-builds/file-based-configuration/](https://docs.netlify.com/configure-builds/file-based-configuration/)
- Redirects and rewrites: [https://docs.netlify.com/routing/redirects/](https://docs.netlify.com/routing/redirects/)

## Deploy Option 1: Git-Connected Deploy

This is the best option if you want future edits to redeploy easily.

1. Put this lesson folder into a Git repository if it is not already in one.
2. Push the repo to GitHub, GitLab, or Bitbucket.
3. In Netlify, click `Add new site` then `Import an existing project`.
4. Choose your Git provider and select the repository.
5. Set these build settings:
- Base directory: leave blank unless this lesson is inside a subfolder of a larger repo
- Build command: leave blank
- Publish directory: `.`
6. Deploy the site.

Why no build command:

- the lesson is a static HTML page
- Netlify will still detect and deploy the functions from `netlify/functions`

## Deploy Option 2: Manual Drag-And-Drop

This can work for the static HTML, but it is not the best fit if you need the AI function too. For the full experience with embedded AI chat, use a Git-connected deploy or Netlify CLI deploy so the serverless functions are included properly.

## Add Environment Variables In Netlify

Because the AI chat runs inside a Netlify Function, the OpenAI key must be set in Netlify's environment-variable settings.

In Netlify:

1. Open your site dashboard
2. Go to `Site configuration`
3. Open `Environment variables`
4. Add:
- `OPENAI_API_KEY` = your real OpenAI API key
- `OPENAI_MODEL` = `gpt-5.4-mini`
5. Make sure the variable is available to Functions
6. Trigger a new deploy after saving

Important:

- Do not put the API key into `netlify.toml`
- Do not paste the API key into the HTML or JavaScript

Netlify's docs note that environment variables declared in `netlify.toml` are not available to Functions at runtime. Sensitive keys should be set in the Netlify UI, CLI, or API instead.

## Suggested Build Settings

Use:

- Publish directory: `.`
- Functions directory: `netlify/functions`

The provided `netlify.toml` already declares the functions directory, the root route, and the chat and health rewrites.

## Verify The Deployment

After deploy:

1. Visit the site root URL
2. Confirm it opens the lesson page
3. Open the chat section
4. Ask:
- `Apakah bahaya yang berlaku di tempat kamu?`
- `Bagaimana kamu menolong orang lain?`
5. Check that the site status says `Live OpenAI mode`

If the status says `Demo mode`, Netlify did not detect the `OPENAI_API_KEY` variable yet or the site needs a fresh deploy.

## If You Want A Custom Domain

After the site is working on the default Netlify URL:

1. Go to `Site configuration`
2. Open `Domain management`
3. Add your custom domain
4. Follow Netlify's DNS steps

This part is optional. The lesson will work on the default `netlify.app` subdomain too.

## Local Testing Before Deploy

You can still use the local version first:

```bash
export OPENAI_API_KEY="your_api_key_here"
node lesson3-server.mjs
```

Then, once you like the lesson flow, deploy the same folder to Netlify.

## Practical Deployment Sequence I Recommend

1. Test locally with `lesson3-server.mjs`
2. Put the folder in Git
3. Push to GitHub
4. Import into Netlify
5. Add `OPENAI_API_KEY` and `OPENAI_MODEL`
6. Redeploy
7. Test the live AI chat on the Netlify URL

## Notes On Official Guidance

The guidance above is based on current Netlify docs:

- Functions are deployed from a functions directory such as `netlify/functions`
- `netlify.toml` can configure the functions directory and rewrites
- environment variables for Functions should be created in Netlify's secure environment-variable settings
- rewrites can be configured in `netlify.toml` so the browser can use clean routes like `/api/chat`
