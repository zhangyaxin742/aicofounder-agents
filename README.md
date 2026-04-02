# aicofounder-agents

Local TypeScript CLI scaffold for an AI cofounder swarm backed by Anthropic.

## Setup

```bash
npm install
cp .env.example .env
```

Set `ANTHROPIC_API_KEY` in `.env`.

## Usage

```bash
npm start
```

The CLI starts a simple REPL, loads or creates a project canvas in `canvas/`, and supports:

- `/canvas` to print the active canvas
- `/export` to write a markdown brief to `output/`
- `/rerun` to clear research summaries
- `/quit` or `/exit` to save and leave

## Structure

```text
.
|-- .env.example
|-- README.md
|-- package.json
|-- tsconfig.json
|-- src/
|   |-- index.ts
|   |-- orchestrator.ts
|   |-- agents/
|   |-- prompts/
|   |-- canvas/
|   `-- lib/
|-- canvas/
|-- output/
`-- prompts/
```

## Notes

- `src/lib/run-agent.ts` contains the Anthropic SDK wrapper and a deterministic fallback when no API key is present.
- `prompts/` stores raw markdown prompt references.
- `src/prompts/` stores TypeScript prompt builders used by the runtime.
