import { io } from "socket.io-client";

// Adjust the URL to match your backend
const socket = io(); // Auto-connects to current origin


export default socket;
