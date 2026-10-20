> ## Documentation Index
> Fetch the complete documentation index at: https://zite.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Audit log event types

> A complete reference of every event tracked in Zite audit logs, including descriptions and payload fields.

This page lists every event type captured by Zite audit logs. Each event includes a **timestamp**, **actor**, **outcome**, and an **event-specific payload** with additional details.

Events marked with a `shield icon` <Icon icon="shield-halved" size={16} /> are considered **security-critical** — actions that could affect account security or data integrity.

***

## Database tables

| Event | Description |
| - | - |
| `db.table.create` | A new table was created in a database. |
| `db.table.rename` | A table was renamed. Payload includes the old and new names. |
| `db.table.update` | A table's settings were updated. Payload includes the full set of changes. |
| `db.table.reorder` | Tables were reordered within a database. |
| `db.table.delete` | A table was soft-deleted. |
| `db.table.restore` | A previously deleted table was restored. |
| `db.table.duplicate` | A table was duplicated. Payload includes the source table ID. |

## Database fields

| Event | Description |
| - | - |
| `db.field.create` | A new field (column) was added to a table. Payload includes the field type. |
| `db.field.rename` | A field was renamed. Payload includes the old and new names. |
| `db.field.typeChange` | A field's type was converted (e.g., text → number). Payload includes the old and new types. |
| `db.field.update` | A field's settings were updated. Payload includes the full set of changes. |
| `db.field.reorder` | Fields were reordered within a table. |
| `db.field.delete` | A field was soft-deleted. |
| `db.field.restore` | A previously deleted field was restored. |
| `db.field.undoTypeConversion` | A field type conversion was undone, restoring the original type. |

## Database views

| Event | Description |
| - | - |
| `db.view.create` | A new view was created in a table. |
| `db.view.update` | A view's configuration was updated. |
| `db.view.delete` | A view was deleted. |
| `db.view.updateSettings` | A view's display settings (column widths, sort order, etc.) were changed. |

## Databases

| Event | Description | |
| - | - | - |
| `db.base.create` | A new database was created. | |
| `db.base.delete` | A database and all its data were deleted. | <Icon icon="shield-halved" size={16} /> |
| `db.base.copy` | A database was duplicated. Payload includes the source database ID. | |
| `db.base.import` | Database metadata was imported. | |
| `db.base.migrateToIsolated` | A database was migrated to isolated architecture. | |
| `db.organization.deleteAllBases` | All databases in the organization were deleted. | <Icon icon="shield-halved" size={16} /> |

## Imports

| Event | Description |
| - | - |
| `import.airtable` | An Airtable base was imported. Payload includes the Airtable base ID. |
| `import.csv` | A CSV file was imported. Payload includes the table and record counts. |

***

## Authentication

| Event | Description | |
| - | - | - |
| `auth.login.success` | User logged in successfully. Payload includes the login method (`password`, `google`, `microsoft`, `sso`). | <Icon icon="shield-halved" size={16} /> |
| `auth.login.failure` | Login attempt failed. Payload includes the attempted email and failure reason. | <Icon icon="shield-halved" size={16} /> |
| `auth.logout` | User logged out. | |
| `auth.impersonate` | A super-user logged in as another user. Payload includes the target user. | <Icon icon="shield-halved" size={16} /> |

## Passwords & MFA

| Event | Description | |
| - | - | - |
| `auth.password.resetRequest` | A password reset email was requested. | |
| `auth.password.resetComplete` | A password was successfully reset via the reset link. | <Icon icon="shield-halved" size={16} /> |
| `auth.password.selfChange` | A user changed their own password from settings. | |
| `auth.password.adminChange` | An admin changed another user's password. | <Icon icon="shield-halved" size={16} /> |
| `auth.mfa.enable` | MFA was enabled for a user account. | |
| `auth.mfa.disable` | MFA was disabled for a user account. | <Icon icon="shield-halved" size={16} /> |

## Sessions & SSO

| Event | Description | |
| - | - | - |
| `auth.sso.deprovision` | A user was deprovisioned via SSO. | <Icon icon="shield-halved" size={16} /> |
| `auth.session.deleteAll` | All sessions were invalidated for a user. | <Icon icon="shield-halved" size={16} /> |

## API keys

| Event | Description | |
| - | - | - |
| `api.key.enable` | API access was enabled for the organization. | |
| `api.key.regenerate` | The organization's API key was regenerated. | <Icon icon="shield-halved" size={16} /> |

## Developer apps (OAuth)

| Event | Description | |
| - | - | - |
| `developer.app.create` | A new OAuth application was created. | |
| `developer.app.delete` | An OAuth application was deleted. | |
| `developer.app.resetSecret` | An OAuth application's client secret was regenerated. | <Icon icon="shield-halved" size={16} /> |

## User management

| Event | Description | |
| - | - | - |
| `user.invite` | A user was invited to the organization. Payload includes the email and role. | |
| `user.invite.resend` | An invitation email was resent. | |
| `user.invite.revoke` | A pending invitation was revoked. | |
| `user.disable` | A user account was disabled. | <Icon icon="shield-halved" size={16} /> |
| `user.roleChange` | A user's role was changed. Payload includes the new role. | <Icon icon="shield-halved" size={16} /> |
| `user.accessChange` | A user's workspace or resource access was updated. | |
| `user.creditLimitChange` | A user's [AI credit limit](/help/platform/account/ai-credit-limits) was changed. Payload includes the old and new limits. | <Icon icon="shield-halved" size={16} /> |

## Organization

| Event | Description | |
| - | - | - |
| `org.requireMfa` | The organization-wide MFA requirement was toggled. | <Icon icon="shield-halved" size={16} /> |
| `org.creditLimitDefaultChange` | The organization's default [AI credit limit](/help/platform/account/ai-credit-limits) per member was changed. Payload includes the old and new limits. | <Icon icon="shield-halved" size={16} /> |
| `org.changeName` | The organization's name was changed. | |
| `org.delete` | The organization was deleted. | <Icon icon="shield-halved" size={16} /> |

## Groups

| Event | Description |
| - | - |
| `group.create` | A new user group was created. |
| `group.rename` | A group was renamed. Payload includes the old and new names. |
| `group.delete` | A group was deleted. |
| `group.membersChange` | Members were added or removed from a group. |
| `group.accessChange` | A group's workspace or resource access was updated. |

***

## Event payload

Every event includes a JSON payload in the detail view with event-specific data. Common payload fields include:

| Field | Description |
| - | - |
| `target.type` | The type of resource affected (e.g., `table`, `field`, `user`) |
| `target.id` | The ID of the affected resource |
| `target.name` | The display name of the affected resource at the time of the event |
| `basePublicId` | The database ID (for database events) |
| `email` | The email address involved (for auth and invite events) |
| `from` / `to` | The old and new values (for rename and role change events) |
| `fieldType` | The field type (for field creation events) |
| `count` | The number of items affected (for bulk operations) |
| `changes` | The full set of changes applied (for update events) |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.