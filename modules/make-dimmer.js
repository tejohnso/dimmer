/*global Components */
"use strict";
var EXPORTED_SYMBOLS = ['makeDimmer'];

function makeDimmer(opacity, window){
   return function(event, doc) {
      var newDiv, win, doNotDim, overlay;
      win = window;
      if (!doc) {doc = win.gBrowser.contentDocument;}
      if (win.frameElement){
         win = win.top;
         if (!doc) {doc = win.gBrowser.contentDocument;}
      }
      if (!doc.body || doc.toString().indexOf('HTMLDocument') === -1) {
         return;
      }
      if (win.dimmerAddon && doc.location.protocol) {
         doNotDim = (win.dimmerAddon
                    .menu.config.nodim.indexOf(doc.location.host) > -1);
         if (doc.location.protocol.substr(0,7) === 'chrome:') {
           doNotDim = true;
         }
      }else{
         doNotDim = false;
      }
      overlay = doc.getElementById("dimmerFFAddOn");
      if (overlay) {
        if (doNotDim) {
          overlay.parentNode.removeChild(overlay);
        } else {
          overlay.style.opacity = opacity / 10;
        }
      } else if (!doNotDim){
         newDiv = doc.createElement('div');
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
         if (!doc.body) {return;}
         doc.body.appendChild(newDiv);
      }
   };
}
