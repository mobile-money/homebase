module.exports = function(app, Person, _, io) {
    // Insert person
    app.post("/api/v1/health/person", function(req, res) {
        let person = _.pick(req.body, 'first_name', 'middle_name', 'last_name', 'birth_date', 'group_ids');
        if (person.group_ids === 'null') {
            person.group_ids = [];
        } else {
            person.group_ids = JSON.parse(person.group_ids);
        }
        console.log("inserting person");
        console.log(person);
        Person.insert(req.user, person).then(function(result) {
            console.log("inserted person");
            io.emit("personAdded", result.id);
            res.status(201).json(result);
        }).catch(function(error) {
            console.log(`error inserting person; ${error}`);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Get people
    app.get("/api/v1/health/person", function(req, res) {
        console.log("people requested");
        console.log("params: " + JSON.stringify(req.query));
        Person.get(req.user, req.query).then(function(results) {
            console.log("retrieved people");
            res.json(results);
        }).catch(function(error) {
            console.log(`error retrieving people; ${error}`);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Update person
    app.put("/api/v1/health/person/:id", function(req, res) {
        let personId = req.params.id;
        let person = _.pick(req.body, 'first_name', 'middle_name', 'last_name', 'birth_date', 'group_ids');
        if (person.group_ids === 'null') {
            person.group_ids = [];
        } else {
            person.group_ids = JSON.parse(person.group_ids);
        }
        console.log(`person ${personId} update requested`);
        console.log(person);
        Person.update(req.user, personId, person).then(function (results) {
            console.log(`person ${personId} updated`);
            io.emit("personUpdated", personId);
            res.json(results);
        }).catch(function (error) {
            console.log(`person update error: ${error}`);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Delete person
    app.delete("/api/v1/health/person/:id", function(req, res) {
        let personId = req.params.id;
        console.log(`person ${personId} delete requested`);
        Person.delete(req.user, personId).then(function(results) {
            console.log(`person ${personId} deleted`);
            io.emit("personDeleted", personId);
            res.json(results);
        }).catch(function(error) {
            console.log(`person delete error: ${error}`);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).json(error);
            }
        });
    });

    // Get Accessible People by Group ID
    app.get('/api/v1/health/person/groups/:id', function (req, res) {
        const groupId = req.params.id;
        console.log("getting accessible people for group: " + groupId);
        Person.getByGroup(req.user, groupId).then(function(people) {
            res.status(200).json({group: Number(groupId), people: people});
        }).catch(function(error) {
            console.log("get people by group error: "+error);
            if (error === "unauthorized") {
                res.status(401).send();
            } else {
                res.status(500).send();
            }
        });
    });
};