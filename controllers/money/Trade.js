const moment = require("moment");
const request = require("request");
const _ = require("underscore");

function getCurrentPrice(tick,db) { // TODO: Need to update
	return new Promise(function(resolve, reject) {
		request({
			// uri: "http://finance.yahoo.com/webservice/v1/symbols/"+encodeURI(tick)+"/quote?format=json"
			uri: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22"+encodeURI(tick)+"%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback="
			,method: "GET"
			// ,headers: {
			// 	"User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; MotoG3 Build/MPI24.107-55) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.81 Mobile Safari/537.36"
			// }
		}, function(error, response, body) {
			console.log("current price response: "+response);
			console.log("current price error: "+error);
			console.log("current price body"+body);
			if (!error && response.statusCode === 200) {
				let resp = JSON.parse(body);
				// if (resp.list.meta.count === 1) {
				if (resp.query.count === 1) {
					// resolve({price: resp.list.resources[0].resource.fields.price, name: resp.list.resources[0].resource.fields.name});
					// try to find current price
					let cp = -0.01;
					if (resp.query.results.quote.Ask !== null) {
						cp = resp.query.results.quote.Ask;
					} else if (resp.query.results.quote.LastTradePriceOnly !== null) {
                        cp = resp.query.results.quote.LastTradePriceOnly;
					} else if (resp.query.results.quote.Open !== null) {
                        cp = resp.query.results.quote.Open;
					}
					resolve({price: cp, name: resp.query.results.quote.Name});
				} else if (resp.query.count === 0) { //comment
					// Ticker not found
					db.Trade.findAll({
						where: {
							ticker: tick
						}
						,order: [["transactionDate", "DESC"]]
						,limit: 1
					}).then(function(result) {
						// console.log("BLAHBLAH");
						// console.log(result);
						resolve(result);
					});
					reject(1);
				} else {
					// Ticker returned more than 1 result
					reject(2);
				}
    		} else {
    			reject(0);
    		}
		});
	});
}

module.exports = function(db,docClient) {
	return {
		add: function(data) { // TODO: Need to update
			return new Promise(function(resolve, reject) {
				db.sequelize.transaction().then(function(t) {
					// console.log("trade add transaction started");
					var transactionMoment = moment.utc(data.tDate, "MM/DD/YYYY");
					db.Position.findOne({
						where: {
							AccountId: data.account
							,ticker: data.ticker
						}
					}).then(function(position) {
						// console.log("existing position: "+position);
						if (position === null) {
							if (data.ticker === "CASH") {
								db.Position.create({
									ticker: "CASH"
									,AccountId: data.account
									,quantity: data.quantity
									,currentPrice: 1
									,name: "Cash"
								},{transaction: t}).then(function(position) {
									db.Trade.create({
										transactionDate: transactionMoment
										,description: data.description
										,ticker: "CASH"
										,quantity: data.quantity
										,price: 1
										,PositionId: position.id
									},{transaction: t}).then(function(trade) {
										t.commit();
										resolve({position: position, newTrade: trade});
									});
								});
							} else {
								getCurrentPrice(data.ticker,db).then(function(currentPrice) {
									db.Position.create({
										ticker: data.ticker
										,AccountId: data.account
										,quantity: data.quantity
										,currentPrice: currentPrice.price
										,name: currentPrice.name
									},{transaction: t}).then(function(position) {
										db.Trade.create({
											transactionDate: transactionMoment
											,description: data.description
											,ticker: data.ticker
											,quantity: data.quantity
											,price: data.price
											,PositionId: position.id
										},{transaction: t}).then(function(trade) {
											t.commit();
											resolve({position: position, newTrade: trade});
										});
									});
								}, function(error) {
									if (error === 1) {
										db.Position.create({
											ticker: data.ticker
											,AccountId: data.account
											,quantity: data.quantity
											,currentPrice: data.price
											,name: data.ticker
										},{transaction: t}).then(function(position) {
											db.Trade.create({
												transactionDate: transactionMoment
												,description: data.description
												,ticker: data.ticker
												,quantity: data.quantity
												,price: data.price
												,PositionId: position.id
											},{transaction: t}).then(function(trade) {
												t.commit();
												resolve({position: position, newTrade: trade});
											});
										});
									} else if (error === 2) {
										t.rollback();
										reject({code: 2, error: "more than one ticker returned"});
									} else {
										t.rollback();
										reject({code: 0, error: "price lookup error"});
									}
								});
							}
						} else {
							if (data.ticker === "CASH") {
								position.quantity = Number(position.quantity) + Number(data.quantity);
								position.save({transaction: t}).then(function() {
									db.Trade.create({
										transactionDate: transactionMoment
										,description: data.description
										,ticker: "CASH"
										,quantity: data.quantity
										,price: 1
										,PositionId: position.id
									},{transaction: t}).then(function(trade) {
										t.commit();
										resolve({position: position, newTrade: trade});
									});
								});
							} else {
								if (moment.utc().dayOfYear() !== moment.utc(position.updatedAt).dayOfYear()) {
									getCurrentPrice(data.ticker,db).then(function(currentPrice) {
										db.Position.update({
											currentPrice: currentPrice.price
										}
										,{
											where: {
												ticker: data.ticker
											}
											,transaction: t
										});
									}, function(error) {
										if (error.code === 1) {
											db.Position.update({
												currentPrice: data.price
											}
											,{
												where: {
													ticker: data.ticker
												}
												,transaction: t
											});
										}
									});
								}
								position.quantity = Number(position.quantity) + Number(data.quantity);
								position.save({transaction: t}).then(function() {
									db.Trade.create({
										transactionDate: transactionMoment
										,description: data.description
										,ticker: data.ticker
										,quantity: data.quantity
										,price: data.price
										,PositionId: position.id
									},{transaction: t}).then(function(trade) {
										t.commit();
										resolve({position: position, newTrade: trade});
									});
								});
							}
						}
					});
				}).catch(function(error) {
					t.rollback();
					reject({code: 99, error: error});
				});
			});
		}
        ,descriptionLookup: function(term) { // TODO: Need to update
            return new Promise(function(resolve, reject) {
                db.Trade.findAll({
                    attributes: ['description']
                    ,where: {
                        description: {
                            $like: '%'+term+'%'
                        }
                    }
                    ,order: [["description", "ASC"]]
                }).then(function(results) {
                    resolve(_.uniq(_.pluck(results, "description"), true));
                });
            });
        }
        ,dataXfer: function(start, max) {
            return new Promise(function(resolve) {
                console.log("starting trade transfer");
                let totalCount = 0;
                function getTrades(offset) {
                    console.log("starting offset: "+offset);
                    db.Trade.findAll({
                        order: [['id', 'ASC']],
                        limit: 25,
                        offset: offset
                    }).then(function (results) {
                        buildWrites(results,(offset+25));
                    }).catch(function(err) {
                        console.log("error querying trades: "+err);
                    });
                }

                function buildWrites(results,offset) {
                    if (results.length > 0 && offset <= max) {
                        totalCount += results.length;
                        let params = {
                            RequestItems: {
                                "bank_trades": []
                            }
                        };

                        results.forEach(function (result) {
                            let obj = {
                                PutRequest: {
                                    Item: {
                                        position_id: result.PositionId.toString(),
                                        id: result.id.toString(),
                                        transactionDate: moment(result.transactionDate).format("YYYY-MM-DDTHH:mm:ss[Z]"),
                                        description: result.description,
                                        ticker: result.ticker,
                                        quantity: Number(result.quantity),
                                        price: Number(result.price),
                                        created_at: Number(moment.utc().format("X"))
                                    }
                                }
                            };
                            params.RequestItems.bank_trades.push(obj);
                        });
                        sendWrites(params,offset);
                    } else {
                        console.log(`trade transfer complete. transferred ${totalCount} items`);
                        resolve();
                    }
                }
                function sendWrites(params,offset) {
                    // var docClient = new AWS.DynamoDB.DocumentClient();
                    docClient.batchWrite(params, function (err/*, data*/) {
                        if (err) {
                            console.error("Unable to xfer trades data. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            // console.log("Xfer car data succeeded:", JSON.stringify(params, null, 2));
                            console.log("batch transfer complete");
                            getTrades(offset);
                        }
                    });
                }

                getTrades(start);
            });
        }
	}
};