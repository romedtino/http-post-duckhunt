module.exports = function(dbName) {
  var module = {};
  // setup a new database
  // persisted using async file storage
  // Security note: the database is saved to the file `db.json` on the local filesystem.
  // It's deliberately placed in the `.data` directory which doesn't get copied if someone remixes the project.
  var low = require('lowdb');
  var fs = require('fs');
  var FileSync = require('lowdb/adapters/FileSync');
  var isWin = process.platform === "win32";
  var dir = isWin ? 'data/' : '.data/';
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  var adapter = new FileSync(dir+'duckhunt_lowdb_'+dbName+'.json');
  var db = low(adapter);

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
  db.defaults({
      "cooldown": []
    })
    .write();

  var checkAndCreate = function(type) {
    if(!db.has(type).value()) {
      db.set(type, []).write();
    }
  }

  var getTopList = function(type, uniqueID) {
    return new Promise(function(resolve, reject) { 
        var match;
        checkAndCreate(type);
        if(uniqueID) {
          match = db.get(type)
                      .filter({"id": uniqueID})
                      .sortBy("score")
                      .value();
        } else {
          match = db.get(type)
                    .sortBy("score")
                    .value();
        }
        if(Array.isArray(match) && match.length) {
          //sortBy sorts in ascending order. We want it descending
          resolve(match.reverse());
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
    checkAndCreate(type);
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
        checkAndCreate(type);
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

module.getTopList = getTopList;
module.getCooldown = getCooldown;
module.setCooldown = setCooldown;
module.increaseScore = increaseScore;
module.getScore = getScore;

return module;
}
