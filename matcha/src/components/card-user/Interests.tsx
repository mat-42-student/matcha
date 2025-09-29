export default function Interests({ interests }: { interests: string[] }) {
  return (
    <ul className="text-gray-600 mb-4">
      {interests.map((i) => (
        <li key={i}>#{i}</li>
      ))}
    </ul>
  );
}
