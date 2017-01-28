'use strict';

var socket = io();

$(document).ready(function() {
	$("body").show();

	$(".datepicker").datepicker({
		format: 'mm/dd/yyyy'
		,autoclose: true
	});
	$("#newAuto").bootstrapToggle();
	$("#editAuto").bootstrapToggle();

	getBills();

});

// FIELD EVENTS
	$("#startAddBill").click(function(e) {
		addBill();
	});

	$("#addBillModal").on("shown.bs.modal", function() {
		$("#newPayee").focus();
	});

	$("#addBillModal").on("hidden.bs.modal", function() {
		resetAddBill();
	});

	$("#editBillModal").on("shown.bs.modal", function() {
		$("#editPayee").focus();
	});

	$("#editBillModal").on("hidden.bs.modal", function() {
		resetEditBill();
	});

// SOCKET IO
	socket.on("connect", function() {
		// console.log("connected to server");
	});

	socket.on("billAdded", function(id) {
		// console.log("io: "+id)
		getBills();
	});

	socket.on("billModified", function(id) {
		// console.log("io: "+id)
		getBills();
	});

	socket.on("billDeleted", function(id) {
		getBills();
	})

// FUNCTIONS
	function getBills() {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/bills"
		}).success(function(response, textStatus, jqXHR) {
			$("#billTable").find("tbody").empty();
			if (jqXHR.status === 204) {

			} else {
				response.forEach(function(bill) {
					// console.log(bill);
					var row = '<tr id="'+bill.id+'">'+
						'<td name="payee">'+bill.payee+'</td>';
						if (bill.description !== null) {
							row += '<td name="description">'+bill.description+'</td>';
						} else {
							row += '<td name="description"></td>';
						}
						if (bill.Category !== null) {
							row += '<td name="category">'+bill.Category.name+'</td>';						
						} else {
							row += '<td name="category"></td>';
						}
						row += '<td name="account">'+bill.Account.name+'</td>';
						if (bill.frequency === "d") {
							if (bill.every === 1) {
								row += '<td name="frequency" data-freq="d" data-every="1">Every day</td>';
							} else {
								row += '<td name="frequency" data-freq="d" data-every="'+bill.every+'">Every '+bill.every+' days</td>';
							}
							// row += '<td name="frequency">Daily; every '+bill.every+' days</td>';
						} else if (bill.frequency === "w") {
							if (bill.every === 1) {
								row += '<td name="frequency" data-freq="w" data-every="1">Every week</td>';
							} else {
								row += '<td name="frequency" data-freq="w" data-every="'+bill.every+'">Every '+bill.every+' weeks</td>';
							}
							// row += '<td name="frequency">Weekly; every '+bill.every+' weeks</td>';
						} else if (bill.frequency === "M") {
							var partOne = '<td name="frequency" data-freq="M" data-every="'+bill.every+'" data-onThe="'+bill.onThe+'">Every '
							if (bill.every === 1) {
								partOne += 'month';
							} else {
								partOne += bill.every+' months';
							}
							var partTwo = " on the ";
							if (bill.onThe === -1) {
								partTwo += 'last day';						
							} else {
								var temp = moment().set({'month': 1, 'year': 2016, 'date': bill.onThe}).format("Do");
								partTwo += temp;						
							}
							partTwo += '</td>';
							row += partOne + partTwo;
						}
						row += '<td name="auto">';
						if (bill.automatic) {
							row += "Yes";
						} else {
							row += "No";
						}
						row += '</td>';
						row += '<td name="amount">'+bill.amount.toFixed(2)+'</td>';
						if (bill.lastAdded !== null) {
							row += '<td name="lastAdded">'+moment.utc(bill.lastAdded).format("MM/DD/YYYY")+'</td>';
						} else {
							row += '<td name="lastAdded"></td>';
						}
						row += '<td name="startDate">'+moment.utc(bill.startDate).format("MM/DD/YYYY")+'</td>'+
						'<td>'+
							'<button class="btn btn-primary btn-xs" title="Edit Bill" onclick="editBill(\''+bill.id+'\');">'+
								'<i class="glyphicon glyphicon-pencil"></i>'+
							'</button>'+
							'<button class="btn btn-danger btn-xs" title="Delete Bill" onclick="deleteBill(\''+bill.id+'\',\''+bill.payee+'\');">'+
								'<i class="glyphicon glyphicon-remove"></i>'+
							'</button>'+
						'</td>'+
					'</tr>';
					$("#billTable").find("tbody").append(row);
				});
			}
			// console.log(response);
		}).error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}

	function addBill() {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/accounts"
		})
		.success(function(response) {
			$("#addBillButton").click(function(e) {
				insertBill();
			});
			$("#newAccount").empty().append('<option value="none" />');
			response.forEach(function(account) {
				$("#newAccount").append('<option value="'+account.id+'">'+account.name+'</option>');
			});
			$("#addBillModal").modal("show");
		}).error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");			
		});

		$.ajax({
			type: "GET"
			,url: "/api/v1/money/categories"
		}).success(function(response) {
			$("#newCategory").empty().append('<option value="none" />');
			response.forEach(function(category) {
				$("#newCategory").append('<option value="'+category.id+'">'+category.name+'</option>');
			});

		});
	}

	function resetAddBill() {
		// $("#addBillModal").modal("hide");
		$("#newPayee").val("");
		$("#newDescription").val("");
		$("#newCategory").val("none");
		$("#newAccount").val("none");
		$("#newStartDate").val("");
		$("#newFrequency").val("none");
		$("#subFreq").empty();
		// $("#newAuto").prop("checked",false);
		$("#newAuto").bootstrapToggle('off');
		$("#typeWLabel").addClass("active");
		$("#typeDLabel").removeClass("active");
		$("#newAmount").val("");
	}

	function resetEditBill() {
		$("#editPayee").val("");
		$("#editDescription").val("");
		$("#editCategory").val("none");
		$("#editAccount").val("none");
		$("#editStartDate").val("");
		$("#editFrequency").val("none");
		$("#editSubFreq").empty();
		// $("#editAuto").prop("checked",false);
		$("#editAuto").bootstrapToggle('off');
		$("#editTypeWLabel").addClass("active");
		$("#editTypeDLabel").removeClass("active");
		$("#editAmount").val("");
	}

	function setFreq() {
		var freq = $("#newFrequency").val();
		if (freq === "none") {
			$("#subFreq").empty();
		} else {
			var html = "";
			if (freq === "d") {
				html = 'Every&nbsp;<input id="subFreqEvery" class="newBill" type="number" />&nbsp;days';
			} else if (freq === "w") {
				html = 'Every&nbsp;<input id="subFreqEvery" class="newBill" type="number" />&nbsp;weeks';
			} else if (freq === "M") {
				html = 'Every&nbsp;<input id="subFreqEvery" class="newBill" type="number" />&nbsp;months,'+
				'&nbsp;on&nbsp;the&nbsp;<input id="subFreqOn" class="newBill" type="number" max="31" />'+
				'&nbsp;<input type="checkbox" id="subFreqLast" />&nbsp;Last Day';
			}
			$("#subFreq").html(html);
			$("#subFreqEvery").blur(function(e) {
				if (e.target.value !== "") {
					$("#subFreqEvery").val(Math.round(e.target.value));
				}
			});
			$("#subFreqOn").blur(function(e) {
				if (e.target.value !== "") {
					$("#subFreqOn").val(Math.round(e.target.value));
				}
			});
		}
	}

	function setEditFreq() {
		var freq = $("#editFrequency").val();
		if (freq === "none") {
			$("#editSubFreq").empty();
		} else {
			var html = "";
			if (freq === "d") {
				html = 'Every&nbsp;<input id="editSubFreqEvery" class="newBill" type="number" />&nbsp;days';
			} else if (freq === "w") {
				html = 'Every&nbsp;<input id="editSubFreqEvery" class="newBill" type="number" />&nbsp;weeks';
			} else if (freq === "M") {
				html = 'Every&nbsp;<input id="editSubFreqEvery" class="newBill" type="number" />&nbsp;months,'+
				'&nbsp;on&nbsp;the&nbsp;<input id="editSubFreqOn" class="newBill" type="number" max="31" />'+
				'&nbsp;<input type="checkbox" id="editSubFreqLast" />&nbsp;Last Day';
			}
			$("#editSubFreq").html(html);
			$("#editSubFreqEvery").blur(function(e) {
				if (e.target.value !== "") {
					$("#editSubFreqEvery").val(Math.round(e.target.value));
				}
			});
			$("#editSubFreqOn").blur(function(e) {
				if (e.target.value !== "") {
					$("#editSubFreqOn").val(Math.round(e.target.value));
				}
			});
		}
	}

	function insertBill() {
		$("#addBillButton").off("click");
		//Get values
		var newBill = {
			payee: $("#newPayee").val()
			,account: Number($("#newAccount").val())
			,startDate: $("#newStartDate").val()
			,frequency: $("#newFrequency").val()
			,every: Number($("#subFreqEvery").val())
			,amount: Number($("#newAmount").val())
			,automatic: $("#newAuto").prop("checked")
		}
		if ($("#newDescription").val() !== "") {
			newBill.description = $("#newDescription").val();
		}
		if ($("#newCategory").val() !== "none") {
			newBill.category = Number($("#newCategory").val());
		}
		if (newBill.frequency === "M") {
			if ($("#subFreqLast").is(":checked")) {
				newBill.onThe = -1;
			} else {
				newBill.onThe = Number($("#subFreqOn").val());
			}
		}
		if ($("#typeWLabel").hasClass("active")) {
			newBill.amount = newBill.amount * -1;
		}
		// console.log(newBill);

		// Validation
		var errors = 0;
		$(".newBill").removeClass("error");
		if (newBill.payee === "") {
			$("#newPayee").addClass("error");
			errors++;
		}
		if (isNaN(newBill.account)) {
			$("#newAccount").addClass("error");
			errors++;
		}
		if (newBill.startDate === "") {
			$("#newStartDate").addClass("error");
			errors++;
		} else {
			if (!newBill.startDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
				$("#newStartDate").addClass("error");
				errors++;
			}
		}
		if (newBill.frequency === "none") {
			$("#newFrequency").addClass("error");
			errors++;
		}
		if (!newBill.hasOwnProperty("every")) {
			$("#subFreqEvery").addClass("error");
			errors++;
		} else {
			if (isNaN(newBill.every) || newBill.every === 0) {
				$("#subFreqEvery").addClass("error");
			}		
		}
		if (newBill.frequency === "monthly") {
			if (!newBill.hasOwnProperty("onThe")) {
				$("#subFreqOn").addClass("error");
				errors++;
			} else {
				if (isNaN(newBill.onThe) || newBill.onThe === 0) {
					$("#subFreqOn").addClass("error");
					errors++;
				}
			}
		}
		if (newBill.amount === "" || newBill.amount === null) {
			$("#newAmount").addClass("error");
			errors++;
		}

		// Send request if no errors
		if (errors === 0) {
			$("#addBillModal").modal("hide");
			// newBill.subFrequency = JSON.stringify(newBill.subFrequency);
			// console.log(newBill);
			$.ajax({
				type: "POST"
				,url: "/api/v1/money/bills"
				,data: newBill
			}).success(function(response) {
				// resetAddBill();
			}).error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem adding the bill.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
	}

	function editBill(id) {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/accounts"
		})
		.success(function(response) {
			$.ajax({
				type: "GET"
				,url: "/api/v1/money/categories"
			}).success(function(cats) {
				// Bind button click
				$("#editBillButton").click(function(e) {
					modifyBill();
				});
				// Set bill ID
				$("#editBillId").val(id);
				// Set Payee
				$("#editPayee").val($("#"+id+" td[name=payee]").text());
				// Set Description
				$("#editDescription").val($("#"+id+" td[name=description]").text());
				// Build and set Category
				var setCategory = $("#"+id+" td[name=category]").text();
				$("#editCategory").empty().append('<option value="none" />');
				cats.forEach(function(cat) {
					var option = '<option value="'+cat.id+'"';
					if (cat.name === setCategory) {
						option += ' selected';
					}
					option += '>'+cat.name+'</option>';
					$("#editCategory").append(option);
				});
				// Build and set Account
				var setAccount = $("#"+id+" td[name=account]").text();
				$("#editAccount").empty().append('<option value="none" />');
				response.forEach(function(account) {
					var option = '<option value="'+account.id+'"';
					if (account.name === setAccount) {
						option += ' selected';
					}
					option += '>'+account.name+'</option>';
					$("#editAccount").append(option);
				});
				// Set Start Date
				$("#editStartDate").datepicker("setDate", $("#"+id+" td[name=startDate]").text());
				// Build and set Frequency and Sub Frequency
				// var freq = $("#"+id+" td[name=frequency]").text();
				// var freqArr = freq.split(";");
				var subFreq = "";
				if ($("#"+id+" td[name=frequency]").data("freq") === "d") {
					$("#editFrequency").val("d");
					// var subFreqArr = freqArr[1].split(" ");
					subFreq = 'Every&nbsp;<input id="editSubFreqEvery" class="editBill" type="number" value="'+$("#"+id+" td[name=frequency]").data("every")+'" />&nbsp;days';
				} else if ($("#"+id+" td[name=frequency]").data("freq") === "w") {
				// } else if (freqArr[0] === "Weekly") {
					$("#editFrequency").val("w");
					// var subFreqArr = freqArr[1].split(" ");
					subFreq = 'Every&nbsp;<input id="editSubFreqEvery" class="editBill" type="number" value="'+$("#"+id+" td[name=frequency]").data("every")+'" />&nbsp;weeks';
				} else if ($("#"+id+" td[name=frequency]").data("freq") === "M") {
				// } else if (freqArr[0] === "Monthly") {
					$("#editFrequency").val("M");
					// var subFreqArr = freqArr[1].split(" ");
					subFreq = 'Every&nbsp;<input id="editSubFreqEvery" class="editBill" type="number" value="'+$("#"+id+" td[name=frequency]").data("every")+'" />&nbsp;months,';
					if ($("#"+id+" td[name=frequency]").data("onthe") !== -1) {
						subFreq += '&nbsp;on&nbsp;the&nbsp;<input id="editSubFreqOn" class="editBill" type="number" max="31" value="'+$("#"+id+" td[name=frequency]").data("onthe")+'" />'+
						'&nbsp;<input type="checkbox" id="editSubFreqLast" />&nbsp;Last Day';
					} else {
						subFreq += '&nbsp;on&nbsp;the&nbsp;<input id="editSubFreqOn" class="editBill" type="number" max="31" />'+
						'&nbsp;<input type="checkbox" id="editSubFreqLast" checked />&nbsp;Last Day';
					}
				}
				$("#editSubFreq").html(subFreq);
				// Set Automatic
				if ($("#"+id+" td[name=auto]").text() === "Yes") {
					// $("#editAuto").prop("checked", true);
					$("#editAuto").bootstrapToggle('on');
				} else {
					// $("#editAuto").prop("checked", false);
					$("#editAuto").bootstrapToggle('off');
				}
				// Set Type and Amount
				var amount = $("#"+id+" td[name=amount]").text();
				if (amount[0] === "-") {
					$("#editTypeWLabel").addClass("active");
					$("#editTypeDLabel").removeClass("active");
					$("#editAmount").val(amount.substring(1));
				} else {
					$("#editTypeWLabel").removeClass("active");
					$("#editTypeDLabel").addClass("active");
					$("#editAmount").val(amount);
				}
				// Show modal
				$("#editBillModal").modal("show");
			}).error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");			
			});
		}).error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");			
		});
	}

	function modifyBill() {
		$("#editBillButton").off("click");
		//Get values
		var newBill = {
			id: $("#editBillId").val()
			,payee: $("#editPayee").val()
			,description: $("#editDescription").val()
			,account: Number($("#editAccount").val())
			,startDate: $("#editStartDate").val()
			,frequency: $("#editFrequency").val()
			,every: $("#editSubFreqEvery").val()
			,amount: Number($("#editAmount").val())
			,automatic: $("#editAuto").prop("checked")
		}
		if ($("#editCategory").val() !== "none") {
			newBill.category = Number($("#editCategory").val());
		}
		if (newBill.frequency === "monthly") {
			if ($("#editSubFreqLast").is(":checked")) {
				// newBill.subFrequency = $("#editSubFreqEvery").val()+"_l";
				newBill.onThe = -1;
			} else {
				// newBill.subFrequency = $("#editSubFreqEvery").val()+"_"+$("#editSubFreqOn").val()
				newBill.onThe = Number($("#editSubFreqOn").val());
			}
		}
		// else {
		// 	newBill.subFrequency = $("#editSubFreqEvery").val();
		// }
		if ($("#editTypeWLabel").hasClass("active")) {
			newBill.amount = newBill.amount * -1;
		}
		// console.log(newBill);

		// Validation
		var errors = 0;
		$(".editBill").removeClass("error");
		if (newBill.payee === "") {
			$("#editPayee").addClass("error");
			errors++;
		}
		if (isNaN(newBill.account)) {
			$("#editAccount").addClass("error");
			errors++;
		}
		if (newBill.startDate === "") {
			$("#editStartDate").addClass("error");
			errors++;
		} else {
			if (!newBill.startDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
				$("#editStartDate").addClass("error");
				errors++;
			}
		}
		if (newBill.frequency === "none") {
			$("#editFrequency").addClass("error");
			errors++;
		}

		if (!newBill.hasOwnProperty("every")) {
			$("#editSubFreqEvery").addClass("error");
			errors++;
		} else {
			if (isNaN(newBill.every) || newBill.every === 0) {
				$("#editSubFreqEvery").addClass("error");
			}		
		}
		if (newBill.frequency === "monthly") {
			if (!newBill.hasOwnProperty("onThe")) {
				$("#editSubFreqOn").addClass("error");
				errors++;
			} else {
				if (isNaN(newBill.onThe) || newBill.onThe === 0) {
					$("#editSubFreqOn").addClass("error");
					errors++;
				}
			}
		}
		if (newBill.amount === "" || newBill.amount === null) {
			$("#editAmount").addClass("error");
			errors++;
		}

		// Send request if no errors
		if (errors === 0) {
			$("#editBillModal").modal("hide");
			$.ajax({
				type: "PUT"
				,url: "/api/v1/money/bills"
				,data: newBill
			}).success(function(response) {
				// resetAddBill();
			}).error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem modifying the bill.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
	}

	function deleteBill(id, payee) {
		var html = 'Are you sure you want to delete this Bill for '+payee+'?'+
			'<br /><h5>This will not remove any existing transactions, '+
			'<br />it will only prevent new ones from being created.</h5>';
		$("#deleteBillId").val(id);
		$("#deleteModalBody").html(html);
		$("#deleteBillModal").modal("show");
	}

	function removeBill() {
		var id = $("#deleteBillId").val();
		$("#deleteBillModal").modal("hide");
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/money/bills"
			,data: {id: id}
		}).success(function(response) {
			// getBills();
		}).error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem deleting the bill.  Please try again.");
			$("#infoModal").modal("show");
		});
	}