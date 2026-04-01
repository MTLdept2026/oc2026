import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 4173);
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const files = {
  "/": "wartawan-cilik-lesson3.html",
  "/wartawan-cilik-lesson3.html": "wartawan-cilik-lesson3.html",
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const guestPrompts = {
  nadim: `
You are roleplaying as Hang Nadim from Malay folklore for 12-year-old students in Singapore.
Story anchors:
- You are a clever young boy linked to Temasek.
- Swordfish attacked the shore and many people were in danger.
- You suggested using banana stems to stop the attack.
- Your story highlights brave thinking, care for others, and wise action.
`.trim(),
  mahsuri: `
You are roleplaying as Mahsuri from Malay folklore for 12-year-old students in Singapore.
Story anchors:
- You are a woman remembered for honesty, dignity, and strength.
- You were falsely accused and treated unjustly.
- You remained truthful and calm even when others were unfair.
- Your story highlights integrity, resilience, and inner strength.
- Avoid graphic details. Keep the story suitable for children.
`.trim(),
  matjenin: `
You are roleplaying as Mat Jenin from Malay folklore for 12-year-old students in Singapore.
Story anchors:
- You are a young man who dreams big and imagines a better future.
- You daydream while working and lose focus on the task in front of you.
- Your story teaches that dreams are useful only when matched with action, focus, and planning.
- Your story can connect to passion, reflection, and learning from mistakes.
`.trim(),
};

function buildSystemPrompt(guestKey, turnCount = 0) {
  const guestPrompt = guestPrompts[guestKey] || guestPrompts.nadim;

  return `
${guestPrompt}

Rules:
- Speak only in simple Malay.
- Keep answers short, clear, and child-friendly.
- Stay fully in character at all times.
- Focus on your story, your actions, your motivations, and the lesson from your experience.
- If students ask something off-topic, gently bring them back to your story.
- If students ask for your name too early, do not reveal or confirm it yet.
- Encourage students to ask about what happened, why you acted that way, and what you learned.
- Current student question count so far: ${turnCount}.
- If the count is less than 3 and the student asks your name or guesses your identity, reply with a clue and invite more questions instead of confirming.
- After the count reaches 3, you may confirm your identity if the student asks directly or guesses correctly.
- Connect naturally to a value or life lesson when helpful, but do not sound like a textbook.
- Do not invent graphic or disturbing details.
`.trim();
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  const texts = [];
  for (const item of payload.output) {
    if (!Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content.type === "output_text" && typeof content.text === "string") {
        texts.push(content.text.trim());
      }
    }
  }

  return texts.filter(Boolean).join("\n\n").trim();
}

function buildMockReply(message, guestKey = "nadim", turnCount = 0) {
  const lower = String(message || "").toLowerCase();

  if ((lower.includes("siapa") || lower.includes("nama") || lower.includes("adakah kamu")) && turnCount < 3) {
    if (guestKey === "mahsuri") {
      return "Nama saya belum penting lagi. Tanya dulu apa yang berlaku dalam hidup saya dan mengapa saya tetap kuat.";
    }
    if (guestKey === "matjenin") {
      return "Nama saya belum penting lagi. Tanya dulu tentang impian saya dan kesilapan yang saya buat.";
    }
    return "Nama saya belum penting lagi. Tanya dulu tentang bahaya yang berlaku dan kenapa saya bertindak begitu.";
  }

  if (guestKey === "mahsuri") {
    if (lower.includes("nama") || lower.includes("siapa") || lower.includes("mahsuri")) {
      return "Ya, saya Mahsuri. Saya diingati kerana saya tetap jujur walaupun diperlakukan dengan tidak adil.";
    }
    if (lower.includes("pengajaran") || lower.includes("belajar") || lower.includes("nasihat")) {
      return "Pengajarannya ialah kita mesti jujur dan tabah walaupun keadaan tidak memihak kepada kita.";
    }
    if (lower.includes("apa") || lower.includes("berlaku") || lower.includes("masalah") || lower.includes("tuduh")) {
      return "Saya dituduh tanpa bukti dan ramai orang mempercayainya. Hidup saya berubah kerana fitnah itu.";
    }
    if (lower.includes("kenapa") || lower.includes("mengapa") || lower.includes("jujur")) {
      return "Saya tetap jujur kerana kebenaran tidak patut berubah hanya kerana orang lain marah atau salah faham.";
    }
    if (lower.includes("bagaimana") || lower.includes("kuat") || lower.includes("tabah") || lower.includes("nilai")) {
      return "Saya cuba tetap tenang dan bermaruah walaupun saya diperlakukan dengan tidak adil.";
    }
    return "Kisah saya tentang fitnah, kejujuran, dan kekuatan hati. Tanyalah apa yang berlaku atau apa yang saya pelajari.";
  }

  if (guestKey === "matjenin") {
    if (lower.includes("nama") || lower.includes("siapa") || lower.includes("mat jenin") || lower.includes("matjenin")) {
      return "Ya, saya Mat Jenin. Orang ingat saya kerana saya berangan besar tetapi kurang fokus pada tugas saya.";
    }
    if (lower.includes("pengajaran") || lower.includes("belajar") || lower.includes("nilai")) {
      return "Saya belajar bahawa semangat itu baik, tetapi kita mesti bertindak dengan sabar, fokus, dan perancangan.";
    }
    if (lower.includes("apa") || lower.includes("berlaku") || lower.includes("masalah") || lower.includes("jatuh")) {
      return "Saya terlalu asyik membayangkan masa depan sampai saya tidak memberi perhatian kepada apa yang saya sedang buat.";
    }
    if (lower.includes("kenapa") || lower.includes("mengapa") || lower.includes("impian") || lower.includes("berangan")) {
      return "Saya berangan kerana saya mahu hidup yang lebih baik. Tetapi saya lupa bahawa impian perlu disertai usaha dan fokus.";
    }
    if (lower.includes("bagaimana")) {
      return "Saya belajar bahawa semangat itu baik, tetapi kita mesti bertindak dengan sabar, fokus, dan perancangan.";
    }
    if (lower.includes("nasihat")) {
      return "Bermimpilah besar, tetapi jangan lupa langkah kecil yang perlu dibuat hari ini.";
    }
    return "Kisah saya tentang impian, kesilapan, dan pelajaran hidup. Tanyalah apa yang saya mahu capai atau apa yang saya pelajari.";
  }

  if (lower.includes("nama") || lower.includes("siapa") || lower.includes("hang nadim")) {
    return "Ya, saya Hang Nadim. Saya cuba selamatkan Temasek dengan akal dan keberanian.";
  }

  if (lower.includes("bahaya") || lower.includes("masalah") || lower.includes("todak")) {
    return "Banyak ikan todak menyerang pantai Temasek. Orang ramai berada dalam bahaya.";
  }

  if (lower.includes("bagaimana") || lower.includes("menolong") || lower.includes("bantu")) {
    return "Saya cadangkan batang pisang disusun di tepi pantai supaya serangan itu dapat dihentikan.";
  }

  if (lower.includes("kenapa") || lower.includes("berani")) {
    return "Saya berani kerana saya mahu melindungi orang lain dan saya perlu berfikir cepat.";
  }

  if (lower.includes("pengajaran") || lower.includes("nilai") || lower.includes("belajar")) {
    return "Pengajarannya ialah akal yang bijak dan hati yang peduli boleh membantu ramai orang.";
  }

  return "Itu soalan yang baik. Tanyalah lagi tentang apa yang berlaku, mengapa saya bertindak, atau apa yang saya pelajari.";
}

async function handleChat(req, res) {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON request body." });
    return;
  }

  const message = String(body.message || "").trim();
  const previousResponseId = body.previousResponseId ? String(body.previousResponseId) : null;
  const guestKey = body.guestKey ? String(body.guestKey) : "nadim";
  const turnCount = Number(body.turnCount || 0);

  if (!message) {
    sendJson(res, 400, { error: "Message is required." });
    return;
  }

  if (!OPENAI_API_KEY) {
    sendJson(res, 200, {
      reply: buildMockReply(message, guestKey, turnCount),
      responseId: `mock_${Date.now()}`,
      mode: "mock",
    });
    return;
  }

  const payload = {
    model: MODEL,
    reasoning: { effort: "low" },
    instructions: buildSystemPrompt(guestKey, turnCount),
    input: [{ role: "user", content: message }],
    store: false,
  };

  if (previousResponseId) {
    payload.previous_response_id = previousResponseId;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const messageText = data?.error?.message || "OpenAI API request failed.";
      sendJson(res, response.status, { error: messageText });
      return;
    }

    sendJson(res, 200, {
      reply: extractOutputText(data),
      responseId: data.id,
      mode: "live",
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unable to reach the OpenAI API.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function serveStatic(req, res) {
  const safePath = files[req.url] || req.url;
  const filePath = path.join(__dirname, safePath.replace(/^\/+/, ""));

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: "File not found." });
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: "Bad request." });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      ok: true,
      model: MODEL,
      mode: OPENAI_API_KEY ? "live" : "mock",
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    await handleChat(req, res);
    return;
  }

  if (req.method === "GET") {
    await serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, () => {
  console.log(`Lesson 3 server running at http://localhost:${PORT}`);
  console.log(`Chat mode: ${OPENAI_API_KEY ? "live OpenAI API" : "mock fallback"}`);
  console.log(`Model: ${MODEL}`);
});
