$(document).ready(function() {
	$("body").show();

	getLogs();
});

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
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
$("#addLogModal").on("hidden.bs.modal", function() {
    $("#addServiceDate").val("");
    $("#addMileage").val("");
    $("#addDescription").val("");
    $("#addCost").val("");
    $("#addServicer").val("");
}).on("shown.bs.modal", function() {
    // $("#editPayee").focus();
});

$("#addLogButton").click(function() {
    addLog();
});

$("#deleteLogButton").click(function() {
    removeLog();
});

$("#deleteLogModal").on("hidden.bs.modal", function() {
    // $("#newPayee").focus();
});

$("#editLogButton").click(function() {
    modifyLog();
});

$("#editLogModal").on("hidden.bs.modal", function() {
    $("#editLogId").val("");
    $("#editServiceDate").val("");
    $("#editMileage").val("");
    $("#editDescription").val("");
    $("#editCost").val("");
    $("#editServicer").val("");
}).on("shown.bs.modal", function() {
    // $("#editPayee").focus();
});

$("#infoModal").on("hidden.bs.modal", function() {
    $("#infoModalBody").empty();
});

$("#searchClear").click(function() {
    clearSearch();
});

$("#searchField").keypress(function(e) {
    if(e.which === 13) {
        var obj = {
            text: $("#searchField").val()
        };
        if (obj.text === "") { return false; }
        var re = new RegExp(obj.text, "gi");
        $("#searchClear").prop('disabled',false);

        $('#logTable').find('tbody').find('tr').each(function(index, element) {
            var description = $(element).find(" td[name=description]").html();
            var servicer = $(element).find(" td[name=servicer]").html();
            if (!description.match(re) && !servicer.match(re)) {
                $(element).hide();
            }
        });
    }
});

// FUNCTIONS //
function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

function htmlDecode(value){
    return $('<div/>').html(value).text();
}

function addLog() {
    var errorCount = 0;
    var serviceDate = $("#addServiceDate");
    if (typeof serviceDate.val() !== "undefined" && serviceDate.val().length > 0) {
        serviceDate.css("background-color", "#fff");
    } else {
        errorCount++;
        serviceDate.css("background-color", "#f2dede");
    }
    var mileage = $("#addMileage");
    if (typeof mileage.val() !== "undefined" && mileage.val().length > 0) {
        mileage.css("background-color", "#fff");
    } else {
        errorCount++;
        mileage.css("background-color", "#f2dede");
    }
    var description = $("#addDescription");
    if (typeof description.val() !== "undefined" && description.val().length > 0) {
        description.css("background-color", "#fff");
    } else {
        errorCount++;
        description.css("background-color", "#f2dede");
    }
    var cost = $("#addCost");
    if (typeof cost.val() !== "undefined" && cost.val().length > 0) {
        cost.css("background-color", "#fff");
    } else {
        errorCount++;
        cost.css("background-color", "#f2dede");
    }
    var servicer = $("#addServicer");
    if (typeof servicer.val() !== "undefined" && servicer.val().length > 0) {
        servicer.css("background-color", "#fff");
    } else {
        errorCount++;
        servicer.css("background-color", "#f2dede");
    }

    if (errorCount === 0) {
        $("#addLogModal").modal("hide");
        $.ajax({
            type: "POST"
            ,url: "/api/v1/automobile/mx_log"
            ,data: {
                service_date: serviceDate.val()
                ,mileage: mileage.val()
                ,description: htmlEncode(description.val().replace(/(?:\r\n|\r|\n)/g,"<br />"))
                ,cost: cost.val()
                ,servicer: servicer.val()
                ,CarId: Number(QueryString["CarId"])
            }
        }).success(function(/*response*/) {
            getLogs();
        }).error(function(/*jqXHR, textStatus, errorThrown*/) {
            $("#infoModalBody").html("There was a problem adding the log.  Please try again.");
            $("#infoModal").modal("show");
            return false;
        });
    }
}

function clearSearch() {
	$("#searchField").val("");
	$("#searchClear").prop('disabled',true);
	getLogs();
}

function editLog(id) {
    $("#editLogId").val(id);
    $("#editServiceDate").val(moment.utc($("#"+id+" td[name=service_date]").html()).format("YYYY-MM-DD"));
    $("#editMileage").val($("#"+id+" td[name=mileage]").html());
    $("#editDescription").val($("#"+id+" td[name=description]").html().replace("<br>","\n"));
    $("#editCost").val($("#"+id+" td[name=cost]").html());
    $("#editServicer").val($("#"+id+" td[name=servicer]").html());
    $("#editLogModal").modal("show");
}

function modifyLog() {
    var errorCount = 0;
    var id = $("#editLogId").val();
    var serviceDate = $("#editServiceDate");
    if (typeof serviceDate.val() !== "undefined" && serviceDate.val().length > 0) {
        serviceDate.css("background-color", "#fff");
    } else {
        errorCount++;
        serviceDate.css("background-color", "#f2dede");
    }
    var mileage = $("#editMileage");
    if (typeof mileage.val() !== "undefined" && mileage.val().length > 0) {
        mileage.css("background-color", "#fff");
    } else {
        errorCount++;
        mileage.css("background-color", "#f2dede");
    }
    var description = $("#editDescription");
    if (typeof description.val() !== "undefined" && description.val().length > 0) {
        description.css("background-color", "#fff");
    } else {
        errorCount++;
        description.css("background-color", "#f2dede");
    }
    var cost = $("#editCost");
    if (typeof cost.val() !== "undefined" && cost.val().length > 0) {
        cost.css("background-color", "#fff");
    } else {
        errorCount++;
        cost.css("background-color", "#f2dede");
    }
    var servicer = $("#editServicer");
    if (typeof servicer.val() !== "undefined" && servicer.val().length > 0) {
        servicer.css("background-color", "#fff");
    } else {
        errorCount++;
        servicer.css("background-color", "#f2dede");
    }

    if (errorCount === 0) {
        $("#editLogModal").modal("hide");
        $.ajax({
            type: "PUT"
            ,url: "/api/v1/automobile/mx_log/"+id
            ,data: {
                service_date: serviceDate.val()
                ,mileage: mileage.val()
                ,description: htmlEncode(description.val().replace(/(?:\r\n|\r|\n)/g,"<br />"))
                ,cost: cost.val()
                ,servicer: servicer.val()
                ,CarId: Number(QueryString["CarId"])
            }
        }).success(function(/*response*/) {
            getLogs();
        }).error(function(/*jqXHR, textStatus, errorThrown*/) {
            $("#infoModalBody").html("There was a problem adding the log.  Please try again.");
            $("#infoModal").modal("show");
            return false;
        });
    }
}

function getLogs() {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/automobile/mx_log/"+QueryString["CarId"]
    })
        .success(function(response) {
            $("#logTable").find("tbody").empty();
            response.forEach(function(log) {
                var row = '<tr id="'+log.id+'">' +
                    '<td name="service_date">'+moment.utc(log.service_date).format("MMM D, YYYY")+'</td>' +
                    '<td name="mileage">'+log.mileage+'</td>'+
                    '<td name="description">'+htmlDecode(log.description)+'</td>' +
                    '<td name="cost">'+log.cost.toFixed(2)+'</td>' +
                    '<td name="servicer">'+log.servicer+'</td>' +
                    '<td><button class="btn btn-sm btn-primary" title="Edit Log" onclick="editLog(\''+log.id+'\');"><i class="glyphicon glyphicon-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-danger" title="Delete Log" onclick="deleteLog(\''+log.id+'\');"><i class="glyphicon glyphicon-trash"></i></button>' +
                    '</td>'+
                '</tr>';
                $("#logTable").find("tbody").append(row);
            });
        })
        .error(function(jqXHR) {
            if (jqXHR.status === 404) {
                $("#addTransaction").prop("disabled", true);
                return false;
            } else {
                $("#addTransaction").prop("disabled", true);
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
        });
}

function deleteLog(id) {
    var date = $("#"+id+" td[name=service_date]").html();
    var desc = $("#"+id+" td[name=description]").html();
    $("#deleteLogId").val(id);
    $("#deleteModalBody").html("<strong>Are you sure you want to delete the log on "+date+"?</strong><br /><br />"+desc);
    $("#deleteLogModal").modal("show");
}

function removeLog() {
    var id = $("#deleteLogId").val();
    $("#deleteLogModal").modal("hide");
    if (typeof id !== "undefined" && id.length > 0) {
        $.ajax({
            type: "DELETE"
            ,url: "/api/v1/automobile/mx_log/"+id
        })
            .success(function() {
                getLogs();
                return false;
            })
            .error(function() { //jqXHR, textStatus, errorThrown
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            });
    }
}