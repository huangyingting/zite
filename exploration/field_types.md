> ## Documentation Index
> Fetch the complete documentation index at: https://developers.zite.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Zite Database Field Types

> Complete reference for all available field types and their configurations.

The 21 field types you can create through the REST API: their `type` string, value shape, and key settings (defaults in parentheses).

<Note>
  Computed and system types (`rich_text`, `rollup`, `created_at`, `updated_at`, `updated_by`, `user`) exist inside Zite apps but are platform-managed and can't be created or configured through this API.
</Note>

| Type | Value | Key settings (defaults) |
| - | - | - |
| **Text** `single_line_text` | `string` | — |
| **Long Text** `long_text` | `string` (multi-line) | — |
| **Email** `email` | `string` (validated) | — |
| **URL** `url` | `string` (validated) | — |
| **Phone** `phone_number` | `string` (any formatting) | — |
| **Number** `number` | `number \| null` | `decimalPlaces` 0–10 (1), `numberFormat` (local) ¹ |
| **Currency** `currency` | `number \| null` (raw number) | `currencySymbol` (\$), `decimalPlaces` 0–10 (2), `numberFormat` (local) ¹ |
| **Percent** `percent` | `number \| null` (decimal; `0.5` = 50%) | `decimalPlaces` 0+ (0), `numberFormat` (local) ¹, `showProgressBar` (false), `allowNegative` (false) |
| **Rating** `rating` | `number \| null` (int 0–maxRating) | `maxRating` 1–10 (5) |
| **Duration** `duration` | `number \| null` (total seconds) | `format` (h:mm) ² |
| **Single Select** `single_select` | `string \| null` (option label) | `options[]` of `{ label, color? }` ³ |
| **Multiple Select** `multiple_select` | `string[]` (labels) | `options[]` of `{ label, color? }` ³ |
| **Checkbox** `checkbox` | `boolean` | `color` hex (#a8a4ac) |
| **Date** `date` | `string \| null` (ISO date, UTC) | `dateFormat` (local) ⁴ |
| **DateTime** `datetime` | `string \| null` (ISO datetime) | `displayTimeZone` (false), `dateFormat` (local) ⁴, `timeFormat` (12h) ⁵, `timezone` (browser) |
| **Attachments** `attachments` | `Array<{ url: string, filename?: string }>` | None (URL must be accessible; `filename` is display-only) |
| **Linked Record** `linked_record` | `string[]` (record IDs) | `tableId` (required), `allowMultiple` (true), `inverseFieldId?`, `isInverse?` ⁶ |
| **Lookup** `lookup` | `any \| any[] \| null` (looked-up values) ⁷ | `linkedRecordFieldId` (required), `lookupFieldId` (required) ⁸ |
| **Formula** `formula` | `string \| number \| Date \| boolean \| any[]`, shape follows `resultType` (read-only) | `expression` (required), `resultType` (required), `formatting?`. See [Formula fields](#formula-fields) |
| **Autonumber** `autonumber` | `number \| null` (auto-assigned, read-only) | — |
| **Source** `source` | JSONB union, system-set (read-only) ⁹ | — |

**Notes**

1. `numberFormat`: `local` (default) · `comma_period` · `period_comma` · `space_comma` · `space_period`.
2. Duration `format`: `h:mm` (default) · `h:mm:ss` · `h:mm:ss.s` · `h:mm:ss.ss` · `h:mm:ss.sss`.
3. `options[]`: `label` required; `color` optional (auto-assigned if omitted); `value` optional, so omit when creating, use in writes to reference existing options (reorder, or keep old + add new). Colors: purple, orange, blue, gray, red, yellow, green, pink, lime, tangerine, emerald, sky, teal, indigo, cyan, violet, fuchsia.
4. `dateFormat`: `local` (default) · `long` · `us` · `european` · `iso`.
5. `timeFormat`: `12h` (default) · `24h`.
6. `tableId` accepts a table ID or name during base creation; creating the field auto-connects both tables in both directions.
7. Single value if the linked-record field has `allowMultiple: false`, array if `true`; element type matches the looked-up field.
8. Cannot be created during initial base setup. Add it later via the field-creation endpoint.
9. `{ type: "public_api", apiKeyId? }` | `{ type: "form_submission", flowPublicId, sessionId }` | `{ type: "workflow", workflowId, executionId }` | `{ type: "manual", reason?, userId? }` | `null`.

## Formula fields

Formula fields compute their value from other fields using a formula expression. They are read-only and automatically recalculate when referenced fields change. See the [Formulas guide](https://zite.com/help/database/configure-database/formulas) for the complete list of supported functions.

```json theme={"system"}
{
  "name": "Total Price",
  "type": "formula",
  "template": {
    "expression": "SUM({Price}, {Tax})",
    "resultType": "number",
    "formatting": {
      "numberDisplayType": "currency",
      "decimalPlaces": 2
    }
  }
}
```

| Property | Type | Description |
| - | - | - |
| `expression` | string | The formula expression, e.g. `"SUM({Price}, {Tax})"` |
| `resultType` | string | The output type: `"text"`, `"number"`, `"date"`, `"boolean"`, or `"array"` |
| `formatting` | object | Optional display formatting (see below) |

**Formatting options**

* Numbers use `numberDisplayType`: `"number"` (plain) · `"currency"` (use with `decimalPlaces`, `numberFormat`) · `"percent"` · `"duration"`.
* Dates use `dateFormat`, `timeFormat` (`"12h"` or `"24h"`), `timezone`, `displayTimeZone` (whether to show the timezone).

## Primary field

The first field in each table is the **primary field** and must be one of: `single_line_text`, `long_text`, `date`, `phone_number`, `email`, `url`, `number`, `currency`, `percent`, `duration`, `autonumber`, `formula`.

## Empty values

| Value kind | Empty value |
| - | - |
| Text | `""` |
| Number | `null` |
| Boolean | `false` |
| Array | `[]` |
| Object | `null` |

<Warning>
  Changing a field's type after data exists can cause data loss if the new type is incompatible with existing values.
</Warning>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.