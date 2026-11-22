# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Club Manager: Glory Road** is a fictional football (soccer) management game. Its UI text and code comments are in Turkish. The entire game lives in a single file, `index.html` (~29k lines, ~2.2 MB). There is no build system, no package.json, no tests and no git repo. All club, league and player names are meant to be fictional, so keep new content fictional too.

## Running

Open `index.html` in a browser, or serve the folder statically (e.g. `python -m http.server`) and open it. The page loads React 18.2 and ReactDOM from cdnjs, and `@babel/standalone`, which transpiles the JSX **in the browser at load time**. So there is no compile step, and syntax errors only show up in the browser console when the page runs. The game also targets an Android Capacitor WebView: portrait lock, StatusBar hide and safe-area insets. Those hooks all check `window.Capacitor` first, so they do nothing in a normal browser.

## Working with the file

- **Don't read the file whole, and don't print raw line ranges near the top.** Lines ~72–81 hold a `SOUNDS` object of base64 MP3 data URIs. Some other lines are also extremely long. Find code with Grep, and pipe shell output through `cut -c1-200`.
- Layout: `<style>` (top) → plain `<script>` with `SOUNDS` → one big `<script type="text/babel">` with all the game code → `ReactDOM.createRoot(...).render(App)` at the very end.
- Everything is global, top-level `const`/`function` declarations in that one Babel script. There are no modules or imports, and React hooks come from `const { useState, useEffect, useRef } = React;`.
- To find a definition, grep for `^(const|function) Name`. Major sections are marked by `// ═══` banner comments.

## Architecture (in file order)

1. **Theme & helpers**: `C` (colour palette), `fmtSal`, `posC`, `ovrToGrade`, `TEAM_BADGE`/`TeamBadge`.
2. **Static data**: `DB` is the big player database (`{id,n,pos,ovr,pot,age,val,sal,club,lg,nat,ct,st,ch}`; `val` is in M€, `sal` in K€/week). Also `INIT_SQUAD`, `INIT_TEAMS`, rival lists, and per-league month tables.
3. **Fixture/league builders**: `buildDoubleRoundRobin`, `build*Fixture` for each league (TFF1 = "1. Lig", SL = "Elit Lig", Primeira, Eredivisie, Big5), cup brackets (`buildKupa*`), and `sortFixture`. The league is picked by the `league` string, e.g. `"1. Lig"` vs `"Elit Lig"`.
4. **Match engine**: `simulateMatch` (Poisson-based), `planMoments`/`InteractiveMoment`, `HalftimeSpeech`, and `MatchOverlay` (live match UI, with speed settings in `SPEED_CONFIGS`).
5. **Manager-mode pages** (`Page*` components): Home, Kadro (squad), Fikstur (fixtures), FormasyonTaktik, Transfer (+ `OfferPage`, `calcAcceptProb`), Yetenek (youth), Antrenman (training), Istatistik, Haberler (news), Finans, Basin (press), Iliskiler, Itibar (reputation), Takimlar, Kaydet (save/load), and Ayarlar (settings). Navigation comes from `NAV`, `DIGER_PAGES` and `LABELS` (just above `App`).
6. **Player Career mode** (~line 15550+), a separate game mode with its own constants (`CP` palette, `CAREER_*`, `SKILL_TREES`, …) and its own components: `CareerOnboardingScreen`, `CareerScreen`, `LiveMatchScreen`, and canvas minigames (`ShotMinigame`, `PenaltyMinigame`, `FreekickMinigame` via `MiniGameOrchestrator`).
7. **Save system** (~line 17430): `GAME_VERSION`, `SAVE_SCHEMA_VERSION`, `LIMITS` (clamps against exploits), `calcSaveChecksum`, `sanitizePlayer`, `validateAndMigrateSave`, and the `safeLsGet`/`safeLsSet` localStorage wrappers.
8. **`App`** (~line 23540 to end): a giant root component that holds nearly all manager-mode state in `useState` hooks. It routes between top-level screens through `gameScreen` (`"mainmenu"` → `"scenario"` → `"onboarding"` → main game; or `"career_onboarding"` → `"career"`). Then it renders the active `page` from the bottom/side nav.

## Persistence (localStorage keys)

- Manager mode: `fcym_coach_saves` (slots) and `fcym_save_index` (+ `fcym_save_slot_*`).
- Player career mode: `fcyildiz_player_saves`, up to 5 slots. These are kept separate from manager saves. `fcyildiz_career_v6` is a legacy key that `migrateOldSave` migrates.
- If you change the shape of saved data, bump `SAVE_SCHEMA_VERSION` and handle the old shape in `validateAndMigrateSave`. Bump `GAME_VERSION` for releases.
