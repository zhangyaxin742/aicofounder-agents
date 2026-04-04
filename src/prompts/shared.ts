export const SPECIALIST_OUTPUT_CONTRACT = `
Every specialist response must include:

1. Human-readable markdown for the founder and orchestrator
2. Machine-readable JSON inside <json_output> ... </json_output>

Required JSON envelope:
<json_output>
{
  "report_type": "agent_specific_type",
  "summary": "one paragraph summary",
  "findings": [],
  "sources": [],
  "confidence": "High|Medium|Low",
  "open_questions": []
}
</json_output>

The JSON payload is the parsing contract. Human-readable section headers are presentation only.
`;
