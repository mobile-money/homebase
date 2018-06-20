// const AWS = require("aws-sdk");
const _ = require("underscore");
const moment = require("moment");
const uuid = require("uuid/v4");

// function addTimeString(date) {
//     return date+"T"+moment.utc().format('HH:mm:ss')+"Z"
// }

module.exports = function(db,docClient) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
				// db.Category.findAll({
				// 	order: [["name", "ASC"]]
				// })
				// .then(
				// 	function(categories) {
				// 		resolve(categories);
				// 	}
				// 	,function(error) {
				// 		reject(error);
				// 	}
				// );

                // let docClient = new AWS.DynamoDB.DocumentClient();
                let params = {
                    TableName: "bank_categories",
                    ScanFilter: {
                        id: {
                            ComparisonOperator: "NOT_NULL",
                        },
						deleted_at: {
                        	ComparisonOperator: "NULL"
						}
                    }
                };

                docClient.scan(params, function (err, data) {
                    if (err) {
                        console.error("Unable to get categories. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        // console.log("Get mx logs succeeded:", JSON.stringify(data, null, 2));
                        console.log("Get categories succeeded");
                        resolve(_.sortBy(data.Items,"name"));
                    }
                });
			});
		}
		,add: function(data) {
			return new Promise(function(resolve, reject) {
				// var exp = true;
				// if (data.expense === "false") {
				// 	exp = false;
				// }
				// db.Category.create({
				// 	name: data.name
				// 	,expense: exp
				// }).then(function(category) {
				// 	resolve(category);
				// },function(error) {
				// 	reject(error);
				// });

                // let docClient = new AWS.DynamoDB.DocumentClient();

                let id = uuid();
                let params = {
                    TableName: "bank_categories",
                    Item: {
                        id: id,
                        name: data.name.trim(),
                        expense: false,
                        created_at: Number(moment.utc().format("X"))
                    }
                };
                if (data.expense) {
                	params.Item.expense = true;
				}

                docClient.put(params, function(err, data) {
                    if (err) {
                        console.error("Unable to insert category. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Insert category succeeded:", JSON.stringify(data, null, 2));
                        resolve(data);
                    }
                });
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				// db.Category.findById(data.id).then(function(category) {
				// 	var exp = true;
				// 	if (data.expense === "false") {
				// 		exp = false;
				// 	}
				// 	category.name = data.name;
				// 	category.expense = exp;
				// 	category.save()
				// 	.then(
				// 		function(category) {
				// 			category.reload();
				// 			resolve(category);
				// 		}
				// 	);
				// }).catch(function(error) {
				// 	reject(error);
				// });

                // let docClient = new AWS.DynamoDB.DocumentClient();

                let params = {
                    TableName: "bank_categories",
					Key: {
                    	id: data.id
					},
					AttributeUpdates: {
                    	name: {
                    		Action: "PUT",
							Value: data.name
						},
                        updated_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
					},
                    ReturnValues: "ALL_NEW"
                };
                if (data.expense === "true") {
                    params.AttributeUpdates.expense = {
                    	Action: "PUT",
						Value: true
                    };
                } else {
                    params.AttributeUpdates.expense = {
                        Action: "PUT",
                        Value: false
                    };
				}

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update category. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Update category succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				// db.Category.destroy({
				// 	where: {
				// 		id: id
				// 	}
				// }).then(function(rows) {
				// 	if (rows === 1) {
				// 		resolve();
				// 	} else {
				// 		reject({code: 1});
				// 	}
				// },function(error) {
				// 	reject({code: -1, error: error});
				// });

                // let docClient = new AWS.DynamoDB.DocumentClient();

                let params = {
                    TableName: "bank_categories",
                    Key: {
                        id: id
                    },
                    AttributeUpdates: {
                        deleted_at: {
                            Action: "PUT",
                            Value: Number(moment.utc().format("X"))
                        }
                    },
                    ReturnValues: "ALL_NEW"
                };

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.error("Unable to delete category. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        console.log("Delete category succeeded:", JSON.stringify(data, null, 2));
                        resolve(data.Attributes);
                    }
                });
			});
		}
		,dataXfer: function(start,max) {
            return new Promise(function(resolve) {
                console.log("starting category transfer");
                let totalCount = 0;
                function getCategories(offset) {
                    console.log("starting offset: "+offset);
                    db.Category.findAll({
                        order: [['id', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying categories: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0 && offset <= max) {
                        totalCount += results.length;
                        let params = {
                            RequestItems: {
                                "bank_categories": []
                            }
                        };

                        results.forEach(function (result) {
                            let obj = {
                                PutRequest: {
                                    Item: {
                                        id: result.id.toString(),
                                        name: result.name,
                                        expense: false,
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            if (result.expense) {
                                obj.PutRequest.Item.expense = true;
                            }
                            params.RequestItems.bank_categories.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log(`category transfer complete. transferred ${totalCount} items`);
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    let docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err) {
                        if (err) {
                            console.error("Unable to xfer categories data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getCategories(offset);
                        }
                    });
                }
                getCategories(start);
            });
        }
	};
};