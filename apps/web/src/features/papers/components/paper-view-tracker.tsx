'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

export function PaperViewTracker({ paperId }: { paperId: string }) {
  useEffect(() => {
    posthog.capture('paper_viewed', { paper_id: paperId });
  }, [paperId]);

  return null;
}
