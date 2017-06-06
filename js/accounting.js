btnClick('a[href="#accounting-page"]', (e) => {
	window.location = '#accounting-page';
	updateResumen();
});

function updateResumen() {
	let year = accountingPage.currentYear;
	let month = accountingPage.currentMonth;
	
	mongoDbObj.accounting.find({id: "general"}).toArray((err, doc) => {
		if(err) return console.log(err);
		let data = doc[0];
		console.log(data);
		
		accountingPage.totalBalance = data.totalBalance;
	});

	mongoDbObj.accounting.find({id: "by-month", month: month, year: year}).toArray((err, doc) => {
		if(err) return console.log(err);
		let data = doc[0];
		console.log(data);
		
		accountingPage.monthCredit = data.cashIn;
		accountingPage.monthDebit = data.cashOut;
	});

	mongoDbObj.accounting.find({id: 'by-year', year: year}).toArray((err, doc) => {
		if(err) return console.log(err);
		let data = doc[0];
		console.log(data);
		
		accountingPage.yearCredit = data.cashIn;
		accountingPage.yearDebit = data.cashOut;
	});
}