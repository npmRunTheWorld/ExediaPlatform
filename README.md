# Exedia

A place to find work made by people, with their names on it. Every piece shows who made it and how: process shots, Content Credentials when the file has them, a declared AI label, and a credit chain that follows the work through every save.

Built with Next.js 16 (App Router, server actions) on the existing Sanity dataset.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm test           # unit tests for color, C2PA detection and input validation
```

## Environment

Put these in `.env` or `.env.local`. The old `REACT_APP_` names still work, so an existing `.env` keeps running.

| Variable | Old name that also works | Used for |
|---|---|---|
| `SANITY_PROJECT_ID` | `REACT_APP_SANITY_PROJECT_ID` | Sanity project |
| `SANITY_WRITE_TOKEN` | `REACT_APP_SANITY_EDITOR_TOKEN` | Reads and writes, server only |
| `GOOGLE_CLIENT_ID` | `REACT_APP_GOOGLE_API_TOKEN` | Google sign in |
| `ADMIN_SUB` | `REACT_APP_ADM_TOKEN` | Google account id that can use the review queue |
| `SESSION_SECRET` | none | Signs the session cookie. 32+ random characters |
| `SANITY_DATASET` | none | Optional, defaults to `production` |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## How it is put together

| Path | What it holds |
|---|---|
| `src/app/login` | The sign in screen, same look as the original app |
| `src/app/(site)/page.tsx` | Discover: Following, Today's edit, Everything, color and process filters |
| `src/app/(site)/piece/[id]` | A piece: process scrubber, proof, credit chain, palette, comments, reports |
| `src/app/(site)/maker/[id]` | A maker's profile, their work and saves, commission status |
| `src/app/(site)/share` | Posting form with AI declaration, credit and process shots |
| `src/app/(site)/trails` | Ordered boards with notes and collaborators |
| `src/app/(site)/review` | Admin queue for reports and picking Today's edit |
| `src/app/actions.ts` | Every write. Each one checks the signed session first |
| `src/lib` | Sanity client, session, queries, validation, color and C2PA helpers |
| `src/proxy.ts` | Sends signed-out visitors to the login page |

## Security notes

- The Sanity token is only read on the server. Nothing in the browser bundle can write to Sanity.
- Google sign in is verified on the server (signature, issuer, audience, expiry). The session is a signed, httpOnly cookie.
- All GROQ queries take user input as parameters.
- Only the maker or an admin can delete a piece. The admin check runs on the server.
- Uploads are checked by their first bytes, not their file name, and capped at 12 MB (4 MB per process shot).

## Known limits

- Content Credentials: the server detects a C2PA manifest but does not validate its signature yet, so the UI says "attached", not "verified".
- Color search filters up to 400 recent pieces per request. Fine for now, but it needs a stored color index once the archive grows.
- Reports can be abused. They only queue a piece for a person to look at and never hide anything on their own.
