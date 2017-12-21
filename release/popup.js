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
        // Try to change URL
        if (url.value.search("file:") !== 0)
        {
            // Normal URI, try to do it
            browser.tabs.update( tabs[0].id, {url:url.value} ).then(
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
                "uri":      url.value
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
