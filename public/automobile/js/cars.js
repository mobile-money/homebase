$(document).ready(function() {
	$("body").show();

	getGroups();
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
	$("#dltCarButton").click(function() {
		deleteCar();
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
function addCar() {
	let errorCount = 0;
	const newMake = $("#newMake");
	if (typeof newMake.val() !== "undefined" && newMake.val().length > 0) {
		newMake.css("background-color", "#fff");
	} else {
		errorCount++;
		newMake.css("background-color", "#f2dede");
	}
	const newModel = $("#newModel");
	if (typeof newModel.val() !== "undefined" && newModel.val().length > 0) {
		newModel.css("background-color", "#fff");
	} else {
		errorCount++;
		newModel.css("background-color", "#f2dede");
	}
	const newYear = $("#newYear");
	if (typeof newYear.val() !== "undefined" && newYear.val().length > 0) {
		newYear.css("background-color", "#fff");
	} else {
		errorCount++;
		newYear.css("background-color", "#f2dede");
	}
	const newVin = $("#newVin");
	const newLicensePlate = $("#newLicensePlate");
	const newPurchaseDate = $("#newPurchaseDate");
	if (typeof newPurchaseDate.val() !== "undefined" && newPurchaseDate.val().length > 0) {
		newPurchaseDate.css("background-color", "#fff");
	} else {
		errorCount++;
		newPurchaseDate.css("background-color", "#f2dede");
	}
	const newPurcahseMileage = $("#newPurchaseMileage");
	if (typeof newPurcahseMileage.val() !== "undefined" && newPurcahseMileage.val().length > 0) {
		newPurcahseMileage.css("background-color", "#fff");
	} else {
		errorCount++;
		newPurcahseMileage.css("background-color", "#f2dede");
	}
	const newCurrentMileage = $("#newCurrentMileage");
	if (typeof newCurrentMileage.val() !== "undefined" && newCurrentMileage.val().length > 0) {
		newCurrentMileage.css("background-color", "#fff");
	} else {
		errorCount++;
		newCurrentMileage.css("background-color", "#f2dede");
	}

	if (errorCount === 0) {
		$("#addCarModal").modal("hide");
		const car = {
			make: newMake.val()
			,model: newModel.val()
			,year: newYear.val()
			,vin: newVin.val().toUpperCase()
			,license_plate: newLicensePlate.val().toUpperCase()
			,purchase_date: newPurchaseDate.val()
			,purchase_mileage: newPurcahseMileage.val()
			,current_mileage: newCurrentMileage.val()
			,groups: JSON.stringify($("#newGroup").val())
		};
		saveCar(car);
	}
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
	$("#newGroup option:selected").prop("selected", false);
}

function clearEditFields() {
	$("#editCarId").val("");
	$("#editMake").val("");
	$("#editModel").val("");
	$("#editYear").val("");
	$("#editVin").val("");
	$("#editLicensePlate").val("");
	$("#editPurchaseDate").val("");
	$("#editPurchaseMileage").val("");
	$("#editCurrentMileage").val("");
	$("#editGroup option:selected").prop("selected", false);
}

function deleteCar() {
	$("#editCarModal").modal("hide");
	const id = 	$("#editCarId").val();
	const make = $("#"+id+" td[name=make]").html();
	const model = $("#"+id+" td[name=model]").html();
	const year = $("#"+id+" td[name=year]").html();
	$("#deleteCarId").val(id);
	$("#deleteModalBody").html("<strong>Are you sure you want to delete "+year+"&nbsp;"+make+"&nbsp;"+model+"?</strong>");
	$("#deleteCarModal").modal("show");
}

function editCar(id) {
	$("#editCarId").val(id);
	$("#editMake").val($("#"+id+" td[name=make]").html());
	$("#editModel").val($("#"+id+" td[name=model]").html());
	$("#editYear").val($("#"+id+" td[name=year]").html());
	$("#editVin").val($("#"+id+" td[name=vin]").html());
	$("#editLicensePlate").val($("#"+id+" td[name=license_plate]").html());
	$("#editPurchaseDate").val(moment.utc($("#"+id+" td[name=purchase_date]").html(),'MMM D, YYYY').format("YYYY-MM-DD"));
	$("#editPurchaseMileage").val($("#"+id+" td[name=purchase_mileage]").html());
	$("#editCurrentMileage").val($("#"+id+" td[name=current_mileage]").html());
	const aua = $("#"+id+" td[name=groups] input[name=group_ids]").val();
	if (typeof(aua) !== "undefined") {
		$("#editGroup").val(aua.split(","));
	}
	$("#editCarModal").modal("show");
}

function getCars() {
	$.ajax({
		type: "GET"
		,url: "/api/v1/automobile/car"
	}).success(function(response) {
		console.log(response);
		$("#carTable").find("tbody").empty();
		response.forEach(function(car) {
			let row = '<tr id="'+car.id+'">' +
				'<td name="make">'+car.make+'</td>' +
				'<td name="model">'+car.model+'</td>'+
				'<td name="year">'+car.year+'</td>' +
				'<td name="vin">'+car.vin+'</td>' +
				'<td name="license_plate">'+car.license_plate+'</td>' +
				'<td name="purchase_date">'+moment.utc(car.purchase_date).format("MMM D, YYYY")+'</td>' +
				'<td name="purchase_mileage">'+car.purchase_mileage+'</td>' +
				'<td name="current_mileage">'+car.current_mileage+'</td>';
			if (car.groups.length > 0) {
				row += '<td name="groups"><i class="fa fa-users"></i>' +
					'<input name="group_ids" type="hidden" value="'+car.groups.join(",")+'" /></td>';
			} else {
				row += '<td></td>';
			}
			row += '<td name="mx_log"><a href="/automobile/mx_log?CarId='+car.id+'">MX&nbsp;Log</a></td>';
			if (car.owner) {
				row += '<td><button class="btn btn-sm btn-primary" title="Edit Car" onclick="editCar(\''+car.id+'\');"><i class="fa fa-pencil"></i></button>' +
					// '<button class="btn btn-sm btn-danger" title="Delete Car" onclick="deleteCar(\''+car.id+'\');"><i class="fa fa-trash"></i></button>' +
					'</td>';
			} else {
				row += '<td></td>';
			}
			row += '</tr>';
			$("#carTable").find("tbody").append(row);
		});
		$('[data-toggle="tooltip"]').tooltip();
	}).error(function(jqXHR) { //, textStatus, errorThrown
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
	}).success(function(response) {
		// console.log(response);
		$("#inactiveCarTable").find("tbody").empty();
		response.forEach(function(car) {
            let row = '<tr id="'+car.id+'">' +
                '<td name="make">'+car.make+'</td>' +
                '<td name="model">'+car.model+'</td>'+
                '<td name="year">'+car.year+'</td>' +
                '<td name="vin">'+car.vin+'</td>' +
                '<td name="license_plate">'+car.license_plate+'</td>' +
                '<td name="purchase_date">'+moment.utc(car.purchase_date).format("MMM D, YYYY")+'</td>' +
                '<td name="purchase_mileage">'+car.purchase_mileage+'</td>' +
                '<td name="current_mileage">'+car.current_mileage+'</td>' +
                '<td name="sold_date">'+moment.utc(car.sold_date).format("MMM D, YYYY")+'</td>';
			if (car.groups.length > 0) {
				row += '<td name="groups"><i class="fa fa-users"></i>' +
					'<input name="group_ids" type="hidden" value="'+car.groups.join(",")+'" /></td>';
			} else {
				row += '<td></td>';
			}
			row += '<td name="mx_log"><a href="/automobile/mx_log?CarId='+car.id+'">MX&nbsp;Log</a></td>';
			if (car.owner) {
				row += '<td>'+
					'<button class="btn btn-sm btn-primary" title="Reactivate Car" onclick="reactivateCar(\''+car.id+'\');">'+
					'<i class="fa fa-pencil"></i>'+
					'</button>'+
					'</td>';
			} else {
				row += '<td></td>';
			}
			row += '</tr>';
			$("#inactiveCarTable").find("tbody").append(row);
		});
		$('[data-toggle="tooltip"]').tooltip();
	}).error(function(jqXHR) { //, textStatus, errorThrown
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function getGroups() {
	$.ajax({
		type: "GET"
		,url: '/api/v1/group'
	}).success(function(response) {
		console.log(response);
		response.forEach(function(group){
			$("#newGroup").append($('<option>',{value: group.id, text: group.name}));
			$("#editGroup").append($('<option>',{value: group.id, text: group.name}));
		});
	}).error(function(jqXHR) {
		// console.log(jqXHR);
	});
}

function modifyCar() {
	const id = $("#editCarId").val();
	if (typeof id !== "undefined" && id.length > 0) {
		let errorCount = 0;
		const editMake = $("#editMake");
		if (typeof editMake.val() !== "undefined" && editMake.val().length > 0) {
			editMake.css("background-color", "#fff");
		} else {
			errorCount++;
			editMake.css("background-color", "#f2dede");
		}
		const editModel = $("#editModel");
		if (typeof editModel.val() !== "undefined" && editModel.val().length > 0) {
			editModel.css("background-color", "#fff");
		} else {
			errorCount++;
			editModel.css("background-color", "#f2dede");
		}
		const editYear = $("#editYear");
		if (typeof editYear.val() !== "undefined" && editYear.val().length > 0) {
			editYear.css("background-color", "#fff");
		} else {
			errorCount++;
			editYear.css("background-color", "#f2dede");
		}
		const editVin = $("#editVin");
		const editLicensePlate = $("#editLicensePlate");
		const editPurchaseDate = $("#editPurchaseDate");
		if (typeof editPurchaseDate.val() !== "undefined" && editPurchaseDate.val().length > 0) {
			editPurchaseDate.css("background-color", "#fff");
		} else {
			errorCount++;
			editPurchaseDate.css("background-color", "#f2dede");
		}
		const editPurcahseMileage = $("#editPurchaseMileage");
		if (typeof editPurcahseMileage.val() !== "undefined" && editPurcahseMileage.val().length > 0) {
			editPurcahseMileage.css("background-color", "#fff");
		} else {
			errorCount++;
			editPurcahseMileage.css("background-color", "#f2dede");
		}
		const editCurrentMileage = $("#editCurrentMileage");
		if (typeof editCurrentMileage.val() !== "undefined" && editCurrentMileage.val().length > 0) {
			editCurrentMileage.css("background-color", "#fff");
		} else {
			errorCount++;
			editCurrentMileage.css("background-color", "#f2dede");
		}

		if (errorCount === 0) {
			$("#editCarModal").modal("hide");
			const car = {
				id: id
				,make: editMake.val()
				,model: editModel.val()
				,year: editYear.val()
				,vin: editVin.val().toUpperCase()
				,license_plate: editLicensePlate.val().toUpperCase()
				,purchase_date: editPurchaseDate.val()
				,purchase_mileage: editPurcahseMileage.val()
				,current_mileage: editCurrentMileage.val()
				,groups: JSON.stringify($("#editGroup").val())
			};
			$.ajax({
				type: "PUT"
				,url: "/api/v1/automobile/car/"+id
				,data: car
			}).success(function() {
				getCars();
				return false;
			}).error(function() { //jqXHR, textStatus, errorThrown
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
	}
}

function reactivateCar(id) {
	const make = $("#"+id+" td[name=make]").html();
	const model = $("#"+id+" td[name=model]").html();
	const year = $("#"+id+" td[name=year]").html();
	$("#reactivateCarId").val(id);
	$("#reactivateModalBody").html("Would you like to reactivate the "+year+"&nbsp;"+make+"&nbsp;"+model+"?");
	$("#reactivateCarModal").modal("show");
}

function removeCar() {
	const id = $("#deleteCarId").val();
	$("#deleteCarModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/automobile/car/"+id
		}).success(function() {
			getCars();
			getInactiveCars();
			return false;
		}).error(function() { //jqXHR, textStatus, errorThrown
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

function saveCar(car) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/automobile/car"
		,data: car
	}).success(function() { //response
		getCars();
		return false;
	}).error(function() { //jqXHR, textStatus, errorThrown
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function undeleteCar() {
	const id = $("#reactivateCarId").val();
	$("#reactivateCarModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "PUT"
			,url: "/api/v1/automobile/car/reactivate"
			,data: {
				id: id
			}
		}).success(function() {
			getCars();
			getInactiveCars();
			return false;
		}).error(function() { //jqXHR, textStatus, errorThrown
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}