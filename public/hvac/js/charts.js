var socket = io();

$(document).ready(function() {
	$("body").show();
		
	$.fn.datepicker.defaults.format = "mm/dd/yyyy";
	$.fn.datepicker.defaults.autoclose = true;
	$("#startDate").val(moment().subtract(7, 'days').format("MM/DD/YYYY"));
	$("#endDate").val(moment().format("MM/DD/YYYY"));
	$(".datepicker").datepicker();
	$("#startDate").addClass("option").change(function() { reload(); });
	$("#endDate").addClass("option").change(function() { reload(); });

	checkSystemOptions();

	getLocations();
	getSystems();
});

// FIELD EVENTS
	$(".option").change(function() {
		reload();
	});
	$("#navToggle").click(function() {
		showNav();
	})

// SOCKET IO
	socket.on("connect", function() {
		// console.log("connected to server");
	});

// FUNCTIONS
function showNav() {
	$("#navToggleDiv").remove();
	$("#navBar").show();
}

function showReadings() {
	$("#runDiv").slideUp();
	$("#readingDiv").slideDown();
	$("#showing").val("read");
}

function showRuns() {
	$("#readingDiv").slideUp();
	$("#runDiv").slideDown();
	$("#showing").val("run");
}

function reload() {
	options = checkOptions();
	var query = "?startTime=" + options.startDate + "&endTime=" + options.endDate;
	if ($("#showing").val() === "read") {
		query += "&locations=" + JSON.stringify(options.locations);
		if (options.temp) {
			query += "&temperature=true";
		}
		if (options.humid) {
			query += "&humidity=true";
		}
		$.ajax({
			type: "GET"
			,url: "/api/v1/hvac/system_run/plotBands" + query
		}).complete(function(jqXHR, textStatus) {
			var bands = jqXHR.responseJSON;
			$.ajax({
				type: "GET"
				,url: "/api/v1/hvac/envData/chart" + query
				,beforeSend: function() { $("#loadingModal").modal("show"); }
			}).success(function(results) {
				$("#loadingModal").modal("hide")
				if (results.data !== null) {
					$("#chartOptions").slideUp();
					$("#chartOptionsPulldown").slideDown();
					makeChart(results.data, bands);								
				} else {
					$("#chartBody").html("<h2>No Data :(</h2>");
				}
			}).error(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.status === 500) {
					$("#infoModalBody").html("There was a problem.  Please try again.");
					$("#infoModal").modal("show");
				}
			});
		});
	} else if ($("#showing").val() === "run") {
		query += "&systemId=" + options.systems[0];
		$.ajax({
			type: "GET"
			,url: "/api/v1/hvac/system_run/chart"+query
		}).success(function(results) {
			$("#chartOptions").slideUp();
			$("#chartOptionsPulldown").slideDown();
			makeRunsChart(results);

		}).error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 500) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}
}

function checkOptions() {
	var options = {
		temp: $("#tempCheck").is(":checked")
		,humid: $("#humidCheck").is(":checked")
		,startDate: moment.utc($("#startDate").val(),"MM/DD/YYYY").format('x')
		,endDate: moment.utc($("#endDate").val(),"MM/DD/YYYY").format('x')
		,locations: []
		,systems: []
	};
	$(".location").each(function(ind) {
		if ($(this).is(":checked")) {
			options.locations.push(Number($(this).val()));
		}
	});
	$(".system").each(function(ind) {
		if ($(this).is(":checked")) {
			options.systems.push(Number($(this).val()));
		}
	});
	return options;
}

function getLocations() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/location"
	}).success(function(results) {
		results.forEach(function(loc, ind) {
			var line = '<label>'+
				'<input type="checkbox" class="option location" value="'+loc.id+'" onChange="reload();">'+
					'&nbsp;'+loc.floor+'&nbsp;'+loc.room;
					if (loc.note !== null) {
						line += " ("+loc.note+")";
					}
			line += '</label>';
			$("#locationSelect").append(line);
			if ((ind + 1) < results.length) {
				$("#locationSelect").append("<br />");
			}
		});
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function getSystems() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/hvac/system"
	}).success(function(results) {
		results.forEach(function(sys, ind) {
			var line = '<label>'+
				'<input type="radio" name="systemRadio" class="option system" value="'+sys.id+'" onChange="reload();">'+
					'&nbsp;'+sys.name+'</label>';
			$("#systemSelect").append(line);
			if ((ind + 1) < results.length) {
				$("#systemSelect").append("<br />");
			}
		});
	}).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function makeChart(data, bands) {
	Highcharts.setOptions({global: { useUTC: false } });
	var myChart = Highcharts.chart('chartBody', {
		chart: {
			type: 'spline'
			,zoomType: "x"
		}
		,title: {
			text: null
		}
		,xAxis: {
			type: 'datetime'
			,ordinal: false
   			,plotBands: bands
		}
		,yAxis: {
			title: {
				text: null
			}
		}
		,series: data
	});
}

function makeRunsChart(data) {
	// console.log(data);
	Highcharts.setOptions({global: { useUTC: false } });
	var myChart = Highcharts.chart('chartBody', {
		chart: {
			type: 'column'
			,zoomType: "x"
		}
		,title: {
			text: null
		}
		,xAxis: {
			categories: data.days
		}
		,yAxis: {
			title: {
				text: null
			}
		}
		,series: [
			data.minutes
			,data.counts
			,data.averages
		]
	});
}

function showChartOptions() {
	$("#chartOptionsPulldown").slideUp();
	$("#chartOptions").slideDown();
}