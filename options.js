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
 * @module disposableEmailHelper
 */
var disposableEmailHelperOptions = (function() {
  
  
  /*
   * Main entry function run when the script is loaded
   */
  function start(){
    
    loadI18n();
    restoreOptions();
    
  }

  /**
   * Stores the user selected options into storage 
   */
  function saveOptions() {
    
    var service = parseInt(document.getElementById('service').value) || 0;

    var onlyShowHttps = document.getElementById('onlyShowHttps').checked || false;
    
    var defaultEmail = {
      base: document.getElementById('defaultEmail').value,
      ending: SERVICES[service]['ending'], 
      baseUrl: SERVICES[service]['baseUrl'], 
    }
      
    chrome.storage.sync.set({
      defaultEmail: defaultEmail,
      serviceId: service,
      onlyShowHttps: onlyShowHttps
    }, function(){
             
      var status = document.getElementById('status');

      status.style.display = 'inherit';

      /*
       * Display the success message `<div />` temporarily after the settings are succesfully saved
       */
      setTimeout(function() {
        status.style.display = 'none';
      }, 2500);
      
    });
    
  }

  /**
   * Loads the saved options from storage and sets the options in HTML appropriately. 
   */
  function restoreOptions() {
        
    chrome.storage.sync.get({
      defaultEmail: {base: 'john_smith', ending: SERVICES[0]['ending'], baseUrl: SERVICES[0]['baseUrl'] },
      serviceId: 0,
      onlyShowHttps: false,
    }, function(items) {
   
      document.getElementById('onlyShowHttps').checked = items.onlyShowHttps;
      
      updateServiceList(); 
      
      document.getElementById('defaultEmail').value = items.defaultEmail.base;
      document.getElementById('service').value = items.serviceId;
      document.getElementById('serviceDomain').text = SERVICES[items.serviceId]['ending'];
      
    });
    
  }
  
  /**
   * Updates the dropdown list based upon the services listed in services.js.
   * Note: `SERVICES` are stored in services.js and are included via the HTML options page.
   */
  function updateServiceList(){
   
    var httpsBaseUrlRegEx = new RegExp('^https', 'i'); 
    
    var onlyShowHttps = document.getElementById('onlyShowHttps').checked || false;
    
    var service = document.getElementById('service');    
        
    service.innerText = null;
    service.options.length = 0;
    
    for(let i=0; i < SERVICES.length; i++){
       
      if(onlyShowHttps === true && httpsBaseUrlRegEx.test(SERVICES[i]['baseUrl']) === false){
        
        continue;
        
      }else{

        let option = document.createElement("option");
        
        option.text = SERVICES[i]['name'] + " (" + SERVICES[i]['ending'] + ")";
        option.value = i;
        
        service.add(option);
      
      }
      
    } 
    
    updateDefaultEmailDomain();
    
  }

  /**
   * Updates the default email base displayed in the options based on changes to the dropdown
   */
  function updateDefaultEmailDomain(){
  
    var serviceId = document.getElementById('service').options[document.getElementById('service').selectedIndex].value;

    document.getElementById('serviceDomain').text = SERVICES[serviceId]['ending'];
    
      
  }
  
  /**
   * Translate the text in divs in the HTML. Load internationalization from `_locales`.
   * @see {#https://developer.chrome.com/extensions/i18n#method-getMessage}
   */
  function loadI18n(){
    
    i18nElements = [
      'optionsSectionHeader', 
      'optionsServiceSelectionHeader', 'optionsServiceSelectionHelp',
      'optionsServiceSelectionHttpsFilter',
      'optionsDefaultEmailHeader', 'optionsDefaultEmailHelp',
      'optionsSaveButtonText', 'optionsSavedHeader', 'optionsSavedMessage',
      'optionsDonateLinkText','optionsHelpLinkText'
      ];

    i18nElements.forEach(function(elementId) {
      document.getElementById(elementId).innerHTML = chrome.i18n.getMessage(elementId);  
    });  
    
  }
  
  /*
   *  Expose functions outside of module so they can be called by listeners, etc. 
   */  
  return {    
      start: start, 
      updateDefaultEmailDomain: updateDefaultEmailDomain,
      saveOptions: saveOptions,
      updateServiceList: updateServiceList,
  }; 
  

})();  
 
/**
 * Wait for HTML to load, then initiate the script
 */
document.addEventListener('DOMContentLoaded', disposableEmailHelperOptions.start );

/**
 * When the dropdown option is changed, immediately change the email ending display for clarity, don't wait until saved
 */
document.getElementById('service').addEventListener('change', disposableEmailHelperOptions.updateDefaultEmailDomain );

/**
 * When the checkbox option is changed for https filtering, immediately remove the services where the baseUrl does not start with `^https`
 */
document.getElementById('onlyShowHttps').addEventListener('click', disposableEmailHelperOptions.updateServiceList );

/**
 * Save the user's changed when the user explicitly saves
 */
document.getElementById('optionsSaveButtonText').addEventListener('click', disposableEmailHelperOptions.saveOptions );
