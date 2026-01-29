export function validateCode(code: string): { valid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Code is required' };
    }
    if (code.length > 50000) { // 50KB max
        return { valid: false, error: 'Code too large (max 50KB)' };
    }
    return { valid: true };
}

export function validateLanguage(language: string): boolean {
    return ['javascript', 'python', 'java'].includes(language);
}

export function validateRoomCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code);
}