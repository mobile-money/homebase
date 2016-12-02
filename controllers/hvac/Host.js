module.exports = function(db) {
	return {
		insert: function(data) {
			return new Promise(function(resolve, reject) {
				db.Host.create({
					name: data.name
				}).then(function(result) {
					resolve(result);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,get: function(params) {
			return new Promise(function(resolve, reject) {
				db.Host.findAll({
					where: params
					,order: [[ 'name', 'ASC' ]]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				})
			});
		}
		,update: function(hostId, data) {
			return new Promise(function(resolve, reject) {
				db.Host.findOne({
					where: {
						id: hostId
					}
				}).then(function(host) {
					if (host !== null) {
						host.name = data.name;
						host.save().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("host not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(hostId) {
			return new Promise(function(resolve, reject) {
				db.Host.findOne({
					where: {
						id: hostId
					}
				}).then(function(host) {
					if (host !== null) {
						host.destroy().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("host not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
}