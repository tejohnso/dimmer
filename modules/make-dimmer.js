/*global Components */
"use strict";
var EXPORTED_SYMBOLS = ['makeDimmer'];

function makeDimmer(window){
   return function(event, doc) {
      var newDiv, win, allowDim, overlay, opacity;
      win = window;
      if (!doc) {doc = win.gBrowser.contentDocument;}
      if (win.frameElement){
         win = win.top;
         if (!doc) {doc = win.gBrowser.contentDocument;}
      }
      if (!doc.body || doc.toString().indexOf('HTMLDocument') === -1) {
         return;
      }
      allowDim = win.dimmerAddon.defaultBehaviour;
      opacity = win.dimmerAddon.opacity;
      if (win.dimmerAddon && doc.location.protocol) {
         if (doc.location.protocol.substr(0,7) === 'chrome:') {
           allowDim = false;
         } else if (allowDim) {
           allowDim = (win.dimmerAddon
                          .menu.config.nodim.indexOf(doc.location.host) === -1);
         } else {
           allowDim = (win.dimmerAddon
                          .menu.config.dim.indexOf(doc.location.host) !== -1);
         }
      }
      overlay = doc.getElementById("dimmerFFAddOn");
      if (overlay) {
        if (allowDim) {
          overlay.style.opacity = opacity / 10;
        } else {
          overlay.parentNode.removeChild(overlay);
        }
      } else if (allowDim){
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
