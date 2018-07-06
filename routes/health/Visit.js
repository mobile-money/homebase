module.exports = function(app, Visit, _, io) {
    // Insert visit
    app.post("/api/v1/health/visit", function(req, res) {
        let vt = _.pick(req.body, 'visit_date', 'description', 'cost', 'provider', 'PersonId');
        console.log("inserting visit");
        console.log(vt);
        Visit.insert(vt).then(function(result) {
            console.log("inserted visit");
            io.emit("visitAdded", result.id);
            res.status(201).json(result);
        }).catch(function(error) {
            console.log(`error inserting visit; ${error}`);
            res.status(500).json(error);
        });
    });

    // Get visits
    app.get("/api/v1/health/visit/:id", function(req, res) {
        let personId = req.params.id;
        console.log(`visits requested for person: ${personId}`);
        Visit.get(personId).then(function(results) {
            console.log("retrieved visits");
            res.json(results);
        }).catch(function(error) {
            console.log(`error retrieving visits; ${error}`);
            res.status(500).json(error);
        });
    });

    // Update visit
    app.put("/api/v1/health/visit/:id", function(req, res) {
        let visitId = req.params.id;
        let vt = _.pick(req.body, 'visit_date', 'description', 'cost', 'provider', 'PersonId');
        console.log(`visit ${visitId} update requested`);
        console.log(vt);
        Visit.update(visitId, vt).then(function(results) {
            console.log(`visit ${visitId} updated`);
            io.emit("visitUpdated", visitId);
            res.json(results);
        }).catch(function(error) {
            console.log(`visit update error: ${error}`);
            res.status(500).json(error);
        });
    });

    // Delete visit
    app.delete("/api/v1/health/visit/:id", function(req, res) {
        let visitId = req.params.id;
        console.log(`visit ${visitId} delete requested`);
        Visit.delete(visitId).then(function(results) {
            console.log(`visit ${visitId} deleted`);
            io.emit("visitDeleted", visitId);
            res.json(results);
        }).catch(function(error) {
            console.log(`visit delete error: ${error}`);
            res.status(500).json(error);
        });
    });
};