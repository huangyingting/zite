> ## Documentation Index
> Fetch the complete documentation index at: https://developers.zite.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Workflows

> createEndpoint from zitejs/backend: typed input/output, authentication, errors, streaming, and calling workflows from the frontend.

A [workflow](/concepts/workflows) is one file in an app's `src/api/` directory that
default-exports `createEndpoint` from `zitejs/backend`: server-side logic with typed inputs and outputs.

```typescript theme={"system"}
// apps/helpdesk/src/api/createTicket.ts
import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Create a support ticket',
  authenticated: true,
  inputSchema: z.object({ subject: z.string().min(1) }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    if (!input.subject) throw new ZiteError({ code: 'BAD_REQUEST', message: 'Subject is required' });
    const ticket = await zite.tickets.create({
      record: { subject: input.subject, status: 'open', assigneeEmail: context.user.email },
    });
    return { id: ticket.id };
  },
});
```

<Note>
  Each workflow must be a **default export**, and the filename is the workflow id, a single segment
  matching `^[a-zA-Z0-9_-]+$` (no subfolders under `src/api/`).
</Note>

## Config

| Field | Type | Notes |
| - | - | - |
| `description` | `string` | Human/agent-readable summary |
| `inputSchema` | Zod schema | Validates and types `input` |
| `outputSchema` | Zod schema | Documentation only. Not validated at runtime, and not what types the return value |
| `authenticated` | `boolean` | When `true`, `context.user` is populated |
| `stream` | `boolean` | Enables streaming responses (see below) |
| `schedule` | schedule config | Run on a cadence. See [Schedules](/framework/schedules) |
| `webhook` | webhook config | Receive inbound webhooks. See [Webhooks](/framework/webhooks) |
| `execute` | function | `async ({ input, context, stream? }) => output` |

## Context

`execute` receives a `context`:

| Property | Type | When populated |
| - | - | - |
| `user` | `{ id, email, firstName?, lastName? }` | Whenever a caller is signed in. `null` otherwise |

`id` and `email` are always present when a user is signed in. `name` and `image` are never sent to a
workflow. If the app uses [user sync](/concepts/authentication#user-sync), `context.user` **is** the
synced row rather than the identity above: `id` is that record's id, and the row's own columns are what
you read off it.

<Warning>
  **`context.user` can be `null` even where the type says it cannot.** The type only widens to allow
  `null` on workflows that declare a `schedule` or `webhook`. At runtime it is also `null` for an
  anonymous caller on a workflow without `authenticated: true`, and when user sync is on but the caller
  has no synced row yet. Reading `context.user.email` there compiles cleanly and throws. Set
  `authenticated: true` when you need a user, or null-check regardless of the type.
</Warning>

`process.env.ZITE_APP_URL` is set to your app's public URL. Use it to build links instead of hardcoding.

## Errors

Throw `ZiteError` to return a controlled error. The platform maps its `code` to an HTTP status:

```typescript theme={"system"}
throw new ZiteError({ code: 'NOT_FOUND', message: 'Not found' });

// Optional: a message safe to show an end user, used instead of `message` in a published app.
throw new ZiteError({
  code: 'CONFLICT',
  message: `Ticket ${id} already merged into ${target}`,
  userFacingMessage: 'That ticket has already been merged.',
});
```

A positional form, `new ZiteError('Not found', 'NOT_FOUND')`, also works and defaults the code to
`'INTERNAL_ERROR'`, but the object form above is preferred. Anything that is not a `ZiteError`, including
an error carrying only a numeric `statusCode`, returns a generic 500.

| Code | Status |
| - | - |
| `BAD_REQUEST` | 400 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `RATE_LIMITED` | 429 |
| `INTERNAL_ERROR` | 500 |

## Calling workflows from the frontend

Workflows are called through a generated, typed client (like tRPC). Each workflow exports a camel-cased
caller plus its input/output types:

```tsx theme={"system"}
import { createTicket, CreateTicketInputType, CreateTicketOutputType } from 'zitejs/api';

const { id } = await createTicket({ subject: 'Printer is down' });
```

After adding, renaming, or deleting a workflow file, regenerate the client with `npx zitejs generate` from
the workspace root (the [build tools](/mcp/build-tools) do this for you).

Workflows are also reachable publicly at `POST /public/{flowId}/api/{name}`.

## Streaming

Set `stream: true` and write chunks as you go:

```typescript theme={"system"}
export default createEndpoint({
  stream: true,
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({ text: z.string() }),
  execute: async ({ input, stream }) => {
    await stream.write({ token: 'thinking…' });
    // stream.forward(asyncIterable) pipes an async iterable (e.g. an LLM stream) through
    const text = await stream.forward(model.stream(input.prompt));
    return { text };
  },
});
```

On the frontend, streaming workflows are called with the generated streaming caller, which yields chunks
and resolves a final `result`.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.