const _ = require("underscore");
const Sequelize = require('sequelize');
const { fn, col } = Sequelize;

module.exports = function(db, admin) {
	return {
		create: function(user, newAccount) {
			return new Promise(function(resolve, reject) {
				admin.User.findById(user.id).then(function(/*foundUser*/) {
					let acct = {
						name: newAccount.name.trim()
						,type: newAccount.type.trim()
						,default: newAccount.default
                        ,ownerId: user.id
					};
					// Make sure groups is array of INTs
					acct.group_ids = _.map(newAccount.group_ids, function(val) { return Number(val); });
					db.Account.create(acct).then(function(account) {
						if (newAccount.type.trim() !== "Investment") {
							db.Summary.create({
								balance: newAccount.balance
								,initial: true
							}).then(function(summary) {
								account.addSummary(summary).then(function(account) {
									account.reload();
									resolve(account);
								});
							});
						} else {
							resolve(account);
						}
					});
				}, function() {
					reject('error finding user: ' + error);
				}).catch(function(error) {
					console.log("catch error on Account controller create method: " + error);
					reject();
				});
			});
		}
		,delete: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Account.update({
					active: false
				},{
					where: {
						id: id,
						ownerId: user.id
					}
				}).then(function(result) {
					if (result[0] === 1) {
						resolve();
					} else {
						reject("There was a problem deleting the account");
					}
				}).catch(function(error) {
					console.log("catch error on account controller delete method: " + error);
					reject();
				});
			});
		}
		,getAll: function(user) {
			return new Promise(function(resolve, reject) {
				let queryArr = [];
				user.groups.forEach(function(group) {
					queryArr.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
				});

				db.Account.findAll({
					where: {
						active: true,
						$or: [
							{ ownerId: user.id },
							{ $or: queryArr }
						]
					}
					,order: [['name', 'ASC']]
					,include: [
						{
							model: db.Summary
							,separate: true
							,order: [['start', 'DESC']]
						},{
							model: db.Position
						}
					]
				}).then(function(results) {
					let finResults = [];
					results.forEach(function(result) {
						let tObj = {
							id: result.id,
							active: result.active,
							default: result.default,
							name: result.name,
							type: result.type,
							Positions: result.Positions,
							Summaries: result.Summaries,
							groups: JSON.parse(result.group_ids)
						};
						if (result.ownerId === user.id) {
							tObj.owner = true;
						}
						finResults.push(tObj);
					});
					resolve(finResults);
				}).catch(function(error) {
					console.log("catch error on account controller getAll method: " + error);
					reject();
				});
			});
		}
		,getByGroup: function(user, groupId) {
			return new Promise(function(resolve, reject) {
				// Make sure user is a part of group
				const group = _.findWhere(user.groups,{id: groupId});
				if (typeof(group !== "undefined")) {
					db.Account.findAll({
						where: fn('JSON_CONTAINS', col('group_ids'), String(groupId))
					}).then(function(accounts) {
						// Extract just the name
						let finArr = [];
						accounts.forEach(function(account) {
							finArr.push({
								name: account.name
							});
						});
						resolve(finArr);
					}).catch(function(error) {
						console.log("catch error on Account controller getByGroup method: " + error);
						reject();
					});
				} else {
					reject("unauthorized");
				}
			});
		}
		,getInactive: function(user) {
			return new Promise(function(resolve, reject) {
				let queryArr = [];
				user.groups.forEach(function(group) {
					queryArr.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
				});

				db.Account.findAll({
					where: {
						active: false,
						$or: [
							{ ownerId: user.id },
							{ $or: queryArr }
						]
					}
					,order: [['name', 'ASC']]
					,include: [
						{
							model: db.Summary
							,separate: true
							,order: [['start', 'DESC']]
						},{
							model: db.Position
						}
					]
				}).then(function(results) {
					let finResults = [];
					results.forEach(function(result) {
						let tObj = {
							id: result.id,
							active: result.active,
							default: result.default,
							name: result.name,
							type: result.type,
							Positions: result.Positions,
							Summaries: result.Summaries,
							groups: JSON.parse(result.group_ids)
						};
						if (result.ownerId === user.id) {
							tObj.owner = true;
						}
						finResults.push(tObj);
					});
					resolve(finResults);
				}).catch(function(error) {
					console.log("catch error on account controller getInactive method: " + error);
					reject();
				});
			});
		}
		,getInvestments: function(user, id) {
			return new Promise(function(resolve, reject) {
				let returnObj = {};
				db.Account.validateAccountAccess(user,id).then(function() {
					db.Account.findById(id).then(function(account) {
						if (account === null) {
							// account not found
							reject({code: 1});
						} else {
							if (account.type !== "Investment") {
								// account not investment
								reject({code: 2});
							} else {
								db.Position.findAll({
									where: { AccountId: id }
									,order: [["ticker", "ASC"]]
								}).then(function(positions) {
									if (positions === null) {
										reject({code: 3});
									} else {
										returnObj.positions = positions;
										let positionIds = [];
										for (let i = 0; i < positions.length; i++) {
											positionIds.push(positions[i].id);
										}
										db.Trade.findAll({
											where: { PositionId: { $in: positionIds } }
											,order: [["transactionDate", "DESC"]]
										}).then(function(trades) {
											returnObj.trades = trades;
											resolve(returnObj);
										});
									}
								});
							}
						}
					});
				},function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on account controller getInvestments method: " + error);
					reject({code: 99, error: ""});
				});
			});
		}
		,reactivate: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Account.update({
					active: true
				},{
					where: {
						id: id,
						ownerId: user.id
					}
				}).then(function(result) {
					if (result[0] === 1) {
						resolve();
					} else {
						reject("There was a problem reactivating the account");
					}
				}).catch(function(error) {
					console.log("catch error on Account controller reactivate method: " + error);
					reject();
				});
			});
		}
		,update: function(user, data) {
			return new Promise(function(resolve, reject) {
				db.Account.findOne({
					where: {
						id: data.id,
						ownerId: user.id
					}
				}).then(function(result) {
					if (result !== null) {
						result.name = data.name;
						result.type = data.type;
						result.default = data.default;
						// Make sure groups is array of INTs
						result.group_ids = _.map(data.group_ids, function(val) { return Number(val); });
						result.save().then(function(result) {
							result.reload();
							resolve(result);
						});
					} else {
						reject();
					}
				}).catch(function(error) {
					console.log("catch error on Account controller update method: " + error);
					reject();
				});
			});
		}
	};
};