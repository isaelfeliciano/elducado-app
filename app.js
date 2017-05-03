'use strict'

var MongoClient = require('mongodb').MongoClient;
var mongoDbObj;
var assert = require('assert');
var ls = localStorage;


MongoClient.connect('mongodb://127.0.0.1:27017/elducadodb', function(err, db) {
	if (err) {
		console.log(err); // LOG THIS
	} else {
		console.log("Connected to DB"); // LOG THIS
		mongoDbObj = {db: db,
			residents: db.collection("residents"),
			invoices: db.collection("invoices")
		}
	}
});

// Flash Message
function flashMessage(msg, type){
	if(hideFlashMessage)
		clearTimeout(hideFlashMessage);
	$('.flashmessage').removeClass('notVisible', 'flashmessage--success', 'flashmessage--danger').addClass(type)
	.html('<span>'+msg+'</span>');
	var hideFlashMessage = setTimeout(function(){
		$('.flashmessage').addClass('notVisible').
		html('');
	}, 3000);
}
// Flash Message

$("#btn-search").on("click", function(e) {
	$('#search-list').html('');
	e.preventDefault();
	var queryString;
	let searchInput = $('input[name="search-resident"]').val();
	if (isNaN(parseInt(searchInput))) {
		queryString = {$text: {$search: searchInput}};
	} else { // Is a number
		queryString = {"id": parseInt(searchInput)};
	}
	mongoDbObj.residents.find(queryString).toArray(function(err, doc) {
		if (err) {
			console.log(err); // LOG THIS
			return;
		} else {
			console.log(doc);
			if(doc.length === 1) {
				loadInvoice(doc[0].id, doc[0].fullName);
				return;
			}
			_.forEach(doc, function(item, index) {
				$('#search-list').append(
					`<li><a class="jsListItem" residentId="${item.id}" fullName="${item.fullName}">${item.id} | ${item.fullName}<i class="fa fa-chevron-right"></i></a></li>`
				);
				$('.jsListItem').on('click', (e) => {
					e.preventDefault();
					let residentId = $(e.target).attr('residentId');
					let fullName = $(e.target).attr('fullName');
					loadInvoice(residentId, fullName);
				});
			});
		}
	});
});


function loadInvoice(residentId, fullName) {
	$('.js-btn-pay-method').removeClass('btn--selected');
	var invoicesArray = [];
	// $('.js-btn-pay-method:nth(1)').addClass('btn--selected');
	residentId = parseInt(residentId);
	mongoDbObj.residents.find({"id": residentId}).toArray((err, doc) => {
		if (err) {
		console.log(err); // LOG THIS
			return;
		}
		if (doc[0].pendingInvoices.length === 0) {
			flashMessage("No tiene factura pendiente", "flashmessage--success");
			return;
		}

		console.log(doc[0].pendingInvoices);

		_.forEach(doc[0].bankAccount, (account, index) => { // Adding accounts to dropdown
			$('select[name="bankAccount"]').append(`
				<option value="${account}">${account}</option>
				`)
		});

		$('#form-receipt').removeClass('no-display');
		$('#form-search').addClass('no-display');
		var pendingInvoices = doc[0].pendingInvoices;
		_.forEach(pendingInvoices, (item, index) => { 
			mongoDbObj.invoices.find({"id": item}).toArray((err, doc) => {
				if (err) {
					console.log(err);
					return
				}
				invoicesArray.push(doc[0]);
				if (pendingInvoices.length === (index + 1)){
				console.log(index);
				console.log(pendingInvoices.length);
					if (invoicesArray.length === 1) { // For just one invoice
						_.forEach(invoicesArray, (item, index) => {
							$('#jsResident').text(`${fullName} (#${residentId})`).val(residentId);
							$('#jsInvoiceNumber').text(item.id);
							$('#jsType').text(item.tipo);
							let amount = numeral(item.amount).format("0,0.00");
							$('#jsAmount').text(`RD$ ${amount}`);
							$('#jsMonth').text(item.month);
							$('#jsDate').text(moment().format("DD/MM/YYYY"));
						});
					} else { // For more than one invoice
						let i = 0;
						$('#jsResident').text(`${fullName} (#${residentId})`).val(residentId);
						$('#jsInvoiceNumber').text(invoicesArray[i].id);
						$('#jsType').text(invoicesArray[i].tipo);
						let amount = numeral(invoicesArray[i].amount).format("0,0.00");
						$('#jsAmount').text(`RD$ ${amount}`);
						$('#jsMonth').text(invoicesArray[i].month);
						$('#jsDate').text(moment().format("DD/MM/YYYY"));

						$('#btnChangeInvoice').on('click', (e) => {
							e.preventDefault();
							if (i === (invoicesArray.length - 1)) {
								i = 0;
							} else {
								i++
							}
							$('#jsInvoiceNumber').text(invoicesArray[i].id);
							let amount = numeral(invoicesArray[i].amount).format("0,0.00");
							$('#jsAmount').text(`RD$ ${amount}`);
							$('#jsMonth').text(invoicesArray[i].month);
						});
					}
				}
			});
		});
	});
}

function getTempReceipt () {
	let tempReceipt = {
		resident : $('#jsResident').text(),
		invoiceID : $('#jsInvoiceNumber').text(),
		date : $('#jsDate').text(),
		payMethod : $('.js-btn-pay-method.btn--selected').text(),
		amount: $('#jsAmount').text(),
		month: $('#jsMonth').text(),
		residentId: parseInt($('#jsResident').val()),
		checkNumber: $('input[name="pay-method-input"]').val(),
		accountNumber: $('select[name="bankAccount"] option:selected').val()
	}

	// tempReceipt[$('.js-btn-pay-method.btn--selected').attr('method')] = $('input[name="pay-method-input"]').val();
	// Might be helpful in the future
	console.log(tempReceipt);
	return tempReceipt;
}

$('nav a').on('click', (e) => {
	$('.icon-selected').removeClass('icon-selected');
	$(e.currentTarget).addClass('icon-selected');
});

$('#btn-close-form-receipt').on('click', (e) => {
	e.preventDefault();
	$('#form-search').removeClass('no-display');
	$('#form-receipt').addClass('no-display');
	$('input[name="pay-method-input"]').addClass('no-display').val(""); // Reset input
	$('select[name="bankAccount"]').addClass('no-display').html('<option value=""></option>'); // Reset input
});

$('#btn-close-modal').on('click', (e) => {
	e.preventDefault();
	$('#modal').addClass('no-display');
});

$('.js-btn-pay-method').on('click', (e) => {
	e.preventDefault();
	$('.js-btn-pay-method').removeClass('btn--selected');
	$(e.currentTarget).addClass('btn--selected');
	$('input[name="pay-method-input"]').addClass('no-display');
	$('select[name="bankAccount"]').addClass('no-display');
	let currentSelect = $(e.currentTarget).text();
	if (currentSelect === "Cheque") {
		$('input[name="pay-method-input"]').removeClass('no-display').focus();
	}
	if (currentSelect === "Transferencia") {
		$('select[name="bankAccount"]').removeClass('no-display')
	}
});


$('#jsAddPayment').on('click', (e) => {
	e.preventDefault();
	window.location = "#add-payment-page";
	$('input[name="search-resident"]').focus();
});

$('#btn-confirm').on('click', (e) => {
	e.preventDefault();
	if ($('.btn--selected').length < 1) {
		flashMessage('Seleccione un metodo de pago', 'flashmessage--danger');
		return;
	}

	if ($('.js-btn-pay-method.btn--selected').text() === "Cheque") {
		if ($('input[name="pay-method-input"]').val().length === 0) {
			flashMessage('Complete el campo vacio', 'flashmessage--danger');
			$('input[name="pay-method-input"]').focus();
			return;
		}
	}
	if ($('.js-btn-pay-method.btn--selected').text() === "Transferencia") {
		if ($('select[name="bankAccount"] option:selected').val() === ""){
			flashMessage('Seleccione un numero de cuenta', 'flashmessage--danger');
			return;
		}
	}
	let tempReceipt = getTempReceipt();
	let invoiceID = tempReceipt.invoiceID;
	let date = tempReceipt.date;
	let resident = tempReceipt.resident;
	let amount = tempReceipt.amount;
	let month = tempReceipt.month;
	let payMethod = tempReceipt.payMethod;
	if (tempReceipt.checkNumber !== ""){
		$('#jsPayMethodNumberModal').text(tempReceipt.checkNumber);
	}
	if (tempReceipt.accountNumber !== "") {
		$('#jsPayMethodNumberModal').text(tempReceipt.accountNumber);
	}

	$('#jsResidentModal').text(resident);
	$('#jsInvoiceNumberModal').text(invoiceID);
	$('#jsDateModal').text(date);
	$('#jsAmountModal').text(amount);
	$('#jsMonthModal').text(month);
	$('#jsPayMethodModal').text(payMethod + ":");
	$('.modal-receipt').removeClass('no-display');
});

function btnClick(btn, callback) {
	$(btn).on('click', (e) => {
		e.preventDefault();
		callback(e);
	});
}

btnClick('#btn-save-receipt', (e) => {
	saveReceipt();
});

function saveReceipt(print) {
	let tempReceipt = getTempReceipt();
	let invoiceID = tempReceipt.invoiceID;
	let date = tempReceipt.date;
	let payMethod = tempReceipt.payMethod;
	let checkNumber = tempReceipt.checkNumber;
	let accountNumber = tempReceipt.accountNumber;
	let resident = tempReceipt.resident;
	let residentId = tempReceipt.residentId;

	flashMessage("Salvando...", 'flashmessage--info')
	mongoDbObj.invoices.update(
		{
			"id": invoiceID
		},
		{
			$set:
				{
					"datePayed": date,
					"status" : "Pagada",
					"payMethod": payMethod,
					"checkNumber": checkNumber,
					"accountNumber": accountNumber, 
					"resident": resident
				}
		},
		function(err, result) {
			if (err) {
				console.log(err);
				return;
			}
			console.log(result);
		}
	);
	mongoDbObj.residents.update(
		{
			"id": residentId
		},
		{
			$pull:
				{
					pendingInvoices : invoiceID
				},
			$push:
				{
					payedInvoices : invoiceID 
				}
		},
		function(err, result) {
			if (err) {
				console.log(err);
				return;
			}
			console.log(result);
			flashMessage("Salvado", "flashmessage--success");
			$('#btn-close-modal').trigger('click');
			$('#btn-close-form-receipt').trigger('click');
			if (print) {
				setTimeout(function() {
					window.open('./receipt.html');
				}, 900);
			}
		}
	);
}


$('#btn-print-receipt').on('click', (e) => {
	let jsonReceipt = JSON.stringify(getTempReceipt());
	localStorage.setItem('tempReceipt', jsonReceipt);
	saveReceipt(true);
});

$('.btn-expand-card').on('click', (e) => {
	e.preventDefault();
	$(e.currentTarget).parent('.form-resident-card').toggleClass('form-resident-card--expanded');
	$(e.currentTarget).toggleClass('btn-expand-card--expanded');

	if ($('.btn-expand-card--expanded i').hasClass('fa-chevron-down')) {
		$('.btn-expand-card--expanded i').removeClass('fa-chevron-down').addClass('fa-chevron-up');
	} else {
		$('.btn-expand-card i.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
	}
});
