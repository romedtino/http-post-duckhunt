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

defaultRecv = function(duckResults) {
  console.log("DEFAULT RECEIVER: [uniqueID]-" + duckResults.uniqueID);
  console.log("DEFAULT RECEIVER: [success]-" + duckResults.success);
  console.log("DEFAULT RECEIVER: [duckMessage]-" + duckResults.duckMessage);
  console.log("DEFAULT RECEIVER: [chat]-" + duckResults.chat);
  console.log("DEFAULT RECEIVER: [userOnly]-" + duckResults.userOnly);
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
      let onFriendRecv = function(duckResults) {
        let friendKeys = duckhunt.__get__('miss_friend');
        friendKeys.push("You're friends with");
        
        console.log("onFriendRecv RECEIVER: [uniqueID]-" + duckResults.uniqueID);
        console.log("onFriendRecv RECEIVER: [success]-" + duckResults.success);
        console.log("onFriendRecv RECEIVER: [duckMessage]-" + duckResults.duckMessage);
        console.log("onFriendRecv RECEIVER: [chat]-" + duckResults.chat);
        console.log("onFriendRecv RECEIVER: [userOnly]-" + duckResults.userOnly);
        
        expect(friendKeys.filter(entry => duckResults.chat.includes(entry))).to.have.lengthOf(1);
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
      let onBangRecv = function(duckResults) {
        let bangKeys = duckhunt.__get__('miss_bang');
        bangKeys.push("You have shot");
        
        console.log("onBangRecv RECEIVER: [uniqueID]-" + duckResults.uniqueID);
        console.log("onBangRecv RECEIVER: [success]-" + duckResults.success);
        console.log("onBangRecv RECEIVER: [duckMessage]-" + duckResults.duckMessage);
        console.log("onBangRecv RECEIVER: [chat]-" + duckResults.chat);
        console.log("onBangRecv RECEIVER: [userOnly]-" + duckResults.userOnly);
        
        expect(bangKeys.filter(entry => duckResults.chat.includes(entry))).to.have.lengthOf(1);
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
    
    it('should return a list of killers', function (done) {
      let onListRecv = function(duckResults) {
        
        console.log("onListRecv RECEIVER: [uniqueID]-" + duckResults.uniqueID);
        console.log("onListRecv RECEIVER: [success]-" + duckResults.success);
        console.log("onListRecv RECEIVER: [duckMessage]-" + duckResults.duckMessage);
        console.log("onListRecv RECEIVER: [chat]-" + duckResults.chat);
        console.log("onListRecv RECEIVER: [userOnly]-" + duckResults.userOnly);
        
        expect(duckResults.userOnly.includes('Here are people who hate dem ducks')).to.be.true;
        done();
      }
      duckhunt.__set__('callback', onListRecv);
      duckhunt.lookUpKills("");
    });
    it('should return a list of friends', function (done) {
      let onListRecv = function(duckResults) {
        console.log("onListRecv RECEIVER: [uniqueID]-" + duckResults.uniqueID);
        console.log("onListRecv RECEIVER: [success]-" + duckResults.success);
        console.log("onListRecv RECEIVER: [duckMessage]-" + duckResults.duckMessage);
        console.log("onListRecv RECEIVER: [chat]-" + duckResults.chat);
        console.log("onListRecv RECEIVER: [userOnly]-" + duckResults.userOnly);
        
        expect(duckResults.userOnly.includes('Here are people with duck faced friends')).to.be.true;
        expect(duckResults.userOnly.includes(',')).to.be.false;
        done();
      }
      duckhunt.__set__('callback', onListRecv);
      duckhunt.lookUpFriends("bruce");
    });
    
  });
  
});