module.exports = function(sequelize, DataTypes) {
    return sequelize.define('MaintenanceLog', {
            service_date: {
                type: DataTypes.DATEONLY
                ,allowNull: false
            }
            ,mileage: {
                type: DataTypes.INTEGER(6)
                ,allowNull: false
            }
            ,description: {
                type: DataTypes.STRING(2048)
                ,allowNull: false
            }
            ,cost: {
                type: DataTypes.DECIMAL(7,2)
            }
            ,servicer: {
                type: DataTypes.STRING(96)
            }
        }
        ,{
            paranoid: true
        });
};