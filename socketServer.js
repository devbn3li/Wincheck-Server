const { Server } = require("socket.io");

// const socketUtils = require('./utils/socketUtils');
let io = null;
module.exports = function(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Update this with your client's URL
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    
    // Initialize chat socket events  
    require('./sockets/requestSocket')(io, socket);
    
    socket.on('disconnect', async () => {
      try {
        await User.update({ socketId: null, online: false }, { where: { id: user.id } })
        socket.emit("update user status", {"status": "offline", user});
      } catch (err) {
        socket.emit("update user status", {"messsage": err.message});
      }
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

function getSocketIo() {
  if (!io) {
      throw new Error('Socket.io has not been initialized!');
  }
  return io;
}

module.exports.getSocketIo = getSocketIo;