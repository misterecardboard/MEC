import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request) {
  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = await request.formData();

    const front = formData.get("front");
    const back = formData.get("back");
    const sport = formData.get("sport") || "Other";

    if (!front) {
      return new Response(
        JSON.stringify({ error: "Please upload the front of the card." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    async function fileToDataUrl(file) {
      if (!file || typeof file.arrayBuffer !== "function") return null;

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");

      let mime = file.type || "image/jpeg";

      return `data:${mime};base64,${base64}`;
    }

    const frontImage = await fileToDataUrl(front);
    const backImage = await fileToDataUrl(back);

    const imageInputs = [
      {
        type: "input_image",
        image_url: frontImage,
      },
    ];

    if (backImage) {
      imageInputs.push({
        type: "input_image",
        image_url: backImage,
      });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
You are Mister E AI, an expert sports and trading card assistant.

Your job is to analyze uploaded trading cards and create useful information for collectors, sellers, and social media creators.

Analyze BOTH the front and back images when both are provided.

Sport/category: ${sport}

IMPORTANT RULES:
- Never invent card details.
- Only state information that can reasonably be confirmed from the images or reliable general knowledge.
- If something cannot be confirmed, say "Unknown" or "Not confirmed."
- Do not assign a professional card grade.
- Do not claim exact market value, authenticity, rarity, investment potential, or population reports unless the information is clearly supported.
- Separate observations from confirmed facts.
- Make the writing useful for someone selling or creating content about the card.

Return ONLY valid JSON using exactly these six sections:

{
  "card_information": {
    "title": "",
    "athlete_or_character": "",
    "sport": "",
    "year": "",
    "brand": "",
    "set": "",
    "card_number": "",
    "parallel_or_variant": "",
    "rookie_card": "",
    "special_features": "",
    "condition_observations": ""
  },
  "history": {
    "card_history": "",
    "athlete_or_character_history": ""
  },
  "listing_description": "",
  "social_media_post_ideas": [
    "",
    "",
    ""
  ],
  "hashtags": [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ],
  "content_ideas": [
    "",
    "",
    "",
    "",
    ""
  ]
}

For card_information, provide concise factual information.

For history, explain the relevant history of the card/set and the athlete or character. Do not make up specific release dates or historical claims.

For listing_description, create a professional but exciting marketplace listing.

For social_media_post_ideas, create three different posts suitable for Facebook, Instagram, TikTok, or X.

For hashtags, provide relevant hashtags.

For content_ideas, provide five video/content concepts that a sports card creator could make using this card.

Remember: accuracy is more important than filling every field.
`,
            },
          ],
        },
        {
          role: "user",
          content: [
            ...imageInputs,
            {
              type: "input_text",
              text: "Analyze this trading card and create the complete Mister E AI content package.",
            },
          ],
        },
      ],
    });

    const text = response.output_text;

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      result = {
        error: "The AI returned an unexpected response.",
        raw: text,
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: error?.message || "Something went wrong analyzing the card.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
