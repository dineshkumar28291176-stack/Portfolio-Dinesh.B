# Dinesh B. Portfolio

A static portfolio published with GitHub Pages. Contact form messages are
written to a private Google Sheet through the Google Apps Script web app in
`GoogleAppsScript.gs`. The browser's `localStorage` is used only to remember
the display theme; it is not the contact-message database.

## Set up the Google Sheets backend

1. Create a Google Sheet and keep its sharing settings private. Copy the
   spreadsheet ID from its URL (the text between `/d/` and `/edit`).
2. Create a project at [Google Apps Script](https://script.google.com/), paste
   in the contents of `GoogleAppsScript.gs`, and save.
3. In **Project Settings → Script Properties**, add:
   - `SPREADSHEET_ID`: the ID copied in step 1.
   - `ADMIN_PASSWORD`: a unique, long password used only for the inbox.
4. Select `setupSheet` in the Apps Script editor and run it once. Approve the
   requested Google Sheets permission. This creates the `Messages` tab and its
   header row.
5. Select **Deploy → New deployment → Web app**. Set **Execute as** to **Me**
   and **Who has access** to **Anyone**, then deploy and authorize. Copy the
   web app URL ending in `/exec`.
6. In `script.js`, replace
   `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.

The web app must be accessible to anyone so visitors can submit the public
contact form. Do not make the spreadsheet public or put its ID or the admin
password in the frontend. The admin password is sent to Apps Script as a URL
parameter to support the browser inbox; use a unique password and do not reuse
an account password. Anyone with that password can view inbox messages.

The contact form uses a cross-origin `no-cors` request, so the browser cannot
read Apps Script's response and cannot confirm that a row was saved. The form
keeps its values and shows an unconfirmed status; verify a test submission in
the `Messages` sheet before relying on the inbox.

## Publish with GitHub Pages

1. Create a **public** repository on GitHub. Do not initialize it with a README,
   license, or `.gitignore` (this project already has files).
2. From this project directory, add the new repository as `origin` and push:

   ```powershell
   git add .
   git commit -m "Publish portfolio website"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USER>/<YOUR-REPOSITORY>.git
   git push -u origin main
   ```

   If `origin` is already configured, update its URL instead of adding it again.
3. In the repository, open **Settings → Pages** and set **Build and
   deployment → Source** to **GitHub Actions**.
4. The workflow at `.github/workflows/deploy-pages.yml` publishes the site on
   each push to `main`. Once its run completes, open the Pages URL shown under
   **Settings → Pages** (usually
   `https://<YOUR-USER>.github.io/<YOUR-REPOSITORY>/`).
5. Test the contact form and the admin inbox on the published URL. New messages
   should appear in the private sheet's `Messages` tab.

## Local preview

Open `index.html` in a browser to preview the static page. The contact form and
admin inbox require the deployed Apps Script URL and an internet connection.
