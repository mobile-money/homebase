var moment = require("moment");
var _ = require("underscore");

module.exports = function(db) {
	return {
		get: function(params) {
			return new Promise(function(resolve, reject) {
				db.System_Run.findAll({
					where: params
					,include: [ db.System ]
					,order: [[ 'on', 'DESC' ]]
				}).then(function(results) {
					resolve(results);
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,start: function(data) {
			return new Promise(function(resolve, reject) {
				db.System_Run.create({
					on: moment().format("YYYY-MM-DD HH:mm:ss")
					,SystemId: data.systemId
				}).then(function(result) {
					db.System.findById(data.systemId).then(function(system) {
						resolve({run: result, controlPin: system.controlPin});
					});
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,stop: function(data) {
			return new Promise(function(resolve, reject) {
				db.System.findById(data.systemId).then(function(system) {
					if (system !== null) {
						db.System_Run.findOne({
							where: {
								SystemId: data.systemId
								,off: null
							}
							,order: [[ "on", "DESC" ]]
						}).then(function(run) {
							if (run !== null) {
								run.off = moment().format("YYYY-MM-DD HH:mm:ss");
								run.save().then(function(result) {
									resolve({run: result, controlPin: system.controlPin});
								});
							} else {
								resolve({controlPin: system.controlPin});
							}
						});
					} else {
						reject("system not found");
					}
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,chartData: function(data) {
			return new Promise(function(resolve, reject) {
				var sysId = JSON.parse(data.systemId);
				var startDay = moment.utc(data.startTime, "x").startOf("day");
				var insertDay = moment.utc(data.startTime, "x").startOf("day");
				var endDay = moment.utc(data.endTime, "x").endOf("day");
				var totalDays = endDay.diff(startDay, "days");
				var days = [insertDay.format("MMM DD, YYYY")];
				for (var i = 0; i < totalDays; i++) {
					days.push(insertDay.add(1, "days").format("MMM DD, YYYY"));
				}
				db.System_Run.findAll({
					where: {
						SystemId: sysId
						,on: {
							$gte: startDay
						}
						,off: {
							$lte: endDay
						}
					}
					,order: [[ "on", "ASC" ]]
					// ,include: [ db.System ]
				}).then(function(runs) {
					// var data = [];
					var minuteData = {name: "Minutes", type: "column", data: []};
					var countData = {name: "Run Count", type:"spline", data: []};
					var averageData = {name: "Minutes per Run", type: "spline", data: []};
					// sysIds.forEach(function(sysId) {
						// var sysData = {name: "", data: []};
						days.forEach(function(day) {
							// var count = 0;
							var minutes = 0;
							var count = 0;
							runs.forEach(function(run) {
								// if (run.SystemId === sysId) {
									// sysData.name = run.System.name+" - Minutes";
									// if (moment.utc(day, "MMM DD, YYYY").isSame(moment.utc(run.on), "day")) {
									// 	if (moment.utc(day, "MMM DD, YYYY").isSame(moment.utc(run.off), "day")) {
									// 		count += moment.utc(run.off).diff(moment.utc(run.on), "minutes");
									// 	} else {
									// 		var tmp = moment.utc(run.on).add(1, "day").startOf("day");
									// 		count += tmp.diff(moment.utc(run.on), "minutes");
									// 	}
									// } else if (moment.utc(day, "MMM DD, YYYY").isSame(moment.utc(run.off), "day")) {
									// 	count += moment.utc(run.off).diff(moment.utc(day, "MMM DD, YYYY"), "minutes");
									// }
									if (moment.utc(day, "MMM DD, YYYY").isSame(moment.utc(run.on), "day")) {
										minutes += moment.utc(run.off).diff(moment.utc(run.on), "minutes");
										count++;
									}
								// }
							});
							// sysData.data.push([Number(moment(day, "MMM DD, YYYY").format("x")), count]);
							minuteData.data.push(minutes);
							countData.data.push(count);
							if (count !== 0) {
								averageData.data.push(Number((minutes / count).toFixed(1)));								
							} else {
								averageData.data.push(0);								
							}
						});
						// data.push(sysData);
					// });
					// resolve({days: days, data: data});
					resolve({days: days, minutes: minuteData, counts: countData, averages: averageData});
				}).catch(function(error) {
					reject(error);
				});
			});
		}
		,plotBands: function(data) {
			return new Promise(function(resolve, reject) {
				db.System.findAll({
					where: {
						LocationId: {
							$in: JSON.parse(data.locations)
						}
					}
				}).then(function(systems) {
					if (systems.length > 0) {
						var sysIds = _.pluck(systems, "id");
						db.System_Run.findAll({
							where: {
								SystemId: {
									$in: sysIds
								}
								,on: {
									$gte: moment.utc(data.startTime,'x')
								}
								,off: {
									$or: {
										$eq: null
										,$lte: moment.utc(data.endTime,'x')
									}
								}
							}
						}).then(function(runs) {
							if (runs.length > 0) {
								var bands = [];
								runs.forEach(function(run) {
									var offTime = moment.utc().format("x");
									if (run.off !== null) {
										offTime = moment.utc(run.off, "YYYY-MM-DD HH:mm:ss").format("x");
									}
									bands.push({
										from: moment.utc(run.on, "YYYY-MM-DD HH:mm:ss").format("x")
										,to: offTime
										,color: '#efb8b8'
									});
								});
								resolve(bands);
							} else {
								resolve(null);
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
	};
}