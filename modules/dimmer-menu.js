/*global Components, NetUtil, FileUtils, PrivateBrowsingUtils */
"use strict";
var EXPORTED_SYMBOLS = ['makeDimmerMenu','unloadMenuImports'];
  Components.utils.import("resource://gre/modules/NetUtil.jsm");
  Components.utils.import("resource://gre/modules/FileUtils.jsm");
  Components.utils
        .import("resource://gre/modules/PrivateBrowsingUtils.jsm");

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

  ret.readConfig = function() {
     window.dump('dimmer: reading config\n');
     NetUtil.asyncFetch(ret.configFile, function(inputStream, status) {
        if (!Components.isSuccessCode(status)) {
           window.dump('dimmer: file read error\n');
           ret.writeToFile('{"nodim":[]}');
           return;
        }
        ret.config = JSON.parse(NetUtil
               .readInputStreamToString(inputStream, inputStream.available()));
     });
  };

  ret.toggleDim = function () {
     var host = "";
     try{
        host = window.gBrowser.currentURI.host;
        if (ret.config.nodim.indexOf(host) === -1) {
           ret.config.nodim.push(host);
        } else {
           ret.config.nodim.splice(ret.config.nodim.indexOf(host), 1);
        }
        ret.writeToFile(JSON.stringify(ret.config), function() {
          window.dimmerAddon.dimmerListener();
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
     var host = window.gBrowser.contentDocument.location.host; 
     if (host === '') {
        window.dimmerAddon.menu.dimmerMenuToggleDim.setAttribute("disabled", true);
        window.dimmerAddon.menu.dimmerMenuToggleDim.setAttribute("label", "Toggle dimming");
     }
     else {
        window.dimmerAddon.menu.dimmerMenuToggleDim.setAttribute("disabled", false);
        window.dimmerAddon.menu.dimmerMenuToggleDim.setAttribute("label", "Toggle dimming for " + window.gBrowser.contentDocument.location.host);
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
  Components.utils.unload("resource://gre/modules/NetUtil.jsm");
  Components.utils.unload("resource://gre/modules/FileUtils.jsm");
  Components.utils
        .unload("resource://gre/modules/PrivateBrowsingUtils.jsm");
}

/*  ret.openEditor = function () {
     var editorTab;
     editorTab = window.gBrowser.getBrowserForTab(window.gBrowser.addTab('file:///home/tyler/.mozilla/firefox/m31kthv4.default/dimmerAddon.config'));
     editorTab.addEventListener("load", function () {
          editorTab.contentDocument.designMode = 'on';
     }, true);
  };*/
