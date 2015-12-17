# DiscordBot-KC
Discord bot customised for PaidToWin server.

# Features:
- !game nameofgame => asks the room if anyone wants to play games! "cs" and "hots" are specially defined
- !image query => returns an image (careful, no adult filter)
- !youtube query=> returns a youtube link
- !wiki query=> returns the summary of the first search result on Wikipedia
- !say text => echos text (admin only)
- !help => prints all commands with usage and description;
- !servers => returns servers this bot is in (admin only)
- !channels => returns channels this bot is in (admin only)
- !idle => sets bot status to idle (owner only)
- !online => sets bot status to online (owner only)
- !ping => responds to user with pong!
- !join-server => bot will join the requested server (owner only)
- !create => create a channel (admin only)
- !delete => deletes a channel (admin only)
- !shipgame => Avatar game
- !8ball => 8ball function
- !d => Dice rolling function
- !mute => Mutes users (admin only)
- !unmute => Unmutes users (admin only)
- !kick => Schmuck bait
- !slap => Slaps a user with some trout
- @botname => responds when @mentioned

## RSS:
    you can create an rss.json file adding rss feeds as commands. See rss.json.example for details

# ToDo:

- Make adding permissions easier (addop/deop)
- Add another level of permissions, ops, for server mods. Reserve current 'admin' level for server founders
- Document code
- Auto mute on too much spam
- Modularise code to enable different servers to disable certain commands
- Weather check/forecase
- Make !slap have more variety
- Fix !image crashing
- Reimplement !pullanddeploy
- Go over permissions again
