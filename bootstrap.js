/*global Components, APP_SHUTDOWN, makeDimmer, makeObserver, prefBranch */
"use strict";
var Cc = Components.classes;
var Ci = Components.interfaces;
var prefObserver;

var modulePath = 'chrome://dimmer/content/modules/';

function loadIntoWindow(window) {
  var anchor, dimmerListener;
  loadIntoWindow.window = window;
  anchor = window.document.getElementById("tabbrowser-tabs");
  if (!anchor) { return; }
  Components.utils.import(modulePath + 'makeDimmer.js');
  Components.utils.import(modulePath + 'prefObserver.js');
  dimmerListener = makeDimmer(prefBranch.getIntPref('opacity'), window);

  window.dump('dimmer: loading listener\n');
  window.gBrowser.addEventListener("DOMContentLoaded", dimmerListener, true);
  prefBranch.addObserver('', makeObserver(window, makeDimmer), false);
  window.dump('dimmer: loaded listener\n');
}

function unloadFromWindow(window) {
  if (!window) {
    window.dump('no window?!' + '\n');
    return;
  }
  prefObserver.unregister();
}

/*
 bootstrap.js API
*/

var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
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
   wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Load into any existing windows
  enumerator = wm.getEnumerator("navigator:browser");
  while (enumerator.hasMoreElements()) {
     win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow).top;
    loadIntoWindow(win);
  }

  // Load into any new windows
  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean up any UI changes
  var wm, enumerator, win;
  if (aReason === APP_SHUTDOWN) {return;}
  wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop watching for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  enumerator = wm.getEnumerator("navigator:browser");
  while (enumerator.hasMoreElements()) {
    win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
    win.dump('unloading from window' + '\n');
    unloadFromWindow(win);
  }
}

function install(aData, aReason) { }

function uninstall(aData, aReason) {
  shutdown(aData, aReason);
}
