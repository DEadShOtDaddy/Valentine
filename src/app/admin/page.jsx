"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Lock,
  LogOut,
  RefreshCcw,
  Unlock,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUpload } from "@/utils/useUpload";
import { getUserRole, logout } from "@/utils/authCheck";

const ADMIN_HEADERS = {
  "x-admin-auth": "admin",
  "Content-Type": "application/json",
};

const SITE_ASSETS = [
  { key: "home_background_url", label: "Home Page Background", isRound: false },
  { key: "kukku_profile_url", label: "Kukku Profile Picture", isRound: true },
  { key: "jello_profile_url", label: "Jello Profile Picture", isRound: true },
];

const SITE_TEXT_FIELDS = [
  {
    key: "home_music_url",
    label: "Home Page Music URL",
    placeholder: "Paste direct mp3/ogg/m4a URL for home page",
    multiline: false,
  },
  {
    key: "home_title",
    label: "Home Title",
    placeholder: "We are here Together",
    multiline: false,
  },
  {
    key: "rose_day_message",
    label: "Rose Day Reveal Message",
    placeholder: "Every petal opens for a memory with you.",
    multiline: true,
  },
];

function sortByDay(a, b) {
  return Number(a.day_number) - Number(b.day_number);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process selected image"));
    image.src = src;
  });
}

async function toCompressedDataUrl(file) {
  const rawDataUrl = await readFileAsDataUrl(file);
  if (!file.type.startsWith("image/")) return rawDataUrl;

  const image = await loadImage(rawDataUrl);
  const maxEdge = 1400;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return rawDataUrl;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function getPhotoUrlWithFallback(file, upload) {
  try {
    const uploaded = await upload({ file });
    if (uploaded?.url) return uploaded.url;
  } catch {
    // Falls back to local data URL below.
  }
  return toCompressedDataUrl(file);
}

async function getMusicUrlWithFallback(file, upload) {
  const maxInlineMusicBytes = 8 * 1024 * 1024;
  const uploaded = await upload({ file });
  if (uploaded?.url) {
    return uploaded.url;
  }
  if (file.size > maxInlineMusicBytes) {
    throw new Error(
      "Music upload failed on server. For local fallback, keep file under 8MB."
    );
  }
  return readFileAsDataUrl(file);
}

function buildCaptionDrafts(photosByPage) {
  const drafts = {};
  for (const photos of Object.values(photosByPage)) {
    for (const photo of photos) {
      drafts[photo.id] = photo.caption || "";
    }
  }
  return drafts;
}

function toInputDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateDrafts(photosByPage) {
  const drafts = {};
  for (const photos of Object.values(photosByPage)) {
    for (const photo of photos) {
      drafts[photo.id] = toInputDate(photo.display_date || photo.created_at);
    }
  }
  return drafts;
}

function buildMusicDrafts(pages) {
  const drafts = {};
  for (const page of pages) {
    drafts[page.id] = page.music_url || "";
  }
  return drafts;
}

function buildSiteTextDrafts(settings) {
  return {
    home_music_url: settings?.home_music_url || "",
    home_title: settings?.home_title || "",
    rose_day_message: settings?.rose_day_message || "",
  };
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [photosByPage, setPhotosByPage] = useState({});
  const [captionDrafts, setCaptionDrafts] = useState({});
  const [dateDrafts, setDateDrafts] = useState({});
  const [musicDrafts, setMusicDrafts] = useState({});
  const [siteSettings, setSiteSettings] = useState({});
  const [siteTextDrafts, setSiteTextDrafts] = useState({
    home_music_url: "",
    home_title: "",
    rose_day_message: "",
  });
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [upload, { loading: uploadLoading }] = useUpload();
  const role = useMemo(() => getUserRole(), []);

  useEffect(() => {
    if (role !== "admin") {
      navigate("/account/signin");
      return;
    }
    void fetchDashboardData();
  }, [navigate, role]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setActionError("");
      setActionMessage("");

      const [pagesResponse, settingsResponse] = await Promise.all([
        fetch("/api/valentine-pages"),
        fetch("/api/site-settings"),
      ]);

      if (!pagesResponse.ok) throw new Error("Failed to fetch pages");
      if (!settingsResponse.ok) throw new Error("Failed to fetch site settings");

      const pagesData = await pagesResponse.json();
      const settingsData = await settingsResponse.json();
      const orderedPages = (pagesData.pages ?? []).sort(sortByDay);
      setPages(orderedPages);
      setMusicDrafts(buildMusicDrafts(orderedPages));
      const nextSettings = settingsData.settings ?? {};
      setSiteSettings(nextSettings);
      setSiteTextDrafts(buildSiteTextDrafts(nextSettings));

      const details = await Promise.all(
        orderedPages.map(async (page) => {
          const response = await fetch(`/api/valentine-pages/${page.id}`);
          if (!response.ok) return [String(page.id), []];
          const data = await response.json();
          return [String(page.id), data.photos ?? []];
        })
      );

      const nextPhotosByPage = Object.fromEntries(details);
      setPhotosByPage(nextPhotosByPage);
      setCaptionDrafts(buildCaptionDrafts(nextPhotosByPage));
      setDateDrafts(buildDateDrafts(nextPhotosByPage));
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
      setActionError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function resetWeek() {
    try {
      setActionError("");
      setActionMessage("");
      const response = await fetch("/api/seed-pages", {
        method: "POST",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ forceReset: true }),
      });
      if (!response.ok) throw new Error("Failed to reset pages");
      await fetchDashboardData();
      setActionMessage("7-day setup reset completed.");
    } catch (error) {
      console.error("Failed to reset week:", error);
      setActionError("Could not reset the week data.");
    }
  }

  async function togglePageLock(page) {
    try {
      setActionError("");
      setActionMessage("");
      const response = await fetch(`/api/valentine-pages/${page.id}`, {
        method: "PUT",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ is_locked: !page.is_locked }),
      });
      if (!response.ok) throw new Error("Failed to update lock status");
      const data = await response.json();
      setPages((currentPages) =>
        currentPages
          .map((candidate) => (candidate.id === page.id ? data.page : candidate))
          .sort(sortByDay)
      );
    } catch (error) {
      console.error("Failed to toggle lock:", error);
      setActionError("Could not update lock state.");
    }
  }

  async function saveSiteSettings(partialSettings) {
    const response = await fetch("/api/site-settings", {
      method: "PUT",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(partialSettings),
    });
    if (!response.ok) throw new Error("Failed to update site settings");
    const data = await response.json();
    const nextSettings = data.settings ?? {};
    setSiteSettings(nextSettings);
    setSiteTextDrafts(buildSiteTextDrafts(nextSettings));
  }

  async function handleSiteAssetUpload(event, key) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setActionError("");
      setActionMessage("");
      setIsUploading(true);
      const photoUrl = await getPhotoUrlWithFallback(file, upload);
      await saveSiteSettings({ [key]: photoUrl });
      setActionMessage("Site image updated.");
    } catch (error) {
      console.error("Failed to upload site asset:", error);
      setActionError("Could not upload this site image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handlePhotoUpload(event, pageId) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setActionError("");
      setActionMessage("");
      setIsUploading(true);
      const photoUrl = await getPhotoUrlWithFallback(file, upload);
      const response = await fetch("/api/page-photos", {
        method: "POST",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          page_id: pageId,
          photo_url: photoUrl,
          display_order: 0,
        }),
      });
      if (!response.ok) throw new Error("Failed to save photo");
      await fetchDashboardData();
      setActionMessage("Photo uploaded.");
    } catch (error) {
      console.error("Failed to save uploaded photo:", error);
      setActionError("Upload failed. Try a smaller image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveTextSetting(key) {
    try {
      setActionError("");
      setActionMessage("");
      const value = siteTextDrafts[key] ?? "";
      await saveSiteSettings({ [key]: value });
      setActionMessage("Site text updated.");
    } catch (error) {
      console.error("Failed to save site text:", error);
      setActionError("Could not save this text right now.");
    }
  }

  async function savePageMusic(pageId) {
    try {
      setActionError("");
      setActionMessage("");
      const musicUrl = musicDrafts[pageId] ?? "";
      const response = await fetch(`/api/valentine-pages/${pageId}`, {
        method: "PUT",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ music_url: musicUrl }),
      });
      if (!response.ok) throw new Error("Failed to save music");
      const data = await response.json();
      setPages((currentPages) =>
        currentPages
          .map((candidate) => (candidate.id === pageId ? data.page : candidate))
          .sort(sortByDay)
      );
      setMusicDrafts((current) => ({ ...current, [pageId]: data.page.music_url || "" }));
      setActionMessage("Page music updated.");
    } catch (error) {
      console.error("Failed to save page music:", error);
      setActionError("Could not save page music.");
    }
  }

  async function handleHomeMusicUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setActionError("");
      setActionMessage("");
      setIsUploading(true);
      const musicUrl = await getMusicUrlWithFallback(file, upload);
      await saveSiteSettings({ home_music_url: musicUrl });
      setActionMessage("Home music uploaded.");
    } catch (error) {
      console.error("Failed to upload home music:", error);
      setActionError(error?.message || "Could not upload home music file.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handlePageMusicUpload(event, pageId) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setActionError("");
      setActionMessage("");
      setIsUploading(true);
      const musicUrl = await getMusicUrlWithFallback(file, upload);
      const response = await fetch(`/api/valentine-pages/${pageId}`, {
        method: "PUT",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ music_url: musicUrl }),
      });
      if (!response.ok) throw new Error("Failed to save page music");
      const data = await response.json();
      setPages((currentPages) =>
        currentPages
          .map((candidate) => (candidate.id === pageId ? data.page : candidate))
          .sort(sortByDay)
      );
      setMusicDrafts((current) => ({ ...current, [pageId]: data.page.music_url || "" }));
      setActionMessage("Page music uploaded.");
    } catch (error) {
      console.error("Failed to upload page music:", error);
      setActionError(error?.message || "Could not upload this page music file.");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveCaption(photoId, pageId) {
    try {
      setActionError("");
      setActionMessage("");
      const caption = captionDrafts[photoId] ?? "";
      const displayDate = dateDrafts[photoId] ?? "";
      const response = await fetch(`/api/page-photos/${photoId}`, {
        method: "PUT",
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ caption, display_date: displayDate }),
      });
      if (!response.ok) throw new Error("Failed to save caption");
      const data = await response.json();
      const updatedPhoto = data.photo;
      const pageKey = String(pageId);
      setPhotosByPage((current) => ({
        ...current,
        [pageKey]: (current[pageKey] ?? []).map((photo) =>
          Number(photo.id) === Number(photoId) ? updatedPhoto : photo
        ),
      }));
      setCaptionDrafts((current) => ({ ...current, [photoId]: updatedPhoto.caption || "" }));
      setDateDrafts((current) => ({
        ...current,
        [photoId]: toInputDate(updatedPhoto.display_date || updatedPhoto.created_at),
      }));
      setActionMessage("Photo details saved.");
    } catch (error) {
      console.error("Failed to save caption:", error);
      setActionError("Could not save photo details.");
    }
  }

  async function deletePhoto(photoId, pageId) {
    try {
      setActionError("");
      setActionMessage("");
      const response = await fetch(`/api/page-photos/${photoId}`, {
        method: "DELETE",
        headers: { "x-admin-auth": "admin" },
      });
      if (!response.ok) throw new Error("Failed to delete photo");
      const pageKey = String(pageId);
      setPhotosByPage((current) => ({
        ...current,
        [pageKey]: (current[pageKey] ?? []).filter(
          (photo) => Number(photo.id) !== Number(photoId)
        ),
      }));
      setCaptionDrafts((current) => {
        const next = { ...current };
        delete next[photoId];
        return next;
      });
      setDateDrafts((current) => {
        const next = { ...current };
        delete next[photoId];
        return next;
      });
      await fetchDashboardData();
      setActionMessage("Photo removed.");
    } catch (error) {
      console.error("Failed to delete photo:", error);
      setActionError("Could not delete the selected photo.");
    }
  }

  const busy = isUploading || uploadLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p className="text-sm font-semibold text-rose-700">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
      <header className="border-b border-rose-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              <ArrowLeft size={16} />
              Home
            </button>
            <h1 className="text-2xl font-bold text-rose-900">Admin Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetWeek}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              <RefreshCcw size={16} />
              Reset 7 Days
            </button>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <p className="mb-4 text-sm text-rose-800">
          Manage global images, lock days, upload photos, and edit captions/dates for every page photo.
        </p>

        {actionError ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-100 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        {!actionError && actionMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        ) : null}

        <section className="mb-6 rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-rose-900">Site Images</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {SITE_ASSETS.map((asset) => {
              const imageUrl = siteSettings?.[asset.key] || null;
              return (
                <article key={asset.key} className="rounded-lg border border-rose-100 p-3">
                  <p className="text-sm font-semibold text-rose-900">{asset.label}</p>
                  <div className="mt-3">
                    {asset.isRound ? (
                      <div className="h-24 w-24 overflow-hidden rounded-full border border-rose-200 bg-rose-50">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={asset.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-rose-500">
                            No image
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video overflow-hidden rounded-lg border border-rose-200 bg-rose-50">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={asset.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-rose-500">
                            No image
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                    <Upload size={14} />
                    {busy ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy}
                      onChange={(event) => handleSiteAssetUpload(event, asset.key)}
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-rose-900">Home and Rose Text</h2>
          <p className="mt-1 text-xs text-rose-700">
            Add direct audio URLs or upload mp3 files (under 8MB fallback) and edit text shown on home/Rose Day.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {SITE_TEXT_FIELDS.map((field) => (
              <article key={field.key} className="rounded-lg border border-rose-100 p-3">
                <p className="text-sm font-semibold text-rose-900">{field.label}</p>
                {field.multiline ? (
                  <textarea
                    value={siteTextDrafts[field.key] ?? ""}
                    onChange={(event) =>
                      setSiteTextDrafts((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-2 w-full resize-y rounded border border-rose-200 px-3 py-2 text-sm text-rose-900 outline-none ring-rose-400 focus:ring-2"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type="text"
                    value={siteTextDrafts[field.key] ?? ""}
                    onChange={(event) =>
                      setSiteTextDrafts((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded border border-rose-200 px-3 py-2 text-sm text-rose-900 outline-none ring-rose-400 focus:ring-2"
                    placeholder={field.placeholder}
                  />
                )}
                <button
                  type="button"
                  onClick={() => saveTextSetting(field.key)}
                  className="mt-3 rounded bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Save text
                </button>
                {field.key === "home_music_url" ? (
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                    <Upload size={14} />
                    {busy ? "Uploading..." : "Upload MP3"}
                    <input
                      type="file"
                      accept=".mp3,.m4a,.aac,.wav,.ogg,audio/*"
                      className="hidden"
                      disabled={busy}
                      onChange={handleHomeMusicUpload}
                    />
                  </label>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {pages.map((page) => {
            const photos = photosByPage[String(page.id)] ?? [];
            const cover = page.cover_photo_url || photos[0]?.photo_url;
            return (
              <section
                key={page.id}
                className="overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm"
              >
                <div
                  className="h-40 bg-cover bg-center"
                  style={{
                    backgroundImage: cover
                      ? `linear-gradient(120deg, rgba(20, 6, 8, 0.45), rgba(20, 6, 8, 0.35)), url(${cover})`
                      : "linear-gradient(120deg, #e11d48, #fb7185)",
                  }}
                />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-rose-500">
                        Day {page.day_number}
                      </p>
                      <h2 className="text-lg font-bold text-rose-900">{page.title}</h2>
                      {page.subtitle ? (
                        <p className="text-sm text-rose-700">{page.subtitle}</p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => togglePageLock(page)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                        page.is_locked
                          ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      }`}
                    >
                      {page.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                      {page.is_locked ? "Locked" : "Unlocked"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="w-full rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                        Page Music
                      </p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={musicDrafts[page.id] ?? ""}
                          onChange={(event) =>
                            setMusicDrafts((current) => ({
                              ...current,
                              [page.id]: event.target.value,
                            }))
                          }
                          placeholder="Paste mp3/audio URL for this page"
                          className="w-full rounded border border-rose-200 bg-white px-3 py-2 text-xs text-rose-900 outline-none ring-rose-400 focus:ring-2"
                        />
                        <button
                          type="button"
                          onClick={() => savePageMusic(page.id)}
                          className="rounded bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Save music
                        </button>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                          <Upload size={14} />
                          {busy ? "Uploading..." : "Upload MP3"}
                          <input
                            type="file"
                            accept=".mp3,.m4a,.aac,.wav,.ogg,audio/*"
                            className="hidden"
                            disabled={busy}
                            onChange={(event) => handlePageMusicUpload(event, page.id)}
                          />
                        </label>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                      <Upload size={14} />
                      {busy ? "Uploading..." : "Upload photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={busy}
                        onChange={(event) => handlePhotoUpload(event, page.id)}
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {photos.length > 0 ? (
                      photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="overflow-hidden rounded-md border border-rose-100 bg-rose-50/40 p-2"
                        >
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || "Page memory"}
                            className="h-24 w-full rounded object-cover"
                            loading="lazy"
                          />
                          <input
                            type="text"
                            value={captionDrafts[photo.id] ?? ""}
                            onChange={(event) =>
                              setCaptionDrafts((current) => ({
                                ...current,
                                [photo.id]: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded border border-rose-200 px-2 py-1 text-xs text-rose-900 outline-none ring-rose-400 focus:ring-2"
                            placeholder="Write caption"
                          />
                          <div className="mt-2">
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                              Display date
                            </label>
                            <input
                              type="date"
                              value={dateDrafts[photo.id] ?? ""}
                              onChange={(event) =>
                                setDateDrafts((current) => ({
                                  ...current,
                                  [photo.id]: event.target.value,
                                }))
                              }
                              className="w-full rounded border border-rose-200 px-2 py-1 text-xs text-rose-900 outline-none ring-rose-400 focus:ring-2"
                            />
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveCaption(photo.id, page.id)}
                              className="rounded bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
                            >
                              Save details
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePhoto(photo.id, page.id)}
                              className="rounded bg-black/80 px-2 py-1 text-[11px] font-semibold text-white hover:bg-black"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        No photos uploaded yet for this day.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
