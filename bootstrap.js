/*global Components, APP_SHUTDOWN, makeDimmer, makeObserver,
  makeDimmerMenu, unloadMenuImports */
"use strict";
var Cc = Components.classes;
var Ci = Components.interfaces;

var modulePath = 'chrome://dimmer/content/modules/';

function loadIntoWindow(window) {
  var i, tabs;
  if (!window.document.getElementById("tabbrowser-tabs")) { return; }
  window.dimmerAddon = {};
  window.dimmerAddon.dimmerPrefObserver = makeObserver(window);
  window.dimmerAddon.dimmerListener = makeDimmer(window);
  window.gBrowser.addEventListener("DOMContentLoaded", 
    window.dimmerAddon.dimmerListener, true);
  window.dimmerAddon.prefBranch.addObserver('', 
      window.dimmerAddon.dimmerPrefObserver, false);
  window.dimmerAddon.menu = makeDimmerMenu(window);
  window.dimmerAddon.menu.readConfig(null, function() {
    for (i = 0,
         tabs = window.gBrowser.browsers.length;
         i < tabs; i += 1) {
      window.dimmerAddon.dimmerListener(null,
             window.gBrowser.getBrowserAtIndex(i).contentDocument);
      window.dump('dimmer: loaded listener\n');
    }
  });
}

function unloadFromWindow(window) {
  var tabs, i, overlay;
  if (!window) {
    return;
  }
  try{
  window.dump('dimmer: unloading\n');
  window.dimmerAddon.dimmerPrefObserver.unregister(window);
  window.gBrowser.removeEventListener("DOMContentLoaded",
       window.dimmerAddon.dimmerListener, true);
  window.dimmerAddon.menu.unloadFromWindow(window);
  for (i = 0,
       tabs = window.gBrowser.browsers.length;
       i < tabs; i += 1) {
    overlay = window.gBrowser.getBrowserAtIndex(i).contentDocument
      .getElementById("dimmerFFAddOn");
    if (overlay) {overlay.parentNode.removeChild(overlay);}
    window.dump('dimmer: unloaded listener\n');
  }
  delete window.dimmerAddon;
  window.dump('dimmer: unloaded\n');
  }catch(e){window.dump(e);}
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
   Components.utils.import(modulePath + 'make-dimmer.js');
   Components.utils.import(modulePath + 'pref-observer.js');
   Components.utils.import(modulePath + 'dimmer-menu.js');
   
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
  try {
    Components.utils.unload(modulePath + 'pref-observer.js');
    Components.utils.unload(modulePath + 'make-dimmer.js');
//    unloadMenuImports();  this is not required - causes harm
    Components.utils.unload(modulePath + 'dimmer-menu.js');
  } catch(err) {
    win.dump('dimmer: unloading error - ' + err);
    return;
  }
}

function install(aData, aReason) { }

function uninstall(aData, aReason) {
  shutdown(aData, aReason);
}
