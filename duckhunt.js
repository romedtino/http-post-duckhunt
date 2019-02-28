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
const COOLDOWN_IN_SEC = 7;

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
* Callback function called when the duckhunt game posts information
*/
var callback = function () { 
  console.log("Implement me"); 
};

var duck_ascii = no_duck;

const callbackResult = { "uniqueID" : "",
                       "success" : false,
                       "duckMessage" : duck_ascii,
                       "chat" : "",
                       "userOnly" : ""
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
* Spawn a duck and pass the information to callback
*/           
function createDuck() {
  isDuckLoose = true;
  var date = new Date();
  duckReleaseTime = date.getTime();
  var duckChoice = randRange(0, duck.length);
  var duckNoiseChoice = randRange(0, duck_noise.length);
  var fullMessage = callbackResult;
  duck_ascii = duck_tail + duck[duckChoice] + duck_noise[duckNoiseChoice];
  fullMessage.duckMessage = duck_ascii;
  callback(fullMessage);
}

function assessHitOrMiss(uniqueID, type, date) {
  var isBang = type.indexOf('bang') > -1;
  
  var fullMessage = callbackResult;
  fullMessage.uniqueID = uniqueID;
  fullMessage.duckMessage = duck_ascii;
  
  if(randRange(0, 100) > 30) { 
    isDuckLoose = false;
    var seconds = (date.getTime() - duckReleaseTime) / 1000;
    
    dbGeneric.increaseScore(type, uniqueID);
    
    dbGeneric.getScore(type, uniqueID)
    .then(function(user_score) {
        var score = user_score.toString();

        if(isBang) {
          fullMessage.chat = "@" + uniqueID 
                    + " shot a duck in **" +  seconds + "** seconds! You have shot " 
                    + score +" ducks.";
        } else {          
          fullMessage.chat = "@" + uniqueID
                    + " befriended a duck in **" +  seconds + "** seconds! You're friends with " 
                    + score +" ducks.";          
        }

        //Reset duck status
        duck_ascii = no_duck;
        startDuckHunt(callback, dbGeneric);
        
        fullMessage.success = true;
        fullMessage.duckMessage = duck_ascii;
      
        
        callback(fullMessage);
    })
    .catch(function(error) {
        fullMessage.userOnly = "Couldn't find a score for " + uniqueID + "\n" + error;
        callback(fullMessage);
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
    fullMessage.chat = "@" + uniqueID + " - ";
    fullMessage.chat += (isBang) ? miss_bang[typeChoice] : miss_friend[typeChoice];
        
    callback(fullMessage);
    
  }
}

function handleDuckCommand(uniqueID, type)
{  
  var fullMessage = callbackResult;
  fullMessage.uniqueID = uniqueID;
  fullMessage.duckMessage = duck_ascii;
  
  if(Boolean(isDuckLoose))
  {
   // 60% chance of hit
    var date = new Date();
    
    dbGeneric.getCooldown("duckCD" + uniqueID)
    .then(function(dbCooldown) {
        var cooldown = (date.getTime() - dbCooldown) / 1000;

        if(cooldown > COOLDOWN_IN_SEC || dbCooldown == null)
        {
          return assessHitOrMiss(uniqueID, type, date);
        }
        else
        {
          fullMessage.userOnly = "You are in a cool down period, try again in " + (COOLDOWN_IN_SEC - cooldown) 
                    + " seconds.";
          callback(fullMessage);
        }
    })
    .catch(function(error) {
      fullMessage.userOnly = "Error handling " + type
      callback(fullMessage);
    });
      
  }
  else
  { 
    // There's no duck to [type]!
    fullMessage.userOnly = "@" + uniqueID + " " + ((type.indexOf('bang') > -1) ? miss_bang_noduck : miss_friend_noduck);
    callback(fullMessage);
  }

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
  lookUpTable(uniqueID, 'bef');
}

//Print out top kill list
function lookUpKills(uniqueID)
{
  lookUpTable(uniqueID, 'bang');
}

function lookUpTable(uniqueID, type)
{
  var fullMessage = callbackResult;
  
  var isBang = type.indexOf('bang') > -1;
  fullMessage.userOnly = (isBang) ? "Here are people who hate dem ducks - " :
                                                    "Here are people with duck faced friends - ";
  if(uniqueID) {
    fullMessage.userOnly += " (filter: @" + uniqueID + ") ";
  }
                                                    
  dbGeneric.getTopList(type, uniqueID)
  .then(function(toplist) {
      for(var i=0;i<toplist.length;i++)
      {
        fullMessage.userOnly += toplist[i].id + "(" + toplist[i].score + ")";
        if( i < toplist.length - 1)
        {
          fullMessage.userOnly += ", "
        }
      }
      callback(fullMessage);
  })
  .catch(function(error) {
      fullMessage.userOnly += "None yet...";
      callback(fullMessage);
  });
}

function startDuckHunt(cb, db)
{  
  callback = cb;
  dbGeneric = db;
  
  //Between 8 min to an hour //TODO Configurable
  var time = randRange(480000, 3600000);
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
