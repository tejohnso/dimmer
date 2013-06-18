/*global Components */
"use strict";
var EXPORTED_SYMBOLS = ['makeDimmer'];

function makeDimmer(opacity, window){
   return function(event) {
      var doc, newDiv;
      doc = event.originalTarget;
      if (!doc.body || doc.toString().indexOf('HTMLDocument') === -1) {
         return;
      }
      if (doc.defaultView.frameElement){
         doc = doc.defaultView.top.document;
      }
      if (doc.getElementById("dimmerFFAddOn")) {
         doc.getElementById("dimmerFFAddOn").style
         .opacity = opacity / 10;
      } else {
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
