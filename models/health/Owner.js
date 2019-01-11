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
			getAllowedPeople: function(userId) {
				return new Promise(function(resolve, reject) {
					Owner.findAll({
						where: {
							userId: userId
						}
					}).then(function(results) {
						// console.log(_.pluck(results,'PersonId'));
						resolve(_.pluck(results,'PersonId'));
					},function(error) {
						console.log('error querying for allowed people: '+error);
						reject();
					});
				});
			},
			validatePersonMaster: function(userId, personId) {
				return new Promise(function(resolve, reject) {
					// Query for an association between logged in user and accessed Person
					console.log('checking for association between user: '+userId+' and Person: '+personId);
					Owner.findOne({
						where: {
							userId: userId,
							PersonId: personId,
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
			validatePersonOwner: function(userId, personId) {
				return new Promise(function(resolve, reject) {
					// Query for an association between logged in user and accessed Person
					console.log('checking for association between user: '+userId+' and Person: '+personId);
					Owner.findOne({
						where: {
							userId: userId,
							PersonId: personId
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