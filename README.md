Neo Diggler is a small but powerful add-on for Firefox. It adds a customisable menu button next to the address bar with navigation and modification actions relevant to the current URL.
___
[![Build Status](https://travis-ci.org/fnxweb/neo-diggler.svg?branch=master)](https://travis-ci.org/fnxweb/neo-diggler)

The button's menu allows you navigate up through the current URL's parents, to visit the equivalent ftp URL, or to visit the site in [archive.org](https://archive.org/). A click on the menu button also provides a clear the location bar (something like the one in Konqueror) - useful for keyboard free browsing.

It also has the ability to add custom URL conversions/manipulations.

Neo Diggler is an adopted re-write of the original Diggler (https://addons.mozilla.org/firefox/118/) by Adam Lock, which although popular (it has spawned a number of Firefox-1.5 patches and clones) has sadly been neglected and, as of its last official release (0.9) only worked up to Firefox 1.0.*.

Here's an example for those tempted to try the custom tool-action feature: open the preferences, create a new action, then enter "Visit 'http' site" for the name, "^https:.*" for the expression, tick the "use as menu label" item, and finally "http://$h" in the action field. This will create a new entry when on https sites that will take you to the http version of the site. Try adding another that goes to the https from the http!

If you have any problems, please contact me directly (don't use the comments form as a poor man's forum), although I can't promise immediate results as I'm not [yet] that familiar with the code.
