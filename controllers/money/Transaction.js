// var AWS = require("aws-sdk");
const _ = require("underscore");
const moment = require("moment");
// var uuid = require("uuid/v4");

////
// function addTimeString(date) {
//     return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
// }

function getFutureTransactions(accountId,docClient) {
	return new Promise(function(resolve, reject) {
        // var docClient = new AWS.DynamoDB.DocumentClient();
        let fTransParams = {
            TableName: "bank_future_transactions",
            IndexName: "account_id-transactionDate-index",
            KeyConditions: {
                account_id: {
                    ComparisonOperator: "EQ",
                    AttributeValueList: [
                        accountId.toString()
                    ]
                }
            },
            ScanIndexForward: false
        };
        docClient.query(fTransParams, function(err, fTransData) {
        	if (err) {
                console.error("Unable to get future transactions. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
			} else {
        		if (fTransData.Items.length > 0) {
                    resolve(fTransData.Items);
        		} else {
        			resolve([]);
				}
            }
        });
	});
}

function getPostedTransactions(Summary,docClient) {
	return new Promise(function(resolve, reject) {
		// Get transactions from summary, order by post date desc
        // var docClient = new AWS.DynamoDB.DocumentClient();
        let transParams = {
            TableName: "bank_transactions",
            IndexName: "summary_id-postDate-index",
            KeyConditions: {
                summary_id: {
                    ComparisonOperator: "EQ",
                    AttributeValueList: [
                        Summary.id
                    ]
                }
            },
            ScanIndexForward: false
        };
        docClient.query(transParams, function(err, transData) {
        	// console.log(transData);
        	if (err) {
                console.error("Unable to get posted transactions. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
			} else {
                // attach summary to initial posted transaction as Summary
				if (transData.Items.length > 0) {
                    transData.Items[0].Summary = Summary;
				}
				resolve(transData.Items);
            }
        });
	});
}

// function getAllCategories() {
// 	// Get all categories and return the array
//     return new Promise(function(resolve, reject) {
// 		var docClient = new AWS.DynamoDB.DocumentClient();
//         var catParams = {
//             TableName: "bank_categories",
//             ScanFilter: {
//                 id: {
//                     ComparisonOperator: "NOT_NULL"
//                 }
//             }
//         };
//
//         docClient.scan(catParams, function (err, catData) {
//             if (err) {
//                 console.error("Unable to get categorie. Error JSON:", JSON.stringify(err, null, 2));
//                 reject(err);
//             } else {
//                 resolve(catData.Items);
//             }
//         });
//     });
// }

// function addCategoryToTransactions(itemArray, cachedCategories) {
// 	return new Promise(function(resolve, reject) {
// 		try {
//             itemArray.forEach(function(item) {
//                 if (item.category_id) {
//                     item.Categoy = _.findWhere(cachedCategories,{id: item.category_id});
//                 }
//             });
//             resolve(itemArray);
// 		} catch(e) {
// 			reject("error while adding categories to transactions: " + e);
// 		}
// 	});
// }

// function getBillsByAccount(account_id) {
//     return new Promise(function(resolve, reject) {
// 		var docClient = new AWS.DynamoDB.DocumentClient();
// 		var billParams = {
// 			TableName: "bank_bills",
// 			QueryFilter: {
// 				account_id: {
// 					ComparisonOperator: "EQ",
// 					AttributeValueList: account_id
// 				}
// 			}
// 		};
//
// 		docClient.scan(billParams, function (err, billData) {
// 			if (err) {
// 				console.error("Unable to get bills for account "+account_id+". Error JSON:", JSON.stringify(err, null, 2));
// 				reject(err);
// 			} else {
// 				resolve(billData.Items);
// 			}
// 		});
//     });
// }

// function addBillToTransactions(itemArray, cachedBills) {
//     return new Promise(function(resolve, reject) {
//     	try {
//             itemArray.forEach(function(item) {
//                 if (item.bill_id) {
//                     item.Bill = _.findWhere(cachedBills,{id: item.bill_id});
//                 }
//             });
//             resolve(itemArray);
// 		} catch(e) {
//     		reject("error while adding bills to transactions: " + e);
// 		}
//     });
// }

function getLatestSummaryForAccount(account_id,last_summ_id,docClient) {
    return new Promise(function(resolve, reject) {
        // var docClient = new AWS.DynamoDB.DocumentClient();
        let params = {
            TableName: "bank_summaries",
            KeyConditions: {
            	account_id: {
            		ComparisonOperator: "EQ",
					AttributeValueList: [
						account_id
					]
				}
			},
            ScanIndexForward: false,
			Limit: 1
        };
        if (last_summ_id !== "-1") {
        	params.ExclusiveStartKey = {
        		account_id: account_id,
				id: last_summ_id
            };
		}
        docClient.query(params, function(err, data) {
        	// console.log(data);
            if (err) {
                console.error("Unable to get latest summary for account "+account_id+". Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
            	if (data.Count === 1) {
                    resolve(data.Items[0]);
				} else {
            		reject("unexpected summary return");
				}

            }
        });
    });}

module.exports = function(db,docClient) {
	return {
		getByAccountId: function(id, last_summ_id) {
			return new Promise(function(resolve, reject) {
                let adjustAmount = 0;

				// // get all categories
				// getAllCategories().then(function(categories) {
                 //    // get all bills for account
				// 	getBillsByAccount(id.toString()).then(function(bills) {
                        // Get future transactions
                        getFutureTransactions(id.toString(),docClient).then(function(fTrans) {
                            if (fTrans.length > 0) {
                                let amounts = _.pluck(fTrans, "amount");
                                amounts.forEach(function(amount) {
                                    adjustAmount += amount;
                                });
                            }
                            let allTrans = fTrans;
                            allTrans = _.sortBy(allTrans, function(o) { return -o.transactionDate;});
                            // get latest summary for account
							getLatestSummaryForAccount(id.toString(),last_summ_id,docClient).then(function(summary) {
                                // get posted transactions from latest summary
                                getPostedTransactions(summary,docClient).then(function(pTrans) {
									allTrans = _.union(allTrans,pTrans);
                                    resolve({cTrans: allTrans, adjust: adjustAmount});
                                });
							});
                     //    });
					// });
				}).catch(function(err) {
					reject(err);
				});
			});
		}
		,getMoreByAccountId: function(id, summId) {
			return new Promise(function(resolve, reject) {
				// db.Transaction.findAll({
				// 	where: {
				// 		postDate: { $ne: null }
				// 	}
				// 	,order: [["postDate", "DESC"],["transactionDate", "DESC"]]
				// 	,include: [{
				// 		model: db.Summary
				// 		,include: [{
				// 			model: db.Account
				// 			,where: { id: Number(id) }
				// 		}]
				// 	}
				// 	,{
				// 		model: db.Category
				// 	}
				// 	,{
				// 		model: db.Bill
				// 	}]
				// 	,offset: Number(offset)
				// 	,limit: Number(limit)
				// }).then(function(pResults) {
				// 	resolve({cTrans: pResults, adjust: 0});
				// }).catch(function(error) {
				// 	reject(error);
				// });

				getLatestSummaryForAccount(id,summId,docClient).then(function(summary) {
					// console.log(summ);
                    // get posted transactions from latest summary
                    getPostedTransactions(summary,docClient).then(function(pTrans) {
                        resolve({cTrans: pTrans, newSummary: summary.id});
                    });
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		// ,getBySummaryId: function(id) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Transaction.findAll({
		// 			where: {
		// 				SummaryId: id
		// 			}
		// 			,order: [['transactionDate', 'DESC']]
		// 			,include: [
		// 				{model: db.Category}
		// 				,{model: db.Summary}
		// 				,{model: db.Bill}
		// 			]
		// 		})
		// 		.then(
		// 			function(results) {
		// 				resolve(results);
		// 			}
		// 		)
		// 		.catch(
		// 			function(error) {
		// 				reject(error);
		// 			}
		// 		);
		// 	});
		// }
		// ,getByCategoryId: function(id, start, end) {
		// 	return new Promise(function(resolve, reject) {
		// 		var startDate = moment(start, "X");
		// 		var endDate = moment(end, "X");
		// 		db.Transaction.findAll({
		// 			where: {
		// 				CategoryId: id
		// 				,transactionDate: {
		// 					$gte: startDate.format("YYYY-MM-DD")
		// 					,$lte: endDate.format("YYYY-MM-DD")
		// 				}
		// 			}
		// 			,include: [{
		// 				model: db.Summary
		// 				,include: [{
		// 					model: db.Account
		// 				}]
		// 			}
		// 			,{
		// 				model: db.Category
		// 			}
		// 			,{
		// 				model: db.Bill
		// 			}]
		// 			,order: [["transactionDate", "ASC"]]
		// 		}).then(function(results) {
		// 			resolve(results);
		// 		}).catch(function(error) {
		// 			reject(error);
		// 		});
		// 	});
		// }
		// ,add: function(data) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.sequelize.transaction().then(function(t) {
		// 			db.Account.findById(data.account).then(function(account) {
		// 				if (account !== null) {
		// 					var transactionMoment = moment.utc(data.tDate, "MM/DD/YYYY");
		// 					db.Summary.findOne({
		// 						where: {
		// 							AccountId: account.id
		// 							,initial: false
		// 							,start: {
		// 								$lte: transactionMoment.format("YYYY-MM-DD HH:mm:ss")
		// 							}
		// 							,end: {
		// 								$gte: transactionMoment.format("YYYY-MM-DD HH:mm:ss")
		// 							}
		// 						}
		// 					}).then(function(summary) {
		// 						if (summary === null) {
		// 							// create new summary
		// 							var startMoment = moment(transactionMoment).startOf("month");
		// 							var endMoment = moment(transactionMoment).endOf("month");
		// 							// console.log(endMoment);
		// 							db.Summary.findOne({
		// 								where: {
		// 									end: {
		// 										$lt: startMoment
		// 									}
		// 									,AccountId: account.id
		// 								}
		// 								,order: [['end', 'DESC']]
		// 							}).then(function(previousSummary) {
		// 								if (previousSummary === null) {
		// 									// no previous summary found, use initial
		// 									db.Summary.findOne({
		// 										where: {
		// 											initial: true
		// 											,AccountId: account.id
		// 										}
		// 									}).then(function(initialSummary) {
		// 										// console.log(initialSummary);
		// 										// resolve(initialSummary.balance);
		// 										db.Summary.create({
		// 											start: startMoment
		// 											,end: endMoment
		// 											,balance: initialSummary.balance
		// 											,initial: false
		// 											,AccountId: account.id
		// 										}
		// 										,{transaction: t}).then(function(newSummary) {
		// 												// resolve(newSummary);
		// 												// add to returned summary
		// 												newSummary.balance = newSummary.balance + Number(data.amount);
		// 												newSummary.save({transaction: t}).then(function(newSummary) {
		// 													newSummary.reload();
		// 													var newTrans = {
		// 														transactionDate: transactionMoment
		// 														,payee: data.payee
		// 														,amount: Number(data.amount)
		// 														,SummaryId: newSummary.id
		// 														,UserId: 1
		// 													};
		// 													if (data.description !== "") {
		// 														newTrans.description = data.description;
		// 													}
		// 													if (data.category !== "") {
		// 														newTrans.CategoryId = data.category;
		// 													}
		// 													if (data.hasOwnProperty("check") && data.check !== "") {
		// 														newTrans.checkNumber = data.check;
		// 													}
		// 													if (data.hasOwnProperty("xfer")) {
		// 														newTrans.xfer = Number(data.xfer);
		// 													}
		// 													if (data.hasOwnProperty("bill")) {
		// 														newTrans.BillId = Number(data.bill);
		// 													}
		// 													if (data.hasOwnProperty("pDate")) {
		// 														newTrans.postDate = moment.utc(data.pDate,"MM/DD/YYYY");
		// 													}
		// 													// console.log(newTrans);
		// 													db.Transaction.create(newTrans, {transaction: t}).then(function(newTransaction) {
		// 															console.log("commiting transaction");
		// 															t.commit();
		// 															resolve({newTransaction: newTransaction, newSummary: newSummary});
		// 														},function(error) {
		// 															// create transaction error
		// 															console.log("rolling back transaction");
		// 															t.rollback();
		// 															reject({code: 4, error: error});
		// 														});
		// 												},function(error) {
		// 													// summary balance update error
		// 													console.log("rolling back transaction");
		// 													t.rollback();
		// 													reject({code: 3, error: error});
		// 												});
		// 											},function(error) {
		// 												// new summary create error
		// 												console.log("rolling back transaction");
		// 												t.rollback();
		// 												reject({code: 2, error: error});
		// 											});
		// 										});
		// 									} else {
		// 										// console.log(previousSummary);
		// 										// resolve(previousSummary.balance);
		// 										db.Summary.create({
		// 											start: startMoment
		// 											,end: endMoment
		// 											,balance: previousSummary.balance
		// 											,initial: false
		// 											,AccountId: account.id
		// 										}, {transaction: t}).then(function(newSummary) {
		// 											// resolve(newSummary);
		// 											// add to returned summary
		// 											newSummary.balance = newSummary.balance + Number(data.amount);
		// 											newSummary.save({transaction: t}).then(function(newSummary) {
		// 												newSummary.reload();
		// 												var newTrans = {
		// 													transactionDate: transactionMoment
		// 													,payee: data.payee
		// 													,amount: Number(data.amount)
		// 													,SummaryId: newSummary.id
		// 													,UserId: 1
		// 												};
		// 												if (data.description !== "") {
		// 													newTrans.description = data.description;
		// 												}
		// 												if (data.category !== "") {
		// 													newTrans.CategoryId = data.category;
		// 												}
		// 												if (data.hasOwnProperty("check") && data.check !== "") {
		// 													newTrans.checkNumber = Number(data.check);
		// 												}
		// 												if (data.hasOwnProperty("xfer")) {
		// 													newTrans.xfer = Number(data.xfer);
		// 												}
		// 												if (data.hasOwnProperty("bill")) {
		// 													newTrans.BillId = Number(data.bill);
		// 												}
		// 												if (data.hasOwnProperty("pDate")) {
		// 													newTrans.postDate = moment.utc(data.pDate,"MM/DD/YYYY");
		// 												}
		// 												// console.log(newTrans);
		// 												db.Transaction.create(newTrans, {transaction: t}).then(function(newTransaction) {
		// 													console.log("commiting transaction");
		// 													t.commit();
		// 													resolve({newTransaction: newTransaction, newSummary: newSummary});
		// 												},function(error) {
		// 													// create transaction error
		// 													console.log("rolling back transaction");
		// 													t.rollback();
		// 													reject({code: 4, error: error});
		// 												});
		// 											},function(error) {
		// 												// summary balance update error
		// 												console.log("rolling back transaction");
		// 												t.rollback();
		// 												reject({code: 3, error: error});
		// 											});
		// 										},function(error) {
		// 											// new summary create error
		// 											console.log("rolling back transaction");
		// 											t.rollback();
		// 											reject({code: 2, error: error});
		// 										});
		// 									}
		// 								}
		// 							);
		// 						} else {
		// 							// add to returned summary
		// 							summary.balance = summary.balance + Number(data.amount);
		// 							summary.save({transaction: t}).then(function(summary) {
		// 								summary.reload();
		// 								var newTrans = {
		// 									transactionDate: transactionMoment
		// 									,payee: data.payee
		// 									,amount: Number(data.amount)
		// 									,SummaryId: summary.id
		// 									,UserId: 1
		// 								};
		// 								if (data.description !== "") {
		// 									newTrans.description = data.description;
		// 								}
		// 								if (data.category !== "") {
		// 									newTrans.CategoryId = data.category;
		// 								}
		// 								if (data.hasOwnProperty("check") && data.check !== "") {
		// 									newTrans.checkNumber = Number(data.check);
		// 								}
		// 								if (data.hasOwnProperty("xfer")) {
		// 									newTrans.xfer = Number(data.xfer);
		// 								}
		// 								if (data.hasOwnProperty("bill")) {
		// 									newTrans.BillId = Number(data.bill);
		// 								}
		// 								if (data.hasOwnProperty("pDate")) {
		// 									newTrans.postDate = moment.utc(data.pDate,"MM/DD/YYYY");
		// 								}
		// 								// console.log(newTrans);
		// 								db.Transaction.create(newTrans, {transaction: t}).then(function(newTransaction) {
		// 									console.log("commiting transaction");
		// 									t.commit();
		// 									resolve({newTransaction: newTransaction, newSummary: null});
		// 								},function(error) {
		// 									// create transaction error
		// 									console.log("rolling back transaction");
		// 									t.rollback();
		// 									reject({code: 4, error: error});
		// 								});
		// 							},function(error) {
		// 								// summary balance update error
		// 								console.log("rolling back transaction");
		// 								t.rollback();
		// 								reject({code: 3, error: error});
		// 							});
		// 						}
		// 					});
		// 				} else {
		// 					// account not found
		// 					console.log("rolling back transaction");
		// 					t.rollback();
		// 					reject({code: 1});
		// 				}
		// 			}).catch(function(error) {
		// 				console.log("rolling back transaction");
		// 				t.rollback();
		// 				reject({code: 99, error: error});
		// 			});
		// 		});
		// 	});
		// }
		// ,update: function(data) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Transaction.findById(data.id).then(function(transaction) {
		// 			if (transaction !== null) {
		// 				transaction.payee = data.payee;
		// 				if (data.hasOwnProperty("description")) {
		// 					transaction.description = data.description;
		// 				} else {
		// 					transaction.description = null;
		// 				}
		// 				if (data.hasOwnProperty("check")) {
		// 					transaction.checkNumber = data.check;
		// 				} else {
		// 					transaction.checkNumber = null;
		// 				}
		// 				if (data.hasOwnProperty("category")) {
		// 					transaction.CategoryId = data.category;
		// 				} else {
		// 					transaction.CategoryId = null;
		// 				}
		//
		// 				transaction.save().then(function (transaction) {
		// 					transaction.reload();
		// 					resolve(transaction);
		// 				});
		// 			} else {
		// 				reject();
		// 			}
		// 		}).catch(function(error) {
		// 			reject(error);
		// 		});
		// 	});
		// }
		// ,delete: function(id) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Transaction.destroy({
		// 			where: {
		// 				id: id
		// 			}
		// 		})
		// 		.then(
		// 			function(rows) {
		// 				if (rows === 1) {
		// 					resolve();
		// 				} else {
		// 					reject();
		// 				}
		// 			}
		// 		)
		// 		.catch(
		// 			function(error) {
		// 				reject(error);
		// 			}
		// 		);
		// 	});
		// }
		,payeeLookup: function(term) {
			return new Promise(function(resolve) {
				// db.Transaction.findAll({
				// 	attributes: ['payee']
				// 	,where: {
				// 		payee: {
				// 			$like: '%'+term+'%'
				// 		}
				// 	}
				// 	,order: [["payee", "ASC"]]
				// }).then(function(results) {
				// 	resolve(_.uniq(_.pluck(results, "payee"), true));
				// });

                let params = {
                    TableName: 'bank_transactions',
                    FilterExpression: "contains(#attr, :term)",
                    ExpressionAttributeNames: {"#attr": "payeeSearch"},
                    ExpressionAttributeValues: {":term": term.toLowerCase()},
                    AttributesToGet: [ "payee" ]
                };

                docClient.scan(params, function(err,data) {
                   if (err) {
                       console.error("Error looking up payees. Error JSON:", JSON.stringify(err, null, 2));
                   } else {
                       resolve(_.sortBy(_.uniq(_.pluck(data.Items,"payee"))));
                   }
                });
			});
		}
		,descriptionLookup: function(term) {
			return new Promise(function(resolve) {
				// db.Transaction.findAll({
				// 	attributes: ['description']
				// 	,where: {
				// 		description: {
				// 			$like: '%'+term+'%'
				// 		}
				// 	}
				// 	,order: [["description", "ASC"]]
				// }).then(function(results) {
				// 	resolve(_.uniq(_.pluck(results, "description"), true));
				// });

                let params = {
                    TableName: 'bank_transactions',
                    FilterExpression: "contains(#attr, :term)",
                    ExpressionAttributeNames: {"#attr": "descriptionSearch"},
                    ExpressionAttributeValues: {":term": term.toLowerCase()},
                    AttributesToGet: [ "description" ]
                };

                docClient.scan(params, function(err,data) {
                    if (err) {
                        console.error("Error looking up payees. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        resolve(_.sortBy(_.uniq(_.pluck(data.Items,"description"))));
                    }
                });
			});
		}
		// ,clear: function(id) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Transaction.findById(id).then(function(transaction) {
		// 			if (transaction !== null) {
		// 				transaction.cleared = true;
		// 				transaction.save().then(function (transaction) {
		// 					transaction.reload();
		// 					resolve(transaction);
		// 				});
		// 			} else {
		// 				reject();
		// 			}
		// 		}).catch(function(error) {
		// 			reject(error);
		// 		});
		// 	});
		// }
		// ,post: function(data) {
		// 	return new Promise(function(resolve, reject) {
		// 		db.Transaction.findById(data.id).then(function(transaction) {
		// 			if (transaction !== null) {
		// 				transaction.postDate = data.date;
		// 				transaction.save().then(function (transaction) {
		// 					transaction.reload();
		// 					resolve(transaction);
		// 				});
		// 			} else {
		// 				reject();
		// 			}
		// 		}).catch(function(error) {
		// 			reject(error);
		// 		});
		// 	});
		// }
		,getFlow: function(account, start, end) { // TODO: Need to update
			return new Promise(function(resolve, reject) {
				var startDate = moment(start, "X");
				var endDate = moment(end, "X");
				db.Summary.findAll({
					where: {
						AccountId: account
					}
				}).then(function(summaries) {
					var sumIds = _.pluck(summaries, "id");

					db.Transaction.findAll({
						where: {
							SummaryId: {
								$in: sumIds
							}
							,transactionDate: {
								$gte: startDate.format("YYYY-MM-DD")
								,$lte: endDate.format("YYYY-MM-DD")
							}
						}
						,order: [["transactionDate", "ASC"]]
					}).then(function(trans) {
						var retObj = {
							expenses: 0
							,mortgage: 0
							,ins: 0
						};
						trans.forEach(function(tran) {
							if (tran.CategoryId === 7) {
								retObj.mortgage += Math.abs(tran.amount);
							} else if (tran.amount < 0) {
								retObj.expenses += Math.abs(tran.amount);
							} else {
								retObj.ins += tran.amount;
							}
						});
						resolve(retObj);
					});
				}).catch(function(error) {
					reject(error);
				})
			});
		}
		,search: function(data) { // TODO: Need to update
			return new Promise(function(resolve, reject) {
                let ftParams = {
                    TableName: 'bank_future_transactions',
                    FilterExpression: "contains(#attr1, :term) OR contains(#attr2, :term)",
                    ExpressionAttributeNames: {"#attr1": "payeeSearch", "#attr2": "descriptionSearch"},
                    ExpressionAttributeValues: {":term": data.text.toLowerCase()}
                };

                docClient.scan(params, function(err,data) {
                    if (err) {
                        console.error("Error looking up payees. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        resolve(_.sortBy(_.uniq(_.pluck(data.Items,"payee"))));
                    }
                });

				db.FutureTransaction.findAll({
                    where: {
                        AccountId: data.accountId
                        ,$or: [
                            {
                                payee: {
                                    $like: '%' + data.text + '%'
                                }
                            }
                            ,{
                                description: {
                                    $like: '%' + data.text + '%'
                                }
                            }
                        ]
                    }
                    ,include: [{
                        model: db.Category
                    }]
                    ,order: [["transactionDate", "DESC"]]
                    ,limit: 50
				}).then(function(fTrans) {
                    db.Summary.findAll({
                        attributes: ['id']
                        ,where: {
                            AccountId: data.accountId
                        }
                    }).then(function(summs) {
                        var summId = _.pluck(summs, 'id');
                        db.Transaction.findAll({
                            where: {
                                SummaryId: {
                                    $in: summId
                                }
                                ,$or: [
                                    {
                                        payee: {
                                            $like: '%' + data.text + '%'
                                        }
                                    }
                                    ,{
                                        description: {
                                            $like: '%' + data.text + '%'
                                        }
                                    }
                                ]
                            }
                            ,include: [{
                                model: db.Category
                            }]
                            ,order: [["transactionDate", "DESC"]]
                            ,limit: 50
                        }).then(function(trans) {
                            resolve(_.flatten([fTrans, trans]));
                        });
                    })
				}).catch(function(error) {
					reject(error);
				});
			});
		}
        ,dataXfer: function(start,max) {
            return new Promise(function(resolve) {
                console.log("starting transactions transfer");
                let totalCount = 0;
                function getTrans(offset) {
                    console.log("starting offset: "+offset);
                    db.Transaction.findAll({
                        order: [['postDate', 'DESC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying transactions: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0 && offset <= max) {
                        totalCount += results.length;
                        let params = {
                            RequestItems: {
                                "bank_transactions": []
                            }
                        };

                        results.forEach(function (result) {
                            let obj = {
                                PutRequest: {
                                    Item: {
                                        summary_id: result.SummaryId.toString(),
                                        id: result.id.toString(),
                                        transactionDate: moment(result.transactionDate).format("YYYY-MM-DDTHH:mm:ss[Z]"),
                                        postDate: moment(result.postDate).format("YYYY-MM-DDTHH:mm:ss[Z]"),
                                        amount: Number(result.amount),
                                        payee: result.payee,
                                        payeeSearch: result.payee.toLowerCase(),
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            if (result.description) {
                                obj.PutRequest.Item.description = result.description;
                                obj.PutRequest.Item.descriptionSearch = result.description.toLowerCase();
                            }
                            if (result.checkNumber) {
                                obj.PutRequest.Item.checkNumber = result.checkNumber;
                            }
                            if (result.xfer) {
                                obj.PutRequest.Item.xfer = result.xfer.toString();
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

                            params.RequestItems.bank_transactions.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log(`transaction transfer complete. transferred ${totalCount} items`);
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    // var docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err/*, data*/) {
                        if (err) {
                            console.error("Unable to xfer transaction data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getTrans(offset);
                        }
                    });
                }
                getTrans(start);
            });
        }
	}
};