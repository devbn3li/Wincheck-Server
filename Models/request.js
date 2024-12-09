const sequelize = require('../config/database');
const { Model, DataTypes } = require('sequelize');


class Request extends Model {}


Request.init({
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    from_location:{
        type: DataTypes.JSON,
        allowNull: true
    },
    to_location:{
        type: DataTypes.JSON,
        allowNull: true
    },
    serviceProvider_location:{
        type: DataTypes.JSON,
        allowNull:true,
    },
    user_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    serviceProvider_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    accepted:{
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    rejected_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    rejected:{
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    status:{
        type: DataTypes.ENUM('pending','ongoing' ,'completed', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
    },
}, {
    sequelize,
    modelName: 'Request',
    tableName: 'requests'
})

module.exports = Request;
