module.exports = function(db) {
	return {
		get: function(params) {
			return new Promise(function(resolve, reject) {
				db.Sensor.findAll({
					where: params
					,include: [ db.Model, db.Location, db.Host ]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,insert: function(data) {
			return new Promise(function(resolve, reject) {
				db.Sensor.create({
					dataPin: data.dataPin
					,enabled: data.enabled
					,LocationId: data.locationId
					,HostId: data.hostId
					,ModelId: data.modelId
				}).then(function(result) {
					resolve(result);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,update: function(sensorId, data) {
			return new Promise(function(resolve, reject) {
				db.Sensor.findOne({
					where: {
						id: sensorId
					}
				}).then(function(sensor) {
					if (sensor !== null) {
						sensor.dataPin = data.dataPin;
						sensor.enabled = data.enabled;
						sensor.LocationId = data.locationId;
						sensor.HostId = data.hostId;
						sensor.ModelId = data.modelId;
						sensor.save().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("sensor not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(sensorId) {
			return new Promise(function(resolve, reject) {
				db.Sensor.findOne({
					where: {
						id: sensorId
					}
				}).then(function(sensor) {
					if (sensor !== null) {
						sensor.destroy().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("sensor not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
}