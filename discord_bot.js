var Discord = require("discord.js");

var gi = require("./google_image_plugin");
var google_image_plugin = new gi();

// Get the email and password
var AuthDetails = require("./auth.json");
var qs = require("querystring");

var htmlToText = require('html-to-text');

var config = {
    "api_key": "dc6zaTOxFJmzC",
    "rating": "r",
    "url": "http://api.giphy.com/v1/gifs/search",
    "permission": ["NORMAL"]
};

var game_abbreviations = {
    "cs": "Counter-Strike",
    "csgo": "Counter-Strike Global Offensive",
    "hon": "Heroes of Newerth",
    "hots": "Heroes of the Storm",
    "sc2": "Starcraft II",
    "gta": "Grand Theft Auto",
    "kc": "Kantai Collection",
    "KC": "KanColle",
    "sc": "Star Citizen",
    "dfo": "Dungeon Fighter Online",
    "DFO": "Dungeon Fighter Online",
    "civ": "Civilization",
    "WoWs": "World of Warships",
    "wows": "World of Warships",
    "ToS": "Tree of Saviors",
    "tos": "Tree of Saviors",
    "bns": "Blade and Soul",
    "BnS": "Blade and Soul"
};

var cmdLastExecutedTime = {};

var admin_ids = ["108259713732345856"];

var commands = {
    "ping": {
        description: "responds pong, useful for checking if bot is alive",
	timeout: 5, // in sec
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.sender+" pong!");
            if(suffix){
                bot.sendMessage(msg.channel, "note that !ping takes no arguments!");
            }
        }
    },
    "game": {
        usage: "<name of game>",
        description: "pings channel asking if anyone wants to play",
	timeout: 5, // in sec
        process: function(bot,msg,suffix){
            var game = game_abbreviations[suffix];
            if(!game) {
                game = suffix;
            }
            bot.sendMessage(msg.channel, "@everyone Anyone up for " + game + "?");
            console.log("sent game invites for " + game);
        }
    },
    "servers": {
        description: "lists servers bot is connected to",
	adminOnly: true,
        process: function(bot,msg){
	bot.sendMessage(msg.author,bot.servers);}
    },
    "channels": {
        description: "lists channels bot is connected to",
	adminOnly: true,
        process: function(bot,msg) { 
	bot.sendMessage(msg.author,bot.channels);}
    },
    "myid": {
        description: "returns the user id of the sender",
        process: function(bot,msg){bot.sendMessage(msg.author,msg.author.id);}
    },
    "idle": {
        description: "sets bot status to idle",
        adminOnly: true,
	process: function(bot,msg){ 
        bot.setStatusIdle();}
    },
    "online": {
        description: "sets bot status to online",
	adminOnly: true,
        process: function(bot,msg){ 
        bot.setStatusOnline();}
    },
    "say": {
        usage: "<message>",
        description: "bot says message",
	adminOnly: true,
        process: function(bot,msg,suffix){ 
        bot.sendMessage(msg.channel,suffix,true);}

    },
    "image": {
        usage: "<image tags>",
        description: "gets image matching tags from google",
	timeout: 5, // in sec
        process: function(bot,msg,suffix){ google_image_plugin.respond(suffix,msg.author,bot);}
    },
    "wiki": {
        usage: "<search terms>",
        description: "returns the summary of the first matching search result from Wikipedia",
        process: function(bot,msg,suffix) {
            var query = suffix;
            if(!query) {
                bot.sendMessage(msg.channel,"usage: !wiki search terms");
                return;
            }
            var Wiki = require('wikijs');
            new Wiki().search(query,1).then(function(data) {
                new Wiki().page(data.results[0]).then(function(page) {
                    page.summary().then(function(summary) {
                        var sumText = summary.toString().split('\n');
                        var continuation = function() {
                            var paragraph = sumText.shift();
                            if(paragraph){
                                bot.sendMessage(msg.author,paragraph,continuation);
                            }
                        };
                        continuation();
                    });
                });
            },function(err){
                bot.sendMessage(msg.author,err);
            });
        }
    },
    "join-server": {
        usage: "<invite>",
        description: "joins the server it's invited to",
	adminOnly: true,
        process: function(bot,msg,suffix) {
		console.log(bot.joinServer(suffix,function(error,server) {
                console.log("callback: " + arguments);
                if(error){
                    bot.sendMessage(msg.channel,"failed to join: " + error);
                } else {
                    console.log("Joined server " + server);
                    bot.sendMessage(msg.channel,"Successfully joined " + server);
                }
            }));
        }
    },
     "create": {
        usage: "<text|voice> <channel name>",
        description: "creates a channel with the given type and name.",
	adminOnly: true,
        process: function(bot,msg,suffix) {
            var args = suffix.split(" ");
            var type = args.shift();
            if(type != "text" && type != "voice"){
                bot.sendMessage(msg.channel,"you must specify either voice or text!");
                return;
            }
            bot.createChannel(msg.channel.server,args.join(" "),type, function(error,channel) {
                if(error){
                    bot.sendMessage(msg.channel,"failed to create channel: " + error);
                } else {
                    bot.sendMessage(msg.channel,"created " + channel);
                }
            });
        }
    },
    "delete": {
        usage: "<channel name>",
        description: "deletes the specified channel",
	adminOnly: true,
        process: function(bot,msg,suffix) {
            var channel = bot.getChannel("name",suffix);
            bot.sendMessage(msg.channel.server.defaultChannel, "deleting channel " + suffix + " at " +msg.author + "'s request");
            if(msg.channel.server.defaultChannel != msg.channel){
                bot.sendMessage(msg.channel,"deleting " + channel);
            }
            bot.deleteChannel(channel,function(error,channel){
                if(error){
                    bot.sendMessage(msg.channel,"couldn't delete channel: " + error);
                } else {
                    console.log("deleted " + suffix + " at " + msg.author + "'s request");
                }
            });
        }
    },
    "rss": {
        description: "lists available rss feeds",
	adminOnly: true,
        process: function(bot,msg,suffix) {
            /*var args = suffix.split(" ");
            var count = args.shift();
            var url = args.join(" ");
            rssfeed(bot,msg,url,count,full);*/
            bot.sendMessage(msg.channel,"Available feeds:", function(){
                for(var c in rssFeeds){
                    bot.sendMessage(msg.channel,c + ": " + rssFeeds[c].url);
                }
            });
        }
    },
    "d": {
        usage: "number of die separated by d and the number of sides on a die, no spaces",
        description: "dice rolls",
	timeout: 5, // in sec
        process: function(bot,msg,suffix) {
			var isValid = false;
			
			if(suffix) {
				var resultArr = suffix.split("d")
				
				if(resultArr.length == 2) {
					var maxRange = resultArr[1];
					var currentSum = 0;
					var resultString = "";
					
					if(isInt(maxRange) && isInt(resultArr[0])) {
						for(i=0; i<resultArr[0]; i++)
						{
							var rollValue = Math.floor(Math.random() * maxRange) + 1;
							var counter = i+1;
							currentSum += rollValue;
							resultString += "dice" + counter + ":" + rollValue + " ";
						}
						
						isValid = true;
						resultString += "  total:" + currentSum;
						bot.sendMessage(msg.channel, resultString);	
					}
				}
			}
			
			if(!isValid) {
				bot.sendMessage(msg.channel, "Invalid format.");	
			}
			}
    },
	"8ball": {
		usage: "ask a question",
		description: "ask 8ball a question",
		timeout: 5, // in sec
		process: function(bot,msg,suffix) {
			var messages = new Array();
			msg[0] = "It is certain";
			msg[1] = "It is decidedly so";
			msg[2] = "Without a doubt";
			msg[3] = "Yes definitely";
			msg[4] = "You may rely on it";
			msg[5] = "As I see it yes";
			msg[6] = "Most likely";
			msg[7] = "Outlook good";
			msg[8] = "yes";
			msg[9] = "Signs point to yes";
			msg[10] = "Reply hazy try again";
			msg[11] = "Ask again later";
			msg[12] = "Better not tell you now";
			msg[13] = "Cannot predict now";
			msg[14] = "Concentrate and ask again";
			msg[15] = "Don't count on it";
			msg[16] = "My reply is no";
			msg[17] = "My sources say no";
			msg[18] = "Outlook not so good";
			msg[19] = "Very doubtful";

			var randomnumber = Math.floor(Math.random() * 20);
			bot.sendMessage(msg.channel,msg[randomnumber]);
		}
	}
};

try{
var rssFeeds = require("./rss.json");
function loadFeeds(){
    for(var cmd in rssFeeds){
        commands[cmd] = {
            usage: "[count]",
            description: rssFeeds[cmd].description,
            url: rssFeeds[cmd].url,
            process: function(bot,msg,suffix){
                var count = 1;
                if(suffix != null && suffix != "" && !isNaN(suffix)){
                    count = suffix;
                }
                rssfeed(bot,msg,this.url,count,false);
            }
        };
    }
}
} catch(e) {
    console.log("Couldn't load rss.json. See rss.json.example if you want rss feed commands. error: " + e);
}

function rssfeed(bot,msg,url,count,full){
    var FeedParser = require('feedparser');
    var feedparser = new FeedParser();
    var request = require('request');
    request(url).pipe(feedparser);
    feedparser.on('error', function(error){
        bot.sendMessage(msg.channel,"failed reading feed: " + error);
    });
    var shown = 0;
    feedparser.on('readable',function() {
        var stream = this;
        shown += 1
        if(shown > count){
            return;
        }
        var item = stream.read();
        bot.sendMessage(msg.channel,item.title + " - " + item.link, function() {
            if(full === true){
                var text = htmlToText.fromString(item.description,{
                    wordwrap:false,
                    ignoreHref:true
                });
                bot.sendMessage(msg.channel,text);
            }
        });
        stream.alreadyRead = true;
    });
}


var bot = new Discord.Client();

bot.on("ready", function () {
    loadFeeds();
	console.log("Ready to begin! Serving in " + bot.channels.length + " channels");
});

bot.on("disconnected", function () {

	console.log("Disconnected!");
	process.exit(1); //exit node.js with an error
	
});

bot.on("message", function (msg) {
	//check if message is a command
	if(msg.author.id != bot.user.id && (msg.content[0] === '!' || msg.content.indexOf(bot.user.mention()) == 0)){
        console.log("treating " + msg.content + " from " + msg.author + " as command");
		var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length+2);//add one for the ! and one for the space
        if(msg.content.indexOf(bot.user.mention()) == 0){
            cmdTxt = msg.content.split(" ")[1];
            suffix = msg.content.substring(bot.user.mention().length+cmdTxt.length+2);
        }
		var cmd = commands[cmdTxt];
        if(cmdTxt === "help"){
            //help is special since it iterates over the other commands
            for(var cmd in commands) {
                var info = "!" + cmd;
                var usage = commands[cmd].usage;
                if(usage){
                    info += " " + usage;
                }
                var description = commands[cmd].description;
                if(description){
                    info += "\n\t" + description;
                }
                bot.sendMessage(msg.author,info);
            }
        }
		else if(cmd) {
			var cmdCheckSpec = canProcessCmd(cmd, cmdTxt, msg.author.id, msg);
			if(cmdCheckSpec.isAllow) {
				cmd.process(bot,msg,suffix);
			}
		} else {
			bot.sendMessage(msg.channel, "Invalid command " + cmdTxt);
		}
	} else {
		//message isn't a command or is from us
        //drop our own messages to prevent feedback loops
        if(msg.author == bot.user){
            return;
        }
        
        if (msg.author != bot.user && msg.isMentioned(bot.user)) {
                bot.sendMessage(msg.channel,msg.author + ", you called?");
        }
    }
});
 

//Log user status changes
bot.on("presence", function(data) {
	//if(status === "online"){
	//console.log("presence update");
	console.log(data.user+" went "+data.status);
	//}
});

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

function canProcessCmd(cmd, cmdText, userId, msg) {
	var isAllowResult = true;
	var errorMessage = "";
	
	if (cmd.hasOwnProperty("timeout")) {
		// check for timeout
		if(cmdLastExecutedTime.hasOwnProperty(cmdText)) {
			var currentDateTime = new Date();
			var lastExecutedTime = new Date(cmdLastExecutedTime[cmdText]);
			lastExecutedTime.setSeconds(lastExecutedTime.getSeconds() + cmd.timeout);
			
			if(currentDateTime < lastExecutedTime) {
				// still on cooldown
				isAllowResult = false;
				//var diff = (lastExecutedTime-currentDateTime)/1000;
				//errorMessage = diff + " secs remaining";
			}
			else {
				// update last executed date time
				cmdLastExecutedTime[cmdText] = new Date();
			}
		}
		else {
			// first time executing, add to last executed time
			cmdLastExecutedTime[cmdText] = new Date();
		}
	}
	
	if (cmd.hasOwnProperty("adminOnly") && cmd.adminOnly && !isAdmin(userId)) {
		isAllowResult = false;
	}
	
	return { isAllow: isAllowResult, errMsg: errorMessage };
}

function isAdmin(id) {
  return (admin_ids.indexOf(id) > -1);
}

function get_gif(tags, func) {
        //limit=1 will only return 1 gif
        var params = {
            "api_key": config.api_key,
            "rating": config.rating,
            "format": "json",
            "limit": 1
        };
        var query = qs.stringify(params);

        if (tags !== null) {
            query += "&q=" + tags.join('+')
        }

        //wouldnt see request lib if defined at the top for some reason:\
        var request = require("request");
        //console.log(query)

        request(config.url + "?" + query, function (error, response, body) {
            //console.log(arguments)
            if (error || response.statusCode !== 200) {
                console.error("giphy: Got error: " + body);
                console.log(error);
                //console.log(response)
            }
            else {
                var responseObj = JSON.parse(body)
                console.log(responseObj.data[0])
                if(responseObj.data.length){
                    func(responseObj.data[0].id);
                } else {
                    func(undefined);
                }
            }
        }.bind(this));
    }

bot.login(AuthDetails.email, AuthDetails.password);
