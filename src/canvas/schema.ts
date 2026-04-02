export interface ConversationTurn {
  role: "user" | "assistant";
  message: string;
  at: string;
}

export interface ResearchNote {
  agent: string;
  summary: string;
  bullets: string[];
  updatedAt: string;
}

export interface ProjectCanvas {
  projectSlug: string;
  idea: string;
  updatedAt: string;
  conversation: ConversationTurn[];
  research: {
    scout: ResearchNote;
    analyst: ResearchNote;
    sizer: ResearchNote;
  };
  icp: ResearchNote;
  architecture: ResearchNote;
  buildPlan: ResearchNote;
  gtm: ResearchNote;
  critique: ResearchNote;
}

function emptyNote(agent: string): ResearchNote {
  return {
    agent,
    summary: "Not run yet.",
    bullets: [],
    updatedAt: new Date().toISOString()
  };
}

export function createEmptyCanvas(projectSlug: string): ProjectCanvas {
  return {
    projectSlug,
    idea: "",
    updatedAt: new Date().toISOString(),
    conversation: [],
    research: {
      scout: emptyNote("Market Scout"),
      analyst: emptyNote("Competitor Analyst"),
      sizer: emptyNote("Market Sizer")
    },
    icp: emptyNote("ICP Whisperer"),
    architecture: emptyNote("Architect"),
    buildPlan: emptyNote("Technical Cofounder"),
    gtm: emptyNote("GTM Specialist"),
    critique: emptyNote("Critic")
  };
}
