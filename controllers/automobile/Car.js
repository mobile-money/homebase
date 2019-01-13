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
                params.ownerId = user.id;
                db.Car.findAll({
                    where: params
                    ,order: [[ 'make', 'ASC' ]]
                }).then(function(results) {
                    let finResults = [];
                    let carIds = [];
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
                            groups: []
                        };
                        if (result.ownerId === user.id) {
                            tObj.owner = true;
                        }
                        carIds.push(result.id);
                        finResults.push(tObj);
                    });
                    admin.Group.findAll({}).then(function(groups) {
                        groups.forEach(function(group) {
                            const arr = JSON.parse(group.Cars);
                            if (arr.length > 0) {
                                arr.forEach(function(groupCar) {
                                    let tObj = _.findWhere(finResults, {id: groupCar});
                                    if (tObj && tObj.hasOwnProperty("groups")) {
                                        tObj.groups.push(group.id);
                                    }
                                });
                            }
                        });
                        resolve(finResults);
                    }, function (error) {
                        console.log("error getting groups for cars: " + error);
                        resolve(finResults);
                    });
                }).catch(function(error) {
                    console.log("catch error on Car controller get method: " + error);
                    reject();
                });
            });
        }
        ,getInactive: function(user) {
            return new Promise(function(resolve, reject) {
                db.Car.findAll({
                    where: {
                        active: false,
                        ownerId: user.id
                    }
                    ,order: [['make', 'ASC']]
                }).then(function(results) {
                    let finResults = [];
                    let carIds = [];
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
                            groups: []
                        };
                        if (result.ownerId === user.id) {
                            tObj.owner = true;
                        }
                        carIds.push(result.id);
                        finResults.push(tObj);
                    });
                    admin.Group.findAll({}).then(function(groups) {
                        groups.forEach(function(group) {
                            const arr = JSON.parse(group.Cars);
                            if (arr.length > 0) {
                                arr.forEach(function(groupCar) {
                                    let tObj = _.findWhere(finResults, {id: groupCar});
                                    if (tObj && tObj.hasOwnProperty("groups")) {
                                        tObj.groups.push(group.id);
                                    }
                                });
                            }
                        });
                        resolve(finResults);
                    }, function (error) {
                        console.log("error getting groups for cars: " + error);
                        resolve(finResults);
                    });
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
                        db.Car.create(car).then(function(result) {
                            if (car.hasOwnProperty("groups")) {
                                let arr = JSON.parse(car.groups);
                                arr = _.map(arr, function(val) { return Number(val); });
                                admin.Group.update({
                                    Cars: fn('JSON_ARRAY_APPEND', col('Cars'), '$', Number(result.id))
                                }, {
                                    where: { id: { $in: arr } }
                                }).then(function() {
                                    console.log('added group access');
                                    resolve(result);
                                }, function(error) {
                                    console.log("error adding group access: " + error);
                                    resolve(result);
                                });
                            }
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
                db.Owner.validateCarMaster(user.id, id).then(function() {
                    db.Car.update({
                            active: true
                            ,sold_date: null
                        }
                        ,{
                            where: {
                                id: id
                            }
                        }).then(function(result) {
                        if (result[0] === 1) {
                            resolve();
                        } else {
                            reject("There was a problem reactivating the car");
                        }
                    });
                }, function() {
                    reject("unauthorized");
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
                            car.save().then(function(result) {
                                // Handle owner changes
                                db.Owner.findAll({
                                    where: {
                                        CarId: carId,
                                        userId: {
                                            $ne: user.id
                                        }
                                    }
                                }).then(function(owners) {
                                    let addOwners = [];
                                    let removeOwners = [];
                                    const auaArr = JSON.parse(data.aua);
                                    if (auaArr) {
                                        // Check for additional owners to add, collect new owners user id
                                        auaArr.forEach(function(aua) {
                                            let exists = false;
                                            owners.forEach(function(owner) {
                                                if (owner.userId === aua) { exists = true; }
                                            });
                                            if (!exists) { addOwners.push(aua); }
                                        });
                                        // Check for additional owners to remove, collect existing row id
                                        owners.forEach(function(owner) {
                                            let exists = false;
                                            auaArr.forEach(function(aua) {
                                                if (aua === owner.userId) { exists = true; }
                                            });
                                            if (!exists) { removeOwners.push(owner.id); }
                                        });
                                        if (addOwners.length > 0) {
                                            let addArr = [];
                                            addOwners.forEach(function(addOwner) {
                                                let tObj = {
                                                    userId: addOwner,
                                                    CarId: carId
                                                };
                                                addArr.push(tObj);
                                            });
                                            db.Owner.bulkCreate(addArr).then(function() {
                                                if (removeOwners.length > 0) {
                                                    db.Owner.destroy({
                                                        where: {
                                                            id: {
                                                                $in: removeOwners
                                                            }
                                                        }
                                                    }).then(function() {
                                                        // All done!
                                                        resolve(result);
                                                    }, function() {
                                                        // Error removing additional owners, just move on without updating additional owners
                                                        resolve(result);
                                                    });
                                                }
                                            }, function() {
                                                // Error adding additional owners, just move on without updating additional owners
                                                resolve(result);
                                            });
                                        }
                                        if (removeOwners.length > 0) {
                                            db.Owner.destroy({
                                                where: {
                                                    id: {
                                                        $in: removeOwners
                                                    }
                                                }
                                            }).then(function() {
                                                // All done!
                                                resolve(result);
                                            }, function() {
                                                // Error removing additional owners, just move on without updating additional owners
                                                resolve(result);
                                            });
                                        }
                                    } else {
                                        // AUA is empty, so remove all additional owners (except for logged in user)
                                        db.Owner.destroy({
                                            where: {
                                                CarId: carId,
                                                userId: {
                                                    $ne: user.id
                                                }
                                            }
                                        }).then(function() {
                                            resolve(result);
                                        }, function() {
                                            // Error removing additional owners, just move on without updating additional owners
                                            resolve(result);
                                        });
                                    }
                                }, function() {
                                    // Error querying owners, just move on without updating additional owners
                                    resolve(result);
                                });
                            });
                        } else {
                            reject("car not found");
                        }
                    });
                    .catch(function(error) {
                    console.log("catch error on Car controller update method: " + error);
                    reject();
                });
            });
        }
    };
};