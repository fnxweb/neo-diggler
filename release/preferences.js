// Neo Diggler preference editing control
//   preferences.js
//
// Copyright (C) Neil Bird
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.
//
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA


// Current prefs
var prefs = {};
let debugPrefs =
    {"popup_controls":true,"tab_controls":true,"image_controls":true,"submenu":true,"page_action":true,"image_behaviour":0,"show_popups":true,"tools":["Google Cache|0|^[a-z]+://(.*)$|https://www.google.co.uk/search?q=cache:$1","Google UK|0|^[a-z]+://(.*)$|https://www.google.co.uk/search?q=$1"]}

// Plus
var plusChar = "➕";


// i18n lookup
function i18nGet( text )
{
    let i18n = `[i18n:${text}]`;
    if (typeof(browser) !== "undefined")
    {
        let text = browser.i18n.getMessage(key);
        if (text  &&  text.length)
            i18n = text;
    }
    return i18n;
}


// Dragging starts
function onDragStart(ev) {
    // Flag origin
    ev.dataTransfer.setData("text", ev.target.id);
}


// Dragging over possible target
function onDragOver(ev)
{
    ev.preventDefault();
}


// Finished dragging
function onDrop(ev)
{
    // Handle event, ID origin
    ev.preventDefault();
    let originId = ev.dataTransfer.getData("text");
    let origin = document.getElementById(originId);
    let originText = origin.querySelector(".entry");

    // Fix up CSS
    onDragEnd(ev);

    // Correctly ID target
    let target = ev.target;
    if (target.tagName.search(/^li$/i) !== 0)
        target = target.closest("li");
    if (target === null  ||  target.id.match(/add$/))
        return;
    let targetText = target.querySelector(".entry");

    // ID start and stop as ints
    let bits = originId.match(/^([^0-9]+)(.*)/);
    let set = bits[1];
    let originIndex = parseInt( bits[2] );
    bits = target.id.match(/^([^0-9]+)([0-9]+)(.*)/);
    let targetIndex = parseInt( bits[2] );

    // Dropped into a separator, and dragging up?
    if (bits[3].length > 0  &&  originIndex > targetIndex)
        targetIndex++;  // Dropped onto a separator;  this way around, the target is the thing below it

    // Shuffling up or down?  (down is increasing index)
    if (originIndex === targetIndex)
    {
        // No change
        return;
    }
    else if (originIndex < targetIndex)
    {
        // Moving from top down, so shuffle up
        let moveText = originText.innerText;
        let item = document.getElementById( set + originIndex );
        let itemText = item.querySelector(".entry");
        for (let index = originIndex+1;  index <= targetIndex;  ++index)
        {
            let nextItem = document.getElementById( set + index );
            let nextText = nextItem.querySelector(".entry");
            itemText.innerText = nextText.innerText;
            item = nextItem;
            itemText = nextText;
        }
        itemText.innerText = moveText;
    }
    else
    {
        // Moving from bottom up, so shuffle down
        let moveText = originText.innerText;
        let item = document.getElementById( set + originIndex );
        let itemText = item.querySelector(".entry");
        for (let index = originIndex-1;  index >= targetIndex;  --index)
        {
            let nextItem = document.getElementById( set + index );
            let nextText = nextItem.querySelector(".entry");
            itemText.innerText = nextText.innerText;
            item = nextItem;
            itemText = nextText;
        }
        itemText.innerText = moveText;
    }
}


// Entered item while dragging
function onDragEnter(ev)
{
    // If a valid item, highlight it as a target
    let target = ev.target;
    if (target.tagName && target.tagName.search(/^(li|div|span)$/i) === 0)
    {
        if (target.tagName.search(/^li$/i) !== 0)
            target = target.closest("li");
        target.className += " dragging";
    }
}


// Left item while dragging
function onDragLeave(ev)
{
    // If current is a valid item, stop highlighting it as a target
    let target = ev.target;
    if (target.tagName && target.tagName.search(/^(li|div|span)$/i) === 0)
    {
        if (target.tagName.search(/^li$/i) !== 0)
            target = target.closest("li");
        target.className = target.className.replace(/ dragging\b/,'');
    }
}


// Drag end - remove all drag highlights
function onDragEnd(ev)
{
    let els = document.querySelectorAll( ".dragging" );
    for (let el of els)
        el.className = el.className.replace(/ dragging\b/g,'');
}


// Delete a li
function deleteEntry( li )
{
    // Delete the li and its following separator
    let parent = li.parentNode;
    let sep = li.nextSibling;
    parent.removeChild( li );
    parent.removeChild( sep );

    // Renumber the lis
    let item = 0;
    let lis = parent.querySelectorAll( "li" );
    for (let idx = 0;  idx < lis.length;  ++idx)
    {
        // Split current id into <name><num><suffix>
        // We have, e.g., manu1, menu1sep, menu2, menu2sep, ... menuN, menuNsep, menuN+1add
        let bits = lis[idx].id.match(/^([^0-9]+)([0-9]+)(.*)/);
        if (!bits[3])
            bits[3] = "";
        if (bits[3] === ""  ||  bits[3] === "add")
            ++item;
        lis[idx].id = bits[1] + item + bits[3];
    }
}


// Make delete button stub in a LI work
function setDeletable( li )
{
    let button = li.querySelector("span.for-delete-button");
    if (button)
    {
        button.className = "delete-button";
        button.title = i18nGet("digglerDeleteTool.label");
        button.addEventListener( "click", event => {
            deleteEntry( li );
        } );
    }
}


// Add edit button to li
function addEdit( li )
{
    let button = document.createElement("span");
    button.className = "edit-button";
    button.appendChild( document.createTextNode( i18nGet("digglerEditTool.label") ) );
    button.addEventListener( "click", event => {
        editEntry( li );
    } );
    li.appendChild( button );
}


// Add a new + entry
function addPlusEntry( list, n, type )
{
    list.appendChild( createLi( n, type, "sep", "li-sep", "" ) );
    let li = createLi( parseInt(n)+1, type, "add", "li-data", plusChar );
    list.appendChild( li );
}


// Create a tools list item
function createLi( n, list, listtype, cls, text )
{
    let li = document.createElement("li");

    // List entry?
    if (listtype !== "sep")
    {
        // Delete button (or space for it for the add entry)
        let span = document.createElement("span");
        span.className = "for-delete-button";
        span.appendChild( document.createTextNode("✖") );
        li.appendChild( span );
        if (listtype !== "add")
        {
            li.draggable = true;
            setDeletable( li );
        }

        // Entry itself
        let entry = document.createElement("span");
        entry.className = "entry";
        entry.appendChild( document.createTextNode(text) );
        li.appendChild( entry );

        // Drag button
        if (listtype !== "add")
            addEdit( li );
    }
    else
    {
        // Separator: span in a div in a li
        let div = document.createElement("div");
        let span = document.createElement("span");
        span.appendChild( document.createTextNode(" ") );
        div.appendChild( span );
        li.appendChild( div );
    }

    // And the rest of the attributes; drag stuff if it's not the "add" line
    li.className = cls;
    li.id        = list + n + listtype;

    return li;
}


// Copy prefs. to page
function displayPrefs()
{
    // Delete existing items
    let items = document.querySelectorAll("div.list-content li");
    for (let n = items.length-1;  n >= 0;  --n)
        items[n].parentNode.removeChild( items[n] );

    // Find & populate menu list
    let list = document.querySelector("#tools-list ul");
    for (let n in prefs.tools)
    {
        if (n > 0)
            list.appendChild( createLi( n, "tool", "sep", "li-sep", "" ) );
        let li = createLi( parseInt(n)+1, "tool", "", "li-data", prefs.tools[n] );
        list.appendChild( li );
    }

    // Allow for adding a new one
    addPlusEntry( list, prefs.tools.length, "tool" );
}


// Open for edit
var currentEdit = null;
function editEntry(li)
{
    currentEdit = li;
    console.log(`++ editing ${li.id}`);
}


// On page load
function preparePage(ev)
{
//    // Monitor main buttons
//    document.getElementById("prefs-save").addEventListener( "click", event => {
//        // Save
//        event.preventDefault();
//        savePrefs();
//    });
//    document.getElementById("prefs-defaults").addEventListener( "click", event => {
//        // Request defaults
//        event.preventDefault();
//        comms.postMessage({"message":"urllink-prefs-defaults-req"});
//    });
//    document.getElementById("prefs-cancel").addEventListener( "click", event => {
//        // Undo edits
//        event.preventDefault();
//        displayPrefs();
//    });

    // Load prefs.
    if (typeof(browser) !== "undefined")
    {
        // Extension
        browser.storage.local.get("preferences").then( results => {
            // Have something
            if (results.hasOwnProperty("preferences"))
                prefs = results["preferences"];

            // Apply prefs.
            displayPrefs();
        });

        // i18n
        // Look for data-i18n attributes, and look those up (or use the token if lookup fails due to no translation)
        for (let elem of document.querySelectorAll( "[data-i18n]" ))
        {
            // Look up translation for main text
            let i18n = i18nGet( elem.getAttribute('data-i18n') );

            // Apply it
            // Things like inputs can trigger translation with value equal "i18n"
            if (typeof elem.value !== 'undefined' && elem.value === 'i18n')
                elem.value = i18n;
            else
                elem.innerText = i18n;
        }

        // Again for tooltips
        for (let elem of document.querySelectorAll( "[data-title-i18n]" ))
            elem.title = i18nGet( elem.getAttribute('data-title-i18n') );
    }
    else
    {
        // Local debug
        console.warn("Neo Diggler preferences page - diagnostic mode");
        prefs = debugPrefs;
        displayPrefs();
    }

    // Drag handling
    document.addEventListener( "dragstart", onDragStart );
    document.addEventListener( "drop",      onDrop );
    document.addEventListener( "dragover",  onDragOver );
    document.addEventListener( "dragenter", onDragEnter );
    document.addEventListener( "dragleave", onDragLeave );
    document.addEventListener( "dragend",   onDragEnd );
}


document.addEventListener("DOMContentLoaded", preparePage);
