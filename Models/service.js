const sequelize = require('../config/database');
const { Model, DataTypes } = require('sequelize');


class Service extends Model {}


Service.init({
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'Service',
    tableName: 'services'
})

module.exports = Service;
