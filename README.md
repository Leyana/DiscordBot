# DiscordBot-KC
Discord bot customised for PaidToWin server.

# Features:
- !help => PMs all commands with usage and description
- !ping => Responds to user with pong!
- !game <nameofgame> => Asks the room if anyone wants to play games! Certain acronyms are mapped to the full name.
- !servers => Lists servers bot is operating in (admin only)
- !channels => Lists channels bot is operating in (admin only)
- !myid => PMs you your ID
- !idle => Sets bot to idle (owner only)
- !online => Sets bot to online (owner only)
- !say <text> => Echos text (admin only)
- !youtube <query> => Returns a youtube link
- !version => Returns current version of bot (owner only)
- !wiki <query> => Returns the summary of the first search result on Wikipedia
- !join-server <invite URL/code> => Bot will join the requested server (owner only)
- !create <channel name> => Creates a text channel (admin only)
- !voice <channel name> => Creates a vocie channel (admin only)
- !delete <channel name> => Deletes a channel (admin only)
- !stock <company code> => Returns stock info from Yahoo! Finance
- !wolfram <query> => Returns query from Wolfram Alpha
- !rss => Lists available RSS feeds
- !reddit <subreddit> => Returns current top post of subreddit
- !userid <user> => Use without @, PMs ID of selected user (owner only)
- !topic <text> => Sets topic for channel it is used in (admin only)
- !msg <user> <message> => Sets message to send user next time they are online
- !image <query> => returns an image from Google as a PM (careful, no adult filter)
- !d <no of dice>d<no of sides> => Dice rolling function
- !8ball => 8ball function
- !shipgame => Avatar game. Returns a picture you set as your avatar.
- !kcwiki <query> => Returns first search result from Kancolle Wiki.
- !mute => Mutes users (admin only)
- !unmute => Unmutes users (admin only)
- !slap => Slaps a user with some trout
- !kick => Schmuck bait
- !weather <city/zip>;<country code> => Returns current weather at selected location. Country codes based of ISO 3166 standard.
- @botname => responds when @mentioned

## Other Features
- Auto-mute for spam => Default settings are 5 messages within 15 secs, results in 30 sec mute. To use, set up a user role and add it to every channel, disallow role from sending messages. Then add role to "updateSpamFilterLog" function.
- Permissions => Add bot owner to ownerIDs array and any admins to adminIDs array. Add "onwerOnly: True" or "adminOnly: True" to commands you want to block out.
- Cooldowns => "timeout" attribute to all commands in seconds.

## RSS:
    you can create an rss.json file adding rss feeds as commands. See rss.json.example for details

# ToDo:

- Make adding permissions easier (addop/deop)
- Add another level of permissions, ops, for server mods. Reserve current 'admin' level for server founders
- Document code
- Modularise code to enable different servers to disable certain commands
- Make !slap have more variety
- Reimplement !pullanddeploy
- Go over permissions again
- Allow !say to specify a channel to broadcast to
