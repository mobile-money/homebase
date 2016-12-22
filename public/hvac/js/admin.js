	
var socket = io();
var hosts = [];
var sensors = [];
var locations = [];
var models = [];
var systems = [];
var schedules = [];

$(document).ready(function() {
	$("body").show();

	$(".addModal").on('hidden.bs.modal', function() {
		$(".modal-header").empty();
		$(".modal-body").empty();
	});

	checkSystemOptions();
		
	getSensors();
	getHosts();
	getModels();
	getSystems();
	getLocations();
	getSchedules();
});

// FIELD EVENTS
	$("#navToggle").click(function() {
		showNav();
	})
	$("#addSensor").click(function() {
		addSensor();
	});
	$("#addHost").click(function() {
		addHost();
	});
	$("#addLocation").click(function() {
		addLocation();
	});
	$("#addModel").click(function() {
		addModel();
	});
	$("#addSystem").click(function() {
		addSystem();
	});
	$("#addSchedule").click(function() {
		addSchedule();
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
function resetModal(type) {
	$("#"+type+"ModalTitle").empty();
	$("#"+type+"ModalBody").empty();
	$("#"+type+"ModalFooter").empty();
}
function getOptions() {
	// Temp Scale
	var tempScale = getCookie("temperatureScale");
	$("#setScale").val(tempScale);
	if (tempScale === "f") {
		$("#optionFTempScale").removeClass("btn-default").addClass("btn-primary");
		$("#optionCTempScale").removeClass("btn-primary").addClass("btn-default");
		$("#optionKTempScale").removeClass("btn-primary").addClass("btn-default");
	} else if (tempScale === "c") {
		$("#optionFTempScale").removeClass("btn-primary").addClass("btn-default");
		$("#optionCTempScale").removeClass("btn-default").addClass("btn-primary");
		$("#optionKTempScale").removeClass("btn-primary").addClass("btn-default");
	} else if (tempScale === "k") {
		$("#optionFTempScale").removeClass("btn-primary").addClass("btn-default");
		$("#optionCTempScale").removeClass("btn-primary").addClass("btn-default");
		$("#optionKTempScale").removeClass("btn-default").addClass("btn-primary");
	} else {
		$("#optionFTempScale").removeClass("btn-primary").addClass("btn-default");
		$("#optionCTempScale").removeClass("btn-primary").addClass("btn-default");
		$("#optionKTempScale").removeClass("btn-primary").addClass("btn-default");
	}
	// Default Location
	var defLoc = getCookie("defaultLocation");
	$("#optionDefaultLoc").empty();
	var opt = '<option value=null></option>';
	$("#optionDefaultLoc").append(opt);
	locations.forEach(function(location) {
		var opt = '<option value="'+location.id+'"';
		if (Number(defLoc) === location.id) {
			opt += " selected";
		}
		opt += '>'+location.floor+" "+location.room+"</option>";
		$("#optionDefaultLoc").append(opt);
	});
	// Upper Buffer
	$("#optionUpperBuffer").val(getCookie("upperBuffer"));
	// Lower Buffer
	$("#optionLowerBuffer").val(getCookie("lowerBuffer"));
}
function updateTempScale(val) {
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/option"
		,data: {
			tempScale: val
		}
	}).success(function(response) {
		setCookie("temperatureScale",val,7);
		convertScheduleTemps($("#setScale").val());
		$("#setScale").val(val);
		if (val === "f") {
			$("#optionFTempScale").removeClass("btn-default").addClass("btn-primary");
			$("#optionCTempScale").removeClass("btn-primary").addClass("btn-default");
			$("#optionKTempScale").removeClass("btn-primary").addClass("btn-default");
		} else if (val === "c") {
			$("#optionCTempScale").removeClass("btn-default").addClass("btn-primary");
			$("#optionFTempScale").removeClass("btn-primary").addClass("btn-default");
			$("#optionKTempScale").removeClass("btn-primary").addClass("btn-default");
		} else if (val === "k") {
			$("#optionKTempScale").removeClass("btn-default").addClass("btn-primary");
			$("#optionCTempScale").removeClass("btn-primary").addClass("btn-default");
			$("#optionFTempScale").removeClass("btn-primary").addClass("btn-default");
		}
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function convertScheduleTemps(oldScale) {
	var elems = $("span[name=scheduleTemps]");
	for (var i=0; i<elems.length; i++) {
		var newScale = convertTemp(oldScale,elems[i].innerHTML,0);
		elems[i].innerHTML = newScale;
	}
}
function updateDefaultLoc() {
	var val = $("#optionDefaultLoc").val();
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/option"
		,data: {
			defaultLocation: val
		}
	}).success(function(response) {
		setCookie("defaultLocation",val,7);
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function updateUpperBuffer() {
	var val = $("#optionUpperBuffer").val();
	if (val.match(/^\d{1,2}$/)) {
		$.ajax({
			type: "PUT"
			,url: "/api/v1/hvac/option"
			,data: {
				upperBuffer: val
			}
		}).success(function(response) {
			setCookie("upperBuffer",val,7);
		}).error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 500) {
				$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
				$("#infoModal").modal("show");
			}
		});
	}
}
function updateLowerBuffer() {
	var val = $("#optionLowerBuffer").val();
	if (val.match(/^\d{1,2}$/)) {
		$.ajax({
			type: "PUT"
			,url: "/api/v1/hvac/option"
			,data: {
				lowerBuffer: val
			}
		}).success(function(response) {
			setCookie("lowerBuffer",val,7);
		}).error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 500) {
				$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
				$("#infoModal").modal("show");
			}
		});
	}
}
function addHost() {
	$("#addModalTitle").html("<h3>Add Host</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Host Name</span>'+
		'<input class="form-control" type="text" id="addHostName" maxlength="48" />'+
	'</div>';

	$("#addModalBody").html(row);

	$("#addModalFooter").html('<button class="btn btn-sm btn-success" data-dismiss="modal" aria-label="Add" title="Add" onClick="submitAddHost();">Add</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#addModal").modal("show");
}
function addLocation() {
	$("#addModalTitle").html("<h3>Add Location</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Floor</span>'+
		'<input class="form-control" type="text" id="addLocationFloor" maxlength="48" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Room</span>'+
		'<input class="form-control" type="text" id="addLocationRoom" maxlength="48" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Note</span>'+
		'<input class="form-control" type="text" id="addLocationNote" max="255" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Controls System</span>'+
		'<select class="form-control" id="addLocationSystemId"><option value="-1">NONE</option>';
		systems.forEach(function(system) {
			row += '<option value="' + system.id + '">' + system.name + '</option>';
		});
		row += "</select>"+
	"</div>";

	$("#addModalBody").html(row);

	$("#addModalFooter").html('<button class="btn btn-sm btn-success" data-dismiss="modal" aria-label="Add" title="Add" onClick="submitAddLocation();">Add</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#addModal").modal("show");
}
function addModel() {
	$("#addModalTitle").html("<h3>Add Model</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" id="addModelName" maxlength="48" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Manufacturer</span>'+
		'<input class="form-control" type="text" id="addModelManufacturer" maxlength="48" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Temperature</span>'+
		'<select class="form-control" id="addModelTemperature">'+
			'<option value="true">True</option>'+
			'<option value="false">False</option>'+
		"</select>"+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Humidity</span>'+
		'<select class="form-control" id="addModelHumidity">'+
			'<option value="false">False</option>'+
			'<option value="true">True</option>'+
		"</select>"+
	"</div>";

	$("#addModalBody").html(row);

	$("#addModalFooter").html('<button class="btn btn-sm btn-success" data-dismiss="modal" aria-label="Add" title="Add" onClick="submitAddModel();">Add</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#addModal").modal("show");
}
function addSchedule() {
	$("#addModalTitle").html("<h3>Add Schedule</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" id="addScheduleName" maxlength="48" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">System</span>'+
		'<select class="form-control" id="addScheduleSystem">';
			systems.forEach(function(system) {
				row += '<option value="'+system.id+'">'+system.name+'</option>';
			});
		row += '</select>'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Days</span>'+
			'<input class="addScheduleDays" type="checkbox" value="0" />&nbsp;Sun<br />'+
			'<input class="addScheduleDays" type="checkbox" value="1" />&nbsp;Mon<br />'+
			'<input class="addScheduleDays" type="checkbox" value="2" />&nbsp;Tue<br />'+
			'<input class="addScheduleDays" type="checkbox" value="3" />&nbsp;Wed<br />'+
			'<input class="addScheduleDays" type="checkbox" value="4" />&nbsp;Thu<br />'+
			'<input class="addScheduleDays" type="checkbox" value="5" />&nbsp;Fri<br />'+
			'<input class="addScheduleDays" type="checkbox" value="6" />&nbsp;Sat<br />'+
	'</div>'+
	'<div class="input-group bootstrap-timepicker timepicker modal-field">'+
		'<span class="input-group-addon">Start Time</span>'+
		'<input type="text" id="addScheduleStartTime" class="form-control">'+
		'<span class="input-group-addon"><i class="glyphicon glyphicon-time"></i></span>'+
	'</div>'+
	'<div class="input-group bootstrap-timepicker timepicker modal-field">'+
		'<span class="input-group-addon">End Time</span>'+
		'<input type="text" id="addScheduleEndTime" class="form-control input-small">'+
		'<span class="input-group-addon"><i class="glyphicon glyphicon-time"></i></span>'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Target Temperature</span>'+
		'<input class="form-control" type="number" id="addScheduleTargetTemperature" min="0" max="99" step="1" />'+
		'<span class="input-group-addon">°F</span>'+
	'</div>';

	$("#addModalBody").html(row);

	$("#addModalFooter").html('<button class="btn btn-sm btn-success" data-dismiss="modal" aria-label="Add" title="Add" onClick="submitAddSchedule();">Add</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#addModal").modal("show");

	$("#addScheduleStartTime").timepicker();
	$("#addScheduleEndTime").timepicker();
}
function addSensor() {
	$("#addModalTitle").html("<h3>Add Sensor</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Model</span>'+
		'<select class="form-control" id="addSensorModel">';
		models.forEach(function(model){
			row += '<option value="' + model.id + '">' + model.manufacturer + "&nbsp;" + model.name + "</option>";
		});
		row += "</select>"+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Location</span>'+
		'<select class="form-control" id="addSensorLocation">';
		locations.forEach(function(location) {
			row += '<option value="' + location.id + '">' + location.floor + "&nbsp;" + location.room;
			if (location.note !== null) {
				row += " (" + location.note + ")";
			}
			row += '</option>';
		});
		row += '</select>'+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Host</span>'+
		'<select class="form-control" id="addSensorHost">';
		hosts.forEach(function(host) {
			row += '<option value="' + host.id + '">' + host.name + "</option>";
		});
		row += "</select>"+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Data Pin</span>'+
		'<input class="form-control" type="number" id="addSensorDataPin" min="0" max="99" step="1" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Enabled</span>'+
		'<select class="form-control" id="addSensorEnabled">'+
			'<option value="false">False</option>'+
			'<option value="true">True</option>'+
		'</select>'+
	"</div>";

	$("#addModalBody").html(row);

	$("#addModalFooter").html('<button class="btn btn-sm btn-success" data-dismiss="modal" aria-label="Add" title="Add" onClick="submitAddSensor();">Add</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#addModal").modal("show");
}
function addSystem() {
	$("#addModalTitle").html("<h3>Add System</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" id="addSystemName" maxlength="48" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Type</span>'+
		'<select class="form-control" id="addSystemType">'+
			'<option value="true">Heat</option>'+
			'<option value="false">Cool</option>'+
		'</select>'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Control Pin</span>'+
		'<input class="form-control" type="number" id="addSystemControlPin" min="0" max="99" step="1" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">System State</span>'+
		'<select class="form-control" id="addSystemState">'+
			'<option value="2">Auto</option>'+
			'<option value="1">On</option>'+
			'<option value="0">Off</option>'+
		'</select>'+
	'</div>';

	$("#addModalBody").html(row);

	$("#addModalFooter").html('<button class="btn btn-sm btn-success" data-dismiss="modal" aria-label="Add" title="Add" onClick="submitAddSystem();">Add</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#addModal").modal("show");
}
function deleteHost(id) {
	var vals = _.findWhere(hosts, {"id": id});
	$("#deleteModalTitle").html("<h3>Delete Host</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Host Name</span>'+
		'<input type="text" class="form-control" value="'+vals.name+'" disabled />'+
	"</div>"+
	"<h4>Are you sure you want to delete this host?</h4>";

	$("#deleteModalBody").html(row);

	$("#deleteModalFooter").html('<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Delete" title="Delete" onClick="submitDeleteHost('+id+');">Delete</button>'+
		'<button class="btn btn-sm btn-default" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#deleteModal").modal("show");
}
function deleteLocation(id) {
	var vals = _.findWhere(locations, {"id": id});
	$("#deleteModalTitle").html("<h3>Delete Location</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Floor</span>'+
		'<input class="form-control" type="text" value="'+vals.floor+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Room</span>'+
		'<input class="form-control" type="text" value="'+vals.room+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Note</span>'+
		'<input class="form-control" type="text" value="';
		if (vals.note !== null) { row += vals.note; }
		row += '" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Controls System</span>'+
		'<input type="text" class="form-control" value="';
		if (vals.hasOwnProperty("System") && vals.System !== null) { row += vals.System.name; }
		row += '" disabled />'+
	'</div>'+
	"<h4>Are you sure you want to delete this location?</h4>";

	$("#deleteModalBody").html(row);

	$("#deleteModalFooter").html('<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Delete" title="Delete" onClick="submitDeleteLocation('+id+');">Delete</button>'+
		'<button class="btn btn-sm btn-default" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#deleteModal").modal("show");
}
function deleteModel(id) {
	var vals = _.findWhere(models, {"id": id});
	$("#deleteModalTitle").html("<h3>Delete Model</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" value="'+vals.name+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Manufacturer</span>'+
		'<input class="form-control" type="text" value="'+vals.manufacturer+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Temperature</span>'+
		'<input type="text" class="form-control" value="'+vals.temperature+'" disabled />'+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Humidity</span>'+
		'<input type="text" class="form-control" value="'+vals.humidity+'" disabled />'+
	"</div>"+
	"<h4>Are you sure you want to delete this model?</h4>";

	$("#deleteModalBody").html(row);

	$("#deleteModalFooter").html('<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Delete" title="Delete" onClick="submitDeleteModel('+id+');">Delete</button>'+
		'<button class="btn btn-sm btn-default" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#deleteModal").modal("show");
}
function deleteSchedule(id) {
	var vals = _.findWhere(schedules, {"id": id});
	$("#deleteModalTitle").html("<h3>Delete Schedule</h3>");

	var dayArr = _.map(JSON.parse(vals.days), function(int) {
		return moment().day(int).format("ddd");
	});
	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" value="'+vals.name+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">System</span>'+
		'<input type="text" class="form-control" value="'+vals.System.name+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Days</span>'+
		'<input type="text" class="form-control" value="'+dayArr.join(', ')+'" disabled />'+
	'</div>'+
	'<div class="input-group bootstrap-timepicker timepicker modal-field">'+
		'<span class="input-group-addon">Start Time</span>'+
		'<input type="text" class="form-control" value="'+moment(vals.startTime,"HH:mm").format("h:mm A")+'" disabled>'+
	'</div>'+
	'<div class="input-group bootstrap-timepicker timepicker modal-field">'+
		'<span class="input-group-addon">End Time</span>'+
		'<input type="text" class="form-control" value="'+moment(vals.endTime,"HH:mm").format("h:mm A")+'" disabled>'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Target Temperature</span>'+
		'<input class="form-control" type="text" value="'+vals.targetTemp+'" disabled />'+
		'<span class="input-group-addon">°</span>'+
	'</div>'+
	"<h4>Are you sure you want to delete this schedule?</h4>";

	$("#deleteModalBody").html(row);

	$("#deleteModalFooter").html('<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Delete" title="Delete" onClick="submitDeleteSchedule('+id+');">Delete</button>'+
		'<button class="btn btn-sm btn-default" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#deleteModal").modal("show");
}
function deleteSensor(id) {
	var vals = _.findWhere(sensors, {"id": id});
	$("#deleteModalTitle").html("<h3>Delete Sensor</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Model</span>'+
		'<input type="text" class="form-control" value="'+vals.Model.manufacturer+"&nbsp;"+vals.Model.name+'" disabled />'+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Location</span>'+
		'<input type="text" class="form-control" value="'+vals.Location.floor+"&nbsp;"+vals.Location.room;
		if (vals.Location.note !== null) { row += " ("+vals.Location.note+")"; }
		row += '" disabled />'+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Host</span>'+
		'<input type="text" class="form-control" value="'+vals.Host.name+'" disabled />'+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Data Pin</span>'+
		'<input class="form-control" type="text" value="'+ vals.dataPin +'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Enabled</span>'+
		'<input type="text" class="form-control" value="'+vals.enabled+'" disabled />'+
	"</div>"+
	"<h4>Are you sure you want to delete this sensor?</h4>";

	$("#deleteModalBody").html(row);

	$("#deleteModalFooter").html('<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Delete" title="Delete" onClick="submitDeleteSensor('+id+');">Delete</button>'+
		'<button class="btn btn-sm btn-default" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#deleteModal").modal("show");
}
function deleteSystem(id) {
	var vals = _.findWhere(systems, {"id": id});
	$("#deleteModalTitle").html("<h3>Delete System</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" value="'+vals.name+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Heat</span>'+
		'<input type="text" class="form-control" value="'+vals.heat+'" disabled />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Control Pin</span>'+
		'<input class="form-control" type="text"value="'+vals.controlPin+'" disabled />'+
	'</div>'+
	"<h4>Are you sure you want to delete this system?</h4>";

	$("#deleteModalBody").html(row);

	$("#deleteModalFooter").html('<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Delete" title="Delete" onClick="submitDeleteSystem('+id+');">Delete</button>'+
		'<button class="btn btn-sm btn-default" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');
	
	$("#deleteModal").modal("show");
}
function editHost(id) {
	var vals = _.findWhere(hosts, {"id": id});
	$("#editModalTitle").html("<h3>Edit Host</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Host Name</span>'+
		'<input type="text" class="form-control" id="editHostName" value="'+vals.name+'" />'+
	"</div>";

	$("#editModalBody").html(row);

	$("#editModalFooter").html('<button class="btn btn-sm btn-primary" data-dismiss="modal" aria-label="Edit" title="Edit" onClick="submitEditHost('+id+');">Edit</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#editModal").modal("show");
}
function editLocation(id) {
	var vals = _.findWhere(locations, {"id": id});
	$("#editModalTitle").html("<h3>Edit Location</h3>");

	var row = '<input type="hidden" id="editLocationId" value="'+id+'" />'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Floor</span>'+
		'<input class="form-control" type="text" id="editLocationFloor" maxlength="48" value="'+vals.floor+'" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Room</span>'+
		'<input class="form-control" type="text" id="editLocationRoom" maxlength="48" value="'+vals.room+'" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Note</span>'+
		'<input class="form-control" type="text" id="editLocationNote" maxlength="255" value="';
		if (vals.note !== null) { row += vals.note; }
		row += '" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Controls System</span>'+
		'<select class="form-control" id="editLocationSystemId"><option value="-1">NONE</option>';
		systems.forEach(function(system) {
			row += '<option value="' + system.id + '"';
			if (vals.hasOwnProperty("System") && vals.System !== null) {
				if (vals.System.id === system.id) { row += ' selected'; }
			}
			row += '>' + system.name + '</option>';
		});
		row += '</select>'+
	'</div>';

	$("#editModalBody").html(row);

	$("#editModalFooter").html('<button class="btn btn-sm btn-primary" data-dismiss="modal" aria-label="Edit" title="Edit" onClick="submitEditLocation('+id+');">Edit</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#editModal").modal("show");
}
function editModel(id) {
	var vals = _.findWhere(models, {"id": id});
	$("#editModalTitle").html("<h3>Edit Model</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" id="editModelName" maxlength="48" value="'+vals.name+'" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Manufacturer</span>'+
		'<input class="form-control" type="text" id="editModelManufacturer" maxlength="48" value="'+vals.manufacturer+'" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Temperature</span>'+
		'<select class="form-control" id="editModelTemperature">'+
			'<option value="true">True</option>'+
			'<option value="false"';
			if (!vals.temperature) { row += ' selected'; }
			row += '>False</option>'+
		"</select>"+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Humidity</span>'+
		'<select class="form-control" id="editModelHumidity">'+
			'<option value="false">False</option>'+
			'<option value="true"';
			if (vals.humidity) { row += ' selected'; }
			row += '>True</option>'+
		"</select>"+
	"</div>";

	$("#editModalBody").html(row);

	$("#editModalFooter").html('<button class="btn btn-sm btn-primary" data-dismiss="modal" aria-label="Edit" title="Edit" onClick="submitEditModel('+id+');">Edit</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#editModal").modal("show");
}
function editSchedule(id) {
	var vals = _.findWhere(schedules, {"id": id});
	var dayArr = JSON.parse(vals.days);
	$("#editModalTitle").html("<h3>Edit Schedule</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" id="editScheduleName" maxlength="48" value="'+vals.name+'" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">System</span>'+
		'<select class="form-control" id="editScheduleSystem">';
			systems.forEach(function(system) {
				row += '<option value="'+system.id+'"';
				if (vals.System.id === system.id) { row += ' selected'; }
				row += '>'+system.name+'</option>';
			});
		row += '</select>'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Days</span>'+
		'<input class="editScheduleDays" type="checkbox" value="0"';
		if (_.indexOf(dayArr,0) !== -1) { row += ' checked'; }
		row += ' />&nbsp;Sun<br />'+
		'<input class="editScheduleDays" type="checkbox" value="1"';
		if (_.indexOf(dayArr,1) !== -1) { row += ' checked'; }
		row += ' />&nbsp;Mon<br />'+
		'<input class="editScheduleDays" type="checkbox" value="2"';
		if (_.indexOf(dayArr,2) !== -1) { row += ' checked'; }
		row += ' />&nbsp;Tue<br />'+
		'<input class="editScheduleDays" type="checkbox" value="3"';
		if (_.indexOf(dayArr,3) !== -1) { row += ' checked'; }
		row += ' />&nbsp;Wed<br />'+
		'<input class="editScheduleDays" type="checkbox" value="4"';
		if (_.indexOf(dayArr,4) !== -1) { row += ' checked'; }
		row += ' />&nbsp;Thu<br />'+
		'<input class="editScheduleDays" type="checkbox" value="5"';
		if (_.indexOf(dayArr,5) !== -1) { row += ' checked'; }
		row += ' />&nbsp;Fri<br />'+
		'<input class="editScheduleDays" type="checkbox" value="6"';
		if (_.indexOf(dayArr,6) !== -1) { row += ' checked'; }
		row += ' />&nbsp;Sat<br />'+
	'</div>'+
	'<div class="input-group bootstrap-timepicker timepicker modal-field">'+
		'<span class="input-group-addon">Start Time</span>'+
		'<input type="text" id="editScheduleStartTime" class="form-control">'+
		'<span class="input-group-addon"><i class="glyphicon glyphicon-time"></i></span>'+
	'</div>'+
	'<div class="input-group bootstrap-timepicker timepicker modal-field">'+
		'<span class="input-group-addon">End Time</span>'+
		'<input type="text" id="editScheduleEndTime" class="form-control">'+
		'<span class="input-group-addon"><i class="glyphicon glyphicon-time"></i></span>'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Target Temperature</span>'+
		'<input class="form-control" type="number" id="editScheduleTargetTemperature" min="0" max="99" step="1" value="'+((Number(vals.targetTemp) * (9/5)) + 32).toFixed(0)+'" />'+
		'<span class="input-group-addon">°F</span>'+
	'</div>';

	$("#editModalBody").html(row);

	$("#editModalFooter").html('<button class="btn btn-sm btn-primary" data-dismiss="modal" aria-label="Edit" title="Edit" onClick="submitEditSchedule('+id+');">Edit</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#editModal").modal("show");

	$("#editScheduleStartTime").timepicker({defaultTime: moment(vals.startTime,"HH:mm").format("h:mm A")});
	$("#editScheduleEndTime").timepicker({defaultTime: moment(vals.endTime,"HH:mm").format("h:mm A")});
}
function editSensor(id) {
	var vals = _.findWhere(sensors, {"id": id});
	$("#editModalTitle").html("<h3>Edit Sensor</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Model</span>'+
		'<select class="form-control" id="editSensorModel">';
		models.forEach(function(model){
			row += '<option value="' + model.id + '"';
			if (vals.ModelId === model.id) { row += ' selected'; }
			row += '>' + model.manufacturer + "&nbsp;" + model.name + "</option>";
		});
		row += "</select>"+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Location</span>'+
		'<select class="form-control" id="editSensorLocation">';
		locations.forEach(function(location) {
			row += '<option value="' + location.id + '"';
			if (vals.LocationId === location.id) { row += ' selected'; }
			row += '>' + location.floor + "&nbsp;" + location.room;
			if (location.note !== null) {
				row += " (" + location.note + ")";
			}
			row += '</option>';
		});
		row += '</select>'+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Host</span>'+
		'<select class="form-control" id="editSensorHost">';
		hosts.forEach(function(host) {
			row += '<option value="' + host.id + '"';
			if (vals.HostId === host.id) { row += ' selected'; }
			row += '>' + host.name + "</option>";
		});
		row += "</select>"+
	"</div>"+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Data Pin</span>'+
		'<input class="form-control" type="number" id="editSensorDataPin" min="0" max="99" step="1" value="' + vals.dataPin + '" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Enabled</span>'+
		'<select class="form-control" id="editSensorEnabled">'+
			'<option value="false">False</option>'+
			'<option value="true"';
			if (vals.enabled) { row += ' selected'; }
			row += '>True</option>'+
		'</select>'+
	"</div>";

	$("#editModalBody").html(row);

	$("#editModalFooter").html('<button class="btn btn-sm btn-primary" data-dismiss="modal" aria-label="Edit" title="Edit" onClick="submitEditSensor('+id+');">Edit</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#editModal").modal("show");
}
function editSystem(id) {
	var vals = _.findWhere(systems, {"id": id});
	$("#editModalTitle").html("<h3>Edit System</h3>");

	var row = '<div class="input-group modal-field">'+
		'<span class="input-group-addon">Name</span>'+
		'<input class="form-control" type="text" id="editSystemName" maxlength="48" value="'+vals.name+'" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Type</span>'+
		'<select class="form-control" id="editSystemType">'+
			'<option value="1">Heat</option>'+
			'<option value="0"';
			if (!vals.heat) { row += ' selected'; }
			row += '>Cool</option>'+
		'</select>'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">Control Pin</span>'+
		'<input class="form-control" type="number" id="editSystemControlPin" min="0" max="99" step="1" value="'+vals.controlPin+'" />'+
	'</div>'+
	'<div class="input-group modal-field">'+
		'<span class="input-group-addon">System State</span>'+
		'<select class="form-control" id="editSystemState">'+
			'<option value="2"';
			if (vals.state === 2) { row += ' selected'; }
			row += '>Auto</option>'+
			'<option value="1"';
			if (vals.state === 1) { row += ' selected'; }
			row += '>On</option>'+
			'<option value="0"';
			if (vals.state === 0) { row += ' selected'; }
			row += '>Off</option>'+
		'</select>'+
	'</div>';

	$("#editModalBody").html(row);

	$("#editModalFooter").html('<button class="btn btn-sm btn-primary" data-dismiss="modal" aria-label="Edit" title="Edit" onClick="submitEditSystem('+id+');">Edit</button>'+
		'<button class="btn btn-sm btn-danger" data-dismiss="modal" aria-label="Cancel" title="Cancel">Cancel</button>');

	$("#editModal").modal("show");
}
function getHosts() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/host"
	}).success(function(results){
		hosts = results;
		$("#hostDiv").empty();
		var table = '<table class="table table-striped">';
		results.forEach(function(host) {
			var row = '<tr id="host_'+host.id+'">'+
				"<td>"+host.name+"</td>"+
				'<td style="text-align: right;">'+
					'<button class="btn btn-xs btn-primary edit_host" onClick="editHost(' + host.id + ');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
					'<button class="btn btn-xs btn-danger delete_host" onClick="deleteHost(' + host.id + ');">'+
						'<i class="glyphicon glyphicon-trash"></i>'+
					'</button>'+
				"</td>"+
			"</tr>";
			table += row;
		});
		table += "</table>";
		$("#hostDiv").html(table);
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function getLocations() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/location"
	}).success(function(results){
		locations = results;
		$("#locationDiv").empty();
		var table = '<table class="table table-striped">';
		results.forEach(function(location) {
			var row = '<tr id="location_'+location.id+'">'+
				"<td>"+location.floor+"&nbsp;"+location.room;
				if (location.note !== null) {
					row += "&nbsp;("+location.note+")";
				}
				row += '</td>'+
				'<td style="text-align: right;">'+
					'<button class="btn btn-xs btn-primary edit_location" onClick="editLocation(' + location.id + ');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
					'<button class="btn btn-xs btn-danger delete_location" onClick="deleteLocation(' + location.id + ');">'+
						'<i class="glyphicon glyphicon-trash"></i>'+
					'</button>'+
				"</td>"+
			"</tr>";
			table += row;
		});
		table += "</table>";
		$("#locationDiv").html(table);
		getOptions();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function getModels() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/model"
	}).success(function(results){
		models = results;
		$("#modelDiv").empty();
		var table = '<table class="table table-striped">';
		results.forEach(function(model) {
			var row = '<tr id="model_'+model.id+'">'+
				"<td>"+model.name+"</td>"+
				"<td>"+model.manufacturer+"</td>"+
				'<td style="text-align: right;">'+
					'<button class="btn btn-xs btn-primary edit_model" onClick="editModel(' + model.id + ');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
					'<button class="btn btn-xs btn-danger delete_model" onClick="deleteModel(' + model.id + ');">'+
						'<i class="glyphicon glyphicon-trash"></i>'+
					'</button>'+
				"</td>"+
			"</tr>";
			table += row;
		});
		table += "</table>";
		$("#modelDiv").html(table);
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function getSchedules() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/schedule"
	}).success(function(results){
		schedules = results;
		$("#scheduleDiv").empty();
		var table = '<table class="table table-striped">';
		results.forEach(function(schedule) {
			var row = '<tr id="schedule_'+schedule.id+'">'+
				"<td>"+schedule.name+"</td>"+
				"<td>"+schedule.System.name+"</td>"+
				"<td>"+_.map(JSON.parse(schedule.days),function(num) { return moment().day(num).format("ddd")}).join(", ")+"</td>"+
				"<td>"+moment(schedule.startTime,"HH:mm").format("h:mmA")+" - "+moment(schedule.endTime,"HH:mm").format("h:mmA")+"</td>"+
				'<td><span name="scheduleTemps">'+convertTemp('c',schedule.targetTemp,0)+"</span>°</td>"+
				'<td style="text-align: right;">'+
					'<button class="btn btn-xs btn-primary edit_schedule" onClick="editSchedule(' + schedule.id + ');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
					'<button class="btn btn-xs btn-danger delete_schedule" onClick="deleteSchedule(' + schedule.id + ');">'+
						'<i class="glyphicon glyphicon-trash"></i>'+
					'</button>'+
				"</td>"+
			"</tr>";
			table += row;
		});
		table += "</table>";
		$("#scheduleDiv").html(table);
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function getSensors() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/sensor"
	}).success(function(results){
		sensors = results;
		$("#sensorDiv").empty();
		var table = '<table class="table table-striped">';
		results.forEach(function(sensor) {
			var row = '<tr id="sensor_' + sensor.id + '">'+
				"<td>"+sensor.Model.manufacturer+" "+sensor.Model.name+"</td>"+
				"<td>"+sensor.Location.floor+" "+sensor.Location.room;
				if (sensor.Location.note !== null) {
					row += " ("+sensor.Location.note+")";
				}
				row += "</td>"+
				"<td>"+sensor.Host.name+"</td>"+
				"<td>"+sensor.dataPin+"</td>";
				if (sensor.enabled) {
					row += "<td>Enabled</td>";
				} else {
					row += "<td>Disabled</td>";
				}
				row += '<td style="text-align: right;">'+
					'<button class="btn btn-xs btn-primary edit_sensor" onClick="editSensor(' + sensor.id + ');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
					'<button class="btn btn-xs btn-danger delete_sensor" onClick="deleteSensor(' + sensor.id + ');">'+
						'<i class="glyphicon glyphicon-trash"></i>'+
					'</button>'+
				"</td>"+
			"</tr>";
			table += row;
		});
		table += "</table>";
		$("#sensorDiv").html(table);
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function getSystems() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/system"
	}).success(function(results){
		systems = results;
		$("#systemDiv").empty();
		var table = '<table class="table table-striped">';
		results.forEach(function(system) {
			var row = '<tr id="system_'+system.id+'">'+
				"<td>"+system.name+"</td>";
				if (system.state === 2) {
					row += "<td>Auto</td>";
				} else if (system.state === 1) {
					row += "<td>On</td>";
				} else {
					row += "<td>Off</td>";
				}
				row += '<td style="text-align: right;">'+
					'<button class="btn btn-xs btn-primary edit_system" onClick="editSystem(' + system.id + ');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
					'<button class="btn btn-xs btn-danger delete_system" onClick="deleteSystem(' + system.id + ');">'+
						'<i class="glyphicon glyphicon-trash"></i>'+
					'</button>'+
				"</td>"+
			"</tr>";
			table += row;
		});
		table += "</table>";
		$("#systemDiv").html(table);
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitAddHost() {
	var datum = {
		name: $("#addHostName").val()
	};
	$.ajax({
		type: "POST"
		,url: "/api/v1/hvac/host"
		,data: datum
	}).success(function(result) {
		resetModal("add");
		getHosts();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitAddLocation() {
	var datum = {
		floor: $("#addLocationFloor").val()
		,room: $("#addLocationRoom").val()
		,systemId: $("#addLocationSystemId").val()
	};
	if ($("#addLocationNote").val() !== "") {
		datum.note = $("#addLocationNote").val();
	}
	$.ajax({
		type: "POST"
		,url: "/api/v1/hvac/location"
		,data: datum
	}).success(function(result) {
		resetModal("add");
		getLocations();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitAddModel() {
	var datum = {
		name: $("#addModelName").val()
		,manufacturer: $("#addModelManufacturer").val()
		,temperature: $("#addModelTemperature").val()
		,humidity: $("#addModelHumidity").val()
	};
	$.ajax({
		type: "POST"
		,url: "/api/v1/hvac/model"
		,data: datum
	}).success(function(result) {
		resetModal("add");
		getModels();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitAddSchedule() {
	var datum = {
		name: $("#addScheduleName").val()
		,system: $("#addScheduleSystem").val()
		,startTime: moment($("#addScheduleStartTime").val(),"h:mm A").format("HH:mm")
		,endTime: moment($("#addScheduleEndTime").val(),"h:mm A").format("HH:mm")
		,targetTemp: FtoC($("#addScheduleTargetTemperature").val(),4)
	};
	datum.days = JSON.stringify($(".addScheduleDays:checked").map(function() {
		return Number($(this).val());
	}).get());
	$.ajax({
		type: "POST"
		,url: "/api/v1/hvac/schedule"
		,data: datum
	}).success(function(result) {
		resetModal("add");
		getSchedules();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitAddSensor() {
	var datum = {
		dataPin: $("#addSensorDataPin").val()
		,enabled: $("#addSensorEnabled").val()
		,locationId: $("#addSensorLocation").val()
		,hostId: $("#addSensorHost").val()
		,modelId: $("#addSensorModel").val()
	};
	$.ajax({
		type: "POST"
		,url: "/api/v1/hvac/sensor"
		,data: datum
	}).success(function(result) {
		resetModal("add");
		getSensors();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitAddSystem() {
	var datum = {
		name: $("#addSystemName").val()
		,type: $("#addSystemType").val()
		,controlPin: $("#addSystemControlPin").val()
		,state: $("#addSystemState").val()
	};
	$.ajax({
		type: "POST"
		,url: "/api/v1/hvac/system"
		,data: datum
	}).success(function(result) {
		resetModal("add");
		getSystems();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitDeleteHost(id) {
	$.ajax({
		type: "DELETE"
		,url: "/api/v1/hvac/host/"+id
	}).success(function(result) {
		resetModal("delete");
		getHosts();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitDeleteLocation(id) {
	$.ajax({
		type: "DELETE"
		,url: "/api/v1/hvac/location/"+id
	}).success(function(result) {
		resetModal("delete");
		getLocations();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitDeleteModel(id) {
	$.ajax({
		type: "DELETE"
		,url: "/api/v1/hvac/model/"+id
	}).success(function(result) {
		resetModal("delete");
		getModels();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitDeleteSchedule(id) {
	$.ajax({
		type: "DELETE"
		,url: "/api/v1/hvac/schedule/"+id
	}).success(function(result) {
		resetModal("delete");
		getSchedules();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitDeleteSensor(id) {
	$.ajax({
		type: "DELETE"
		,url: "/api/v1/hvac/sensor/"+id
	}).success(function(result) {
		resetModal("delete");
		getSensors();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitDeleteSystem(id) {
	$.ajax({
		type: "DELETE"
		,url: "/api/v1/hvac/system/"+id
	}).success(function(result) {
		resetModal("delete");
		getSystems();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitEditHost(id) {
	var datum = {
		name: $("#editHostName").val()
	};
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/host/"+id
		,data: datum
	}).success(function(result) {
		resetModal("edit");
		getHosts();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitEditLocation(id) {
	var datum = {
		floor: $("#editLocationFloor").val()
		,room: $("#editLocationRoom").val()
		,systemId: Number($("#editLocationSystemId").val())
	};
	if ($("#editLocationNote").val() !== "") {
		datum.note = $("#editLocationNote").val()
	}
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/location/"+id
		,data: datum
	}).success(function(result) {
		resetModal("edit");
		getLocations();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitEditModel(id) {
	var datum = {
		name: $("#editModelName").val()
		,manufacturer: $("#editModelManufacturer").val()
		,temperature: $("#editModelTemperature").val()
		,humidity: $("#editModelHumidity").val()
	};
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/model/"+id
		,data: datum
	}).success(function(result) {
		resetModal("edit");
		getModels();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}
function submitEditSchedule(id) {
	var datum = {
		name: $("#editScheduleName").val()
		,system: $("#editScheduleSystem").val()
		,startTime: moment($("#editScheduleStartTime").val(),"h:mm A").format("HH:mm")
		,endTime: moment($("#editScheduleEndTime").val(),"h:mm A").format("HH:mm")
		,targetTemp: FtoC($("#editScheduleTargetTemperature").val(),4)
	};
	datum.days = JSON.stringify($(".editScheduleDays:checked").map(function() {
		return Number($(this).val());
	}).get());
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/schedule/"+id
		,data: datum
	}).success(function(result) {
		resetModal("edit");
		getSchedules();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitEditSensor(id) {
	var datum = {
		dataPin: $("#editSensorDataPin").val()
		,enabled: $("#editSensorEnabled").val()
		,locationId: $("#editSensorLocation").val()
		,hostId: $("#editSensorHost").val()
		,modelId: $("#editSensorModel").val()
	};
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/sensor/"+id
		,data: datum
	}).success(function(result) {
		resetModal("edit");
		getSensors();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.<br /><br />"+jqXHR.responseText);
			$("#infoModal").modal("show");
		}
	});
}
function submitEditSystem(id) {
	var datum = {
		name: $("#editSystemName").val()
		,type: $("#editSystemType").val()
		,controlPin: $("#editSystemControlPin").val()
		,state: $("#editSystemState").val()
	};
	$.ajax({
		type: "PUT"
		,url: "/api/v1/hvac/system/"+id
		,data: datum
	}).success(function(result) {
		resetModal("edit");
		getSystems();
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}