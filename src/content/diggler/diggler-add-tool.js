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
 *
 * Contributor(s):
 *
 *   Adam Lock <adamlock@netscape.com>
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
 

const kREGEX_PREFAB_PATTERNS = [
  "THIS_SHOULD_NEVER_BE_SEEN", // Custom (ignored)
  "^(.+)$", // Any URL
  "^https?://(.*)$", // Any HTTP
  "^ftp://(.*)$", // Any FTP
  "^ftp|https?://([a-zA-Z0-9\-]*\.yourdomain.com)$", // Subdomain
];
 
var gToolParts;
var gIsNewPref = false;

var gLabel;
var gUseActionAsLabel;
var gPattern;
var gPatternCombo;
var gAction;

function digglerToolInit()
{
  gToolParts = window.arguments[0];
  gIsNewPref = (window.arguments[1] == "1") ? true : false;
    
  gUseActionAsLabel = document.getElementById("useActionAsLabel");
  gLabel = document.getElementById("toolLabel");
  gPattern= document.getElementById("toolPattern");
  gPatternCombo = document.getElementById("toolPatternCombo");
  gAction = document.getElementById("toolAction");

  // Fill in fields from tool data
  if (!gIsNewPref) {
    var isVisible        = unescape(gToolParts[0]);
    var label            = unescape(gToolParts[1]);
    var useActionAsLabel = unescape(gToolParts[2]);
    var pattern          = unescape(gToolParts[3]);
    var action           = unescape(gToolParts[4]);

    gUseActionAsLabel.checked =(useActionAsLabel == "1") ? true : false;
    gLabel.value = label;
    gPattern.value = pattern;
    gAction.value = action;
  }
  else {
    // Create a blank tool
    gLabel.value = kNEW_TOOL;
    gPattern.value = kREGEX_PREFAB_PATTERNS[1];
  }
    
  digglerSyncPatternCombo();
}

function digglerOnPatternComboSelect(aEvent)
{
  if (gPatternCombo.selectedIndex > 0) {
    gPattern.value = kREGEX_PREFAB_PATTERNS[gPatternCombo.selectedIndex];
  }
}

function digglerSyncPatternCombo()
{
  var pattern = gPattern.value;
  for (i = 1; i < kREGEX_PREFAB_PATTERNS.length; ++i) {
    if (pattern == kREGEX_PREFAB_PATTERNS[i]) {
      gPatternCombo.selectedIndex = i;
      return;
    }
  }
  // Custom
  gPatternCombo.selectedIndex = 0;
}

function digglerToolApply()
{
  gToolParts[0] = "1";
  gToolParts[1] = escape(gLabel.value);
  gToolParts[2] = gUseActionAsLabel.checked ? "1" : "0";
  gToolParts[3] = escape(gPattern.value);
  gToolParts[4] = escape(gAction.value);

  window.close();
}
