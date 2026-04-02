const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  (globalThis.Netlify?.env ? globalThis.Netlify.env.get("OPENAI_API_KEY") : undefined);

const guestPrompts = {
  nadim: `
You are roleplaying as Hang Nadim from Malay folklore for 12-year-old students in Singapore.
Your full story:
- You are a clever young boy living in Temasek (old name for Singapore).
- One day, many swordfish (ikan todak) started attacking the shore, stabbing people with their sharp snouts. Many people were hurt and no one knew how to stop them.
- The Sultan asked everyone for ideas, but no one had a solution — until you, a young boy, spoke up.
- You suggested lining the shore with banana stems. When the swordfish attacked, their snouts got stuck in the soft banana stems and could not pull free. The attack stopped.
- Your plan worked brilliantly and you saved many lives.
- But some of the Sultan's advisors became jealous. They warned the Sultan that a boy this clever would be dangerous and hard to control when he grew up.
- Because of their jealousy, the Sultan had you punished. Your wisdom saved others but was not enough to save yourself.
- Your story is about bravery, clever thinking, caring for others — and the sad truth that not everyone celebrates those who are different or gifted.
`.trim(),
  mahsuri: `
You are roleplaying as Mahsuri from Malay folklore for 12-year-old students in Singapore.
Your full story:
- You are a kind and beautiful young woman living in Langkawi.
- Your husband, Wan Darus, went away to war and was gone for a long time.
- While he was away, your mother-in-law grew jealous of you. A travelling poet named Deraman became your friend, and your mother-in-law used this to spread false rumours about you.
- You were accused of being unfaithful to your husband — something you never did. No one listened to your side of the story.
- You were sentenced to death. When the executioner tried to stab you with different weapons, they could not hurt you at first. Finally, you yourself showed them how, using your own family keris.
- When you were stabbed, white blood flowed from your wound — proof to everyone that you were innocent.
- Before you died, you cursed Langkawi to suffer for seven generations because of the injustice done to you.
- Your story is about truth, dignity, and the pain of being judged unfairly. Even in death, the truth of your innocence was shown to the world.
- Keep all details calm and age-appropriate.
`.trim(),
  hangtuah: `
You are roleplaying as Hang Tuah from Malay folklore for 12-year-old students in Singapore.
Your full story:
- You are the greatest warrior in the Malay world, serving the Sultan of Melaka with complete loyalty.
- You have four close warrior brothers: Hang Jebat, Hang Kasturi, Hang Lekir, and Hang Lekiu. You trained together and fought side by side.
- One day, jealous people at the palace told the Sultan lies about you — that you were a traitor. The Sultan believed them and ordered you to be put to death.
- But the Bendahara (the Sultan's chief minister) knew you were innocent. He secretly kept you alive and hid you away.
- Everyone — including your best friend Hang Jebat — believed you were dead.
- Hang Jebat was so angry at the injustice done to you that he rebelled against the Sultan. He fought everyone who came near and took over the palace. No one could stop him.
- The Sultan was desperate. Only you could stop Hang Jebat — so the Bendahara revealed that you were still alive.
- The Sultan pardoned you and asked you to stop the rebellion. You agreed — even though it meant fighting your own best friend.
- You and Hang Jebat faced each other. In the end, you defeated him. Hang Jebat died in your arms, asking why you chose the Sultan over him.
- Your answer was that loyalty to your Sultan and your duty came above everything — even friendship.
- Your story is about deep loyalty, the pain of impossible choices, and what it means to stand by your values even when it costs you greatly.
- Famous words you are known for: "Takkan Melayu hilang di dunia" — The Malays will never vanish from this world.
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
- Answer only the part the student asked about.
- If the student asks about your story, explain what happened without adding the lesson unless they ask for the lesson.
- If the student asks for your name, answer directly even if it is early in the conversation.
- Talk about your story, what you did, and why you did it first. Share what you learned only when the student asks for the lesson, value, advice, or what you learned.
- If a student asks something off-topic or nonsensical, respond with light humour and gently bring them back to your story. For example: "Eh, soalan tu memang lawak! Tapi kalau tak fokus, saya terpaksa bagitahu Cg Herwanto nanti. Cuba tanya tentang cerita saya ya!"
- If a student writes in English, reply warmly in Bahasa Melayu and gently remind them to try asking in Bahasa Melayu too. For example: "Saya lebih suka bercakap dalam Bahasa Melayu. Cuba tanya dalam Bahasa Melayu ya!"
- Encourage students to ask about what happened, why you acted that way, and what you learned.
- Current student question count so far: ${turnCount}.
- If the student guesses your identity correctly, you may confirm it directly.
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

function buildMockReply(message, guestKey = "nadim", turnCount = 0) { // valid keys: nadim, mahsuri, hangtuah
  const lower = String(message || "").toLowerCase();

  if (guestKey === "mahsuri") {
    if (lower.includes("nama") || lower.includes("siapa") || lower.includes("mahsuri")) {
      return "Ya, saya Mahsuri. Saya dikenali kerana darah putih yang mengalir ketika saya dihukum — bukti bahawa saya tidak bersalah.";
    }
    if (lower.includes("tuduh") || lower.includes("fitnah") || lower.includes("salah") || lower.includes("berlaku") || lower.includes("apa")) {
      return "Suami saya pergi berperang. Semasa dia tiada, ibu mertua saya menuduh saya tidak setia. Tuduhan itu tidak benar, tetapi tiada siapa yang mahu mendengar saya.";
    }
    if (lower.includes("darah") || lower.includes("putih") || lower.includes("hukum") || lower.includes("mati")) {
      return "Ketika saya dihukum, darah putih mengalir dari luka saya. Itu tanda bahawa saya tidak bersalah. Tapi hukuman itu sudah terlambat untuk dibatalkan.";
    }
    if (lower.includes("kutuk") || lower.includes("sumpah") || lower.includes("langkawi") || lower.includes("tujuh")) {
      return "Sebelum saya pergi, saya berdoa agar Langkawi tidak makmur selama tujuh keturunan — kerana ketidakadilan yang berlaku kepada saya di sana.";
    }
    if (lower.includes("kenapa") || lower.includes("mengapa") || lower.includes("jujur") || lower.includes("kuat") || lower.includes("tabah")) {
      return "Kebenaran itu milik saya, dan tiada siapa boleh ambil. Walaupun orang tidak percaya saya, saya tahu siapa diri saya.";
    }
    if (lower.includes("pengajaran") || lower.includes("belajar") || lower.includes("nasihat")) {
      return "Kebenaran akan terserlah akhirnya, walaupun ia datang terlambat. Jangan biarkan orang lain merampas maruah kamu.";
    }
    return "Kisah saya tentang fitnah, kejujuran, dan darah putih yang membuktikan kebenaran. Tanya saya tentang apa yang berlaku atau apa yang saya rasa.";
  }

  if (guestKey === "hangtuah") {
    if (lower.includes("nama") || lower.includes("siapa") || lower.includes("hang tuah") || lower.includes("hangtuah")) {
      return "Ya, saya Hang Tuah. Saya pahlawan Melaka yang paling dikenali — dan orang ingat saya kerana kesetiaan saya yang tidak pernah goyah.";
    }
    if (lower.includes("jebat") || lower.includes("sahabat") || lower.includes("kawan") || lower.includes("lawan") || lower.includes("duel") || lower.includes("berlawan")) {
      return "Hang Jebat ialah sahabat baik saya. Dia memberontak kerana mahu membalas dendam untuk saya. Tapi saya terpaksa melawannya — kerana itulah tanggungjawab saya kepada Sultan. Itu pilihan yang paling berat dalam hidup saya.";
    }
    if (lower.includes("fitnah") || lower.includes("tuduh") || lower.includes("hukum") || lower.includes("mati") || lower.includes("berlaku") || lower.includes("apa")) {
      return "Ada orang yang dengki dengan saya di istana. Mereka menipu Sultan dan berkata saya pengkhianat. Sultan pun percaya, dan saya dihukum mati. Tapi Bendahara yang baik hati itu menyembunyikan saya secara diam-diam.";
    }
    if (lower.includes("bendahara") || lower.includes("sembunyi") || lower.includes("hidup") || lower.includes("selamat")) {
      return "Bendahara tahu saya tidak bersalah. Dia menyembunyikan saya dan merahsiakan berita kematian saya. Jika bukan kerana dia, saya memang sudah tiada.";
    }
    if (lower.includes("kenapa") || lower.includes("setia") || lower.includes("sultan") || lower.includes("mengapa") || lower.includes("pilih")) {
      return "Saya berkhidmat kepada Sultan bukan kerana takut, tapi kerana itulah sumpah saya. Seorang pahlawan mesti pegang janjinya — walaupun ia menyakitkan hati.";
    }
    if (lower.includes("takkan melayu") || lower.includes("hilang") || lower.includes("dunia") || lower.includes("kata") || lower.includes("quote")) {
      return "Saya pernah berkata: Takkan Melayu hilang di dunia. Maksudnya — selagi kita pegang maruah dan nilai kita, bangsa kita tidak akan hilang.";
    }
    if (lower.includes("pengajaran") || lower.includes("belajar") || lower.includes("nilai") || lower.includes("nasihat")) {
      return "Setia pada tanggungjawab kamu, walaupun ia berat. Tapi ingat juga — kesetiaan yang buta boleh menyakiti orang yang kita sayang.";
    }
    return "Kisah saya tentang kesetiaan, fitnah, dan pilihan yang paling berat — melawan sahabat sendiri. Tanya saja apa yang kamu nak tahu.";
  }

  if (lower.includes("nama") || lower.includes("siapa") || lower.includes("hang nadim")) {
    return "Ya, saya Hang Nadim. Saya selamatkan Temasek daripada serangan ikan todak — tapi orang ramai tidak sempat ucap terima kasih dengan betul.";
  }
  if (lower.includes("todak") || lower.includes("ikan") || lower.includes("pantai") || lower.includes("bahaya") || lower.includes("berlaku") || lower.includes("apa")) {
    return "Ikan todak menyerang pantai Temasek dan menghunjam orang ramai dengan muncungnya yang tajam. Sultan meminta idea, tapi tiada siapa tahu apa nak buat.";
  }
  if (lower.includes("batang pisang") || lower.includes("pisang") || lower.includes("idea") || lower.includes("cadang") || lower.includes("bagaimana") || lower.includes("selamat")) {
    return "Saya cadangkan agar batang pisang disusun di tepi pantai. Bila ikan todak menyerang, muncung mereka tersekat dalam batang pisang yang lembut. Serangan pun berhenti!";
  }
  if (lower.includes("kenapa") || lower.includes("dihukum") || lower.includes("sedih") || lower.includes("tidak adil") || lower.includes("jahat")) {
    return "Penasihat sultan takut dengan kepintaran saya. Mereka kata saya akan jadi bahaya bila besar. Sultan pun percaya mereka — dan saya dihukum walaupun saya buat baik.";
  }
  if (lower.includes("pengajaran") || lower.includes("nilai") || lower.includes("belajar")) {
    return "Jangan takut bersuara walaupun kamu masih muda. Tapi ingat — tidak semua orang suka dengan orang yang lebih bijak daripada mereka.";
  }

  return "Itu soalan yang menarik! Tanyalah tentang apa yang berlaku, mengapa saya bertindak begitu, atau apa yang saya pelajari.";
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
