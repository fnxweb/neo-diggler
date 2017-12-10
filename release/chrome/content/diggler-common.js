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

function digglerAbout()
{
  digglerLoadHome();
}

function digglerLoadHome()
{
  window.open("https://addons.mozilla.org/en-GB/firefox/addon/neo-diggler/");
}

function digglerReadTools(prefsvc)
{
  try {
    var i = 0;
    var tools = new Array();
    while (prefsvc.prefHasUserValue(kPREF_DIGGLER_TOOL_PREFIX + i)) {
      tools.push(digglerReadTool(prefsvc, kPREF_DIGGLER_TOOL_PREFIX + i));
      ++i;
    }
    return tools;
  } catch (ex) {
    alert("digglerReadTools exception: " + ex);
  }
}

function digglerWriteTools(prefsvc, tools)
{
  try {
    // Write out the tools
    for(i = 0; i < tools.length; ++i) {
      digglerWriteTool(prefsvc, kPREF_DIGGLER_TOOL_PREFIX + i, tools[i]);
    }

    // Now wipe out the remainder of any tools that were there before
    while (prefsvc.prefHasUserValue(kPREF_DIGGLER_TOOL_PREFIX + i)) {
      prefsvc.clearUserPref(kPREF_DIGGLER_TOOL_PREFIX + i);
      ++i;
    }
  } catch (ex) {
    alert("digglerWriteTools exception: " + ex);
  }
}

function digglerMakeToolParts(visible, label, useactionaslabel, pattern, action)
{
  var toolparts = new Array(
      visible ? 1 : 0,
      escape(label),
      useactionaslabel ? 1 : 0,
      escape(pattern),
      escape(action)
    );
  return toolparts;
}

function digglerReadTool(prefsvc, pref)
{
  var tool = prefsvc.getCharPref(pref);
  return tool.split(kSEPARATOR);
}

function digglerWriteTool(prefsvc, pref, toolparts)
{
    var tooldata = toolparts.join(kSEPARATOR);
    prefsvc.setCharPref(pref, tooldata);
}
