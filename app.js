'use strict'

var MongoClient = require('mongodb').MongoClient;
var mongoDbObj;
var assert = require('assert');


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



$("#btn-search").on("click", function(e) {
	e.preventDefault();
	let wordToSearch = $('input[name="search-resident"]').val();
	mongoDbObj.residents.find({$text: {$search: wordToSearch}}).toArray(function(err, doc) {
		if (err) {
			console.log(err); // LOG THIS
			return;
		} else {
			console.log(doc);
			_.forEach(doc, function(item, index) {
				$('#search-list').append(
					`<li><a class="jsListItem" residentId="${item.id}">${item.id} | ${item.firstName}</a></li>`
				);
				$('.jsListItem').on('click', (e) => {
					e.preventDefault();
					let residentId = $(e.target).attr('residentId');
					loadInvoice(residentId);
				});
			});
		}
	});
});


function loadInvoice(residentId) {
	$('.js-btn-pay-method').removeClass('btn--selected');
	// $('.js-btn-pay-method:nth(1)').addClass('btn--selected');
	residentId = parseInt(residentId);
	mongoDbObj.invoices.find({"residentId": residentId}).toArray((err, doc) => {
		if (err) {
			console.log(err); // LOG THIS
			return;
		} else {
			console.log(doc);
			_.forEach(doc, (item, index) => {
				$('#jsInvoiceNumber').val(item.id);
				$('#jsType').text(item.tipo);
				$('#jsAmount').text(`RD$ ${item.amount}`);
				$('#jsMonth').text(item.month);
			});
		}
	})
}

$('nav a').on('click', (e) => {
	$('.icon-selected').removeClass('icon-selected');
	$(e.currentTarget).addClass('icon-selected');
});

$('.js-btn-pay-method').on('click', (e) => {
	e.preventDefault();
	$('.js-btn-pay-method').removeClass('btn--selected');
	$(e.currentTarget).addClass('btn--selected');
});
