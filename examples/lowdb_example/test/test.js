const rewire = require('rewire');
const duckDB = require('../duckhunt_lowdb.js')("test");
const expect = require('chai').expect;
const should = require('chai').should;

var duckhunt = rewire('../../../duckhunt.js')();
const config = require('../../../config.json');

// TODO take advantage for test?
//const express = require('express');
//const app = express(); 
//const listener = app.listen(process.env.PORT, function() {
//  console.log('Your app is listening on port ' + listener.address().port);   
//});

stopHuntTest = function() {
  duckhunt.stopHunt();
  expect(duckhunt.isRunning()).to.be.false;
}

defaultRecv = function(duckResults) {
  console.log("DEFAULT RECEIVER: [uniqueID]-" + duckResults.uniqueID);
  console.log("DEFAULT RECEIVER: [success]-" + duckResults.success);
  console.log("DEFAULT RECEIVER: [message]-" + duckResults.message);
  console.log("DEFAULT RECEIVER: [ephemeral]-" + duckResults.ephemeral);
}

describe('Duckhunt Test', function () {
  describe('startHunt-valid', function() {
    
    it('should start the duck hunt game correctly', function () {
      
      duckhunt.startHunt(defaultRecv, duckDB);
      expect(duckhunt.isRunning()).to.be.true;
      stopHuntTest();
    });
    
    it('should try to befriend an entity',  async () => {
      let friendKeys = config.executions.find(entry => entry.command === "bef").miss;
      friendKeys.push(["You're friends with"]);
      
      duckhunt.createEntity();
      const data = await duckhunt.handleExecution("bef", "bruce", true);
      defaultRecv(data);
      
      expect(friendKeys.filter(entry => data.message.includes(entry))).to.have.lengthOf(1);
      stopHuntTest();
      
    });
    
    it('should try to kill an entity', async () => {
      let  bangKeys = config.executions.find(entry => entry.command === "bang").miss;
      bangKeys.push(["You have shot"]);
      
      duckhunt.createEntity();
      
      const data = await duckhunt.handleExecution("bang", "bruce", true);
      defaultRecv(data);
      
      expect(bangKeys.filter(entry => data.message.includes(entry))).to.have.lengthOf(1);
      stopHuntTest(); 
    });
    
    it('should return a list of killers', async () => {
      
      const data = await duckhunt.lookUpTable("", "bang");
      defaultRecv(data);
      expect(data.message.includes('Here are people who hate dem ducks')).to.be.true;
    });
    
    it('should return a list of friends', async () => {

      const data = await duckhunt.lookUpTable("bruce", "bef");
      defaultRecv(data);
      expect(data.message.includes('Here are people with duck faced friends')).to.be.true;
      expect(data.message.includes(',')).to.be.false;

    });
    
  });
  
});