const config = require('./config.json');

const duck_tail = "・゜゜・。。・゜゜";
const no_duck = '¯\\_(ツ)_/¯';
const duck = ["\_o< ", 
            "\_O< ", 
            "\_0< ", 
            "\_\u00f6< ", 
            "\_\u00f8< ", 
            "\_\u00f3< "
          ]
const duck_noise = ["QUACK!", 
                  "FLAP FLAP!",
                  "quack!"
                ]

const miss_bang_noduck = " there is no duck. What are you shooting at?";                
const miss_bang = [ "WHOOSH! You missed the duck completely!", 
                  "Your gun jammed!", 
                  "Better luck next time.", 
                  "WTF!? Who are you Dick Cheney?" 
                ]

const miss_friend_noduck = " tried befriending a non-existent duck, that's freaking creepy.";                
const miss_friend = [ "The duck didn't want to be friends, maybe next time.", 
                    "Well this is awkward, the duck needs to think about it.", 
                    "The duck said no, maybe bribe it with some pizza? Ducks love pizza don't they?", 
                    "Who knew ducks could be so picky?"
                  ]

const instructions = "# DUCK HUNT\n" +
                    "Duck Hunt started! Ducks are on the loose!\n" +
                    "When you see a loose duck you can befriend it by typing" +
                    " `/bef` or if you want to shoot it, `/bang`\n";

const commandList = "\nAll duckhunt related commands:\n" +
                  "`/bang` - Shoot a duck when you see one\n" +
                  "`/bef`  - Befriend a duck and become best of buddies\n" + 
                  "`/friends` - Look up the people who have the most friends as ducks\n" + 
                  "`/kills` - Look up the people who just straight up hate ducks";                        

/**
* Cooldown for people who spam right after missing a shot (seconds)
*/
const COOLDOWN_IN_SEC = config.user_cooldown.cooldown;

/**
* Holds format structure for what will be returned in a promise/callback
*/
const callbackResult = { "uniqueID" : "",
                       "success" : false,
                       "ephemeral" : false,
                       "message" : ""
};

/**
* Flag to signify if there's an entity available to capture
*/
let isDuckLoose = false;

/**
* Time in epoch we released an entity
*/
let duckReleaseTime = 0;

/**
* Holds the timeout reference for spawning a duck
*/
let duckHuntTimer;

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
* Keeps track of the ascii of the last duck spawned or no duck spawned
*/
var duck_ascii = no_duck;

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
* Spawn a duck and pass the information to callback
*/           
function createDuck() {
  isDuckLoose = true;
  var date = new Date();
  duckReleaseTime = date.getTime();
  var duckChoice = randRange(0, duck.length);
  var duckNoiseChoice = randRange(0, duck_noise.length);
  var fullMessage = JSON.parse(JSON.stringify(callbackResult));
  duck_ascii = duck_tail + duck[duckChoice] + duck_noise[duckNoiseChoice];
  fullMessage.message = duck_ascii;
  callback(fullMessage);
}

function assessHitOrMiss(uniqueID, type, date) {
  var isBang = type.indexOf('bang') > -1;
  
  var fullMessage = JSON.parse(JSON.stringify(callbackResult));
  fullMessage.uniqueID = uniqueID;
  fullMessage.message = duck_ascii;
  return new Promise(function(resolve, reject) {
    if(randRange(0, 100) > 30) { 
      isDuckLoose = false;
      var seconds = (date.getTime() - duckReleaseTime) / 1000;
      
      dbGeneric.increaseScore(type, uniqueID);
      
      dbGeneric.getScore(type, uniqueID)
      .then(function(user_score) {
          var score = user_score.toString();

          if(isBang) {
            fullMessage.message = "@" + uniqueID 
                      + " shot a duck in **" +  seconds + "** seconds! You have shot " 
                      + score +" ducks.";
          } else {          
            fullMessage.message = "@" + uniqueID
                      + " befriended a duck in **" +  seconds + "** seconds! You're friends with " 
                      + score +" ducks.";          
          }

          //Reset duck status
          duck_ascii = no_duck;
          startDuckHunt(callback, dbGeneric);
          
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
      dbGeneric.setCooldown("duckCD" + uniqueID, date.getTime());

      //Reply to user
      var typeChoice = (isBang) ? 
                       randRange(0, miss_bang.length) : randRange(0, miss_friend.length);
      fullMessage.message = "@" + uniqueID + " - ";
      fullMessage.message += (isBang) ? miss_bang[typeChoice] : miss_friend[typeChoice];
          
      resolve(fullMessage);
      
    }
  });
}

function handleDuckCommand(uniqueID, type)
{  
  var fullMessage = JSON.parse(JSON.stringify(callbackResult));
  fullMessage.uniqueID = uniqueID;
  
  return new Promise(function(resolve, reject) {
    if(Boolean(isDuckLoose))
    {
     // 60% chance of hit
      var date = new Date();
      
      dbGeneric.getCooldown("duckCD" + uniqueID)
      .then(function(dbCooldown) {
          var cooldown = (date.getTime() - dbCooldown) / 1000;

          if(cooldown > COOLDOWN_IN_SEC || dbCooldown == null)
          {
            assessHitOrMiss(uniqueID, type, date)
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
        reject( "Error handling " + type + " with error: " + error);
      });
        
    }
    else
    { 
      // There's no duck to [type]!
      fullMessage.message = "@" + uniqueID + " " + ((type.indexOf('bang') > -1) ? miss_bang_noduck : miss_friend_noduck);
      resolve(fullMessage);
    }
    
  });
}

//Handle when we get a bang
function handleBang(uniqueID)
{
  return handleDuckCommand(uniqueID, 'bang');
}

//Handle when we get a friend
function handleFriend(uniqueID)
{
  return handleDuckCommand(uniqueID, 'bef');
}

//Print out top friend list
function lookUpFriends(uniqueID)
{
  return lookUpTable(uniqueID, 'bef');
}

//Print out top kill list
function lookUpKills(uniqueID)
{
  return lookUpTable(uniqueID, 'bang');
}

function lookUpTable(uniqueID, type)
{
  var fullMessage = JSON.parse(JSON.stringify(callbackResult));
  fullMessage.ephemeral = true;
  
  var isBang = type.indexOf('bang') > -1;
  fullMessage.message = (isBang) ? "Here are people who hate dem ducks - " :
                                                    "Here are people with duck faced friends - ";
  if(uniqueID) {
    fullMessage.message += " (filter: @" + uniqueID + ") ";
  }
  return new Promise(function(resolve, reject) {
    dbGeneric.getTopList(type, uniqueID)
    .then(function(toplist) {
        for(var i=0;i<toplist.length;i++)
        {
          fullMessage.message += toplist[i].id + "(" + toplist[i].score + ")";
          if( i < toplist.length - 1)
          {
            fullMessage.message += ", "
          }
        }
        resolve(fullMessage);
    })
    .catch(function(error) {
        fullMessage.message += "None yet...";
        reject(fullMessage);
    });
  });    

}

function startDuckHunt(cb, db)
{  
  callback = cb;
  dbGeneric = db;
  
  //Between 8 min to an hour //TODO Configurable
  var time = randRange(config.spawn_times.min, config.spawn_times.max);
  isRunningFlag = true;
  duckHuntTimer = setTimeout(createDuck, time);
  
}

function stopDuckHunt() {
  isRunningFlag = false;
  clearTimeout(duckHuntTimer);  
}

function isRunning() {
  return isRunningFlag;
}

module.exports.handleBang = handleBang;
module.exports.handleFriend = handleFriend;
module.exports.startDuckHunt = startDuckHunt;
module.exports.stopDuckHunt = stopDuckHunt;
module.exports.lookUpFriends = lookUpFriends;
module.exports.lookUpKills = lookUpKills;
module.exports.commandList = commandList;
module.exports.instructions = instructions;
module.exports.isRunning = isRunning;
module.exports.duck_ascii = duck_ascii;
