// Neo Diggler main code
//   background.js
//
// Copyright (C) Neil Bird
//
// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1/GPL 2.0/LGPL 2.1
//
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
//
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
//
// The Original Code is Diggler.
//
// The Initial Developer of the Original Code is Adam Lock.
// Portions created by the Initial Developer are Copyright (C) 2002
// the Initial Developer. All Rights Reserved.
// Neo Firefox port Copyright (C) 2006 Neil Bird.
//
// Contributor(s):
//
//   Adam Lock <adamlock@netscape.com>
//   Firefox 2 Neo Diggler:  Neil Bird <mozilla@fnxweb.com>
//   Chris Neale <orbit@cdn.gs>
//
// Alternatively, the contents of this file may be used under the terms of
// either the GNU General Public License Version 2 or later (the "GPL"), or
// the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
// in which case the provisions of the GPL or the LGPL are applicable instead
// of those above. If you wish to allow use of your version of this file only
// under the terms of either the GPL or the LGPL, and not to allow others to
// use your version of this file under the terms of the MPL, indicate your
// decision by deleting the provisions above and replace them with the notice
// and other provisions required by the GPL or the LGPL. If you do not delete
// the provisions above, a recipient may use your version of this file under
// the terms of any one of the MPL, the GPL or the LGPL.
//
// ***** END LICENSE BLOCK ***** */


// Preferences, initialised to defaults
var defaultPrefs =
{
    // Actual prefs.
    showPopupMenuItems : true,
    showTabMenuItems : true,
    showImageMenuItems : true,
    showToolsAsSubmenu : false,
    imageBehaviour : 1,
    showPopups : true,
    showPageAction : true,

    tools : [],

    lastversion : ''
}
var prefs = defaultPrefs;

// List of created menus, so that can re-created
// Have to always re-create everything to preserve order (new ones always go on the end)
// Items are each {id,label,url}
var currentMenuItems = [];

// Current URL used to generate the current menu
var currentUrl = "";

// ID of top-level menu
var mainMenu = "neo-diggler";

// Current clipboard text to set (by manual.html/js)
var requiredClipboardText = "";


// Load preferences
function loadPrefs()
{
    // Apply loaded / default prefs to initial menu
    function applyPrefs()
    {
        // Show/hide page action on all tabs
        browser.tabs.query( {}, tabs => {
            for (let tab of tabs)
            {
                if (prefs.showPageAction)
                    browser.pageAction.show( tab.id );
                else
                    browser.pageAction.hide( tab.id );
            }
        });

        // Create menu for current tab
        browser.tabs.query( {active:true, currentWindow:true}, tabs => {
            digglerBuildMenu( tabs[0].url );
        });
    }

    // Async request for prefs.
    browser.storage.local.get("preferences").then( results => {
        // Have something
        if (results.hasOwnProperty("preferences"))
        {
            let preferences = results.preferences;

            // Extract & apply
            if (preferences.hasOwnProperty("popup_controls"))   prefs.showPopupMenuItems = preferences["popup_controls"];
            if (preferences.hasOwnProperty("tab_controls"))     prefs.showTabMenuItems   = preferences["tab_controls"];
            if (preferences.hasOwnProperty("image_controls"))   prefs.showImageMenuItems = preferences["image_controls"];
            if (preferences.hasOwnProperty("submenu"))          prefs.showToolsAsSubmenu = preferences["submenu"];
            if (preferences.hasOwnProperty("page_action"))      prefs.showPageAction     = preferences["page_action"];
            if (preferences.hasOwnProperty("lastversion"))      prefs.lastversion        = preferences["lastversion"];

            // TBD system prefs.
            if (preferences.hasOwnProperty("image_behaviour"))  prefs.imageBehaviour = preferences["image_behaviour"];  // permissions.default.image
            if (preferences.hasOwnProperty("show_popups"))      prefs.showPopups = preferences["show_popups"];          // dom.disable_open_during_load

            // Tools
            if (preferences.hasOwnProperty("tools"))            prefs.tools = preferences["tools"];

            // Converted prefs from old version still have data encoded (issue 1), so move to 2
            let writePrefs = false;
            for (let idx in prefs.tools)
            {
                if (prefs.tools[idx][0] == "1")
                {
                    // Old format, convert
                    prefs.tools[idx][0] = "2";
                    prefs.tools[idx][1] = unescape( prefs.tools[idx][1] );
                    prefs.tools[idx][3] = unescape( prefs.tools[idx][3] );
                    prefs.tools[idx][4] = unescape( prefs.tools[idx][4] );
                    writePrefs = true;
                }
            }

            // And remove from current prefs any not in defaults any more
            let defaults = collatePrefs( defaultPrefs );
            for (let pref in preferences)
                if (preferences.hasOwnProperty(pref)  &&  !defaults.hasOwnProperty(pref))
                    writePrefs = true;

            // Check version
            let thisVn = browser.runtime.getManifest().version;
            if (prefs.lastversion !== thisVn)
            {
                prefs.lastversion = thisVn;
                writePrefs = true;
            }

            // Updated?
            if (writePrefs)
                savePrefs();
        }

        // Use default prefs.
        applyPrefs();
        savePrefs();

    },
    error => {
        // Use default prefs.
        console.error( "Neo Diggler failed to read preferences: " + JSON.stringify(error) );
        applyPrefs();
    });
}


// Collate preferences
function collatePrefs( prefs )
{
    let preferences = {};

    // Simple ones
    preferences["popup_controls"] = prefs.showPopupMenuItems;
    preferences["tab_controls"]   = prefs.showTabMenuItems;
    preferences["image_controls"] = prefs.showImageMenuItems;
    preferences["submenu"]        = prefs.showToolsAsSubmenu;
    preferences["page_action"]    = prefs.showPageAction;
    preferences["lastversion"]    = prefs.lastversion;

    // TBD system prefs.
    preferences["image_behaviour"] = prefs.imageBehaviour;  // permissions.default.image
    preferences["show_popups"]     = prefs.showPopups;      // dom.disable_open_during_load

    // Tools
    preferences["tools"] = prefs.tools;

    // Done
    return preferences;
}


// Save preferences in use
function savePrefs()
{
    let preferences = collatePrefs( prefs );
    browser.storage.local.set({"preferences": preferences});
}


// URI editing
function digglerSubstituteURI(originalURI, pattern)
{
    // $S - the whole URL
    // $c - the scheme (e.g. http)
    // $h - the host (e.g. www.mozilla.org)
    // $t - the port number (e.g. 80)
    // $u - the username / password (e.g. fred:bloggs)
    // $p - the path (e.g. /my/path/index.html)
    // $1, $2 etc. - parts of the regular expression to be subsituted.
    let userPass = originalURI.username + ':' + originalURI.password;
    if (userPass === ':')
        userPass = '';
    return pattern
        .replace(/\$S/, originalURI.href)
        .replace(/\$c/, originalURI.protocol.replace(':',''))
        .replace(/\$h/, originalURI.hostname)
        .replace(/\$t/, originalURI.port)
        .replace(/\$u/, userPass)
        .replace(/\$p/, originalURI.pathname);
}


// Menu handler
function digglerDoMenu( info, tab )
{
    // Only pull URL actions out of the menu store now
    digglerSetUrl( tab.id, info.menuItemId );
}


// Open file:/// link via manual redirect
function openFileLink( tabId, uriToLoad )
{
    // First copy link to clipboard from current page
    requiredClipboardText = uriToLoad.replace(/"/g,"%22");

    // Open manual redirect message / instructions
    browser.tabs.update( tabId, { "url": browser.extension.getURL("manual.html") } );
}


// Follow URL of given menu item
function digglerSetUrl( tabId, menuId )
{
    let match = menuId.match( /menuitem-([0-9]+)$/ );
    if (match.length > 1)
    {
        // Determine URL to use
        let index = parseInt( match[1] );
        let uriToLoad = currentMenuItems[index].url;

        // Special case
        if (uriToLoad === "<prefs>")
        {
            // Open prefs. page
            browser.runtime.openOptionsPage();
        }
        // Run javascript?
        else if (uriToLoad.search("javascript:") === 0)
        {
            // Yep, JS
            let js = uriToLoad.replace("javascript:","");
            browser.tabs.executeScript( tabId, { "code": js } );
        }
        // file:/// links can't currently be triggered - use work-around
        else if (uriToLoad.search("file:") !== 0)
        {
            // OK, normal
            browser.tabs.update( tabId, { "url": uriToLoad } );
        }
        else
        {
            // Work around for file:/// links
            openFileLink( tabId, uriToLoad );
        }
    }
}


// Used to wrap now-unavailable nsIURIFixup
function digglerFixupUrl(url)
{
    // OK, this does more than I first thought!  Need to parse out bits of the URI.
    var fixedUpURI = new URL(url);
    if (fixedUpURI)
        return fixedUpURI;
    return url;
}


// Build menus
function digglerBuildMenu(href)
{
    url = digglerFixupUrl(href);

    // Need to do it?
    if (url.href === currentUrl)
        return;
    else
        currentUrl = url.href;

    // Clear all of the previous tools
    digglerClearTempMenuItems();

    // Build the user specified tools menu
    try {
        // There is no point showing a tools submenu if the user hasn't got any!
        if (prefs.tools  &&  prefs.tools.length > 0)
        {
            // If using submenu, create it
            let submenuId = mainMenu;
            if (prefs.showToolsAsSubmenu)
                submenuId = digglerCreateTempMenuItemName( browser.i18n.getMessage("digglerPrefTools.label"), "" );
            digglerBuildToolsMenu(submenuId, url, prefs.tools);
        }
    }
    catch (ex)
    {
        console.log("Neo Diggler: exception " + ex);
    }

    // Nav menu.
    let currentMenuSize = currentMenuItems.length;
    digglerBuildUrlMenu(url);

    // Add prefs. link, with sep. if required.
    if (currentMenuSize !== currentMenuItems.length)
        digglerCreateTempMenuSeparator(mainMenu);
    digglerCreateTempMenuItemName(mainMenu, browser.i18n.getMessage("digglerPrefTitle.label"), "<prefs>");
}


// Create custom tools menu
function digglerBuildToolsMenu(toolsMenu, uri, tools)
{
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

     menuList = menuList.concat(matchUrl(uri.href, option, uri));
  }

  menuList = cleanExtraSeparators(menuList);

  if (menuList.length > 0) {
    for (i = 0; i < menuList.length; ++i) {
      if (menuList[i][0] == "----USE_ACTION----") {
        digglerCreateTempMenuItem(toolsMenu, menuList[i][1]);
      }
      else {
        digglerCreateTempMenuItemName(toolsMenu, menuList[i][0], menuList[i][1]);
      }
    }
    digglerCreateTempMenuSeparator(toolsMenu);
  }
}


// Stock tools / conversions
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
  ["Webcitation", "^https?://(.*)$", "http://www.webcitation.org/query?url=$1", "i", false],
  ["Google", "^https?://(.*)$", "http://google.com/search?q=cache:$1", "i", false],
//  [],
//  []
];


// Build URL menus for site
function digglerBuildUrlMenu (siteUrl)
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

    menuList = menuList.concat(matchUrl (siteUrl.href, option, null));
  }
  menuList = cleanExtraSeparators(menuList);

  // Don't do anything if there's no menu list, or a menu list of only one thing (the site itself)
  if (menuList.length > 1)
  {
    for (i = 0; i < menuList.length; i++)
    {
      if (menuList[i].length == 0)
      {
        digglerCreateTempMenuSeparator(mainMenu);
      }
      else if (menuList[i][0] == "Google")
      {
        digglerCreateTempMenuItemName(mainMenu, browser.i18n.getMessage("digglerGoogle.label"), menuList[i][1]);
      }
      else if (menuList[i][0] == "Archive.org")
      {
        digglerCreateTempMenuItemName(mainMenu, browser.i18n.getMessage("digglerArchive.label"), menuList[i][1]);
      }
      else if (menuList[i][0] == "Webcitation")
      {
        digglerCreateTempMenuItemName(mainMenu, browser.i18n.getMessage("digglerWebcitation.label"), menuList[i][1]);
      }
      else
      {
        digglerCreateTempMenuItem(mainMenu, menuList[i][1]);
      }
    }
  }
}


// Return matches for site URL according to given options
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


// Remove sequential separators
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


// Remove current ,enu items
function digglerClearTempMenuItems()
{
    for (var i = 0; i < currentMenuItems.length; ++i)
        browser.menus.remove( currentMenuItems[i].id );
    currentMenuItems = [];
    globalMenuIndex = 0;
}


// Create separator menu item
function digglerCreateTempMenuSeparator(aParent)
{
    // Create
    let id = "diggler-separator-" + currentMenuItems.length;
    let newmenu = {
        id: id,
        type: "separator",
        contexts: ["browser_action", "page_action"]
    };
    if (aParent)
        newmenu.parentId = aParent;
    browser.menus.create( newmenu );

    // Store
    currentMenuItems.push({
        "id": id
    });
}


// Create menu item with name
function digglerCreateTempMenuItemName(aParent, label, url)
{
    // Create
    let id = "diggler-menuitem-" + currentMenuItems.length;
    let newmenu = {
        id: id,
        title: label,
        contexts: ["browser_action", "page_action"]
    };
    if (aParent)
        newmenu.parentId = aParent;
    browser.menus.create( newmenu );

    // Store info
    currentMenuItems.push({
        "id": id,
        "label": label,
        "url": url
    });

    return id;
}


// Create basic menu item
function digglerCreateTempMenuItem(aParent, url)
{
    digglerCreateTempMenuItemName(aParent,url,url);
}



// Add menu handler
browser.menus.onClicked.addListener( digglerDoMenu );

// Create custom submenu to work around max 6 limit of button context menu items (!)
browser.menus.create({
    id: mainMenu,
    title: "Neo Diggler",
    icons: {
        "48": "icons/neo-diggler.svg"
    },
    contexts: ["browser_action", "page_action"]
});

// Load prefs
loadPrefs();

// Be notified of tab content changes
browser.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {
    // Rebuild menu for new URL
    digglerBuildMenu( tab.url );

    // And update page action visibility
    if (prefs.showPageAction)
        browser.pageAction.show( tab.id );
    else
        browser.pageAction.hide( tab.id );
});

// Be notified of tab selection changes
browser.tabs.onActivated.addListener( activeInfo => {
    // Determine URL of tab and rebuild menu
    browser.tabs.get( activeInfo.tabId ).then( tab => digglerBuildMenu( tab.url ) );
});

// Prefs. save request from prefs. page
browser.runtime.onMessage.addListener( (message, sender) => {
    // Save prefs and then re-apply them
    if (message["message"] === "neo-diggler-prefs-save")
        browser.storage.local.set({"preferences": message["preferences"]}).then( results => loadPrefs() );
    else if (message["message"] === "neo-diggler-file-uri")
        openFileLink( message["tabId"], message["uri"] );
    else if (message["message"] === "neo-diggler-clipboard-request")
        browser.runtime.sendMessage({
            message: "neo-diggler-clipboard",
            text:    requiredClipboardText
        });
});

// Finally - extension changed?
browser.runtime.onInstalled.addListener( details => {
    // Maybe not do this this on minor versions ...
    if (details.reason === "update")
    {
        let showChangelog = true;

        // Check version
        if (prefs.hasOwnProperty("lastversion")  &&  prefs.lastversion !== "")
        {
            let newvn = browser.runtime.getManifest().version;
            if (details.previousVersion === newvn)
                showChangelog = false;

            // Update records
            prefs.lastversion = newvn;
            savePrefs();
        }

        // Show changelog?
        if (showChangelog)
            browser.tabs.create({ "url": "changelog.html" });
    }
});

// vim: set ai et sts=4 sw=4 :
