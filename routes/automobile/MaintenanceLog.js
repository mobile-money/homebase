module.exports = function(app, MaintenanceLog, _) {
    // Insert mx
    app.post("/api/v1/automobile/mx_log", function(req, res) {
        var mx = _.pick(req.body, 'service_date', 'mileage', 'description', 'cost', 'servicer', 'CarId');
        console.log("inserting mx");
        console.log(mx);
        MaintenanceLog.insert(mx).then(function(result) {
            console.log("inserted mx");
            res.status(201).json(result);
        }).catch(function(error) {
            console.log("error inserting mx; " + error);
            res.status(500).json(error);
        });
    });

    // Get mx
    app.get("/api/v1/automobile/mx_log/:id", function(req, res) {
        var carId = req.params.id;
        console.log("mx logs requested for car " + carId);
        MaintenanceLog.get(carId).then(function(results) {
            console.log("retrieved mx");
            res.json(results);
        }).catch(function(error) {
            console.log("error retrieving mx; " + error);
            res.status(500).json(error);
        });
    });

    // Update mx
    app.put("/api/v1/automobile/mx_log/:id", function(req, res) {
        var mxId = req.params.id;
        var mx = _.pick(req.body, 'service_date', 'mileage', 'description', 'cost', 'servicer', 'CarId');
        console.log("mx " + mxId + " update requested");
        console.log(mx);
        MaintenanceLog.update(mxId, mx).then(function(results) {
            console.log("mx " + mxId + "updated");
            res.json(results);
        }).catch(function(error) {
            console.log("mx update error: " + error);
            res.status(500).json(error);
        });
    });

    // Delete mx
    app.delete("/api/v1/automobile/mx_log/:id", function(req, res) {
        var mxId = req.params.id;
        console.log("mx " + mxId + " delete requested");
        MaintenanceLog.delete(mxId).then(function(results) {
            console.log("mx " + mxId + "deleted");
            res.json(results);
        }).catch(function(error) {
            console.log("mx delete error: " + error);
            res.status(500).json(error);
        });
    });
};