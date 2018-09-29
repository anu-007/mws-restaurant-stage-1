# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 2

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.

### Specification

You have been provided the code for a restaurant reviews website. The code has a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. Your job is to update the code to resolve these issues while still maintaining the included functionality. 

### Running Project locally

Follow these steps in order to set up this project in your local system
1. Clone this repo via command `git clone https://github.com/anu-007/mws-restaurant-stage-1.git`.
2. Clone server [repo](https://github.com/udacity/mws-restaurant-stage-2) and start server locally.
3. Move into the directory.
3. get MAPBOX API KEY and paste it with `<your MAPBOX API KEY HERE>` in `main.js` and `restaurant_info.js`.
4. run `npm i` to install all the dependency.
5. run `gulp serve:prod` to get production build.
6. open `http://localhost:3000` in your system to see the website.

## Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). You need to replace `<your MAPBOX API KEY HERE>` with a token from [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. 

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write.