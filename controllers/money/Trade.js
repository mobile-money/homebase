var moment = require("moment");
var request = require("request");

function getCurrentPrice(tick,db) {
	return new Promise(function(resolve, reject) {
		request("http://finance.yahoo.com/webservice/v1/symbols/"+tick+"/quote?format=json", function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var resp = JSON.parse(body);
				if (resp.list.meta.count === 1) {
					resolve({price: resp.list.resources[0].resource.fields.price, name: resp.list.resources[0].resource.fields.name});
				} else if (resp.list.meta.count === 0) {
					// Ticker not found
					db.Trade.findAll({
						where: {
							ticker: tick
						}
						,order: [["transactionDate", "DESC"]]
						,limit: 1
					}).then(function(result) {
						console.log("BLAHBLAH");
						console.log(result);
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

module.exports = function(db) {
	return {
		add: function(data) {
			return new Promise(function(resolve, reject) {
				db.sequelize.transaction()
				.then(
					function(t) {
						var transactionMoment = moment.utc(data.tDate, "MM/DD/YYYY");
						db.Position.findOne({
							where: {
								AccountId: data.account
								,ticker: data.ticker
							}
						})
						.then(
							function(position) {
								if (position === null) {
									if (data.ticker === "CASH") {
										db.Position.create({
											ticker: "CASH"
											,AccountId: data.account
											,quantity: data.quantity
											,currentPrice: 1
											,name: "Cash"
										}
										,{transaction: t})
										.then(
											function(position) {
												db.Trade.create({
													transactionDate: transactionMoment
													,description: data.description
													,ticker: "CASH"
													,quantity: data.quantity
													,price: 1
													,PositionId: position.id
												}
												,{transaction: t})
												.then(
													function(trade) {
														t.commit();
														resolve({position: position, newTrade: trade});
													}
												);
											}
										);
									} else {
										getCurrentPrice(data.ticker,db)
										.then(
											function(currentPrice) {
												db.Position.create({
													ticker: data.ticker
													,AccountId: data.account
													,quantity: data.quantity
													,currentPrice: currentPrice.price
													,name: currentPrice.name
												}
												,{transaction: t})
												.then(
													function(position) {
														db.Trade.create({
															transactionDate: transactionMoment
															,description: data.description
															,ticker: data.ticker
															,quantity: data.quantity
															,price: data.price
															,PositionId: position.id
														}
														,{transaction: t})
														.then(
															function(trade) {
																t.commit();
																resolve({position: position, newTrade: trade});
															}
														);
													}
												);
											}
											,function(error) {
												if (error === 1) {
													db.Position.create({
														ticker: data.ticker
														,AccountId: data.account
														,quantity: data.quantity
														,currentPrice: data.price
														,name: data.ticker
													}
													,{transaction: t})
													.then(
														function(position) {
															db.Trade.create({
																transactionDate: transactionMoment
																,description: data.description
																,ticker: data.ticker
																,quantity: data.quantity
																,price: data.price
																,PositionId: position.id
															}
															,{transaction: t})
															.then(
																function(trade) {
																	t.commit();
																	resolve({position: position, newTrade: trade});
																}
															);
														}
													);
												} else if (error === 2) {
													t.rollback();
													reject({code: 2, error: "more than one ticker returned"});
												} else {
													t.rollback();
													reject({code: 0, error: "price lookup error"});
												}
											}
										);
									}
								} else {
									if (data.ticker === "CASH") {
										position.quantity = Number(position.quantity) + Number(data.quantity);
										position.save({transaction: t})
										.then(
											function() {
												db.Trade.create({
													transactionDate: transactionMoment
													,description: data.description
													,ticker: "CASH"
													,quantity: data.quantity
													,price: 1
													,PositionId: position.id
												}
												,{transaction: t})
												.then(
													function(trade) {
														t.commit();
														resolve({position: position, newTrade: trade});
													}
												);
											}
										);
									} else {
										if (moment.utc().dayOfYear() !== moment.utc(position.updatedAt).dayOfYear()) {
											getCurrentPrice(data.ticker,db)
											.then(
												function(currentPrice) {
													db.Position.update({
														currentPrice: currentPrice.price
													}
													,{
														where: {
															ticker: data.ticker
														}
														,transaction: t
													});
												}
												,function(error) {
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
												}
											);
										}
										position.quantity = Number(position.quantity) + Number(data.quantity);
										position.save({transaction: t})
										.then(
											function() {
												db.Trade.create({
													transactionDate: transactionMoment
													,description: data.description
													,ticker: data.ticker
													,quantity: data.quantity
													,price: data.price
													,PositionId: position.id
												}
												,{transaction: t})
												.then(
													function(trade) {
														t.commit();
														resolve({position: position, newTrade: trade});
													}
												);
											}
										);
									}
								}
							}
						)
					}
				)
				.catch(
					function(error) {
						t.rollback();
						reject({code: 99, error: error});
					}
				);
			});
		}
	}
}