// src/components/chat/VoiceNotePlayer.jsx
import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export default function VoiceNotePlayer({ src, isMe, duration }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => {
      const dur = audio.duration || totalDuration || 1;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / dur) * 100);
    };
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [totalDuration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * (audio.duration || 0);
  };

  const formatTime = (s) => {
    const secs = Math.floor(s);
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  };

  const trackBg = isMe ? "bg-white/20" : "bg-gray-200";
  const fillBg = isMe ? "bg-white" : "bg-primary";
  const btnBg = isMe ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20";
  const iconColor = isMe ? "text-white" : "text-primary";

  return (
    <div className="flex items-center gap-3 w-[230px] py-1">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${btnBg}`}
      >
        {playing ? (
          <Pause size={14} className={iconColor} />
        ) : (
          <Play size={14} className={`${iconColor} ml-0.5`} />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Seekable progress bar */}
        <div
          className={`h-1.5 ${trackBg} rounded-full overflow-hidden cursor-pointer`}
          onClick={handleSeek}
        >
          <div
            className={`h-full ${fillBg} rounded-full transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className={`flex justify-between text-[10px] ${
            isMe ? "text-white/60" : "text-gray-400"
          }`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}