import express from "express";
import http from "http";
import {Server} from "socket.io";
import cors from "cors"
import { Socket } from "dgram";

const app = express();

app.use(cors());

const server = http.createServer(app); // created a http server

const io = new Server(server,{
    cors : {
        origin: "*",
        methods: ["GET","POST"]
    }

});

let waitingQueue: string[] = []; //store  socketids of users waiting for a match
const userRooms = new Map<string,string>(); //maps socketid to roomname , basically tracks which user is in what room
const roomSubmissions = new Map<string,Map<string,string>>();

//"on" is the listener. "connection" is the eventName.
io.on("connection",(socket)=>{  //everytime there is a new socket connection ,
    console.log(`User Connected : ${socket.id}`)

    socket.on("join_queue",()=>{   //lisenting for a custom event called join_queue from the client side smth like Find Match or Start Searching
        
        if(waitingQueue.length >0){
            const opponentId = waitingQueue.shift();
            const roomId = `room_${opponentId}_${socket.id}`;
            
         
            socket.join(roomId); //added socket to roomid;  
            io.to(opponentId!).socketsJoin(roomId); //added opponent to roomid  
                        

            userRooms.set(socket.id,roomId);
            userRooms.set(opponentId!,roomId);
            
            io.to(roomId).emit("match_found",{
                roomId,
                problemId: "two-sum"
            });                                             
            console.log(`Match started: ${roomId}`)
        }
        else{
            waitingQueue.push(socket.id);
            socket.emit("queue_status","waiting");
            console.log(`User ${socket.id} joined queue`);
        }
    });

    
    socket.on("submit_code",(code)=>{
        const roomId = userRooms.get(socket.id);
        if(!roomId) return;

        const submissions = roomSubmissions.get(roomId);
        if(!submissions) return;

        submissions.set(socket.id,code);

        socket.to(roomId).emit("opponent_submitted");
        
        if(submissions.size == 2){
            const codes = Array.from(submissions.entries()).map(([socketId,code])=>({
                socketId,
                code
            }));


            io.to(roomId).emit("reveal_solutions",()=>{
                solutions:codes;
            })

             console.log(`Both users submitted in ${roomId}. Revealing solutions.`);
        }

    })

    
    //removed it , was thinking of showing the code to each other realized they can cheat XD , it became a bug 
    // socket.on("code_change",(code)=>{   
    //     const roomId = userRooms.get(socket.id);

    //     if(roomId){
    //         socket.to(roomId).emit("opponent_code_change",code);
    //     }
    // });

    // socket.on("code_change",(code)=>{
    //     const roomId = userRooms.get(socket.id);
        
    //     if(roomId){
    //         socket.to(roomId).emit("opponent_code_change",code);
    //     }
    // });
    
    
})


const PORT = process.env.PORT || 4000;

server.listen(PORT,()=>{
    console.log(`Server is listening on ${PORT}`);
})