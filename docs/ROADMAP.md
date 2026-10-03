# Roadmap

This roadmap keeps the MCP reusable across many Google Apps Script projects while giving us a safe path from the current MVP to the first real integration.

## Phase 1 — Project-management MVP

Status: **feature-complete; local integration testing in progress**

### Core MCP

- [x] Local stdio MCP server
- [x] Node.js + TypeScript implementation
- [x] Google Desktop OAuth
- [x] Local OAuth credential/token storage
- [x] `auth_status`
- [x] Create/get Apps Script project
- [x] Read project content
- [x] Replace complete project content
- [x] Push a flat local Apps Script directory
- [x] Create/list immutable versions
- [x] Create/list/get/update/delete deployments

### Safety

- [x] Preview before project-content replacement
- [x] Explicit confirmation before project-content replacement
- [x] Explicit confirmation before deployment deletion
- [x] OAuth credentials and refresh tokens remain local
- [x] Credential/token files excluded from Git
- [x] stdio transport by default
- [x] Limit MVP OAuth grant to scopes currently used

### Documentation and CI

- [x] Setup guide
- [x] Architecture documentation
- [x] Roadmap
- [x] Example Apps Script project
- [x] GitHub Actions CI
- [x] TypeScript check passes in CI
- [x] Build passes in CI
- [ ] End-to-end test against a throwaway Apps Script project
- [ ] Record the verified MCP-host installation procedure
- [ ] Add a repeatable smoke-test checklist

### Exit criteria

Phase 1 is considered stable when we can:

1. authenticate locally;
2. launch the MCP from an MCP host;
3. create and inspect a throwaway Apps Script project;
4. safely preview and push complete project content;
5. create a version;
6. create/read/update/delete a deployment;
7. repeat the process without exposing credentials or requiring browser automation.

## First real integration — Coffee & Cacao Profiling TEST

This is the first production-shaped consumer of the reusable MCP, but project-specific behavior must stay outside the MCP core unless it is generally useful.

- [ ] Confirm Phase 1 smoke test passes first
- [ ] Identify the Coffee & Cacao Profiling **TEST** Script ID
- [ ] Confirm the OAuth user has edit access
- [ ] Read project metadata and complete project content
- [ ] Save/compare a local baseline before any write
- [ ] Map the existing project file structure
- [ ] Preview a no-op or controlled content push
- [ ] Perform the first explicitly confirmed test update
- [ ] Create an immutable version after a successful push
- [ ] Verify existing deployments before changing any deployment
- [ ] Document the TEST integration workflow
- [ ] Keep PROD untouched until the TEST workflow is repeatable

The Coffee & Cacao project should validate the MCP architecture, not introduce hidden project-specific assumptions into it.

## Phase 2 — Execution and observability

Goal: safely support Apps Script execution workflows and troubleshooting.

- [ ] Design `scripts.run()` integration
- [ ] Add the minimum execution OAuth scope only when implemented
- [ ] Document API executable deployment requirements
- [ ] Add API-executable setup helpers where practical
- [ ] Add safe function allowlisting for remote execution
- [ ] Add argument/result validation and useful execution errors
- [ ] Add user process listing
- [ ] Add script process listing
- [ ] Add execution/process monitoring
- [ ] Add execution error summaries
- [ ] Evaluate project metrics support
- [ ] Add `script.metrics` scope only if metrics tooling is implemented

### Phase 2 safety principles

- Remote functions are never executed implicitly.
- Function execution should be allowlist-oriented.
- Execution configuration must remain project-agnostic.
- New OAuth scopes are added only when the corresponding feature exists.

## Phase 3 — Configuration helpers

Goal: make common project configuration manageable without leaking secrets.

- [ ] Design Script Properties management
- [ ] Determine the safest mechanism for read/write helpers
- [ ] Add opt-in property helpers
- [ ] Add property-key allowlists
- [ ] Redact sensitive values from MCP responses
- [ ] Support environment profiles such as TEST / PROD
- [ ] Define project-level configuration without hardcoding specific projects

## Phase 4 — Developer workflow

Goal: improve change review, rollback, and Git-based development.

- [ ] Apps Script file diff instead of name-only preview
- [ ] Add content hashes to preview output
- [ ] Add safer partial/local change planning without misrepresenting `updateContent()` semantics
- [ ] Add rollback helper using a previous immutable version where supported
- [ ] Add deployment health-check tooling
- [ ] Improve local repository/project mapping
- [ ] Evaluate Git repository sync helpers
- [ ] Keep `clasp` documented as a fallback/developer tool

## Phase 5 — Optional hosted/server mode

The default architecture remains local stdio. Hosted operation is optional and must not weaken the local security model.

- [ ] Evaluate Streamable HTTP transport
- [ ] Design multi-user OAuth/session isolation
- [ ] Encrypt persisted server-side credentials if hosting is introduced
- [ ] Define tenant/project authorization boundaries
- [ ] Add audit logging
- [ ] Add rate limiting
- [ ] Document hosted deployment and threat model

## Long-term architectural rules

- Use the official Google Apps Script REST API rather than browser automation.
- Keep OAuth user-based unless a Google-supported alternative satisfies the same Apps Script operations.
- Keep credentials and refresh tokens out of repositories.
- Treat `projects.updateContent()` as complete-project replacement.
- Require preview + explicit confirmation for destructive/replacement operations.
- Keep reusable MCP capabilities separate from Coffee & Cacao or other project-specific business logic.
- Add scopes only when the implementation requires them.
- Preserve `clasp` as a practical fallback rather than trying to replace every developer workflow.
