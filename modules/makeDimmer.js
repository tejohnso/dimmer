/*global Components */
"use strict";
var EXPORTED_SYMBOLS = ['makeDimmer'];

function makeDimmer(opacity, window){
   return function(event) {
      var doc, newDiv, win, doNotDim;
      doc = event.originalTarget;
      win = window;
      if (!doc.body || doc.toString().indexOf('HTMLDocument') === -1) {
         return;
      }
      if (win.frameElement){
         win = win.top;
         doc = win.document;
      }
      if (win.dimmerAddon) {
         doNotDim = (win.dimmerAddon
                    .menu.config.nodim.indexOf(doc.location.host) > -1);
      }else{
         doNotDim = false;
      }

      if (doc.getElementById("dimmerFFAddOn")) {
         doc.getElementById("dimmerFFAddOn").style
         .opacity = opacity / 10;
         if (doNotDim) {
            doc.removeElement(doc.getElementById("dimmerFFAddOn"));
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
