var AWS = require("aws-sdk");
var _ = require("underscore");
var moment = require("moment");
var uuid = require("uuid/v4");

function addTimeString(date) {
    return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
}

module.exports = function(db) {
    return {
        insert: function(mx) {
            return new Promise(function(resolve, reject) {
                // db.MaintenanceLog.create(mx).then(function(result) {
                //     db.Car.findById(mx.CarId).then(function(car) {
                //         if (car !== null) {
                //             car.current_mileage = mx.mileage;
                //             car.save().then(function() {
                //                 resolve(result);
                //             });
                //         } else {
                //             console.log("car " + mx.CarId + " not found to update mileage");
                //             resolve(result);
                //         }
                //     });
                // }).catch(function(error) {
                //     reject(error);
                // });

                var docClient = new AWS.DynamoDB.DocumentClient();

                var logParams = {
                    TableName: "automobile_mx_logs",
                    Item: {
                        car_id: mx.CarId,
                        id: uuid(),
                        cost: Number(mx.cost),
                        description: mx.description,
                        mileage: Number(mx.mileage),
                        servicer: mx.servicer,
                        service_date: addTimeString(mx.service_date),
                        created_at: Number(moment.utc().format("X"))
                    }
                };
                docClient.put(logParams, function(err, logData) {
                    if (err) {
                        console.error("Unable to insert mx log. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Insert mx log succeeded:", JSON.stringify(logData, null, 2));
                        var updateParams = {
                            TableName: "automobile_cars",
                            Key: {
                                id: mx.CarId
                            },
                            UpdateExpression: 'set #a = :x',
                            ConditionExpression: '#a < :x',
                            ExpressionAttributeNames: {
                                '#a': 'current_mileage'
                            },
                            ExpressionAttributeValues: {
                                ':x': Number(mx.mileage)
                            }
                        };
                        docClient.update(updateParams, function(err, updateData) {
                            if (err) {
                                if (err.message === "The conditional request failed") {
                                    console.log("current mileage update not needed");
                                    resolve(logData);
                                } else {
                                    console.error("Unable to update car. Error JSON:", JSON.stringify(err, null, 2));
                                    reject(err);
                                }
                            } else {
                                console.log("current mileage updated");
                                resolve(logData);
                            }
                        });
                    }
                });
            });
        }
        ,get: function(carId) {
            return new Promise(function(resolve, reject) {
                // db.MaintenanceLog.findAll({
                //     where: {
                //         CarId: carId
                //     }
                //     ,order: [[ 'service_date', 'DESC' ]]
                // }).then(function(results) {
                //     resolve(results);
                // }).catch(function(error) {
                //     reject(error);
                // });

                var docClient = new AWS.DynamoDB.DocumentClient();

                var params = {
                    TableName: "automobile_mx_logs",
                    IndexName: "car_id-service_date-index",
                    KeyConditions: {
                        car_id: {
                            ComparisonOperator: "EQ",
                            AttributeValueList: [
                                carId
                            ]
                        }
                    },
                    QueryFilter: {
                        "deleted_at": {
                            ComparisonOperator: "NULL"
                        }
                    },
                    ScanIndexForward: false
                };

                docClient.query(params, function (err, data) {
                    if (err) {
                        console.error("Unable to get mx logs. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                        console.log("Get mx logs succeeded");
                        resolve(data.Items);
                    }
                });
            });
        }
        ,update: function(mxId, data) {
            return new Promise(function(resolve, reject) {
                // db.MaintenanceLog.findById(mxId).then(function(mx) {
                //     if (mx !== null) {
                //         if (data.service_date) { mx.service_date = data.service_date; }
                //         if (data.mileage) { mx.mileage = data.mileage; }
                //         if (data.description) { mx.description = data.description; }
                //         if (data.cost) { mx.cost = data.cost; }
                //         if (data.servicer) { mx.servicer = data.servicer; }
                //         if (data.CarId) { mx.CarId = data.CarId; }
                //         mx.save().then(function(result) {
                //             db.Car.findById(mx.CarId).then(function(car) {
                //                 if (car !== null) {
                //                     if (mx.mileage > car.current_mileage) {
                //                         car.current_mileage = mx.mileage;
                //                         car.save().then(function() {
                //                             resolve(result);
                //                         });
                //                     } else {
                //                         resolve(result);
                //                     }
                //                 } else {
                //                     resolve(result);
                //                 }
                //             });
                //         }).catch(function(error) {
                //             reject(error);
                //         });
                //     } else {
                //         reject("maintenance not found");
                //     }
                // }).catch(function(error) {
                //     reject(error);
                // });

                var docClient = new AWS.DynamoDB.DocumentClient();

                var logParams = {
                    TableName: "automobile_mx_logs",
                    Key: {
                        car_id: data.CarId,
                        id: mxId
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
                    if (key === "CarId" || key === "id") {
                        // skip
                    } else if (key === "service_date") {
                        logParams.AttributeUpdates[key] = {
                            Action: "PUT",
                            Value: addTimeString(data[key])
                        };
                    } else if (key === "cost" || key === "mileage") {
                        logParams.AttributeUpdates[key] = {
                            Action: "PUT",
                            Value: Number(data[key])
                        };
                    } else {
                        logParams.AttributeUpdates[key] = {
                            Action: "PUT",
                            Value: data[key]
                        };
                    }
                });
                docClient.update(logParams, function(err, logData) {
                    if (err) {
                        console.error("Unable to update mx log. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Update mx log succeeded:", JSON.stringify(logData, null, 2));
                        var updateParams = {
                            TableName: "automobile_cars",
                            Key: {
                                id: data.CarId
                            },
                            UpdateExpression: 'set #a = :x',
                            ConditionExpression: '#a < :x',
                            ExpressionAttributeNames: {
                                '#a': 'current_mileage'
                            },
                            ExpressionAttributeValues: {
                                ':x': Number(data.mileage)
                            }
                        };
                        docClient.update(updateParams, function(err, updateData) {
                            if (err) {
                                if (err.message === "The conditional request failed") {
                                    console.log("current mileage update not needed");
                                    resolve(logData);
                                } else {
                                    console.error("Unable to update car. Error JSON:", JSON.stringify(err, null, 2));
                                    reject(err);
                                }
                            } else {
                                console.log("current mileage updated");
                                resolve(logData);
                            }
                        });
                    }
                });
            });
        }
        ,delete: function(mxId,carId) {
            return new Promise(function(resolve, reject) {
                // db.MaintenanceLog.findById(mxId).then(function(mx) {
                //     if (mx !== null) {
                //         db.Car.findById(mx.CarId).then(function(car) {
                //             if (car !== null) {
                //                 if (car.current_mileage === mx.mileage) {
                //                     db.MaintenanceLog.findOne({
                //                         where: {
                //                             CarId: mx.CarId
                //                             ,id: {
                //                                 $ne: mx.id
                //                             }
                //                         }
                //                         ,order: [["service_date","DESC"]]
                //                     }).then(function(lastMx) {
                //                         if (lastMx !== null) {
                //                             car.current_mileage = lastMx.mileage;
                //                         } else {
                //                             car.current_mileage = car.purchase_mileage;
                //                         }
                //                         car.save().then(function() {
                //                             mx.destroy().then(function(result) {
                //                                 resolve(result);
                //                             }).catch(function(error) {
                //                                 reject(error);
                //                             });
                //                         });
                //                     });
                //                 } else {
                //                     mx.destroy().then(function(result) {
                //                         resolve(result);
                //                     }).catch(function(error) {
                //                         reject(error);
                //                     });
                //                 }
                //             } else {
                //                 reject("maintenance car not found");
                //             }
                //         });
                //     } else {
                //         reject("maintenance not found");
                //     }
                // }).catch(function(error) {
                //     reject(error);
                // });


                var docClient = new AWS.DynamoDB.DocumentClient();
                // Update log to add deleted_at
                var logParams = {
                    TableName: "automobile_mx_logs",
                    Key: {
                        car_id: carId,
                        id: mxId
                    },
                    AttributeUpdates: {
                        deleted_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };
                docClient.update(logParams, function (err, logData) {
                    if (err) {
                        console.error("Unable to delete mx log. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Delete mx log succeeded:", JSON.stringify(logData, null, 2));
                        // resolve(logData.Attributes);
                        // Get car to see if current mileage needs to be updated
                        var carParams = {
                            TableName: "automobile_cars",
                            Key: {
                                id: carId
                            }
                        };
                        docClient.get(carParams, function(err, carData) {
                            if (err) {
                                console.error("Unable to get car. Error JSON:", JSON.stringify(err, null, 2));
                                reject(err);
                            } else {
                                if (Number(logData.Attributes.mileage) === Number(carData.Item.current_mileage)) {
                                    var oldLogParams = {
                                        TableName: "automobile_mx_logs",
                                        IndexName: "car_id-service_date-index",
                                        KeyConditions: {
                                            car_id: {
                                                ComparisonOperator: "EQ",
                                                AttributeValueList: [
                                                    carId
                                                ]
                                            }
                                        },
                                        QueryFilter: {
                                            "deleted_at": {
                                                ComparisonOperator: "NULL"
                                            }
                                        },
                                        ScanIndexForward: false
                                    };
                                    docClient.query(oldLogParams, function (err, oldLogData) {
                                        if (err) {
                                            console.error("Unable to get mx logs. Error JSON:", JSON.stringify(err, null, 2));
                                            reject(err);
                                        } else {
                                            console.log("Get mx logs succeeded");
                                            var updateParams = {
                                                TableName: "automobile_cars",
                                                Key: {
                                                    id: carId
                                                },
                                                AttributeUpdates: {
                                                    current_mileage: {
                                                        Action: "PUT",
                                                        Value: Number(oldLogData.Items[0].mileage)
                                                    }
                                                }
                                            };
                                            docClient.update(updateParams, function(err, updateData) {
                                                if (err) {
                                                    console.error("Unable to update car. Error JSON:", JSON.stringify(err, null, 2));
                                                    reject(err);
                                                } else {
                                                    console.log("current mileage updated");
                                                    resolve(logData.Attributes);
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    console.log("current mileage update not needed");
                                    resolve(logData.Attributes);
                                }
                            }
                        });
                    }
                });
            });
        }
        ,dataXfer: function() {
            return new Promise(function(resolve,reject) {
                console.log("starting mx log transfer");
                function getLogs(offset) {
                    console.log("starting offset: "+offset);
                    db.MaintenanceLog.findAll({
                        order: [['service_date', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying mx logs: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0) {
                        var params = {
                            RequestItems: {
                                "automobile_mx_logs": []
                            }
                        };

                        results.forEach(function (result) {
                            var obj = {
                                PutRequest: {
                                    Item: {
                                        id: result.id.toString(),
                                        service_date: moment.utc(result.service_date).format('YYYY-MM-DDTHH:mm:ss[Z]'),
                                        mileage: Number(result.mileage),
                                        description: result.description,
                                        cost: Number(result.cost),
                                        servicer: result.servicer,
                                        car_id: result.CarId.toString(),
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            params.RequestItems.automobile_mx_logs.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log("mx logs transfer complete");
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    var docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err, data) {
                        if (err) {
                            console.error("Unable to xfer mx log data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getLogs(offset);
                        }
                    });
                }

                getLogs(0);
            });
        }
    };
};