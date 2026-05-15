/**
 * Automation level constants and display metadata.
 */
export const AUTOMATION_LEVELS = ['full_autonomous', 'collaborative', 'full_manual'] as const
export type AutomationLevelConst = typeof AUTOMATION_LEVELS[number]

export const AUTOMATION_LEVEL_LABELS: Record<AutomationLevelConst, string> = {
  full_autonomous: 'Full Autonomous',
  collaborative:   'Collaborative',
  full_manual:     'Full Manual',
}

export const AUTOMATION_LEVEL_DESCRIPTIONS: Record<AutomationLevelConst, string> = {
  full_autonomous: 'Agent handles all steps autonomously. Human reviews outcomes only.',
  collaborative:   'Agent prepares each step. Human approves before execution.',
  full_manual:     'Human performs all steps. Agent provides assistance and suggestions only.',
}

export const AUTOMATION_LEVEL_BADGE_VARIANTS: Record<AutomationLevelConst, 'default' | 'secondary' | 'outline'> = {
  full_autonomous: 'default',
  collaborative:   'secondary',
  full_manual:     'outline',
}
