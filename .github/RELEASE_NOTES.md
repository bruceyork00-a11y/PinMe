## PinMe

Instant favorite presets & quick-switch tags for DeepSeek Harness models and reasoning effort.

### Features
- **Quick switch pills** next to the composer's model seat — one click switches model + thinking intensity.
- **Pin from the Thinking Intensity submenu** — every level keeps its label and check mark, with a heart beside it; models without reasoning levels expose a single `Default` entry so they stay pinnable.
- **Pin the current combo** from the `Model Configuration` header.
- **Empty = nothing** — the bar only appears once you have favorites (bookmarks-bar semantics).
- Localized (zh/en) through PinMe's own locale namespace; respects dark and light themes.

### New in 0.1.5
- **Plugin-manager card metadata** — `icon.svg` plus `locale/zh.json` + `locale/en.json`
  (`meta.title` / `meta.description`). The DSH plugin manager now shows a localized title,
  a one-line description and an icon instead of the bare package name.
- **Desktop install instructions** in the README. Note that `desktop` is a reserved profile:
  the npm-installed `dsh` CLI refuses it, so use the desktop's bundled CLI or the in-app
  **Plugins → Add plugin** dialog.

### Install

`<profile>` is `web` (browser) or `desktop`.

Bundle (prebuilt, no build permission needed):
```bash
# from npm
dsh plugin --profile <profile> add dsh-plugin-pinme
# from this release's asset
dsh plugin --profile <profile> add ./dsh-plugin-pinme-<version>.tgz
```

Desktop profile (reserved name — the npm CLI refuses it):
```powershell
& "…\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add dsh-plugin-pinme
```

From source (pnpm >= 10 asks for a build allowlist entry, see the README):
```bash
dsh plugin --profile <profile> add github:bruceyork00-a11y/PinMe#<tag>
```

### Compatibility
Plugin behavior verified on DSH 0.1.7-rc.2 (web profile).
Display metadata verified against the `readPluginMeta` reader shipped in DSH 0.2.0-rc.2.

### Notes
- Favorites are stored in browser `localStorage` (device-local, not synced).
- PinMe replaces the single `conversation.input.model` seat, so it mirrors the native seat's
  interface and restores Escape / focus return / keyboard activation and an error surface.
- Card metadata is only read for rows addressed by **bare package name**. A dev-time
  `--patch ./cordis.yml` path overlay intentionally shows no icon or localized text.
