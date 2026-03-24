"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_2 = require("@clerk/express");
const firebasetest_1 = __importDefault(require("./firebasetest"));
const posts_1 = __importDefault(require("./routes/posts"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const server = http_1.default.createServer(app);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const io = new socket_io_1.Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    // console.log("User connected", socket.id);
    socket.on("send message", (data) => {
        // console.log("Message received", data);
        io.emit("receive message", data);
    });
    socket.on("send photo", (data) => {
        io.emit("receive photo", data);
    });
});
app.use((0, express_2.clerkMiddleware)({
    authorizedParties: [CORS_ORIGIN],
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/", posts_1.default);
app.use("/", firebasetest_1.default);
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Server is listening to port " + PORT);
}));
