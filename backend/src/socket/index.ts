import { Server } from 'socket.io';
import { handleMatchmaking } from './matchmaking';
import { handleDuel } from './duelhandler';
import { handleRooms } from './rooms';

export function setupSocketHandlers(io: Server) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle matchmaking (quick match)
        handleMatchmaking(io, socket);

        // Handle custom rooms
        handleRooms(io, socket);

        // Handle duel/code execution
        handleDuel(io, socket);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}