import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig, firebasePaths } from "./firebase-config.js";

const byId = (id) => document.getElementById(id);

const config = {
  guestName: "Guest",
  trip: "Luxury Ride",
  mode: "executive",
  chauffeurName: "Ayo",
  vehicleName: "Chevrolet Suburban",
  welcomeNote: "Your STYL luxury experience is ready.",
  scrollingMessage: "",
  executiveMusicUrl: "https://www.youtube.com/embed/videoseries?list=PL8F6B0753B2CCA128&enablejsapi=1&rel=0",
  vibeMusicUrl: "https://www.youtube.com/embed/videoseries?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI&enablejsapi=1&rel=0",
  partyMusicUrl: "https://www.youtube.com/embed/videoseries?list=PLFgquLnL59amEA53azfP6qWD5F3eVQfmx&enablejsapi=1&rel=0",
  rnb80sMusicUrl: "https://www.youtube.com/embed/3Fm8tKhqYx0?enablejsapi=1&rel=0",
  afrobeatsMusicUrl: "https://www.youtube.com/embed/videoseries?list=PL64A9CBCC4F3BA5B2&enablejsapi=1&rel=0",
  spotifyMusicUrl: "",
  spotifyRiderUrl: "https://demarksinvestment-hash.github.io/Youtube_elitefix/request.html",
  musicRequestUrl: "https://demarksinvestment-hash.github.io/Youtube_elitefix/request.html",
  spotifySyncEnabled: true,
  spotifySyncIntervalSeconds: 25,
  youtubeApiKey: "",
  youtubePanelQuery: "",
  youtubePanelVideoId: "",
  requestQueue: [],
  bookingUrl: "https://stylblackcar.com/",
  vipFormUrl: "https://stylblackcar.com/contact/",
  youtubeLoungeUrl: "https://www.youtube.com/embed/jfKfPfyJRdk?enablejsapi=1&rel=0",
  newsUrl: "https://www.youtube.com/embed/lHxuE0Qf7sg?enablejsapi=1&rel=0",
  sportsUrl: "https://www.youtube.com/embed/9Tce7rnobzA?enablejsapi=1&rel=0",
  newsLiveOverride: "",
  sportsLiveOverride: "",
  remoteCommand: "",
  musicModes: {
    executive: {
      title: "Executive Mode",
      description: "Smooth jazz, neo-soul, and refined lounge vibes for executive rides.",
      embedUrl: "https://www.youtube.com/embed/videoseries?list=PL8F6B0753B2CCA128&enablejsapi=1&rel=0"
    },
    vibe: {
      title: "Vibe Mode",
      description: "Afrobeats, R&B, and chill global sounds for everyday luxury rides.",
      embedUrl: "https://www.youtube.com/embed/videoseries?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI&enablejsapi=1&rel=0"
    },
    party: {
      title: "Party Mode",
      description: "Hip hop, afrobeats hits, and high-energy mixes for nightlife and group rides.",
      embedUrl: "https://www.youtube.com/embed/videoseries?list=PLFgquLnL59amEA53azfP6qWD5F3eVQfmx&enablejsapi=1&rel=0"
    },
    rnb80s: {
      title: "R&B 80s",
      description: "Classic 80s R&B for timeless luxury rides.",
      embedUrl: "https://www.youtube.com/embed/3Fm8tKhqYx0?enablejsapi=1&rel=0"
    },
    afrobeats: {
      title: "Afrobeats",
      description: "Afrobeats favorites for an energetic global vibe.",
      embedUrl: "https://www.youtube.com/embed/videoseries?list=PL64A9CBCC4F3BA5B2&enablejsapi=1&rel=0"
    },
    spotify: {
      title: "Play Your Own Music",
      description: "Scan the QR code to request your favorite song.",
      embedUrl: ""
    }
  },
  weatherFallback: { temp: "--", icon: "☀️", text: "Weather unavailable" }
};

const viewNames = ["home","youtube","news","sports","music","vip","book"];
const views = Object.fromEntries(viewNames.map(name => [name, byId(name + "View")]));
let currentView = "home";
let currentMusicMode = "executive";
let requestQueue = [];
let requestQueueIndex = 0;
let requestQueueActive = false;
let requestQueueContinuous = false;
let requestQueueSignature = "";
let musicPlaylistQueue = [];
let musicPlaylistIndex = 0;
let musicPlaylistActive = false;
let musicPlaylistTimer = null;
let currentStylPlaylistKey = "executive";
let requestQueueTimer = null;
let localAutoQueueEnabled = true;
let localRequestQueueSeenKeys = new Set();
let localRequestQueueStarted = false;
let localRequestsRef = null;
const requestQueueFallbackSeconds = 240;
const requestQueueMinSeconds = 75;
const requestQueueMaxSeconds = 720;
const requestQueuePaddingSeconds = 8;
let spotifySyncTimer = null;
let suppressRemoteCommand = false;
let suppressBroadcast = false;
let dbRef = null;


async function broadcastRemoteCommand(command, extra = {}) {
  if (!dbRef || suppressBroadcast) return;
  try {
    await update(dbRef, { remoteCommand: command, updatedAt: new Date().toISOString(), ...extra });
  } catch (e) {
    console.error("Broadcast command failed", e);
  }
}



function applyEndTripUpsellContent() {
  const upsell = config.endTripUpsell || {};
  const headline = upsell.headline || "Thanks for riding with STYL";
  const body = upsell.body || "Enjoy $15 off your next ride.";
  const promo = upsell.promo || "SPECIAL10";
  const badge = upsell.badge || "VIP OFFER UNLOCKED";
  const buttonText = upsell.buttonText || "Book Your Next Ride";
  const buttonLink = upsell.buttonLink || `https://stylblackcar.com/?promo=${encodeURIComponent(promo)}&source=end_trip_offer`;
  const theme = upsell.theme || "gold";

  const overlay = byId("endTripOverlay");
  if (overlay) {
    overlay.classList.remove("theme-gold", "theme-blackgold", "theme-vip");
    overlay.classList.add(`theme-${theme}`);
  }

  const setText = (id, text) => {
    const el = byId(id);
    if (el) el.textContent = text;
  };

  setText("endTripHeadline", headline);
  setText("endTripBody", body);
  setText("endTripPromo", promo);
  setText("endTripBadge", badge);
  setText("endTripButtonText", buttonText);

  const link = byId("endTripBookBtn");
  if (link) link.href = buttonLink;
}


function showEndTripOverlay() {
  applyEndTripUpsellContent();
  const overlay = byId("endTripOverlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  overlay.classList.add("show");
  const seconds = Number(config.endTripUpsell?.duration || 30);
  clearTimeout(window.__stylEndTripTimer);
  window.__stylEndTripTimer = setTimeout(hideEndTripOverlay, Math.max(8, seconds) * 1000);
}

function hideEndTripOverlay() {
  const overlay = byId("endTripOverlay");
  if (!overlay) return;
  overlay.classList.remove("show");
  setTimeout(() => overlay.classList.add("hidden"), 400);
}

function initEndTripOverlay() {
  byId("endTripCloseBtn")?.addEventListener("click", hideEndTripOverlay);
}


function refreshMusicModeUrls() {
  if (!config.musicModes) return;
  if (config.musicModes.executive) config.musicModes.executive.embedUrl = config.executiveMusicUrl;
  if (config.musicModes.vibe) config.musicModes.vibe.embedUrl = config.vibeMusicUrl;
  if (config.musicModes.party) config.musicModes.party.embedUrl = config.partyMusicUrl;
  if (config.musicModes.rnb80s) config.musicModes.rnb80s.embedUrl = config.rnb80sMusicUrl;
  if (config.musicModes.afrobeats) config.musicModes.afrobeats.embedUrl = config.afrobeatsMusicUrl;
  if (config.musicModes.spotify) config.musicModes.spotify.embedUrl = "";
}

function isSpotifyUrl(url) {
  return typeof url === "string" && url.includes("open.spotify.com/embed");
}

function forceAutoplay(url) {
  if (!url) return url;
  if (isSpotifyUrl(url)) return url;
  let finalUrl = url;
  if (!/autoplay=1/.test(finalUrl)) finalUrl += (finalUrl.includes("?") ? "&" : "?") + "autoplay=1";
  if (!/mute=1/.test(finalUrl)) finalUrl += "&mute=1";
  if (!/enablejsapi=1/.test(finalUrl)) finalUrl += "&enablejsapi=1";
  if (!/rel=0/.test(finalUrl)) finalUrl += "&rel=0";
  return finalUrl;
}

function safeEmbed(url) {
  if (!url) return url;
  if (isSpotifyUrl(url)) return url;
  let finalUrl = url;
  if (!/enablejsapi=1/.test(finalUrl)) finalUrl += (finalUrl.includes("?") ? "&" : "?") + "enablejsapi=1";
  if (!/rel=0/.test(finalUrl)) finalUrl += "&rel=0";
  finalUrl = finalUrl.replace(/([?&])autoplay=1/g, "$1").replace(/[?&]mute=1/g, "");
  finalUrl = finalUrl.replace(/[?&]{2,}/g, "&").replace(/\?&/, "?").replace(/[?&]$/, "");
  return finalUrl;
}

function playerCommand(frameId, func, args = []) {
  const frame = byId(frameId);
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  } catch (e) {}
}

function stopAllPlayers() {
  if (typeof hideAllTapForSoundOverlays === 'function') hideAllTapForSoundOverlays();
  stopSpotifyLiveSync();
  ["youtubeFrame","newsFrame","sportsFrame","musicFrame","splitPrimaryFrame","splitSecondaryFrame"].forEach((id) => {
    playerCommand(id, "pauseVideo");
    playerCommand(id, "mute");
  });
}

function tryAutoSound(frameId, delay = 1400) {
  setTimeout(() => {
    playerCommand(frameId, "playVideo");
    playerCommand(frameId, "unMute");
    playerCommand(frameId, "setVolume", [100]);
  }, delay);
}

function resolveNewsUrl() {
  return (config.newsLiveOverride || "").trim() || config.newsUrl;
}
function resolveSportsUrl() {
  return (config.sportsLiveOverride || "").trim() || config.sportsUrl;
}

const liveMediaCache = {
  news: { videoId: "", ts: 0 },
  sports: { videoId: "", ts: 0 }
};

const liveMediaQueries = {
  news: [
    "ABC News Live",
    "NBC News NOW Live",
    "CBS News Live",
    "Bloomberg Live",
    "Fox Weather Live",
    "WFAA Dallas Live"
  ],
  sports: [
    "CBS Sports HQ live",
    "sports news live",
    "ESPN sports news live",
    "Fox Sports live",
    "live sports highlights",
    "NBA news live"
  ]
};

function getLiveMediaFallback(kind) {
  return kind === "sports" ? resolveSportsUrl() : resolveNewsUrl();
}

function getLiveMediaCacheKey(kind) {
  return `stylLiveMedia_${kind}`;
}

function readStoredLiveMedia(kind) {
  try {
    const raw = localStorage.getItem(getLiveMediaCacheKey(kind));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.videoId || !data?.ts) return null;
    if (Date.now() - Number(data.ts) > 6 * 60 * 1000) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function storeLiveMedia(kind, videoId) {
  const data = { videoId, ts: Date.now() };
  liveMediaCache[kind] = data;
  try {
    localStorage.setItem(getLiveMediaCacheKey(kind), JSON.stringify(data));
  } catch (e) {}
  return data;
}

async function findLiveMediaVideoId(kind = "news") {
  const cached = liveMediaCache[kind];
  if (cached?.videoId && Date.now() - cached.ts < 6 * 60 * 1000) return cached.videoId;

  const stored = readStoredLiveMedia(kind);
  if (stored?.videoId) {
    liveMediaCache[kind] = stored;
    return stored.videoId;
  }

  if (!config.youtubeApiKey) return "";

  const queries = liveMediaQueries[kind] || liveMediaQueries.news;

  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&maxResults=1&safeSearch=moderate&q=${encodeURIComponent(query)}&key=${encodeURIComponent(config.youtubeApiKey)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const videoId = json.items?.[0]?.id?.videoId || "";
      if (videoId) {
        storeLiveMedia(kind, videoId);
        return videoId;
      }
    } catch (e) {
      console.warn("Live media search failed", kind, query, e);
    }
  }

  return "";
}

async function loadLiveMediaFrame(kind = "news") {
  const frame = byId(kind === "sports" ? "sportsFrame" : "newsFrame");
  if (!frame) return;

  const fallback = getLiveMediaFallback(kind);

  // Respect admin manual override first.
  if (kind === "news" && (config.newsLiveOverride || "").trim()) {
    frame.src = forceAutoplay(resolveNewsUrl());
    return;
  }
  if (kind === "sports" && (config.sportsLiveOverride || "").trim()) {
    frame.src = forceAutoplay(resolveSportsUrl());
    return;
  }

  const videoId = await findLiveMediaVideoId(kind);
  if (videoId) {
    frame.src = buildYouTubeVideoUrl(videoId);
  } else {
    frame.src = forceAutoplay(fallback);
  }
}


function updateMediaMode(name) {
  const frame = document.querySelector(".frame");
  if (!frame) return;
  const mediaViews = ["youtube","news","sports","music","book","vip"];
  frame.classList.toggle("media-mode", mediaViews.includes(name));
}

function setActiveTab(id) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  const tab = byId(id);
  if (tab) tab.classList.add("active");
}

function afterViewAudioKick(name) {
  if (name === "youtube") {
    const f = byId("youtubeFrame");
    if (f) f.src = forceAutoplay(config.youtubeLoungeUrl);
    tryAutoSound("youtubeFrame");
    showActiveSoundOverlay();
  } else if (name === "news") {
    const f = byId("newsFrame");
    if (f) f.src = forceAutoplay(resolveNewsUrl());
    loadLiveMediaFrame("news");
    tryAutoSound("newsFrame");
    showActiveSoundOverlay();
  } else if (name === "sports") {
    const f = byId("sportsFrame");
    if (f) f.src = forceAutoplay(resolveSportsUrl());
    loadLiveMediaFrame("sports");
    tryAutoSound("sportsFrame");
    showActiveSoundOverlay();
  } else if (name === "music") {
    const f = byId("musicFrame");
    if (f) f.src = forceAutoplay(config.musicModes[currentMusicMode].embedUrl);
    tryAutoSound("musicFrame");
    showActiveSoundOverlay();
  }
}

function showView(name, title, tabId, subtitle = "Everything opens inside the dashboard.") {
  if (name !== "youtube") exitCinematicMode();

  Object.values(views).forEach(v => v && v.classList.remove("active"));
  if (views[name]) views[name].classList.add("active");
  currentView = name;
  if (byId("panelTitle")) byId("panelTitle").textContent = title;
  if (byId("panelSubtitle")) byId("panelSubtitle").textContent = subtitle;
  if (tabId && tabId !== "vipBtn") setActiveTab(tabId);
  updateMediaMode(name);
  stopAllPlayers();
  afterViewAudioKick(name);
}


function setSpotifySyncStatus(text) {
  const el = byId("spotifySyncStatus");
  if (el) el.textContent = text;
}

function updateSpotifyRiderPanel() {
  const panel = byId("spotifyRiderPanel");
  const qr = byId("spotifyRiderQr");
  const link = byId("spotifyRiderLink");
  if (!panel || !qr || !link) return;

  const isPlayYourOwnMusic = currentMusicMode === "spotify";
  panel.classList.toggle("hidden", !isPlayYourOwnMusic);
  byId("musicContentLayout")?.classList.toggle("spotify-visible", isPlayYourOwnMusic);

  const riderUrl = config.musicRequestUrl || config.spotifyRiderUrl || "https://demarksinvestment-hash.github.io/Youtube_elitefix/request.html";
  link.href = riderUrl;
  link.textContent = "Request Your Music";
  qr.alt = "Scan to request your music";
  qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(riderUrl);

  setSpotifySyncStatus(isPlayYourOwnMusic ? "Request QR Ready" : "Live Playlist Sync: Ready");
}

function refreshSpotifyFrameForLiveSync() {
  return;
}

function startSpotifyLiveSync() {
  return;
}

function stopSpotifyLiveSync() {
  if (spotifySyncTimer) {
    clearInterval(spotifySyncTimer);
    spotifySyncTimer = null;
  }
  if (currentMusicMode !== "spotify") setSpotifySyncStatus("Live Playlist Sync: Ready");
}


const youtubePanelSuggestionsList = [
  "afrobeats latest hits",
  "Burna Boy Last Last",
  "Wizkid Essence",
  "Rema Calm Down",
  "Davido Unavailable",
  "smooth jazz lounge music",
  "Kenny G greatest hits",
  "R&B 80s classics",
  "Sade No Ordinary Love",
  "Anita Baker Sweet Love",
  "movie trailers 2026",
  "latest action movie trailers",
  "NBA highlights today"
];

function buildYouTubeVideoUrl(videoId) {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`;
}

function buildYouTubeFallbackUrl(query) {
  const q = encodeURIComponent(String(query || "").trim() || "smooth jazz lounge music");
  return `https://www.youtube.com/embed?listType=search&list=${q}&autoplay=1&rel=0`;
}

function extractYouTubeVideoId(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?[^#]*v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return "";
}

function setYouTubePanelStatus(text) {
  const el = byId("youtubePanelStatus");
  if (el) el.textContent = text;
}

function clearYouTubePanelResults() {
  const results = byId("youtubePanelResults");
  const suggestions = byId("youtubePanelSuggestions");
  if (results) {
    results.classList.add("hidden");
    results.innerHTML = "";
  }
  if (suggestions) {
    suggestions.classList.add("hidden");
    suggestions.innerHTML = "";
  }
}

function getYouTubePanelFrame() {
  return byId("youtubeFrame") || byId("musicFrame");
}



function sendYouTubePlayerCommand(func, args = []) {
  const frame = byId("youtubeFrame");
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  } catch (err) {
    console.warn("YouTube command failed", err);
  }
}


function getActiveMediaFrameId() {
  if (currentView === "youtube") return "youtubeFrame";
  if (currentView === "news") return "newsFrame";
  if (currentView === "sports") return "sportsFrame";
  if (currentView === "music") return "musicFrame";
  return "youtubeFrame";
}

function getSoundOverlayIdForFrame(frameId) {
  if (frameId === "youtubeFrame") return "tapForSoundBtn";
  if (frameId === "newsFrame") return "tapForSoundNewsBtn";
  if (frameId === "sportsFrame") return "tapForSoundSportsBtn";
  if (frameId === "musicFrame") return "tapForSoundMusicBtn";
  return "tapForSoundBtn";
}

function sendPlayerCommandToFrame(frameId, func, args = []) {
  const frame = byId(frameId);
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  } catch (err) {
    console.warn("Player command failed", err);
  }
}

function showTapForSoundOverlayForFrame(frameId, show = true) {
  const btn = byId(getSoundOverlayIdForFrame(frameId));
  if (btn) btn.classList.toggle("hidden", !show);
}

function hideAllTapForSoundOverlays() {
  ["tapForSoundBtn","tapForSoundNewsBtn","tapForSoundSportsBtn","tapForSoundMusicBtn"].forEach(id => {
    const btn = byId(id);
    if (btn) btn.classList.add("hidden");
  });
}

function unmuteFrame(frameId) {
  sendPlayerCommandToFrame(frameId, "unMute");
  sendPlayerCommandToFrame(frameId, "setVolume", [100]);
  showTapForSoundOverlayForFrame(frameId, false);
}

function unmuteActiveMediaPlayer() {
  unmuteFrame(getActiveMediaFrameId());
}

function showActiveSoundOverlay() {
  const frameId = getActiveMediaFrameId();
  if (frameId === "musicFrame" && isSpotifyUrl(config.musicModes[currentMusicMode]?.embedUrl || "")) return;
  hideAllTapForSoundOverlays();
  showTapForSoundOverlayForFrame(frameId, true);
}

function showTapForSoundOverlay(show = true) {
  const btn = byId("tapForSoundBtn");
  if (btn) btn.classList.toggle("hidden", !show);
}

function unmuteYouTubePlayer() {
  unmuteActiveMediaPlayer();
}


function playFrameWithSound(frameId) {
  sendPlayerCommandToFrame(frameId, "playVideo");
  sendPlayerCommandToFrame(frameId, "unMute");
  sendPlayerCommandToFrame(frameId, "setVolume", [100]);

  setTimeout(() => {
    sendPlayerCommandToFrame(frameId, "playVideo");
    sendPlayerCommandToFrame(frameId, "unMute");
    sendPlayerCommandToFrame(frameId, "setVolume", [100]);
  }, 900);

  setTimeout(() => {
    sendPlayerCommandToFrame(frameId, "playVideo");
    sendPlayerCommandToFrame(frameId, "unMute");
    sendPlayerCommandToFrame(frameId, "setVolume", [100]);
  }, 2200);

  showTapForSoundOverlayForFrame(frameId, false);
}

function playAndUnmuteActiveMediaPlayer() {
  playFrameWithSound(getActiveMediaFrameId());
}

function initTapForSoundOverlay() {
  [
    ["tapForSoundBtn", "youtubeFrame"],
    ["tapForSoundNewsBtn", "newsFrame"],
    ["tapForSoundSportsBtn", "sportsFrame"],
    ["tapForSoundMusicBtn", "musicFrame"]
  ].forEach(([buttonId, frameId]) => {
    byId(buttonId)?.addEventListener("click", () => playFrameWithSound(frameId));
  });
}

function enterCinematicMode() {
  const view = byId("youtubeView");
  const panel = byId("youtubeSearchPanel");
  const btn = byId("cinematicExitBtn");

  if (view) view.classList.add("cinematic-mode");
  if (panel) panel.classList.add("cinematic-hidden");
  if (btn) btn.classList.add("show");
}

function exitCinematicMode() {
  showTapForSoundOverlay(false);
  const view = byId("youtubeView");
  const panel = byId("youtubeSearchPanel");
  const btn = byId("cinematicExitBtn");

  if (view) view.classList.remove("cinematic-mode");
  if (panel) panel.classList.remove("cinematic-hidden");
  if (btn) btn.classList.remove("show");
}

function initCinematicMode() {
  byId("cinematicExitBtn")?.addEventListener("click", () => {
    exitCinematicMode();
    const input = byId("youtubePanelInput");
    if (input) setTimeout(() => input.focus(), 150);
  });
}

function playYouTubePanelVideo(videoId) {
  if (!videoId) return;
  const frame = getYouTubePanelFrame();
  const url = buildYouTubeVideoUrl(videoId);
  if (frame) {
    frame.src = "about:blank";
    setTimeout(() => { frame.src = url; }, 120);
  }
  setYouTubePanelStatus("Playing selected YouTube video.");
  showTapForSoundOverlay(true);
  enterCinematicMode();
  attachYouTubeQueueApi();
  if (requestQueueActive) scheduleSmartQueueTimer(videoId);
}

function renderYouTubePanelSuggestions(query) {
  const box = byId("youtubePanelSuggestions");
  if (!box) return;
  const q = String(query || "").trim().toLowerCase();

  if (!q) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  const matches = youtubePanelSuggestionsList
    .filter(item => item.toLowerCase().includes(q))
    .slice(0, 5);
  const items = matches.length ? matches : [query];

  box.innerHTML = items.map(item => `<button type="button" class="youtube-panel-suggestion" data-query="${String(item).replace(/"/g, '&quot;')}">${item}</button>`).join("");
  box.classList.remove("hidden");

  box.querySelectorAll(".youtube-panel-suggestion").forEach(btn => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.query || btn.textContent || "";
      const input = byId("youtubePanelInput");
      if (input) input.value = value;
      box.classList.add("hidden");
      searchYouTubePanel(value);
    });
  });
}

function renderYouTubePanelResults(items = []) {
  const box = byId("youtubePanelResults");
  if (!box) return;

  if (!items.length) {
    box.innerHTML = `<div class="youtube-panel-empty">No results found. Try another search.</div>`;
    box.classList.remove("hidden");
    return;
  }

  box.innerHTML = items.map(item => {
    const videoId = item?.id?.videoId || "";
    const title = item?.snippet?.title || "YouTube video";
    const channel = item?.snippet?.channelTitle || "";
    const thumb = item?.snippet?.thumbnails?.default?.url || "";
    return `<button type="button" class="youtube-panel-result" data-video-id="${videoId}">
      ${thumb ? `<img src="${thumb}" alt="" />` : ""}
      <span><strong>${title}</strong><small>${channel}</small></span>
    </button>`;
  }).join("");

  box.classList.remove("hidden");

  box.querySelectorAll(".youtube-panel-result").forEach(btn => {
    btn.addEventListener("click", () => playYouTubePanelVideo(btn.dataset.videoId || ""));
  });
}

async function searchYouTubePanel(query, autoPlayFirst = false) {
  const searchQuery = String(query || byId("youtubePanelInput")?.value || "").trim();

  if (!searchQuery) {
    setYouTubePanelStatus("Type a song, artist, video, or trailer first.");
    return;
  }

  const directId = extractYouTubeVideoId(searchQuery);
  if (directId) {
    playYouTubePanelVideo(directId);
    return;
  }

  if (!config.youtubeApiKey) {
    const frame = getYouTubePanelFrame();
    if (frame) frame.src = buildYouTubeFallbackUrl(searchQuery);
    setYouTubePanelStatus("YouTube API key missing. Fallback search loaded in player.");
    if (requestQueueActive) startRequestQueueTimer(requestQueueFallbackSeconds);
    return;
  }

  try {
    setYouTubePanelStatus("Searching YouTube...");
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(searchQuery)}&key=${encodeURIComponent(config.youtubeApiKey)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`YouTube API error ${res.status}`);

    const json = await res.json();
    const items = json.items || [];
    renderYouTubePanelResults(items);
    if (autoPlayFirst && items[0]?.id?.videoId) {
      playYouTubePanelVideo(items[0].id.videoId);
      setYouTubePanelStatus("Playing first matching YouTube result.");
      return;
    }
    setYouTubePanelStatus(items.length ? "Select a result to play." : "No results found.");
  } catch (err) {
    console.error("YouTube panel search failed", err);
    const frame = getYouTubePanelFrame();
    if (frame) frame.src = buildYouTubeFallbackUrl(searchQuery);
    setYouTubePanelStatus("Search failed. Fallback search loaded in player.");
    if (requestQueueActive) startRequestQueueTimer(requestQueueFallbackSeconds);
  }
}


function postYouTubeCommand(frame, func, args = []) {
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  } catch (e) {}
}


function parseYouTubeDurationToSeconds(duration) {
  const match = String(duration || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return (hours * 3600) + (minutes * 60) + seconds;
}

async function getYouTubeVideoDurationSeconds(videoId) {
  if (!videoId || !config.youtubeApiKey) return 0;
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(config.youtubeApiKey)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube duration API error ${res.status}`);
    const json = await res.json();
    const duration = json.items?.[0]?.contentDetails?.duration || "";
    return parseYouTubeDurationToSeconds(duration);
  } catch (err) {
    console.error("Could not get YouTube duration", err);
    return 0;
  }
}

async function scheduleSmartQueueTimer(videoId) {
  if (!requestQueueActive) return;
  let seconds = await getYouTubeVideoDurationSeconds(videoId);

  if (!seconds) {
    startRequestQueueTimer(requestQueueFallbackSeconds);
    setYouTubePanelStatus(`Playing request queue ${requestQueueIndex + 1} of ${requestQueue.length} • Auto-next backup in about 4 min`);
    return;
  }

  seconds = Math.max(requestQueueMinSeconds, Math.min(requestQueueMaxSeconds, seconds + requestQueuePaddingSeconds));
  startRequestQueueTimer(seconds);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  setYouTubePanelStatus(`Playing request queue ${requestQueueIndex + 1} of ${requestQueue.length} • Next in ${display}`);
}


const stylSmartPlaylists = {
  executive: {
    title: "Executive",
    description: "Smooth jazz, lounge, and luxury executive ride music.",
    pool: ["Kenny G Songbird","Kenny G Forever In Love","Sade No Ordinary Love","Sade Smooth Operator","George Benson Give Me The Night","Boney James Sweet Thing","Grover Washington Jr Just The Two Of Us","David Sanborn The Dream","Najee Sweet Love","Norman Brown After The Storm","Kirk Whalum My All","Dave Koz Together Again","Brian Culbertson On My Mind","Gerald Albright Bermuda Nights","Peter White Midnight In Manhattan"]
  },
  vibe: {
    title: "Vibe",
    description: "Modern smooth R&B and relaxed city ride energy.",
    pool: ["Tems Free Mind","Wizkid Essence","Drake One Dance","Burna Boy For My Hand","H.E.R. Focus","Daniel Caesar Best Part","SZA Snooze","Brent Faiyaz All Mine","Giveon Heartbreak Anniversary","Chris Brown Under The Influence","Ella Mai Boo'd Up","Summer Walker Girls Need Love","Miguel Adorn","Frank Ocean Thinkin Bout You","Tyla Water"]
  },
  party: {
    title: "Party",
    description: "High-energy clean party mode for events and nightlife.",
    pool: ["Beyonce Cuff It","Usher Yeah","Bruno Mars 24K Magic","Rema Calm Down","Davido Unavailable","Burna Boy Last Last","Tyla Water","Chris Brown Go Crazy","Drake Nice For What","Black Eyed Peas I Gotta Feeling","Justin Timberlake Can't Stop The Feeling","Dua Lipa Levitating","Pharrell Happy","Sean Paul Temperature","Rihanna Please Don't Stop The Music"]
  },
  rnb80s: {
    title: "R&B 80s",
    description: "Classic R&B, soul, and throwback favorites.",
    pool: ["Anita Baker Sweet Love","Luther Vandross Never Too Much","Sade The Sweetest Taboo","Keith Sweat I Want Her","New Edition Can You Stand The Rain","Bobby Brown Every Little Step","Janet Jackson That's The Way Love Goes","Teddy Pendergrass Close The Door","The Isley Brothers Between The Sheets","Michael Jackson Human Nature","Freddie Jackson You Are My Lady","Babyface Whip Appeal","Guy Piece Of My Love","Troop All I Do Is Think Of You","Atlantic Starr Secret Lovers"]
  },
  afrobeats: {
    title: "Afrobeats",
    description: "Premium Afrobeats ride playlist.",
    pool: ["Rema Calm Down","Burna Boy Last Last","Wizkid Essence","Davido Unavailable","Asake Lonely At The Top","Ayra Starr Rush","CKay Love Nwantiti","Kizz Daniel Buga","Tyla Water","Fireboy DML Peru","Omah Lay Soso","Tekno Pana","P-Square Personally","Flavour Nwa Baby","Tiwa Savage Somebody's Son"]
  },
  spotify: {
    title: "Play Your Own Music",
    description: "Rider request inspiration and popular ride selections.",
    pool: ["Afrobeats latest hits","Smooth jazz lounge music","R&B 80s classics","Top clean party songs","Luxury lounge music","Kenny G greatest hits","Sade greatest hits","Wizkid Essence","Burna Boy Last Last","Rema Calm Down"]
  }
};

function shuffleSongs(pool = [], limit = 10) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(limit, copy.length));
}

function buildStylPlaylistQueue(key = currentStylPlaylistKey) {
  const list = stylSmartPlaylists[key] || stylSmartPlaylists.executive;
  return shuffleSongs(list.pool, 10).map(song => ({ query: song, label: song }));
}

function renderMusicPlaylistBrowser() {
  return;
}

function clearMusicPlaylistTimer() {
  if (musicPlaylistTimer) {
    clearTimeout(musicPlaylistTimer);
    musicPlaylistTimer = null;
  }
}

async function searchFirstYouTubeVideoId(query) {
  const directId = extractYouTubeVideoId(query);
  if (directId) return directId;
  if (!config.youtubeApiKey) return "";
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${encodeURIComponent(config.youtubeApiKey)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return "";
    const json = await res.json();
    return json.items?.[0]?.id?.videoId || "";
  } catch (e) {
    return "";
  }
}

async function playMusicPlaylistCurrent() {
  if (!musicPlaylistQueue.length) musicPlaylistQueue = buildStylPlaylistQueue(currentStylPlaylistKey);
  if (musicPlaylistIndex >= musicPlaylistQueue.length) {
    musicPlaylistQueue = buildStylPlaylistQueue(currentStylPlaylistKey);
    musicPlaylistIndex = 0;
  }

  const item = musicPlaylistQueue[musicPlaylistIndex];
  const frame = byId("musicFrame");
  if (!frame || !item) return;

  showView("music", "Play Music", "musicBtn");
  musicPlaylistActive = true;
  clearMusicPlaylistTimer();

  const videoId = await searchFirstYouTubeVideoId(item.query);
  if (videoId) {
    frame.src = "about:blank";
    setTimeout(() => { frame.src = buildYouTubeVideoUrl(videoId); }, 100);
    scheduleMusicPlaylistNext(videoId);
  } else {
    frame.src = buildYouTubeFallbackUrl(item.query);
    musicPlaylistTimer = setTimeout(playNextMusicPlaylistSong, requestQueueFallbackSeconds * 1000);
  }

  }

async function scheduleMusicPlaylistNext(videoId) {
  clearMusicPlaylistTimer();
  let seconds = await getYouTubeVideoDurationSeconds(videoId);
  if (!seconds) seconds = requestQueueFallbackSeconds;
  seconds = Math.max(75, Math.min(720, seconds + 8));
  musicPlaylistTimer = setTimeout(playNextMusicPlaylistSong, seconds * 1000);
}

function playNextMusicPlaylistSong() {
  if (!musicPlaylistActive) return;
  musicPlaylistIndex += 1;
  if (musicPlaylistIndex >= musicPlaylistQueue.length) {
    musicPlaylistQueue = buildStylPlaylistQueue(currentStylPlaylistKey);
    musicPlaylistIndex = 0;
  }
  playMusicPlaylistCurrent();
}

function pauseMusicPlaylistForRequests() {
  clearMusicPlaylistTimer();
}

function resumeMusicPlaylistAfterRequests() {
  if (musicPlaylistActive) {
    showView("music", "Play Music", "musicBtn");
    playMusicPlaylistCurrent();
  }
}


function getLocalRequestKey(item = {}) {
  return String(item.id || item.createdAt || item.link || `${item.title || ""}|${item.artist || ""}`).trim();
}

function buildLocalRequestQueueFromFirebase(data = {}) {
  return Object.entries(data || {})
    .map(([id, item]) => ({ id, ...(item || {}) }))
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
    .map((item) => {
      const title = String(item.title || "").trim();
      const artist = String(item.artist || "").trim();
      const query = `${title} ${artist}`.trim() || String(item.query || item.label || "").trim();
      const videoId = extractYouTubeVideoId(item.link || item.videoId || "");
      const label = `${title || item.label || "Requested song"}${artist ? " — " + artist : ""}`.trim();
      return {
        id: item.id,
        query,
        videoId,
        label,
        createdAt: item.createdAt || ""
      };
    })
    .filter(item => item.query || item.videoId || item.label);
}

function syncLocalAutoRequestQueue(data = {}) {
  if (!localAutoQueueEnabled) return;

  const incoming = buildLocalRequestQueueFromFirebase(data);
  const incomingKeys = new Set(incoming.map(getLocalRequestKey));

  // First load: mark existing requests as known and display them, but do not surprise-start old songs.
  if (!localRequestQueueStarted) {
    localRequestQueueStarted = true;
    localRequestQueueSeenKeys = incomingKeys;
    if (!requestQueue.length && incoming.length) {
      requestQueue = normalizeRequestQueue(incoming);
      requestQueueContinuous = true;
      requestQueueSignature = queueSignature(requestQueue);
      renderRequestQueuePanel();
      setYouTubePanelStatus("Auto request queue ready. New rider requests will play automatically.");
    }
    return;
  }

  const newItems = incoming.filter(item => !localRequestQueueSeenKeys.has(getLocalRequestKey(item)));
  localRequestQueueSeenKeys = incomingKeys;

  if (!newItems.length) {
    if (requestQueueContinuous && incoming.length) {
      const currentKey = requestQueue[requestQueueIndex] ? `${requestQueue[requestQueueIndex].videoId || ""}|${requestQueue[requestQueueIndex].query || ""}|${requestQueue[requestQueueIndex].label || ""}` : "";
      requestQueue = normalizeRequestQueue(incoming);
      const keepIndex = requestQueue.findIndex(item => `${item.videoId || ""}|${item.query || ""}|${item.label || ""}` === currentKey);
      if (keepIndex >= 0) requestQueueIndex = keepIndex;
      if (requestQueueIndex >= requestQueue.length) requestQueueIndex = Math.max(0, requestQueue.length - 1);
      requestQueueSignature = queueSignature(requestQueue);
      renderRequestQueuePanel();
    }
    return;
  }

  requestQueueContinuous = true;

  const existingKeys = new Set(requestQueue.map(item => `${item.videoId || ""}|${item.query || ""}|${item.label || ""}`));
  const appendItems = normalizeRequestQueue(newItems).filter(item => {
    const key = `${item.videoId || ""}|${item.query || ""}|${item.label || ""}`;
    return !existingKeys.has(key);
  });

  requestQueue = requestQueue.concat(appendItems);
  requestQueueSignature = queueSignature(requestQueue);
  renderRequestQueuePanel();

  if (!requestQueueActive) {
    if (requestQueueIndex >= requestQueue.length) requestQueueIndex = Math.max(0, requestQueue.length - appendItems.length);
    requestQueueActive = true;
    showView("youtube", "YouTube Lounge", "youtubeBtn");
    setYouTubePanelStatus("New rider request received. Starting auto queue.");
    setTimeout(playCurrentQueueItem, 350);
  } else {
    setYouTubePanelStatus(`New rider request added. Queue now has ${requestQueue.length} songs.`);
  }
}

function initLocalAutoRequestQueueEngine(db) {
  if (!db || localRequestsRef) return;
  localRequestsRef = ref(db, `${firebasePaths.collection}/musicRequests`);
  onValue(localRequestsRef, (snap) => {
    syncLocalAutoRequestQueue(snap.exists() ? (snap.val() || {}) : {});
  }, (err) => {
    console.error("Local auto request queue error", err);
  });
}

function normalizeRequestQueue(queue = []) {
  return (Array.isArray(queue) ? queue : [])
    .filter(item => item)
    .map((item, index) => ({
      query: String(item.query || "").trim(),
      videoId: String(item.videoId || "").trim(),
      label: String(item.label || item.query || item.videoId || `Request ${index + 1}`).trim(),
      pending: !(item.query || item.videoId)
    }));
}

function queueSignature(queue = []) {
  return normalizeRequestQueue(queue).map(item => `${item.videoId || ""}|${item.query || ""}|${item.label || ""}`).join("||");
}

function renderRequestQueuePanel() {
  const box = byId("youtubeQueuePanel");
  if (!box) return;

  if (!requestQueue.length) {
    box.innerHTML = `<div class="queue-title">STYL Request Queue</div><div class="queue-empty">No active rider requests yet.</div>`;
    return;
  }

  box.innerHTML = `
    <div class="queue-title">STYL Request Queue</div>
    <div class="queue-copy">${requestQueue.length} active request${requestQueue.length !== 1 ? "s" : ""} • ${requestQueueContinuous ? "Continuous play ON" : "Queue loaded"}</div>
    ${requestQueue.map((item, index) => `
      <button type="button" class="queue-item ${index === requestQueueIndex && requestQueueActive ? "active" : ""}" data-index="${index}">
        <span>${index + 1}. ${item.label || item.query || "Requested song"}</span>
        <small>${index === requestQueueIndex && requestQueueActive ? "Now playing" : (item.pending ? "Pending details" : "Tap to play")}</small>
      </button>
    `).join("")}
  `;

  box.querySelectorAll(".queue-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index || 0);
      if (Number.isFinite(index) && requestQueue[index]) {
        requestQueueIndex = index;
        requestQueueActive = true;
        pauseMusicPlaylistForRequests();
        showView("youtube", "YouTube Lounge", "youtubeBtn");
        playCurrentQueueItem();
      }
    });
  });
}

function updateContinuousRequestQueue(queue = []) {
  const nextQueue = normalizeRequestQueue(queue);
  requestQueueContinuous = true;

  if (!nextQueue.length) {
    requestQueue = [];
    requestQueueIndex = 0;
    requestQueueActive = false;
    requestQueueSignature = "";
    renderRequestQueuePanel();
    setYouTubePanelStatus("Continuous queue is on. Waiting for rider requests.");
    return;
  }

  const currentKey = requestQueue[requestQueueIndex] ? `${requestQueue[requestQueueIndex].videoId || ""}|${requestQueue[requestQueueIndex].query || ""}|${requestQueue[requestQueueIndex].label || ""}` : "";
  requestQueue = nextQueue;
  requestQueueSignature = queueSignature(requestQueue);
  const keepIndex = requestQueue.findIndex(item => `${item.videoId || ""}|${item.query || ""}|${item.label || ""}` === currentKey);
  if (keepIndex >= 0) requestQueueIndex = keepIndex;
  if (requestQueueIndex >= requestQueue.length) requestQueueIndex = Math.max(0, requestQueue.length - 1);
  renderRequestQueuePanel();

  if (!requestQueueActive) {
    requestQueueActive = true;
    if (requestQueueIndex >= requestQueue.length) requestQueueIndex = 0;
    showView("youtube", "YouTube Lounge", "youtubeBtn");
    setTimeout(playCurrentQueueItem, 350);
  } else {
    setYouTubePanelStatus(`Queue updated live: ${requestQueue.length} requests`);
  }
}

function startRequestQueue(queue = [], continuous = false) {
  requestQueue = normalizeRequestQueue(queue);
  requestQueueIndex = 0;
  requestQueueActive = requestQueue.length > 0;
  requestQueueContinuous = !!continuous;
  requestQueueSignature = queueSignature(requestQueue);
  renderRequestQueuePanel();

  if (!requestQueueActive) {
    setYouTubePanelStatus(requestQueueContinuous ? "Continuous queue is on. Waiting for rider requests." : "Queue is empty.");
    return;
  }

  pauseMusicPlaylistForRequests();
  showView("youtube", "YouTube Lounge", "youtubeBtn");
  setYouTubePanelStatus(`Playing request queue 1 of ${requestQueue.length}`);
  setTimeout(playCurrentQueueItem, 350);
}

async function resolveRequestQueueVideoId(item = {}) {
  if (item.videoId) return item.videoId;
  const q = item.query || item.label || "";
  const directId = extractYouTubeVideoId(q);
  if (directId) return directId;
  return await searchFirstYouTubeVideoId(q);
}

async function playCurrentQueueItem() {
  if (!requestQueueActive || !requestQueue.length) return;
  if (requestQueueIndex >= requestQueue.length) {
    if (requestQueueContinuous) {
      requestQueueActive = false;
      renderRequestQueuePanel();
      setYouTubePanelStatus("Queue finished. Waiting for new rider requests...");
      return;
    }
    requestQueueIndex = 0;
  }

  clearRequestQueueTimer();
  const item = requestQueue[requestQueueIndex] || {};
  showView("youtube", "YouTube Lounge", "youtubeBtn");
  setYouTubePanelStatus(`Loading request queue ${requestQueueIndex + 1} of ${requestQueue.length}: ${item.label || item.query || "Requested song"}`);

  const videoId = await resolveRequestQueueVideoId(item);
  if (videoId) {
    item.videoId = videoId;
    playYouTubePanelVideo(videoId);
    const duration = await getYouTubeVideoDurationSeconds(videoId);
    startRequestQueueTimer(duration ? Math.max(requestQueueMinSeconds, Math.min(requestQueueMaxSeconds, duration + requestQueuePaddingSeconds)) : requestQueueFallbackSeconds);
  } else {
    const frame = getYouTubePanelFrame();
    if (frame) frame.src = buildYouTubeFallbackUrl(item.query || item.label || "");
    setYouTubePanelStatus("Could not auto-select this request. Skipping to next soon. Check YouTube API key.");
    startRequestQueueTimer(45);
  }

  renderRequestQueuePanel();
}

function playNextQueueItem() {
  if (!requestQueueActive && !requestQueueContinuous) return;
  clearRequestQueueTimer();
  requestQueueIndex += 1;

  if (requestQueueIndex >= requestQueue.length) {
    if (requestQueueContinuous) {
      requestQueueActive = false;
      requestQueueIndex = requestQueue.length;
      renderRequestQueuePanel();
      setYouTubePanelStatus("Queue finished. Waiting for new rider requests...");
      resumeMusicPlaylistAfterRequests();
      return;
    }
    requestQueueActive = false;
    setYouTubePanelStatus("Request queue finished.");
    resumeMusicPlaylistAfterRequests();
    return;
  }

  requestQueueActive = true;
  setYouTubePanelStatus(`Next request: ${requestQueueIndex + 1} of ${requestQueue.length}`);
  playCurrentQueueItem();
}

function initYouTubeQueueListener() {
  window.addEventListener("message", (event) => {
    let data = event.data;
    try {
      if (typeof data === "string") data = JSON.parse(data);
    } catch (e) {
      return;
    }

    const playerState = data?.info?.playerState;
    if (requestQueueActive && playerState === 0) {
      clearRequestQueueTimer();
      setTimeout(playNextQueueItem, 900);
    } else if (musicPlaylistActive && currentView === "music" && playerState === 0) {
      clearMusicPlaylistTimer();
      setTimeout(playNextMusicPlaylistSong, 900);
    }
  });
}

function attachYouTubeQueueApi() {
  const frame = getYouTubePanelFrame();
  if (!frame) return;
  setTimeout(() => postYouTubeCommand(frame, "addEventListener", ["onStateChange"]), 1200);
}

function clearRequestQueueTimer() {
  if (requestQueueTimer) {
    clearTimeout(requestQueueTimer);
    requestQueueTimer = null;
  }
}

function startRequestQueueTimer(seconds = requestQueueFallbackSeconds) {
  clearRequestQueueTimer();
  if (!requestQueueActive) return;
  const safeSeconds = Math.max(30, Number(seconds || requestQueueFallbackSeconds));
  requestQueueTimer = setTimeout(() => {
    if (requestQueueActive) playNextQueueItem();
  }, safeSeconds * 1000);
}

function initYouTubeSearchPanel() {
  byId("youtubePanelSearchBtn")?.addEventListener("click", () => { exitCinematicMode(); searchYouTubePanel(); });
  byId("youtubePanelInput")?.addEventListener("input", (e) => renderYouTubePanelSuggestions(e.target.value));
  byId("youtubePanelInput")?.addEventListener("focus", (e) => renderYouTubePanelSuggestions(e.target.value));
  byId("youtubePanelInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchYouTubePanel();
  });
  byId("youtubePanelClearBtn")?.addEventListener("click", () => {
    const input = byId("youtubePanelInput");
    if (input) input.value = "";
    clearYouTubePanelResults();
    setYouTubePanelStatus("Ready.");
  });
}

function setMusicMode(key) {
  currentMusicMode = config.musicModes[key] ? key : "executive";
  const mode = config.musicModes[currentMusicMode];
  if (byId("musicModeTitle")) byId("musicModeTitle").textContent = mode.title;
  if (byId("musicModeCopy")) byId("musicModeCopy").textContent = mode.description;
  if (byId("musicFrame")) {
    if (currentMusicMode === "spotify") {
      byId("musicFrame").src = "about:blank";
    } else {
      byId("musicFrame").src = currentView === "music" ? forceAutoplay(mode.embedUrl) : safeEmbed(mode.embedUrl);
    }
  }
  document.querySelectorAll(".music-mode-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.musicMode === currentMusicMode));
  updateSpotifyRiderPanel();
  if (typeof renderMusicPlaylistBrowser === 'function')   stopSpotifyLiveSync();
  if (currentView === "music") {
    stopAllPlayers();
    afterViewAudioKick("music");
  }
}

function updateGreetingHighlight() {
  const el = byId("greetingHighlight");
  if (!el) return;
  const hour = new Date().getHours();
  let prefix = "Good evening";
  if (hour < 12) prefix = "Good morning";
  else if (hour < 18) prefix = "Good afternoon";
  const guest = config.guestName || "Guest";
  el.textContent = `${prefix} ${guest}`;
  el.classList.remove("entrance");
  void el.offsetWidth;
  el.classList.add("entrance");
}

function updateLuxuryScroll() {
  const el = byId("luxuryScrollText");
  if (!el) return;
  if (config.scrollingMessage && String(config.scrollingMessage).trim()) {
    el.textContent = String(config.scrollingMessage).trim();
    return;
  }
  const hour = new Date().getHours();
  let prefix = "Good evening";
  if (hour < 12) prefix = "Good morning";
  else if (hour < 18) prefix = "Good afternoon";
  const guest = config.guestName || "Guest";
  const chauffeur = config.chauffeurName || "Ayo";
  const segments = [
    `${prefix} ${guest}`,
    `Your STYL luxury experience is ready`,
    `${chauffeur} is your chauffeur today`,
    `Enjoy the ride in comfort and style`,
    `Join our VIP to receive exclusive discount offers`
  ];
  el.textContent = " • " + segments.join(" • ") + " • " + segments.join(" • ") + " • ";
}

function updateClock() {
  const now = new Date();
  if (byId("clockTime")) byId("clockTime").textContent = now.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
  if (byId("clockDate")) byId("clockDate").textContent = now.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"});
  let greeting = "Good evening";
  const hour = now.getHours();
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  if (byId("greetingText")) byId("greetingText").textContent = greeting;
  if (byId("greetingSub")) byId("greetingSub").textContent = config.welcomeNote;
  updateGreetingHighlight();
  updateLuxuryScroll();
}

function weatherCodeToText(code) {
  const map = {
    0:["Clear skies","☀️"],1:["Mostly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
    45:["Foggy","🌫️"],48:["Foggy","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],
    55:["Heavy drizzle","🌧️"],61:["Light rain","🌧️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
    71:["Light snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],80:["Rain showers","🌦️"],
    81:["Rain showers","🌦️"],82:["Heavy showers","⛈️"],95:["Thunderstorm","⛈️"]
  };
  return map[code] || ["Weather unavailable","☀️"];
}

function setWeatherDisplay(temp, icon, text) {
  if (byId("weatherTemp")) byId("weatherTemp").textContent = temp;
  if (byId("weatherIcon")) byId("weatherIcon").textContent = icon;
  if (byId("weatherText")) byId("weatherText").textContent = text;
}

async function fetchWeatherForPosition(lat, lon, locationName = "") {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
  const response = await fetch(url, { cache:"no-store" });
  const data = await response.json();
  const current = data.current || {};
  const [textBase, icon] = weatherCodeToText(current.weather_code);
  const tempText = current.temperature_2m == null ? "--" : `${Math.round(current.temperature_2m)}°F`;
  setWeatherDisplay(tempText, icon, locationName ? `${textBase} · ${locationName}` : textBase);
}

async function requestBrowserWeather() {
  try {
    if ("geolocation" in navigator) {
      const geo = await new Promise(resolve => navigator.geolocation.getCurrentPosition(
        pos => resolve({ok:true, lat:pos.coords.latitude, lon:pos.coords.longitude}),
        () => resolve({ok:false}),
        {enableHighAccuracy:false, timeout:10000, maximumAge:1800000}
      ));
      if (geo.ok) { await fetchWeatherForPosition(geo.lat, geo.lon); return; }
    }
    const geoResponse = await fetch("https://ipapi.co/json/", { cache:"no-store" });
    const geoData = await geoResponse.json();
    await fetchWeatherForPosition(geoData.latitude, geoData.longitude, geoData.city || "Dallas");
  } catch {
    setWeatherDisplay(config.weatherFallback.temp, config.weatherFallback.icon, config.weatherFallback.text);
  }
}

function applyProfile(data = {}) {
  Object.assign(config, data || {});
  refreshMusicModeUrls();

  if (byId("chauffeurName")) byId("chauffeurName").textContent = config.chauffeurName || "Ayo";
  if (byId("vehicleName")) byId("vehicleName").textContent = config.vehicleName || "Chevrolet Suburban";
  if (byId("driverCard")) byId("driverCard").textContent = config.chauffeurName || "Ayo";
  if (byId("vehicleCard")) byId("vehicleCard").textContent = config.vehicleName || "Chevrolet Suburban";
  if (byId("wifiName")) byId("wifiName").textContent = "stylblackcar";
  if (byId("wifiPassword")) byId("wifiPassword").textContent = "rideinluxury";
  if (byId("wifiCardName")) byId("wifiCardName").textContent = "stylblackcar";
  if (byId("wifiCardPass")) byId("wifiCardPass").textContent = "rideinluxury";

  if (byId("youtubeFrame")) byId("youtubeFrame").src = safeEmbed(config.youtubeLoungeUrl);
  if (byId("newsFrame")) byId("newsFrame").src = safeEmbed(resolveNewsUrl());
  if (byId("sportsFrame")) byId("sportsFrame").src = safeEmbed(resolveSportsUrl());
  if (byId("bookFrame")) byId("bookFrame").src = config.bookingUrl;
  if (byId("vipFrame")) byId("vipFrame").src = config.vipFormUrl;
  if (byId("splitPrimaryFrame")) byId("splitPrimaryFrame").src = safeEmbed(resolveNewsUrl());
  if (byId("splitSecondaryFrame")) byId("splitSecondaryFrame").src = safeEmbed(config.musicModes.executive.embedUrl);

  setMusicMode(config.mode || "executive");
  updateClock();

  if (!suppressRemoteCommand) {
    const cmd = String(config.remoteCommand || "").toLowerCase();
    suppressBroadcast = true;
    try {
      if (cmd === "news") showView("news", "Watch News", "newsBtn");
      else if (cmd === "sports") showView("sports", "Watch Sports", "sportsBtn");
      else if (cmd === "music") showView("music", "Play Music", "musicBtn");
      else if (cmd === "youtubepanel") { showView("youtube", "YouTube Lounge", "youtubeBtn"); searchYouTubePanel(config.youtubePanelQuery || "", true); }
      else if (cmd === "youtubequeue") { startRequestQueue(config.requestQueue || [], false); }
      else if (cmd === "youtubequeuecontinuous") { updateContinuousRequestQueue(config.requestQueue || []); }
      else if (cmd === "youtube") showView("youtube", "YouTube Lounge", "youtubeBtn");
      else if (cmd === "book") showView("book", "Book Next Ride", "bookBtn");
      else if (cmd === "vip") showView("vip", "Join Our VIP", "vipBtn", "Guests can register for exclusive discount offers.");
      else if (cmd === "unmute") { playAndUnmuteActiveMediaPlayer(); }
      else if (cmd === "endtrip") { showEndTripOverlay(); }
      else if (cmd === "previewupsell") { showEndTripOverlay(); }
      else if (cmd === "home") showView("home", "STYL Home", "homeBtn");
    } finally {
      setTimeout(() => { suppressBroadcast = false; }, 350);
    }
  }
}

function initFirebaseSync() {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const liveDoc = ref(db, `${firebasePaths.collection}/${firebasePaths.doc}`);
  dbRef = liveDoc;
  initLocalAutoRequestQueueEngine(db);
  onValue(liveDoc, (snap) => applyProfile(snap.exists() ? (snap.val() || {}) : {}), (err) => {
    console.error("Realtime sync error", err);
    applyProfile({});
  });
}

function initTabs() {
  const tabs = [
    ["homeBtn","home","STYL Home"],
    ["youtubeBtn","youtube","YouTube Lounge"],
    ["newsBtn","news","Watch News"],
    ["sportsBtn","sports","Watch Sports"],
    ["musicBtn","music","Play Music"],
    ["bookBtn","book","Book Next Ride"]
  ];
  tabs.forEach(([id, view, title]) => {
    const btn = byId(id);
    if (btn) btn.addEventListener("click", () => {
      showView(view, title, id);
      if (["home","youtube","news","sports","music"].includes(view)) {
        const extra = view === "music" ? { mode: currentMusicMode } : {};
        broadcastRemoteCommand(view, extra);
      }
    });
  });

  const vipBtn = byId("vipBtn");
  if (vipBtn) vipBtn.addEventListener("click", () => showView("vip", "Join Our VIP", "vipBtn", "Guests can register for exclusive discount offers."));

  const splitToggleBtn = byId("splitToggleBtn");
  if (splitToggleBtn) splitToggleBtn.addEventListener("click", () => byId("splitPanel")?.classList.remove("hidden"));

  const closeSplitBtn = byId("closeSplitBtn");
  if (closeSplitBtn) closeSplitBtn.addEventListener("click", () => byId("splitPanel")?.classList.add("hidden"));

  document.querySelectorAll(".music-mode-btn").forEach(btn => btn.addEventListener("click", () => {
    setMusicMode(btn.dataset.musicMode);
    if (currentView === "music") broadcastRemoteCommand("music", { mode: currentMusicMode });
  }));
}

function initSwipe() {
  const panel = byId("panelBody");
  if (!panel) return;
  let startX = 0, startY = 0;
  panel.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].clientX;
    startY = e.changedTouches[0].clientY;
  }, { passive:true });

  panel.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      const idx = viewNames.indexOf(currentView);
      const next = dx < 0 ? (idx + 1) % viewNames.length : (idx - 1 + viewNames.length) % viewNames.length;
      const map = {
        home:["STYL Home","homeBtn"],
        youtube:["YouTube Lounge","youtubeBtn"],
        news:["Watch News","newsBtn"],
        sports:["Watch Sports","sportsBtn"],
        music:["Play Music","musicBtn"],
        vip:["Join Our VIP","vipBtn"],
        book:["Book Next Ride","bookBtn"]
      };
      showView(viewNames[next], map[viewNames[next]][0], map[viewNames[next]][1]);
      if (["home","youtube","news","sports","music"].includes(viewNames[next])) {
        const extra = viewNames[next] === "music" ? { mode: currentMusicMode } : {};
        broadcastRemoteCommand(viewNames[next], extra);
      }
    }
  }, { passive:true });
}

window.addEventListener("load", () => {
  refreshMusicModeUrls();
  initTabs();
  initYouTubeSearchPanel();
  initCinematicMode();
  initTapForSoundOverlay();
  initYouTubeQueueListener();
    initSwipe();
  requestBrowserWeather();
  updateClock();
  setInterval(updateClock, 30000);
  setInterval(requestBrowserWeather, 1800000);
  showView("home", "STYL Home", "homeBtn");
  initFirebaseSync();

  const splash = byId("welcomeSplash");
  if (splash) {
    setTimeout(() => splash.classList.add("hide"), 1000);
    setTimeout(() => splash.classList.add("force-hide"), 1600);
    setTimeout(() => { splash.style.display = "none"; }, 2200);
  }
  setTimeout(() => {
    const splash2 = byId("welcomeSplash");
    if (splash2) {
      splash2.classList.add("force-hide");
      splash2.style.display = "none";
    }
  }, 3500);
});

console.log("LOCAL_AUTO_REQUEST_QUEUE_ENGINE_V1 loaded");

console.log("LIVE_NEWS_SPORTS_AUTOFINDER_V1 loaded");
