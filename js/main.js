/*eslint-disable */
import {
  DBHelper,
  restaurantsToBeSynced
} from './dbhelper.js';

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();

  const neighborhoodsSelect = document.getElementById('neighborhoods-select');
  neighborhoodsSelect.addEventListener('change', updateRestaurants);

  const cuisinesSelect = document.getElementById('cuisines-select');
  cuisinesSelect.addEventListener('change', updateRestaurants);

  window.addEventListener('online', isOnline);
  window.addEventListener('offline', isOnline);
  isOnline();
});

/**
 * Register a service worker for caching static and dynamic assets.
 */
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js').then(() => {
      console.log('Service worker Registered');
    }).catch((error) => {
      console.error(`Error while registering service worker: ${error}`);
    });
  }
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.role = 'option';
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.role = 'option';
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false,
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: '',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets',
  }).addTo(self.newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant image`;
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.className = 'card-action-view';
  more.innerHTML = 'View Details';
  more.href = `./restaurant.html?id=${restaurant.id}`;
  // Make link have role of button with better label for improved accessibility and user experience.
  more.setAttribute('role', 'button');
  more.setAttribute('aria-label', `view details of ${restaurant.name} restaurant`);

  const favorite = document.createElement('button');
  favorite.className = 'card-action-favorite';
  favorite.dataset.id = restaurant.id;
  favorite.dataset.favorite = (restaurant.is_favorite == undefined || restaurant.is_favorite == 'undefined' || restaurant.is_favorite === false || restaurant.is_favorite === 'false') ? false : true;
  favorite.setAttribute('aria-label', `mark ${restaurant.name} restaurant as favorite`);
  if (favorite.dataset.favorite === 'true') {
    favorite.innerHTML = '&#9829;';
  } else if (favorite.dataset.favorite === 'false') {
    favorite.innerHTML = '&#9825;';
  }
  favorite.addEventListener('click', toggleFavoriteRestaurant);

  const actionButtonList = document.createElement('section');
  actionButtonList.className = 'card-action';
  actionButtonList.append(more);
  actionButtonList.append(favorite);

  li.append(actionButtonList);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};

/**
 * Toggle restaurant as favorite.
 */
const toggleFavoriteRestaurant = (event) => {
  const restaurantId = event.target.dataset.id;
  let isFavorite = event.target.dataset.favorite;

  if (isFavorite === 'false') {
    isFavorite = 'true';
    event.target.innerHTML = '&#10084;';
  } else if (isFavorite === 'true') {
    isFavorite = 'false';
    event.target.innerHTML = '&#9825;';
  }
  event.target.dataset.favorite = isFavorite;

  const restaurant = {
    restaurantId: restaurantId,
    isFavorite: isFavorite
  };
  DBHelper.updateFavoriteToDB(restaurant);
};

/**
 * Synce favorite restaurants with server.
 */
const syncFavoriteRestaurantsWithServer = () => {
  Promise.all(restaurantsToBeSynced.map(restaurant => {
    DBHelper.updateFavoriteToServer(restaurant);
  })).then(_ => {
    Toast.showToast('Background Sync For Favorites Has Been Completed Successfully!');
    restaurantsToBeSynced.length = 0;
  }).catch(_ => {
    restaurantsToBeSynced.length = 0;
  });
};

/**
 * Trigger notification when restaurant reviews page is online.
 */
const isOnline = () => {
  let connectionStatus = document.getElementById('notification');
  if (navigator.onLine){
    if(connectionStatus.style.display === 'block') {
      connectionStatus.style.backgroundColor = '#3fba4f';
      connectionStatus.innerHTML = 'You are currently online! syncing data';
      setTimeout(() => {
        connectionStatus.style.display = 'none';
      }, 5000);
      syncFavoriteRestaurantsWithServer();
    }
  } else {
    setTimeout(() => {
      connectionStatus.style.display = 'block';
      connectionStatus.innerHTML = 'You are currently offline. Any requests made will be queued and synced as soon as you are connected again.';
    }, 5000);
    connectionStatus.style.display = 'none';
  }
}
