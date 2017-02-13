/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

let cegit = require('./gitfunctions.js');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

let Botkit = require('./lib/Botkit.js');
let os = require('os');

let controller = Botkit.slackbot({
    debug: true,
});

let bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    let name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});

/* controller.hears(['stage (?:the )?(.*) (?:with)? (.*)?','stage'], 'direct_message', function(bot, message) {
    let branchString = "";
    let branches = [];
    let project;

    bot.startConversation(message, function(err, convo) {
        if (!err) {
            if (message.match[1] !== undefined) {
                project = message.match[1];
            }

            if (message.match[2] !== undefined) {
                branchString = message.match[2];
                branches = branchString.replace(/,|and /g,"").split(" ");
            }

            switch (project) {
                case 'website':
                    if(branches.length < 1) {
                        convo.say("The website is made up of multiple repos. Since you didn't specify any branches, I'm assuming you want me to stage the Master branch of each related Repo. Is that correct?\n\n");
                    } else {
                        convo.say("I will include " + branchString);
                    }


                    break;

                case 'webadmin':
                    convo.say("As you know, webadmin relies on the API? Is there a particular repo you want me to use?")

                    break;

                default:
                convo.say("I'd love to help, but I have no idea what " + project + " is.");
            }
        }
    });
});

*/

controller.hears(['stage webadmin'], 'direct_message', function(bot, message) {

    let stagePlan = {};
    stagePlan.repo = "webadmin";


    let webAdminBranch = function(err, convo) {
        // how about presenting master and the 3 most recently update branches for each repo and giving buttons. User can type their branch or click a button.

        branches = cegit.getActiveBranches("Node-Webadmin", function (branches) {

            console.log(branches);

            if (branches.length > 1) {
                convo.ask("Sure thing. Which branch of WebAdmin would you like me to stage?", function(response, convo) {

                    for (let i = 0; i < branches.length; i++) {
                        if (branches[i].name === response.text) {
                            stagePlan.branch = response.text;
                            webAPIBranch(response, convo);
                            convo.next();
                        }
                    }

                    webBadBranch(response, convo);
                    convo.next;
//                    stagePlan.branch = response.text;
//                    webAPIBranch(response, convo);
//                    convo.next();
                });
            } else if (branches.length === 1) {
                convo.ask("Sure thing. I'm only seeing the *Master* branch right now. Is that what you want me to stage?");
                stagePlan.branch = "master";
                    webAPIBranch(response, convo);
                    convo.next();
            } else {
                convo.say("Hmm.  Something's not right.  Please try again later.");
            }

        });


    };

    let webBadBranch = function(err, convo) {
        convo.ask("Hmmm.  Not familiar with that branch.  Want to try again?", function(response, convo) {

        });
    }

    let webAPIBranch = function(err, convo) {
        convo.ask('And which branch of API do you want?', function(response, convo) {
            stagePlan.api = response.text;
            convo.say("Got it.  Here's the plan:\n\n I'm going to stage the *" + stagePlan.branch + "* of WebAdmin using the " + stagePlan.api + " branch of the API.");
            convo.next();
        });
    }


    // Offer a summmary with Accept or Reject Buttons.

    bot.startConversation(message, webAdminBranch);




});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        let hostname = os.hostname();
        let uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });

function formatUptime(uptime) {
    let unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
