module.change_code = 1;
'use strict';

var alexa = require( 'alexa-app' );
var app = new alexa.app( 'eventcrawler-skill' );


app.launch( function( request, response ) {
	response.say( 'Welcome to eventcrawler!' ).shouldEndSession( false );
} );


app.error = function( exception, request, response ) {
	console.log(exception)
	console.log(request);
	console.log(response);	
	response.say( 'Sorry an error occured ' + error.message);
};

app.intent('Events',
  {
    "slots":{"date":"AMAZON.DATE","locality":"LIST_OF_LOCALITIES"}
	,"utterances":[ 
		"what events are there in {locality} for {date}",
		"where can I go in {locality} for {date}"
		]
  },
  function(request,response) {
    var date = request.slot('date');
    var locality = request.slot('locality');
    response.say("You asked for "+date + " " + locality);
  }
);

module.exports = app;
