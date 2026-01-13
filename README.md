# Carlos Canizares — Portfolio

This is a minimal static portfolio site. It includes a link to the CV PDF and space to add projects.

Quick start (macOS):

1. Open the site directly in a browser:

   - Double-click `index.html` in the project folder, or open it from your browser.

2. Serve locally via a simple HTTP server (recommended):

   ```bash
   # from project root
   cd /Users/carloscanizares/Documents/portfolio
   python3 -m http.server 8000
   # open http://localhost:8000 in your browser
   ```

3. Git (create remote and push):

   ```bash
   cd /Users/carloscanizares/Documents/portfolio
   git remote add origin git@github.com:your-username/your-repo.git
   git branch -M main
   git push -u origin main
   ```

Files of interest:

- `index.html` — main page
- `css/style.css` — styles
- `js/main.js` — small JS placeholder
- `assets/` — contains your CV PDF
Files of interest:

- `index.html` — main one-page site with sections: Home, Journey, Projects, Contact
- `css/style.css` — styles (timeline, grid, responsive)
- `js/main.js` — smooth scrolling + active nav highlighting
- `assets/` — contains your CV PDF

Editing content:

- Update the `#journey` timeline items directly in `index.html`.
- Add or replace projects in the `#projects` section; each `.card` is a project.

Run locally (quick):

```bash
cd /Users/carloscanizares/Documents/portfolio
# Quick static server
python3 -m http.server 8000
# open http://localhost:8000
```

Deploy options:

- GitHub Pages: push the `main` branch and enable Pages, or use a `gh-pages` branch.
- Netlify/Vercel: connect the repo and deploy directly (no build required for this static site).

If you want, I can:

- Replace placeholder links (GitHub/LinkedIn/email) with your real URLs.
- Extract the timeline and projects into a `data.json` and render them dynamically.
- Set up a GitHub Actions workflow to deploy to GitHub Pages automatically.
