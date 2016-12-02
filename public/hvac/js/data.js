
var socket = io();

$(document).ready(function() {
	$("body").show();
		
	getEnvData();
});

// FIELD EVENTS
	$("#navToggle").click(function() {
		showNav();
	});
	$("#dataType").change(function() {
		if ($("#dataType").val() === "env") {
			getEnvData();
		} else if ($("#dataType").val() === "runs") {
			getRunsData();
		}
	});

// SOCKET IO
	socket.on("connect", function() {
		// console.log("connected to server");
	});

// FUNCTIONS
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
		$("#dataTable").find("thead").html(header);
		$("#dataTable").find("tbody").empty();
		results.forEach(function(item) {
			var row = "<tr>"+
				"<td>"+item.id+"</td>"+
				"<td>"+moment(item.createdAt).format("MMM D, YYYY HH:mm:ss")+"</td>"+
				"<td>"+item.Location.floor+" "+item.Location.room;
				if (item.Location.note !== null) {
					row += " ("+item.Location.note+")";
				}
				row += "</td>"+
				"<td>"+(Number(item.temperature) * (9/5) + 32).toFixed(1)+"</td>"+
				"<td>"+item.humidity+"</td>"+
			"</tr>";
			$("#dataTable").find("tbody").append(row);
		});
	}).error(function(jqXHR, textStatus, errorThrown) {
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
		$("#dataTable").find("thead").html(header);
		$("#dataTable").find("tbody").empty();
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
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}