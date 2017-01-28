var moment = require("moment");
var _ = require("underscore");
var request = require('request');

module.exports = function(db) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
				db.Bill.findAll({
					order: [['payee', 'ASC']]
					,include: [{model: db.Account}, {model: db.Category}]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,create: function(newBill) {
			return new Promise(function(resolve, reject) {
				var obj = {
					payee: newBill.payee.trim()
					,startDate: moment.utc(newBill.startDate, "MM/DD/YYYY")
					,frequency: newBill.frequency
					,every: newBill.every
					,amount: newBill.amount
					,automatic: newBill.automatic
					,AccountId: newBill.account
					,CategoryId: newBill.category
				}
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
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				db.Bill.destroy({
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
			})
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.Bill.findById(data.id).then(function(result) {
					if (result !== null) {
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
					} else {
						reject();
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,postNew: function(id) {
			return new Promise(function(resolve, reject) {
				var endDate = moment.utc().add(30, 'd');
				db.Bill.findAll({
					where: { AccountId: id }
				}).then(function(bills) {
					var newTrans = [];
					bills.forEach(function(bill) {
						var toAdd = {
							payee: bill.payee
							,description: bill.description
							,amount: bill.amount
							,AccountId: id
							,CategoryId: bill.CategoryId
							,BillId: bill.id
							,dates: []
						};
						var indexDate = moment.utc(bill.startDate);
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
							var lastDate;
							for (var i = 0; i < trans.dates.length; i++) {
								lastDate = trans.dates[i];
								var body = {
									account: trans.AccountId
									,description: trans.description
									,tDate: trans.dates[i]
									,payee: trans.payee
									,amount: trans.amount
									,bill: trans.BillId
									,category: trans.CategoryId
								};
								request.post("http://localhost:3000/api/v1/money/futureTransactions", {
									json: true
									,body: body
								}, function(error, response, body) {
									if (error) {
										console.log(error);
									}
								});
							}
							db.Bill.update({lastAdded: lastDate}, {
								where: {id: trans.BillId}
							});
						}
					});
					resolve(newTrans);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
}