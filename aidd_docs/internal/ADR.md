# Architecture Decision Record (ADR)

This file contains the key architectural decisions made during the project, along with their context and consequences.

## Decision Log

| Date       | ID      | Title                                                          | Consequences                          |
| ---------- | ------- | -------------------------------------------------------------- | ------------------------------------- |
| 2026-04-07 | DEC-001 | [Snake_case for business identifiers](decisions/001-snake-case-identifiers.md) | All identifiers use snake_case consistently |
| 2026-04-07 | DEC-002 | [Pure helpers co-located in types.ts](decisions/002-resolution-strategy-in-types.md) | Type-derived helpers live next to their type, no separate util file |
