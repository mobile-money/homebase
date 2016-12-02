var moment = require("moment");
var _ = require("underscore");

function findSystem(db, locId) {
	return new Promise(function(resolve, reject) {
		db.System.findOne({
			where: {
				LocationId: locId
			}
		}).then(function(result) {
			resolve(result);
		}).catch(function(error) {
			reject(error);
		});
	});
}

function findCurrentSchedule(db, locId) {
	return new Promise(function(resolve, reject) {
		db.System.findOne({
			where: {
				LocationId: locId
			}
		}).then(function(system) {
			if (system !== null) {
				db.Schedule.findOne({
					where: {
						SystemId: system.id
						,days: "[-1]"
					}
				}).then(function(holdSched) {
					if (holdSched !== null) {
						resolve(holdSched);
					} else {
						db.Schedule.findAll({
							where: {
								SystemId: system.id
								,days: {
									$like: '%'+moment().format("d")+'%'
								}
							}
						}).then(function(schedules) {
							var matchedSched = null;
							for (var i = 0; i < schedules.length; i++) {
								if (moment().isBetween(moment(schedules[i].startTime,"HH:mm"),moment(schedules[i].endTime, "HH:mm"))) {
									matchedSched = schedules[i];
									break;
								}
							}
							resolve(matchedSched);
						});
					}
				});
			} else {
				resolve(null);
			}
		}).catch(function(error) {
			reject(error);
		});
	});
}

function determineSystemAction(db, locId, currentTemp, targetTemp) {
	return new Promise(function(resolve, reject) {
		var systemAction = null;
		db.System.findOne({
			where: {
				LocationId: locId
			}
		}).then(function(system) {
			if (system !== null) {
				db.System_Run.findOne({
					where: {
						SystemId: system.id
						,off: null
					}
				}).then(function(currentRuns) {
					var buffer = 0;
					// heat
					// currently on, +2 over target
					// not currently on, -2 under target
					// cool
					// currently on, -2 under target
					// not currently on, +2 over target
					if (currentRuns === null) {
						// not currently on
						buffer = buffer * -1;
					} else {
						// currently on
						// buffer = buffer;
					}
					if (system.state !== 0) {
						if (system.heat) {
							if (system.state === 1 || (targetTemp + buffer) > currentTemp) {
								systemAction = "heat";
							}
						} else {
							if (system.state === 1 || (targetTemp + (buffer * -1)) < currentTemp) {
								systemAction = "cool";
							}
						}
					}
					resolve(systemAction);
				});
			} else {
				reject("system not found");
			}
		}).catch(function(error) {
			reject(error);
		});
	});
}

module.exports = function(db) {
	return {
		insert: function(data) {
			return new Promise(function(resolve, reject) {
				db.Sensor.findById(data.sensorId).then(function(sensor) {
					if (sensor !== null) {
						db.EnvData.create({
							LocationId: sensor.LocationId
							,temperature: data.temperature
							,humidity: data.humidity
						}).then(function(result){
							findSystem(db, sensor.LocationId).then(function(system) {
								if (system !== null) {
									findCurrentSchedule(db, sensor.LocationId).then(function(schedule) {
										if (schedule !== null) {
											determineSystemAction(db, sensor.LocationId, result.temperature, schedule.targetTemp).then(function(systemAction) {
												resolve({data: result, system: system, schedule: schedule, systemAction: systemAction});
											});
										} else {
											resolve({data: result, system: system, schedule: null, systemAction: null});
										}
									});
								} else {
									resolve({data: result, system: null, schedule: null, systemAction: null});
								}
							});
						});
					} else {
						reject("sensor not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,get: function(params) {
			return new Promise(function(resolve, reject) {
				db.EnvData.findAll({
					where: params
					,include : [ db.Location ]
					,order: [[ 'createdAt', 'DESC' ]]
					,limit: 1000
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,lineChart: function(data) {
			return new Promise(function(resolve, reject) {
				var locs = JSON.parse(data.locations);
				db.EnvData.findAll({
					where: {
						LocationId: {
							$in: locs
						}
						,createdAt: {
							$between: [moment.utc(data.startTime,'x').startOf("day").format("YYYY-MM-DD HH:mm:ss"), moment.utc(data.endTime,'x').endOf("day").format("YYYY-MM-DD HH:mm:ss")]
						}
					}
					,include: [ db.Location ]
					,order: [[ 'createdAt', 'ASC' ]]
				}).then(function(results) {
					if (results.length === 0) {
						resolve({data: null});
					} else {
						var chartData = [];
						var times = _.pluck(results, "createdAt");
						locs.forEach(function(loc) {
							var locList = _.where(results, { LocationId: loc });

							var nameStr = locList[0].Location.floor + ' ' + locList[0].Location.room;
							if (locList[0].Location.note !== null) {
								nameStr += " (" + locList[0].Location.note + ")";
							}
							var locTempObj = { name: nameStr + " - Temperature", data: [] };
							var locHumdObj = { name: nameStr + " - Humidity", data: [] };
							locList.forEach(function(row) {
								if (data.temperature) {
									var tarr = [moment(row.createdAt,"YYYY-MM-DD HH:mm:ss").valueOf(), Number((row.temperature * (9/5) + 32).toFixed(1))];
									locTempObj.data.push(tarr);
								}
								if (data.humidity) {
									var harr = [moment(row.createdAt,"YYYY-MM-DD HH:mm:ss").valueOf(), row.humidity];
									locHumdObj.data.push(harr);
								}
							});

							if (data.temperature) {
								chartData.push(locTempObj);
							}
							if (data.humidity) {
								chartData.push(locHumdObj);
							}
						});
						resolve({data: chartData, xAxis: times});
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,lastReading: function(id) {
			return new Promise(function(resolve, reject) {
				db.Location.findById(id).then(function(location) {
					if (location !== null) {
						db.EnvData.findOne({
							where: {
								LocationId: id
							}
							,order: [[ "createdAt", "DESC" ]]
						}).then(function(result) {
							if (result !== null) {
								findSystem(db, id).then(function(system) {
									if (system !== null) {
										findCurrentSchedule(db, id).then(function(schedule) {
											if (schedule !== null) {
												determineSystemAction(db, id, result.temperature, schedule.targetTemp).then(function(systemAction) {
													resolve({data: result, location: location, system: system, schedule: schedule, systemAction: systemAction});
												});
											} else {
												resolve({data: result, location: location, system: system, schedule: null, systemAction: null});
											}
										});
									} else {
										resolve({data: result, location: location, system: null, schedule: null, systemAction: null});
									}
								});
							} else {
								resolve({data: null, location: location, system: null, schedule: null, systemAction: null});
							}
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