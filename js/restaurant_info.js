/*eslint-disable */
import {
  DBHelper,
  reviewsToBeSynced
} from './dbhelper.js';

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
  const btnSubmitReview = document.querySelector('#submit-review');
  btnSubmitReview.addEventListener('click', addReview);

  window.addEventListener('online', isOnline);
  window.addEventListener('offline', isOnline);
  isOnline();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: '',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.insertAdjacentElement('afterbegin', title);

  const reviewForm = document.querySelector('.review-input');
  const restaurantId = self.restaurant.id;

  DBHelper.fetchRestaurantReviewsById(restaurantId)
  .then(reviews => {
    if (!reviews || (reviews && reviews.length === 0)) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews Found';
      container.insertBefore(noReviews, reviewForm);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
  })
  .catch(_ => {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews Found';
    container.insertBefore(noReviews, reviewForm);
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');

  const rating = document.createElement('p');
  rating.innerHTML = `&#9733;`.repeat(review.rating);
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = `"${review.comments.italics()}"`;
  li.appendChild(comments);

  const name = document.createElement('p');
  name.innerHTML = `- ${review.name}`;
  li.appendChild(name);

  const date = document.createElement('p');

  date.innerHTML = new Date(review.createdAt);
  li.appendChild(date);

  return li;
}
/**
 * Add review entered by user.
 */
const addReview = (event) => {
  const nameField = document.querySelector('#reviewer-name');
  const commentsField = document.querySelector('#reviewer-comment');
  const ratingField = document.querySelector('.messageCheckbox:checked');

  const name = nameField.value;
  const comments = commentsField.value;
  const rating = ratingField.value;

  if (!name || !rating || !comments) {
    let connectionStatus = document.getElementById('notification');
    connectionStatus.style.backgroundColor = '#f44242';
    connectionStatus.innerHTML = 'Please Fill Remaining Form Fields!';
    setTimeout(() => {
      connectionStatus.style.display = 'none';
    }, 5000);
    return;
  }
  const review = {
    restaurant_id: self.restaurant.id,
    name,
    rating,
    comments,
    createdAt: new Date(Date.now())
  };
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  DBHelper.postReviewToDB(review);
  resetReviewForm(nameField, ratingField, commentsField);
};

/**
 * Reset review form.
 */
const resetReviewForm = (nameField, ratingField, commentsField) => {
  nameField.value = '';
  ratingField.value = null;
  commentsField.value = '';
};

/**
 * Sync reviews with server.
 */
const syncReviewsWithServer = () => {
  Promise.all(reviewsToBeSynced.map(review => {
    DBHelper.postReviewToServer(review);
  })).then(_ => {
    let connectionStatus = document.getElementById('notification');
    connectionStatus.style.backgroundColor = '#419bf4';
    connectionStatus.innerHTML = 'Background sync has been completed successfully';
    setTimeout(() => {
      connectionStatus.style.display = 'none';
    }, 5000);
    reviewsToBeSynced.length = 0;
  }).catch(_ => {
    reviewsToBeSynced.length = 0;
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
        connectionStatus.innerHTML = 'You are currently online! syncing data';
      }, 5000);
      syncReviewsWithServer();
    }
  } else {
    setTimeout(() => {
      connectionStatus.style.display = 'block';
      connectionStatus.innerHTML = 'You are currently offline. Any requests made will be queued and synced as soon as you are connected again.';
    }, 5000);
    connectionStatus.style.display = 'none';
  }
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
