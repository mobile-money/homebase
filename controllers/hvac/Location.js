module.exports = function(db) {
	return {
		insert: function(data) {
			return new Promise(function(resolve, reject) {
				db.Location.create({
					floor: data.floor
					,room: data.room
					,note: data.note
				}).then(function(result) {
					if (data.systemId != -1) {
						db.System.findOne({
							where: {
								id: data.systemId
							}
						}).then(function(system){
							system.LocationId = result.id;
							system.save().then(function(updatedSystem) {
								resolve(result);
							});
						});
					} else {
						resolve(result);
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,get: function(params) {
			return new Promise(function(resolve, reject) {
				db.Location.findAll({
					where: params
					,include: [ db.System ]
					,order: [[ 'floor', 'ASC'],[ 'room', 'ASC' ]]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				})
			});
		}
		,update: function(locationId, data) {
			return new Promise(function(resolve, reject) {
				db.Location.findOne({
					where: {
						id: locationId
					}
				}).then(function(location) {
					if (location !== null) {
						location.floor = data.floor;
						location.room = data.room;
						location.note = data.note;
						location.save().then(function(result) {
							result.setSystem(null).then(function(newResult) {
								if (data.systemId != -1) {
									db.System.findOne({
										where: {
											id: data.systemId
										}
									}).then(function(system) {
										system.LocationId = result.id;
										system.save().then(function(updatedSystem) {
											resolve(result);
										});
									});
								} else {
									resolve(newResult);
								}
							});
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("location not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,delete: function(locationId) {
			return new Promise(function(resolve, reject) {
				db.Location.findOne({
					where: {
						id: locationId
					}
				}).then(function(location) {
					if (location !== null) {
						location.destroy().then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						reject("location not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
}