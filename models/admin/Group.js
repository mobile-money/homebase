const Sequelize = require('sequelize');
const { fn, col } = Sequelize;
const _ = require("underscore");
module.exports = function(sequelize, DataTypes) {
	let Group =  sequelize.define("Group", {
		name: {
			type: DataTypes.STRING(48)
			,allowNull: false
			,validate: {
				len: [1,48]
			}
		},
		ownerId: {
			type: DataTypes.INTEGER
			,allowNull: false
		},
		memberIds: {
			type: DataTypes.JSON
		}
	},{
		classMethods: {
			getUsersGroups: function(id) {
				return new Promise(function(resolve) {
					Group.findAll({
						where: {
							$or: [
								{ ownerId: id },
								fn('JSON_CONTAINS', col('memberIds'), String(id))
							]
						},
						raw: true,
						order: [[ 'name', 'ASC' ]]
					}).then(function(groups) {
						let ret = [];
						groups.forEach(function(group) {
							let tmpObj = {
								id: group.id,
								name: group.name,
								ownerId: group.ownerId,
								memberIds: group.memberIds
							};
							if (group.ownerId === id) {
								tmpObj.owner = true;
							}
							ret.push(tmpObj);
						});
						resolve(ret);
					}).catch(function(error) {
						console.log("error in getUsersGroups: " + error);
						resolve([]);
					});
				});
			}
		}
	});

	return Group;
};
