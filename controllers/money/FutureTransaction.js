const moment = require("moment");

module.exports = function(db, Transaction) {
	return {
		getByAccountId: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountOwner(user.id, id).then(function() {
					db.FutureTransaction.findAll({
						where: { AccountId: id }
						,include: [{ model: db.Category }]
						,order: [["transactionDate", "DESC"]]
					}).then(function(results) {
						resolve(results);
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on FutureTransaction controller getByAccountId method: " + error);
					reject();
				});
			});
		}
		,add: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountOwner(user.id, data.account).then(function() {
					let newTrans = {
						transactionDate: data.tDate
						,payee: data.payee
						,amount: data.amount
						,AccountId: data.account
					};
					if (data.description !== "") {
						newTrans.description = data.description;
					}
					if (data.category !== "") {
						newTrans.CategoryId = data.category;
					}
					if (data.hasOwnProperty("check") && data.check !== "") {
						newTrans.checkNumber = data.check;
					}
					if (data.hasOwnProperty("xfer")) {
						newTrans.xfer = Number(data.xfer);
					}
					if (data.hasOwnProperty("bill")) {
						newTrans.BillId = data.bill;
					}
					db.FutureTransaction.create(newTrans).then(function(newTransaction) {
						if (data.hasOwnProperty("multiCat")) {
							db.CategorySplit.create({
								transaction: newTransaction.id
								,payload: data.multiCat
							}).then(function(/*split*/) {
								resolve(newTransaction);
							},function(splitError) {
								console.log("error creating category split: " + splitError);
								resolve(newTransaction);
							});
						} else {
							resolve(newTransaction);
						}
					},function(error) {
						console.log("error creating future transaction: " + error);
						reject(error);
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on FutureTransaction controller add method: " + error);
					reject();
				});
			});
		}
		,update: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.FutureTransaction.findById(data.id).then(function(transaction) {
					db.Owner.validateAccountOwner(user.id, transaction.AccountId).then(function() {
						if (transaction !== null) {
							transaction.payee = data.payee;
							transaction.transactionDate = data.tDate;
							transaction.description = data.description;
							transaction.checkNumber = data.check;
							transaction.amount = data.amount;
							transaction.CategoryId = data.category;
							transaction.save().then(function (transaction) {
								transaction.reload();
								if (data.hasOwnProperty("multiCat")) {
									db.CategorySplit.create({
										transaction: data.id
										,payload: data.multiCat
									}).then(function(/*split*/) {
										resolve(transaction);
									},function(splitError) {
										console.log("error creating category split: " + splitError);
										resolve(transaction);
									});
								} else {
									resolve(transaction);
								}
							});
						} else {
							reject("not found");
						}
					}, function() {
						reject("unauthorized");
					});
				}, function(error) {
					console.log("unable to retrieve future transaction for update: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on FutureTransaction controller update method: " + error);
					reject();
				});
			});
		}
		,delete: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.FutureTransaction.findById(id).then(function(transaction) {
					if (transaction !== null) {
						db.Owner.validateAccountOwner(user.id, transaction.AccountId).then(function() {
							db.FutureTransaction.destroy({
								where: { id: id }
							}).then(function(rows) {
								if (rows === 1) {
									resolve();
								} else {
									reject();
								}
							});
						}, function() {
							reject("unauthorized");
						});
					} else {
						reject("not found");
					}
				}, function(error) {
					console.log("error retrieving transaction for delete: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on FutureTransaction controller delete method: " + error);
					reject();
				});
			});
		}
		,commit: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.FutureTransaction.findById(data.id).then(function(fTrans) {
					db.Owner.validateAccountOwner(user.id, fTrans.AccountId).then(function() {
						if (fTrans === null) {
							reject({code: 1});
						} else {
							// db.sequelize.transaction().then(function(t) {
								let newTran = {
									account: fTrans.AccountId
									,pDate: data.pDate
									,tDate: moment(fTrans.transactionDate).format("MM/DD/YYYY")
									,payee: fTrans.payee
									,description: fTrans.description
									,amount: fTrans.amount
								};
								if (fTrans.checkNumber !== null) {
									newTran.check = fTrans.checkNumber;
								}
								if (fTrans.xfer !== null) {
									newTran.xfer = fTrans.xfer;
								}
								if (fTrans.CategoryId !== null) {
									newTran.category = fTrans.CategoryId;
								}
								if (fTrans.BillId !== null) {
									newTran.bill = fTrans.BillId;
								}
								// console.log(newTran);
								Transaction.add(user, newTran).then(function(nTrans) {
									// console.log("nTrans ID: " + nTrans.newTransaction.id);
									if (fTrans.CategoryId === 1) {
										db.CategorySplit.findOne({
											where: { transaction: fTrans.id }
										}).then(function(split) {
											// console.log("split ID: " + split.id);
											split.update({
												transaction: nTrans.newTransaction.id
											}).then(function() {
												db.FutureTransaction.destroy({
													where: {id: data.id}
												}).then(function (rows) {
													if (rows === 1) {
														resolve(nTrans);
													} else {
														reject({code: 2});
													}
												});
											}, function(error) {
												console.log("error updating category split with new transactoin id: " + error);
												resolve(nTrans);
											});
										}, function(error) {
											console.log("error retrieving category split: " + error);
											resolve(nTrans);
										});
									} else {
										db.FutureTransaction.destroy({
											where: {id: data.id}
										}).then(function (rows) {
											if (rows === 1) {
												resolve(nTrans);
											} else {
												reject({code: 2});
											}
										});
									}
								}, function(error) {
									console.log("error creating new transaction: " + error);
									reject({code: 101});
								});
							// }, function(error) {
							// 	console.log('error creating transaction for future transaction commit: ' + error);
							// 	reject({code: 100});
							// });
						}
					}, function() {
						// unauthorized
						reject({code: -1});
					});
				}, function(error) {
					console.log("error retrieving transaction for commit: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on FutureTransaction controller commit method: " + error);
					reject();
				});
			});
		}
	}
};