var _ = require("underscore");
var moment = require("moment");

module.exports = function(db) {
	return {
		getByAccountId: function(id) {
			return new Promise(function(resolve, reject) {
				db.Summary.findAll({
					where: {
						AccountId: id
						,initial: false
					}
					,order: [['start', 'DESC']]
				})
				.then(
					function(results) {
						resolve(results);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
		,getAll: function() {
			return new Promise(function(resolve, reject) {
				db.Summary.findAll({
					order: [["start", "DESC"]]
					,initial: false
				})
				.then(
					function(results) {
						resolve(results);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
		,getAllUnique: function() {
			return new Promise(function(resolve, reject) {
				db.Summary.findAll({
					where: {
						initial: false
					}
					,attributes: ["start", "end", "id"]
					,order: [["start", "DESC"]]
				})
				.then(
					function(results) {
						var dedupe = [];
						var summs = [];
						var x = 1;
						for (var i = 0, len = results.length; i < len; i++) {
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
					}
				)
				.catch(
					function(error) {
						reject({code: -1, error: error});
					}
				);
			});
		}
	};
}