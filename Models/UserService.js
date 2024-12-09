const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Your Sequelize instance

class UserService extends Model {}

UserService.init(
    {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        ServiceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'services',
                key: 'id'
            }
        },
    },
    {
        sequelize,
        modelName: 'UserService',
        tableName: 'userServices',
        timestamps: true,
    }
);

module.exports = UserService;
