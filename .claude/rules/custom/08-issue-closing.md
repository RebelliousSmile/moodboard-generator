---
description: Attach plan and review as comments before closing an issue
---

# Issue closing — attach plan & review

## VCS CLI detection

- Use `vcs_cli` from `CLAUDE.md` Project Config section
- If absent: detect from `git remote -v` (github.com → `gh`, gitlab → `glab`)
- Write detected value to `CLAUDE.md` Project Config, skip detection next time

## Before closing an issue

- Look for plan file: `aidd_docs/tasks/**/*<issue_number>*.md`
- Look for review file: `aidd_docs/tasks/**/*<issue_number>*.review.md`
- If found: post as comment on the issue before closing
- Include review summary in comment body
- Close issue using detected CLI

## After closing

- Chain with `aidd:08:commit` auto
- Chain with `custom:08:end_plan` with defaults: parent branch `main`, `/learn` oui, delete branch local only
- Chain with `custom:08:changelog` with defaults: semver auto, push tag + branch
