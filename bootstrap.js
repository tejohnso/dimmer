/*global Components, APP_SHUTDOWN, makeDimmer, makeObserver,
  prefBranch, makeDimmerMenu */
"use strict";
var Cc = Components.classes;
var Ci = Components.interfaces;

var modulePath = 'chrome://dimmer/content/modules/';

function loadIntoWindow(window) {
  if (!window.document.getElementById("tabbrowser-tabs")) { return; }
  window.dimmerAddon = {};
  window.dimmerAddon.dimmerListener = 
     makeDimmer(prefBranch.getIntPref('opacity'), window);

  window.dump('dimmer: loading listener\n');
  window.gBrowser
    .addEventListener("DOMContentLoaded", 
    window.dimmerAddon.dimmerListener, true);
  window.dimmerAddon.dimmerPrefObserver = makeObserver(window, makeDimmer);
  prefBranch.addObserver('', window.dimmerAddon.dimmerPrefObserver, false);
  window.dimmerAddon.menu = makeDimmerMenu(window);
  window.dimmerAddon.menu.readConfig();
  window.dump('dimmer: loaded listener\n');
}

function unloadFromWindow(window) {
  if (!window) {
    return;
  }
  window.dimmerAddon.dimmerPrefObserver.unregister();
  window.gBrowser.removeEventListener("DOMContentLoaded",
       window.dimmerAddon.dimmerListener, true);
  window.dimmerAddon.menu.unload();
  delete window.dimmerAddon;
  window.dump('dimmer: unloaded\n');
}

/*
 bootstrap.js API
*/

var windowListener = {
  onOpenWindow: function(aWindow) {
    var domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
                    getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function loadHandler() {
      domWindow.removeEventListener("load", loadHandler, true);
      loadIntoWindow(domWindow);
    }, true);
  },
  onCloseWindow: function(aWindow) { },
  onWindowTitleChange: function(aWindow, aTitle) { }
};

function startup(aData, aReason) {
   var wm, enumerator, win;
   wm = Cc["@mozilla.org/appshell/window-mediator;1"]
     .getService(Ci.nsIWindowMediator);
   Components.utils.import(modulePath + 'makeDimmer.js');
   Components.utils.import(modulePath + 'prefObserver.js');
   Components.utils.import(modulePath + 'dimmerMenu.js');
   
  enumerator = wm.getEnumerator("navigator:browser");
  while (enumerator.hasMoreElements()) {
     win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow).top;
    loadIntoWindow(win);
  }

  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  var wm, enumerator, win;
  if (aReason === APP_SHUTDOWN) {return;}

  wm = Cc["@mozilla.org/appshell/window-mediator;1"]
    .getService(Ci.nsIWindowMediator);

  wm.removeListener(windowListener);

  enumerator = wm.getEnumerator("navigator:browser");
  while (enumerator.hasMoreElements()) {
    win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
    win.dump('dimmer: unloading from window' + '\n');
    unloadFromWindow(win);
  }
  Components.utils.unload(modulePath + 'prefObserver.js');
  Components.utils.unload(modulePath + 'makeDimmer.js');
  Components.utils.unload(modulePath + 'dimmerMenu.js');
}

function install(aData, aReason) { }

function uninstall(aData, aReason) {
  shutdown(aData, aReason);
}
