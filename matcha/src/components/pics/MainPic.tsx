export default function MainPic({ userId }: { userId: string }) {
  const src = `/api/users/${userId}/pics/`;
  return <img src={src} alt="profile picture" />;
}