
var tickUpdates = {};
// var socket = io();

$(document).ready(function() {
	$("body").show();
		
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
	$("#deleteAccountButton").click(function() {
		removeAccount();
	});
	$("#reactivateAccountButton").click(function() {
		undeleteAccount();
	});
	
	$("#addAccountModal").on("shown.bs.modal", function() {
		$("#newName").focus();
	});	

	$("#addAccountModal").on("hidden.bs.modal", function() {
		clearAddFields();
	});

	$("#infoModal").on("hidden.bs.modal", function() {
		$("#infoModalBody").empty();
	});

	$("#editAccountModal").on("shown.bs.modal", function() {
		$("#editName").focus();
	});

	$("#editAccountModal").on("hidden.bs.modal", function() {
		$("#editAccountId").val("");
		$("#editName").val("");
		$("#editType").val("");
		$("#editDefaultOffLabel").removeClass("active");
		$("#editDefaultOnLabel").removeClass("active");
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
	});

	socket.on("accountAdded", function(id) {
		getAccounts(id, "add");
	});

	socket.on("accountChanged", function(id) {
		getAccounts(id, "change");
	});

	socket.on("accountDeleted", function(id) {
		$("#"+id).animate({backgroundColor: "#C9302C"}, 400).fadeOut(300);
	});

	socket.on("priceUpdated", function(update) {
		var origValue = tickUpdates[update.tick].quantity * tickUpdates[update.tick].price;
		var newValue = tickUpdates[update.tick].quantity * Number(update.price);
		var diff = newValue - origValue;
		var currentBalance = Number($("#"+tickUpdates[update.tick].account+" td[name=balance]").html());
		var newBalance = currentBalance + diff;
		$("#"+tickUpdates[update.tick].account+" td[name=balance]").html(newBalance.toFixed(2));
		tickUpdates[update.tick].price = update.price;
	});

// FUNCTIONS
function accountHighlight(id) {
	// $("#"+id).fadeIn(400).animate({backgroundColor: "#FFF"}, 5000);
	var baseBG = $("#"+id).css("background-color");
	$("#"+id).css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
}

function getAccounts(id, type) {
    $.ajax({
        type: "GET"
        ,url: "/api/v1/money/accountsplus"
    }).success(function(accounts) {
        // gl_getAccounts().then(function(accounts) {
        var now = moment();
        $("#accountTable tbody").empty();
        accounts.forEach(function (account) {
            var balance = 0;
            var row = '<tr id="' + account.id + '"';
            row += '>' +
                '<td name="name"><a href="/money/transactions?acct=' + account.id + '"><span id="text">' + account.name + '</span>';
            if (account.default === true) {
                row += '&nbsp;<i class="glyphicon glyphicon-star text-primary"></i>';
            }
            row += '</a></td>';
            if (account.Summaries.length > 0) {
                balance = account.Summaries[0].balance;
                // var balanceFound = false;
                // account.Summaries.forEach(function(summary) {
                // 	if (!balanceFound) {
                // 		if (summary.start !== null) {
                // 			if ((moment(summary.start) <= now && moment(summary.end) >= now) || moment(summary.end) <= now) {
                // 				balance = summary.balance;
                // 				balanceFound = true;
                // 			}
                // 		} else {
                // 			balance = summary.balance;
                // 			balanceFound = true;
                // 		}
                // 	}
                // });
            } else if (account.Positions.length > 0) {
                account.Positions.forEach(function (position) {
                    if (position.ticker.toUpperCase() !== "CASH") {
                        tickUpdates[position.ticker] = {
                            quantity: position.quantity
                            , price: position.currentPrice
                            , account: account.id
                        };
                        if (moment.utc(position.updatedAt).dayOfYear() !== moment.utc().dayOfYear()) {
                            $.ajax({
                                type: "GET"
                                , url: "/api/v1/money/positions/update/" + position.ticker
                            });
                        }
                    }
                    balance += (position.quantity * position.currentPrice);
                });
            }
            row += '<td name="balance">' + balance.toFixed(2) + '</td>' +
                '<td name="type">' + account.type + '</td>';
            // if (account.default === true) {
            // 	row += '<td name="default"><i class="glyphicon glyphicon-ok"></i></td>';
            // } else {
            // 	row += '<td name="default"><i class="glyphicon glyphicon-remove"></i></td>';
            // }
            row += '<td><button class="btn btn-primary" title="Edit Account" onclick="editAccount(\'' + account.id + '\');"><i class="glyphicon glyphicon-pencil"></i></button>';
            if (account.default !== true) {
                row += '<button class="btn btn-danger" title="Delete Account" onclick="deleteAccount(\'' + account.id + '\');"><i class="glyphicon glyphicon-trash"></i></button>';
            }
            row += '</td>' +
                '</tr>';
            $("#accountTable tbody").append(row);
        });
        if (type !== null) {
            accountHighlight(id);
        }
    }).error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});

        // },function(err) {
	// 	$("#infoModalBody").html(err);
	// 	$("#infoModal").modal("show");
	// });
}

function getInactiveAccounts(id, type) {
	$.ajax({
		type: "GET"
		,url: "/api/v1/money/accounts/inactive"
	})
	.success(function(response) {
		var now = moment();
		$("#inactiveAccountTable tbody").empty();
		response.forEach(function(account) {
			var row = '<tr id="'+account.id+'">'+
				// '<td name="name"><a href="/money/transactions?acct='+account.id+'"><span id="text">'+account.name+'</span></td>'+
				'<td name="name"><span id="text">'+account.name+'</span></td>'+
				'<td name="type">'+account.type+'</td>'+
				'<td>'+
					'<button class="btn btn-primary" title="Reactivate Account" onclick="reactivateAccount(\''+account.id+'\');">'+
						'<i class="glyphicon glyphicon-pencil"></i>'+
					'</button>'+
				'</td>'+
			'</tr>';
			$("#inactiveAccountTable tbody").append(row);
		});
		if (type !== null) {
			accountHighlight(id);			
		}
	})
	.error(function(jqXHR, textStatus, errorThrown) {
		if (jqXHR.status === 500) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		}
	});
}

function clearAddFields() {
	$("#newName").val("");
	$("#newBalance").val("");
	$("#defaultOffLabel").addClass("active");
	$("#defaultOnLabel").removeClass("active");
}

function cancelAdd() {
	$("#addAccountModal").modal("hide");
}

function addAccount() {
	var errorCount = 0;
	var newName = $("#newName").val();
	var newBalance = $("#newBalance").val();
	newBalance = newBalance.replace(",","");
	if (typeof newName !== "undefined" && newName.length > 0) {
		$("#newName").css("background-color", "#fff");
	} else {
		errorCount++;
		$("#newName").css("background-color", "#f2dede");
	}

	if ($("#newType").val() !== "Investment") {
		if (newBalance.match(/(?=.)^\$?-?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) && newBalance.length < 15) {
			$("#newBalance").css("background-color", "#fff");
		} else {
			errorCount++;
			$("#newBalance").css("background-color", "#f2dede");
		}
	}

	if (errorCount === 0) {
		$("#addAccountModal").modal("hide");
		var account = {
			name: newName
			,balance: newBalance
			,type: $("#newType").val()
		}
		if ($("#defaultOffLabel").hasClass("active")) {
			account.default = false;
		} else if ($("#defaultOnLabel").hasClass("active")) {
			account.default = true;
		}
		saveAccount(account);
	}
}

function saveAccount(account) {
	$.ajax({
		type: "POST"
		,url: "/api/v1/money/accounts"
		,data: {
			name: account.name
			,balance: account.balance
			,type: account.type
			,default: account.default
		}
	})
	.success(function(response) {
		return false;
	})
	.error(function(jqXHR, textStatus, errorThrown) {
		$("#infoModalBody").html("There was a problem.  Please try again.");
		$("#infoModal").modal("show");
	});
}

function editAccount(id) {
	$("#editAccountId").val(id);
	$("#editName").val($("#"+id+" td[name=name] span[id=text]").html());
	var origType = $("#"+id+" td[name=type]").html();
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
	if ($("#"+id+" td[name=default] i").hasClass("glyphicon-remove")) {
		$("#editDefaultOffLabel").addClass("active");
	} else {
		$("#editDefaultOnLabel").addClass("active");
	}
	$("#editAccountModal").modal("show");
}

function modifyAccount() {
	var id = $("#editAccountId").val();
	if (typeof id !== "undefined" && id.length > 0) {	
		var editName = $("#editName").val();
		if (typeof editName !== "undefined" && editName.length > 0) {
			$("#editAccountModal").modal("hide");
			var data = {
				id: id
				,name: editName
				,type: $("#editType").val()
			}
			if ($("#editDefaultOffLabel").hasClass("active")) {
				data.default = false;
			} else if ($("#editDefaultOnLabel").hasClass("active")) {
				data.default = true;
			}
			$.ajax({
				type: "PUT"
				,url: "/api/v1/money/accounts"
				,data: data
			})
			.success(function() {
				return false;
			})
			.error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		} else {
			$("#editName").css("background-color", "#f2dede");
		}
	}
}

function deleteAccount(id) {
	var name = $("#"+id+" td[name=name]").html();
	$("#deleteAccountId").val(id);
	$("#deleteModalBody").html("<strong>Are you sure you want to delete "+name+"?</strong><br />This will also delete all associated transactions");
	$("#deleteAccountModal").modal("show");
}

function removeAccount() {
	var id = $("#deleteAccountId").val();
	$("#deleteAccountModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/money/accounts"
			,data: {
				id: id
			}
		})
		.success(function() {
			getInactiveAccounts(id,"add");
			return false;
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

function reactivateAccount(id) {
	$("#reactivateAccountId").val(id);
	$("#reactivateModalBody").html("Would you like to reactivate the "+$("#"+id+" td[name=name] span[id=text]").html()+" account?");
	$("#reactivateAccountModal").modal("show");
}

function undeleteAccount() {
	var id = $("#reactivateAccountId").val();
	$("#reactivateAccountModal").modal("hide");
	if (typeof id !== "undefined" && id.length > 0) {
		$.ajax({
			type: "PUT"
			,url: "/api/v1/money/accounts/reactivate"
			,data: {
				id: id
			}
		})
		.success(function() {
			getAccounts(id,"add");
			getInactiveAccounts(null,null);
			return false;
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}
}

