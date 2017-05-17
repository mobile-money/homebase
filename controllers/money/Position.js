var moment = require("moment");
var request = require("request");

module.exports = function(db) {
	return {
		updatePrice: function(tick) {
			return new Promise(function(resolve, reject) {
				db.Position.findOne({
					where: {
						ticker: tick
					}
					,order: [["updatedAt", "ASC"]]
				})
				.then(
					function(position) {
						if (position === null) {
							// no position found
							reject({code: 1});
						} else {
							// console.log(encodeURI(tick));
							if (moment.utc().dayOfYear() !== moment.utc(position.updatedAt).dayOfYear()) {
								request({
									// uri: "http://finance.yahoo.com/webservice/v1/symbols/"+encodeURI(tick)+"/quote?format=json&view=detail"
									uri: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22"+encodeURI(tick)+"%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback="
									,method: "GET"
									// ,headers: {
									// 	"User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; MotoG3 Build/MPI24.107-55) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.81 Mobile Safari/537.36"
									// }
								}, function(error, response, body) {
									if (!error && response.statusCode == 200) {
										var resp = JSON.parse(body);
										// if (resp.list.meta.count === 1) {
										if (resp.query.count === 1) {
											db.Position.update({
												// currentPrice: resp.list.resources[0].resource.fields.price
												// ,name: resp.list.resources[0].resource.fields.name
												currentPrice: resp.query.results.quote.Ask
												,name: resp.query.results.quote.Name
											}
											,{
												where: { ticker: tick }
											}).then(function() {
												// resolve({code: 0, price: resp.list.resources[0].resource.fields.price});
												resolve({code: 0, price: resp.query.results.quote.Ask});
											}
											,function(error) {
												// Position update error
												reject({code: 5, error: error});
											});
										} else if (resp.list.meta.count === 0) {
											// Ticker not found
											db.Trade.findAll({
												where: {
													ticker: tick
												}
												,order: [["transactionDate", "DESC"]]
												,limit: 1
											}).then(function(result) {
												if (result.length === 1) {
													db.Position.update({
														currentPrice: result[0].price
													}
													,{
														where: { ticker: tick }
													}).then(function() {
														resolve({code: 0, price: result[0].price});
													}
													,function(error) {
														// Position update error
														reject({code: 5, error: error});
													});												
												} else {
													db.Position.update({
														updatedAt: moment.utc()
													}
													,{
														where: { ticker: tick }
													}).then(function() {
														reject({code: 2});
													});
												}
											});
										} else {
											// Ticker returned more than 1 result
											reject({code: 3});
										}
						    		} else {
						    			// REST call error
										db.Trade.findAll({
											where: {
												ticker: tick
											}
											,order: [["transactionDate", "DESC"]]
											,limit: 1
										}).then(function(result) {
											if (result.length === 1) {
												db.Position.update({
													currentPrice: result[0].price
												}
												,{
													where: { ticker: tick }
												}).then(function() {
													resolve({code: 0, price: result[0].price});
												}
												,function(error) {
													// Position update error
													reject({code: 5, error: error});
												});
											} else {
												reject({code: 4, error: error});
											}
										});
						    		}
								});
							} else {
								// no need to update
								resolve({code: 1});
							}
						}
					}
				)
				.catch(
					function(error) {
						reject({code: 99, error: error});
					}
				);
			});
		}
	};
}