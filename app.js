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
                  "Hello %s... Thanks for adding me. \
                  My name is Neli and I am a bot that helps you with coporate information about Estonian Comapnies\
                  Type in the company name 'Mooncascade' to get the company's coporate information", name || 'there'
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
    }else if(checkMessage(message, 'info') | checkMessage(message, 'infomation')){
      var name = session.message.user ? session.message.user.name : null;
      if(checkMessage(message, 'board')){
        session.send('Hang on a few seconds while we get you the required company board information');
      }else if (checkMessage(message, 'history')) {
        session.send('Hang on a few seconds while we get you the required company history information');
      }else if (checkMessage(message, 'financial')) {
        session.send('Hang on a few seconds while we get you the required financial information');
      }else if (checkMessage(message, 'credit')) {
        session.send('Hang on a few seconds while we get you the required credit information');
      }else {
        session.send('Hey %s... What kind of information exactly do you want and for what company?', name || 'there');
      }
      }else{
        session.send(`Sorry I'm not so smart yet :D I'm still a work in progress :)`);
      }
});
