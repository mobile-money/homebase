module.exports = function(app, Schedule, _, io) {
    // Insert schedule
    app.post("/api/v1/hvac/schedule", function(req, res) {
        var body = _.pick(req.body, 'name', 'system', 'days', 'startTime', 'endTime', 'targetTemp');
        console.log("inserting schedule");
        console.log(body);
        Schedule.insert(body).then(function(result) {
            console.log("inserted schedule");
            res.status(201).json(result);
        }).catch(function(error) {
            console.log("error inserting schedule; " + error);
            res.status(500).json(error);
        });
    });

    // Get schedules
    app.get("/api/v1/hvac/schedule", function(req, res) {
        console.log("schedules requested");
        console.log("params: " + JSON.stringify(req.query));
        Schedule.get(req.query).then(function(results) {
            console.log("retrieved schedules");
            res.json(results);
        }).catch(function(error) {
            console.log("error retrieving schedules; " + error);
            res.status(500).json(error);
        });
    });

    // Update schedule
    app.put("/api/v1/hvac/schedule/:id", function(req, res) {
        var scheduleId = req.params.id;
        var body = _.pick(req.body, 'name', 'system', 'days', 'startTime', 'endTime', 'targetTemp');
        console.log("schedule " + scheduleId + " update requested");
        console.log(body);
        Schedule.update(scheduleId, body).then(function(results) {
            console.log("schedule " + scheduleId + "updated");
            res.json(results);
        }).catch(function(error) {
            console.log("schedule update error: " + error);
            res.status(500).json(error);
        });
    });

    // Delete schedule
    app.delete("/api/v1/hvac/schedule/:id", function(req, res) {
        var scheduleId = req.params.id;
        console.log("schedule " + scheduleId + " delete requested");
        Schedule.delete(scheduleId).then(function(results) {
            console.log("schedule " + scheduleId + "deleted");
            res.json(results);
        }).catch(function(error) {
            console.log("schedule delete error: " + error);
            res.status(500).json(error);
        });
    });
};
