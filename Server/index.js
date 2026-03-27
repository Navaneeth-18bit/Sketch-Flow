const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { morganLogger, logger } = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const chatRoute = require("./routes/chat");
const diagramRoute = require("./routes/diagram");
const adminRoute = require("./routes/admin");
const sessionRoute = require("./routes/session");

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));
app.use(express.json());
app.use(morganLogger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/chat", chatRoute);
app.use("/api/admin", adminRoute);
app.use("/api/sessions", sessionRoute);
app.use("/api", diagramRoute);

app.use(errorHandler);

io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on("join_diagram_chat", (diagramId) => {
    socket.join(diagramId);
    logger.info(`User ${socket.id} joined chat: ${diagramId}`);
  });

  socket.on("send_message", (data) => {
    const { diagramId, message } = data;
    // Handle message logic here (save to DB, etc.)
    io.to(diagramId).emit("receive_message", {
      sender: "user",
      text: message,
      timestamp: new Date(),
    });

    // Mock AI response for now
    setTimeout(() => {
      io.to(diagramId).emit("receive_message", {
        sender: "ai",
        text: `Echo: ${message}`,
        timestamp: new Date(),
      });
    }, 1000);
  });

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});


