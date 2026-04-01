const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  (globalThis.Netlify?.env ? globalThis.Netlify.env.get("OPENAI_API_KEY") : undefined);

export default async () =>
  new Response(
    JSON.stringify({
      ok: true,
      model: MODEL,
      mode: OPENAI_API_KEY ? "live" : "mock",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
