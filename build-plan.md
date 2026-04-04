• Proposed Plan
                                                                        
                                                                        
  # Anthropic CLI Cofounder Swarm: 24-Hour Sprint Plan                  

  ## Summary                                                            
                                                                        
  Build a working terminal-first MVP on Anthropic only with strong      

  This sprint should treat the repo as a fresh implementation repo,     
  not as a codebase that already exists. The actual repo currently      
  contains only docs plus a placeholder README, so the first
  deliverable is the real project skeleton and a README that
  truthfully explains setup, costs, and limits.

  ## Architecture Corrections

  - Unify the architecture to one roster only.
    Default roster for sprint:
      1. Orchestrator
      2. Market Scout
      3. Competitor Analyst
      4. Market Sizer
      5. ICP Whisperer
      6. Architect
      7. Technical Cofounder                                            
      8. GTM Specialist                                                 
      9. Critic                                                         
     10. Verifier                                                       
     11. Export Agent

    ## BUILD SPECS
  - Keep web search constrained.
    Web search ON only for Scout, Analyst, Sizer, ICP, Architect, GTM
    when needed.
    Web search OFF for Orchestrator, Technical Cofounder, Critic,                                                 
    Verifier, Export Agent.                                                                                       
  - Use Promise.allSettled for fan-out.                                                                           
    Partial research failure should degrade gracefully and still                                                  
    return usable output.                                                                                         
  - Use structured machine-readable outputs, not header-only parsing.                                             
    Keep human-readable markdown for the user, but require each agent                                             
    to emit a JSON object inside fenced tags or a strict sectioned                                                
    format with a parser. Header presence alone is too weak for                                                   
    production reliability.                                                                                       
  - Keep context small by default.                                                                                
    Implement a context-builder that sends per-agent slices plus                                                  
    summaries, not the full canvas every time. Full-canvas sends                                                  
    should be limited to Critic and Export Agent.                                                                 
  - Retain Verifier, but scope it correctly.                                                                      
    It should validate structure, sourcing presence, and obvious                                                  
    hallucination markers. It should not be described as factual truth                                            
    enforcement if it does not re-check the web.                                                                  
  - Defer Pattern Librarian/knowledge base from sprint scope.                                                     
    It adds complexity with little value for day-1 usability. The                                                 
    Export Agent can stay; cross-project pattern extraction should                                                
    wait.                                                                                                                                                                     
                                                                                                                  
  ## Build Tasks                                                                                                  
                                                                                                                  
  - Task 1: Create repo skeleton                                                                                  
    Add package.json, tsconfig.json, .env.example, src/, prompts/,                                                
    canvas/, output/, logs/.                                                                                      
    Success criteria: npm install and npm start boot a REPL.                                                      
  - Task 2: Implement canvas schema and persistence                                                               
    Add schema, read/write, project creation, slugging, autosave.                                                 
    Default starting phase: warmup.                                                                               
    Success criteria: new project canvas is created, resumed, and                                                 
    written safely.                                                                                               
  - Task 3: Build core Anthropic runner                                                                           
    Add run-agent.ts with retries, timeout, telemetry hooks, prompt                                               
    caching, model selection, and optional web_search.                                                            
    Success criteria: one agent call succeeds and logs token/cost                                                 
    metadata.                                                                                                     
  - Task 4: Build orchestrator REPL                                                                               
    Add main loop, command handling, tool dispatch, phase transitions,                                            
    and model routing between Sonnet and Opus.                                                                    
    Success criteria: user can create a project, answer prompts,                                                  
    trigger phases, and exit cleanly.                                                                             
  - Task 5: Implement research fan-out                                                                            
    Add Scout, Analyst, Sizer wrappers plus fan-out.ts using                                                      
    Promise.allSettled.                                                                                           
    Success criteria: three-agent research phase returns partial or                                               
    full results without crashing if one agent fails.                                                             
  - Task 6: Add verification and summarization                                                                    
    After each non-orchestrator agent call, run Verifier and store a                                              
    compressed summary for later context injection.                                                               
    Success criteria: canvas stores raw report, verification result,                                              
    and short summary.                                                                                            
  - Task 7: Implement middle phases                                                                               
    Add ICP, Architect, Technical Cofounder, GTM, Critic.                                                         
    Keep legal risk inside Critic via optional legal lens flag.                                                   
    Success criteria: user can progress from idea to build/GTM                                                    
    critique in one session.                                                                                      
  - Task 8: Implement export                                                                                      
    Add Export Agent and file writer for a final markdown brief.                                                  
    Skip knowledge-base extraction for sprint unless time remains.                                                
    Success criteria: /export writes one readable report to output/.                                              
  - Task 9: Add budget and telemetry                                                                              
    Track per-call cost locally, warn near threshold, stop or request                                             
    confirmation at cap.                                                                                          
    Default env:                                                                                                  
    MAX_SESSION_COST=2.00                                                                                         
    COST_WARNING_THRESHOLD=0.80                                                                                   
    Success criteria: cost summary works and hard-stop behavior is                                                
    testable.                                                                                                     
  - Task 10: Final docs polish                                                                                    
    Replace placeholder README with accurate quickstart, commands,                                                
    cost notes, sample run, and limitations.                                                                      
    Success criteria: a new user can clone, add API key, run, and                                                 
    understand expected behavior without opening the long docs.                                                   
                                                                                                                  
  ## Test Plan                                                                                                    
                                                                                                                  
  - Smoke test                                                                                                    
    Fresh install, create project, complete warmup, run research,                                                 
    export brief.                                                                                                 
  - Fan-out resilience                                                                                            
    Force one research agent to fail; verify phase completes with                                                 
    partial data and visible warning.                                                                             
  - Budget gate
    Simulate cost threshold breach; verify warning and stop/continue                                              
    flow.                                                                                                         
  - Resume flow                                                                                                   
    Start project, stop process, restart, reload canvas, continue.                                                
  - Prompt-contract test                                                                                          
    Feed malformed agent output into verifier/parser path; ensure                                                 
    warning is persisted and export still works.                                                                  
  - Context-size test                                                                                             
    Confirm non-critical agents receive sliced context, not full                                                  
    Follow README exactly on a clean machine flow; confirm no hidden

  ## Assumptions
  - Anthropic is the only provider in scope for this sprint.
  - “Free” local OSS mode is out of scope for the 24-hour build.
  - The repo will ship as a CLI MVP plus strong README, not a web app.
  - Legal output is framed as risk spotting, not professional legal
    advice.
  - Pattern Librarian and long-term cross-project memory are deferred
    until after the MVP is stable.
  - If you approve edits, the first mutation step should be: clean and
    align the two docs before implementation, because the current
    contradictions will otherwise bleed directly into the code.

    > Target end state after sprint: run locally with your own Anthropic API key via a terminal-first CLI. This document exists only to describe implementation of the final sprint architecture. [cofounder-architecture.md](/C:/Users/user/Documents/GitHub/aicofounder-agents/cofounder-architecture.md) is the source of truth for final roster, phase flow, tool list, budget defaults, and export behavior.

---

### Editorial Lock: Authority Reference

- `cofounder-architecture.md` is the single source of truth for the final agent roster, final phase flow, final tool list, final budget defaults, and final export behavior
- this codebase doc describes only the implementation of that final sprint architecture
- this is a standalone Node/TypeScript terminal CLI using `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY`
- there is no Anthropic CLI dependency or shell-out path in the sprint implementation
- final active roster only: Orchestrator, Market Scout, Competitor Analyst, Market Sizer, ICP Whisperer, Architect, Technical Cofounder, GTM Specialist, Critic, Verifier, Export Agent
- research fan-out uses `Promise.allSettled`
- projects begin in `warmup`, then move into `intake`
- web search stays ON only for Scout, Analyst, Sizer, ICP, Architect, and GTM when needed
- web search stays OFF for Orchestrator, Technical Cofounder, Critic, Verifier, and Export Agent
- Verifier scope is structure validation, sourcing presence, and hallucination markers only
- Pattern Librarian and knowledge extraction are deferred from sprint scope
- structured machine-readable output is required; section-header presence is not the primary contract
- context stays small by default through context slices and summaries; full canvas is reserved for Critic and Export Agent
- `MAX_SESSION_COST=2.00`

## Recommended Build Sequence

Build this system in layers. Debugging an orchestrator that talks to five agents you haven't individually validated is extremely hard. Build bottom-up.

**Week 1 — Single agent, no orchestrator**

Get `run-agent.ts` working. Hardcode a brief, call the Scout directly, print the output. Iterate until the structured `<json_output>` block parses cleanly, the human-readable report is useful, source attribution is present, and the Verifier would pass it. Do not touch the orchestrator.

```bash
# Temporary test script: src/test-scout.ts
import { runAgent } from './lib/run-agent.js';
import { SCOUT_SYSTEM_PROMPT } from './prompts/agents.js';

const report = await runAgent({
  systemPrompt: SCOUT_SYSTEM_PROMPT,
  userMessage: '<brief>Research pain around spreadsheet-based financial modeling for startup CFOs.</brief>',
  agentName: 'Market Scout',
});
console.log(report);
```

Repeat for Analyst and Sizer individually. Validate structured output extraction and source presence manually before wiring them into fan-out.

**Week 2 — Fan-out, no orchestrator**

Get `fan-out.ts` working. Run all three agents in parallel, write the result to a canvas JSON file, read it back. Verify the canvas is readable and non-empty. Intentionally break one agent (wrong API key, empty brief) and confirm the `allSettled` fallback returns a graceful error string rather than crashing.

**Week 3 — Orchestrator loop + tool routing**

Add the orchestrator. Wire up the tool handlers. At this point the loop is: user types something → orchestrator responds → orchestrator calls `run_research_phase` → fan-out runs → results returned as `tool_result` → orchestrator synthesizes. Test that the phase state machine advances correctly and that `project.phase` in the canvas reflects the right state after each tool call.

Test edge case: send two messages in a row that would both trigger research. Confirm the second call doesn't re-run the fan-out (phase guard in tool description should prevent this, but verify it in practice).

**Week 4 — Domain agents (ICP, Architect, Technical Cofounder, GTM, Critic)**

Add the sequential agents one at a time. Add ICP first (it builds on research), then add Architect and Technical Cofounder as the build-phase pair, then GTM, then Critic. Test that Architect receives research + ICP context, that Technical Cofounder receives the Architect's report without fresh web search, and add the Critic last because its prompt requires the most tuning to push back specifically rather than generically.

**Week 5 — Verifier, cost tracking, `/export`**

Add the Verifier (Haiku) after each agent call. Add telemetry and budget tracking. Add the export flow. At this point the planned system can run a full session from warmup through export.

**Common mistakes to avoid at each stage:**

- Don't add the orchestrator before individual agents are validated. You'll have no idea whether a bad output came from the orchestrator's brief or the agent's prompt.
- Don't skip the output validation step in the tool handler. Silent bad data in the canvas cascades — the orchestrator reads it and produces confident-sounding synthesis of garbage.
- Don't test with Opus until the system works on Sonnet. Sonnet is faster and cheaper during development.
- Don't trim conversation history by splicing raw indices. If you trim a `tool_use` block without its matching `tool_result`, the API will reject the malformed conversation. Always trim in pairs (user + assistant) and only from turns that don't contain unmatched tool blocks.