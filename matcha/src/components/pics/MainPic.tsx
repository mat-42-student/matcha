export default function MainPic({ userId }: { userId: string }) {
  const src = `/api/users/${userId}/pics/`;
  return <img className="max-h-48" src={src} alt="profile picture" />;
}