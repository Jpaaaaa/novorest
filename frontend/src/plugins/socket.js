import { io } from "socket.io-client";

// Adjust the URL to match your backend
const socket = io("http://localhost:3000");

export default socket;
