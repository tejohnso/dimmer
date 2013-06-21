"use strict";
var EXPORTED_SYMBOLS = ['makeDimmerMenuNoDim'];

function makeDimmerMenuNoDim(window) {
  if (!window.document.getElementById("contentAreaContextMenu")) { return; }
  var ret = {};
  ret.parentElement = window.document.getElementById("contentAreaContextMenu");
  ret.setNoDim = function () {window.dump('Don\'t dim this page!\n');};
  ret.dimmerMenuItem = window.document.createElement("menuitem");
  ret.dimmerMenuItem.id = "context-dimmer-nodim";
  ret.dimmerMenuItem.setAttribute("label","Dimmer: Never dim this page");
  ret.dimmerMenuItem.setAttribute("accesskey", "N");
  ret.dimmerMenuItem.addEventListener("command", ret.setNoDim, true);
  ret.dimmerMenuSeparator = window.document.createElement("menuseparator");
  ret.dimmerMenuSeparator.id = "context-dimmer";
  ret.parentElement.appendChild(ret.dimmerMenuSeparator);
  ret.parentElement.appendChild(ret.dimmerMenuItem);

  ret.unload = function () {
     this.parentElement.removeChild(this.dimmerMenuSeparator);
     this.dimmerMenuItem.removeEventListener("command", this.setNoDim, true);
     this.parentElement.removeChild(this.dimmerMenuItem);
  };

  return ret;
}
