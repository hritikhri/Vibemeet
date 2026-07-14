// frontend/src/pages/Profile.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import BottomNav from '../components/layout/BottomNav';
import FeedCard from '../components/feed/FeedCard';
import api from '../lib/api';
import {
  MessageCircle, Edit3, Settings,
  Sparkles, X, ChevronRight, UserCheck, Star, Heart, Users
} from 'lucide-react';

/* ── particle burst ──────────────────────────────────────────────────────── */
function spawnParticles(x, y) {
  const EMOJIS = ['✨','💫','⭐','🌟','💝','🫧','🌸','💖'];
  const COLORS = ['#4a9c6e','#6ab8a0','#f59e0b','#f472b6','#a78bfa','#34d399'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:9999;
      font-size:${14+Math.random()*18}px;user-select:none;transform:translate(-50%,-50%);`;
    el.textContent = Math.random() > 0.5 ? EMOJIS[Math.floor(Math.random()*EMOJIS.length)] : '●';
    if (el.textContent === '●') { el.style.color = COLORS[Math.floor(Math.random()*COLORS.length)]; el.style.fontSize = `${6+Math.random()*10}px`; }
    document.body.appendChild(el);
    const angle = (Math.PI*2*i)/18+(Math.random()-0.5)*0.5;
    const speed = 60+Math.random()*120;
    el.animate([
      { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
      { transform:`translate(calc(-50% + ${Math.cos(angle)*speed}px), calc(-50% + ${Math.sin(angle)*speed}px)) scale(0)`, opacity:0 },
    ],{ duration:600+Math.random()*500, delay:Math.random()*80, easing:'cubic-bezier(.2,.8,.6,1)', fill:'forwards' }).onfinish = () => el.remove();
  }
}

function spawnSticker(x, y) {
  const el = document.createElement('div');
  el.textContent = '⭐ Interested!';
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:9999;pointer-events:none;
    background:linear-gradient(135deg,#4a9c6e,#6ab8a0);color:white;font-family:'Sora',sans-serif;
    font-size:15px;font-weight:700;padding:10px 20px;border-radius:50px;white-space:nowrap;
    box-shadow:0 8px 32px rgba(74,156,110,0.45);transform:translate(-50%,-50%);`;
  document.body.appendChild(el);
  el.animate([
    { opacity:0, transform:'translate(-50%,-50%) scale(0.6)' },
    { opacity:1, transform:'translate(-50%,-60%) scale(1)', offset:0.25 },
    { opacity:1, transform:'translate(-50%,-80%) scale(1)', offset:0.75 },
    { opacity:0, transform:'translate(-50%,-110%) scale(0.8)' },
  ],{ duration:1800, easing:'cubic-bezier(.34,1.56,.64,1)', fill:'forwards' }).onfinish = () => el.remove();
}

function flashRipple(x, y) {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:9998;
    width:0;height:0;border-radius:50%;
    background:radial-gradient(circle,rgba(74,156,110,0.22) 0%,transparent 70%);transform:translate(-50%,-50%);`;
  document.body.appendChild(el);
  el.animate([
    { width:'0px', height:'0px', opacity:1 },
    { width:'600px', height:'600px', opacity:0 },
  ],{ duration:700, easing:'ease-out', fill:'forwards' }).onfinish = () => el.remove();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { id }                = useParams();
  const { user: currentUser } = useAuthStore();
  const navigate              = useNavigate();

  const activitiesRef   = useRef(null);
  const modalRef        = useRef(null);
  const confirmModalRef = useRef(null);
  const lastTapRef      = useRef(0);
  const dblClickLockRef = useRef(false);

  const [profileUser,     setProfileUser]    = useState(null);
  const [activities,      setActivities]     = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [isFollowing,     setIsFollowing]    = useState(false);
  const [followLoading,   setFollowLoading]  = useState(false);
  const [isInterested,    setIsInterested]   = useState(false);
  const [interestLoading, setInterestLoading]= useState(false);
  const [showConfirm,     setShowConfirm]    = useState(false);
  // 'myInterests' | 'interestedInMe' | 'followers' | 'following' | null
  const [activeModal,     setActiveModal]    = useState(null);
  // lists fetched lazily for own-profile modals
  const [myInterestsList,    setMyInterestsList]    = useState(null); // profiles I'm interested in
  const [interestedInMeList, setInterestedInMeList] = useState(null); // profiles interested in me
  const [interestedInCount, setinterestedInCount] = useState(null); // profiles interested in me
  const [listsLoading,       setListsLoading]       = useState(false);

  const isOwnProfile = !id || id === currentUser?._id;
  const targetId     = id || currentUser?._id;

  /* ── counts derived from profileUser ────────────────────────────────────── */
  const followerCount       = profileUser?.interestedUsers?.length       ?? 0;
  const followingCount      = profileUser?.myInterests?.length       ?? 0;
  const interestedInMeCount = profileUser?.interestedUsers?.length ?? 0;
  const interestedUsers = profileUser?.myInterests?.length ?? 0;
  console.log(profileUser)

  // myInterests count lives on currentUser's own doc → fetch separately only when needed

  /* ── close modals on outside click ─────────────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (modalRef.current        && !modalRef.current.contains(e.target))        setActiveModal(null);
      if (confirmModalRef.current && !confirmModalRef.current.contains(e.target)) setShowConfirm(false);
    };
    if (activeModal || showConfirm) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [activeModal, showConfirm]);

  /* ── fetch profile + activities ─────────────────────────────────────────── */
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    Promise.all([
      api.get(`/users/${targetId}`),
      api.get(`/users/${targetId}/activities`),
    ])
      .then(([{ data: u }, { data: acts }]) => {
        setProfileUser(u);
        setActivities(acts || []);
        if (!isOwnProfile) {
          const cid = currentUser?._id?.toString();
          setIsFollowing(u.followers?.some(f => (f._id||f)?.toString() === cid) ?? false);
          setIsInterested(u.interestedUsers?.some(uid => (uid._id||uid)?.toString() === cid) ?? false);
        }
      })
      .catch(e => console.error('Profile fetch error:', e))
      .finally(() => setLoading(false));
  }, [id, currentUser]);

  /* ── lazy-fetch interest lists for own profile modals ───────────────────── */
  const openOwnModal = async (type) => {
    setActiveModal(type);
    if (type === 'interestedInMe' && interestedInMeList === null) {
      setListsLoading(true);
      try {
        const { data } = await api.get(`/users/${targetId}/interested`);
        setInterestedInMeList(data.users || []);
      } catch { setInterestedInMeList([]); }
      finally  { setListsLoading(false); }
    }
    if (type === 'myInterests' && myInterestsList === null) {
      setListsLoading(true);
      try {
        const { data } = await api.get(`/users/${targetId}/my-interests`);
        setMyInterestsList(data.users || []);
      } catch { setMyInterestsList([]); }
      finally  { setListsLoading(false); }
    }
  };

  /* ── double-click / double-tap → add interest ────────────────────────────── */
  const handleDoubleInteract = useCallback(async (clientX, clientY) => {
    if (isOwnProfile || isInterested || dblClickLockRef.current || interestLoading) return;
    dblClickLockRef.current = true;
    setInterestLoading(true);
    flashRipple(clientX, clientY);
    spawnParticles(clientX, clientY);
    spawnSticker(clientX, clientY);
    setIsInterested(true);
    try {
      await api.post(`/users/${id}/interest`);
    } catch (err) {
      console.error('[interest] add failed', err);
      setIsInterested(false);
    } finally {
      setInterestLoading(false);
      dblClickLockRef.current = false;
    }
  }, [isOwnProfile, isInterested, interestLoading, id]);

  const handleNativeDblClick = useCallback((e) => {
    if (e.target.closest('button,a,input,select,textarea')) return;
    handleDoubleInteract(e.clientX, e.clientY);
  }, [handleDoubleInteract]);

  const handleTouchEnd = useCallback((e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      const t = e.changedTouches[0];
      handleDoubleInteract(t.clientX, t.clientY);
    }
    lastTapRef.current = now;
  }, [handleDoubleInteract]);

  /* ── remove interest ────────────────────────────────────────────────────── */
  const handleRemoveInterest = async () => {
    setShowConfirm(false);
    setInterestLoading(true);
    setIsInterested(false);
    try {
      await api.delete(`/users/${id}/interest`);
    } catch {
      setIsInterested(true);
    } finally {
      setInterestLoading(false);
    }
  };

  /* ── follow toggle ──────────────────────────────────────────────────────── */
  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const was = isFollowing;
    setIsFollowing(!was);
    setProfileUser(prev => ({
      ...prev,
      followers: was
        ? (prev.followers||[]).filter(f => (f._id||f) !== currentUser._id)
        : [...(prev.followers||[]), { _id: currentUser._id }],
    }));
    try { await api.post(`/users/${id}/follow`); }
    catch {
      setIsFollowing(was);
      setProfileUser(prev => ({
        ...prev,
        followers: was
          ? [...(prev.followers||[]), { _id: currentUser._id }]
          : (prev.followers||[]).filter(f => (f._id||f) !== currentUser._id),
      }));
    } finally { setFollowLoading(false); }
  };

  /* ── modal data resolver ────────────────────────────────────────────────── */
  const getModalData = () => {
    switch (activeModal) {
      case 'interestedInMe': return {
        title: 'Interested in me',
        sub: `${interestedInMeCount} people are interested in you`,
        list: interestedInMeList || [],
        emoji: '⭐',
        emptyLabel: 'No one yet — keep being awesome!',
      };
      case 'myInterests': return {
        title: 'My interests',
        sub: 'Profiles you double-tapped',
        list: myInterestsList || [],
        emoji: '💫',
        emptyLabel: "You haven't shown interest in anyone yet",
      };
      case 'followers': return {
        title: 'Followers',
        sub: `${followerCount} followers`,
        list: profileUser?.followers || [],
        emoji: '👥',
        emptyLabel: 'No followers yet',
      };
      case 'following': return {
        title: 'Following',
        sub: `Following ${followingCount}`,
        list: profileUser?.following || [],
        emoji: '🌿',
        emptyLabel: 'Not following anyone yet',
      };
      default: return { title:'', sub:'', list:[], emoji:'👥', emptyLabel:'' };
    }
  };

  /* ── loading screen ─────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:56,height:56,borderRadius:20,margin:'0 auto 16px',
          background:'linear-gradient(135deg,#4a9c6e,#6ab8a0)',
          display:'flex',alignItems:'center',justifyContent:'center',animation:'pulse 1.8s ease-in-out infinite' }}>
          <UserCheck size={26} color="white"/>
        </div>
        <p style={{ fontFamily:'Sora',color:'var(--muted)',fontSize:14 }}>Loading profile…</p>
      </div>
    </div>
  );

  const modalData = getModalData();

  return (
    <div
      style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'Sora', paddingBottom:96 }}
      onDoubleClick={handleNativeDblClick}
      onTouchEnd={handleTouchEnd}
    >
      <style>{GLOBAL_STYLES}</style>

      {/* hint bar */}
      {!isOwnProfile && !isInterested && (
        <div className="dbl-hint fade-in">double tap anywhere to show interest ✨</div>
      )}

      {/* Cover */}
      <div className="cover">
        <div className="orb" style={{ width:200,height:200,top:-50,right:-50 }}/>
        <div className="orb" style={{ width:110,height:110,bottom:20,left:80,animationDelay:'2s' }}/>
        <div className="orb" style={{ width:70,height:70,top:50,left:'42%',animationDelay:'3.5s' }}/>
        {isOwnProfile ? (
          <button className="corner-btn" onClick={() => navigate('/setting')}><Settings size={17} color="white"/></button>
        ) : (
          <button className="corner-btn" onClick={() => navigate(-1)}>
            <ChevronRight size={17} color="white" style={{ transform:'rotate(180deg)' }}/>
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ maxWidth:680, margin:'0 auto', padding:'0 16px' }}>

        {/* Avatar + action buttons */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div className={`avatar-ring ${isInterested ? 'avatar-ring--interested' : ''}`}>
            <div className="avatar-inner">
              {profileUser?.avatar
                ? <img src={profileUser.avatar} alt={profileUser.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                    background:'linear-gradient(135deg,#e8f5e9,#c1e6d4)',fontSize:38,fontWeight:800,color:'var(--accent)' }}>
                    {profileUser?.name?.[0]||'?'}
                  </div>
              }
            </div>
          </div>

          <div style={{ display:'flex',gap:8,alignItems:'center',paddingBottom:10,flexWrap:'wrap' }} className="fade-in">
            {!isOwnProfile ? (
              <>
                {/* <button className={isFollowing ? 'btn-follow-off' : 'btn-follow-on'} onClick={handleToggleFollow} disabled={followLoading}>
                  {followLoading ? <span className="spinner"/> : isFollowing ? <><UserCheck size={15}/> Friends</> : <><UserCheck size={14}/> Add Friend</>}
                </button> */}
                <button className="btn-message" onClick={() => navigate(`/chat/private/${id}`)}>
                  <MessageCircle size={15}/> Message
                </button>
              </>
            ) : (
              <button className="btn-edit" onClick={() => navigate('/setting')}><Edit3 size={14}/> Edit Profile</button>
            )}
          </div>
        </div>

        {/* Name + interest badge */}
        <div style={{ marginTop:16, animationDelay:'.08s' }} className="fade-in">
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <h1 className="serif-name">{profileUser?.name}</h1>
            {isInterested && !isOwnProfile && (
              <button className="interest-badge" onClick={() => setShowConfirm(true)} disabled={interestLoading} title="Click to remove interest">
                {interestLoading ? <span className="spinner" style={{ width:12,height:12 }}/> : <><Star size={13} style={{ fill:'currentColor' }}/> Interested</>}
              </button>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:14,color:'var(--muted)',fontWeight:500 }}>@{profileUser?.username}</span>
            {profileUser?.mood && <span className="mood-chip"><Sparkles size={11}/> {profileUser.mood}</span>}
          </div>
        </div>

        {profileUser?.bio && <p className="bio fade-in" style={{ animationDelay:'.14s' }}>{profileUser.bio}</p>}

        {profileUser?.interests?.length > 0 && (
          <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginTop:16,animationDelay:'.18s' }} className="fade-in">
            {profileUser.interests.map((t,i) => <span key={i} className="tag">{t}</span>)}
          </div>
        )}

        {/* ── Stats grid ────────────────────────────────────────────────── */}
        <div className="stats-grid fade-in" style={{ animationDelay:'.22s' }}>
          {/* Hangouts — everyone sees this */}
          <div className="stat-card" onClick={() => activitiesRef.current?.scrollIntoView({ behavior:'smooth' })}>
            <span className="stat-num">{activities.length}</span>
            <span className="stat-label">Hangouts</span>
          </div>

          {isOwnProfile ? (
            <>
              {/* Interested in me */}
              <div className="stat-card stat-card--star" onClick={() => openOwnModal('interestedInMe')}>
                <span className="stat-num" style={{ color:'#f59e0b' }}>{interestedInMeCount}</span>
                <span className="stat-label">Interested in me</span>
              </div>
              {/* My interests */}
              <div className="stat-card stat-card--heart" onClick={() => openOwnModal('myInterests')}>
                <span className="stat-num" style={{ color:'#f472b6' }}>{interestedUsers}</span>
                <span className="stat-label">My interests</span>
              </div>
            </>
          ) : (
            <>
              {/* Followers + Following for other profiles */}
              <div className="stat-card" onClick={() => setActiveModal('followers')}>
                <span className="stat-num">{followerCount}</span>
                <span className="stat-label">Friends</span>
              </div>
              <div className="stat-card" onClick={() => setActiveModal('following')}>
                <span className="stat-num">{followingCount}</span>
                <span className="stat-label">Following</span>
              </div>
            </>
          )}
        </div>

        <div style={{ height:1, background:'var(--border)', margin:'32px 0' }}/>

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
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              {activities.map(act => <FeedCard key={act._id} activity={act} onJoin={() => navigate(`/activity/${act._id}`)}/>)}
            </div>
          )}
        </div>
      </div>

      <BottomNav/>

      {/* ── Universal people modal ────────────────────────────────────────── */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-box" ref={modalRef} onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'16px 20px 14px',borderBottom:'1px solid var(--border)' }}>
              <div>
                <p className="serif" style={{ fontSize:20,color:'var(--text)' }}>{modalData.title}</p>
                <p style={{ fontSize:12,color:'var(--muted)',marginTop:2,fontWeight:500 }}>{modalData.sub}</p>
              </div>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={15} color="var(--accent)"/></button>
            </div>

            <div style={{ overflowY:'auto',padding:'8px 0 20px',flex:1 }}>
              {listsLoading ? (
                <div style={{ textAlign:'center',padding:'48px 24px' }}>
                  <span className="spinner" style={{ width:28,height:28,borderWidth:3,margin:'0 auto',display:'block' }}/>
                  <p style={{ color:'var(--muted)',marginTop:16,fontSize:13 }}>Loading…</p>
                </div>
              ) : modalData.list.length === 0 ? (
                <div style={{ textAlign:'center',padding:'48px 24px',color:'var(--muted)' }}>
                  <div style={{ fontSize:40,marginBottom:12 }}>{modalData.emoji}</div>
                  <p style={{ fontWeight:600,fontSize:14 }}>{modalData.emptyLabel}</p>
                </div>
              ) : (
                modalData.list.map((p, i) => (
                  <div key={p._id||i} className="person-row"
                    onClick={() => { setActiveModal(null); navigate(`/profile/${p._id}`); }}>
                    <div style={{ width:48,height:48,borderRadius:'50%',overflow:'hidden',
                      background:'var(--surface2)',flexShrink:0,border:'2px solid var(--border)' }}>
                      {p.avatar
                        ? <img src={p.avatar} alt={p.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                        : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',
                            justifyContent:'center',fontSize:20,fontWeight:800,color:'var(--accent)' }}>{p.name?.[0]}</div>
                      }
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontWeight:700,fontSize:14,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name}</p>
                      {p.username && <p style={{ fontSize:12,color:'var(--muted)',marginTop:1 }}>@{p.username}</p>}
                    </div>
                    <ChevronRight size={15} color="var(--border)"/>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Remove interest confirm ──────────────────────────────────────── */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-box" ref={confirmModalRef} onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <div style={{ padding:'28px 24px 24px',textAlign:'center' }}>
              <div style={{ width:64,height:64,borderRadius:20,background:'#fef3c7',
                display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:30 }}>⭐</div>
              <p className="serif" style={{ fontSize:22,color:'var(--text)',marginBottom:8 }}>Remove Interest?</p>
              <p style={{ fontSize:14,color:'var(--muted)',lineHeight:1.7,marginBottom:24 }}>
                You'll be removed from <strong>{profileUser?.name?.split(' ')[0]}'s</strong> interested list.
                You can always double-tap again to re-add yourself.
              </p>
              <div style={{ display:'flex',gap:12 }}>
                <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Keep it</button>
                <button className="confirm-remove" onClick={handleRemoveInterest}>Yes, remove</button>
              </div>
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
    --bg:#f8f7f4; --surface:#ffffff; --surface2:#f0ede8;
    --accent:#4a9c6e; --accent2:#6ab8a0; --muted:#8a8580; --border:#e4e0da; --text:#1f2a44;
  }
  * { box-sizing:border-box; font-family:'Sora',sans-serif; }
  .serif { font-family:'Instrument Serif',serif; }

  .dbl-hint {
    position:fixed; bottom:110px; left:50%; transform:translateX(-50%);
    z-index:50; font-size:12px; font-weight:600; color:var(--muted);
    background:rgba(255,255,255,0.92); backdrop-filter:blur(10px);
    padding:8px 20px; border-radius:100px; border:1px solid var(--border);
    box-shadow:0 4px 20px rgba(0,0,0,0.06); pointer-events:none; white-space:nowrap;
    animation:fadeUp .5s ease both, hintFade 3s ease 4s both;
  }
  @keyframes hintFade { to { opacity:0; } }

  .cover {
    position:relative; height:150px; overflow:hidden;
    background:linear-gradient(155deg,#1a2a2f 0%,#2e4a44 35%,#3a6b5c 70%,#4a9c6e 100%);
  }
  .cover::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:100px;
    background:linear-gradient(to bottom,transparent,var(--bg));
  }
  .orb { position:absolute; border-radius:50%; background:rgba(255,255,255,0.08); animation:float 7s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }

  .corner-btn {
    position:absolute; top:16px; right:16px; z-index:10;
    width:40px; height:40px; border-radius:14px; border:none;
    background:rgba(255,255,255,0.18); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,0.25);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:background .18s;
  }
  .corner-btn:hover { background:rgba(255,255,255,0.28); }

  .avatar-ring {
    position:relative; z-index:10; width:108px; height:108px;
    margin-top:-54px; border-radius:50%; padding:3px;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    box-shadow:0 10px 36px rgba(74,156,110,0.35); flex-shrink:0;
    transition:all .4s cubic-bezier(.34,1.56,.64,1);
  }
  .avatar-ring--interested {
    background:linear-gradient(135deg,#f59e0b,#fbbf24,#4a9c6e);
    box-shadow:0 0 0 4px rgba(245,158,11,0.25),0 10px 36px rgba(245,158,11,0.35);
    animation:interestGlow 2.5s ease-in-out infinite;
  }
  @keyframes interestGlow {
    0%,100%{box-shadow:0 0 0 4px rgba(245,158,11,0.2),0 10px 36px rgba(245,158,11,0.3)}
    50%{box-shadow:0 0 0 8px rgba(245,158,11,0.35),0 14px 48px rgba(245,158,11,0.45)}
  }
  .avatar-inner {
    width:100%; height:100%; border-radius:50%;
    border:3px solid var(--bg); overflow:hidden; background:#e8f5e9;
  }

  .interest-badge {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 14px; border-radius:100px;
    background:linear-gradient(135deg,#fef3c7,#fde68a);
    border:1.5px solid #f59e0b; color:#92400e;
    font-family:'Sora',sans-serif; font-size:12px; font-weight:700;
    cursor:pointer; transition:all .2s; box-shadow:0 2px 8px rgba(245,158,11,0.2);
    animation:badgePop .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes badgePop { from{opacity:0;transform:scale(0.5) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .interest-badge:hover { background:linear-gradient(135deg,#fde68a,#fbbf24); transform:scale(1.05); }
  .interest-badge:disabled { opacity:.6; pointer-events:none; }

  .btn-follow-on {
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 26px; border-radius:50px; border:none;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    color:white; font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
    cursor:pointer; transition:all .22s cubic-bezier(.34,1.56,.64,1);
    box-shadow:0 6px 24px rgba(74,156,110,0.35);
  }
  .btn-follow-on:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(74,156,110,0.45); }
  .btn-follow-on:active { transform:scale(.95); }
  .btn-follow-on:disabled { opacity:.6; pointer-events:none; }

  .btn-follow-off {
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 24px; border-radius:50px;
    border:1.5px solid var(--border); background:var(--surface);
    color:var(--text); font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
    cursor:pointer; transition:all .2s; box-shadow:0 2px 12px rgba(0,0,0,0.05);
  }
  .btn-follow-off:hover { border-color:var(--accent); color:var(--accent); background:#e8f5e9; }
  .btn-follow-off:disabled { opacity:.6; pointer-events:none; }

  .btn-message {
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 20px; border-radius:50px;
    border:1.5px solid var(--border); background:var(--surface);
    color:var(--text); font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
    cursor:pointer; transition:all .2s;
  }
  .btn-message:hover { border-color:var(--accent); color:var(--accent); background:#e8f5e9; }

  .btn-edit {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 20px; border-radius:50px;
    border:1.5px solid var(--border); background:var(--surface);
    color:var(--text); font-family:'Sora',sans-serif; font-size:13px; font-weight:700;
    cursor:pointer; transition:all .2s;
  }
  .btn-edit:hover { border-color:var(--accent); color:var(--accent); }

  .serif-name { font-family:'Instrument Serif',serif; font-size:34px; color:var(--text); line-height:1.1; letter-spacing:-.3px; font-weight:600; }
  .bio { font-size:14.5px; color:#5c6b66; line-height:1.75; margin-top:14px; font-weight:400; }
  .section-title { font-family:'Instrument Serif',serif; font-size:23px; color:var(--text); margin-bottom:20px; font-weight:600; }

  .mood-chip {
    display:inline-flex; align-items:center; gap:5px;
    font-size:12px; font-weight:700; color:var(--accent);
    padding:4px 12px; border-radius:100px;
    background:#e8f5e9; border:1px solid rgba(74,156,110,0.15);
  }
  .tag {
    padding:6px 16px; border-radius:100px;
    background:#e8f5e9; color:var(--accent); border:1px solid rgba(74,156,110,0.14);
    font-size:12px; font-weight:600; cursor:default; transition:all .18s;
  }
  .tag:hover { background:var(--accent); color:white; }

  .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:26px; }
  .stat-card {
    display:flex; flex-direction:column; align-items:center;
    padding:18px 12px; border-radius:22px;
    background:var(--surface); border:1px solid var(--border);
    cursor:pointer; transition:all .22s cubic-bezier(.34,1.56,.64,1);
    box-shadow:0 2px 14px rgba(0,0,0,0.04);
  }
  .stat-card:hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(74,156,110,0.12); border-color:var(--accent2); }
  .stat-card:active { transform:scale(.96); }
  .stat-card--star  { border-color:rgba(245,158,11,0.3); background:#fffbeb; }
  .stat-card--heart { border-color:rgba(244,114,182,0.3); background:#fdf2f8; }
  .stat-card--star:hover  { border-color:#f59e0b; box-shadow:0 10px 30px rgba(245,158,11,0.15); }
  .stat-card--heart:hover { border-color:#f472b6; box-shadow:0 10px 30px rgba(244,114,182,0.15); }
  .stat-num { font-size:28px; font-weight:800; color:var(--text); line-height:1; font-family:'Instrument Serif',serif; }
  .stat-label { font-size:11px; font-weight:600; color:var(--muted); margin-top:5px; letter-spacing:.04em; text-transform:uppercase; text-align:center; }

  .empty-card { background:var(--surface); border-radius:24px; border:1px solid var(--border); padding:56px 24px; text-align:center; }
  .empty-icon { width:72px; height:72px; border-radius:22px; background:#e8f5e9; margin:0 auto 16px; display:flex; align-items:center; justify-content:center; font-size:32px; }

  .modal-overlay {
    position:fixed; inset:0; z-index:100;
    background:rgba(31,42,68,.65); backdrop-filter:blur(18px);
    display:flex; align-items:flex-end; animation:mFadeIn .2s ease;
  }
  @media(min-width:640px){ .modal-overlay{ align-items:center; padding:24px; } }
  @keyframes mFadeIn { from{opacity:0} to{opacity:1} }

  .modal-box {
    background:var(--surface); border-radius:32px 32px 0 0;
    width:100%; max-width:480px; max-height:80vh;
    overflow:hidden; display:flex; flex-direction:column;
    box-shadow:0 -20px 60px rgba(0,0,0,0.18); animation:mSlide .32s cubic-bezier(.34,1.56,.64,1);
  }
  @media(min-width:640px){ .modal-box{ border-radius:28px; margin:auto; box-shadow:0 40px 80px rgba(0,0,0,0.18); animation:mZoom .25s ease; } }

  .confirm-box {
    background:var(--surface); border-radius:32px 32px 0 0;
    width:100%; max-width:400px; overflow:hidden;
    box-shadow:0 -20px 60px rgba(0,0,0,0.18); animation:mSlide .32s cubic-bezier(.34,1.56,.64,1);
  }
  @media(min-width:640px){ .confirm-box{ border-radius:28px; margin:auto; animation:mZoom .25s ease; } }

  .confirm-cancel {
    flex:1; padding:13px; border-radius:14px;
    border:1.5px solid var(--border); background:var(--surface);
    color:var(--text); font-family:'Sora',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s;
  }
  .confirm-cancel:hover { background:var(--surface2); }
  .confirm-remove {
    flex:1; padding:13px; border-radius:14px; border:none;
    background:linear-gradient(135deg,#ef4444,#dc2626);
    color:white; font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
    cursor:pointer; transition:all .22s cubic-bezier(.34,1.56,.64,1);
    box-shadow:0 4px 16px rgba(239,68,68,0.3);
  }
  .confirm-remove:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(239,68,68,0.4); }
  .confirm-remove:active { transform:scale(.96); }

  @keyframes mSlide { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes mZoom  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  .modal-handle { width:40px; height:4px; border-radius:2px; background:var(--border); margin:14px auto 0; }
  .modal-close {
    width:36px; height:36px; border-radius:12px; border:1.5px solid var(--border);
    background:#e8f5e9; display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all .18s;
  }
  .modal-close:hover { background:var(--accent); border-color:var(--accent); }
  .modal-close:hover svg { color:white !important; }

  .person-row {
    display:flex; align-items:center; gap:14px;
    padding:12px 20px; cursor:pointer; border-radius:16px; margin:2px 10px; transition:background .15s;
  }
  .person-row:hover { background:#e8f5e9; }

  .fade-in { animation:fadeUp .4s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
  .spinner {
    width:16px; height:16px; border-radius:50%;
    border:2px solid currentColor; border-top-color:transparent;
    animation:spin .7s linear infinite; display:inline-block;
  }
  @keyframes spin { to{transform:rotate(360deg)} }
`;