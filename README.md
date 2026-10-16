# The Big Back Club

A custom editorial homepage for **The Big Back Club**, the food-science journal.

## Files
- `index.html` — page structure and content
- `styles.css` — responsive visual design, motion and layout
- `script.js` — interactions and public WordPress REST API feed

## Publishing articles
Continue writing and publishing posts in the existing WordPress dashboard:
https://thebigbackclub.wordpress.com/wp-admin/

The homepage requests the three latest published posts from the public WordPress REST API. It does not need your WordPress password or an API secret in the frontend. If the API is unavailable, the homepage keeps its built-in preview cards.

## Local preview
Open `index.html` in a browser. For the most reliable local preview, serve the folder with a local development server so browser API requests behave consistently.

## Deployment
The site files are ready for GitHub Pages, but Pages still needs to be enabled in the repository settings. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save. GitHub will provide the published URL once deployment finishes.

## Next improvements
- Verify the WordPress feed and replace any fallback copy with the actual post archive.
- Add a proper searchable/filterable article archive and individual article pages.
- Refine the homepage with real featured images and a dedicated About / writing portfolio page.
- Test keyboard navigation, mobile layouts and reduced-motion behavior.
