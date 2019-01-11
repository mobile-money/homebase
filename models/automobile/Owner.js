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
			getAllowedCars: function(userId) {
				return new Promise(function(resolve, reject) {
					Owner.findAll({
						where: {
							userId: userId
						}
					}).then(function(results) {
						resolve(_.pluck(results,'CarId'));
					},function(error) {
						console.log('error querying for allowed cars: '+error);
						reject();
					});
				});
			},
			validateCarMaster: function(userId, carId) {
				return new Promise(function(resolve, reject) {
					// Query for an association between logged in user and accessed Person
					console.log('checking for association between user: '+userId+' and Person: '+carId);
					Owner.findOne({
						where: {
							userId: userId,
							CarId: carId,
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
			validateCarOwner: function(userId, carId) {
				return new Promise(function(resolve, reject) {
					// Query for an association between logged in user and accessed Person
					console.log('checking for association between user: '+userId+' and Person: '+carId);
					Owner.findOne({
						where: {
							userId: userId,
							CarId: carId
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