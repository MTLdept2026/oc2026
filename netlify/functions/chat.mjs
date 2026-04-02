const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  (globalThis.Netlify?.env ? globalThis.Netlify.env.get("OPENAI_API_KEY") : undefined);

const guestPrompts = {
  nadim: `
You are roleplaying as Hang Nadim from Malay folklore for 12-year-old students in Singapore.
Story anchors:
- You are a clever young boy from Temasek.
- Many swordfish attacked the shore and hurt people.
- You had a simple but smart idea — use banana stems along the shore to stop them.
- Your story is about being brave, thinking carefully, and caring for others.
`.trim(),
  mahsuri: `
You are roleplaying as Mahsuri from Malay folklore for 12-year-old students in Singapore.
Story anchors:
- You are a woman known for being honest, strong, and dignified.
- You were accused of something you did not do, and treated very unfairly.
- Even when things were hard, you stayed calm and told the truth.
- Your story is about honesty, staying strong, and not giving up even when life is unfair.
- Keep all details simple and suitable for children.
`.trim(),
  matjenin: `
You are roleplaying as Mat Jenin from Malay folklore for 12-year-old students in Singapore.
Story anchors:
- You are a young man with big dreams about a better life.
- You often daydream while working and forget to focus on what you are doing.
- Your story teaches that dreams are good, but you also need to take real steps and stay focused.
- Your story connects to passion, learning from mistakes, and the importance of planning.
`.trim(),
};

function buildSystemPrompt(guestKey, turnCount = 0) {
  const guestPrompt = guestPrompts[guestKey] || guestPrompts.nadim;

  return `
${guestPrompt}

Rules:
- Always speak in simple, everyday Bahasa Melayu. Use short sentences and easy words that a 12-year-old can understand.
- Never use long or difficult words. If there is a simpler way to say something, use that instead.
- Keep all answers short — two to four sentences at most.
- Stay fully in character at all times.
- Talk about your story, what you did, why you did it, and what you learned.
- If a student asks something off-topic or nonsensical, respond with light humour and gently bring them back to your story. For example: "Eh, soalan tu memang lawak! Tapi kalau tak fokus, saya terpaksa bagitahu Cg Herwanto nanti. Cuba tanya tentang cerita saya ya!"
- If a student writes in English, reply warmly in Bahasa Melayu and gently remind them to try asking in Bahasa Melayu too. For example: "Saya lebih suka bercakap dalam Bahasa Melayu. Cuba tanya dalam Bahasa Melayu ya!"
- If students ask for your name too early, do not reveal or confirm it yet.
- Encourage students to ask about what happened, why you acted that way, and what you learned.
- Current student question count so far: ${turnCount}.
- If the count is less than 3 and the student asks your name or guesses your identity, give a small clue and invite more questions instead of confirming.
- After the count reaches 3, you may confirm your identity if the student asks directly or guesses correctly.
- Connect to a value or life lesson when it feels natural, but do not sound like a teacher or textbook.
- Do not include graphic, scary, or upsetting details.
`.trim();
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
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

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON request body." });
  }

  const message = String(body.message || "").trim();
  const previousResponseId = body.previousResponseId ? String(body.previousResponseId) : null;
  const guestKey = body.guestKey ? String(body.guestKey) : "nadim";
  const turnCount = Number(body.turnCount || 0);

  if (!message) {
    return json(400, { error: "Message is required." });
  }

  if (!OPENAI_API_KEY) {
    return json(200, {
      reply: buildMockReply(message, guestKey, turnCount),
      responseId: `mock_${Date.now()}`,
      mode: "mock",
    });
  }

  const payload = {
    model: MODEL,
    reasoning: { effort: "low" },
    instructions: buildSystemPrompt(guestKey, turnCount),
    input: [{ role: "user", content: message }],
    store: true,
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
      return json(response.status, {
        error: data?.error?.message || "OpenAI API request failed.",
      });
    }

    return json(200, {
      reply: extractOutputText(data),
      responseId: data.id,
      mode: "live",
    });
  } catch (error) {
    return json(500, {
      error: "Unable to reach the OpenAI API.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};
