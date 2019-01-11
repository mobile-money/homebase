module.exports = function(app, Group, _) {
    // Get Groups
    app.get("/api/v1/group", function(req, res) {
        console.log("get groups requested");
        Group.get(req.user).then(function(groups) {
            console.log("groups retrieved");
            res.json(groups);
        }, function(error) {
            console.log("error retrieving groups: " + error);
            res.status(400).send();
        }).catch(function(error) {
            res.status(500).send();
        })
    });

    // Add Group
    app.post("/api/v1/group", function(req, res) {
        const data = _.pick(req.body, 'name', 'members');
        console.log("new group requested");
        console.log(data);
        Group.create(req.user,data).then(function(group) {
            console.log("group created");
            res.status(201).json(group);
        }).catch(function(error) {
            console.log("error inserting group: " + error);
            res.status(400).send();
        });
    });
};