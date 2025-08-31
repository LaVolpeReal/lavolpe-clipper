// api/createclip.js
export default async function handler(req, res) {
  try {
    const { TWITCH_CLIENT_ID, TWITCH_USER_TOKEN, BROADCASTER_ID } = process.env;
    if (!TWITCH_CLIENT_ID || !TWITCH_USER_TOKEN || !BROADCASTER_ID) {
      return res.status(500).send("Config missing: set TWITCH_CLIENT_ID, TWITCH_USER_TOKEN, BROADCASTER_ID");
    }

    // 1) Create Clip
    const create = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${BROADCASTER_ID}`, {
      method: "POST",
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${TWITCH_USER_TOKEN}`,
      },
    });

    const text = await create.text();
    if (!create.ok) {
      // napr. "Clipping is not possible for an offline channel"
      return res.status(create.status).send(text || create.statusText);
    }

    const data = JSON.parse(text);
    const clip = data?.data?.[0];
    if (!clip?.id) return res.status(502).send("No clip id from Twitch");

    const clipId = clip.id;
    let clipUrl = clip.edit_url || `https://clips.twitch.tv/${clipId}`;

    // 2) krátky poll na finálnu URL
    for (let i = 0; i < 6; i++) {
      const g = await fetch(`https://api.twitch.tv/helix/clips?id=${clipId}`, {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${TWITCH_USER_TOKEN}`,
        },
      });
      if (g.ok) {
        const d = await g.json();
        const full = d?.data?.[0];
        if (full?.url) { clipUrl = full.url; break; }
      }
      await new Promise(r => setTimeout(r, 3000));
    }

    return res.status(200).send(clipUrl);
  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
}
