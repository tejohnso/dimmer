/*global Components*/
"use strict";
var EXPORTED_SYMBOLS = ['makeObserver'];

function makeObserver(window, makeDimmer) {
  window.dimmerAddon.prefBranch = Components
                 .classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService)
                 .getBranch("extensions.dimmer.");
  window.dimmerAddon.defBranch = Components.
                classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getDefaultBranch("extensions.dimmer.");

  window.dimmerAddon.defBranch.setIntPref('opacity', 4);
   var prefObserver = {
      observe: function(aSubject, aTopic, aData) {
                  var opacity, dimmerListener, i, tabs;
                  switch (aData) {
                  case "opacity":
                     opacity = window.dimmerAddon.prefBranch
                       .getIntPref('opacity');
                     if (opacity < 0 || opacity > 10) {
                        opacity = 0;
                        window.dimmerAddon.prefBranch.setIntPref('opacity', 0);
                     }
                     window.gBrowser
                     .removeEventListener("DOMContentLoaded",
                     window.dimmerAddon.dimmerListener, true);
                     window.dimmerAddon.dimmerListener = 
                       makeDimmer(opacity, window);
                     window.gBrowser
                       .addEventListener("DOMContentLoaded",
                       window.dimmerAddon.dimmerListener, true);
                     window.dump('dimmer: opacity ' + opacity + '\n');
                     for (i = 0,
                         tabs = window.gBrowser.browsers.length;
                         i < tabs; i += 1) {
                       window.dimmerAddon.dimmerListener(null,
                           window.gBrowser.getBrowserAtIndex(i).contentDocument);
                     }
                     break;
                  }
               },
      unregister: function(window) {
                    window.dimmerAddon.prefBranch.removeObserver("",
                      window.dimmerAddon.dimmerPrefObserver);
                    delete window.dimmerAddon.dimmerPrefObserver;
                  }
   };
   return prefObserver;
}
