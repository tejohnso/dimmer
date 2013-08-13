/*global Components, NetUtil, FileUtils, PrivateBrowsingUtils */
"use strict";
var EXPORTED_SYMBOLS = ['makeDimmerMenu','unloadMenuImports']
   ,Cu = Components.utils
   ,Cc = Components.classes;

Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

try {
  Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
} catch(e) { //doesn't exist pre FF20
  Cc["@mozilla.org/consoleservice;1"].getService(Components
    .interfaces.nsIConsoleService).logStringMessage('dimmer: ' + e);
}

function makeDimmerMenu(window) {
  if (!window.document.getElementById("contentAreaContextMenu")) { return; }
  var ret = {};
  ret.parentElement = window.document.getElementById("contentAreaContextMenu");

  ret.configFile = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("ProfD", Components.interfaces.nsIFile);
  ret.configFile.append("dimmerAddonDomains.txt");

  ret.isPrivateBrowsing = function() {
    try {
      return PrivateBrowsingUtils.isWindowPrivate(window);
    } catch(e) {
      // pre Firefox 20 (if you do not have access to a doc. 
      // might use doc.hasAttribute("privatebrowsingmode") then instead)
      try {
        return Components
          .classes["@mozilla.org/privatebrowsing;1"]
          .getService(Components.interfaces.nsIPrivateBrowsingService)
          .privateBrowsingEnabled;
      } catch(err) {
        Components.utils.reportError(err);
        return;
      }
    }
  };

  ret.writeToFile = function(data, cb) {
    var ostream, converter, istream;
    if (ret.isPrivateBrowsing()) { return; }
    ostream = FileUtils.openSafeFileOutputStream(ret.configFile);
    converter = Components
               .classes["@mozilla.org/intl/scriptableunicodeconverter"]
               .createInstance(Components
               .interfaces.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    istream = converter.convertToInputStream(data);
    NetUtil.asyncCopy(istream, ostream, cb);
  };

  ret.readConfig = function(event, cb) {
     window.dump('dimmer: reading config\n');
     NetUtil.asyncFetch(ret.configFile, function(inputStream, status) {
        if (!Components.isSuccessCode(status)) {
           window.dump('dimmer: file read error\n');
           ret.writeToFile('{"nodim":[], "dim":[]}');
           ret.config = {"nodim":[], "dim":[]};
           window.dump('dimmer: config initialized\n');
           if (cb) {cb();}
           return;
        }
        ret.config = JSON.parse(NetUtil
               .readInputStreamToString(inputStream, inputStream.available()));
        ret.config.dim = (ret.config.dim || []);
        ret.config.nodim = (ret.config.nodim || []);
        if (cb) {cb();}
        window.dump('dimmer: config loaded\n');
     });
  };

  ret.toggleDim = function () {
     var host, i, tabs;
     try{
        host = window.gBrowser.currentURI.host;
        if (window.gBrowser.contentDocument.getElementById('dimmerFFAddOn')) {
           ret.config.nodim.push(host);
           if (ret.config.dim.indexOf(host) !== -1) {
             ret.config.dim.splice(ret.config.dim.indexOf(host), 1);
           }
        } else {
           ret.config.nodim.splice(ret.config.nodim.indexOf(host), 1);
           if (ret.config.dim.indexOf(host) === -1) {
             ret.config.dim.push(host);
           }
        }
        ret.writeToFile(JSON.stringify(ret.config), function() {
          for (i = 0,
               tabs = window.gBrowser.browsers.length;
               i < tabs; i += 1) {
            window.dimmerAddon.dimmerListener(null,
              window.gBrowser.getBrowserAtIndex(i).contentDocument);
          }
        });
     } catch(e){}
  };

  ret.unloadFromWindow = function (window) {
     this.parentElement.removeChild(this.dimmerMenuSeparator);
     this.dimmerMenuToggleDim
        .removeEventListener("command", ret.toggleDim, true);
     this.parentElement.removeChild(this.dimmerMenu);
     window.removeEventListener("contextmenu", ret.setLabel);
     window.removeEventListener("activate", ret.readConfig);
  };

  
  ret.setLabel = function(){
    var host = window.gBrowser.contentDocument.location.host
       ,menuItem = window.dimmerAddon.menu.dimmerMenuToggleDim;

     if (host === '') {
       menuItem.setAttribute("disabled", true);
       menuItem.setAttribute("label", "Toggle dimming");
     }
     else {
       menuItem.setAttribute("disabled", false);
       menuItem.setAttribute("label", "Toggle dimming for " + host);
     }
  };

  ret.dimmerMenu = window.document.createElement("menu");
  ret.dimmerMenu.setAttribute("label", "Dimmer:");
  ret.dimmerMenu.setAttribute("accesskey", "D");
  ret.dimmerMenu.id = "context-dimmer-main";
  window.addEventListener("contextmenu", ret.setLabel);
  window.addEventListener("activate", ret.readConfig);

  ret.dimmerMenuToggleDim = window.document.createElement("menuitem");
  ret.dimmerMenuToggleDim.id = "context-dimmer-nodim";
  ret.dimmerMenuToggleDim
     .setAttribute("label", "Toggle dimming for this domain");
  ret.dimmerMenuToggleDim.setAttribute("accesskey", "T");
  ret.dimmerMenuToggleDim.addEventListener("command", ret.toggleDim, true);

  ret.dimmerMenuPopup = window.document.createElement("menupopup");
  ret.dimmerMenuPopup.id = "context-dimmer-popup";
  ret.dimmerMenuPopup.appendChild(ret.dimmerMenuToggleDim);
  ret.dimmerMenu.appendChild(ret.dimmerMenuPopup);

  ret.dimmerMenuSeparator = window.document.createElement("menuseparator");
  ret.dimmerMenuSeparator.id = "context-dimmer";
  ret.parentElement.appendChild(ret.dimmerMenuSeparator);
  ret.parentElement.appendChild(ret.dimmerMenu);

  return ret;
}

function unloadMenuImports() {
  Cu.unload("resource://gre/modules/NetUtil.jsm");
  Components.utils.unload("resource://gre/modules/FileUtils.jsm");
  Components.utils.unload("resource://gre/modules/PrivateBrowsingUtils.jsm");
}
