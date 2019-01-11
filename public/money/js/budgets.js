
let categoryArray = [];
let categoryLookup = {};
// var socket = io();

$(document).ready(function() {
	$("body").show();

	$("#yearSelector").html("Current Year ("+moment().startOf("year").format("MMM D, YYYY")+" - "+moment().endOf("year").format("MMM D, YYYY")+")");
	$("#monthSelector").html("Current Month ("+moment().startOf("month").format("MMM D, YYYY")+" - "+moment().endOf("month").format("MMM D, YYYY")+")");
	$("#weekSelector").html("Current Week ("+moment().startOf("week").format("MMM D, YYYY")+" - "+moment().endOf("week").format("MMM D, YYYY")+")");

	getBudgets(null);
});

// FIELD EVENTS
	$("#infoModalBody").on("hidden.bs.modal", function() {
		$("#infoModalTitle").empty();
		$("#infoModalBody").empty();
	});

	$("#budgetSelect").change(function() {
		$("#budgetBody").empty();
		// getPeriods();
		buildBudget();
	});

	$("#dateSelect").change(function(e) {
		// console.log(e.currentTarget.value);
		switch (e.currentTarget.value) {
			case "c":
				$("#dateFields").show();
				break;
			case "y":
				$("#dateFields").hide();
				// console.log(moment().startOf("year").toDate());
				// console.log(moment().endOf("year").toDate());
				$("#startDate").val(moment().startOf("year").format("MMM DD, YYYY"));
				$("#endDate").val(moment().endOf("year").format("MMM DD, YYYY"));
				$("#endDate").trigger("changeDate");
				break;
			case "m":
				$("#dateFields").hide();
				// console.log(moment().startOf("month").toDate());
				// console.log(moment().endOf("month").toDate());
				$("#startDate").val(moment().startOf("month").format("MMM DD, YYYY"));
				$("#endDate").val(moment().endOf("month").format("MMM DD, YYYY"));
				$("#endDate").trigger("changeDate");
				break;
			case "w":
				$("#dateFields").hide();
				// console.log(moment().startOf("week").toDate());
				// console.log(moment().endOf("week").toDate());
				$("#startDate").val(moment().startOf("week").format("MMM DD, YYYY"));
				$("#endDate").val(moment().endOf("week").format("MMM DD, YYYY"));
				$("#endDate").trigger("changeDate");
				break;
			default:
				$("#dateFields").hide();
				$("#startDate").val(moment().startOf("month").format("MMM DD, YYYY"));
				$("#endDate").val(moment().endOf("month").format("MMM DD, YYYY"));
				$("#endDate").trigger("changeDate");
		}
	});

	// BUDGET
		// CREATE
			$("#createBudgetBtn").click(function() {
				categoryArray.forEach(function(category) {
					var row = '<tr>'+
						'<td style="padding-top:5px;padding-right:10px;">'+category.name+'</td>'+
						'<td style="padding-top:5px;padding-right:10px;">'+
							'<input id="'+category.id+'" type="number" min="0" max="1000000" step="1" class="form-control currency budgetAmount" />'+
						'</td>'+
						'<td style="padding-top:5px;">'+
							'<select id="time_'+category.id+'" class="form-control">'+
								'<option value="1">Daily</option>'+
								'<option value="7">Weekly (7 days)</option>'+
								'<option value="30" selected>Monthly (30 days)</option>'+
								'<option value="365">Yearly (365 days)</option>'+
							'</select>'+
						'</td>'+
					'</tr>';
					if (category.expense === true) {
						$("#newBudExpenses tbody").append(row);
					} else {
						$("#newBudIncomes tbody").append(row);
					}
				});
				$("#createBudgetModal").modal("show");
			});

			$("#createBudgetButton").click(function(){
				var errorCount = 0;
				var budgetName = $("#newBudName").val();
				if (typeof budgetName !== "undefined" && budgetName.length > 0) {
					$("#newBudName").css("background-color", "#fff");
				} else {
					errorCount++;
					$("#newBudName").css("background-color", "#f2dede");
				}

				if (errorCount === 0) {
					var data = {};
					$.each($(".budgetAmount"), function(index, obj) {
						if (obj.value !== "") {
							data[obj.id] = {value: obj.value, time: $("#time_"+obj.id).val()};
							// data[obj.id] = obj.value;				
						}
					});
					// console.log(data);
					var dataString = JSON.stringify(data);
					addBudget(budgetName, dataString);
				}
			});

			$("#createBudgetModal").on("shown.bs.modal", function() {
				$("#newBudName").focus();
			});

			$("#createBudgetModal").on("hidden.bs.modal", function() {
				$("#newBudName").val("");
				$("#newBudExpenses tbody").empty();
				$("#newBudIncomes tbody").empty();
			});
			// EDIT
				$("#editBudgetModal").on("shown.bs.modal", function() {
					$("#editBudName").focus();
				});

				$("#editBudgetModal").on("hidden.bs.modal", function() {
					$("#editBudName").val("");
					$("#editBudExpenses").empty();
					$("#editBudIncomes").empty();
					$("#editBudgetButton").off("click");
				});

	// CATEGORY
		// CREATE
			$("#addCategoryBtn").click(function() {
				$("#addCategoryModal").modal("show");
			});

			$("#addCategoryButton").click(function() {
				var errorCount = 0;
				var categoryName = $("#newCatName").val();
				if (typeof categoryName !== "undefined" && categoryName.length > 0) {
					$("#newCatName").css("background-color", "#fff");
				} else {
					errorCount++;
					$("#newCatName").css("background-color", "#f2dede");
				}

				if (errorCount === 0) {
					var exp = true;
					if ($("#newCatIncomeLabel").hasClass("active")) {
						exp = false;
					}
					addCategory(null, $("#newCatName").val(), exp);
				}
			});

			$("#addCategoryModal").on("shown.bs.modal", function() {
				$("#newCatName").focus();
			});

			$("#addCategoryModal").on("hidden.bs.modal", function() {
				$("#newCatName").val("");
				$("#newCatExpenseLabel").addClass("active");
				$("#newCatIncomeLabel").removeClass("active");
			});
		// EDIT
			$("#editCategoryModal").on("shown.bs.modal", function() {
				$("#editCatName").focus();
			});

			$("#editCategoryModal").on("hidden.bs.modal", function() {
				$("#editCatName").val("");
				$("#editCatExpenseLabel").removeClass("active");
				$("#editCatIncomeLabel").removeClass("active");
				$("#editCategoryButton").off("click");
			});
		// DELETE
			$("#deleteCategoryModal").on("hidden.bs.modal", function() {
				$("#deleteCategoryModalBody").empty();
				$("#deleteCategoryButton").off("click");
			});

// SOCKET IO

	socket.on("categoryAdded", function(category) {
		getCategories();
	});

	socket.on("categoryUpdated", function(category) {
		getBudgets(null);
	});

	socket.on("categoryDeleted", function(id) {
		getBudgets(null);
	});

	socket.on("budgetAdded", function(budget) {
		getBudgets(budget.id);
	});

	socket.on("budgetUpdated", function(id) {
		if (id == $("#budgetSelect").val()) {
			buildBudget();
		}
	});

	socket.on("budgetDeleted", function() {
		getBudgets(null);
	});

// FUNCTIONS

	function favoriteBudget() {
		var selectedBudget = $("#budgetSelect").val();
		$.ajax({
			type: "PUT"
			,url: "/api/v1/money/budgets/favorite/"+selectedBudget
		}).success(function(response) {
			$("#favBudgetIcon").removeClass("glyphicon-star-empty").addClass("glyphicon-star");
			$("#favBudget").prop("disabled", true);
		});
	}

	function getBudgets(id) {
		getCategories().then(function() {
			$("#budgetSelect").empty();
			$("#budgetBody").empty();
			$.ajax({
				type: "GET"
				,url: "/api/v1/money/budgets"
			}).success(function(results) {
				results.forEach(function(budget) {
					let option = '<option value="'+budget.id+'"';
					if (id !== null) {
						if (id === budget.id) {
							option += ' selected';
						}
					} else {
						if (budget.favorite === true) {
							option += ' selected';
						}
					}
					option += '>'+budget.name+'</option>';
					$("#budgetSelect").append(option);
				});
				if ($("#budgetSelect").val() !== null) {
					var html = '<div class="col-md-6">'+
						'<div class="form-group">'+
							'<input type="text" class="datepicker form-control" id="startDate" value="'+moment().startOf("month").format("MMM DD, YYYY")+'" />'+
							'<label>From</label>'+
						'</div>'+
					'</div>'+
					'<div class="col-md-6">'+
						'<div class="form-group">'+
							'<input type="text" class="datepicker form-control" id="endDate" value="'+moment().endOf("month").format("MMM DD, YYYY")+'" />'+
							'<label>To</label>'+
						'</div>'+
					'</div>';
					$("#dateFields").html(html);
					$("#startDate").datepicker({format: 'M dd, yyyy', endDate: moment().endOf("month").toDate(), title: "Start Date", autoclose: true}).on("changeDate", function(e) {
						$("#endDate").data("datepicker").setStartDate(e.date);
						buildBudget();
					});
					$("#endDate").datepicker({format: 'M dd, yyyy', startDate: moment().startOf("month").toDate(), title: "End Date", autoclose: true}).on("changeDate", function(e) {
						$("#startDate").data("datepicker").setEndDate(e.date);
						buildBudget();
					});
					buildBudget();
					// getPeriods();
				}
			}).error(function(jqXHR/*, textStatus, errorThrown*/) {
				if (jqXHR.status === 404) {
					return false;
				} else {
					$("#infoModalBody").html("There was a problem.  Please try again.");
					$("#infoModal").modal("show");
				}
			});
		}).catch(function() {
			$("#budgetSelect").empty();
		$("#budgetBody").empty();
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/budgets"
		}).success(function(results) {
			results.forEach(function(budget) {
				let option = '<option value="'+budget.id+'"';
				if (id === budget.id) {
					option += ' selected';
				}
				option += '>'+budget.name+'</option>';
				$("#budgetSelect").append(option);
			});
			if ($("#budgetSelect").val() !== null) {
				let html = '<div class="col-md-6">'+
					'<input type="text" class="datepicker form-control" id="startDate" value="'+moment().startOf("month").format("MMM DD, YYYY")+'" />'+
				'</div>'+
				'<div class="col-md-6">'+
					'<input type="text" class="datepicker form-control" id="endDate" value="'+moment().endOf("month").format("MMM DD, YYYY")+'" />'+
				'</div>';
				$("#dateFields").html(html);
				$("#startDate").datepicker({format: 'M dd, yyyy', endDate: moment().endOf("month").toDate(), title: "Start Date", autoclose: true}).on("changeDate", function(e) {
					$("#endDate").data("datepicker").setStartDate(e.date);
					buildBudget();
				});
				$("#endDate").datepicker({format: 'M dd, yyyy', startDate: moment().startOf("month").toDate(), title: "End Date", autoclose: true}).on("changeDate", function(e) {
					$("#startDate").data("datepicker").setEndDate(e.date);
					buildBudget();
				});
				buildBudget();
			}
		}).error(function(jqXHR/*, textStatus, errorThrown*/) {
			if (jqXHR.status === 404) {
				return false;
			} else {
				$("#infoModalBody").html("There was a problem.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	});
	}

	function getPeriods() {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/unique/summaries"
		})
		.success(function(results) {
			$("#periodSelect").empty();
			var nowStamp = moment().format("x");
			results.forEach(function(period) {
				if (period.start !== null) {
					var startStamp = moment.utc(period.start).format("x");
					var startString = moment.utc(period.start).format("MMM D, YYYY")
					var endStamp = moment.utc(period.end).format("x");
					var endString = moment.utc(period.end).format("MMM D, YYYY");
					if (nowStamp >= startStamp && nowStamp <= endStamp) {
						$("#periodSelect").append('<option value="'+period.summaries.join("x")+'" selected>'+startString+' - '+endString+'</option>');
					} else {
						$("#periodSelect").append('<option value="'+period.summaries.join("x")+'">'+startString+' - '+endString+'</option>');
					}
				}
			});
			if ($("#periodSelect").val() !== null) {
				buildBudget();
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

	function buildBudget() {
		var budgetDays = (moment($("#endDate").datepicker("getDate")).diff(moment($("#startDate").datepicker("getDate")), "days") + 1);
		$.ajax({
			type: "GET"
			// ,url: "/api/v1/money/budgets/full/1/"+$("#periodSelect").val()
			,url: "/api/v1/money/budgets/full/"+$("#budgetSelect").val()+"/"+moment($("#startDate").datepicker("getUTCDate")).format('X')+'/'+moment($("#endDate").datepicker("getUTCDate")).format('X')
		})
		.success(function(data) {
			// console.log(data);
			// console.log(budgetDays);
			var totalExpense = 0;
			var totalIncome = 0;
			var budgetedExpense = 0;
			var budgetedIncome = 0;
			var budget = JSON.parse(data.budget.amounts);
			var head = '<div class="col-md-12">'+
				'<h1 id="budgetName" style="display:inline-block;margin-right:10px;">'+
					data.budget.name+
				'</h1>'+
				'<button class="btn btn-default btn-sm" id="favBudget" title="Default Budget" style="margin-right:5px;"';;
					if (data.budget.favorite === true) {
						head += ' disabled><i id="favBudgetIcon" class="fa fa-star text-warning"></i>';
					} else {
						head += ' onclick="favoriteBudget();"><i id="favBudgetIcon" class="fa fa-star-empty text-warning"></i>';
					}
				head += '</button>'+
				'<button class="btn btn-primary btn-sm" id="budgetEditBtn" title="Edit Budget" style="margin-right:5px;">'+
					'<i class="fa fa-pencil"></i>'+
				'</button>'+
				'<button class="btn btn-danger btn-sm" id="budgetDeleteBtn" title="Delete Budget">'+
					'<i class="fa fa-trash"></i>'+
				'</button>'+
			'</div>';
			var startTable = '<div class="col-md-12"><table class="table table-striped"><thead><th class="col-md-2"></th><th class="col-md-1"></th><th class="col-md-8"></th><th class="col-md-1"></th></thead><tbody>';
			var expenses = '<tr><td colspan="4"><strong>Expenses</strong></td></tr>';
			var incomes = '<tr><td colspan="4"><strong>Incomes</strong></td></tr>';

			categoryArray.forEach(function(category) {
				if (category.id != 1) {
                    if (budget.hasOwnProperty(category.id)) {
                        var calcWidth = 0;
                        var barWidth = 0;
                        var thisBudget = budget[category.id.toString()];
                        var budgetRatio = budgetDays / Number(thisBudget.time);
                        var adjustedBudget = Math.ceil(thisBudget.value * budgetRatio);
                        // console.log(adjustedBudget);
                        // var thisBudget = _.where(budget, {id: category.id.toString()});
                        // console.log(thisBudget);
                        if (category.expense === true) {
                            totalExpense += (Number(data.values[category.id]) * -1);
                            budgetedExpense += adjustedBudget;
                            calcWidth = Math.floor(((Number(data.values[category.id]) * -1).toFixed(2) / adjustedBudget.toFixed(2)) * 100);
                            // calcWidth = Math.floor(((Number(data.values[category.id]) * -1).toFixed(2) / Number(budget[category.id].value).toFixed(2)) * 100);
                            // console.log(calcWidth);
                            if (calcWidth > 100) {
                                barWidth = 100;
                            } else {
                                barWidth = calcWidth;
                            }
                            var barColorClass = "progress-bar-success";
                            if (calcWidth > 100) {
                                barColorClass = "progress-bar-danger";
                            } else if (calcWidth > 70) {
                                barColorClass = "progress-bar-warning";
                            }
                            expenses += '<tr>' +
                                '<td><a onclick="categoryTable(' + category.id + ')">' + category.name + '</a></td>' +
                                '<td>$' + (Number(data.values[category.id]) * -1).toFixed(2) + '</td>' +
                                '<td>' +
                                '<div class="progress">' +
                                '<div class="progress-bar ' + barColorClass + '" role="progressbar" aria-valuenow="' + Number(data.values[category.id]).toFixed(2) + '" aria-valuemin="0" aria-valuemax="' + Number(budget[category.id]).toFixed(2) + '" style="width:' + barWidth + '%;">' +
                                calcWidth + "%" +
                                '</div>' +
                                '</div>' +
                                '</td>' +
                                '<td>$' + adjustedBudget.toFixed(2) + '</td>' +
                                '</tr>';
                        } else {
                            totalIncome += Number(data.values[category.id]);
                            budgetedIncome += adjustedBudget;
                            calcWidth = Math.floor((Number(data.values[category.id]).toFixed(2) / adjustedBudget.toFixed(2)) * 100);
                            if (calcWidth > 100) {
                                barWidth = 100;
                            } else {
                                barWidth = calcWidth;
                            }
                            var barColorClass = "progress-bar-danger";
                            if (calcWidth > 100) {
                                barColorClass = "progress-bar-success";
                            } else if (calcWidth > 70) {
                                barColorClass = "progress-bar-warning";
                            }
                            incomes += '<tr>' +
                                '<td><a onclick="categoryTable(' + category.id + ')">' + category.name + '</a></td>' +
                                '<td>$' + Number(data.values[category.id]).toFixed(2) + '</td>' +
                                '<td>' +
                                '<div class="progress">' +
                                '<div class="progress-bar ' + barColorClass + '" role="progressbar" aria-valuenow="' + Number(data.values[category.id]).toFixed(2) + '" aria-valuemin="0" aria-valuemax="' + Number(budget[category.id]).toFixed(2) + '" style="width:' + barWidth + '%;">' +
                                calcWidth + "%" +
                                '</div>' +
                                '</div>' +
                                '</td>' +
                                '<td>$' + adjustedBudget.toFixed(2) + '</td>' +
                                '</tr>';
                        }
                    }
                }
			});

			var budgetBar = '<div class="col-md-6" style="font-size:0.7em;">Budgeted&nbsp;&#43;&#47;&#45;<br /><div class="progress">';
			var largestB = 0;
			if (budgetedIncome >= budgetedExpense) {
				largestB = budgetedIncome;
			} else {
				largestB = budgetedExpense;
			}
			var diffB = budgetedIncome - budgetedExpense;
			if (diffB > 0) {
				var plusWidth = Math.floor((diffB / largestB) * 100);
				budgetBar += '<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>'+
					'<div class="progress-bar progress-bar-success" role="progressbar" style="font-size:0.9em;width:'+plusWidth+'%;min-width:10%;">'+
						"+$"+diffB.toFixed(2)+
					'</div>';
			} else if (diffB < 0) {
				var minusWidth = Math.floor((Math.abs(diffB) / largestB) * 100);
				budgetBar += '<div class="progress-bar" role="progressbar" style="width:'+(50 - minusWidth)+'%;max-width:40%;background:transparent;"></div>'+
					'<div class="progress-bar progress-bar-danger" role="progressbar" style="font-size:0.9em;width:'+minusWidth+'%;min-width:10%;">'+
						"-$"+Math.abs(diffB.toFixed(2))+
					'</div>'+
					'<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>';
			} else {
				budgetBar += '<div class="progress-bar" role="progressbar" style="width:100%;font-size:0.9em;">Right On!</div>';
			}
			budgetBar += '</div></div>';

			var statusBar = '<div class="col-md-6" style="font-size:0.7em;">Current&nbsp;&#43;&#47;&#45;<br /><div class="progress">';
			var largest = 0;
			if (totalIncome >= totalExpense) {
				largest = totalIncome;
			} else {
				largest = totalExpense;
			}
			var diff = totalIncome - totalExpense;
			if (diff > 0) {
				var plusWidth = Math.floor((diff / largest) * 100);
				statusBar += '<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>'+
					'<div class="progress-bar progress-bar-success" role="progressbar" style="font-size:0.9em;width:'+plusWidth+'%;min-width:10%;">'+
						"+$"+diff.toFixed(2)+
					'</div>';
			} else if(diff < 0) {
				var minusWidth = Math.floor((Math.abs(diff) / largest) * 100);
				statusBar += '<div class="progress-bar" role="progressbar" style="max-width:40%;width:'+(50 - minusWidth)+'%;background:transparent;"></div>'+
					'<div class="progress-bar progress-bar-danger" role="progressbar" style="font-size:0.9em;width:'+minusWidth+'%;min-width:10%;">'+
						"-$"+Math.abs(diff.toFixed(2))+
					'</div>'+
					'<div class="progress-bar" role="progressbar" style="width:50%;background:transparent;"></div>';
			} else {
				statusBar += '<div class="progress-bar" role="progressbar" style="font-size:0.9em;width:100%;">Right On!</div>';
			}
			statusBar += '</div></div>';
			var endTable = '</tbody></table></div>';
			var page = head+'<div class="col-md-12">'+budgetBar+statusBar+"</div>"+startTable+expenses+incomes+endTable;
			$("#budgetBody").html(page);
			$("#budgetEditBtn").click(function() {
				editBudget(data.budget);
			});
			$("#budgetDeleteBtn").click(function() {
				deleteBudget($("#budgetSelect").val());
			});
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}

	function categoryTable(id) {
		$.ajax({
			type: "GET"
			,url: "/api/v1/money/transactions/category/"+id+"/"+moment($("#startDate").datepicker("getUTCDate")).format('X')+'/'+moment($("#endDate").datepicker("getUTCDate")).format('X')
		})
		.success(function(data) {
			console.log(data);
			var table = '<table class="table-striped table-condensed" style="font-size:0.9em;">'+
				'<thead>'+
					'<tr>'+
						'<th>Date</th>'+
						'<th>Payee</th>'+
						'<th>Description</th>'+
						'<th>Amount</th>'+
						'<th>Account</th>'+
					'</tr>'+
				'</thead>'+
				'<tbody>';
			data.forEach(function(trans) {
				table += '<tr>'+
					'<td>'+moment.utc(trans.transactionDate).format("MMM DD, YYYY")+'</td>'+
					'<td>'+trans.payee+'</td>'+
					'<td>';
					if (trans.description) {
						table += trans.description;
					}
					table += '</td>'+
					'<td>'+Number(trans.amount).toFixed(2)+'</td>'+
					// '<td>'+Math.abs(Number(trans.amount)).toFixed(2)+'</td>'+
					'<td>'+trans.Summary.Account.name+'</td>'+
				'</tr>';
			});
			table += '</tbody></table>';
			$("#infoModalTitle").html(data[0].Category.name);
			$("#infoModalBody").html(table);
			$("#infoModal").modal("show");
		}).error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem.  Please try again.");
			$("#infoModal").modal("show");
		});
	}

	function getCategories() {
		return new Promise(function(resolve, reject) {
			$.ajax({
				type: "GET"
				,url: "/api/v1/money/categories"
			})
			.success(function(categories) {
				$("#categoryBody").empty();
				var tableHead = '<table class="table table-striped"><thead><th class="col-md-8"></th><th class="col-md-4"></th></thead>';
				var expenses = '<tr><td colspan="2"><strong>Expenses</strong></td></tr>';
				var incomes = '<tr><td colspan="2"><strong>Incomes</strong></td></tr>';
				categoryArray = categories;
				for (var i = 0, len = categoryArray.length; i < len; i++) {
					if (categories[i].expense === true) {
						expenses += '<tr>'+
							'<td>'+categories[i].name+'</td>'+
							'<td>'+
								'<button class="btn btn-primary btn-sm" onclick="editCategory(\''+categories[i].id+'\');" style="margin-right:5px;"><i class="fa fa-pencil"></i></button>'+
								'<button class="btn btn-danger btn-sm" onclick="deleteCategory(\''+categories[i].id+'\');"><i class="fa fa-trash"></i></button>'+
							'</td>'+
						'</tr>';
					} else {
						incomes += '<tr>'+
							'<td>'+categories[i].name+'</td>'+
							'<td>'+
								'<button class="btn btn-primary btn-sm" onclick="editCategory(\''+categories[i].id+'\');" style="margin-right:5px;"><i class="fa fa-pencil"></i></button>'+
								'<button class="btn btn-danger btn-sm" onclick="deleteCategory(\''+categories[i].id+'\');"><i class="fa fa-trash"></i></button>'+
							'</td>'+
						'</tr>';
					}
				    categoryLookup[categoryArray[i].id] = categoryArray[i];
				}
				var tableEnd = '</table>';
				var content = tableHead+expenses+incomes+tableEnd;
				$("#categoryBody").append(content);
				resolve();
			})
			.error(function(jqXHR, textStatus, errorThrown) {
				$("#categoryBody").empty();
				categoryArray = [];
				categoryLookup = {};
				if (jqXHR.status === 404) {
					reject();
				} else {
					$("#infoModalBody").html("There was a problem.  Please try again.");
					$("#infoModal").modal("show");
					reject(jqXHR);
				}
			});
		});
	}

	function addCategory(user, name, expense) {
		$.ajax({
			type: "POST"
			,url: "/api/v1/money/categories"
			,data: {
				user: user
				,name: name
				,expense: expense
			}
		})
		.success(function() {
			$("#addCategoryModal").modal("hide");
			return false;
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem creating the Category.  Please try again.");
			$("#infoModal").modal("show");
		});
		return false;
	}

	function editCategory(id) {
		$("#editCatName").val(categoryLookup[id].name);
		if (categoryLookup[id].expense === true) {
			$("#editCatExpenseLabel").addClass("active");
		} else {
			$("#editCatIncomeLabel").addClass("active");
		}
		$("#editCategoryButton").click(function() {
			modifyCategory(id);
		});
		$("#editCategoryModal").modal("show");
	}

	function modifyCategory(id) {
		var errorCount = 0;
		var categoryName = $("#editCatName").val();
		if (typeof categoryName !== "undefined" && categoryName.length > 0) {
			$("#editCatName").css("background-color", "#fff");
		} else {
			errorCount++;
			$("#editCatName").css("background-color", "#f2dede");
		}

		if (errorCount === 0) {
			var exp = true;
			if ($("#editCatIncomeLabel").hasClass("active")) {
				exp = false;
			}
			$.ajax({
				type: "PUT"
				,url: "/api/v1/money/categories/"+id
				,data: {
					name: categoryName
					,expense: exp
				}
			})
			.success(function(category) {
				$("#editCategoryModal").modal("hide");
				return false;
			})
			.error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem updating the Category.  Please try again.");
				$("#infoModal").modal("show");
			});
		}
	}

	function deleteCategory(id) {
		var name = categoryLookup[id].name;
		$("#deleteCategoryModalBody").html("<strong>Are you sure you want to delete the Category "+name+"?</strong><br />"+name+" will also be removed from all Budgets!");
		$("#deleteCategoryButton").click(function() {
			removeCategory(id);
		});
		$("#deleteCategoryModal").modal("show");
	}

	function removeCategory(id) {
		$("#deleteCategoryModal").modal("hide");
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/money/categories/"+id
		})
		.success(function() {
			return false;
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status === 404) {
				return false;
			} else {
				$("#infoModalBody").html("There was a problem deleting the Category.  Please try again.");
				$("#infoModal").modal("show");
			}
		});
	}

	function addBudget(name, amounts) {
		$.ajax({
			type: "POST"
			,url: "/api/v1/money/budgets"
			,data: {
				name: name
				,amounts: amounts
			}
		})
		.success(function(response) {
			$("#createBudgetModal").modal("hide");
			return false;
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem creating the Budget.  Please try again.");
			$("#infoModal").modal("show");
		});
	}

	function editBudget(budget) {
		$("#editBudName").val(budget.name);
		var amounts = JSON.parse(budget.amounts);
		categoryArray.forEach(function(category) {
			var setAmount;
			var setTime = "-1";
			if (amounts.hasOwnProperty(category.id)) {
				setAmount = amounts[category.id].value;
				setTime = amounts[category.id].time;
			}
			var row = '<tr>'+
				'<td style="padding-top:5px;padding-right:10px;">'+category.name+'</td>'+
				'<td style="padding-top:5px;padding-right:10px;">'+
					'<input id="'+category.id+'" type="number" min="0" max="1000000" step="1" class="form-control currency budgetAmount" value="'+setAmount+'" />'+
				'</td>'+
				'<td style="padding-top:5px;">'+
					'<select id="time_'+category.id+'" class="form-control">'+
						'<option value="1"';
						if (setTime === "1") {
							row += ' selected';
						}
						row += '>Daily</option>'+
						'<option value="7"';
						if (setTime === "7") {
							row += ' selected';
						}
						row += '>Weekly (7 days)</option>'+
						'<option value="30"';
						if (setTime === "30" || setTime === "-1") {
							row += ' selected';
						}
						row += '>Monthly (30 days)</option>'+
						'<option value="365"';
						if (setTime === "365") {
							row += ' selected';
						}
						row += '>Yearly (365 days)</option>'+
					'</select>'+
				'</td>'+
			'</tr>';
			if (category.expense === true) {
				$("#editBudExpenses").append(row);
			} else {
				$("#editBudIncomes").append(row);
			}
		});
		$("#editBudgetButton").click(function() {
			modifyBudget(budget.id);
		});
		$("#editBudgetModal").modal("show");
	}

	function modifyBudget(id) {
		// console.log("clicked");
		var errorCount = 0;
		var budgetName = $("#editBudName").val();
		if (typeof budgetName !== "undefined" && budgetName.length > 0) {
			$("#editBudName").css("background-color", "#fff");
		} else {
			errorCount++;
			$("#editBudName").css("background-color", "#f2dede");
		}

		if (errorCount === 0) {
			// console.log("going");
			var data = {};
			$.each($(".budgetAmount"), function(index, obj) {
				if (obj.value !== "") {
					// data[obj.id] = obj.value;				
					data[obj.id] = {value: obj.value, time: $("#time_"+obj.id).val()};
				}
			});
			var dataString = JSON.stringify(data);
			// console.log(dataString);
			$.ajax({
				type: "PUT"
				,url: "/api/v1/money/budgets/"+id
				,data: {
					name: budgetName
					,amounts: dataString
				}
			})
			.success(function(budget) {
				$("#editBudgetModal").modal("hide");
				return false;
			})
			.error(function(jqXHR, textStatus, errorThrown) {
				$("#infoModalBody").html("There was a problem updating "+budgetName+".  Please try again.");
				$("#infoModal").modal("show");
			});
		}
	}

	function deleteBudget(id) {
		var name = $("#budgetName").html();
		$("#deleteModalBody").html("<strong>Are you sure you want to delete the Budget "+name+"?</strong>");
		$("#deleteBudgetButton").click(function() {
			removeBudget(id);
		});
		$("#deleteBudgetModal").modal("show");
		return false;
	}

	function removeBudget(id) {
		$("#deleteBudgetModal").modal("hide");
		$.ajax({
			type: "DELETE"
			,url: "/api/v1/money/budgets/"+id
		})
		.success(function() {
			return false;
		})
		.error(function(jqXHR, textStatus, errorThrown) {
			$("#infoModalBody").html("There was a problem deleting "+name+".  Please try again.");
			$("#infoModal").modal("show");
		});
		// console.log("remove:"+id);
	}