// Creates a global variable for the db
ChiddyBang = new Mongo.Collection("chiddyBang");

if (Meteor.isClient) {

  Template.FBlogin.events({
    'click #login': function() {
        Meteor.loginWithFacebook({}, function(err){
          if (err) {
            throw new Meteor.Error("Facebook login failed");
          } else {
            window.location.reload();
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
      // window.location.reload();
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

        var localEvent = {
          "userID":         $("#userID").val(),
          "usersName":      $("#usersName").val(),
          "eventName":      $("#eventName").val(),
          "eventLoc":       $("#eventLoc").val(),
          "eventLocLat":    $("#locLat").val(),
          "eventLocLong":   $("#locLong").val(),
          "eventDate":      $("#eventDate").val(),
          "eventStartTime": $("#eventStartTime").val(),
          "eventEndTime":   $("#eventEndTime").val(),
          "joinAs":         $("input[name='joinAs']:checked").val(),
          "numSeats":       $("#numTransport :selected").val(),
          "seatsLeft":      $("#numTransport :selected").val(),
          "chargeAmount":   $("#chargeAmount").val(),
          "otherNotes":     $("#otherNotes").val(),
          "attendees":      []
        };

        ChiddyBang.insert(localEvent);
        alert("Event added!");
        window.location = "localhost:3000/";

    }
  });

  Template.localEvents.helpers({
    whichOne: function () {
      switch(Session.get('template')){
        case "newEvent":
          return 'newEvent';
        case "allEvents":
          return "allEvents";
        case "myEvents":
          return "myEvents";
        case "eventsJoined":
          return "eventsJoined";

        default:
          return "allEvents";
      }
    }
  });

  getLocation = function(output) {
    var UserPosition = {};
    if(output == true){
      $("#locationStatus").html("Getting Location...");
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            UserPosition = {
              lat: position.coords.latitude,
              long: position.coords.longitude
            };
            
            $("#locationStatus").html("Got your location!");
            // $("#locationStatus").append(UserPosition.lat);
            // return UserPosition;
          },
          function(error){
            if (error.code == error.PERMISSION_DENIED){
              $("#locationStatus").html("Geolocation permission denied. You will not be able to find locations near you!");
            }
          });
        } 
        else {
          $("#locationStatus").html("Geolocation is not supported by this browser.");
        }
    } else {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            UserPosition = {
              lat: position.coords.latitude,
              long: position.coords.longitude
            };
            // console.log(UserPosition);
          },
          function(error){
            if (error.code == error.PERMISSION_DENIED){
              console.log("Geolocation permission denied. You will not be able to find locations near you!");
            }
          });
        } 
        else {
          console.log("Geolocation is not supported by this browser.");
        }
    }
    return UserPosition;
    
  }

  Template.landingPage.rendered = function(){
    $("body").addClass("landingPageBG");
    getLocation(true);
  }

  toRad = function(Value) {
    return Value * Math.PI / 180;
  }

  calcDist = function(lat2, lon2) {
    var R = 6371; // km
    var d = 0;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var lat1 = position.coords.latitude;
        var lon1 = position.coords.longitude;

        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);  
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        d = R * c;

        console.log(d);
        return d;

      },
      function(error){
        if (error.code == error.PERMISSION_DENIED){
          console.log("Geolocation permission denied. You will not be able to find locations near you!");
        }
      });
    }
    // console.log(d);
    return d;
    };

  Template.allEvents.rendered = function(){
    if(!this.rendered){
      window.onload = function() {
        $("body").removeClass("landingPageBG");
        
        // var UserPosition = getLocation(false);
        // console.log(UserPosition);

        var events = ChiddyBang.find().fetch();
        // console.log(events);
        var today = new Date();
        var day = today.getDate();
        var month = today.getMonth() +1;
        var year = today.getFullYear();

        if(month < 10){
          month = "0"+month;
        }
        if(day < 10){
          day = "0"+day;
        }

        var tmpDate = year+"-"+month+"-"+day;
        var userID = $("#userID").val();

        for(var i=0; i < events.length; i++){

          var localEvent = events[i];
          var eventID = events[i]["_id"];
          var mapcanvas = "map"+i.toString();

          if(localEvent['eventDate'] >= tmpDate){
            var Dparts = localEvent['eventDate'].split("-");
            var STparts = localEvent['eventStartTime'].split(":");
            var ETparts = localEvent['eventEndTime'].split(":");

            var eventStart = new Date(Dparts[0],Dparts[1]-1,Dparts[2],STparts[0],STparts[1],0);
            eventStart = eventStart.toString().replace("GMT-0400 (EDT)","");

            var eventEnd = new Date(Dparts[0],Dparts[1]-1,Dparts[2],ETparts[0],ETparts[1],0);
            eventEnd = eventEnd.toString().replace("GMT-0400 (EDT)","");
            
            var eventInfo = "<div class='eventInfo col-md-6'><div class='eventName'>"+localEvent['eventName']+"</div>";
            eventInfo += "<div class='row'><div class='col-md-6 mapCol'><div id='"+mapcanvas+"' class='map-canvas'></div></div>";
            eventInfo += "<div class='col-md-6'>";
            eventInfo += "<div class='eventStartTime'>Starts: "+eventStart+"</div>";
            eventInfo += "<div class='eventEndTime'>Ends: "+eventEnd+"</div>";
            
            if(localEvent['otherNotes']!==""){
              eventInfo += "<div class='otherNotes'>Notes: "+localEvent['otherNotes']+"</div>";
            }
            
            if(localEvent['chargeAmount'] === "0"){
              eventInfo += "<div class='chargeAmount'>Price: Free</div>";
            } else {
              eventInfo += "<div class='chargeAmount'>Price: $"+localEvent['chargeAmount']+"</div>";
            }
            
            eventInfo += "<div class='seats'><span class='seatsLeft'>"+localEvent['seatsLeft']+"</span> Seats Left</div>";

            var attendees = localEvent['attendees'];
            var isAttending = false;
            for(var j=0; j<attendees.length; j++){
              if(attendees[j]['userID'] === userID){
                isAttending = true;
              }
            }

            if(isAttending){
              eventInfo += "<input type='button' class='leaveEvent btn btn-danger' id='"+eventID+"' value='Leave'>&nbsp;";
            } else {
              eventInfo += "<input type='button' class='joinEvent btn btn-success' id='"+eventID+"' value='Join'>&nbsp;";
            }

            eventInfo += "<input type='button' class='contactEvent btn btn-info' id='"+localEvent['userID']+"' value='Contact'>";
            eventInfo += "</div></div>";

            $("#events").append(eventInfo);
            
            var geocoder = new google.maps.Geocoder();

            var locLat = localEvent["eventLocLat"];
            var locLong = localEvent["eventLocLong"];

            // console.log(calcDist(UserPosition.lat, UserPosition.long, locLat, locLong));
            // console.log(UserPosition.lat);
            var distance = calcDist(locLat, locLong);
            console.log("d:"+distance);
            // console.log($("#usersGeolocation").html());

            var mapOptions = {
              center: new google.maps.LatLng(locLat, locLong),
              zoom: 16,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(document.getElementById(mapcanvas), mapOptions); 

            map.setCenter(new google.maps.LatLng(locLat, locLong));

            var infowindow = new google.maps.InfoWindow({
              content: localEvent["eventName"] + "<br>" + localEvent["eventLoc"]
            });
            var companyMarker = new google.maps.Marker({ 
              position: new google.maps.LatLng(locLat, locLong), 
              map: map,
              title: localEvent["eventName"] + "<br>" + localEvent["eventLoc"],
              visible:true
            });
            infowindow.open(map,companyMarker);
          }
        }
      }
      this.rendered = true;
    }
  }

  Template.allEvents.events({
    'click .joinEvent': function(event, template){
      var eventID = event["currentTarget"]["id"];
      var userID = $("#userID").val();

      // User isn't logged int
      if(userID === "0"){
        $("#alertBar").addClass("alert alert-danger");
        $("#alertBar").html("Alert: You must login first before you can join an event");
      } else {
        var event = ChiddyBang.find({"_id":eventID}).fetch();
        event = event[0];
        // The event coordinator is trying to join their own event
        if(event['userID'] === userID){
          $("#alertBar").addClass("alert alert-warning");
          $("#alertBar").html("Warning: You can't join your own event.");
        } else {
          var seatsLeft = event['seatsLeft'];
          seatsLeft--;

          var attendees = event['attendees'];
          attendees.push({"userID":$("#userID").val(), "usersName":$("#usersName").val()});

          ChiddyBang.update({"_id": eventID}, {$set: {
            "seatsLeft": seatsLeft,
            "attendees": attendees
          }});

          $("#alertBar").addClass("alert alert-success reload");
          $("#alertBar").html("Joined Event! Click to reload the page.");
        }
        
      }
    },
    'click .leaveEvent': function(event, template){
      var eventID = event["currentTarget"]["id"];
      var userID = $("#userID").val();
      // alert(eventID);
      var event = ChiddyBang.find({"_id":eventID}).fetch();
      event = event[0];
      var attendees = event['attendees'];
      var seatsLeft = event['seatsLeft'];
          

      // console.log(attendees);
      for(var j=0; j<attendees.length; j++){
        if(attendees[j]['userID'] === userID){
          console.log("deleting");
          attendees.splice(j,1);
          seatsLeft++;
        }
      }

      ChiddyBang.update({"_id": eventID}, {$set: {
        "seatsLeft": seatsLeft,
        "attendees": attendees
      }});


      $("#alertBar").addClass("alert alert-success reload");
      $("#alertBar").html("Left Event! Click to reload the page.");
    },
    'click .contactEvent': function(event, template){
      var userID = $("#userID").val();

      if(userID === "0"){
        $("#alertBar").addClass("alert alert-danger");
        $("#alertBar").html("Alert: You must login first before you can contact the event coordinator.");
      } else {
        var eventUserID = event['currentTarget']['id'];

        var config = Accounts.loginServiceConfiguration.findOne({service: 'facebook'});
        var url = "http://www.facebook.com/dialog/send?app_id=" + config.appId + 
        "&display=popup&to="+eventUserID+"&link=https://github.com/jamesadler/ChiddyBang"+
        "&redirect_uri=" + Meteor.absoluteUrl('_fb?close');
  
        window.open(url, "Create Post", "height=240,width=450,left=100,top=100");
      }
    }
  });

  Template.alertBar.events({
    'click #alertBar': function(event, template){
      $("#alertBar").removeClass().html("");
    },
    'click .reload': function(event, template){
      window.location.reload();
    }
  });


  Template.newEvent.rendered = function () { 

    if(!this.rendered){

      $("#homeBtn").addClass("active");
      $("#myEventsBtn").removeClass("active");
      input = document.getElementById('eventLoc');
      window.onload = function() { 
          // input = document.getElementById('eventLoc'); 
          eventLoc = new google.maps.places.Autocomplete(input); 
   
          // When the user selects an address from the dropdown, 
          google.maps.event.addListener(eventLoc, 'place_changed', function() { 

               // Get the place details from the autocomplete object. 
               var place = eventLoc.getPlace(); 

               console.log(place['formatted_address']);

               var geocoder = new google.maps.Geocoder();
                var address = place['formatted_address'];
                geocoder.geocode( { 'address': address}, function(results, status) {
                  if (status == google.maps.GeocoderStatus.OK) {

                    var tmpLatLong = results[0].geometry.location;

                    var latLong = [];
                    for(key in tmpLatLong){
                      if(typeof tmpLatLong[key] == 'number'){
                        latLong.push(tmpLatLong[key]);
                      }
                      if(latLong.length == 2){
                        break;
                      }
                    }

                    $("#locLat").val(latLong[0]);
                    $("#locLong").val(latLong[1]);

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
      this.rendered = true;

    } 
  };

  Template.newEvent.destroyed = function() {
    Session.set('map', false);
  };

  Template.myEvents.rendered = function(){
    if(!this.rendered){
      // $("ul.nav >li.active").removeClass("active");
      $("#homeBtn").removeClass("active");
      $("#myEventsBtn").addClass("active");

      var user_ID = $("#userID").val();
      console.log(user_ID);

      var events = ChiddyBang.find({userID:user_ID}).fetch();

      for(var i=0; i < events.length; i++){

        var localEvent = events[i];
        var eventID = events[i]["_id"];

        var eventInfo = "<div class='eventInfo col-md-6 edit' id='"+eventID+"'>";
        eventInfo += "<div>Event Name: <input type='text' class='eventName' value='"+localEvent['eventName']+"'></div>";
        eventInfo += "<div>Address: "+localEvent['eventLoc']+"</div>";
        eventInfo += "<div>Event Date: <input type='date' class='eventDate' value='"+localEvent['eventDate']+"'></div>";
        eventInfo += "<div>Event Start Time: <input type='time' class='eventStartTime' value='"+localEvent['eventStartTime']+"'></div>";
        eventInfo += "<div>Event End Time: <input type='time' class='eventEndTime' value='"+localEvent['eventEndTime']+"'></div>";
        eventInfo += "<div>Gas Charge: <input type='number' class='chargeAmount' value='"+localEvent['chargeAmount']+"'></div>";
        eventInfo += "<div>Notes: <textarea class='otherNotes'>"+localEvent['otherNotes']+"</textarea></div>";
        eventInfo += "<div>Seats left: "+localEvent['seatsLeft']+"</div>";

        if(localEvent['attendees'].length > 0){
          eventInfo += "<div>Attendees: ";
          for(var j=0; j < localEvent['attendees'].length; j++){
            eventInfo += "<div class='attendee'>"+localEvent['attendees'][j]['usersName']+"</div>";
          }
          eventInfo += "</div";
        }
        
        eventInfo += "<div><input type='button' class='updateEvent btn btn-info' value='Update Event'>&nbsp;";
        eventInfo += "<input type='button' class='closeEvent btn btn-info' value='Close Event'></div></div>";
        
        $("#events").append(eventInfo);

      }
      this.rendered = true;
    }
  };

  Template.myEvents.events({
    'click .updateEvent': function(event, template){
      var eventID = event['currentTarget']['parentElement']['parentElement']['id'];
      
      ChiddyBang.update({"_id":eventID},{$set: {
        "eventName":      $("#"+eventID+" .eventName").val(),
        "eventDate":      $("#"+eventID+" .eventDate").val(),
        "eventStartTime": $("#"+eventID+" .eventStartTime").val(),
        "eventEndTime":   $("#"+eventID+" .eventEndTime").val(),
        "chargeAmount":   $("#"+eventID+" .chargeAmount").val(),
        "otherNotes":     $("#"+eventID+" .otherNotes").val()
      }});
      alert("Event Info Updated!");
    },
    'click .closeEvent': function(event, template){
      var eventID = event['currentTarget']['parentElement']['parentElement']['id'];
      var r = confirm("This will permanently remove the event, are you sure you want to continue");
      if(r === true){
        ChiddyBang.remove(eventID);
        alert("Event closed!");
      } else {
        alert("Canceled");
      }
      
    }
  });

  Template.leftNav.events({
    'click #homeBtn': function(event, template){
      Session.set('template','allEvents');
      window.location.reload();
    },
    'click #myEventsBtn': function(event, template){
      Session.set('template', 'myEvents');
      // window.location.reload();
    }
  });

  Template.eventsJoined.rendered = function(){
    if(!this.rendered){
      $("#homeBtn").removeClass("active");
      $("#myEventsBtn").removeClass("active");
      // $("#eventsJoinedBtn").addClass("active");
    //   window.onload = function() {
    //   var events = ChiddyBang.find().fetch();
    //   console.log(events);
    //   var today = new Date();
    //   var day = today.getDate();
    //   var month = today.getMonth() +1;
    //   var year = today.getFullYear();

    //   if(month < 10){
    //     month = "0"+month;
    //   }
    //   if(day < 10){
    //     day = "0"+day;
    //   }

    //   var tmpDate = year+"-"+month+"-"+day;
    //   var userID = $("#userID").val();

    //   for(var i=0; i < events.length; i++){

    //     var localEvent = events[i];
    //     var eventID = events[i]["_id"];
    //     var mapcanvas = "map"+i.toString();


    //     if(localEvent['eventDate'] >= tmpDate){
    //       var Dparts = localEvent['eventDate'].split("-");
    //       var STparts = localEvent['eventStartTime'].split(":");
    //       var ETparts = localEvent['eventEndTime'].split(":");

    //       var eventStart = new Date(Dparts[0],Dparts[1]-1,Dparts[2],STparts[0],STparts[1],0);
    //       eventStart = eventStart.toString().replace("GMT-0400 (EDT)","");

    //       var eventEnd = new Date(Dparts[0],Dparts[1]-1,Dparts[2],ETparts[0],ETparts[1],0);
    //       eventEnd = eventEnd.toString().replace("GMT-0400 (EDT)","");
          
    //       var eventInfo = "<div class='eventInfo col-md-6'><div class='eventName'>"+localEvent['eventName']+"</div>";
    //       eventInfo += "<div class='row'><div class='col-md-6 mapCol'><div id='"+mapcanvas+"' class='map-canvas'></div></div>";
    //       eventInfo += "<div class='col-md-6'>";
    //       eventInfo += "<div class='eventStartTime'>Starts: "+eventStart+"</div>";
    //       eventInfo += "<div class='eventEndTime'>Ends: "+eventEnd+"</div>";
          
    //       if(localEvent['otherNotes']!==""){
    //         eventInfo += "<div class='otherNotes'>Notes: "+localEvent['otherNotes']+"</div>";
    //       }
          
    //       if(localEvent['chargeAmount'] === "0"){
    //         eventInfo += "<div class='chargeAmount'>Price: Free</div>";
    //       } else {
    //         eventInfo += "<div class='chargeAmount'>Price: $"+localEvent['chargeAmount']+"</div>";
    //       }
          
    //       eventInfo += "<div class='seats'><span class='seatsLeft'>"+localEvent['seatsLeft']+"</span> Seats Left</div>";

    //       var attendees = localEvent['attendees'];
    //       var isAttending = false;
    //       for(var j=0; j<attendees.length; j++){
    //         if(attendees[j]['userID'] === userID){
    //           isAttending = true;
    //         }
    //       }

    //       if(isAttending){
    //         eventInfo += "<input type='button' class='leaveEvent btn btn-danger' id='"+eventID+"' value='Leave'>&nbsp;";
    //       } else {
    //         eventInfo += "<input type='button' class='joinEvent btn btn-success' id='"+eventID+"' value='Join'>&nbsp;";
    //       }

    //       eventInfo += "<input type='button' class='contactEvent btn btn-info' id='"+localEvent['userID']+"' value='Contact'>";
    //       eventInfo += "</div></div>";

    //       $("#events").append(eventInfo);
          
    //       var geocoder = new google.maps.Geocoder();

    //       var locLat = localEvent["eventLocLat"];
    //       var locLong = localEvent["eventLocLong"];

    //       var mapOptions = {
    //         center: new google.maps.LatLng(locLat, locLong),
    //         zoom: 16,
    //         mapTypeId: google.maps.MapTypeId.ROADMAP
    //       };

    //       map = new google.maps.Map(document.getElementById(mapcanvas), mapOptions); 

    //       map.setCenter(new google.maps.LatLng(locLat, locLong));

    //       var infowindow = new google.maps.InfoWindow({
    //         content: localEvent["eventName"] + "<br>" + localEvent["eventLoc"]
    //       });
    //       var companyMarker = new google.maps.Marker({ 
    //         position: new google.maps.LatLng(locLat, locLong), 
    //         map: map,
    //         title: localEvent["eventName"] + "<br>" + localEvent["eventLoc"],
    //         visible:true
    //       });
    //       infowindow.open(map,companyMarker);
    //     }
    //   }
    // }

      this.rendered = true;
    }
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
