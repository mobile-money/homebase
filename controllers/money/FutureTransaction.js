const AWS = require("aws-sdk");
const _ = require("underscore");
const moment = require("moment");
const uuid = require("uuid/v4");

function addTimeString(date) {
    return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
}

function getFutureTransaction(docClient, account_id, id) {
	return new Promise(function(resolve, reject) {
        let params = {
            TableName: "bank_future_transactions",
            Key: {
                account_id: account_id,
                id: id
            }
        };

        docClient.get(params, function(err, data) {
			if (err) {
                console.error("Unable to get future transaction "+id+". Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
			} else {
				console.log("Get future transaction " + id + " succeeded");
				resolve(data.Item);
			}
        });
	});
}

function getLatestSummaries(docClient, account_id, limit) {
	return new Promise(function(resolve, reject) {
        let params = {
            TableName: "bank_summaries",
            IndexName: "account_id-start-index",
            KeyConditions: {
                account_id: {
                    ComparisonOperator: "EQ",
                    AttributeValueList: [
                        account_id
                    ]
                }
            },
            ScanIndexForward: false,
            Limit: Number(limit)
        };

        docClient.query(params, function (err, data) {
        	if (err) {
                console.error("Unable to get summaries for "+account_id+". Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
			} else {
                console.log("Get summaries for "+account_id+" succeeded");
        		resolve(data.Items);
			}
        });
	});
}

function createTransaction(docClient, trans, summ_id, pDate) {
	return new Promise(function(resolve, reject) {
        let transParams = {
            TableName: "bank_transactions",
            Item: {
            	summary_id: summ_id.toString(),
                id: trans.id.toString(),
				postDate: addTimeString(moment(pDate,"MM/DD/YYYY").format("YYYY-MM-DD")),
                transactionDate: trans.transactionDate,
                payee: trans.payee.trim(),
                amount: Number(trans.amount),
                created_at: Number(trans.created_at),
                updated_at: Number(moment.utc().format("X"))
            }
        };

        if (trans.hasOwnProperty("description") && trans.description !== "") {
            transParams.Item.description = trans.description.trim();
        }
        if (trans.hasOwnProperty("category_id") && trans.category_id !== "") {
            transParams.Item.category_id = trans.category_id.toString();
        }
        if (trans.hasOwnProperty("checkNumber") && trans.checkNumber !== "") {
            transParams.Item.checkNumber = Number(trans.checkNumber);
        }
        if (trans.hasOwnProperty("xfer") && trans.xfer !== "") {
            transParams.Item.xfer = trans.xfer.toString();
        }
        if (trans.hasOwnProperty("bill_id") && trans.bill_id !== "") {
            transParams.Item.bill_id = trans.bill_id.toString();
        }

        // console.log(transParams);
        docClient.put(transParams, function(err, data) {
            if (err) {
                console.error("Unable to insert transaction. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("Insert transaction succeeded:", JSON.stringify(data, null, 2));
                resolve(transParams.Item);
            }
        });
	});
}

function deleteFutureTransaction(docClient, trans) {
	return new Promise(function(resolve, reject) {
		let params = {
			TableName: "bank_future_transactions",
			Key: {
				account_id: trans.account_id.toString(),
				id: trans.id.toString()
			}
		};

		docClient.delete(params,function(err, data) {
			if (err) {
                console.error("Unable to delete future transaction. Error JSON:", JSON.stringify(err, null, 2));
				reject(err);
			} else {
                console.log("Delete future transaction succeeded:", JSON.stringify(data, null, 2));
                resolve();
			}
		});
	});
}

function createSummary(docClient, account_id, initial_balance, start_month, start_year) {
	return new Promise(function (resolve, reject) {
        let id = uuid();
        let start_date = moment(start_month+"-"+start_year, "MM-YYYY").startOf("month").format("YYYY-MM-DDTHH:mm:ss[Z]");
        let end_date = moment(start_month+"-"+start_year, "MM-YYYY").endOf("month").format("YYYY-MM-DDTHH:mm:ss[Z]");
        let params = {
            TableName: 'bank_summaries',
            Item: {
                account_id: account_id.toString(),
                id: id.toString(),
                balance: Number(initial_balance),
                initial: false,
                start: start_date,
                end: end_date,
                created_at: Number(moment.utc().format("X"))
            }
        };
        docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to create summary. Error JSON:", JSON.stringify(err, null, 2));
				reject(err);
            } else {
                console.log("Create summary succeeded:", JSON.stringify(data, null, 2));
				resolve(id);
            }
        });
	});

}

const updateSummaries = (docClient,summary_array, increment_amount) => {
    const Promise = require("bluebird");
    AWS.config.setPromisesDependency(Promise);
    console.log(`Mapping ${summary_array.length} summaries`);
    return Promise.map(summary_array, (summary) => {
        console.log(`Updating summary ${summary.id}...`);
        let params = {
            TableName: "bank_summaries",
            Key: {
                account_id: summary.account_id,
                id: summary.id
            },
            AttributeUpdates: {
                balance: {
                    Action: "PUT",
                    Value: summary.balance + Number(increment_amount),
                },
                updated_at: {
                    Action: "PUT",
                    Value: Number(moment.utc().format("X"))
                }
            },
            ReturnValues: "ALL_NEW"
        };
        return docClient.update(params)
            .promise()
            .then((data) => {
                console.log(`Updated summary ${summary.id}...`);
                console.log(data);
                return data;
            });
    });
};

module.exports = function(db/*, Transaction*/) {
	return {
		getByAccountId: function(id) {
			return new Promise(function(resolve, reject) {
				// db.FutureTransaction.findAll({
				// 	where: { AccountId: id }
				// 	,include: [{ model: db.Category }]
				// 	,order: [["transactionDate", "DESC"]]
				// }).then(function(results) {
				// 	resolve(results);
				// }).catch(function(error) {
				// 	reject(error);
				// });

                let docClient = new AWS.DynamoDB.DocumentClient();
                let params = {
                    TableName: "bank_future_transactions",
                    IndexName: "account_id-transactionDate-index",
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

                docClient.query(params, function (err, data) {
                    if (err) {
                        console.error(`Unable to get future transactions for ${id}. Error JSON:`, JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                        console.log(`Get future transactions for ${id} succeeded`);
                        resolve(data.Items);
                    }
                });
			});
		}
		,add: function(data) {
			return new Promise(function(resolve, reject) {
                // var newTrans = {
					// transactionDate: data.tDate
					// ,payee: data.payee
					// ,amount: data.amount
					// ,AccountId: data.account
                // };
                // if (data.description !== "") {
					// newTrans.description = data.description;
                // }
                // if (data.category !== "") {
					// newTrans.CategoryId = data.category;
                // }
                // if (data.hasOwnProperty("check") && data.check !== "") {
					// newTrans.checkNumber = data.check;
                // }
                // if (data.hasOwnProperty("xfer")) {
					// newTrans.xfer = Number(data.xfer);
                // }
                // if (data.hasOwnProperty("bill")) {
					// newTrans.BillId = data.bill;
                // }
                // db.FutureTransaction.create(newTrans).then(function(newTransaction) {
					// if (data.hasOwnProperty("multiCat")) {
					// 	db.CategorySplit.create({
					// 		transaction: newTransaction.id
					// 		,payload: data.multiCat
					// 	}).then(function(split) {
					// 		resolve(newTransaction);
					// 	},function(splitError) {
					// 		console.log("error creating category split: " + splitError);
					// 	});
					// } else {
                //         resolve(newTransaction);
                //     }
                // },function(error) {
					// reject(error);
                // });
                //
                let docClient = new AWS.DynamoDB.DocumentClient();

                let transId = uuid();
                let transParams = {
                    TableName: "bank_future_transactions",
                    Item: {
                        id: transId,
						account_id: data.account.toString(),
                        transactionDate: addTimeString(moment(data.tDate,"MM/DD/YYYY").format("YYYY-MM-DD")),
                        payee: data.payee.trim(),
                        amount: Number(data.amount),
						future: true,
						created_at: Number(moment.utc().format("X"))
                    }
                };

                if (data.hasOwnProperty("description") && data.description !== "") {
                	transParams.Item.description = data.description.trim();
				}
                if (data.hasOwnProperty("category") && data.category !== "") {
                	transParams.Item.category_id = data.category.toString();
				}
                if (data.hasOwnProperty("check") && data.check !== "") {
                	transParams.Item.checkNumber = Number(data.check);
				}
                if (data.hasOwnProperty("xfer") && data.xfer !== "") {
                	transParams.Item.xfer = data.xfer.toString();
				}
                if (data.hasOwnProperty("bill") && data.bill !== "") {
                	transParams.Item.bill_id = data.bill.toString();
				}

				// console.log(transParams);
                docClient.put(transParams, function(err, data) {
                    if (err) {
                        console.error("Unable to insert future transaction. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Insert future transaction succeeded:", JSON.stringify(data, null, 2));
                        resolve(transParams.Item);
                    }
                });
            });
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				// db.FutureTransaction.findById(data.id).then(function(transaction) {
				// 	if (transaction !== null) {
				// 		transaction.payee = data.payee;
				// 		transaction.transactionDate = data.tDate;
				// 		transaction.description = data.description;
				// 		transaction.checkNumber = data.check;
				// 		transaction.amount = data.amount;
				// 		transaction.CategoryId = data.category;
				// 		transaction.save().then(function (transaction) {
				// 			transaction.reload();
				// 			resolve(transaction);
				// 		});
				// 	} else {
				// 		reject();
				// 	}
				// }).catch(function(error) {
				// 	reject(error);
				// });

				// console.log(data);
                let docClient = new AWS.DynamoDB.DocumentClient();

                let params = {
                    TableName: "bank_future_transactions",
                    Key: {
                        id: data.id.toString(),
						account_id: data.account.toString()
                    },
                    AttributeUpdates: {
                        updated_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                if (data.hasOwnProperty("payee") && data.payee !== "") {
                    params.AttributeUpdates.payee = {
                        Action: "PUT",
                        Value: data.payee.trim()
                    };
                }
                if (data.hasOwnProperty("tDate") && data.tDate !== "") {
                    params.AttributeUpdates.transactionDate = {
                        Action: "PUT",
                        Value: addTimeString(moment(data.tDate,"MM/DD/YYYY").format("YYYY-MM-DD"))
                    };
                }
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
                if (data.hasOwnProperty("check") && data.check !== "") {
                    params.AttributeUpdates.checkNumber = {
                        Action: "PUT",
                        Value: Number(data.check)
                    };
                } else {
                    params.AttributeUpdates.checkNumber = {
                        Action: "DELETE"
                    };
                }
                if (data.hasOwnProperty("amount") && data.amount !== "") {
                    params.AttributeUpdates.amount = {
                        Action: "PUT",
                        Value: Number(data.amount)
                    };
                }
                if (data.hasOwnProperty("category") && data.category !== "") {
                    params.AttributeUpdates.category_id = {
                        Action: "PUT",
                        Value: data.category.toString()
                    };
                } else {
                    params.AttributeUpdates.category_id = {
                        Action: "DELETE"
                    };
                }

                docClient.update(params, function(err, retData) {
                    if (err) {
                        console.error("Unable to update future transaction. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Update future transaction succeeded:", JSON.stringify(retData, null, 2));
                        resolve(retData.Attributes);
                    }
                });
			});
		}
		,delete: function(id,account_id) {
			return new Promise(function(resolve, reject) {
				// db.FutureTransaction.destroy({
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
                    TableName: "bank_future_transactions",
                    Key: {
                        id: id.toString(),
                        account_id: account_id.toString()
                    }
                };

                docClient.delete(params, function(err, data) {
                    if (err) {
                        console.error("Unable to delete future transaction. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Delete future transaction succeeded:", JSON.stringify(data, null, 2));
                        resolve();
                    }
                });

            });
		}
		,commit: function(data) {
			return new Promise(function(resolve, reject) {
				// resolve(data);
                let docClient = new AWS.DynamoDB.DocumentClient();
                // get future transaction
                getFutureTransaction(docClient,data.account,data.id).then(function(ft) {
                    // get the last <=4 summaries with account_id, sorted by end date DESC
                    getLatestSummaries(docClient,data.account,4).then(function(sums) {
                        // loop through the return and check for transaction date being between start and end of summary (or intial=true)
                        // there should always be at least one return; initial
                        // console.log(sums);
                        if (sums.length > 0) {
                            if (moment(data.pDate,"MM/DD/YYYY").isAfter(moment(sums[0].start)) && moment(data.pDate,"MM/DD/YYYY").isBefore(moment(sums[0].end))) {
                                // transaction date falls inside of the latest summary, use it and increment balance by transaction amount
                                console.log("current summary");
                                createTransaction(docClient,ft,sums[0].id,data.pDate).then(function(newTrans) {
                                	updateSummaries(docClient, [sums[0]], ft.amount).then(function(/*sums*/) {
                                        deleteFutureTransaction(docClient, ft).then(function() {
                                            resolve(newTrans);
                                        });
									});
                                }).catch(function(err) {
                                    console.log(`current summary error: ${err}`);
                                    reject(err);
                                });
                            } else if (moment(data.pDate,"MM/DD/YYYY").isAfter(moment(sums[0].end))) {
                                // transaction is after latest summary, create a new one with balance of latest plus transaction amount
                                console.log("new current summary");
                                let newBalance = sums[0].balance + ft.amount;
                                let startMonth = moment(data.pDate,"MM/DD/YYYY").format("MM");
                                let startYear = moment(data.pDate,"MM/DD/YYYY").format("YY");
                                createSummary(docClient,data.account,newBalance,startMonth,startYear).then(function(newSumId) {
                                    createTransaction(docClient,ft,newSumId,data.pDate).then(function(newTrans) {
                                        deleteFutureTransaction(docClient, ft).then(function() {
                                            resolve(newTrans);
                                        });
                                    });
                                }).catch(function(err) {
                                    console.log(`new current summary error: ${err}`);
                                    reject(err);
                                });
                            } else {
                                // loop through returned summaries to try to find the one that the transaction falls into
                                let ind = -1;
                                for (let i=0; i<sums.length; i++) {
                                    if (moment(data.pDate,"MM/DD/YYYY").isAfter(moment(sums[i].start)) && moment(data.pDate,"MM/DD/YYYY").isBefore(moment(sums[i].end))) {
                                        ind = i;
                                    }
                                }
                                if (ind === -1) {
                                    // summary not found for transaction
                                    // find the first summary with an end date before the transaction date, this is the summary most prior to the transaction
                                    // initial summary should always satisfy this condition
                                    for (let k=0; k<sums.length; k++) {
                                        if (moment(data.pDate,"MM/DD/YYYY").isAfter(moment(sums[i].end))) {
                                            ind = k;
                                        }
                                    }
                                    if (ind === -1) {
                                        // something didn't go right, nothing found
                                        reject("something didn't go right, nothing found");
                                    } else {
                                        // create a new summary using the balance of the identified summary [k] and increment it by transaction amount
                                        // increment the balance of every summary after the identified one [k]
                                        console.log("new old summary");
                                        let newBalance = sums[ind].balance + ft.amount;
                                        let startMonth = moment(data.pDate,"MM/DD/YYYY").format("MM");
                                        let startYear = moment(data.pDate,"MM/DD/YYYY").format("YY");
                                        createSummary(docClient,data.account,newBalance,startMonth,startYear).then(function(newSumId) {
                                            createTransaction(docClient,ft,newSumId,data.pDate).then(function(newTrans) {
                                                updateSummaries(docClient,_.first(sums,ind),ft.amount).then(function(/*sums*/) {
                                                    deleteFutureTransaction(docClient, ft).then(function() {
                                                        resolve(newTrans);
                                                    });
                                                });
                                            });
                                        }).catch(function(err) {
                                            console.log(`new old summary error: ${err}`);
                                            reject(err);
                                        });
                                    }
                                } else {
                                    // add the transaction with the identified summary [i], and increment this summary and every summary after it by the transaction amount
                                    console.log("old summary");
                                    createTransaction(docClient,ft,sums[ind].id,data.pDate).then(function(newTrans) {
                                        updateSummaries(docClient, _.first(sums,ind+1), ft.amount).then(function(/*sums*/) {
                                            deleteFutureTransaction(docClient, ft).then(function() {
                                                resolve(newTrans);
                                            });
                                        });
                                    }).catch(function(err) {
                                        console.log(`old summary error: ${err}`);
                                        reject(err);
                                    });
                                }
                            }
                        } else {
                            console.log(`There were no summaries returned for ${data.id}`);
                            reject("No summaries returned");
                        }
					});
				}).catch(function(err) {
                    console.log(`general transaction commit error: ${err}`);
                    reject(err);
				});



				// db.FutureTransaction.findById(data.id).then(function(fTrans) {
				// 	// console.log(fTrans);
				// 	if (fTrans === null) {
				// 		reject({code: 1});
				// 	} else {
				// 		var newTran = {
				// 			account: fTrans.AccountId
				// 			,pDate: data.pDate
				// 			,tDate: moment(fTrans.transactionDate).format("MM/DD/YYYY")
				// 			,payee: fTrans.payee
				// 			,description: fTrans.description
				// 			,amount: fTrans.amount
				// 		};
				// 		if (fTrans.checkNumber !== null) {
				// 			newTran.check = fTrans.checkNumber;
				// 		}
                 //        if (fTrans.xfer !== null) {
                 //            newTran.xfer = fTrans.xfer;
                 //        }
				// 		if (fTrans.CategoryId !== null) {
				// 			newTran.category = fTrans.CategoryId;
				// 		}
				// 		if (fTrans.BillId !== null) {
				// 			newTran.bill = fTrans.BillId;
				// 		}
				// 		// console.log(newTran);
				// 		Transaction.add(newTran).then(function(nTrans) {
				// 			// console.log("nTrans ID: " + nTrans.newTransaction.id);
				// 			if (fTrans.CategoryId === 1) {
				// 				db.CategorySplit.findOne({
				// 					where: { transaction: fTrans.id }
				// 				}).then(function(split) {
				// 					// console.log("split ID: " + split.id);
				// 					split.update({
				// 						transaction: nTrans.newTransaction.id
				// 					}).then(function() {
                 //                        db.FutureTransaction.destroy({
                 //                            where: {id: data.id}
                 //                        }).then(function (rows) {
                 //                            if (rows === 1) {
                 //                                resolve(nTrans);
                 //                            } else {
                 //                                reject({code: 2});
                 //                            }
                 //                        });
				// 					});
				// 				});
				// 			} else {
                 //                db.FutureTransaction.destroy({
                 //                    where: {id: data.id}
                 //                }).then(function (rows) {
                 //                    if (rows === 1) {
                 //                        resolve(nTrans);
                 //                    } else {
                 //                        reject({code: 2});
                 //                    }
                 //                });
                 //            }
				// 		});
				// 	}
				// }).catch(function(error) {
				// 	reject({code: 0, error: error});
				// });
			});
		}
        ,dataXfer: function() {
            return new Promise(function(resolve) {
                console.log("starting future transactions transfer");
                function getFTrans(offset) {
                    console.log("starting offset: "+offset);
                    db.FutureTransaction.findAll({
                        order: [['id', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying future transactions: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0) {
                        let params = {
                            RequestItems: {
                                "bank_future_transactions": []
                            }
                        };

                        results.forEach(function (result) {
                            let obj = {
                                PutRequest: {
                                    Item: {
                                        account_id: result.AccountId.toString(),
                                        id: result.id.toString(),
                                        transactionDate: moment(result.transactionDate).format("YYYY-MM-DDTHH:mm:ss[Z]"),
                                        amount: Number(result.amount),
                                        payee: result.payee,
                                        future: false,
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            if (result.future) {
                                obj.PutRequest.Item.future = true;
                            }
                            if (result.checkNumber) {
                                obj.PutRequest.Item.checkNumber = result.checkNumber;
                            }
                            if (result.CategoryId) {
                                obj.PutRequest.Item.category_id = result.CategoryId.toString();
                            }
                            if (result.BillId) {
                                obj.PutRequest.Item.bill_id = result.BillId.toString();
                            }
                            if (result.description) {
                                obj.PutRequest.Item.description = result.description;
                            }
                            if (result.xfer) {
                                obj.PutRequest.Item.xfer = result.xfer.toString();
                            }
                            params.RequestItems.bank_future_transactions.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log("future transaction transfer complete");
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    let docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err) {
                        if (err) {
                            console.error("Unable to xfer future transaction data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getFTrans(offset);
                        }
                    });
                }
                getFTrans(0);
            });
        }
	}
};