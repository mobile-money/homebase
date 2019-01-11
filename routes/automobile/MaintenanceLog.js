module.exports = function(app, MaintenanceLog, _) {
    // Delete mx
    app.delete("/api/v1/automobile/mx_log/:id", function(req, res) {
        const mxId = req.params.id;
        console.log("mx " + mxId + " delete requested");
        MaintenanceLog.delete(req.user, mxId).then(function(results) {
            console.log("mx " + mxId + "deleted");
            res.json(results);
        }).catch(function(error) {
            console.log("mx delete error: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Get mx
    app.get("/api/v1/automobile/mx_log/:id", function(req, res) {
        const carId = req.params.id;
        console.log("mx logs requested for car " + carId);
        MaintenanceLog.get(req.user, carId).then(function(results) {
            console.log("retrieved mx");
            res.json(results);
        }).catch(function(error) {
            console.log("error retrieving mx; " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Insert mx
    app.post("/api/v1/automobile/mx_log", function(req, res) {
        const mx = _.pick(req.body, 'service_date', 'mileage', 'description', 'cost', 'servicer', 'CarId');
        console.log("inserting mx");
        console.log(mx);
        MaintenanceLog.insert(req.user, mx).then(function(result) {
            console.log("inserted mx");
            res.status(201).json(result);
        }).catch(function(error) {
            console.log("error inserting mx; " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Update mx
    app.put("/api/v1/automobile/mx_log/:id", function(req, res) {
        const mxId = req.params.id;
        const mx = _.pick(req.body, 'service_date', 'mileage', 'description', 'cost', 'servicer', 'CarId');
        console.log("mx " + mxId + " update requested");
        console.log(mx);
        MaintenanceLog.update(req.user, mxId, mx).then(function(results) {
            console.log("mx " + mxId + "updated");
            res.json(results);
        }).catch(function(error) {
            console.log("mx update error: " + error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });
};