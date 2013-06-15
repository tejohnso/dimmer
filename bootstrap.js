/*global Components, APP_SHUTDOWN */
"use strict";
var Cc = Components.classes;
var Ci = Components.interfaces;
var prefObserver;

var loadIntoWindow = function(window) {
  var anchor, doc, opacity, prefBranch, defBranch, makeDimmer, 
      loadListener;
  anchor = window.document.getElementById("tabbrowser-tabs");
  if (!anchor) {
    window.dump('dimmer: window ' + window.id +
                ' ' + window.title + ' has no browser tabs to anchor to' + '\n');
    return;
  }
  window.dump('dimmer: loading\n');
  prefBranch = Components.classes["@mozilla.org/preferences-service;1"]
                   .getService(Components.interfaces.nsIPrefService)
                   .getBranch("extensions.dimmer.");
  defBranch = Components.classes["@mozilla.org/preferences-service;1"]
                   .getService(Components.interfaces.nsIPrefService)
                   .getDefaultBranch("extensions.dimmer.");
  defBranch.setIntPref('opacity', 4);
  opacity = prefBranch.getIntPref('opacity');
  
  makeDimmer = function(opacity){
      return function(event) {
      var doc = event.originalTarget;
      if (doc.toString().indexOf('HTMLDocument') !== -1) { 
         if (doc.defaultView.frameElement){
            doc = doc.defaultView.top.document;
            window.dump(doc.defaultView.location + '\n');return;
         }
         (function() {
            if (doc.getElementById("dimmerFFAddOn")) {
               doc.getElementById("dimmerFFAddOn").style.opacity = opacity / 10;
               return;
            }
            var newDiv = doc.createElement('div');
            newDiv.id="dimmerFFAddOn";
            newDiv.style.width = '100%';
            newDiv.style.height = '100%';
            newDiv.style.position = 'fixed';
            newDiv.style.top = 0;
            newDiv.style.left = 0;
            newDiv.style.zIndex = 10000;
            newDiv.style.backgroundColor = 'black';
            newDiv.style.opacity = opacity/10;
            newDiv.style.pointerEvents = 'none';
            doc.body.appendChild(newDiv);
         }());
      }
     };
  };

  loadListener = makeDimmer(opacity);
  window.gBrowser.addEventListener("DOMContentLoaded", loadListener, true);

  prefObserver = {
     observe: function(aSubject, aTopic, aData) {
        switch (aData) {
           case "opacity":
              opacity = prefBranch.getIntPref('opacity');
              if (opacity < 0 || opacity > 10) {
                 opacity = 4;
                 prefBranch.setIntPref('opacity', 4);
              }
              window.gBrowser.removeEventListener("load", loadListener, true);
              loadListener = makeDimmer(opacity);
              window.gBrowser.addEventListener("load", loadListener, true);

           break;
        }
     },
     unregister: function() {
        prefBranch.removeObserver("", prefObserver);
     }
  };

  prefBranch.addObserver("", prefObserver, false);
};

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
