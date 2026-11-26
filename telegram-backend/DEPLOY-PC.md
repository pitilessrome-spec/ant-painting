# Deploy the backend from your own Windows PC

I cannot reach your accounts or your computer. You do each step below yourself and keep every secret on your machine. Never paste a token, password, database URL or admin key into a chat, a file in the repository, or a screenshot. If one was shared by accident, revoke it right away: `/revoke` in @BotFather, reset the database password in Neon, and generate a new `ANT_ADMIN_KEY`.

Run these in PowerShell unless noted.

## 0. Tools
- Git for Windows, Node.js 20 or newer, and a Vercel account, a Neon account, and a Telegram account.

## 1. Get the code on your PC
```
git clone https://github.com/pitilessrome-spec/ant-painting.git
cd ant-painting
git switch -c deploy/setup-kit
git am "C:\path\to\deploy-setup-kit.patch"
```
That patch only adds the helper scripts and this guide, and adds four npm commands to `package.json` plus ignore rules in `.gitignore`. Game code is unchanged.

## 2. Create the database (Neon)
1. In Neon, create a project and copy its PostgreSQL connection string. Keep it private.
2. Do not run migrations yet. Step 5 does that.

## 3. Create the Vercel project
1. In Vercel, choose Add New Project and import the `ant-painting` repository.
2. Set **Root Directory** to `telegram-backend`. Deploy once; it may fail until the variables below exist.
3. In Project Settings, Environment Variables, add these names (values stay in Vercel only):
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_GAME_SHORT_NAME`, `DATABASE_URL`, `GAME_ORIGIN`, `ANT_ADMIN_KEY`.
4. Generate a random webhook secret of 32 or more characters (letters, digits, `_`, `-`). Generate the admin key the same way and keep it at 32 or more characters.
5. Redeploy. Note the address Vercel gives you, for example `https://your-project.vercel.app`.

## 4. Create the bot (BotFather)
1. `/newbot`, then choose a username that ends in `bot`.
2. `/newapp` for the Main Mini App, using the URL `https://pitilessrome-spec.github.io/ant-painting/`.
3. `/newgame` for the native game, with a short name such as `antcanvas`.
4. Copy the bot token into Vercel as `TELEGRAM_BOT_TOKEN` (step 3). Do not write it into any file.

## 5. Create the database tables (on your PC)
```
cd telegram-backend
npm install
npm run db:plan
$env:DATABASE_URL = "paste the Neon connection string here"
npm run db:migrate
Remove-Item Env:DATABASE_URL
```
`db:plan` only lists the files. `db:migrate` applies each file once and records it.

## 6. Check the settings (names only, no values printed)
```
npm run env:check
```
Every line should say `set`. Fix any `MISSING` in Vercel, then redeploy.

## 7. Connect Telegram to the backend
```
$env:TELEGRAM_BOT_TOKEN = "your bot token"
$env:TELEGRAM_WEBHOOK_SECRET = "the same secret you put in Vercel"
$env:API_BASE_URL = "https://your-project.vercel.app"
node scripts/configure-bot.mjs
Remove-Item Env:TELEGRAM_BOT_TOKEN, Env:TELEGRAM_WEBHOOK_SECRET
```

## 8. Point the game page at your backend
Edit `js/telegram.js` in the repository:
- `botUsername` = your bot username without `@`
- `miniAppShortName` = the short name from `/newapp`
- `apiBaseUrl` = `https://your-project.vercel.app`

Commit the change and push it with your own GitHub login. Your PC asks for your credentials; you do not give them to anyone else. GitHub Pages updates in a minute or two.

## 9. Check that it works
```
$env:API_BASE_URL = "https://your-project.vercel.app"
npm run health
```
It prints the HTTP status and the public configuration status. Then open the bot in Telegram on your phone and play the game.

## 10. Report back
Tell me the HTTP status from step 9 and whether the game opened in Telegram, and paste any error text that does not contain a secret. I will then continue with the next step.
