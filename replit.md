# Daily Brief

## Run and verify

- The Replit preview starts the `artifacts/daily-brief: web` workflow.
- The workflow runs `pnpm --filter @workspace/daily-brief run dev`.
- Vite listens on the workflow-provided `PORT` and binds to `0.0.0.0`.
- Check the app with `pnpm --filter @workspace/daily-brief run typecheck` and `pnpm --filter @workspace/daily-brief run build`.

The current page is a startup placeholder. Live news sources and product features are not connected yet.
