# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

### Specification
Restaurant Review is a web app that lets you to see your nearby restaurants information including restaurant timings and user reviews. This app also let's you to add restaurant as favorite. Some of the key points of this app are listed below -
1. Progressive web app.
2. Can add review even offline.
3. Offline reviews can automatically sync to server when user comes online
4. Accessible
5. Build using latest js specifications ES6
6. Notification to tell if user is online or offline and validation errors.
7. Responsive design
8. Offline capable
9. Background sync
10. Front end automation and tooling using gulp

### Stage wise added functionality
Initially we are provided with a app with a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use.

##### Stage 1
In stage 1 I have added a service-worker to the app which caches some content so that offline experience of user increases. I have used Flexbox for responsive design of the web app so that it is compatable with device of any resolution. Finally I have increased accessibility of the app so that people with disabilities can also use this app.

##### Stage 2
In stage 2 i have changes data source from a json file to the server usinf latest `fetch` API. Also I stored server response to Indexeddb so that we don't have to query server every time for getting our data. Finally in this phase i have improved the lighthouse score of the app which measures perfrmance, accessibility, PWA, SEO and best practices used in app.

##### Stage 3
In Stage 3 i have provide a functionality for user to mark restaurants as favorite and submit their own reviews the special part is that a user can use mark as favorite and submit review functionality even he/she is offline. For information regarding syncing i have provided notification support which tells about when data is syncing and when validations are wrong. 


### Running Project locally

Follow these steps in order to set up this project in your local system
1. Clone this repo via command `git clone https://github.com/anu-007/mws-restaurant-stage-1.git`.
2. Clone server [repo](https://github.com/udacity/mws-restaurant-stage-2) and start server locally.
3. Move into the directory.
3. get MAPBOX API KEY and paste it with `<your MAPBOX API KEY HERE>` in `main.js` and `restaurant_info.js`.
4. run `npm i` to install all the dependency.
5. run `gulp clean` to clean dist foldeer (if any)
6. run `gulp serve:prod` to get production build.
7. open `http://localhost:3000` in your system to see the website.

## Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). You need to replace `<your MAPBOX API KEY HERE>` with a token from [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. 

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write.

### ScreenShot

