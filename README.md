# pb-harbourmaster-submit

Free CLI from [FutureHax](https://www.patreon.com/c/r2plays) that fills the Limithron [Pirate Borg Event Submission](https://docs.google.com/forms/d/e/1FAIpQLScZ_FBklDEU0nuob-shDTwuJ4gWjk1M9ChQTUyno63hQueJkA/viewform) Google Form from a YAML event file or a [StartPlaying](https://startplaying.games) adventure URL, then leaves Chrome open so you can review and click **Submit** yourself.

MIT licensed. No Patreon required.

## Setup

```bash
git clone https://github.com/FutureHax/pb-harbourmaster-submit.git
cd pb-harbourmaster-submit
npm install
cp config/defaults.example.yaml config/defaults.yaml
# edit config/defaults.yaml with your email, harbourmaster name, and public contact
```

Requires **Node.js 20+** and **Google Chrome** (the CLI launches Chrome, not Playwright’s Chromium). Google rejects sign-in in automated Chromium with “This browser or app may not be secure.”

## Usage

```bash
# From a StartPlaying adventure listing (recommended):
npm run submit -- --from-url https://startplaying.games/adventure/<slug>
# bare URL also works:
npm run submit -- https://startplaying.games/adventure/<slug>

# Or from a local event YAML:
npm run submit -- examples/sample-event.yaml
npm run submit -- --defaults config/defaults.yaml path/to/event.yaml
```

### What happens

1. Loads and validates `config/defaults.yaml` plus your event YAML (or a StartPlaying URL).
2. Opens headed **Google Chrome** with a persistent profile (`.browser-profile/`) so Google login sticks.
3. Fills page 1 (host info), clicks **Next**, fills page 2 (event details).
4. Stops. Review the form in the browser and click Submit when ready.
5. Close the browser window when finished.

The tool never clicks Submit.

If Chrome opens to a Google sign-in page the first time, complete login in that window and wait for the script to continue automatically. Later runs reuse `.browser-profile/` and should stay signed in.

### StartPlaying import

`--from-url` fetches the adventure page and maps:

- title, platform (Foundry/Roll20/etc.), max players
- next session date/start/end in the listing timezone
- adventure intro + public listing blurb into `description`
- the adventure URL into `addressOrLink`

Host identity still comes from `config/defaults.yaml`.

## Defaults YAML

`config/defaults.yaml` must include:

- `email`
- `harbourmasterName`
- `publicContact`
- `timezone` (optional default; StartPlaying import sets its own)
- `signedUpForHarbourmasters: true`

This file is gitignored. Keep personal contact details out of the repo.

## Event YAML

See [`examples/sample-event.yaml`](examples/sample-event.yaml). Required fields:

| Key | Notes |
|-----|--------|
| `eventName` | Form “Event Name” |
| `nameOfEvent` | Form “Name of Event” (e.g. Game Night @ …) |
| `cityState` | City & State, or VTT/platform for online |
| `format` | One of the form’s multiple-choice options |
| `maxPlayers` | Number or string |
| `addressOrLink` | Physical address or join/watch link |
| `date` | `YYYY-MM-DD` |
| `startTime` | `HH:MM` (24h) |
| `endTime` | Optional `HH:MM` |
| `timezone` | Optional if set in defaults |
| `description` | Game description |
| `notes` | Optional moderator-only notes |

`format` must be exactly one of:

- `In person`
- `Online: Foundry VTT`
- `Online: Roll20`
- `Online: Alchemy RPG`
- `Online Chat or Video Only (Discord/Zoom)`
- `Content Creator`

## License

[MIT](LICENSE)

## Links

- Patreon: https://www.patreon.com/c/r2plays
- Discord: https://discord.gg/D5xF72Vvam
- Harbourmasters program: http://www.limithron.com/harbourmasters
