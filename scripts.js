'use strict';

var app = {

	addressInput: document.getElementsByClassName('input-address')[0],

	devDummyData: '<li class="rep-card mdl-card mdl-shadow--2dp"><div class="rep-card-content"><div class="left-content"><h3 class="rep-name">Hakeem Jeffries</h3><p class="rep-title">Representative for New York&#x27;s 8th congressional district</p><p class="rep-affil">Democrat</p></div><div class="right-content"><img class="rep-image" src="https://theunitedstates.io/images/congress/225x275/J000294.jpg"/></div></div><a class="mdl-button call-button" href="tel:202-225-5936"><i class="material-icons mdl-list__item-icon mdl-color-text--white">phone</i>Call 202-225-5936</a></li>',

	autocomplete: null,

	baseCivicsURL: 'https://www.googleapis.com/civicinfo/v2',

	/**
	 * Set up google address autocomplete on the address input
	 */
	initAutocomplete: function() {
		if (!google && !google.maps) {
			return;
		}

		this.autocomplete = new google.maps.places.Autocomplete(this.addressInput, {
			//options
		});

		this._geolocateUserForAutocomplete();

		this.autocomplete.addListener('place_changed', this.searchRepresentativesByAddress.bind(this));
	},

	/**
	 * Find the users location and set it to the autocomplete
	 * for easier address searching on more local results
	 */
	_geolocateUserForAutocomplete: function() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var geolocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				var circle = new google.maps.Circle({
					center: geolocation,
					radius: position.coords.accuracy
				});

				app.autocomplete.setBounds(circle.getBounds());
			});
		}
	},

	/**
	 * Returns the formatted address from the autocomplete input
	 * @return {string}
	 */
	getFormattedAddress: function() {
		var address = this.autocomplete && this.autocomplete.getPlace();

		return address ? address.formatted_address : '';
	},

	/**
	 * Gets the address from the autocomplete and search
	 * for the representatives for that area
	 */
	searchRepresentativesByAddress: function() {
		var queryString = this._getRepSearchQueryString();
		var request = new XMLHttpRequest();

		request.onreadystatechange = function() {
			if (request.readyState === 4 && request.status === 200) {
				var dataString = request.responseText.match(/ocd-division\/country:us\/state:\w+\/cd:\d+/)[0];
				var state = dataString.match(/state:(\w{2})/)[1];
				var districtNum = parseInt(dataString.match(/\d+$/)[0], 10);

				if (state && districtNum) {
					this.getRepresentativeData(state, districtNum);
				}
			} else {
				// handle errors
			}
		}.bind(app);

		request.open('GET', this.baseCivicsURL + '/representatives?' + queryString);

		request.send(null);
	},

	_getRepSearchQueryString: function() {
		return this._encodeData({
			key: 'AIzaSyAQmMQg6Ti1XSiWULzRqJIdLS4lwS6muig',
			address: this.getFormattedAddress(),
			fields: 'divisions',
			includeOffices: false
		});
	},

	_encodeData: function(data) {
	    return Object.keys(data).map(function(key) {
	        return [key, data[key]].map(encodeURIComponent).join("=");
	    }).join("&");
	},

	/**
	 * Searches for the representative data by state & district
	 * number and then renders the rep-cards on success
	 * @param  {string} state
	 * @param  {string} districtNum
	 */
	getRepresentativeData: function(state, districtNum) {
		if (typeof state !== 'string' && typeof districtNum !== 'number') {
			return;
		}

		state = state.toUpperCase();

		var request = new XMLHttpRequest();

		request.onreadystatechange = function() {
			if (request.readyState === 4 && request.status === 200) {
				this.renderRepresentativeCard(request.responseText);
			} else {
				// handle errors
			}
		}.bind(app);

		request.open('GET', 'http://cdn.usecalltoaction.com/' + state + '-' + districtNum + '.html');

		request.send(null);
	},

	/**
	 * [renderRepresentativeCard description]
	 * @param  {string} templateString
	 */
	renderRepresentativeCard: function(templateString) {
		templateString || (templateString = app.devDummyData);
		var repDataContainer = document.getElementById('repDataContainer');
		var repCardList = document.getElementById('repList');

		// Remove hidden class
		repDataContainer && (repDataContainer.classList = '');

		// Append template to rep-card list
		var repCard = document.createElement('div');
		repCard.innerHTML = templateString;

		repCardList.appendChild(repCard.children[0]);
	},
};

document.addEventListener('DOMContentLoaded', function() {

	app.addressInput = document.getElementsByClassName('input-address')[0];

	app.initAutocomplete();
});
