
import type { Document } from './types';

export const isDocumentExceedingPeriod = (doc: Document, value: number, unit: 'days' | 'hours' | 'minutes') => {
    // Only check documents that are currently in progress
    if (doc.status.startsWith('Completed') || doc.status === 'Combined' || doc.status === 'Split' || doc.isDelayed || doc.releaseDateReached) {
        return false;
    }

    let thresholdInMs = 0;
    switch (unit) {
        case 'minutes': thresholdInMs = value * 60 * 1000; break;
        case 'hours': thresholdInMs = value * 60 * 60 * 1000; break;
        case 'days': thresholdInMs = value * 24 * 60 * 60 * 1000; break;
        default: return false;
    }
  
    const now = new Date().getTime();
    
    const lastHistoryEntry = doc.history[doc.history.length - 1];
    
    // Check if the last history entry corresponds to the current status and is not finished
    if (lastHistoryEntry && lastHistoryEntry.department === doc.status && lastHistoryEntry.end === null) {
        const startTime = new Date(lastHistoryEntry.start).getTime();
        const duration = now - startTime;
        return duration > thresholdInMs;
    }
    
    return false;
  }

