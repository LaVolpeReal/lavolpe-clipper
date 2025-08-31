// api/createclip.js
export default async function handler(req, res) {
  try {
    const { TWITCH_CLIENT_ID, TWITCH_USER_TOKEN, BROADCASTER_ID } = process.env;
    if (!TWITCH_CLIENT_ID || !TWITCH_USER_TOKEN || !BROADCASTER_ID) {
      return res.status(200).send("❌ Config missing – nastav env: TWITCH_CLIENT_ID, TWITCH_USER_TOKEN, BROADCASTER_ID");
    }

    // Pokus o vytvorenie klipu
    const create = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${BROADCASTER_ID}`, {
      method: "POST",
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${TWITCH_USER_TOKEN}`,
      },
    });

    const text = await create.text();

    // Ak Twitch vráti chybu (napr. OFFLINE), pošli ju do chatu, ale so statusom 200
    if (!create.ok) {
      let msg = "❌ Nepodarilo sa vytvoriť klip.";
      try {
        const err = JSON.parse(text);
        if (typeof err?.message === "string") {
          if (err.message.toLowerCase().includes("offline")) {
            msg = "❌ Kanál je offline – klip sa dá spraviť len keď som LIVE lavolp6Smirk ";
          } else {
            msg = `❌ ${err.message}`;
          }
        }
      } catch (_) {
        // nič, ponechaj default message
      }
      return res.status(200).send(msg);
    }

    // Úspech – vytiahneme ID a hneď vrátime stabilný link
    const data = JSON.parse(text);
    const clip = data?.data?.[0];
    if (!clip?.id) return res.status(200).send("❌ No clip id from Twitch.");

    const clipId = clip.id;

    // Rýchla odpoveď (bez pollovania, aby SE nestihol timeout)
    return res.status(200).send(`✅ Klip: https://clips.twitch.tv/${clipId}`);
  } catch (e) {
    return res.status(200).send(`❌ Error: ${e.message}`);
  }
}
