Exchainge Frontend
==================
- Next.js 15 + React 19 single-package app cloned from the monorepo frontend.
- Pure client UI: all data flows through the external REST API defined by `NEXT_PUBLIC_API_BASE_URL`.
- Styled with TailwindCSS 4, components live under `src/app` and `src/components`.
- Bundled and managed with Bun (Node.js works too, but Bun scripts are the project default).

## Requirements
- Bun v1.1+ (or Node 20+ if you prefer `npm` / `pnpm`)
- Copy `.env.template` → `.env.local` and provide real values.
  - Required: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID`
  - Optional: `NEXT_PUBLIC_SOLANA_RPC_URL`

## Install & Develop
```bash
bun install
cp .env.template .env.local  # then edit with real values
bun run dev                  # http://localhost:3000
```

## Quality gates
```bash
bun run lint
bun run build
```

## Project Notes
- API helpers live in `src/lib/api/` and centralize calls to the backend.
- Dataset mapping/helpers are in `src/lib/mappers/dataset.ts`; update there if the backend response changes.
- No backend/server utilities are bundled; anything beyond fetches must be done on the API side.
- Privy and Solana wallet providers live under `src/components/providers`, while on-chain UI hooks/components live in `src/components/solana` and `src/lib/solana/`.
- Solana smart contract source lives separately at [exchainge-ai/exchainge-program](https://github.com/exchainge-ai/exchainge-program); reference that repo for IDL or on-chain updates.
