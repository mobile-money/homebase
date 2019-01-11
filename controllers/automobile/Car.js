const moment = require("moment");
const _ = require('underscore');

module.exports = function(db, admin) {
    return {
        delete: function(user, carId) {
            return new Promise(function(resolve, reject) {
                db.Owner.validateCarMaster(user.id, carId).then(function() {
                    db.Car.findOne({
                        where: {
                            id: carId
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
                    });
                }, function() {
                    reject("unauthorized");
                }).catch(function(error) {
                    console.log("catch error on Car controller delete method: " + error);
                    reject();
                });
            });
        }
        ,get: function(user, params) {
            params.active = true;
            return new Promise(function(resolve, reject) {
                db.Owner.getAllowedCars(user.id).then(function(ac) {
                    if (params.hasOwnProperty("id")) {
                        if (_.indexOf(ac,Number(params.id)) === -1) {
                            reject('unauthorized');
                        }
                    } else {
                        params.id = { $in: ac };
                    }

                    db.Car.findAll({
                        where: params
                        ,order: [[ 'make', 'ASC' ]]
                        ,include: [{
                            model: db.Owner
                        }]
                    }).then(function(results) {
                        // Extract all the owners of the returned Cars
                        let ownerIds = [];
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
                                additional_owners: []
                            };
                            result.Owners.forEach(function(owner) {
                                // Exclude the currently logged in user
                                if (owner.userId !== user.id) {
                                    tObj.additional_owners.push({id: owner.userId});
                                    ownerIds.push(owner.userId);
                                }
                                // Set car master
                                if (owner.master) {
                                    if (owner.userId === user.id) {
                                        tObj.master = true;
                                    }
                                }
                            });
                            finResults.push(tObj);
                        });
                        // Create an array of only unique values
                        ownerIds = _.uniq(ownerIds);

                        if (ownerIds.length > 0) {
                            // Query for the identified owners
                            admin.User.findAll({
                                where: {
                                    id: {
                                        $in: ownerIds
                                    }
                                }
                            }).then(function(owners) {
                                owners.forEach(function(owner) {
                                    finResults.forEach(function(finResult) {
                                        finResult.additional_owners.forEach(function(additional_owner) {
                                            if (additional_owner.id === owner.id) {
                                                // additional_owner.id = cryptojs.MD5(owner.id+'_padding').toString();
                                                additional_owner.first_name = owner.firstName;
                                                additional_owner.last_name = owner.lastName;
                                            }
                                        });
                                    });
                                });
                                resolve(finResults);
                            }, function() {
                                // couldn't get additional owners, so just return without them
                                resolve(finResults);
                            });
                        } else {
                            resolve(finResults);
                        }
                    });
                }, function() {
                    reject();
                }).catch(function(error) {
                    console.log("catch error on Car controller get method: " + error);
                    reject();
                });
            });
        }
        ,getInactive: function(user) {
            return new Promise(function(resolve, reject) {
                db.Owner.getAllowedCars(user.id).then(function(ac) {
                    db.Car.findAll({
                        where: {
                            active: false,
                            id: {
                                $in: ac
                            }
                        }
                        ,order: [['make', 'ASC']]
                        ,include: [{
                            model: db.Owner
                        }]
                    }).then(function(results) {
                        // Extract all the owners of the returned Cars
                        let ownerIds = [];
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
                                additional_owners: []
                            };
                            result.Owners.forEach(function(owner) {
                                // Exclude the currently logged in user
                                if (owner.userId !== user.id) {
                                    tObj.additional_owners.push({id: owner.userId});
                                    ownerIds.push(owner.userId);
                                }
                                // Set car master
                                if (owner.master) {
                                    if (owner.userId === user.id) {
                                        tObj.master = true;
                                    }
                                }
                            });
                            finResults.push(tObj);
                        });
                        // Create an array of only unique values
                        ownerIds = _.uniq(ownerIds);

                        if (ownerIds.length > 0) {
                            // Query for the identified owners
                            admin.User.findAll({
                                where: {
                                    id: {
                                        $in: ownerIds
                                    }
                                }
                            }).then(function(owners) {
                                owners.forEach(function(owner) {
                                    finResults.forEach(function(finResult) {
                                        finResult.additional_owners.forEach(function(additional_owner) {
                                            if (additional_owner.id === owner.id) {
                                                // additional_owner.id = cryptojs.MD5(owner.id+'_padding').toString();
                                                additional_owner.first_name = owner.firstName;
                                                additional_owner.last_name = owner.lastName;
                                            }
                                        });
                                    });
                                });
                                resolve(finResults);
                            }, function() {
                                // couldn't get additional owners, so just return without them
                                resolve(finResults);
                            });
                        } else {
                            resolve(finResults);
                        }
                    });
                }, function() {
                    reject();
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
                        db.Car.create(car).then(function(result) {
                            let bulkArr = [{
                                userId: foundUser.id,
                                CarId: result.id,
                                master: true
                            }];
                            if (car.hasOwnProperty("aua")) {
                                const arr = JSON.parse(car.aua);
                                if (arr) {
                                    arr.forEach(function(val) {
                                        // const bytes = cryptojs.AES.decrypt(val,'1M1x%SQ%');
                                        // const decrypt = bytes.toString(cryptojs.enc.Utf8);
                                        // const parts = decrypt.split("_");
                                        const tObj = {
                                            // userId: parts[0],
                                            userId: val,
                                            CarId: result.id,
                                            master: false
                                        };
                                        bulkArr.push(tObj);
                                    });
                                }
                            }
                            db.Owner.bulkCreate(bulkArr).then(function() {
                                resolve(result);
                            }, function(error) {
                                result.destroy().then(function() {
                                    reject('error associating users and cars: ' + error);
                                },function() {
                                    reject('error associating users and cars: ' + error);
                                })
                            });
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
                db.Owner.validateCarMaster(user.id, carId).then(function() {
                    db.Car.findById(carId).then(function(car) {
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
                }, function() {
                    reject('unauthorized');
                }).catch(function(error) {
                    console.log("catch error on Car controller update method: " + error);
                    reject();
                });
            });
        }
    };
};