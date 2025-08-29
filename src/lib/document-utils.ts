
import type { Document } from './types';

export const isDocumentExceedingPeriod = (
    doc: Document, 
    value: number, 
    unit: 'days' | 'hours' | 'minutes',
    department: string = 'All' // 'All' or a specific department name
) => {
    let thresholdInMs = 0;
    switch (unit) {
        case 'minutes': thresholdInMs = value * 60 * 1000; break;
        case 'hours': thresholdInMs = value * 60 * 60 * 1000; break;
        case 'days': thresholdInMs = value * 24 * 60 * 60 * 1000; break;
        default: return false;
    }
  
    const now = new Date().getTime();
    
    // Iterate over all history entries
    for (const entry of doc.history) {
        // If a specific department is selected, only check entries for that department
        if (department !== 'All' && entry.department !== department) {
            continue;
        }

        const startTime = new Date(entry.start).getTime();
        // If the step is finished, compare against its end time. If it's ongoing, compare against now.
        const endTime = entry.end ? new Date(entry.end).getTime() : now;
        const duration = endTime - startTime;

        if (duration > thresholdInMs) {
            return true; // Found at least one step that exceeded the period
        }
    }
    
    return false; // No step exceeded the period
  }

