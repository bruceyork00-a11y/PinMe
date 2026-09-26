## PinMe

Instant favorite presets & quick-switch tags for DeepSeek Harness models and reasoning effort.

### Features
- **Quick switch pills** next to the composer's model seat — one click switches model + thinking intensity.
- **Pin from the Thinking Intensity submenu** — every level keeps its label and check mark, with a heart beside it; models without reasoning levels expose a single `Default` entry so they stay pinnable.
- **Pin the current combo** from the `Model Configuration` header.
- **Empty = nothing** — the bar only appears once you have favorites (bookmarks-bar semantics).
- Localized (zh/en) through PinMe's own locale namespace; respects dark and light themes.

### Install

Bundle (prebuilt, no build permission needed):
```bash
# from npm
dsh plugin --profile web add dsh-plugin-pinme
# from this release's asset
dsh plugin --profile web add ./dsh-plugin-pinme-<version>.tgz
```

From source (pnpm >= 10 asks for a build allowlist entry, see the README):
```bash
dsh plugin --profile web add github:bruceyork00-a11y/PinMe#<tag>
```

### Compatibility
Verified on DSH 0.1.7-rc.2 (web profile).

### Notes
- Favorites are stored in browser `localStorage` (device-local, not synced).
- PinMe replaces the single `conversation.input.model` seat, so it mirrors the native seat's
  interface and restores Escape / focus return / keyboard activation and an error surface.
