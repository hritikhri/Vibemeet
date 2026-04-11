// frontend/src/pages/Explore.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, MapPin, X, UserCheck, UserPlus, Rss, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Avatar from "../components/common/Avatar";
import api from "../lib/api";

// ─── Debounce ─────────────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ─── Radius options ───────────────────────────────────────────────────────────
const RADII = [5, 10, 15, 30, 50];

export default function Explore() {
  const [activities, setActivities]     = useState([]);
  const [users, setUsers]               = useState([]);
  const [search, setSearch]             = useState("");
  const [radius, setRadius]             = useState(15);
  const [loading, setLoading]           = useState(false);
  const [followStates, setFollowStates] = useState({});   // { userId: 'following'|'sent'|'none' }
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const fetchExplore = async (term = search, rad = radius) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/activities/explore?radius=${rad}&search=${encodeURIComponent(term)}`
      );
      // New backend returns { activities, users }
      const acts  = Array.isArray(data) ? data : (data.activities || []);
      const usrs  = Array.isArray(data) ? []  : (data.users || []);

      setActivities(acts);
      setUsers(usrs);

      // Seed follow states from backend data
      const states = {};
      usrs.forEach(u => {
        states[u._id] = u.isFriend ? 'friends'
          : u.requestSent ? 'sent'
          : u.isFollowing ? 'following'
          : 'none';
      });
      setFollowStates(prev => ({ ...prev, ...states }));
    } catch (err) {
      console.error("Explore fetch error:", err);
      setActivities([]); setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(debounce(fetchExplore, 450), [radius]);

  useEffect(() => { debouncedFetch(search, radius); }, [search, radius]);
  useEffect(() => { fetchExplore("", 15); }, []); // initial load

  // ── Follow / friend actions ───────────────────────────────────────────────
  const handleFollow = async (userId) => {
    try {
      const { data } = await api.post(`/users/${userId}/follow`);
      setFollowStates(prev => ({ ...prev, [userId]: data.following ? 'following' : 'none' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendRequest = async (userId) => {
    try {
      await api.post(`/users/${userId}/friend-request`);
      setFollowStates(prev => ({ ...prev, [userId]: 'sent' }));
    } catch (err) {
      console.error(err);
    }
  };

  const isSearching = search.trim() !== "";

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        :root {
          --bg: #f5f3ef;
          --surface: #ffffff;
          --surface2: #f0ede8;
          --primary: #1a1a2e;
          --accent: #e8633a;
          --accent2: #3a7bd5;
          --muted: #8a8580;
          --border: #e4e0da;
          --text: #1a1a1a;
          --text2: #5c5750;
        }
        * { font-family: 'Sora', sans-serif; box-sizing: border-box; }
        .serif { font-family: 'Instrument Serif', serif; }

        .explore-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(245,243,239,0.94);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 14px 20px 12px;
        }

        .search-wrap {
          position: relative;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          display: flex; align-items: center; gap: 10px;
          padding: 0 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-wrap.focused {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(232,99,58,0.1);
        }
        .search-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: 14px; color: var(--text); padding: 13px 0;
          font-family: 'Sora', sans-serif;
        }
        .search-input::placeholder { color: var(--muted); }

        .radius-btn {
          padding: 7px 14px; border-radius: 100px; font-size: 12px;
          font-weight: 600; border: 1.5px solid var(--border);
          background: var(--surface); color: var(--text2);
          cursor: pointer; transition: all 0.18s; white-space: nowrap;
        }
        .radius-btn.active {
          background: var(--accent); color: white; border-color: var(--accent);
          box-shadow: 0 2px 12px rgba(232,99,58,0.25);
        }
        .radius-btn:not(.active):hover { border-color: var(--accent); color: var(--accent); }

        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted);
          margin-bottom: 12px; margin-top: 24px;
        }

        /* User card */
        .user-card {
          background: var(--surface); border-radius: 20px;
          border: 1px solid var(--border);
          padding: 16px; display: flex; align-items: center; gap: 14px;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: default;
          animation: fadeUp 0.35s ease both;
        }
        .user-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.07); transform: translateY(-1px); }

        /* Activity card */
        .act-card {
          background: var(--surface); border-radius: 22px;
          border: 1px solid var(--border); overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
          animation: fadeUp 0.4s ease both;
        }
        .act-card:hover { box-shadow: 0 6px 30px rgba(0,0,0,0.09); transform: translateY(-2px); }

        .act-card-body { padding: 20px; }

        .interest-tag {
          display: inline-block; padding: 5px 12px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
          background: rgba(232,99,58,0.08); color: var(--accent);
          border: 1px solid rgba(232,99,58,0.15);
        }

        .dist-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(58,123,213,0.08); color: var(--accent2);
          font-size: 11px; font-weight: 600;
          border: 1px solid rgba(58,123,213,0.15);
        }

        .btn-primary {
          padding: 10px 20px; border-radius: 12px;
          background: var(--accent); color: white;
          border: none; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Sora', sans-serif;
          transition: all 0.18s;
          box-shadow: 0 3px 14px rgba(232,99,58,0.3);
        }
        .btn-primary:hover { background: #d4522a; transform: translateY(-1px); }

        .btn-secondary {
          padding: 10px 20px; border-radius: 12px;
          background: var(--surface2); color: var(--text2);
          border: 1.5px solid var(--border); font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.18s;
        }
        .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

        .btn-ghost {
          padding: 8px 16px; border-radius: 10px;
          background: transparent; color: var(--muted);
          border: 1.5px solid var(--border); font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.18s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

        .skeleton { border-radius: 20px; overflow: hidden; }
        .skeleton-inner {
          background: linear-gradient(90deg, var(--surface2) 25%, #e8e4de 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .view-details-btn {
          width: 100%; padding: 13px; border-radius: 14px;
          background: var(--primary); color: white;
          border: none; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Sora', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: all 0.18s;
        }
        .view-details-btn:hover { background: #2d2d4a; }

        .empty-wrap { text-align: center; padding: 80px 24px; }
        .empty-icon-wrap {
          width: 88px; height: 88px; border-radius: 26px; margin: 0 auto 20px;
          background: linear-gradient(135deg, #fff5f2, #fde8df);
          display: flex; align-items: center; justify-content: center; font-size: 36px;
        }

        .creator-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .creator-row:hover .creator-name { color: var(--accent); }
      `}</style>

      {/* Header */}
      <header className="explore-header">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Title + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div className={`search-wrap${searchFocused ? ' focused' : ''}`}>
                <Search size={17} color="var(--muted)" style={{ flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  className="search-input"
                  placeholder="Search activities or people…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Radius pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {RADII.map(r => (
              <button
                key={r}
                className={`radius-btn${radius === r ? ' active' : ''}`}
                onClick={() => setRadius(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '8px 16px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
            {[260, 220, 280].map((h, i) => (
              <div key={i} className="skeleton">
                <div className="skeleton-inner" style={{ height: h }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── People results ── */}
            {isSearching && users.length > 0 && (
              <>
                <p className="section-label">People</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {users.map((u, i) => {
                    const state = followStates[u._id] || 'none';
                    return (
                      <div key={u._id} className="user-card" style={{ animationDelay: `${i * 0.06}s` }}>
                        <div onClick={() => navigate(`/profile/${u._id}`)} style={{ cursor: 'pointer' }}>
                          <Avatar src={u.avatar} size="md" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/profile/${u._id}`)}>
                          <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{u.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--muted)' }}>@{u.username}</p>
                          {u.bio && (
                            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.bio}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                          {/* Follow button */}
                          <button
                            className={state === 'following' || state === 'friends' ? 'btn-secondary' : 'btn-primary'}
                            style={{ padding: '7px 14px', fontSize: 12, borderRadius: 10 }}
                            onClick={() => handleFollow(u._id)}
                            disabled={state === 'friends'}
                          >
                            {state === 'following' ? <><Rss size={12} /> Following</> : state === 'friends' ? <><UserCheck size={12} /> Friends</> : <><Rss size={12} /> Follow</>}
                          </button>
                          {/* Add friend button */}
                          {state !== 'friends' && (
                            <button
                              className="btn-ghost"
                              style={{ padding: '6px 12px', fontSize: 11 }}
                              onClick={() => handleFriendRequest(u._id)}
                              disabled={state === 'sent' || state === 'friends'}
                            >
                              {state === 'sent' ? 'Sent' : <><UserPlus size={11} /> Friend</>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Activities ── */}
            {activities.length > 0 && (
              <>
                <p className="section-label">
                  {isSearching ? 'Matching activities' : 'Near you'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {activities.map((act, i) => (
                    <div key={act._id} className="act-card" style={{ animationDelay: `${i * 0.07}s` }}>
                      <div className="act-card-body">
                        {/* Creator row */}
                        <div
                          className="creator-row"
                          onClick={() => navigate(`/profile/${act.creator._id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Avatar src={act.creator?.avatar} size="sm" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="creator-name" style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', transition: 'color 0.15s' }}>
                              {act.creator?.name}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>@{act.creator?.username}</p>
                          </div>
                          <span className="dist-badge">
                            <MapPin size={10} />
                            {act.distance ? act.distance.toFixed(1) : '?'} km
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>
                          {act.title}
                        </h3>

                        {/* Description */}
                        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 14,
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {act.description}
                        </p>

                        {/* Interest tags */}
                        {act.interests?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                            {act.interests.slice(0, 4).map((tag, idx) => (
                              <span key={idx} className="interest-tag">#{tag}</span>
                            ))}
                            {act.interests.length > 4 && (
                              <span className="interest-tag">+{act.interests.length - 4}</span>
                            )}
                          </div>
                        )}

                        {/* Participants */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ display: 'flex' }}>
                              {(act.participants || []).slice(0, 4).map((p, pi) => (
                                <div key={pi} style={{ marginLeft: pi > 0 ? -8 : 0, zIndex: 4 - pi,
                                  width: 28, height: 28, borderRadius: '50%', border: '2px solid white',
                                  background: '#ddd', overflow: 'hidden' }}>
                                  {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                </div>
                              ))}
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                              {act.participants?.length || 0} joined
                            </span>
                          </div>
                          {act.time && (
                            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                              🗓 {new Date(act.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* CTA */}
                        <button
                          className="view-details-btn"
                          onClick={() => navigate(`/activity/${act._id}`)}
                        >
                          View details <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Empty state ── */}
            {activities.length === 0 && (!isSearching || users.length === 0) && !loading && (
              <div className="empty-wrap">
                <div className="empty-icon-wrap">📍</div>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  Nothing found
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 260, margin: '0 auto', lineHeight: 1.6 }}>
                  Try widening your radius or searching with a different keyword
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}