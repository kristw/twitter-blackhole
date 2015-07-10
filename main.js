var util = require('util');
var url = require('url');
var httpAgent = require('http-agent');
var jsdom = require('node-jsdom').jsdom;
var Promise = require('promise');
var fs = require('fs');
var request = require('request');
var argv = require('minimist')(process.argv.slice(2));

// This is the tweet in question
var leaf = argv.url || 'https://twitter.com/trebor/status/619372372731138048';
var outputPath = argv.output || 'test.json';

// How things actually work, if you care enough

var PREFIX = 'https://twitter.com';

function fetch(tweet){
  return new Promise(function(resolve, reject){
    jsdom.env({
      url: tweet,
      done: function (errors, window) {
        if(errors){
          reject(errors);
        }
        else{
          var document = window.document;

          var $text = document.querySelector('.js-original-tweet > .tweet-text');
          if($text){
            var text = $text.textContent;

            var fullName = null;
            try{
              fullName = document.querySelector('.js-original-tweet .fullname').textContent;
            }
            catch(ex){}

            var userName = null;
            try{
              userName = document.querySelector('.js-original-tweet .username').textContent;
            }
            catch(ex){}

            var $quotedTweet = document.querySelector('.js-original-tweet .QuoteTweet-container > .js-permalink');

            var nextURL = null;
            if($quotedTweet){
              try{
                nextURL = PREFIX + $quotedTweet.attributes.item(5).value;
              }
              catch(ex){}
            }

            resolve({
              text: text,
              fullName: fullName,
              userName: userName,
              url: tweet,
              nextURL: nextURL
            });
          }
          else{
            reject("cannot find .tweet-text");
          }
        }
      }
    });
  });
}

function writeOutput(obj){
  output = JSON.stringify(obj, null, 2);
  fs.writeFileSync(outputPath, output, 'utf-8');
}

var level = 0;
var tweets = [];
var limit = argv.limit;

function trace(url){
  fetch(url)
    .then(function(data){
      data.level = level;
      tweets.push(data);
      console.log(level, data);
      level++;

      if(!data.nextURL){
        console.log('Stop! no next URL');
        writeOutput(tweets);
      }
      else if(limit!==null && level >= limit){
        console.log('Stop! limit reached: ' + limit);
        writeOutput(tweets);
      }
      else{
        // backup every 100
        if(level%100===0){
          writeOutput(tweets);
        }
        trace(data.nextURL);
      }
    });
}

trace(leaf);