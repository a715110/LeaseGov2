/**
 * The three automation levels available per contract.
 */
export type AutomationLevelValue = 'full_autonomous' | 'collaborative' | 'full_manual'

export const AUTOMATION_LEVEL_LABELS: Record<AutomationLevelValue, string> = {
  full_autonomous: 'Full Autonomous',
  collaborative:   'Collaborative',
  full_manual:     'Full Manual',
}

export const AUTOMATION_LEVEL_DESCRIPTIONS: Record<AutomationLevelValue, string> = {
  full_autonomous: 'Agent handles all steps autonomously. Human reviews outcomes.',
  collaborative:   'Agent prepares each step. Human approves before execution.',
  full_manual:     'Human performs all steps. Agent provides assistance and suggestions only.',
}
