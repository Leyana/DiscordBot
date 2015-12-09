# DiscordBot-KC
Discord bot customised for PaidToWin server.

# Features:
- !gif query = returns a gif example !gif cute cats doing stuff
- !game nameofgame => asks the room if anyone wants to play games! "cs" and "hots" are specially defined
- !image query => returns an image (careful, no adult filter)
- !youtube query=> returns a youtube link
- !wiki query=> returns the summary of the first search result on Wikipedia
- !say text => echos text (admin only)
- !pullanddeploy => pulls changes from your (or this) repo and restarts node. does <strong>not</strong> work for windows! (admin only)
- !help => prints all commands with usage and description;
- !version => last deployed commit
- !servers => returns servers this bot is in (admin only)
- !channels => returns channels this bot is in (admin only)
- !idle => sets bot status to idle (admin only)
- !online => sets bot status to online (admin only)
- !ping => responds to user with pong!
- !join-server => bot will join the requested server (admin only)
- !create => create a channel (admin only)
- !delete => deletes a channel (admin only)
- !shipgame => Avatar game
- !8ball => 8ball function
- !d => Dice rolling function
- @botname => responds when @mentioned

## RSS:
    you can create an rss.json file adding rss feeds as commands. See rss.json.example for details

# ToDo:

- Permissions!
- Link history
- refactor discord_bot.js. split the msg string, look for command, process instead of a big if block luls (and the whole project. all of this is just quick and dirty)
- make it a module so you can npm install
- better plugin layout, allow for easy plugin drop ins, turn on/turn off
- "pugbomb" returns x number of pug images (pug are an example) corgibomb etc
- automatically pull in meme codes and do a fuzzy search on meme type
- voice intergration and DJ features!
- All the things!

## Custom Commands to add
- Fix Wolfram
