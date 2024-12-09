const { SignUp, sendOTP, verifyOTP, forgotPassword, resetPassword } = require('../Controllers/authController');
const { login } = require("../Controllers/authController");
const { loginValidator } = require("../utils/validators/authValidator");
const router = require("express").Router();

router.post("/signup", SignUp , sendOTP);
router.post("/resendOtp", sendOTP);
router.post("/login", loginValidator, login);
router.post("/verfiyOtp", verifyOTP);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", resetPassword);

module.exports = router;
