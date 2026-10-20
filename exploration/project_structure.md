> ## Documentation Index
> Fetch the complete documentation index at: https://developers.zite.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Project structure

> How a Zite workspace is laid out: the monorepo, generated .zite/ files, config files, and the import conventions.

A workspace is a `zitejs` monorepo: one repository holding every app and workflow, the generated types,
and a shared design system. Agents build inside it; this page is the map so you (and they) know where
everything lives.

## Layout

```text theme={"system"}
my-workspace/
├── zite.config.json        # project config: name + basePublicIdentifier (the database)
├── zite.schema.json        # the enriched database schema (SDK names, field types)
├── .zite/                  # generated: db.ts (typed database client) — never edit
├── context/                # docs you write for the agent (see Context)
├── packages/
│   └── components/         # shared shadcn/ui design system → @project/components
└── apps/
    └── helpdesk/           # one directory per app
        ├── src/
        │   ├── App.tsx     # app entry (you write this)
        │   ├── api/        # backend workflows — one file per workflow
        │   ├── lib/        # raw integration SDK usage (Slack, Stripe, …)
        │   └── index.css   # theme (CSS variables)
        ├── .zite/          # generated: api.ts, user.ts, auth.ts, backend.ts — never edit
        ├── zite.config.json # app config: accessMode, integrations, userSync, …
        └── vite / tailwind / tsconfig / package.json
```

## Generated files

The `.zite/` directories, at the workspace root and inside each app, are **generated and must never be
edited**. `src/main.tsx` is generated too. They're refreshed by `zitejs generate` whenever the schema or
workflows change (the build tools run this for you):

| File | Import as | Contains |
| - | - | - |
| `.zite/db.ts` (root) | `zitejs/db` | The typed database client (`zite.<table>`, `zite.sql`, …) |
| `apps/*/​.zite/api.ts` | `zitejs/api` | Typed callers for the app's workflows |
| `apps/*/​.zite/auth.ts` | `zitejs/auth` | `useAuth`, narrowed to this app's `User` type |
| `apps/*/​.zite/backend.ts` | `zitejs/backend` | `createEndpoint`, `ZiteError`, typed `context` |
| `apps/*/​.zite/integrations/airtable.ts` | `zitejs/integrations` | Typed Airtable client (if Airtable is connected) |

Read them to learn the exact table names, record types, and workflow signatures. Never modify them.

## Import conventions

* **Platform SDKs:** always via `zitejs/*` aliases: `zitejs/db`, `zitejs/backend`, `zitejs/api`,
  `zitejs/auth`, and the utility modules (`zitejs/schedules`, `zitejs/notifications`, `zitejs/pdf`,
  `zitejs/upload`). Never import from `.zite/` by relative path.
* **Shared UI:** from `@project/components/ui/*` (e.g. `import { Button } from '@project/components/ui/button'`).
* **Your own files:** components, hooks, and utilities you create in an app's `src/`, via relative paths
  (`./components/Foo`).

## Config files

<CardGroup cols={2}>
  <Card title="zite.config.json (project)">
    At the workspace root: `{ "project": { "name": "...", "basePublicIdentifier": "..." } }`. This is the workspace
    name and the id of its database.
  </Card>

  <Card title="zite.config.json (app)">
    In each `apps/<dir>/`: `accessMode`, `integrations`, `userSync`, `envVars`, `authentication`,
    `seoSettings`, `pwaSettings`. See [Authentication](/concepts/authentication) and
    [Title, favicon, and link previews](/framework/branding-seo).
  </Card>

  <Card title="zite.schema.json">
    The enriched database schema: table and field SDK names, types, and options. Drives `.zite/db.ts`.
  </Card>
</CardGroup>

## Context

`context/` at the root holds Markdown documents you write for the agent: data model notes, policies,
specs, brand guidelines. The agent sees an inventory of them every turn and reads the ones relevant to
what it's building. See [Context](/framework/context).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.