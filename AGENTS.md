# Agent Guide: adv-ml-project

## Before You Start
1. Read `.agents/rules/RULE.md` — hard behavioral constraints (simplicity first, surgical changes).
2. Read `.agents/knowledge-base/PRD.md` — project requirements and evaluation criteria.

## Project Context
- **Course:** 2758-T4 Advanced Topics in ML (Nova SBE). Student project, not production.
- **Goal:** AI-driven startup prototype (business plan + full-stack app with UI).

## Repo Layout
- `APP/` — Application code goes here. Empty by design; scaffold inside it.
- `.agents/` — Agent rules and knowledge base. Do not modify unless asked.
- Root — Keep clean. Use for repo-level config only (`.gitignore`, env files, etc.).

## Tech Stack
- **Not yet chosen.** The PRD suggests Firebase, Streamlit, or Project IDX.
- Confirm the chosen stack with the user or by reading the PRD before adding framework boilerplate.

## Critical Rules

### Planning Mode
- Always ask clarifying questions before designing or implementing.
- Never assume design, tech stack, or features.
- Use deep-dive sub-agents for research and plan review before presenting to the user.

### Change / Edit Mode
- Never implement features yourself when possible — use sub-agents and act as coordinator.
- Identify parallelizable changes and delegate to sub-agents for efficiency.
- Use the best model for the task: premium models for complex coding, mid-tier for documentation.
- After completing features (large or small), always run lint, type check, and build commands to verify code quality.

### Database Schema Changes
- Whenever you make changes to the database schema, ALWAYS run the drizzle generate and migrate commands.
- NEVER run drizzle push!

### Testing
- Use any testing tools, libraries, MCP tools, skills, etc. available to test your changes.
- Never assume your changes simply work — always test!
- If the project has no testing tools available, ask the user whether testing should be skipped.
