/*:
 * @plugindesc simple camera plugin.
 * Version : Release 1.0.0
 * @author Creta Park (https://creft.me/cretapark)
 *
 * @help
 * 
 * |                                                                  |
 * |                    ===== DirectorViewMV =====                    |
 * |                                                                  |
 * | DirectorViewMV is simple camera plugin.                          |
 * |                                                                  |
 * | Please follow instructions in README.md                          |
 * | or visit http://github.com/creta5164/DirectorViewMV .            |
 * |                                                                  |
 * 
 * @param default-offset-x
 * @text Default offset X
 * @desc This can adjust center of camera. (X axis, 1 = 1 tile)
 * (This can adjust by map scroll event later.)
 * @default 0
 * @type decimal
 * 
 * @param default-offset-y
 * @text Default offset Y
 * @desc This can adjust center of camera. (Y axis, 1 = 1 tile)
 * (This can adjust by map scroll event later.)
 * @default 0
 * @type decimal
 * 
 * @param use-lookahead
 * @text Default lookahead view
 * @desc Enable or disable lookahead shot.
 * @default true
 * @type boolean
 * 
 * @param lookahead-h
 * @text Default lookahead H
 * @desc When player moves, camera will shots front of player
 * by this amount. (X axis)
 * @default 2.5
 * @type decimal
 * @min 0
 * 
 * @param lookahead-v
 * @text Default lookahead V
 * @desc When player moves, camera will shots front of player
 * by this amount. (Y axis)
 * @default 2.5
 * @type decimal
 * @min 0
 * 
 * @param lookahead-delay
 * @text Lookahead delay
 * @desc Lookahead shot transition will start from this amount.
 * (60 = 1s)
 * @default 15
 * @type number
 * @min 0
 * 
 * @param lookahead-duration
 * @text Lookahead duration
 * @desc Lookahead shot arrives by this amount of time.
 * (60 = 1s)
 * @default 30
 * @type number
 * @min 0
 * 
 * @param anchor-transition-duration
 * @text Anchor transition duration
 * @desc When player enters anchor area, camera will start
 * moving to adjusted position by this duration. (60 = 1s)
 * @default 60
 * @type number
 * @min 0
 * 
 * @param use-accurate-anchor-check
 * @text Use accurate anchor check
 * @desc Normally, this plugin uses AABB collision for anchors.
 * This option will use distance collision for check anchors.
 * @default false
 * @type boolean
 * 
 * @param string-use-fixed-camera
 * @text Option label : Use fixed camera
 * @desc This text will be displayed in option window.
 * @type text
 * @default Use fixed camera
 */

function DirectorView(saveContents) {
    
    DirectorView.Initialize.call(DirectorView, saveContents);
}

DirectorView.DIRECTION_VECTOR = {
    8: { X: 0, Y:-1 },
    2: { X: 0, Y: 1 },
    4: { X:-1, Y: 0 },
    6: { X: 1, Y: 0 },
    0: { X: 0, Y: 0 }
};

DirectorView.NOTE_PREFIX = 'DV_Anchor[';

DirectorView.Initialize = function(saveContents) {
    
    var options = PluginManager.parameters("DirectorViewMV");
    
    if (saveContents && saveContents.DirectorView) {
        
        saveContents = saveContents.DirectorView;
        
        DirectorView._TargetOffset    = saveContents._TargetOffset    || { X: 0, Y: 0 };
        DirectorView._LookaheadOffset = saveContents._LookaheadOffset || { H: 0, V: 0 };
        DirectorView.Offset           = saveContents.Offset           || { X: Number(options['default-offset-x']), Y: Number(options['default-offset-y']) };
        DirectorView.LookaheadOffset  = saveContents.LookaheadOffset  || { H: Number(options['lookahead-h']),      V: Number(options['lookahead-v'])      };
        DirectorView.UseLookahead     = saveContents.UseLookahead     || options['use-lookahead'] === 'true';
        
    } else {
        
        DirectorView._TargetOffset    = { X: 0,   Y: 0   };
        DirectorView._LookaheadOffset = { H: 0,   V: 0   };
        DirectorView.Offset           = { X: Number(options['default-offset-x']), Y: Number(options['default-offset-y']) };
        DirectorView.LookaheadOffset  = { H: Number(options['lookahead-h']),      V: Number(options['lookahead-v'])      };
        DirectorView.UseLookahead     = options['use-lookahead'] === 'true';
    }
    
    DirectorView.AnchorTargets = [ $gamePlayer ];
    DirectorView._AnchorActiveCount        = 1;
    DirectorView._AnchorTransitionDelay    = 0;
    DirectorView._AnchorTransitionDelayMax = Number(options['anchor-transition-duration']);
    
    DirectorView.AnchorTargetsCenter = DirectorView.GetAnchorsCenter();
    
    DirectorView.IsEventRunning = false;
    DirectorView.TransitionStartTime = 0;
    DirectorView.TransitionDuration  = 0;
    
    DirectorView._PreviousPosition     = { X: 0, Y: 0 };
    DirectorView._CurrentPosition      = { X: 0, Y: 0 };
    
    DirectorView._LookaheadDuration    = 0;
    DirectorView._LookaheadDurationMax = Number(options['lookahead-duration']);
    
    DirectorView._LookaheadDelay       = 0;
    DirectorView._LookaheadDelayMax    = Number(options['lookahead-delay']);
    
    DirectorView._LookaheadDirection   = 0;
    DirectorView._LookaheadOnGoing     = 0;
    
    DirectorView._OffsetTime           = 0;
    DirectorView._OffsetDuration       = 0;
    
    DirectorView.ForceEventMode        = false;
    
    DirectorView.Left = (Graphics.width /  $gameMap.tileWidth()  - 1) / 2;
    DirectorView.Top  = (Graphics.height / $gameMap.tileHeight() - 1) / 2;
    
    DirectorView._TweenPositionA = { X: 0, Y: 0 };
    DirectorView._TweenPositionB = { X: 0, Y: 0 };
    DirectorView._EasingFunction = null;
    
    DirectorView.SetPosition($gamePlayer.x, $gamePlayer.y);
};

DirectorView.ResetToInitialPluginValue = function() {
    
    var options = PluginManager.parameters("DirectorViewMV");
    
    DirectorView.Offset.X          = Number(options['default-offset-x']);
    DirectorView.Offset.Y          = Number(options['default-offset-y']);
    
    DirectorView.LookaheadOffset.H = Number(options['lookahead-h']);
    DirectorView.LookaheadOffset.V = Number(options['lookahead-v']);
    
    DirectorView.UseLookahead      = options['use-lookahead'] === 'true';
}

DirectorView.SetPosition = function(x, y, keepOffset) {
    
    DirectorView._PreviousPosition.X = x;
    DirectorView._PreviousPosition.Y = y;
    DirectorView._CurrentPosition.X  = x;
    DirectorView._CurrentPosition.Y  = y;
    
    DirectorView._AnchorTransitionDelay = 0;
    
    DirectorView.TransitionStartTime = 0;
    DirectorView.TransitionDuration  = 0;
    
    DirectorView._LookaheadOffset.H  = 0;
    DirectorView._LookaheadOffset.V  = 0;
    DirectorView._LookaheadDuration  = 0;
    DirectorView._LookaheadDelay     = 0;
    DirectorView._LookaheadDirection = 0;
    DirectorView._LookaheadOnGoing   = 0;
    
    if (keepOffset)
        return;
    
    DirectorView.Offset.X = 0;
    DirectorView.Offset.Y = 0;
    DirectorView._TargetOffset.X = 0;
    DirectorView._TargetOffset.Y = 0;
};

DirectorView.ClearAnchors = function() {
    
    //The reason it start with 1 is that the first is absolutely necessary.
    for (var i = 1; i < DirectorView.AnchorTargets.length; i++)
        DirectorView.AnchorTargets[i] = null;
};

DirectorView.Update = function() {
    
    var isEventRunning = DirectorView.ForceEventMode || $gameMap.isEventRunning();
    
    var previousAnchorCount = DirectorView._AnchorActiveCount;
    DirectorView.GetAnchorsCenter(DirectorView.AnchorTargetsCenter);
    var anchorChanged = previousAnchorCount !== DirectorView._AnchorActiveCount;
    
    var anchorTransitionDelayMax = DirectorView._AnchorTransitionDelayMax;
    if (DirectorView._AnchorActiveCount === 1)
        anchorTransitionDelayMax /= 2;
    
    var resultX = 0;
    var resultY = 0;
    
    var offsetX = DirectorView.Offset.X;
    var offsetY = DirectorView.Offset.Y;
    
    if (DirectorView._OffsetDuration > 0) {
        
        var durationNormal = DirectorView._OffsetTime / DirectorView._OffsetDuration;
        
        offsetX = offsetX + (DirectorView._TargetOffset.X - offsetX) * durationNormal;
        offsetY = offsetY + (DirectorView._TargetOffset.Y - offsetY) * durationNormal;
        
        DirectorView._OffsetTime++;
        
        if (DirectorView._OffsetTime >= DirectorView._OffsetDuration) {
                
            DirectorView.Offset.X = DirectorView._TargetOffset.X;
            DirectorView.Offset.Y = DirectorView._TargetOffset.Y;
            
            DirectorView._OffsetTime     = 0;
            DirectorView._OffsetDuration = 0;
        }
    }
    
    if (DirectorView.IsEventRunning !== isEventRunning) {
        
        DirectorView.IsEventRunning = isEventRunning;
        
        if (!isEventRunning)
            DirectorView._EasingFunction = null;
    }
    
    if (anchorChanged) {
        
        if (DirectorView._AnchorTransitionDelay > 0) {
            
            DirectorView._CurrentPosition.X = $gameMap._displayX + DirectorView.Left - DirectorView._TargetOffset.X;
            DirectorView._CurrentPosition.Y = $gameMap._displayY + DirectorView.Top  - DirectorView._TargetOffset.Y;
        }
        
        DirectorView.CapturePreviousPosition();
        
        DirectorView._AnchorTransitionDelay = anchorTransitionDelayMax;
        
        DirectorView._LookaheadDelay = 0;
        DirectorView._LookaheadDuration = 0;
    }
    
    if (DirectorView._EasingFunction) {
        
        if (DirectorView.TransitionDuration > 0) {
            
            var localTotal = DirectorView.TransitionStartTime + DirectorView.TransitionDuration;
            var tweenNormal = (localTotal - Graphics.frameCount) / DirectorView.TransitionDuration;
            
            if (tweenNormal > 0) {
                
                tweenNormal = DirectorView._EasingFunction.call(this, 1 - tweenNormal);
                
                var tweenX = DirectorView._TweenPositionA.X;
                var tweenY = DirectorView._TweenPositionA.Y;
                
                tweenX = tweenX + (DirectorView._TweenPositionB.X - DirectorView._TweenPositionA.X) * tweenNormal;
                tweenY = tweenY + (DirectorView._TweenPositionB.Y - DirectorView._TweenPositionA.Y) * tweenNormal;
                
                DirectorView._CurrentPosition.X = tweenX;
                DirectorView._CurrentPosition.Y = tweenY;
                
            } else if (!isEventRunning) {
                
                DirectorView._EasingFunction = null;
            }
        }
        
    } else {
        
        resultX = DirectorView.AnchorTargetsCenter.X;
        resultY = DirectorView.AnchorTargetsCenter.Y;
        
        var lookaheadOnGoing = DirectorView._LookaheadOnGoing;
        
        if (DirectorView.UseLookahead && DirectorView._AnchorActiveCount === 1 &&
            !isEventRunning           && $gamePlayer.isMoving()) {
            
            if (DirectorView._LookaheadOnGoing < 5)
                DirectorView._LookaheadOnGoing++;
        }
        
        else if (DirectorView._LookaheadOnGoing > 0)
            DirectorView._LookaheadOnGoing--;
        
        if (DirectorView._LookaheadOnGoing > 0) {
            
            if (DirectorView._LookaheadDelay < DirectorView._LookaheadDelayMax) {
                
                DirectorView._LookaheadDelay++;
                
            } else {
                
                if (DirectorView._LookaheadDuration < DirectorView._LookaheadDurationMax)
                    DirectorView._LookaheadDuration++;
            }
            
        } else {
            
            if (DirectorView._LookaheadDelay > 0)
                DirectorView._LookaheadDelay--;
            
            if (DirectorView._LookaheadDuration > 0)
                DirectorView._LookaheadDuration--;
        }
        
        if (DirectorView._LookaheadDirection !== $gamePlayer._direction) {
            
            DirectorView._LookaheadDirection = $gamePlayer._direction;
            DirectorView._LookaheadDelay    = 0;
            DirectorView._LookaheadDuration = DirectorView._LookaheadDurationMax / 2;
        }
        
        var lookaheadNormal = DirectorView._LookaheadDuration / DirectorView._LookaheadDurationMax;
        
        if (lookaheadNormal > 1)
            lookaheadNormal = 1;
        
        var lookaheadMultiplier = ConfigManager['DirectorView.UseFixedCamera'] ? 0 : 1;
        
        var lookaheadH = (DirectorView.LookaheadOffset.H * DirectorView.GetHorizontalNormal($gamePlayer._direction)) * lookaheadMultiplier;
        var lookaheadV = (DirectorView.LookaheadOffset.V * DirectorView.GetVerticalNormal($gamePlayer._direction)) * lookaheadMultiplier;
        
        var cameraMoveSpeed = 50;
        
        if (Input.isPressed('shift'))
            cameraMoveSpeed = 80;
        
        DirectorView._LookaheadOffset.H
            += (lookaheadH * lookaheadNormal - DirectorView._LookaheadOffset.H) / cameraMoveSpeed;
        
        DirectorView._LookaheadOffset.V
            += (lookaheadV * lookaheadNormal - DirectorView._LookaheadOffset.V) / cameraMoveSpeed;
        
        resultX += DirectorView._LookaheadOffset.H;
        resultY += DirectorView._LookaheadOffset.V;
        
        var smooth = (DirectorView._LookaheadDelay    + DirectorView._LookaheadDuration)
                   / (DirectorView._LookaheadDelayMax + DirectorView._LookaheadDurationMax);
        
        smooth = (1 - smooth) * 10;
        
        if (smooth < 1)
            smooth = 1;
        
        if (lookaheadMultiplier === 0)
            smooth = 1;
        
        DirectorView._CurrentPosition.X
            += (resultX - DirectorView._CurrentPosition.X)
            / smooth;
            
        DirectorView._CurrentPosition.Y
            += (resultY - DirectorView._CurrentPosition.Y)
            / smooth;
    }
    
    if ($gameMap) {
        
        if (DirectorView._AnchorTransitionDelay > 0) {
            
            var anchorTransitionNormal = 1 - DirectorView.EasingFunctions.Linear(
                DirectorView._AnchorTransitionDelay / anchorTransitionDelayMax
            );
            
            resultX = DirectorView._PreviousPosition.X
                    + (DirectorView._CurrentPosition.X - DirectorView._PreviousPosition.X)
                    * anchorTransitionNormal;
            
            resultY = DirectorView._PreviousPosition.Y
                    + (DirectorView._CurrentPosition.Y - DirectorView._PreviousPosition.Y)
                    * anchorTransitionNormal;
            
            DirectorView._AnchorTransitionDelay--;
        }
        
        else {
            
            resultX = DirectorView._CurrentPosition.X;
            resultY = DirectorView._CurrentPosition.Y;
        }
        
        resultX += offsetX - DirectorView.Left;
        resultY += offsetY - DirectorView.Top;
        
        //Adjusting pixels
        var pixelPerTileX = 1 / $gameMap.tileWidth();
        var pixelPerTileY = 1 / $gameMap.tileHeight();
        
        resultX = Math.ceil(resultX / pixelPerTileX) * pixelPerTileX;
        resultY = Math.ceil(resultY / pixelPerTileY) * pixelPerTileY;
        
        $gameMap.setDisplayPos(
            resultX,
            resultY
        );
    }
};

DirectorView.CapturePreviousPosition = function() {
    
    DirectorView._PreviousPosition.X = DirectorView._CurrentPosition.X;
    DirectorView._PreviousPosition.Y = DirectorView._CurrentPosition.Y;
};

DirectorView.GetHorizontalNormal = function(direction) {
    
    return direction === 4 ? -1
         : direction === 6 ?  1
         : 0;
};

DirectorView.GetVerticalNormal = function(direction) {
    
    return direction === 8 ? -1
         : direction === 2 ?  1
         : 0;
};

DirectorView.GetAnchorsCenter = function(out) {
    
    if (!DirectorView.AnchorTargets || DirectorView.AnchorTargets.length === 0) {
        
        DirectorView._AnchorActiveCount = 1;
        
        if (out) {
            
            out.X = $gamePlayer._realX;
            out.Y = $gamePlayer._realY;
            return;
        }
        
        return { X: $gamePlayer._realX, Y: $gamePlayer._realY };
    }
    
    if (DirectorView.AnchorTargets.length <= 1) {
        
        DirectorView._AnchorActiveCount = 1;
        
        if (out) {
            
            out.X = DirectorView.AnchorTargets[0]._realX;
            out.Y = DirectorView.AnchorTargets[0]._realY;
            return;
        }
        
        return { X: DirectorView.AnchorTargets[0]._realX, Y: DirectorView.AnchorTargets[0]._realY };
        
    } else {
    
        var sumX  = 0;
        var sumY  = 0;
        var count = 0;
        
        for (var anchor of DirectorView.AnchorTargets) {
            
            if (!anchor || anchor._pageIndex === -1)
                continue;
            
            if (count !== 0 && !DirectorView.IsContainsActiveRange(anchor))
                continue;
            
            sumX += anchor._realX;
            sumY += anchor._realY;
            
            count++;
        }
        
        DirectorView._AnchorActiveCount = count;
        
        if (out) {
                
            out.X = sumX / count;
            out.Y = sumY / count;
            return;
        }
        
        return { X: sumX / count, Y: sumY / count };
        
    }
};

DirectorView.IsContainsActiveRange = function(anchor) {
    
    if (!anchor._anchorActiveDistance)
        return false;
    
    if (!DirectorView.UseAccurateAnchorCheck) {
        
        var minX = anchor._realX - anchor._anchorActiveDistance;
        var maxX = anchor._realX + anchor._anchorActiveDistance;
        
        var minY = anchor._realY - anchor._anchorActiveDistance;
        var maxY = anchor._realY + anchor._anchorActiveDistance;
        
        return ($gamePlayer._realX >= minX && $gamePlayer._realX <= maxX) &&
               ($gamePlayer._realY >= minY && $gamePlayer._realY <= maxY);
        
    } else {
        
        var x = anchor._realX - $gamePlayer._realX;
        var y = anchor._realY - $gamePlayer._realY;
        
        var distance = Math.sqrt(x * x + y * y);
        
        return distance <= anchor._anchorActiveDistance;
    }
};

DirectorView.StartTween = function(aX, aY, bX, bY, easing, duration) {
    
    DirectorView.SetPosition(aX, aY, true);
    
    DirectorView._TweenPositionA.X = aX;
    DirectorView._TweenPositionA.Y = aY;
    DirectorView._TweenPositionB.X = bX;
    DirectorView._TweenPositionB.Y = bY;
    
    if (typeof easing === 'string')
        DirectorView._EasingFunction = DirectorView.EasingFunctions[easing];
    
    else if (typeof easing === 'function')
        DirectorView._EasingFunction = easing;
    
    DirectorView.TransitionDuration = duration;
    
    DirectorView.TransitionStartTime = Graphics.frameCount;
};

DirectorView.StartTweenFromCamera = function(x, y, easing, duration) {
    
    DirectorView.StartTween(
        $gameMap._displayX + DirectorView.Left, $gameMap._displayY + DirectorView.Top,
        x, y,
        easing, duration
    );
};

DirectorView.StartTweenToAnchor = function(id, easing, duration) {
    
    var anchor = DirectorView.AnchorTargets[id];
    
    if (!anchor) {
        
        console.warn("DirectorView : Anchor ID " + id + " is not exist.");
        return;
    }
    
    var x = anchor._realX;
    var y = anchor._realY;
    
    DirectorView.StartTweenFromCamera(x, y, easing, duration);
};

DirectorView.StartTweenToEvent = function(eventId, easing, duration) {
    
    var anchor = $gameMap.event(eventId);
    
    if (!anchor) {
        
        console.warn("DirectorView : Event " + eventId + " is not exist.");
        return;
    }
    
    var x = anchor._realX;
    var y = anchor._realY;
    
    DirectorView.StartTweenFromCamera(x, y, easing, duration);
};

DirectorView.StartTweenToPlayer = function(easing, duration) {
    
    DirectorView.StartTweenFromCamera($gamePlayer._realX, $gamePlayer._realY, easing, duration);
};

DirectorView.FinishTweenedView = function() {
    
    DirectorView._EasingFunction = null;
};

DirectorView.StartOffsetMove = function(x, y, duration) {
    
    if (duration <= 0) {
        
        DirectorView.Offset.X += x;
        DirectorView.Offset.Y += y;
        
        DirectorView._OffsetTime     = 0;
        DirectorView._OffsetDuration = 0;
        return;
    }
    
    if (DirectorView._OffsetDuration > 0) {
        
        DirectorView.Offset.X = DirectorView._TargetOffset.X;
        DirectorView.Offset.Y = DirectorView._TargetOffset.Y;
    }
    
    DirectorView._TargetOffset.X = DirectorView.Offset.X + x;
    DirectorView._TargetOffset.Y = DirectorView.Offset.Y + y;
    
    DirectorView._OffsetTime = 0;
    DirectorView._OffsetDuration = duration;
};

DirectorView.AddMapEventAnchor = function(id, eventId, activeDistance) {
    
    var target = $gameMap.event(eventId);
    
    DirectorView.AnchorTargets[id] = target;
    target._anchorActiveDistance   = activeDistance || 1;
};

DirectorView.AddEventObjectAnchor = function(id, eventObject, activeDistance) {
    
    DirectorView.AnchorTargets[id]    = eventObject;
    eventObject._anchorActiveDistance = activeDistance || 1;
};

DirectorView.AddFixedAnchor = function(id, x, y, activeDistance) {
    
    DirectorView.AnchorTargets[id] = {
        _realX: x,
        _realY: y,
        _anchorActiveDistance: activeDistance || 1
    };
};

DirectorView.RemoveAnchor = function(id) {
    
    DirectorView.AnchorTargets[id] = null;
};

DirectorView.TryParseNote = function(note, target) {
    
    if (!note || note === '')
        return;
    
    var prefixIndex = note.indexOf(DirectorView.NOTE_PREFIX);
    var prefixEndIndex;
    
    var parameters;
    var parametersCount;
    
    var rawParameters;
    
    while (prefixIndex !== -1) {
    
        prefixIndex += DirectorView.NOTE_PREFIX.length;
        
        note = note.substring(prefixIndex);
        
        prefixEndIndex = note.indexOf(']');
        
        if (prefixEndIndex === -1)
            break;      //syntax error
        
        rawParameters = note.substring(0, prefixEndIndex);
        
        parameters      = rawParameters.split(',');
        parametersCount = parameters.length;
        
        //Single event
        if (target) {
            
            switch (parametersCount) {
                
                case 1:
                    
                    DirectorView.AddEventObjectAnchor(
                        parseInt(parameters[0]),    //id
                        target                      //event
                    );
                    break;
                
                case 2:
                    
                    DirectorView.AddEventObjectAnchor(
                        parseInt(parameters[0]),    //id
                        target,                     //event
                        parseInt(parameters[1])     //activeDistance
                    );
                    break;
            }
            
            return;
            
        //Map's note
        } else {
            
            if (parameters[0] !== 'fixed')
                switch (parametersCount) {
                    
                    case 1:
                        
                        DirectorView.AddMapEventAnchor(
                            parseInt(parameters[0]),    //id
                            parseInt(parameters[1])     //eventId
                        );
                        break;
                    
                    case 2:
                        
                        DirectorView.AddMapEventAnchor(
                            parseInt(parameters[0]),    //id
                            parseInt(parameters[1]),    //eventId
                            parseInt(parameters[2])     //activeDistance
                        );
                        break;
                }
            
            else
                switch (parametersCount) {
                    
                    case 4:
                        
                        DirectorView.AddFixedAnchor(
                            parseInt(parameters[1]),    //id
                            parseInt(parameters[2]),    //x
                            parseInt(parameters[3])     //y
                        );
                        break;
                    
                    case 5:
                        
                        DirectorView.AddFixedAnchor(
                            parseInt(parameters[1]),    //id
                            parseInt(parameters[2]),    //x
                            parseInt(parameters[3]),    //y
                            parseInt(parameters[4])     //activeDistance
                        );
                        break;
                }
        }
        
        prefixIndex = note.indexOf(DirectorView.NOTE_PREFIX);
    }
};

/*
* https://gist.github.com/gre/1650294
* Easing Functions - inspired from http://gizma.com/easing/
* only considering the t value for the range [0, 1] => [0, 1]
*/
DirectorView.EasingFunctions = {
    // no easing, no acceleration
    Linear: t => t,
    // accelerating from zero velocity
    EaseInQuad: t => t*t,
    // decelerating to zero velocity
    EaseOutQuad: t => t*(2-t),
    // acceleration until halfway, then deceleration
    EaseInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
    // accelerating from zero velocity 
    EaseInCubic: t => t*t*t,
    // decelerating to zero velocity 
    EaseOutCubic: t => (--t)*t*t+1,
    // acceleration until halfway, then deceleration 
    EaseInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
    // accelerating from zero velocity 
    EaseInQuart: t => t*t*t*t,
    // decelerating to zero velocity 
    EaseOutQuart: t => 1-(--t)*t*t*t,
    // acceleration until halfway, then deceleration
    EaseInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
    // accelerating from zero velocity
    EaseInQuint: t => t*t*t*t*t,
    // decelerating to zero velocity
    EaseOutQuint: t => 1+(--t)*t*t*t*t,
    // acceleration until halfway, then deceleration 
    EaseInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,
    EaseInExpo: t => t===0 ? 0 : Math.pow(2,10*t-10),
    EaseOutExpo: t => t===1 ? 1 : 1-Math.pow(2,-10*t),
    EaseInOutExpo: t => t===0 ? 0 : t===1 ? 1 : t<.5 ? Math.pow(2,20*t-10)/2 : (2-Math.pow(2,-20*t+10))/2
};

DirectorView.SourceMethods = {};

DirectorView.SourceMethods.Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function(mapId, eventId) {
            
    DirectorView.SourceMethods.Game_Event_initialize.call(this, mapId, eventId);
    
    var note = $gameMap._mapId === mapId ? $dataMap.events[eventId].note : null;
    
    DirectorView.TryParseNote(note, this);
};

Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
    
    DirectorView.Update.call(DirectorView);
};

Game_Player.prototype.center = function(x, y, seamless) {
    
    if (!seamless)
        DirectorView.SetPosition(x, y);
    
    else {
        
        var x = $gameMap._displayX + DirectorView.Left;
        var y = $gameMap._displayY + DirectorView.Top;
        
        x = x - DirectorView.AnchorTargetsCenter.X - DirectorView.Offset.X;
        y = y - DirectorView.AnchorTargetsCenter.Y - DirectorView.Offset.Y;
        
        DirectorView.GetAnchorsCenter(DirectorView.AnchorTargetsCenter);
        
        DirectorView._PreviousPosition.X = DirectorView.AnchorTargetsCenter.X + x;
        DirectorView._PreviousPosition.Y = DirectorView.AnchorTargetsCenter.Y + y;
        DirectorView._CurrentPosition.X  = DirectorView.AnchorTargetsCenter.X + x;
        DirectorView._CurrentPosition.Y  = DirectorView.AnchorTargetsCenter.Y + y;
    }
};

DirectorView.SourceMethods.Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
    
    if (mapId !== this._mapId)
        DirectorView.ClearAnchors();
    
    DirectorView.SourceMethods.Game_Map_setup.call(this, mapId);
    
    if ($dataMap)
        DirectorView.TryParseNote($dataMap.note);
};

Game_Map.prototype.startScroll = function(direction, distance, speed) {
    
    var restX = DirectorView.DIRECTION_VECTOR[direction].X * distance;
    var restY = DirectorView.DIRECTION_VECTOR[direction].Y * distance;
    
    DirectorView.StartOffsetMove(restX, restY, ((1 - speed / 7) * 40) * distance);
};

Game_Map.prototype.isScrolling = function() {
    return DirectorView._OffsetDuration > 0;
};

DirectorView.SourceMethods.DataManager_createGameObjects = DataManager.createGameObjects;
DataManager.createGameObjects = function() {
    
    DirectorView.SourceMethods.DataManager_createGameObjects.call(this);
    DirectorView();
};

DirectorView.SourceMethods.DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
    
    DirectorView.SourceMethods.DataManager_extractSaveContents.call(this, contents);
    DirectorView(contents);
    DirectorView.ClearAnchors();
};

DirectorView.SourceMethods.DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
    
    var contents = DirectorView.SourceMethods.DataManager_makeSaveContents.call(this);
    
    var directorView = {
        _TargetOffset:    DirectorView._TargetOffset,
        Offset:           DirectorView.Offset,
        _LookaheadOffset: DirectorView._LookaheadOffset,
        LookaheadOffset:  DirectorView.LookaheadOffset,
        UseLookahead:     DirectorView.UseLookahead
    };
    
    contents.DirectorView = directorView;
    
    return contents;
};

DirectorView.SourceMethods.ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function() {
    
    var config = DirectorView.SourceMethods.ConfigManager_makeData.call(this);
    
    config['DirectorView.UseFixedCamera']
        = ConfigManager['DirectorView.UseFixedCamera'] === undefined
        ? false : ConfigManager['DirectorView.UseFixedCamera'];
    
    return config;
};

DirectorView.SourceMethods.ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function(config) {
    
    DirectorView.SourceMethods.ConfigManager_applyData.call(this, config);
    
    ConfigManager['DirectorView.UseFixedCamera']
        = config['DirectorView.UseFixedCamera'] === undefined
        ? false : config['DirectorView.UseFixedCamera'];
};

DirectorView.SourceMethods.Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
Window_Options.prototype.makeCommandList = function() {
    
    console.log(PluginManager.parameters("DirectorViewMV"));
    
    this.addCommand(
        PluginManager.parameters("DirectorViewMV")["string-use-fixed-camera"],
        'DirectorView.UseFixedCamera'
    );
    
    DirectorView.SourceMethods.Window_Options_makeCommandList.call(this);
};

DirectorView.SourceMethods.Window_Options_statusText = Window_Options.prototype.statusText;
Window_Options.prototype.statusText = function(index) {
    
    var symbol = this.commandSymbol(index);
    var value  = this.getConfigValue(symbol);
    
    switch (symbol) {
        
        default: return DirectorView.SourceMethods.Window_Options_statusText.call(this, index);
    }
}