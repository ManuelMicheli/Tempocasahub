'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { StickyNote, Check, Loader2 } from 'lucide-react';
import { saveQuickNotes } from '@/lib/actions/agent';

interface QuickNotesProps {
  initialNotes: string;
}

export function QuickNotes({ initialNotes }: QuickNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (value: string) => {
    setSaving(true);
    setSaved(false);
    await saveQuickNotes(value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  function handleChange(value: string) {
    setNotes(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), 800);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <StickyNote className="h-4 w-4" />
          <span>Appunti rapidi</span>
        </div>
        <div className="h-5">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {saved && <Check className="h-4 w-4 text-primary" />}
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Scrivi qui le tue annotazioni..."
        rows={4}
        className="w-full resize-none rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring/40 transition-all duration-200"
      />
    </div>
  );
}
