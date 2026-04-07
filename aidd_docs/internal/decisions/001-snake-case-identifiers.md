# Decision: Snake_case for business identifiers

| Field   | Value                    |
| ------- | ------------------------ |
| ID      | DEC-001                  |
| Date    | 2026-04-07               |
| Feature | Themes, usages, slots    |
| Status  | Accepted                 |

## Context

Issue #8 spec mentioned kebab-case for custom theme normalization, but the entire codebase already uses snake_case for all business identifiers (themes, usages, tailles). Mixing conventions would create inconsistency.

## Decision

All business identifiers (themes, usages, types) use snake_case. Custom themes added by users are normalized to snake_case (`\s+` → `_`).

## Alternatives Considered

| Alternative  | Pros              | Cons                                     | Rejected because                  |
| ------------ | ----------------- | ---------------------------------------- | --------------------------------- |
| kebab-case   | Common in URLs    | Breaks consistency with existing IDs     | All existing IDs are snake_case   |
| Mixed format | No migration cost | Inconsistent display, regex complexity   | Maintenance burden                |

## Consequences

- All existing code stays unchanged
- Custom theme label display uses `/_/g` replacement (single convention)
- Future identifiers must follow snake_case
