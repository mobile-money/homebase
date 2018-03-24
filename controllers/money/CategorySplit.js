module.exports = function(db) {
    return {
        getByTransactionId: function(id) {
            return new Promise(function(resolve, reject) {
                db.CategorySplit.findOne({
                    where: { transaction: id }
                }).then(function(categorySplit) {
                    resolve(categorySplit);
                }
                ,function(error) {
                    reject(error);
                });
            });
        }
    };
};