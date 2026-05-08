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
  spotifyMusicUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4UtSsGT1Sbe?utm_source=generator",
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
      title: "Spotify",
      description: "Let riders choose their own music on Spotify.",
      embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4UtSsGT1Sbe?utm_source=generator"
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
let requestQueueTimer = null;
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

function refreshMusicModeUrls() {
  if (!config.musicModes) return;
  if (config.musicModes.executive) config.musicModes.executive.embedUrl = config.executiveMusicUrl;
  if (config.musicModes.vibe) config.musicModes.vibe.embedUrl = config.vibeMusicUrl;
  if (config.musicModes.party) config.musicModes.party.embedUrl = config.partyMusicUrl;
  if (config.musicModes.rnb80s) config.musicModes.rnb80s.embedUrl = config.rnb80sMusicUrl;
  if (config.musicModes.afrobeats) config.musicModes.afrobeats.embedUrl = config.afrobeatsMusicUrl;
  if (config.musicModes.spotify) config.musicModes.spotify.embedUrl = config.spotifyMusicUrl;
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
    tryAutoSound("newsFrame");
    showActiveSoundOverlay();
  } else if (name === "sports") {
    const f = byId("sportsFrame");
    if (f) f.src = forceAutoplay(resolveSportsUrl());
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

  const isSpotify = currentMusicMode === "spotify";
  panel.classList.toggle("hidden", !isSpotify);
  byId("musicContentLayout")?.classList.toggle("spotify-visible", isSpotify);

  const riderUrl = config.musicRequestUrl || config.spotifyRiderUrl || "https://demarksinvestment-hash.github.io/Youtube_elitefix/request.html";
  link.href = riderUrl;
  qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(riderUrl);
}

function refreshSpotifyFrameForLiveSync() {
  if (currentMusicMode !== "spotify") return;
  const frame = byId("musicFrame");
  if (!frame) return;
  const mode = config.musicModes?.spotify;
  const url = mode?.embedUrl || config.spotifyMusicUrl;
  if (!url) return;
  frame.src = url;
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  setSpotifySyncStatus("Live Playlist Sync: refreshed at " + time);
}

function startSpotifyLiveSync() {
  stopSpotifyLiveSync();
  if (!config.spotifySyncEnabled || currentMusicMode !== "spotify") return;
  const interval = Math.max(15, Number(config.spotifySyncIntervalSeconds || 25)) * 1000;
  setSpotifySyncStatus("Live Playlist Sync: active");
  spotifySyncTimer = setInterval(refreshSpotifyFrameForLiveSync, interval);
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

function startRequestQueue(queue = []) {
  requestQueue = Array.isArray(queue) ? queue.filter(item => item && (item.query || item.videoId)) : [];
  requestQueueIndex = 0;
  requestQueueActive = requestQueue.length > 0;

  if (!requestQueueActive) {
    setYouTubePanelStatus("Queue is empty.");
    return;
  }

  showView("youtube", "YouTube Lounge", "youtubeBtn");
  setYouTubePanelStatus(`Playing request queue 1 of ${requestQueue.length}`);
  playCurrentQueueItem();
}

function playCurrentQueueItem() {
  if (!requestQueueActive || !requestQueue.length) return;
  clearRequestQueueTimer();
  const item = requestQueue[requestQueueIndex] || {};
  if (item.videoId) {
    playYouTubePanelVideo(item.videoId);
  } else {
    searchYouTubePanel(item.query || "", true);
  }
  setYouTubePanelStatus(`Playing request queue ${requestQueueIndex + 1} of ${requestQueue.length}`);
}

function playNextQueueItem() {
  if (!requestQueueActive) return;
  clearRequestQueueTimer();
  requestQueueIndex += 1;

  if (requestQueueIndex >= requestQueue.length) {
    requestQueueActive = false;
    setYouTubePanelStatus("Request queue finished.");
    return;
  }

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

    // YouTube iframe API sends infoDelivery with playerState 0 when video ends.
    const playerState = data?.info?.playerState;
    if (requestQueueActive && playerState === 0) {
      clearRequestQueueTimer();
      setTimeout(playNextQueueItem, 900);
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
    byId("musicFrame").src = currentView === "music" ? forceAutoplay(mode.embedUrl) : safeEmbed(mode.embedUrl);
  }
  document.querySelectorAll(".music-mode-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.musicMode === currentMusicMode));
  updateSpotifyRiderPanel();
  if (currentMusicMode === "spotify") startSpotifyLiveSync();
  else stopSpotifyLiveSync();
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
      else if (cmd === "youtubequeue") { startRequestQueue(config.requestQueue || []); }
      else if (cmd === "youtube") showView("youtube", "YouTube Lounge", "youtubeBtn");
      else if (cmd === "book") showView("book", "Book Next Ride", "bookBtn");
      else if (cmd === "vip") showView("vip", "Join Our VIP", "vipBtn", "Guests can register for exclusive discount offers.");
      else if (cmd === "unmute") { playAndUnmuteActiveMediaPlayer(); }
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
