$(document).ready(function() {
	$("body").show();
		
	getCars();
	getInactiveCars();
});

// FIELD EVENTS

	$("#addCarButton").click(function() {
		addCar();
	});
	$("#editCarButton").click(function() {
		modifyCar();
	});
	$("#deleteCarButton").click(function() {
		removeCar();
	});
	$("#reactivateCarButton").click(function() {
		undeleteCar();
	});
	
	$("#addCarModal").on("shown.bs.modal", function() {
		$("#newMake").focus();
	}).on("hidden.bs.modal", function() {
        clearAddFields();
    });

	$("#infoModal").on("hidden.bs.modal", function() {
		$("#infoModalBody").empty();
	});

	$("#editCarModal").on("shown.bs.modal", function() {
		$("#editMake").focus();
	}).on("hidden.bs.modal", function() {
        clearEditFields();
    });

	$("#deleteCarModal").on("hidden.bs.modal", function() {
		$("#deleteCarId").val("");
        $("#deleteModalBody").html("");
	});

	$("#reactivateCarModal").on("hidden.bs.modal", function() {
		$("#reactivateCarId").val("");
		$("#reactivateModalBody").html("");
	});

// FUNCTIONS
function getCars() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/automobile/car"
	})
	.success(function(response) {
		$("#carTable").find("tbody").empty();
		response.forEach(function(car) {
			var row = '<tr id="'+car.id+'">' +
				'<td name="make">'+car.make+'</td>' +
				'<td name="model">'+car.model+'</td>'+
				'<td name="year">'+car.year+'</td>' +
				'<td name="vin">'+car.vin+'</td>' +
				'<td name="license_plate">'+car.license_plate+'</td>' +
				'<td name="purchase_date">'+moment.utc(car.purchase_date).format("MMM D, YYYY")+'</td>' +
				'<td name="purchase_mileage">'+car.purchase_mileage+'</td>' +
				'<td name="current_mileage">'+car.current_mileage+'</td>' +
				'<td name="mx_log"><a href="/automobile/mx_log?CarId='+car.id+'">MX&nbsp;Log</a></td>' +
				'<td><button class="btn btn-primary" title="Edit Car" onclick="editCar(\''+car.id+'\');"><i class="glyphicon glyphicon-pencil"></i></button>' +
				'<button class="btn btn-danger" title="Delete Car" onclick="deleteCar(\''+car.id+'\');"><i class="glyphicon glyphicon-trash"></i></button>' +
				'</td>'+
			'</tr>';
			$("#carTable").find("tbody").append(row);
		});
	})
	.error(function(jqXHR) { //, textStatus, errorThrown
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function getInactiveCars() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/automobile/car/inactive"
	})
	.success(function(response) {
		$("#inactiveCarTable").find("tbody").empty();
		response.forEach(function(car) {
            var row = '<tr id="'+car.id+'">' +
                '<td name="make">'+car.make+'</td>' +
                '<td name="model">'+car.model+'</td>'+
                '<td name="year">'+car.year+'</td>' +
                '<td name="vin">'+car.vin+'</td>' +
                '<td name="license_plate">'+car.license_plate+'</td>' +
                '<td name="purchase_date">'+moment.utc(car.purchase_date).format("MMM D, YYYY")+'</td>' +
                '<td name="purchase_mileage">'+car.purchase_mileage+'</td>' +
                '<td name="current_mileage">'+car.current_mileage+'</td>' +
                '<td name="sold_date">'+moment.utc(car.sold_date).format("MMM D, YYYY")+'</td>' +
                '<td name="mx_log"><a href="/automobile/mx_log?CarId='+car.id+'">MX&nbsp;Log</a></td>' +
				'<td></td>' +
				'<td>'+
					'<button class="btn btn-primary" title="Reactivate Car" onclick="reactivateCar(\''+car.id+'\');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
				'</td>'+
			'</tr>';
			$("#inactiveCarTable").find("tbody").append(row);
		});
	})
	.error(function(jqXHR) { //, textStatus, errorThrown
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function clearAddFields() {
	$("#newMake").val("");
	$("#newModel").val("");
	$("#newYear").val("");
	$("#newVin").val("");
	$("#newLicensePlate").val("");
	$("#newPurchaseDate").val("");
	$("#newPurchaseMileage").val("");
	$("#newCurrentMileage").val("");
}

function clearEditFields() {
	$("#editMake").val("");
	$("#editModel").val("");
	$("#editYear").val("");
	$("#editVin").val("");
	$("#editLicensePlate").val("");
	$("#editPurchaseDate").val("");
	$("#editPurchaseMileage").val("");
	$("#editCurrentMileage").val("");
}

function addCar() {
	var errorCount = 0;
	var newMake = $("#newMake");
	if (typeof newMake.val() !== "undefined" && newMake.val().length > 0) {
        newMake.css("background-color", "#fff");
	} else {
		errorCount++;
        newMake.css("background-color", "#f2dede");
	}
    var newModel = $("#newModel");
    if (typeof newModel.val() !== "undefined" && newModel.val().length > 0) {
        newModel.css("background-color", "#fff");
    } else {
        errorCount++;
        newModel.css("background-color", "#f2dede");
    }
    var newYear = $("#newYear");
    if (typeof newYear.val() !== "undefined" && newYear.val().length > 0) {
        newYear.css("background-color", "#fff");
    } else {
        errorCount++;
        newYear.css("background-color", "#f2dede");
    }
    var newVin = $("#newVin");
    var newLicensePlate = $("#newLicensePlate");
    var newPurchaseDate = $("#newPurchaseDate");
    if (typeof newPurchaseDate.val() !== "undefined" && newPurchaseDate.val().length > 0) {
        newPurchaseDate.css("background-color", "#fff");
    } else {
        errorCount++;
        newPurchaseDate.css("background-color", "#f2dede");
    }
    var newPurcahseMileage = $("#newPurchaseMileage");
    if (typeof newPurcahseMileage.val() !== "undefined" && newPurcahseMileage.val().length > 0) {
        newPurcahseMileage.css("background-color", "#fff");
    } else {
        errorCount++;
        newPurcahseMileage.css("background-color", "#f2dede");
    }
    var newCurrentMileage = $("#newCurrentMileage");
    if (typeof newCurrentMileage.val() !== "undefined" && newCurrentMileage.val().length > 0) {
        newCurrentMileage.css("background-color", "#fff");
    } else {
        errorCount++;
        newCurrentMileage.css("background-color", "#f2dede");
    }

	if (errorCount === 0) {
		$("#addCarModal").modal("hide");
		var car = {
			make: newMake.val()
			,model: newModel.val()
			,year: newYear.val()
			,vin: newVin.val().toUpperCase()
			,license_plate: newLicensePlate.val().toUpperCase()
			,purchase_date: newPurchaseDate.val()
			,purchase_mileage: newPurcahseMileage.val()
			,current_mileage: newCurrentMileage.val()
		};
		saveCar(car);
	}
}

function saveCar(car) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/automobile/car"
		,data: car
	})
	.success(function() { //response
		getCars();
		return false;
	})
	.error(function() { //jqXHR, textStatus, errorThrown
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function editCar(id) {
	$("#editCarId").val(id);
	$("#editMake").val($("#"+id+" td[name=make]").html());
	$("#editModel").val($("#"+id+" td[name=model]").html());
	$("#editYear").val($("#"+id+" td[name=year]").html());
	$("#editVin").val($("#"+id+" td[name=vin]").html());
	$("#editLicensePlate").val($("#"+id+" td[name=license_plate]").html());
	$("#editPurchaseDate").val(moment.utc($("#"+id+" td[name=purchase_date]").html()).format("YYYY-MM-DD"));
	$("#editPurchaseMileage").val($("#"+id+" td[name=purchase_mileage]").html());
	$("#editCurrentMileage").val($("#"+id+" td[name=current_mileage]").html());
	$("#editCarModal").modal("show");
}

function modifyCar() {
	var id = $("#editCarId").val();
	if (typeof id !== "undefined" && id.length > 0) {
		var errorCount = 0;
		var editMake = $("#editMake");
        if (typeof editMake.val() !== "undefined" && editMake.val().length > 0) {
            editMake.css("background-color", "#fff");
        } else {
            errorCount++;
            editMake.css("background-color", "#f2dede");
        }
        var editModel = $("#editModel");
        if (typeof editModel.val() !== "undefined" && editModel.val().length > 0) {
            editModel.css("background-color", "#fff");
        } else {
            errorCount++;
            editModel.css("background-color", "#f2dede");
        }
        var editYear = $("#editYear");
        if (typeof editYear.val() !== "undefined" && editYear.val().length > 0) {
            editYear.css("background-color", "#fff");
        } else {
            errorCount++;
            editYear.css("background-color", "#f2dede");
        }
        var editVin = $("#editVin");
        var editLicensePlate = $("#editLicensePlate");
        var editPurchaseDate = $("#editPurchaseDate");
        if (typeof editPurchaseDate.val() !== "undefined" && editPurchaseDate.val().length > 0) {
            editPurchaseDate.css("background-color", "#fff");
        } else {
            errorCount++;
            editPurchaseDate.css("background-color", "#f2dede");
        }
        var editPurcahseMileage = $("#editPurchaseMileage");
        if (typeof editPurcahseMileage.val() !== "undefined" && editPurcahseMileage.val().length > 0) {
            editPurcahseMileage.css("background-color", "#fff");
        } else {
            errorCount++;
            editPurcahseMileage.css("background-color", "#f2dede");
        }
        var editCurrentMileage = $("#editCurrentMileage");
        if (typeof editCurrentMileage.val() !== "undefined" && editCurrentMileage.val().length > 0) {
            editCurrentMileage.css("background-color", "#fff");
        } else {
            errorCount++;
            editCurrentMileage.css("background-color", "#f2dede");
        }

        if (errorCount === 0) {
			$("#editCarModal").modal("hide");
			var car = {
				id: id
				,make: editMake.val()
				,model: editModel.val()
				,year: editYear.val()
				,vin: editVin.val().toUpperCase()
				,license_plate: editLicensePlate.val().toUpperCase()
				,purchase_date: editPurchaseDate.val()
				,purchase_mileage: editPurcahseMileage.val()
				,current_mileage: editCurrentMileage.val()
			};
			$.ajax({
				type: "PUT"
				,url: "/api/v1/automobile/car/"+id
				,data: car
			})
			.success(function() {
				getCars();
				return false;
			})
			.error(function() { //jqXHR, textStatus, errorThrown
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
	}
}

function deleteCar(id) {
	var make = $("#"+id+" td[name=make]").html();
    var model = $("#"+id+" td[name=model]").html();
    var year = $("#"+id+" td[name=year]").html();
	$("#deleteCarId").val(id);
	$("#deleteModalBody").html("<strong>Are you sure you want to delete "+year+"&nbsp;"+make+"&nbsp;"+model+"?</strong>");
	$("#deleteCarModal").modal("show");
}

function removeCar() {
	var id = $("#deleteCarId").val();
	$("#deleteCarModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/automobile/car/"+id
		})
		.success(function() {
			getCars();
			getInactiveCars();
			return false;
		})
		.error(function() { //jqXHR, textStatus, errorThrown
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

function reactivateCar(id) {
    var make = $("#"+id+" td[name=make]").html();
    var model = $("#"+id+" td[name=model]").html();
    var year = $("#"+id+" td[name=year]").html();
	$("#reactivateCarId").val(id);
	$("#reactivateModalBody").html("Would you like to reactivate the "+year+"&nbsp;"+make+"&nbsp;"+model+"?");
	$("#reactivateCarModal").modal("show");
}

function undeleteCar() {
	var id = $("#reactivateCarId").val();
	$("#reactivateCarModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "PUT"
			,url: "/api/v1/automobile/car/reactivate"
			,data: {
				id: id
			}
		})
		.success(function() {
			getCars();
			getInactiveCars();
			return false;
		})
		.error(function() { //jqXHR, textStatus, errorThrown
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}