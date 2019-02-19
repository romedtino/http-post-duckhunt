# http-post-duckhunt
This is a simple javascript implementation of the duck hunt game you might have grown to love from old IRC bots.

I originally created this so I can run a simple duckhunt mini game within a mattermost instance through post commands but I have done my best to generalize it so you can hook this game up to any time of host (albeit it javascript)

## Requirements
* DB backend implementing these functions (see examples for more information)
```
getTopList(type) - returns a promise map of ids and scores [ id0 : score1, id1: score2] SORTED by highest score
getCooldown(uniqueID) - returns a promise time in ms since epoch
setCooldown(uniqueID, currentTime)  - set cooldown of a id given a time
increaseScore(type, uniqueID) - increase the score by 1 for type on a given id
getScore(type, uniqueID) - returns a promise with the id score by type
```

