> ## Documentation Index
> Fetch the complete documentation index at: https://developers.zite.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Database client

> The typed zitejs/db client: findAll, findOne, create, update, delete, bulkCreate, and read-only SQL with zite.sql().

Every app gets a typed database client, generated from the workspace schema. Import it from `zitejs/db`:

```typescript theme={"system"}
import { zite } from 'zitejs/db';
```

The client is used inside backend [workflows](/framework/workflows). The frontend never talks to the
database directly. Each table is a property on `zite`, addressed by its **SDK name** in camelCase
(`zite.tickets`, `zite.timeSlots`), with fully-typed record types. Read the generated `.zite/db.ts` to see
the exact names and types.

## Methods

```typescript theme={"system"}
// Query many rows
const { records, hasMore } = await zite.tickets.findAll({
  filters: { status: 'open' },
  sort: [{ field: 'createdAt', direction: 'desc' }],
  limit: 100,
  offset: 0,
});

// One row by id (or by filter)
const ticket = await zite.tickets.findOne({ id: 'rec_123' });
const byEmail = await zite.customers.findOne({ filters: { email: 'a@b.com' } });

// Create, update, delete
const created = await zite.tickets.create({ record: { subject: 'Help', status: 'open' } });
const updated = await zite.tickets.update({ id: created.id, record: { status: 'closed' } });
await zite.tickets.delete({ id: created.id });

// Insert many (optionally upsert on matching fields)
const result = await zite.customers.bulkCreate({
  records: [{ email: 'a@b.com' }, { email: 'c@d.com' }],
  matchOn: ['email'],
});
```

| Method | Arguments | Returns |
| - | - | - |
| `findAll` | `{ limit?, offset?, sort?, filters?, fields? }` | `{ records, hasMore }` |
| `findOne` | `{ id? }` or `{ filters? }` (+ `fields?`) | the record, or `undefined` |
| `create` | `{ record }` | the created record |
| `update` | `{ id, record }` | `{ id, fields }` |
| `delete` | `{ id }` | `{ success, id }` |
| `bulkCreate` | `{ records, matchOn? }` | `{ success, records }` |

`bulkCreate` takes at most **100 records** per call. More than that is rejected, so chunk larger
imports.

## Filters and sorting

Filters are objects keyed by field SDK name. A bare value means equality; an object applies an operator:

```typescript theme={"system"}
{ status: 'open' }                      // equality
{ createdAt: { gt: '2026-01-01' } }     // operator
```

| Operator | Meaning | Example |
| - | - | - |
| *(bare value)* | Equals | `{ status: 'open' }` |
| `contains` | Substring match | `{ subject: { contains: 'refund' } }` |
| `not` | Not equal | `{ status: { not: 'closed' } }` |
| `in` | Is one of | `{ status: { in: ['open', 'pending'] } }` |
| `notIn` | Is not one of | `{ status: { notIn: ['closed'] } }` |
| `gt` | Greater than | `{ createdAt: { gt: '2026-01-01' } }` |
| `gte` | Greater than or equal | `{ priority: { gte: 3 } }` |
| `lt` | Less than | `{ createdAt: { lt: '2026-02-01' } }` |
| `lte` | Less than or equal | `{ priority: { lte: 2 } }` |

<Note>
  There is no `eq` or `neq` here: equality is the bare-value shorthand.
</Note>

<Warning>
  **A filter key that isn't a field SDK name is silently dropped, not rejected.** The condition is
  discarded and the rest of the filter still applies, so the query comes back broader than you wrote. If
  every key was a typo, nothing is filtered and you get every row. Check names against `.zite/db.ts`.
</Warning>

Sort is an array: `sort: [{ field: 'createdAt', direction: 'desc' }]`. Use `fields: ['subject', 'status']`
to fetch only the columns you need.

<Warning>
  `limit` defaults to **500** and caps at **2,000** (`hasMore` tells you there are more). Passing a
  larger `limit` is an error, not a silent clamp. For counts, sums, group-bys, and joins, use
  `zite.sql()`. Aggregating in JavaScript over a capped result set gives wrong numbers on large tables.
</Warning>

## Read-only SQL

`zite.sql()` runs a single read-only `SELECT` against the workspace database using human-readable SDK names:

```typescript theme={"system"}
const { rows, columns, rowCount, truncated } = await zite.sql({
  query: `
    SELECT "status", COUNT(*) AS n
    FROM "Tickets"
    WHERE "createdAt" > $1
    GROUP BY "status"
  `,
  params: ['2026-01-01'],
});
```

Always use SDK names, never display labels. A wrong name is a runtime error, not a type error:

| Identifier | Convention | Quote? | Example |
| - | - | - | - |
| Table | PascalCase SDK name | Yes | `"Tickets"` |
| Field | camelCase SDK name | Yes | `"assigneeEmail"` |
| System column | lowercase | Optional | `id`, `created_at`, `updated_at` |
| Link table | Both table SDK names, alphabetical | Yes | `"Tickets"` + `"Users"` → `"TicketsUsers"` |
| Link table id column | camelCase table name + `Id` | Yes | `"ticketsId"`, `"usersId"` |

Postgres lowercases unquoted names, which is why everything but the system columns must be double-quoted.
The `.zite/db.ts` header lists the link tables for your workspace.

<Warning>
  `SELECT` only. Pass runtime values through `params` (`$1`, `$2`, …), and never string-interpolate them into
  the query. Soft-deleted rows are excluded automatically.
</Warning>

Results are capped at 2,000 rows. The cap truncates silently rather than erroring, so check
`truncated` and paginate in SQL rather than assuming you got everything. Queries time out after 10
seconds.

## Also on the client

The generated `zite` object also exposes `zite.auth.findAllUsers()` and
`zite.auth.updateUserProfile()` for the workspace's users. In-app notifications are a platform primitive
rather than part of the database client, so they come from `zitejs/notifications`
(see [Notifications](/framework/utilities#notifications)).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.