const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const User = require("./user");
const Request = require("./request");
const Service = require("./service");
const UserService = require("./UserService");
const RequestService = require("./RequestService");

User.hasMany(Request , {foreignKey:"user_id"});
Request.belongsTo(User , {foreignKey:"user_id"});

User.belongsToMany(Service , {through:UserService});
Service.belongsToMany(User , {through:UserService});

Request.belongsToMany(Service , {through:RequestService});
Service.belongsToMany(Request , {through:RequestService});

module.exports = {
  sequelize,
  Sequelize,
  User,
};

