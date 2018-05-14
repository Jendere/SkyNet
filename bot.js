//import discord.js libraries
const Discord = require("discord.js");
const config = require("./config.json");
const pokedex = require("./Pokedex.json");
const my_ver = require("./package.json");
let mode = 1;

//random number generator
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

//random channel id
function getRandomChannel(){
  return config.SPAM_CHANNEL[getRandomInt(config.SPAM_CHANNEL.length)];
}

//random spam message
function getRandomMessage(){
  return config.SPAM_MSG[getRandomInt(config.SPAM_MSG.length)];
}

//spamtime func
function spamtime(bot){
  if(mode == 1)
  {
  let spam_house = bot.channels.get(getRandomChannel());
  spam_house.startTyping(3);
  spam_house.send(getRandomMessage());
  spam_house.stopTyping(true);
  }
}

//next pokemon
function nextPokemon(message,bot)
{
  bot.channels.get(config.SAY_CHANNEL).send("p!info").then(() => {
    const filter = m => config.POKECORD_ID == m.author.id;

    bot.channels.get(config.SAY_CHANNEL).awaitMessages(filter, { time: 10000, maxMatches: 1, errors: ['time'] })
        .then(messages => {
            messages.array().forEach(msg => {
              if(msg.embeds.length == 0)
                nextPokemon(message,bot);
              else 
              msg.embeds.forEach((embed) => {
                if(embed.title && embed.title.startsWith("Level 100")){
                  bot.channels.get(config.SAY_CHANNEL).send("p!n");
                }
                else
                nextPokemon(message,bot);
              })
            });
        })
        .catch(() => {
            nextPokemon(message,bot);
        });
});
}

//waitsend func
function waitsend(client,chan,tp){
  client.channels.get(chan).send(tp);
}

//logging function
function logEnter(message, logdata)
{
  if(bot.channels.get(config.LOG_ID) && bot.channels.get(config.LOG_ID).type == "text")
    bot.channels.get(config.LOG_ID).send(logdata);
  else
    message.channel.send("Log channel not found!");
}

//Bot instance and Playing message
let bot = new Discord.Client();
bot.on("ready", function() {
  console.log('Logged in as '+bot.user.username);
  bot.user.setActivity('God', { type: 'PLAYING' });

  //spam
  setInterval(spamtime,1500,bot);

});

//error listener
bot.on("error", function(err) {
  console.error(err);
});

//When a message is received
bot.on("message", function(message) {

if(message.author == bot.user) return;
if(message.channel.type == "dm") return ;

//ping
if(message.content.toLowerCase() == "!ping")
{
  let pingtime = parseInt(bot.ping);
  message.channel.send(`Po${'o'.repeat((pingtime-100)/10)}ng! ${pingtime}ms`);
}

else if(message.channel.id == config.SAY_CHANNEL && message.content.toLowerCase() == "!stop")
{
  bot.user.setActivity('with Myself', { type: 'PLAYING' });
  message.channel.send("Ugh. Humans!");
  mode = 0;
}

else if(message.channel.id == config.SAY_CHANNEL && message.content.toLowerCase() == "!start")
{
  if(mode == 1)
  {
    message.channel.send("I'm right here lol :joy:");
  }
  else
  {
    bot.user.setActivity('God', { type: 'PLAYING' });
    message.channel.send("Ready to comply!");
    mode = 1;
  }
}

else if( mode == 1){
//When a New pokemon appears or a pokemon levels up
 if(message.author.id == config.POKECORD_ID)
{

  //level up (need to check)
  if(message.content.match(/\b100!```/) && message.content.indexOf(bot.user.username) != -1)
  {
    nextPokemon(message,bot);
    logEnter(message, message.content);
  }

  //new poke... possibly
  else
  {
  message.embeds.forEach((embed) => {
    if(embed.title){
    if(embed.title.startsWith("A wild")){
      var index = pokedex.table.findIndex(obj => obj.url==embed.image.url);
      if(index == -1)
        return;
      if(!pokedex.table[index].catch)
        return;
      message.channel.send("p!catch "+pokedex.table[index].name);
      var newpoke = new Discord.RichEmbed()
        .setTitle("New Pokemon Spotted!")
        .setThumbnail(embed.image.url)
        .setColor("#22dd22")
        .setFooter(message.createdAt.toString().substring(0,message.createdAt.toString().indexOf('+')))
        .addField("Server", message.guild.name)
        .addField("Channel", message.channel.name)
        .addField("Pokemon", pokedex.table[index].name);
        logEnter(message, newpoke);
    }
    }
  });
  }
}

//Speech commands
else if(message.channel.id == config.SAY_CHANNEL && message.content.toLowerCase().startsWith("!say"))
{
  let cts = message.content.substring(5,23);
  if(bot.channels.get(cts))
  {
    bot.channels.get(cts).startTyping(3);
    setTimeout(waitsend,3000,bot,cts,message.content.substring(24));
    bot.channels.get(cts).stopTyping(true);
    message.channel.send(new Discord.RichEmbed()
      .setTitle("Scroll Delivered!")
      .setThumbnail(bot.channels.get(cts).guild.iconURL)
      .setColor("#22dd22")
      .setFooter(message.createdAt.toString().substring(0,message.createdAt.toString().indexOf('+')))
      .addField("Sender", message.author)
      .addField("Castle sent to", bot.channels.get(cts).guild.name)
      .addField("Room delivered to", bot.channels.get(cts).name)
      .addField("Content of the scroll", message.content.substring(24)));
    message.delete();
  }
  else
  {
    message.reply("Pardon me senpai! Couldn't deliver the scroll!! :frowning: ");
  }
}

//version
else if(message.channel.id == config.SAY_CHANNEL && message.content.toLowerCase().startsWith("!version"))
{
  message.channel.send(my_ver.version);
}

//Every other command
else if(message.author.id == ("340886593722253312") && message.content.startsWith("!"))
{
  message.channel.send("p"+message.content);
}
}

});

//login with token
bot.login(process.env.BOT_TOKEN);
