# Building the clickOne offline desktop app

This produces a Windows installer (`.exe`) for clickOne that runs completely
offline — no internet connection, no separate database server, all data
stored on the user's own computer in a local file.

This is a **one-time build step**, not ongoing development. You run it
once (or whenever you want a new version) on a Windows computer, and it
produces an installer file you can hand to anyone. Nothing here affects
the live website/cloud version — they're built from the same code but are
completely separate outputs.

## Who this is for

Someone comfortable running commands in a terminal. No programming
knowledge is required — every command below can be copy-pasted exactly as
written.

## 1. Prerequisites (install these first, one time)

1. **Node.js** — if you can already run this project's website locally,
   you already have this. Otherwise download the LTS version from
   [nodejs.org](https://nodejs.org).

2. **Visual Studio Build Tools** — needed so a database component
   (SQLite) can be compiled for this specific computer.
   - Download "Build Tools for Visual Studio" from
     [visualstudio.microsoft.com/downloads](https://visualstudio.microsoft.com/downloads/)
     (scroll to "Tools for Visual Studio").
   - During install, check the **"Desktop development with C++"** workload.
   - This is a large download (~2-6 GB) and can take a while — it only
     needs to be done once on this computer.

3. **Git** — to download the project code, if not already installed
   ([git-scm.com](https://git-scm.com)).

## 2. Get the code

Open a terminal (PowerShell) and run:

```
git clone https://github.com/Adhavan-026/plastio.bi.xe.git
cd plastio.bi.xe
```

(If you already have the folder, just `cd` into it and run `git pull`
instead to get the latest version.)

## 3. Install the project's dependencies

```
npm install
```

This downloads everything the project needs. Takes a few minutes. It's
normal to see some warnings — only stop and ask for help if it ends with
a red "npm error" and the command doesn't finish.

## 4. Build the installer

```
npm run package:desktop
```

This does everything automatically: builds the app, prepares the local
database piece, and creates the installer. Takes several minutes — let it
run to completion.

## 5. Find the installer

Look in the new `dist-desktop` folder inside the project. You'll find:

- **`clickOne-Setup.exe`** — the normal installer. Double-click it, click
  through like installing any Windows program. This is the one to give to
  an actual shop/customer.
- **`clickOne-Portable-<version>.exe`** — a version that runs without
  installing anything, useful for quick testing.

## 6. Test it

See the checklist below. Test on the computer you built it on first, then
ideally on a second, clean Windows computer that has never had Node.js or
this project on it — that's the real test of whether it works for an
actual customer.

## 7. Publish it so the website's download link works

The website's "Download the Windows app" link
(`src/app/page.tsx`) always points at
`https://github.com/Adhavan-026/plastio.bi.xe/releases/latest/download/clickOne-Setup.exe`
— GitHub's stable "latest release" URL. To make that link actually work,
upload the file to a GitHub Release (only needs the website, no terminal):

1. Go to `https://github.com/Adhavan-026/plastio.bi.xe/releases/new`
   (log into GitHub first if needed).
2. Under "Choose a tag," type a version like `v0.1.0` and pick "Create new
   tag."
3. Give it a title (e.g. "clickOne 0.1.0").
4. Drag `dist-desktop\clickOne-Setup.exe` from File Explorer into the box
   that says "Attach binaries by dropping them here."
5. Click **"Publish release."**

That's it — the website's download link starts working immediately. Next
time you build a new version, repeat this with a new tag (e.g. `v0.2.0`)
and it automatically becomes the new "latest" one the website serves —
no website changes needed.

## If something goes wrong

- **Step 4 fails mentioning `node-gyp`, `better-sqlite3`, or "Visual
  Studio not found"** — Visual Studio Build Tools (step 1.2) isn't
  installed correctly. Reinstall it, making sure "Desktop development
  with C++" is checked, then try step 4 again.
- **The installer runs but the app window shows an error on startup** —
  screenshot the error message (it's written in plain language, not a
  technical crash) and share it.
- Nothing else in this project (the live website) is affected no matter
  what happens here — this only touches files in `dist-desktop`,
  `.next`, and `node_modules`, none of which are part of the live site.

---

## Manual test checklist (after installing)

Run through this on a real install, not just the portable version:

- [ ] App opens to a working dashboard with no login screen
- [ ] On a fresh install, opening Invoices/Products/Parties/etc. redirects
      to an "Activate" page instead of showing the feature (expected — see
      Activation below). Dashboard and Settings stay reachable either way.

**Activation** (needs internet just for this part):
- [ ] On the website, sign up for a shop, go to Settings → "Desktop App"
      (or the landing page's "Get the Windows app" link), pick a plan
- [ ] In the Super Admin panel, find that shop and issue a subscription —
      note the License Key + Activation Code shown
- [ ] In the desktop app's Activate page, paste in that key + code →
      confirms success and shows an expiry date
- [ ] Invoices/Products/etc. are now reachable
- [ ] Turn off Wi-Fi entirely — the app keeps working normally (the
      internet was only needed for the activation step itself)
- [ ] Entering a random/wrong key+code shows a clear error and changes
      nothing
- [ ] Entering the key+code while offline shows a clear "couldn't reach
      the activation server, check your internet connection" message
      instead of crashing

**Everyday use:**
- [ ] Can add a product
- [ ] Can add a party (customer/supplier)
- [ ] Can create a sales invoice
- [ ] Invoice print view opens correctly, "Print" shows a real print
      dialog with printers/"Save as PDF" available
- [ ] Reports pages (Sales, Stock, etc.) load and their print/download
      buttons work
- [ ] Settings page → "Backup to file" saves a file successfully, shows
      "Last backup" updates
- [ ] Settings page → "Restore from file" — pick the file just backed up,
      confirm the app asks to restart, restart, confirm data is intact
- [ ] Restore rejects a random unrelated file with a clear message
      (doesn't corrupt anything)
- [ ] Close the app fully (not just the window) and reopen it — data from
      before is still there
- [ ] Uninstall and reinstall — a completely fresh shop is created, no
      leftover data from before (unless a backup is restored)
- [ ] No internet connection is required for any of the above (test with
      Wi-Fi off) — only the one-time activation step needs it
