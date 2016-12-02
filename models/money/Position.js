var moment = require("moment");
var request = require("request");

// function getCurrentPrice(tick) {
// 	return new Promise(function(resolve, reject) {
// 		request("http://finance.yahoo.com/webservice/v1/symbols/"+tick+"/quote?format=json", function(error, response, body) {
// 			if (!error && response.statusCode == 200) {
// 				var resp = JSON.parse(body);
// 				if (resp.list.meta.count === 1) {
// 					resolve({price: resp.list.resources[0].resource.fields.price, name: resp.list.resources[0].resource.fields.name});
// 				} else if (resp.list.meta.count === 0) {
// 					// Ticker not found
// 					reject(1);
// 				} else {
// 					// Ticker returned more than 1 result
// 					reject(2);
// 				}
//     		} else {
//     			reject(0);
//     		}
// 		});
// 	});
// }

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Position', {
		ticker: {
			type: DataTypes.STRING
			,allowNull: false
			,validate: {
				len: [1, 10]
			}
		}
		,name: {
			type: DataTypes.STRING
			,allowNull: true
		}
		,quantity: {
			type: DataTypes.DECIMAL(7,3)
			,allowNull: false
		}
		,currentPrice: {
			type: DataTypes.DECIMAL(7,3)
			,allowNull: false
		}
	}
	,{
	// 	paranoid: true
		// hooks: {
		// 	beforeFind: function(position) {
		// 		console.log(position);
		// 	}
		// }
	});
}