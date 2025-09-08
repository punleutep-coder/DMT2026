
import type { Document } from './types';

export const isDocumentExceedingPeriod = (
    doc: Document, 
    value: number, 
    unit: 'days' | 'hours' | 'minutes',
    department: string = 'All' // 'All' or a specific department name
) => {
    if (doc.status.startsWith('Completed') || doc.status === 'Combined' || doc.status === 'Split') {
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
    
    if (!Array.isArray(doc.history) || doc.history.length === 0) {
        return false;
    }

    // Get the last entry in the history, which is the current department
    const currentEntry = doc.history[doc.history.length - 1];

    // If a specific department is selected for the filter, and it's not the current one, then this doc doesn't match
    if (department !== 'All' && currentEntry.department !== department) {
        return false;
    }
    
    // The current step should not have an end date yet
    if (currentEntry.end) {
        return false;
    }

    const startTime = new Date(currentEntry.start).getTime();
    const duration = now - startTime;

    return duration > thresholdInMs;
  }



