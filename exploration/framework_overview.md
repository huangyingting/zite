> ## Documentation Index
> Fetch the complete documentation index at: https://developers.zite.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Zite.js

> The framework every Zite app is built on: a typed database client, backend workflows, auth, schedules, and webhooks over one workspace database.

Zite.js is the framework for building business operating systems: the internal tools, portals, admin
consoles, and workflows a company runs on. Every Zite app is a Zite.js app: real TypeScript in a
[workspace monorepo](/framework/project-structure) that you and your agents can read and extend.

The framework assumes one database per [workspace](/concepts/workspaces). Tables are defined once on that
database and the typed client is generated from them, so an app is mostly the screens and the
[workflows](/framework/workflows).

## The surface

Platform code is imported through `zitejs/*` aliases. They're generated into your workspace from its schema
and workflows, which is why they know your table and workflow names:

| Import | What it gives you |
| - | - |
| [`zitejs/db`](/framework/database-client) | The typed database client: `findAll`, `create`, and read-only `zite.sql()` |
| [`zitejs/backend`](/framework/workflows) | `createEndpoint`, for typed backend workflows |
| [`zitejs/api`](/framework/workflows) | Typed callers for your app's workflows, from React |
| [`zitejs/auth`](/framework/auth) | `useAuth` and the signed-in user |
| [`zitejs/schedules`](/framework/schedules) | Run workflows on a cadence, or once at a future time |
| [`zitejs/notifications`, `zitejs/pdf`, `zitejs/upload`](/framework/utilities) | In-app notifications, PDF generation, file uploads |
| [`zitejs/integrations`](/concepts/integrations-secrets) | Typed clients for connected third-party services |

Workflows can also receive [inbound webhooks](/framework/webhooks).

## A workflow

A backend workflow is one file. It reads the database through the typed client, and the frontend calls it
with a generated, typed caller:

```typescript theme={"system"}
// apps/helpdesk/src/api/listTickets.ts
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  authenticated: true,
  execute: async () =>
    zite.tickets.findAll({ filters: { status: 'open' } }),
});
```

## Who writes it

An agent connected to the [Zite MCP](/mcp/overview) scaffolds apps, writes the code, and publishes them
from a cloud sandbox. The output is not a black box. It's the monorepo above, which you can read, review,
and edit like any other TypeScript project.

<Note>
  Don't confuse the two clients. The `zite` client from [`zitejs/db`](/framework/database-client) is
  generated *inside* a Zite app. The `Zite` client imported from the package root is for calling the
  [Database API](/api/overview) from *outside* Zite with an API key. See the
  [JavaScript SDK](/api/sdk).
</Note>

## Next

<CardGroup cols={2}>
  <Card title="Project structure" icon="folder-tree" href="/framework/project-structure">
    How a workspace is laid out, and which files are generated.
  </Card>

  <Card title="Database client" icon="database" href="/framework/database-client">
    Query and mutate your tables with the typed `zite` client.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.