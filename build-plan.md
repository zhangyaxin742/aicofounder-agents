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
  - Remove doc-level contradictions before build starts.
    Fix these in both docs once approved:
      - Senior Engineer vs Architect + Technical Cofounder
      - Legal Advisor as standalone vs legal folded into Critic
      - Synthesizer + Pattern Librarian vs merged Export Agent
      - Promise.all vs Promise.allSettled
      - MAX_SESSION_COST=5.00 vs 2.00
      - project starting in intake vs warmup
      - “run for free” wording vs paid Anthropic requirement
  - Do not promise “for free” in README.
    Replace with “run locally with your own Anthropic API key.” If you
    want a free mode later, treat it as a separate post-sprint
    adapter.

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
                                                                                                                  
  ## Doc Edits To Make After Approval                                                                             
                                                                                                                  
  - Rewrite both docs into one single source of truth for:                                                        
      - final agent roster                                                                                        
      - final phase flow                                                                                          
      - final tool list                                                                                           
      - final budget defaults                                                                                     
      - final export behavior                                                                                     
  - Rewrite README around the real shipping target:
      - local CLI                                                                                                 
      - Anthropic API key required                                                                                
      - expected cost per full run                                                                                
      - quickstart                                                                                                
      - example session                                                                                           
      - troubleshooting                                                                                           
  - Remove or soften claims that imply:                                                                           
      - legal advice quality beyond risk flagging                                                                 
      - investor-grade certainty from lightweight research                                                        
      - free usage                                                                                                
      - complete code already present in repo                                                                     
                                                                                                                  
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