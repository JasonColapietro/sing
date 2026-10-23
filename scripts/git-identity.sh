#!/usr/bin/env bash
# Make every commit in this clone Jason Colapietro's, with no AI attribution.
#
#   bash scripts/git-identity.sh
#
# .claude/settings.json runs this at the start of every Claude Code session.
# Cloud containers set a global git identity of "Claude <noreply@anthropic.com>"
# and sign with a key registered to that address; this overrides both for this
# repo only (repo-local config wins over ~/.gitconfig):
#
#   - author and committer become Jason Colapietro's GitHub noreply address
#   - commit signing is off here, since the container's key belongs to
#     noreply@anthropic.com and GitHub would mark Jason's commits Unverified
#   - scripts/git-hooks/commit-msg strips Co-Authored-By/Claude-Session lines
#     and "Generated with Claude Code" footers from every message
#
# Safe to run any number of times. Does nothing outside a git checkout.
set -euo pipefail

cd "$(dirname "$0")/.."
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

git config user.name "Jason Colapietro"
git config user.email "55137770+JasonColapietro@users.noreply.github.com"
git config commit.gpgsign false
git config core.hooksPath scripts/git-hooks
