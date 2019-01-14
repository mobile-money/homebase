const moment = require("moment");
const _ = require('underscore');
const Sequelize = require('sequelize');
const { fn, col } = Sequelize;

module.exports = function(db, admin) {
    return {
        delete: function(user, carId) {
            return new Promise(function(resolve, reject) {
                db.Car.findOne({
                    where: {
                        id: carId,
                        ownerId: user.id
                    }
                }).then(function(car) {
                    if (car !== null) {
                        car.active = false;
                        car.sold_date = moment().format('YYYY-MM-DD');
                        car.save().then(function(result) {
                            // car.destroy().then(function(result) {
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    } else {
                        reject("car not found");
                    }
                }).catch(function(error) {
                    console.log("catch error on Car controller delete method: " + error);
                    reject();
                });
            });
        }
        ,get: function(user, params) {
            params.active = true;
            return new Promise(function(resolve, reject) {
                // SELECT * FROM automobile.Cars WHERE (active=true AND (ownerId=1 OR (JSON_CONTAINS(group_ids,'2') OR JSON_CONTAINS(group_ids,'1'))));
                // Create JSON_CONTAINS query section
                let queryArr = [];
                user.groups.forEach(function(group) {
                    queryArr.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
                });
                // console.log(queryArr);
                params.$or =  [
                    { ownerId: user.id },
                    { $or: queryArr }
                ];
                db.Car.findAll({
                    where: params
                    ,order: [[ 'make', 'ASC' ]]
                }).then(function(results) {
                    let finResults = [];
                    results.forEach(function(result) {
                        let tObj = {
                            id: result.id,
                            make: result.make,
                            model: result.model,
                            year: result.year,
                            vin: result.vin,
                            license_plate: result.license_plate,
                            purchase_date: result.purchase_date,
                            purchase_mileage: result.purchase_mileage,
                            current_mileage: result.current_mileage,
                            sold_date: result.sold_date,
                            groups: JSON.parse(result.group_ids)
                        };
                        if (result.ownerId === user.id) {
                            tObj.owner = true;
                        }
                        finResults.push(tObj);
                    });
                    resolve(finResults);
                }).catch(function(error) {
                    console.log("catch error on Car controller get method: " + error);
                    reject();
                });
            });
        }
        ,getByGroup: function(user, groupId) {
            return new Promise(function(resolve, reject) {
                // Make sure user is a part of group
                const group = _.findWhere(user.groups,{id: groupId});
                if (typeof(group !== "undefined")) {
                    db.Car.findAll({
                        where: fn('JSON_CONTAINS', col('group_ids'), String(groupId))
                    }).then(function(cars) {
                        // Extract just the make, model and year
                        let finArr = [];
                        cars.forEach(function(car) {
                            finArr.push({
                                make: car.make,
                                model: car.model,
                                year: car.year
                            });
                        });
                        resolve(finArr);
                    }).catch(function(error) {
                        console.log("catch error on Car controller getByGroup method: " + error);
                        reject();
                    });
                } else {
                    reject("unauthorized");
                }
            });
        }
        ,getInactive: function(user) {
            return new Promise(function(resolve, reject) {
                let params = {
                    active: false
                };
                // Create JSON_CONTAINS query section
                let queryArr = [];
                user.groups.forEach(function(group) {
                    queryArr.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
                });
                // console.log(queryArr);
                params.$or =  [
                    { ownerId: user.id },
                    { $or: queryArr }
                ];
                db.Car.findAll({
                    where: params
                    ,order: [['make', 'ASC']]
                }).then(function(results) {
                    let finResults = [];
                    results.forEach(function(result) {
                        let tObj = {
                            id: result.id,
                            make: result.make,
                            model: result.model,
                            year: result.year,
                            vin: result.vin,
                            license_plate: result.license_plate,
                            purchase_date: result.purchase_date,
                            purchase_mileage: result.purchase_mileage,
                            current_mileage: result.current_mileage,
                            sold_date: result.sold_date,
                            groups: JSON.parse(result.group_ids)
                        };
                        if (result.ownerId === user.id) {
                            tObj.owner = true;
                        }
                        finResults.push(tObj);
                    });
                    resolve(finResults);
                }).catch(function(error) {
                    console.log("catch error on Car controller getInactive method: " + error);
                    reject();
                });
            });
        }
        ,insert: function(user, car) {
            return new Promise(function(resolve, reject) {
                admin.User.findById(user.id).then(function(foundUser) {
                    if (foundUser) {
                        car.ownerId = user.id;
                        // Make sure groups is array of INTs
                        car.group_ids = _.map(car.group_ids, function(val) { return Number(val); });
                        db.Car.create(car).then(function(result) {
                            resolve(result);
                        },function(error) {
                            reject('unable to create car: ' + error);
                        });
                    } else {
                        reject('user not provided');
                    }
                },function(error) {
                    reject('error finding user: ' + error);
                }).catch(function(error) {
                    console.log("catch error on Car controller insert method: " + error);
                    reject();
                });
            });
        }
        ,reactivate: function(user, id) {
            return new Promise(function(resolve, reject) {
                db.Car.update({
                        active: true
                        ,sold_date: null
                    }
                    ,{
                        where: {
                            id: id,
                            ownerId: user.id
                        }
                    }).then(function(result) {
                    if (result[0] === 1) {
                        resolve();
                    } else {
                        reject("There was a problem reactivating the car");
                    }
                }).catch(function(error) {
                    console.log("catch error on Car controller reactivate method: " + error);
                    reject();
                });
            });
        }
        ,update: function(user, carId, data) {
            return new Promise(function(resolve, reject) {
                db.Car.findOne({
                    where: {
                        id: carId,
                        ownerId: user.id
                    }
                }).then(function(car) {
                    if (car !== null) {
                        if (data.make) { car.make = data.make; }
                        if (data.model) { car.model = data.model; }
                        if (data.year) { car.year = data.year; }
                        if (data.vin) { car.vin = data.vin; }
                        if (data.license_plate) { car.license_plate = data.license_plate; }
                        if (data.purchase_date) { car.purchase_date = data.purchase_date; }
                        if (data.purchase_mileage) { car.purchase_mileage = data.purchase_mileage; }
                        if (data.current_mileage) { car.current_mileage = data.current_mileage; }
                        // Make sure groups is array of INTs
                        car.group_ids = _.map(data.group_ids, function(val) { return Number(val); });
                        car.save().then(function(result) {
                            resolve(result);
                        });
                    } else {
                        reject("car not found");
                    }
                }).catch(function(error) {
                    console.log("catch error on Car controller update method: " + error);
                    reject();
                });
            });
        }
    };
};