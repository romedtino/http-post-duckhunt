const rewire = require('rewire');
const duckDB = require('../duckhunt_lowdb.js');
const expect = require('chai').expect;
const should = require('chai').should;

var duckhunt = rewire('../../../duckhunt.js');

// TODO take advantage for test?
//const express = require('express');
//const app = express(); 
//const listener = app.listen(process.env.PORT, function() {
//  console.log('Your app is listening on port ' + listener.address().port);   
//});

stopHuntTest = function() {
  duckhunt.stopDuckHunt();
  expect(duckhunt.isRunning()).to.be.false;
}

defaultRecv = function(message) {
  console.log("DEFAULT RECEIVER: " + message);
}

setDefaultRecv = function(duckhunt) {
  duckhunt.__set__('callback', defaultRecv);
}

describe('Duckhunt Test', function () {
  describe('startDuckHunt-valid', function() {
    
    it('should start the duck hunt game correctly', function (done) {
      
      duckhunt.startDuckHunt(defaultRecv, duckDB);
      expect(duckhunt.isRunning()).to.be.true;
      stopHuntTest();
      done();
    });
    
    it('should try to befriend an entity', function (done) {
      let onFriendRecv = function(message) {
        let friendKeys = duckhunt.__get__('miss_friend');
        friendKeys.push("You're friends with");
        console.log("onFriendRecv RECEIVER: " + message);
        let entryFound = false;
        for(let i=0;i<friendKeys.length;i++) {
          if(message.includes(friendKeys[i])) {
            entryFound = true;
            break;
          }
        }
        expect(entryFound).to.be.true;
        stopHuntTest();
        done();
      }
      
      setDefaultRecv(duckhunt);
      
      let createDuck = duckhunt.__get__('createDuck');
      createDuck();
      duckhunt.__set__('callback', onFriendRecv);
      let assessHitOrMiss = duckhunt.__get__('assessHitOrMiss')
      assessHitOrMiss("bruce", "bef", new Date());
      
    });
    
    it('should try to kill an entity', function (done) {
      let onBangRecv = function(message) {
        let bangKeys = duckhunt.__get__('miss_bang');
        bangKeys.push("You have shot");
        console.log("onBangRecv RECEIVER: " + message);
        let entryFound = false;
        for(let i=0;i<bangKeys.length;i++) {
          if(message.includes(bangKeys[i])) {
            entryFound = true;
            break;
          }
        }
        expect(entryFound).to.be.true;
        stopHuntTest();
        done();
      }
      
      setDefaultRecv(duckhunt);
      
      let createDuck = duckhunt.__get__('createDuck');
      createDuck();
      duckhunt.__set__('callback', onBangRecv);
      let assessHitOrMiss = duckhunt.__get__('assessHitOrMiss')
      assessHitOrMiss("bruce", "bang", new Date());
      
    });
    

    /**it('should try and befriend an entity', function () {
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