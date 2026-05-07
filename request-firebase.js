import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig, firebasePaths } from "./firebase-config.js";

const byId = (id) => document.getElementById(id);
const clean = (value) => String(value || "").trim();


const smartSongSuggestions = [
  "Burna Boy Last Last","Wizkid Essence","Rema Calm Down","Davido Unavailable","Tems Free Mind",
  "Asake Lonely At The Top","Ayra Starr Rush","Kizz Daniel Buga","CKay Love Nwantiti","Tyla Water",
  "Sade No Ordinary Love","Sade Smooth Operator","Anita Baker Sweet Love","Luther Vandross Never Too Much",
  "Kenny G Songbird","George Benson Give Me The Night","Usher Yeah","Beyonce Cuff It","Drake One Dance",
  "Chris Brown Under The Influence","Bruno Mars 24K Magic","New Edition Can You Stand The Rain"
];

function renderSongSuggestions(value) {
  const box = byId("songSuggestions");
  if (!box) return;
  const q = clean(value).toLowerCase();
  if (!q) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  const matches = smartSongSuggestions.filter(song => song.toLowerCase().includes(q)).slice(0, 7);
  if (!matches.length) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  box.innerHTML = matches.map(song => `<button type="button" class="request-suggestion-item" data-song="${song.replace(/"/g, '&quot;')}">${song}</button>`).join("");
  box.classList.remove("hidden");
  box.querySelectorAll(".request-suggestion-item").forEach(btn => {
    btn.addEventListener("click", () => {
      byId("songTitle").value = btn.dataset.song || btn.textContent || "";
      box.classList.add("hidden");
    });
  });
}


function setStatus(text) {
  const el = byId("requestStatus");
  if (el) el.textContent = text;
}

window.addEventListener("load", () => {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const requestsRef = ref(db, `${firebasePaths.collection}/musicRequests`);
  const bookingClicksRef = ref(db, `${firebasePaths.collection}/bookingClicks`);

  byId("bookNextRideBtn")?.addEventListener("click", async () => {
    try {
      const clickRef = push(bookingClicksRef);
      await set(clickRef, {
        source: "requestPageBookingButton",
        page: "request.html",
        url: "https://stylblackcar.com/?promo=SPECIAL10&source=styl_dashboard_request",
        promoCode: "SPECIAL10",
        campaign: "ride_music_request",
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent || ""
      });
    } catch (err) {
      console.error("Could not track booking click", err);
    }
  });

  byId("songTitle")?.addEventListener("input", (e) => renderSongSuggestions(e.target.value));
  byId("songTitle")?.addEventListener("focus", (e) => renderSongSuggestions(e.target.value));

  byId("sendRequestBtn")?.addEventListener("click", async () => {
    const title = clean(byId("songTitle")?.value);
    const artist = clean(byId("songArtist")?.value);
    const link = clean(byId("songLink")?.value);

    if (!title) {
      setStatus("Please enter a song name.");
      return;
    }

    try {
      const itemRef = push(requestsRef);
      await set(itemRef, {
        title,
        artist: artist || "Artist not specified",
        link,
        status: "new",
        createdAt: new Date().toISOString()
      });

      byId("songTitle").value = "";
      byId("songArtist").value = "";
      byId("songLink").value = "";
      setStatus("Request sent. Thank you!");
    } catch (err) {
      console.error(err);
      setStatus("Could not send request. Please try again.");
    }
  });
});
