var moment = require("moment");
var _ = require("underscore");

module.exports = function(db) {
    return {
        insert: function(data) {
            return new Promise(function(resolve, reject) {
                db.Schedule.findAll({
                    where: {
                        SystemId: data.system
                    }
                }).then(function(existingSchedules) {
                    var conflict = false;
                    for (var i = 0; i < existingSchedules.length; i++) {
                        var dayMatches = _.intersection(JSON.parse(existingSchedules[i].days), JSON.parse(data.days));
                        if (dayMatches.length > 0 &&
                            (moment(data.startTime, "HH:mm").isBetween(moment(existingSchedules[i].startTime, "HH:mm"), moment(existingSchedules[i].endTime, "HH:mm")) ||
                            moment(data.endTime, "HH:mm").isBetween(moment(existingSchedules[i].startTime, "HH:mm"), moment(existingSchedules[i].endTime, "HH:mm")))) {
                            conflict = true;
                            break;
                        }
                    }
                    if (!conflict) {
                        db.Schedule.create({
                            name: data.name
                            ,SystemId: data.system
                            ,days: data.days
                            ,startTime: data.startTime
                            ,endTime: data.endTime
                            ,targetTemp: data.targetTemp
                        }).then(function(result) {
                            resolve(result);
                        });
                    } else {
                        reject('There is a conflict with an existing schedule');
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,get: function(params) {
            return new Promise(function(resolve, reject) {
                db.Schedule.findAll({
                    where: params
                    ,include: [ db.System ]
                    ,order: [[ 'SystemId', 'ASC' ], [ 'startTime', 'ASC' ]]
                }).then(function(results) {
                    resolve(results);
                }).catch(function(error) {
                    reject(error);
                })
            });
        }
        ,update: function(scheduleId, data) {
            return new Promise(function(resolve, reject) {

                db.Schedule.findAll({
                    where: {
                        SystemId: data.system
                        ,id: {
                            $ne: scheduleId
                        }
                    }
                }).then(function(existingSchedules) {
                    var conflict = false;
                    for (var i = 0; i < existingSchedules.length; i++) {
                        var dayMatches = _.intersection(JSON.parse(existingSchedules[i].days), JSON.parse(data.days));
                        if (dayMatches.length > 0 &&
                            (moment(data.startTime, "HH:mm").isBetween(moment(existingSchedules[i].startTime, "HH:mm"), moment(existingSchedules[i].endTime, "HH:mm")) ||
                            moment(data.endTime, "HH:mm").isBetween(moment(existingSchedules[i].startTime, "HH:mm"), moment(existingSchedules[i].endTime, "HH:mm")))) {
                            conflict = true;
                            break;
                        }
                    }
                    if (!conflict) {
                        db.Schedule.findOne({
                            where: {
                                id: scheduleId
                            }
                        }).then(function(schedule) {
                            if (schedule !== null) {
                                schedule.name = data.name;
                                schedule.SystemId = data.system;
                                schedule.days = data.days;
                                schedule.startTime = data.startTime;
                                schedule.endTime = data.endTime;
                                schedule.targetTemp = data.targetTemp;
                                schedule.save().then(function(result) {
                                    resolve(result);
                                }).catch(function(error) {
                                    reject(error);
                                });
                            } else {
                                reject("schedule not found");
                            }
                        });
                    } else {
                        reject('There is a conflict with an existing schedule');
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
        ,delete: function(scheduleId) {
            return new Promise(function(resolve, reject) {
                db.Schedule.findOne({
                    where: {
                        id: scheduleId
                    }
                }).then(function(schedule) {
                    if (schedule !== null) {
                        schedule.destroy().then(function(result) {
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    } else {
                        reject("schedule not found");
                    }
                }).catch(function(error) {
                    reject(error);
                });
            });
        }
    };
};