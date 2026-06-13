import { useEffect, useState, type ComponentType } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  storageKey: string;
  autoOpen?: boolean;
}

export function OnboardingTour({ steps, storageKey, autoOpen = true }: OnboardingTourProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!autoOpen) return;
    if (typeof window === 'undefined') return;
    try {
      const seen = window.localStorage.getItem(storageKey);
      if (!seen) setOpen(true);
    } catch {
      // ignore localStorage errors (private mode, etc.)
    }
  }, [autoOpen, storageKey]);

  const finish = () => {
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      // ignore
    }
    setOpen(false);
    setCurrentStep(0);
  };

  if (!steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : finish())}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl"
        hideClose
      >
        <button
          type="button"
          onClick={finish}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Pular tour"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="p-8"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">{step.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-1.5 pb-4">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted',
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 p-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>

          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>

          {isLast ? (
            <Button type="button" size="sm" onClick={finish}>
              Concluir
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
            >
              Próximo
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
