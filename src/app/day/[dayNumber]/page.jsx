"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Lock, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "@/utils/authCheck";
import FloatingMusicPlayer from "@/components/FloatingMusicPlayer";

const DAY_INTRO_MIN_MS = 3400;

function formatRoseFrameDate(isoValue) {
  const raw = String(isoValue ?? "").trim();
  if (!raw) return "Forever";
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const parsedDateOnly = new Date(year, month - 1, day);
    if (!Number.isNaN(parsedDateOnly.getTime())) {
      return parsedDateOnly.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Forever";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DayPage({ params }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [loaderReady, setLoaderReady] = useState(false);
  const [error, setError] = useState("");

  const role = useMemo(() => getUserRole(), []);
  const dayNumber = Number(params?.dayNumber);

  useEffect(() => {
    const loadDay = async () => {
      try {
        setLoading(true);
        setError("");

        if (!Number.isFinite(dayNumber)) {
          throw new Error("Invalid day");
        }

        const [dayResponse, settingsResponse] = await Promise.all([
          fetch(`/api/valentine-pages?day=${dayNumber}`),
          fetch("/api/site-settings"),
        ]);

        if (!dayResponse.ok) throw new Error("Day not found");
        const dayData = await dayResponse.json();
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSiteSettings(settingsData.settings ?? {});
        }

        if (dayData.page.is_locked && role !== "admin") {
          setPage(dayData.page);
          setPhotos([]);
          return;
        }

        const detailResponse = await fetch(`/api/valentine-pages/${dayData.page.id}`);
        if (!detailResponse.ok) throw new Error("Failed to load page");
        const detailData = await detailResponse.json();

        setPage(detailData.page);
        setPhotos(detailData.photos ?? []);
      } catch (loadError) {
        console.error("Failed to load day page:", loadError);
        setError("This page is not available right now.");
      } finally {
        setLoading(false);
      }
    };

    loadDay();
  }, [dayNumber, role]);

  useEffect(() => {
    setLoaderReady(false);
    const timer = window.setTimeout(() => setLoaderReady(true), DAY_INTRO_MIN_MS);
    return () => window.clearTimeout(timer);
  }, [dayNumber]);

  const backgroundUrl = page?.cover_photo_url || photos[0]?.photo_url;
  const isRoseDay = Number(page?.day_number) === 1;

  if (loading || !loaderReady) {
    const musicUrl = page?.music_url || null;
    if (dayNumber === 1) {
      return (
        <>
          <RosePetalLoader />
          <FloatingMusicPlayer musicUrl={musicUrl} autoStart />
        </>
      );
    }
    return (
      <>
        <div className="min-h-screen bg-rose-50 flex items-center justify-center">
          <p className="text-sm font-semibold text-rose-700">Loading day memories...</p>
        </div>
        <FloatingMusicPlayer musicUrl={musicUrl} autoStart />
      </>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow">
          <p className="text-sm text-rose-700">{error || "Day not found"}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (page.is_locked && role !== "admin") {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-7 text-center shadow">
          <Lock className="mx-auto text-rose-500" size={30} />
          <h1 className="mt-3 text-xl font-bold text-rose-900">{page.title}</h1>
          <p className="mt-2 text-sm text-rose-700">
            This day is locked right now. Ask the admin profile to unlock it.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 text-rose-950">
      <header
        className="relative min-h-[320px] overflow-hidden"
        style={{
          backgroundImage: backgroundUrl
            ? `linear-gradient(120deg, rgba(20, 6, 8, 0.6), rgba(20, 6, 8, 0.4)), url(${backgroundUrl})`
            : "linear-gradient(120deg, #be123c, #fb7185)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto flex h-full max-w-5xl flex-col justify-between px-4 py-6 text-white md:px-8">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-lg bg-black/35 px-3 py-2 text-sm font-semibold hover:bg-black/45"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {role === "admin" ? (
              <button
                onClick={() => navigate("/admin")}
                className="inline-flex items-center gap-2 rounded-lg bg-black/35 px-3 py-2 text-sm font-semibold hover:bg-black/45"
              >
                <Settings size={16} />
                Admin
              </button>
            ) : null}
          </div>

          <div className="mt-12 mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-rose-100">Day {page.day_number}</p>
            <h1 className="mt-2 text-4xl font-bold">{page.title}</h1>
            {page.subtitle ? <p className="mt-2 text-rose-100">{page.subtitle}</p> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        {isRoseDay ? (
          <RoseBloomWidget message={siteSettings?.rose_day_message} />
        ) : null}

        <h2 className="text-lg font-semibold text-rose-900">Photo Memories</h2>
        {photos.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {photos.map((photo) => {
              const frameDate = formatRoseFrameDate(photo.display_date || photo.created_at);
              return (
                <article
                  key={photo.id}
                  className={`group overflow-hidden ${
                    isRoseDay
                      ? "rose-frame-card rounded-[1.25rem] bg-gradient-to-b from-rose-300/80 via-rose-200/80 to-rose-300/80 p-[9px] shadow-[0_16px_35px_rgba(190,24,93,0.18)]"
                      : "rounded-xl border border-rose-200 bg-white shadow-sm"
                  }`}
                >
                  {isRoseDay ? (
                    <div className="rose-frame-petal-cloud" aria-hidden="true">
                      <span className="rose-frame-petal drift-1" />
                      <span className="rose-frame-petal drift-2" />
                      <span className="rose-frame-petal drift-3" />
                      <span className="rose-frame-petal drift-4" />
                    </div>
                  ) : null}
                  <div
                    className={`${
                      isRoseDay
                        ? "rose-frame-inner relative z-[2] overflow-hidden rounded-[1rem] border border-rose-100 bg-white p-[7px]"
                        : ""
                    }`}
                  >
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || `${page.title} photo`}
                      className={`h-72 w-full object-cover ${
                        isRoseDay
                          ? "rose-framed-photo rounded-[0.75rem] border border-rose-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]"
                          : ""
                      }`}
                      loading="lazy"
                    />
                    {isRoseDay ? (
                      <>
                        <span className="rose-frame-corner rose-frame-corner-top-left" />
                        <span className="rose-frame-corner rose-frame-corner-top-right" />
                        <span className="rose-frame-corner rose-frame-corner-bottom-left" />
                        <span className="rose-frame-corner rose-frame-corner-bottom-right" />
                        <span className="rose-frame-date">{frameDate}</span>
                      </>
                    ) : null}
                  </div>
                  {photo.caption ? (
                    <p className="px-3 py-2 text-sm text-rose-800">{photo.caption}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-6 text-sm text-rose-700">
            No photos uploaded for this day yet.
          </div>
        )}
      </main>
      {isRoseDay ? (
        <style>{`
          .rose-frame-card {
            position: relative;
            border: 1px solid rgba(251, 113, 133, 0.45);
            transition: transform 320ms ease, box-shadow 320ms ease;
          }
          .rose-frame-card::before {
            content: "";
            position: absolute;
            top: -42%;
            left: -62%;
            width: 46%;
            height: 186%;
            background: linear-gradient(
              105deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.6) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: rotate(8deg);
            animation: roseFrameSweep 5.4s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
            opacity: 0.55;
          }
          .rose-frame-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 42px rgba(190, 24, 93, 0.22);
          }
          .rose-frame-inner::after {
            content: "";
            position: absolute;
            inset: 10px;
            border-radius: 0.8rem;
            border: 1px solid rgba(244, 63, 94, 0.15);
            pointer-events: none;
          }
          .rose-framed-photo {
            transition: transform 520ms cubic-bezier(0.2, 0.8, 0.25, 1), filter 520ms ease;
          }
          .rose-frame-card:hover .rose-framed-photo {
            transform: scale(1.055);
            filter: saturate(1.08) brightness(1.03);
          }
          .rose-frame-petal-cloud {
            position: absolute;
            inset: 0;
            z-index: 0;
            overflow: hidden;
            pointer-events: none;
          }
          .rose-frame-petal {
            position: absolute;
            width: 16px;
            height: 21px;
            border-radius: 70% 70% 58% 58%;
            background:
              radial-gradient(circle at 35% 24%, rgba(255, 228, 236, 0.95) 0%, rgba(255, 228, 236, 0.2) 35%, transparent 50%),
              linear-gradient(180deg, rgba(251, 113, 133, 0.95), rgba(225, 29, 72, 0.95));
            opacity: 0.28;
            filter: blur(0.2px);
          }
          .drift-1 {
            left: 14%;
            top: 68%;
            animation: roseCloudDrift1 8s ease-in-out infinite;
          }
          .drift-2 {
            left: 76%;
            top: 28%;
            animation: roseCloudDrift2 9s ease-in-out infinite;
          }
          .drift-3 {
            left: 58%;
            top: 74%;
            animation: roseCloudDrift3 7.6s ease-in-out infinite;
          }
          .drift-4 {
            left: 24%;
            top: 20%;
            animation: roseCloudDrift4 8.8s ease-in-out infinite;
          }
          .rose-frame-corner {
            position: absolute;
            width: 24px;
            height: 24px;
            border-color: rgba(190, 24, 93, 0.6);
            pointer-events: none;
          }
          .rose-frame-corner-top-left {
            left: 12px;
            top: 12px;
            border-top: 2px solid rgba(190, 24, 93, 0.6);
            border-left: 2px solid rgba(190, 24, 93, 0.6);
            border-top-left-radius: 8px;
          }
          .rose-frame-corner-top-right {
            right: 12px;
            top: 12px;
            border-top: 2px solid rgba(190, 24, 93, 0.6);
            border-right: 2px solid rgba(190, 24, 93, 0.6);
            border-top-right-radius: 8px;
          }
          .rose-frame-corner-bottom-left {
            left: 12px;
            bottom: 12px;
            border-bottom: 2px solid rgba(190, 24, 93, 0.6);
            border-left: 2px solid rgba(190, 24, 93, 0.6);
            border-bottom-left-radius: 8px;
          }
          .rose-frame-corner-bottom-right {
            right: 12px;
            bottom: 12px;
            border-bottom: 2px solid rgba(190, 24, 93, 0.6);
            border-right: 2px solid rgba(190, 24, 93, 0.6);
            border-bottom-right-radius: 8px;
          }
          .rose-frame-date {
            position: absolute;
            right: 20px;
            top: 18px;
            z-index: 8;
            padding: 3px 10px;
            border-radius: 9999px;
            border: 1px solid rgba(244, 63, 94, 0.26);
            background: rgba(255, 241, 242, 0.92);
            color: #9f1239;
            font-family: "Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive;
            font-size: 16px;
            letter-spacing: 0.03em;
            box-shadow: 0 6px 14px rgba(159, 18, 57, 0.12);
          }
          @keyframes roseFrameSweep {
            0% {
              transform: translateX(0) rotate(8deg);
            }
            100% {
              transform: translateX(470%) rotate(8deg);
            }
          }
          @keyframes roseCloudDrift1 {
            0%, 100% {
              transform: translate(0, 0) rotate(-8deg);
            }
            50% {
              transform: translate(8px, -10px) rotate(10deg);
            }
          }
          @keyframes roseCloudDrift2 {
            0%, 100% {
              transform: translate(0, 0) rotate(6deg);
            }
            50% {
              transform: translate(-9px, 12px) rotate(-10deg);
            }
          }
          @keyframes roseCloudDrift3 {
            0%, 100% {
              transform: translate(0, 0) rotate(8deg);
            }
            50% {
              transform: translate(6px, -8px) rotate(-6deg);
            }
          }
          @keyframes roseCloudDrift4 {
            0%, 100% {
              transform: translate(0, 0) rotate(-4deg);
            }
            50% {
              transform: translate(-8px, 9px) rotate(8deg);
            }
          }
        `}</style>
      ) : null}
      <FloatingMusicPlayer musicUrl={page?.music_url} autoStart />
    </div>
  );
}

function RosePetalLoader() {
  const petals = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        id: index,
        left: 4 + Math.round(Math.random() * 92),
        delay: Math.round(Math.random() * 1000),
        duration: 2600 + Math.round(Math.random() * 1800),
        rotate: Math.round(Math.random() * 120 - 60),
        scale: (0.65 + Math.random() * 0.7).toFixed(2),
      })),
    []
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, index) => ({
        id: index,
        left: Math.round(Math.random() * 100),
        top: 8 + Math.round(Math.random() * 84),
        delay: Math.round(Math.random() * 1100),
        duration: 1400 + Math.round(Math.random() * 1400),
      })),
    []
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200">
      <div className="absolute inset-0">
        {petals.map((petal) => (
          <span
            key={petal.id}
            className="falling-petal"
            style={{
              left: `${petal.left}%`,
              animationDelay: `${petal.delay}ms`,
              animationDuration: `${petal.duration}ms`,
              "--petal-rotate": `${petal.rotate}deg`,
              "--petal-scale": petal.scale,
            }}
          />
        ))}
        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="petal-sparkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}ms`,
              animationDuration: `${sparkle.duration}ms`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-700">Rose Day</p>
          <h2 className="mt-3 text-3xl font-bold text-rose-900">Petals Are Falling</h2>
          <p className="mt-2 text-sm text-rose-700">Sparkles are setting the mood...</p>
        </div>
      </div>

      <style>{`
        .falling-petal {
          position: absolute;
          top: -14%;
          width: 26px;
          height: 34px;
          border-radius: 70% 70% 58% 58%;
          background:
            radial-gradient(circle at 35% 26%, rgba(255, 230, 238, 0.95) 0%, rgba(255, 230, 238, 0.25) 30%, transparent 46%),
            linear-gradient(180deg, #fb7185 0%, #f43f5e 58%, #e11d48 100%);
          opacity: 0.9;
          transform: rotate(var(--petal-rotate)) scale(var(--petal-scale));
          animation-name: fallPetal;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .petal-sparkle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: radial-gradient(circle, #fff8bf 0%, #facc15 70%, #f59e0b 100%);
          opacity: 0;
          animation-name: petalSparkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes fallPetal {
          0% {
            transform: translateY(0) translateX(0) rotate(var(--petal-rotate)) scale(var(--petal-scale));
            opacity: 0.95;
          }
          50% {
            transform: translateY(54vh) translateX(18px) rotate(calc(var(--petal-rotate) + 30deg))
              scale(var(--petal-scale));
          }
          100% {
            transform: translateY(114vh) translateX(-16px) rotate(calc(var(--petal-rotate) + 70deg))
              scale(var(--petal-scale));
            opacity: 0.75;
          }
        }
        @keyframes petalSparkle {
          0% {
            opacity: 0;
            transform: scale(0.2);
          }
          35% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.35);
          }
        }
      `}</style>
    </div>
  );
}

function RoseBloomWidget({ message }) {
  const [isBlooming, setIsBlooming] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, index) => ({
        id: index,
        rotation: `${Math.round((360 / 14) * index)}deg`,
        delay: `${index * 24}ms`,
        scale: index % 2 === 0 ? "1" : "0.9",
      })),
    []
  );

  const bloomRose = () => {
    if (isBlooming) return;
    if (isRevealed) {
      setIsRevealed(false);
      setSparkles([]);
      return;
    }

    setIsBlooming(true);
    const nextSparkles = Array.from({ length: 20 }).map((_, index) => ({
      id: `${Date.now()}-${index}`,
      x: Math.round(Math.random() * 270 - 135),
      y: Math.round(Math.random() * -210),
      duration: 760 + Math.round(Math.random() * 520),
      size: 5 + Math.round(Math.random() * 5),
    }));
    setSparkles(nextSparkles);

    window.setTimeout(() => setIsRevealed(true), 680);
    window.setTimeout(() => setIsBlooming(false), 920);
    window.setTimeout(() => setSparkles([]), 1500);
  };

  const isOpen = isBlooming || isRevealed;
  const revealMessage = message?.trim() || "Every petal opens for a memory with you.";

  return (
    <section className="mb-8 rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-rose-900">Rose Day Bloom</p>
      <p className="mt-1 text-xs text-rose-700">
        Tap the rose from top view. It blooms and reveals your message.
      </p>

      <div className="mt-5 flex flex-col items-center">
        <button
          type="button"
          className={`top-rose-button ${isOpen ? "open" : ""}`}
          onClick={bloomRose}
          aria-label="Bloom rose"
        >
          <span className={`top-rose ${isOpen ? "open" : ""}`}>
            {petals.map((petal) => (
              <span
                key={petal.id}
                className="top-rose-petal"
                style={{
                  "--petal-rotate": petal.rotation,
                  "--petal-delay": petal.delay,
                  "--petal-scale": petal.scale,
                }}
              />
            ))}
            <span className="top-rose-core" />
            <span className="top-rose-core-ring" />
          </span>

          {sparkles.map((sparkle) => (
            <span
              key={sparkle.id}
              className="rose-sparkle"
              style={{
                "--sparkle-x": `${sparkle.x}px`,
                "--sparkle-y": `${sparkle.y}px`,
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
                animationDuration: `${sparkle.duration}ms`,
              }}
            />
          ))}

          <span className={`rose-inner-message ${isRevealed ? "show" : ""}`}>
            {revealMessage}
          </span>
        </button>

        <p className="mt-2 text-[11px] text-rose-600">
          {isRevealed ? "Tap rose again to close." : "Tap rose to open petals."}
        </p>
      </div>

      <style>{`
        .top-rose-button {
          position: relative;
          width: min(88vw, 330px);
          aspect-ratio: 1 / 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          border: 1px solid rgba(244, 63, 94, 0.35);
          background:
            radial-gradient(circle at 35% 28%, #fff8fa 0%, rgba(255, 246, 248, 0.95) 36%, rgba(254, 205, 211, 0.72) 66%, rgba(251, 113, 133, 0.22) 100%),
            radial-gradient(circle at center, rgba(251, 113, 133, 0.1), rgba(225, 29, 72, 0.15));
          box-shadow: 0 26px 50px rgba(244, 63, 94, 0.17);
          overflow: hidden;
        }
        .top-rose-button::before {
          content: "";
          position: absolute;
          inset: 10%;
          border-radius: 9999px;
          border: 1px dashed rgba(244, 63, 94, 0.2);
          transform: scale(1);
          transition: transform 420ms ease, opacity 420ms ease;
          opacity: 0.75;
        }
        .top-rose-button:focus-visible {
          outline: 2px solid #e11d48;
          outline-offset: 2px;
        }
        .top-rose-button .top-rose {
          position: relative;
          width: 74%;
          height: 74%;
        }
        .top-rose-petal {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 34%;
          height: 48%;
          border-radius: 70% 70% 62% 62%;
          background:
            radial-gradient(circle at 45% 28%, #ffd1dd 0%, rgba(255, 209, 221, 0.2) 26%, transparent 48%),
            linear-gradient(180deg, #fb7185 0%, #f43f5e 58%, #e11d48 100%);
          box-shadow: 0 4px 12px rgba(190, 24, 93, 0.32);
          transform-origin: 50% 92%;
          transform:
            translate(-50%, -50%)
            rotate(var(--petal-rotate))
            translateY(-14px)
            scale(calc(0.36 * var(--petal-scale)));
          transition:
            transform 760ms cubic-bezier(0.19, 0.95, 0.27, 1) var(--petal-delay),
            filter 460ms ease var(--petal-delay),
            opacity 460ms ease var(--petal-delay);
          opacity: 0.97;
        }
        .top-rose.open .top-rose-petal {
          transform:
            translate(-50%, -50%)
            rotate(var(--petal-rotate))
            translateY(-74px)
            scale(calc(0.98 * var(--petal-scale)));
          filter: saturate(1.05) brightness(1.02);
        }
        .top-rose-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 28%;
          height: 28%;
          border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, #fecdd3 0%, #f43f5e 52%, #be123c 100%);
          box-shadow: 0 8px 18px rgba(159, 18, 57, 0.45);
          transform: translate(-50%, -50%) scale(1);
          transition: transform 520ms ease;
          z-index: 5;
        }
        .top-rose-core-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 35%;
          height: 35%;
          border-radius: 9999px;
          border: 1px solid rgba(255, 228, 230, 0.72);
          transform: translate(-50%, -50%) scale(0.9);
          transition: transform 600ms ease, opacity 600ms ease;
          z-index: 4;
        }
        .top-rose.open .top-rose-core {
          transform: translate(-50%, -50%) scale(1.17);
        }
        .top-rose.open .top-rose-core-ring {
          transform: translate(-50%, -50%) scale(1.25);
          opacity: 0.7;
        }
        .top-rose-button.open::before {
          transform: scale(1.08);
          opacity: 0.45;
        }
        .rose-sparkle {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 9999px;
          background: radial-gradient(circle, #fff8b5 0%, #fde047 70%, #f59e0b 100%);
          transform: translate(-50%, -50%);
          animation: roseSparkle 980ms ease-out forwards;
          pointer-events: none;
        }
        .rose-inner-message {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(67%, 214px);
          border-radius: 9999px;
          border: 1px solid rgba(244, 63, 94, 0.25);
          background: rgba(255, 241, 242, 0.93);
          padding: 8px 10px;
          text-align: center;
          color: #9f1239;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.25;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.2);
          box-shadow: 0 10px 20px rgba(159, 18, 57, 0.18);
          transition: opacity 360ms ease, transform 520ms cubic-bezier(0.22, 0.97, 0.3, 1);
          pointer-events: none;
          z-index: 9;
        }
        .rose-inner-message.show {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        @keyframes roseSparkle {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--sparkle-x)), calc(-50% + var(--sparkle-y)))
              scale(0);
          }
        }
      `}</style>
    </section>
  );
}
