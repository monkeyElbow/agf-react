# Bobber audit policy

The Bobber standard means the site has only the authorities, layers, and compatibility parts needed to be a complete, reliable vehicle. It does not mean removing readability, recovery, or a legitimate admin action.

Every audit must ask:

1. Who owns this decision?
2. Is another function doing the same job?
3. Does this function work in test, Vite development, production build, and a browser route?
4. What happens when the authority is slow, stale, unavailable, or restarted?
5. Which legitimate admin action must remain possible?

Required audit lenses:

- Authority surface: one Vite content authority, one client/server endpoint contract, one publish path per scope.
- Environment matrix: test, development, and production imports and side effects must agree about what is enabled.
- Draft/live matrix: block save, page save, polling, takeover, discard, publish, reorder, delete, restore, and failure must preserve the draft/live contract.
- Source ownership: renderers render; normalizers migrate explicitly; the server owns authority; editors stage drafts; no layer silently repairs another layer's state.
- Function workload: report oversized providers, renderers, editors, and route components; split by responsibility, not by arbitrary line count.
- Route/browser proof: public route, HUD on/off, reload, direct navigation, and post-publish rendered content must be verified.
- CSS ownership: public, HUD, admin, and route-family styles must have one owner and a measurable bundle boundary.
- Data shape: active snapshots, seeds, revisions, and backups must pass the same schema and migration inventory without mutation.

The audit may report intentional large parts, but every reported part needs an owner, a current boundary, a next split boundary, and a verification path. A guardrail is incomplete unless it names the durable rule it protects and the legitimate admin action it still allows.
