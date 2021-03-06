$(document).ready(function() {
	$("body").show();

	if (QueryString.hasOwnProperty("CarId")) {
	    $("#currentCarId").val(QueryString["CarId"]);
    }

    populateCars();
});

const QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  const query_string = {};
  const query = window.location.search.substring(1);
  const vars = query.split("&");
  for (let i=0;i<vars.length;i++) {
    const pair = vars[i].split("=");
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
$("#carSelect").change(function() {
    $("#currentCarId").val($("#carSelect").val());
    umbrellaFunction();
    // getLogs();
    // getCar();
});

// FUNCTIONS //
function getCar(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET"
            ,url: "/api/v1/automobile/car?id="+id
        }).success(function(response) {
            resolve(response[0]);
        }).error(function(jqXHR) { //, textStatus, errorThrown
            if (jqXHR.status === 500) {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
            reject();
        });
    });
}

function getLogs(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET"
            ,url: "/api/v1/automobile/mx_log/"+id
        }).success(function(response) {
            resolve(response);
        }).error(function(/*jqXHR*/) {
            $("#infoModalBody").html("There was a problem.  Please try again.");
            $("#infoModal").modal("show");
            reject();
        });
    });
}

// function htmlDecode(value){
//     return $('<div/>').html(value).text();
// }
//
// function htmlEncode(value){
//     //create a in-memory div, set it's inner text(which jQuery automatically encodes)
//     //then grab the encoded contents back out.  The div never exists on the page.
//     return $('<div/>').text(value).html();
// }

function makeMileageChart(xAxis, data, avg) {
    Highcharts.chart('mileageChart', {
        chart: {
            type: 'spline'
            ,zoomType: "x"
        }
        ,legend: {
            enabled: false
        }
        ,title: {
            text: null
        }
        ,xAxis: {
            categories: xAxis
        }
        ,yAxis: {
            title: {
                text: null
            }
        }
        ,series: [{
            name: "Miles"
            ,data: data
        }
            ,{
                name: "Average"
                ,data: avg
                ,marker: {
                    enabled: false
                }
            }]
    });
}

function makeMxCostChart(xAxis, data, avg) {
    Highcharts.chart('mxCostChart', {
        chart: {
            type: 'spline'
            ,zoomType: "x"
        }
        ,legend: {
            enabled: false
        }
        ,title: {
            text: null
        }
        ,xAxis: {
            categories: xAxis
        }
        ,yAxis: {
            title: {
                text: null
            }
        }
        ,series: [{
            name: "Dollars"
            ,data: data
        }
        ,{
            name: "Average"
            ,data: avg
            ,marker: {
                enabled: false
            }
        }]
    });
}

function populateCars() {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/automobile/car"
    }).success(function(response) {
        if (!QueryString.hasOwnProperty("CarId")) {
            if (response.length > 0) {
                $("#currentCarId").val(response[0].id);
            }
        }
        response.forEach(function(car) {
            const obj = {
                value: car.id
                ,text: car.year + " " + car.make + " " + car.model
            };
            if (car.id === Number($("#currentCarId").val())) {
                obj.selected = true;
            }
            $("#carSelect").append($('<option>', obj));
        });
        umbrellaFunction();
    }).error(function() { //jqXHR, textStatus, errorThrown
        $("#infoModalBody").html("There was a problem.  Please try again.");
        $("#infoModal").modal("show");
    });
}

function umbrellaFunction() {
    const id = $("#currentCarId").val();
    getCar(id).then(function(car) {
        getLogs(id).then(function(logs) {
            // Calculate total and average miles driven
            const totalMiles = car.current_mileage - car.purchase_mileage;
            $("#milesDrive").html(totalMiles);
            const years = moment().diff(moment(car.purchase_date), 'years');
            const avgMiles = (totalMiles/years).toFixed(2);
            $("#milesPerYear").html(avgMiles);

            // Sum total maintenance costs
            let totalCost = 0;
            logs.forEach(function(log) {
                totalCost += log.cost;
            });
            $("#totalMaintenance").html(totalCost);
            $("#maintenancePerYear").html((totalCost/years).toFixed(2));

            // Build array of years spanned
            let yearArr = [];
            const firstYear = Number(moment(car.purchase_date).format("YYYY"));
            const currentYear = Number(moment().format("YYYY"));
            for (let i=firstYear; i<=currentYear; i++) {
                yearArr.push(i);
            }

            // Build arrays of maintenance costs per year and average maintenance cost
            let costArr = [];
            let costAvgArr = [];
            yearArr.forEach(function(targetYear) {
                let yearCost = 0;
                logs.forEach(function(log) {
                    if (Number(moment(log.service_date).format("YYYY")) === targetYear) {
                        yearCost += Number(log.cost);
                    }
                });
                costArr.push(Number(yearCost.toFixed(2)));
                costAvgArr.push(Number((totalCost/years).toFixed(2)));
            });
            makeMxCostChart(yearArr,costArr,costAvgArr);

            // Build arrays of miles driven per year and average miles driven
            let mileArr = [];
            let mileAvgArr = [];
            let lastMileage = Number(car.purchase_mileage);
            let tmpMileage = lastMileage;
            yearArr.forEach(function(targetYear) {
                logs.forEach(function(log) {
                    if (Number(moment(log.service_date).format("YYYY")) === targetYear) {
                        if (log.mileage > tmpMileage) {
                            tmpMileage = log.mileage;
                        }
                    }
                });
                mileArr.push(tmpMileage - lastMileage);
                mileAvgArr.push(Number(avgMiles));
                lastMileage = tmpMileage;
            });
            makeMileageChart(yearArr,mileArr,mileAvgArr);
        });
    }).catch(function() {
        alert("ERROR!");
    });
}