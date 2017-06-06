var modalSingleInvoice = new Vue({
	el: '.modal__generate-invoices',
	data: {
		residentId: 'N/A',
		month: 'N/A',
		residentFullName: 'N/A',
		extraordinaryDescription: '',
		extraordinaryAmount: '',
		btnGenerateExtraordinaryInvoices: 'generateExtraordinaryInvoicesBatchActual()',
		btnModalConfirm: 'generateExtraordinaryInvoiceActual()',
		handleResults: this.handleResultsNormal,
		handleResultsNormal: function(residentId, fullName) {
			noDisplay('.inner-box');
			yesDisplay('.create-invoice-details');
			modalSingleInvoice.residentId = residentId;
			modalSingleInvoice.month = $(`select[name="invoice-month"] option:selected`).val();
			modalSingleInvoice.month = moment().month(modalSingleInvoice.month - 1).format('MMMM');
			modalSingleInvoice.residentFullName = fullName;
		},
		handleResultsExtraordinary: function(residentId, fullName) {
			noDisplay('.inner-box');
			yesDisplay('.generate-extraordinary-invoices');
			modalSingleInvoice.residentId = residentId;
			modalSingleInvoice.residentFullName = fullName;
			modalSingleInvoice.month = moment().format('MMMM');
		}
	},
	methods: {
		runGenerateNormalInvoice: function() {
			generateNormalInvoice(this.residentId)
		},
		search: function() {
			this.extraordinaryDescription = '';
			this.extraordinaryAmount = '';
			search('.choose-resident input[name="search-resident"]', '.choose-resident #search-list', this.handleResults)
		},
		showConfirmStep: function() {
			if(this.extraordinaryDescription === '' || this.extraordinaryAmount === '') {
				return flashMessage('Descripcion/Monto no pueden estar vacio', 'flashmessage--danger');
			}
			noDisplay('.inner-box');
			yesDisplay('.create-invoice-details');
		}
	},
	watch: {
		month: function() {
			this.month = _.capitalize(this.month);
		}
	}
});



var addPaymentPage = new Vue({
	el: '#add-payment-page',
	data: {
		receiptAmount: '',
		tempReceiptAmount: '',
		originalReceiptAmount: ''
	},
	computed: {

	},
	methods: {
		
	},
	watch: {
		receiptAmount: function() {
			if (toNumber(this.receiptAmount) > this.tempReceiptAmount){
				return this.receiptAmount = numeral(this.tempReceiptAmount).format('0,0');
			}
			return this.receiptAmount = numeral(this.receiptAmount).format('0,0');
		},
		tempReceiptAmount: function() {
			return this.tempReceiptAmount = toNumber(this.tempReceiptAmount)
		},
		originalReceiptAmount: function() {
			return this.originalReceiptAmount = toNumber(this.originalReceiptAmount)
		}
	}
});

var accountingPage = new Vue({
	el: '#accounting-page',
	data: {
		monthCredit: '',
		monthDebit: '',
		yearCredit: '',
		yearDebit: '',
		totalBalance: '',
		residents: []
	},
	methods: {
		currentMonth: function() {
			return _.capitalize(moment().format('MMMM'))
		},
		currentYear: function() {
			return moment().format('YYYY')
		},
		residentsList: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-residents-list');
			yesDisplay('#btn-close-inside-page');
			mongoDbObj.residents.find({}).sort({id: 1}).toArray((err, doc) => {
				if (err) return console.log(err);
				accountingPage.residents = doc;
			});
		},
		closeInsidePage: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-home');
			noDisplay('#btn-close-inside-page');
		},
		statusByMonth: function() {
			alert("En Construccion")
		},
		extraordinaryInvoices: function() {
			alert("En Construccion")
		},
		addDebit: function() {
			alert("En Construccion")
		},
		fixInvoices: function() {
			mongoDbObj.invoices.find({status: "Sin pagar"}).toArray((err, doc) => {
				if (err) return console.log(err);
				_.forEach(doc, (invoice, index) => {
					let amount = invoice.amount;
					let originalAmount = amount;
					mongoDbObj.invoices.update({id: invoice.id}, { $set: {originalAmount: originalAmount} }, function(err, result){
						if(err) return console.log(err);
					});
					if(doc.length === (index + 1)) {
						console.log("Terminado");
					}
				});
			});
		},
		fixAmounts: function() {
			mongoDbObj.invoices.find({}).toArray((err, doc) => {
				if (err) return console.log(err);
				_.forEach(doc, (invoice, index) => {
					let amount = toNumber(invoice.amount);
					let originalAmount = toNumber(invoice.originalAmount);
					mongoDbObj.invoices.update({id: invoice.id}, { $set: {amount: amount, originalAmount: originalAmount} }, function(err, result){
						if(err) return console.log(err);
					});
					if(doc.length === (index + 1)) {
						console.log("Terminado");
					}
				});
			});
		}
	},
	watch: {
		monthCredit: function() {
			return this.monthCredit = numeral(this.monthCredit).format('0,0')
		},
		monthDebit: function() {
			return this.monthDebit = numeral(this.monthDebit).format('0,0')
		},
		yearCredit: function() {
			return this.yearCredit = numeral(this.yearCredit).format('0,0')
		},
		yearDebit: function() {
			return this.yearDebit = numeral(this.yearDebit).format('0,0')
		},
		totalBalance: function() {
			return this.totalBalance = numeral(this.totalBalance).format('0,0')
		}
	}
})