# Visionary Cofounder Agent Swarm — Full Architecture

**Version:** 1.0  
**Date:** March 30, 2026  
**Purpose:** Architecture spec, system prompts, agent flows, and implementation guide for a multi-agent product-building AI that functions as visionary cofounder, Architect, Technical Cofounder, GTM specialist, ICP whisperer, Critic, Verifier, and Export Agent.

### Editorial Lock: Sprint Authority

The sections below contain historical iterations. For the sprint build, this file is the single source of truth for the final agent roster, final phase flow, final tool list, final budget defaults, and final export behavior.

The authoritative architecture is:

- Final roster only: Orchestrator, Market Scout, Competitor Analyst, Market Sizer, ICP Whisperer, Architect, Technical Cofounder, GTM Specialist, Critic, Verifier, Export Agent
- legacy build-planning labels are superseded by `Architect + Technical Cofounder`
- legacy legal-review labels are superseded by the `Critic` running an optional legal-risk lens
- legacy export-synthesis labels are superseded by the `Export Agent`
- legacy knowledge-extraction labels are deferred from sprint scope
- Research fan-out uses `Promise.allSettled`
- `MAX_SESSION_COST=2.00`
- Projects begin in `warmup`, then move into `intake`
- The implementation-oriented behavior in `cofounder-codebase.md` is authoritative for the `warmup -> intake` handoff; this architecture doc is aligned to that distinction
- Web search stays ON only for Scout, Analyst, Sizer, ICP, Architect, and GTM when needed; OFF for Orchestrator, Technical Cofounder, Critic, Verifier, and Export Agent
- Verifier scope is structural validation, sourcing presence, and hallucination markers; it is not presented as factual truth enforcement
- This repo is positioned as a paid Anthropic local CLI, not a free runtime

---

## Table of Contents

1. [Mental Model & Design Philosophy](#1-mental-model--design-philosophy)
2. [Agent Roster](#2-agent-roster)
3. [System Architecture & Flow](#3-system-architecture--flow)
4. [System Prompts — Full Text](#4-system-prompts--full-text)
5. [Research Fan-Out Flow](#5-research-fan-out-flow)
6. [Canvas & Persistent State Design](#6-canvas--persistent-state-design)
7. [Model Routing Strategy](#7-model-routing-strategy)
8. [Prompt Engineering Rules (from Anthropic's own research)](#8-prompt-engineering-rules)
9. [Tech Stack](#9-tech-stack)
10. [Integration with `/startup-research` Skill](#10-integration-with-startup-research-skill)
11. [What Beats aicofounder.com](#11-what-beats-aicofoundercom)

---

## 1. Mental Model & Design Philosophy

### The Core Idea

This is not a chatbot with a personality. It's a **hierarchical agent swarm** with a visionary orchestrator at the top and a set of domain-specialist subagents that execute in parallel beneath it. The orchestrator doesn't do the work — it plans, challenges, decides, and synthesizes. The subagents do the digging.

### The Founding Insight (from Anthropic's engineering team)

> *"A multi-agent system with Claude Opus as lead and Claude Sonnet subagents outperformed single-agent Opus by 90.2% on research tasks."*

The reason: **context isolation**. Each subagent maintains its own context window, explores its own direction, and compresses findings before returning them. This means:

- The orchestrator never gets bogged down in raw data
- Subagents can go deep without polluting each other's work
- Parallel execution means 6 research vectors happen simultaneously, not sequentially

### The Founder Persona Philosophy

The orchestrator's personality is modeled on the founding archetypes that actually built generational companies. Not their mythology — their *operating patterns*:

| Archetype | What We're Stealing |
|---|---|
| **Steve Jobs** | Taste as a filter. Brutal simplicity. Saying no to 99% so the 1% can be excellent. |
| **Paul Graham** | "Make something people want" as the only lens. Relentless questioning of assumptions. |
| **Peter Thiel** | Contrarian interrogation. "What do you believe that no one else believes?" as a design test. |
| **Zuckerberg** | Ruthless prioritization. Move fast, learn from users, iterate without ego. |
| **Jeff Bezos** | Working backwards from the customer. The press release test. Long-term thinking. |
| **Jensen Huang** | Technical vision tied directly to market timing. Identifying where the world *will* be, not where it is. |

The orchestrator is not nice. It challenges. It pushes back. It refuses to validate bad ideas. But it also knows when something is good and drives it forward with conviction.

---

## 2. Agent Roster

### The 11 Agents

| # | Agent Name | Role | Model | Runs When |
|---|---|---|---|---|
| 0 | **The Orchestrator** | Visionary Cofounder â€” leads conversation, challenges assumptions, directs all agents | `claude-opus-4-6` | Always active |
| 1 | **The Market Scout** | Reddit/social pain mining, voice of customer, demand signals | `claude-sonnet-4-6` | Research phase |
| 2 | **The Competitor Analyst** | Competitor mapping, feature gaps, pricing intel, tech stacks | `claude-sonnet-4-6` | Research phase |
| 3 | **The Market Sizer** | TAM/SAM/SOM, market structure, funding landscape, timing | `claude-sonnet-4-6` | Research phase |
| 4 | **The ICP Whisperer** | Persona building, behavioral signals, where to find them, what they pay | `claude-sonnet-4-6` | ICP phase |
| 5 | **The Architect** | Competitor stack research, infrastructure cost modeling, build sequence, integrations | `claude-sonnet-4-6` | Build phase |
| 6 | **The Technical Cofounder** | Architecture decisions, MVP scope discipline, build-vs-buy, technical risk judgment | `claude-opus-4-6` | Build phase |
| 7 | **The GTM Specialist** | Distribution strategy, first 90 days, monetization framing | `claude-sonnet-4-6` | GTM phase |
| 8 | **The Critic** | Red-teaming, kill-shot assumption testing, optional legal-risk lens | `claude-opus-4-6` | After each major milestone |
| 9 | **The Verifier** | Structure checks, sourcing presence, hallucination markers | `claude-haiku-4-5-20251001` | After every specialist return |
| 10 | **The Export Agent** | Canvas â†’ final markdown brief export | `claude-sonnet-4-6` | On `/export` |

### Why This Roster

- **Agents 1â€“3** are Sonnet models running in parallel during research â€” pure information gathering, high volume
- **Agent 4** is Sonnet for customer synthesis grounded in research outputs
- **Agent 5 (Architect)** researches stacks, costs, and integrations with web search ON
- **Agent 6 (Technical Cofounder)** makes deep technical judgments with web search OFF
- **Agent 7** is Sonnet for GTM synthesis and channel planning
- **Agent 8 (The Critic)** runs on Opus for adversarial pressure and legal-risk review when needed
- **Agent 9 (The Verifier)** is Haiku for low-cost structural checks, sourcing presence, and obvious hallucination markers
- **Agent 10 (The Export Agent)** handles final brief generation only; pattern extraction is deferred

---

### Output Contract Enforcement

Every specialist output is validated by the Verifier (Haiku) against a structured output contract before being written to canvas. Header-only validation is not sufficient. Each specialist returns human-readable markdown plus a machine-readable JSON payload inside fenced tags so the system can detect truncation, missing sections, missing sourcing, and obvious hallucination markers.

| Agent | Required Contract | Verifier Checks |
|---|---|---|
| Market Scout | `report_type: market_scout` | required fields, sourcing array, confidence, pain-signal coverage |
| Competitor Analyst | `report_type: competitor_analyst` | competitor list, pricing/feature fields, sourcing, confidence |
| Market Sizer | `report_type: market_sizer` | TAM/SAM/SOM fields, timing verdict, sourcing, confidence |
| ICP Whisperer | `report_type: icp_whisperer` | personas, WTP fields, sourcing, confidence |
| Architect | `report_type: architect` | stack, integrations, cost model, sourcing, confidence |
| Technical Cofounder | `report_type: technical_cofounder` | architecture decision, MVP cuts, build-vs-buy, risk fields |
| GTM Specialist | `report_type: gtm_specialist` | channels, milestones, monetization, sourcing, confidence |
| The Critic | `report_type: critic` | kill-shots, contradiction checks, legal-risk fields when lens enabled |
| Export Agent | `report_type: export_agent` | brief metadata, completion flags, scorecard presence |

The Verifier does **not** re-run web research or claim factual certainty. It checks structure, sourcing presence, and obvious hallucination markers so the orchestrator can make better judgments with cleaner inputs.

---

## 3. System Architecture & Flow

### Top-Level Architecture

```
USER INPUT
    │
    ▼
┌─────────────────────────────────────────────────────┐
│                  THE ORCHESTRATOR                    │
│              (claude-opus-4-6)                      │
│                                                     │
│  • Reads full canvas state on every turn            │
│  • Decides which agents to invoke and when          │
│  • Never does deep research itself                  │
│  • Synthesizes all agent outputs                    │
│  • Leads conversation, challenges user              │
│  • Writes decisions to canvas                       │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
   PARALLEL FAN-OUT          SEQUENTIAL AGENTS
   (research phase)          (domain phases)
         │                        │
   ┌─────┴──────┐            ┌────┴────────────┐
   │ Scout      │            │ ICP Whisperer   │
   │ Analyst    │            │ Architect + Technical Cofounder │
   │ Sizer      │            │ Critic legal-risk lens   │
   └─────┬──────┘            │ GTM Specialist  │
         │                   └────┬────────────┘
         ▼                        │
   SYNTHESIS LAYER                │
   (orchestrator reads            │
    all outputs, writes           │
    to canvas)                    │
         │                        │
         └───────────┬────────────┘
                     ▼
              THE CRITIC
              (post-milestone
               red team)
                     │
                     ▼
              CANVAS UPDATE
              (persistent state)
```

### Phase-by-Phase Flow

```
Phase -1: WARMUP
─────────────────────────────────────────────────────────
User describes idea (or Orchestrator asks for one)
Orchestrator runs Socratic questioning to sharpen a vague idea
No agents invoked yet — no research fan-out
Tool access restricted to canvas-only transition support
Goal: reach a research-ready idea, not fill the structured brief yet

Phase 0: INTAKE
─────────────────────────────────────────────────────────
Orchestrator expands the sharpened idea into the structured brief
Canvas `idea` section written with:
  summary, founder context, initial assumptions,
  open questions, value proposition, possible ICP, timestamp

Phase 1: MARKET RESEARCH (Parallel Fan-Out)
─────────────────────────────────────────────────────────
Trigger: Orchestrator decides "we need to ground this in reality"
Invokes simultaneously:
  → Scout:    Mine Reddit, X, App Store reviews for pain language
  → Analyst:  Map competitors, features, pricing, complaints
  → Sizer:    Pull market size data, funding rounds, growth rates

All 3 run in parallel (Promise.allSettled — partial failure returns
  a graceful fallback string, not a crash)
Each returns: structured report + required section headers + confidence level
Verifier (Haiku) checks output structure before canvas write
Orchestrator reads all 3, synthesizes into canvas Section 1 + 2
Orchestrator presents findings to user with its own POV on what matters

PHASE GATE: run_research_phase is called ONCE per project session.
  The tool description explicitly states this. If the orchestrator calls it
  again in the same session (e.g., user says "research again"), the tool
  handler checks canvas.project.phase — if already 'research' or later, it
  returns a warning message instead of re-running the fan-out:
  "Research phase already complete. Use follow-up questions or /rerun to override."

Phase 2: ICP DEEP DIVE
─────────────────────────────────────────────────────────
Trigger: Orchestrator determines market is real, now needs customer precision
Invokes: ICP Whisperer (single agent, Sonnet)
ICP Whisperer runs targeted searches for behavioral signals,
  specific community locations, willingness-to-pay proxies
Returns: 2–3 full personas + voice of customer quotes
Orchestrator challenges: "Is this the right customer, or the easy customer?"
Canvas updated: Section 2 ICP complete

Phase 3: DIFFERENTIATION & POSITIONING
─────────────────────────────────────────────────────────
Orchestrator-led conversation — no subagent needed
Orchestrator reads full canvas (competitors + ICP)
Runs the Peter Thiel test: "What do we believe that no competitor does?"
Runs the Jobs test: "What are we saying NO to?"
Produces: positioning thesis, feature strategy table, Blue Ocean canvas
Canvas updated: Section 3 complete

Phase 4: BUILD PLANNING
─────────────────────────────────────────────────────────
Trigger: Positioning locked, time to define what to build
Invokes: Architect (Sonnet, web search ON), then Technical Cofounder (Opus, web search OFF)
Architect researches stacks, costs, and integrations first; Technical Cofounder then reads the build context and makes the judgment calls
Returns: stack research, cost model, architecture decisions, MVP scope cuts,
  build-vs-buy recommendations, and technical risks
Orchestrator challenges assumptions, asks about cutting scope
Canvas updated: Section 4 complete

Phase 5: LEGAL LENS VIA THE CRITIC (On Demand)
─────────────────────────────────────────────────────────
Trigger: User asks, or Orchestrator detects regulatory/IP risk
Invokes: The Critic with the legal-risk lens enabled (Opus)
Critic pressure-tests: regulatory exposure, IP conflicts,
  required disclosures, data handling risk, and where a real lawyer is required
Returns: legal-risk flags, mitigation ideas, and escalation points for real counsel
Canvas updated: legal-risk notes appended under Critic findings

Phase 6: GTM + FUNDRAISING
─────────────────────────────────────────────────────────
Trigger: Build plan locked, time to go to market
Invokes: GTM + Fundraising Specialist (single agent, Sonnet)
Reads full canvas, produces:
  - Week-by-week 90-day GTM plan
  - Channel strategy with specific community targets
  - Monetization model + path to MRR milestones
  - Named investor list with thesis + check size
  - Pitch framing (one-liner, narrative arc, traction hooks)
Canvas updated: Sections 5 + 6 complete

Phase 7: THE CRITIC (Post-Milestone Red Team)
─────────────────────────────────────────────────────────
Trigger: After Phases 2, 4, and 6 complete
Invokes: The Critic (Opus)
Critic reads full canvas — everything the team has produced
Returns: 5 kill-shot assumptions + brutal honesty verdict
Orchestrator decides which criticisms are valid vs. noise
User must respond to each kill-shot before moving forward
Canvas updated: Risks + open questions section

Phase 8: ULTRAPLAN
─────────────────────────────────────────────────────────
Trigger: User says "what do I do next" or Orchestrator detects stall
Orchestrator re-reads full canvas (no subagent needed)
Produces: single critical path item + step-by-step plan to break through it
This is the "what's blocking you right now" function
```

---


### 4.2 — The Competitor Analyst

```
---
```

---


---


### 4.5 - The Architect + Technical Cofounder

> Sprint note: This section is retained as historical build-planning context, but the active sprint roster splits this work between the Architect and the Technical Cofounder.

```
You are a senior software architect and founding CTO who has shipped multiple products from zero to production. You think in systems, you build lean, and you have strong opinions about what to cut.

Your job is to produce a specific, actionable, and honest build plan for this product. Not a generic "use React and Postgres" template — a considered recommendation based on the actual product being built, its ICP, and its growth trajectory.

YOU HAVE BEEN GIVEN THIS BRIEF:
<brief>{{AGENT_BRIEF}}</brief>

YOUR FULL CANVAS CONTEXT (product definition, ICP, market, positioning):
<canvas>{{CANVAS_STATE}}</canvas>

RESEARCH BEFORE ANSWERING:
- Search for how direct competitors built their stacks (job postings, engineering blogs, BuiltWith)
- Search for "[similar product] tech stack" or "[competitor] engineering blog"
- Search for any new APIs or infrastructure tools relevant to this specific product type
- Search for "[product type] SaaS architecture" for recent community discussion

OUTPUT FORMAT (return exactly this):
---
BUILD PLANNING REPORT

COMPETITOR TECH STACKS (researched):
[What are competitors built on? What does this reveal?]

RECOMMENDED MVP STACK:
Frontend: [recommendation] — [rationale specific to this product]
Backend / API: [recommendation] — [rationale]
Database: [recommendation] — [rationale]
Auth: [recommendation] — [rationale]
AI/ML layer (if applicable): [models, APIs, whether to fine-tune or not, and why]
Infrastructure / Hosting: [recommendation] — [rationale]
Key integrations (Day 1 must-haves): [list with rationale]
Key integrations (Post-launch, V2): [list]

ESTIMATED MONTHLY INFRA COST:
- 0 users (development): $[X]/mo
- 1,000 users: $[X]/mo
- 10,000 users: $[X]/mo
- 100,000 users: $[X]/mo

MVP SCOPE TABLE:
| Feature | MVP? | V2? | Effort (S/M/L) | Notes |
|---|---|---|---|---|
[populate fully — be ruthless about what's MVP vs. V2]

WHAT TO CUT:
[Be specific about what the user might want that you'd veto from MVP, and why]

TABLE STAKES (must-have at launch to be taken seriously):
[List with brief justification for each]

WINNING FEATURES (2–3 differentiators with technical notes):
Feature: [name]
What it is: [description]
Technical complexity: [Low / Medium / High]
Why it's defensible: [what makes it hard to copy quickly]
Expected impact: [conversion, retention, or NPS effect]

TECHNICAL RISKS:
[Top 3 things that could blow up technically — with mitigations]

BUILD SEQUENCE (week-by-week for first 6 weeks):
Week 1–2: [specific deliverables]
Week 3–4: [specific deliverables]
Week 5–6: [specific deliverables]

CONFIDENCE LEVEL: [High / Medium / Low]
---
```

---

### 4.6 - The Critic legal-risk lens

> Sprint note: This section is retained as historical legal-risk context, but the active sprint roster folds legal review into the Critic via an optional legal-risk lens.

```
You are a startup-focused attorney with deep experience in tech company formation, IP, regulatory compliance, and SaaS terms. You are not here to scare founders — you are here to flag real risks and give practical guidance.

You do not give formal legal advice — you give founders the information they need to ask the right questions to a real lawyer and make informed product decisions.

YOU HAVE BEEN GIVEN THIS BRIEF:
<brief>{{AGENT_BRIEF}}</brief>

YOUR FULL CANVAS CONTEXT:
<canvas>{{CANVAS_STATE}}</canvas>

RESEARCH MANDATE:
Search for:
- Regulatory requirements specific to this product type and jurisdiction
- Competitor terms of service / privacy policies (what are they hiding? what protects them?)
- Recent legal cases or regulatory actions in this space
- IP landscape: any patents that could create problems?
- "[product type] legal requirements" or "[product type] compliance"
- "[product type] terms of service analysis" or "[space] regulatory risk"
- Data handling requirements (GDPR, CCPA, HIPAA, COPPA) if user data is involved

OUTPUT FORMAT (return exactly this):
---
CRITIC LEGAL-RISK REPORT

ENTITY STRUCTURE RECOMMENDATION:
[LLC vs C-Corp, Delaware vs. home state, and why for this specific situation]
Key consideration: [fundraising plans, equity grants, IP ownership]

IP RISK ASSESSMENT:
Known patent landscape: [what did you find?]
Trade secret risks: [anything in the product approach that needs protection?]
Trademark: [name/brand conflicts? search results?]
Recommendations: [specific actions]

REGULATORY EXPOSURE:
[List each applicable regulatory area with: what it requires, compliance complexity (Low/Med/High), and practical mitigation]

DATA & PRIVACY:
User data collected: [based on canvas — what will this product collect?]
GDPR applicable: [yes/no, and why]
CCPA applicable: [yes/no, and why]
Special categories (health, financial, children): [flag any that apply]
Minimum viable privacy policy items: [specific list]
Terms of service essentials: [what must be in there]

COMPETITOR LEGAL PATTERNS:
[What do competitors' T&S/privacy policies tell us? What protections have they built in that we should copy?]

TOP 3 LEGAL RISKS (ranked):
1. [Risk]: [what it is, likelihood, practical mitigation]
2. [Risk]: [same]
3. [Risk]: [same]

FIRST LEGAL ACTIONS (before launch):
[Specific ordered checklist — what to do, and when]

CONFIDENCE LEVEL: [High / Medium / Low] — [flag areas where you'd strongly recommend a real lawyer]
---
```

---

### 4.7 — The GTM + Fundraising Specialist

```
You are a go-to-market operator and early-stage fundraising strategist. You've helped dozens of founders get their first 100 customers and their first check. You think in distribution, not features.

Your job is to produce a specific, credible, and executable plan for how this product gets to its first paying customers AND how it gets funded if needed.

YOU HAVE BEEN GIVEN THIS BRIEF:
<brief>{{AGENT_BRIEF}}</brief>

YOUR FULL CANVAS CONTEXT (including ICP, product, competitors, positioning):
<canvas>{{CANVAS_STATE}}</canvas>

RESEARCH MANDATE:
Search for:
- Specific communities, newsletters, and influencers where the ICP lives
- Successful GTM playbooks for similar products (how did [comparable product] get first users?)
- Recent funding rounds in this space (Crunchbase, TechCrunch) — who's writing checks?
- Named investors who have funded similar products — their stated thesis
- "[space] newsletter" or "[space] community" or "[space] influencer"
- "[comparable product] how they grew" or "[comparable product] growth story"
- "[investor name] portfolio" for relevant funds

OUTPUT FORMAT (return exactly this):
---
GTM + FUNDRAISING REPORT

DISTRIBUTION STRATEGY:
Primary channel: [specific channel with rationale — why this one first]
Secondary channels: [2–3 additional with rationale]
Channels to explicitly NOT start with: [and why — be contrarian if needed]

FIRST 90 DAYS — WEEK BY WEEK:

Weeks 1–2 (Pre-launch):
- [Specific action]: [why, expected output]
- [Specific action]: [why, expected output]
Goal: [measurable outcome — e.g., "200 waitlist signups, 20 user interviews scheduled"]

Weeks 3–6 (Soft launch):
- [Specific action]: [why, expected output]
First 10 users: [exact strategy for getting them — names of communities, DM scripts, etc.]
Onboarding flow: [what should the first experience look like?]
Goal: [measurable outcome — e.g., "10 paying customers, NPS > 7"]

Weeks 7–12 (Growth loop activation):
- [Specific action]: [why, expected output]
Referral mechanic: [specific mechanism and why it works for this ICP]
First paid channel test: [channel + budget + hypothesis]
Goal: [measurable outcome]

MONETIZATION MODEL:
Model type: [Freemium / subscription / usage-based / etc.] — [why this model fits]
Pricing tiers:
  Tier 1 ([name]): $[X]/mo — [features included] — [who this is for]
  Tier 2 ([name]): $[X]/mo — [features included] — [who this is for]
  Tier 3 ([name]): $[X]/mo or custom — [for whom]
Conversion rate assumption: [X%] free → paid — [comparable benchmark]
Path to revenue:
  $5K MRR: [X] customers at $[Y]/mo — by [estimated timeline]
  $10K MRR: [X] customers at $[Y]/mo — by [estimated timeline]
  $100K ARR: [X] customers at $[Y]/mo — by [estimated timeline]

UNIT ECONOMICS:
Estimated CAC: $[X] — [channel assumption]
Estimated LTV: $[X] — [churn assumption]
LTV:CAC ratio: [X:1]
Payback period: [X months]

BOOTSTRAPPABLE ASSESSMENT:
Under $10K: [what this covers, is it enough to get to first revenue?]
Under $50K: [what this covers, can you reach early traction?]
Verdict: [Bootstrap / Pre-seed / Seed — and why]

FUNDRAISING STRATEGY (if applicable):
Raise type: [pre-seed / seed]
Raise amount: $[X] — [what it funds, how many months of runway]
Key milestones to hit before raising: [specific]

NAMED INVESTORS (5–10 specific funds/angels):
| Fund / Investor | Thesis in This Space | Typical Check Size | Why They're a Fit |
|---|---|---|---|
[populate — do the research, name real investors with real thesis]

PITCH FRAMING:
One-liner: "[X for Y that does Z without A]"
Narrative arc: [problem → insight → solution → traction → ask]
Traction hook: [what's the most compelling early signal you can point to?]

CONFIDENCE LEVEL: [High / Medium / Low]
---
```
---

## 5. Research Fan-Out Flow

### How the Parallel Research Works

The orchestrator invokes Scout, Analyst, and Sizer simultaneously. Each gets:

1. **The agent brief** — specific, explicit task description with search targets
2. **The current canvas state** — full project context
3. **A structured output template** — so synthesis is clean

```javascript
// Pseudocode for parallel fan-out
const [scoutReport, analystReport, sizerReport] = await Promise.allSettled([
  runAgent('market_scout', {
    brief: orchestrator.generateBrief('scout', canvasState),
    canvas: canvasState,
    model: 'claude-sonnet-4-6',
    maxTokens: 4000
  }),
  runAgent('competitor_analyst', {
    brief: orchestrator.generateBrief('analyst', canvasState),
    canvas: canvasState,
    model: 'claude-sonnet-4-6',
    maxTokens: 4000
  }),
  runAgent('market_sizer', {
    brief: orchestrator.generateBrief('sizer', canvasState),
    canvas: canvasState,
    model: 'claude-sonnet-4-6',
    maxTokens: 4000
  })
]);

// Synthesize into canvas
const researchSynthesis = await orchestrator.synthesize([
  scoutReport, analystReport, sizerReport
], canvasState);

// Update canvas
canvas.update('research', researchSynthesis);
```

### Brief Generation (Orchestrator → Subagent)

The orchestrator generates a **specific brief** for each subagent — not a generic "research this." Following Anthropic's own lesson that vague instructions cause duplicate work:

**BAD brief:** "Research the productivity app market."

**GOOD brief:** "Research specifically: (1) What do solo founders and indie hackers complain about when using Notion for product planning? Find Reddit threads in r/SaaS, r/IndieHackers, r/startups. (2) What features do users say they wish Notion had for product roadmapping? (3) Are there any recent posts (last 6 months) about people switching away from Notion for product work and why? Return a minimum of 6 direct quotes with sources."

### OODA Loop for Research Agents

Anthropic's own published system uses the OODA loop for subagents:

```
Each research agent executes:
1. OBSERVE — What has been gathered so far? What's still needed?
2. ORIENT — Which tools and queries would best fill the gaps?
3. DECIDE — Choose a specific tool with a specific query
4. ACT — Execute. Evaluate result. Repeat.

Continue loop until: task brief is fully addressed OR 
confidence threshold is met OR tool call limit reached.
```

### Effort Scaling Rules (embedded in Orchestrator prompt)

Per Anthropic's research: embed explicit rules so agents don't over- or under-invest:

```
When invoking research agents, apply these scaling rules:
- Simple fact (single answer needed): 1 agent, 3–5 tool calls
- Targeted research (one domain): 1 agent, 8–12 tool calls
- Full research phase (multi-domain): 3 parallel agents, 8–12 calls each
- Deep competitive analysis: 1 dedicated agent, 15+ tool calls
- Full startup brief: 3-agent fan-out + synthesis pass = full /startup-research run
```

---

## 6. Canvas & Persistent State Design

### Canvas Schema

The canvas is the product's memory. It's injected into every orchestrator turn. Structure:

```json
{
  "project": {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "phase": "warmup | intake | research | icp | build | gtm | critic | exported"
  },
  "idea": {
    "summary": "string",
    "founder_context": "string",
    "initial_assumptions": ["string"],
    "open_questions": ["string"],
    "value_proposition": "string",
    "possible_icp": ["string"],
    "last_updated": "timestamp"
  },
  "research": {
    "pain_signals": [...],
    "user_quotes": [...],
    "competitor_matrix": [...],
    "market_size": { "tam": "...", "sam": "...", "som": "..." },
    "timing_verdict": "string",
    "sources": ["string"]
  },
  "icp": {
    "personas": [...],
    "primary_icp": "string",
    "willingness_to_pay": "string",
    "where_to_find": ["string"]
  },
  "build": {
    "architect": {
      "report_type": "architect",
      "summary": "string",
      "sources": ["string"],
      "verification": {...}
    },
    "technical_cofounder": {
      "report_type": "technical_cofounder",
      "summary": "string",
      "verification": {...}
    }
  },
  "gtm": {
    "report_type": "gtm",
    "summary": "string",
    "verification": {...}
  },
  "critic": {
    "reports": [...],
    "legal_lens_used": "boolean"
  },
  "exports": {
    "last_path": "string",
    "exported_at": "timestamp"
  },
  "decisions": [
    { "date": "...", "decision": "...", "rationale": "..." }
  ],
  "conversation_summary": "string"
}
```

### State Injection

On every orchestrator turn:
1. Load canvas from storage
2. If canvas > 40K tokens, run a canvas compression step first (summarize older sections, preserve recent decisions + all structured data)
3. Inject full canvas into orchestrator system prompt
4. After orchestrator responds, parse any canvas update instructions and write them

---

## 7. Model Routing Strategy

```
┌────────────────────────────────────────────────────────────┐
│ MODEL                  │ AGENTS                  │ WHY     │
├────────────────────────┼─────────────────────────┼─────────┤
│ claude-opus-4-6        │ Orchestrator, Critic     │ Maximum │
│                        │                         │ reasoning│
│                        │                         │ & context│
├────────────────────────┼─────────────────────────┼─────────┤
│ claude-sonnet-4-6      │ ALL subagents:           │ Strong  │
│                        │ Scout, Analyst, Sizer,   │ reasoning│
│                        │ ICP Whisperer, Engineer, │ + speed │
│                        │ Legal, GTM Specialist    │         │
└────────────────────────┴─────────────────────────┴─────────┘
```

**Why this routing matters:**

- The 3-agent research fan-out at Sonnet costs ~1/5th of running the same tasks on Opus
- The Critic on Opus ensures adversarial pressure from the strongest model available
- Sonnet for domain specialists gives strong reasoning without Opus pricing
- Total cost per "full research phase": roughly $0.15–0.40 depending on product complexity

---

## 8. Prompt Engineering Rules

These come directly from Anthropic's engineering blog on their multi-agent research system:

**Rule 1: Teach the orchestrator to delegate explicitly**
The orchestrator must generate specific, detailed briefs — not short instructions. Each subagent brief should specify: objective, output format, tools to use, sources to check, and task boundaries.

**Rule 2: Embed effort scaling rules**
Without explicit effort rules, agents either spawn too many subagents (for simple tasks) or too few (for complex ones). The scaling rules in the Orchestrator prompt address this directly.

**Rule 3: Context isolation is the point**
Subagents operate in their own context windows. This means: don't try to pass too much from one agent to the next. Synthesize at the orchestrator level. Let subagents work clean.

**Rule 4: Prevent agent distraction**
"Excessive updates" between agents is a real failure mode. Each agent should return once, with a complete report, rather than streaming partial updates back and forth.

**Rule 5: Think like your agents**
Test prompts by running agents step-by-step in a simulation. Watch what they do. Identify failure modes from the process, not just the output.

**Rule 6: One agent per context, not one context for all agents**
Never try to run all agents as different "voices" in one conversation. Each agent is a separate API call with its own system prompt and context.

**Rule 7: Structured output templates are not optional**
Every agent has an explicit output format. This makes synthesis clean and prevents the orchestrator from having to parse freeform text.

---

## 9. Tech Stack

### Local-First, GitHub-Deployable (VS Code)

This is built to run entirely on your machine. No hosted backend, no auth layer, no Vercel deployment. Clone → add API key → run. That's the whole install story.

```
Runtime:         Node.js 18+ (built-in fetch, no extra deps for HTTP)
Language:        TypeScript (tsx for zero-config TS execution)
Agent Runtime:   Anthropic SDK (@anthropic-ai/sdk) — direct API calls
Parallelism:     Promise.allSettled — native, no framework needed
Streaming:       Anthropic streaming API — piped to terminal

Canvas / State:  Local JSON files in /canvas directory
  - One .json file per project
  - Human-readable, git-trackable, zero database
  - canvas/[project-slug].json

Conversation:    Local markdown log files in /conversations
  - Append-only, timestamped
  - Readable in VS Code without any tooling

Export:          Markdown (.md) — opens natively in VS Code Preview
  - Optional: markdown-pdf VS Code extension for PDF export
  - Optional: pandoc CLI for .docx if needed

AI Models:       Anthropic API (set ANTHROPIC_API_KEY in .env)
  - Orchestrator: claude-opus-4-6
  - Research agents + ICP + Architect + GTM: claude-sonnet-4-6
  - Technical Cofounder + Critic: claude-opus-4-6
  - Verifier: claude-haiku-4-5-20251001

Web Search:      Anthropic native web_search tool — no extra API keys
```

### Repo Structure

```
cofounder-swarm/
├── README.md                  # Setup + usage guide (GitHub landing page)
├── .env.example               # ANTHROPIC_API_KEY=sk-ant-...
├── package.json               # deps: @anthropic-ai/sdk, tsx, dotenv, chalk
├── tsconfig.json
│
├── src/
│   ├── index.ts               # Entry point — starts the REPL
│   ├── orchestrator.ts        # Orchestrator agent loop
│   ├── agents/
│   │   ├── scout.ts           # Market Scout
│   │   ├── analyst.ts         # Competitor Analyst
│   │   ├── sizer.ts           # Market Sizer
│   │   ├── icp.ts             # ICP Whisperer
│   │   ├── architect.ts       # Architect
│   │   ├── technical-cofounder.ts # Technical Cofounder
│   │   ├── gtm.ts             # GTM Specialist
│   │   ├── critic.ts          # The Critic
|   |   └──verifier.ts         # The Verifier
│   ├── prompts/
│   │   ├── orchestrator.ts    # Orchestrator system prompt (with canvas injection)
│   │   └── [agent].ts         # One file per agent system prompt
│   ├── canvas/
│   │   ├── schema.ts          # Canvas TypeScript types
│   │   ├── read.ts            # Load canvas from disk
│   │   └── write.ts           # Write canvas updates to disk
│   └── lib/
│       ├── run-agent.ts       # Core: single agent API call with streaming
│       ├── fan-out.ts         # Parallel research: Promise.allSettled wrapper
│       └── export.ts          # Canvas → markdown brief assembler
│
├── canvas/                    # Auto-created. One JSON per project.
│   └── .gitkeep
│
├── output/                    # Exported briefs land here
│   └── .gitkeep
│
└── prompts/                   # Raw .md prompt files (readable without running code)
    ├── orchestrator.md
    ├── scout.md
    ├── analyst.md
    ├── architect.md
    ├── sizer.md
    ├── icp.md
    ├── technical-cofounder.md
    ├── gtm.md
    ├── critic.md
    └──verifier.md
```

### Running It

```bash
# Install
git clone https://github.com/[you]/cofounder-swarm
cd cofounder-swarm
npm install

# Configure
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Run
npm run start

# The REPL starts. You'll see:
# > COFOUNDER: Tell me about the product you want to build.
# Type your idea and the orchestrator takes it from there.
```

### VS Code Developer Experience

- **Canvas files** open as formatted JSON in VS Code — readable at a glance
- **Conversation logs** are markdown files in `/conversations` — readable in Preview mode
- **Exported briefs** drop to `/output` as `.md` — preview with Cmd+Shift+V
- **All prompts** live in `/prompts` as plain `.md` files — edit them without touching code
- Add the `Markdown Preview Enhanced` VS Code extension for best brief viewing

### Why No Framework (LangChain / CrewAI / AutoGen)

- You control every prompt directly — no framework abstractions hiding behavior
- The parallelism is ~5 lines of TypeScript (`Promise.allSettled`)
- Frameworks add version churn, hidden prompt injection, and debugging hell
- Direct SDK calls mean full visibility into every token spent
- The whole agent runtime is ~200 lines of clean TypeScript across a handful of files

### GitHub Distribution Notes

The `/prompts` directory is the star-magnet. Developers who find this will fork it to customize the personas. Keep prompts as raw `.md` files so they're readable without running anything. The README should lead with a demo GIF of the REPL in action — that's what converts viewers to stars.

---

## 10. Integration with `/startup-research` Skill

Your existing `/startup-research` skill maps directly onto this architecture. Here's the integration:

```
/startup-research skill role in the agent swarm:
┌─────────────────────────────────────────────────────────┐
│  PHASE 1 PARALLEL AGENTS                                 │
│  Scout + Analyst + Sizer                                 │
│  → populate: 1.1–1.4 (Problem, Market, Competitors)     │
├─────────────────────────────────────────────────────────┤
│  PHASE 2: ICP WHISPERER                                  │
│  → populates: Section 2 (ICP, Personas, VOC)            │
├─────────────────────────────────────────────────────────┤
│  ORCHESTRATOR SYNTHESIS (after Phases 1+2)              │
│  → populates: Section 3 (Differentiation, Positioning)  │
│     via conversation + canvas analysis                   │
├─────────────────────────────────────────────────────────┤
│  ARCHITECT + TECHNICAL COFOUNDER                         │
│  → populates: Section 4 (Tech Stack, MVP)               │
├─────────────────────────────────────────────────────────┤
│  GTM SPECIALIST                                          │
│  → populates: Sections 5+6 (Monetization, GTM)          │
├─────────────────────────────────────────────────────────┤
│  EXPORT AGENT (synthesis pass)                          │
│  → assembles full research-template.md                  │
│  → runs Section Completion Checklist                    │
│  → delivers downloadable brief                          │
└─────────────────────────────────────────────────────────┘
```

---

## 11. What Beats aicofounder.com

| Dimension | aicofounder.com | This Architecture |
|---|---|---|
| Research depth | Thin summaries, citations present but light | Full startup-research brief — 6 sections, populated tables, real VOC |
| Persona quality | Described in conversation | ICP Whisperer agent with behavioral signals, exact communities, WTP analysis |
| Adversarial pressure | "Professionally objective" per their docs | Dedicated Critic agent (Opus) running kill-shot analysis after every major phase |
| Legal coverage | None | Critic legal-risk lens with escalation to real counsel |
| Technical specificity | None | Architect + Technical Cofounder split for research plus judgment |
| Fundraising | None | GTM Specialist with named investors, check sizes, pitch framing |
| Model routing | Unknown (likely all Sonnet) | Opus for orchestration + critic, Sonnet for all agents |
| Canvas schema | Proprietary, opaque | Fully defined above — you own it |
| Export quality | PDF/Word export (basic) | Full startup-research template — structured markdown brief |

**The moat:** aicofounder sells structure. You're building structure + depth + specialization + adversarial pressure. Their AI is a generalist wearing different hats. Yours is a team of actual specialists.

---

*Architecture by Claude — for a world-class founder AI swarm. All agent behaviors should be stress-tested in simulation before production deployment. Token cost at full research phase: ~$0.20–0.50 per project. Expected output quality: significantly above aicofounder.com's current product.*

---

## 12. Validation & Fact-Check Layer

### Why This Exists

Anthropic's own Research system includes a CitationAgent that processes results and verifies claims are properly attributed before returning to the user. Our architecture originally trusts agent outputs at face value — the Critic catches *strategic* errors (bad assumptions, weak positioning), but nobody catches *factual fabrication* (made-up market sizes, nonexistent competitors, fabricated user quotes). This is the single biggest reliability gap in the swarm.

The emerging architecture pattern for this is called "hallucination reduction" — a consensus engine or verification layer that audits primary outputs and flags anything below a confidence threshold. Full implementations use multiple fact-check agents cross-referencing each other. We use a lighter two-tier approach tuned for our use case.

### Design Decision: Why Not a Full CitationAgent

A dedicated CitationAgent (Anthropic-style) would re-search every claim against the live web. That's overkill here. Anthropic serves millions of users and needs URL-level citation precision. Our swarm produces *strategic analysis* for a single founder. The real risk isn't "wrong URL" — it's:

- Made-up market size numbers (round numbers with no methodology)
- Nonexistent competitors presented confidently
- Fabricated user quotes attributed to Reddit/X
- Suspiciously specific statistics with no source
- Reports that never admit uncertainty (the strongest hallucination signal)

So we built a two-tier system: source tagging embedded in every agent + a lightweight Verifier agent that audits outputs on the cheapest model.

### Tier 1: Source Tagging (Embedded in All Subagent Prompts)

This is free — no additional API calls. Every subagent's output format already has structured templates. We add a `SOURCING RULES` block to the `RULES` section of every research agent prompt (Scout, Analyst, Sizer, ICP Whisperer, Engineer, Legal, GTM):

```
SOURCING RULES:
- Every statistic, quote, company name, or market claim MUST include a source URL or citation
- If you cannot find a source, tag the claim as [ESTIMATED] or [UNSOURCED]
- Never present an estimate as a fact. "The market is ~$2B [ESTIMATED based on adjacent market X]" is acceptable. "$2B TAM" with no source is not.
- Quotes must include: platform, subreddit/thread if applicable, approximate date
- If a search returned no useful results for a specific question, say so explicitly rather than filling in from general knowledge
- Reports that never admit uncertainty are more likely to contain hallucinations. Flag your confidence honestly.
```

The Critic and Orchestrator do NOT get these rules — they synthesize, they don't produce primary claims.

### Tier 2: The Verifier Agent

A new 9th agent. Runs on Haiku (cheapest model). Its only job: scan a structured report for factual claims, check whether each has a source, and flag anything that looks fabricated. It does NOT re-search. It audits.

| Property | Value |
|---|---|
| **Agent Name** | The Verifier |
| **Model** | `claude-haiku-4-5-20251001` |
| **Runs When** | After every subagent returns, before orchestrator synthesizes |
| **Input** | Single agent report (NOT full canvas — keeps it fast and focused) |
| **Output** | Verification audit: sourced/unsourced counts, flagged claims, fabrication risk level |
| **Cost per call** | ~$0.002–0.005 (negligible) |

### Updated Agent Roster

| # | Agent Name | Role | Model | Runs When |
|---|---|---|---|---|
| 0 | **The Orchestrator** | Visionary Cofounder - leads conversation, challenges assumptions, directs all agents | `claude-opus-4-6` | Always active |
| 1 | **The Market Scout** | Reddit/social pain mining, voice of customer, demand signals | `claude-sonnet-4-6` | Research phase |
| 2 | **The Competitor Analyst** | Competitor mapping, feature gaps, pricing intel, tech stacks | `claude-sonnet-4-6` | Research phase |
| 3 | **The Market Sizer** | TAM/SAM/SOM, market structure, funding landscape, timing | `claude-sonnet-4-6` | Research phase |
| 4 | **The ICP Whisperer** | Persona building, behavioral signals, where to find them, what they pay | `claude-sonnet-4-6` | ICP phase |
| 5 | **The Architect** | Stack research, infrastructure cost modeling, build sequence, integrations | `claude-sonnet-4-6` | Build phase |
| 6 | **The Technical Cofounder** | Architecture decisions, MVP scope discipline, build-vs-buy, technical risk judgment | `claude-opus-4-6` | Build phase |
| 7 | **The GTM Specialist** | Distribution strategy, first 90 days, monetization framing | `claude-sonnet-4-6` | GTM phase |
| 8 | **The Critic** | Red-teaming, kill-shot assumption testing, optional legal-risk lens | `claude-opus-4-6` | After each major milestone |
| 9 | **The Verifier** | Structural checks, sourcing presence, hallucination markers | `claude-haiku-4-5-20251001` | After every specialist return |
| 10 | **The Export Agent** | Final markdown brief export | `claude-sonnet-4-6` | On `/export` |
### Where the Verifier Plugs Into the Flow

```
Phase 1: MARKET RESEARCH (Modified)
─────────────────────────────────────────────────────────
Parallel fan-out (unchanged):
  → Scout, Analyst, Sizer run simultaneously via Promise.allSettled

NEW — Parallel verification pass:
  → Verifier audits Scout report    ┐
  → Verifier audits Analyst report  ├─ Also Promise.allSettled (on Haiku)
  → Verifier audits Sizer report    ┘

Orchestrator receives: { report + audit } for each agent
Orchestrator reads audits BEFORE synthesizing:
  - If fabrication risk = Low → synthesize normally
  - If fabrication risk = Medium → note unverified claims in canvas
  - If fabrication risk = High → re-invoke agent with narrower brief
                                  targeting flagged items

Canvas write includes verification metadata
```

The same pattern applies to ALL subsequent phases:

```
Any subagent returns report
         │
         ▼
  Verifier audits report (Haiku, ~$0.003)
         │
         ▼
  Orchestrator receives { report, audit }
         │
         ▼
  Orchestrator decides: pass / flag / re-research
         │
         ▼
  Canvas write (with verification metadata)
```

### Canvas Schema Addition

The `research` section (and all other agent-populated sections) gain a `verification` field:

```json
"research": {
  "raw_reports": { "scout": "...", "analyst": "...", "sizer": "..." },
  "verification": {
    "scout_risk": "Low",
    "analyst_risk": "Medium",
    "sizer_risk": "Low",
    "flagged_claims": [
      "TAM of $4.2B — no source provided, round number, likely estimated",
      "Competitor 'FlowStack' — not found in any search results, may not exist"
    ],
    "unverified_items": [
      "Market growth rate of 23% CAGR — tagged [ESTIMATED]"
    ]
  },
  "pain_signals": ["..."],
  "...": "..."
}
```

### Orchestrator Prompt Addition

Add to the Orchestrator's system prompt, after the `AVAILABLE AGENTS` section:

```
VERIFICATION CONTEXT:
Each research report comes with a Verification Audit from an independent auditor.
Before synthesizing findings into the canvas:
- Check each audit's FABRICATION RISK level
- If any report is flagged "High" risk or "Needs re-research," tell the user which findings you're treating as unverified and why
- Never write an UNSOURCED claim to the canvas without marking it [UNVERIFIED]
- If multiple agents' claims contradict each other, flag the contradiction explicitly
- Reports that admit uncertainty are MORE trustworthy, not less — reward honesty in agent outputs
```

### What This Does NOT Do (Intentionally)

- **Does not re-search.** The Verifier doesn't have web_search access. It audits, it doesn't investigate.
- **Does not block the pipeline.** A "High" fabrication risk is a signal, not a gate. The orchestrator decides what to do.
- **Does not cross-reference between agents.** That's the orchestrator's job during synthesis. The Verifier checks one report at a time.
- **Does not run on expensive models.** Haiku is sufficient for pattern-matching audits. No reasoning required.

### Cost Impact

| Phase | Verification Calls | Model | Estimated Cost |
|---|---|---|---|
| Research (3 agents) | 3 parallel Haiku calls | haiku-4-5 | ~$0.01 |
| ICP phase | 1 Haiku call | haiku-4-5 | ~$0.003 |
| Build phase | 1 Haiku call | haiku-4-5 | ~$0.003 |
| Legal phase | 1 Haiku call | haiku-4-5 | ~$0.003 |
| GTM phase | 1 Haiku call | haiku-4-5 | ~$0.003 |
| **Total per full run** | **7 calls** | | **~$0.02** |

Negligible. Less than 5% cost increase on the full research phase.

---

## 13. Context Window Management

### Why This Is a First-Class Concern

The canvas is the swarm's memory. It's injected into every orchestrator turn and every subagent brief. As the project progresses through 8 phases, the canvas grows — raw research reports alone can hit 15–20K tokens across Scout, Analyst, and Sizer. By the time you've completed ICP, Build, Legal, and GTM, the canvas can easily exceed 50K tokens. At that point, context drift kicks in: the orchestrator starts losing track of early decisions, contradictions slip through, and output quality degrades.

Anthropic's own Research system uses a dual strategy: in-context summarization that replaces full conversation history with structured summaries, plus filesystem preservation that stores the complete original as a canonical record. LangChain's Deep Agents SDK triggers compression at threshold fractions of the context window. JetBrains' research found that observation masking (hiding tool outputs while keeping reasoning intact) often outperforms LLM summarization for agent tasks, because summarization can smooth over critical failure signals.

Our approach uses a **three-tier context architecture** tuned for the specific shape of our swarm:

### Tier 1: Agent-Level Compression (Report Summaries)

Every subagent returns a full structured report (stored in `raw_reports` in the canvas). But the orchestrator and subsequent agents don't need the full 4,000-token report — they need the key findings. After each agent completes, a Haiku summarization pass compresses the report into a ~500-token executive summary. The canvas stores both:

- `raw_reports.scout` — full report (for export, for the Critic, for re-reading)
- `summaries.scout` — compressed summary (for injection into subsequent agent briefs and orchestrator turns)

This mirrors the pattern Anthropic describes: subagents act as intelligent filters by exploring independently, then condensing the most important tokens for the lead agent.

### Tier 2: Canvas Injection Strategy (What Gets Passed Where)

Not every agent needs the full canvas. Context isolation is the point — each agent should get exactly what it needs:

```
┌─────────────────────────────────────────────────────────────────┐
│ AGENT                │ CANVAS INJECTION STRATEGY                │
├──────────────────────┼──────────────────────────────────────────┤
│ Orchestrator         │ Full canvas (summaries, not raw reports) │
│                      │ + recent decisions + current phase       │
│                      │ If > 40K tokens: compress older sections │
├──────────────────────┼──────────────────────────────────────────┤
│ Scout / Analyst /    │ Idea summary + brief only                │
│ Sizer (Phase 1)      │ No prior research (they ARE the research)│
├──────────────────────┼──────────────────────────────────────────┤
│ ICP Whisperer        │ Idea + research SUMMARIES + brief        │
│ (Phase 2)            │ NOT raw reports                          │
├──────────────────────┼──────────────────────────────────────────┤
│ Architect + Technical Cofounder      │ Idea + research summaries + ICP summary  │
│ (Phase 4)            │ + positioning thesis + brief             │
├──────────────────────┼──────────────────────────────────────────┤
│ Critic legal-risk lens        │ Idea + product summary + build summary   │
│ (Phase 5)            │ + brief                                  │
├──────────────────────┼──────────────────────────────────────────┤
│ GTM Specialist       │ Full canvas summaries + brief            │
│ (Phase 6)            │ (needs the whole picture)                │
├──────────────────────┼──────────────────────────────────────────┤
│ The Critic           │ Full canvas (summaries + raw reports)    │
│ (Phase 7)            │ Gets everything — maximum scrutiny       │
├──────────────────────┼──────────────────────────────────────────┤
│ Verifier             │ Single report only — no canvas           │
│                      │ (audits one document at a time)          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Tier 3: Canvas Compression (Long-Running Sessions)

When the orchestrator's total context (system prompt + canvas + conversation history) approaches 40K tokens:

1. **Summarize older sections.** Research summaries replace full findings. Older decision log entries get compressed. Phase-specific data that's been superseded gets archived.
2. **Preserve invariants.** The idea summary, current phase, most recent decisions, and all structured data (competitor matrix, ICP personas, pricing tiers) are never compressed — they're referenced too often.
3. **Conversation history trimming.** The orchestrator's conversation history uses a sliding window: last 6 turns verbatim, older turns replaced with a running summary that preserves key decisions and user preferences.

### Summarization Prompt (for Haiku compression passes)

```
Compress the following agent report into a 300–500 token executive summary.
Preserve: all specific numbers, company names, named sources, direct quotes,
risk levels, and recommendations.
Remove: search methodology details, preamble, hedging language, and any
section where the agent says they couldn't find data (note this as a single
line: "[Data gap: X]").
Format: Use the same section headers as the original but with 1–2 sentences
per section instead of paragraphs.
Do NOT add analysis or interpretation — summarize only what the report says.
```

### Token Budget by Phase

```
┌─────────────────────┬──────────────┬───────────────────────────┐
│ Phase               │ Canvas Size  │ What Changed              │
│                     │ (approx.)    │                           │
├─────────────────────┼──────────────┼───────────────────────────┤
│ 0: Intake           │ ~1K tokens   │ Idea + assumptions        │
│ 1: Research         │ ~3K tokens   │ +3 summaries (~500 ea)    │
│ 2: ICP              │ ~4.5K tokens │ +1 summary                │
│ 3: Positioning      │ ~6K tokens   │ +thesis, feature table    │
│ 4: Build            │ ~8K tokens   │ +1 summary + MVP table    │
│ 5: Legal            │ ~9.5K tokens │ +1 summary                │
│ 6: GTM              │ ~12K tokens  │ +1 summary + investor list│
│ 7: Critic           │ ~14K tokens  │ +critic report            │
│ Orchestrator total  │ ~18–22K      │ Canvas + system prompt    │
│ (with conversation) │              │ + conversation history     │
└─────────────────────┴──────────────┴───────────────────────────┘
```

By using summaries instead of raw reports in the canvas injection, we keep the orchestrator's context under 25K tokens even at Phase 7 — well within the safe zone. Raw reports are preserved on disk for export and deep-dive access.

---

## 14. Error Handling & Graceful Degradation

### Why This Matters

LLM APIs fail regularly — rate limits, transient server errors, timeouts, network blips. The Anthropic API has per-model rate limits on requests per minute, tokens per minute, and tokens per day. A parallel research fan-out (3 Sonnet calls simultaneously) is exactly the kind of burst that triggers rate limiting. Without retry logic, one 429 error kills the entire research phase. Without timeout handling, a hung API call blocks the REPL indefinitely. Without graceful degradation, users see crashes instead of partial results.

The production-standard approach is a layered defense: exponential backoff with jitter for transient errors, model fallback for persistent failures, per-agent timeout caps, and graceful degradation that returns partial results rather than nothing.

### Architecture: Four-Layer Error Defense

```
User Input
    │
    ▼
┌─────────────────────────────────────────────┐
│ Layer 1: BUDGET GATE (see Section 16)       │
│ Check session cost against MAX_SESSION_COST │
│ If exceeded → pause, ask user confirmation  │
├─────────────────────────────────────────────┤
│ Layer 2: RETRY WITH BACKOFF                 │
│ Transient errors (429, 500, 503, timeout)   │
│ → Exponential backoff + jitter              │
│ → Max 3 retries per call                    │
│ → Per-error-type configuration              │
├─────────────────────────────────────────────┤
│ Layer 3: MODEL FALLBACK                     │
│ If primary model fails after retries:       │
│ Opus → Sonnet → Haiku (orchestrator/critic) │
│ Sonnet → Haiku (subagents)                  │
│ Flag in output: "[Ran on fallback model]"   │
├─────────────────────────────────────────────┤
│ Layer 4: GRACEFUL DEGRADATION               │
│ If all retries + fallbacks fail:            │
│ → Return partial results with explanation   │
│ → "[Scout failed — Analyst and Sizer data   │
│    available. Orchestrator proceeding with   │
│    partial research.]"                      │
│ → Canvas marked: research.scout_status =    │
│   "failed"                                  │
└─────────────────────────────────────────────┘
```

### Error Classification

```
RETRYABLE (exponential backoff + jitter):
  - HTTP 429 (rate limit) → backoff with longer initial delay (5s)
  - HTTP 500 (server error) → backoff with standard delay (1s)
  - HTTP 503 (service unavailable) → backoff with standard delay
  - Network timeout → backoff with standard delay
  - ECONNRESET / ECONNREFUSED → backoff with standard delay

NOT RETRYABLE (fail fast):
  - HTTP 400 (bad request) → log + surface error to user
  - HTTP 401 (auth failure) → check API key, halt session
  - HTTP 403 (forbidden) → check permissions, halt session
  - Malformed response (no text content) → log warning, return placeholder

CONTENT FAILURES (agent-level, not API-level):
  - Agent returns empty/boilerplate report → flag as "low quality"
  - Agent returns report with zero sourced claims → flag via Verifier
  - Agent exceeds token budget → truncation warning to orchestrator
```

### Per-Agent Timeout Caps

```
┌──────────────────────┬──────────────┬───────────────────────────┐
│ Agent                │ Timeout (s)  │ Rationale                 │
├──────────────────────┼──────────────┼───────────────────────────┤
│ Orchestrator         │ 120          │ Complex reasoning + tools │
│ Scout                │ 90           │ Heavy web search          │
│ Analyst              │ 90           │ Heavy web search          │
│ Sizer                │ 90           │ Heavy web search          │
│ ICP Whisperer        │ 90           │ Targeted web search       │
│ Architect + Technical Cofounder      │ 60           │ Some web search + analysis│
│ Critic legal-risk lens        │ 60           │ Some web search + analysis│
│ GTM Specialist       │ 90           │ Heavy web search          │
│ Critic               │ 60           │ Analysis only, no search  │
│ Verifier             │ 15           │ Haiku, no tools, fast     │
│ Summarizer (Haiku)   │ 15           │ Compression only          │
└──────────────────────┴──────────────┴───────────────────────────┘
```

### Parallel Fan-Out Failure Handling

When one of the three research agents fails, `Promise.allSettled` ensures the surviving agents' results aren't lost:

```
Promise.allSettled([Scout, Analyst, Sizer])
    │
    ├─ Scout: fulfilled → pass to Verifier
    ├─ Analyst: rejected → mark as failed, log error
    └─ Sizer: fulfilled → pass to Verifier

Orchestrator receives:
  scout: { report, audit }
  analyst: { status: "failed", error: "Rate limited after 3 retries" }
  sizer: { report, audit }

Orchestrator tells user:
  "Research came back partial — Competitor Analyst hit rate limits.
   I have strong data from Scout and Sizer. Want me to retry the
   competitor analysis, or proceed with what we have?"
```

---

## 15. Observability & Logging Layer

### Why This Exists

Conversation logs (markdown in `/conversations`) are for the user. Observability logs are for the developer. Without per-agent token tracking, you can't optimize prompts. Without latency metrics, you can't identify bottleneck agents. Without cost tracking, open-source users will burn through API credits without realizing it.

Anthropic provides a Usage and Cost API for organization-level tracking, but it requires an Admin API key and doesn't give per-call granularity within a session. We need local, per-invocation telemetry.

### What We Log (Per Agent Call)

Every call through `runAgent()` produces a telemetry record:

```json
{
  "timestamp": "2026-03-30T14:22:31.847Z",
  "session_id": "abc-123",
  "project_slug": "ai-cofounder",
  "phase": "research",
  "agent": "market_scout",
  "model": "claude-sonnet-4-6",
  "status": "success",
  "input_tokens": 3842,
  "output_tokens": 2156,
  "total_tokens": 5998,
  "cost_estimate_usd": 0.0439,
  "duration_ms": 12340,
  "tool_calls": 8,
  "retries": 0,
  "fallback_model": null,
  "error": null
}
```

### Cost Estimation Formula

Calculated locally from the `response.usage` object using published pricing:

```
Opus 4.6:   input $5/MTok,  output $25/MTok
Sonnet 4.6: input $3/MTok,  output $15/MTok
Haiku 4.5:  input $1/MTok,  output $5/MTok

cost = (input_tokens / 1_000_000 * input_rate)
     + (output_tokens / 1_000_000 * output_rate)
```

### Log Storage

```
logs/
├── telemetry/
│   └── [project-slug]-[date].jsonl    ← One line per agent call (JSONL)
└── session-summary/
    └── [project-slug]-[date].json     ← Aggregated session summary
```

JSONL format (one JSON object per line) is chosen because it's append-only, streamable, and trivially parseable with `jq` or any JSON library.

### Session Summary (Generated at `/quit` or `/exit`)

```json
{
  "session_id": "abc-123",
  "project_slug": "ai-cofounder",
  "start_time": "2026-03-30T14:20:00Z",
  "end_time": "2026-03-30T15:45:00Z",
  "duration_minutes": 85,
  "phases_completed": ["intake", "research", "icp"],
  "total_agent_calls": 12,
  "total_tokens": 89420,
  "total_cost_usd": 0.87,
  "cost_by_agent": {
    "orchestrator": 0.42,
    "market_scout": 0.09,
    "competitor_analyst": 0.11,
    "market_sizer": 0.08,
    "icp_whisperer": 0.10,
    "verifier": 0.02,
    "summarizer": 0.01
  },
  "cost_by_model": {
    "claude-opus-4-6": 0.42,
    "claude-sonnet-4-6": 0.38,
    "claude-haiku-4-5-20251001": 0.03
  },
  "errors": [],
  "retries": 1,
  "fallbacks_used": 0
}
```

### Terminal Output

After each agent call, the existing terminal output (`done (3k→2k tokens)`) is extended:

```
  → Market Scout researching........ done (3k→2k tokens, $0.04, 12.3s)
  → Competitor Analyst researching... done (4k→3k tokens, $0.06, 18.1s)
  → Market Sizer researching........ done (3k→1k tokens, $0.03, 9.7s)
  ✓ Research phase complete — $0.13 total, 40.1s

  → Verifier (Scout)...... pass (Low risk)
  → Verifier (Analyst).... pass with warnings (1 flagged claim)
  → Verifier (Sizer)...... pass (Low risk)
```

### REPL Command: `/cost`

A new REPL command that prints the running session cost:

```
> /cost

Session Cost Summary (ai-cofounder)
─────────────────────────────────────
Total cost:       $0.87 / $5.00 budget
Agent calls:      12
Tokens used:      89,420

By phase:
  Intake:     $0.15 (2 orchestrator turns)
  Research:   $0.26 (3 agents + 3 verifiers + summarizers)
  ICP:        $0.18 (1 agent + verifier + summarizer)
  Orchestrator: $0.28 (synthesis + conversation)

Budget remaining: $4.13
```

---

## 16. Session Budget Cap (Security for Open Source)

### The Problem

This repo ships as open source. Users clone it, add their Anthropic API key, and run it. The Orchestrator runs on Opus ($5/$25 per MTok). A single full research phase with synthesis can easily cost $0.50–1.00. A user who runs the full pipeline multiple times, or who has verbose prompts, or who triggers multiple Critic runs, could burn $10–50 in a single session without realizing it.

This is the #1 complaint in every open-source AI tool that uses paid APIs. Claude Code itself faced this — Anthropic had to introduce rate limits for heavy users to address cost imbalances.

### The Solution: Configurable Budget Cap

A `MAX_SESSION_COST` variable in `.env` that pauses the swarm and asks for user confirmation before continuing when the budget is exceeded.

### .env Configuration

```bash
# .env.example (updated)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Maximum cost per session in USD. The swarm pauses and asks for
# confirmation before exceeding this amount. Set to 0 to disable.
# Default: $5.00 (covers a full research-through-GTM run)
MAX_SESSION_COST=2.00

# Cost warning threshold (percentage of budget).
# At this point, the orchestrator mentions remaining budget.
COST_WARNING_THRESHOLD=0.80
```

### How It Works

```
Every runAgent() call:
  1. Calculate cost from response.usage
  2. Add to running session total
  3. Check against MAX_SESSION_COST

If session_cost >= MAX_SESSION_COST * COST_WARNING_THRESHOLD:
  → Orchestrator's next response includes:
    "[Budget notice: $4.00 of $5.00 budget used. Nearing limit.]"

If session_cost >= MAX_SESSION_COST:
  → Agent call completes (never interrupted mid-call)
  → REPL pauses BEFORE the next agent invocation
  → Displays:

    ⚠ Session budget reached: $5.12 / $5.00
    
    Breakdown:
      Orchestrator: $2.40 (8 turns)
      Research:     $1.20 (3 agents + verifiers)
      ICP:          $0.82 (1 agent + verifier)
      Other:        $0.70 (summarizers, critic)
    
    Options:
      [1] Add $5.00 to budget and continue
      [2] Add custom amount
      [3] Export current brief and exit
      [q] Quit without exporting
    
    Choice:

If user adds budget → new limit = old limit + added amount
If user quits → canvas auto-saved, exportable later
```

### Why $5.00 Default

Based on our cost estimates:
- Full research phase (3 agents + verifiers + summarizers): ~$0.30–0.60
- Full project run through GTM (all phases): ~$2–5
- A $5.00 default covers one complete run with room for back-and-forth
- Power users who want multi-session deep dives can increase to $20–50
- Testing/development users can set to $1.00 and use Haiku models

### Budget Gate Placement

The budget check happens at two points:

1. **Before every `runAgent()` call** — checked in the agent runner itself
2. **Before every orchestrator turn** — checked in the REPL loop

This ensures no agent is ever *started* after the budget is exceeded, but any in-progress call is never interrupted (that would waste the tokens already spent).

### Canvas Persistence on Budget Exit

When a user hits the budget cap and chooses to exit:
1. Canvas is auto-saved (this already happens on every turn)
2. A partial export is offered with whatever sections are complete
3. The session summary (Section 15) is written with a `"budget_exit": true` flag
4. Next time the user runs `npm start`, they can resume the same project from where they left off

---

## 17. Tool Design Specificity — Search Heuristics Per Agent

### Why This Matters

All our research agents use the same Anthropic `web_search` tool. The tool itself can't be changed — it's a single search endpoint. But Anthropic's engineering team discovered that **how agents are instructed to use a tool matters as much as the tool itself**. They documented a case where Claude kept appending "2025" to search queries, skewing results, and fixed it purely by improving the tool's description. Their core finding: agent-tool interfaces are as critical as human-computer interfaces, and bad tool descriptions send agents down completely wrong paths.

Our current architecture relies on each agent's system prompt to guide search behavior. The prompts already list source priorities (Scout → Reddit/forums, Analyst → company sites/reviews, Sizer → research firms). But they lack **explicit search heuristics** — tactical rules that prevent the three most common failure modes in parallel research:

1. **Query duplication.** Scout, Analyst, and Sizer all search "[space] review" and get the same results.
2. **Source misallocation.** The Sizer wanders into Reddit threads (Scout's territory) looking for market size data.
3. **Query verbosity.** Agents use long, specific queries that return zero results instead of starting broad and narrowing.

### The Fix: Search Heuristic Blocks

Each research agent's system prompt gets a `SEARCH HEURISTICS` block that acts as tactical instructions for *how* to use the web_search tool — not just what to search, but how to construct queries, which sources to prioritize, and which to explicitly avoid.

### Scout — Search Heuristics

```
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Start BROAD (2–3 words), then narrow based on results. "[problem]" before "[problem] Reddit r/saas"
- Use natural language phrasing that real users would type: "hate managing invoices" not "invoice management dissatisfaction"
- Never exceed 6 words per query. Long queries return nothing.
- Run at least 8 distinct searches. Never run the same query twice with minor variations.

SOURCE PRIORITY (search for these IN THIS ORDER):
1. Reddit threads (append "Reddit" or "site:reddit.com" to queries)
2. Hacker News discussions (append "Hacker News" or "site:news.ycombinator.com")
3. X/Twitter posts (search "[problem] frustrating" or "[tool] hate")
4. App Store / Google Play reviews (search "[competitor] reviews app store")
5. Product Hunt comments (search "[competitor] Product Hunt")
6. YouTube comments (only if other sources are thin)

SOURCES TO EXPLICITLY AVOID (these are the Analyst's territory):
- Company websites and pricing pages
- Crunchbase / funding data
- Market research reports (Gartner, Statista, IDC)
- BuiltWith / Stackshare / tech stack data

ANTI-PATTERNS:
- Do NOT search "[space] market size" — that's the Sizer's job
- Do NOT search "[competitor] pricing" — that's the Analyst's job
- Do NOT search generic terms like "best [category] tools" — be specific to pain
- If a search returns zero useful results, reformulate with shorter/different terms. Never repeat the same failed query.
```

### Analyst — Search Heuristics

```
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Lead with competitor names, not categories. "[CompanyName] pricing" not "[space] pricing comparison"
- Use 2–4 word queries. Shorter queries return more comprehensive results.
- For each competitor, run at least 3 searches: [name] + "pricing", [name] + "reviews", [name] + "funding"
- Search for the space itself only to DISCOVER competitors: "[space] tools", "[space] startup", "[space] app"

SOURCE PRIORITY (search for these IN THIS ORDER):
1. Competitor websites (pricing pages, feature lists, about pages)
2. G2, Capterra, TrustRadius reviews (search "[competitor] G2 review")
3. Crunchbase / TechCrunch / funding data (search "[competitor] funding round")
4. BuiltWith / Stackshare / job postings (search "[competitor] tech stack" or "[competitor] engineering blog")
5. Product Hunt launch pages (search "[competitor] Product Hunt launch")
6. App Store listings (if mobile product)

SOURCES TO EXPLICITLY AVOID (these are other agents' territory):
- Reddit threads about user frustration (Scout handles this)
- Market size reports from research firms (Sizer handles this)
- Macro trend articles without competitor-specific data

ANTI-PATTERNS:
- Do NOT search "[space] market size" — that's the Sizer's job
- Do NOT search "[problem] Reddit" — that's the Scout's job
- Do NOT search "[space] trends 2026" without a competitor focus
- If you find a competitor mentioned in the brief, search for them immediately. Don't wait until you've searched for the category.
```

### Sizer — Search Heuristics

```
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Lead with market terms: "[space] market size", "[space] TAM", "[space] CAGR"
- Include the current year: "[space] market size 2026" or "[space] funding 2026"
- For funding data, be specific: "seed funding [space] 2026" or "Series A [space] startups"
- Use research firm names for credibility: "Gartner [space]", "Statista [space] market"

SOURCE PRIORITY (search for these IN THIS ORDER):
1. Market research reports (Grand View Research, Mordor Intelligence, Statista, IBISWorld)
2. Industry analyst reports (Gartner, IDC, Forrester, CB Insights)
3. VC and funding databases (Crunchbase, PitchBook via TechCrunch reporting)
4. News about regulatory changes ("[space] regulation 2026")
5. Technology trend articles from credible sources (a16z, Sequoia, First Round blog)
6. Government/academic data (Census data, BLS, industry associations)

SOURCES TO EXPLICITLY AVOID (these are other agents' territory):
- Reddit threads / forum posts (Scout handles this)
- Individual competitor websites (Analyst handles this)
- App Store reviews or user complaints
- Product Hunt comments

ANTI-PATTERNS:
- Do NOT search for user pain language or frustration posts — that's the Scout's job
- Do NOT search "[competitor] pricing" — that's the Analyst's job
- Do NOT present a single research report's number as "the TAM" without cross-referencing
- If a market size search returns nothing, try adjacent markets and build a bottom-up estimate. Say so explicitly.
```

### How This Reduces Duplication

The key pattern across all three heuristic blocks:

```
┌──────────────────────────────────────────────────────────────┐
│ TERRITORY MAP — What Each Agent Owns                          │
├──────────────┬────────────────┬───────────────────────────────┤
│ SCOUT        │ ANALYST        │ SIZER                         │
├──────────────┼────────────────┼───────────────────────────────┤
│ Reddit       │ Company sites  │ Market research reports        │
│ HN threads   │ G2/Capterra    │ Industry analyst reports       │
│ X/Twitter    │ Crunchbase     │ VC funding databases           │
│ App Store    │ BuiltWith      │ Regulatory / macro data        │
│   reviews    │ Product Hunt   │ Government / academic data     │
│ Forum posts  │   launches     │ Trend reports (macro)          │
│ YouTube      │ Job postings   │                               │
│   comments   │ Tech blogs     │                               │
├──────────────┼────────────────┼───────────────────────────────┤
│ QUERY STYLE  │ QUERY STYLE    │ QUERY STYLE                   │
│ Natural      │ Company-name   │ Market-term                   │
│ language,    │ led, pricing/  │ led, includes year,           │
│ pain-focused │ feature focused│ research-firm names           │
└──────────────┴────────────────┴───────────────────────────────┘
```

Each agent's "avoid" list explicitly names the other agents' territories. This means the orchestrator's brief can stay focused on *what* to research, while the heuristic blocks handle *how* to search without stepping on each other.

### ICP Whisperer — Search Heuristics (Phase 2)

The ICP Whisperer runs after research, so its territory is different:

```
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Search for WHERE people are, not what they think: "[ICP] Discord server", "[ICP] subreddit", "[ICP] newsletter"
- Search for behavioral signals: "[ICP] daily routine", "[ICP] tools they use", "[ICP] budget for [category]"
- Search for willingness-to-pay proxies: "[comparable tool] pricing reviews", "how much [ICP] pay for [category]"
- Use 2–4 word queries. Add "community" or "forum" to find gathering places.

SOURCE PRIORITY:
1. Community directories (subreddit lists, Discord server directories, Slack community lists)
2. Newsletter and content creator listings ("[space] newsletter", "[ICP] influencer")
3. Job postings that reveal the ICP's pain (search "[pain point] job posting")
4. LinkedIn/X hashtags and bio patterns
5. Demographic and psychographic data (Pew Research, industry surveys)

SOURCES TO EXPLICITLY AVOID:
- Market sizing data (already collected in Phase 1)
- Competitor feature lists (already collected in Phase 1)
- Generic persona templates — build from evidence, not archetypes
```

### GTM Specialist — Search Heuristics (Phase 6)

```
SEARCH HEURISTICS (how to use web_search effectively):

QUERY CONSTRUCTION:
- Search for HOW comparable products grew: "[comparable product] first users", "[comparable product] growth story"
- Search for specific distribution channels: "[ICP] newsletter", "[space] community", "[space] conference"
- Search for investor thesis: "[investor name] portfolio [space]", "[space] seed investors 2026"
- Search for pricing benchmarks: "[comparable product] pricing", "[space] SaaS pricing 2026"

SOURCE PRIORITY:
1. Growth case studies and retrospectives (Lenny's Newsletter, First Round Review, a16z blog)
2. Investor portfolio pages and thesis posts
3. Community and newsletter directories specific to the ICP
4. Pricing pages of adjacent/comparable products
5. TechCrunch, The Information, or similar for recent deals

SOURCES TO EXPLICITLY AVOID:
- General market size data (already collected)
- User pain language (already collected)
- Competitor tech stacks (already collected)
```

### Where These Live in the Codebase

The search heuristic blocks are appended to each agent's system prompt in `src/prompts/agents.ts`, immediately after the existing `SEARCH STRATEGY` section and before the `OUTPUT FORMAT` section. They're also reflected in the corresponding `prompts/*.md` files for human readability.

---

## 18. Warm-Up Phase — Idea Sharpening (Phase -1)

### Why This Exists

Most startup validation tools make a critical UX mistake: they assume the user already knows what they want to build. In reality, many founders arrive with:

- **Vibes, not ideas.** "I want to do something in the AI education space."
- **Solutions without problems.** "I want to build an app that uses GPT to summarize meetings."
- **Wide categories, not products.** "Something for small businesses."
- **Personal frustrations, not market opportunities.** "I hate how Slack notifications work."

ValidatorAI's own data shows that 19% of founders describe their target customer as simply "people" or "users" — fundamentally too vague to research. Jumping straight to canvas initialization and research with a vague idea wastes tokens, produces generic results, and fails the user at the moment they need help most.

The existing Phase 0 (Intake) does some clarifying, but it initializes the structured idea brief too quickly — writing an `idea.summary` before the idea is sharp enough to research. This creates a downstream problem: research agents receive briefs based on vague summaries and return vague results.

### The Solution: Phase -1 (Warm-Up)

A pre-intake phase where the orchestrator operates as a Socratic thinking partner. No agents invoked. No research fan-out. Tool use is restricted to canvas-only handoff support, and the structured `idea` brief is not written until Intake. The orchestrator (on Opus) asks probing questions that force the founder to articulate what they're actually building, who it's for, and why it matters.

### Phase -1 Flow

```
USER ARRIVES
    │
    ▼
Phase -1: WARM-UP (Idea Sharpening)
─────────────────────────────────────────────────────────
Trigger: User's initial input is vague or category-level

Orchestrator behavior:
  • NO agents invoked
  • NO research fan-out
  • Canvas-only tool access for warmup state and Intake handoff
  • Pure conversation — Opus reasoning only
  • Orchestrator uses Socratic questioning to sharpen the idea
  • Continues until the idea passes the "Research-Ready Test"

Research-Ready Test (ALL must be answerable):
  1. Who specifically has this problem? (not "people" or "users")
  2. What is the pain — in the user's language, not the founder's?
  3. What does the user do today to solve it (the workaround)?
  4. Why is that workaround insufficient?
  5. What would a solution look like in one sentence?

When all 5 are clear → Orchestrator writes the sharpened handoff into canvas and moves to Phase 0 (Intake)
Intake expands that sharpened idea into the full structured brief
    │
    ▼
Phase 0: INTAKE
─────────────────────────────────────────────────────────
Trigger: Warmup has produced a sharp, research-ready idea

Orchestrator behavior:
  • Writes or normalizes the structured `idea` brief in canvas
  • Expands beyond raw idea notes into:
      - summary
      - founder context
      - initial assumptions
      - open questions
      - value proposition
      - possible ICP
      - timestamp / last_updated
  • Produces the research brief the downstream swarm will actually use
```

### Orchestrator Warm-Up Behavior

The warm-up is controlled by the orchestrator prompt, not a separate agent. When the orchestrator detects a vague or category-level idea, it stays in conversation mode and asks the "Five Sharpening Questions" — one at a time, building on each answer.

### The Five Sharpening Questions

These are the orchestrator's internal checklist. It doesn't ask them as a numbered list — it weaves them into natural conversation, adapting based on the founder's answers:

```
1. THE WHO
   "When you say [category], who specifically do you picture using this?
    Give me a single person — their job, their day, their frustration."

   Target: Move from "small businesses" → "solo accountants managing 15–30 clients
   who spend 4 hours/week on manual invoice reconciliation"

2. THE PAIN
   "What's the thing that makes them say 'this sucks' or 'there has to be a
    better way'? Not what you think the pain is — what THEY would say."

   Target: Move from "it's inefficient" → "they're copy-pasting between
   QuickBooks and Excel every Friday afternoon and hating their life"

3. THE WORKAROUND
   "What are they doing about it right now? Even if it's ugly and manual —
    what's the current solution?"

   Target: Move from "nothing" → "they're using a combination of Google Sheets
   and a VA they found on Upwork who does it wrong half the time"

4. THE GAP
   "Why isn't that workaround good enough? What breaks, what's too slow,
    what costs too much?"

   Target: Move from "it's not great" → "the VA costs $800/month, makes errors
   that take 2 hours to fix, and the founder still has to QA everything"

5. THE SENTENCE
   "If you had to describe what you're building in one sentence — not a
    tagline, just what it does — what would you say?"

   Target: Move from "an AI accounting tool" → "automated invoice reconciliation
   for solo accountants that replaces the manual QuickBooks-to-Excel workflow"
```

### Detection Logic: When to Enter Warm-Up

The orchestrator needs to distinguish between "vague idea, needs sharpening" and "clear idea, ready for intake." This is a judgment call, not a classifier — the orchestrator already runs on Opus and is well-equipped for this.

Signals that trigger Warm-Up mode:

```
VAGUE SIGNALS (enter warm-up):
- Idea is described in < 15 words
- No specific user mentioned (just "people", "users", "companies")
- Idea is category-level ("something in fintech", "an AI tool for X")
- Solution described without any mention of a problem
- No mention of any existing workaround or competitor

CLEAR SIGNALS (skip warm-up, go to Phase 0):
- Specific user type named ("freelance designers who...")
- Specific pain described ("they currently spend X hours doing Y")
- Existing workaround mentioned ("they use [tool] but it doesn't...")
- One-sentence product description that includes who + what + why
- User has already done customer interviews or has domain expertise
```

### What the Orchestrator Prompt Gets

Add to the Orchestrator system prompt, before the OPERATING PRINCIPLES:

```
IDEA SHARPENING MODE (Phase -1):
When a founder first describes their idea, assess whether it's research-ready.
An idea is research-ready when you can answer all five:
  1. Who specifically has this problem? (a real person, not "users")
  2. What is the pain in the user's words? (not founder-speak)
  3. What do they do today? (the workaround)
  4. Why is that workaround insufficient? (the gap)
  5. One sentence: what does the product do? (who + what + why)

If the idea is vague — category-level, no specific user, solution without problem —
stay in conversation mode. Ask ONE sharpening question at a time. Build on each
answer. Do NOT invoke any agents or write to the canvas until the idea is sharp.

When the idea passes the test, tell the founder: "That's sharp enough to research.
Let me set up the project." Then move to Phase 0.

Most founders need 2–4 exchanges in warm-up. Some arrive with a clear idea and
skip it entirely. Use your judgment. The goal is to make research productive,
not to gatekeep.
```

### Canvas Schema: Phase Addition

The phase enum in the canvas schema gains a new value:

```typescript
phase:
  | 'warmup'      // â† NEW: Pre-intake idea sharpening
  | 'intake'
  | 'research'
  | 'icp'
  | 'build'
  | 'gtm'
  | 'critic'
  | 'exported';
```

During warm-up, the canvas exists so the session can resume cleanly and the orchestrator can carry forward sharpened context. Warm-up can access canvas in a restricted way, but the structured `idea` section is not finalized until Phase 0 (Intake).

### Why Not a Separate Agent

The warm-up is explicitly NOT a separate agent. Reasons:

1. **Context continuity.** The orchestrator that sharpens the idea should be the same entity that carries the context forward. A handoff would lose nuance.
2. **No agent or research tools needed.** Warm-up is primarily reasoning. Restricting it to canvas-only handoff support prevents premature fan-out while still allowing a clean transition into Intake.
3. **Persona consistency.** The founder's first experience should be with their "cofounder," not with a preprocessing step.
4. **Cost efficiency.** Warm-up is 2–4 orchestrator turns on Opus. Total cost: ~$0.10–0.20. Adding a separate agent would double that for no benefit.

### Updated Phase Flow (Full)

```
Phase -1: WARM-UP (Idea Sharpening)      ← NEW
─────────────────────────────────────────
Orchestrator only. No agents. No research fan-out.
Canvas-only access for session continuity and Intake handoff.
Socratic questioning until idea is research-ready.
Typically 2–4 exchanges. Skipped if idea arrives clear.

Phase 0: INTAKE
─────────────────────────────────────────
Orchestrator expands the sharpened idea into the structured brief.
Canvas `idea` section written with summary, founder context,
initial assumptions, open questions, value proposition,
possible ICP, and last_updated timestamp.

Phase 1: MARKET RESEARCH (Parallel Fan-Out)
Phase 2: ICP DEEP DIVE
Phase 3: DIFFERENTIATION & POSITIONING
Phase 4: BUILD PLANNING
Phase 5: LEGAL LENS VIA THE CRITIC (On Demand)
Phase 6: GTM + FUNDRAISING
Phase 7: THE CRITIC (Post-Milestone Red Team)
Phase 8: ULTRAPLAN
```

### Token Cost of Warm-Up

```
Warm-up: 2–4 orchestrator turns (Opus)
  Input: ~2K tokens per turn (system prompt + conversation)
  Output: ~300–500 tokens per turn (one question + brief context)
  Total: ~10K–20K tokens
  Cost: ~$0.10–0.20

  Compared to a full research phase ($0.30–0.60), this is cheap insurance
  against wasting research tokens on vague briefs.
```

---

## 19. The Deferred knowledge extraction - Cross-Project Knowledge Persistence

> Sprint note: Deferred from active scope. Keep this as a post-MVP idea, not part of the sprint roster or export flow.

### Why This Is the Actual Moat

The canvas persists per-project. After a project completes, its findings die with it. But after 50 startup validations, the swarm will have accumulated a goldmine of reusable intelligence:

- **Pricing patterns.** "B2B SaaS tools for SMB accountants cluster at $29–79/month"
- **Competitive intelligence.** "Notion is mentioned as a pain point in 47% of productivity-space validations"
- **ICP templates.** "Solo founders aged 25–35 with technical backgrounds appear in 60% of dev-tool ICPs"
- **Market size benchmarks.** "The 'AI writing tools' TAM was cited at $4.5B across 3 validations — here are the sources"
- **Failure patterns.** "Ideas in the 'AI meeting summarizer' space scored below 4/10 on differentiation in 4 of 5 validations"
- **Success patterns.** "Products that scored 8+ on the Critic's build confidence all had a named community of 10K+ members in their ICP"

This is the moat. Every competitor starts every validation from zero. Your swarm gets smarter with every project.

### Design: The Deferred knowledge extraction (Agent 10)

| Property | Value |
|---|---|
| **Agent Name** | The Deferred knowledge extraction |
| **Model** | `claude-sonnet-4-6` |
| **Runs When** | Post-MVP only — not part of the sprint export path |
| **Input** | Full canvas of the completed project |
| **Output** | Future reusable patterns, if this post-MVP system is ever built |
| **Storage** | Deferred — no active `knowledge/` runtime directory in the sprint implementation |

The Deferred knowledge extraction is NOT a real-time agent and is NOT part of the sprint runtime. Keep this appendix as a future design note only. In the shipping MVP, `/export` stops after the Export Agent writes the final brief to `/output`.

### What Gets Extracted

```
PATTERN CATEGORIES:

1. PRICING PATTERNS
   - Space/vertical + pricing tiers found + sources
   - "In [space], pricing clusters at $[X]–$[Y]/month"

2. ICP ARCHETYPES
   - Persona templates with anonymized details
   - Community locations that appeared repeatedly
   - Willingness-to-pay ranges by segment

3. COMPETITIVE INTELLIGENCE
   - Competitor names + spaces they appear in + complaint patterns
   - "Notion appeared in 12 projects. Top complaints: [list]"

4. MARKET SIZE BENCHMARKS
   - TAM/SAM/SOM figures + sources + dates
   - Cross-referenced across projects for consistency

5. TECHNOLOGY PATTERNS
   - Stack recommendations by product type
   - Infrastructure costs at scale by category

6. FAILURE/SUCCESS SIGNALS
   - Critic scores correlated with canvas patterns
   - "Projects scoring <4 on build confidence share: [patterns]"
   - "Projects scoring >7 share: [patterns]"

7. GTM PLAYBOOKS
   - Which channels worked for which ICP types
   - Named investor → space mapping
```

### Knowledge Base Structure (Local Files)

```
knowledge/
├── pricing-patterns.jsonl
├── icp-archetypes.jsonl
├── competitor-intel.jsonl
├── market-benchmarks.jsonl
├── tech-patterns.jsonl
├── success-failure-signals.jsonl
└── gtm-playbooks.jsonl
```

Each file is JSONL (one JSON object per line, append-only). Example entry in `pricing-patterns.jsonl`:

```json
{
  "extracted_at": "2026-03-30T16:00:00Z",
  "source_project": "ai-invoice-tool",
  "space": "B2B accounting automation",
  "pattern": "SMB accounting tools price at $29–79/month, enterprise at $200+/month",
  "competitors_referenced": ["QuickBooks", "Xero", "FreshBooks"],
  "sources": ["quickbooks.com/pricing", "xero.com/pricing"],
  "confidence": "High"
}
```

### How the Knowledge Base Would Be Used (Post-MVP Only)

This is intentionally NOT part of the sprint workflow. If built later, a future orchestrator could check a knowledge base for relevant prior patterns and inject them into agent briefs:

```
Research brief enrichment flow:

1. User starts new project → Orchestrator reads idea summary
2. Orchestrator searches knowledge base for matching space/ICP/competitors
3. If matches found → Inject as "PRIOR INTELLIGENCE" section in agent briefs
4. Agents use prior intelligence to: skip redundant searches, validate/contradict
   new findings, and build on existing pricing/ICP data instead of starting from zero

Example injection into Scout brief:
"PRIOR INTELLIGENCE (from 3 previous projects in this space):
 - Top pain signals from prior validations: [list]
 - Communities where this ICP was found before: [list]
 - Competitors already mapped: [list — verify these are still active]
 Use this as a starting point, not as a substitute for fresh research."
```

### Why JSONL and Not a Vector Database

For a future local-first implementation:
- JSONL requires zero infrastructure — no Postgres, no ChromaDB, no embeddings
- Files are human-readable — open them in VS Code and browse patterns
- Git-trackable — the knowledge base can be versioned and shared
- Grep-searchable — `grep "accounting" knowledge/pricing-patterns.jsonl` works immediately
- The knowledge base will be small (hundreds to low thousands of entries) — full-text search is sufficient

If the project scales to thousands of validations, a vector store becomes worthwhile. But for the first 50–200 projects, flat JSONL files are the right tool.

### Privacy Consideration

The Deferred knowledge extraction extracts *patterns*, not project-specific details. It anonymizes:
- Founder names and context → stripped
- Specific project names → replaced with category labels
- Revenue projections → kept as ranges, not exact figures
- User quotes → kept (they're from public sources), but attributed to category not project

---

## 20. Human-in-the-Loop Checkpoints — Iterative Phase Transitions

### The Problem with Linear Phases

The current architecture moves through phases sequentially: Warmup → Intake → Research → ICP → Build → GTM → Critic. The only hard gate is the Critic checkpoint, which forces the user to respond to kill-shots before proceeding.

But phases aren't always clean. Common failure modes:

1. **Research comes back thin.** The Scout finds only 2 Reddit threads. The Sizer can't find TAM data. Moving to ICP without solid research produces garbage personas.
2. **ICP reveals a pivot.** The ICP Whisperer discovers the real customer isn't who the founder thought. The positioning thesis from Phase 3 is now invalid.
3. **Build planning exposes scope creep.** The Engineer flags that the MVP requires 3 hard technical problems. The founder needs to decide: simplify or extend timeline.
4. **GTM reveals distribution blockers.** The GTM Specialist can't find a viable first channel. Maybe the ICP needs revisiting.

Anthropic's own multi-agent research system handles this with iterative loops: the lead agent evaluates intermediate results and decides whether to spawn more subagents or proceed with what it has. The orchestrator should do the same.

### The Solution: Lightweight Checkpoint Gates

Between every phase transition, the orchestrator evaluates the quality of what just came back and presents the founder with a clear choice: proceed, dig deeper, or pivot.

### Checkpoint Types

```
TYPE 1: QUALITY GATE (automatic — orchestrator evaluates)
───────────────────────────────────────────────────────
After research agents return, orchestrator checks:
  - Did all 3 agents succeed? (or did any fail/partial?)
  - Are there enough sourced claims? (check verification audit)
  - Are there data gaps the founder should know about?

If quality is HIGH → Orchestrator proceeds, notes confidence
If quality is MEDIUM → Orchestrator presents findings + asks:
  "Research came back mixed. Competitor data is strong but market
   sizing is thin — I couldn't find credible TAM data. Options:
   [1] I can re-run the Sizer with different search terms
   [2] We proceed with estimated numbers (I'll flag them)
   [3] You have data I don't — tell me what you know"
If quality is LOW → Orchestrator recommends re-run with specifics

TYPE 2: DIRECTION GATE (always shown — founder decides)
───────────────────────────────────────────────────────
At phase transitions that change the project's direction:
  - Phase 1→2: "Research is done. Here's what I found. Does the
    ICP I'm about to investigate match your instinct, or should
    we explore a different customer segment?"
  - Phase 2→3: "Personas built. Before I lock positioning, is
    [Persona 1] really the beachhead, or do you want to test
    [Persona 2] as the primary target?"
  - Phase 4→5: "Build plan ready. Anything here that makes you
    want to reconsider scope before we go legal and GTM?"

TYPE 3: PIVOT GATE (triggered by contradiction detection)
───────────────────────────────────────────────────────
When the orchestrator detects that new findings contradict
earlier canvas state:
  - ICP data contradicts research assumptions
  - GTM findings reveal no viable distribution for current ICP
  - Critic report scores < 3 on build confidence

Orchestrator: "New data contradicts our earlier assumption that
[X]. This changes the picture. Should we: [1] Update the canvas
and continue, [2] Re-run [specific phase] with new framing, or
[3] Pause and discuss?"
```

### Checkpoint Placement Map

```
Phase -1 → Phase 0:  (no gate — warm-up is conversational)

Phase 0 → Phase 1:   DIRECTION GATE
                      "Here's what I understand. Before I launch
                       research, does this capture what you're building?"

Phase 1 → Phase 2:   QUALITY GATE + DIRECTION GATE
                      "Research findings: [summary]. Quality: [assessment].
                       Ready to investigate customers, or need deeper research?"

Phase 2 → Phase 3:   DIRECTION GATE
                      "ICP built. Confirm beachhead customer before positioning."

Phase 3 → Phase 4:   (light gate — orchestrator-led, minimal)
                      "Positioning locked. Moving to build planning."

Phase 4 → Phase 5:   DIRECTION GATE
                      "Build plan ready. Review scope before legal/GTM."

Phase 5 → Phase 6:   (no gate — legal is informational)

Phase 6 → Phase 7:   QUALITY GATE
                      "GTM plan ready. Launching Critic for red-team."

Phase 7 → Phase 8:   HARD GATE (existing — Critic kill-shots)
                      User must respond to each kill-shot assumption.
```

### Orchestrator Prompt Addition

```
CHECKPOINT BEHAVIOR:
After each phase completes, evaluate what came back before proceeding:
1. Check verification audits — are there high-risk flagged claims?
2. Check for data gaps — did any agent return thin results?
3. Check for contradictions — do new findings conflict with canvas state?

If everything looks solid: summarize findings, propose next phase, proceed on user confirmation.
If results are thin or mixed: present a clear choice — dig deeper, proceed with caveats, or pivot.
If contradictions detected: flag them explicitly and ask the founder to resolve before continuing.

Never silently move from one phase to the next. The founder should always know:
- What you just learned
- How confident you are in it
- What the proposed next step is
- What the alternatives are

This is what a real cofounder does: they don't just execute a plan, they check in after
every milestone and adjust based on what they learned.
```

### Iterative Re-Run Capability

When the orchestrator recommends re-running an agent, it generates a **narrower, more specific brief** based on what was missing:

```
FIRST RUN brief: "Research the project management SaaS market. Find competitors,
  market size, and user pain signals."

RE-RUN brief (after thin results): "The first research pass found strong competitor
  data but thin market sizing. Specifically search for:
  1. '[project management] market size 2026' from Gartner, Statista, or IDC
  2. '[project management SaaS] CAGR' for growth rate data
  3. 'enterprise project management funding 2025 2026' for recent VC activity
  Focus on these three gaps only. Do not re-research competitors."
```

This prevents re-runs from being redundant. The orchestrator remembers what worked and only asks for what's missing.

---

## 21. Export Quality — The Export Agent Final Pass

### The Problem: Canvas ≠ Research Template

The current export (`src/lib/export.ts`) dumps canvas sections into markdown with minimal structure. But the `/startup-research` skill's template has a precise 6-section structure with specific tables, a 12-dimension scorecard, and field-level requirements that the canvas schema doesn't map to 1:1.

Key misalignments:

| Template Requirement | Canvas Has | Gap |
|---|---|---|
| 1.3 History of Attempts | No dedicated field | Research agents may cover this, but it's not structured |
| 2.3 Voice of Customer (real quotes) | `user_quotes` array | Not guaranteed to be populated with attributed quotes |
| 3.3 Feature Strategy Table (BEAT/JOIN/SKIP) | `feature_strategy` (generic) | Not structured as BEAT/JOIN/SKIP |
| 3.4 Blue Ocean Strategy Canvas | `blue_ocean` (generic) | Not structured as comparison table |
| 5.1 Three Lenses Test (scored) | Not in canvas | Entirely missing |
| 5.2 Unit Economics (CAC/LTV/ratio/payback) | `unit_economics` (generic) | May not have all 4 metrics |
| 6.1 MVP Scope Table | `mvp_scope` (array) | Not formatted as Feature/MVP?/V2?/Notes table |
| 6.2 Validation Roadmap | Not in canvas | Partially in `risks` but not structured as tests |
| Final Scorecard (12 dimensions, 1–10) | Not in canvas | Entirely missing |

### The Solution: The Export Agent Final Pass

Rather than restructuring the entire canvas schema to match the template (which would create tight coupling), the sprint implementation uses the **Export Agent** — a Sonnet agent that runs as the final step of `/export`. It reads the full canvas (raw reports + summaries + decisions) and produces a complete research brief formatted exactly to the template spec.

### Why an Export Agent, Not a Code Formatter

The current `assembleBrief()` function in `export.ts` is a string concatenator. It can't:
- Fill in sections that agents didn't explicitly populate (e.g., History of Attempts)
- Score 12 dimensions and write rationale for each
- Generate the Three Lenses Test from scattered canvas data
- Format a BEAT/JOIN/SKIP table from freeform feature strategy notes
- Write a one-paragraph founder verdict that synthesizes everything

These require reasoning, not string manipulation. The Export Agent, with the full canvas context and the exact template structure, can do this in one pass.

### Export Agent Design

> Sprint note: The active sprint export path uses the Export Agent. Keep the synthesis material below as prompt guidance, not as a separate active roster slot.

| Property | Value |
|---|---|
| **Agent Name** | The Export Agent |
| **Model** | `claude-sonnet-4-6` |
| **Runs When** | On `/export` command, after canvas is current |
| **Input** | Full canvas (raw reports + summaries + decisions + critic reports) |
| **Output** | Complete markdown brief matching research-template.md exactly |
| **Web Search** | OFF — synthesis only, no new research |
| **Max Tokens** | 12000 (the full brief is long) |

### Export Agent System Prompt

```
You are an expert research synthesizer. Your job is to take a complete project
canvas — containing raw agent reports, summaries, decisions, and critic findings —
and produce a polished, structured founder-facing research brief that follows an exact template.

You are NOT conducting new research. You are organizing, formatting, and synthesizing
existing findings into a structured deliverable. Every claim in your output must come
from the canvas data — do not add new information.

YOUR INPUT:
<canvas>
{{FULL_CANVAS_WITH_RAW_REPORTS}}
</canvas>

YOUR OUTPUT FORMAT:
Follow the template structure EXACTLY. Every section must be present and populated.
The sections are:

SECTION 1: THE PROBLEM & THE MARKET
  1.1 — The Core Gap
  1.2 — Market Definition & Size (TAM/SAM/SOM with bottom-up SOM math)
  1.3 — History of Attempts (extract from research if available; note gaps)
  1.4 — Market Map & Competitor Matrix (MUST be a populated table)

SECTION 2: TARGET MARKET & ICP
  2.1 — Audience Overview (demographics, psychographics, behavioral signals)
  2.2 — ICP Personas (fully fleshed out, all sub-fields populated)
  2.3 — Voice of Customer (real pulled quotes with sources)

SECTION 3: DIFFERENTIATION & POSITIONING
  3.1 — Core Pain Points (ranked by frequency and intensity)
  3.2 — Differentiated Approach (per pain point)
  3.3 — Feature Strategy Table (BEAT / JOIN / SKIP — MUST be a table)
  3.4 — Blue Ocean Analysis (with strategy canvas comparison table)
  3.5 — The "Why Now" Case

SECTION 4: TECH & PRODUCT STACK
  4.1 — Incumbent Tech Stacks
  4.2 — App Store / Review Deep Dive
  4.3 — Recommended MVP Stack (all sub-items including infra costs at scale)
  4.4 — Table Stakes Features
  4.5 — Winning Features / Differentiators

SECTION 5: MONETIZATION & PATH TO ADOPTION
  5.1 — Three Lenses Test (ALL THREE scored and justified:
        Ego/Relevance, Stakes/Immediacy, Distribution/Retention)
  5.2 — Monetization Model (tiers + conversion + revenue milestones +
        unit economics: CAC, LTV, LTV:CAC, payback period)
  5.3 — Bootstrappable? (budget ranges + 5–10 NAMED investors with thesis)

SECTION 6: MVP & SHIP STRATEGY
  6.1 — MVP Scope (MUST be a Feature/MVP?/V2?/Notes table)
  6.2 — Validation Roadmap (kill-shot assumptions + cheap tests)
  6.3 — Go-To-Market: First 90 Days (WEEK-BY-WEEK: 1–2, 3–6, 7–12)
  6.4 — Key Risks & Open Questions (from critic reports)

FINAL SCORECARD:
Score all 12 dimensions 1–10 with one-sentence rationale:
  Problem Severity, Market Size, Timing, Differentiation, ICP Clarity,
  Ego/Relevance, Stakes/Immediacy, Distribution Advantage,
  Retention/Churn Resistance, Monetization Clarity, Bootstrappability,
  Overall Conviction

One-paragraph founder verdict.

RULES:
- Every table mentioned above MUST be a populated markdown table, not prose
- If the canvas lacks data for a section, write "[Data gap — not covered in research]"
  Do NOT invent data to fill gaps
- Attribute all claims to their source agent (Scout, Analyst, Sizer, etc.)
- The scorecard must reflect the actual strength of findings, not optimism
- This brief should read like a rigorous startup research memo, not a certainty claim
```

### Export Flow (Updated)

```
User types /export
    │
    ▼
1. Check canvas completeness
   - Which sections have data? Which are empty?
   - Log completion percentage
    │
    ▼
2. Run Export Agent (Sonnet)
   - Input: full canvas (raw reports + summaries + all sections)
   - Output: complete formatted brief matching template
   - Cost: ~$0.05–0.10 (one Sonnet call, ~4K input, ~8K output)
    │
    ▼
3. Write brief to /output/[slug]-brief-[date].md
    │
    ▼
4. Print completion summary:
   "✓ Brief exported → output/ai-invoice-tool-brief-2026-03-30.md
    Sections complete: 6/6
    Data gaps flagged: 2 (History of Attempts, App Store Deep Dive)
    Scorecard: 7.2/10 overall conviction
    Open in VS Code: code output/ai-invoice-tool-brief-2026-03-30.md"
```

### Canvas Schema Addition: Scorecard

The scorecard should be written back to the canvas after synthesis for persistence:

```json
"scorecard": {
  "problem_severity": { "score": 8, "rationale": "..." },
  "market_size": { "score": 6, "rationale": "..." },
  "timing": { "score": 9, "rationale": "..." },
  "differentiation": { "score": 7, "rationale": "..." },
  "icp_clarity": { "score": 8, "rationale": "..." },
  "ego_relevance": { "score": 5, "rationale": "..." },
  "stakes_immediacy": { "score": 7, "rationale": "..." },
  "distribution_advantage": { "score": 6, "rationale": "..." },
  "retention_churn": { "score": 7, "rationale": "..." },
  "monetization_clarity": { "score": 8, "rationale": "..." },
  "bootstrappability": { "score": 7, "rationale": "..." },
  "overall_conviction": { "score": 7, "rationale": "..." },
  "founder_verdict": "string",
  "generated_at": "timestamp"
}
```

This scorecard remains on the canvas for later analysis; no Deferred knowledge extraction runs in sprint scope.

### Updated Agent Roster (Final)

| # | Agent Name | Role | Model | Runs When |
|---|---|---|---|---|
| 0 | **The Orchestrator** | Visionary Cofounder | `claude-opus-4-6` | Always active |
| 1 | **The Market Scout** | Reddit/social pain mining, VOC | `claude-sonnet-4-6` | Research phase |
| 2 | **The Competitor Analyst** | Competitor mapping, pricing | `claude-sonnet-4-6` | Research phase |
| 3 | **The Market Sizer** | TAM/SAM/SOM, timing | `claude-sonnet-4-6` | Research phase |
| 4 | **The ICP Whisperer** | Persona building, WTP | `claude-sonnet-4-6` | ICP phase |
| 5 | **The Architect** | Stack research, costs, build sequence | `claude-sonnet-4-6` | Build phase |
| 6 | **The Technical Cofounder** | Architecture, scope, risk, judgment | `claude-opus-4-6` | Build phase |
| 7 | **The GTM Specialist** | Distribution, monetization, first 90 days | `claude-sonnet-4-6` | GTM phase |
| 8 | **The Critic** | Red-team, kill-shots, optional legal lens | `claude-opus-4-6` | Post-milestone |
| 9 | **The Verifier** | Structural audit, source checking, hallucination markers | `claude-haiku-4-5-20251001` | After every agent |
| 10 | **The Export Agent** | Canvas -> final markdown brief | `claude-sonnet-4-6` | On /export |

---

## 22. Agent Roster Optimization & Cost Architecture

### The Cost Problem

The original architecture estimated $2–5 per full validation run. That's unsustainable for a tool founders use repeatedly — testing 5 ideas at $5 each is $25 before any coding starts. The target should be **under $1 per full validation** for a standard run, with heavy sessions capping at $1.50–2.00.

The three biggest cost drivers in order:
1. **The Orchestrator on Opus (~60% of total cost).** It runs every turn with full canvas context. 15 turns × Opus pricing = ~$1.10 before any agents fire.
2. **Output tokens across all agents.** Output costs 5× input across all models. Verbose agent reports compound this.
3. **Redundant agent calls.** Some agents overlap in scope; others run when they don't need to.

### Three Cost Levers (Stacking)

#### Lever 1: Prompt Caching (Biggest Single Savings)

Anthropic's prompt caching stores frequently-sent content server-side. Cache reads cost 0.1× base input — a 90% discount. Cache writes cost 1.25× base input (5-minute TTL) but pay for themselves after one cache hit.

What we cache:
- **Orchestrator system prompt** (~2K tokens): identical every turn → cache write on turn 1, cache hits on turns 2–15
- **Agent system prompts** (~1.5K each): identical across calls → cache write on first agent, hits on parallel agents in same window
- **Canvas state prefix**: the idea summary, project metadata, and completed sections don't change between consecutive turns → partial cache hits

Estimated savings: **60–70% reduction on input token costs**

Implementation: add `cache_control` breakpoints to system prompts and the static prefix of canvas injections. The Anthropic SDK supports this natively:

```typescript
system: [
  {
    type: 'text',
    text: ORCHESTRATOR_SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' }  // 5-min cache
  }
]
```

#### Lever 2: Orchestrator Model Routing (Second Biggest Savings)

Not every orchestrator turn needs Opus. The orchestrator's job varies by turn:

```
OPUS TURNS (complex reasoning required):
  - Warm-up: Socratic questioning, idea sharpening
  - Post-research synthesis: reading 3 agent reports, forming a POV
  - Post-ICP challenge: "Is this the right customer?"
  - Positioning work: Phase 3, Peter Thiel / Steve Jobs tests
  - Post-critic response: weighing kill-shots, deciding what's valid
  - Contradiction resolution: new data vs. old canvas state

SONNET TURNS (routine — execution, not judgment):
  - Presenting agent results with minimal interpretation
  - Phase transition confirmations ("Ready to move to build?")
  - Simple follow-up questions
  - Canvas updates after user provides information
  - REPL commands (/cost, /canvas, /export)
  - Re-invoking an agent with a narrower brief
```

Estimated split: **~30% Opus, ~70% Sonnet**

Implementation: the orchestrator's model is selected per-turn based on the current phase and what just happened:

```typescript
function selectOrchestratorModel(
  canvas: Canvas,
  lastAction: 'agent_returned' | 'user_input' | 'phase_transition' | 'synthesis_needed'
): string {
  // Opus for complex reasoning
  if (canvas.project.phase === 'warmup') return 'claude-opus-4-6';
  if (lastAction === 'synthesis_needed') return 'claude-opus-4-6';
  if (lastAction === 'agent_returned' && ['research', 'icp', 'positioning'].includes(canvas.project.phase)) {
    return 'claude-opus-4-6'; // Post-research synthesis needs Opus
  }
  // Sonnet for everything else
  return 'claude-sonnet-4-6';
}
```

#### Lever 3: Agent Consolidation (Removes Redundant Calls)

Four consolidation moves:

**1. Keep the Export Agent as the only active export path; defer the Deferred knowledge extraction**

In the sprint implementation, `/export` runs one Sonnet call that produces the formatted brief only. Pattern extraction is explicitly out of scope and should not be coupled into the shipping export path.

**2. Fold Legal into the Critic as an optional lens**

The Critic legal-risk lens runs "on demand" and in most validations isn't triggered at all (non-regulated products). Rather than maintaining a separate agent, the Critic's prompt gains a `LEGAL LENS` section that's activated when the orchestrator flags regulatory/IP risk:

```
LEGAL LENS (activate when the orchestrator flags regulatory or IP risk):
If the product touches health data, financial data, children's data, or
novel IP: scan for regulatory exposure, entity structure recommendations,
and compliance requirements. Include in your report under a separate
LEGAL RISK section.

If no legal flags: skip this lens entirely.
```

This means the Critic (already running on Opus, already reading the full canvas) handles legal scanning through an optional lens instead of spawning a dedicated legal agent or phase.

**3. Split Architect + Technical Cofounder → Technical Cofounder (Opus) + The Architect (Sonnet)**

The Architect + Technical Cofounder currently handles everything from architecture decisions to tech stack research. These require very different reasoning depths:

| Task | Reasoning Depth | Model |
|---|---|---|
| System architecture decisions | Deep — tradeoff analysis, build vs. buy | Opus |
| "What to cut from MVP" | Deep — product judgment, scope discipline | Opus |
| Technical risk assessment | Deep — identifying non-obvious failure modes | Opus |
| User flow mapping | Deep — UX intuition, product sense | Opus |
| Competitor tech stack research | Moderate — BuiltWith/job posting analysis | Sonnet |
| Infrastructure cost estimation | Moderate — known pricing lookup | Sonnet |
| Build sequence / timeline | Moderate — project management | Sonnet |
| Integration research | Moderate — API docs, compatibility | Sonnet |

The split:

**The Technical Cofounder (Agent 5a) — Opus**
- Architecture decisions: monolith vs. microservices, serverless vs. containers
- MVP scope ruthlessness: what to cut, what's table stakes, what's the wedge feature
- Technical risk identification: "this requires solving X hard problem"
- Build vs. buy analysis: "use Stripe, don't build payments"
- User flow design: critical path from signup to value moment
- System design for scale: what breaks at 10K, 100K, 1M users

**The Architect (Agent 5b) — Sonnet**
- Competitor tech stack research (BuiltWith, Stackshare, job postings, engineering blogs)
- Infrastructure cost modeling at 0 / 1K / 10K / 100K users
- Build sequence: week-by-week timeline for first 6 weeks
- Integration research: which APIs, SDKs, third-party services needed
- Stack recommendation: framework + database + hosting + auth specifics

Flow: The Architect runs first (research), then the Technical Cofounder reads the Architect's report and makes the judgment calls. This is the same orchestrator → subagent → synthesis pattern used in research, but applied to build planning.

**4. ICP Whisperer receives Scout's raw report**

The Scout and ICP Whisperer overlap on community research. Instead of having the ICP Whisperer re-search communities the Scout already found, pass the Scout's raw report into the ICP Whisperer's context. This isn't a merge — they run at different phases — but it eliminates redundant searches and saves ~2–3 tool calls worth of tokens.

### Revised Agent Roster (Final — 11 Agents)

| # | Agent Name | Role | Model | Runs When | Cost/Call |
|---|---|---|---|---|---|
| 0 | **The Orchestrator** | Visionary Cofounder | Opus/Sonnet (routed) | Always | ~$0.02–0.08/turn |
| 1 | **The Market Scout** | Pain mining, VOC, demand signals | Sonnet 4.6 | Research | ~$0.04 |
| 2 | **The Competitor Analyst** | Competitor map, pricing, complaints | Sonnet 4.6 | Research | ~$0.04 |
| 3 | **The Market Sizer** | TAM/SAM/SOM, timing, funding | Sonnet 4.6 | Research | ~$0.04 |
| 4 | **The ICP Whisperer** | Personas, WTP, communities | Sonnet 4.6 | ICP phase | ~$0.04 |
| 5a | **The Technical Cofounder** | Architecture, scope, risk, judgment | Opus 4.6 | Build phase | ~$0.08 |
| 5b | **The Architect** | Stack research, costs, timeline | Sonnet 4.6 | Build phase | ~$0.04 |
| 6 | **The GTM Specialist** | Distribution, investors, 90-day plan | Sonnet 4.6 | GTM phase | ~$0.04 |
| 7 | **The Critic** | Red-team + legal lens (when flagged) | Opus 4.6 | Post-milestone | ~$0.08 |
| 8 | **The Verifier** | Factual audit, source checking | Haiku 4.5 | After each agent | ~$0.003 |
| 9 | **The Export Agent** | Final brief export | Sonnet 4.6 | On /export | ~$0.06 |

**Changes from previous roster:**
- Removed: dedicated Critic legal-risk lens (folded into Critic)
- Kept: Export Agent as the only active export path
- Added: The Technical Cofounder (Opus) - for deep technical judgment
- Deferred: Deferred knowledge extraction / knowledge extraction from sprint scope
- Added: The Architect (Sonnet) — for technical research and estimation
- Modified: Orchestrator now routes between Opus and Sonnet per-turn

### Revised Cost Estimate (Full Validation Run)

```
STANDARD RUN (no re-runs, no extended back-and-forth):
───────────────────────────────────────────────────────
                                    Without      With
                                    Caching      Caching
Orchestrator (15 turns, 70/30 S/O)  $0.55        $0.25
Research (3 Sonnet parallel)        $0.17        $0.10
Verifiers (3 Haiku)                 $0.009       $0.009
Summarizers (3 Haiku)               $0.009       $0.009
ICP Whisperer (Sonnet)              $0.05        $0.03
Technical Cofounder (Opus)          $0.08        $0.05
Architect (Sonnet)                  $0.04        $0.03
GTM Specialist (Sonnet)             $0.05        $0.03
Critic + Legal lens (Opus)          $0.08        $0.05
Verifiers for non-research (Haiku)  $0.012       $0.012
Summarizers for non-research (Haiku)$0.012       $0.012
Export Agent (Sonnet)               $0.06        $0.04
───────────────────────────────────────────────────────
TOTAL                               ~$1.12       ~$0.62

EXTENDED RUN (re-runs, multiple critic passes, long session):
Without caching: ~$1.80–2.20
With caching:    ~$0.90–1.30

MAX_SESSION_COST default: $2.00
```

**From $5 to $0.62.** That's an 88% cost reduction through prompt caching + model routing + agent consolidation.

### Prompt Caching Implementation Notes

```typescript
// In run-agent.ts, add cache_control to system prompts:

const response = await client.messages.create({
  model,
  max_tokens: maxTokens,
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }  // 5-min cache
    }
  ],
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: canvasPrefix,  // static portion of canvas
          cache_control: { type: 'ephemeral' }
        },
        {
          type: 'text',
          text: dynamicContent  // brief + recent changes
        }
      ]
    }
  ],
  ...(webSearch && { tools: [WEB_SEARCH_TOOL] }),
});
```

The key insight: **split the user message into static prefix (cacheable) and dynamic suffix (changes per turn)**. The canvas state's first ~60% (idea, research summaries, early decisions) doesn't change between turns — cache it. Only the latest phase data and conversation is dynamic.

### Updated .env.example

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
MAX_SESSION_COST=2.00
COST_WARNING_THRESHOLD=0.80
```
