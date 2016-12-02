module.exports = function(db) {
	return {
		insert: function(data) {
			return new Promise(function(resolve, reject) {
				db.System.create({
					name: data.name
					,heat: data.type
					,controlPin: data.controlPin
					,state: data.state
				}).then(function(result) {
					resolve(result);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,get: function(params) {
			return new Promise(function(resolve, reject) {
				db.System.findAll({
					where: params
					,order: [[ 'name', 'ASC' ]]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				})
			});
		}
		,update: function(systemId, data) {
			return new Promise(function(resolve, reject) {
				db.System.findOne({
					where: {
						id: systemId
					}
				}).then(function(system) {
					if (system !== null) {
						system.name = data.name;
						system.heat = data.type;
						system.controlPin = data.controlPin;
						system.state = data.state;
						system.save().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("system not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(systemId) {
			return new Promise(function(resolve, reject) {
				db.System.findOne({
					where: {
						id: systemId
					}
				}).then(function(system) {
					if (system !== null) {
						system.destroy().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("system not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
};