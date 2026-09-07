---
title: "Release: Harbourmaster Event Submitter"
date: "2026-07-16"
tier: "Public"
type: "announcement"
collection: "Product Catalog"
tags: "release, pirate-borg, harbourmasters, tooling, free"
status: "published"
url: "https://www.patreon.com/r2plays/posts/release-event-164027777"
---

**Harbourmaster Event Submitter** is free and public. No Patreon required.

If you host public Pirate Borg games for the Limithron [Harbourmasters](http://www.limithron.com/harbourmasters) calendar, this CLI fills the Google event submission form for you, then leaves Chrome open so you can review and click Submit yourself.

## What it does

- Fills both pages of the official Pirate Borg Event Submission form
- Imports a [StartPlaying](https://startplaying.games) adventure URL into the form fields (title, Foundry/Roll20 platform, seats, next session time, description, join link)
- Or loads a local YAML event file if you prefer to write the details yourself
- Never auto-submits: you always get the last look before sending

## How to get it

Repo (MIT): https://github.com/FutureHax/pb-harbourmaster-submit

```bash
git clone https://github.com/FutureHax/pb-harbourmaster-submit.git
cd pb-harbourmaster-submit
npm install
cp config/defaults.example.yaml config/defaults.yaml
# edit defaults with your harbourmaster email/name/contact
npm run submit -- --from-url https://startplaying.games/adventure/<slug>
```

Requires Node.js 20+ and Google Chrome.

## Notes

This is an unofficial helper for Harbourmasters. Event approval and membership stay with Limithron. Use it for public games that meet Harbourmaster calendar rules.

---

Join the Discord: https://discord.gg/D5xF72Vvam
