const duckhunt = require('../../duckhunt.js');
const duckDB = require('./duckhunt_lowdb.js');

const express = require('express');
const app = express();

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
  
  var onDuckHuntRecv = function(message) {
    console.log(message);
  }
  
  duckhunt.startDuckHunt(onDuckHuntRecv, duckDB);
  setTimeout(function(){duckhunt.handleFriend("romedtino")}, 2000);
  setTimeout(function(){duckhunt.handleBang("romedtino")}, 2000);
  setTimeout(function(){duckhunt.handleFriend("romedtino")}, 2000);
  setTimeout(function(){duckhunt.lookUpKills("")}, 2000);
  setTimeout(function(){duckhunt.lookUpFriends("romedtino")}, 2000);
});