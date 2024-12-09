const { Op } = require("sequelize");
const { User } = require("../Models/index.js");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const generateOTP = require("../utils/GenerateOTP.js");
const sendEmail = require("../Services/Mailer.js");
const crypto = require("crypto");
const { signin_roles, service_Providers } = require("../config/options.js");
const Service = require("../Models/service.js");
const UserService = require("../Models/UserService.js");

async function signToken(userId) {
  const user = await User.findByPk(userId);

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET_KEY);
}

// =========== Controllers ============

exports.SignUp = asyncHandler(async (req, res, next) => {
  const { username, email, role, password, services } = req.body;
  if (!username || !password || !role || !email || !services) {
    return next(new ApiError("All fields are required", 400));
  }
  // validate role from the signin_roles 
  if (!signin_roles.includes(role)) {
    return next(new ApiError(`Invalid role the role should be on of [${signin_roles.join(" - ")}]`, 400));
  }
  if (role === "driver" || role === "mechanic") {
    if (!services) {
      return next(new ApiError("You need to add services", 400));
    }
    if (!Array.isArray(services)) {
      return next(new ApiError("services should be an array", 400));
    }
    // check if these services exist
    const servicesExist = await Service.findAll({
      where: {
        id: {
          [Op.in]: services,
        },
      },
    });
    if (servicesExist.length !== services.length) {
      return next(new ApiError("Invalid services", 400));
    }
  }
  //validate username
  const name_not_taken = await User.findOne({
    where: {
      username,
    },
  });
  //validate email
  const email_not_taken = await User.findOne({
    where: {
      email,
    },
  });
  if (email_not_taken || name_not_taken) {
    if (
      !email_not_taken.verified &&
      new Date(email_not_taken.otp_expiry_time) > Date.now()
    ) {
      req.userId = email_not_taken.id;
      return next();
    }
    if (
      !email_not_taken.verified &&
      new Date(email_not_taken.otp_expiry_time) < Date.now()
    ) {
      return next(new ApiError("You Need To verfiy your account", 400));
    }
    return next(
      new ApiError("you already have an account try logging in", 400)
    );
  }

    const user = await User.create({
      username,
      password_hash: password,
      email,
      role,
    });
    // create the prefrances model to the user
    if(Array.isArray(services) && services.length > 0){
      console.log("add user services")
      if(service_Providers.includes(role)){
          await Promise.all(
            services.map(async (serviceId) => {
              await UserService.create({
                UserId:user.id,
                ServiceId:serviceId
              });
            })
          )
      }
    }

    const token = await signToken(user.id);
    await user.update({ verified: true });

    return res.status(200).json({ status: "success", token });

    // req.userId = user.id;
    // next();
  
});

exports.sendOTP = asyncHandler(async (req, res, next) => {
  let { userId } = req;
  if(!userId){
    const email = req.body.email;
    const user = await User.findOne({
      where: {
        email,
      },
    });
    if(!user){
      return next(new ApiError("User not found", 404));
    }
    userId = user.id;
  }
  const user = await User.findByPk(userId);
  
  if (user.verified) {
    const token = await signToken(userId);

    return res.status(200).json({
      status: "success",
      message: "Email is already exist and verified",
      token,
    });
  }

  // if the token date is not expired
  if (
    !user.verified &&
    user.otp &&
    new Date(user.otp_expiry_time) < Date.now()
  ) {
    return next(new ApiError("You have already requested an OTP", 400));
  }

  const new_otp = generateOTP(6);
  console.log(new_otp);
  const otp_expiry_time = Date.now() + 5 * 60 * 1000; // 5 Mins after otp is sent

  const affectedCount = await User.update(
    { otp: new_otp, otp_expiry_time },
    {
      where: {
        id: userId,
      },
      individualHooks: true,
    }
  );
  if (affectedCount[0] == 0) {
    return next(new ApiError("User not found", 404));
  }
  const updatedUser = await User.findByPk(userId);
  // TODO send mail
  // sendEmail(updatedUser.email, "Verification OTP", `Your OTP is ${new_otp}`);

  res.status(200).json({
    status: "success",
    message: "The verify code Sent to your Email",
  });
});

exports.verifyOTP = asyncHandler(async (req, res, next) => {
  // verify OTP and update user record accordingly
  const { email, otp } = req.body;
  console.log(email, otp);

  const user = await User.findOne({
    where: {
      email,
      otp_expiry_time: {
        [Op.gt]: Date.now(),
      },
    },
  });

  if (!user) {
    return next(new ApiError("Email is invalid or OTP is expired", 400));
  }

  if (user.verified) {
    return next(new ApiError("Email is already verified", 400));
  }

  if (!user.correctOTP(otp)) {
    return next(new ApiError("The OTP is incorrect", 400));
  }

  // OTP is correct
  await User.update(
    {
      verified: true,
      otp: null,
      otp_expiry_time: null,
    },
    {
      where: {
        email,
      },
      individualHooks: true,
    }
  );

  const token = await signToken(user.id);

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
    token,
    user_id: user.id,
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordCorrect) {
    return next(new ApiError("Password are wrong!", 404));
  }

  const token = await signToken(user.id);
  return res.status(200).json({ status: "success", token });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  //get user email
  const { email } = req.body;
  const foundUser = await User.findOne({ where: { email } });

  if (!foundUser) {
    return next(
      new ApiError("There is no user wth the given email address", 400)
    );
  }
  // Generate the random reset Token

  //https:// ...?code=asa5s1d5a4
  const resetToken = foundUser.createPasswordResetToken();
  const front_reset_password_url = process.env.FRONTEND_RESET_PASSWORD_URL;
  const resetUrl = `${front_reset_password_url}/?token=${resetToken}`;

  try {
    await User.update(
      {
        passwordResetToken: foundUser.passwordResetToken,
        passwordResetExpires: foundUser.passwordResetExpires,
      },
      {
        where: {
          email,
        },
        individualHooks: true,
      }
    );

    sendEmail(
      foundUser.email,
      "Reset Password",
      `Your Reset Password Link is ${resetUrl}`
    );

    res.status(200).json({
      status: "success",
      message: "Reset Password link sent to email",
      token: resetToken,
    });
  } catch (error) {
    await User.update(
      { passwordResetToken: null, passwordResetExpires: null },
      {
        where: {
          email,
        },
        individualHooks: true,
      }
    );
    return next(
      new ApiError(
        "there was an error sending the email, Please try again later",
        500
      )
    );
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  //get the new password and the user by Token
  const resetToken = req.query.token || req.body.token;
  const { password } = req.body;
  if (!resetToken) {
    return next(
      new ApiError("There is no token attatched to the request", 404)
    );
  }
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const foundUser = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: Date.now() },
    },
    attributes: { include: ["email", "password_hash"] },
  });

  // if token has Expired
  if (!foundUser) {
    return res.status(400).json({
      status: "error",
      message: "The token Has Expired",
    });
  }
  // check if the password differs from the saved one
  const isSamePassword = await bcrypt.compare(
    password,
    foundUser.password_hash
  );

  if (isSamePassword) {
    return next(
      new ApiError("The new password must be different from the old one", 400)
    );
  }

  // update user password and reset token
  await User.update(
    {
      password_hash: password,
      passwordChangedAt: Date.now(),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
    {
      where: {
        email: foundUser.email,
      },
      individualHooks: true,
    }
  );

  // Login the user and send Jwt
  sendEmail(
    foundUser.email,
    "Password Changed",
    `Your password has been changed successfully`
  );

  const token = await signToken(foundUser.id);

  return res.status(200).json({
    status: "success",
    message: "Password Reseted successfully",
    token,
  });
});
