# drupal_iiif
---
### Adding on muse_iiif module for Drupal 7
* Update the `.module` file
* Update the `muse_iiif.js` file
* Upload the folders called `css` and `js`
* Require to Install `service` module and enable `Retrieve a user` in the services menu with **Path to endpoint** set to be `REST`

### Usage
* Change the APIs' database setting at .env 
* Change the domain for viewer to fetch at api.js and show.js

### Gallery
* Multi Viewers at same page
![Alt text](https://drive.google.com/open?id=180hu5OG9rkwLXCumM2WYKS9R7GtS8tV_)
* Muti Annotations at same viewer

### Features
* `Ctrl + Scroll` to zoom
* `Rotation` with buttons
* `Double Click` on the details label to update annotations (press `Enter` to end the update or press `ESC` to quit)
* Move existing to a new location
* Delete unused annotations (Uesrs can delete multiple at once)

### Warning
* Users **can enter space** while creating or updating annotations.
  However, users **can't** enter `Enter` when creating or updating annotations, it will cause error.
* If users get alert about having permission issues  to create, update or delete annotations, please login or login again. 
