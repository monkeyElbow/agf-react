# Local content-admin security

The Vite content-admin authority is a development service, not a production API.
For the current trusted-LAN development workflow, a password is not required.
The optional password below can be configured outside the browser bundle when the
dev server needs an extra boundary:

```dotenv
CONTENT_ADMIN_DEV_PASSWORD=use-a-private-shared-development-password
OPENAI_API_KEY=server-only-openai-key
```

If the password is not configured, content-admin requests are allowed from the
trusted development LAN so the three-admin host workflow works without an account
system. Do not expose this Vite server beyond that trusted network. Configure the
password before sharing it with a broader group.

The content-admin client receives an `HttpOnly`, `SameSite=Strict` session cookie
after password authentication. The server binds write attribution to that session;
the browser-supplied actor remains display metadata only. Requests with a foreign
Origin are rejected, request bodies are size-limited, and diagnostics no longer
return repository or persistence paths.

Never use `VITE_OPENAI_API_KEY`. Any `VITE_` value is intentionally public in a
browser build. The chatbot calls `/api/chatbot`; the server owns the OpenAI key,
limits prompt size and rate, and returns the approved fallback when no key is
configured.

Do not expose the Vite server to the public internet. The database-backed admin
service must replace this shared development password with the site’s real account
and session authority before deployment.
