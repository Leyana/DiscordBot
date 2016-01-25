var Discord = require("discord.js");
var Idolgame = require("./Idolgame.js");
var Shipgame = require("./Shipgame.js");

var yt = require("./youtube_plugin");
var youtube_plugin = new yt();
var request = require('request');

try {
	var wa = require("./wolfram_plugin");
	var wolfram_plugin = new wa();
} catch(e){
	console.log("couldn't load wolfram plugin!\n"+e.stack);
}

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
var aliases;
var messagebox;

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

var messageSpamCount = 4;
var messageSpamPeriod = 15; // in sec
var usersDictionary = {};
var cmdLastExecutedTime = {};

var admin_ids = ["92800062886789120","93147516974923776","84511991804223488","92798750765903872"];
var owner_ids = ["93147516974923776"];
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
			bot.sendMessage(msg.author,bot.servers);
		}
    },
    "channels": {
		description: "lists channels bot is connected to",
		adminOnly: true,
		process: function(bot,msg) { 
			bot.sendMessage(msg.author,bot.channels);
		}
    },
    "myid": {
        description: "returns the user id of the sender",
        process: function(bot,msg){
			bot.sendMessage(msg.author,msg.author.id);
		}
    },
    "idle": {
        description: "sets bot status to idle",
        ownerOnly: true,
		process: function(bot,msg){ 
			bot.setStatusIdle();
		}
	},
    "online": {
        description: "sets bot status to online",
	ownerOnly: true,
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
    "youtube": {
        usage: "<video tags>",
        description: "gets youtube video matching tags",
	timeout: 15, // in sec
        process: function(bot,msg,suffix){
            youtube_plugin.respond(suffix,msg.channel,bot);
        }
    },
    "version": {
        description: "returns the git commit this bot is running",
	ownerOnly: true,
        process: function(bot,msg,suffix) {
            var commit = require('child_process').spawn('git', ['log','-n','1']);
            commit.stdout.on('data', function(data) {
                bot.sendMessage(msg.channel,data);
            });
            commit.on('close',function(code) {
                if( code != 0){
                    bot.sendMessage(msg.channel,"failed checking git version!");
                }
            });
        }
    },
    "wiki": {
        usage: "<search terms>",
        description: "returns the summary of the first matching search result from Wikipedia",
	timeout: 5, // in sec
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
                                bot.sendMessage(msg.channel,paragraph,continuation);
                            }
                        };
                        continuation();
                    });
                });
            },function(err){
                bot.sendMessage(msg.channel,err);
            });
        }
    },
    "join-server": {
        usage: "<invite>",
        description: "joins the server it's invited to",
	ownerOnly: true,
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
        usage: "<channel name>",
        description: "creates a new text channel with the given name.",
	adminOnly: true,
        process: function(bot,msg,suffix) {
            bot.createChannel(msg.channel.server,suffix,"text").then(function(channel) {
                bot.sendMessage(msg.channel,"created " + channel);
            }).catch(function(error){
				bot.sendMessage(msg.channel,"failed to create channel: " + error);
			});
        }
    },
	"voice": {
		usage: "<channel name>",
		description: "creates a new voice channel with the give name.",
	adminOnly: true,
		process: function(bot,msg,suffix) {
            bot.createChannel(msg.channel.server,suffix,"voice").then(function(channel) {
                bot.sendMessage(msg.channel,"created " + channel.id);
				console.log("created " + channel);
            }).catch(function(error){
				bot.sendMessage(msg.channel,"failed to create channel: " + error);
			});
        }
	},
    "delete": {
        usage: "<channel name>",
        description: "deletes the specified channel",
	adminOnly: true,
        process: function(bot,msg,suffix) {
			var channel = bot.channels.get("id",suffix);
			if(suffix.startsWith('<#')){
				channel = bot.channels.get("id",suffix.substr(2,suffix.length-3));
			}
            if(!channel){
				var channels = bot.channels.getAll("name",suffix);
				if(channels.length > 1){
					var response = "Multiple channels match, please use id:";
					for(var i=0;i<channels.length;i++){
						response += channels[i] + ": " + channels[i].id;
					}
					bot.sendMessage(msg.channel,response);
					return;
				}else if(channels.length == 1){
					channel = channels[0];
				} else {
					bot.sendMessage(msg.channel, "Couldn't find channel " + suffix + " to delete!");
					return;
				}
			}
            bot.sendMessage(msg.channel.server.defaultChannel, "deleting channel " + suffix + " at " +msg.author + "'s request");
            if(msg.channel.server.defaultChannel != msg.channel){
                bot.sendMessage(msg.channel,"deleting " + channel);
            }
            bot.deleteChannel(channel).then(function(channel){
				console.log("deleted " + suffix + " at " + msg.author + "'s request");
            }).catch(function(error){
				bot.sendMessage(msg.channel,"couldn't delete channel: " + error);
			});
        }
    },
    "stock": {
        usage: "<stock to fetch>",
        process: function(bot,msg,suffix) {
            var yahooFinance = require('yahoo-finance');
            yahooFinance.snapshot({
              symbol: suffix,
              fields: ['s', 'n', 'd1', 'l1', 'y', 'r'],
            }, function (error, snapshot) {
                if(error){
                    bot.sendMessage(msg.channel,"couldn't get stock: " + error);
                } else {
                    //bot.sendMessage(msg.channel,JSON.stringify(snapshot));
                    bot.sendMessage(msg.channel,snapshot.name
                        + "\nprice: $" + snapshot.lastTradePriceOnly);
                }  
            });
        }
    },
	"wolfram": {
		usage: "<search terms>",
        description: "gives results from wolframalpha using search terms",
	timeout: 5, // in sec
        process: function(bot,msg,suffix){
				if(!suffix){
					bot.sendMessage(msg.channel,"Usage: !wolfram <search terms> (Ex. !wolfram integrate 4x)");
				}
	            wolfram_plugin.respond(suffix,msg.channel,bot);
       	    }
	},
    "rss": {
        description: "lists available rss feeds",
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
    "reddit": {
        usage: "[subreddit]",
        description: "Returns the top post on reddit. Can optionally pass a subreddit to get the top psot there instead",
	timeout: 5, // in sec
        process: function(bot,msg,suffix) {
            var path = "/.rss"
            if(suffix){
                path = "/r/"+suffix+path;
            }
            rssfeed(bot,msg,"https://www.reddit.com"+path,1,false);
        }
    },
	"userid": {
		usage: "[user to get id of]",
		description: "Returns the unique id of a user. This is useful for permissions.",
		ownerOnly: true,
		process: function(bot,msg,suffix) {
			if(suffix){
				var users = msg.channel.server.members.getAll("username",suffix);
				if(users.length == 1){
					bot.sendMessage(msg.channel, "The id of " + users[0] + " is " + users[0].id)
				} else if(users.length > 1){
					var response = "multiple users found:";
					for(var i=0;i<users.length;i++){
						var user = users[i];
						response += "\nThe id of " + user + " is " + user.id;
					}
					bot.sendMessage(msg.channel,response);
				} else {
					bot.sendMessage(msg.channel,"No user " + suffix + " found!");
				}
			} else {
				bot.sendMessage(msg.channel, "The id of " + msg.author + " is " + msg.author.id);
			}
		}
	},
	"topic": {
		usage: "[topic]",
		adminOnly: true,
		description: 'Sets the topic for the channel. No topic removes the topic.',
		process: function(bot,msg,suffix) {
			bot.setTopic(msg.channel,suffix);
		}
	},
	"msg": {
		usage: "<user> <message to leave user>",
		description: "leaves a message for a user the next time they come online",
		process: function(bot,msg,suffix) {
			var args = suffix.split(' ');
			var user = args.shift();
			var message = args.join(' ');
			if(user.startsWith('<@')){
				user = user.substr(2,user.length-3);
			}
			var target = msg.channel.server.members.get("id",user);
			if(!target){
				target = msg.channel.server.members.get("username",user);
			}
			messagebox[target.id] = {
				channel: msg.channel.id,
				content: target + ", " + msg.author + " said: " + message
			};
			updateMessagebox();
			bot.sendMessage(msg.channel,"message saved.")
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
	},
"shipgame": {
	   	usage: "<none>",
  		description: "Play The Game. Search for the ship you get in danbooru with -rating:explicit. Take the first non-comic and use it as your avatar.",
   		timeout: 5, // in sec
   		process: function(bot,msg) {
      	var Ship = Shipgame.shipgame();
	var gameurl = "https://safebooru.donmai.us/posts.json?tags=" + Ship + "_%28kantai_collection%29+-comic&limit=1";
	var str = Ship;
	var res = str.replace(/_/g, " ");

	request(gameurl, function (error, response, html) {
  	if (!error && response.statusCode == 200) {
	var ship = JSON.parse(html);
	var result = "https://safebooru.donmai.us" + ship[0].large_file_url;
      
	bot.sendMessage(msg.channel,res + "\n" + result);
  }
});
   }
},
	"idolhell": {
	   	usage: "<none>",
  		description: "Play The Game. Search for the idol you get in danbooru with -rating:explicit. Take the first non-comic and use it as your avatar.",
   		timeout: 5, // in sec
   		process: function(bot,msg) {
		var Idol = Idolgame.idolhell();
	var gameurl = "https://safebooru.donmai.us/posts.json?tags=" + Idol + "+-comic&limit=1";
	var str = Idol;
	var res = str.replace(/_/g, " ");
	res = res.replace(/anime/g, " ")
	res = res.replace(/idolmaster/g, " ")
	res = res.replace(/cinderella girls/g, " ");
	res = res.replace(/[{()}]/g, '');
	res = res.replace(/Naka kantai collection/g, "Kantai No Idoru");
	
	request(gameurl, function (error, response, html) {
  	if (!error && response.statusCode == 200) {
	var ship = JSON.parse(html);
	var result = "https://safebooru.donmai.us" + ship[0].large_file_url;
      
	bot.sendMessage(msg.channel,res + "\n" + result);
  }
});
	}
},
    "kcwiki": {
        usage: "<search term>",
        description: "Kancolle wiki search function.",
	timeout: 5, // in sec
        process: function(bot,msg,suffix) {
var searchurl = "http://en.kancollewiki.net/api.php?action=opensearch&search=" + suffix;
request(searchurl, function (error, response, html) {
  if (!error && response.statusCode == 200) {
	var ship = JSON.parse(html);
	var result = ship[3][0];
      bot.sendMessage(msg.channel,result);
  }
});
			}
    },
	"mute": {
		usage: "Mute user (admin only)",
		description: "Prevents a user from sending messages.",
		adminOnly: true,
		process: function(bot,msg,suffix) {
			var user = msg.mentions[0].id
			bot.addMemberToRole(user, msg.channel.server.roles.get("name", "NaughtyCorner"))
			console.log(suffix + " has been muted.")
			bot.sendMessage(msg.channel,"Take a break.")
		}
	},
	"unmute": {
		usage: "Unmute user (admin only)",
		description: "Restores ability to send messages.",
		adminOnly: true,
		process: function(bot,msg,suffix) {
			var user = msg.mentions[0].id
			bot.removeMemberFromRole(user, msg.channel.server.roles.get("name", "NaughtyCorner"))
			console.log(suffix + " has been muted.")
			bot.sendMessage(msg.channel,"Behave this time.")
		}
	},
	"slap": {
        usage: "<message>",
        description: "Slaps someone with random things.",
		timeout: 5, // in sec
        process: function(bot,msg,suffix){ 
        bot.sendMessage(msg.channel, msg.sender + " slaps " + suffix + " around a bit with a large trout.");}
    },
	
	"kick": {
        usage: "<user>",
        description: "Don't push the big red button.",
		timeout: 5, // in sec
        process: function(bot,msg){ 
		bot.kickMember(msg.author, msg.channel.server)
        bot.sendMessage(msg.channel, "Did you really think that would work?");}
    },
    	"weather": {
        usage: "<city/postcode;country>",
        description: "Use the city name or post code, country codes are optional and based off: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2",
        process: function(bot,msg,suffix){ 
		var weatherurl = "http://api.openweathermap.org/data/2.5/weather?q=" + suffix + "&appid=ff6c10b19b22817f2697be556825ec56";
		request(weatherurl, function (error, response, html) {
			if (!error && response.statusCode == 200 && suffix != null) {
				var weathersearch = JSON.parse(html);
				var conditions = weathersearch.weather[0].main;
				var tempC = (weathersearch.main.temp-273.15).toFixed(2);
				var tempF = ((weathersearch.main.temp*9/5)-459.67).toFixed(2);
				if(weathersearch.wind.deg > 337.5 || weathersearch.wind.deg <22.5) {
					var windDir = "North";
				} else if (weathersearch.wind.deg > 22.5 && weathersearch.wind.deg <67.5) {
					var windDir = "North East";
				} else if (weathersearch.wind.deg > 67.5 && weathersearch.wind.deg <112.5) {
					var windDir = "East";
				} else if (weathersearch.wind.deg > 112.5 && weathersearch.wind.deg <157.5) {
					var windDir = "South East";
				} else if (weathersearch.wind.deg > 157.5 && weathersearch.wind.deg <202.5) {
					var windDir = "South";
				} else if (weathersearch.wind.deg > 202.5 && weathersearch.wind.deg <247.5) {
					var windDir = "South West";
				} else if (weathersearch.wind.deg > 247.5 && weathersearch.wind.deg <292.5) {
					var windDir = "West";
				} else {
					var windDir = "North West";
				};
				var windSpdK = (weathersearch.wind.speed*18/5).toFixed(2);
				var windSpdM = (weathersearch.wind.speed*2.237).toFixed(2);
				var humidity = weathersearch.main.humidity;
				var city = weathersearch.name;
				var place = weathersearch.sys.country;
				var windchillF = (35.74+(0.6215*tempF)-(35.75*windSpdM*Math.pow(10,0.16))+(0.4275*tempF*windSpdM*Math.pow(10,0.16))).toFixed(2);
				var windchillC = ((windchillF-32)*5/9).toFixed(2)
				bot.sendMessage(msg.author,"The weather right now in " + suffix + " is: "+ 
				"\n" + "Conditions: " + conditions +
				"\n" + "Temperature: " + tempC + "C/" + tempF +"F" +
				"\n" + "Wind: " + windSpdK + "kph/" + windSpdM + "mph blowing "+ windDir +
				"\n" + "Humidity: " + humidity + "%");
			} else {
				bot.sendMessage(msg.channel,"Please input a city/zip and country using the syntax <city/postcode;country>")
			}
		});
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

try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}

try{
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}
function updateMessagebox(){
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

var fs = require('fs'),
	path = require('path');
function getDirectories(srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	});
}
function load_plugins(){
	var plugin_folders = getDirectories("./plugins");
	for (var i = 0; i < plugin_folders.length; i++) {
		var plugin;
		try{
			var plugin = require("./plugins/" + plugin_folders[i])
		} catch (err){
			console.log("Improper setup of the '" + plugin_folders[i] +"' plugin. : " + err);
		}
		if (plugin){
			if("commands" in plugin){
				for (var j = 0; j < plugin.commands.length; j++) {
					if (plugin.commands[j] in plugin){
						commands[plugin.commands[j]] = plugin[plugin.commands[j]];
					}
				}
			}
		}
	}
	console.log("Loaded " + Object.keys(commands).length + " chat commands type !help in Discord for a commands list.")
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
	load_plugins();
});

bot.on("disconnected", function () {

	console.log("Disconnected!");
	process.exit(1); //exit node.js with an error
	
});

bot.on("message", function (msg) {
	if (msg.author.username != bot.user.username) {
		updateSpamFilterLog(msg);
	}
	//check if message is a command

	if(msg.author.id != bot.user.id && (msg.content[0] === '!' || msg.content.indexOf(bot.user.mention()) == 0)){
        console.log("treating " + msg.content + " from " + msg.author + " as command");
		var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length+2);//add one for the ! and one for the space
        if(msg.content.indexOf(bot.user.mention()) == 0){
			try {
				cmdTxt = msg.content.split(" ")[1];
				suffix = msg.content.substring(bot.user.mention().length+cmdTxt.length+2);
			} catch(e){ //no command
				console.log(msg.channel,"Yes?");
				return;
			}
        }
		alias = aliases[cmdTxt];
		if(alias){
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
		}
		var cmd = commands[cmdTxt];
        if(cmdTxt === "help"){
            //help is special since it iterates over the other commands
			bot.sendMessage(msg.author,"Available Commands:", function(){
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
			});
        }
		else if(cmd) {
			var cmdCheckSpec = canProcessCmd(cmd, cmdTxt, msg.author.id, msg);
			if(cmdCheckSpec.isAllow) {
				try{
					cmd.process(bot,msg,suffix);
				} catch(e){
					console.log("command " + cmdTxt + " failed :(\n" + e.stack);
				}
            //if ("process" in cmd ){ 
			//	cmd.process(bot,msg,suffix);
			//}
			} else {
				console.log("Invalid command " + cmdTxt);
			}
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
	
	if (cmd.hasOwnProperty("ownerOnly") && cmd.ownerOnly && !isOwner(userId)) {
		isAllowResult = false;
	}
	
	return { isAllow: isAllowResult, errMsg: errorMessage };
}

function isAdmin(id) {
  return (admin_ids.indexOf(id) > -1);
}
function isOwner(id) {
  return (owner_ids.indexOf(id) > -1);
}

function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}
 
function updateSpamFilterLog(msg) {
// get user instance by id
	var user = msg.author;
	var currentUser = usersDictionary[user.id];

	if (!currentUser) {
		// create user and insert to dictionary
		usersDictionary[user.id] = {id: user.id, isMuted: false, msgLogs: []};
		currentUser = usersDictionary[user.id];
	}
	
	// todo: refactor to use server roles instead of adding muted flag
	if (currentUser.isMuted) {
		return;
	}

	if (currentUser.msgLogs.length > messageSpamCount) {
		// check if the earliest message is within spam period
		var earliestMessageSentDateTime = currentUser.msgLogs[0].sentDateTime;
		earliestMessageSentDateTime.setSeconds(earliestMessageSentDateTime.getSeconds() + messageSpamPeriod);
		if (new Date() < earliestMessageSentDateTime) {
			currentUser.isMuted = true;
			bot.addMemberToRole(user, msg.channel.server.roles.get("name", "NaughtyCorner"));
			bot.sendMessage(msg.author,"Please do not spam.")
			setTimeout(function(){
				currentUser.isMuted = false;
				bot.removeMemberFromRole(user, msg.channel.server.roles.get("name", "NaughtyCorner"));
				// purge all logs
				currentUser.msgLogs = [];
			}, 30000);
			return;
		}
	}
	
	// purge logs beyond spam period
	currentUser.msgLogs = currentUser.msgLogs.filter(function(msgLog) {
		var timeThreshold = new Date();
		timeThreshold.setSeconds(timeThreshold.getSeconds() - messageSpamPeriod);
		return msgLog.sentDateTime > timeThreshold;
	});
	
	// log current message
	currentUser.msgLogs.push({msg: msg.content, sentDateTime: new Date()});
}
//Log user status changes
bot.on("presence", function(user,status,gameId) {
	//if(status === "online"){
	//console.log("presence update");
	console.log(user.username+" went "+status);
	//}
	try{
	if(status != 'offline'){
		if(messagebox.hasOwnProperty(user.id)){
			console.log("found message for " + user.id);
			var message = messagebox[user.id];
			var channel = bot.channels.get("id",message.channel);
			delete messagebox[user.id];
			updateMessagebox();
			bot.sendMessage(channel,message.content);
		}
	}
	}catch(e){}
});

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
