export default function Skeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl h-80 animate-pulse shadow-sm mb-8" />
      ))}
    </>
  );
}