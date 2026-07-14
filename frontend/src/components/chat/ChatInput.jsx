// src/components/chat/ChatInput.jsx
import { Send, Image as ImageIcon, Smile, X, Reply, Loader2 } from "lucide-react";

export default function ChatInput({
  newMessage,
  setNewMessage,
  imagePreview,
  setImagePreview,
  replyTo,
  onCancelReply,
  onSend,
  onImageSelect,
  sending = false,
}) {
  const canSend = (newMessage.trim().length > 0 || !!imagePreview) && !sending;

  return (
    <div className="shrink-0 bg-[#13131a] border-t border-white/5 px-4 pt-2 pb-4">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/15 border-l-4 border-l-emerald-500/60 px-3 py-2 rounded-xl">
          <Reply size={13} className="text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-0.5">
              Replying
            </p>
            <p className="text-xs text-white/40 truncate">
              {replyTo.image ? "📷 Photo" : replyTo.text}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-white/20 hover:text-white/60 transition shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 flex items-center gap-3 bg-white/5 border border-white/8 p-2.5 rounded-xl">
          <img
            src={imagePreview}
            className="w-11 h-11 object-cover rounded-lg"
            alt="preview"
          />
          <p className="text-sm text-white/40 flex-1 truncate">Image ready</p>
          <button
            onClick={() => setImagePreview(null)}
            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          className="p-2.5 text-white/25 hover:text-white/60 hover:bg-white/5 rounded-xl transition"
          aria-label="Emoji"
        >
          <Smile size={20} />
        </button>

        <label className="cursor-pointer p-2.5 text-white/25 hover:text-white/60 hover:bg-white/5 rounded-xl transition">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) onImageSelect(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <ImageIcon size={20} />
        </label>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder="Type a message…"
          disabled={sending}
          className="flex-1 bg-white/5 border border-white/8 rounded-2xl px-5 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:bg-white/8 transition"
        />

        <button
          onClick={onSend}
          disabled={!canSend}
          className={`p-3 rounded-2xl transition-all ${
            canSend
              ? "bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20"
              : "bg-white/5 text-white/15 cursor-not-allowed"
          }`}
          aria-label="Send"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}