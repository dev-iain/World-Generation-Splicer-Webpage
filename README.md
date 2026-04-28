# OreSource

Interactive ore distribution viewer for Minecraft. Drop a JSON export from `/orestats` and explore density, distribution, and spawn ranges across modpacks.

## Links

- [Live Site](https://almana-mc.github.io/World-Generation-Splicer-Webpage/) — hosted viewer, load JSON and explore.
- [Discord](https://discord.gg/xTeHR2tdYh) — community, support, modpack discussion.
- [GitHub: World Generation Splicer](https://github.com/Almana-mc/World-Generation-Splicer) — companion mod that generates JSON ore stats consumed by viewer.

## Build

Vite-based build pipeline. Production React, no runtime Babel.

```bash
npm install
npm run dev      # dev server with HMR on http://localhost:5173
npm run build    # production bundle to dist/
npm run preview  # serve dist/ locally
```

Deploy `dist/` to GitHub Pages (or any static host). Static assets live in `public/` and are copied to `dist/` at build time.
