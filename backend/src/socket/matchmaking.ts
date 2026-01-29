import { Server, Socket } from "socket.io";
import { waitingQueue, userRooms, roomSubmissions, roomProblems, setWaitingQueue } from "../state/gameState";
import { getRandomProblem, getProblemByDifficulty } from "../data/problems";
import type { MatchFoundData } from "../types";

interface QueueEntry {
    socketId: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'any';
    joinedAt: number;
}

let enhancedQueue: QueueEntry[] = [];

export function handleMatchmaking(io: Server, socket: Socket) {
    // Join queue with difficulty preference
    socket.on("join_queue", ({ difficulty = 'any' }: { difficulty?: 'easy' | 'medium' | 'hard' | 'any' }) => {
        // Check if already in queue
        if (enhancedQueue.some(entry => entry.socketId === socket.id)) {
            return;
        }

        // Add to queue
        enhancedQueue.push({
            socketId: socket.id,
            difficulty,
            joinedAt: Date.now()
        });

        console.log(`User ${socket.id} joined queue (${difficulty}). Queue size: ${enhancedQueue.length}`);

        // Try to find a match
        tryMatch(io, socket);

        // Send queue update to all waiting users
        broadcastQueueUpdate(io);
    });

    // Leave queue
    socket.on("leave_queue", () => {
        enhancedQueue = enhancedQueue.filter(entry => entry.socketId !== socket.id);
        console.log(`User ${socket.id} left queue. Queue size: ${enhancedQueue.length}`);
        broadcastQueueUpdate(io);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        enhancedQueue = enhancedQueue.filter(entry => entry.socketId !== socket.id);
        broadcastQueueUpdate(io);
    });
}

function tryMatch(io: Server, socket: Socket) {
    if (enhancedQueue.length < 2) return;

    const currentUser = enhancedQueue.find(entry => entry.socketId === socket.id);
    if (!currentUser) return;

    // Find best match (same difficulty or 'any')
    const matchIndex = enhancedQueue.findIndex((entry, idx) => {
        if (entry.socketId === socket.id) return false;
        
        // Match if either user selected 'any' or difficulties match
        return currentUser.difficulty === 'any' || 
               entry.difficulty === 'any' || 
               currentUser.difficulty === entry.difficulty;
    });

    if (matchIndex !== -1) {
        const opponent = enhancedQueue[matchIndex];
        
        // Remove both from queue
        enhancedQueue = enhancedQueue.filter(
            entry => entry.socketId !== socket.id && entry.socketId !== opponent.socketId
        );

        // Create match
        createMatch(io, socket.id, opponent.socketId, currentUser.difficulty);
        
        broadcastQueueUpdate(io);
    }
}

function createMatch(io: Server, player1Id: string, player2Id: string, difficulty: string) {
    const roomId = `room_${player1Id}_${player2Id}`;
    
    const player1Socket = io.sockets.sockets.get(player1Id);
    const player2Socket = io.sockets.sockets.get(player2Id);
    
    if (!player1Socket || !player2Socket) return;

    // Join room
    player1Socket.join(roomId);
    player2Socket.join(roomId);

    // Update state
    userRooms.set(player1Id, roomId);
    userRooms.set(player2Id, roomId);
    roomSubmissions.set(roomId, new Map());

    // Get problem based on difficulty
    const problem = difficulty === 'any' 
        ? getRandomProblem() 
        : getProblemByDifficulty(difficulty as 'easy' | 'medium' | 'hard');
    
    roomProblems.set(roomId, problem.id);

    // Notify both players
    const matchData: MatchFoundData = { roomId, opponentId: player2Id, problem };
    io.to(player1Id).emit("match_found", matchData);
    io.to(player2Id).emit("match_found", { ...matchData, opponentId: player1Id });

    console.log(`Match created: ${roomId} (${difficulty})`);
}

function broadcastQueueUpdate(io: Server) {
    enhancedQueue.forEach((entry, index) => {
        const socket = io.sockets.sockets.get(entry.socketId);
        if (socket) {
            socket.emit('queue_update', {
                position: index + 1,
                totalWaiting: enhancedQueue.length,
                estimatedWaitTime: Math.max(10, 30 - (index * 5))
            });
        }
    });
}