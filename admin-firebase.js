import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig, firebasePaths } from "./firebase-config.js";

const byId = (id) => document.getElementById(id);
let db = null;
let liveDoc = null;
let requestsRef = null;
let bookingClicksRef = null;
let currentBookingClicksData = {};
let currentRequestItems = [];
let continuousQueueEnabled = false;

const defaults = {
  newsUrl: "https://www.youtube.com/embed/lHxuE0Qf7sg?autoplay=1&mute=1&enablejsapi=1&rel=0",
  sportsUrl: "https://www.youtube.com/embed/9Tce7rnobzA?autoplay=1&mute=1&enablejsapi=1&rel=0"
};

function setStatus(text) {
  if (byId("liveStatus")) byId("liveStatus").textContent = text;
}


function defaultLiveTvChannels() {
  return {
    news: [
      { label: "ABC News Live", query: "ABC News Live" },
      { label: "NBC News NOW", query: "NBC News NOW Live" },
      { label: "CBS News Live", query: "CBS News Live" },
      { label: "Bloomberg Live", query: "Bloomberg Live" },
      { label: "Fox Weather", query: "Fox Weather Live" },
      { label: "WFAA Dallas", query: "WFAA Dallas Live" },
      { label: "Local Dallas News", query: "Dallas local news live" }
    ],
    sports: [
      { label: "Yahoo Sports", query: "Yahoo Sports live" },
      { label: "CBS Sports HQ", query: "CBS Sports HQ live" },
      { label: "🏆 FIFA World Cup", query: "FIFA World Cup 2026 live" },
      { label: "🏆 FIFA Official", query: "FIFA official live" },
      { label: "⚽ Live Soccer", query: "FIFA live soccer" },
      { label: "⚽ FOX Soccer", query: "FOX Soccer live" },
      { label: "⚽ Telemundo Deportes", query: "Telemundo Deportes live" },
      { label: "⛳ Live Golf", query: "PGA TOUR live golf" },
      { label: "⛳ Golf Channel", query: "Golf Channel live" },
      { label: "🎾 Live Tennis", query: "ATP Tennis live" },
      { label: "🎾 WTA Tennis", query: "WTA Tennis live" },
      { label: "🏀 NBA Live", query: "NBA live basketball" },
      { label: "⚾ MLB Live", query: "MLB live baseball" },
      { label: "🏈 NFL Live", query: "NFL live football" }
    ]
  };
}

function parseChannelLines(value = "") {
  return String(value || "")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split("|").map(part => part.trim()).filter(Boolean);
      return { label: parts[0] || line, query: parts[1] || parts[0] || line };
    })
    .filter(item => item.label && item.query);
}

function channelsToText(channels = []) {
  return (Array.isArray(channels) ? channels : [])
    .map(item => `${item.label || ""} | ${item.query || item.label || ""}`.trim())
    .filter(line => line !== "|")
    .join("\n");
}

function getLiveTvChannelsFromAdmin() {
  const defaults = defaultLiveTvChannels();
  return {
    news: parseChannelLines(byId("liveNewsChannelsText")?.value || channelsToText(defaults.news)),
    sports: parseChannelLines(byId("liveSportsChannelsText")?.value || channelsToText(defaults.sports))
  };
}

async function saveLiveTvChannels() {
  const payload = buildProfile();
  payload.liveTvChannels = getLiveTvChannelsFromAdmin();
  // Clear stale saved channel commands so old ABC/Cowboys streams do not auto-reload.
  payload.liveTvSync = null;
  payload.newsLiveOverride = "";
  payload.sportsLiveOverride = "";
  payload.remoteCommand = "";
  payload.youtubeApiKey = byId("youtubeApiKeySimple")?.value.trim() || byId("youtubeApiKey")?.value.trim() || "";
  if (byId("youtubeApiKey")) byId("youtubeApiKey").value = payload.youtubeApiKey;
  await savePayload(payload, "Live TV channels saved");
}


function buildProfile() {
  return {
    guestName: byId("guestName")?.value.trim() || "Guest",
    trip: byId("trip")?.value.trim() || "Luxury Ride",
    mode: byId("mode")?.value || "executive",
    chauffeurName: byId("chauffeurName")?.value.trim() || "Ayo",
    vehicleName: byId("vehicleName")?.value.trim() || "Chevrolet Suburban",
    welcomeNote: byId("welcomeNote")?.value.trim() || "Your STYL luxury experience is ready.",
    scrollingMessage: byId("scrollingMessage")?.value.trim() || "",
    newsUrl: byId("newsUrl")?.value.trim() || defaults.newsUrl,
    sportsUrl: byId("sportsUrl")?.value.trim() || defaults.sportsUrl,
    executiveMusicUrl: byId("executiveMusicUrl")?.value.trim() || "https://www.youtube.com/embed/videoseries?list=PL8F6B0753B2CCA128&enablejsapi=1&rel=0",
    vibeMusicUrl: byId("vibeMusicUrl")?.value.trim() || "https://www.youtube.com/embed/videoseries?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI&enablejsapi=1&rel=0",
    partyMusicUrl: byId("partyMusicUrl")?.value.trim() || "https://www.youtube.com/embed/videoseries?list=PLFgquLnL59amEA53azfP6qWD5F3eVQfmx&enablejsapi=1&rel=0",
    rnb80sMusicUrl: byId("rnb80sMusicUrl")?.value.trim() || "https://www.youtube.com/embed/3Fm8tKhqYx0?enablejsapi=1&rel=0",
    afrobeatsMusicUrl: byId("afrobeatsMusicUrl")?.value.trim() || "https://www.youtube.com/embed/videoseries?list=PL64A9CBCC4F3BA5B2&enablejsapi=1&rel=0",
    spotifyMusicUrl: byId("spotifyMusicUrl")?.value.trim() || "https://open.spotify.com/embed/playlist/37i9dQZF1DX4UtSsGT1Sbe?utm_source=generator",
    youtubeApiKey: byId("youtubeApiKeySimple")?.value.trim() || byId("youtubeApiKey")?.value.trim() || "",
    liveTvChannels: getLiveTvChannelsFromAdmin(),
    spotifyRiderUrl: byId("spotifyRiderUrl")?.value.trim() || "https://demarksinvestment-hash.github.io/Youtube_elitefix/request.html",
    musicRequestUrl: byId("musicRequestUrl")?.value.trim() || "https://demarksinvestment-hash.github.io/Youtube_elitefix/request.html",
    spotifySyncEnabled: (byId("spotifySyncEnabled")?.value || "true") === "true",
    spotifySyncIntervalSeconds: Number(byId("spotifySyncIntervalSeconds")?.value || 25),
    newsLiveOverride: byId("newsLiveOverride")?.value.trim() || "",
    sportsLiveOverride: byId("sportsLiveOverride")?.value.trim() || "",
    vipFormUrl: byId("vipFormUrl")?.value.trim() || "https://stylblackcar.com/contact/",
    bookingUrl: byId("bookingUrl")?.value.trim() || "https://stylblackcar.com/",
    remoteCommand: "",
    updatedAt: new Date().toISOString()
  };
}

function renderPreview(modeText = "Idle") {
  const p = buildProfile();
  if (byId("previewGreeting")) byId("previewGreeting").textContent = `Good afternoon ${p.guestName}`;
  if (byId("previewMode")) byId("previewMode").textContent = modeText;
  if (byId("jsonOutput")) byId("jsonOutput").textContent = JSON.stringify(p, null, 2);
  return p;
}

async function savePayload(payload, statusText = "Saved") {
  if (!db || !liveDoc) {
    setStatus("Firebase not configured");
    return;
  }
  await update(liveDoc, { ...payload, updatedAt: new Date().toISOString() });
  setStatus(statusText);
}

async function saveLiveProfile() {
  const payload = renderPreview("Profile Saved");
  await savePayload(payload, "Profile settings saved");
}

async function saveSources() {
  const payload = renderPreview("Stable Sources Saved");
  await savePayload(payload, "Stable sources saved");
}

async function sendRemote(command, extra = {}, label = "Remote Sent") {
  const payload = buildProfile();
  payload.remoteCommand = command;
  Object.assign(payload, extra);
  renderPreview(label);
  await savePayload(payload, label);
}

async function sendMusicMode(modeValue, label) {
  if (byId("mode")) byId("mode").value = modeValue;
  await sendRemote("music", { mode: modeValue }, label);
}

async function goLive(kind) {
  const payload = buildProfile();
  if (kind === "news") {
    if (!payload.newsLiveOverride) { setStatus("Paste a News live override link first"); return; }
    payload.remoteCommand = "news";
    renderPreview("Go Live News");
    await savePayload(payload, "Live news sent");
  } else if (kind === "sports") {
    if (!payload.sportsLiveOverride) { setStatus("Paste a Sports live override link first"); return; }
    payload.remoteCommand = "sports";
    renderPreview("Go Live Sports");
    await savePayload(payload, "Live sports sent");
  }
}

async function clearLiveOverride() {
  if (byId("newsLiveOverride")) byId("newsLiveOverride").value = "";
  if (byId("sportsLiveOverride")) byId("sportsLiveOverride").value = "";
  const payload = buildProfile();
  payload.remoteCommand = "home";
  renderPreview("Home / Stop Media");
  await savePayload(payload, "Live overrides cleared");
}


function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[ch]));
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

function renderRequests(data = {}) {
  const list = byId("requestsList");
  if (!list) return;

  const items = Object.entries(data || {})
    .map(([id, item]) => ({ id, ...(item || {}) }))
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
    .slice(0, 25);
  currentRequestItems = items;

  if (!items.length) {
    list.textContent = "No requests yet.";
    return;
  }

  list.innerHTML = items.map(item => {
    const title = escapeHtml(item.title || "Unknown song");
    const artist = escapeHtml(item.artist || "Unknown artist");
    const query = `${item.title || ""} ${item.artist || ""}`.trim();
    const rawLink = String(item.link || "").trim();
    const safeLink = /^https?:\/\//i.test(rawLink) ? rawLink : "";
    const link = safeLink ? `<a href="${escapeHtml(safeLink)}" target="_blank" rel="noopener">Open link</a>` : "";
    const time = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
    return `<div class="request-item">
      <div><strong>${title}</strong></div>
      <div>${artist}</div>
      <div class="request-meta">${escapeHtml(time)} ${link}</div>
      <button class="admin-btn request-play-btn" type="button" data-query="${escapeHtml(query)}">Play Request on Tablet</button>
    </div>`;
  }).join("");

  list.querySelectorAll(".request-play-btn").forEach(btn => {
    btn.addEventListener("click", () => playRequestOnTablet(btn.dataset.query || ""));
  });

  if (continuousQueueEnabled) sendContinuousQueueUpdate("Queue auto-updated");
}

async function playRequestOnTablet(query) {
  const cleanQuery = String(query || "").trim() || "smooth jazz lounge music";
  await sendRemote("youtubePanel", {
    youtubePanelQuery: cleanQuery,
    remoteNonce: Date.now()
  }, "Playing request");
}


async function playAllRequestsQueue() {
  continuousQueueEnabled = true;
  await sendContinuousQueueUpdate("Continuous queue started");
}

async function sendContinuousQueueUpdate(statusText = "Queue updated") {
  const queue = (currentRequestItems || [])
    .map(item => ({
      query: `${item.title || ""} ${item.artist || ""}`.trim(),
      videoId: extractYouTubeVideoId(item.link || ""),
      label: `${item.title || ""}${item.artist ? " — " + item.artist : ""}`.trim()
    }))
    .filter(item => item.query || item.videoId || item.label);

  await sendRemote("youtubequeuecontinuous", {
    requestQueue: queue,
    requestQueueContinuous: true,
    remoteNonce: Date.now()
  }, queue.length ? `${statusText}: ${queue.length} requests` : "Continuous queue waiting for requests");
}

function listenForRequests() {
  if (!db) return;
  requestsRef = ref(db, `${firebasePaths.collection}/musicRequests`);
  onValue(requestsRef, (snap) => renderRequests(snap.exists() ? (snap.val() || {}) : {}), (err) => {
    console.error("Music request sync error", err);
  });
}

async function clearRequests() {
  continuousQueueEnabled = false;
  if (!requestsRef) return;
  await remove(requestsRef);
  renderRequests({});
}


function renderBookingPerformance(data = {}) {
  currentBookingClicksData = data || {};
  const box = byId("bookingClicksBox");
  if (!box) return;

  const items = Object.entries(data || {})
    .map(([id, item]) => ({ id, ...(item || {}) }))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  const total = items.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = items.filter(item => String(item.createdAt || "").startsWith(today)).length;
  const last = items[0];

  const avgRide = Number(byId("roiAvgRide")?.value || 120);
  const conversionPercent = Number(byId("roiConversionRate")?.value || 20);
  const estimatedBookings = Math.round(total * (conversionPercent / 100));
  const estimatedRevenue = estimatedBookings * avgRide;

  if (!total) {
    box.innerHTML = `
      <div class="booking-click-row"><strong>Total Clicks:</strong> 0</div>
      <div class="booking-click-row"><strong>Today:</strong> 0</div>
      <div class="booking-click-row"><strong>Estimated Revenue:</strong> $0</div>
    `;
    return;
  }

  const lastTime = last?.createdAt ? new Date(last.createdAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }) : "N/A";

  box.innerHTML = `
    <div class="booking-click-row"><strong>Total Clicks:</strong> ${total}</div>
    <div class="booking-click-row"><strong>Today:</strong> ${todayCount}</div>
    <div class="booking-click-row"><strong>Last Click:</strong> ${lastTime}</div>
    <hr/>
    <div class="booking-click-row"><strong>Estimated Bookings:</strong> ${estimatedBookings}</div>
    <div class="booking-click-row"><strong>Estimated Revenue:</strong> $${estimatedRevenue.toLocaleString()}</div>
    <div class="booking-click-row"><strong>Assumptions:</strong> ${conversionPercent}% conversion × $${avgRide} avg ride</div>
  `;
}

function listenForBookingClicks() {
  if (!db) return;
  bookingClicksRef = ref(db, `${firebasePaths.collection}/bookingClicks`);
  onValue(bookingClicksRef, (snap) => renderBookingPerformance(snap.exists() ? (snap.val() || {}) : {}), (err) => {
    console.error("Booking click sync error", err);
  });
}

async function clearBookingClicks() {
  if (!bookingClicksRef) return;
  await remove(bookingClicksRef);
  renderBookingPerformance({});
}


function getUpsellFormData() {
  return {
    headline: byId("upsellHeadline")?.value.trim() || "Thanks for Riding with STYL",
    body: byId("upsellBody")?.value.trim() || "Scan to book your next ride and save 10% with promo code SPECIAL10.",
    promo: byId("upsellPromo")?.value.trim() || "SPECIAL10",
    badge: byId("upsellBadge")?.value.trim() || "VIP OFFER UNLOCKED",
    buttonText: byId("upsellButtonText")?.value.trim() || "Scan to book your next ride",
    buttonLink: byId("upsellButtonLink")?.value.trim() || "https://stylblackcar.com/",
    duration: Number(byId("upsellDuration")?.value || 60),
    theme: byId("upsellTheme")?.value || "gold"
  };
}

function fillUpsellForm(data = {}) {
  const upsell = data.endTripUpsell || {};
  if (byId("upsellHeadline")) byId("upsellHeadline").value = upsell.headline || "Thanks for Riding with STYL";
  if (byId("upsellBody")) byId("upsellBody").value = upsell.body || "Scan to book your next ride and save 10% with promo code SPECIAL10."; 
  if (byId("upsellPromo")) byId("upsellPromo").value = upsell.promo || "SPECIAL10";
  if (byId("upsellBadge")) byId("upsellBadge").value = upsell.badge || "VIP OFFER UNLOCKED";
  if (byId("upsellButtonText")) byId("upsellButtonText").value = upsell.buttonText || "Scan to book your next ride";
  if (byId("upsellButtonLink")) byId("upsellButtonLink").value = upsell.buttonLink || "https://stylblackcar.com/";
  if (byId("upsellDuration")) byId("upsellDuration").value = upsell.duration || 60;
  if (byId("upsellTheme")) byId("upsellTheme").value = upsell.theme || "gold";
}

async function saveUpsellSettings() {
  if (!liveDoc) return;
  await update(liveDoc, {
    endTripUpsell: getUpsellFormData(),
    updatedAt: new Date().toISOString()
  });
  setStatus("Upsell settings saved");
}

async function triggerEndTripUpsell(command = "endtrip", label = "End Trip Offer") {
  if (!liveDoc) return;
  await update(liveDoc, {
    endTripUpsell: getUpsellFormData(),
    remoteCommand: command,
    remoteNonce: Date.now(),
    updatedAt: new Date().toISOString()
  });
  setStatus(label);
}


async function loadLiveProfile() {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  liveDoc = ref(db, `${firebasePaths.collection}/${firebasePaths.doc}`);
  listenForRequests();
  listenForBookingClicks();

  onValue(liveDoc, (snap) => {
    const data = snap.exists() ? (snap.val() || {}) : {};
    if ("guestName" in data) byId("guestName").value = data.guestName || "";
    if ("trip" in data) byId("trip").value = data.trip || "";
    if ("mode" in data) byId("mode").value = data.mode || "executive";
    if ("chauffeurName" in data) byId("chauffeurName").value = data.chauffeurName || "";
    if ("vehicleName" in data) byId("vehicleName").value = data.vehicleName || "";
    if ("welcomeNote" in data) byId("welcomeNote").value = data.welcomeNote || "";
    if ("scrollingMessage" in data && byId("scrollingMessage")) byId("scrollingMessage").value = data.scrollingMessage || "";
    if ("newsUrl" in data) byId("newsUrl").value = data.newsUrl || "";
    if ("sportsUrl" in data) byId("sportsUrl").value = data.sportsUrl || "";
    if ("executiveMusicUrl" in data && byId("executiveMusicUrl")) byId("executiveMusicUrl").value = data.executiveMusicUrl || "";
    if ("vibeMusicUrl" in data && byId("vibeMusicUrl")) byId("vibeMusicUrl").value = data.vibeMusicUrl || "";
    if ("partyMusicUrl" in data && byId("partyMusicUrl")) byId("partyMusicUrl").value = data.partyMusicUrl || "";
    if ("rnb80sMusicUrl" in data && byId("rnb80sMusicUrl")) byId("rnb80sMusicUrl").value = data.rnb80sMusicUrl || "";
    if ("afrobeatsMusicUrl" in data && byId("afrobeatsMusicUrl")) byId("afrobeatsMusicUrl").value = data.afrobeatsMusicUrl || "";
    if ("spotifyMusicUrl" in data && byId("spotifyMusicUrl")) byId("spotifyMusicUrl").value = data.spotifyMusicUrl || "";
    if ("youtubeApiKey" in data && byId("youtubeApiKey")) byId("youtubeApiKey").value = data.youtubeApiKey || "";
    if ("youtubeApiKey" in data && byId("youtubeApiKeySimple")) byId("youtubeApiKeySimple").value = data.youtubeApiKey || "";
    if ("liveTvChannels" in data) {
      const channels = data.liveTvChannels || defaultLiveTvChannels();
      if (byId("liveNewsChannelsText")) byId("liveNewsChannelsText").value = channelsToText(channels.news || defaultLiveTvChannels().news);
      if (byId("liveSportsChannelsText")) byId("liveSportsChannelsText").value = channelsToText(channels.sports || defaultLiveTvChannels().sports);
    }
    if ("spotifyRiderUrl" in data && byId("spotifyRiderUrl")) byId("spotifyRiderUrl").value = data.spotifyRiderUrl || "";
    if ("musicRequestUrl" in data && byId("musicRequestUrl")) byId("musicRequestUrl").value = data.musicRequestUrl || "https://demarksinvestment-hash.github.io/Youtube_elitefix/request.html";
    if ("spotifySyncEnabled" in data && byId("spotifySyncEnabled")) byId("spotifySyncEnabled").value = data.spotifySyncEnabled ? "true" : "false";
    if ("spotifySyncIntervalSeconds" in data && byId("spotifySyncIntervalSeconds")) byId("spotifySyncIntervalSeconds").value = data.spotifySyncIntervalSeconds || 25;
    if ("newsLiveOverride" in data) byId("newsLiveOverride").value = data.newsLiveOverride || "";
    if ("sportsLiveOverride" in data) byId("sportsLiveOverride").value = data.sportsLiveOverride || "";
    if ("vipFormUrl" in data) byId("vipFormUrl").value = data.vipFormUrl || "";
    if ("bookingUrl" in data) byId("bookingUrl").value = data.bookingUrl || "";
    renderPreview(data.remoteCommand ? `Live: ${data.remoteCommand}` : "Idle");
    setStatus("Connected to live sync");
  }, (err) => { console.error("Live sync error", err); setStatus("Live sync error: " + (err?.code || err?.message || "unknown")); });
}

window.addEventListener("load", async () => {
  ["guestName","trip","mode","chauffeurName","vehicleName","welcomeNote","newsUrl","sportsUrl","newsLiveOverride","sportsLiveOverride","vipFormUrl","bookingUrl"].forEach(id => {
    const el = byId(id);
    if (el) {
      el.addEventListener("input", () => renderPreview("Editing"));
      el.addEventListener("change", () => renderPreview("Editing"));
    }
  });

  byId("youtubeApiKeySimple")?.addEventListener("input", () => {
    if (byId("youtubeApiKey")) byId("youtubeApiKey").value = byId("youtubeApiKeySimple").value;
    renderPreview("Editing");
  });
  byId("liveNewsChannelsText")?.addEventListener("input", () => renderPreview("Editing"));
  byId("liveSportsChannelsText")?.addEventListener("input", () => renderPreview("Editing"));
  byId("saveLiveTvChannelsBtn")?.addEventListener("click", saveLiveTvChannels);
  byId("remoteNewsBtnSimple")?.addEventListener("click", () => sendRemote("news", {}, "Live News"));
  byId("remoteSportsBtnSimple")?.addEventListener("click", () => sendRemote("sports", {}, "Live Sports"));

  byId("remoteHomeBtn")?.addEventListener("click", () => sendRemote("home", { newsLiveOverride: "", sportsLiveOverride: "" }, "Home / Stop Media"));
  byId("remoteYoutubeBtn")?.addEventListener("click", () => sendRemote("youtube", {}, "Video Lounge"));
  byId("remoteUnmuteBtn")?.addEventListener("click", () => sendRemote("unmute", { remoteNonce: Date.now() }, "Play + Sound"));
  byId("remoteNewsBtn")?.addEventListener("click", () => sendRemote("news", {}, "News"));
  byId("remoteSportsBtn")?.addEventListener("click", () => sendRemote("sports", {}, "Sports"));
  byId("remoteMusicBtn")?.addEventListener("click", () => sendRemote("music", { mode: byId("mode")?.value || "executive" }, "Music"));
  byId("remoteBookBtn")?.addEventListener("click", () => sendRemote("book", {}, "Book"));
  byId("remoteVipBtn")?.addEventListener("click", () => sendRemote("vip", {}, "VIP"));
  byId("saveUpsellBtn")?.addEventListener("click", saveUpsellSettings);
  byId("previewUpsellBtn")?.addEventListener("click", () => triggerEndTripUpsell("previewupsell", "Preview Upsell"));
  byId("remoteEndTripBtn")?.addEventListener("click", () => triggerEndTripUpsell("endtrip", "End Trip Offer"));

  byId("musicExecutiveBtn")?.addEventListener("click", () => sendMusicMode("executive", "Music: Executive"));
  byId("musicVibeBtn")?.addEventListener("click", () => sendMusicMode("vibe", "Music: Vibe"));
  byId("musicPartyBtn")?.addEventListener("click", () => sendMusicMode("party", "Music: Party"));
  byId("music80sBtn")?.addEventListener("click", () => sendMusicMode("rnb80s", "Music: R&B 80s"));
  byId("musicAfrobeatsBtn")?.addEventListener("click", () => sendMusicMode("afrobeats", "Music: Afrobeats"));
  byId("musicSpotifyBtn")?.addEventListener("click", () => sendMusicMode("spotify", "Music: Spotify"));

  byId("goLiveNewsBtn")?.addEventListener("click", () => goLive("news"));
  byId("goLiveSportsBtn")?.addEventListener("click", () => goLive("sports"));
  byId("clearLiveBtn")?.addEventListener("click", clearLiveOverride);

  byId("saveSourcesBtn")?.addEventListener("click", saveSources);
  byId("playQueueBtn")?.addEventListener("click", playAllRequestsQueue);
  byId("clearRequestsBtn")?.addEventListener("click", clearRequests);
  byId("resetRiderSessionBtn")?.addEventListener("click", () => sendRemote("hardrefresh", {
  requestQueue: [],
  requestQueueContinuous: false,
  youtubePanelQuery: "",
  youtubePanelVideoId: "",
  remoteNonce: Date.now()
}, "Reset Rider Session"));
  byId("clearBookingClicksBtn")?.addEventListener("click", clearBookingClicks);
  byId("roiAvgRide")?.addEventListener("input", () => renderBookingPerformance(currentBookingClicksData));
  byId("roiConversionRate")?.addEventListener("input", () => renderBookingPerformance(currentBookingClicksData));
  byId("saveMusicLinksBtn")?.addEventListener("click", async () => { const payload = renderPreview("Music Links Saved"); await savePayload(payload, "Music links saved"); });
  byId("saveLiveBtn")?.addEventListener("click", saveLiveProfile);
  byId("copyNewsBtn")?.addEventListener("click", () => navigator.clipboard.writeText(byId("newsUrl")?.value || ""));
  byId("copySportsBtn")?.addEventListener("click", () => navigator.clipboard.writeText(byId("sportsUrl")?.value || ""));

  renderPreview("Idle");
  await loadLiveProfile();
});

console.log("ADMIN_ENDRIDE_QR_UPSELL_V1 loaded");
