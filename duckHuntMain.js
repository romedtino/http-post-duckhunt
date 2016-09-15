var redis = require('redis');
var client = redis.createClient();

var sendMessage = require('../mattermost.js');

client.on('connect', function() {
  console.log('Redis connected');
});

var channelChoice = 'overdank';

var duck_tail = "・゜゜・。。・゜゜";
var duck = ["\_o< ", 
            "\_O< ", 
            "\_0< ", 
            "\_\u00f6< ", 
            "\_\u00f8< ", 
            "\_\u00f3< "
          ]
var duck_noise = ["QUACK!", 
                  "FLAP FLAP!", 
                  "quack!"
                ]

var miss_bang_noduck = "There is no duck. What are you shooting at?";                
var miss_bang = [ "WHOOSH! You missed the duck completely!", 
                  "Your gun jammed!", 
                  "Better luck next time.", 
                  "WTF!? Who are you Dick Cheney?" 
                ]

var miss_friend_noduck = " tried befriending a non-existent duck, that's freaking creepy.";                
var miss_friend = [ "The duck didn't want to be friends, maybe next time.", 
                    "Well this is awkward, the duck needs to think about it.", 
                    "The duck said no, maybe bribe it with some pizza? Ducks love pizza don't they?", 
                    "Who knew ducks could be so picky?"
                  ]

var instructions = "# DUCK HUNT\n" +
                    "Duck Hunt started! Ducks are on the loose!\n" +
                    "When you see a loose duck you can befriend it by typing" +
                    " `/meeseeks bef` or if you want to shoot it, `/meeseeks bang`\n";

var commandList = "\nAll duckhunt related commands:\n" +
                  "`/meeseeks bang` - Shoot a duck when you see one\n" +
                  "`/meeseeks bef`  - Befriend a duck and become best of buddies\n" + 
                  "`/meeseeks friends` - Look up the people who have the most friends as ducks\n" + 
                  "`/meeseeks kills` - Look up the people who just straight up hate ducks";                        
                    
var isDuckLoose = false;                                  

var currentTime = 0; 
var COOLDOWN_IN_SEC = 7;       
              
//Create a duck to send to overdank                
function createDuck()
{
  isDuckLoose = true;
  var date = new Date();
  currentTime = date.getTime();
  var duckChoice = randRange(0, duck.length);
  var duckNoiseChoice = randRange(0, duck_noise.length);
  duckMessage = duck_tail + duck[duckChoice] + duck_noise[duckNoiseChoice];
  sendMessage(channelChoice, duckMessage);
}

//Handle when we get a bang
function handleBang(req, res)
{
  handleDuckCommand(req, res, 'bang');
}

function handleDuckCommand(req, res, type)
{
  var messageType = "in_channel";
  var message = (type.indexOf('bang') > -1) ? miss_bang_noduck : miss_friend_noduck;
  if(Boolean(isDuckLoose))
  {
   // 60% chance of hit
    var date = new Date();
    client.get("duck" + req.body.user_name, function(error, response) {
    
      var cooldown = (date.getTime() - response) / 1000;
        
      if(cooldown > COOLDOWN_IN_SEC || response == null)
      {
        if(randRange(0, 100) > 30)
        { 
          isDuckLoose = false;
          var seconds = (date.getTime() - currentTime) / 1000;
          client.zincrby(type, 1, req.body.user_name);
          client.zscore(type, req.body.user_name, function(error, typeResponse) {
          
            var score = typeResponse.toString();
            
            if(type.indexOf('bang') > -1)
            {
              message = "@" + req.body.user_name 
                        + " shot a duck in **" +  seconds + "** seconds! You have shot " 
                        + score +" ducks.";
            }
            else
            {          
              message = "@" + req.body.user_name 
                        + " befriended a duck in **" +  seconds + "** seconds! You're friends with " 
                        + score +" ducks.";          
            }
                      
            //Reset duck status
            prepareDuck();
                      
            res.json({"response_type":messageType,
            "text": message
            });
          });
        }
        else
        {
          // 30% chance of miss
          //Put user in timeout
          client.set("duck" + req.body.user_name, date.getTime());
          
          //Reply to user
          var typeChoice = (type.indexOf('bang') > -1) ? 
                           randRange(0, miss_bang.length) : randRange(0, miss_friend.length);
          message = "@" + req.body.user_name + " - ";
          message += (type.indexOf('bang') > -1) ? miss_bang[typeChoice] : miss_friend[typeChoice]
          res.json({"response_type":messageType,
            "text": message
            });
        }
      }
      else
      {
        messageType = "ephemeral";
        message = "You are in a cool down period, try again in " + (COOLDOWN_IN_SEC - cooldown) 
                  + " seconds.";
        res.json({"response_type":messageType,
          "text": message
          });
      }
    });
  }
  else
  { 
    // There's no duck to [type]!
    res.json({"response_type":messageType,
      "text": "@" + req.body.user_name + " - " + message
      });
  }

}

//Handle when we get a friend
function handleFriend(req, res)
{
  handleDuckCommand(req, res, 'bef');
}

//Print out top friend list
function lookUpFriends(req, res)
{
  lookUpTable(req, res, 'bef');
}

//Print out top kill list
function lookUpKills(req, res)
{
  lookUpTable(req, res, 'bang');
}

function lookUpTable(req, res, type)
{
    var messageType = "in_channel";
  client.zrevrangebyscore(type, "+inf", "-inf", "WITHSCORES", function(error, response)
  {
    var initMessage = (type.indexOf('bang') > -1) ? ", Here are people who hate dem ducks - " :
                                                  ", Here are people with duck faced friends - ";
    var message = "@" + req.body.user_name + initMessage;
    
    if(response.length < 1)
    {
      message += "Nobody yet...";
    }
    
    for(var i=0;i<response.length;)
    {
      message += response[i++] + " - " + response[i++];
      if( i < response.length)
      {
        message += ", "
      }
    }
    
    res.json({"response_type":messageType,
      "text": message
      });
  });
}

function prepareDuck()
{
  //Between 8 min to an hour
  var time = randRange(480000, 3600000);
  var duckHuntTimer = setTimeout(createDuck, time);
}

function startDuckHunt()
{
  //sendMessage(channelChoice, instructions + commandList);
  prepareDuck();
}

function randRange(min, max)
{
  return Math.floor(Math.random() * (max - min) + min); 
}

module.exports.handleBang = handleBang;
module.exports.handleFriend = handleFriend;
module.exports.startDuckHunt = startDuckHunt;
module.exports.lookUpFriends = lookUpFriends;
module.exports.lookUpKills = lookUpKills;
module.exports.commandList = commandList;
module.exports.instructions = instructions;

