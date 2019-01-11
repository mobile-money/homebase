module.exports = function(db) {
    return {
        getByTransactionId: function(user, id) {
            return new Promise(function(resolve, reject) {
                // Look for id in transaction
                db.Transaction.findById(id).then(function(trans) {
                    if (trans !== null) {
                        // Get account id from summary id
                        db.Summary.findById(trans.SummaryId).then(function(summary) {
                            if (summary !== null) {
                                db.Owner.validateAccountOwner(user.id, summary.AccountId).then(function() {
                                    db.CategorySplit.findOne({
                                        where: { transaction: id }
                                    }).then(function(categorySplit) {
                                        resolve(categorySplit);
                                    });
                                }, function() {
                                    reject('unauthorized');
                                });
                            } else {
                                console.log("no summary found for transaction " + id);
                                reject();
                            }
                        });
                    } else {
                        // Look for id in future transactions
                        db.FutureTransaction.findById(id).then(function(fTrans) {
                            if (fTrans !== null) {
                                db.Owner.validateAccountOwner(user.id, fTrans.AccountId).then(function() {
                                    db.CategorySplit.findOne({
                                        where: { transaction: id }
                                    }).then(function(categorySplit) {
                                        resolve(categorySplit);
                                    });
                                }, function() {
                                    reject('unauthorized');
                                });
                            } else {
                                // no transaction found
                                reject('not found');
                            }
                        });
                    }
                }).catch(function(error) {
                    console.log("catch error on CategorySplit controller getByTransactionId method: " + error);
                    reject();
                });
            });
        }
    };
};