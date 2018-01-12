// Neo Diggler popup control
//   popup.js
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

// Flash background on error
function flagError( input )
{
    // Catch end of colour change
    input.ontransitionend = function(event) {
        // Don't catch any more
        input.ontransitionend = null;

        // Put back
        input.className = input.className.replace( / *illegal-url\b/, "" );

        // Re-focus
        input.focus();
    };

    // And set it
    input.className += " illegal-url";
}


// Go button
function onGo( event )
{
    // Anything?
    let url = document.getElementById("diggler-url");
    if (url.value.match(/^\s*$/))
    {
        // Nope
        window.close();
        return;
    }

    // Use current URL
    browser.tabs.query( {active:true,currentWindow:true}, tabs => {
        // Strip any surrounding spaces (paste issues)
        let val = url.value.replace( /^ *(.*?) *$/, "$1" );

        // Might it be an incomplete URL (www.example.com)?
        if (val.search(/^[-A-Za-z0-9_]+:/) !== 0  &&    // no protocol
            val.indexOf(" ") === -1  &&                 // no spaces in it
            val.indexOf(".") !== -1)                    // at least one dot
        {
            // Incomplete URL, try http:// on the front (should we presume https nowadays?)
            val = "https://" + val;
        }

        // Trigger a search for non-URL
        if (val.search(/^[-A-Za-z0-9_]+:/) !== 0)
        {
            // Doesn't look like a URI or even the beginnings of one, convert to a search
            // TBD use current search engine, access via bug 1352598
            val = "https://www.google.com/search?q=" + escape(val.replace( / +/g, "+" ));
        }

        // Try to change URL
        if (val.search("file:") !== 0)
        {
            // Normal URI, try to do it
            browser.tabs.update( tabs[0].id, {url:val} ).then(
                result => {
                    // Was OK, close popup
                    window.close();
                },
                result => {
                    // Illegal URL
                    flagError( url );
                });
        }
        else
        {
            // Work around for file:/// URIs
            browser.runtime.sendMessage({
                "message":  "neo-diggler-file-uri",
                "tabId":    tabs[0].id,
                "uri":      val
            });

            // Assume it'll work ...
            // Doesn't for built-in URIs like about: etc.;  could leave window open and get callback to flash/close depending?
            window.close();
        }
    });
}


// Set up
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("diggler-url").onkeyup = function(event) {
        if (event.keyCode === 13)
            onGo(event);
    };
    document.getElementById("diggler-go").onclick = onGo;
});
