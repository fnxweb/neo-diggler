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

// Reload button
function onReload( event )
{
    // Copy page URL to text input
    browser.tabs.query( {active:true,currentWindow:true}, tabs => {
        let url = document.getElementById("diggler-url");
        url.value = tabs[0].url;
        url.focus();
    });

}


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
        // Try to change URL (fails for file:/// etc.)
        browser.tabs.update( tabs[0].id, {url:url.value} ).then(
            result => {
                // Was OK, close popup
                window.close();
            },
            result => {
                // Illegal URL
                flagError( url );
            });
    });
}


// Set up
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("diggler-reload").onclick = onReload;
    document.getElementById("diggler-url").onkeyup = function(event) {
        if (event.keyCode === 13)
            onGo(event);
    };
    document.getElementById("diggler-go").onclick = onGo;
});
