# Public Release Checklist

Use this checklist before publicly sharing the repository or refreshing the online
demo.

## Repo Checks

- CI is green.
- `npm run public:hygiene` passes.
- `npm run public:links` passes.
- No old GitHub repo links remain.
- No real company, compensation, or project keywords remain.
- README points to the public repository.
- `docs/assets` does not contain unsanitized screenshots.

## Demo Checks

- Online demo opens.
- `DemoBanner` is visible.
- Provider is locked to Mock.
- DeepSeek is disabled.
- Memory Safety scenario works.
- Weak JD guardrail works.
- Opportunity-light scenario works.
- AgentRun trace is visible.
- Eval links point to the public repository.
- ART trajectory link points to the public repository.

## Data Checks

- Render / Railway DB is reseeded after sanitization.
- Memory list contains only Lin Che synthetic persona data.
- Evidence and Opportunity records contain only synthetic data.
- No old ChatThread or AgentRun contains private data.

## Release Notes

- Current public repo is sanitized.
- Old private repo remains private.
- Render service name may still contain old project wording, but it should not link to
  the old GitHub repo.
