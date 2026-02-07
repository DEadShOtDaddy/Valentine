"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Lock, LogIn, LogOut, Settings, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserRole, logout } from "@/utils/authCheck";
import FloatingMusicPlayer from "@/components/FloatingMusicPlayer";

const TOGETHER_SINCE = new Date("2024-06-21T00:00:00");
const HOME_INTRO_MIN_MS = 3600;

function formatElapsed(now) {
  const totalSeconds = Math.max(
    0,
    Math.floor((now.getTime() - TOGETHER_SINCE.getTime()) / 1000)
  );
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function roleLabel(role) {
  if (role === "admin") return "Jello";
  if (role === "user") return "Kukku";
  return "Guest";
}

export default function HomePage() {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setRole(getUserRole());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [pagesResponse, settingsResponse] = await Promise.all([
          fetch("/api/valentine-pages"),
          fetch("/api/site-settings"),
        ]);
        if (!pagesResponse.ok) throw new Error("Failed to load pages");
        if (!settingsResponse.ok) throw new Error("Failed to load site settings");
        const pagesData = await pagesResponse.json();
        const settingsData = await settingsResponse.json();
        setPages(pagesData.pages ?? []);
        setSiteSettings(settingsData.settings ?? {});
      } catch (fetchError) {
        console.error("Error loading homepage data:", fetchError);
        setError("Could not load Valentine days. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroReady(true), HOME_INTRO_MIN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const counter = useMemo(() => formatElapsed(now), [now]);
  const canOpenLockedPage = role === "admin";
  const homeTitle = siteSettings?.home_title?.trim() || "We are here Together";

  const onOpenPage = (page) => {
    if (page.is_locked && !canOpenLockedPage) return;
    navigate(`/day/${page.day_number}`);
  };

  if (loading || !introReady) {
    return (
      <>
        <HomePageLoader />
        <FloatingMusicPlayer musicUrl={siteSettings?.home_music_url} autoStart />
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-rose-900">
      {siteSettings?.home_background_url ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${siteSettings.home_background_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/25" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-rose-100 via-rose-200 to-rose-300" />
      )}

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:px-8">
        <header className="rounded-2xl border border-rose-200/80 bg-white/70 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-rose-700">Valentine Week</p>
              <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-black md:text-4xl">
                <span>{homeTitle}</span>
                <Heart size={18} className="fill-rose-600 text-rose-700" />
              </h1>
              <p className="mt-2 text-sm font-medium text-rose-700">
                We have been together this long
              </p>
            </div>
            <div className="flex items-center gap-2">
              {role === "admin" ? (
                <button
                  onClick={() => navigate("/admin")}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Settings size={16} />
                  Admin Dashboard
                </button>
              ) : null}
              {role ? (
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => navigate("/account/signin")}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  <LogIn size={16} />
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <ProfileBadge label="Kukku" imageUrl={siteSettings?.kukku_profile_url} />
            <ProfileBadge label="Jello" imageUrl={siteSettings?.jello_profile_url} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CounterCard label="Days" value={counter.days} />
            <CounterCard label="Hours" value={counter.hours} />
            <CounterCard label="Minutes" value={counter.minutes} />
            <CounterCard label="Seconds" value={counter.seconds} />
          </div>

          <p className="mt-4 text-sm text-rose-700">
            Together since June 21, 2024. Active profile:{" "}
            <span className="font-semibold">{roleLabel(role)}</span>
          </p>
        </header>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-rose-800">Days of Valentine Week</h2>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!error ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => {
                const isLockedForCurrentRole = page.is_locked && !canOpenLockedPage;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => onOpenPage(page)}
                    disabled={isLockedForCurrentRole}
                    className={`group relative min-h-[220px] overflow-hidden rounded-2xl border border-white/20 text-left shadow-lg transition ${
                      isLockedForCurrentRole
                        ? "cursor-not-allowed opacity-70"
                        : "hover:-translate-y-1 hover:shadow-2xl"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: page.cover_photo_url
                          ? `url(${page.cover_photo_url})`
                          : "linear-gradient(135deg, #fb7185, #f97316)",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
                    <div className="relative flex h-full flex-col justify-between p-5">
                      <div className="inline-flex w-fit items-center rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white">
                        Day {page.day_number}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{page.title}</h3>
                        {page.subtitle ? (
                          <p className="mt-1 text-sm text-rose-50/90">{page.subtitle}</p>
                        ) : null}
                        <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-black/35 px-2 py-1 text-xs font-semibold text-white">
                          {page.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                          {page.is_locked ? "Locked" : "Unlocked"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <footer className="overflow-hidden rounded-2xl border border-rose-200/80 shadow-md">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-5 py-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-rose-50/90">
              Always and always
            </p>
            <p className="home-forever-text mt-1 text-3xl text-white">Forever</p>
          </div>
          <style>{`
            .home-forever-text {
              font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
              font-style: italic;
              letter-spacing: 0.09em;
              text-shadow: 0 6px 18px rgba(136, 19, 55, 0.35);
            }
          `}</style>
        </footer>
      </div>
      <FloatingMusicPlayer musicUrl={siteSettings?.home_music_url} autoStart />
    </div>
  );
}

function ProfileBadge({ label, imageUrl }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-2 py-1">
      <div className="h-8 w-8 overflow-hidden rounded-full border border-rose-200 bg-rose-50">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <span className="pr-1 text-xs font-semibold text-rose-700">{label}</span>
    </div>
  );
}

function CounterCard({ label, value }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white/85 px-3 py-3 text-center">
      <p className="text-2xl font-bold leading-none text-rose-700">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-2 text-xs uppercase tracking-widest text-rose-600">{label}</p>
    </div>
  );
}

function HomePageLoader() {
  const stars = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, index) => ({
        id: index,
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 85),
        delay: Math.round(Math.random() * 900),
        duration: 1400 + Math.round(Math.random() * 1400),
      })),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fff7f8]">
      <div className="absolute inset-0">
        {stars.map((star) => (
          <span
            key={star.id}
            className="loader-star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}ms`,
              animationDuration: `${star.duration}ms`,
            }}
          />
        ))}
      </div>

      <div className="loader-curtain loader-curtain-left" />
      <div className="loader-curtain loader-curtain-right" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-rose-700">Valentine Week</p>
          <h2 className="mt-3 text-3xl font-bold text-rose-900">Opening Our Story</h2>
          <p className="mt-2 text-sm text-rose-700">Curtains opening, stars sparkling...</p>
        </div>
      </div>

      <style>{`
        .loader-curtain {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          z-index: 20;
          background:
            linear-gradient(90deg, rgba(190, 18, 60, 0.95), rgba(225, 29, 72, 0.92)),
            repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.08) 0px,
              rgba(255, 255, 255, 0.08) 10px,
              rgba(255, 255, 255, 0.02) 10px,
              rgba(255, 255, 255, 0.02) 20px
            );
        }
        .loader-curtain-left {
          left: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.35);
          animation: curtainOpenLeft 1.15s cubic-bezier(0.21, 0.91, 0.24, 1) forwards;
        }
        .loader-curtain-right {
          right: 0;
          border-left: 1px solid rgba(255, 255, 255, 0.35);
          animation: curtainOpenRight 1.15s cubic-bezier(0.21, 0.91, 0.24, 1) forwards;
        }
        .loader-star {
          position: absolute;
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: radial-gradient(circle, #fffad1 0%, #fde047 65%, #f59e0b 100%);
          opacity: 0;
          transform: scale(0.2);
          animation-name: starTwinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes curtainOpenLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-104%);
          }
        }
        @keyframes curtainOpenRight {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(104%);
          }
        }
        @keyframes starTwinkle {
          0% {
            opacity: 0;
            transform: scale(0.25);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
        }
      `}</style>
    </div>
  );
}
