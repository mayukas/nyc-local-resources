'use strict';

/**
 * @ngdoc function
 * @name localResourcesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the localResourcesApp
 */


angular.module('localResourcesApp')
  .controller('MainCtrl', ['$scope', '$window', 'CartoDB', function ($scope, $window, CartoDB) {

    $scope.user = {};
    //$scope.user.address = '654 park place brooklyn';
    $scope.user.loadingLoc = false;
    $scope.user.byBorough = false;
    // $scope.hasLocal = true;


    if(!$window.Geocoder) alert('warning: no geocoder set');
    //var Geocoder = new google.maps.Geocoder();

    $scope.searchAddr = function() {
      $window.Geocoder.geocode({ 'address': $scope.user.address }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          $scope.user.lat = results[0].geometry.location.lat();
          $scope.user.lng = results[0].geometry.location.lng();
          $scope.error = false;
          $scope.user.address = results[0].formatted_address;
          $scope.user.borough = getUserBorough(results[0].formatted_address);
          $scope.update();

        } else {
          $scope.error = true;
          $scope.$apply();
          console.error('Geocode was not successful for the following reason: ' + status);
        }
      });
    };

    $scope.searchGeolocation = function() {
      $scope.user.loadingLoc = true;
      getGeolocation(function (pos) {
        console.log(pos);
        var _lng = pos.coords.longitude;
        var _lat = pos.coords.latitude;
        var latlng = { lat: _lat, lng: _lng };
        $window.Geocoder.geocode({ 'location': latlng }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            $scope.user.lat = results[0].geometry.location.lat();
            $scope.user.lng = results[0].geometry.location.lng();
            $scope.error = false;
            $scope.user.loadingLoc = false;
            $scope.user.address = results[0].formatted_address;
            $scope.user.borough = getUserBorough(results[0].formatted_address);
            $scope.update();
          } else {
            $scope.error = true;
            $scope.$apply();
            console.error('Geocode was not successful for the following reason: ' + status);
          }
        });
      });
    }

    $scope.toggleBorough = function(byBorough) {
      $scope.user.byBorough = byBorough;
      $scope.update();
    };

    $scope.update = function() {
      var lat = $scope.user.lat;
      var lng = $scope.user.lng;
      $scope.updateCartoMap(lat, lng, $scope.user.byBorough);
      $scope.updateCartoList(lat, lng, $scope.user.byBorough);
    };

    $scope.updateCartoList = function(lat, lng, borough) {
      CartoDB.queryByLatLng(lat, lng, borough)
        .done(function (data) {

          if(data.rows.length == 0) {
            console.log('no local');
            // $scope.hasLocal = false;
            $scope.toggleBorough(true);
          } else {

            // if(!borough) $scope.hasLocal = true;
            $scope.resources = data.rows;
            // need to use $apply() because the callback is from cartodb.SQL, not $http
            $scope.$apply();
          }

        }).error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
      };

    var getUserBorough = function(addr) {
      if(/Brooklyn/i.test(addr)) return 'Brooklyn';
      if(/Queens/i.test(addr)) return 'Queens';
      if(/Manhattan/i.test(addr)) return 'Manhattan';
      if(/Bronx/i.test(addr)) return 'Bronx';
      if(/Staten Island/i.test(addr)) return 'Staten Island';
      return '';
    };

    var getGeolocation = function(callback) {
      if (navigator.geolocation) {
        var timeoutVal = 10 * 1000 * 1000;
        navigator.geolocation.watchPosition(
          callback,
          alertError,
          { enableHighAccuracy: true, timeout: timeoutVal, maximumAge: 0 }
        );
      }
      else {
        alert("Geolocation is not supported by this browser");
      }

      function alertError(error) {
        var errors = {
          1: 'Permission denied',
          2: 'Position unavailable',
          3: 'Request timeout'
        };
        alert("Error: " + errors[error.code]);
      }
    };


}]);
