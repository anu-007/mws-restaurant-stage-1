/*eslint-disable */
/**
 * Common database helper functions.
 */
import idb from 'idb';

export let reviewsToBeSynced = [];
export let restaurantsToBeSynced = [];

class DBHelper {
  /**
   * Base URL for server.
   */
  static get BASE_URL() {
    const port = 1337;
    return `http://localhost:${port}/`;
  }

  /**
   * idb initialize
   */
  static idbInit() {
    return idb.open('mws', 2, (upgradeDb) => {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants');
        case 1:
          upgradeDb.createObjectStore('reviews');
      }
    });
  }

  // ======================== IndexedDb helper functions ==================================== //
  /**
   * Fetch reviews from idb.
   */
  static getRestaurantsFromDb(dbPromise) {
    return dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction('restaurants');
      const restaurantsStore = tx.objectStore('restaurants');
      return restaurantsStore.get('restaurant-list');
    });
  }

  /**
   * Updates restaurants in idb.
   */
  static updateRestaurantsToDB(dbPromise, restaurants) {
    return dbPromise.then((db) => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantsStore = tx.objectStore('restaurants');
      restaurantsStore.put(restaurants, 'restaurant-list');
      tx.complete;
    });
  }

  /**
   * Fetch reviews from idb.
   */
  static getReviewsByRestaurantFromDb(dbPromise, restaurantId) {
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews');
      let restaurantsStore = tx.objectStore('reviews');
      return restaurantsStore.get(restaurantId);
    });
  }

  /**
   * Update reviews to idb.
   */
  static updateReviewsByRestaurantInDb(dbPromise, restaurantId, reviews) {
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews', 'readwrite');
      let restaurantsStore = tx.objectStore('reviews');
      restaurantsStore.put(reviews, restaurantId);
      tx.complete;
    });
  }

  // ======================== IndexedDB OPERATIONS ==================================== //
  /**
   * Update IndexedDB with latest restaurant favorite before going online.
   */
  static updateFavoriteToDB(restaurant) {
    const dbPromise = DBHelper.idbInit();

    DBHelper.getRestaurantsFromDb(dbPromise)
      .then(restaurants => {
        if (!restaurants || (restaurants && restaurants.length === 0)) return;
        const updatedRestaurants = restaurants.map(restaurantFromDB => {
          if (restaurantFromDB.id == restaurant.restaurantId) {
            restaurantFromDB.is_favorite = restaurant.isFavorite;
          }
          return restaurantFromDB;
        });
        DBHelper.updateRestaurantsToDB(dbPromise, updatedRestaurants);

        if (navigator.onLine) {
          DBHelper.updateFavoriteToServer(restaurant);
        } else {
          restaurantsToBeSynced.push(restaurant);
        }
      });
  }

 /**
   * Update IndexedDB with latest review before going online.
   */
  static postReviewToDB(review) {
    const dbPromise = DBHelper.idbInit();

    DBHelper.getReviewsByRestaurantFromDb(dbPromise, review.restaurant_id)
      .then(reviews => {
        if (!reviews) return;
        reviews.push(review);
        DBHelper.updateReviewsByRestaurantInDb(dbPromise, review.restaurant_id, reviews);

        if (navigator.onLine) {
          DBHelper.postReviewToServer(review);
        } else {
          reviewsToBeSynced.push(review);
        }
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph == parseInt(restaurant.photograph, 10)) {
      return (`/img/${restaurant.photograph}.webp` || `/img/${restaurant.photograph}.jpg`);
    } else {
      return ('/img/10.webp' || '/img/10.jpg');
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: `./restaurant.html?id=${restaurant.id}`,
      });
    marker.addTo(newMap);
    return marker;
  }

  // ======================== NETWORK REQUESTS ==================================== //
  /**
   * Update server with latest review.
   */
  static postReviewToServer(review) {
    const postReviewsUrl = `${DBHelper.BASE_URL}reviews`;

    const postReview = {
      restaurant_id: review.restaurant_id,
      name: review.name,
      rating: review.rating,
      comments: review.comments
    };

    return fetch(postReviewsUrl, {
      method: 'POST',
      body: JSON.stringify(postReview),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(data => {
      console.log('Post added to server')
    })
    .catch(err => {
      console.error(err)
    });
  }

  /**
   * Update server with latest favorite.
   */
  static updateFavoriteToServer(restaurant) {
    const updateFavoriteUrl = `${DBHelper.BASE_URL}restaurants/${restaurant.restaurantId}/?is_favorite=${restaurant.isFavorite}`;

    return fetch(updateFavoriteUrl, {
      method: 'PUT'
    })
    .then(data => {
      console.log('data updated successfully');
    })
    .catch(err => {
      console.error(err)
    })
  }

  /**
   * Fetch all reviews of a particular restaurant.
   */
  static fetchRestaurantReviewsById(restaurantId) {
    const reviewsUrl = `${DBHelper.BASE_URL}reviews/?restaurant_id=${restaurantId}`;
    const dbPromise = DBHelper.idbInit();

    // Network then cache strategy.
    if (navigator.onLine) {
      return fetch(reviewsUrl)
        .then(response => response.json())
        .then(reviews => {
          if (!reviews || (reviews && reviews.length === 0)) throw new Error('Reviews not found');
          DBHelper.updateReviewsByRestaurantInDb(dbPromise, restaurantId, reviews);
          return reviews;
        })
        .catch( _=> {
          // If network request fails then fetch from idb
          return DBHelper.getReviewsByRestaurantFromDb(dbPromise, restaurantId)
            .then(reviews => {
              if (reviews && reviews.length > 0) {
                return reviews;
              };
            });
        });
    } else {
      // Cache then network strategy.
      return DBHelper.getReviewsByRestaurantFromDb(dbPromise, restaurantId)
        .then(reviews => {
          if (reviews && reviews.length > 0) {
            // If reviews found in cache
            return reviews;
          } else {
            // Fetch reviews from network.
            return fetch(reviewsUrl)
              .then(response => response.json())
              .then(reviews => {
                if (!reviews || (reviews && reviews.length === 0)) return;
                DBHelper.updateReviewsByRestaurantInDb(dbPromise, restaurantId, reviews);
                return reviews;
              });
          }
        }).catch((error) => {
          // Oops!. Got an error from server or some error while operations!
          console.log(`Request failed with error: ${error}`);
        });
    }
  }

  /**
   * Fetch all restaurants first from idb with network fetch as fallback
   */
  static fetchRestaurants(callback) {
    const dbPromise = DBHelper.idbInit();

    DBHelper.getRestaurantsFromDb(dbPromise)
      .then((restaurants) => {
        console
        // IF restaurants found in idb
        if (restaurants && restaurants.length > 0) {
          callback(null, restaurants);
        } else { // network request to fetch restaturants
          return fetch(`${DBHelper.BASE_URL}restaurants/`);
        }
      })
      .then((response) => {
        if (!response) return;
        return response.json();
      })
      .then((restaurants) => {
        if (!restaurants) return;
        // Inserting updated restaurants data to idb
        DBHelper.updateRestaurantsInDb(restaurants, dbPromise);
        callback(null, restaurants);
      })
      .catch((err) => {
        const errorMessage = (`Error fetching restaurants: ${err}`);
        callback(errorMessage, null);
      });
  }
}

export default DBHelper;
