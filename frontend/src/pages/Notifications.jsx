// frontend/src/pages/Notifications.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import api from '../lib/api';
import {
  Bell, Heart, MessageCircle, Users, Calendar,
  Sparkles, UserCheck, X, RefreshCw, Rss
} from 'lucide-react';

/* ─── helpers ────────────────────────────────────────────────────────────── */
const fmtRelative = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000)      return 'just now';
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const groupByTime = (items) => {
  const buckets = { Today: [], Yesterday: [], 'This Week': [], 'This Month': [], Older: [] };
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yest  = today - 86_400_000;
  const week  = today - 7  * 86_400_000;
  const month = today - 30 * 86_400_000;

  items.forEach(item => {
    const t = new Date(item.createdAt);
    if (isNaN(t)) { buckets.Older.push(item); return; }
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    if (d === today)      buckets.Today.push(item);
    else if (d === yest)  buckets.Yesterday.push(item);
    else if (t > week)    buckets['This Week'].push(item);
    else if (t > month)   buckets['This Month'].push(item);
    else                  buckets.Older.push(item);
  });

  return Object.fromEntries(Object.entries(buckets).filter(([, v]) => v.length));
};

const ICON_MAP = {
  like:             { Icon: Heart,          bg: '#f0f7f4', color: '#2e8b57' },
  follow:           { Icon: Rss,            bg: '#f0f7f4', color: '#2e8b57' },
  friend_request:   { Icon: Sparkles,       bg: '#f0f7f4', color: '#2e8b57' },
  friend_accept:    { Icon: UserCheck,      bg: '#e8f5e9', color: '#2e7d32' },
  message:          { Icon: MessageCircle,  bg: '#e6f4ed', color: '#1e6b4b' },
  join_request:     { Icon: Users,          bg: '#f0f7f4', color: '#2e8b57' },
  invite:           { Icon: Calendar,       bg: '#f0f7f4', color: '#2e8b57' },
  default:          { Icon: Bell,           bg: '#f0f7f4', color: '#2e8b57' },
};

const getIcon = (type) => ICON_MAP[type] || ICON_MAP.default;

/* ─── component ─────────────────────────────────────────────────────────── */
export default function Notifications() {
  const navigate = useNavigate();

  const [activeTab,   setActiveTab]   = useState('notifications');
  const [grouped,     setGrouped]     = useState({});
  const [requests,    setRequests]    = useState([]);   // friend requests
  const [badge,       setBadge]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [actioning,   setActioning]   = useState({});  // { [userId]: 'accepting'|'rejecting' }

  const containerRef = useRef(null);

  /* ── pull-to-refresh ──────────────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startY = 0, pulling = false, curY = 0;
    const onStart = (e) => { if (el.scrollTop === 0) { startY = e.touches[0].clientY; pulling = true; } };
    const onMove  = (e) => {
      if (!pulling) return;
      curY = e.touches[0].clientY;
      const d = Math.min((curY - startY) / 3, 40);
      if (d > 0) el.style.transform = `translateY(${d}px)`;
    };
    const onEnd   = async () => {
      if (!pulling) return;
      pulling = false;
      el.style.transform = '';
      if (curY - startY > 80) { setRefreshing(true); await load(); setRefreshing(false); }
    };
    el.addEventListener('touchstart', onStart);
    el.addEventListener('touchmove',  onMove);
    el.addEventListener('touchend',   onEnd);
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchmove', onMove); el.removeEventListener('touchend', onEnd); };
  }, []);

  /* ── fetch ────────────────────────────────────────────────────────────── */
  const load = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/read-all').catch(() => {});

      const [{ data: notifs = [] }, { data: me }] = await Promise.all([
        api.get('/notifications'),
        api.get('/auth/me').catch(() => ({ data: { friendRequests: [] } })),
      ]);

      setGrouped(groupByTime(notifs));

      const reqIds = me?.friendRequests || [];
      if (reqIds.length > 0) {
        try {
          const { data: users } = await api.post('/users/batch', { userIds: reqIds });
          setRequests(users || []);
          setBadge(users?.length || 0);
        } catch {
          const fallback = reqIds.map(id => ({ _id: id, name: 'User', username: 'user', avatar: null }));
          setRequests(fallback);
          setBadge(fallback.length);
        }
      } else {
        setRequests([]);
        setBadge(0);
      }
    } catch (e) {
      console.error('Notifications load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── accept / reject ─────────────────────────────────────────────────── */
  const accept = async (uid) => {
    setActioning(p => ({ ...p, [uid]: 'accepting' }));
    try {
      await api.post(`/users/friend-request/${uid}/accept`);
      setRequests(p => p.filter(u => u._id !== uid));
      setBadge(b => Math.max(0, b - 1));
    } catch { alert('Failed to accept request'); }
    finally { setActioning(p => { const n = { ...p }; delete n[uid]; return n; }); }
  };

  const reject = async (uid) => {
    setActioning(p => ({ ...p, [uid]: 'rejecting' }));
    try {
      await api.post(`/users/friend-request/${uid}/reject`);
      setRequests(p => p.filter(u => u._id !== uid));
      setBadge(b => Math.max(0, b - 1));
    } catch { alert('Failed to reject request'); }
    finally { setActioning(p => { const n = { ...p }; delete n[uid]; return n; }); }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'requests') setBadge(0);
  };

  /* ── loading ─────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{STYLES}</style>
      <div style={{ textAlign:'center' }}>
        <div className="loading-orb">
          <Bell size={24} color="white" />
        </div>
        <p style={{ fontFamily:'Sora', color:'var(--muted)', fontSize:14, marginTop:16 }}>Fetching your updates…</p>
      </div>
    </div>
  );

  const allEmpty = Object.keys(grouped).length === 0;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'Sora', paddingBottom:88 }}>
      <style>{STYLES}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="notif-header">
        <div style={{ maxWidth:680, margin:'0 auto', padding:'18px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h1 className="page-title">Activity</h1>
              <p style={{ fontSize:13, color:'var(--muted)', marginTop:3 }}>
                Stay up to date with your friends
              </p>
            </div>
            <button className="refresh-btn" onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin .8s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            <button
              className={`tab-btn${activeTab === 'notifications' ? ' active' : ''}`}
              onClick={() => switchTab('notifications')}
            >
              <Bell size={14} />
              Notifications
            </button>
            <button
              className={`tab-btn${activeTab === 'requests' ? ' active' : ''}`}
              onClick={() => switchTab('requests')}
            >
              <Sparkles size={14} />
              Friend Requests
              {badge > 0 && <span className="badge">{badge}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ maxWidth:680, margin:'0 auto', padding:'20px 16px' }}
      >
        {refreshing && (
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <div className="spinner-sm" />
          </div>
        )}

        {/* ── Notifications ─────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <>
            {allEmpty ? (
              <div className="empty-card">
                <div className="empty-icon-wrap" style={{ background: '#e8f5e9' }}>
                  <Bell size={30} color="#2e8b57" strokeWidth={1.5} />
                </div>
                <p className="empty-title">All caught up!</p>
                <p className="empty-sub">New likes, comments & friend activity will appear here</p>
              </div>
            ) : (
              Object.entries(grouped).map(([period, items]) => (
                <div key={period} style={{ marginBottom:32 }}>
                  <div className="period-label">
                    <span>{period}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {items.map((item, i) => {
                      const { Icon, bg, color } = getIcon(item.type);
                      return (
                        <div key={item._id || i} className="notif-card"
                          style={{ animationDelay: `${i * 0.05}s` }}>

                          {/* Icon */}
                          <div className="notif-icon" style={{ background: bg }}>
                            <Icon size={18} color={color} />
                          </div>

                          {/* Body */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                              <p className="notif-msg">{item.message}</p>
                              <span className="notif-time">{fmtRelative(item.createdAt)}</span>
                            </div>

                            {item.fromUser && (
                              <div
                                className="notif-from"
                                onClick={() => item.fromUser._id && navigate(`/profile/${item.fromUser._id}`)}
                              >
                                <div style={{ width:22,height:22,borderRadius:'50%',overflow:'hidden',
                                  background:'var(--surface2)',flexShrink:0,border:'1px solid var(--border)' }}>
                                  {item.fromUser.avatar
                                    ? <img src={item.fromUser.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                    : <span style={{fontSize:10,fontWeight:800,color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
                                        {item.fromUser.name?.[0]}
                                      </span>
                                  }
                                </div>
                                <span style={{ fontSize:12, fontWeight:600, color:'var(--accent)' }}>
                                  {item.fromUser.name} · View profile
                                </span>
                              </div>
                            )}

                            {item.activity && (
                              <button
                                className="notif-activity-btn"
                                onClick={() => navigate(`/activity/${item.activity._id || item.activity}`)}
                              >
                                View hangout
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Friend Requests ───────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <div className="empty-card">
                <div className="empty-icon-wrap" style={{ background: '#e8f5e9' }}>
                  <Sparkles size={30} color="#2e8b57" strokeWidth={1.5} />
                </div>
                <p className="empty-title">No requests yet</p>
                <p className="empty-sub">When a friend wants to connect, their request will show up here</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {requests.map((u, i) => {
                  const state = actioning[u._id];
                  return (
                    <div key={u._id} className="req-card" style={{ animationDelay:`${i * 0.06}s` }}>

                      {/* Avatar */}
                      <div
                        className="req-avatar"
                        onClick={() => navigate(`/profile/${u._id}`)}
                      >
                        {u.avatar
                          ? <img src={u.avatar} alt={u.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <span style={{fontSize:22,fontWeight:800,color:'var(--accent)'}}>{u.name?.[0]}</span>
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 ,cursor:'pointer'}}
                        onClick={() => navigate(`/profile/${u._id}`)}>
                        <p style={{ fontWeight:700, fontSize:15, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {u.name}
                        </p>
                        <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>@{u.username || 'user'}</p>
                        <p style={{ fontSize:12, color:'var(--accent)', marginTop:5, fontWeight:500 }}>
                          Wants to be friends
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:7, flexShrink:0 }}>
                        <button
                          className="btn-accept"
                          onClick={() => accept(u._id)}
                          disabled={!!state}
                        >
                          {state === 'accepting'
                            ? <span className="spinner-xs" />
                            : <><UserCheck size={13}/> Accept</>
                          }
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => reject(u._id)}
                          disabled={!!state}
                        >
                          {state === 'rejecting'
                            ? <span className="spinner-xs" />
                            : <><X size={13}/> Decline</>
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
const STYLES = `
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
  }

  * { font-family: 'Sora', sans-serif; }

  .serif { font-family: 'Instrument Serif', serif; }

  /* Header */
  .notif-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(248,247,244,0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }

  /* Page title */
  .page-title {
    font-family: 'Instrument Serif', serif;
    font-size: 30px; font-weight: 700;
    color: var(--text); line-height: 1.1; letter-spacing: -0.5px;
  }

  /* Refresh button */
  .refresh-btn {
    width: 40px; height: 40px; border-radius: 14px;
    border: 1.5px solid var(--border); background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted); transition: all .2s;
  }
  .refresh-btn:hover { border-color: var(--accent); color: var(--accent); background: #e8f5e9; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Tab bar */
  .tab-bar {
    display: flex; gap: 4px;
    background: #e8f5e9; border-radius: 16px 16px 0 0;
    padding: 5px 5px 0; border: 1px solid var(--border); border-bottom: none;
    margin-top: 2px;
  }
  .tab-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 16px; border-radius: 12px 12px 0 0;
    border: none; background: transparent;
    font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
    color: var(--muted); cursor: pointer; transition: all .2s; position: relative;
  }
  .tab-btn.active {
    background: var(--surface); color: var(--accent);
    box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
  }
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
    background: var(--accent); color: white; font-size: 10px; font-weight: 800;
    animation: badgePop .3s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes badgePop { from{transform:scale(0)} to{transform:scale(1)} }

  /* Period label */
  .period-label {
    display: flex; align-items: center; gap: 10; margin-bottom: 12;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .1em; color: var(--muted);
  }
  .period-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border); margin-left: 10px;
  }

  /* Notification card */
  .notif-card {
    display: flex; align-items: flex-start; gap: 14px;
    background: var(--surface); border-radius: 20px;
    border: 1px solid var(--border); padding: 16px;
    transition: all .2s; animation: fadeUp .35s ease both;
    box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  }
  .notif-card:hover { box-shadow: 0 6px 24px rgba(74,156,110,0.08); transform: translateY(-1px); border-color: #d1e6d8; }

  .notif-icon {
    width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .notif-msg  { font-size: 14px; font-weight: 500; color: var(--text); line-height: 1.5; }
  .notif-time { font-size: 11px; color: var(--muted); white-space: nowrap; font-weight: 500; flex-shrink: 0; }
  .notif-from {
    display: inline-flex; align-items: center; gap: 7px;
    margin-top: 10px; cursor: pointer; transition: opacity .18s;
    padding: 6px 12px; border-radius: 100px;
    background: #e8f5e9; border: 1px solid rgba(74,156,110,0.15);
  }
  .notif-from:hover { opacity: .85; }
  .notif-activity-btn {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
    padding: 6px 14px; border-radius: 100px;
    border: 1.5px solid var(--border); background: var(--surface);
    font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600; color: var(--accent);
    cursor: pointer; transition: all .18s;
  }
  .notif-activity-btn:hover { border-color: var(--accent); color: var(--accent); background: #e8f5e9; }

  /* Request card */
  .req-card {
    display: flex; align-items: center; gap: 14px;
    background: var(--surface); border-radius: 22px;
    border: 1px solid var(--border); padding: 18px;
    animation: fadeUp .35s ease both;
    box-shadow: 0 2px 12px rgba(0,0,0,0.03); transition: all .2s;
  }
  .req-card:hover { box-shadow: 0 6px 24px rgba(74,156,110,0.08); border-color: #d1e6d8; }

  .req-avatar {
    width: 58px; height: 58px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
    background: #e8f5e9; cursor: pointer;
    border: 2.5px solid transparent;
    background-clip: padding-box;
    box-shadow: 0 0 0 2.5px #6ab8a0;
    display: flex; align-items: center; justify-content: center;
    transition: transform .2s;
  }
  .req-avatar:hover { transform: scale(1.05); }

  /* Accept / Decline buttons */
  .btn-accept {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #4a9c6e, #6ab8a0);
    color: white; font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all .2s; white-space: nowrap;
    box-shadow: 0 4px 16px rgba(74,156,110,0.3);
  }
  .btn-accept:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(74,156,110,0.4); }
  .btn-accept:disabled { opacity: .6; pointer-events: none; }

  .btn-reject {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 12px;
    border: 1.5px solid var(--border); background: var(--surface);
    color: var(--muted); font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all .2s; white-space: nowrap;
  }
  .btn-reject:hover { border-color: var(--accent); color: var(--accent); background: #e8f5e9; }
  .btn-reject:disabled { opacity: .6; pointer-events: none; }

  /* Empty state */
  .empty-card {
    background: var(--surface); border-radius: 28px;
    border: 1px solid var(--border); padding: 64px 24px;
    text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,0.03);
  }
  .empty-icon-wrap {
    width: 72px; height: 72px; border-radius: 24px; margin: 0 auto 20px;
    display: flex; align-items: center; justify-content: center;
  }
  .empty-title { 
    font-family: 'Instrument Serif', serif; 
    font-size: 22px; color: var(--text); font-weight: 600; margin-bottom: 8px; 
  }
  .empty-sub   { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 240px; margin: 0 auto; }

  /* Loading orb */
  .loading-orb {
    width: 56px; height: 56px; border-radius: 20px; margin: 0 auto;
    background: linear-gradient(135deg, #4a9c6e, #6ab8a0);
    display: flex; align-items: center; justify-content: center;
    animation: pulse 1.8s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }

  /* Spinners */
  .spinner-sm {
    width: 22px; height: 22px; border-radius: 50%;
    border: 3px solid var(--border); border-top-color: var(--accent);
    animation: spin .8s linear infinite;
  }
  .spinner-xs {
    display: inline-block; width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid currentColor; border-top-color: transparent;
    animation: spin .7s linear infinite;
  }

  /* Fade up */
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
`;