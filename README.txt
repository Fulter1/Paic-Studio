PAIC Studio 2.0 — rebuilt from scratch.

Structure:
- index.html
- css/app.css
- js/config.js
- js/templates.js
- js/store.js
- js/cloud.js
- js/document.js
- js/main.js
- assets/
- supabase.sql
- vercel.json

Features:
- RTL Arabic workspace with right sidebar
- Dashboard / Editor / Library / Templates / Snippets / Settings
- Dark / Light / System theme
- Four visual document templates
- Ready snippets + custom snippets
- Autosave draft + local library
- Supabase anonymous sync + RLS
- A4 and 1:1 preview
- Print / PDF via browser print

Cloud setup:
1. Enable Anonymous Sign-Ins in Supabase Authentication.
2. Run supabase.sql in SQL Editor.
3. Deploy the folder to GitHub/Vercel.

The browser key is a publishable key. Do not replace it with a service_role or secret key.
