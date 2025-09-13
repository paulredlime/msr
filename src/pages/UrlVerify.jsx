// pages/UrlVerify.js
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).json({ ok: false, error: "url required" });

  try {
    const r = await fetch(url, { method: "GET", redirect: "manual" });
    return res.json({
      ok: r.status === 200,
      status: r.status,
      location: r.headers.get("location") || null,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}