
// var socket = io();

$(document).ready(function() {
	$("body").show();
		
	checkSystemOptions();

	getEnvData();
});

// FIELD EVENTS
	$("#navToggle").click(function() {
		showNav();
	});
	$("#dataType").change(function() {
	    var val = $("#dataType").val();
		if (val === "env") {
			getEnvData();
		} else if (val === "runs") {
			getRunsData();
		}
	});

// SOCKET IO
	socket.on("connect", function() {
		// console.log("connected to server");
	});

	socket.on("newReading", function(rec) {
		var newRow = '<tr id="'+rec.data.id+'">'+
			"<td>"+rec.data.id+"</td>"+
			"<td>"+moment(rec.data.createdAt).format("MMM D, YYYY HH:mm:ss")+"</td>"+
			"<td>"+rec.sensor.Location.floor+"&nbsp;"+rec.sensor.Location.room;
        if (rec.sensor.Location.note !== null) {
            newRow += " (" + item.Location.note + ")";
        }
		newRow += "</td>"+
            "<td>"+convertTemp("c",rec.data.temperature,1)+"</td>"+
            "<td>"+rec.data.humidity+"</td>"+
			"</tr>";
		$("#dataTable").find("tbody").prepend(newRow);
		highlightRow(rec.data.id);
	});

// FUNCTIONS
function highlightRow(id) {
    var jq_elem = $("#"+id);
    var baseBG = jq_elem.css("background-color");
    jq_elem.css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
}

function showNav() {
	$("#navToggleDiv").remove();
	$("#navBar").show();
}

function getEnvData() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/envData"
	}).success(function(results){
		var header = "<tr>"+
			"<th>ID</th>"+
			"<th>Date/Time</th>"+
			"<th>Location</th>"+
			"<th>Temperature (°F)</th>"+
			"<th>Humidity (%)</th>"+
		"</tr>";
		var table = $("#dataTable");
		table.find("thead").html(header);
		table.find("tbody").empty();
		results.forEach(function(item) {
			var row = "<tr>"+
				"<td>"+item.id+"</td>"+
				"<td>"+moment(item.createdAt).format("MMM D, YYYY HH:mm:ss")+"</td>"+
				"<td>"+item.Location.floor+" "+item.Location.room;
				if (item.Location.note !== null) {
					row += " ("+item.Location.note+")";
				}
				row += "</td>"+
				"<td>"+convertTemp("c",item.temperature,1)+"</td>"+
				"<td>"+item.humidity+"</td>"+
			"</tr>";
			$("#dataTable").find("tbody").append(row);
		});
	}).error(function(jqXHR) { // ,textStatus,errorThrown
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function getRunsData() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/system_run"
	}).success(function(results) {
		var header = "<tr>"+
			"<th>ID</th>"+
			"<th>On</th>"+
			"<th>Off</th>"+
			"<th>Run Time (minutes)</th>"+
			"<th>System</th>"+
		"</tr>";
		var table = $("#dataTable");
		table.find("thead").html(header);
		table.find("tbody").empty();
		results.forEach(function(item) {
			var onMoment = moment(item.on);
			var offMoment = null;
			var diff = null;
			if (item.off !== null) {
				offMoment = moment(item.off);
				diff = offMoment.diff(onMoment, 'minutes');
			} else {
				diff = moment().diff(onMoment, 'minutes');
			}
			var row = "<tr>"+
				"<td>"+item.id+"</td>"+
				"<td>"+onMoment.format("MMM D, YYYY HH:mm:ss")+"</td>";
				if (offMoment !== null) {
					row += "<td>"+offMoment.format("MMM D, YYYY HH:mm:ss")+"</td>";
				} else {
					row += "<td></td>";
				}
				row += "<td>"+diff+"</td>"+
				"<td>"+item.System.name+"</td>"+
			"</tr>";
			$("#dataTable").find("tbody").append(row);
		});
	}).error(function(jqXHR) { // , textStatus, errorThrown
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}