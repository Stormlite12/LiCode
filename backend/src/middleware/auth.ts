import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    username?: string;
}

export function authenticateSocket(socket: AuthenticatedSocket, next: any) {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication required'));
    }
    
    // Verify token (implement JWT verification)
    // For now, just generate a UUID
    socket.userId = generateUserId();
    socket.username = `Player_${socket.userId.slice(0, 6)}`;
    
    next();
}

function generateUserId(): string {
    return Math.random().toString(36).substring(2, 15);
}