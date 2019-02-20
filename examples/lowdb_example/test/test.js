const rewire = require('rewire');
const duckDB = require('../duckhunt_lowdb.js');
const expect = require('chai').expect;
const should = require('chai').should;

var duckhunt = rewire('../../../duckhunt.js');

// listen for requests :)
//const express = require('express');
//const app = express(); // TODO take advantage for test?
//const listener = app.listen(process.env.PORT, function() {
//  console.log('Your app is listening on port ' + listener.address().port);   
//});

var onDuckHuntRecv = function(message) {
  console.log("TEST RECEIVER: " + message);
}

describe('Duckhunt Test', function () {
  describe('startDuckHunt-valid', function() {
    it('should start the duck hunt game correctly', function () {
      duckhunt.startDuckHunt(onDuckHuntRecv, duckDB);
      expect(duckhunt.isRunning()).to.be.true;
      duckhunt.stopDuckHunt();
      expect(duckhunt.isRunning()).to.be.false;
    });
    it('should try to befriend an entity', function () {
      var createDuck = duckhunt.__get__('createDuck');
      createDuck();
      duckhunt.handleFriend("bruce");
    });
    /**it('should try to shoot an entity', function () {
      duckhunt.handleBang("bruce");
    });
    it('should try and befriend an entity', function () {
      duckhunt.handleFriend("tony");
    });
    it('should return a list of killers', function () {
      duckhunt.lookUpKills("");
    });
    it('should return a list of friends', function () {
      duckhunt.lookUpFriends("bruce");
    });
    **/
  });
  
});