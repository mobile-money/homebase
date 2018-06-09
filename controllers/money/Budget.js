var AWS = require("aws-sdk");
var _ = require("underscore");
var moment = require("moment");
var uuid = require("uuid/v4");

function addTimeString(date) {
    return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
}

module.exports = function(db) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
				// 	db.Budget.findAll({
				// 		order: [["name", "ASC"]]
				// 	}).then(function(results) {
				// 		resolve(results);
				// 	}).catch(function(error) {
				// 		reject(error);
				// 	});

				var docClient = new AWS.DynamoDB.DocumentClient();
				var params = {
					TableName: "bank_budgets",
					ScanFilter: {
						id: {
							ComparisonOperator: "NOT_NULL",
						},
						deleted_at: {
							ComparisonOperator: "NULL"
						}
					}
				};

				docClient.scan(params, function (err, data) {
					if (err) {
						console.error("Unable to get budgets. Error JSON:", JSON.stringify(err, null, 2));
						reject(err);
					} else {
						// console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
						console.log("Get budgets succeeded");
						resolve(_.sortBy(data.Items,"name"));
					}
				});
			});
		}
		,getById: function(id) {
			return new Promise(function(resolve, reject) {
				// db.Budget.findById(id).then(function(result) {
				// 	resolve(result);
				// }).catch(function(error) {
				// 	reject(error);
				// });

                var docClient = new AWS.DynamoDB.DocumentClient();
                var params = {
                    TableName: "bank_budgets",
                    Key: {
                        id: id
                    }
                };

                docClient.get(params, function (err, data) {
                    if (err) {
                        console.error("Unable to get budgets. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                        console.log("Get budgets succeeded: ", JSON.stringify(data, null, 2));
                        resolve(data.Item);
                    }
                });
			});
		}
		,add: function(data) {
			return new Promise(function(resolve, reject) {
				// db.Budget.create({
				// 	name: data.name
				// 	,amounts: data.amounts
				// }).then(function(budget) {
				// 	resolve(budget);
				// }).catch(function(error) {
				// 	reject(error);
				// });

                var docClient = new AWS.DynamoDB.DocumentClient();

                var id = uuid();
                var params = {
                    TableName: "bank_budgets",
                    Item: {
                        id: id,
                        name: data.name.trim(),
                        amounts: data.amounts,
						favorite: false,
                        created_at: Number(moment.utc().format("X"))
                    }
                };

                docClient.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to insert budget. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Insert budget succeeded:", JSON.stringify(data, null, 2));
                        resolve(data);
                    }
                });
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				// db.Budget.findById(data.id).then(function(budget) {
				// 	if (budget !== null) {
				// 		budget.name = data.name;
				// 		budget.amounts = data.amounts;
				// 		budget.save()
				// 		.then(
				// 			function() {
				// 				budget.reload();
				// 				resolve(budget);
				// 			}
				// 		)
				// 	} else {
				// 		reject({code: 1});
				// 	}
				// }).catch(function(error) {
				// 	reject({code: -1, error: error});
				// });

                var docClient = new AWS.DynamoDB.DocumentClient();

                var params = {
                    TableName: "bank_budgets",
                    Key: {
                        id: data.id
                    },
                    AttributeUpdates: {
                    	name: {
                    		Action: "PUT",
							Value: data.name.trim()
						},
                        amounts: {
                            Action: "PUT",
                            Value: data.amounts
                        },
                        updated_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update budget. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Update budget succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				// db.Budget.destroy({
				// 	where: {
				// 		id: id
				// 	}
				// }).then(function(rows) {
				// 	if (rows === 1) {
				// 		resolve();
				// 	} else {
				// 		reject({code: 1});
				// 	}
				// }).catch(function(error) {
				// 	reject({code: -1, error: error});
				// });

                var docClient = new AWS.DynamoDB.DocumentClient();

                var params = {
                    TableName: "bank_budgets",
                    Key: {
                        id: data.id
                    },
                    AttributeUpdates: {
                        deleted_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to delete budget. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Delete budget succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
			});
		}
		/* todo: need to complete this once transactions are sorted*/
		,values: function(id, start, end) {
			return new Promise(function(resolve, reject) {
				db.Budget.findById(id).then(function(budg) {
					var amounts = JSON.parse(budg.amounts);
					var categoryIds = _.keys(amounts);
					db.Transaction.findAll({
						where: {
							CategoryId: {
								$in: categoryIds
							}
							,transactionDate: {
								$gte: moment.unix(start)
								,$lte: moment.unix(end)
							}
						}
					}).then(function(trans) {
						var totals = {};
						for (var i = 0; i < categoryIds.length; i++) {
							var budTotal = 0;
							for (var k = 0; k < trans.length; k++) {
								if (Number(trans[k].CategoryId) === Number(categoryIds[i])) {
									budTotal += trans[k].amount;
								}
							}
							totals[categoryIds[i]] = budTotal;
						}
						// Get multi transactions
                        db.Transaction.findAll({
                            where: {
                                CategoryId: "1"
                                , transactionDate: {
                                    $gte: moment.unix(start)
                                    , $lte: moment.unix(end)
                                }
                            }
                        }).then(function(multiTrans) {
                        	if (multiTrans.length > 0) {
                        		var transIds = _.pluck(multiTrans, "id");
                        		db.CategorySplit.findAll({
									where: {
										transaction: {
											$in: transIds
										}
									}
								}).then(function(splits) {
									for (var i=0; i<splits.length; i++) {
										var data = JSON.parse(splits[i].payload);
										for (var k=0; k<data.length; k++) {
											if (totals.hasOwnProperty(data[k].id)) {
												totals[data[k].id] += data[k].value;
											}
										}
									}
                                    resolve({budget: budg, values: totals});
								});
							} else {
                                resolve({budget: budg, values: totals});
                            }
						});
					});
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,favorite: function(id) {
			return new Promise(function(resolve, reject) {
				// db.Budget.update({
				// 	favorite: false
				// }
				// ,{
				// 	where: {
				// 		favorite: true
				// 	}
				// }).then(function() {
				// 	db.Budget.update({
				// 		favorite: true
				// 	}
				// 	,{
				// 		where: {
				// 			id: id
				// 		}
				// 	}).then(function(resp) {
				// 		resolve(resp);
				// 	});
				// }).catch(function(error) {
				// 	reject(error);
				// });

                var docClient = new AWS.DynamoDB.DocumentClient();

                var scanParams = {
                    TableName: "bank_budgets",
                    ScanFilter: {
                        favorite: {
                            ComparisonOperator: "EQ",
                            AttributeValueList: [
                            	true
							]
                        }
                    }
                };

                docClient.scan(scanParams, function(err, scanData) {
                    if (err) {
                        console.error("Unable to get favorite budget. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Get favorite budget succeeded:", JSON.stringify(scanData, null, 2));
                        if (scanData.Items.length > 0) {
                        	// Need to unfavorite previous favorite
                            var unfavoriteParams = {
                                TableName: "bank_budgets",
                                Key: {
                                    id: scanData.Items[0].id
                                },
                                AttributeUpdates: {
                                    favorite: {
                                        Action: "PUT",
                                        Value: false
                                    },
                                    updated_at: {
                                        Action: "PUT",
                                        Value: Number(moment.utc().format("X"))
                                    }
                                },
                                ReturnValues: "ALL_NEW"
                            };
                            docClient.update(unfavoriteParams, function(err, unfavoriteData) {
                                if (err) {
                                    console.error("Unable to update unfavorite budget. Error JSON:", JSON.stringify(err, null, 2));
                                    reject(err);
                                } else {
                                    console.log("Update unfavorite budget succeeded:", JSON.stringify(unfavoriteData, null, 2));
                                    // Now, update the new favorite
                                    var favoriteParams = {
                                        TableName: "bank_budgets",
                                        Key: {
                                            id: id
                                        },
                                        AttributeUpdates: {
                                            favorite: {
                                                Action: "PUT",
                                                Value: true
                                            },
                                            updated_at: {
                                                Action: "PUT",
                                                Value: Number(moment.utc().format("X"))
                                            }
                                        },
                                        ReturnValues: "ALL_NEW"
                                    };
                                    docClient.update(favoriteParams, function(err, favoriteData) {
                                        if (err) {
                                            console.error("Unable to update favorite budget. Error JSON:", JSON.stringify(err, null, 2));
                                            reject(err);
                                        } else {
                                            console.log("Update favorite budget succeeded:", JSON.stringify(favoriteData, null, 2));
                                            resolve(favoriteData.Attributes);
                                        }
                                    });
                                }
                            });
						} else {
                            var favoriteParams = {
                                TableName: "bank_budgets",
                                Key: {
                                    id: id.toString()
                                },
                                AttributeUpdates: {
                                    favorite: {
                                        Action: "PUT",
                                        Value: true
                                    },
                                    updated_at: {
                                        Action: "PUT",
                                        Value: Number(moment.utc().format("X"))
                                    }
                                },
                                ReturnValues: "ALL_NEW"
                            };
                            docClient.update(favoriteParams, function(err, favoriteData) {
                                if (err) {
                                    console.error("Unable to update favorite budget. Error JSON:", JSON.stringify(err, null, 2));
                                    reject(err);
                                } else {
                                    console.log("Update favorite budget succeeded:", JSON.stringify(favoriteData, null, 2));
                                    resolve(favoriteData.Attributes);
                                }
                            });
						}
                    }
                });
			});
		}
        ,dataXfer: function() {
            return new Promise(function(resolve,reject) {
                console.log("starting budget transfer");
                function getBudgets(offset) {
                    console.log("starting offset: "+offset);
                    db.Budget.findAll({
                        order: [['id', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying budgets: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0) {
                        var params = {
                            RequestItems: {
                                "bank_budgets": []
                            }
                        };

                        results.forEach(function (result) {
                            var obj = {
                                PutRequest: {
                                    Item: {
                                        id: result.id.toString(),
                                        name: result.name,
										amounts: result.amounts,
                                        favorite: false,
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            if (result.favorite === true) {
                                obj.PutRequest.Item.favorite = true;
                            }
                            params.RequestItems.bank_budgets.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log("budget transfer complete");
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    var docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err, data) {
                        if (err) {
                            console.error("Unable to xfer budgets data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getBudgets(offset);
                        }
                    });
                }

                getBudgets(0);
            });
        }
	};
};