import {
  defaultSiteSettings,
  defaultValentinePages,
  defaultValentinePhotoUrls,
} from "@/app/api/utils/default-data";

const STORE_KEY = "__valentineWeekStore";

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return parsed;
}

function normalizeDisplayDate(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Display date must use YYYY-MM-DD");
  }
  return trimmed;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sortByDay(a, b) {
  return Number(a.day_number) - Number(b.day_number);
}

function sortPhotos(a, b) {
  if (a.display_order === b.display_order) {
    return Number(a.id) - Number(b.id);
  }
  return Number(a.display_order) - Number(b.display_order);
}

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = {
      initialized: false,
      pages: [],
      photos: [],
      settings: null,
      nextPageId: 1,
      nextPhotoId: 1,
    };
  }
  return globalThis[STORE_KEY];
}

function decoratePage(page, allPhotos) {
  const photos = allPhotos
    .filter((photo) => Number(photo.page_id) === Number(page.id))
    .sort(sortPhotos);

  return {
    ...page,
    cover_photo_url: photos[0]?.photo_url ?? null,
    photo_count: photos.length,
  };
}

function ensureInitialized(forceReset = false) {
  const store = getStore();
  if (store.initialized && !forceReset) {
    return store;
  }

  store.pages = defaultValentinePages
    .map((page, index) => ({
      ...page,
      id: index + 1,
      created_at: nowIso(),
      updated_at: nowIso(),
    }))
    .sort(sortByDay);

  store.photos = defaultValentinePhotoUrls.map((photoUrl, index) => ({
    id: index + 1,
    page_id: index + 1,
    photo_url: photoUrl,
    caption: `Memory for day ${index + 1}`,
    display_date: null,
    display_order: 0,
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  store.nextPageId = store.pages.length + 1;
  store.nextPhotoId = store.photos.length + 1;
  store.settings = { ...defaultSiteSettings };
  store.initialized = true;
  return store;
}

export function seedValentinePagesInStore({ forceReset = false } = {}) {
  const store = ensureInitialized(forceReset);
  return {
    success: true,
    message: forceReset ? "Pages reset successfully" : "Pages seeded successfully",
    count: store.pages.length,
  };
}

export function listPages() {
  const store = ensureInitialized();
  return clone(store.pages.map((page) => decoratePage(page, store.photos)).sort(sortByDay));
}

export function getSiteSettings() {
  const store = ensureInitialized();
  return clone(store.settings);
}

export function updateSiteSettings(updates) {
  const store = ensureInitialized();
  const nextSettings = { ...store.settings };

  if (updates.home_background_url !== undefined) {
    nextSettings.home_background_url = updates.home_background_url?.trim() || null;
  }
  if (updates.kukku_profile_url !== undefined) {
    nextSettings.kukku_profile_url = updates.kukku_profile_url?.trim() || null;
  }
  if (updates.jello_profile_url !== undefined) {
    nextSettings.jello_profile_url = updates.jello_profile_url?.trim() || null;
  }
  if (updates.home_music_url !== undefined) {
    nextSettings.home_music_url = updates.home_music_url?.trim() || null;
  }
  if (updates.home_title !== undefined) {
    const title = updates.home_title?.trim();
    nextSettings.home_title = title || defaultSiteSettings.home_title;
  }
  if (updates.rose_day_message !== undefined) {
    const message = updates.rose_day_message?.trim();
    nextSettings.rose_day_message = message || defaultSiteSettings.rose_day_message;
  }

  store.settings = nextSettings;
  return clone(store.settings);
}

export function getPageById(id) {
  const store = ensureInitialized();
  const numericId = toNumber(id, "page id");
  const page = store.pages.find((candidate) => Number(candidate.id) === numericId);
  if (!page) return null;
  return clone(decoratePage(page, store.photos));
}

export function getPageByDayNumber(dayNumber) {
  const store = ensureInitialized();
  const numericDay = toNumber(dayNumber, "day number");
  const page = store.pages.find(
    (candidate) => Number(candidate.day_number) === numericDay
  );
  if (!page) return null;
  return clone(decoratePage(page, store.photos));
}

export function createPage(input) {
  const store = ensureInitialized();
  const dayNumber = toNumber(input.day_number, "day number");
  if (store.pages.some((page) => Number(page.day_number) === dayNumber)) {
    throw new Error("A page already exists for that day");
  }
  const nextPage = {
    id: store.nextPageId++,
    day_number: dayNumber,
    title: input.title?.trim() || `Day ${dayNumber}`,
    subtitle: input.subtitle?.trim() || null,
    is_locked: input.is_locked === true,
    music_url: input.music_url?.trim() || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  store.pages.push(nextPage);
  store.pages.sort(sortByDay);
  return clone(decoratePage(nextPage, store.photos));
}

export function updatePage(id, updates) {
  const store = ensureInitialized();
  const numericId = toNumber(id, "page id");
  const pageIndex = store.pages.findIndex((page) => Number(page.id) === numericId);
  if (pageIndex === -1) return null;

  const currentPage = store.pages[pageIndex];
  const nextDayNumber =
    updates.day_number !== undefined
      ? toNumber(updates.day_number, "day number")
      : Number(currentPage.day_number);

  const hasDayConflict = store.pages.some(
    (page) =>
      Number(page.id) !== numericId && Number(page.day_number) === Number(nextDayNumber)
  );
  if (hasDayConflict) {
    throw new Error("Another page already uses that day number");
  }

  const updatedPage = {
    ...currentPage,
    day_number: nextDayNumber,
    title:
      updates.title !== undefined
        ? updates.title?.trim() || currentPage.title
        : currentPage.title,
    subtitle:
      updates.subtitle !== undefined
        ? updates.subtitle?.trim() || null
        : currentPage.subtitle,
    music_url:
      updates.music_url !== undefined
        ? updates.music_url?.trim() || null
        : currentPage.music_url,
    is_locked:
      updates.is_locked !== undefined
        ? Boolean(updates.is_locked)
        : currentPage.is_locked,
    updated_at: nowIso(),
  };

  store.pages[pageIndex] = updatedPage;
  store.pages.sort(sortByDay);
  return clone(decoratePage(updatedPage, store.photos));
}

export function deletePage(id) {
  const store = ensureInitialized();
  const numericId = toNumber(id, "page id");
  const originalLength = store.pages.length;
  store.pages = store.pages.filter((page) => Number(page.id) !== numericId);
  if (store.pages.length === originalLength) return false;
  store.photos = store.photos.filter((photo) => Number(photo.page_id) !== numericId);
  return true;
}

export function listPhotosForPage(pageId) {
  const store = ensureInitialized();
  const numericPageId = toNumber(pageId, "page id");
  const photos = store.photos
    .filter((photo) => Number(photo.page_id) === numericPageId)
    .sort(sortPhotos);
  return clone(photos);
}

export function createPhoto(input) {
  const store = ensureInitialized();
  const pageId = toNumber(input.page_id, "page id");
  const page = store.pages.find((candidate) => Number(candidate.id) === pageId);
  if (!page) {
    throw new Error("Page not found");
  }
  const photoUrl = input.photo_url?.trim();
  if (!photoUrl) {
    throw new Error("Photo URL is required");
  }

  let displayOrder;
  if (input.display_order === undefined || input.display_order === null) {
    const existingOrders = store.photos
      .filter((photo) => Number(photo.page_id) === pageId)
      .map((photo) => Number(photo.display_order));
    displayOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
  } else {
    displayOrder = toNumber(input.display_order, "display order");
  }

  if (displayOrder === 0) {
    store.photos = store.photos.map((photo) => {
      if (Number(photo.page_id) !== pageId) return photo;
      return {
        ...photo,
        display_order: Number(photo.display_order) + 1,
        updated_at: nowIso(),
      };
    });
  }

  const newPhoto = {
    id: store.nextPhotoId++,
    page_id: pageId,
    photo_url: photoUrl,
    caption: input.caption?.trim() || null,
    display_date: normalizeDisplayDate(input.display_date),
    display_order: displayOrder,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  store.photos.push(newPhoto);
  return clone(newPhoto);
}

export function updatePhoto(id, updates) {
  const store = ensureInitialized();
  const photoId = toNumber(id, "photo id");
  const index = store.photos.findIndex((photo) => Number(photo.id) === photoId);
  if (index === -1) return null;

  const current = store.photos[index];
  const updatesWithOrder =
    updates.display_order !== undefined
      ? { ...updates, display_order: toNumber(updates.display_order, "display order") }
      : updates;

  if (updatesWithOrder.display_order === 0) {
    store.photos = store.photos.map((photo) => {
      if (Number(photo.page_id) !== Number(current.page_id)) return photo;
      if (Number(photo.id) === photoId) return photo;
      return {
        ...photo,
        display_order: Number(photo.display_order) + 1,
        updated_at: nowIso(),
      };
    });
  }

  const nextPhoto = {
    ...current,
    caption:
      updatesWithOrder.caption !== undefined
        ? updatesWithOrder.caption?.trim() || null
        : current.caption,
    display_date:
      updatesWithOrder.display_date !== undefined
        ? normalizeDisplayDate(updatesWithOrder.display_date)
        : current.display_date || null,
    display_order:
      updatesWithOrder.display_order !== undefined
        ? updatesWithOrder.display_order
        : current.display_order,
    photo_url:
      updatesWithOrder.photo_url !== undefined
        ? updatesWithOrder.photo_url?.trim() || current.photo_url
        : current.photo_url,
    updated_at: nowIso(),
  };

  store.photos[index] = nextPhoto;
  return clone(nextPhoto);
}

export function deletePhoto(id) {
  const store = ensureInitialized();
  const numericId = toNumber(id, "photo id");
  const originalLength = store.photos.length;
  store.photos = store.photos.filter((photo) => Number(photo.id) !== numericId);
  return store.photos.length < originalLength;
}
