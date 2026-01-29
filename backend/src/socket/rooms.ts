import { Server, Socket } from "socket.io";
import { userRooms, roomSubmissions, roomProblems } from "../state/gameState";
import { getRandomProblem, getProblemByDifficulty } from "../data/problems";
import { validateRoomCode } from "../utils/validation";

interface CustomRoom {
    roomId: string;
    host: string;
    players: string[];
    difficulty: 'easy' | 'medium' | 'hard' | 'any';
    createdAt: number;
}

const customRooms = new Map<string, CustomRoom>();

// Generate 6-character room code
function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if exists, regenerate if needed
    return customRooms.has(code) ? generateRoomCode() : code;
}

export function handleRooms(io: Server, socket: Socket) {
    // Create custom room
    socket.on('create_room', ({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' | 'any' }) => {
        console.log(`Creating room for ${socket.id} with difficulty: ${difficulty}`);
        
        const roomId = generateRoomCode();
        
        const room: CustomRoom = {
            roomId,
            host: socket.id,
            players: [socket.id],
            difficulty,
            createdAt: Date.now()
        };

        customRooms.set(roomId, room);
        socket.join(roomId);
        userRooms.set(socket.id, roomId);

        console.log(`Room created: ${roomId} by ${socket.id}`);
        console.log(`Emitting room_created to ${socket.id}`);

        // Send room info back to creator
        socket.emit('room_created', {
            roomId: room.roomId,
            host: room.host,
            players: room.players,
            difficulty: room.difficulty,
            isReady: false
        });
    });

    // Join custom room
    socket.on('join_room', ({ roomCode }: { roomCode: string }) => {
        // ✅ Add validation
        if (!validateRoomCode(roomCode)) {
            socket.emit('room_error', 'Invalid room code format');
            return;
        }
        
        console.log(`User ${socket.id} trying to join room: ${roomCode}`);
        
        const room = customRooms.get(roomCode);

        if (!room) {
            console.log(`Room ${roomCode} not found`);
            socket.emit('room_error', 'Room not found');
            return;
        }

        if (room.players.length >= 2) {
            console.log(`Room ${roomCode} is full`);
            socket.emit('room_error', 'Room is full');
            return;
        }

        if (room.players.includes(socket.id)) {
            console.log(`User ${socket.id} already in room ${roomCode}`);
            socket.emit('room_error', 'You are already in this room');
            return;
        }

        // Add player to room
        room.players.push(socket.id);
        socket.join(roomCode);
        userRooms.set(socket.id, roomCode);

        console.log(`Player ${socket.id} joined room ${roomCode}. Players: ${room.players.length}/2`);

        // Notify the joining player
        socket.emit('room_joined', {
            roomId: room.roomId,
            host: room.host,
            players: room.players,
            difficulty: room.difficulty,
            isReady: room.players.length === 2
        });

        // Notify all players in room (including joiner)
        io.to(roomCode).emit('room_updated', {
            roomId: room.roomId,
            host: room.host,
            players: room.players,
            difficulty: room.difficulty,
            isReady: room.players.length === 2
        });
    });

    // Leave custom room
    socket.on('leave_room', ({ roomId }: { roomId: string }) => {
        console.log(`User ${socket.id} leaving room ${roomId}`);
        
        const room = customRooms.get(roomId);
        if (!room) return;

        // Remove player
        room.players = room.players.filter(id => id !== socket.id);
        socket.leave(roomId);
        userRooms.delete(socket.id);

        if (room.players.length === 0) {
            // Delete empty room
            customRooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
        } else {
            // If host left, assign new host
            if (room.host === socket.id) {
                room.host = room.players[0];
                console.log(`New host for room ${roomId}: ${room.host}`);
            }

            // Notify remaining players
            io.to(roomId).emit('room_updated', {
                roomId: room.roomId,
                host: room.host,
                players: room.players,
                difficulty: room.difficulty,
                isReady: false
            });

            console.log(`Player ${socket.id} left room ${roomId}. Remaining: ${room.players.length}`);
        }
    });

    // Start match (only host can start)
    socket.on('start_room_match', ({ roomId }: { roomId: string }) => {
        console.log(`Host ${socket.id} starting match in room ${roomId}`);
        
        const room = customRooms.get(roomId);
        
        if (!room) {
            socket.emit('room_error', 'Room not found');
            return;
        }

        if (room.host !== socket.id) {
            socket.emit('room_error', 'Only host can start the match');
            return;
        }

        if (room.players.length !== 2) {
            socket.emit('room_error', 'Need 2 players to start');
            return;
        }

        // Get problem based on difficulty
        const problem = room.difficulty === 'any' 
            ? getRandomProblem() 
            : getProblemByDifficulty(room.difficulty);

        // Setup match state
        roomSubmissions.set(roomId, new Map());
        roomProblems.set(roomId, problem.id);

        console.log(`Match started in room ${roomId} with problem: ${problem.title}`);

        // Notify both players
        io.to(roomId).emit('room_match_start', { problem });

        // Clean up room after match starts
        customRooms.delete(roomId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected, checking rooms...`);
        
        // Find and leave any custom rooms
        customRooms.forEach((room, roomId) => {
            if (room.players.includes(socket.id)) {
                room.players = room.players.filter(id => id !== socket.id);
                
                if (room.players.length === 0) {
                    customRooms.delete(roomId);
                    console.log(`Room ${roomId} deleted (empty after disconnect)`);
                } else {
                    if (room.host === socket.id) {
                        room.host = room.players[0];
                    }
                    io.to(roomId).emit('room_updated', {
                        roomId: room.roomId,
                        host: room.host,
                        players: room.players,
                        difficulty: room.difficulty,
                        isReady: false
                    });
                }
            }
        });
    });
}

// Clean up old rooms (older than 1 hour)
setInterval(() => {
    const now = Date.now();
    customRooms.forEach((room, roomId) => {
        if (now - room.createdAt > 3600000) { // 1 hour
            customRooms.delete(roomId);
            console.log(`Deleted stale room: ${roomId}`);
        }
    });
}, 300000); // Check every 5 minutes