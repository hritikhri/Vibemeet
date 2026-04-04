import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-soft/30">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      <div ref={endRef} />
    </div>
  );
}