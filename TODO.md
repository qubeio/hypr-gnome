## Hypr‑GNOME Bring‑Up TODOs (from PRD v2.0)

Note: Keep files under 500 lines, use clear modules, and follow modern GNOME Shell 45+ implementation while moving shared logic into reusable modules.

### 0) Repository Bootstrap & Identity
- [x] Decide extension UUID and schema id aligned with PRD
  - Target schema id: `org.gnome.shell.extensions.hypr-gnome`
  - Final UUID: `hypr-gnome@qubeio.com`
- [x] Update `Makefile` `UUID` and packaging names to the new UUID
- [ ] Create module directories: `layouts/`, `keybindings/`, `rules/`, `animations/`, `monitors/`, `docs/`
- [ ] Create core managers (files only, minimal scaffolding): `TilingManager`, `KeybindingManager`, `WorkspaceManager`, `WindowRules`, `AnimationEngine`
- [ ] Use single entrypoint (`extension.js`) with modern GNOME Shell 45+ implementation
- [ ] Introduce `Taskfile.yml` (GoTask) for build/test/lint/install flows (keep `Makefile` for GNOME users)

### 1) GSettings Schema (Configuration System)
- [ ] Add new schema file for Hypr‑GNOME: `schemas/org.gnome.shell.extensions.hypr-gnome.gschema.xml`
- [ ] Port existing settings and add PRD keys (scoped to master‑stack only):
  - [ ] `default-layout` (fixed to 'master-stack'), remove layout cycling for now
  - [ ] `inner-gap`, `outer-gap-horizontal`, `outer-gap-vertical`
  - [ ] Keybinding arrays (focus/move/resize/layout/workspaces/splitting/app mgmt)
  - [ ] `enable-animations`, `animation-duration`, `multi-monitor-support`
- [ ] Compile schemas in build pipeline (`glib-compile-schemas`)
- [ ] Migration: read legacy simple‑tiling keys if present and map into new keys (best‑effort)

### 2) Layouts (Algorithms)
- [ ] Port current Master‑Stack into `layouts/master-stack.js`
- [ ] Remove/skip non‑master layouts for initial scope (no registry/cycling)
- [ ] Support master width and master count adjustments

### 3) Window States & Operations
- [ ] Implement window states: tiled, floating, pseudo‑tiled, fullscreen
- [ ] Focus navigation (h/j/k/l, arrows, next/prev, master, center)
- [ ] Window move/swap (dir + to master/center)
- [ ] Resize (dir + master width + master count)
- [ ] Split/unsplit (horizontal/vertical/remove one/remove all)

### 4) Keybindings (Hyprland‑inspired)
- [ ] `KeybindingManager` registers shortcuts relevant to master‑stack only
- [ ] Bind to actions in `TilingManager`/`WorkspaceManager`
- [ ] Handle conflicts, enable customization via prefs

### 5) Workspaces & Multi‑Monitor
- [ ] `WorkspaceManager` with dynamic workspaces (create/destroy on demand)
- [ ] Per‑monitor independent layouts; focus movement across monitors
- [ ] Move windows between workspaces/monitors; optional follow behavior

### 6) Window Rules (Exceptions & More)
- [ ] `WindowRules` engine: app rules, size/position, floating, workspace assignment
- [ ] Backwards‑compatible read of `exceptions.txt`; expose as rules in UI

### 7) Animations & Effects
- [ ] `AnimationEngine` with toggles and duration from schema
- [ ] Focus/transition/layout/workspace animations (basic, performant defaults)

### 8) External Config & Hot Reload
- [ ] Parse optional Hyprland‑style external config file
- [ ] Validate and apply with error reporting
- [ ] Hot reload support (reload without extension restart when possible)

- [ ] Modern Adw (GNOME 45+) UI for categories: Keybindings, Appearance, Workspaces, Applications, Advanced (omit Layouts page for now)
- [ ] Live preview of key settings (gaps, layout switch)

### 10) Build & Tooling
- [ ] Add `Taskfile.yml` with tasks: `build`, `build:*`, `install:*`, `lint`, `test`, `schema`, `clean`
- [ ] Keep `Makefile` targets working; ensure both paths produce identical zips
- [ ] Optional: introduce TypeScript for new modules with a minimal build step; generate JS for GJS

### 11) Testing
- [ ] Create `/tests` structure mirroring modules
- [ ] Add tests covering:
  - [ ] Expected behavior (e.g., layout tiling correctness)
  - [ ] Edge cases (1 window, ultra‑wide monitor, tiny sizes)
  - [ ] Failure cases (invalid config/rules)
- [ ] Add CI‑friendly runner task via `Taskfile.yml`

### 12) Documentation & Release
- [ ] Update `README.md` to reflect Hypr‑GNOME scope, install and usage
- [ ] Add `docs/` with architecture notes for managers and data flow
- [ ] Write migration notes from Simple‑Tiling → Hypr‑GNOME
- [ ] Prepare metadata file (`metadata_modern.json.in`) with new UUID/name
- [ ] Build extension zip; smoke‑test on GNOME 45+
- [ ] Tag release, update screenshots/gifs

### Project Hygiene
- [ ] Keep each file < 500 lines; split into helpers when approaching limit
- [ ] Consistent imports and module boundaries per PRD file layout
- [ ] Line length: wrap >120 chars; prefer wrapping >80 when reasonable
- [ ] Add `# Reason:` comments for non‑obvious logic

### Admin
- [ ] Track tasks in LM‑Tasker MCP (mirror of this TODO)
- [ ] Add “Discovered During Work” items as they arise


