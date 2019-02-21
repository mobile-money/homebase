
let tickUpdates = {};
// var socket = io();

$(document).ready(function() {
	$("body").show();

	getGroups();
	getAccounts(null, null);
	getInactiveAccounts(null, null);
});

// FIELD EVENTS
	$("#newType").change(function() {
		if ($("#newType").val() === "Investment") {
			$("#newBalance").hide();
			$("#newBalanceLabel").hide();
		} else {
			$("#newBalance").show();
			$("#newBalanceLabel").show();
		}
	});

	$("#addAccountButton").click(function() {
		addAccount();
	});
	$("#editAccountButton").click(function() {
		modifyAccount();
	});
	$("#dltAccountButton").click(function() {
		deleteAccount($("#editAccountId").val());
		$("#editAccountModal").modal("hide");
	});
	$("#deleteAccountButton").click(function() {
		removeAccount();
	});
	$("#reactivateAccountButton").click(function() {
		undeleteAccount();
	});

	$("#addAccountModal").on("shown.bs.modal", function() {
		$("#newName").focus();
	}).on("hidden.bs.modal", function() {
		clearAddFields();
	});

	$("#infoModal").on("hidden.bs.modal", function() {
		$("#infoModalBody").empty();
	});

	$("#editAccountModal").on("shown.bs.modal", function() {
		$("#editName").focus();
	}).on("hidden.bs.modal", function() {
		clearEditFields();
	});

	$("#deleteAccountModal").on("hidden.bs.modal", function() {
		$("#deleteAccountId").val("");
	});

	$("#reactivateAccountModal").on("hidden.bs.modal", function() {
		$("#reactivateAccountId").val("");
		$("#reactivateModalBody").html("");
	});

// SOCKET IO
	socket.on("connect", function() {
		// console.log("connected to server");
	}).on("accountAdded", function(id) {
		getAccounts(id, "add");
	}).on("accountChanged", function(id) {
		getAccounts(id, "change");
	}).on("accountDeleted", function(id) {
		$("#"+id).animate({backgroundColor: "#C9302C"}, 400).fadeOut(300);
	}).on("priceUpdated", function(update) {
		const $balanceField = $("#"+tickUpdates[update.tick].account+" td[name=balance]");
		const origValue = tickUpdates[update.tick].quantity * tickUpdates[update.tick].price;
		const newValue = tickUpdates[update.tick].quantity * Number(update.price);
		const diff = newValue - origValue;
		const currentBalance = Number($balanceField.html());
		const newBalance = currentBalance + diff;
		$balanceField.html(newBalance.toFixed(2));
		tickUpdates[update.tick].price = update.price;
	});

// FUNCTIONS
function addAccount() {
	const $nameField = $("#newName");
	const $balanceField = $("#newBalance");
	const $typeField = $("#newType");
	let errorCount = 0;
	const newName = $nameField.val();
	let newBalance = $balanceField.val();
	newBalance = newBalance.replace(",","");
	if (typeof newName !== "undefined" && newName.length > 0) {
		$nameField.css("background-color", "#fff");
	} else {
		errorCount++;
		$nameField.css("background-color", "#f2dede");
	}

	if ($typeField.val() !== "Investment") {
		if (newBalance.match(/(?=.)^\$?-?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) && newBalance.length < 15) {
			$balanceField.css("background-color", "#fff");
		} else {
			errorCount++;
			$balanceField.css("background-color", "#f2dede");
		}
	}

	if (errorCount === 0) {
		$("#addAccountModal").modal("hide");
		let account = {
			name: newName
			,balance: newBalance
			,type: $typeField.val()
			,group_ids: JSON.stringify($("#newGroups").val())
		};
		account.default = $("#newDefault").val() === "yes";
		saveAccount(account);
	}
}

function accountHighlight(id) {
	// $("#"+id).fadeIn(400).animate({backgroundColor: "#FFF"}, 5000);
	const $field = $("#"+id);
	const baseBG = $field.css("background-color");
	$field.css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
}

function clearAddFields() {
	$("#newName").val("");
	$("#newBalance").val("");
	$("#newDefault").val("no");
	$("#newGroups option:selected").prop("selected", false);
}

function clearEditFields() {
	$("#editAccountId").val("");
	$("#editName").val("");
	$("#editType").val("");
	$("#editDefault").val("no");
	$("#editGroups option:selected").prop("selected", false);
}

function deleteAccount(id) {
	const name = $("#"+id+" td[name=name]").html();
	$("#deleteAccountId").val(id);
	$("#deleteModalBody").html("<strong>Are you sure you want to delete "+name+"?</strong><br />This will also delete all associated transactions");
	$("#deleteAccountModal").modal("show");
}

function editAccount(id) {
	$("#editAccountId").val(id);
	$("#editName").val($("#"+id+" td[name=name] span[id=text]").html());
	const origType = $("#"+id+" td[name=type]").html();
	if (origType === "Checking") {
		$("#editType").val("Checking");
	} else if (origType === "Credit Card") {
		$("#editType").val("Credit Card");
	} else if (origType === "Investment") {
		$("#editType").val("Investment");
	} else if (origType === "Loan") {
		$("#editType").val("Loan");
	} else if (origType === "Mortgage") {
		$("#editType").val("Mortgage");
	} else if (origType === "Savings") {
		$("#editType").val("Savings");
	}
	if ($("#"+id+" td[name=name] i").hasClass("fa-star")) {
		$("#editDefault").val("yes");
		$("#dltAccountButton").prop("disabled",true);
	} else {
		$("#editDefault").val("no");
		$("#dltAccountButton").prop("disabled",false);
	}
	const aua = $("#"+id+" td[name=groups] input[name=group_ids]").val();
	if (typeof(aua) !== "undefined") {
		$("#editGroups").val(aua.split(","));
	}
	$("#editAccountModal").modal("show");
}

function getAccounts(id, type) {
	$.ajax({
		type: "GET"
		,url: "/api/v1/money/accounts"
	}).success(function(response) {
		const now = moment();
		$("#accountTable tbody").empty();
		response.forEach(function(account) {
			let balance = 0;
			let row = '<tr id="'+account.id+'"><td name="name"><a href="/money/transactions?acct='+account.id+'"><span id="text">'+account.name+'</span>';
			if (account.default === true) {
				row += '&nbsp;<i class="fa fa-star text-primary"></i>';
			}
			row += '</a></td>';
			if (account.Summaries.length > 0) {
				let balanceFound = false;
				account.Summaries.forEach(function(summary) {
					if (!balanceFound) {
						if (summary.start !== null) {
							if ((moment(summary.start) <= now && moment(summary.end) >= now) || moment(summary.end) <= now) {
								balance = summary.balance;
								balanceFound = true;
							}
						} else {
							balance = summary.balance;
							balanceFound = true;
						}
					}
				});
			} else if (account.Positions.length > 0) {
				account.Positions.forEach(function(position) {
					if (position.ticker.toUpperCase() !== "CASH") {
						tickUpdates[position.ticker] = {
							quantity: position.quantity
							,price: position.currentPrice
							,account: account.id
						};
						// if (moment.utc(position.updatedAt).dayOfYear() !== moment.utc().dayOfYear()) {
						// 	$.ajax({
						// 		type: "GET"
						// 		,url: "/api/v1/money/positions/update/"+position.ticker
						// 	});
						// }
					}
					balance += (position.quantity * position.currentPrice);
				});
			}
			row += '<td name="balance">'+balance.toFixed(2)+'</td>'+
			'<td name="type" class="d-none d-sm-table-cell">'+account.type+'</td>';
			if (account.groups.length > 0) {
				// let addUsers = "Additional users with access:";
				// let addUsersIds = [];
				// account.additional_owners.forEach(function(additional_user) {
				// 	addUsers += "<br />"+additional_user.first_name+' '+additional_user.last_name;
				// 	addUsersIds.push(additional_user.id);
				// });
				// row += '<td name="groups"><i class="fa fa-user" data-toggle="tooltip" data-placement="bottom" data-html="true" data-container="body" title="'+addUsers+'"></i>' +
				row += '<td name="groups"><i class="fa fa-users"></i>' +
					'<input name="group_ids" type="hidden" value="'+account.groups.join(",")+'" /></td>';
			} else {
				row += '<td></td>';
			}
			if (account.owner) {
				row += '<td><button class="btn btn-primary btn-sm" title="Edit Account" onclick="editAccount(\''+account.id+'\');"><i class="fas fa-pencil-alt"></i></button>';
				// if (account.default !== true) {
				// 	row += '<button class="btn btn-danger" title="Delete Account" onclick="deleteAccount(\''+account.id+'\');"><i class="fa fa-trash"></i></button>';
				// }
				row += '</td>';
			} else {
				row += '<td></td>';
			}
			row += '</tr>';
			$("#accountTable tbody").append(row);
		});
		// $('[data-toggle="tooltip"]').tooltip();
		if (type !== null) {
			accountHighlight(id);			
		}
	}).error(function(jqXHR/*, textStatus, errorThrown*/) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function getInactiveAccounts(id, type) {
	$.ajax({
		type: "GET"
		,url: "/api/v1/money/accounts/inactive"
	}).success(function(response) {
		$("#inactiveAccountTable tbody").empty();
		response.forEach(function(account) {
			let row = '<tr id="'+account.id+'">'+
				'<td name="name"><span id="text">'+account.name+'</span></td>'+
				'<td name="type">'+account.type+'</td>';
			if (account.groups.length > 0) {
				// let addUsers = "Additional users with access:";
				// let addUsersIds = [];
				// account.additional_owners.forEach(function(additional_user) {
				// 	addUsers += "<br />"+additional_user.first_name+' '+additional_user.last_name;
				// 	addUsersIds.push(additional_user.id);
				// });
				row += '<td name="groups"><i class="fa fa-users"></i>' +
					'<input name="group_ids" type="hidden" value="'+account.groups.join(",")+'" /></td>';
			} else {
				row += '<td></td>';
			}
			if (account.owner) {
				row += '<td>'+
					'<button class="btn-sm btn-primary" title="Reactivate Account" onclick="reactivateAccount(\''+account.id+'\');">'+
					'<i class="fas fa-pencil-alt"></i>'+
					'</button>'+
					'</td>';
			} else {
				row += '<td></td>';
			}
			row += '</tr>';
			$("#inactiveAccountTable tbody").append(row);
		});
		// $('[data-toggle="tooltip"]').tooltip();
		if (type !== null) {
			accountHighlight(id);			
		}
	}).error(function(jqXHR/*, textStatus, errorThrown*/) {
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
		// console.log(response);
		response.groups.forEach(function(group){
			$("#newGroups").append($('<option>',{value: group.id, text: group.name}));
			$("#editGroups").append($('<option>',{value: group.id, text: group.name}));
		});
	}).error(function(jqXHR) {
		// console.log(jqXHR);
	});
}

function modifyAccount() {
	const id = $("#editAccountId").val();
	const $nameField = $("#editName");
	if (typeof id !== "undefined" && id.length > 0) {
		const editName = $nameField.val();
		if (typeof editName !== "undefined" && editName.length > 0) {
			$("#editAccountModal").modal("hide");
			let data = {
				id: id
				,name: editName
				,type: $("#editType").val()
				,group_ids: JSON.stringify($("#editGroups").val())
			};
			data.default = $("#editDefault").val() === "yes";
			$.ajax({
				type: "PUT"
				,url: "/api/v1/money/accounts"
				,data: data
			}).success(function(/*response*/) {
				return false;
			}).error(function(/*jqXHR, textStatus, errorThrown*/) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		} else {
			$nameField.css("background-color", "#f2dede");
		}
	}
}

function reactivateAccount(id) {
	$("#reactivateAccountId").val(id);
	$("#reactivateModalBody").html("Would you like to reactivate the "+$("#"+id+" td[name=name] span[id=text]").html()+" account?");
	$("#reactivateAccountModal").modal("show");
}

function removeAccount() {
	const id = $("#deleteAccountId").val();
	$("#deleteAccountModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/money/accounts"
			,data: {
				id: id
			}
		}).success(function(/*response*/) {
			getInactiveAccounts(id,"add");
			return false;
		}).error(function(/*jqXHR, textStatus, errorThrown*/) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

function saveAccount(account) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/money/accounts"
		,data: account
	}).success(function(/*response*/) {
		return false;
	}).error(function(/*jqXHR, textStatus, errorThrown*/) {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function undeleteAccount() {
	const id = $("#reactivateAccountId").val();
	$("#reactivateAccountModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "PUT"
			,url: "/api/v1/money/accounts/reactivate"
			,data: {
				id: id
			}
		}).success(function(/*response*/) {
			getAccounts(id,"add");
			getInactiveAccounts(null,null);
			return false;
		}).error(function(/*jqXHR, textStatus, errorThrown*/) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

