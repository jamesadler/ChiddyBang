var localEvents = new Mongo.Collection('localEvents');

if (Meteor.isClient) {
  // Session.set('template','newEvent');

  Template.FBlogin.events({
    'click #login': function() {
        Meteor.loginWithFacebook({}, function(err){
          if (err) {
            throw new Meteor.Error("Facebook login failed");
          }
        });
    },
    'click #logout': function(event) {
        Meteor.logout(function(err){
          if (err) {
            throw new Meteor.Error("Logout failed");
          }
        });
    },
    'click #createNewEvent': function(event){
      Session.set('template','newEvent');
    },
    'keypress #search': function(event, template){
      if(event.which === 13){
        var q = template.find("#search").value;
        alert(q);
      }
    }
  });

  Template.localEvents.events({
    'click #submitEvent': function(event, template){
        // var eventName = $("#eventName").val();
        // var eventLoc = $("#eventLoc").val();
        // var eventLocLat = $("#locLat").val();
        // var eventLocLong = $("#locLong").val();
        // var joinAs = $("input[name='joinAs']:checked").val();
        // var numTransport = $("#numTransport :selected").val();
        // var chargeAmount = $("#chargeAmount").val();
        // var otherNotes = $("#otherNotes").html();
        var localEvent = [{
          "eventName": $("#eventName").val(),
          "eventLoc": $("#eventLoc").val(),
          "eventLocLat": $("#locLat").val(),
          "eventLocLong": $("#locLong").val(),
          "joinAs": $("input[name='joinAs']:checked").val(),
          "numTransport": $("#numTransport :selected").val(),
          "chargeAmount": $("#chargeAmount").val(),
          "otherNotes":$("#otherNotes").val()
        }];

        // console.log(localEvent);
        // localEvents = new Mongo.Collection('localEvents');

        localEvents.insert(localEvent);
        localEvents.find();

    }
  });

  Template.localEvents.helpers({
    whichOne: function () {
      switch(Session.get('template')){
        case "newEvent":
          return 'newEvent';
          // return "mapPostsList";
        case "allEvents":
          return "allEvents";

        default:
          return "allEvents";
      }
    }
  });


  Template.newEvent.rendered = function () { 
    window.onload = function() { 

        input = document.getElementById('eventLoc'); 
        eventLoc = new google.maps.places.Autocomplete(input); 

        // When the user selects an address from the dropdown, 
        google.maps.event.addListener(eventLoc, 'place_changed', function() { 

             // Get the place details from the autocomplete object. 
             var place = eventLoc.getPlace(); 

             console.log(place['formatted_address']);

             var geocoder = new google.maps.Geocoder();
              var address = place['formatted_address'];//document.getElementById("address").value;
              geocoder.geocode( { 'address': address}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {


                  var locLat = results[0].geometry.location.k;
                  var locLong = results[0].geometry.location.D;

                  $("#locLat").val(locLat);
                  $("#locLong").val(locLong);

                  var mapOptions = {
                    center: new google.maps.LatLng(locLat, locLong),
                    zoom: 16,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                  };

                  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions); 

                  map.setCenter(new google.maps.LatLng(locLat, locLong));

                  var infowindow = new google.maps.InfoWindow({
                    content: document.getElementById("eventName").value + "<br>" + place['formatted_address']
                  });
                  var companyMarker = new google.maps.Marker({ 
                    position: new google.maps.LatLng(locLat, locLong), 
                    map: map,
                    title: document.getElementById("eventName").value + "<br>" + place['formatted_address'],
                    visible:true
                  });
                  infowindow.open(map,companyMarker);
                  
                  Session.set('map', true); 
                }
              });
        }); 
    }; 
  };

  Template.newEvent.destroyed = function() {
    Session.set('map', false);
  };

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    ServiceConfiguration.configurations.remove({
        service: 'facebook'
    });
     
    ServiceConfiguration.configurations.insert({
        service: 'facebook',
        appId: '839902212723606',
        secret: '0ec46338274157259c258144d60e546c'
    });
  });
}
