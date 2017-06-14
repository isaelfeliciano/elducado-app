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
		},
		formatAmount: function(event){
			accountingPage.formatAmount(event);
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
		monthList: moment.months(),
		monthSelected: '',
		yearSelected: '',
		yearList: [],
		monthCredit: '',
		monthDebit: '',
		yearCredit: '',
		yearDebit: '',
		totalBalance: '',
		residents: [],
		debitCheque: '',
		debitName: '',
		debitDescription: '',
		debitAmount: '',
		debitList: [],
		extraordinaryInvoicesList: [],
		extraordinaryInvoicesDescriptions: [],
		currentInvoiceDescription: '',
		monthStatement: ''
	},
	methods: {
		currentMonth: function() {
			return _.capitalize(moment().format('MMMM'))
		},
		currentYear: function() {
			return moment().format('YYYY')
		},
		getYearList: function() {
			mongoDbObj.accounting.aggregate([
				{ $match: { id: "by-year" } },
				{ $group: { _id: "$year" } }
			]).toArray((err, result) => {
				if (err) return console.log(err);
				accountingPage.yearList = result;
			});
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
			this.monthStatement = '';
		},
		goMonthStatement: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-month-statement');
			yesDisplay('#btn-close-inside-page');
			this.getYearList();
		},
		getMonthStatement: function() {
			let month = this.monthSelected;
			let year = this.yearSelected;
			if (month === '' || year === '') return flashMessage('Seleccione Mes y Año', 'flashmessage--danger');
			mongoDbObj.accounting.find({id: "by-month", month: month, year: year}).toArray((err, result) => {
				if (err) return console.log(err);
				if (result.length === 0) return flashMessage("No hay record de mes seleccionado", "flashmessage--info");
				accountingPage.monthStatement = result[0];
			});
		},
		extraordinaryInvoices: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-extraordinary-invoices');
			yesDisplay('#btn-close-inside-page');
			this.extraordinaryInvoicesList = [];
			mongoDbObj.invoices.aggregate([ 
				{ $match : { type: "extraordinaryPayments" } }, 
				{ $group : { _id: "$description" } } 
			]).toArray((err, result) => {
				if (err) return console.log(err);
				accountingPage.extraordinaryInvoicesDescriptions = result;
			});
		},
		findExtraordinaryInvoices: function(description) {
			this.currentInvoiceDescription = description;
			mongoDbObj.invoices.find({description: description}).toArray((err, result) => {
				if (err) return console.log(err);
				result = _.sortBy(result, ['fullName']);
				accountingPage.extraordinaryInvoicesList = result;
			});
		},
		goAddDebit: function() {
			noDisplay('.accounting-page__inside-page');
			yesDisplay('#accounting-page-add-debit');
			yesDisplay('#btn-close-inside-page');
			mongoDbObj.accounting.find({type: 'debit'}).toArray((err, doc) => {
				if (err) return console.log(err);
				accountingPage.debitList = doc;
			});
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
		},
		fixAddFullNameToInvoices: function() {
			mongoDbObj.invoices.find({}).toArray((err, doc) => {
				if (err) return console.log(err);
				_.forEach(doc, (invoice, index) => {
					mongoDbObj.residents.find({id: invoice.residentId}).toArray((err, result) => {
						if(err) return console.log(err);
						let fullName = result[0].fullName;
						mongoDbObj.invoices.update({id: invoice.id}, { $set: {"fullName": fullName} }, {upsert: true}, function(err, result){
							if(err) return console.log(err);
						});
					});
					if(doc.length === (index + 1)) {
						console.log("Terminado");
					}
				});
			});
		},
		addDebit: function() {
			if (this.debitName == '' || this.debitCheque == '' || this.debitDescription == '' || this.debitAmount == ''){
				return flashMessage('Debe llenar todos los campos', 'flashmessage--danger');
			}
			let obj = {
				debitDate: moment().format('DD/MM/YYYY'),
				debitCheque: accountingPage.debitCheque,
				debitName: accountingPage.debitName,
				debitDescription: accountingPage.debitDescription,
				debitAmount: toDecimal(accountingPage.debitAmount),
				month: _.capitalize(moment().format('MMMM')),
				year: moment().format('YYYY'),
				type: 'debit',
				timestamp: Date.now()
			};

			mongoDbObj.accounting.insertOne(obj, (err, result) => {
				if (err) return console.log(err);

				mongoDbObj.accounting.update(
					{
						id: "general"
					},
					{
						$inc: {
							totalBalance: -toDecimal(obj.debitAmount),
							totalExpensives: toDecimal(obj.debitAmount)
						}
					}, function(err, result) {
						if (err) return console.log(err);

						mongoDbObj.accounting.update(
							{
								id: "by-year",
								year: moment().format('YYYY')
							},
							{
								$inc: {
									balance: -toDecimal(obj.debitAmount),
									cashOut: toDecimal(obj.debitAmount)
								}
							}, function(err, result) {
								if (err) return console.log(err);

								mongoDbObj.accounting.update(
									{
										id: "by-month",
										month: _.capitalize(moment().format('MMMM')),
										year: moment().format('YYYY')
									},
									{
										$inc: {
											balance: -toDecimal(obj.debitAmount),
											cashOut: toDecimal(obj.debitAmount)
										}
									}, function(err, result) {
										if (err) return console.log(err);
										updateResumen();
									}
								);
							}
						);
					}
				);
			});


			this.debitList.push(obj);
			this.debitCheque = '';
			this.debitName = '';
			this.debitDescription = '';
			this.debitAmount = '';


		},
		deleteDebit: function(event) {
			let _id = $(event.target).parent().children('td:nth-child(1)').attr('_id');
			let amount = $(event.target).parent().children('td:nth-child(6)').text();
			amount = toDecimal(amount);
			let date = $(event.target).parent().children('td:nth-child(2)').text();
			date = moment(date).format('DD/MMMM/YYYY');
			let year = moment(date).format('YYYY');
			let month = _.capitalize(moment(moment(date).format('DD/MM/YYYY')).format('MMMM'));
			if(confirm('Esta seguro, borrar este debito?')){
				mongoDbObj.accounting.remove({_id: ObjectId(_id)}, (err, result) => {
					if (err) return console.log(err);
					mongoDbObj.accounting.update(
						{
							id: "general"
						},
						{
							$inc: {
								totalBalance: amount,
								totalExpensives: -amount
							}
						}, function(err, result) {
							if (err) return console.log(err);
							mongoDbObj.accounting.update(
								{
									id: "by-year",
									year: year
								},
								{
									$inc: {
										balance: amount,
										cashOut: -amount
									}
								}, function(err, result) {
									if (err) return console.log(err);
									mongoDbObj.accounting.update(
										{
											id: "by-month",
											month: month
										},
										{
											$inc: {
												balance: amount,
												cashOut: -amount,
											}
										}, function(err, result) {
											if (err) return console.log(err);
											$(event.target).parent().remove();
											flashMessage('Debito eliminado', 'flashmessage--info');
											updateResumen();
										}
									);
								}
							);
						}	
					);
				});
			} else {
				alert('Cancelado')
			}
		},
		formatAmount: function(event) {
			let isDecimal; 
			let value = $(event.target).val();
			let valueStr = value.toString();
			if (valueStr.indexOf('.') !== -1) {
				isDecimal = true;
			  } else {isDecimal = false}
			if (value.length >= 3 && isDecimal == false) {
				value = numeral(value).format('0,0');
				$(event.target).val(value);
			}
		},
		numeralFormat: function(number) {
			return numeral(number).format('0,0.00');
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
	},
	computed: {
		
	}
});
