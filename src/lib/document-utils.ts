import type { Document } from './types';

/**
 * Calculates the duration in milliseconds between two dates, excluding weekends (Saturday and Sunday).
 * @param start The start date.
 * @param end The end date.
 * @returns Duration in milliseconds excluding weekends.
 */
const getWeekdayDurationInMs = (start: Date, end: Date): number => {
    if (start >= end) return 0;

    let totalMs = 0;
    let current = new Date(start.getTime());

    while (current < end) {
        // Find the beginning of the next day
        const nextDay = new Date(current);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);

        // The end of our current slice is either the start of the next day or the actual 'end' date
        const sliceEnd = nextDay < end ? nextDay : end;
        
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
            totalMs += sliceEnd.getTime() - current.getTime();
        }

        current = sliceEnd;
    }

    return totalMs;
};

export const isDocumentExceedingPeriod = (
    doc: Document, 
    value: number, 
    unit: 'days' | 'hours' | 'minutes',
    department: string = 'All' // 'All' or a specific department name
) => {
    // Exclude terminal states (Completed, Combined, Split) from the aging calculation
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
  
    const now = new Date();
    
    if (!Array.isArray(doc.history) || doc.history.length === 0) {
        return false;
    }

    // Get the last entry in the history, which represents the current department stay
    const currentEntry = doc.history[doc.history.length - 1];

    // If a specific department is selected for the filter, and it's not the current one, then this doc doesn't match
    if (department !== 'All' && currentEntry.department !== department) {
        return false;
    }
    
    // The current step should not have an end date yet (meaning it is the active step)
    if (currentEntry.end) {
        return false;
    }

    const startTime = new Date(currentEntry.start);
    
    // Calculate actual elapsed duration excluding weekends
    const durationMs = getWeekdayDurationInMs(startTime, now);

    return durationMs > thresholdInMs;
}
