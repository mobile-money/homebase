module.exports = function(db) {
	return {
		getAll: function() {
			return new Promise(function(resolve, reject) {
				db.Category.findAll({
					order: [["name", "ASC"]]
				})
				.then(
					function(categories) {
						resolve(categories);
					}
					,function(error) {
						reject(error);
					}
				);
			});
		}
		,add: function(data) {
			return new Promise(function(resolve, reject) {
				var exp = true;
				if (data.expense === "false") {
					exp = false;
				}
				db.Category.create({
					name: data.name
					,expense: exp
				})
				.then(
					function(category) {
						resolve(category);
					}
					,function(error) {
						reject(error);
					}
				);
			});
		}
		,update: function(data) {
			return new Promise(function(resolve, reject) {
				db.Category.findById(data.id)
				.then(
					function(category) {
						var exp = true;
						if (data.expense === "false") {
							exp = false;
						}
						category.name = data.name;
						category.expense = exp;
						category.save()
						.then(
							function(category) {
								category.reload();
								resolve(category);
							}
						);
					}
				)
				.catch(
					function(error) {
						reject(error);
					}
				);
			});
		}
		,delete: function(id) {
			return new Promise(function(resolve, reject) {
				db.Category.destroy({
					where: {
						id: id
					}
				})
				.then(
					function(rows) {
						if (rows === 1) {
							resolve();
						} else {
							reject({code: 1});
						}
					}
					,function(error) {
						reject({code: -1, error: error});
					}
				);
			});
		}
	};
}