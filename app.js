var restify = require('restify');
var builder = require('botbuilder');
var config = require('./config.json');
var http = require('http');
//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 8080, function () {
   console.log('%s listening to %s', server.name, server.url);
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: config.appId,
    appPassword: config.appPassword
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
//Bot on
bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text(
                  "Hello %s... Thanks for adding me. My name is Neli and I am a bot that helps you with coporate information about\
                  Estonian Comapnies. Test me out by typing 'Get me financial information on Mooncascade' to get the company's financial information", name || 'there'
                );
        bot.send(reply);
    } else {
        // delete their data
    }
});
bot.on('typing', function (message) {
  // User is typing
});
bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});
//=========================================================
// Bots Dialogs
//=========================================================
String.prototype.contains = function(content){
  return this.indexOf(content) !== -1;
}

// Checker function for keywords
function checkMessage(message, valueToCheck) {
  if(message.contains(valueToCheck)) {
    return true;
  }
}

function getInfoRegData(session, company, action) {
    var host = "http://nellychatbot-randomnames.azurewebsites.net/api"
    var params = "?company=%cm&action=%ac".replace(/%cm/, company).replace(/%ac/, action);
    var query = host + params
    console.log(query);
    http.get(query, function(res){
      var buffer = "";
      res.on('data', function(chunk) {
        session.send(res.code);
        buffer += chunk;
      });

      res.on('end', function(){
        var bufferStr = buffer;
        const bufferJson = JSON.parse(bufferStr);
        if (typeof bufferJson.message === 'undefined') {
          session.send("Hey, I couldn't get you the requested information at the moment :D I'm still a work in progress");
        } else {
          session.send(bufferJson.message);
        }
      });

      res.on('error', function(){
        session.send("Hey, I couldn't get find anything on the company. Try again please");
      });
    });
}

function getCompanyName(message){
  var indexValue = message.indexOf("of ");
  let companyName;
  if (indexValue < 1) {
    companyName = message.substring(message.lastIndexOf('on ')+3);
  }else {
    companyName = message.substring(message.lastIndexOf('of ')+3);
  }
  return companyName;
}

function capitalize(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function defaultErrorMessage(session){
  session.send(`Sorry I'm not so smart yet :D I'm still a work in progress :)`);
}

bot.dialog('/', function (session) {
    var message = session.message.text.toLowerCase();
    if(checkMessage(message, 'hello')){
      session.send(`Hey, How are you?`);
    }else if(checkMessage(message, 'help')){
        session.send(`How can I help you?`);
    }else if(checkMessage(message, 'api')){
      session.send('Hang on a few seconds while we get you the required information');
      http.get('http://api.fixer.io/latest', function(res){
        var buffer = "";
        res.on('data', function(chunk) {
          buffer += chunk;
        });

        res.on('end', function(){
          session.send(buffer);
        });
      });
    }else if(checkMessage(message, 'information') || checkMessage(message, 'info')){
      var name = session.message.user ? session.message.user.name : null;
      let companyName;
      if(checkMessage(message, 'board')){
        session.send('Hang on a few seconds while we get you the required company board information');
        companyName = getCompanyName(message);
        getInfoRegData(session, companyName, 'board');
      }else if (checkMessage(message, 'history')) {
        defaultErrorMessage(session);
      }else if (checkMessage(message, 'financial')) {
        session.send('Hang on a few seconds while we get you the required financial information');
        companyName = getCompanyName(message);
        console.log(companyName);
        getInfoRegData(session, companyName, 'financial');
      }else if (checkMessage(message, 'credit')) {
        defaultErrorMessage(session);
      }else {
        session.send('Hey %s... What kind of information exactly do you want and for what company?', capitalize(name) || 'there');
      }
      }else{
        defaultErrorMessage(session);
      }
});
