Storage.prototype.setObj = function(key, obj) {
  return this.setItem(key, JSON.stringify(obj));
}
Storage.prototype.getObj = function(key) {
  return JSON.parse(this.getItem(key));
}

Vue.component('resident-list', {
	template: '#resident-list',
	data() {
		return {
			nextResidents: []
		}
	},
  props: ['allresidents'],
  methods: {
    isEmpty: function(row, column, cellValue, index) {
      if (cellValue === "") return "VACIO"
        else return cellValue;
    }
  }
});

var app = new Vue({
  el: '#app',
  data: {
    allResidents: []
  },
  created() {
    this.allResidents = localStorage.getObj('allResidents');
  }
})