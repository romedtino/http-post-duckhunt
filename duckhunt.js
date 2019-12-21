module.exports = function(customConfig=null) {
  var module = {};

  const config = customConfig == null ? require('./config.json') : customConfig;

  /**
  * Cooldown for people who spam right after missing a shot (seconds)
  */
  const COOLDOWN_IN_SEC = config.user_cooldown.cooldown;

  /**
  * Holds format structure for what will be returned in a promise/callback
  */
  function callbackResult() { 
    return { "uniqueID" : "",
                        "loose" : module.isEntityLoose,
                        "success" : false,
                        "ephemeral" : false,
                        "message" : ""
           };
}

  /**
  * Time in epoch we released an entity
  */
  let entityReleaseTime = 0;

  /**
  * Holds the timeout reference for spawning an entity
  */
  let entityHuntTimer;

  /**
  * Flag to check if the hunt is running
  */
  let isRunningFlag = false;

  /**
  * Callback function called when the duckhunt game summons a duck
  */
  var callback = function () { 
    console.log("Implement me"); 
  };

  /**
  * Callback to a generic database to store all the information of the game to.
  * Requires these functions to be implemented which return Promises: 
  * getTopList(type) - returns map of ids and scores [ id0 : score1, id1: score2] SORTED by highest score
  * getCooldown(uniqueID) - returns time in ms since epoch
  * setCooldown(uniqueID, currentTime)  - set cooldown of a id given a time
  * increaseScore(type, uniqueID) - increase the score by 1 for type on a given id
  * getScore(type, uniqueID) - Get the id score by type
  */
  let dbGeneric;

  /**
  * Basic random range function
  */
  function randRange(min, max)
  {
    return Math.floor(Math.random() * (max - min) + min); 
  }
                
  /**
  * Spawn an entity and pass the information to callback
  */           
  function createEntity() {
    module.isEntityLoose = true;
    var date = new Date();
    entityReleaseTime = date.getTime();
    
    var fullFormedAscii = "";
    for(let i=0;i<config.custom_entity_ascii.ascii.length;++i) {
      var detailChoice = randRange(0, config.custom_entity_ascii.ascii[i].length);
      fullFormedAscii += config.custom_entity_ascii.ascii[i][detailChoice];
    }
    var fullMessage = callbackResult();
    module.entity_ascii = fullFormedAscii;
    fullMessage.message = module.entity_ascii;
    callback(fullMessage);
  }

  function assessHitOrMiss(uniqueID, type, date, forceExecute) {
    
    var fullMessage = callbackResult();
    fullMessage.uniqueID = uniqueID;
    return new Promise(function(resolve, reject) {
      if(randRange(0, 100) > 30 || forceExecute) { 
        module.isEntityLoose = false;
        var seconds = (date.getTime() - entityReleaseTime) / 1000;
        
        dbGeneric.increaseScore(type, uniqueID);
        
        dbGeneric.getScore(type, uniqueID)
        .then(function(user_score) {
            var score = user_score.toString();

            var hitArray = config.executions.find(entry => entry.command === type).hit;
            var hitChoice = randRange(0, hitArray.length);
            var hitText = hitArray[hitChoice].replace("${user}", uniqueID)
                            .replace("${time}", seconds + " seconds!")
                            .replace("${score}", score);
            fullMessage.message = hitText;
            fullMessage.loose = module.isEntityLoose;

            //Reset duck status
            module.entity_ascii = config.custom_entity_ascii.no_entity;
            startHunt(callback, dbGeneric);
            
            fullMessage.success = true;
            
            resolve(fullMessage);
        })
        .catch(function(error) {
            fullMessage.ephemeral = true;
            fullMessage.message = "Couldn't find a score for " + uniqueID + "\n" + error;
            reject(fullMessage);
        });

      }
      else
      {
        // 30% chance of miss
        //Put user in timeout
        dbGeneric.setCooldown("entityCD" + uniqueID, date.getTime());

        //Reply to user
        var missArray = config.executions.find(entry => entry.command === type).miss;
        var missChoice = randRange(0, missArray.length);
        fullMessage.message = "@" + uniqueID + " - ";

        fullMessage.message += missArray[missChoice];
            
        resolve(fullMessage);
        
      }
    });
  }

  function handleExecution(execution, uniqueID, forceExecute = false)
  {  
    var fullMessage = callbackResult();
    fullMessage.uniqueID = uniqueID;
    
    return new Promise(function(resolve, reject) {
      if(Boolean(module.isEntityLoose))
      {
      // 60% chance of hit
        var date = new Date();
        
        dbGeneric.getCooldown("entityCD" + uniqueID)
        .then(function(dbCooldown) {
            var cooldown = (date.getTime() - dbCooldown) / 1000;

            if(cooldown > COOLDOWN_IN_SEC || dbCooldown == null)
            {
              assessHitOrMiss(uniqueID, execution, date, forceExecute)
              .then(function(result) {
                resolve(result);
              })
              .catch(function(error) {
                reject(error);
              });
              
            }
            else
            {
              fullMessage.ephemeral = true;
              fullMessage.message = "You are in a cool down period, try again in " + (COOLDOWN_IN_SEC - cooldown) 
                        + " seconds.";
              resolve(fullMessage);
            }
        })
        .catch(function(error) {
          reject( "Error handling " + execution + " with error: " + error);
        });
          
      }
      else
      { 
        // There's no entity to [type]!
        var noEntityArray = config.executions.find(entry => entry.command === execution).no_entity;
        var noEntityChoice = randRange(0, noEntityArray.length);
        fullMessage.message = noEntityArray[noEntityChoice].replace("${user}", uniqueID);
        resolve(fullMessage);
      }
      
    });
  }

  function lookUpTable(uniqueID, type)
  {
    var fullMessage = callbackResult();
    fullMessage.raw = [];
    fullMessage.ephemeral = true;
    
   var listText = config.executions.find( entry => entry.command === type ).list_text;
   fullMessage.listText = listText.replace("${list}", "");
   if(uniqueID) {
    listText += " (filter: @" + uniqueID + ") ";
    }
    return new Promise(function(resolve, reject) {
      dbGeneric.getTopList(type, uniqueID)
      .then(function(toplist) {
          var userList = "";
          for(var i=0;i<toplist.length;i++)
          {
            userList += toplist[i].id + "(" + toplist[i].score + ")";
            fullMessage.raw.push({ "id": toplist[i].id,
                                "score" : toplist[i].score });
            if( i < toplist.length - 1)
            {
              userList += ", "
            }
          }
          console.log("JEROME user: " + userList);
          fullMessage.message = listText.replace("${list}", userList);
          resolve(fullMessage);
      })
      .catch(function(error) {
          fullMessage.message = listText.replace("${list}",  "None yet...");;
          resolve(fullMessage);
      });
    });    

  }

  function startHunt(cb, db)
  {  
    callback = cb;
    dbGeneric = db;
    
    //Between 8 min to an hour
    var time = randRange(config.spawn_times.min, config.spawn_times.max);
    isRunningFlag = true;
    entityHuntTimer = setTimeout(createEntity, time);
    
  }

  function stopHunt() {
    isRunningFlag = false;
    clearTimeout(entityHuntTimer);  
  }

  function isRunning() {
    return isRunningFlag;
  }

  module.handleExecution = handleExecution;
  module.createEntity = createEntity;
  module.startHunt = startHunt;
  module.stopHunt = stopHunt;
  module.lookUpTable = lookUpTable;
  module.instructions = config.instructions;
  module.isRunning = isRunning;
  module.entity_ascii = config.custom_entity_ascii.no_entity;
  module.executions = config.executions;
  module.isEntityLoose = false;
  module.url = config.custom_entity_ascii.url;
  return module;
}