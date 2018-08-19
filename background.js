/**
 * Copyright (c) 2018 Eric H. Goldman
 * 
 * This file is part of Disposable Email Helper.
 * 
 * Disposable Email Helper is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Declare the base library for browser extensions in an opportunistic way to increase cross-browser compatibility
 * @see {@https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/}
 */
window.browser = (function () { return window.chrome || window.browser || window.msBrowser;})();

/**
 * @module disposableEmailHelper
 */
var disposableEmailHelper = (function() {

  'use strict';
  
  
  /*
   * The maximum number of history entries to remember at any time; items are removed FIFO
   */
  var historySize = 5;
  
  /*
   * The id corresponding to option/storage for the default email
   */ 
  var menuDefaultEmailId = 'defaultEmail';
  
  /*
   * The id corresponding to referencing the random email entries and settings
   */
  var menuRandomEmailId = 'randomEmail';
  
  /*
   * The prefix for random email address history items naming/storage
   */
  var menuHistoryItemBaseId = 'reuse';
  
      
  
  /**
   * Creates a context menu object for menus used to select email addresses.
   * Note: Title is assigned dynamically each time because it is based on current email settings
   * @param String menuId - The unique id for this menu
   */   
  function createBaseMenuObject(menuId){

    let callback = typeAndLoad;
        
    if(menuId === menuRandomEmailId){
      callback = useRandom;
    }
           
    browser.contextMenus.create( {id: menuId, contexts:['editable'], visible: false, onclick: callback, title: 'loading...'});
    
  }
 
  /**
   * Creates a separator line in the context menu
   */   
  function createSeperatorMenuObject(){
    
    let newMenuId = browser.contextMenus.create({contexts:['editable'],type:'separator'});
     
  }
  
  /**
   * Creates a context menu object for administrative features, e.g., manage settings, clear history
   * @param String title - The title text actually displayed on the context menu in the browser
   * @param String callback - The callback function which is called when the context menu is clicked
   */  
  function createAdministrativeMenuObject(title, callback){
    
    let newMenuId = browser.contextMenus.create({
      title: title, 
      contexts:['editable'], 
      onclick: callback || null,
    }); 
     
  }
  
  /**
   * Entry function called to start the extension
   */      
  function start(){

    createBaseMenuObject(menuDefaultEmailId); 
    createBaseMenuObject(menuRandomEmailId); 
    
    createSeperatorMenuObject();
    
    for(let i=0; i<historySize; i++){
      createBaseMenuObject(menuHistoryItemBaseId + i);
    }
    
    createSeperatorMenuObject();

    createAdministrativeMenuObject( chrome.i18n.getMessage('menuManageSettings'), loadOptions );
    createAdministrativeMenuObject( chrome.i18n.getMessage('menuClearHistory'), clearReuseHistory);
    
    updateMenusFromStorage();
    
     
  }
  
  
  /**
   * Obtains the current email settings from storage and then updates the actual context menus
   */  
  function updateMenusFromStorage(){

    let itemsToGet = { };

    itemsToGet[menuDefaultEmailId] = null;
    itemsToGet[menuRandomEmailId] = null;
    
    for(let i=0; i<historySize; i++){
      itemsToGet[ menuHistoryItemBaseId + i ] = null;
    }

    chrome.storage.sync.get(itemsToGet, function(items) {

      Object.keys(items).forEach(function(key) {

        /* If there is currently no value in storage and no default, don't set anything for that value */
        if(items[key] === null){
          return;
        }

        let heading = chrome.i18n.getMessage('menuReuse');
        
        if(key === menuDefaultEmailId){ 
          heading = chrome.i18n.getMessage('menuUseDefault'); 
        }
        
        if(key === menuRandomEmailId){ 
          heading = chrome.i18n.getMessage('menuUseRandom'); 
        }
        
        let title = heading + items[key]['base'] + items[key]['ending'];
        
        let menuProperties = {}
        menuProperties['visible'] = true;
        menuProperties['title'] = title;
        
        browser.contextMenus.update(key, menuProperties); 
        
      });


    });

  }

  /**
   * Simple random string generator, used for random emails
   * @todo Add in logic to compare random string against existing emails to ensure it is not a duplicate, low likelihood, but a good practice
   * @return {string} The new random string.
   */
  function getNewRandom(){
    let randomString = '';
    let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    
    for(let i = 0; i < 20; i++) {
        randomString += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    return randomString;
     
  }

  /**
   * Primary function to kick off action after an email context menu is selected.
   * @param Object info - Clicked context menu info provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   * @param Object tab - Tab where context menu click occured provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   */
  function typeAndLoad(info, tab){
    
    let menuId = info.menuItemId;
    
    chrome.storage.sync.get(menuId, function(items) {
      
      let targetUrl = items[menuId]['baseUrl'] + items[menuId]['base'];
      
      openDisposableEmailTab(info, tab, targetUrl);
      
      let targetEmail = items[menuId]['base'] + items[menuId]['ending'] ;
      
      sendEmailToContentScript(info, tab, targetEmail);
      
      //if its a previous, move it to the top of the list            
      if( RegExp('^reuse').test(menuId) ){
        reusePrevious(menuId);
      }
      
    });
        
  }

  /**
   * If this was an email in the history list, we move it to the top of the list after it is reused:
   * If it is being reused, likely to be reused again, so move it up so it doesn't get shifted out.
   * @param String menuId - The id of the context menu clicked by the user
   */
  function reusePrevious(menuId){
    
    let itemsToGet = { };

    for(let i=0; i<historySize; i++){
      itemsToGet[ menuHistoryItemBaseId + i ] = null;
    }
 
    chrome.storage.sync.get(itemsToGet, function(items) {
      
      let emailAddresses = [];
      emailAddresses[0] = items[menuId];
      
      Object.keys(items).forEach(function(key) {
       
        /* If there is currently no value in storage and no default, don't set anything for that value */
        if(items[key] === null){
          return;
        }
        
        /* If this is the menuId, we already set it as `emailAddresses[0]` above, skip it */
        if(key !== menuId){
          emailAddresses.push( items[key] );
        }
 
      });
      
      for(let i=0; i<emailAddresses.length;i++){
        
        browser.storage.sync.set({
          [ menuHistoryItemBaseId + i ]: emailAddresses[i],
        });
        
      }

    });          
    
  }

  /**
   * Secondary function called to send a message to the content script with the email to insert into the editable 
   * field from which the conext menu was clicked.
   * @param Object info - Clicked context menu info provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   * @param Object tab - Tab where context menu click occured provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   * @param String targetEmail - The email for the inbox presented on the menu which was clicked
   */
  function sendEmailToContentScript(info, tab, targetEmail){
    
    let emailInsertMessage = {
        type: 'insert-email',
        email: targetEmail,
    }

    let out = browser.tabs.sendMessage(tab.id, emailInsertMessage);  
    
  }

  /**
   * Secondary function called when an email context menu is selected. It will open a new tab with the `targetURL` 
   * or it will switch to that tab if it is already open in the same window.
   * For `targetUrlEscaped` you need to escape since URLs may include `?` or other characters than break regular expressions @see {@https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions}
   * @param Object info - Clicked context menu info provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   * @param Object tab - Tab where context menu click occured provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   * @param String targetUrl - The URL of the online inbox for the email address that was chosen on a menu
   */
  function openDisposableEmailTab(info, tab, targetUrl){
    
    
    let targetUrlEscaped = targetUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    let targetUrlRegEx = RegExp('^' + targetUrlEscaped  + '/?');
      
    browser.tabs.query({ 
      windowId: tab.windowId, //only search for the existing open tab in the same window      
    },function(matchedTabs){
      
      let tabOpenedId = null;
      
      /*
       * You need to iterate over all of the open tabs in the window. There is an option to specify `url:` 
       * in `browser.tabs.query()` however, it won't match if there is a hash (#) in the url, but the
       * url property for each `matchedTabs[i]` will include the full url, include the hash fragment.
       * @see {@https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/query}
       */
      for(let i=0; i<matchedTabs.length;i++){
        
        if( targetUrlRegEx.test( matchedTabs[i]['url'] ) ){
          
          tabOpenedId = matchedTabs[i]['index'];
          break;
         
        }
        
      }
      
      if(tabOpenedId === null){
       
        browser.tabs.create({  
          url: targetUrl,
          index: tab.index + 1,
          active: false,
        }); 
        
      }else{
        
        browser.tabs.highlight({
          windowId: tab.windowId,
          tabs: tabOpenedId,
        });
        
      }
       
    });    
    
  }

  /**
   * Calls general function to insert email address and open tab to webpage. Then shifts the
   * random email address typed into the history list and shifts all values in the history list.
   * @param Object info - Clicked context menu info provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   * @param Object tab - Tab where context menu click occured provided by contextMenus.onClicked @see {@https://developer.chrome.com/apps/contextMenus#event-onClicked}
   */
  function useRandom(info, tab){

    typeAndLoad(info,tab); 
        
    let itemsToGet = { };
    
    itemsToGet[menuRandomEmailId] = null;
    
    for(let i=0; i<historySize; i++){
      itemsToGet[ menuHistoryItemBaseId + i ] = null;
    }
    
    chrome.storage.sync.get(itemsToGet, function(items) {
      
      let historyItems = [];
      
      Object.keys(items).forEach(function(key) {
               
        /* If there is currently no value in storage and no default, don't set anything for that value */
        if(items[key] === null){
          return;
        }
        
        historyItems.push( items[key] );

      });
      
      for(let i=0; i<historyItems.length;i++){
        
        browser.storage.sync.set({
          [ menuHistoryItemBaseId + i ]: historyItems[i],
        });
        
      }
      
      updateRandom();
      
    });  
       
  }

  /**
   * Creates a new random email address. First checks for the current service from storage.
   * Note: `SERVICES` are stored in services.js and are included via the manifest, not within this file.
   */
  function updateRandom(){

    chrome.storage.sync.get('serviceId', function(items){

      let serviceId = parseInt( items['serviceId'] ) || 0;
      
      browser.storage.sync.set({
        [ menuRandomEmailId ]: {base: getNewRandom(), ending: SERVICES[serviceId]['ending'], baseUrl: SERVICES[serviceId]['baseUrl'] },
      });
      
    });

  }

  /**
   * Hides a menu when it is not active or has no history item.
   * @param String menuId - The id value of the menu you want to hide.
   */
  function disableMenu(menuId){      
    browser.contextMenus.update(menuId, {title: '---',visible: false,});            
  }

  /**
   * Removes the history of previously used random email addresses. Both the menu and the storage are cleared.
   */
  function clearReuseHistory(){
    
    for(let i=0; i<historySize; i++){
      
      let thisHistoryItem = menuHistoryItemBaseId + i
      
      browser.storage.sync.remove(thisHistoryItem);
      disableMenu(thisHistoryItem);
      
    }      
    
  }

  /**
   * Displays the extension options to the end user, callback for the 'Mange Settings' Menu.
   */
  function loadOptions(){
    browser.runtime.openOptionsPage();   
  }  

  /**
   * When the extension is installed, set the initial default and random email options.
   */
  function postInstallSetup(){

      let itemsToGet = { };

      itemsToGet[menuDefaultEmailId] = {base: 'john_smith', ending: SERVICES[0]['ending'], baseUrl: SERVICES[0]['baseUrl'] };
      
      browser.storage.sync.get(itemsToGet, function(items) {

        browser.storage.sync.set({[ menuDefaultEmailId ]: items[menuDefaultEmailId],});
        
        updateRandom();
  
      });  
    
  }

  /*
   * @return {Object}  Expose functions outside of module so they can be called by listeners, etc. 
   */
  return {    
      initiate: start, 
      updateMenus: updateMenusFromStorage,      
      updateRandom: updateRandom,
      postInstallSetup: postInstallSetup
  };    

})(); 




/**
 * When the extension is installed initially, populate the default variables for the options on first install ONLY
 * @see {@https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/onInstalled runtime.onInstalled} documentation for more information
 */
browser.runtime.onInstalled.addListener(function(details){
  
  if(details.reason == "install"){
    disposableEmailHelper.postInstallSetup()    
  }else if(details.reason == "update"){
    console.log("Updated from " + details.previousVersion + " to " + browser.runtime.getManifest().version + "!"); 
  }
  
});  




/**
 * Loads the module and does the initial setup
 * @see {@https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/onStartup runtime.onStartup} documentation for more information
 */
browser.runtime.onStartup.addListener( disposableEmailHelper.initiate() );




/**
 * Listens for changes to the extensions options and calls functions to update base on new values
 * @see {@https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/storage/onChanged runtime.onChange} documentation for more information
 */
browser.storage.onChanged.addListener( function(changes, areaName){

  disposableEmailHelper.updateMenus();

  //If the email service is changed, we need an extra update to the random email.
  if(typeof changes['serviceId'] !== 'undefined'){
    disposableEmailHelper.updateRandom();
  }
  
});

