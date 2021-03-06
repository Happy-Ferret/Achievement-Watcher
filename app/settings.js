"use strict";

const { remote } = require('electron');
const path = require("path");
const ini = require("ini");
const ffs = require("./util/feverFS.js");
const aes = require("./util/aes.js");
const steamLanguages = require("./locale/steam.json");

const filename = path.join(remote.app.getPath('userData'),"cfg/options.ini");

module.exports.load = ()=>{ 
    
  let options;
  
  try {
        options = ini.parse(ffs.sync.readFile(filename,"utf8"));
        
        if (!steamLanguages.some(lang => lang.api == options.achievement.lang)) {
          try {
            let locale = navigator.language || navigator.userLanguage || "en";
            options.achievement.lang = steamLanguages.find(lang => lang.webapi == locale).api;
          }catch(err){
            options.achievement.lang = "english";
          }
        }
        
        if (typeof options.achievement.showHidden !== "boolean"){
          options.achievement.showHidden = false;
        }
        
        if (typeof options.achievement.mergeDuplicate !== "boolean"){
          options.achievement.mergeDuplicate = true;
        }
        
        if (typeof options.achievement.notification !== "boolean"){
          options.achievement.notification = true;
        }
        
        if (isNaN(options.notifier.timeTreshold)){
          options.notifier.timeTreshold = 30;
        }
        
        if (typeof options.notifier.checkIfProcessIsRunning !== "boolean"){
          options.notifier.checkIfProcessIsRunning = true;
        }
        
        if (options.steam) {
          if (options.steam.apiKey){
            if (options.steam.apiKey.includes(":")) {
              options.steam.apiKey = aes.decrypt(options.steam.apiKey);
            }
          }
        } else {
          options.steam = {};
        }
        
    }catch(err){

        options = {
          achievement: {
            showHidden: false,
            mergeDuplicate: true,
            notification: true
          },
          notifier: {
            timeTreshold: 30,
            checkIfProcessIsRunning: true
          },
          steam: {}
        };
        
        try {
            let locale = navigator.language || navigator.userLanguage || "en";
            options.achievement.lang = steamLanguages.find(lang => lang.webapi == locale).api;
        }catch(err){
            options.achievement.lang = "english";
        }
        
        ffs.promises.writeFile(filename,ini.stringify(options),"utf8").catch(()=>{});
    }
    
    return options;
}

module.exports.save = (config) => {  
  return new Promise((resolve, reject) => {

    let options;
    try {
      options = JSON.parse(JSON.stringify(config)) //deep object copy to prevent modifying reference; We want to encrypt key to file but keep it decrypted in memory.
      
      if (options.steam) {
        if (options.steam.apiKey){
          options.steam.apiKey = aes.encrypt(config.steam.apiKey);
        }
      }
    }catch(err) {
      return reject(err);
    }

    return resolve(ffs.promises.writeFile(filename,ini.stringify(options),"utf8"));

  });
}