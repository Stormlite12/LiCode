const submissionCounts = new Map<string, number[]>();

export function canSubmit(socketId: string): boolean {
    const now = Date.now();
    const submissions = submissionCounts.get(socketId) || [];
    
    // Remove submissions older than 1 minute
    const recent = submissions.filter(time => now - time < 60000);
    
    if (recent.length >= 5) { // Max 5 submissions per minute
        return false;
    }
    
    recent.push(now);
    submissionCounts.set(socketId, recent);
    return true;
}