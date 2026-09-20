PAIC Studio v14

Production-ready static build for GitHub + Vercel.

Files
- index.html
- style.css
- app.js
- content.js
- supabase.sql
- vercel.json
- assets/

Deploy
1. Upload the whole folder to GitHub.
2. Import the repository into Vercel. No build command is required.
3. In Supabase, enable Authentication > Providers > Anonymous Sign-Ins.
4. Run supabase.sql once in Supabase SQL Editor.
5. Keep only the publishable key in the browser. Never add a secret/service-role key.

Security model
- Browser uses Supabase publishable key only.
- Anonymous Auth creates a stable per-browser user session.
- RLS restricts rows to auth.uid() and anonymous users only.
- anon role has no table privileges.
- Database checks input lengths and allowed template/size values.
- Client output is escaped before being inserted into the document preview.
- Vercel security headers are included in vercel.json.
- Local fallback keeps the editor usable if Supabase is temporarily unavailable.

Important
Anonymous users are intentionally used because this version has no accounts or admin system. Clearing browser storage or using another device creates a new anonymous identity; it does not expose another user's rows because RLS is based on auth.uid(). For a public deployment, monitor anonymous abuse and enable CAPTCHA/rate limiting later if usage grows.
