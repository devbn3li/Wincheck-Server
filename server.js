const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const mainRoute = require("./Routes/index");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cors = require("cors");

const http = require('http');
const socketServer = require('./socketServer');
const authenticate = require("./middlewares/socketAuthentacation");

dotenv.config({ path: ".env" });

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const server = http.createServer(app);
const io = socketServer(server);
io.use(authenticate);

app.use((req,res,next)=>{
  req.io = io;
  next();
})
// main system route
app.use("/api", mainRoute);

app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Decide whether to exit the process or recover based on the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Log the error and handle it gracefully
});
