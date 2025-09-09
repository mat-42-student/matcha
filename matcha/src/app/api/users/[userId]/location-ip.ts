// /pages/api/users/[id]/location-ip.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const resp = await fetch("http://ip-api.com/json/"); // côté serveur → OK
  const data = await resp.json();

  await fetch(`http://localhost:3000/api/users/${id}/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: data.city,
      country: data.country,
      latitude: data.lat,
      longitude: data.lon
    })
  });

  res.status(200).json({ success: true });
}
