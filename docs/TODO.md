# Development TODO

This checklist is the working queue for the current development branch:

```text
feat/mvp-apps-script-mcp
```

Work through the items in order. Do not move the Coffee & Cacao Profiling TEST project into the workflow until the throwaway-project smoke test is stable.

## Now — MVP stabilization

### 1. Google Cloud OAuth Desktop client

- [ ] Create or select a dedicated Google Cloud development project
- [ ] Enable the Google Apps Script API in Google Cloud
- [ ] Enable Google Apps Script API access in the Google account's Apps Script settings
- [ ] Configure Google Auth Platform branding
- [ ] Configure Audience
- [ ] If External/Testing, add the development Google account as a test user
- [ ] Configure these MVP scopes:
  - `https://www.googleapis.com/auth/script.projects`
  - `https://www.googleapis.com/auth/script.deployments`
- [ ] Create a **Desktop app** OAuth client
- [ ] Download the client JSON
- [ ] Save it as `~/.config/google-apps-script-mcp/oauth-client.json`
- [ ] Restrict the file to the local user where supported

**Done when:** the Desktop client JSON exists locally, the API/account switches are enabled, and no credentials have been committed.

### 2. Local MCP authentication

- [ ] Run `npm install` if dependencies are not already installed
- [ ] Run `npm run auth`
- [ ] Complete Google consent using the intended Apps Script account
- [ ] Verify `~/.config/google-apps-script-mcp/token.json` is created
- [ ] Verify token contents are not printed/logged
- [ ] Run `auth_status`
- [ ] Confirm the MCP reports an authenticated/cached-token state

**Done when:** authentication survives a new MCP process and `auth_status` succeeds without re-login.

### 3. Install/connect to the MCP host

- [ ] Run `npm run check`
- [ ] Run `npm run build`
- [ ] Add the local stdio server to the selected MCP host
- [ ] Use the absolute path to `dist/index.js`
- [ ] Restart/reload the MCP host
- [ ] Confirm the `google-apps-script` server connects
- [ ] Confirm the expected tools are discoverable
- [ ] Run `auth_status` from the actual host

**Done when:** the real MCP host can launch the server over stdio and call `auth_status`.

### 4. Throwaway Apps Script smoke test

Use a newly created disposable Apps Script project before touching any real application.

- [ ] Create a throwaway project with `projects_create`
- [ ] Record its Script ID locally for the test session
- [ ] Read metadata with `projects_get`
- [ ] Read content with `projects_get_content`
- [ ] Prepare a minimal local test directory
- [ ] Preview `projects_push_directory` with `confirm_replace = false`
- [ ] Verify the preview correctly shows the complete proposed file set
- [ ] Repeat with `confirm_replace = true`
- [ ] Read content again and verify the push
- [ ] Create an immutable version
- [ ] List versions and confirm it appears
- [ ] Create a test deployment
- [ ] List/get the deployment
- [ ] Update the deployment to a newer test version
- [ ] Preview/confirm deployment deletion
- [ ] Verify deletion
- [ ] Capture any API/OAuth/MCP-host issues in the docs

**Done when:** the complete lifecycle works from the MCP host without manual Apps Script editor changes.

### 5. Stabilization before first real project

- [ ] Fix issues discovered by the smoke test
- [ ] Re-run TypeScript check
- [ ] Re-run build
- [ ] Confirm GitHub Actions remains green
- [ ] Add a repeatable smoke-test document or section
- [ ] Review tool names/arguments for consistency
- [ ] Review error messages for actionable troubleshooting
- [ ] Review confirmation guards
- [ ] Verify credentials/tokens remain excluded from Git
- [ ] Review the draft PR before real-project integration

**Done when:** the smoke test is repeatable and no known blocker remains for a TEST project.

## Next — Coffee & Cacao Profiling TEST

This is the first real integration and should remain strictly TEST-only at first.

- [ ] Obtain/confirm the TEST Apps Script Script ID
- [ ] Confirm the authenticated Google account has edit access
- [ ] Read project metadata
- [ ] Read the complete project content
- [ ] Capture a safe baseline before writing
- [ ] Identify all `.gs`, `.html`, and manifest files
- [ ] Confirm local source represents the entire remote project before replacement
- [ ] Perform a preview-only push
- [ ] Review additions, replacements, and deletions
- [ ] Perform the first explicitly confirmed write
- [ ] Verify the resulting remote content
- [ ] Create an immutable version
- [ ] Verify deployment state
- [ ] Document the Coffee & Cacao TEST workflow
- [ ] Define the handoff/developer workflow for future updates

Do **not** touch the production Apps Script project until the TEST workflow has been repeated successfully.

## Phase 2 backlog — execution and monitoring

- [ ] Design `scripts.run()` tool contract
- [ ] Determine exact additional OAuth scope requirements
- [ ] Document API executable deployment setup
- [ ] Add safe function allowlisting
- [ ] Add execution argument validation
- [ ] Add execution result/error normalization
- [ ] Add user process listing
- [ ] Add script process listing
- [ ] Add execution monitoring
- [ ] Evaluate/add metrics tooling
- [ ] Add OAuth scopes only alongside implemented features

## Later backlog

- [ ] Script Properties helpers
- [ ] TEST/PROD environment profiles
- [ ] Sensitive property redaction
- [ ] Better project-content diffing
- [ ] Rollback helpers
- [ ] Deployment health checks
- [ ] Optional Git workflow helpers
- [ ] Optional Streamable HTTP transport
- [ ] Multi-user/session design if the MCP is ever hosted

## Definition of reusable

A feature belongs in the MCP core when it is broadly useful to Apps Script projects and can be expressed without Coffee & Cacao-specific business rules.

Project-specific source code, deployment choices, function names, property keys, or data rules should remain in the consuming project's repository/configuration unless they become a proven reusable abstraction.
