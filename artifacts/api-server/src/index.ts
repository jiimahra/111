import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { seedGuestAccounts } from "./lib/seedGuests";
import { verifyUserToken } from "./lib/tokens";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

// Per-socket verified identity — set once join-room succeeds
const socketIdentity = new Map<string, string>(); // socketId -> userId

io.on("connection", (socket) => {
  socket.on("join-room", (userId: string, token: string) => {
    if (!userId || !token) return;
    const verified = verifyUserToken(token);
    if (!verified || verified !== userId) {
      // Token invalid or doesn't match the claimed userId — reject silently
      return;
    }
    socket.join(userId);
    socketIdentity.set(socket.id, userId);
  });

  socket.on("call-user", (data: {
    to: string;
    from: string;
    fromName: string;
    isVideo: boolean;
    offer: unknown;
  }) => {
    // Enforce that the caller identity matches the verified socket identity
    const verifiedId = socketIdentity.get(socket.id);
    if (!verifiedId || verifiedId !== data.from) return;

    io.to(data.to).emit("incoming-call", {
      from: data.from,
      fromName: data.fromName,
      isVideo: data.isVideo,
      offer: data.offer,
    });
  });

  socket.on("call-accepted", (data: { to: string; answer: unknown }) => {
    if (!socketIdentity.has(socket.id)) return;
    io.to(data.to).emit("call-accepted", { answer: data.answer });
  });

  socket.on("call-rejected", (data: { to: string }) => {
    if (!socketIdentity.has(socket.id)) return;
    io.to(data.to).emit("call-rejected");
  });

  socket.on("call-ended", (data: { to: string }) => {
    if (!socketIdentity.has(socket.id)) return;
    io.to(data.to).emit("call-ended");
  });

  socket.on("ice-candidate", (data: { to: string; candidate: unknown }) => {
    if (!socketIdentity.has(socket.id)) return;
    io.to(data.to).emit("ice-candidate", { candidate: data.candidate });
  });

  socket.on("disconnect", () => {
    socketIdentity.delete(socket.id);
  });
});

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  void seedGuestAccounts();
});
