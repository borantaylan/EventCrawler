module.change_code = 1;
'use strict';

var alexa = require('alexa-app');
var app = new alexa.app('eventcrawler-skill');
//var requestLIB = require('request');
var rp = require('request-promise');
var langdetect = require('langdetect');
const fs = require('fs-extra');
var ordinal = require('ordinal')

app.launch(function(request, response) {
    response.say('Welcome to eventcrawler!').shouldEndSession(false);
});


app.error = function(exception, request, response) {
    console.log(exception)
    console.log(request);
    console.log(response);
    response.say('Sorry an error occured ' + error.message);
};

app.intent('Events', {
        "slots": {
            "date": "AMAZON.DATE",
            "locality": "LIST_OF_LOCALITIES"
        },
        "utterances": [
            "what events are there in {locality} for {date}",
            "where can I go in {locality} for {date}"
        ]
    },
    function(request, response) {
        var date = request.slot('date');
        var locality = request.slot('locality');
				console.log(__dirname + '/query');
        var data = fs.readFileSync(__dirname + '/query', 'utf8');
        var postQuery = data.replace('{date}', formatDate(date)).replace('{date}', formatDate(date)).replace('{locality}', locality);
        //var session = request.getSession();
        var options = {
            method: 'POST',
            uri: 'http://graphdb.sti2.at:8080/repositories/TirolGraph-Alpha',
            form: {
                // Like <input type="text" name="name">
                query: postQuery
            },
            headers: {
                /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/sparql-results+json,*/*;q=0.9'
            }
        };
        //console.log(response);
        //response.say("HOPPA");
        return rp(options)
            .then(function(body) {
                // POST succeeded...
                //console.log(resx);
                //console.log(body);
                var jsonRes = JSON.parse(body);
                var results = jsonRes.results.bindings;
                var engArray = [];
                //console.log(results);
                for (var i = 0; i < results.length; i++) {
                    if (langdetect.detectOne(results[i].desc.value) == 'en') {
                        engArray.push(results[i]);
                    }
                }
                request.getSession().set("engArray", engArray);
                var constructedText = "";

                for (var i = 0; i < engArray.length; i++) {
                    constructedText = constructedText + ordinal(i + 1) + " one is called; " + engArray[i].name.value + ", "
                }
                constructedText = constructedText.substring(0, constructedText.length - 2);
                response.say("It seems, there are " + engArray.length + " interesting events around " + locality + ". " + constructedText +
                    ". Which one would you like to get info?").shouldEndSession(false);
                //return response.send();
            })
            .catch(function(err) {
                // POST failed...
                console.log(err);
                response.say("Something gone wrong").shouldEndSession(false);
                //return response.send();
                //console.log(err);
            });
    }
);
app.intent('Cards', {
        "slots": {
            "inputNum": "AMAZON.LITERAL"
        },
        "utterances": [
            "send me the information about the {first|inputNum} one",
            "send me the information about the {second|inputNum} one",
            "send me the information about the {third|inputNum} one",
            "{first|inputNum} one",
            "{second|inputNum} one",
            "{third|inputNum} one",
            "{none|inputNum}",
            "{none of them|inputNum}"
        ]
    },
    function(request, response) {
        var param = request.slot("inputNum");
        var engArray = request.getSession().get("engArray");
        var num = -1;
        if (param.toLowerCase() == "first") {
            num = 0;
        } else if (param.toLowerCase() == "second") {
            num = 1;
        } else if (param.toLowerCase() == "third") {
            num = 2;
        }
        if (num == -1) {
            response.say("Alright then, bye!").shouldEndSession(true);
        } else {
					response.say("I am sending the information to your phone.").reprompt().shouldEndSession(false);
					response.card({
							type: "Standard",
							title: "Information about " + engArray[num].name.value, // this is not required for type Simple or Standard
							text: "Description: " + engArray[num]['desc'].value +
									"\n Address: " + engArray[num]['stradr'].value +
									", " + engArray[num]['code'].value +
									"\n Telephone: " + engArray[num]['telephone'].value +
									"\n Email: " + engArray[num]['email'].value,
							image: { // image is optional
									smallImageUrl: engArray[num]['img'].value, // required
									largeImageUrl: engArray[num]['img'].value
							}
					}).shouldEndSession(true);
        }

    });

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

module.exports = app;
