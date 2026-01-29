import { Server, Socket } from "socket.io";
import { waitingQueue, userRooms, setWaitingQueue } from "../state/gameState";

export function handleDisconnect(io: Server, socket: Socket) {
    socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);

        // Remove from queue if they were waiting
        setWaitingQueue(waitingQueue.filter(id => id !== socket.id));

        // Handle match abandonment
        const roomId = userRooms.get(socket.id);
        if (roomId) {
            socket.to(roomId).emit("opponent_left");
            
            // Cleanup memory
            userRooms.delete(socket.id);
            // We keep the roomSubmissions briefly so the winner can still see their code
        }
    });
}
