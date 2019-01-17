const Sequelize = require('sequelize');
const { fn, col } = Sequelize;
const _ = require("underscore");

module.exports = function(sequelize, DataTypes) {
	let Account = sequelize.define('Account', {
		name: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 48]
			}
		}
		,default: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
		,type: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 24]
			}
		}
		,active: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: true
		}
		,ownerId: {
			type: DataTypes.INTEGER
			,allowNull: false
		}
		,group_ids: {
			type: DataTypes.JSON
		}
	},{
	// 	paranoid: true
		hooks: {
			afterCreate: function(account) {
				if (account.default === true) {
					this.update(
						{ default: false },
						{
							where: { id: { $ne: account.id } },
							hooks: false
						}
					);
				}
			},
			afterUpdate: function(account) {
				if (account.default === true) {
					this.update(
						{ default: false },
						{
							where: { id: { $ne: account.id } },
							hooks: false
						}
					);
				}
			}
		},
		classMethods: {
			validateAccountAccess: function(user, account_id) {
				// query for all accounts that match the given account id AND match the user id to owner id OR
				// one of the users groups to one of the accounts groups
				return new Promise(function(resolve, reject) {
					let params = {
						id: account_id,
						$or: [
							{ ownerId: user.id },
						]
					};
					user.groups.forEach(function(group) {
						params.$or.push(fn('JSON_CONTAINS', col('group_ids'), String(group.id)));
					});
					Account.findAll({
						where: params
					}).then(function(account) {
						if (account !== null) {
							if (account.length === 1) {
								resolve();
							} else {
								// somethings off, only one car should be returned
								reject()
							}
						} else {
							// no such car found
							reject();
						}
					}).catch(function(error) {
						console.log("error in validateAccountAccess: " + error);
						reject();
					});
				});
			},
			getAllowedAccounts: function(user, params) {
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
					Account.findAll(params).then(function(results) {
						resolve(_.pluck(results,"id"));
					}).catch(function(error) {
						console.log("error in getAllowedAccounts: " + error);
						resolve([]);
					})

				});
			}
		}
	});
	return Account;
};