STYL Stable Master Sync + Music Tabs Fix

What changed:
- rebuilt from the stable single playback build
- added Master Sync Mode safely
- broadcast now happens only on direct user actions (tab taps and swipes)
- remote Firebase updates no longer rebroadcast, preventing blinking/loops
- added music tabs:
  - R&B 80s
  - R&B 90s

Use:
- tablets: live.html
- phone: admin-live.html


Media mode layout added:
- iframe becomes larger whenever YouTube, News, Sports, Music, Book, or VIP is opened
- slim premium sidebar stays visible
- QR code remains visible in a smaller size during media mode
- home mode keeps the fuller dashboard layout


Admin home control added:
- Added Home / Stop Media button to admin panel
- Tapping it sends tablets back to Home
- Stops active media remotely on all connected tablets

True Remote Admin Panel added:
- matching remote buttons for Home, YouTube, News, Sports, Music, Book, and VIP
- matching music buttons for Executive, Vibe, Party, R&B 80s, and R&B 90s
- phone admin now behaves like a real remote for all connected tablets


Visual upgrade:
- Admin buttons now match dashboard style (black + gold luxury theme)
- Improved spacing, hover effect, and layout
- Better usability on phone (larger touch targets)


Scrolling message editor added to STYL True Remote Admin Panel (Styled):
- admin now has a Scrolling Message field
- Save Profile Settings updates the scrolling text on all connected tablets


Repaired build:
- Fixed broken tabs caused by config self-reference runtime error.
- Spotify is inside Music submodes only.
- Afrobeats replaces R&B 90s.
- Checks: {'no_config_self_refs': True, 'spotify_not_top_tab': True, 'spotify_music_submode': True, 'afrobeats_submode': True, 'dashboard_js_syntax': True, 'admin_js_syntax': True}


Corrected Live Playlist Sync:
- QR and Open Spotify button appear only when Music > Spotify is selected.
- Admin includes Spotify Rider Phone Link, Live Sync toggle, and refresh interval.
- Dashboard refreshes Spotify playlist while Spotify mode is active.


Simple Admin Fixed Sync:
- Based on the last working Live Playlist Sync Final FIXED build.
- Only admin-live.html was simplified.
- Hidden compatibility elements kept so the working admin-firebase.js still has every expected ID.
- Sync error now displays the Firebase error code/message.


Connected Realtime Database build:
- Uses Firebase Realtime Database instead of Firestore.
- Your provided Firebase config is already installed.
- Path used: styl/liveProfile.
- Simplified admin included.
- WiFi updated to stylblackcar / rideinluxury.


STABLE YOUTUBE SEARCH PANEL FINAL:
- Built from STYL_SIMPLE_ADMIN_RTDB_CONNECTED last working base.
- Simple admin retained.
- Firebase RTDB retained.
- YouTube search panel added inside Music without adding a new mode.
- Admin saves YouTube API key under Music Links.
- Music modes are unchanged and stable.


FINAL requested changes:
1. Added request.html and request-firebase.js so Spotify QR submissions appear in admin.
2. Added Music Requests panel to simple admin with Play on Tablet.
3. Moved YouTube Search panel from Music section into the YouTube main tab to free up Music iframe/Spotify QR space.
4. Spotify QR now points to full request page URL.


Request Play Fix v2:
- Admin Music Request now opens YouTube tab and auto-plays the first matching YouTube API result.
- YouTube panel now plays inside youtubeFrame, not musicFrame, so Spotify playlist no longer remains on screen.
- Manual YouTube search results still allow selecting exact video.


Request Play Command Case Fix:
- Fixed remoteCommand case mismatch.
- Admin was sending youtubePanel, dashboard lowercased it to youtubepanel, but code was checking youtubePanel.
- Requests now open the YouTube tab and trigger the requested song search/play instead of staying on Spotify.


Request Queue Autoplay:
- Admin now has Play All Requests Queue.
- Requests are queued oldest-to-newest.
- Tablet opens YouTube tab and plays queued requests one after another.
- Uses YouTube iframe API ended-state listener to move to next song when possible.


Queue Auto-Advance Fix:
- Added backup timer so request queue advances even when YouTube iframe does not report video-ended events.
- Default backup advance time: 240 seconds per request.
- Added Book Your Next Ride button to request page linking to https://stylblackcar.com.


Smart Timing Queue:
- Queue now uses YouTube Data API video duration when available.
- Adds a small padding after each video before moving to the next.
- Falls back to 4 minutes only when duration cannot be detected.
- Minimum queue slot: 75 seconds; maximum: 12 minutes.


Booking Button Fix:
- Added Book Your Next Ride button to request.html.
- Button links to https://stylblackcar.com.


SAFE CINEMATIC REBUILD FROM SMART TIMING:
- Rebuilt from the stable Smart Timing build.
- Added cinematic YouTube mode only inside the YouTube tab.
- Did NOT add global body overlay rules that block tab clicks.
- Leaving YouTube exits cinematic search-hidden state but does not break tabs.


Hotfix:
- Fixed tab click crash caused by using undefined variable `key` inside showView().
- Correct variable is `name`.


Booking Click Reporting + ROI:
- Request page booking button clicks are saved to Firebase at styl/bookingClicks.
- Admin now shows Total Clicks, Today, Last Click, Estimated Bookings, and Estimated Revenue.
- ROI assumptions are editable in admin: Avg Ride and Conversion %.


FINAL ALL-IN-ONE BUILD:
- Built on the working Smart Timing Cinematic Click ROI build.
- Includes Premium Layout Mode: video/player left, search/request panel right.
- Includes Cinematic Mode: panel hides when video starts and player expands.
- Includes Tap for Sound overlay on YouTube player.
- Includes Admin Unmute button.
- Keeps click reporting + ROI.
- Keeps request system and smart timing queue.
Recommended replacement files:
live.html
styles.css
dashboard-firebase.js
admin-live.html
admin-firebase.js
Also replace index.html only if tablets use index.html instead of live.html.


FINAL V2 Corrections:
- Spotify Request/QR panel now moves to the RIGHT of the music iframe and stays inside the music frame area.
- Tap for Sound overlay added for News, Sports, and Music iframe wrappers too.
- Admin Unmute now targets the currently active media iframe.
- YouTube cinematic player size restored to safe-build sizing when playback starts.
