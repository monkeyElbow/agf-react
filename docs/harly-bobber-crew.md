# Harly Bobber Crew

Harly Bobber is the constant engineering check used alongside implementation work. The crew does not replace tests, browser proof, or human review. It gives every change a standing set of questions so the site stays simple, secure, fast, editable, and explainable as it evolves.

## Operating rule

Run the crew at four points:

1. **Before the change:** identify the owning block, route, function, style boundary, persisted shape, and legitimate admin action that must remain possible.
2. **During the change:** watch the changed path and nearby consumers for drift, duplicate authority, security exposure, performance cost, and admin friction.
3. **Before reporting complete:** verify the actual file, persisted data, rendered behavior, and relevant tests. A change is not complete because the edit was made; it is complete only after the intended result is observed.
4. **At handoff:** report findings, evidence, unresolved tooling gaps, and the smallest safe follow-up plan. Do not silently defer a discovered risk.

The crew may combine checks when they use the same evidence, but it must not omit a check. Every durable guardrail must state both:

- the durable rule it protects; and
- the legitimate admin action it still allows.

## Verification port rule

Port `5173` is reserved for human use. Codex, automated tests, browser probes,
and local preview verification must use an alternate loopback port starting at
`5174` and incrementing as needed (`5174`, `5175`, …). Never start, restart,
kill, or take over the human server on `5173`, and never report verification
against `5173` as agent-run proof. If the selected verification port is
occupied or serving stale content, stop and report the conflict; do not take
over that process. Verification that can mutate content must also use isolated
test data and state.

Durable rule protected: human control of the shared `5173` workspace and
separation of verification state from normal content.

Legitimate admin action still allowed: humans may continue using, restarting,
and inspecting the server on `5173` without agent interference.

## The crew

### Code Double Checker

Verifies that each requested change actually landed and that the resulting behavior matches the request before completion is reported.

Checks:

- inspect the final diff and exact source/data values;
- run the smallest relevant test or scan;
- verify rendered or persisted output when the change affects either;
- distinguish “implemented,” “tested,” and “browser-proven.”

The Double Checker has authority to keep the work open when evidence is missing.

### Helicopter Parent Pages

Watches pages for overprotective route-specific code that still tries to control blocks through CSS, content, required presence, order, fallback assembly, or special-case expectations.

When it finds page interference, report:

1. what page-level authority is overriding the block system;
2. which canonical block or shared contract should own the behavior;
3. what can be removed, migrated, or retired;
4. how to preserve the legitimate admin action while removing the interference.

Page-specific code is allowed only when the page is an explicitly classified special route or when it owns a genuinely page-wide concern.

### Block Drift

Looks for one-off blocks, expanded block designs, duplicate presets, and content shapes that should belong to an existing canonical block family.

For every drift finding, identify the source shape, the correct existing owner, the migration path, the compatibility boundary, and the retirement condition. Do not force a migration merely because two blocks look similar; preserve meaningful layout or admin behavior until the canonical owner can represent it.

### Whitehat

Looks for security weaknesses and future security debt in source, persisted content, admin workflows, and external-link handling.

Checks include authorization boundaries, draft/publish scope, actor identity, takeover and conflict behavior, unsafe HTML or URL handling, secret exposure, open redirects, external-link targets, and failure states that could falsely imply success. Findings include severity, evidence, affected surface, and the smallest safe remediation.

### Speedy

Optimizes visitor and admin experience without trading away correctness.

Watches page load, JavaScript and CSS weight, repeated rendering, route-specific bundles, editor responsiveness, draft autosave, polling, save/publish latency, and invisible-to-the-user work. Reports impacted pages or workflows and a measurable strategy, such as reducing duplicate work, narrowing imports, caching stable data, or moving noncritical work off the interaction path.

### Personified Functions

Interviews functions, providers, renderers, editors, tests, and guardrails as if they were coworkers.

Ask each one:

- Are you doing more than one job?
- Is another function doing the same job?
- Are you a long-term authority or a migration helper?
- What input, load, failure, or security condition will crack you?
- What legitimate admin action would break if you were removed?

Use the answers to split overloaded responsibilities, remove redundant checks, document intentional complexity, and retire code that no longer has an owner. Prefer one linear path from saved data to rendered output for a normal block.

### Admin Advocate

Audits the administrator’s journey continuously: finding a block, understanding its name, editing fields, drafting, saving, seeing last-saved state, recovering from conflict, publishing, and verifying the public result.

Call out blocked controls, misleading status, duplicate fields, unnecessary confirmation, hidden state, inaccessible controls, and any editor behavior that makes a safe action difficult. Improvements must keep the admin in control and must not hide meaningful save, draft, conflict, or publish state.

### Vestigial / Burn Bridges

Looks for migration adapters, compatibility fields, stale tests, old CSS, legacy route assumptions, duplicate registries, and dead fallback assemblies that no longer serve a live authority or legitimate recovery path.

Do not delete on suspicion. Record the evidence, current consumers, safe removal sequence, and final retirement proof. Once the bridge is no longer needed, remove it completely enough that it cannot quietly become a second authority.

### Vanilla vs. Spaghetti

Finds code that is more complex than the behavior requires. A normal block should be understandable by following one linear chain from saved data through normalization and rendering, without route-specific detours.

Prefer the smallest clear implementation, shared contracts over branching copies, and names that reveal ownership. If a human developer must inspect three or more files to understand a simple function, examine whether the boundaries are justified or whether the path should be simplified.

### Flight Crew

Before a change is handed to other contributors or expected to behave, checks the controls, indicators, routines, and recovery paths: imports, registrations, routes, buttons, field wiring, draft state, save state, publish state, and rendered output.

Flight Crew is the operational readiness pass. It verifies that the change is connected end to end, not merely present in source.

### Prelaunch Systems

Performs the final systems-integrity pass across the whole change: every persisted field has a schema owner, every editor field has a runtime consumer, every renderer has a registered block contract, every migration has a retirement boundary, and every required test or scan is accounted for.

Prelaunch Systems is intentionally redundant with Flight Crew and Code Double Checker. The overlap is a safety feature: one checks operation, one checks connection, and one checks evidence. Combine commands where practical, but retain all three questions.

## Reporting format

For each finding, use:

```text
Crew: <persona or combined pass>
Finding: <what is wrong or at risk>
Evidence: <file, test, scan, runtime observation, or measured behavior>
Impact: <visitor, admin, security, performance, maintainability, or release risk>
Plan: <smallest safe fix, migration, or retirement sequence>
Admin action preserved: <the legitimate action that remains possible>
Status: <fixed | verified | tooling-needed | intentionally retained | blocked>
```

If no finding exists, say which checks were run and what evidence supports that conclusion. Never report “done” based only on an intended patch.
