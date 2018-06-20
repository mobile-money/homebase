// const AWS = require("aws-sdk");
// const docClient = new AWS.DynamoDB.DocumentClient();
const _ = require("underscore");
const moment = require("moment");
const uuid = require("uuid/v4");

// function addTimeString(date) {
//     return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
// }

module.exports = function(db,docClient) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
			    /* FIXME: LEGACY
				db.Account.findAll({
					where: {
						active: true
					}
					,order: [['name', 'ASC']]
					,include: [
						{
							model: db.Summary
							,separate: true
							,order: [['start', 'DESC']]
						}
						,{
							model: db.Position
						}
					]
				})
				.then(
					function(results) {
						resolve(results);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
				*/

                let scanParams = {
                    TableName: "bank_accounts",
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
                docClient.scan(scanParams, function (err, acctData) {
                    if (err) {
                        console.error("Unable to get active accounts. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get active accounts succeeded:", JSON.stringify(acctData, null, 2));
                        acctData.Items = _.sortBy(acctData.Items, "name");
                        resolve(acctData.Items);
                    }
                });
			});
		}
		,getAllPlus: function() {
			return new Promise(function(resolve, reject) {
			    let scanParams = {
                    TableName: "bank_accounts",
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
                docClient.scan(scanParams, function (err, acctData) {
                    if (err) {
                        console.error("Unable to get active accounts. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get active accounts succeeded:", JSON.stringify(acctData, null, 2));
                        console.log("Get active accounts succeeded");
                        let count = 0;
                        acctData.Items = _.sortBy(acctData.Items, "name");
                        acctData.Items.forEach(function(item){
                            let summParams = {
                                TableName: "bank_summaries",
                                IndexName: "account_id-start-index",
                                KeyConditions: {
                                    account_id: {
                                        ComparisonOperator: "EQ",
                                        AttributeValueList: [
                                        	item.id
										]
                                    }
                                },
                                ScanIndexForward: false,
                                Limit: 1
                            };

                            docClient.query(summParams, function (err, summData) {
                                if (err) {
                                    console.error("Unable to get summaries for "+item.name+". Error JSON:", JSON.stringify(err, null, 2));
                                    reject(err);
                                } else {
                                    // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                                    // console.log("Get summaries for "+item.name+" succeeded");
                                    item.Summaries = summData.Items;
                                    item.Positions = []; // Remove this once querying of Positions is implemented
                                    count++;
                                    if (count === acctData.Items.length) {
                                        resolve(acctData.Items);
                                    }
                                }
                            });
						});

                    }
                });
			});
		}
		,create: function(newAccount) {
			return new Promise(function(resolve, reject) {
			    /* FIXME: LEGACY
                function legacy() {
                    return new Promise(function(resolve,reject) {
                        db.Account.create({
                            name: newAccount.name.trim()
                            ,type: newAccount.type.trim()
                            ,default: newAccount.default
                        })
                            .then(
                                function(account) {
                                    if (newAccount.type.trim() !== "Investment") {
                                        db.Summary.create({
                                            balance: newAccount.balance
                                            ,initial: true
                                        })
                                            .then(
                                                function(summary) {
                                                    account.addSummary(summary)
                                                        .then(
                                                            function(account) {
                                                                account.reload();
                                                                resolve(account);
                                                            }
                                                        );
                                                }
                                            );
                                    } else {
                                        resolve(account);
                                    }
                                }
                            )
                            .catch(
                                function(error) {
                                    reject(error);
                                }
                            );
                    });
                }
                */

                let acctId = uuid();
                let acctParams = {
                    TableName: "bank_accounts",
                    Item: {
                        id: acctId,
                        name: newAccount.name.trim(),
                        type: newAccount.type.trim(),
                        default: newAccount.default,
                        active: true,
                        created_at: Number(moment.utc().format("X"))
                    }
                };

                docClient.put(acctParams, function(err, acctData) {
                    if (err) {
                        console.error("Unable to insert account. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Insert account succeeded:", JSON.stringify(acctData, null, 2));
                        let summParams = {
                            TableName: "bank_summaries",
                            Item: {
                                id: uuid(),
                                account_id: acctId,
                                balance: Number(newAccount.balance),
                                initial: true,
                                start: moment.utc("0","X").format("YYYY-MM-DDT[00:00:00Z]"),
                                end: moment.utc("0","X").format("YYYY-MM-DDT[23:59:59Z]"),
                                created_at: Number(moment.utc().format("X"))
                            }
                        };
                        docClient.put(summParams, function(err, summData) {
                            if (err) {
                                console.error("Unable to insert summary. Error JSON:", JSON.stringify(err, null, 2));
                                reject(err);
                            } else {
                                console.log("Insert summary succeeded:", JSON.stringify(summData, null, 2));
                                resolve({account: acctId});
                            }
                        });
                    }
                });
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
			    /* FIXME: LEGACY
                function legacy() {
                    return new Promise(function(resolve,reject) {
                        db.Account.update({
                                active: false
                            }
                            ,{
                                where: {
                                    id: id
                                }
                            }).then(function(result) {
                            if (result[0] === 1) {
                                resolve();
                            } else {
                                reject("There was a problem deleting the account");
                            }
                        }).catch(function(error) {
                            reject(error);
                        });
                    });
                }
                */

                let params = {
                    TableName: "bank_accounts",
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
                            Value: false
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                docClient.update(params, function(err, retData) {
                    if (err) {
                        console.error("Unable to delete account. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Delete account succeeded:", JSON.stringify(retData, null, 2));
                        resolve(retData.Attributes);
                    }
                });
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
			    /* FIXME: LEGACY
                function legacy() {
                    return new Promise(function(resolve,reject) {
                        db.Account.findById(data.id).then(function(result) {
                            if (result !== null) {
                                result.name = data.name;
                                result.type = data.type;
                                result.default = data.default;
                                result.save()
                                    .then(
                                        function(result) {
                                            result.reload();
                                            resolve(result);
                                        }
                                    );
                            } else {
                                reject();
                            }
                        }).catch(
                            function(error) {
                                reject(error);
                            });
                    });
                }
                */

                let params = {
                    TableName: "bank_accounts",
                    Key: {
                        id: data.id
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
                    if (key === "id") {
                        // skip
                    } else if (key === "default") {
                        if (data.default === "true") {
                            params.AttributeUpdates[key] = {
                                Action: "PUT",
                                Value: true
                            };
                        } else {
                            params.AttributeUpdates[key] = {
                                Action: "PUT",
                                Value: false
                            };
                        }
                    } else {
                        params.AttributeUpdates[key] = {
                            Action: "PUT",
                            Value: data[key]
                        };
                    }
                });

                docClient.update(params, function(err, retData) {
                    if (err) {
                        console.error("Unable to update account. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Update account succeeded:", JSON.stringify(retData, null, 2));
                        resolve(retData.Attributes);
                    }
                });
			});
		}
		,getInvestments: function(id) {
			return new Promise(function(resolve, reject) {
				let returnObj = {};
				// db.Account.findById(id).then(function(account) {
				// 	if (account === null) {
				// 		// account not found
				// 		reject({code: 1});
				// 	} else {
				// 		if (account.type !== "Investment") {
				// 			// account not investment
				// 			reject({code: 2});
				// 		} else {
				// 			db.Position.findAll({
				// 				where: {
				// 					AccountId: id
				// 				}
				// 				,order: [["ticker", "ASC"]]
				// 			}).then(function(positions) {
				// 				if (positions === null) {
				// 					reject({code: 3});
				// 				} else {
				// 					returnObj.positions = positions;
				// 					var positionIds = [];
				// 					var i = 0;
				// 					var len = positions.length;
				// 					for (i; i < len; i++) {
				// 						positionIds.push(positions[i].id);
				// 					}
				// 					db.Trade.findAll({
				// 						where: {
				// 							PositionId: {
				// 								$in: positionIds
				// 							}
				// 						}
				// 						,order: [["transactionDate", "DESC"]]
				// 					}).then(function(trades) {
				// 						returnObj.trades = trades;
				// 						resolve(returnObj);
				// 					});
				// 				}
				// 			});
				// 		}
				// 	}
				// }).catch(function(error) {
				// 	reject({code: 99, error: error});
				// });

				let posParams = {
				    TableName: "bank_positions",
                    KeyConditions: {
                        account_id: {
                            ComparisonOperator: "EQ",
                            AttributeValueList: [
                                id
                            ]
                        }
                    },
                    ScanIndexForward: false
                };

				docClient.query(posParams, function(err, data) {
				    if (err) {
                        console.error("Unable to get positions for account "+id+". Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
				        // console.log(data);
				        if (data.Items.length > 0) {
                            returnObj.positions = data.Items;
                            let positionIds = [];
                            let i = 0;
                            let len = data.Items.length;
                            for (i; i < len; i++) {
                                positionIds.push(data.Items[i].id);
                            }

                            let tradeParams = {
                                TableName: "bank_trades",
                                ScanFilter: {
                                    position_id: {
                                        ComparisonOperator: "IN",
                                        AttributeValueList: positionIds
                                    }
                                }
                            };

                            docClient.scan(tradeParams, function(err,data) {
                                if (err) {
                                    console.error("Unable to get trades for account "+id+". Error JSON:", JSON.stringify(err, null, 2));
                                    reject(err);
                                } else {
                                    // console.log(data);
                                    returnObj.trades = data.Items;
                                    resolve(returnObj);
                                }
                            });
                        } else {
                            reject({code: 3});
                        }
                    }
                });
			});
		}
		,getInactive: function() {
			return new Promise(function(resolve, reject) {
			    /* FIXME: LEGACY
				db.Account.findAll({
					where: {
						active: false
					}
					,order: [['name', 'ASC']]
					,include: [
						{
							model: db.Summary
							,separate: true
							,order: [['start', 'DESC']]
						}
						,{
							model: db.Position
						}
					]
				}).then(function(results) {
						resolve(results);
				}).catch(function(error) {
						reject(error);
				});
				*/

                let scanParams = {
                    TableName: "bank_accounts",
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
                docClient.scan(scanParams, function (err, acctData) {
                    if (err) {
                        console.error("Unable to get active accounts. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Get active accounts succeeded:", JSON.stringify(acctData, null, 2));
                        let count = 0;
                        acctData.Items = _.sortBy(acctData.Items, "name");
                        acctData.Items.forEach(function(item){
                            let summParams = {
                                TableName: "bank_summaries",
                                IndexName: "account_id-start-index",
                                KeyConditions: {
                                    account_id: {
                                        ComparisonOperator: "EQ",
                                        AttributeValueList: [
                                            item.id
                                        ]
                                    }
                                },
                                ScanIndexForward: false
                            };

                            docClient.query(summParams, function (err, summData) {
                                if (err) {
                                    console.error("Unable to get summaries for "+item.name+". Error JSON:", JSON.stringify(err, null, 2));
                                    reject(err);
                                } else {
                                    // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                                    console.log("Get summaries for "+item.name+" succeeded");
                                    item.Summaries = summData.Items;
                                    item.Positions = []; // Remove this once querying of Positions is implemented
                                    count++;
                                    if (count === acctData.Items.length) {
                                        resolve(acctData.Items);
                                    }
                                }
                            });
                        });

                    }
                });

            });
		}
		,reactivate: function(id) {
			return new Promise(function(resolve, reject) {
			    /* FIXME: LEGACY
                function legacy() {
                    return new Promise(function(resolve,reject) {
                        db.Account.update({
                                active: true
                            }
                            ,{
                                where: {
                                    id: id
                                }
                            }).then(function(result) {
                            if (result[0] === 1) {
                                resolve();
                            } else {
                                reject("There was a problem reactivating the account");
                            }
                        }).catch(function(error) {
                            reject(error);
                        });
                    });
                }
                */

                let params = {
                    TableName: "bank_accounts",
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
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                docClient.update(params, function(err, retData) {
                    if (err) {
                        console.error("Unable to reactivate account. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Reactivate account succeeded:", JSON.stringify(retData, null, 2));
                        resolve(retData.Attributes);
                    }
                });
			});
		}
        ,dataXfer: function(start,max) {
            return new Promise(function(resolve) {
                console.log("starting account transfer");
                let totalCount = 0;
                function getAccounts(offset) {
                    console.log("starting offset: "+offset);
                    db.Account.findAll({
                        order: [['id', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying accounts: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0 && offset <= max) {
                        totalCount += results.length;
                        let params = {
                            RequestItems: {
                                "bank_accounts": []
                            }
                        };

                        results.forEach(function (result) {
                            let obj = {
                                PutRequest: {
                                    Item: {
                                        id: result.id.toString(),
                                        name: result.name,
                                        type: result.type,
										default: false,
										active: false,
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            if (result.default) {
                            	obj.PutRequest.Item.default = true;
							}
							if (result.active) {
                            	obj.PutRequest.Item.active = true;
							}
                            params.RequestItems.bank_accounts.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log(`account transfer complete. transferred ${totalCount} items`);
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    docClient.batchWrite(params, function (err) {
                        if (err) {
                            console.error("Unable to xfer accounts data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getAccounts(offset);
                        }
                    });
                }

                getAccounts(start);
            });
        }
    };
};