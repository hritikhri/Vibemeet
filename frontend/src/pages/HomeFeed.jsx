// frontend/src/pages/HomeFeed.jsx
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFeedStore } from "../store/useFeedStore";
import BottomNav from "../components/layout/BottomNav";
import Avatar from "../components/common/Avatar";
import CreateActivityModal from "../components/activity/CreateActivityModal";
import FeedCard from "../components/feed/FeedCard";
import { Plus, Bell, Compass } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { useNavigate } from "react-router-dom";
import SuggestedUserCard from "../components/feed/SuggestedUserCard";
import api from "../lib/api";

export default function HomeFeed() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activities, loading, loadFeed, suggestedUsers } = useFeedStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);
  // console.log(activities)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

        :root {
          --bg: #f8f7f4;
          --surface: #ffffff;
          --surface2: #f0ede8;
          --primary: #1f2a44;
          --accent: #4a9c6e;
          --accent2: #6ab8a0;
          --muted: #8a8580;
          --border: #e4e0da;
          --text: #1f2a44;
          --text2: #5c5750;
        }

        * { font-family: 'Sora', sans-serif; }
        .serif { font-family: 'Instrument Serif', serif; }

        .feed-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(248, 247, 244, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid transparent;
          transition: border-color 0.3s;
        }
        .feed-header.scrolled { border-color: var(--border); }

        .mood-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 100px;
          background: var(--surface2); border: 1px solid var(--border);
          font-size: 12px; font-weight: 500; color: var(--text2);
          transition: all 0.2s; cursor: pointer;
        }
        .mood-pill:hover { background: var(--accent); color: white; border-color: var(--accent); }

        .create-btn {
          position: fixed; bottom: 90px; right: 20px;
          width: 58px; height: 58px; border-radius: 18px;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          color: white; border: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(74, 156, 110, 0.4);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 50;
        }
        .create-btn:hover { transform: scale(1.08) rotate(3deg); box-shadow: 0 12px 40px rgba(74, 156, 110, 0.5); }
        .create-btn:active { transform: scale(0.95); }

        .skeleton {
          background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 20px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          padding: 80px 24px; text-align: center;
        }
        .empty-icon {
          width: 96px; height: 96px; border-radius: 28px;
          background: linear-gradient(135deg, #f0f7f4, #e6f4ed);
          border: 2px solid #d1ede0;
          display: flex; align-items: center; justify-content: center;
          font-size: 40px; margin-bottom: 24px;
        }

        .feed-item { animation: fadeUp 0.4s ease both; }
        .feed-item:nth-child(1) { animation-delay: 0.05s; }
        .feed-item:nth-child(2) { animation-delay: 0.10s; }
        .feed-item:nth-child(3) { animation-delay: 0.15s; }
        .feed-item:nth-child(4) { animation-delay: 0.20s; }
        .feed-item:nth-child(5) { animation-delay: 0.25s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .avatar-ring {
          border-radius: 50%; padding: 2px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          cursor: pointer; transition: transform 0.2s;
        }
        .avatar-ring:hover { transform: scale(1.05); }
        .avatar-ring-inner { background: var(--bg); border-radius: 50%; padding: 2px; }

        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted);
          margin-bottom: 16px;
        }

        /* ── Suggested panel row item (Instagram style) ── */
        .sug-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 7px 0;
        }
        .sug-row + .sug-row {
          border-top: 1px solid var(--border);
        }
        .sug-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .sug-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          flex-shrink: 0; object-fit: cover;
          background: var(--surface2);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: var(--accent);
          border: 1.5px solid var(--border);
        }
        .sug-name {
          font-size: 12px; font-weight: 600; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sug-dist {
          font-size: 11px; color: var(--muted); margin-top: 1px;
        }
        .sug-connect-btn {
          flex-shrink: 0;
          padding: 5px 12px; border-radius: 8px;
          background: transparent;
          border: 1.5px solid var(--accent);
          color: var(--accent);
          font-size: 11px; font-weight: 600;
          cursor: pointer; transition: all 0.18s;
        }
        .sug-connect-btn:hover {
          background: var(--accent); color: white;
        }

        /* hide scrollbar utility */
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Sticky Header ── */}
      {/* <header className={`feed-header${scrolled ? " scrolled" : ""}`}>
        <div
          style={{ maxWidth: 1060, margin: "0 auto", padding: "14px 24px" }}
          className="flex items-center justify-between"
        >
          <div>
            <span
              className="serif"
              style={{
                fontSize: 26,
                color: "var(--text)",
                letterSpacing: "-0.5px",
              }}
            >
              Bond<span style={{ color: "var(--accent)" }}>Circle</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate("/explore")}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text2)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--surface2)")
              }
            >
              <Compass size={17} />
            </button>

            <button
              onClick={() => navigate("/notifications")}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text2)",
                transition: "all 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--surface2)")
              }
            >
              <Bell size={17} />
            </button>

            <span className="mood-pill" onClick={() => navigate("/setting")}>
              <span>✦</span>
              {user?.mood || "Set vibe"}
            </span>

            <div
              className="avatar-ring"
              onClick={() => navigate(`/profile/${user?._id}`)}
            >
              <div className="avatar-ring-inner">
                <Avatar src={user?.avatar} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </header> */}

      {/* ── Two-column body ── */}
      <div
        style={{
          maxWidth: 1060,
          margin: "0 auto",
          padding: "24px 24px 0",
          display: "flex",
          gap: 40,
          alignItems: "flex-start",
        }}
      >
        {/* ── LEFT: Feed ── */}
<main style={{ flex: 1, minWidth: 0, maxWidth: 680, overflowY: "auto", height: "calc(100vh - 80px)", scrollbarWidth: "none", msOverflowStyle: "none" }} className="hide-scrollbar">          <div style={{ marginBottom: 28 }}>
            {/* <p
              className="serif"
              style={{ fontSize: 22, color: "var(--text)", lineHeight: 1.3 }}
            >
              Good {getGreeting()},{" "}
              <span style={{ color: "var(--accent)" }}>
                {user?.name?.split(" ")[0]}
              </span>{" "}
              ✦
            </p> */}
            {/* <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Here's what's happening with your friends nearby
            </p> */}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 240 + i * 20 }}
                />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 8,
                }}
              >
                No activities yet
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  maxWidth: 260,
                  lineHeight: 1.6,
                }}
              >
                Create your first hangout and invite your friends to join
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  marginTop: 24,
                  padding: "12px 28px",
                  borderRadius: 14,
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(74,156,110,0.3)",
                }}
              >
                Create hangout
              </button>
            </div>
          ) : (
            <>
              {/* <p className="section-label">Your friend feed</p> */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                {activities.map((activity) => (
                  <div key={activity._id} className="feed-item">
                    <FeedCard
                      activity={activity}
                      onJoin={() => navigate(`/activity/${activity._id}`)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        {/* ── RIGHT: Suggested users — Instagram-style sticky panel ── */}
<div className="hidden sm:flex" style={{  position: "sticky", top: 60 }}>          {suggestedUsers?.length > 0 && (
            <aside
              style={{
                width: 300,
                flexShrink: 0,
                position: "sticky",
                top: 80, // clears the sticky header
                alignSelf: "flex-start",
              }}
            >
              {/* Current user mini-profile strip */}
              <div
                onClick={() => navigate(`/profile/${user?._id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                  cursor: "pointer",
                }}
              >
                <div className="">
                  <div className="avatar-ring-inner">
                    <Avatar src={user?.avatar} size="md" />
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {user?.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>
                    {user?.mood || "No vibe set"}
                  </p>
                </div>
              </div>

              {/* Suggested header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span className="section-label" style={{ marginBottom: 0 }}>
                  Suggested for you
                </span>
                <button
                  onClick={() => navigate("/explore")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text)",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  See all
                </button>
              </div>

              {/* Suggested user rows */}
              <div>
                {suggestedUsers.slice(0, 6).map((suggestedUser) => (
                  <div
                    key={suggestedUser._id}
                    onClick={() => navigate(`/profile/${suggestedUser._id}`)}
                    className="sug-row"
                  >
                    <div
                      className="sug-info"
                      style={{ cursor: "pointer" }}
                      // onClick={() => navigate(`/profile/${suggestedUser._id}`)}
                    >
                      {/* Avatar */}
                      <div className="sug-avatar">
                        {suggestedUser.avatar ? (
                          <img
                            src={suggestedUser.avatar}
                            alt={suggestedUser.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          suggestedUser.name?.[0]?.toUpperCase()
                        )}
                      </div>

                      {/* Name + distance */}
                      <div style={{ minWidth: 0 }}>
                        <p className="sug-name">{suggestedUser.name}</p>
                        <p className="sug-dist">
                          {suggestedUser.distance?.toFixed(1)} km away
                        </p>
                      </div>
                    </div>

                    {/* Connect button */}
                    <button className="sug-connect-btn">Connect</button>
                  </div>
                ))}
              </div>

              {/* Footer links */}
              <p
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  marginTop: 24,
                  lineHeight: 1.8,
                  letterSpacing: "0.02em",
                }}
              >
                About · Help · Privacy · Terms
              </p>
            </aside>
          )}
        </div>
      </div>

      {/* Create FAB */}
      <button className="create-btn" onClick={() => setShowCreateModal(true)}>
        <Plus size={24} />
      </button>

      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onActivityCreated={() => loadFeed()}
      />

      <BottomNav />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
