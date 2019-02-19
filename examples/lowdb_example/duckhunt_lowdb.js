// setup a new database
// persisted using async file storage
// Security note: the database is saved to the file `db.json` on the local filesystem.
// It's deliberately placed in the `.data` directory which doesn't get copied if someone remixes the project.
var low = require('lowdb')
var FileSync = require('lowdb/adapters/FileSync')
var isWin = process.platform === "win32";
var adapter = new FileSync(isWin ? 'data/duckhunt_lowdb.json' :'.data/duckhunt_lowdb.json')
var db = low(adapter)

/**
*
*  getTopList(type) - returns map of ids and scores [ id0 : score1, id1: score2] SORTED by highest score
*  getCooldown(uniqueID) - returns time in ms since epoch
*  setCooldown(uniqueID, currentTime)  - set cooldown of a id given a time
*  increaseScore(type, uniqueID) - increase the score by 1 for type on a given id
*  getScore(type, uniqueID) - Get the id score by type
*  
* 
* Example:
{ "bang": [
      { "id":"some_id1", "score": 1 },
      { "id":"some_id2", "score": 9 }
    ],
    "bef": [
      { "id":"some_id1", "score": 1 },
      { "id":"some_id2", "score": 9 }
    ],
    "cooldown": [
      { "id":"some_id1", "cd": 1 },
      { "id":"some_id2", "cd": 9 }
    ]
  }
**/
db.defaults({ "bang" : [],
    "bef": [],
    "cooldown": []
  })
  .write();

var getTopList = function(type, uniqueID) {
  var topListMap = {};
  return new Promise(function(resolve, reject) { 
      var match;
      
      if(uniqueID) {
        match = db.get(type)
                    .filter({"id": uniqueID})
                    .value();
      } else {
        match = db.get(type)
                    .value();
      }
      console.log("zzz: " + match.length);
      if(Array.isArray(match) && match.length) {
        topListMap = db.get(type)
          .sortBy("score")
          .value();
        //sortBy sorts in ascending order. We want it descending
        resolve(topListMap.reverse());
      } else {
        reject("No type" + type);
      }
      
  });
}

var getCooldown = function(uniqueID) {
  return new Promise(function(resolve, reject) {
      var cdList = db.get("cooldown")
                     .filter({"id":uniqueID}).value();
      cdList.forEach(function(cdEntry) {
          //instantly return on first entry. uniqueID is ... unique.
          return resolve(cdEntry.cd);
      });
    
      resolve(null);
  });
}

var setCooldown = function(uniqueID, currentTime) {
  if(db.get("cooldown").filter({id: uniqueID}).value().length) {
    //id already exists, update value
    db.get("cooldown")
      .find({"id": uniqueID})
      .assign({"id": uniqueID, "cd": currentTime})
      .write();
  } else {
    //id does not exist, create entry
    db.get("cooldown")
      .push({"id": uniqueID, "cd": currentTime})
      .write();
  }

}

var increaseScore = function(type, uniqueID) {
  var match = db.get(type)
               .filter({"id": uniqueID})
               .value();
  
  
  if(Array.isArray(match) && match.length) {
      //id already exists, update value      
      var origScore = match[0].score;
      var newScore = origScore + 1;

      db.get(type)
        .find({"id": uniqueID})
        .assign({"id": uniqueID, "score": newScore})
        .write();
    } else {
      //id does not exist, create entry
      db.get(type)
        .push({"id": uniqueID, "score": 1})
        .write();
    }
}

var getScore = function(type, uniqueID) {
  return new Promise(function(resolve, reject) {
      var idList = db.get(type)
        .filter({"id": uniqueID})
        .value();
    
      if(Array.isArray(idList) && idList.length)
      {
        //id exists
        return resolve(idList[0].score);
      }
    
      reject("Problem finding score for person.");
  });
}

module.exports.getTopList = getTopList;
module.exports.getCooldown = getCooldown;
module.exports.setCooldown = setCooldown;
module.exports.increaseScore = increaseScore;
module.exports.getScore = getScore;