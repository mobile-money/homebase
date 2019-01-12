const moment = require("moment");
// const _ = require("underscore");
const request = require('request');

module.exports = function(db,io) {
	return {
		create: function(user, newBill) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountOwner(user.id, newBill.account).then(function() {
					let obj = {
						payee: newBill.payee.trim()
						,startDate: moment.utc(newBill.startDate, "MM/DD/YYYY")
						,frequency: newBill.frequency
						,every: newBill.every
						,amount: newBill.amount
						,automatic: newBill.automatic
						,AccountId: newBill.account
						,CategoryId: newBill.category
					};
					if (newBill.hasOwnProperty("description")) {
						obj.description = newBill.description.trim();
					}
					if (newBill.onThe !== null) {
						obj.onThe = newBill.onThe;
						if (Number(newBill.onThe) > 31) {
							obj.onThe = 31;
						}
					}
					db.Bill.create(obj).then(function(bill) {
						resolve(bill);
					});
				}, function() {
					reject('unauthorized');
				}).catch(function(error) {
					console.log("catch error on Bill controller create method: " + error);
					reject();
				});
			});
		}
		,delete: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Bill.findById(id).then(function(bill) {
					if (bill !== null) {
						db.Owner.validateAccountOwner(user.id, bill.AccountId).then(function() {
							db.Bill.destroy({
								where: { id: id }
							}).then(function(rows) {
								if (rows === 1) {
									resolve();
								} else {
									console.log('delete of bill did not return any rows');
									resolve();
								}
							});
						}, function() {
							reject('unauthorized');
						});
					} else {
						reject('not found');
					}
				}).catch(function(error) {
					console.log("catch error on Bill controller delete method: " + error);
					reject();
				});
			});
		}
		,getAll: function(user) {
			return new Promise(function(resolve, reject) {
				db.Owner.getAllowedAccounts(user.id).then(function(allowedAccounts) {
					db.Bill.findAll({
						where: { AccountId: { $in: allowedAccounts } }
						,order: [['payee', 'ASC']]
						,include: [{model: db.Account}, {model: db.Category}]
					}).then(function(results) {
						resolve(results);
					});
				}).catch(function(error) {
					console.log("catch error on Bill controller getAll method: " + error);
					reject();
				});
			});
		}
		,postNew: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountOwner(user.id, id).then(function() {
					const endDate = moment.utc().add(30, 'd');
					db.Bill.findAll({
						where: { AccountId: id }
					}).then(function(bills) {
						let newTrans = [];
						bills.forEach(function(bill) {
							let toAdd = {
								payee: bill.payee
								,description: bill.description
								,amount: bill.amount
								,AccountId: id
								,CategoryId: bill.CategoryId
								,BillId: bill.id
								,dates: []
							};
							let indexDate = moment.utc(bill.startDate);
							if (bill.lastAdded !== null) {
								indexDate = moment.utc(bill.lastAdded);
							}
							if (bill.frequency === "M") {
								if (bill.onThe === -1 || bill.onThe > indexDate.endOf("month").date()) {
									indexDate.endOf("month");
								} else {
									indexDate.date(bill.onThe);
								}
								while (indexDate <= endDate) {
									if (indexDate.format("MM/DD/YYYY") !== moment.utc(bill.lastAdded).format("MM/DD/YYYY")) {
										toAdd.dates.push(indexDate.format("MM/DD/YYYY"));
									}
									indexDate.add(bill.every, "M");
									if (bill.onThe === -1 || bill.onThe > indexDate.endOf("month").date()) {
										indexDate.endOf("month");
									} else {
										indexDate.date(bill.onThe);
									}
								}
							} else {
								while (indexDate <= endDate) {
									if (indexDate.format("MM/DD/YYYY") !== moment.utc(bill.lastAdded).format("MM/DD/YYYY")) {
										toAdd.dates.push(indexDate.format("MM/DD/YYYY"));
									}
									indexDate.add(bill.every, bill.frequency);
								}
							}
							newTrans.push(toAdd);
						});

						newTrans.forEach(function(trans) {
							if (trans.dates.length > 0) {
								let lastDate;
								for (let i = 0; i < trans.dates.length; i++) {
									lastDate = trans.dates[i];
									// const body = {
									// 	account: trans.AccountId
									// 	,description: trans.description
									// 	,tDate: trans.dates[i]
									// 	,payee: trans.payee
									// 	,amount: trans.amount
									// 	,bill: trans.BillId
									// 	,category: trans.CategoryId
									// };
									// request.post("http://localhost:3000/api/v1/money/futureTransactions", {
									// 	json: true
									// 	,body: body
									// }, function(error/*, response, body*/) {
									// 	if (error) {
									// 		console.log('error adding future transaction from bill: ' + error);
									// 	}
									// });
									const body = {
										AccountId: trans.AccountId
										,description: trans.description
										,transactionDate: trans.dates[i]
										,payee: trans.payee
										,amount: trans.amount
										,BillId: trans.BillId
										,CategoryId: trans.CategoryId
									};
									db.FutureTransaction.create(body).then(function(obj) {
										io.emit("transactionAdded", "f_"+obj.id);
										console.log('new bill posted for ' + trans.payee);
									}, function(error) {
										console.log('error posting new bill for ' + trans.payee + '; error: ' + error);
									});
								}
								db.Bill.update({lastAdded: lastDate}, {
									where: {id: trans.BillId}
								});
							}
						});
						resolve(newTrans);
					});
				}, function() {
					reject('unauthorized');
				}).catch(function(error) {
					console.log("catch error on Bill controller postNew method: " + error);
					reject();
				});
			});
		}
		,update: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Bill.findById(data.id).then(function(result) {
					if (result !== null) {
						db.Owner.validateAccountOwner(user.id, data.account).then(function() {
							result.payee = data.payee.trim();
							result.startDate = data.startDate;
							result.frequency = data.frequency;
							result.every = data.every;
							result.amount = data.amount;
							result.automatic = data.automatic;
							result.AccountId = data.account;
							if (data.hasOwnProperty("category")) {
								result.CategoryId = data.category;
							} else {
								result.CategoryId = null;
							}
							if (data.hasOwnProperty("description")) {
								result.description = data.description.trim();
							} else {
								result.description = null;
							}
							if (data.onThe !== null) {
								result.onThe = data.onThe;
								if (Number(data.onThe) > 31) {
									result.onThe = 31;
								}
							}
							result.save().then(function(result) {
								result.reload();
								resolve(result);
							});
						}, function() {
							reject('unauthorized');
						});
					} else {
						reject('not found');
					}
				}).catch(function(error) {
					console.log("catch error on Bill controller update method: " + error);
					reject();
				});
			});
		}
	};
};