$(function() {
	$("body").show();
		
	getPeople();
});

// FIELD EVENTS
$("#addPersonButton").on("click", function() {
	addPerson();
});

$("#addPersonModal").on("shown.bs.modal", function() {
    $("#newFirstName").trigger("focus");
}).on("hidden.bs.modal", function() {
    clearAddFields();
});

$("#deletePersonButton").on("click", function() {
    removePerson();
});

$("#deletePersonModal").on("hidden.bs.modal", function() {
    $("#deletePersonId").val("");
    $("#deleteModalBody").html("");
});

$("#editPersonButton").on("click", function() {
	modifyPerson();
});

$("#editPersonModal").on("shown.bs.modal", function() {
    $("#editFirstName").trigger("focus");
}).on("hidden.bs.modal", function() {
    clearEditFields();
});

$("#infoModal").on("hidden.bs.modal", function() {
	$("#infoModalBody").empty();
});

// FUNCTIONS
function addPerson() {
    let errorCount = 0;
    let newFirstName = $("#newFirstName");
    if (typeof newFirstName.val() !== "undefined" && newFirstName.val().length > 0) {
        newFirstName.css("background-color", "#fff");
    } else {
        errorCount++;
        newFirstName.css("background-color", "#f2dede");
    }
    let newMiddleName = $("#newMiddleName");
    let newLastName = $("#newLastName");
    if (typeof newLastName.val() !== "undefined" && newLastName.val().length > 0) {
        newLastName.css("background-color", "#fff");
    } else {
        errorCount++;
        newLastName.css("background-color", "#f2dede");
    }
    let newBirthDate = $("#newBirthDate");
    if (typeof newBirthDate.val() !== "undefined" && newBirthDate.val().length > 0) {
        newBirthDate.css("background-color", "#fff");
    } else {
        errorCount++;
        newBirthDate.css("background-color", "#f2dede");
    }

    if (errorCount === 0) {
        $("#addPersonModal").modal("hide");
        let person = {
            first_name: newFirstName.val().trim()
            ,middle_name: newMiddleName.val().trim()
            ,last_name: newLastName.val().trim()
            ,birth_date: newBirthDate.val()
        };
        savePerson(person);
    }
}

function clearAddFields() {
    $("#newFirstName").val("");
    $("#newMiddleName").val("");
    $("#newLastName").val("");
    $("#newBirthDate").val("");
}

function clearEditFields() {
    $("#editFirstName").val("");
    $("#editMiddleName").val("");
    $("#editLastName").val("");
    $("#editBirthDate").val("");
}

function deletePerson(id) {
    let first_name = $("#"+id+" td[name=first_name]").html();
    let middle_name = $("#"+id+" td[name=middle_name]").html();
    let last_name = $("#"+id+" td[name=last_name]").html();
    $("#deletePersonId").val(id);
    $("#deleteModalBody").html("<strong>Are you sure you want to delete "+first_name+"&nbsp;"+middle_name+"&nbsp;"+last_name+"?</strong>");
    $("#deletePersonModal").modal("show");
}

function editPerson(id) {
    $("#editPersonId").val(id);
    $("#editFirstName").val($("#"+id+" td[name=first_name]").html());
    $("#editMiddleName").val($("#"+id+" td[name=middle_name]").html());
    $("#editLastName").val($("#"+id+" td[name=last_name]").html());
    $("#editBirthDate").val(moment.utc($("#"+id+" td[name=birth_date]").html(),"MMM D, YYYY").format("YYYY-MM-DD"));
    $("#editPersonModal").modal("show");
}

function getPeople() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/health/person"
	}).success(function(response) {
		$("#peopleTable").find("tbody").empty();
		response.forEach(function(person) {
			let row = '<tr id="'+person.id+'">' +
				'<td name="first_name">'+person.first_name+'</td>' +
				'<td name="middle_name">';
			if (person.middle_name !== null) { row += person.middle_name; }
            row += '</td>'+
				'<td name="last_name">'+person.last_name+'</td>' +
				'<td name="birth_date">'+moment.utc(person.birth_date).format("MMM D, YYYY")+'</td>' +
				'<td name="visits"><a href="/health/visit?PersonId='+person.id+'">Visits</a></td>' +
				'<td><button class="btn btn-primary" title="Edit Person" onclick="editPerson(\''+person.id+'\');"><i class="glyphicon glyphicon-pencil"></i></button>' +
				'<button class="btn btn-danger" title="Delete Person" onclick="deletePerson(\''+person.id+'\');"><i class="glyphicon glyphicon-trash"></i></button>' +
				'</td>'+
			'</tr>';
			$("#peopleTable").find("tbody").append(row);
		});
	}).error(function(jqXHR) { //, textStatus, errorThrown
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function modifyPerson() {
    let id = $("#editPersonId").val();
    if (typeof id !== "undefined" && id.length > 0) {
        let errorCount = 0;
        let editFirstName = $("#editFirstName");
        if (typeof editFirstName.val() !== "undefined" && editFirstName.val().length > 0) {
            editFirstName.css("background-color", "#fff");
        } else {
            errorCount++;
            editFirstName.css("background-color", "#f2dede");
        }
        let editMiddleName = $("#editMiddleName");
        let editLastName = $("#editLastName");
        if (typeof editLastName.val() !== "undefined" && editLastName.val().length > 0) {
            editLastName.css("background-color", "#fff");
        } else {
            errorCount++;
            editLastName.css("background-color", "#f2dede");
        }
        let editBirthDate = $("#editBirthDate");
        if (typeof editBirthDate.val() !== "undefined" && editBirthDate.val().length > 0) {
            editBirthDate.css("background-color", "#fff");
        } else {
            errorCount++;
            editBirthDate.css("background-color", "#f2dede");
        }

        if (errorCount === 0) {
            $("#editPersonModal").modal("hide");
            let person = {
                id: id
                ,first_name: editFirstName.val().trim()
                ,middle_name: editMiddleName.val().trim()
                ,last_name: editLastName.val().trim()
                ,birth_date: editBirthDate.val()
            };
            $.ajax({
                type: "PUT"
                ,url: "/api/v1/health/person/"+id
                ,data: person
            }).success(function() {
                getPeople();
                return false;
            }).error(function() { //jqXHR, textStatus, errorThrown
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            });
        }
    }
}

function removePerson() {
    let id = $("#deletePersonId").val();
    $("#deletePersonModal").modal("hide");
    if (typeof id !== "undefined" && id.length > 0) {
        $.ajax({
            type: "DELETE"
            ,url: "/api/v1/health/person/"+id
        }).success(function() {
            getPeople();
            return false;
        }).error(function() { //jqXHR, textStatus, errorThrown
            $("#infoModalBody").html("There was a problem.  Please try again.");
            $("#infoModal").modal("show");
        });
    }
}

function savePerson(person) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/health/person"
		,data: person
	}).success(function() { //response
		getPeople();
		return false;
	}).error(function() { //jqXHR, textStatus, errorThrown
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}