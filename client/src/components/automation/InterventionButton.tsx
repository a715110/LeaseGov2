/**
 * InterventionButton — AG.5 (AG.9 in prompt numbering)
 * Renders only when automation_level = full_autonomous.
 * "Pause Agent" → confirmation dialog → paused_by_human
 * "Resume Agent" when already paused.
 * TODO: Backend integration required — POST /agents/tasks/{id}/intervene
 */

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  status: 'queued' | 'running' | 'awaiting_checkpoint' | 'completed' | 'failed' | 'paused_by_human';
  onIntervene?: () => void;
  onResume?: () => void;
  size?: 'sm' | 'md';
}

export function InterventionButton({ status, onIntervene, onResume, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false);

  if (status === 'completed' || status === 'failed') return null;

  const isPaused = status === 'paused_by_human';
  const h = size === 'sm' ? 'h-7' : 'h-9';
  const txt = size === 'sm' ? 'text-[11px]' : 'text-[12px]';

  if (isPaused) {
    return (
      <Button size="sm" className={`${h} ${txt} gap-1.5`}
        style={{ background: 'var(--color-lg-success)', color: 'white' }}
        onClick={onResume}>
        <Play className="w-3 h-3" /> Resume Agent
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" className={`${h} ${txt} gap-1.5`}
        style={{ borderColor: 'var(--color-lg-error)', color: 'var(--color-lg-error)' }}
        onClick={() => setOpen(true)}>
        <Pause className="w-3 h-3" /> Pause Agent
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Take Manual Control?</DialogTitle>
            <DialogDescription>
              The agent will stop at its current step. You can resume later from the same point.
              All completed steps and decisions will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border px-4 py-3 text-[12px] bg-muted/10">
            <p className="font-semibold text-foreground mb-1">Current agent step</p>
            <p className="text-muted-foreground">Agent will pause after completing any in-progress atomic operation.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-9 text-[12px]" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="h-9 text-[12px] gap-1.5"
              style={{ background: 'var(--color-lg-error)', color: 'white' }}
              onClick={() => { onIntervene?.(); setOpen(false); }}>
              <Pause className="w-3.5 h-3.5" /> Pause Agent and Take Control
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
