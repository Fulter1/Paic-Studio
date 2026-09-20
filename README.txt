PAIC Studio v8 — Clean Enterprise

Files:
- index.html
- style.css
- app.js
- content.js
- supabase.sql
- assets/logo-club.svg
- assets/logo-university.svg

Deploy:
1) Upload the whole folder to GitHub.
2) Import the repository into Vercel as a static project. No build command is required.
3) In Supabase SQL Editor, run supabase.sql once.
4) In Supabase Data API settings, make sure paic_letters_v8 is exposed.
5) The browser uses the Supabase publishable key in app.js. Never replace it with a secret/service_role key.

Cloud note:
The current lightweight cloud isolation uses a browser-generated client_id plus RLS. It is not an authenticated identity boundary. If letters become confidential or multiple users need accounts, use Supabase Auth and auth.uid() RLS.

PDF:
The PDF button opens the browser print dialog and lets the user choose Save as PDF. This avoids a heavy client PDF dependency and missing source-map warnings.
