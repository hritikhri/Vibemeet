export default function MessageBubble({ message }) {
  const isMe = message.isMe || message.sender?.name === "You";

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-5 py-3 rounded-3xl ${isMe 
        ? 'bg-primary text-white rounded-br-none' 
        : 'bg-white shadow-sm rounded-bl-none'}`}>
        <p className="text-[15px]">{message.text}</p>
        <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : ''}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}