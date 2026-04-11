// frontend/src/pages/ActivityDetail.jsx
import {
  Heart, MessageCircle, Calendar, MapPin, ArrowLeft, Send,
  Users, X, Image as ImageIcon, Crown, CheckCheck, Clock, Wifi, WifiOff
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import io from 'socket.io-client';
import api from '../lib/api';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDateLabel = (dateStr) => {
  const date  = new Date(dateStr);
  const today = new Date();
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  const strip = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (strip(date) === strip(today)) return 'Today';
  if (strip(date) === strip(yest))  return 'Yesterday';
  const diff = Math.ceil((strip(today) - strip(date)) / 86_400_000);
  if (diff <= 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: diff > 365 ? 'numeric' : undefined });
};

export default function ActivityDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  const [activity,        setActivity]        = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [newMessage,      setNewMessage]      = useState('');
  const [liked,           setLiked]           = useState(false);
  const [likeCount,       setLikeCount]       = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [isLiking,        setIsLiking]        = useState(false);
  const [onlineCount,     setOnlineCount]     = useState(1);
  const [onlineUsers,     setOnlineUsers]     = useState([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showParticipants,setShowParticipants]= useState(false);
  const [isConnected,     setIsConnected]     = useState(false);
  const [typingUsers,     setTypingUsers]     = useState(new Set());
  const [imagePreview,    setImagePreview]    = useState(null);
  const [uploading,       setUploading]       = useState(false);
  const [chatTab,         setChatTab]         = useState('chat'); // 'chat' | 'info'

  const socketRef        = useRef(null);
  const messagesEndRef   = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef     = useRef(null);
  const chatRef          = useRef(null);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { reconnection: true, reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (user) socket.emit('authenticate', { userId: user._id, name: user.name, avatar: user.avatar });
      socket.emit('joinActivity', id);
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('activityOnlineCount', ({ activityId, count }) => { if (activityId === id) setOnlineCount(count); });
    socket.on('activityOnlineUsers', ({ activityId, users }) => { if (activityId === id) setOnlineUsers(users); });
    socket.on('newMessage', (msg) => {
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, { ...msg, status: 'sent' }]);
    });
    socket.on('typing', ({ name, isTyping }) => {
      setTypingUsers(prev => {
        const s = new Set(prev);
        isTyping ? s.add(name || 'Someone') : s.delete(name || 'Someone');
        return s;
      });
    });
    return () => socket.disconnect();
  }, [id, user]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const { data } = await api.get(`/activities/${id}`);
      setActivity(data);
      setLiked(data.likes?.some(l => (l._id || l).toString() === user._id));
      setLikeCount(data.likes?.length || 0);
      setMessages((data.messages || []).map(m => ({ ...m, status: 'sent' })));
    } catch (err) {
      setError('Failed to load hangout.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    try { await api.post(`/activities/${id}/like`); }
    catch { setLiked(wasLiked); setLikeCount(c => wasLiked ? c + 1 : c - 1); }
    finally { setIsLiking(false); }
  };

  const sendMessage = () => {
    if ((!newMessage.trim() && !imagePreview) || !socketRef.current) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      text: newMessage.trim(), image: imagePreview,
      createdAt: new Date().toISOString(), status: 'sending',
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMessage(''); setImagePreview(null);
    socketRef.current.emit('sendMessage', { activityId: id, text: optimistic.text, image: optimistic.image }, (res) => {
      setMessages(prev => prev.map(m =>
        m._id === tempId ? (res?.success ? { ...res.message, status: 'sent' } : { ...m, status: 'failed' }) : m
      ));
    });
  };

  const handleTyping = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { activityId: id, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() =>
      socketRef.current?.emit('typing', { activityId: id, isTyping: false }), 1300);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const isMyMessage = (msg) => (msg.sender?._id || msg.sender)?.toString() === user?._id?.toString();
  const isCreator   = activity?.creator?._id === user?._id;

  // ── Group messages by date ──────────────────────────────────────────────────
  const groupedMessages = messages.reduce((acc, msg) => {
    const key = new Date(msg.createdAt).toDateString();
    (acc[key] = acc[key] || []).push(msg);
    return acc;
  }, {});
  const sortedKeys = Object.keys(groupedMessages).sort((a, b) => new Date(a) - new Date(b));

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#4a9c6e,#6ab8a0)',
          margin: '0 auto 16px', animation: 'pulse 1.5s infinite', display:'flex',alignItems:'center',justifyContent:'center' }}>
          <MessageCircle size={24} color="white" />
        </div>
        <p style={{ fontFamily: 'Sora', color: 'var(--muted)', fontSize: 14 }}>Loading hangout…</p>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </div>
    </div>
  );

  if (error || !activity) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
      <p style={{ color:'var(--accent)', fontFamily:'Sora' }}>{error || 'Hangout not found'}</p>
      <button onClick={fetchActivity} style={{ padding:'10px 24px', borderRadius:12, background:'var(--accent)', color:'white', border:'none', fontFamily:'Sora', cursor:'pointer' }}>Retry</button>
    </div>
  );

  const typingArr = Array.from(typingUsers);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80, fontFamily: 'Sora, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        :root {
          --bg: #f8f7f4;
          --surface: #ffffff;
          --surface2: #f0ede8;
          --accent: #4a9c6e;
          --accent2: #6ab8a0;
          --muted: #8a8580;
          --border: #e4e0da;
          --text: #1f2a44;
          --text2: #5c5750;
          --chat-me: #1f2a44;
          --chat-other: #ffffff;
        }
        * { box-sizing: border-box; }
        .serif { font-family: 'Instrument Serif', serif; }

        /* Header */
        .act-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(248,247,244,0.96);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }

        /* Info card */
        .info-card {
          background: var(--surface); border-radius: 24px;
          border: 1px solid var(--border); padding: 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }

        /* Tab bar */
        .tab-bar {
          display: flex; background: var(--surface2);
          border-radius: 16px; padding: 4px; gap: 4px;
          border: 1px solid var(--border);
        }
        .tab-btn {
          flex: 1; padding: 10px; border-radius: 12px;
          border: none; font-family: 'Sora',sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; color: var(--muted); background: transparent;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .tab-btn.active {
          background: var(--surface); color: var(--text);
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        /* Chat window */
        .chat-window {
          background: var(--surface); border-radius: 24px;
          border: 1px solid var(--border); overflow: hidden;
          display: flex; flex-direction: column;
          height: 540px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }

        .chat-header {
          padding: 16px 20px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justifyContent: space-between;
          background: var(--surface);
        }

        /* Messages */
        .messages-area {
          flex: 1; overflow-y: auto; padding: 16px;
          background: var(--bg);
          scroll-behavior: smooth;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        .date-chip {
          display: flex; justify-content: center; margin: 16px 0 12px;
          position: sticky; top: 0; z-index: 10;
        }
        .date-chip span {
          background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
          border: 1px solid var(--border); border-radius: 100px;
          padding: 4px 14px; font-size: 11px; font-weight: 600; color: var(--muted);
        }

        /* Bubbles */
        .bubble-me {
          background: var(--chat-me); color: white;
          border-radius: 20px 20px 4px 20px;
          padding: 10px 16px; max-width: 72%;
          box-shadow: 0 2px 8px rgba(31,42,68,0.2);
        }
        .bubble-other {
          background: var(--chat-other); color: var(--text);
          border-radius: 20px 20px 20px 4px;
          padding: 10px 16px; max-width: 72%;
          border: 1px solid var(--border);
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        /* Input bar */
        .input-bar {
          padding: 12px 16px; border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .msg-input {
          flex: 1; background: var(--bg); border: 1.5px solid var(--border);
          border-radius: 16px; padding: 12px 18px; font-size: 14px;
          font-family: 'Sora',sans-serif; color: var(--text); outline: none;
          transition: border-color 0.2s;
        }
        .msg-input:focus { border-color: var(--accent); }
        .msg-input::placeholder { color: var(--muted); }

        .send-btn {
          width: 46px; height: 46px; border-radius: 14px;
          background: var(--accent); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(74,156,110,0.35);
          transition: all 0.18s;
        }
        .send-btn:hover { background: #3e8a5f; transform: translateY(-1px); }
        .send-btn:disabled { opacity: 0.4; transform: none; cursor: not-allowed; }

        .icon-btn {
          width: 46px; height: 46px; border-radius: 14px;
          background: var(--surface2); border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--muted); transition: all 0.18s; flex-shrink: 0;
        }
        .icon-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* Action buttons */
        .like-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 13px; border-radius: 16px;
          border: 1.5px solid var(--border); background: var(--surface);
          font-family: 'Sora',sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; color: var(--text2); transition: all 0.2s;
        }
        .like-btn:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
        .like-btn.liked { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

        .join-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 13px; border-radius: 16px;
          background: var(--accent); color: white;
          border: none; font-family: 'Sora',sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(74,156,110,0.25);
        }
        .join-btn:hover { background: #3e8a5f; transform: translateY(-1px); }

        /* Interest tags */
        .tag {
          padding: 5px 14px; border-radius: 100px;
          background: rgba(74,156,110,0.08); color: var(--accent);
          border: 1px solid rgba(74,156,110,0.15);
          font-size: 12px; font-weight: 600;
        }

        /* Online badge */
        .online-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 100px;
          background: rgba(74,156,110,0.08); color: var(--accent);
          border: 1px solid rgba(74,156,110,0.2);
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.18s;
        }
        .online-badge:hover { background: rgba(74,156,110,0.15); }

        /* Participant list */
        .participant-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 16px; transition: background 0.15s;
          cursor: pointer;
        }
        .participant-row:hover { background: var(--surface2); }

        /* Typing indicator */
        .typing-dots span {
          display: inline-block; width: 5px; height: 5px;
          background: var(--muted); border-radius: 50%; margin: 0 1px;
          animation: bounce 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)} }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(12px); display: flex;
          align-items: center; justify-content: center; z-index: 100; padding: 20px;
        }
        .modal-box {
          background: var(--surface); border-radius: 28px;
          width: 100%; max-width: 420px; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.2); max-height: 85vh;
          display: flex; flex-direction: column;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }

        .conn-dot {
          width: 8px; height: 8px; border-radius: 50%;
          display: inline-block; margin-right: 5px;
        }
        .conn-dot.on  { background: #22c55e; animation: pulse-dot 2s infinite; }
        .conn-dot.off { background: #d1d5db; }
        @keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:.4} }

        .image-preview-strip {
          display: flex; align-items: center; gap: 10px;
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 14px; padding: 10px 14px; margin-bottom: 10px;
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="act-header">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={20} color="var(--text)" />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="serif" style={{ fontSize: 19, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activity.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span className="conn-dot" style={{ width:8,height:8,borderRadius:'50%',display:'inline-block',
                background: isConnected ? '#22c55e' : '#d1d5db',
                animation: isConnected ? 'pulse-dot 2s infinite' : 'none' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                {isConnected ? 'Live · Group chat active' : 'Connecting…'}
              </span>
            </div>
          </div>

          <button className="online-badge" onClick={() => setShowOnlineModal(true)}>
            <Users size={13} />
            {onlineCount} online
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Info card ────────────────────────────────────────────────────── */}
        <div className="info-card fade-up">
          {/* Creator */}
          <div
            onClick={() => navigate(`/profile/${activity.creator._id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, cursor: 'pointer' }}
          >
            <div style={{ position: 'relative' }}>
              <Avatar src={activity.creator.avatar} size="md" />
              <div style={{ position: 'absolute', bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: '50%',
                background: 'linear-gradient(135deg,#4a9c6e,#6ab8a0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white' }}>
                <Crown size={10} color="white" />
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>{activity.creator.name}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Organizer</p>
            </div>
          </div>

          {/* Title + description */}
          <h2 className="serif" style={{ fontSize: 24, color: 'var(--text)', marginBottom: 10, lineHeight: 1.3 }}>
            {activity.title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 18 }}>
            {activity.description}
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 100, background: 'var(--surface2)',
              border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
              <Calendar size={13} color="var(--accent)" />
              {new Date(activity.time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}
              {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {activity.distance != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 100, background: 'var(--surface2)',
                border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                <MapPin size={13} color="var(--accent)" />
                {Number(activity.distance).toFixed(1)} km away
              </div>
            )}

            <div
              onClick={() => setShowParticipants(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 100, background: 'var(--surface2)',
                border: '1px solid var(--border)', fontSize: 12, fontWeight: 600,
                color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)'; }}
            >
              <Users size={13} />
              {activity.participants?.length || 0} joined
            </div>
          </div>

          {/* Tags */}
          {activity.interests?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activity.interests.map((t, i) => <span key={i} className="tag">#{t}</span>)}
            </div>
          )}
        </div>

        {/* ── Action buttons ────────────────────────────────────────────────── */}
        {/* <div style={{ display: 'flex', gap: 10 }} className="fade-up">
          <button className={`like-btn${liked ? ' liked' : ''}`} onClick={handleLike} disabled={isLiking}>
            <Heart size={18} style={{ fill: liked ? '#ef4444' : 'none', color: liked ? '#ef4444' : 'var(--text2)', transition: 'all 0.2s' }} />
            {liked ? 'Liked' : 'Like'} · {likeCount}
          </button>
          <button className="join-btn" onClick={() => navigate(`/activity/${id}`)}>
            <MessageCircle size={17} />
            {isCreator ? 'Manage Hangout' : 'Open Chat'}
          </button>
        </div> */}

        {/* ── Chat window ───────────────────────────────────────────────────── */}
        <div className="chat-window fade-up">

          {/* Chat header */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11,
                background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={17} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>Group Chat</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                  {messages.length} messages
                </p>
              </div>
            </div>

            {typingArr.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface2)', padding: '6px 12px', borderRadius: 100,
                border: '1px solid var(--border)' }}>
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                  {typingArr.slice(0, 2).join(', ')} typing
                </span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="messages-area" ref={chatRef}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 12, opacity: 0.6 }}>
                <MessageCircle size={40} color="var(--muted)" strokeWidth={1.5} />
                <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>
                  No messages yet — say hi! 👋
                </p>
              </div>
            )}

            {sortedKeys.map(dateKey => (
              <div key={dateKey}>
                <div className="date-chip">
                  <span>{getDateLabel(dateKey)}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {groupedMessages[dateKey].map((msg, i) => {
                    const isMine = isMyMessage(msg);
                    return (
                      <div key={msg._id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: isMine ? 'row-reverse' : 'row', maxWidth: '82%' }}>

                          {!isMine && (
                            <div style={{ flexShrink: 0, marginBottom: 4 }}>
                              <Avatar src={msg.sender?.avatar} size="sm" />
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 2 }}>
                            {!isMine && msg.sender?.name && (
                              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginLeft: 4 }}>
                                {/* {msg.sender.name} */}
                              </p>
                            )}

                            <div className={isMine ? 'bubble-me' : 'bubble-other'}>
                              {msg.image ? (
                                <img src={msg.image} alt="img" style={{ maxWidth: '100%', borderRadius: 12, display: 'block' }}
                                  onError={e => e.target.style.display = 'none'} />
                              ) : (
                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{msg.text}</p>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingInline: 4 }}>
                              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{fmtTime(msg.createdAt)}</span>
                              {isMine && (
                                <span style={{ fontSize: 10, color: msg.status === 'failed' ? '#ef4444' : 'var(--muted)' }}>
                                  {msg.status === 'sending' && <Clock size={10} />}
                                  {msg.status === 'sent'    && <CheckCheck size={10} />}
                                  {msg.status === 'failed'  && '✕'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="input-bar">
            {imagePreview && (
              <div className="image-preview-strip">
                <img src={imagePreview} alt="preview" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10 }} />
                <p style={{ flex: 1, fontSize: 12, color: 'var(--text2)', margin: 0 }}>Image ready to send</p>
                <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="icon-btn" title="Send image">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect}
                  className="hidden" style={{ display: 'none' }} disabled={uploading} />
                <ImageIcon size={18} />
              </label>

              <input
                className="msg-input"
                value={newMessage}
                onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Message the group…"
              />

              <button className="send-btn" onClick={sendMessage} disabled={!newMessage.trim() && !imagePreview}>
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Online users modal ─────────────────────────────────────────────── */}
      {showOnlineModal && (
        <div className="modal-overlay" onClick={() => setShowOnlineModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 17, margin: 0, color: 'var(--text)' }}>Online now</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{onlineCount} people in this hangout</p>
              </div>
              <button onClick={() => setShowOnlineModal(false)}
                style={{ width:36,height:36,borderRadius:10,background:'var(--surface2)',border:'1px solid var(--border)',
                  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
                <X size={16} color="var(--text)" />
              </button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              {onlineUsers.length === 0
                ? <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 14 }}>No one online right now</p>
                : onlineUsers.map((u, i) => (
                  <div key={i} className="participant-row">
                    <div style={{ position: 'relative' }}>
                      <Avatar src={u.avatar} size="md" />
                      <span style={{ position:'absolute',bottom:0,right:0,width:11,height:11,borderRadius:'50%',
                        background:'#22c55e',border:'2px solid white' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: '#16a34a', margin: 0, fontWeight: 500 }}>● Online</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Participants modal ────────────────────────────────────────────────── */}
      {showParticipants && (
        <div className="modal-overlay" onClick={() => setShowParticipants(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 17, margin: 0, color: 'var(--text)' }}>Participants</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{activity.participants?.length || 0} people joined</p>
              </div>
              <button onClick={() => setShowParticipants(false)}
                style={{ width:36,height:36,borderRadius:10,background:'var(--surface2)',border:'1px solid var(--border)',
                  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
                <X size={16} color="var(--text)" />
              </button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              {(activity.participants || []).map((p, i) => {
                const isOrg = (p._id || p) === activity.creator._id;
                return (
                  <div key={i} className="participant-row"
                    onClick={() => { setShowParticipants(false); navigate(`/profile/${p._id || p}`); }}>
                    <Avatar src={p.avatar} size="md" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{p.name || 'Member'}</p>
                      {p.username && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>@{p.username}</p>}
                    </div>
                    {isOrg && (
                      <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(74,156,110,0.1)',
                        color: 'var(--accent)', fontSize: 11, fontWeight: 700, border: '1px solid rgba(74,156,110,0.2)' }}>
                        Organizer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}