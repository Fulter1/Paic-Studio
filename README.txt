PAIC Studio Elite

Static HTML/CSS/JavaScript application for official PAIC letters.

Run locally with any static server. Do not open index.html directly if your browser blocks ES modules from file://.

Example:
python3 -m http.server 4173
then open http://localhost:4173

Supabase:
1. Enable Anonymous Sign-Ins in Authentication.
2. Run supabase.sql in SQL Editor.
3. Keep the publishable key in js/config.js only; never use a service_role/secret key.
4. Deploy the folder to Vercel as a static project.

The app works locally without Supabase. Cloud sync requires the Supabase project above and anonymous sign-in.
