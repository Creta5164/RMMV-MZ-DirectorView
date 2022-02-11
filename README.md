# DirectorView

DirectorView is simple camera plugin.

Created by [Creta Park](https://creft.me/cretapark)  
<a href="https://www.buymeacoffee.com/CretaPark" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" width="120" height="26"></a>

This plugin is part of Creta Park's one of the projects contributing to the ecosystem of RPG Maker.

It's used in [Causality (因果律)](https://store.steampowered.com/app/1158720/Causality).

> Due to the original usage, there may be unsupported features.  
> Please check the specifications carefully before use.

# Specification

- ~~RPG Maker MV Only~~  
  ~~Since Causality (因果律) was based on the RPG Maker MV, so DirectorView is works with MV environment.~~  
  This problem was closed (See https://github.com/Creta5164/DirectorViewMV/issues/1)

- Lookahead view support  
  When the player starts moving, the camera moves ahead.  
  Player can change this option to turn on and off.

- Anchor based camera view  
  When a specific event or point is registered as anchor,
  camera will try to capture all of these anchors on the screen.

- Tweening camera move  
  When you execute a command, the camera can smoothly transition towards a specific position.

- Not supported map scroll feature  
  Most of Causality (因果律) maps are not looping maps except ending map.  
  It was partially works, because when player keep move then smooth damping logic smoothly removes it.

- Not implemented zoom feature  
  When we made Causality (因果律), mobile environment was extremely strict.  
  Because of that, our game resolution made in 320:180 pixels, so we don't mind zoom feature.

- Not supported Yanfly's options core  
  We used vanilla options window at moment, so it's not supported yet.

# Table of content

- 1\. [Preparation](#1-Preparation)
- 2\. [How to use](#2-How-to-use)
  - 2.1\. [Managing anchors](#21-Managing-anchors)
    - 2.1.1\. [Parameters](#211-Parameters)
    - 2.1.2\. [Adding fixed anchor](#212-Adding-fixed-anchor)
    - 2.1.3\. [Adding event anchor](#213-Adding-event-anchor)
    - 2.1.4\. [Removing anchor](#214-Removing-anchor)
  - 2.2\. [Camerawork transition](#22-Camerawork-transition)
    - 2.2.1\. [Parameters](#221-Parameters)
    - 2.2.2\. [From position to position](#222-From-position-to-position)
    - 2.2.3\. [To specific position](#223-To-specific-position)
    - 2.2.4\. [To anchor](#224-To-anchor)
    - 2.2.5\. [To event](#225-To-event)
    - 2.2.6\. [To player](#226-To-player)
  - 2.3\. [Managing camera system](#23-Managing-camera-system)
    - 2.3.1\. [Offset](#231-Offset)
    - 2.3.2\. [Lookahead offset](#232-Lookahead-offset)
    - 2.3.3\. [Use lookahead](#233-Use-lookahead)
    - 2.3.4\. [Seamless set player's position](#234-Seamless-set-players-position)
    - 2.3.5\. [Reset to default](#235-Reset-to-default)
- 3\. [Plugin options](#3-Plugin-options)
  - 3.1\. [Default offset X, Y](#31-default-offset-x-y)
  - 3.2\. [Default lookahead view](#32-default-lookahead-view)
  - 3.3\. [Default lookahead X, Y](#33-default-lookahead-x-y)
  - 3.4\. [Lookahead delay](#34-lookahead-delay)
  - 3.5\. [Lookahead duration](#35-lookahead-duration)
  - 3.6\. [Anchor transition duration](#36-anchor-transition-duration)
  - 3.7\. [Use accurate anchor check](#37-use-accurate-anchor-check)
  - 3.8\. [Option label : Use fixed camera](#38-option-label--use-fixed-camera)
- 4\. [Third-party library/sources notice](#4-Third-party-librarysources-notice)

# [1.][toc] Preparation

Add this plugin to your project.  
That's it!

In this instruction, examples are based on a map
created at twice the size of the default map (34 wide by 26 high).

# [2.][toc] How to use

DirectorView is anchor driven camera system,
each anchors have unique `anchor id` and `active range` data.  
Player character have an anchor with `id 0` by default.

## [2.1.][toc] Managing anchors

There's multiple way to manage anchors.  
Anchors can be assigned to events or made anchors anchored to specific points on the map.

### [2.1.1.][toc] Parameters

* `anchor id`  
   - An anchor's id is a unique identification number.
   - Anchors can be added or removed via this value.
   - When adding a new anchor, if you add it using an id that already exists,
     the existing anchor will be overwritten.
   - The camera follows the anchor with `id 0`, anchor `id 0` is always followed
     by the camera, with or without an `active range` value.  

* `active range`  
   - When the player character comes within the `active range` of an anchor,
     this anchor becomes active and the camera moves to show it on the screen with that anchor.
   - Conversely, outside this range the anchor is disabled,
     and the camera will no longer show that anchor on the screen.

### [2.1.2.][toc] Adding fixed anchor

Fixed anchor is an anchor that does not move in a specified position.  
This is useful when you use it for purposes,
such as capturing the scenery of a fixed place on the screen.

1. Create with map's note
   
   > *Template snippet : Note*
   > ```
   > DV_Anchor[fixed, <anchor id>, <x>, <y>, <active range>]
   > ```
   
   Right click map you want to add anchors, and click edit to open map properties window.  
   And write note follow syntax, example is like below :
   ```
   DV_Anchor[fixed, 1, 8.5, 6.5, 3]
   ```
   
   > If you create it through the map's notes,
   > anchors will always be created when the player enters the map.

2. Create with execute script event
   
   > *Template snippet : Script*
   > ```
   > DirectorView.AddFixedAnchor(<anchor id>, <x>, <y>, <active range>);
   > ```
   
   Create script event, and write like below :
   ```js
   DirectorView.AddFixedAnchor(1, 8.5, 6.5, 3);
   ```
   
   > You can use this when if you want specific time to add anchors.  
   > But, it'll be removed when leave the map.

> Both methods means 'add `Fixed anchor` at position(`8.5`, `6.5`)
> with `active range` is `3`, set anchor's `id` is `1`'.

### [2.1.3.][toc] Adding event anchor

Event anchor is an anchor that moves along with a specified event.  
This can be used like focusing on a character or an interactable element.

1. Create with event's note
   
   > *Template snippet : Note*
   > ```
   > DV_Anchor[<anchor id>, <active range>]
   > ```
   
   Open event that what you want to add anchors, and write at note section like below :
   ```
   DV_Anchor[1, 2]
   ```
   
   > Common mistake is happen here, you must write it at event's note section.  
   > It's not work with comment (note) event in contents section!
   
   > If you create it through the event's note,
   > anchors will always be created.  
   > Except, if event hasn't any available condition of pages.

2. Create with execute script event
   
   > *Template snippet : Script*
   > ```
   > DirectorView.AddMapEventAnchor(<anchor id>, <event id>, <active range>);
   > ```
   
   Create script event, and write like below :
   ```js
   DirectorView.AddMapEventAnchor(1, 1, 2);
   ```
   
   > You can use this when if you want specific time to add anchors.  
   > But, it'll be removed when leave the map.

3. Create with map's note
   
   > *Template snippet : Note*
   > ```
   > DV_Anchor[<anchor id>, <event id>, <active range>]
   > ```
   
   Right click map you want to add anchors, and click edit to open map properties window.  
   And write note follow syntax, example is like below :
   ```
   DV_Anchor[1, 1, 2]
   ```
   
   > If you create it through the map's notes,
   > anchors will always be created when the player enters the map.

> These methods means 'add `event anchor` to event that has same `event id` (1)
> with `active range` is `2`, set anchor's `id` is `1`'.  
> Except, there is no process of writing an `event id` parameter
> in the **first method (event's note)**, because it is added directly it's event through a note.

### [2.1.4.][toc] Removing anchor

As you add and use anchors, you will realize that there are times when you need to remove them.

> *Template snippet : Script*
> ```
> DirectorView.RemoveAnchor(<anchor id>);
> ```

Create script event, and write like below :
```js
DirectorView.RemoveAnchor(1);
```

This script event will remove the anchor with anchor `id 1` when the event is fired.

> This function temporarily remove anchors,
> but anchors that created with map's note or event's note are made
> every time player enter the map, so remind this when use them with care.

## [2.2.][toc] Camerawork transition

DirectorView has the camera the ability to move smoothly
from a specific point to a desired location you want.

In this instruction, examples are based on state
that an anchor with ID 1 and two event is created on the map.  
Also, all of the examples here assume trying at the second event.

> All the functions used here don't blocking the event from running
> until the camera finishes move to destination.  
> This is designed to not limit the direction the creator can express
> in the game while the camera is moving, so use it with care.

### [2.2.1.][toc] Parameters

* `from`  
  Where camerawork transition should start.

* `to`  
  Where camerawork transition should finish.

* `duration`  
  How long camerawork transition takes time to finish.  
  It's same as RPG Maker's time unit, so when it's set into 60 means it takes 1 second.

* `easing`  
  How camerawork moving behavior should have.  
  Most cases use it for move smoothly.  
  Visit [easings.net](https://easings.net) for more information about easing.
  
  > *Supporting easing list*
  > ```
  > Linear
  > EaseInQuad
  > EaseOutQuad
  > EaseInOutQuad
  > EaseInCubic
  > EaseOutCubic
  > EaseInOutCubic
  > EaseInQuart
  > EaseOutQuart
  > EaseInOutQuart
  > EaseInQuint
  > EaseOutQuint
  > EaseInOutQuint
  > EaseInExpo
  > EaseOutExpo
  > EaseInOutExpo
  > ```
  
  If you can't decide which is good transition eases, I'd recommend `EaseInOutQuart`.  
  That's mostly used it in Causality (因果律).

### [2.2.2.][toc] From position to position

> *Template snippet : Script*
> ```
> DirectorView.StartTween(<from x>, <from y>, <to x>, <to y>, <easing>, <duration>);
> ```

Transitions the camerawork from the position `from x, from y` to the position `to x, to y`.

Add script event in event like this :
```js
DirectorView.StartTween(8.5, 6.5, 25.5, 19.5, 'EaseInOutQuart', 60);
```

And add wait event with 60 frames after script event.  
When you start event, camera will start to transition from position(`8.5`, `6.5`) to position(`25.5`, `19.5`) smoothly in a second.

### [2.2.3.][toc] To specific position

> *Template snippet : Script*
> ```
> DirectorView.StartTweenFromCamera(<to x>, <to y>, <easing>, <duration>);
> ```

Transitions the camerawork from the current position of the camera
to the specified position `to x, to y`.

Add script event in event like this :
```js
DirectorView.StartTweenFromCamera(25.5, 19.5, 'EaseInOutQuart', 60);
```

And add wait event with 60 frames after script event.  
When you start event, camera will start to transition to position(`25.5`, `19.5`) smoothly in a second.

### [2.2.4.][toc] To anchor

> *Template snippet : Script*
> ```
> DirectorView.StartTweenToAnchor(<anchor id>, <easing>, <duration>);
> ```

Transitions the camerawork from the current position of the camera
to the specified anchor's position.

Add script event in event like this :
```js
DirectorView.StartTweenToAnchor(1, 'EaseInOutQuart', 60);
```

And add wait event with 60 frames after script event.  
When you start event, camera will start to transition to target anchor smoothly in a second.

### [2.2.5.][toc] To event

> *Template snippet : Script*
> ```
> DirectorView.StartTweenToEvent(<event id>, <easing>, <duration>);
> ```

Transitions the camerawork from the current position of the camera
to the specified event's position.

Add script event in event like this :
```js
DirectorView.StartTweenToEvent(1, 'EaseInOutQuart', 60);
```

And add wait event with 60 frames after script event.  
When you start event, camera will start to transition to event with id is 1 smoothly in a second.

### [2.2.6.][toc] To player

> *Template snippet : Script*
> ```
> DirectorView.StartTweenToPlayer(<easing>, <duration>);
> ```

Transitions the camerawork from the current position of the camera
to the specified player character's position.

Add script event in event like this :
```js
DirectorView.StartTweenToPlayer('EaseInOutQuart', 60);
```

And add wait event with 60 frames after script event.  
When you start event, camera will start to transition to player's character smoothly in a second.

## [2.3.][toc] Managing camera system

DirectorView provides various camera system functions.  
*Toggling lookahead, camera offset, etc...*

> The functions introduced here go into the save data of each game.  
> When loading saved data, saved value are also imported to it, so use it with care.

### [2.3.1.][toc] Offset

Offset is able to adjust cameras targeting position with specific values.

> RPG Maker's scroll map event also replaced to use it, so use this with care.

In script event, you can set offset value like this :
```js
DirectorView.Offset.X = 1;
DirectorView.Offset.Y = 1;
```

This will immediately set camera offset's X, Y into 1.  
Offset values unit is tile based, so 1 means 1 tile.

Also, as noticed above, this can be adjust with scroll map event.

You can manually adjust offset with transition with this script event :

> *Template snippet : Script*
> ```js
> DirectorView.StartOffsetMove(<x>, <y>, <duration>);
> ```

```js
DirectorView.StartOffsetMove(1, 1, 60);
```

This will transition the offset to the location that appended the x and y values with take a second.

### [2.3.2.][toc] Lookahead offset

Lookahead offset is a value that determines how far the camera will advance
by the direction the player is moving.

In script event, you can set lookahead offset value like this :
```js
DirectorView.LookaheadOffset.H = 0;
DirectorView.LookaheadOffset.V = 5;
```
*\* H stands for Horizontal, V stands for Vertical.*

This will set the horizontal offset to 0 and the vertical offset to 5.  
Moving horizontally doesn't move the camera horizontally,
but moving it vertically moves the camera forward 5 vertical spaces.

> This option will not visible when player turns on `Use fixed camera` option.

### [2.3.3.][toc] Use lookahead

Specifies whether to use the lookahead function.  
In script event, you can set use lookahead like this :
```js
DirectorView.UseLookahead = false;
//or
DirectorView.UseLookahead = true;
```
*\* true means enable, false means disable.*

If disable it, the camera will not move forward, but will follow the player smoothly.

> This option will not visible when player turns on `Use fixed camera` option.

### [2.3.4.][toc] Seamless set player's position

DirectorView by default resets all internal values
when you change the player character's position so the character is centered on the screen.

This may not be good in certain scenarios.  
This is because there are times when you want to create something like
abruptly changing the position of the player so that the environment is not noticed.

> *Template snippet : Script*
> ```
> $gamePlayer.setPosition(<x>, <y>);
> $gamePlayer.center(<x>, <y>, true);
> ```

You can use this code snippet in a script event to change the position of the player and camera together.

> When we made Causality (因果律), we didn't need party members,
> so I didn't work on party for this feature.  
> Changing locations with party members can look awkward.

### [2.3.5.][toc] Reset to default

When specifying the above numerical values, initial settings are sometimes necessary.  
Especially since these values are stored in the save, you will need it more.

Simply, create and write this snippet in script event.

```js
DirectorView.ResetToInitialPluginValue();
```

When executed it, adjusted value are restore to default.

# [3.][toc] Plugin options

## [3.1.][toc] Default offset X, Y

Initial camera offset.

Default value is `0`.

> This will be applied when starting new game or calling `ResetToInitialPluginValue`.

## [3.2.][toc] Default lookahead view

Initial Use lookahead value.

Default value is `true (ON)`.

> This will be applied when starting new game or calling `ResetToInitialPluginValue`.

## [3.3.][toc] Default lookahead X, Y

Initial Lookahead offset value.

Default value is `2.5`.

> This will be applied when starting new game or calling `ResetToInitialPluginValue`.

## [3.4.][toc] Lookahead delay

Lookahead transition is not started just starting move at time,
it'll be started when player moves over this amount of frames.

Same as RPG Maker's time unit (60 = 1s), default value is `15`.

## [3.5.][toc] Lookahead duration

Specifies how long the lookahead transition takes.

Same as RPG Maker's time unit (60 = 1s), default value is `30`.

## [3.6.][toc] Anchor transition duration

When active anchor count changed, camera will transition into new anchors center.  
This specifies how long camera move transition to new anchors center takes.

If turns into only player's anchor left then it'll use half of this value for transition.

Same as RPG Maker's time unit (60 = 1s), default value is `60`.

## [3.7.][toc] Use accurate anchor check

DirectorView by default handles the calculation of the anchor's active range using AABB.  
Specifies whether to use the option to calculate distances more accurately than this.  
When used, it changes from a rectangular to a circular range.

Default value is `false (OFF)`

## [3.8.][toc] Option label : Use fixed camera

Contents of the display text for `Use fixed camera` that will shows in the in-game options menu.

This option is a accessibility for players who may experience motion sickness due to camera movement.  
When enabled in-game, it uses the full RPG Maker style with no lookahead features.

# [4.][toc] Third-party library/sources notice

 - [gre/easing.js](https://gist.github.com/gre/1650294)


[toc]: #Table-of-content