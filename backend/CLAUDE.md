---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: true
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

The structure of the project:
- We are using monorepo with bun
- The website is in the folder packages/webapp (nextjs with tailwind 4)
- Use shadcn components where possible
- Use `bunx --bun shadcn@latest add ` command to add shadcn components in the webapp project
- The styles should be updated in the packages/webapp/src/app/globals.css
- Do not run build or dev commands unless you are told to do that.
- Always try to use the next server actions instead of using api GET or POST endpoints in packages/webapp
- The supabase migrations and database types are in packages/supabase
- To create a new migration in supabase, always use `bun supabase migrations new` command, and do not ever change the existing migration files unless explicitly instructed.
- When creating a new table in supabase, we want to enable rls, but we do not want to create any new policies.