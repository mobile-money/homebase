// const AWS = require("aws-sdk");
// const docClient = new AWS.DynamoDB.DocumentClient();
const _ = require("underscore");
const moment = require("moment");
const uuid = require("uuid/v4");

function addTimeString(date) {
    return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
}

// function addIdToArr(array) {
//     array.forEach(function(item) {
//         item.id = item._id;
//     });
//
//     return array;
// }
//
// function addIdToObj(obj) {
//     obj.id = obj._id;
//     return obj;
// }

module.exports = function(db,docClient) {
    return {
        insert: function(car) {
            return new Promise(function(resolve, reject) {
                /* FIXME: LEGACY
                db.Car.create(car).then(function(result) {
                    resolve(result);
                }).catch(function(error) {
                    reject(error);
                });
                */

                let params = {
                    TableName: "automobile_cars",
                    Item: {
                        id: uuid(),
                        active: true,
                        created_at: Number(moment.utc().format("X"))
                    }
                };

                _.keys(car).forEach(function(key) {
                    if (key === "purchase_date" || key === "sold_date") {
                        params.Item[key] = addTimeString(car[key])
                    } else {
                        params.Item[key] = car[key];
                    }
                });

                docClient.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to insert car. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Insert car succeeded:", JSON.stringify(data, null, 2));
                        resolve(data);
                    }
                });
            });
        }
        ,get: function(params) {
            // params.active = true;
            return new Promise(function(resolve, reject) {
                /* FIXME: LEGACY
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
                });
                */

                // console.log(params);
                if (!params.hasOwnProperty("id")) {
                    let scanParams = {
                        TableName: "automobile_cars",
                        ScanFilter: {
                            id: {
                                ComparisonOperator: "NOT_NULL"
                            },
                            active: {
                                ComparisonOperator: "EQ",
                                AttributeValueList: [
                                    true
                                ]
                            }
                        }
                    };
                    docClient.scan(scanParams, function (err, data) {
                        if (err) {
                            console.error("Unable to get active cars. Error JSON:", JSON.stringify(err, null, 2));
                            reject(err);
                        } else {
                            console.log("Get active cars succeeded:", JSON.stringify(data, null, 2));
                            resolve(data.Items);
                        }
                    });
                } else {
                    let getParams = {
                        TableName: "automobile_cars",
                        Key: {
                            id: params.id
                        }
                    };
                    docClient.get(getParams, function(err, data) {
                        if (err) {
                            console.error("Unable to get car "+params.id+". Error JSON:", JSON.stringify(err, null, 2));
                            reject(err);
                        } else {
                            console.log("Get car "+params.id+" succeeded:", JSON.stringify(data, null, 2));
                            resolve([data.Item]);
                        }
                    });
                }
            });
        }
        ,update: function(carId, data) {
            return new Promise(function(resolve, reject) {
                /* FIXME: LEGACY
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
                */

                let params = {
                    TableName: "automobile_cars",
                    Key: {
                        id: carId
                    },
                    AttributeUpdates: {
                        updated_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                _.keys(data).forEach(function(key) {
                    if (key === "purchase_date" || key === "sold_date") {
                        params.AttributeUpdates[key] = {
                            Action: "PUT",
                            Value: addTimeString(data[key])
                        };
                    } else {
                        params.AttributeUpdates[key] = {
                            Action: "PUT",
                            Value: data[key]
                        };
                    }
                });

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update car. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Update car succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
            });
        }
        ,delete: function(carId) {
            return new Promise(function(resolve, reject) {
                /* FIXME: LEGACY
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
                */

                let params = {
                    TableName: "automobile_cars",
                    Key: {
                        id: carId
                    },
                    AttributeUpdates: {
                        updated_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        },
                        active: {
                            Action: "PUT",
                            Value: false
                        },
                        sold_date: {
                            Action: "PUT",
                            Value: moment.utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to deactivate car. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Deactivate car succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
            });
        }
        ,getInactive: function() {
            return new Promise(function(resolve, reject) {
                /* FIXME: LEGACY
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
                */

                let params = {
                    TableName: "automobile_cars",
                    ScanFilter: {
                        id: {
                            ComparisonOperator: "NOT_NULL"
                        },
                        active: {
                            ComparisonOperator: "EQ",
                            AttributeValueList: [
                                false
                            ]
                        }
                    }
                };

                docClient.scan(params, function (err, data) {
                    if (err) {
                        console.error("Unable to get inactive cars item. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Get inactive cars succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Items);
                    }
                });
            });
        }
        ,reactivate: function(id) {
            return new Promise(function(resolve, reject) {
                /* FIXME: LEGACY
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
                */

                let params = {
                    TableName: "automobile_cars",
                    Key: {
                        id: id
                    },
                    AttributeUpdates: {
                        updated_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        },
                        active: {
                            Action: "PUT",
                            Value: true
                        },
                        sold_date: {
                            Action: "DELETE"
                        }
                    }
                };

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to deactivate car. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Deactivate car succeeded:", JSON.stringify(data, null, 2));
                        resolve();
                    }
                });
            });
        }
        ,dataXfer: function(start,max) {
            return new Promise(function(resolve,reject) {
                db.Car.findAll({
                    order: [[ 'make', 'ASC' ]],
                    limit: max
                }).then(function(results) {
                    let params = {
                        RequestItems: {
                            "automobile_cars": []
                        }
                    };

                    results.forEach(function(result) {
                        let obj = {
                            PutRequest: {
                                Item: {
                                    id: result.id.toString(),
                                    make: result.make,
                                    model: result.model,
                                    year: Number(result.year),
                                    vin: result.vin,
                                    license_plate: result.license_plate,
                                    purchase_mileage: result.purchase_mileage,
                                    current_mileage: result.current_mileage,
                                    active: result.active,
                                    created_at: Number(moment.utc().format("X")),
                                    purchase_date: moment.utc(result.purchase_date).format('YYYY-MM-DDTHH:mm:ss[Z]')
                                }
                            }
                        };
                        if (result.sold_date) {
                            obj.PutRequest.Item.sold_date = moment.utc(result.sold_date).format('YYYY-MM-DDTHH:mm:ss[Z]');
                        }
                        params.RequestItems.automobile_cars.push(obj);
                    });
                    docClient.batchWrite(params, function(err,data) {
                        if (err) {
                            console.error("Unable to xfer car data. Error JSON:", JSON.stringify(err, null, 2));
                            reject(err);
                        } else {
                            console.log("Xfer car data succeeded:", JSON.stringify(data, null, 2));
                            resolve(params);
                        }
                    });

                }).catch(function(error) {
                    reject(error);
                });
            });
        }
    };
};