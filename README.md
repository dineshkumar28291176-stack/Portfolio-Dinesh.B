# Dinesh B. Resume / Portfolio

This is a static HTML, CSS, and JavaScript portfolio. Contact messages are
intended to be stored in a private Google Sheet through the Google Apps Script
backend in `GoogleAppsScript.gs`. Browser `localStorage` only remembers the
visitor's light/dark theme; it is not the message database.

## What is the Google Sheets database?

For this small contact inbox, the spreadsheet is a simple table: each message
is a row, with columns for `Timestamp`, `Name`, `Email`, `Subject`, and
`Message`. It is not a full database server, but it provides a convenient
owner-managed place to store and review portfolio messages.

Keep the spreadsheet private. The Apps Script runs as its owner and accesses
the sheet using its ID, so visitors do not need direct access to the
spreadsheet.

## How message storage and retrieval work

1. A visitor fills out the Contact form on the website.
2. `script.js` validates the form and sends a JSON `submit` request to the
   configured Apps Script web app.
3. `GoogleAppsScript.gs` validates and limits the fields, protects text from
   being interpreted as a spreadsheet formula, and appends the message and
   timestamp to the `Messages` sheet.
4. An admin opens the inbox section and signs in. The website asks Apps Script
   to check the password and retrieve the rows.
5. Apps Script returns the messages and formatted timestamps. `script.js`
   creates a response card for each message.

The public form request uses browser `no-cors` mode. That lets it send the
request, but prevents the browser from reading Apps Script's response. The
website therefore cannot confirm that a row was saved: it keeps the entered
values and displays an unconfirmed status. Verify a test submission directly
in the `Messages` sheet before relying on the inbox.

## Prepare the Google Sheet and Apps Script

Do these setup steps before deploying either web app:

1. Create a Google Sheet and leave its sharing settings private. Copy the
   spreadsheet ID from its URL (the text between `/d/` and `/edit`).
2. Create a project at [Google Apps Script](https://script.google.com/), paste
   in the contents of `GoogleAppsScript.gs`, and save.
3. In **Project Settings → Script Properties**, add:
   - `SPREADSHEET_ID`: the ID copied in step 1.
   - `ADMIN_PASSWORD`: a unique, long password for the portfolio inbox. Do not
     use your Google account password.
4. Select `setupSheet` in the Apps Script editor and run it once. Approve the
   requested Google Sheets permission. It creates the `Messages` tab and its
   header row if the tab does not exist.

## Admin inbox: what it does and how to use it

The Admin section is a small inbox for the messages stored in the sheet:

- Select **Open admin**, enter the `ADMIN_PASSWORD` you set in Script
  Properties, and select **Sign in**.
- After successful login, the login form is hidden and the response list is
  shown. Each card displays the sender, email, subject, message, and timestamp.
- Select **Refresh** to retrieve the latest rows, or **Sign out** to hide the
  response list and return to the login form.
- The password is not embedded in the site's source code; it is checked by
  Apps Script against Script Properties.

**Security limitation:** the current cross-origin JSONP inbox sends the admin
password as a URL parameter. Use a unique password and do not use this inbox
for sensitive messages. Anyone with that password can read the inbox. The
spreadsheet itself should still remain private.

## Local preview

Open `index.html` in a browser to preview the page and its theme/navigation
controls. The contact form and inbox need a deployed Apps Script URL and an
internet connection. Local preview alone does not verify that Sheets is
receiving messages.

## Deployment

Deploy Apps Script first, then publish the static website:

1. In Apps Script, select **Deploy → New deployment → Web app**. Set **Execute
   as** to **Me** and **Who has access** to **Anyone**, then deploy and
   authorize. Copy the web app URL ending in `/exec`. The web app must be
   reachable by anyone for the public form to submit; the spreadsheet stays
   private and the inbox read actions require the admin password.
2. In `script.js`, replace
   `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with that `/exec` URL.
3. In the GitHub repository, open **Settings → Pages** and set **Build and
   deployment → Source** to **GitHub Actions**.
4. Push the `main` branch. For this existing local repository, after committing
   the Apps Script URL change, run:

   ```powershell
   git push -u origin main
   ```

   The workflow in `.github/workflows/deploy-pages.yml` then publishes the
   static site. Later pushes to `main` trigger a new deployment.
5. When the workflow succeeds, open the Pages URL shown under **Settings →
   Pages**. Test a contact submission by checking the `Messages` sheet, then
   sign into the Admin section and verify the message and timestamp appear.

If you change the Apps Script code after deploying it, update the deployment
to a new version in **Deploy → Manage deployments**.
