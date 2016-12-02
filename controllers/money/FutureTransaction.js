var moment = require("moment");

module.exports = function(db, Transaction) {
	return {
		getByAccountId: function(id) {
			return new Promise(function(resolve, reject) {
				db.FutureTransaction.findAll({
					where: { AccountId: id }
					,include: [{ model: db.Category }]
					,order: [["transactionDate", "DESC"]]
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
			});
		}
		,add: function(data) {
			return new Promise(function(resolve, reject) {
				newTrans = {
					transactionDate: data.tDate
					,payee: data.payee
					,amount: data.amount
					,AccountId: data.account
				}
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
					resolve(newTransaction);
				},function(error) {
					reject(error);
				});
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.FutureTransaction.findById(data.id).then(function(transaction) {
					if (transaction !== null) {
						transaction.payee = data.payee;
						transaction.transactionDate = data.tDate;
						transaction.description = data.description;
						transaction.checkNumber = data.check;
						transaction.amount = data.amount;
						transaction.CategoryId = data.category;
						transaction.save().then(function (transaction) {
							transaction.reload();
							resolve(transaction);
						});
					} else {
						reject();
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				db.FutureTransaction.destroy({
					where: { id: id }
				}).then(function(rows) {
					if (rows === 1) {
						resolve();
					} else {
						reject();
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,commit: function(id) {
			return new Promise(function(resolve, reject) {
				db.FutureTransaction.findById(id).then(function(fTrans) {
					// console.log(fTrans);
					if (fTrans === null) {
						reject({code: 1});
					} else {
						newTran = {
							account: fTrans.AccountId
							,tDate: moment(fTrans.transactionDate).format("MM/DD/YYYY")
							,payee: fTrans.payee
							,description: fTrans.description
							,amount: fTrans.amount
						}
						if (fTrans.checkNumber !== null) {
							newTran.check = fTrans.checkNumber;
						}
						if (fTrans.CategoryId !== null) {
							newTran.category = fTrans.CategoryId;
						}
						if (fTrans.BillId !== null) {
							newTran.bill = fTrans.BillId;
						}
						Transaction.add(newTran).then(function(nTrans) {
							db.FutureTransaction.destroy({
								where: {id: id}
							}).then(function(rows) {
								if (rows === 1) {
									resolve(nTrans);
								} else {
									reject({code: 2});
								}
							});
						});
					}
				}).catch(function(error) {
					reject({code: 0, error: error});
				});
			});
		}
	}
}