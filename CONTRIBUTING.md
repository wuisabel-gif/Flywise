# Contributing to Flywise

Thank you for helping make disruption recovery clearer and fairer for travelers. Contributions of documentation, tests, accessibility improvements, interface refinements, and provider integrations are welcome.

## Find an issue

If this is your first contribution, look for issues labeled [`good first issue`](https://github.com/wuisabel-gif/Flywise/labels/good%20first%20issue). Issues labeled [`help wanted`](https://github.com/wuisabel-gif/Flywise/labels/help%20wanted) are also open to community contributions.

Before starting:

1. Read the issue and its acceptance criteria.
2. Comment that you would like to work on it so contributors do not duplicate effort.
3. Ask a focused question if the expected behavior is unclear.
4. Keep the pull request limited to the issue you selected.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or newer
- npm
- Git

## Set up the project

1. Fork the repository on GitHub.
2. Clone your fork and enter the project directory:

   ```bash
   git clone git@github.com:YOUR-USERNAME/Flywise.git
   cd Flywise
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

5. Open <http://127.0.0.1:5173/>.

Most interface, documentation, scoring, and test contributions do not require live airline access. The project can be built and tested without a Duffel token.

## Available commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run dev:server` | Start the Express API and MCP server on port 3000. |
| `npm test` | Run the Vitest test suite once. |
| `npm run check` | Run TypeScript checks. |
| `npm run build` | Type-check and create the production frontend and MCP widget build. |

Run `npm run build` before testing the interactive MCP widget so the server can load its generated JavaScript and CSS.

## Optional live Duffel search

Live airline inventory requires a Duffel test or live access token. You do not need one for ordinary contributions.

If your change specifically requires live search, create a private local environment file from `.env.example` or export the values in your shell. Never commit the resulting file or token.

Start the API with the server-only token available in its environment:

```bash
DUFFEL_ACCESS_TOKEN=your_private_token npm run dev:server
```

In another terminal, point Vite at the local API:

```bash
VITE_FLYWISE_API_URL=http://127.0.0.1:3000 npm run dev
```

Never place `DUFFEL_ACCESS_TOKEN` in a variable beginning with `VITE_`. Vite variables are included in browser JavaScript.

## Protect traveler data and credentials

- Never commit `.env`, `.env.local`, API keys, access tokens, or credentials.
- Never add real booking references, ticket numbers, loyalty numbers, payment information, or passenger details to fixtures, screenshots, issues, or pull requests.
- Use invented or sanitized data in tests and examples.
- Keep exchange costs labeled as estimates unless an authorized airline or servicing system confirms them.
- Do not describe Flywise as guaranteeing ticket exchange eligibility.

If you accidentally expose a credential, revoke it immediately and tell the repository maintainer. Removing it in a later commit is not sufficient because it remains in Git history.

## Make your change

Create a descriptive branch from the latest `main` branch:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b improve-airport-search
```

Keep changes focused and use concise commit messages. Add or update tests when behavior changes. For visual changes, include before-and-after screenshots in the pull request when practical, but make sure they contain no personal travel information.

## Check your work

Run these commands before opening a pull request:

```bash
npm test
npm run check
npm run build
```

Also verify the affected workflow manually. For interface changes, check keyboard operation and at least one narrow viewport.

## Open a pull request

Push your branch to your fork and open a pull request against `wuisabel-gif/Flywise:main`.

Your pull request should include:

- a short description of what changed and why;
- a link to the related issue, such as `Closes #123`;
- the checks you ran;
- screenshots for meaningful interface changes;
- any limitations or follow-up work.

## Pre-submission checklist

- [ ] The change is focused on one issue or goal.
- [ ] No credentials or real traveler data are included.
- [ ] Tests were added or updated when behavior changed.
- [ ] `npm test` passes.
- [ ] `npm run check` passes.
- [ ] `npm run build` passes.
- [ ] Documentation reflects any user-visible or setup changes.
