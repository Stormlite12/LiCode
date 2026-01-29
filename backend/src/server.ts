import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { handleMatchmaking } from "./socket/matchmaking";
import { handleDuel } from "./socket/duelhandler";
import { handleRooms } from "./socket/rooms";
import { handleDisconnect } from "./socket/signaling";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Initialize socket handlers
    handleMatchmaking(io, socket);
    handleRooms(io, socket); // ✅ Make sure this is here
    handleDuel(io, socket);
    handleDisconnect(io, socket);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// ✅ Add at the top of the file
const requiredEnvVars = ['REDIS_PASSWORD', 'POSTGRES_PASSWORD'];
const missing = requiredEnvVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error(` Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please create a .env file based on .env.example');
    process.exit(1);
}