var AWS = require("aws-sdk");
var _ = require("underscore");
var moment = require("moment");
var uuid = require("uuid/v4");

function addTimeString(date) {
    return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
}

module.exports = function(db) {
	return {
		getByAccountId: function(id) {
			return new Promise(function(resolve, reject) {
				// db.Summary.findAll({
				// 	where: {
				// 		AccountId: id
				// 		,initial: false
				// 	}
				// 	,order: [['start', 'DESC']]
				// }).then(function(results) {
				// 	resolve(results);
				// }).catch(function(error) {
				// 	reject(error);
				// });

                var docClient = new AWS.DynamoDB.DocumentClient();
                var summParams = {
                    TableName: "bank_summaries",
                    IndexName: "account_id-start-index",
                    KeyConditions: {
                        account_id: {
                            ComparisonOperator: "EQ",
                            AttributeValueList: [
                                id
                            ]
                        }
                    },
                    ScanIndexForward: false
                };

                docClient.query(summParams, function (err, summData) {
                    if (err) {
                        console.error("Unable to get summaries for "+id+". Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                        console.log("Get summaries for "+id+" succeeded");
						resolve(summData.Items);
                    }
                });
			});
		}
		,getAll: function() {
			return new Promise(function(resolve, reject) {
				// db.Summary.findAll({
				// 	order: [["start", "DESC"]]
				// 	,initial: false
				// }).then(function(results) {
				// 	resolve(results);
				// }).catch(function(error) {
				// 	reject(error);
				// });

                var docClient = new AWS.DynamoDB.DocumentClient();
                var summParams = {
                    TableName: "bank_summaries",
                    ScanFilter: {
                        account_id: {
                            ComparisonOperator: "NOT_NULL"
                        },
                        id: {
                            ComparisonOperator: "NOT_NULL"
                        },
                        initial: {
                            ComparisonOperator: "EQ",
                            AttributeValueList: [
                                false
                            ]
                        }
                    },
                    ScanIndexForward: false
                };

                docClient.scan(summParams, function (err, summData) {
                    if (err) {
                        console.error("Unable to get summaries. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                        console.log("Get summaries succeeded");
                        resolve(summData.Items);
                    }
                });
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
        ,dataXfer: function() {
            return new Promise(function(resolve,reject) {
                console.log("starting summary transfer");
                function getSummaries(offset) {
                    console.log("starting offset: "+offset);
                    db.Summary.findAll({
                        order: [['id', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying summaries: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0) {
                        var params = {
                            RequestItems: {
                                "bank_summaries": []
                            }
                        };

                        results.forEach(function (result) {
                            var obj = {
                                PutRequest: {
                                    Item: {
                                    	account_id: result.AccountId.toString(),
                                        id: result.id.toString(),
                                        balance: Number(result.balance),
                                        initial: false,
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            if (result.initial) {
                                obj.PutRequest.Item.initial = true;
                            }
                            if (result.start) {
                                obj.PutRequest.Item.start = moment.utc(result.start).format("YYYY-MM-DDTHH:mm:ss[Z]");
							}
							if (result.end) {
                                obj.PutRequest.Item.end = moment.utc(result.end).format("YYYY-MM-DDTHH:mm:ss[Z]");
							}
                            params.RequestItems.bank_summaries.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log("summary transfer complete");
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    var docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err, data) {
                        if (err) {
                            console.error("Unable to xfer summaries data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getSummaries(offset);
                        }
                    });
                }

                getSummaries(0);
            });
        }
	};
};