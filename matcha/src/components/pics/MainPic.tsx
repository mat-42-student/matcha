export default function MainPic({ userId }: { userId: string }) {
  const src = `/api/pics/${userId}/`;
  return <img src={src} alt="profile picture" />;
}