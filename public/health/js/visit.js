$(function() {
	$("body").show();

	if (QueryString.hasOwnProperty("PersonId")) {
	    $("#currentPersonId").val(QueryString["PersonId"]);
    }

    populatePeople();
});

let QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  let query_string = {};
  let query = window.location.search.substring(1);
  let vars = query.split("&");
  for (let i=0;i<vars.length;i++) {
    let pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
        query_string[pair[0]] = [query_string[pair[0]], decodeURIComponent(pair[1])];
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
  return query_string;
}();

// FIELD EVENTS //
$("#addVisitButton").on("click", function() {
    addVisit();
});

$("#addVisitModal").on("hidden.bs.modal", function() {
    $("#addVisitDate").val("");
    $("#addDescription").val("");
    $("#addCost").val("");
    $("#addProvider").val("");
}).on("shown.bs.modal", function() {
    // $("#editPayee").focus();
});

$("#personSelect").on("change", function() {
    $("#currentPersonId").val($("#personSelect").val());
    getVisits();
});

$("#deleteVisitButton").on("click", function() {
    removeVisit();
});

$("#deleteVisitModal").on("hidden.bs.modal", function() {
    // $("#newPayee").focus();
});

$("#dltVisitButton").click(function() {
    deleteVisit($("#editVisitId").val());
});

$("#editVisitButton").on("click", function() {
    modifyVisit();
});

$("#editVisitModal").on("hidden.bs.modal", function() {
    $("#editVisitId").val("");
    $("#editVisitDate").val("");
    $("#editDescription").val("");
    $("#editCost").val("");
    $("#editProvider").val("");
}).on("shown.bs.modal", function() {
    // $("#editPayee").focus();
});

$("#infoModal").on("hidden.bs.modal", function() {
    $("#infoModalBody").empty();
});

$("#searchClear").on("click", function() {
    clearSearch();
});

$("#searchField").on("keypress", function(e) {
    if(e.which === 13) {
        let obj = {
            text: $("#searchField").val()
        };
        if (obj.text === "") { return false; }
        let re = new RegExp(obj.text, "gi");
        $("#searchClear").prop('disabled',false);

        $('#visitTable').find('tbody').find('tr').each(function(index, element) {
            let description = $(element).find(" td[name=description]").html();
            let provider = $(element).find(" td[name=provider]").html();
            if (!description.match(re) && !provider.match(re)) {
                $(element).hide();
            }
        });
    }
});

// FUNCTIONS //
function addVisit() {
    let errorCount = 0;
    let visitDate = $("#addVisitDate");
    if (typeof visitDate.val() !== "undefined" && visitDate.val().length > 0) {
        visitDate.css("background-color", "#fff");
    } else {
        errorCount++;
        visitDate.css("background-color", "#f2dede");
    }
    let description = $("#addDescription");
    if (typeof description.val() !== "undefined" && description.val().length > 0) {
        description.css("background-color", "#fff");
    } else {
        errorCount++;
        description.css("background-color", "#f2dede");
    }
    let cost = $("#addCost");
    if (typeof cost.val() !== "undefined" && cost.val().length > 0) {
        cost.css("background-color", "#fff");
    } else {
        errorCount++;
        cost.css("background-color", "#f2dede");
    }
    let provider = $("#addProvider");
    if (typeof provider.val() !== "undefined" && provider.val().length > 0) {
        provider.css("background-color", "#fff");
    } else {
        errorCount++;
        provider.css("background-color", "#f2dede");
    }

    if (errorCount === 0) {
        $("#addVisitModal").modal("hide");
        $.ajax({
            type: "POST"
            ,url: "/api/v1/health/visit"
            ,data: {
                visit_date: visitDate.val()
                ,description: htmlEncode(description.val().replace(/(?:\r\n|\r|\n)/g,"<br />"))
                ,cost: cost.val()
                ,provider: provider.val()
                ,PersonId: Number($("#currentPersonId").val())
            }
        }).success(function(/*response*/) {
            getVisits();
        }).error(function(/*jqXHR, textStatus, errorThrown*/) {
            $("#infoModalBody").html("There was a problem adding the visit.  Please try again.");
            $("#infoModal").modal("show");
            return false;
        });
    }
}

function clearSearch() {
    $("#searchField").val("");
    $("#searchClear").prop('disabled',true);
    getVisits();
}

function deleteVisit(id) {
    $("#editVisitModal").modal("hide");
    let date = $("#"+id+" td[name=visit_date]").html();
    let desc = $("#"+id+" td[name=description]").html();
    $("#deleteVisitId").val(id);
    $("#deleteModalBody").html("<strong>Are you sure you want to delete the visit on "+date+"?</strong><br /><br />"+desc);
    $("#deleteVisitModal").modal("show");
}

function editVisit(id) {
    $("#editVisitId").val(id);
    $("#editVisitDate").val(moment.utc($("#"+id+" td[name=visit_date]").html(),"MMM D, YYYY").format("YYYY-MM-DD"));
    $("#editMileage").val($("#"+id+" td[name=mileage]").html());
    $("#editDescription").val($("#"+id+" td[name=description]").html().replace("<br>","\n"));
    $("#editCost").val($("#"+id+" td[name=cost]").html());
    $("#editProvider").val($("#"+id+" td[name=provider]").html());
    $("#editVisitModal").modal("show");
}

function getVisits() {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/health/visit/"+$("#currentPersonId").val()
    }).success(function(response) {
        $("#visitTable").find("tbody").empty();
        response.forEach(function(visit) {
            let row = '<tr id="'+visit.id+'">' +
                '<td name="visit_date">'+moment.utc(visit.visit_date).format("MMM D, YYYY")+'</td>' +
                '<td name="description">'+htmlDecode(visit.description)+'</td>' +
                '<td name="cost" class="d-none d-md-table-cell">'+visit.cost.toFixed(2)+'</td>' +
                '<td name="provider" class="d-none d-sm-table-cell">'+visit.provider+'</td>' +
                '<td><button class="btn btn-sm btn-primary" title="Edit Visit" onclick="editVisit(\''+visit.id+'\');"><i class="fa fa-pencil"></i></button>' +
                // '<button class="btn btn-sm btn-danger" title="Delete Visit" onclick="deleteVisit(\''+visit.id+'\');"><i class="fa fa-trash"></i></button>' +
                '</td>'+
                '</tr>';
            $("#visitTable").find("tbody").append(row);
        });
    }).error(function(jqXHR) {
        if (jqXHR.status === 404) {
            $("#addVisit").prop("disabled", true);
            return false;
        } else {
            $("#addVisit").prop("disabled", true);
            $("#infoModalBody").html("There was a problem.  Please try again.");
            $("#infoModal").modal("show");
        }
    });
}

function htmlDecode(value){
    return $('<div/>').html(value).text();
}

function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

function modifyVisit() {
    let errorCount = 0;
    let id = $("#editVisitId").val();
    let visitDate = $("#editVisitDate");
    if (typeof visitDate.val() !== "undefined" && visitDate.val().length > 0) {
        visitDate.css("background-color", "#fff");
    } else {
        errorCount++;
        visitDate.css("background-color", "#f2dede");
    }
    let description = $("#editDescription");
    if (typeof description.val() !== "undefined" && description.val().length > 0) {
        description.css("background-color", "#fff");
    } else {
        errorCount++;
        description.css("background-color", "#f2dede");
    }
    let cost = $("#editCost");
    if (typeof cost.val() !== "undefined" && cost.val().length > 0) {
        cost.css("background-color", "#fff");
    } else {
        errorCount++;
        cost.css("background-color", "#f2dede");
    }
    let provider = $("#editProvider");
    if (typeof provider.val() !== "undefined" && provider.val().length > 0) {
        provider.css("background-color", "#fff");
    } else {
        errorCount++;
        provider.css("background-color", "#f2dede");
    }

    if (errorCount === 0) {
        $("#editVisitModal").modal("hide");
        $.ajax({
            type: "PUT"
            ,url: "/api/v1/health/visit/"+id
            ,data: {
                visit_date: visitDate.val()
                ,description: htmlEncode(description.val().replace(/(?:\r\n|\r|\n)/g,"<br />"))
                ,cost: cost.val()
                ,provider: provider.val()
                ,PersonId: Number($("#currentPersonId").val())
            }
        }).success(function(/*response*/) {
            getVisits();
        }).error(function(/*jqXHR, textStatus, errorThrown*/) {
            $("#infoModalBody").html("There was a problem modifying the visit.  Please try again.");
            $("#infoModal").modal("show");
            return false;
        });
    }
}

function populatePeople() {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/health/person"
    }).success(function(response) {
        if (!QueryString.hasOwnProperty("PersonId")) {
            if (response.length > 0) {
                $("#currentPersonId").val(response[0].id);
            }
        }
        response.forEach(function(person) {
            let obj = {
                value: person.id
                ,text: person.first_name + " " + person.middle_name + " " + person.last_name
            };
            if (person.id === Number($("#currentPersonId").val())) {
                obj.selected = true;
            }
           $("#personSelect").append($('<option>', obj));
        });
        getVisits();
    }).error(function() { //jqXHR, textStatus, errorThrown
        $("#infoModalBody").html("There was a problem.  Please try again.");
        $("#infoModal").modal("show");
    });
}

function removeVisit() {
    let id = $("#deleteVisitId").val();
    $("#deleteVisitModal").modal("hide");
    if (typeof id !== "undefined" && id.length > 0) {
        $.ajax({
            type: "DELETE"
            ,url: "/api/v1/health/visit/"+id
        }).success(function() {
            getVisits();
            return false;
        }).error(function() { //jqXHR, textStatus, errorThrown
            $("#infoModalBody").html("There was a problem.  Please try again.");
            $("#infoModal").modal("show");
        });
    }
}