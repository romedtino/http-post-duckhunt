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
    
    it('should start the duck hunt game correctly', function () {
      
      duckhunt.startDuckHunt(defaultRecv, duckDB);
      expect(duckhunt.isRunning()).to.be.true;
      stopHuntTest();
    });
    
    it('should try to befriend an entity',  async () => {
      let friendKeys = duckhunt.__get__('miss_friend');
      friendKeys.push(["You're friends with"]);
      
      let createDuck = duckhunt.__get__('createDuck');
      createDuck();
      
      let assessHitOrMiss = duckhunt.__get__('assessHitOrMiss')
      const data = await assessHitOrMiss("bruce", "bef", new Date());
      
      expect(friendKeys.filter(entry => data.chat.includes(entry))).to.have.lengthOf(1);
      stopHuntTest();
      
    });
    
    it('should try to kill an entity', async () => {
      let  bangKeys = duckhunt.__get__('miss_bang');
      bangKeys.push(["You have shot"]);
      
      let createDuck = duckhunt.__get__('createDuck');
      createDuck();
      
      let assessHitOrMiss = duckhunt.__get__('assessHitOrMiss')
      const data = await assessHitOrMiss("bruce", "bang", new Date());
      
      expect(bangKeys.filter(entry => data.chat.includes(entry))).to.have.lengthOf(1);
      stopHuntTest(); 
    });
    
    it('should return a list of killers', async () => {
      
      const data = await duckhunt.lookUpKills("");
      expect(data.userOnly.includes('Here are people who hate dem ducks')).to.be.true;
    });
    
    it('should return a list of friends', async () => {

      const data = await duckhunt.lookUpFriends("bruce");
      expect(data.userOnly.includes('Here are people with duck faced friends')).to.be.true;
      expect(data.userOnly.includes(',')).to.be.false;

    });
    
  });
  
});