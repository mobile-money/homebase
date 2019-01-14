const Sequelize = require('sequelize');
const { fn, col } = Sequelize;

module.exports = function(sequelize, DataTypes) {
    let Car = sequelize.define('Car', {
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
        ,group_ids: {
            type: DataTypes.JSON
        }
    },{
        paranoid: true,
        classMethods: {
            validateAccess: function(user, car_id) {
                // query for all cars that match the given car id AND match the user id to owner id OR
                // one of the users groups to one of the cars groups
                return new Promise(function(resolve, reject) {
                    let params = {
                        id: car_id,
                        $or: [
                            { ownerId: user.id },
                        ]
                    };
                    user.groups.forEach(function(group) {
                        params.$or.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
                    });
                    Car.findAll({
                        where: params
                    }).then(function(cars) {
                        if (cars !== null) {
                            if (cars.length === 1) {
                                resolve();
                            } else {
                                // somethings off, only one car should be returned
                                reject()
                            }
                        } else {
                            // no such car found
                            reject();
                        }
                    }).catch(function(error) {
                        console.log("error in validateCarAccess: " + error);
                        reject();
                    });
                });
            }
        }
    });
    return Car;
};