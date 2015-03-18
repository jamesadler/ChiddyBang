// Homepage controller
app.controller("homeController", ['$scope', '$http',
  function($scope, $http) {
    var URL = 'http://localhost:8080/';

    // Get json data
    $scope.getData = function(url) {
      $scope.status = "Finding restaurants."
      $http.post(url, {
        lat: $scope.position.lat,
        long: $scope.position.long
      }).
      success(function(data, status) {
        $scope.restaurants = data;
        $scope.updateRestaurants();
        $scope.loadingPosition = false;
        $scope.transition();
      }).
      error(function(data, status) {
        console.log(status);
      });
    };
    $scope.getUserLocation = function() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          $scope.position = {
            lat: position.coords.latitude,
            long: position.coords.longitude
          };
          //$scope.getData('../data.json');
          $scope.getData(URL + 'api');

          $scope.$apply();

        });
      } else {
        console.log("Geolocation is not supported by this browser.");
        $scope.geoEnabled = false;
      }
    };
    $scope.setUserDist = function(restaurant) {
      restaurant.distance = calcDist($scope.position.lat,
        $scope.position.long,
        restaurant.latitude,
        restaurant.longitude
      );
    };
    $scope.setIsOpen = function(restaurant) {
      restaurant.open = restaurant.open || false;
    };
    $scope.isOpen = function(restaurant) {
      return restaurant.open;
    };
    var i = 0;
    $scope.updateRestaurants = function() {
      for (i = 0; i < $scope.restaurants.length; i++) {
        $scope.setUserDist($scope.restaurants[i]);
        $scope.setIsOpen($scope.restaurants[i]);
        $scope.restaurants[i].img = $scope.restaurants[i].img ||
          '../img/holder.png';
        $scope.restaurants[i].phone = $scope.restaurants[i].phone ||
          '- -';
      }
    };

    calcDist = function(lat1, lon1, lat2, lon2) {
      var R = 6371; // km
      var dLat = toRad(lat2 - lat1);
      var dLon = toRad(lon2 - lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) *
        Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d;
    };
    // Converts numeric degrees to radians
    function toRad(Value) {
      return Value * Math.PI / 180;
    }
    $scope.transition = function() {
      $('header').removeClass('tall').addClass('short');
    };
    $scope.isSet = function(tabNo) {
      return $scope.tabNo === tabNo;
    };
    $scope.setTab = function(tabNo) {
      $scope.tabNo = tabNo;
    };
    $scope.init = function() {
      Number.prototype.toRad = function() {
        return this * Math.PI / 180;
      };
      $scope.tabNo = 1;
      $scope.restaurants = [];
      $scope.loadingPosition = true;
      $scope.geoEnabled = true;
      $scope.status = "Getting your position.";
      $scope.predicate = "distance";
      $scope.getUserLocation();

    };
  }
]);
