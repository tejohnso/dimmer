/*global Components*/
"use strict";
var EXPORTED_SYMBOLS = ['makeObserver'];

function makeObserver(window) {
  window.dimmerAddon.prefBranch = Components
                 .classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService)
                 .getBranch("extensions.dimmer.");
  window.dimmerAddon.defBranch = Components.
                classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getDefaultBranch("extensions.dimmer.");

  window.dimmerAddon.defBranch.setIntPref('opacity', 4);
  window.dimmerAddon.opacity = window.dimmerAddon.prefBranch
                                     .getIntPref('opacity');
  window.dimmerAddon.defBranch.setBoolPref('defaultBehaviour', true);
  window.dimmerAddon.defaultBehaviour = window.dimmerAddon.prefBranch
                                              .getBoolPref('defaultBehaviour');
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
                     window.dimmerAddon.opacity = opacity;
                     window.dump('dimmer: opacity ' + opacity + '\n');
                     for (i = 0,
                         tabs = window.gBrowser.browsers.length;
                         i < tabs; i += 1) {
                       window.dimmerAddon.dimmerListener(null,
                           window.gBrowser.getBrowserAtIndex(i).contentDocument);
                     }
                     break;
                  case "defaultBehaviour":
                    window.dimmerAddon.defaultBehaviour = window.dimmerAddon
                          .prefBranch.getBoolPref('defaultBehaviour');
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
