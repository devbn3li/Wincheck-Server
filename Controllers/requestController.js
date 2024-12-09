const expressAsyncHandler = require("express-async-handler");
const { service_Providers } = require("../config/options");
const Request = require("../Models/request");
const { User, sequelize } = require("../Models");
const Service = require("../Models/service");
const { Op } = require("sequelize");
const ApiError = require("../utils/ApiError");
const UserService = require("../Models/UserService");
const RequestService = require("../Models/RequestService");
const {getSocketIo} = require("../socketServer");

// send a request to the driver or the service provider to do somthing 
exports.sendRequest = expressAsyncHandler(async (req, res, next) => {
    
    const { service_Provider_id, service_ids , to_location} = req.body;
    const user = req.user;

    if(!service_Provider_id || !service_ids){
        return next(new ApiError("All fields are required", 400));
    }
    const serviceProvider = await User.findByPk(service_Provider_id);
    if(!serviceProvider){
        return next(new ApiError("service Provider not found", 404));
    }
    if(!service_Providers.includes(serviceProvider.role)){
        return next(new ApiError("service Provider not found", 404));
    }

    if(!Array.isArray(service_ids)){
        return next(new ApiError("services should be an array", 400));
    }

    const services = await Service.findAll({
        where: {
            id: {
                [Op.in]: service_ids,
            },
        }
    });

    if(services.length !== service_ids.length){
        return next(new ApiError("Invalid services", 400));
    }
    const ProviderServices = await UserService.findAll({
        attributes: ["id"],
        where: {
            ServiceId: {
                [Op.in]: service_ids,
            },
            UserId: {
                [Op.eq]: serviceProvider.id,
            },
        }
    });
    // return res.json({ProviderServices,service_ids});
    if(ProviderServices.length !== service_ids.length){
        console.log(ProviderServices);
        return next(new ApiError("Invalid services", 400));
    }
    const t = await sequelize.transaction();

    const request = await Request.create({
        user_id:user.id,
        serviceProvider_id:serviceProvider.id,
        to_location,
        from_location:user.location,
        // serviceProvider_location:serviceProvider.location
    },{transaction:t});

    let io = req.io;
    let mysocket = null;
    let serviceProviderSocket = null;
    io.sockets.sockets.forEach((socket) => {
        if(socket.user.id === req.user.id){
            mysocket = socket;
        }
        if(socket.user.id === serviceProvider.id){
            serviceProviderSocket = socket;
        }
    });
    
    if(mysocket && serviceProviderSocket){
        io.to(serviceProviderSocket.id).emit("new_request", {request});
        console.log(`emit new request from to ${mysocket?.id} - ${serviceProviderSocket?.id}`);
    }else{
        await t.rollback();
        return next(new ApiError(`service Provider not found ${mysocket?.id} - ${serviceProviderSocket?.id}`, 404));
    }

    // const io = req.io;
    // console.log("io is on:",io);
    // io.to(serviceProvider.id).emit("new request", {request});

    const requestServices = await Promise.all(
        services.map(async (service) => {
            await RequestService.create({
                RequestId: request.id,
                ServiceId: service.id,
            },{transaction:t});
    }))
    await t.commit();

    res.status(200).json({request,requestServices});
});

exports.acceptRequest = expressAsyncHandler(async (req, res, next) => {
    const user = req.user;
    const { id } = req.params;
    const request = await Request.findOne({id, serviceProvider_id :user.id});
    if(!request){
        return next(new ApiError("Request not found", 404));
    }
    if(request.status === "ongoing" || request.status === "rejected" || request.status === "completed"){
        return next(new ApiError(`Request already ${request.status} you can't modifiy it`, 400));
    }

    await request.update({
        status:"ongoing",
        accepted:true,
        accepted_at: new Date()
    });
    res.status(200).json({request});
});

exports.rejectRequest = expressAsyncHandler(async (req, res, next) => {
    const user = req.user;
    const { id } = req.params;
    const request = await Request.findOne({id, 
        where:{
            [Op.or]:[{user_id:user.id},{serviceProvider_id:user.id}]
        }
    });

    if(!request){
        return next(new ApiError("Request not found", 404));
    }
    if(request.status === "rejected" || request.status === "completed"){
        return next(new ApiError(`Request already ${request.status} you can't modifiy it`, 400));
    }
    if(request.status === "ongoing"){
        //! TODO: remove a reject fee from this user for rejecting the request after accepting it    
    }

    await request.update({
        status:"rejected",
        rejected:true,
        rejected_at: new Date()
    });
    res.status(200).json({request});
});

exports.completeRequest = expressAsyncHandler(async (req, res, next) => {
    const user = req.user;
    const { id } = req.params;

    const request = await Request.findOne({id, 
        where:{
            [Op.or]:[{user_id:user.id},{serviceProvider_id:user.id}] // ? who complete the request
        }
    });

    if(!request){
        return next(new ApiError("Request not found", 404));
    }
    if(request.status === "completed"){
        return next(new ApiError(`Request already ${request.status} you can't modifiy it`, 400));
    }
    await request.update({
        status:"completed",
        completed:true,
        completed_at: new Date()
    });
    res.status(200).json({request});
});

exports.getAllRequests = expressAsyncHandler(async (req, res, next) => {
    const user = req.user;

    const requests = await Request.findAll({where:{
        [Op.or]:[{user_id:user.id},{serviceProvider_id:user.id}]
    }});

    res.status(200).json(requests);
});