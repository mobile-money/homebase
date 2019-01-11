// const _ = require("underscore");
const moment = require("moment");

module.exports = function(db) {
	return {
		getByAccountId: function(user, id) {
			return new Promise(function(resolve, reject) {
				db.Owner.validateAccountOwner(user.id, id).then(function() {
					db.Summary.findAll({
						where: {
							AccountId: id
							,initial: false
						}
						,order: [['start', 'DESC']]
					}).then(function(results) {
						resolve(results);
					});
				}, function() {
					reject("unauthorized");
				}).catch(function(error) {
					console.log("catch error on Summary controller getByAccountId method: " + error);
					reject();
				});
			});
		}
		,getAll: function(user) {
			return new Promise(function(resolve, reject) {
				db.Owner.getAllowedAccounts(user.id).then(function(allowedAccounts) {
					db.Summary.findAll({
						where: { AccountId: { $in: allowedAccounts } }
						,order: [["start", "DESC"]]
						,initial: false
					}).then(function(results) {
						resolve(results);
					});
				}, function(error) {
					console.log("error getting allowed accounts: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on Summary controller getAll method: " + error);
					reject();
				});
			});
		}
		,getAllUnique: function(user) {
			return new Promise(function(resolve, reject) {
				db.Owner.getAllowedAccounts(user.id).then(function(allowedAccounts) {
					db.Summary.findAll({
						where: {
							initial: false,
							AccountId: { $in: allowedAccounts }
						}
						,attributes: ["start", "end", "id"]
						,order: [["start", "DESC"]]
					}).then(function(results) {
						let dedupe = [];
						let summs = [];
						let x = 1;
						for (let i = 0, len = results.length; i < len; i++) {
							if (i !== 0) {
								if (moment(results[i].start).format('x') !== moment(results[i-1].start).format('x')) {
									dedupe[i-x].summaries = summs;
									summs = [];
									summs.push(results[i].id);
									dedupe.push({start: results[i].start, end: results[i].end});
									if (i === (len - 1)) {
										dedupe[dedupe.length - 1].summaries = summs;
									}
									x = 1;
								} else {
									x++;
									summs.push(results[i].id);
									if (i === (len - 1)) {
										dedupe[dedupe.length - 1].summaries = summs;
									}
								}
							} else {
								summs.push(results[i].id);
								dedupe.push({start: results[i].start, end: results[i].end});
								x = 1;
							}
						}
						resolve(dedupe);
					});
				}, function(error) {
					console.log("error getting allowed accounts: " + error);
					reject();
				}).catch(function(error) {
					console.log("catch error on Summary controller getAllUnique method: " + error);
					reject();
				});
			});
		}
	};
};