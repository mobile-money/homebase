
var accountArray = [];
var accountNames = {};
var categoryArray = [];
var socket = io();
var transactionLimit = 50;

$(document).ready(function() {
	$("body").show();
	$("#newTDate").val(moment().format("MM/DD/YYYY"));
	$(".datepicker").datepicker({
		format: 'mm/dd/yyyy'
		,autoclose: true
	});

	$("#positionSection").empty();
	$("#newPayee").focus();

	getCategories();
	getAccounts();
	// getTransactions(null, null);
});

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
  return query_string;
}();

// FIELD EVENTS
	$("#newPayee").typeahead({source: function(query, process) {
		// return $.get("/api/v1/money/transactions/lookup/payee/"+encodeURI(query));
		$.ajax({
			url: "/api/v1/money/transactions/lookup/payee/"+encodeURI(query)
			,success: process
		})
	}, minLength: 3});

	$("#newDescription").typeahead({source: function(query, process) {
		// return $.get("/api/v1/money/transactions/lookup/payee/"+encodeURI(query));
		$.ajax({
			url: "/api/v1/money/transactions/lookup/description/"+encodeURI(query)
			,success: process
		})
	}, minLength: 3});

	// $("#newPayee").keyup(function(e) {
	// 	if (e.target.value.length >= 2) {
	// 		if ((e.which === 8) || 
	// 			(e.which === 32) || 
	// 			(e.which === 46) || 
	// 			(e.which >= 48 && e.which <= 57) ||
	// 			(e.which >= 65 && e.which <= 90) ||
	// 			(e.which >= 186 && e.which <= 192) || 
	// 			(e.which >= 219 && e.which <= 222)) {
	// 			$.get("/api/v1/money/transactions/lookup/payee/"+e.target.value, function(response) {
	// 				$("#newPayee").typeahead({source: response, minLength: 3});
	// 			}, 'json');
	// 		}
	// 	}
	// 	/*
	// 	8
	// 	32
	// 	46
	// 	48-57
	// 	65-90
	// 	186-192
	// 	219-222
	// 	*/
	// });

	// $("#newDescription").keyup(function(e) {
	// 	if (e.target.value.length >= 2) {
	// 		if ((e.which === 8) || 
	// 			(e.which === 32) || 
	// 			(e.which === 46) || 
	// 			(e.which >= 48 && e.which <= 57) ||
	// 			(e.which >= 65 && e.which <= 90) ||
	// 			(e.which >= 186 && e.which <= 192) || 
	// 			(e.which >= 219 && e.which <= 222)) {
	// 			$.get("/api/v1/money/transactions/lookup/description/"+e.target.value, function(response) {
	// 				$("#newDescription").typeahead({source: response, minLength: 3});
	// 			}, 'json');
	// 		}
	// 	}
	// });

	$("#editTransactionModal").on("shown.bs.modal", function() {
		$("#editPayee").focus();
	});

	$("#editTransactionModal").on("hidden.bs.modal", function() {
		$("#editTransactionId").val("");
		$("#editPayee").val("");
		$("#editDescription").val("");
		$("#editCheck").val("");
		$("#editCategory").empty();
		// $("#newPayee").focus();
	});

	$("#editFutureTransactionModal").on("shown.bs.modal", function() {
		$("#editFPayee").focus();
	});

	$("#editFutureTransactionModal").on("hidden.bs.modal", function() {
		$("#editFTransactionId").val("");
		$("#editFTDate").val("");
		$("#editFPayee").val("");
		$("#editFDescription").val("");
		$("#editFCheck").val("");
		$("#editFDeposit").val("");
		$("#editFWithdrawl").val("");
		$("#editFCategory").empty();
		// $("#newPayee").focus();
	});

	$("#commitFutureTransactionModal").on("hidden.bs.modal", function() {
		$("#commitFTransactionId").val("");
		$("#commitModalBody").empty();
		// $("#newPayee").focus();
	});

	$("#deleteTransactionModal").on("hidden.bs.modal", function() {
		// $("#newPayee").focus();
	});

	$("#infoModal").on("hidden.bs.modal", function() {
		$("#infoModalBody").empty();
		$("#newPayee").focus();
	});

	$("#xferModal").on("hidden.bs.modal", function() {
		$("#xferButton").off("click");
		$("#newPayee").focus();
	});

	$("#addTransaction").click(function() {
		addTransaction();
	});
	$("#editTransactionButton").click(function() {
		modifyTransaction();
	});
	$("#editFTransactionButton").click(function() {
		modifyFTransaction();
	});
	$("#commitFTransactionButton").click(function() {
		sendCommit();
	});

	$("#deleteTransactionButton").click(function() {
		removeTransaction();
	});

	$("#startXferBtn").click(function() {
		var currentAccount = $("#accountSelect").val();
		$("#xferAccounts").empty();
		if ($("#xferAccountId").val() === "") {
			$("#xferAccounts").html('<option id="noAccountSelected" />');
		}
		$("#xferModal").modal("show");
		accountArray.forEach(function(account) {
			if (account.id != currentAccount) {
				var option = '<option value="'+account.id+'"';
				if ($("#xferAccountId").val() == account.id) {
					option += ' selected';
				}
				option += '>'+account.name+'</option>';
				$("#xferAccounts").append(option);
			}
		});
		$("#noXferBtn").click(function() {
			$("#noXferBtn").removeClass("btn-default");
			$("#noXferBtn").addClass("active btn-primary");
			$("#xferAccountId").val("");
			$("#xferAccounts").prepend('<option id="noAccountSelected" selected />');
		});
		$("#xferButton").click(function() {
			setXfer();
		});
	});

	$("#xferAccounts").change(function() {
		if ($("#xferAccounts").val() !== null) {
			$("#noAccountSelected").remove();
			$("#noXferBtn").removeClass("active btn-primary");
			$("#noXferBtn").addClass("btn-default");
			$("#xferAccountId").val($("#xferAccounts").val());
		}
	});

	$("#accountSelect").change(function() {
		resetAddTransaction();
		$("#transactionTable tbody").empty();
		if (accountNames[$("#accountSelect").val()].type === "Investment") {
			// $("#periodSelect").hide();
			getInvestments($("#accountSelect").val(), null, null, null);
		} else {
			// $("#periodSelect").show();
			// getPeriods($("#accountSelect").val());
			getTransactions(null, null);
		}
		setupTable();
		$("#newPayee").focus();
	});

// SOCKET IO
	socket.on("connect", function() {
	});

	socket.on("transactionAdded", function(transId) {
		getTransactions(0, $("#transactionTable tbody tr").length, transId);
	});

	socket.on("transactionChanged", function(transId) {
		getTransactions(0, $("#transactionTable tbody tr").length, transId);
	});

	socket.on("transactionDeleted", function(id) {
		// console.log(id);
		$("#"+id).animate({backgroundColor: "#C9302C"}, 400).fadeOut(300);
	});

	socket.on("summaryAdded", function(newSummary) {
		// getPeriods($("#accountSelect").val());
	});

	socket.on("categoryAdded", function(category) {
		getCategories();
	});

	socket.on("tradeAdded", function(obj) {
		getInvestments($("#accountSelect").val(), obj.trade, obj.position, "add");
	});

	socket.on("priceUpdated", function(update) {
		$("."+update.tick.toUpperCase()).css("background-color", "#F0EEA1").animate({backgroundColor: "#F5F5F5"}, 5000);
		var quantity = $("."+update.tick.toUpperCase()+" td[name=quantity]").html();
		var origValue = $("."+update.tick.toUpperCase()+" td[name=value]").html();
		var origDChange = $("."+update.tick.toUpperCase()+" td[name=dChange]").html();
		var basis = Number(origValue) - Number(origDChange);
		var newValue = Number(quantity) * Number(update.price);
		var newDChange = newValue - basis;
		var newPChange = (basis / newDChange) * 100;

		$("."+update.tick.toUpperCase()+" td[name=price]").html(Number(update.price).toFixed(2));
		$("."+update.tick.toUpperCase()+" td[name=value]").html(newValue.toFixed(2));
		$("."+update.tick.toUpperCase()+" td[name=dChange]").html(newDChange.toFixed(2));
		$("."+update.tick.toUpperCase()+" td[name=pChange]").html(newPChange.toFixed(2));

		if (newDChange > 0) {
			$("."+update.tick.toUpperCase()+" td[name=dChange]").css("color", "green");
		} else if (newDChange < 0) {
			$("."+update.tick.toUpperCase()+" td[name=dChange]").css("color", "red");
		} else {
			$("."+update.tick.toUpperCase()+" td[name=dChange]").css("color", "black");
		}
		if (newPChange > 0) {
			$("."+update.tick.toUpperCase()+" td[name=pChange]").css("color", "green");
		} else if (newPChange < 0) {
			$("."+update.tick.toUpperCase()+" td[name=pChange]").css("color", "red");
		} else {
			$("."+update.tick.toUpperCase()+" td[name=pChange]").css("color", "black");
		}

		var totalValue = 0;
		var totalBasis = Number($("#totalBasis").html());
		$.each($(".positionRow td[name=value]"), function() {
			totalValue += Number($(this).html());
		});
		$("#totalValue").html(totalValue.toFixed(2));
		var totalDChange = totalValue - totalBasis;
		$("#totalDChange").html(totalDChange.toFixed(2));
		if (totalDChange > 0) {
			$("#totalDChange").css("color", "green");
		} else if (totalDChange < 0) {
			$("#totalDChange").css("color", "red");
		} else {
			$("#totalDChange").css("color", "black");
		}
		var totalPChange = (totalDChange / totalBasis) * 100;
		$("#totalPChange").html(totalPChange.toFixed(2));
		if (totalPChange > 0) {
			$("#totalPChange").css("color", "green");
		} else if (totalPChange < 0) {
			$("#totalPChange").css("color", "red");
		} else {
			$("#totalPChange").css("color", "black");
		}
	});

	socket.on("transactionCleared", function(id) {
		// console.log(id);
		$("#clr_"+id).attr("checked", true).attr("disabled", true);
	});

// FUNCTIONS
	function getBills() {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/post/bills/"+$("#accountSelect").val()
		});
	}

	function setupTable() {
		$("#positionSection").empty();
		switch (accountNames[$("#accountSelect").val()].type) {
			case "Checking":
			case "Savings":
				$("#payeeHeader").html("Payee");
				$("#plusHeader").html("Deposit");
				$("#minusHeader").html("Withdrawl");
				$("#balanceHeader").html("Balance");
				$("#newDeposit").prop("step", "0.01");
				$("#newWithdrawl").prop("step", "0.01");
				$(".zulu").show();
				$("#periodSelect").show();
				break;
			case "Credit Card":
				$("#payeeHeader").html("Payee");
				$("#plusHeader").html("Payment");
				$("#balanceHeader").html("Balance");
				$("#minusHeader").html("Purchase");
				$("#newDeposit").prop("step", "0.01");
				$("#newWithdrawl").prop("step", "0.01");
				$(".zulu").show();
				$("#periodSelect").show();
				break;
			case "Investment":
				$("#payeeHeader").html("Ticker");
				$("#plusHeader").html("Quantity");
				$("#minusHeader").html("Price");
				$("#balanceHeader").html("Cost");
				$("#newDeposit").prop("step", "0.001");
				$("#newWithdrawl").prop("step", "0.001");
				$(".zulu").hide();
				$("#periodSelect").hide();
				break;
			case "Loan":
			case "Mortgage":
				$("#payeeHeader").html("Payee");
				$("#plusHeader").html("Payment");
				$("#minusHeader").html("Increase");
				$("#balanceHeader").html("Balance");
				$("#newDeposit").prop("step", "0.01");
				$("#newWithdrawl").prop("step", "0.01");
				$(".zulu").show();
				$("#periodSelect").show();
				break;
			default: 
		}
	}

	function setXfer() {
		$("#xferModal").modal("hide");
		$("#xferAccounts").html('<option id="noAccountSelected" />');
		if ($("#xferAccountId").val() !== "") {
			$("#startXferBtn").removeClass("btn-default");
			$("#startXferBtn").addClass("btn-primary active");
		} else {
			$("#startXferBtn").removeClass("btn-primary active");
			$("#startXferBtn").addClass("btn-default");
		}
	}

	function transactionHighlight(id) {
		var baseBG = $("#"+id).css("background-color");
		$("#"+id).css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
	}

	function tradeHighlight(id, type) {
		if (type === "trade") {
			var baseBG = $("#trade_"+id).css("background-color");
			$("#trade_"+id).css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
		} else if (type === "position") {
			var baseBG = $("#position_"+id).css("background-color");
			$("#position_"+id).css("background-color", "#F0EEA1").animate({backgroundColor: baseBG}, 5000);
		}
	}

	function resetAddTransaction() {
		$("#newTDate").datepicker('update', new Date());
		$("#newPayee").val("");
		$("#newDescription").val("");
		$("#newCheck").val("");
		$("#newDeposit").val("");
		$("#newWithdrawl").val("");
		$("#newCategory").val("");
		$("#xferAccountId").val("");
		$("#startXferBtn").removeClass("btn-primary active");
		$("#startXferBtn").addClass("btn-default");
		$("#noXferBtn").removeClass("btn-default");
		$("#noXferBtn").addClass("active btn-primary");
	}

	function getCategories() {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/categories"
		})
		.success(function(response) {
			categoryArray = response;
			$("#newCategory").html('<option id="defaultCategory" />');
			response.forEach(function(category) {
				$("#newCategory").append('<option value="'+category.id+'">'+category.name+'</option>');
			});
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 404) {
				return false;
			} else {
				$("#infoModalBody").html("There was a problem retrieving Categories.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}

	function getAccounts() {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/accounts"
		})
		.success(function(response) {
			$("#addTransaction").prop("disabled", false);
			accountArray = response;
			$("#accountSelect").empty();
			if (response.length === 1) {
				$("#startXferBtn").prop("disabled", true);
			}
			response.forEach(function(account) {
				accountNames[account.id] = {name: account.name, type: account.type};
				if (typeof QueryString.acct !== "undefined") {
					if (account.id == QueryString.acct) {
						$("#accountSelect").append('<option value="'+account.id+'" selected>'+account.name+'</option>');
					} else {
						$("#accountSelect").append('<option value="'+account.id+'">'+account.name+'</option>');
					}					
				} else {
					if (account.default === true) {
						$("#accountSelect").append('<option value="'+account.id+'" selected>'+account.name+'</option>');
					} else {
						$("#accountSelect").append('<option value="'+account.id+'">'+account.name+'</option>');
					}					
				}
			});
			if (accountNames[$("#accountSelect").val()].type === "Investment") {
				getInvestments($("#accountSelect").val(), null, null);
			} else {
				getTransactions(null, null);
				// getPeriods($("#accountSelect").val());
			}
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 404) {
				$("#addTransaction").prop("disabled", true);
				return false;
			} else {
				$("#addTransaction").prop("disabled", true);
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");			
			}
		});
	}

	function getPeriods(id) {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/summaries/"+id
		})
		.success(function(response) {
			$("#periodSelect").empty();
			var nowStamp = moment().format("x");
			response.forEach(function(period) {
				if (period.start !== null) {
					var startStamp = moment.utc(period.start).format("x");
					var startString = moment.utc(period.start).format("MMM D, YYYY")
					var endStamp = moment.utc(period.end).format("x");
					var endString = moment.utc(period.end).format("MMM D, YYYY");
					if (nowStamp >= startStamp && nowStamp <= endStamp) {
						$("#periodSelect").append('<option value="'+period.id+'" selected>'+startString+' - '+endString+'</option>');
					} else {
						$("#periodSelect").append('<option value="'+period.id+'">'+startString+' - '+endString+'</option>');
					}
				}
			});
			if ($("#periodSelect").val() !== null) {
				// getTransactions($("#periodSelect").val(), null, null);
			}
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 404) {
				return false;
			} else {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}

	function clearTransaction(id) {
		// console.log(id);
		$.ajax({
			type: "PUT"
			,url: "/api/v1/money/clear/transactions"
			,data: {
				id: id
			}
		}).success(function(response) {
			// $("#clr_"+id).attr("disabled", true);
		}).error(function(jqXHR, textStatus, errorThrown) {
			$("#clr_"+id).removeAttr("checked");
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}

	function postTransaction(id, value) {
		// console.log(id);
		$.ajax({
			type: "PUT"
			,url: "/api/v1/money/post/transactions"
			,data: {
				id: id
				,date: value
			}
		}).success(function(response) {
			// $("#clr_"+id).attr("disabled", true);
		}).error(function(jqXHR, textStatus, errorThrown) {
			// $("#clr_"+id).removeAttr("checked");
			$("#post_"+id).val("");
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}

	function getTransactions(offset, limit, transId) {
		setupTable();
		if (offset === null) { offset = 0; }
		if (limit === null || limit <= transactionLimit) {
			limit = transactionLimit;
		}
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/transactions/account/"+$("#accountSelect").val()+"/"+offset+"/"+limit
		})
		.success(function(response) {
			// console.log(response);
			$("#transactionTable tbody").empty();
			// var balance = Number(response.cTrans[0].Summary.balance);
			var balance = 0;
			var initialBalance = 0;
			for (var i = 0; i < response.cTrans.length; i++) {
				if (!response.cTrans[i].future) {
					if (response.cTrans[i].postDate !== null) {
						if (response.cTrans[i].hasOwnProperty("Summary")) {
							balance = Number(response.cTrans[i].Summary.balance);
							initialBalance = Number(response.cTrans[i].Summary.balance);
							break;
						}
					}
				}
			}
			// console.log(initialBalance);
			balance += Number(response.adjust);

			// Current Transactions
			response.cTrans.forEach(function(result) {
				var dp = false;
				var dateNow = new Date();
				var row;
				var tDateMoment = moment.utc(result.transactionDate);
				if (result.hasOwnProperty("future")) {
					dp = true;
					row = '<tr id="f_'+result.id+'"';
					if (tDateMoment.isAfter(moment(),'days')) {
						row += ' class="success"';
					}
					row += '><td><input type="text" size="10" class="datepicker form-control" data-tid="'+result.id+'" value="'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'" data-date-start-date="'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'" data-date-end-date="'+dateNow+'" id="post_'+result.id+'" style="color:#fff;" /></td>';
				} else {
					row = '<tr id="'+result.id+'">'+
						'<td>'+moment.utc(result.postDate).format("MM/DD/YYYY")+'</td>';
				}
				row += '<td name="transactionDate">'+
					tDateMoment.format("MM/DD/YYYY")+
				'</td>'+
				'<td name="payee">';
				if (result.BillId !== null) {
					row += '&nbsp;<i class="glyphicon glyphicon-repeat img-rounded trans-badge" title="Repeating Transaction"></i>';
				}
				if (result.Bill !== null) {
					if (result.Bill.automatic) {
						row += '&nbsp;<i class="glyphicon glyphicon-flash img-rounded trans-badge" title="Automatic Payment"></i>';
					}
				}
				row += result.payee+'</td>';
				if (result.description !== null) {
					row += '<td name="description">';
					if (result.xfer !== null) {
						row += "[Transfer] ";
					}
					row += result.description+'</td>';
				} else {
					row += '<td name="description">';
					if (result.xfer !== null) {
						row += "[Transfer]";
					}
					row += '</td>';
				}
				if (result.checkNumber !== null) {
					row += '<td name="check">'+result.checkNumber+'</td>';
				} else {
					row += '<td name="check"></td>';
				}

				if (result.amount !== null) {
					if (result.amount > 0) {
						row += '<td name="plus">'+result.amount.toFixed(2)+'</td><td name="minus"></td>';
					} else {
						row += '<td name="plus"></td><td name="minus">'+(Number(result.amount) * -1).toFixed(2)+'</td>';
					}
				}
				if (result.Category !== null) {
					row += '<td name="category">'+result.Category.name+'</td>';
				} else {
					row += '<td name="category"></td>';
				}
				row += '<td name="balance">'+balance.toFixed(2)+'</td>';
				if (result.hasOwnProperty("future")) {
					row += '<td>'+
						'<button class="btn btn-primary btn-xs" title="Edit Transaction" onclick="editFTransaction(\''+result.id+'\');">'+
							'<i class="glyphicon glyphicon-pencil"></i>'+
						'</button>'+
						// '<button class="btn btn-success btn-xs" title="Commit Transaction" onclick="commitFTransaction(\''+result.id+'\');">'+
						// 	'<i class="glyphicon glyphicon-plus"></i>'+
						// '</button>'+
						'<button class="btn btn-danger btn-xs" title="Delete Transaction" onclick="deleteTransaction(\''+result.id+'\');">'+
							'<i class="glyphicon glyphicon-remove"></i>'+
						'</button>'+
					'</td>';
				} else {
					row += '<td>' +
						'<button class="btn btn-primary btn-xs" title="Edit Account" onclick="editTransaction(\'' + result.id + '\');">' +
						'<i class="glyphicon glyphicon-pencil"></i>' +
						'</button>' +
					'</td>';
				}
				row += '</tr>';
				$("#transactionTable tbody").append(row);
				if (dp) {
					$("#post_"+result.id).datepicker({
						format: 'mm/dd/yyyy'
						,autoclose: true
						,todayHighlight: true
					}).on("changeDate", function(e) {
						// postTransaction(Number(e.target.dataset.tid), e.target.value);
						sendCommit(Number(e.target.dataset.tid), e.target.value)
						// console.log({id: Number(e.target.dataset.tid), value: e.target.value});
					});
				}
				balance -= result.amount;
			});
			// console.log(response.cTrans.length);
			if (response.cTrans.length >= transactionLimit) {
				var moreRow = '<tr id="moreRow" style="text-align:center;">'+
					'<td colspan="9">'+
						'<a onclick="getMoreTransactions('+balance+','+transactionLimit+','+transactionLimit+');">'+
							'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
						'</a>'+
					'</td>'+
				'</tr>';
				$("#transactionTable tbody").append(moreRow);
			}
			if (transId !== null) {
				transactionHighlight(transId);			
			}
			getBills();
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 404) {
				return false;
			} else {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}

	function getMoreTransactions(balance, offset, limit) {
		// setupTable();
		// if (offset === null) { offset = 0; }
		// if (limit === null) { limit = 10; }
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/transactions/more/account/"+$("#accountSelect").val()+"/"+offset+"/"+limit
		})
		.success(function(response) {
			$("#moreRow").remove();
			// console.log(response);
			// $("#transactionTable tbody").empty();
			// var balance = Number(response[0].Summary.balance);

			response.cTrans.forEach(function(result) {
				if (!result.hasOwnProperty("future")) {
					var row = '<tr id="'+result.id+'">'+
						'<td>';
						if (result.postDate !== null) {
							row += moment.utc(result.postDate).format("MM/DD/YYYY");
						}
							// '<input id="clr_'+result.id+'" type="checkbox" onclick="clearTransaction('+result.id+');"';
							// if (result.cleared === true) {
							// 	row += 'checked disabled';
							// }
							// row += '></input>'+
						row += '</td>'+
						'<td name="transactionDate">'+moment.utc(result.transactionDate).format("MM/DD/YYYY")+'</td>'+
						'<td name="payee">'+result.payee+'</td>';
						if (result.description !== null) {
							row += '<td name="description">';
							if (result.xfer !== null) {
								row += "[Transfer] ";
							}
							row += result.description+'</td>';
						} else {
							row += '<td name="description">';
							if (result.xfer !== null) {
								row += "[Transfer]";
							}
							row += '</td>';
						}
						if (result.checkNumber !== null) {
							row += '<td name="check">'+result.checkNumber+'</td>';
						} else {
							row += '<td name="check"></td>';
						}

						if (result.amount !== null) {
							if (result.amount > 0) {
								row += '<td name="plus">'+result.amount.toFixed(2)+'</td><td name="minus"></td>';
							} else {
								row += '<td name="plus"></td><td name="minus">'+(Number(result.amount) * -1).toFixed(2)+'</td>';
							}
						}
						if (result.Category !== null) {
							row += '<td name="category">'+result.Category.name+'</td>';
						} else {
							row += '<td name="category"></td>';
						}
						row += '<td name="balance">'+balance.toFixed(2)+'</td>';
						row += '<td>'+
							'<button class="btn btn-primary btn-xs" title="Edit Account" onclick="editTransaction(\''+result.id+'\');">'+
								'<i class="glyphicon glyphicon-pencil"></i>'+
							'</button>'+
						'</td>'+
					'</tr>';
					$("#transactionTable tbody").append(row);
					balance -= result.amount;
				}
			});
			if (response.cTrans.length >= transactionLimit) {
				var moreRow = '<tr id="moreRow" style="text-align:center;">'+
					'<td colspan="9">'+
						'<a onclick="getMoreTransactions('+balance+','+(offset+transactionLimit)+','+transactionLimit+');">'+
							'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
						'</a>'+
					'</td>'+
				'</tr>';
				$("#transactionTable tbody").append(moreRow);
			}
			// if (type !== null) {
			// 	transactionHighlight(transId);			
			// }
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 404) {
				$("#moreRow").remove();
				return false;
			} else {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}

	function getInvestments(id, tradeId, positionId, type) {
		setupTable();
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/investments/"+id
		})
		.success(function(response, textStatus, jqXHR) {
			$("#positionSection").empty();
			$("#transactionTable tbody").empty();
			if (jqXHR.status !== 204) {
				if (response.trades.length > 0) {
					var costs = {};
					response.trades.forEach(function(trade, index) {
						if (trade.description !== "Employer Match") {
							if (costs.hasOwnProperty(trade.ticker)) {
								costs[trade.ticker] = costs[trade.ticker] + (Number(trade.quantity) * Number(trade.price));
							} else {
								costs[trade.ticker] = (Number(trade.quantity) * Number(trade.price));
							}							
						}
						var row = '<tr class="transRow" id="trade_'+trade.id+'"';
						if (index >= transactionLimit) { row += ' style="display:none;"'; }
						row += '>'+
							'<td>'+moment.utc(trade.transactionDate).format("MM/DD/YYYY")+'</td>';
							row += '<td>'+trade.ticker+'</td>';
							if (trade.description !== null) {
								row += '<td>'+trade.description+'</td>';
							} else {
								row += '<td></td>';
							}
							row += '<td>'+trade.quantity.toFixed(3)+'</td>'+
							'<td>'+trade.price.toFixed(3)+'</td>'+
							'<td>'+(Number(trade.quantity) * Number(trade.price)).toFixed(2)+'</td>'+
						'</tr>';
						$("#transactionTable tbody").append(row);
					});
					if ($(".transRow:visible").length !== $(".transRow").length) {
						var moreRow = '<tr id="moreRow" style="text-align:center;">'+
							'<td colspan="6">'+
								'<a onclick="getMoreInvestments();">'+
									'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
								'</a>'+
							'</td>'+
						'</tr>';
					}
					$("#transactionTable tbody").append(moreRow);
					if (type !== null) {
						tradeHighlight(tradeId, "trade");			
					}
				}
				if (response.positions.length > 0) {
					var totalBasis = 0;
					var totalValue = 0;
					var table = '<div class="well"><table class="table table-condensed">'+
						'<thead>'+
							'<tr>'+
								'<th>Ticker</th>'+
								'<th>Name</th>'+
								'<th>Quantity</th>'+
								'<th>Current Price</th>'+
								'<th>Basis</th>'+
								'<th>Value</th>'+
								'<th>+/- $</th>'+
								'<th>+/- %</th>'+
							'</tr>'+
						'</thead>'+
						'<tbody>';
					response.positions.forEach(function(position) {
						if (position.ticker.toUpperCase() !== "CASH") {
							if (moment.utc(position.updatedAt).dayOfYear() !== moment.utc().dayOfYear()) {
								$.ajax({
									type: "GET"
									,url: "/api/v1/money/positions/update/"+position.ticker
								});
							}
						}
						var value = (Number(position.quantity) * Number(position.currentPrice));
						var cost = costs[position.ticker];
						var dollarChange = value - cost;
						var percentChange = (dollarChange / cost) * 100;
						totalBasis += cost;
						totalValue += value;
						row = '<tr id="position_'+position.id+'" class="'+position.ticker.toUpperCase()+' positionRow"';
						row += '>'+
							'<td name="ticker">'+position.ticker+'</td>'+
							'<td name="name">'+position.name+'</td>'+
							'<td name="quantity">'+position.quantity+'</td>'+
							'<td name="price">'+position.currentPrice+'</td>';
							if (typeof(cost) !== "undefined") {
								row += '<td name="basis">'+cost.toFixed(2)+'</td>';
							}
							row += '<td name="value">'+value.toFixed(2)+'</td>'+
							'<td name="dChange"';
							if (dollarChange > 0) {
								row += ' style="color:green;"'
							} else if (dollarChange < 0) {
								row += ' style="color:red;"'
							}
							row += '>'+dollarChange.toFixed(2)+'</td>'+
							'<td name="pChange"';
							if (percentChange > 0) {
								row += ' style="color:green;"'
							} else if (percentChange < 0) {
								row += ' style="color:red;"'
							}
							row += '>'+percentChange.toFixed(2)+'</td>'+
						'</tr>';
						table += row;
					});
					table += '<tr>'+
						'<td colspan="4"></td>'+
						'<td id="totalBasis" style="font-weight: bold;">'+totalBasis.toFixed(2)+'</td>'+
						'<td id="totalValue" style="font-weight: bold;">'+totalValue.toFixed(2)+'</td>'+
						'<td id="totalDChange" style="font-weight: bold;';
						var totalDollarChange = totalValue - totalBasis;
						if (totalDollarChange > 0) {
							table += 'color:green;'
						} else if (totalDollarChange < 0) {
							table += 'color:red;'
						}
						table += '">'+totalDollarChange.toFixed(2)+'</td>'+
						'<td id="totalPChange" style="font-weight: bold;';
						var totalPercentChange = (totalDollarChange / totalBasis) * 100;
						if (totalPercentChange > 0) {
							table += 'color:green;'
						} else if (totalPercentChange < 0) {
							table += 'color:red;'
						}
						table += '">'+totalPercentChange.toFixed(2)+'</td>'+
					'</tr></tbody></table></div>';
					$("#positionSection").html(table);
					if (type !== null) {
						tradeHighlight(positionId, "position");			
					}
				}
			}
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 404) {
				return false;
			} else {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}

	function getMoreInvestments() {
		$("#moreRow").remove();
		var visible = $(".transRow:visible").length;
		$("#transactionTable tbody tr:lt("+(visible + transactionLimit)+")").show();
		if ($(".transRow:visible").length !== $(".transRow").length) {
			var moreRow = '<tr id="moreRow" style="text-align:center;">'+
				'<td colspan="6">'+
					'<a onclick="getMoreInvestments('+$(".transRow:visible").length+');">'+
						'More&nbsp;<i class="glyphicon glyphicon-chevron-down"></i>'+
					'</a>'+
				'</td>'+
			'</tr>';
			$("#transactionTable tbody").append(moreRow);
		}
	}

	function addTransaction() {
		//Clear existing errors
		var errors = 0;
		$(".newTrans").removeClass("error");

		if (accountNames[$("#accountSelect").val()].type !== "Investment") {
			//Get values
			var nt = {
				account: $("#accountSelect").val()
			};
			if ($("#xferAccountId").val() !== "") {
				nt.xfer = $("#xferAccountId").val();
			}
			if ($("#newTDate").val() !== "") {
				nt.tDate = $("#newTDate").val();
			}
			if ($("#newPayee").val() !== "") {
				nt.payee = $("#newPayee").val();
			}
			if ($("#newDescription").val() !== "") {
				nt.description = $("#newDescription").val();
			}
			if ($("#newCheck").val() !== "") {
				nt.check = $("#newCheck").val();
			}
			if ($("#newDeposit").val() !== "") {
				nt.deposit = $("#newDeposit").val();
			}
			if ($("#newWithdrawl").val() !== "") {
				nt.withdrawl = $("#newWithdrawl").val();
			}
			if ($("#newCategory").val() !== "") {
				nt.category = $("#newCategory").val();
			}


			// //Validation
			//Check format of transaction date
			if (!nt.tDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
				$("#newTDate").addClass("error");
				errors++;
			}
			//Make sure something is in the payee field
			if (typeof nt.payee === "undefined") {
				$("#newPayee").addClass("error");
				errors++;
			}
			//Make sure check number is an integer
			if (typeof nt.check !== "undefined") {
				if (!nt.check.match(/^\d+$/)) {
					$("#newCheck").addClass("error");
					errors++;
				}
			}
			//Deposit format
			if (typeof nt.deposit !== "undefined") {
				if (!nt.deposit.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || nt.deposit.length > 16) {
					$("#newDeposit").addClass("error");
					errors++;
				}
			}
			//Withdrawl format
			if (typeof nt.withdrawl !== "undefined") {
				if (!nt.withdrawl.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || nt.withdrawl.length > 16) {
					$("#newWithdrawl").addClass("error");
					errors++;
				}
			}
			//Make sure deposit or withdrawl have a value, but not both
			if ((typeof nt.deposit !== "undefined" && typeof nt.withdrawl !== "undefined") || (typeof nt.deposit === "undefined" && typeof nt.withdrawl === "undefined")) {
				$("#newDeposit").addClass("error");
				$("#newWithdrawl").addClass("error");
				errors++;
			}

			if (errors === 0) {
				if (nt.hasOwnProperty("deposit")) {
					nt.amount = nt.deposit * 1;
					delete nt.deposit;
				} else if (nt.hasOwnProperty("withdrawl")) {
					nt.amount = nt.withdrawl * -1;
					delete nt.withdrawl;
				}
				// if (moment(new Date(nt.tDate)) > moment()) {
					$.ajax({
						type: "POST"
						,url: "/api/v1/money/futureTransactions"
						,data: nt
					}).success(function(response) {
						// Sumbit xfer transaction, if applicable
						if ($("#xferAccountId").val() !== "") {
							var xt = {
								account: $("#xferAccountId").val()
								,tDate: nt.tDate
								,payee: accountNames[nt.account].name
								,amount: (nt.amount * -1)
								,xfer: $("#accountSelect").val()
							};
							if (nt.hasOwnProperty("check")) {
								xt.check = nt.check;
							}
							if (nt.hasOwnProperty("description")) {
								xt.description = nt.description;
							}
							$.ajax({
								type: "POST"
								,url: "/api/v1/money/futureTransactions"
								,data: xt
							})
							.success(function(xferResponse) {
								resetAddTransaction();
								return false;
							})
							.error(function(jqXHR, textStatus, errorThrown) {
								$("#infoModalBody").html("There was a problem adding the transfer transaction.  Please add it manually.");
								$("#infoModal").modal("show");
								resetAddTransaction();
								return false;
							});
						} else {
							resetAddTransaction();
							return false;
						}
					}).error(function(jqXHR, textStatus, errorThrown) {
						$("#infoModalBody").html("There was a problem adding the transaction.  Please try again.");
						$("#infoModal").modal("show");
						return false;
					});
				// } else {
				// 	$.ajax({
				// 		type: "POST"
				// 		,url: "/api/v1/money/transactions"
				// 		,data: nt
				// 	})
				// 	.success(function(response) {
				// 		// Sumbit xfer transaction, if applicable
				// 		if ($("#xferAccountId").val() !== "") {
				// 			var xt = {
				// 				account: $("#xferAccountId").val()
				// 				,tDate: nt.tDate
				// 				,payee: accountNames[nt.account].name
				// 				,amount: (nt.amount * -1)
				// 				,xfer: $("#accountSelect").val()
				// 			};
				// 			if (nt.hasOwnProperty("check")) {
				// 				xt.check = nt.check;
				// 			}
				// 			if (nt.hasOwnProperty("description")) {
				// 				xt.description = nt.description;
				// 			}
				// 			$.ajax({
				// 				type: "POST"
				// 				,url: "/api/v1/money/transactions"
				// 				,data: xt
				// 			})
				// 			.success(function(xferResponse) {
				// 				resetAddTransaction();
				// 				return false;
				// 			})
				// 			.error(function(jqXHR, textStatus, errorThrown) {
				// 				$("#infoModalBody").html("There was a problem adding the transfer transaction.  Please add it manually.");
				// 				$("#infoModal").modal("show");
				// 				resetAddTransaction();
				// 				return false;
				// 			});
				// 		} else {
				// 			resetAddTransaction();
				// 			return false;
				// 		}
				// 	})
				// 	.error(function(jqXHR, textStatus, errorThrown) {
				// 		$("#infoModalBody").html("There was a problem adding the transaction.  Please try again.");
				// 		$("#infoModal").modal("show");
				// 		return false;
				// 	});
				// }
			}
		} else {
			var nt = {
				account: $("#accountSelect").val()
			};
			if ($("#newTDate").val() !== "") {
				nt.tDate = $("#newTDate").val();
			}
			if ($("#newPayee").val() !== "") {
				nt.ticker = $("#newPayee").val().toUpperCase();
			}
			if ($("#newDescription").val() !== "") {
				nt.description = $("#newDescription").val();
			}
			if ($("#newDeposit").val() !== "") {
				nt.quantity = $("#newDeposit").val();
			}
			if ($("#newWithdrawl").val() !== "") {
				nt.price = $("#newWithdrawl").val();
			}

			// //Validation
			//Check format of transaction date
			if (!nt.tDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
				$("#newTDate").addClass("error");
				errors++;
			}
			//Make sure something is in the ticker field and is less than 10 characters
			if (typeof nt.ticker === "undefined") {
				$("#newPayee").addClass("error");
				errors++;
			} else {
				if (nt.ticker.length > 15) {
					$("#newPayee").addClass("error");
					errors++;
				}
			}
			//Make sure quantity has a value
			if (typeof nt.quantity === "undefined") {
				$("#newDeposit").addClass("error");
				errors++;
			}
			//Make sure price has a value
			if (typeof nt.price === "undefined") {
				$("#newWithdrawl").addClass("error");
				errors++;
			}
			//Quantity format
			if (typeof nt.quantity !== "undefined") {
				if (!nt.quantity.match(/(?=.)^\$?-?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,3})?$/) || nt.quantity.length > 16) {
					$("#newDeposit").addClass("error");
					errors++;
				}
			}
			//Price format
			if (typeof nt.price !== "undefined") {
				if (!nt.price.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,3})?$/) || nt.price.length > 16) {
					$("#newWithdrawl").addClass("error");
					errors++;
				}
			}

			if (errors === 0) {
				$.ajax({
					type: "POST"
					,url: "/api/v1/money/trades"
					,data: nt
				})
				.success(function(response) {
					resetAddTransaction();
					return false;
				})
				.error(function(jqXHR, textStatus, errorThrown) {
					$("#infoModalBody").html("There was a problem adding the trade.  Please try again.");
					$("#infoModal").modal("show");
					return false;
				});
			}
		}
		return false;
	}

	function editTransaction(id) {
		$("#editTransactionId").val(id);
		$("#editPayee").val($("#"+id+" td[name=payee]").text().trim());
		$("#editDescription").val($("#"+id+" td[name=description]").text().trim());
		$("#editCheck").val($("#"+id+" td[name=check]").html());
		$("#editCategory").append("<option />");
		for (var i = 0; i < categoryArray.length; i++) {
			var html = '<option value="'+categoryArray[i].id+'"';
			if ($("#"+id+" td[name=category]").html() === categoryArray[i].name) {
				html += " selected";
			}
			html += '>'+categoryArray[i].name+'</option>';
			$("#editCategory").append(html);
		}
		$("#editTransactionModal").modal("show");
	}

	function modifyTransaction() {
		var id = $("#editTransactionId").val();

		//Clear existing errors
		var errors = 0;
		$(".editTrans").removeClass("error");

		//Get values
		var et = {};
		if ($("#editPayee").val() !== "") {
			et.payee = $("#editPayee").val().trim();
		}
		if ($("#editDescription").val() !== "") {
			et.description = $("#editDescription").val();
		}
		if ($("#editCheck").val() !== "") {
			et.check = $("#editCheck").val();
		}
		if ($("#editCategory").val() !== "") {
			et.category = $("#editCategory").val();
		}

		// //Validation
		//Make sure something is in the payee field
		if (typeof et.payee === "undefined") {
			$("#editPayee").addClass("error");
			errors++;
		}
		//Make sure check number is an integer
		if (typeof et.check !== "undefined") {
			if (!et.check.match(/^\d+$/)) {
				$("#editCheck").addClass("error");
				errors++;
			}
		}

		if (errors === 0) {
			$("#editTransactionModal").modal("hide");
			$.ajax({
				type: "PUT"
				,url: "/api/v1/money/transactions/"+id
				,data: et
			})
			.success(function(response) {
				// console.log("success!");
				return false;
			})
			.error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
		return false;
	}

	function commitFTransaction(id) {
		$("#commitFutureTransactionId").val(id);
		var html = '<h5>Are you sure you want to commit this transaction?</h5><br />'+
			'<table class="table table-condensed">'+
				'<thead>'+
					'<tr>'+
						'<th>Transaction Date</th>'+
						'<th>Payee</th>'+
						'<th>Description</th>'+
						'<th>Check #</th>'+
						'<th>Deposit</th>'+
						'<th>Withdrawl</th>'+
						'<th>Category</th>'+
					'</tr>'+
				'</thead>'+
				'<tbody>'+
					'<tr>'+
						'<td>'+$("#f_"+id+" td[name=transactionDate]").text()+'</td>'+
						'<td>'+$("#f_"+id+" td[name=payee]").text()+'</td>'+
						'<td>'+$("#f_"+id+" td[name=description]").text()+'</td>'+
						'<td>'+$("#f_"+id+" td[name=check]").html()+'</td>'+
						'<td>'+$("#f_"+id+" td[name=plus]").html()+'</td>'+
						'<td>'+$("#f_"+id+" td[name=minus]").html()+'</td>'+
						'<td>'+$("#f_"+id+" td[name=category]").html()+'</td>'+
					'</tr>'+
				'</tbody>'+
			'</table>';
		$("#commitModalBody").html(html);
		$("#commitFutureTransactionModal").modal("show");
	}

	function sendCommit(rid, pdate) {
		// console.log(rid);
		// console.log(pdate);
		// var id = $("#commitFutureTransactionId").val();
		// $("#commitFutureTransactionModal").modal("hide");
		$.ajax({
			type: "PUT"
			,url: "/api/v1/money/futureTransaction/commit/"+rid
			,data: {
				pDate: pdate
			}
		}).success(function(response) {
			// console.log(response);
		}).error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}

	function editFTransaction(id) {
		$("#editFutureTransactionId").val(id);
		$("#editFTDate").datepicker('setDate', new Date($("#f_"+id+" td[name=transactionDate]").text()));
		$("#editFPayee").val($("#f_"+id+" td[name=payee]").text().trim());
		$("#editFDescription").val($("#f_"+id+" td[name=description]").text().trim());
		$("#editFCheck").val($("#f_"+id+" td[name=check]").html());
		$("#editFDeposit").val($("#f_"+id+" td[name=plus]").html());
		$("#editFWithdrawl").val($("#f_"+id+" td[name=minus]").html());
		$("#editFCategory").append("<option />");
		for (var i = 0; i < categoryArray.length; i++) {
			var html = '<option value="'+categoryArray[i].id+'"';
			if ($("#f_"+id+" td[name=category]").html() === categoryArray[i].name) {
				html += " selected";
			}
			html += '>'+categoryArray[i].name+'</option>';
			$("#editFCategory").append(html);
		}
		$("#editFutureTransactionModal").modal("show");
	}

	function modifyFTransaction() {
		var id = $("#editFutureTransactionId").val();

		//Clear existing errors
		var errors = 0;
		$(".editFTrans").removeClass("error");

		//Get values
		var et = {};
		if ($("#editFTDate").val() !== "") {
			et.tDate = $("#editFTDate").val();
		}
		if ($("#editFPayee").val() !== "") {
			et.payee = $("#editFPayee").val();
		}
		if ($("#editFDescription").val() !== "") {
			et.description = $("#editFDescription").val();
		}
		if ($("#editFCheck").val() !== "") {
			et.check = $("#editFCheck").val();
		}
		if ($("#editFDeposit").val() !== "") {
			et.deposit = $("#editFDeposit").val();
		}
		if ($("#editFWithdrawl").val() !== "") {
			et.withdrawl = $("#editFWithdrawl").val();
		}
		if ($("#editFCategory").val() !== "") {
			et.category = $("#editFCategory").val();
		}

		// //Validation
		//Check format of transaction date
		if (!et.tDate.match(/^\d{2}([./-])\d{2}\1\d{4}$/)) {
			$("#editFTDate").addClass("error");
			errors++;
		}
		//Make sure something is in the payee field
		if (typeof et.payee === "undefined") {
			$("#editFPayee").addClass("error");
			errors++;
		}
		//Make sure check number is an integer
		if (typeof et.check !== "undefined") {
			if (!et.check.match(/^\d+$/)) {
				$("#editFCheck").addClass("error");
				errors++;
			}
		}
		//Deposit format
		if (typeof et.deposit !== "undefined") {
			if (!et.deposit.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || et.deposit.length > 16) {
				$("#editFDeposit").addClass("error");
				errors++;
			}
		}
		//Withdrawl format
		if (typeof et.withdrawl !== "undefined") {
			if (!et.withdrawl.match(/(?=.)^\$?(([1-9][0-9]{0,2}(,[0-9]{3})*)|[0-9]+)?(\.[0-9]{1,2})?$/) || et.withdrawl.length > 16) {
				$("#editFWithdrawl").addClass("error");
				errors++;
			}
		}
		//Make sure deposit or withdrawl have a value, but not both
		if ((typeof et.deposit !== "undefined" && typeof et.withdrawl !== "undefined") || (typeof et.deposit === "undefined" && typeof et.withdrawl === "undefined")) {
			$("#editFDeposit").addClass("error");
			$("#editFWithdrawl").addClass("error");
			errors++;
		}

		if (errors === 0) {
			$("#editFutureTransactionModal").modal("hide");
			if (et.hasOwnProperty("deposit")) {
				et.amount = et.deposit * 1;
				delete et.deposit;
			} else if (et.hasOwnProperty("withdrawl")) {
				et.amount = et.withdrawl * -1;
				delete et.withdrawl;
			}
			$.ajax({
				type: "PUT"
				,url: "/api/v1/money/futureTransactions/"+id
				,data: et
			})
			.success(function(response) {
				// console.log("success!");
				return false;
			})
			.error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
		return false;
	}

	function deleteTransaction(id) {
		var name = $("#f_"+id+" td[name=payee]").html();
		$("#deleteTransactionId").val(id);
		$("#deleteModalBody").html("<strong>Are you sure you want to delete the transaction for "+name+"?</strong>");
		$("#deleteTransactionModal").modal("show");
		return false;
	}

	function removeTransaction() {
		var id = $("#deleteTransactionId").val();
		$("#deleteTransactionModal").modal("hide");
		if (typeof id !== "undefined" && id.length > 0) {
			$.ajax({
				type: "DELETE"
				,url: "/api/v1/money/futureTransactions/"+id
			})
			.success(function() {
				return false;
			})
			.error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
		return false;
	}