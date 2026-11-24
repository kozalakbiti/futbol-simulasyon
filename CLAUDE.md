# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Club Manager: Glory Road** is a fictional football (soccer) management game. Its UI text and code comments are in Turkish. The game is a static web page: `index.html` is a thin shell, `css/style.css` holds the global styles, and the code (~29k lines) is split into plain files under `js/`. There is no build system, no package.json and no tests. All club, league and player names are meant to be fictional, so keep new content fictional too.

## Running

The page **must be served over HTTP**. Run `node sunucu.js` in the repo folder (a tiny dependency-free static server on Node's built-in `http` module; optional port argument, default 8000) and open http://127.0.0.1:8000, or on Windows double-click `baslat.bat`, which runs `node sunucu.js 8000 --lan` and opens the browser. `python -m http.server 8000` also works where Python is installed. Opening `index.html` by double-click (`file://`) does **not** work, because Babel loads the `js/` files with XHR, which browsers block on `file://`. In that case the page shows a Turkish notice instead of the game. Capacitor serves from `http(s)://localhost` (Android) or `capacitor://localhost` (iOS), so the app is not affected, but its `webDir` must include `css/` and `js/`. `node sunucu.js` binds to `127.0.0.1` only. With `--lan` (used by `baslat.bat`) it binds to `0.0.0.0` and prints the LAN URLs (for testing on a phone on the same Wi-Fi). Hidden paths are always refused: dot-segments (`.git`, `.claude`, …), Windows 8.3 short names (`GIT~1`) and `::$DATA` streams, checked again on the resolved real path. Requests whose Host is not localhost or an IP address are refused (DNS rebinding).

The page loads React 18.2, ReactDOM and `@babel/standalone` 7.23.5 from cdnjs. Babel transpiles the JSX **in the browser at load time**. So there is no compile step, and syntax errors only show up in the browser console when the page runs. Babel names the failing file in the error. The game also targets an Android Capacitor WebView: portrait lock, StatusBar hide and safe-area insets. Those hooks all check `window.Capacitor` first, so they do nothing in a normal browser.

## How the code is loaded (read before adding or moving code)

- `index.html` loads `js/sounds.js` as a plain script. It holds the `SOUNDS` object of base64 MP3 data URIs, so its lines are huge: **never print or read it raw**. Then `index.html` loads every other file as `<script type="text/babel" data-presets="react" src="…">`. They are listed in a fixed order, and **the order matters**: Babel fetches them in parallel but runs them strictly in that order, each one only after it and all earlier files have arrived.
- These are **not ES modules**. There are no `import`/`export`s. Every top-level `const`/`function` is a global shared by all files, as when everything lived in one script. React hooks come from `const { useState, useEffect, useRef } = React;` in `js/core/theme.js`.
- **Load-order rule:** a function declaration is hoisted only within its own file. Code that runs at load time (a top-level `const X = f()`, an IIFE, a top-level object built by calling something) may only use names from the **same or an earlier** file. Code inside components and functions runs later, so it can use anything.
- **New file:** add a `<script type="text/babel" data-presets="react" src="…">` tag to `index.html` in the right position, and keep the top-level names unique across all files.
- **Finding code:** grep `js/` for `^(const|function) Name`. Major sections are marked by `// ═══` banner comments. `js/data/players.js` and a few other files have very long lines, so pipe shell output through `cut -c1-200`.

## File map

Grouped by folder. This is **not** the exact load order: `index.html` is the source of truth for that. For example, `js/core/save.js` loads after the career minigames, and `js/pages/takim-adi.js` … `diger.js` load after `js/screens/menus.js`.

| File | Contents |
|---|---|
| `css/style.css` | Global CSS: Google Fonts import, reset, safe-area insets, scrollbars, `glowPulse`/`fadeInUp` animations |
| `js/sounds.js` | `SOUNDS` (base64 audio, plain JS, **do not read raw**) |
| `js/core/theme.js` | React hooks, `C` (colour palette), `rnd`, `fmtSal`, `posC`, `ovrToGrade`, `TEAM_BADGE`/`TeamBadge` |
| `js/data/players.js` | `DB` player database (`{id,n,pos,ovr,pot,age,val,sal,club,lg,nat,ct,st,ch}`; `val` in M€, `sal` in K€/week) |
| `js/data/league.js` | `INIT_SQUAD`, `INIT_TEAMS`, rival/month tables, `buildDoubleRoundRobin`, `build*Fixture` (TFF1 = "1. Lig", SL = "Elit Lig", Primeira, Eredivisie, Big5), `buildKupa*`, `sortFixture`, `FDATA`, team strength and formation helpers |
| `js/data/youth-staff.js` | `INIT_YOUTH`, `genYouthPlayer`, `genFreeAgent`, `COACHES` |
| `js/match/scouting.js` | Opponent analysis: `TEAM_STYLES`, `getScoutReport`, `ScoutReportCard`, `PreMatchModal` |
| `js/match/engine.js` | `simulateMatch` (Poisson-based) and the goal/event/commentary tables |
| `js/match/moments.js` | `planMoments`, `InteractiveMoment` |
| `js/ui/primitives.js` | Shared UI bits: `PosTag`, `STitle`, `Chip`, `Btn`, `Modal`, `StatBar` |
| `js/match/halftime.js` | `HalftimeSpeech` |
| `js/match/three3d.js` … `hud3d.js` | 3D match view (Three.js r128, lazy-loaded from cdnjs; see `PLAN-3D.md`): `three3d` (`loadThreeJs`, coordinates, `mergeGeos3D`, `disposeObject3D`), `rig3d` (articulated low-poly player + animations), `stadium3d` (stands, instanced crowd, floodlights, ad boards, benches), `pitch3d` (`Pitch3D`, cameras), `players3d` (`createMatchActors3D`: players, ball physics, play director, event FX), `moment3d` (`InteractiveMoment3D`), `hud3d` (`Scoreboard3D`), `day3d` (day scene: sky, lights, grass/crowd/AO canvases), `assets3d` (`loadModel()` + GLTFLoader from `js/vendor/`, applies `assets/models/*.glb`; credits in `assets/CREDITS.md`) |
| `js/match/overlay.js` | `SPEED_CONFIGS`, `MATCH3D_TEMPO`, `MatchOverlay` (live match UI) |
| `js/ui/player-modal.js` | `PlayerModal`, `calcTeamGrades`, `NEAREST_POS` |
| `js/data/traits.js` | `PLAYER_TRAITS`, `assignTraits`, `calcTraitBonus` |
| `js/pages/*.js` | Manager-mode pages, one per file: `home` (PageHome), `kadro`, `fikstur` (+ `MatchDetailModal`), `formasyon` (PageFormasyonTaktik), `transfer` (+ `OfferPage`, `calcAcceptProb`, value calcs), `yetenek` (youth), `antrenman`, `istatistik` (+ `EuroSimWidget`), `haberler`, `finans`, `takim-adi`, `basin` (+ `PostMatchBasinModal`), `iliskiler`, `itibar`, `takimlar`, `kaydet`, `diger` |
| `js/ui/incoming-offer.js` | `IncomingOfferModal` |
| `js/ui/avatars.js` | `AVATAR_DEFS` (manager avatar SVGs) |
| `js/screens/tutorial.js` | `TUTORIAL_STEPS`, `TutorialOverlay` |
| `js/career/*.js` | Player Career mode, a separate game mode: `data` (`CP` palette, `CAREER_*`, `SKILL_TREES`, calc helpers), `onboarding` (`CareerOnboardingScreen`), `minigames` (canvas `Shot/Penalty/FreekickMinigame`, `MiniGameOrchestrator`), `saves` (career save slots, `migrateOldSave`, Capacitor orientation lock IIFE), `events` (family/story events), `live-match` (`LiveMatchScreen`), `career-screen` (`CareerScreen`) |
| `js/core/save.js` | `GAME_VERSION`, `SAVE_SCHEMA_VERSION`, `LIMITS` (anti-exploit clamps), `calcSaveChecksum`, `sanitizePlayer`, `validateAndMigrateSave`, `safeLsGet`/`safeLsSet` |
| `js/screens/menus.js` | `CoachSaveModal`, `MainMenuScreen`, `OnboardingScreen`, `ManagerAvatar`, `SCENARIOS`, `ScenarioScreen` |
| `js/core/audio.js` | `AudioPlayer` (Web Audio music and atmosphere) |
| `js/ui/nav.js` | `NAV`, `PageAyarlar` (settings), `DIGER_PAGES`, `LABELS` |
| `js/app.js` | `App`: the giant root component holding nearly all manager-mode state in `useState` hooks. It routes top-level screens through `gameScreen` (`"mainmenu"` → `"scenario"` → `"onboarding"` → main game; or `"career_onboarding"` → `"career"`), then renders the active `page` |
| `js/main.js` | `ReactDOM.createRoot(...).render(App)`. **Must stay last.** |

## Persistence (localStorage keys)

- Manager mode: `fcym_coach_saves` (slots) and `fcym_save_index` (+ `fcym_save_slot_*`). The save object is built in `buildCoachSaveData` and restored in `loadGameData`, both in `js/app.js`.
- Player career mode: `fcyildiz_player_saves`, up to 5 slots, kept separate from manager saves. `fcyildiz_career_v6` is a legacy key that `migrateOldSave` (`js/career/saves.js`) migrates.
- If you change the shape of saved data, bump `SAVE_SCHEMA_VERSION` and handle the old shape in `validateAndMigrateSave` (`js/core/save.js`). Bump `GAME_VERSION` for releases.

## Ajan Calisma ve Token Tasarrufu Kurallari
- **Tek Ajan Prensibi:** Kullanici ozellikle birden fazla ajan cagirmadikca paralel alt ajan (worktree) baslatma; degisikligi dogrudan ana calisma alaninda tek ajanla uygula.
- **Hedefli Dosya Okuma:** Tum js/ klasorunu bastan sona tarama. Once js/match/ altindaki ilgili modulu bul, sadece degistirecegin satir araligini (offset / limit) oku.
- **Three.js Standartlari:** 3D sahne, kamera, isik, materyal ve animasyon islemlerinde .claude/skills/ altindaki Three.js rehberlerini ve yaygin hata kontrollerini uygula.
- **Kapsam Koruma:** Yalnizca istenen hatayi/ozelligi duzelt; calisan mevcut UI veya oyun dongusu kodlarina dokunma.
