# ONE LIFE OS

Personal growth, performance and life management for 14 October 2026 to 13 October 2027, and the years after that.

It's a single-file PWA in the same style as Content Machine. The whole app is in `public/index.html`. Two small Netlify Functions handle the encrypted cloud backup and the Notion sync.

## What's in the folder

| Path | What it is |
|---|---|
| `public/index.html` | The complete app: every screen, the planner, the charts and all storage logic |
| `public/sw.js`, `public/manifest.webmanifest`, `public/icons/` | PWA files that make it installable and let it work offline |
| `netlify/functions/notion.mjs` | Notion sync at `/api/notion`. It uses the official Notion API, and your token never leaves the server |
| `netlify/functions/backup.mjs` | Encrypted backup store at `/api/backup`, using Netlify Blobs |
| `netlify.toml`, `package.json` | Netlify configuration |
| `src/` + `build.py` | Readable source. Run `python3 build.py` to rebuild `index.html` after editing |

## 1. Deploy (about 10 minutes)

The app on its own works with Netlify drag-and-drop. Drop the `public` folder and you're done.

Backup and Notion need the functions, which only deploy through Git or the Netlify CLI. The recommended route needs no terminal:

1. Create a **private** GitHub repo called `one-life-os` and upload the whole folder (Add file → Upload files).
2. In Netlify, go to **Add new site → Import an existing project → GitHub** and pick the repo. Netlify reads the settings from `netlify.toml`, so click Deploy.
3. In Netlify, open **Site configuration → Environment variables** and add:
   - `APP_KEY`: a long random password, for example 30+ characters from a password manager. The app sends this to prove it's you.
   - `NOTION_TOKEN`: your Notion integration secret (see step 3 below).
4. Go to **Deploys → Trigger deploy** so the functions pick up the variables.

This also sets up GitHub auto-deploys, which you'd flagged as a next step for Content Machine.

If you'd rather use the CLI: `npm i -g netlify-cli`, `netlify init`, `netlify env:set APP_KEY …`, `netlify deploy --prod`.

## 2. Add to your iPhone

1. Open the site address in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Always open it from the home-screen icon. Data is stored inside the installed app on the phone, and a normal Safari tab keeps a separate copy.

## 3. Connect Notion (one-way: app → Notion)

1. Go to notion.so/profile/integrations, choose **New integration**, select **Internal**, and give it a name like "ONE LIFE OS". Copy the **Internal Integration Secret** into `NOTION_TOKEN` in Netlify and redeploy.
2. In Notion, create a page such as "ONE LIFE OS Backup". Open it, then go to **••• → Connections → add your integration**.
3. Copy the page link. In the app, go to **More → Backup, export & Notion → Connection settings**. Paste in your APP_KEY and the page link, then save.
4. Tap **Test connection**, then **Sync to Notion now**.

The first sync creates six databases under that page: Goals, Milestones, Tasks, Journal, Reviews and Activity log. Every row has an **App ID**. Later syncs only send records that changed, update the existing row, and look up the App ID before creating anything, so you don't get duplicates. Tasks, goals and milestones you delete in the app are moved to Notion's trash on the next sync.

Some details:

- You can turn on daily sync, which runs when you open the app, at most once every 20 hours.
- Routine habit tasks are left out by default to keep Notion tidy. There's a toggle to include them.
- Errors are shown in plain language with a **Retry** button. "Last successful sync" only changes when every record was written.
- The sync uses Notion API version `2025-09-03`, with data sources.
- Implementation stage: it uses an internal integration token. Full Notion OAuth (a public integration with a sign-in button) is a possible stage 2. It only matters if other people will use the app.

## 4. Encrypted cloud backup

In **Backup, export & Notion**, set a backup passphrase and save it. Then tap **Back up now**, or turn on the daily backup.

The data is encrypted on the phone with AES-256-GCM, using a key derived from your passphrase. The server stores only the encrypted file: the latest copy plus one per day for 30 days.

To move to a new phone, install the app, enter the same APP_KEY and passphrase, and tap **Restore**. If you lose the passphrase, the backup can't be read.

You can also download backups with no setup at all: full `.json` (which can be restored), a readable `.md`, and `.csv` files for tasks, goals, milestones, journal, logs and daily check-ins.

## How it works

- **Storage:** IndexedDB on the device. Every change saves automatically, and the indicator at the top shows Saving or Saved. The app asks the browser to keep its storage persistent.
- **Login:** an optional 4-digit PIN lock, with the app opened from your iPhone's own protected home screen. Server endpoints are protected by APP_KEY. There are no third-party accounts.
- **Planner:** builds each day from your Routines and adapts to:
  - office, remote, off and leave days
  - Monday Bible study
  - Sunday church and keyboard
  - date night and protected time with your wife
  - the bedtime target, with wind-down 30 minutes before
  - imported calendar events
  
  You can edit, reschedule or skip any item on purpose. Skips, rest days and items hidden on a Minimum Viable Day are never counted against you.
- **Top three:** suggested from goal-linked and weekly actions, goals at risk, and areas you haven't touched in 7 days. Tap Edit to choose your own.
- **Cascade:** Annual goals contain quarterly milestones (Q1–Q4 phases), which contain monthly objectives. Weekly actions (tasks set to "This week") get scheduled onto days. Evidence, risks, dependencies and status sit on each goal.
- **Analytics:** calculated only from saved records. Charts show an empty state until real data exists, and nothing is invented or back-filled.
- **Reviews:** weekly, monthly and quarterly. Each shows **Facts** (from your records), **Self-assessment** (your input) and **Suggestions** (generated by fixed rules, labelled as such). There's no AI service connected, so nothing personal is sent anywhere.

## Privacy reminder

This is a personal app. Don't enter DVS case details, client information or government documents. Keep learning notes general. Only import a calendar that doesn't hold confidential work details.

## Known limits

- One phone is the main copy. A second device gets your data by restoring a backup, not by live two-way sync.
- Calendar import reads `.ics` files and takes only the first occurrence of repeating events. There's no live calendar connection.
- Voice input uses the iPhone keyboard's microphone. The in-app mic button only appears where the browser supports speech recognition.
- RICS CPD targets (20 hours, 10 formal) are starter values. Check current RICS rules.
