module.exports = function(db) {
	return {
		get: function() {
			return new Promise(function(resolve, reject) {
				db.Option.findOne().then(function(result) {
					resolve(result);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.Option.findOne().then(function(option) {
					if (data.hasOwnProperty("defaultLocation")) {
						if (data.defaultLocation === "null") {
							data.defaultLocation = null;
						}
					}
					if (option !== null) {
						option.update(data).then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					} else {
						db.Option.create(data).then(function(result) {
							resolve(result);
						}).catch(function(error) {
							reject(error);
						});
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
	};
}