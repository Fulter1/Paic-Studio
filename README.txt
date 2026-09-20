PAIC Studio 3.0 — clean rebuild

Static HTML/CSS/JavaScript modules. No framework or build step.

Pages:
- Dashboard
- Letter Editor
- Letter Library
- Template Studio
- Content/Snippets Library
- Settings

Core features:
- Four visual templates
- A4 and square output
- Live preview and zoom
- Auto-save drafts
- Local-first storage
- Supabase anonymous cloud sync + RLS
- Ready-made text snippets + custom snippets
- Duplicate/edit/delete/search letters
- Print / Save as PDF
- Dark / Light / System theme
- Responsive mobile navigation

Supabase setup:
1. Enable Anonymous Sign-Ins in Authentication.
2. Run supabase.sql once in SQL Editor.
3. Keep the publishable key in js/config.js; never use a service_role/secret key.
4. Deploy the folder to GitHub/Vercel.

If Supabase is unavailable, local storage continues to work.
