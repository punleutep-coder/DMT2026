
import type { Document } from './types';

export const isDocumentExceedingPeriod = (doc: Document, value: number, unit: 'days' | 'hours' | 'minutes') => {
    let thresholdInMs = 0;
    switch (unit) {
        case 'minutes': thresholdInMs = value * 60 * 1000; break;
        case 'hours': thresholdInMs = value * 60 * 60 * 1000; break;
        case 'days': thresholdInMs = value * 24 * 60 * 60 * 1000; break;
        default: return false;
    }
  
    const now = new Date().getTime();
    if (!doc.status.startsWith('Completed') && doc.status !== 'Combined' && doc.status !== 'Split' && !doc.isDelayed) {
        const lastHistoryEntry = doc.history[doc.history.length - 1];
        if (lastHistoryEntry && lastHistoryEntry.end === null) {
            const startTime = new Date(lastHistoryEntry.start).getTime();
            const duration = now - startTime;
            return duration > thresholdInMs;
        }
    }
    return false;
  }
