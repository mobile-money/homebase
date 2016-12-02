module.exports = function(db) {
	return {
		insert: function(data) {
			return new Promise(function(resolve, reject) {
				db.Model.create({
					name: data.name
					,manufacturer: data.manufacturer
					,temperature: data.temperature
					,humidity: data.humidity
				}).then(function(result) {
					resolve(result);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,get: function(params) {
			return new Promise(function(resolve, reject) {
				db.Model.findAll({
					where: params
					,order: [[ 'manufacturer', 'ASC' ],[ 'name', 'ASC' ]]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				})
			});
		}
		,update: function(modelId, data) {
			return new Promise(function(resolve, reject) {
				db.Model.findOne({
					where: {
						id: modelId
					}
				}).then(function(model) {
					if (model !== null) {
						model.name = data.name;
						model.manufacturer = data.manufacturer;
						model.temperature = data.temperature;
						model.humidity = data.humidity;
						model.save().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("model not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(modelId) {
			return new Promise(function(resolve, reject) {
				db.Model.findOne({
					where: {
						id: modelId
					}
				}).then(function(model) {
					if (model !== null) {
						model.destroy().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("model not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
}