const request = require('request');
const AWS = require("aws-sdk");
const _ = require("underscore");
const moment = require("moment");
const uuid = require("uuid/v4");

// function addTimeString(date) {
//     return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
// }

const bulkUpdateBills = (bill_array) => {
    const Promise = require("bluebird");
	AWS.config.setPromisesDependency(Promise);
    let docClient = new AWS.DynamoDB.DocumentClient();

	let chunked_bills = _.chunk(bill_array,25);

    return Promise.map(chunked_bills, (chunk) => {
        console.log(`Updating chunk of ${chunk.length} bills...`);
        let params = {
        	RequestItems: {
        		"bank_bills": []
			}
        };
        let updatedDate = moment().format("YYYY-MM-DD");
        chunk.forEach(function(bill) {
        	params.RequestItems.bank_bills.push({
				PutRequest: {
					Item: {
						id: bill.id,
						account_id: bill.account_id,
                        lastAdded: updatedDate
					}
				}
			});
		});
        return docClient.update(params)
            .promise()
            .then((data) => {
                console.log(`Updated last ${chunk.length} bills...`);
                return data;
            });
    });
};

module.exports = function(db) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
				// db.Bill.findAll({
				// 	order: [['payee', 'ASC']]
				// 	,include: [{model: db.Account}, {model: db.Category}]
				// }).then(function(results) {
				// 	resolve(results);
				// }).catch(function(error) {
				// 	reject(error);
				// });


                let docClient = new AWS.DynamoDB.DocumentClient();
                let params = {
                    TableName: "bank_bills",
                    ScanFilter: {
                        account_id: {
                            ComparisonOperator: "NOT_NULL",
                        },
                        deleted_at: {
                            ComparisonOperator: "NULL"
                        }
                    }
                };

                docClient.scan(params, function (err, data) {
                    if (err) {
                        console.error("Unable to get bills. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                        console.log("Get bills succeeded");
                        resolve(data.Items);
                    }
                });
			});
		}
		,create: function(newBill) {
			return new Promise(function(resolve, reject) {
				console.log(newBill);
				// var obj = {
				// 	payee: newBill.payee.trim()
				// 	,startDate: moment.utc(newBill.startDate, "MM/DD/YYYY")
				// 	,frequency: newBill.frequency
				// 	,every: newBill.every
				// 	,amount: newBill.amount
				// 	,automatic: newBill.automatic
				// 	,AccountId: newBill.account
				// 	,CategoryId: newBill.category
				// }
				// if (newBill.hasOwnProperty("description")) {
				// 	obj.description = newBill.description.trim();
				// }
				// if (newBill.onThe !== null) {
				// 	obj.onThe = newBill.onThe;
				// 	if (Number(newBill.onThe) > 31) {
				// 		obj.onThe = 31;
				// 	}
				// }
				// db.Bill.create(obj).then(function(bill) {
				// 	resolve(bill);
				// }).catch(function(error) {
				// 	reject(error);
				// });



                let docClient = new AWS.DynamoDB.DocumentClient();

                let id = uuid();
                let params = {
                    TableName: "bank_bills",
                    Item: {
                    	account_id: newBill.account.toString(),
                        id: id,
                        payee: newBill.payee.trim(),
                        startDate: moment.utc(newBill.startDate,"MM/DD/YYYY").format("YYYY-MM-DD"),
						frequency: newBill.frequency,
						every: Number(newBill.every),
						amount: Number(newBill.amount),
						automatic: false,
                        created_at: Number(moment.utc().format("X"))
                    }
                };
                if (newBill.automatic === 'true') {
                    params.Item.automatic = true;
                }
                if (newBill.hasOwnProperty("category")) {
					params.Item.category_id = newBill.category.toString();
				}
				if (newBill.hasOwnProperty("description")) {
                	params.Item.description = newBill.description.trim();
				}
				if (newBill.hasOwnProperty("onThe")) {
                	if (Number(newBill.onThe) > 31) {
                		params.Item.onThe = 31;
					} else {
                		params.Item.onThe = Number(newBill.onThe);
					}
				}

                docClient.put(params, function(err/*, data*/) {
                    if (err) {
                        console.error("Unable to insert bill. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log(`Insert bill succeeded. ID: ${id}`);
                        resolve(id);
                    }
                });
            });
		}
		,delete: function(data) {
			return new Promise(function(resolve, reject) {
				// db.Bill.destroy({
				// 	where: { id: id }
				// }).then(function(rows) {
				// 	if (rows === 1) {
				// 		resolve();
				// 	} else {
				// 		reject();
				// 	}
				// }).catch(function(error) {
				// 	reject(error);
				// });


                let docClient = new AWS.DynamoDB.DocumentClient();

                let params = {
                    TableName: "bank_bills",
                    Key: {
                        id: data.id,
						account_id: data.account_id
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
                        console.error("Unable to delete bill. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Delete bill succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				// db.Bill.findById(data.id).then(function(result) {
				// 	if (result !== null) {
				// 		result.payee = data.payee.trim();
				// 		result.startDate = data.startDate;
				// 		result.frequency = data.frequency;
				// 		result.every = data.every;
				// 		result.amount = data.amount;
				// 		result.automatic = data.automatic;
				// 		result.AccountId = data.account;
				// 		if (data.hasOwnProperty("category")) {
				// 			result.CategoryId = data.category;
				// 		} else {
				// 			result.CategoryId = null;
				// 		}
				// 		if (data.hasOwnProperty("description")) {
				// 			result.description = data.description.trim();
				// 		} else {
				// 			result.description = null;
				// 		}
				// 		if (data.onThe !== null) {
				// 			result.onThe = data.onThe;
				// 			if (Number(data.onThe) > 31) {
				// 				result.onThe = 31;
				// 			}
				// 		}
				// 		result.save().then(function(result) {
				// 			result.reload();
				// 			resolve(result);
				// 		});
				// 	} else {
				// 		reject();
				// 	}
				// }).catch(function(error) {
				// 	reject(error);
				// });

				console.log(data);

                let docClient = new AWS.DynamoDB.DocumentClient();
                let params = {
                    TableName: "bank_bills",
                    Key: {
                        id: data.id.toString(),
						account_id: data.account.toString()
                    },
                    AttributeUpdates: {
                        payee: {
                            Action: "PUT",
                            Value: data.payee.trim()
                        },
						startDate: {
                        	Action: "PUT",
							Value: moment(data.startDate, "MM/DD/YYYY").format("YYYY-MM-DD")
						},
						amount: {
                        	Action: "PUT",
							Value: Number(data.amount)
						},
						frequency: {
                        	Action: "PUT",
							Value: data.frequency
						},
						every: {
                        	Action: "PUT",
							Value: Number(data.every)
						},
                        updated_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                if (data.hasOwnProperty("description") && data.description !== "") {
                	params.AttributeUpdates.description = {
                        Action: "PUT",
						Value: data.description.trim()
                    };
				} else {
                    params.AttributeUpdates.description = {
                        Action: "DELETE"
                    };
				}

                if (data.hasOwnProperty("category")) {
                	params.AttributeUpdates.category_id = {
                        Action: "PUT",
						Value: data.category.toString()
                    };
				} else {
                    params.AttributeUpdates.category_id = {
                        Action: "DELETE"
                    };
				}

				if (data.hasOwnProperty("onThe")) {
                    if (Number(data.onThe) > 31) {
                        params.AttributeUpdates.onThe = {
                            Action: "PUT",
                            Value: 31
                        };
                    } else {
                        params.AttributeUpdates.onThe = {
                            Action: "PUT",
                            Value: Number(data.onThe)
                        };
                    }
				} else {
                    params.AttributeUpdates.onThe = {
                        Action: "DELETE"
                    };
				}

                if (data.automatic === "true") {
                    params.AttributeUpdates.automatic = {
                        Action: "PUT",
                        Value: true
                    };
                } else {
                    params.AttributeUpdates.automatic = {
                        Action: "PUT",
                        Value: false
                    };
                }

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update bill. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Update bill succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
			});
		}
		,postNew: function(/*id*/) {
			return new Promise(function(resolve, reject) {
				// only add bills up to 30 days in advance
                let endDate = moment.utc().add(30, 'd');
                let billsToUpdate = [];
                // get all bills
				this.getAll().then(function(bills) {
                    let newTrans = [];
                    bills.forEach(function(bill) {
                        let needToUpdate = false;
                        // start to create the updated transaction object
                        let toAdd = {
                            payee: bill.payee
                            ,description: bill.description
                            ,amount: bill.amount
                            ,account_id: bill.account_id
                            ,category_id: bill.category_id
                            ,bill_id: bill.id
                            ,dates: []
                        };
                        // index date is either the start date of the bill, or the last added date
                        let indexDate = moment.utc(bill.startDate);
                        if (bill.lastAdded !== null) {
                            indexDate = moment.utc(bill.lastAdded);
                        }
                        // this inly applies to monthly bills
                        if (bill.frequency === "M") {
                        	// make sure that indexDate is either set to the onThe parameter or the valid end of the month
                            if (bill.onThe === -1 || bill.onThe > indexDate.endOf("month").date()) {
                                indexDate.endOf("month");
                            } else {
                                indexDate.date(bill.onThe);
                            }
                            // cycle through each day of the bill frequency between the indexDate and the next 30 days
                            while (indexDate <= endDate) {
                            	// if indexDate is different than the current lastAdded date, mark this transaction as needToUpdate,
								// add this indexDate to the date array, and add the bill to the billsToUpdate array
                                if (indexDate.format("MM/DD/YYYY") !== moment.utc(bill.lastAdded).format("MM/DD/YYYY")) {
                                    needToUpdate = true;
                                    billsToUpdate.push(bill);
                                    toAdd.dates.push(indexDate.format("MM/DD/YYYY"));
                                }
                                // add a month to index date
                                indexDate.add(bill.every, "M");
                                // make sure indexDate did not overflow the months dates
                                if (bill.onThe === -1 || bill.onThe > indexDate.endOf("month").date()) {
                                    indexDate.endOf("month");
                                } else {
                                    indexDate.date(bill.onThe);
                                }
                            }
                        } else {
                            while (indexDate <= endDate) {
                                if (indexDate.format("MM/DD/YYYY") !== moment.utc(bill.lastAdded).format("MM/DD/YYYY")) {
                                    needToUpdate = true;
                                    billsToUpdate.push(bill);
                                    toAdd.dates.push(indexDate.format("MM/DD/YYYY"));
                                }
                                indexDate.add(bill.every, bill.frequency);
                            }
                        }
                        // add the transaction to the newTrans array if the needToUpdate flag is true
                        if (needToUpdate) {
                            newTrans.push(toAdd);
                        }
                    });

                    newTrans.forEach(function(trans) {
                        if (trans.dates.length > 0) {
                            let lastDate;
                            for (let i = 0; i < trans.dates.length; i++) {
                                lastDate = trans.dates[i];
                                let body = {
                                    account: trans.account_id
                                    ,description: trans.description
                                    ,tDate: trans.dates[i]
                                    ,payee: trans.payee
                                    ,amount: trans.amount
                                    ,bill: trans.bill_id
                                    ,category: trans.category_id
                                };
                                request.post("http://localhost:3000/api/v1/money/futureTransactions", {
                                    json: true
                                    ,body: body
                                }, function(error/*, response, body*/) {
                                    if (error) {
                                        console.error(error);
                                    } else {
                                    	console.log(`added transaction for ${trans.payee} added per bill ${trans.bill_id}`);
									}
                                });
                            }
                        }
                    });
                    billsToUpdate = _.uniq(billsToUpdate,true);
                    bulkUpdateBills(billsToUpdate).then(function() {
						billsToUpdate.forEach(function(bill) {

						});
					});
                    resolve({new_trans: newTrans, bills: bills});
				}).catch(function(err) {
					reject(err);
				});
				// db.Bill.findAll({
				// 	// where: { AccountId: id }
				// }).then(function(bills) {
				// 	var newTrans = [];
				// 	bills.forEach(function(bill) {
				// 		var needToUpdate = false;
				// 		var toAdd = {
				// 			payee: bill.payee
				// 			,description: bill.description
				// 			,amount: bill.amount
				// 			,AccountId: bill.AccountId
				// 			,CategoryId: bill.CategoryId
				// 			,BillId: bill.id
				// 			,dates: []
				// 		};
				// 		var indexDate = moment.utc(bill.startDate);
				// 		if (bill.lastAdded !== null) {
				// 			indexDate = moment.utc(bill.lastAdded);
				// 		}
				// 		if (bill.frequency === "M") {
				// 			if (bill.onThe === -1 || bill.onThe > indexDate.endOf("month").date()) {
				// 				indexDate.endOf("month");
				// 			} else {
				// 				indexDate.date(bill.onThe);
				// 			}
				// 			while (indexDate <= endDate) {
				// 				if (indexDate.format("MM/DD/YYYY") !== moment.utc(bill.lastAdded).format("MM/DD/YYYY")) {
				// 					needToUpdate = true;
				// 					toAdd.dates.push(indexDate.format("MM/DD/YYYY"));
				// 				}
				// 				indexDate.add(bill.every, "M");
				// 				if (bill.onThe === -1 || bill.onThe > indexDate.endOf("month").date()) {
				// 					indexDate.endOf("month");
				// 				} else {
				// 					indexDate.date(bill.onThe);
				// 				}
				// 			}
				// 		} else {
				// 			while (indexDate <= endDate) {
				// 				if (indexDate.format("MM/DD/YYYY") !== moment.utc(bill.lastAdded).format("MM/DD/YYYY")) {
				// 					needToUpdate = true;
				// 					toAdd.dates.push(indexDate.format("MM/DD/YYYY"));
				// 				}
				// 				indexDate.add(bill.every, bill.frequency);
				// 			}
				// 		}
				// 		if (needToUpdate) {
                 //            newTrans.push(toAdd);
				// 		}
				// 	});
                //
				// 	newTrans.forEach(function(trans) {
				// 		if (trans.dates.length > 0) {
				// 			var lastDate;
				// 			for (var i = 0; i < trans.dates.length; i++) {
				// 				lastDate = trans.dates[i];
				// 				var body = {
				// 					account: trans.AccountId
				// 					,description: trans.description
				// 					,tDate: trans.dates[i]
				// 					,payee: trans.payee
				// 					,amount: trans.amount
				// 					,bill: trans.BillId
				// 					,category: trans.CategoryId
				// 				};
				// 				request.post("http://localhost:3000/api/v1/money/futureTransactions", {
				// 					json: true
				// 					,body: body
				// 				}, function(error, response, body) {
				// 					if (error) {
				// 						console.log(error);
				// 					}
				// 				});
				// 			}
				// 			db.Bill.update({lastAdded: lastDate}, {
				// 				where: {id: trans.BillId}
				// 			});
				// 		}
				// 	});
				// 	resolve({new_trans: newTrans, bills: bills});
				// }).catch(function(error) {
				// 	reject(error);
				// });
			});
		}
        ,dataXfer: function() {
            return new Promise(function(resolve) {
                console.log("starting bill transfer");
                function getBills(offset) {
                    console.log("starting offset: "+offset);
                    db.Bill.findAll({
                        order: [['id', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying bills: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0) {
                        let params = {
                            RequestItems: {
                                "bank_bills": []
                            }
                        };

                        results.forEach(function (result) {
                            let obj = {
                                PutRequest: {
                                    Item: {
                                    	account_id: result.AccountId.toString(),
                                        id: result.id.toString(),
                                        payee: result.payee,
                                        startDate: moment(result.startDate).format("YYYY-MM-DD"),
										frequency: result.frequency,
										every: Number(result.every),
										amount: Number(result.amount),
										automatic: false,
                                        lastAdded: moment(result.lastAdded).format("YYYY-MM-DD"),
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            if (result.automatic === true) {
                                obj.PutRequest.Item.automatic = true;
                            }
                            if (result.CategoryId) {
                                obj.PutRequest.Item.category_id = result.CategoryId.toString();
							}
							if (result.description) {
                                obj.PutRequest.Item.description = result.description;
							}
							if (result.onThe) {
                                obj.PutRequest.Item.onThe = Number(result.onThe);
							}
                            params.RequestItems.bank_bills.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log("bill transfer complete");
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    let docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err) {
                        if (err) {
                            console.error("Unable to xfer bills data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getBills(offset);
                        }
                    });
                }
                getBills(0);
            });
        }
    };
};