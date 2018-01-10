// Neo Diggler popup control
//   manual.js
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

// Function to write to the clipbard
function setClipboardText( text )
{
    // Is there no easier way than this?
    let textarea = document.createElement("textarea");

    textarea.style.position = 'fixed';
    textarea.style.top = 0;
    textarea.style.left = 0;
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.padding = 0;
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';

    textarea.value = text;

    document.body.appendChild(textarea);

    textarea.select();

    try {
        document.execCommand('copy');
    } catch (err) {
        console.error("Neo Diggler was unable to copy '" + text + "' to the clipboard");
    }

  document.body.removeChild(textarea);
}


// Handle messages
browser.runtime.onMessage.addListener( (message, sender) => {
    if (message["message"] === "neo-diggler-clipboard")
        setClipboardText( message["text"] );
});


// Ask extension for clipboard text to set
browser.runtime.sendMessage({ message: "neo-diggler-clipboard-request" });
