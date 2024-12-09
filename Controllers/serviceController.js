const expressAsyncHandler = require("express-async-handler");
const Service = require("../Models/service");
const UserService = require("../Models/UserService");
const { User } = require("../Models");

exports.getAllServices = expressAsyncHandler(async (req, res, next) => {
    const services = await Service.findAll();

    res.status(200).json(services);
})
exports.addServiceToUser = expressAsyncHandler(async (req, res, next) => {
    const { user_id, service_id } = req.body;
    const user = await User.findByPk(user_id);

    if(!user){
        return next(new ApiError("User not found", 404));
    }
    const service = await Service.findByPk(service_id);
    if(!service){
        return next(new ApiError("Service not found", 404));
    }
    await UserService.create({
        UserId: user.id,
        ServiceId: service.id
    });
    res.status(200).json({status:"success"});
})