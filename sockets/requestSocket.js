const { Op } = require("sequelize");
const { User } = require("../Models");
const Request = require("../Models/request");

module.exports = (io, socket) => {
  socket.on("add_request", async (data) => {
    io.emit("new_request", { message: "hello" });
  });
  socket.on("update_location", async (data) => {
    const user = await User.findByPk(socket.user.id);

    user.location = data.location;
    await user.save();
    const lastRequest = await Request.findOne({ 
      where: { 
        // [Op.or]: [{ user_id: user.id }, { serviceProvider_id: user.id }],
        // status: "ongoing" 
      }
    });
    console.log(user.id);
    console.log(lastRequest);
    if(!lastRequest){
      console.error("no request found");
      return;
    }
    if(lastRequest.user_id === user.id){
        const serviceProvider = await User.findByPk(lastRequest.serviceProvider_id);

        io.to(serviceProvider.socketId).emit("update_location", {lastRequest});
    }
    if(lastRequest.serviceProvider_id === user.id){
        const user = await User.findByPk(lastRequest.user_id);

        io.to(user.socketId).emit("update_location", {lastRequest});
    }
    io.emit("update_location", {lastRequest});

  });
}
