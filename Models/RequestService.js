const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Your Sequelize instance

class RequestService extends Model {}

RequestService.init(
    {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        RequestId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'requests',
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
        modelName: 'RequestService',
        tableName: 'requestServices',
        timestamps: true,
    }
);

module.exports = RequestService;
