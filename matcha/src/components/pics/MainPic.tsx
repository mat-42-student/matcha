import { getMainPicUrlByUserId } from "@/lib/db/pics";

export default async function MainPic({ userId }: { userId: string }) {
  const { url, id } = await getMainPicUrlByUserId(userId);
  console.log("MainPic photo_url: ", url, "photo_id: ", id);
  const src = url ?? `/api/pic/${id}/`;

  return <img src={src} alt="profile picture" />;
}