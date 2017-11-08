# ember-component-view README

This creates a simple tree view of the open components and all discovered related component files for that component.

## Features

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

## Outstanding TODOs

* Add support for composure phase 2 locations
* Add support for global stylesheets - will need to use the baseEngine to then generate the global and extended versions of the engine
* Add ability to lookup from a test
* Add ability to lookup from a stylesheet
* Add right click menu to open editors window
* Only show right click menu if recognized component
* Have a single or double click open the component instead of a right click
* Clean up icons to look like the ones from VS
* Clean up top level icons - add color to light version
* Add save/reload capability on reopen working state
* Add logo for the extension
* Add tests
* Refactor
* Can reduce all the searched file paths as they are generic enough to be handled correctly within the given search paths
* Add support for routes
* Add support for partials
* Add ability to right click on and test - simple filter by filename initially


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
