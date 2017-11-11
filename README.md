# ember-component-view README

This creates a simple tree view of the open components and all discovered related component files for that component.

## Features

TODO need to fill this out.

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

None

## Known Issues

* Doesn't pre-populate the components when first loaded
* Loops through and opens each file in turn when hitting refresh
* May not open all of the components correctly the first time

## Building

In order to build this project you'll need to run 'vsce package'.  More info about that here:
https://code.visualstudio.com/docs/extensions/publish-extension

## Outstanding TODOs

* Add support for routes
* Add right click menu to open editors window
* Only show right click menu if recognized component
* Add support for composure phase 2 locations
* Add ability to lookup from a stylesheet
* handle special case of shared directory for scss files
* fix file structure for global stylesheets
* Have a single or double click open the component instead of a right click - make this configurable
* Clean up icons to look like the ones from VS
* Clean up top level icons - add color to light version
* Add save/reload capability on reopen working state
* Add logo for the extension
* Add tests
* Refactor (including splitting treeview from commands)
* Add support for partials - maybe not - they don't have JS associated
* Add ability to mark if a file is found in the wrong location
* Add ability to open a component from right clicking on a test

## Release Notes

Still in dogfooding stage.

### 0.1.0

Initial release of Ember-Component-View.

### 0.1.1

* Added component sorting
* Removed inclusion of scss files
* Added colors for dark theme components
* Tests show the type within the filename

### 0.1.2

* Added a right click menu in the tree view to open a component
* Added a right click menu in the extension to close a specific component
* Renamed the component to include the component engine and a full path form
* Fixed to handle the special case of the shared/shared-ext engine which contains an extra directory within the path structure
* Added stylesheet file(s) to the component tree

### 0.1.3

* Add support for platform/engines path
* Add support for extended test location
* Added support for more composure phase 2 file locations
* Fix the component name from engine@component to engine::component

### 0.1.4

* Add ability to right click on and test a component or a specific test file
* Refactored file searching to be more readable and easier to add new filepaths
* Add support for global stylesheets
