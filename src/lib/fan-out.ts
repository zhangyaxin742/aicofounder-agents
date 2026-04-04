import chalk from 'chalk';
import { runAgent } from './run-agent.js';
import { SCOUT_SYSTEM_PROMPT, ANALYST_SYSTEM_PROMPT, SIZER_SYSTEM_PROMPT } from '../prompts/agents.js';
import type { Canvas } from '../canvas/schema.js';
import { runVerifier } from '../agents/verifier.js';
import { summarizeReport } from './summarize.js';

export async function runResearchPhase(brief: string, canvas: Canvas): Promise<Canvas> {
  console.log(chalk.yellow('\n  Launching Scout, Analyst, and Sizer in parallel...\n'));

  const settled = await Promise.allSettled([
    runAgent({
      agent: 'scout',
      systemPrompt: SCOUT_SYSTEM_PROMPT,
      brief,
      canvas,
    }),
    runAgent({
      agent: 'analyst',
      systemPrompt: ANALYST_SYSTEM_PROMPT,
      brief,
      canvas,
    }),
    runAgent({
      agent: 'sizer',
      systemPrompt: SIZER_SYSTEM_PROMPT,
      brief,
      canvas,
    }),
  ]);

  const reportNames: Array<'scout' | 'analyst' | 'sizer'> = ['scout', 'analyst', 'sizer'];
  canvas.research.reports ??= {};
  canvas.research.failures ??= [];

  for (const [index, result] of settled.entries()) {
    const reportName = reportNames[index];

    if (result.status === 'rejected') {
      console.error(chalk.red(`  ✗ ${reportName} failed: ${String(result.reason)}`));
      canvas.research.failures.push({
        phase: 'research',
        reason: String(result.reason),
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const verification = await runVerifier({
      sourceAgent: reportName,
      markdown: result.value.markdown,
      structured: result.value.structured,
      canvas,
    });

    const summary = await summarizeReport({
      agent: reportName,
      structured: result.value.structured,
      verification,
    });

    canvas.research.reports[reportName] = {
      raw_markdown: result.value.markdown,
      structured: result.value.structured,
      verification,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  const failCount = settled.filter((result) => result.status === 'rejected').length;
  if (failCount === 3) {
    throw new Error('All three research agents failed. Check API key and network, then retry.');
  }
  if (failCount > 0) {
    console.log(chalk.yellow(`\n  ⚠ Research phase complete with ${failCount} agent failure(s).\n`));
  } else {
    console.log(chalk.green('\n  ✓ Research phase complete\n'));
  }

  canvas.research.last_updated = new Date().toISOString();
  return canvas;
}