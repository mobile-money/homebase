// var AWS = require("aws-sdk");
// const _ = require("underscore");
const moment = require("moment");
// const uuid = require("uuid/v4");

module.exports = function(db,docClient) {
    return {
        getByTransactionId: function(id) {
            return new Promise(function(resolve, reject) {
                //     db.CategorySplit.findOne({
                //         where: { transaction: id }
                //     }).then(function(categorySplit) {
                //         resolve(categorySplit);
                //     }
                //     ,function(error) {
                //         reject(error);
                //     });
                // });

                // var docClient = new AWS.DynamoDB.DocumentClient();
                let transParams = {
                    TableName: "bank_category_splits",
                    Key: {
                        transaction_id: id
                    }
                };
                docClient.get(transParams, function (err, data) {
                    // console.log(transData);
                    if (err) {
                        console.error("Unable to get category splits. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        resolve(data.Item);
                    }
                });
            });
        }
        ,dataXfer: function(start,max) {
            return new Promise(function(resolve) {
                console.log("starting category splits transfer");
                let totalCount = 0;
                function getTrans(offset) {
                    console.log("starting offset: "+offset);
                    db.CategorySplit.findAll({
                        order: [['transaction', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying category splits: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0 && offset <= max) {
                        totalCount += results.length;
                        let params = {
                            RequestItems: {
                                "bank_category_splits": []
                            }
                        };

                        results.forEach(function (result) {
                            let obj = {
                                PutRequest: {
                                    Item: {
                                        transaction_id: result.transaction.toString(),
                                        payload: result.payload.toString(),
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };

                            params.RequestItems.bank_category_splits.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log(`category splits transfer complete. transferred ${totalCount} items`);
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    // var docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err/*, data*/) {
                        if (err) {
                            console.error("Unable to xfer category splits data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getTrans(offset);
                        }
                    });
                }
                getTrans(start);
            });
        }
    };
};