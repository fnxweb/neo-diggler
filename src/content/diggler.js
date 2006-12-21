/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Diggler.
 *
 * The Initial Developer of the Original Code is Adam Lock.
 * Portions created by the Initial Developer are Copyright (C) 2002
 * the Initial Developer. All Rights Reserved.
 * Neo Firefox port Copyright (C) 2006 Neil Bird.
 *
 * Contributor(s):
 *
 *   Adam Lock <adamlock@netscape.com>
 *   Firefox 2 New Diggler:  Neil Bird <mozilla@fnxweb.com>
 *   Chris Neale <orbit@cdn.gs>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */



// This is our pref observer which makes sure that various prefs are read and
// kept up to date. It saves having to lookup this stuff each time when it
// rarely changes.

var prefObserver =
{
  addPrefListener: function ()
  {
    try {
      if (this.pref == null) {
        var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                    .getService(Components.interfaces.nsIPrefService);
        this.pref = prefService.getBranch(null);
      }
      var pbi = this.pref.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
      pbi.addObserver(kPREF_DIGGLER, this, false);
      pbi.addObserver(kPREF_DOM_POPUP, this, false);
      pbi.addObserver(kPREF_IMAGE_BEHAVIOUR, this, false);
      pbi.addObserver(kPREF_DIGGLER_TOOLS, this, false);
    } catch(ex) {
      dump("Diggler failed to observe prefs: " + ex + "\n");
    }
    this.syncPrefs();
  },

  readTools: function()
  {
    try {
      this.showToolsAsSubmenu =
        this.pref.prefHasUserValue(kPREF_DIGGLER_TOOLS_SUBMENU) &&
        this.pref.getBoolPref(kPREF_DIGGLER_TOOLS_SUBMENU);
      this.tools = digglerReadTools(this.pref);
    } catch (ex) {
      alert("Diggler failed to syncPrefs: " + ex + "\n");
    }
  },

  syncPrefs: function()
  {
    // Fill in prefs with their default values first
    this.showPopupMenuItems = true;
    this.showTabMenuItems = true;
    this.showImageMenuItems = true;
    this.showTools = false;
    this.imageBehaviour = 1;
    this.showPopups = true;

    try {
      // Diggler prefs
      this.showPopupMenuItems =
        this.pref.prefHasUserValue(kPREF_DIGGLER_POPUP_CONTROLS) &&
        this.pref.getBoolPref(kPREF_DIGGLER_POPUP_CONTROLS);
      this.showTabMenuItems   =
        this.pref.prefHasUserValue(kPREF_DIGGLER_TAB_CONTROLS) &&
        this.pref.getBoolPref(kPREF_DIGGLER_TAB_CONTROLS);
      this.showImageMenuItems =
        this.pref.prefHasUserValue(kPREF_DIGGLER_IMAGE_CONTROLS) &&
        this.pref.getBoolPref(kPREF_DIGGLER_IMAGE_CONTROLS);

      this.readTools();

      // Other prefs
      this.imageBehaviour = this.pref.getIntPref(kPREF_IMAGE_BEHAVIOUR);
      this.showPopups = this.pref.getBoolPref(kPREF_DOM_POPUP);
      // TODO tools menu
    } catch (ex) {
      dump("Diggler failed to syncPrefs: " + ex + "\n");
    }
  },

  // nsIObserver
  observe: function(subject, topic, state)
  {
    if (topic != "nsPref:changed")
      return;
    this.syncPrefs();
  }
};

// Add a listener such that commonly read prefs can be cached
prefObserver.addPrefListener();

function digglerSubstituteURI(originalURI, pattern)
{
    // $S - the whole URL
    // $c - the scheme (e.g. http)
    // $h - the host (e.g. www.mozilla.org)
    // $t - the port number (e.g. 80)
    // $u - the username / password (e.g. fred:bloggs)
    // $p - the path (e.g. /my/path/index.html)
    // $1, $2 etc. - parts of the regular expression to be subsituted.
    return pattern
        .replace(/\$S/, originalURI.spec)
        .replace(/\$c/, originalURI.scheme)
        .replace(/\$h/, originalURI.host)
        .replace(/\$t/, originalURI.port)
        .replace(/\$u/, originalURI.userPass)
        .replace(/\$p/, originalURI.path);
}

function digglerDoMenu(aEvent)
{
  var id = aEvent.target.getAttribute("id");
  if (id == "diggler-clear") {
    digglerClearLocation();
  }
  else if (id == "diggler-imageon")
  {
    digglerSetImageMode(1);
  }
  else if (id == "diggler-imageonlocal")
  {
    digglerSetImageMode(3);
  }
  else if (id == "diggler-imageoff")
  {
    digglerSetImageMode(2);
  }
  else if (id == "diggler-popupkiller") {
    var killPopups =  !digglerGetKillPopups();
    dump("toggle killpopups to " + killPopups + "\n");
    digglerSetKillPopups(killPopups);
  }
  else if (id == "diggler-newtab")
  {
    BrowserOpenTab();
  }
  else {
    digglerSetUrl(aEvent);
  }
}

function digglerSetKillPopups(killPopups)
{
    prefObserver.pref.setBoolPref(kPREF_DOM_POPUP, killPopups);
}

function digglerGetKillPopups()
{
    return prefObserver.showPopups;
}

function digglerSetUrl(aEvent)
{
  var uriToLoad = aEvent.target.getAttribute("url");
  urlBar = document.getElementById("urlbar");
  urlBar.value = uriToLoad;
  loadURI(uriToLoad);
}

var gURIFixup = null;

function digglerFixupUrl(url)
{
  var fixedUpURI = digglerFixupURI(url);
  if (fixedUpURI)
    return fixedUpURI.spec;
  return url;
}

function digglerFixupURI(url)
{
  try {
    if (!gURIFixup)
       gURIFixup = Components.classes["@mozilla.org/docshell/urifixup;1"]
             .getService(Components.interfaces.nsIURIFixup);

    var fixedUpURI = gURIFixup.createFixupURI(url,
        Components.interfaces.nsIURIFixup.FIXUP_FLAGS_MAKE_ALTERNATE_URI);
    return fixedUpURI;
  }
  catch (ex) {
    dump("Fixup failed - " + ex);
    return null;
  }
}

function digglerBuildMenu()
{
  urlBar = document.getElementById("urlbar");
  var url = digglerFixupUrl(urlBar.value);
  var siteUrl;

  // Enable/disable the popup killer
  var showPopupMenuItems = prefObserver.showPopupMenuItems;
  var popupKiller = document.getElementById("diggler-popupkiller");
  popupKiller.setAttribute("checked", !digglerGetKillPopups());
  document.getElementById("diggler-popupsep").setAttribute("visible", showPopupMenuItems);
  popupKiller.setAttribute("visible", showPopupMenuItems);

  // Enable/disable view images radio buttons
  var showImageMenuItems = prefObserver.showImageMenuItems;
  if (showImageMenuItems) {
    var imageMode = digglerGetImageMode();
    var imageEl;
    if (imageMode == 1)
      imageEl = document.getElementById("diggler-imageon");
    else if (imageMode == 3)
      imageEl = document.getElementById("diggler-imageonlocal");
    else if (imageMode == 2)
      imageEl = document.getElementById("diggler-imageoff");
    if (imageEl)
      imageEl.setAttribute("checked", "true");
  }
  // This code stinks, there must be a better way
  document.getElementById("diggler-imagesep").setAttribute("visible", showImageMenuItems);
  document.getElementById("diggler-imageon").setAttribute("visible", showImageMenuItems);
  document.getElementById("diggler-imageonlocal").setAttribute("visible", showImageMenuItems);
  document.getElementById("diggler-imageoff").setAttribute("visible", showImageMenuItems);

  // Hide/show new tab menu item
  var showTabMenuItems = prefObserver.showTabMenuItems;
  var newTab = document.getElementById("diggler-newtab");
  if (newTab) {
    var hideNewTab = false;
    // count number of tabs in window
    // if (tabs == 1) check "browser.tabs.autoHide"
    //
  }
  document.getElementById("diggler-tabsep").setAttribute("visible", showTabMenuItems);
  document.getElementById("diggler-newtab").setAttribute("visible", showTabMenuItems);

  var urlMenu      = document.getElementById("diggler-url-menu");
  var toolsSubMenu = document.getElementById("diggler-tools-menu");

  // Clear all of the previous tools
  digglerClearTempMenuItems(urlMenu);

  // Build the user specified tools menu

  try {
    var showToolsAsSubmenu = prefObserver.showTools;
    var tools = prefObserver.tools;
    // TODO there is no point showing a tools submenu if the user hasn't got any!
    // if (tools.length == 0 || allToolsAreHidden)
    showToolsAsSubmenu = false;
    if (toolsSubMenu)
      toolsSubMenu.setAttribute("visible", showToolsAsSubmenu);
    var toolsMenu = urlMenu; // showToolsAsSubmenu ? urlMenu : toolsSubMenu;
    digglerBuildToolsMenu(toolsMenu, url, tools);
  }
  catch (ex)
  {
    alert("Exception " + ex);
  }
  digglerBuildUrlMenu(urlMenu, url);
}

function digglerBuildToolsMenu(toolsMenu, siteUrl, tools)
{
  var uri = digglerFixupURI(siteUrl);

  // Read the array of tools and turn them into menu items
  var menuList = new Array();
  for (i = 0; i < tools.length; ++i)
  {
     var toolparts = tools[i];
     var isVisible        = unescape(toolparts[0]);
     var label            = unescape(toolparts[1]);
     var useActionAsLabel = unescape(toolparts[2]);
     var pattern          = unescape(toolparts[3]);
     var action           = unescape(toolparts[4]);

     var option = new Array(
        useActionAsLabel == "1" ? "----USE_ACTION----" : label,
        pattern,
        action,
        "i",
        false); // this param controls recursion, but is dangerous to set to true

     menuList = menuList.concat(matchUrl(siteUrl, option, uri));
  }

  menuList = cleanExtraSeparators(menuList);

  if (menuList.length > 0) {
    digglerCreateTempMenuSeparator(toolsMenu);
    for (i = 0; i < menuList.length; ++i) {
      if (menuList[i][0] == "----USE_ACTION----") {
        digglerCreateTempMenuItem(toolsMenu, menuList[i][1]);
      }
      else {
        digglerCreateTempMenuItemName(toolsMenu, menuList[i][0], menuList[i][1]);
      }
    }
  }
}

var digglerOptions = [
// [],
//  [],
  ["identity", "^(.*)$", "$1", "", false],
  ["no fragment", "([a-z]+:///?)([^/]+)(/[^#]+)#.*", "$1$2$3", "i", true],
  ["shorter path", "^([a-z]+:///?)([^/]+)((/[^/]+)+)(/[^/]+/?)$", "$1$2$3/", "i", true],
  ["shorter path - no path", "^([a-z]+:///?)([^/]+)(/.+)$", "$1$2/", "i", false],
  ["no query", "([a-z]+:///?)([^/]+)(/[^?]+)\\?.*", "$1$2$3", "i", true],
  [],
//  [],
//  [],
//  ["shorter domain", "https?://([^.]+)\\.(([^.:/]+\\.)+[^.:/]+)(.*)", "http://$2/", "i", true],
  ["http to ftp", "https?://(?!www)([^/:]+).*", "ftp://$1/", "i", false],
  ["http to ftp - www2ftp", "https?://www.([^/:]+).*", "ftp://ftp.$1/", "i", false],
  ["ftp to http", "ftp://(?!ftp)([^/:]+).*", "http://$1/", "i", false],
  ["ftp to http - ftp2www", "ftp://ftp.([^/:]+).*", "http://www.$1/", "i", false],
  ["port 80", "^(http://[^:]+):(?!80/)[0-9]+.*$", "$1/", "i", false],
  ["port 443", "^(https://[^:]+):(?!443/)[0-9]+.*$", "$1/", "i", false],
  [],
  ["sourceforge summary to home", "^https?://sourceforge\\.net/projects/([^/]+).*$", "http://$1.sourceforge.net/", "i",false],
  ["sourceforge home to summary", "(https?)://([a-z0-9\\-]+)\\.sourceforge\\.net/?.*", "$1://sourceforge.net/projects/$2/", "i", false],
  [],
  ["Archive.org", "^(https?://(?!web\\.archive\\.org).*)$", "http://web.archive.org/web/*/$1", "i", false],
  ["Google", "^http://(.*)$", "http://google.com/search?q=cache:$1", "i", false],
//  [],
//  []
];

function digglerBuildUrlMenu (urlMenu, siteUrl)
{
  if (siteUrl.length == 0)
    return;

  var menuList = new Array();
  for (i = 0; i < digglerOptions.length; i++)
  {
    var option = digglerOptions[i];
    if (option.length == 0)
    {
      menuList.push(new Array ());
      continue;
    }

    menuList = menuList.concat(matchUrl (siteUrl, option, null));
  }
  menuList = cleanExtraSeparators(menuList);

  if (menuList.length > 0)
  {
    digglerCreateTempMenuSeparator(urlMenu);

    for (i = 0; i < menuList.length; i++)
    {
      if (menuList[i].length == 0)
      {
        digglerCreateTempMenuSeparator(urlMenu);
      }
      else if (menuList[i][0] == "Google")
      {
        digglerCreateTempMenuItemName(urlMenu, digglerSearchGoogleLabel, menuList[i][1]);
      }
      else if (menuList[i][0] == "Archive.org")
      {
        digglerCreateTempMenuItemName(urlMenu, digglerSearchArchiveLabel, menuList[i][1]);
      }
      else
      {
        digglerCreateTempMenuItem(urlMenu, menuList[i][1]);
      }
    }
  }

// document.write ("<tr><td title='" + menuList[i][0] + "' class='link'><a href='" + menuList[i][1] + "'>" + menuList[i][1] + "</a></td></tr>");
}

function matchUrl(url, option, uri)
{
  var name = option[0]
  var strRegexp = option[1];
  var strReplace = option[2];
  var regexpFlags = option[3];
  var loop = option[4];

  var result = new Array(0);
  var r = new RegExp(strRegexp, regexpFlags);

  if (r.test(url))
  {
    var newUrl = url.replace(r, strReplace);

    if (loop)
    {
      while (newUrl != url)
      {
        result.push(new Array (name, newUrl));
        url = newUrl;
        newUrl = url.replace(r, strReplace);
        if (uri)
          newUrl = digglerSubstituteURI(uri, newUrl);
      }
    }
    else
    {
      if (uri)
        newUrl = digglerSubstituteURI(uri, newUrl);
      result.push(new Array (name, newUrl));
    }
  }

  return result;
}

function cleanExtraSeparators (menuList)
{
  // remove starting separators
  while (menuList.length > 0 && menuList[0].length == 0)
  {
    menuList.shift();
  }

  // remove trailing separators
  while (menuList.length > 0 && menuList[menuList.length - 1].length == 0)
  {
    menuList.pop ();
  }

  // removing middle double separators, first and last cannot be separators
  for (i = 1; i < menuList.length - 1; i++)
  {
    if (menuList[i].length == 0 && menuList[i+1].length == 0)
    {
      menuList.splice (i, 1);
      i--;
    }
  }

  return menuList;
}

function digglerClearTempMenuItems(aParent)
{
  var children = aParent.childNodes;
  for (var i = 0; i < children.length;)
  {
    var index = children[i].getAttribute("tmp");
    if (index)
    {
      var olditem = aParent.removeChild(children[i]);
      delete olditem;
    }
    else
    {
      ++i;
    }
  }
}

function digglerCreateTempMenuSeparator(aParent)
{
  var menuitem = document.createElement("menuseparator");
  menuitem.setAttribute("tmp", "separator");
  aParent.appendChild(menuitem);
}

function digglerCreateTempMenuItemName(aParent, label, url)
{
  var menuitem = document.createElement("menuitem");
  menuitem.setAttribute("label", label);
  menuitem.setAttribute("url", url);
  menuitem.setAttribute("tmp", "item");
  aParent.appendChild(menuitem);
}

function digglerCreateTempMenuItem(aParent, url)
{
  var menuitem = document.createElement("menuitem");
  menuitem.setAttribute("label", url);
  menuitem.setAttribute("url",   url);
  menuitem.setAttribute("tmp", "item");
  aParent.appendChild(menuitem);
}

function digglerClearLocation()
{
  urlBar = document.getElementById("urlbar");
  urlBar.value = "";
  urlBar.focus();
}

function digglerSetImageMode(mode)
{
  prefObserver.pref.setIntPref(kPREF_IMAGE_BEHAVIOUR, mode);
}

function digglerGetImageMode()
{
  return prefObserver.imageBehaviour;
}

function digglerUpdateTooltip(tipElement)
{
  if (tipElement != document.getElementById("diggler-button"))
  {
    return false;
  }
  return true;
}
