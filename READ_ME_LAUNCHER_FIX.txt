STYL FOX One launcher fix

Replace all files in your GitHub Pages folder with these files.

New file added:
- foxone.html

What changed:
- FOX One no longer opens directly from the dashboard.
- Dashboard opens foxone.html first.
- foxone.html has a large Return to STYL Dashboard button and an Open FOX One button.
- This prevents the kiosk browser from feeling trapped inside FOX One.

Important limitation:
- Once the tablet is fully on fox.com, dashboard JavaScript cannot receive Admin Home commands because FOX One is a different website.
- Admin Home works when the tablet is on live.html or foxone.html, not after FOX One fully takes over.
