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

 ///////////////////////////////////////////////////////////////////////////////
// For Firefox

var gDigglerPrefSvc;

var gTools;

var gToolList;
var gUpButton;
var gDownButton;
var gAddButton;
var gEditButton;
var gDeleteButton;

function digglerFBInitSettings()
{
  if (!gDigglerPrefSvc) {
    gDigglerPrefSvc = Components
        .classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService).getBranch("");
  }
  var i;
  try {
    for (i = 0; i < _elementIDs.length; i++) {
      var e = document.getElementById(_elementIDs[i]);
      if (e) {
        var prefstring = e.getAttribute("prefstring");
        if (prefstring && gDigglerPrefSvc.prefHasUserValue(prefstring)) {
          var prefattribute = "checked"; // TODO only handles checkboxes so far!
          var value = gDigglerPrefSvc.getBoolPref(prefstring);
          e.setAttribute(prefattribute, value);
        }
      }
    }
  }
  catch (e) {
    // alert("exception : " + e);
  }

  gTools = digglerReadTools(gDigglerPrefSvc);

  gToolList = document.getElementById("toolList");
  gUpButton = document.getElementById("moveToolUp");
  gDownButton = document.getElementById("moveToolDown");
  gAddButton = document.getElementById("addTool");
  gEditButton = document.getElementById("editTool");
  gDeleteButton = document.getElementById("deleteTool");

  digglerFBBuildToolList();
}

function digglerFBBuildToolList()
{
  try {
    var children = gToolList.childNodes;
    for (i = 0; i < children.length;) {
      if (children[i].nodeName == "listitem") {
        var olditem = gToolList.removeChild(children[i]);
        delete olditem;
      } else {
        i++;
      }
    }

    for (i = 0; i < gTools.length; ++i) {
      var toolparts = gTools[i];
      var isVisible        = unescape(toolparts[0]);
      var label            = unescape(toolparts[1]);
      var useActionAsLabel = unescape(toolparts[2]);
      var pattern          = unescape(toolparts[3]);
      var action           = unescape(toolparts[4]);

      var listitem = document.createElement("listitem");
//    listitem.setAttribute("type", "checkbox");
      listitem.setAttribute("label", label);
//    listitem.setAttribute("checked", isVisible == "1" ? true : false);
      gToolList.appendChild(listitem);
    }
  }
  catch (ex) {
    alert("digglerFBBuildToolList exception:" + ex);
  }

  digglerFBSelectionChanged();
}

function digglerFBSaveSettings()
{
  for (i = 0; i < _elementIDs.length; i++) {
    var e = document.getElementById(_elementIDs[i]);
    if (e) {
      var prefstring = e.getAttribute("prefstring");
      if (prefstring) {
        var prefattribute = "checked"; // TODO only handles checkboxes so far!
        var value = e.getAttribute(prefattribute);
        if (typeof(value) == "string") {
          if (value == "true")
            value = true;
          else if (value == "false")
            value = false;
          }
          gDigglerPrefSvc.setBoolPref(prefstring, value);
        }
      }
  }

  digglerWriteTools(gDigglerPrefSvc, gTools);

  window.close();
}

function digglerFBSelectionChanged()
{
  // Disable or enable the various buttons according to the selection
  dump("digglerFBSelectionChanged");
  if (gToolList.selectedIndex == -1) {
    gEditButton.disabled = true;
    gDeleteButton.disabled = true;
    gUpButton.disabled = true;
    gDownButton.disabled = true;
  }
  else {
    gEditButton.disabled = false;
    gDeleteButton.disabled = false;
    gUpButton.disabled = (gToolList.selectedIndex > 0) ? false : true;
    gDownButton.disabled = (gToolList.selectedIndex < gToolList.childNodes.length - 1) ? false : true;
  }
}

function digglerFBMoveItem(up)
{
  // Swap the tools around in the array and rebuild the list
  var idx = gToolList.selectedIndex;
  if ((up && idx > 0) ||
      idx < gToolList.childNodes.length - 1)
  {
    var swapIdx = (up) ? idx - 1 : idx + 1;

    var tmpTool = gTools[idx];
    gTools[idx] = gTools[swapIdx];
    gTools[swapIdx] = tmpTool;

    digglerFBBuildToolList();
    gToolList.selectedIndex = swapIdx;
  }
}

function digglerFBMoveUp()
{
  dump("digglerFBMoveUp");
  digglerFBMoveItem(true);
}

function digglerFBMoveDown()
{
  dump("digglerFBMoveDown");
  digglerFBMoveItem(false);
}

function digglerFBEdit()
{
  dump("digglerFBAdd");
  var idx = gToolList.selectedIndex;
  if (idx >= 0) {
    window.openDialog("chrome://diggler/content/diggler-add-tool.xul",
        "_blank", "chrome,dialog,titlebar,modal", gTools[idx], "0");
    digglerFBBuildToolList();
  }
}

function digglerFBAdd()
{
  dump("digglerFBAdd");
  var idx = gToolList.childNodes.length;

  var newTool = new Array(5);
  var newToolTxt = "----NEWTOOL----";
  newTool[0] = newToolTxt;
  window.openDialog("chrome://diggler/content/diggler-add-tool.xul",
      "_blank", "chrome,dialog,titlebar,modal", newTool, "1");

  // Test if the tool has been filled in
  if (newTool[0] != newToolTxt) {
    gTools.push(newTool);
    digglerFBBuildToolList();
    gToolList.selectedIndex = gTools.length - 1;
  }
}

function digglerFBDelete()
{
  var idx = gToolList.selectedIndex;
  if (idx >= 0)
  {
    if (idx == 0) {
      gTools = gTools.slice(1, gTools.length);
    }
    else if (idx == gTools.length - 1)
    {
      gTools.pop();
    }
    else {
      var newTools = gTools.slice(0, idx);
      newTools = newTools.concat(gTools.slice(idx + 1, gTools.length));
      gTools = newTools;
    }

    // Rebuild the list without the deleted item
    digglerFBBuildToolList();

    // Select the next / previous item in the list
    if (gTools.length > 0) {
      if (idx >= gTools.length)
        idx = gTools.length - 1;
      gToolList.selectedIndex = idx;
    }
  }
}

