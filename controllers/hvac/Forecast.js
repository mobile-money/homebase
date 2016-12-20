var moment = require("moment");
var _ = require("underscore");
var request = require("request");

var API_KEY = "f3fb3d641b4c098bc8660da237aa0df9";

function getCurrentForecast() {
	return new Promise(function(resolve, reject) {
		request("http://api.openweathermap.org/data/2.5/forecast/daily?lat=45&lon=-93&cnt=5&APPID=f3fb3d641b4c098bc8660da237aa0df9", function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var resp = JSON.parse(body);
				resolve(resp.list);
    		} else {
    			if (error) { reject(error); }
    			else { reject(response.statusCode); }
    		}
		});
	});
}

module.exports = function(db) {
	return {
		update: function() {
			return new Promise(function(resolve, reject) {
				getCurrentForecast().then(function(forecast) {
					if (forecast.length > 0) {
						db.Forecast.findOne().then(function(row) {
							var obj = {};
							forecast.forEach(function(day,ind) {
								obj["day"+ind+"_date"] = moment.utc(day.dt,"X");
								obj["day"+ind+"_min"] = day.temp.min;
								obj["day"+ind+"_max"] = day.temp.max;
								obj["day"+ind+"_iconCode"] = day.weather[0].icon;
								obj["day"+ind+"_description"] = day.weather[0].description;
							});
							if (row !== null) {
								// update row
								row.update(obj).then(function(update) {
									resolve(forecast);
								});
							} else {
								// insert row
								db.Forecast.create(obj).then(function(newRow) {
									resolve(forecast);
								});
							}
						});
					} else {
						reject("no entries in forecast");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,get: function() {
			return new Promise(function(resolve, reject) {
				db.Forecast.findOne().then(function(result) {
					if (result !== null) {
						resolve(result);
					} else {
						reject("no forecast found");
					}
				}).catch(function(error) {
					reject(error);
				})
			});
		}
	};
}