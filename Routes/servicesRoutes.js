const { getAllServices, addServiceToUser } = require("../Controllers/serviceController");
const { getAllUsers, getMe } = require("../Controllers/userController");
const protect = require('../middlewares/protect');

const verifyRole = require("../utils/verifyRole");
const router = require("express").Router();


// router.get("/",protect,verifyRole(['admin']), getAllUsers);
router.get("/", getAllServices );
router.post("/", addServiceToUser );


module.exports = router;
