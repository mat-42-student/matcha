export default function MainPic({ userId }: { userId: string }) {
  const src = `/api/pics/${userId}/`;
  console.log("MainPic src:", src);
  return <img src={src} alt="profile picture" />;
}