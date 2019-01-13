
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Car', {
            make: {
                type: DataTypes.STRING(48)
                ,allowNull: false
            }
            ,model: {
                type: DataTypes.STRING(48)
                ,allowNull: false
            }
            ,year: {
                type: DataTypes.INTEGER(4)
                ,allowNull: false
            }
            ,vin: {
                type: DataTypes.STRING(17)
            }
            ,license_plate: {
                type: DataTypes.STRING(7)
            }
            ,purchase_date: {
                type: DataTypes.DATEONLY
            }
            ,purchase_mileage: {
                type: DataTypes.INTEGER(6)
            }
            ,current_mileage: {
                type: DataTypes.INTEGER(6)
            }
            ,sold_date: {
                type: DataTypes.DATEONLY
            }
            ,active: {
                type: DataTypes.BOOLEAN
                ,allowNull: false
                ,defaultValue: true
            }
            ,ownerId: {
                type: DataTypes.INTEGER
                ,allowNull: false
            }
        }
        ,{
            paranoid: true
        });
};