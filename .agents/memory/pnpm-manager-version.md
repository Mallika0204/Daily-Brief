---
name: pnpm manager version in Replit
description: Replit's installed pnpm can differ from a root packageManager pin and fail before the app starts.
---

When the root `package.json` pins a pnpm release that is not available in the environment, Replit's pnpm may try to bootstrap that release with `pnpm add pnpm@<version>` and abort before running the project. Check the installed version with `pnpm --version` before adding or changing a `packageManager` pin.

**Why:** In this workspace the installed pnpm was 10.26.1, while the root pin requested 10.28.2; the self-install command failed with SIGABRT.

**How to apply:** Keep the project aligned with the environment's supported package manager, and confirm `pnpm --version` succeeds before retrying workflows.
