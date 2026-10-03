# Roadmap

## Phase 1 — Project management MVP

- [x] Local stdio MCP server
- [x] Google Desktop OAuth
- [x] Auth status
- [x] Create/get Apps Script project
- [x] Read project content
- [x] Replace project content with confirmation guard
- [x] Push flat local Apps Script directory
- [x] Create/list versions
- [x] Create/list/get/update/delete deployments
- [x] Local token storage
- [x] Setup/security documentation
- [ ] Compile/test through CI
- [ ] Integration test against a real throwaway Apps Script project

## Phase 2 — Observability and execution

- [ ] Project metrics
- [ ] User/script process listings
- [ ] Execution error summaries
- [ ] Optional `scripts.run()` support
- [ ] API-executable setup guide
- [ ] Safer function allowlist for remote execution

## Phase 3 — Configuration helpers

- [ ] Design Script Properties management
- [ ] Read/write property helper for projects that opt in
- [ ] Property-key allowlist / sensitive-value redaction
- [ ] Environment profiles (TEST / PROD)

## Phase 4 — Developer workflow

- [ ] Git repository sync helper
- [ ] Apps Script file diff instead of name-only preview
- [ ] rollback helper using prior immutable version
- [ ] deployment health check
- [ ] optional Streamable HTTP transport
- [ ] multi-user OAuth/session model if hosted
