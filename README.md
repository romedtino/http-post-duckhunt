# http-post-duckhunt
This is a simple implementation of gonzobot/cloudbot's duckhunt chat game

I created this so I can run a simple duckhunt mini game within a mattermost instance through post commands. If you clone this repo, you most likely need to implement your own 'mattermost.js' file which a way to send your ducks to a given chat.

There's also dependencies on the parameters of certain exported functions (req and res) 
req - is usually the request contents, from mattermost this usually contains username information
res - this is the object that allows a json response to the mattermost server

Any questions or concerns feel free to let me know.
