/*global Components*/
"use strict";
var EXPORTED_SYMBOLS = ['prefBranch',
                        'defBranch',
                        'makeObserver'];

var prefBranch = Components
                 .classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService)
                 .getBranch("extensions.dimmer.");
var defBranch = Components.
                classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getDefaultBranch("extensions.dimmer.");

defBranch.setIntPref('opacity', 4);
function makeObserver(window, makeDimmer) {
   var prefObserver = {
      observe: function(aSubject, aTopic, aData) {
                  var opacity, dimmerListener;
                  switch (aData) {
                     case "opacity":
                        opacity = prefBranch.getIntPref('opacity');
                        if (opacity < 0 || opacity > 10) {
                           opacity = 0;
                           prefBranch.setIntPref('opacity', 0);
                        }
                        window.gBrowser
                        .removeEventListener("DOMContentLoaded",
                        window.dimmerListener, true);
                        window.dimmerListener = makeDimmer(opacity);
                        window.gBrowser
                        .addEventListener("DOMContentLoaded",
                        window.dimmerListener, true);
                        window.dump('dimmer: opacity ' + opacity + '\n');
                     break;
                  }
               },
      unregister: function() {
                     prefBranch.removeObserver("", prefObserver);
                  }
   };
   return prefObserver;
}
