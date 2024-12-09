const { getAllUsers, getMe, getAllnearbyUsers, updateUser } = require("../Controllers/userController");
const protect = require('../middlewares/protect');

const verifyRole = require("../utils/verifyRole");
const router = require("express").Router();


// router.get("/",protect,verifyRole(['admin']), getAllUsers);
router.get("/", getAllUsers);
router.get("/me",protect, getMe);
router.patch("/me",protect, updateUser);
router.get("/nearby",protect, getAllnearbyUsers);

module.exports = router;


