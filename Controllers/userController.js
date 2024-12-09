const asyncHandler = require('express-async-handler');
const {User} = require('../Models/index.js');
const getNearbyUsers = require('../utils/getNearbyUsers.js');

exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.findAll();

    res.status(200).json(users);
});

exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findByPk(req.user.id,{attributes:["id","username", "email","role"],});
    const services = await user.getServices({attributes:["id","name"],});
    // user.services = services;
    res.status(200).json({...user.toJSON(),services});
});

exports.getAllnearbyUsers = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const distance = req.query.distance || 10000;
    
    const user = await User.findByPk(userId);
    const users = await getNearbyUsers(user , distance);

    res.status(200).json(users);
});

exports.updateUser = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    await User.update({ ...req.body }, { where: { id: userId } });
    res.status(200).json({ status: "success" });
});