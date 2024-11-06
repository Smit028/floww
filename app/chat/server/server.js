const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000", // Update this with your client’s URL
        methods: ["GET", "POST"]
    }
});

const users = {}; // Stores user ID mapped by socket ID

// When a client connects
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register a user by storing their user ID
    socket.on("register", (userId) => {
        users[socket.id] = userId;
        console.log(`User registered: ${userId} with socket ID: ${socket.id}`);

        // Broadcast updated user list to all connected clients
        io.emit("user_list", Object.values(users));
    });

    // When a client disconnects
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        delete users[socket.id];

        // Broadcast updated user list to remaining clients
        io.emit("user_list", Object.values(users));
    });

    // Handle call invitations
    socket.on("call_invitation", (data) => {
        const targetSocketId = Object.keys(users).find(key => users[key] === data.to);
        if (targetSocketId) {
            console.log(`Call invitation from ${users[socket.id]} to ${data.to}`);
            socket.to(targetSocketId).emit("call_invitation", { from: users[socket.id] });
        } else {
            console.error(`Call invitation failed: User ${data.to} not found`);
        }
    });

    // Handle call responses
    socket.on("call_response", (data) => {
        const targetSocketId = Object.keys(users).find(key => users[key] === data.to);
        if (targetSocketId) {
            console.log(`Call response from ${users[socket.id]} to ${data.to}: ${data.response}`);
            socket.to(targetSocketId).emit("call_response", data);
        } else {
            console.error(`Call response failed: User ${data.to} not found`);
        }
    });
});

// Start the server on port 3000
server.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
});
