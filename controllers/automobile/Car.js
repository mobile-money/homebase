var moment = require("moment");

module.exports = function(db) {
    return {
        insert: function(car) {
            return new Promise(function(resolve, reject) {
                db.Car.create(car).then(function(result) {
                    resolve(result);
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,get: function(params) {
            params.active = true;
            return new Promise(function(resolve, reject) {
                db.Car.findAll({
                    where: params
                    // where: {
                    //     active: true
                    // }
                    ,order: [[ 'make', 'ASC' ]]
                }).then(function(results) {
                    resolve(results);
                }).catch(function(error) {
                    reject(error);
                })
            });
        }
        ,update: function(carId, data) {
            return new Promise(function(resolve, reject) {
                db.Car.findOne({
                    where: {
                        id: carId
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
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    } else {
                        reject("car not found");
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,delete: function(carId) {
            return new Promise(function(resolve, reject) {
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
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,getInactive: function() {
            return new Promise(function(resolve, reject) {
                db.Car.findAll({
                    where: {
                        active: false
                    }
                    ,order: [['make', 'ASC']]
                }).then(function(results) {
                    resolve(results);
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,reactivate: function(id) {
            return new Promise(function(resolve, reject) {
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
                }).catch(function(error) {
                    reject(error);
                });
            });
        }

    };
};