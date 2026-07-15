// src/components/chat/TypingBubble.jsx
export default function TypingBubble() {
  return (
    <div className="flex justify-start py-0.5">
      <div className="flex gap-1.5 px-4 py-3 bg-[#f0f0f0] border border-black/6 rounded-2xl rounded-bl-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-black/30 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}