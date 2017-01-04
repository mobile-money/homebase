var socket = io();
var system = {};
var currentTime = moment();
var locations = [];

$(document).ready(function() {
	$("body").show();

	checkSystemOptions();

	setHoldTempScale();
	setCurrentTime();
	getLocations();
	getForecast();

});

// FIELD EVENTS
	$("#navToggle").click(function() {
		showNav();
	});

	$("#optionsButton").click(function() {
		$("#infoModal").modal("show");
	});

// SOCKET IO
	socket.on("connect", function() {
		// console.log("connected to server");
	});

	socket.on("newReading", function(obj) {
		if (obj.data.LocationId === Number($("#selectedLocation").val())) {
			updateReading(obj);			
		} else if (Number($("#selectedLocation").val()) === -1) {
			updateDashboard(obj);
		}
	});

	socket.on("newForecast", function() {
		getForecast();
	});

// FUNCTIONS
function showNav() {
	$("#navToggleDiv").remove();
	$("#navBar").show();
}

function setCurrentTime() {
	currentTime = moment();
	$("#currentTime").html(currentTime.format("h:mmA")+'<br />'+currentTime.format("MMM DD, YYYY"));
	var readingTime = moment($("#timeReading").html(),"h:mmA MMM DD,YYYY");

	if (readingTime.add(2, "minutes").isBefore(currentTime)) {
		$("#timeReading").addClass("highlightTime");
	} else {
		$("#timeReading").removeClass("highlightTime");
	}

	setTimeout(setCurrentTime, 60000);
}

function setHoldTempScale() {
	$("#holdTemp").val(convertTemp("f",72,0));
}

function getDashboard() {
	$("#locSelect").html("Dashboard");
	$("#selectedLocation").val(-1);
	$("#readingsRow").hide();
	$("#optionsRow").hide();
	$("#dashboardTable").find("tbody").empty();
	$("#dashboardRow").show();

	locations.forEach(function(location) {
		var row = '<tr id="loc_'+location.id+'">'+
			'<td name="locName">'+location.floor+" "+location.room+"</td>";
			if (location.System !== null) {
				row += '<td name="locSysName">'+location.System.name+"</td>";
			} else {
				row += '<td name="locSysName"></td>';
			}
		row += '<td name="locCurTemp"></td><td name="locTarTemp"></td><td name="locSysStat"></td></tr>';
		$("#dashboardTable").find("tbody").append(row);
		$.ajax({
			type: "GET"
			,url: "/api/v1/hvac/envData/lastReading/"+location.id
		}).success(function(obj){
			$("#loc_"+obj.location.id).find('td[name="locCurTemp"]').html(convertTemp("c",obj.data.temperature,0) + "°");
			if (obj.schedule !== null) {
				$("#loc_"+obj.location.id).find('td[name="locTarTemp"]').html(convertTemp("c",obj.schedule.targetTemp,0) + "°");
			}
			if (obj.systemAction !== null) {
				if (obj.systemAction === "heat") {
					$("#loc_"+obj.location.id).find('td[name="locSysStat"]').html('<img src="../shared/img/fire.png" alt="Heat" style="height:'+($("#loc_"+obj.location.id).height()-17)+'px;">');
				} else if (obj.systemAction === "cool") {
					$("#loc_"+obj.location.id).find('td[name="locSysStat"]').html('<img src="../shared/img/wind.png" alt="Cool" style="height:'+($("#loc_"+obj.location.id).height()-17)+'px;">');
				}
			}
		}).error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 500) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	});
}

function getForecast() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/forecast"
	}).success(function(forecast) {
		// console.log(forecast);
		for (var i=0; i<5; i++) {
			if (i !== 0) {
				$("#forecastDay"+i+" div[name=dayName]").html(moment(forecast["day"+i+"_date"]).format("dddd"));				
			}
			$("#forecastDay"+i+" div[name=lowTemp]").html(convertTemp("k",forecast["day"+i+"_min"],0));
			$("#forecastDay"+i+" img[name=icon]").attr("src", "http://openweathermap.org/img/w/"+forecast["day"+i+"_iconCode"]+".png");
			$("#forecastDay"+i+" div[name=highTemp]").html(convertTemp("k",forecast["day"+i+"_max"],0));
			$("#forecastDay"+i+" div[name=description]").html(forecast["day"+i+"_description"]);
			// $("#forecastDay"+i+" div[name=dateName]").html(moment(forecast["day"+i+"_date"]).format("MMM DD"));
		}
	}).error(function(jqXHR, textStatus, errorThrown) {
		$("#forecastRow").hide();
	});
}

function getLastReading(id) {
	$("#selectedLocation").val(id);
	$("#readingsRow").show();
	$("#optionsRow").show();
	$("#dashboardRow").hide();
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/envData/lastReading/"+id
	}).success(function(obj){

		var name = obj.location.floor+" "+obj.location.room;
		if (obj.location.note !== null) {
			name += " ("+obj.location.note+")";
		}
		$("#locSelect").html(name);

		if (obj.system === null) {
			$("#optionsButton").hide();
			$("#systemInfo").hide();
		} else {
			system = obj.system;

			$("#holdGroup").html('<input type="text" class="form-control" id="holdTemp" readonly="readonly" value="72" />'+
				'<div class="input-group-btn">'+
					'<button class="btn btn-success" onClick="increaseHoldTemp();">'+
						'<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>'+
					'</button>'+
					'<button class="btn btn-danger" onClick="decreaseHoldTemp();">'+
						'<span class="glyphicon glyphicon-minus" aria-hidden="true"></span>'+
					'</button>'+
					'<button class="btn btn-default" onClick="setHoldTemp();">Set</button>'+
				'</div>');
			setHoldTempScale();

			var infoText = ''+obj.system.name+'&nbsp;<span class="infoTitle">System</span><br />';
			if (system.state === 0) {
				infoText += '<span class="highlightInfo">Off</span>';
			} else if (system.state === 1) {
				infoText += '<span class="highlightInfo">On</span>';
			} else if (system.state === 2) {
				infoText += 'Auto';
				infoText += '&nbsp;<span class="infoTitle">State</span>';
				if (obj.schedule !== null) {
					infoText += '<br />';
					if (obj.schedule.name === "HOLD") {
						$("#holdGroup").html('<button class="btn btn-danger" onClick="cancelHold('+obj.schedule.id+');">Cancel Hold</button>');
						infoText += '<span class="highlightInfo">'+obj.schedule.name+"</span>";
					} else {
						infoText += obj.schedule.name					
					}
					infoText += '&nbsp;<span class="infoTitle">Schedule</span>'+
					'<br /><span class="infoSubtext">&nbsp;&nbsp;&nbsp;&nbsp;'+convertTemp("c",obj.schedule.targetTemp,0)+'°';
					if (obj.schedule.name !== "HOLD") {
						infoText += '<br />&nbsp;&nbsp;&nbsp;&nbsp;'+moment(obj.schedule.startTime,"HH:mm").format("h:mm A")+
						'&nbsp;-&nbsp;'+
						moment(obj.schedule.endTime,"HH:mm").format("h:mm A")+'</span>';					
					}
				}
			}
			$("#systemInfo").html(infoText);

			if (obj.systemAction === "heat") {
				$("#actionDiv").html('<img src="../shared/img/fire.png" alt="Heat" style="width:100%">');
			} else if (obj.systemAction === "cool") {
				$("#actionDiv").html('<img src="../shared/img/wind.png" alt="Cool" style="width:100%">');
			} else {
				$("#actionDiv").html("");
			}

			$("#optionsButton").show();
			$("#systemInfo").show();

			if (obj.system.state === 0) {
				$("#systemOffButton").addClass("btn-primary").removeClass("btn-default");
				$("#systemAutoButton").addClass("btn-default").removeClass("btn-primary");
				$("#systemOnButton").addClass("btn-default").removeClass("btn-primary");
			} else if (obj.system.state === 1) {
				$("#systemOnButton").addClass("btn-primary").removeClass("btn-default");
				$("#systemAutoButton").addClass("btn-default").removeClass("btn-primary");
				$("#systemOffButton").addClass("btn-default").removeClass("btn-primary");
			} else if (obj.system.state === 2) {
				$("#systemAutoButton").addClass("btn-primary").removeClass("btn-default");
				$("#systemOffButton").addClass("btn-default").removeClass("btn-primary");
				$("#systemOnButton").addClass("btn-default").removeClass("btn-primary");
			}
		}

		if (obj.data !== null) {
			$("#tempReading").html(convertTemp("c",obj.data.temperature,0) + "°");
			$("#humdReading").html(obj.data.humidity.toFixed(0) + "%");
			$("#timeReading").html(moment(obj.data.createdAt).format("h:mmA MMM D, YYYY"));
		} else {
			$("#tempReading").html("--°");
			$("#humdReading").html("--%");
			$("#timeReading").html("--");
		}
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function getLocations() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/location"
	}).success(function(results){
		var showId = results[0].id;
		$("#selectedLocation").val(showId);
		$("#locSelect").html(results[0].name);
		var defLoc = getCookie("defaultLocation");
		results.forEach(function(location, ind) {
			locations.push(location);
			var name = location.floor+" "+location.room;
			if (location.note !== null) {
				name += " ("+location.note+")";
			}
			var option = '<li><a onClick="getLastReading('+location.id+');">'+name+"</a></li>";
			$("#locList").append(option);
			if (Number(defLoc) === location.id) {
				showId = location.id;
				$("#selectedLocation").val(location.id);
				$("#locSelect").html(name);
			}
		});
		$("#locList").append('<li><a onClick="getDashboard();">Dashboard</a></li>');
		getLastReading(showId);
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function updateReading(obj) {
	$("#tempReading").html(convertTemp("c",obj.data.temperature,0) + "°");
	$("#humdReading").html(Number(obj.data.humidity).toFixed(0) + "%");
	$("#timeReading").html(moment().format("h:mmA MMM D, YYYY"));
	$("#timeReading").removeClass("highlightTime");
	if (obj.schedule !== null) {
		if (obj.systemAction === "heat") {
			$("#actionDiv").html('&nbsp;<img src="img/fire.png" alt="Heat" style="height:20px;">');
		} else if (obj.systemAction === "cool") {
			$("#actionDiv").html('&nbsp;<img src="img/wind.png" alt="Cool" style="height:20px;">');
		} else {
			$("#actionDiv").html("");
		}
	}
}

function updateDashboard(obj) {
	console.log(obj);
	$("#loc_"+obj.data.LocationId).find('td[name="locCurTemp"]').html(convertTemp("c",obj.data.temperature,0) + "°");
	if (obj.schedule !== null) {
		$("#loc_"+obj.data.LocationId).find('td[name="locTarTemp"]').html(convertTemp("c",obj.schedule.targetTemp,0) + "°");
	}
	if (obj.systemAction !== null) {
		if (obj.systemAction === "heat") {
			$("#loc_"+obj.data.LocationId).find('td[name="locSysStat"]').html('<img src="../shared/img/fire.png" alt="Heat" style="height:'+($("#loc_"+obj.data.LocationId).height()-28)+'px;">');
		} else if (obj.systemAction === "cool") {
			$("#loc_"+obj.data.LocationId).find('td[name="locSysStat"]').html('<img src="../shared/img/wind.png" alt="Cool" style="height:'+($("#loc_"+obj.data.LocationId).height()-28)+'px;">');
		}
	} else {
		$("#loc_"+obj.data.LocationId).find('td[name="locSysStat"]').html("");
	}
}

function updateSystem(state) {
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/system/"+system.id
		,data: {
			name: system.name
			,type: system.heat
			,controlPin: system.controlPin
			,state: state
		}
	}).success(function(result) {
		$("#infoModal").modal("hide");
		getLastReading(	$("#selectedLocation").val());
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function increaseHoldTemp() {
	var holdTemp = Number($("#holdTemp").val());
	var newTemp = holdTemp + 1;
	$("#holdTemp").val(newTemp);
}

function decreaseHoldTemp() {
	var holdTemp = Number($("#holdTemp").val());
	var newTemp = holdTemp - 1;
	$("#holdTemp").val(newTemp);
}

function setHoldTemp() {
	var holdTemp = Number($("#holdTemp").val());
	var sysScale = getCookie("temperatureScale");
	if (sysScale.toLowerCase() === "k") {
		holdTemp = KtoC(holdTemp,null);
	} else if (sysScale.toLowerCase() === "f") {
		holdTemp = FtoC(holdTemp,null);
	}
	var datum = {
		name: "HOLD"
		,system: system.id
		,days: JSON.stringify([-1])
		,startTime: moment.utc().format("HH:mm")
		,endTime: moment.utc().format("HH:mm")
		,targetTemp: holdTemp
	};
	$.ajax({
		type: "POST"
		,url: "/api/v1/hvac/schedule"
		,data: datum
	}).success(function(result) {
		$("#infoModal").modal("hide");
		getLastReading(	$("#selectedLocation").val());
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function cancelHold(id) {
	$.ajax({
		type: "DELETE"
		,url: "/api/v1/hvac/schedule/"+id
	}).success(function(result) {
		$("#infoModal").modal("hide");
		getLastReading(	$("#selectedLocation").val());
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}