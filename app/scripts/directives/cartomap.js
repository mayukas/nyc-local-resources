'use strict';

/**
 * @ngdoc directive
 * @name localResourcesApp.directive:cartoMap
 * @description
 * # cartoMap
 */
angular.module('localResourcesApp')
  .directive('cartoMap', ['$rootScope', 'CartoDB', function ($rootScope, CartoDB) {
    return {
      restrict: 'E',
      template: '<div id="map" class="panel"></div>',
      scope: false,
      link: function postLink(scope, element, attrs) {

        /*** init map ***/
        var map = L.map('map', {
          scrollWheelZoom: false,
          center: [40.6462615921222, -73.96270751953125],
          zoom: 11,
        });

        L.Icon.Default.imagePath = "images/leaflet";

        var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
        });
        map.addLayer(layer);

        var mapbox_token = 'pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw';

        // L.mapbox.accessToken = 'pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw';
        // // Replace 'mapbox.streets' with your map id.
        // var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
        //     attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        // });
        // var map = L.map('map')
        //     .addLayer(mapboxTiles);

        map.on('click', function(e) {
            var tempLat = scope.user.lat = e.latlng.lat;
            var tempLng = scope.user.lng = e.latlng.lng;
            scope.updateCartoMap(tempLat, tempLng, scope.user.byBorough);
            scope.updateCartoList(tempLat, tempLng, scope.user.byBorough);
          //
          //
          // //  console.log(tempLng, tempLat);
          //   scope.updateCartoMap(tempLat, tempLng);
          //   CartoDB.queryByLatLng(tempLat, tempLng).done(function (data) {
          //     // console.log(data);
          //     scope.resources = data.rows;
          //     scope.$apply();
          //   });
        });


        var mainSublayer;
        var userMarker;

        /*** init carto layers ***/
        var layerSource = {
          user_name: 'dan-kass',
          type: 'cartodb',
          sublayers: [{
            sql: "SELECT * FROM brooklyn_cbos_locations",
            // sql: "SELECT * FROM brooklyn_cbo_locations WHERE service_area_type IN ('neighborhood','zipcode','community_board')",
            cartocss: "#brooklyn_cbos_locations{marker-fill-opacity:.9;marker-line-color:#FFF;marker-line-width:1;marker-line-opacity:1;marker-placement:point;marker-type:ellipse;marker-width:10;marker-fill:#F60;marker-allow-overlap:true}#brooklyn_cbos_locations::labels{text-name:[rownum];text-face-name:'DejaVu Sans Book';text-size:20;text-label-position-tolerance:10;text-fill:#000;text-halo-fill:#FFF;text-halo-radius:2;text-dy:-10;text-allow-overlap:true;text-placement:point;text-placement-type:simple}"
          }]
        };

        cartodb.createLayer(map, layerSource)
          .addTo(map)
          .done(function(layer) {
            mainSublayer = layer.getSubLayer(0);
            // do stuff
            //console.log("Layer has " + layer.getSubLayerCount() + " layer(s).");
          })
          .error(function(err) {
            // report error
            console.log("An error occurred: " + err);
          });

        scope.updateCartoMap = function(lat, lng, borough) {

          var boroughString = borough ? '' : 'NOT';
          var query = "SELECT *, row_number() OVER (ORDER BY dist) as rownum FROM ( SELECT loc.cartodb_id, loc.the_geom, loc.the_geom_webmercator, round( (ST_Distance( ST_GeomFromText('Point(" + lng + " " + lat + ")', 4326)::geography, loc.the_geom::geography ) / 1609)::numeric, 1 ) AS dist FROM nyc_cbos_locations AS loc, nyc_cbos_service_areas AS sa WHERE ST_Intersects( ST_GeomFromText( 'Point(" + lng + " " + lat + ")', 4326 ), sa.the_geom ) AND loc.organization = sa.organization AND sa.service_area_type " + boroughString + " IN ('borough') ORDER BY dist ASC ) T LIMIT 10";
          if(userMarker) map.removeLayer(userMarker);
          userMarker = L.marker([lat,lng]);
          userMarker.addTo(map);
          mainSublayer.setSQL(query);

          CartoDB.getSQL().getBounds(query).done(function(bounds) {
            //console.log(lat,lng);
            bounds.push([lat,lng]);
            //console.log(bounds);
          //$rootScope.cartoSQL.getBounds(query).done(function(bounds) {
            map.fitBounds(bounds, { padding: [25,25] });
          });
        };

      }
    };
}]);
