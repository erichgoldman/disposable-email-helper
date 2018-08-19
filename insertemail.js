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
 * Listens for input from the background page
 * @see {@https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/onMessage runtime.onMessage} documentation for more information
 */
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  
  /*  
   * Process requests of the tye "insert-email" from background script.
   * For this extension, menus are only added with `contexts:["editable"]`, therefore `activeElement` will always be an input field 
   * @see {@http://help.dottoro.com/ljmiswgp.php} for more information about `activeElement`
   *
   * Insert the email address from the menu option into the active input field on which the context-menu was launched.
   */  
  if(request.type === "insert-email"){

    document.activeElement.value = request.email;
    
  }  
  
});
  
