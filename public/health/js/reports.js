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
$("#personSelect").on("change", function() {
    $("#currentPersonId").val($("#personSelect").val());
    umbrellaFunction();
    // getLogs();
    // getCar();
});

// FUNCTIONS //
function getPerson(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET"
            ,url: "/api/v1/health/person?id="+id
        }).success(function(response) {
            resolve(response[0]);
            // var totalMiles = response[0].current_mileage - response[0].purchase_mileage;
            // $("#milesDrive").html(totalMiles);
            // var years = moment().diff(moment(response[0].purchase_date), 'years');
            // $("#milesPerYear").html((totalMiles/years).toFixed(2));
        }).error(function(jqXHR) { //, textStatus, errorThrown
            if (jqXHR.status === 500) {
                $("#infoModalBody").html("There was a problem.  Please try again.");
                $("#infoModal").modal("show");
            }
            reject();
        });
    });
}

function getVisits(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET"
            ,url: "/api/v1/health/visit/"+id
        }).success(function(response) {
            resolve(response);
        }).error(function(/*jqXHR*/) {
            $("#infoModalBody").html("There was a problem.  Please try again.");
            $("#infoModal").modal("show");
            reject();
        });
    });
}

function makeHealthCostChart(xAxis, data, avg) {
    Highcharts.chart('healthCostChart', {
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
        umbrellaFunction();
    }).error(function() { //jqXHR, textStatus, errorThrown
        $("#infoModalBody").html("There was a problem.  Please try again.");
        $("#infoModal").modal("show");
    });
}

function umbrellaFunction() {
    let id = $("#currentPersonId").val();
    getPerson(id).then(function(person) {
        getVisits(id).then(function(visits) {
            // Calculate years
            let years = moment().diff(moment(person.birth_date), 'years');

            // Sum total maintenance costs
            let totalCost = 0;
            visits.forEach(function(visit) {
                totalCost += visit.cost;
            });
            $("#totalCost").html(totalCost);
            $("#costPerYear").html((totalCost/years).toFixed(2));

            // Build array of years spanned
            let yearArr = [];
            let firstYear = Number(moment(person.birth_date).format("YYYY"));
            let currentYear = Number(moment().format("YYYY"));
            for (let i=firstYear; i<=currentYear; i++) {
                yearArr.push(i);
            }

            // Build arrays of costs per year and average cost
            let costArr = [];
            let costAvgArr = [];
            yearArr.forEach(function(targetYear) {
                let yearCost = 0;
                visits.forEach(function(visit) {
                    if (Number(moment(visit.visit_date).format("YYYY")) === targetYear) {
                        yearCost += Number(visit.cost);
                    }
                });
                costArr.push(Number(yearCost.toFixed(2)));
                costAvgArr.push(Number((totalCost/years).toFixed(2)));
            });
            makeHealthCostChart(yearArr,costArr,costAvgArr);
        });
    }).catch(function() {
        alert("ERROR!");
    });
}