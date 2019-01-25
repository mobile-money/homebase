
let accountArray = [];
let accountNames = {};
// var socket = io();

$(document).ready(function() {	
	$("body").show();
	$("#startDate").html(moment().subtract(1, 'years').format("MMM YYYY"))
		.attr("data-date",moment().subtract(1, 'years').format("YYYY-MM"))
		.on("change", function() {
			getTable();
		});
	// const $startDate = $("#startDate");
	// const $endDate = $("#endDate");
	$("#endDate").html(moment().format("MMM YYYY"))
		.attr("data-date",moment().format("YYYY-MM"))
		.on("change", function() {
			getTable();
		});
	// $startDate.html(moment().subtract(1, 'years').format("MMM YYYY"));
	// $startDate.attr("data-date",moment().subtract(1, 'years').format("YYYY-MM"));
	// $endDate.html(moment().format("MMM YYYY"));
	// $endDate.attr("data-date",moment().format("YYYY-MM"));
	$(".datepicker").datepicker({
		// format: 'M yyyy'
		autoclose: true
		,startView: 1
		,minViewMode: 1
		,endDate: new Date()
	}).on("changeDate", function(e) {
		// console.log(e.date.valueOf());
		// console.log(e);
		$("#"+e.currentTarget.id).html(moment(e.date.valueOf(), "x").format("MMM YYYY"))
			.attr("data-date",moment(e.date.valueOf(), "x").format("YYYY-MM"));
		// $("#"+e.currentTarget.id).html(moment(e.date.valueOf(), "x").format("MMM YYYY"));
		// $("#"+e.currentTarget.id).attr("data-date",moment(e.date.valueOf(), "x").format("YYYY-MM"));
		getTable();
	});

	$("#accountSelect").change(function() {
		getTable();
	});

	// $startDate.on("change", function() {
	// 	getTable();
	// });

	// $endDate.on("change", function() {
	// 	getTable();
	// });

	$(".perDay").hide();
	// $("#testButton").datepicker();
	
	getAccounts();
});

// FIELD EVENTS
	$("#showTotal").on("click", function() {
		$(".total").show();
		$(".perDay").hide();
		$("#showTotal").addClass("btn-primary").removeClass("btn-default");
		$("#showPerDay").addClass("btn-default").removeClass("btn-primary");
	});

	$("#showPerDay").on("click", function() {
		$(".total").hide();
		$(".perDay").show();
		$("#showPerDay").addClass("btn-primary").removeClass("btn-default");
		$("#showTotal").addClass("btn-default").removeClass("btn-primary");
	});
	// $("#accountSelect").change(function() {
	// 	getTable();
	// });

	// $("#startDate").change(function() {
	// 	getTable();
	// });

	// $("#endDate").change(function() {
	// 	getTable();
	// });

// SOCKET IO
// 	socket.on("connect", function() {
// 	});

// FUNCTIONS
function buildTable() {
	const $contentTable = $("#contentTable");
	const $startDate = $("#startDate");
	$contentTable.find("tbody").empty();
	// const start = moment($startDate.attr("data-date"), "YYYY-MM").startOf("month");
	// console.log("S: "+start.format("MMM DD YYYY"));
	const current = moment($startDate.attr("data-date"), "YYYY-MM").endOf("month");
	const end = moment($("#endDate").attr("data-date"), "YYYY-MM").endOf("month");
	// console.log("E: "+end.format("MMM DD YYYY HH:mm:ss ZZ"));
	let id = 0;
	while (current.isSameOrBefore(end)) {
		const days = current.daysInMonth();
		const newRow = '<tr id="row_'+id+'">'+
			'<td name="month">'+current.format("MMM YYYY")+'</td>'+
			'<td name="days">'+days+'</td>'+
			'<td name="totalExpenses" class="total"></td>'+
			'<td name="totalMortgage" class="total"></td>'+
			'<td name="totalOuts" class="total"></td>'+
			'<td name="totalIns" class="total"></td>'+
			'<td name="totalDiff" class="total"></td>'+
			'<td name="dailyExpenses" class="perDay"></td>'+
			'<td name="dailyMortgage" class="perDay"></td>'+
			'<td name="dailyOuts" class="perDay"></td>'+
			'<td name="dailyIns" class="perDay"></td>'+
			'<td name="dailyDiff" class="perDay"></td>'+
			"</tr>";
		$contentTable.find("tbody").append(newRow);

		$.ajax({
			type: "GET"
			,url: "/api/v1/money/flows/"+$("#accountSelect").val()+"/"+current.startOf("month").format("X")+"/"+current.endOf("month").format("X")+"/"+id
		}).success(function(response) {
			const days = Number($("#row_"+response.id+" > td[name=days").html());
			const totalOuts = (response.expenses + response.mortgage);
			const totalDiff = (response.ins - (response.expenses + response.mortgage));
			$("#row_"+response.id+" > td[name=totalExpenses").html(response.expenses.toFixed(2));
			$("#row_"+response.id+" > td[name=totalMortgage").html(response.mortgage.toFixed(2));
			$("#row_"+response.id+" > td[name=totalOuts").html(totalOuts.toFixed(2));
			$("#row_"+response.id+" > td[name=totalIns").html(response.ins.toFixed(2));
			if (totalDiff === 0) {
				$("#row_"+response.id+" > td[name=totalDiff").html(totalDiff.toFixed(2));
			} else if (totalDiff < 0) {
				$("#row_"+response.id+" > td[name=totalDiff").html('<span style="color:red;">'+totalDiff.toFixed(2)+'</span>');
			} else {
				$("#row_"+response.id+" > td[name=totalDiff").html('<span style="color:green;">'+totalDiff.toFixed(2)+'</span>');
			}
			$("#row_"+response.id+" > td[name=dailyExpenses").html((response.expenses / days).toFixed(2));
			$("#row_"+response.id+" > td[name=dailyMortgage").html((response.mortgage / days).toFixed(2));
			$("#row_"+response.id+" > td[name=dailyOuts").html((totalOuts / days).toFixed(2));
			$("#row_"+response.id+" > td[name=dailyIns").html((response.ins / days).toFixed(2));
			if (totalDiff === 0) {
				$("#row_"+response.id+" > td[name=dailyDiff").html((totalDiff / days).toFixed(2));
			} else if (totalDiff < 0) {
				$("#row_"+response.id+" > td[name=dailyDiff").html('<span style="color:red;">'+(totalDiff / days).toFixed(2)+'</span>');
			} else {
				$("#row_"+response.id+" > td[name=dailyDiff").html('<span style="color:green;">'+(totalDiff / days).toFixed(2)+'</span>');
			}
		}).error(function(jqXHR, textStatus, errorThrown) {
			console.log(errorThrown);
		});

		id++;
		current.add(1, "months");
		// console.log(current.format("MMM DD YYYY HH:mm:ss ZZ"));
	}
	$(".perDay").hide();
}

function getAccounts() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/money/accounts"
	}).success(function(response) {
		accountArray = response;
		$("#accountSelect").empty();
		response.forEach(function(account) {
			accountNames[account.id] = {name: account.name, type: account.type};
			if ((account.type === "Credit Card") || (account.type === "Checking") || (account.type === "Savings")) {
				if (account.default === true) {
					$("#accountSelect").append('<option value="'+account.id+'" selected>'+account.name+'</option>');
				} else {
					$("#accountSelect").append('<option value="'+account.id+'">'+account.name+'</option>');
				}
			}
		});

		getTable();
	}).error(function(jqXHR/*, textStatus, errorThrown*/) {
		if (jqXHR.status === 404) {
			return false;
		} else {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function getTable() {
	const $startDate = $("#startDate");
	const $endDate = $("#endDate");
	$startDate.addClass("btn-primary").removeClass("btn-danger");
	$endDate.addClass("btn-primary").removeClass("btn-danger");
	const start = moment($startDate.attr("data-date"), "YYYY-MM").startOf("month");
	const end = moment($endDate.attr("data-date"), "YYYY-MM").endOf("month");
	// console.log(start);
	// console.log(end);
	if (end < start) {
		$startDate.addClass("btn-danger").removeClass("btn-primary");
		$endDate.addClass("btn-danger").removeClass("btn-primary");
		return false;
	}
	// var stuff = {
	// 	account: $("#accountSelect").val()
	// 	,start: start.format("X")
	// 	,end: end.format("X")
	// };
	buildTable();
}