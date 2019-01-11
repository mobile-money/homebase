const _ = require("underscore");

module.exports = function(sequelize, DataTypes) {
	let Owner = sequelize.define("Owner", {
		userId: {
			type: DataTypes.INTEGER
			,allowNull: false
		},
		master: {
			type: DataTypes.BOOLEAN
			,allowNull: false
			,defaultValue: false
		}
	},{
		classMethods: {
			getAllowedAccounts: function(userId) {
				return new Promise(function(resolve, reject) {
					Owner.findAll({
						where: {
							userId: userId
						}
					}).then(function(results) {
						resolve(_.pluck(results,'AccountId'));
					},function(error) {
						console.log('error querying for allowed accounts: '+error);
						reject();
					});
				});
			},
			validateAccountMaster: function(userId, accountId) {
				return new Promise(function(resolve, reject) {
					// Query for an association between logged in user and accessed Person
					console.log('checking for association between user: '+userId+' and Account: '+accountId);
					Owner.findOne({
						where: {
							userId: userId,
							AccountId: accountId,
							master: true
						}
					}).then(function(foundAssn) {
						// Query worked
						if (foundAssn) {
							// Association found
							console.log('association found');
							resolve();
						} else {
							// Association not found
							console.log('association not found');
							reject();
						}
					},function(error) {
						// Query failed
						console.log('error querying association: '+error);
						reject();
					});
				});
			},
			validateAccountOwner: function(userId, accountId) {
				return new Promise(function(resolve, reject) {
					// Query for an association between logged in user and accessed Person
					console.log('checking for association between user: '+userId+' and Account: '+accountId);
					Owner.findOne({
						where: {
							userId: userId,
							AccountId: accountId
						}
					}).then(function(foundAssn) {
						// Query worked
						if (foundAssn) {
							// Association found
							console.log('association found');
							resolve();
						} else {
							// Association not found
							console.log('association not found');
							reject();
						}
					},function(error) {
						// Query failed
						console.log('error querying association: '+error);
						reject();
					});
				});
			}
		}
	});

	return Owner;
};