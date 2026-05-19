const stylTabletId =
  localStorage.getItem("stylTabletId") ||
  `tablet-${Math.random().toString(36).slice(2,10)}`;

localStorage.setItem("stylTabletId", stylTabletId);

async function sendTabletHeartbeat() {
  try {
    if (!dbRef) return;

    const payload = {
      deviceId: stylTabletId,
      online: true,
      lastSync: Date.now(),
      currentView,
      queueCount: requestQueue.length || 0,
      nowPlaying: currentView || "home"
    };

    const db = getDatabase();

    await set(
      ref(db, `${firebasePaths.collection}/tabletHealth/${stylTabletId}`),
      payload
    );

    console.log("STYL heartbeat sent");
  } catch (err) {
    console.warn("Heartbeat failed", err);
  }
}

setInterval(sendTabletHeartbeat, 15000);

setTimeout(sendTabletHeartbeat, 5000);
