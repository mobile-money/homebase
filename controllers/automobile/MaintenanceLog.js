// const _ = require('underscore');

module.exports = function(db) {
    return {
        delete: function(user, mxId) {
            return new Promise(function(resolve, reject) {
                db.MaintenanceLog.findById(mxId).then(function(mx) {
                    if (mx !== null) {
                        db.Car.validateAccess(user, mx.CarId).then(function() {
                            db.Car.findById(mx.CarId).then(function(car) {
                                if (car !== null) {
                                    if (car.current_mileage === mx.mileage) {
                                        db.MaintenanceLog.findOne({
                                            where: {
                                                CarId: mx.CarId
                                                ,id: {
                                                    $ne: mx.id
                                                }
                                            }
                                            ,order: [["service_date","DESC"]]
                                        }).then(function(lastMx) {
                                            if (lastMx !== null) {
                                                car.current_mileage = lastMx.mileage;
                                            } else {
                                                car.current_mileage = car.purchase_mileage;
                                            }
                                            car.save().then(function() {
                                                mx.destroy().then(function(result) {
                                                    resolve(result);
                                                }).catch(function(error) {
                                                    reject(error);
                                                });
                                            });
                                        });
                                    } else {
                                        mx.destroy().then(function(result) {
                                            resolve(result);
                                        }).catch(function(error) {
                                            reject(error);
                                        });
                                    }
                                } else {
                                    reject("maintenance car not found");
                                }
                            });
                        }, function() {
                            reject('unauthorized');
                        });
                    } else {
                        reject("maintenance not found");
                    }
                }).catch(function(error) {
                    console.log("catch error on MaintenanceLog controller delete method: " + error);
                    reject();
                });
            });
        }
        ,get: function(user, carId) {
            return new Promise(function(resolve, reject) {
                db.Car.validateAccess(user, carId).then(function() {
                    db.MaintenanceLog.findAll({
                        where: { CarId: carId }
                        ,order: [[ 'service_date', 'DESC' ]]
                    }).then(function(results) {
                        resolve(results);
                    });
                }, function() {
                    reject('unauthorized');
                }).catch(function(error) {
                    console.log("catch error on MaintenanceLog controller get method: " + error);
                    reject();
                });
            });
        }
        ,insert: function(user, mx) {
            return new Promise(function(resolve, reject) {
                db.Car.validateAccess(user, mx.CarId).then(function() {
                    db.MaintenanceLog.create(mx).then(function(result) {
                        db.Car.findById(mx.CarId).then(function(car) {
                            if (car !== null) {
                                car.current_mileage = mx.mileage;
                                car.save().then(function() {
                                    resolve(result);
                                });
                            } else {
                                console.log("car " + mx.CarId + " not found to update mileage");
                                resolve(result);
                            }
                        });
                    });
                }, function() {
                    reject('unauthorized');
                }).catch(function(error) {
                    console.log("catch error on MaintenanceLog controller insert method: " + error);
                    reject();
                });
            });
        }
        ,update: function(user, mxId, data) {
            return new Promise(function(resolve, reject) {
                db.Car.validateAccess(user, data.CarId).then(function() {
                    db.MaintenanceLog.findById(mxId).then(function(mx) {
                        if (mx !== null) {
                            if (data.service_date) { mx.service_date = data.service_date; }
                            if (data.mileage) { mx.mileage = data.mileage; }
                            if (data.description) { mx.description = data.description; }
                            if (data.cost) { mx.cost = data.cost; }
                            if (data.servicer) { mx.servicer = data.servicer; }
                            if (data.CarId) { mx.CarId = data.CarId; }
                            mx.save().then(function(result) {
                                db.Car.findById(mx.CarId).then(function(car) {
                                    if (car !== null) {
                                        if (mx.mileage > car.current_mileage) {
                                            car.current_mileage = mx.mileage;
                                            car.save().then(function() {
                                                resolve(result);
                                            });
                                        } else {
                                            resolve(result);
                                        }
                                    } else {
                                        resolve(result);
                                    }
                                });
                            });
                        } else {
                            reject("maintenance not found");
                        }
                    });
                }, function() {
                    reject('unauthorized');
                }).catch(function(error) {
                    console.log("catch error on MaintenanceLog controller update method: " + error);
                    reject();
                });
            });
        }
    };
};