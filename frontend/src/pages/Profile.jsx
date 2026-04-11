// frontend/src/pages/Profile.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BottomNav from '../components/layout/BottomNav';
import Avatar from '../components/common/Avatar';
import FeedCard from '../components/feed/FeedCard';
import api from '../lib/api';
import {
  MessageCircle, Edit3, Settings, Heart,
  MapPin, Sparkles, X, ChevronRight, UserCheck
} from 'lucide-react';

export default function Profile() {
  const { id }               = useParams();
  const { user: currentUser } = useAuthStore();
  const navigate             = useNavigate();

  const activitiesRef = useRef(null);
  const modalRef      = useRef(null);

  const [profileUser,    setProfileUser]   = useState(null);
  const [activities,     setActivities]    = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [isFollowing,    setIsFollowing]   = useState(false);
  const [followLoading,  setFollowLoading] = useState(false);
  const [activeModal,    setActiveModal]   = useState(null); // 'followers' | 'following' | null

  const isOwnProfile = !id || id === currentUser?._id;

  /* ── outside click closes modal ─────────────────────────────────────────── */
  useEffect(() => {
    const h = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) setActiveModal(null); };
    if (activeModal) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [activeModal]);

  /* ── fetch ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    const uid = id || currentUser?._id;
    Promise.all([api.get(`/users/${uid}`), api.get(`/users/${uid}/activities`)])
      .then(([{ data: u }, { data: acts }]) => {
        setProfileUser(u);
        setActivities(acts || []);
        if (!isOwnProfile) {
          setIsFollowing(u.followers?.some(f => (f._id || f) === currentUser?._id) ?? false);
        }
      })
      .catch(e => console.error('Profile fetch error:', e))
      .finally(() => setLoading(false));
  }, [id, currentUser]);

  /* ── follow toggle (optimistic) ─────────────────────────────────────────── */
  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const was = isFollowing;
    setIsFollowing(!was);
    setProfileUser(prev => ({
      ...prev,
      followers: was
        ? (prev.followers || []).filter(f => (f._id || f) !== currentUser._id)
        : [...(prev.followers || []), { _id: currentUser._id }],
    }));
    try { await api.post(`/users/${id}/follow`); }
    catch {
      setIsFollowing(was);
      setProfileUser(prev => ({
        ...prev,
        followers: was
          ? [...(prev.followers || []), { _id: currentUser._id }]
          : (prev.followers || []).filter(f => (f._id || f) !== currentUser._id),
      }));
    } finally { setFollowLoading(false); }
  };

  const followerCount  = profileUser?.followers?.length  ?? 0;
  const followingCount = profileUser?.following?.length  ?? 0;

  const modalData = activeModal === 'followers'
    ? { title: 'Followers', sub: `${followerCount} friends follow you`, list: profileUser?.followers || [] }
    : { title: 'Following', sub: `Following ${followingCount} friends`, list: profileUser?.following || [] };

  /* ── loading ────────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:56,height:56,borderRadius:20,margin:'0 auto 16px',
          background:'linear-gradient(135deg,#4a9c6e,#6ab8a0)',
          display:'flex',alignItems:'center',justifyContent:'center',animation:'pulse 1.8s ease-in-out infinite' }}>
          <UserCheck size={26} color="white" />
        </div>
        <p style={{ fontFamily:'Sora', color:'var(--muted)', fontSize:14 }}>Loading profile…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'Sora', paddingBottom:96 }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Cover ──────────────────────────────────────────────────────────── */}
      <div className="cover">
        <div className="orb" style={{ width:200,height:200,top:-50,right:-50 }} />
        <div className="orb" style={{ width:110,height:110,bottom:20,left:80,animationDelay:'2s' }} />
        <div className="orb" style={{ width:70,height:70,top:50,left:'42%',animationDelay:'3.5s' }} />

        {isOwnProfile ? (
          <button className="corner-btn" onClick={() => navigate('/setting')}>
            <Settings size={17} color="white" />
          </button>
        ) : (
          <button className="corner-btn" onClick={() => navigate(-1)}>
            <ChevronRight size={17} color="white" style={{ transform:'rotate(180deg)' }} />
          </button>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:680, margin:'0 auto', padding:'0 16px' }}>

        {/* Avatar + Buttons row */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>

          {/* Avatar */}
          <div className="avatar-ring">
            <div className="avatar-inner">
              {profileUser?.avatar
                ? <img src={profileUser.avatar} alt={profileUser.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                    background:'linear-gradient(135deg,#e8f5e9,#c1e6d4)',fontSize:38,fontWeight:800,color:'var(--accent)' }}>
                    {profileUser?.name?.[0] || '?'}
                  </div>
              }
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex',gap:8,alignItems:'center',paddingBottom:10,flexWrap:'wrap' }} className="fade-in">
            {!isOwnProfile ? (
              <>
                <button
                  className={isFollowing ? 'btn-follow-off' : 'btn-follow-on'}
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                >
                  {followLoading
                    ? <span className="spinner" />
                    : isFollowing
                      ? <><UserCheck size={15}/> Friends</>
                      : <><UserCheck size={14}/> Add Friend</>
                  }
                </button>
                <button className="btn-message" onClick={() => navigate(`/chat/private/${id}`)}>
                  <MessageCircle size={15}/> Message
                </button>
              </>
            ) : (
              <button className="btn-edit" onClick={() => navigate('/setting')}>
                <Edit3 size={14}/> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginTop:16, animationDelay:'.08s'}} className="fade-in">
          <h1 className="serif-name">{profileUser?.name}</h1>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginTop:6,flexWrap:'wrap' }}>
            <span style={{ fontSize:14,color:'var(--muted)',fontWeight:500 }}>@{profileUser?.username}</span>
            {profileUser?.mood && (
              <span className="mood-chip"><Sparkles size={11}/> {profileUser.mood}</span>
            )}
          </div>
        </div>

        {/* Bio */}
        {profileUser?.bio && (
          <p className="bio fade-in" style={{ animationDelay:'.14s' }}>{profileUser.bio}</p>
        )}

        {/* Interests */}
        {profileUser?.interests?.length > 0 && (
          <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginTop:16, animationDelay:'.18s'}} className="fade-in">
            {profileUser.interests.map((t, i) => <span key={i} className="tag">{t}</span>)}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid fade-in" style={{ animationDelay:'.22s' }}>
          <div className="stat-card" onClick={() => activitiesRef.current?.scrollIntoView({ behavior:'smooth' })}>
            <span className="stat-num">{activities.length}</span>
            <span className="stat-label">Hangouts</span>
          </div>
          <div className="stat-card" onClick={() => setActiveModal('followers')}>
            <span className="stat-num">{followerCount}</span>
            <span className="stat-label">Friends</span>
          </div>
          <div className="stat-card" onClick={() => setActiveModal('following')}>
            <span className="stat-num">{followingCount}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height:1,background:'var(--border)',margin:'32px 0' }} />

        {/* Activities */}
        <div ref={activitiesRef} style={{ scrollMarginTop:24 }}>
          <h2 className="section-title">
            {isOwnProfile ? 'My Hangouts' : `${profileUser?.name?.split(' ')[0]}'s Hangouts`}
          </h2>

          {activities.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">👥</div>
              <p style={{ fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:6 }}>No hangouts yet</p>
              {isOwnProfile && <p style={{ fontSize:13,color:'var(--muted)' }}>Create your first hangout and invite friends</p>}
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:16}}>
              {activities.map(act => (
                <FeedCard key={act._id} activity={act} onJoin={() => navigate(`/activity/${act._id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* ── Followers / Following Modal ─────────────────────────────────────── */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-box" ref={modalRef} onClick={e => e.stopPropagation()}>

            <div className="modal-handle" />

            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'16px 20px 14px',borderBottom:'1px solid var(--border)' }}>
              <div>
                <p className="serif" style={{ fontSize:20,color:'var(--text)' }}>{modalData.title}</p>
                <p style={{ fontSize:12,color:'var(--muted)',marginTop:2,fontWeight:500 }}>{modalData.sub}</p>
              </div>
              <button className="modal-close" onClick={() => setActiveModal(null)}>
                <X size={15} color="var(--accent)" />
              </button>
            </div>

            <div style={{ overflowY:'auto',padding:'8px 0 20px',flex:1 }}>
              {modalData.list.length === 0 ? (
                <div style={{ textAlign:'center',padding:'48px 24px',color:'var(--muted)' }}>
                  <div style={{ fontSize:40,marginBottom:12 }}>{activeModal === 'followers' ? '👥' : '🌿'}</div>
                  <p style={{ fontWeight:600 }}>No {activeModal} yet</p>
                </div>
              ) : (
                modalData.list.map((p, i) => (
                  <div key={p._id || i} className="person-row"
                    onClick={() => { setActiveModal(null); navigate(`/profile/${p._id}`); }}>
                    <div style={{ width:48,height:48,borderRadius:'50%',overflow:'hidden',
                      background:'var(--surface2)',flexShrink:0,border:'2px solid var(--border)' }}>
                      {p.avatar
                        ? <img src={p.avatar} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',
                            justifyContent:'center',fontSize:20,fontWeight:800,color:'var(--accent)'}}>
                            {p.name?.[0]}
                          </div>
                      }
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontWeight:700,fontSize:14,color:'var(--text)',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name}</p>
                      {p.username && (
                        <p style={{ fontSize:12,color:'var(--muted)',marginTop:1 }}>@{p.username}</p>
                      )}
                    </div>
                    <ChevronRight size={15} color="var(--border)" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
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

  * { box-sizing: border-box; margin: 0; font-family: 'Sora', sans-serif; }
  .serif { font-family: 'Instrument Serif', serif; }

  /* Cover */
  .cover {
    position: relative; height: 220px; overflow: hidden;
    background: linear-gradient(155deg, #1a2a2f 0%, #2e4a44 35%, #3a6b5c 70%, #4a9c6e 100%);
  }
  .cover::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 100px;
    background: linear-gradient(to bottom, transparent, var(--bg));
  }
  .orb {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,0.08);
    animation: float 7s ease-in-out infinite;
  }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }

  .corner-btn {
    position: absolute; top: 16px; right: 16px; z-index: 10;
    width: 40px; height: 40px; border-radius: 14px; border: none;
    background: rgba(255,255,255,0.18); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .18s;
  }
  .corner-btn:hover { background: rgba(255,255,255,0.28); }

  /* Avatar */
  .avatar-ring {
    position: relative; z-index: 10;
    width: 108px; height: 108px;
    margin-top: -54px; border-radius: 50%; padding: 3px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    box-shadow: 0 10px 36px rgba(74,156,110,0.35); flex-shrink: 0;
  }
  .avatar-inner {
    width: 100%; height: 100%; border-radius: 50%;
    border: 3px solid var(--bg); overflow: hidden; background: #e8f5e9;
  }

  /* Buttons */
  .btn-follow-on {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 26px; border-radius: 50px; border: none;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all .22s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 6px 24px rgba(74,156,110,0.35);
  }
  .btn-follow-on:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(74,156,110,0.45); }
  .btn-follow-on:active { transform: scale(.95); }
  .btn-follow-on:disabled { opacity:.6; pointer-events:none; }

  .btn-follow-off {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 24px; border-radius: 50px;
    border: 1.5px solid var(--border); background: var(--surface);
    color: var(--text); font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all .2s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .btn-follow-off:hover { border-color: var(--accent); color: var(--accent); background: #e8f5e9; }
  .btn-follow-off:disabled { opacity:.6; pointer-events:none; }

  .btn-message {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 20px; border-radius: 50px;
    border: 1.5px solid var(--border); background: var(--surface);
    color: var(--text); font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all .2s;
  }
  .btn-message:hover { border-color: var(--accent); color: var(--accent); background: #e8f5e9; }

  .btn-edit {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 50px;
    border: 1.5px solid var(--border); background: var(--surface);
    color: var(--text); font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all .2s;
  }
  .btn-edit:hover { border-color: var(--accent); color: var(--accent); }

  /* Typography */
  .serif-name { 
    font-family: 'Instrument Serif', serif; 
    font-size: 34px; color: var(--text); line-height: 1.1; 
    letter-spacing: -.3px; font-weight: 600; 
  }
  .bio { font-size: 14.5px; color: #5c6b66; line-height: 1.75; margin-top: 14px; font-weight: 400; }
  .section-title { 
    font-family: 'Instrument Serif', serif; 
    font-size: 23px; color: var(--text); margin-bottom: 20px; font-weight: 600; 
  }

  /* Mood chip */
  .mood-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 700; color: var(--accent);
    padding: 4px 12px; border-radius: 100px;
    background: #e8f5e9; border: 1px solid rgba(74,156,110,0.15);
  }

  /* Interest tag */
  .tag {
    padding: 6px 16px; border-radius: 100px;
    background: #e8f5e9; color: var(--accent);
    border: 1px solid rgba(74,156,110,0.14);
    font-size: 12px; font-weight: 600; cursor: default;
    transition: all .18s;
  }
  .tag:hover { background: var(--accent); color: white; }

  /* Stats */
  .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 26px; }
  .stat-card {
    display: flex; flex-direction: column; align-items: center;
    padding: 18px 12px; border-radius: 22px;
    background: var(--surface); border: 1px solid var(--border);
    cursor: pointer; transition: all .22s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 2px 14px rgba(0,0,0,0.04);
  }
  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(74,156,110,0.12); border-color: var(--accent2); }
  .stat-card:active { transform: scale(.96); }
  .stat-num { font-size: 28px; font-weight: 800; color: var(--text); line-height: 1; font-family: 'Instrument Serif', serif; }
  .stat-label { font-size: 11px; font-weight: 600; color: var(--muted); margin-top: 5px; letter-spacing: .04em; text-transform: uppercase; }

  /* Empty state */
  .empty-card { 
    background: var(--surface); border-radius: 24px; 
    border: 1px solid var(--border); padding: 56px 24px; text-align: center; 
  }
  .empty-icon { 
    width: 72px; height: 72px; border-radius: 22px; 
    background: #e8f5e9; margin: 0 auto 16px; 
    display: flex; align-items: center; justify-content: center; font-size: 32px; 
  }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(31,42,68,.65); backdrop-filter: blur(18px);
    display: flex; align-items: flex-end;
    animation: mFadeIn .2s ease;
  }
  @media (min-width: 640px) { .modal-overlay { align-items: center; padding: 24px; } }
  @keyframes mFadeIn { from{opacity:0} to{opacity:1} }

  .modal-box {
    background: var(--surface); border-radius: 32px 32px 0 0;
    width: 100%; max-width: 480px; max-height: 80vh;
    overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 -20px 60px rgba(0,0,0,0.18);
    animation: mSlide .32s cubic-bezier(.34,1.56,.64,1);
  }
  @media (min-width: 640px) {
    .modal-box { border-radius: 28px; margin: auto; box-shadow: 0 40px 80px rgba(0,0,0,0.18); animation: mZoom .25s ease; }
  }
  @keyframes mSlide { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes mZoom  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }

  .modal-handle { width: 40px; height: 4px; border-radius: 2px; background: var(--border); margin: 14px auto 0; }

  .modal-close {
    width: 36px; height: 36px; border-radius: 12px; border: 1.5px solid var(--border);
    background: #e8f5e9; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .18s;
  }
  .modal-close:hover { background: var(--accent); border-color: var(--accent); }
  .modal-close:hover svg { color: white !important; }

  .person-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 20px; cursor: pointer; border-radius: 16px; margin: 2px 10px;
    transition: background .15s;
  }
  .person-row:hover { background: #e8f5e9; }

  /* Animations */
  .fade-in { animation: fadeUp .4s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }

  .spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid currentColor; border-top-color: transparent;
    animation: spin .7s linear infinite; display: inline-block;
  }
  @keyframes spin { to{transform:rotate(360deg)} }
`;