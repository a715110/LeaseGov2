/**
 * AutomationPolicyBadge — AG.6
 * Small pill badge shown in ContractRecordHeader and workflow screens.
 * Three variants × three sizes. Clickable for lease_admin (level switcher popover).
 * TODO: Backend integration required — PUT /automation/policy (for override)
 */

import { useState } from 'react';
import { Bot, Users, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type AutomationLevel = 'full_autonomous' | 'collaborative' | 'full_manual';

interface Props {
  level: AutomationLevel;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onLevelChange?: (level: AutomationLevel) => void;
}

const CONFIG: Record<AutomationLevel, {
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  style: React.CSSProperties;
}> = {
  full_autonomous: {
    label: 'Full Autonomous',
    shortLabel: 'Auto',
    description: 'Agent runs end-to-end. Human receives checkpoints at defined gates.',
    icon: Bot,
    style: { background: 'var(--color-lg-accent-subtle)', color: 'var(--color-lg-accent)', borderColor: 'var(--color-lg-accent)' },
  },
  collaborative: {
    label: 'Collaborative',
    shortLabel: 'Collab',
    description: 'Agent prepares recommendations. Human makes final decisions.',
    icon: Users,
    style: { background: 'rgba(59,130,246,0.1)', color: '#3B82F6', borderColor: '#3B82F6' },
  },
  full_manual: {
    label: 'Full Manual',
    shortLabel: 'Manual',
    description: 'No agent involvement. All steps completed manually.',
    icon: User,
    style: { background: 'var(--color-lg-surface)', color: 'var(--color-muted-foreground)', borderColor: 'var(--color-lg-border)' },
  },
};

const SIZE_CLASSES = {
  sm: { pill: 'px-1.5 py-0.5 text-[10px] gap-1', icon: 'w-2.5 h-2.5' },
  md: { pill: 'px-2 py-1 text-[11px] gap-1.5', icon: 'w-3 h-3' },
  lg: { pill: 'px-3 py-1.5 text-[12px] gap-2', icon: 'w-3.5 h-3.5' },
};

const LEVELS: AutomationLevel[] = ['full_autonomous', 'collaborative', 'full_manual'];

export function AutomationPolicyBadge({ level, size = 'sm', clickable = false, onLevelChange }: Props) {
  const [open, setOpen] = useState(false);
  const cfg = CONFIG[level];
  const sz = SIZE_CLASSES[size];
  const Icon = cfg.icon;

  const badge = (
    <span className={`inline-flex items-center rounded-full border font-semibold ${sz.pill}`} style={cfg.style}>
      <Icon className={sz.icon} />
      {cfg.shortLabel}
    </span>
  );

  const wrapped = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px] text-[11px]">
          <p className="font-semibold mb-0.5">{cfg.label}</p>
          <p>{cfg.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (!clickable) return wrapped;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="cursor-pointer">{wrapped}</button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1 mb-1">Override for this record</p>
        {LEVELS.map(l => {
          const c = CONFIG[l];
          const LIcon = c.icon;
          return (
            <button key={l}
              className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/20 transition-colors text-left"
              onClick={() => { onLevelChange?.(l); setOpen(false); }}>
              <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold gap-1" style={c.style}>
                <LIcon className="w-2.5 h-2.5" />{c.shortLabel}
              </span>
              <span className="text-[12px] text-foreground">{c.label}</span>
              {l === level && <span className="ml-auto text-[10px]" style={{ color: 'var(--color-lg-success)' }}>✓</span>}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
