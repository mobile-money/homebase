const Sequelize = require('sequelize');
const { fn, col } = Sequelize;
module.exports = function(sequelize, DataTypes) {
	let Budget = sequelize.define('Budget', {
		name: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 48]
			}
		}
		,amounts: {
			type: DataTypes.STRING(4096)
			,allowNull: false
		}
		,favorite: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
		,ownerId: {
			type: DataTypes.INTEGER
			,allowNull: false
		}
		,group_ids: {
			type: DataTypes.JSON
		}
		,account_ids: {
			type: DataTypes.JSON
		}
	},{
		classMethods: {
			validateBudgetAccess: function(user, budget_id) {
				// query for all budgets that match the given budget id AND match the user id to owner id OR
				// one of the users groups to one of the budgets groups
				return new Promise(function(resolve, reject) {
					let params = {
						id: budget_id,
						$or: [
							{ ownerId: user.id }
						]
					};
					user.groups.forEach(function(group) {
						params.$or.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
					});
					// console.log("params: "+params);
					Budget.findAll({
						where: params
					}).then(function(budget) {
						if (budget !== null) {
							if (budget.length === 1) {
								resolve();
							} else {
								// somethings off, only one budget should be returned
								// console.log("too many");
								reject()
							}
						} else {
							// no such budget found
							// console.log("nothing");
							reject();
						}
					}).catch(function(error) {
						console.log("error in validateBudgetAccess: " + error);
						reject();
					});
				});
			},
			getAllowedBudgets: function(user, params) {
				return new Promise(function(resolve) {
					let queryArr = [];
					user.groups.forEach(function(group) {
						queryArr.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
					});
					if (params) {
						if (params.hasOwnProperty("where")) {
							params.where.$or = [
								{ ownerId: user.id },
								{ $or: queryArr }
							];
						} else {
							params.where = {
								$or: [
									{ ownerId: user.id },
									{ $or: queryArr }
								]
							};
						}
					} else {
						params = {
							where: {
								$or: [
									{ownerId: user.id},
									{$or: queryArr}
								]
							}
						};
					}
					Budget.findAll(params).then(function(results) {
						resolve(_.pluck(results,"id"));
					}).catch(function(error) {
						console.log("error in getAllowedBudgets: " + error);
						resolve([]);
					})

				});
			}
		}
	});
	return Budget;
};