## Version 13.01

Added v13 compatibility

## Version 12.04

Fix issue with code to fix a DSD issue.

Fixed issue with strange repositioning bug.

Attempting to cut down on the number of people having issues while using an older version of D&D.

## Version 12.03

Tried to fix the issue with Dice So Nice not revealing roll.

Fixed evaluate async warning

Fixed updating the token bar when an item is equipped that might change the displayed Tokens

Fixed issue where Tokenbar could be dragged off the screen

Added token image scaling

Fixed issue with Dice So Nice hiding tokenbar rolls when the dice are rolling

Fixed issues with Burning Wheel system and an override to how handlebar grouping is added

Added the roll request alert sound to use a filepicker button

Fixed a warning when using the Die class directly

Fixed an issue that the D&D5e system introduced by changing a setting without providing any backward compatibility.

## Version 12.02

Fixed issues when using Dice So Nice and figuring out when to reveal the dice

Fixed double rolling of Dice So Nice in D&D 5e

Fixed some more v12 deprecation issues

Removing natural attacks and effects from the after combat Loot

Fixed how information for lootables is collected

Fixed initial Tokenbar positioning

Fixed issue when deleting a token when no panning is disabled

Fixed issue that the latest version of PF2e introduced when getting skills.

## Version 12.01

v12 compatibility

Fixed issue with items being created that aren't attached to an actor

Fixed issue that was preventing currency from being added to an Enhanced Journal Loot entry

Added the option to allow owned vehicles to be moved during combat.

## Version 11.17

Fixing a silly mistake that made redirecting rolls no longer work

Added the option to use handlebars when redirecting rolls

## Version 11.16

Fixed issue when trying to call a requested roll or contested roll when there's no event triggering it.

Hopefully fixed issues with D&D5e when requesting rolls, or at least until they make another breaking change.

Returning tokens properly to MATT when requesting a roll or contested roll.

Added a setting to restore the tokenbar to the last collapsed or expanded state.

Fixed issue when trying to open a context menu and the token in question no longer has a viable actor.

Fixed issue with inline requested rolls that have a space in the requested roll name

Updated the tokenbar when includng actors and the user updates their preferred actor

Fixed issue with checking to see if a roll is a success if the roll doesn't exist.

## Version 11.15

Fixing MATT integration, setting the current tokens with the tokens that were selected.

Fixing 5e 3.0 issues that were introduced by system changes.

## Version 11.14

Fixing spacing issues

## Version 11.12

Fixed issue with ' being used in the flavour text was breaking saved macros

Attempted to fix issues D&D5e introduced with their latest version and rolling from chat cards.

Added the option to use the party token in PF2e to roll for the party

Fixed sorting of entries on the tokenbar, thank you tonyrobots for pointing that out

Fixed issue with long actor names pushing the roll button off the chat card

Fixed XP calculation issue in PF1e

## Version 11.11

Fixing issue with using the PF2e Party Stash after a combat for loot

## Version 11.10

Added the PF2E Party Stash as an option for assigning Loot

Added auto closing to the lootable dialog when loot has been assigned.

Fixed issue with the calculate gold by CR button continually adding to the gold value.

Fixed issue in PF2e assigning items and trying to remove the equipped option.

Added loot image to the loot token created for Item Piles.

Fixed issue when getting the system currency.

Fixed issue with saving throws having duplicate tokens listed

Fixed issue where a blank token in a contested roll request was removing the requested roll value

Fixed issue when after combat the XP and Lootable dialogs weren't showing side by side.

Fixed issue not being able to select a loot image properly

Updated the MATT integration to use handlebar notation

Fixed DnD5e and SW5e rolls to use custom tool rolls properly

Fixed perception warning in PF2e

## Version 11.09

Fixed issue with xp resetting after setting acustom value.  And added button to automatically recalculate.

Added hooks when a roll is requested or a roll is updated

Added button to copy request roll code to clipboard instead of creating a new Macro

Added setting to automatically bypass the roll dialog when clicking on the dice roll.

Fixed issue when adding tokenbar tokens to requested roll

Added additional selection buttons to the saving throw chat message to select critical success and critical failure rolls.

Fixed issue with determining which tokens have passed the saving throw.

Fixed issue in PF2e where effects weren't updating the tokenbar properly

Fixed issue with the vertical display of the tokenbar.

Changed the setting so it's clearer that you can select the orientation of the tokenbar.

Fixed issues with changing the size of tokens.

Set tokensize setting to be client based rather than world based.

Added token counts to the assign xp dialog so you can see how many monsters are involved and how many players.

Added the option to hide the movement buttons on the tokenbar.

Fixed issue with SWADE rolls.

## Version 11.08

Fixed issue with last token option when requesting a saving throw

Fixed issue with increasing the coutn of dice rolls

Fixed issue where GM controlled characters were showing for Players

## Version 11.07

Fixed an issue when requesting a roll

## Version 11.06

Fixed issue when assigning xp with no tokens selected, selecting all the monsters on the scene.

Added the option to assign xp to friendly npcs.  Thank you Crabgor

Added the option to use the initial actors selected when the assign xp dialog opened.  So if you accidentally cleared the tokens, you can revert back to the original tokens.

Fixed issue where requesting a new roll wasn't overwriting the focussed roll properly.

Fixed issue detecting when a critical or fumble was actually rolled.

Added the option to select a colour for the stats that are displayed.

Fixed issue if stats data is corrupted.  Thank you kagangtuya-star

Fixed issue with the lootsheet currency.

Added the option to change the image for the loot token.

Added the option to increase the number of dice being requested for a roll

Fixed an issue finding the correct request when fast forwarding a request that has multiple available rolls.

Added code to handle degrees of succes when an actor has rules to change degrees of success.  Thank you roi007leaf

Added the option to filter out duplicate actors on the Tokenbar.  Just in case a player decides to use something like Mirror Image.  Clicking on the actor image on the tokenbar will cycle through multiple tokens.

Fixed issue when trying to pan to a token when the actor has no token on the canvas.

Fixed issue when double clicking on a token on the tokenbar.

Fixed issue with the dice tooltip not formatting correctly in PF1.

Added XP calculations for PF1

Fixed issue with SWADE rolls. Thank you jseeley150

Fixing issues with lootables currency in PF1

Fixed issues with MATT integration.  Request list labels and actions label have been fixed.

## Version 11.05

Fixed some ineffecient code

Updated the code that uses the Party characters to respect the minimum player permission 

## Version 11.04

Added the option in Pathfinder 2e to use the Party List instead of the usual Tokenbar tokens.

Fixed issues with the tokenbar context menu and tooltip when using Actors on the bar.

Fixed issue with PF2e when a skill was requested that doesn't exist.

Fixed issue with SWADE getting skill rolls.

## Version 11.03

Fixed issue with contested roll when request doesn't exist.

Fixed issue with contested roll when controlling a token that has no associated actor.

Added modifier value when selecting multiple rolls.

Fixed issues with lootables when removing the equipped flagged

Fixed issue when creating a loot sheet that's not MEJ or ItemPiles

Added the option to add hero points or inspiration to the context menu on the tokenbar.

Fixed issue when collecting the tokens to use for a request roll

Fixed issues with determining XP in the PF2E system.

Removed the xp label when assigning xp and MTB can't determing individual XP.

Added a skull icon beside monsters that have been defeated when assigning XP.

Switched to adding and removing actors from the creature list when assigning XP, rather than disabling them.

## Version 11.02

Removed the option of using a group actor for a contested roll.

Added integration with the Anonymous module to hide the names of chat card NPCs.

Fixed issues with showing ghost rolls using Dice so nice.

Fixed issues where dice tooltips were being shown to players that shouldn't have acces to that information.

Added the option to reroll a dice result, using the context menu.

Fixed issue where clicking on the roll result was expanding the tooltip.

Fixed issue where refreshing when a tooltip was open would open all tooltips.

Fixed issue with the roll result check and x were being shown before the dice roll completed.

Added support for rolling when the canvas is disabled.

Fixed an issue where the dice roll wouldn't complete properly.

Fixed issue with the stats if they were somehow saved as not an array.

Fixed issue with the player display showing the check and x in a small font.

Fixed issue where xp was calculating with inactive monsters.

Fixed issue where deactivating a monster wasn't recalculating the xp.

Added support for the Anonymous module when requesting rolls or contested rolls.

Added the option to hide npc names in a requested roll.

Fixed issue with dice so nice not showing the ghost dice when the roll should be shown rolling but not displayed.

Fixed issue where the owner of a character wasn't seeing the roll made by a different owner of the character.

Added clarification of the edit stats dialog, that they're specifc for a character, but there's a generalised version in the settings.

Added option to hide combatants after being converted to lootable.

Fixed issue with lootables not altering all the tokens that have been looted.

Fixed issue where lootables wouldn't work unless Monk's Enhanced Journal was also installed.

Fixed issue if a lootable character didn't have currency when trying to add currency.

Fixed issue with clicking on the dice roll sometimes causing the dice tooltip to open.

Fixed issue with dice tooltip in the starfinder system.

Added the option to display player characters on the tokenbar even if they aren't on the scene.

Added the option to drag and drop from the tokenbar to bring a player character onto the scene.

Added the option to only get the current tokens from players that are online.

Removed the dependency to the sceneView hook, since that was causing Tokenbar to be false flagged for issues.

Updated the function that collects tokens to turn group actors into their respective actors.

Added support for Twilight 2000 system

Remove the Tile option when selecting an entity in Monk's Active Tiles.

Fixed the assign xp dialog to show how much each monster is contributing for xp.

Fixed the xp for party sizes other than 4 in PF2E.

Fixed the default requested roll to be perception.

Fixed deprecated string value for perception in PF2E.

## Version 11.01

Added v11 compatibility.  ** This unfortunately means I had to remove Initiative requests as Foundry has locked me out of that specific roll **

Fixed the attribute editor to have a better height.

Fixed spacing when an icon is not specified for an attribute.

## Version 10.12

Fixed issue where receiving xp would lock up Foundry

Added the option to resize the edit stats dialog.

Fixed issue with selecting the root folder to create a loot entry.

Fixed issue with creating a Item Piles entry.

Added option to filter icons when picking a stat icon.

## Version 10.11

Allow drag and drop of items to the assign loot dialog if there are no items there.

Fixed issues with the configure settings when Enhanced Journal is not installed

Use the last roll when using the key press to open the request roll dialog.

Fixed support for changes with Active Tiles.

Fixed issue with checking XP when there are two GMs in the game.

Fixed issues with some systems when checking for tools, if the actor isn't allowed items.

Fixed issue with default loot image.

Fixed issue with group actors and assigning XP.

## Version 10.10

Fixed issue where an alternate requested roll wasn't being reported correctly to the chat message

Fixed issue with Item Piles creation, made sure the items and currency are added properly and that the token actor and sidebar actor match up.

Attached custom actor stats to the actor instead of the token.

Added the option in settings to show stats that are undefined instead of hiding them.

Fixed issue with checking movement when a player that's been assigned ownership to a token no longer exists in game.

Moved Redirect Request Results from logic to Tokenbar group.

Allowed the xp button to be shown in Pathfinder 1.

## Version 10.9

Added the option to set the attribute icon to blank

Fixed lootables so that currencies that didn't exist aren't added to.

Added the option to use the currencies specified in Monk's Enhanced Journal if using that module for your loot.

Added the option to select tokens from either the players or the token on the token bar when requesting a roll.

Added the option of specifying a roll code when creating an inline roll for a journal entry.  This way tokenbar can distinguish between a Strength saving throw and a regular Strength roll.

Fixed issue when requesting a contested roll from an inline link in a Journal Entry.

Fixed issue where inline links would open a roll request twice.

Fixed issues with SFRPG, xp will show again, and calculating xp won't throw an error.

Fixed issue with SW5e, calculating xp won't throw an error.

## Version 10.8

Removing debug code so that the tokenbar can be repositioned properly.

## Version 10.7

Changed the assign xp dialog to allow GMs to select which creatures get used to computer the XP.

Also updated the assign xp dialog to be able to select both creatures and players to include in the dialog.

Fixed issues with contested rolls to using the correct notation.

Fixed issues with the contested roll not updating properly.

Added the option to only use defeated tokens when calculating lootables.

Fixed the way loot name is generated.

Fixed issues with Item Piles support.

Changed saving throws to allow for selecting skills that not all actors have.  This allows for things like thieves' tools to be included in a request with a dexterity skill check.

Added the additional requested rolls to the chat card title.

Added the request selected by the player to the actor list on the request roll chat card.

Added the option to select multiple request using the meta key for Mac users.

Fixed issues calculating the group DC.

Fixed issue with the tokenbar starting too far to the left when it's first used.

Added temporary hp to the tokenbar display bars.

Prevented the whisper option on the tokenbar context menu from showing if you own the actor.  So you don't whisper to yourself.

Switch to the chat tab when selecting whisper from the context menu.

Added the option to exclude an actor from the context menu.

Fixed issue where combat movement wasn't being changed is you had an assisstant GM.

Fixed issues with getting roll information from an Initiative request.

Fixed issues with showing lootable convert option in the settings when using Pathfinder 2e.

Updated the message when an actor is available to level up, to have a button to press to handle leveling up the actor.

Added check for level up when the actor is updated, not just from the assign xp dialog.

Fixed issues when changing a private request roll message to public, and back.

Fixed issues with getting an actors level.  Thank you JDCalvert for the heads up.

Fixed issues with how PF2E handles requested rolls.

Fixed issues with the edit stats dialog overflow when there are a lot of stats selected.

## Version 10.6

Added a check to make sure adding XP only adds to tokens that are linked to an Actor.

Fixed issues calculating XP values from Actors that didn't have a max or value for xp.

Removed 'melee', 'condition' and 'spellcastEntry' from items lootable will collect.

Fixed issues collecting currency from Actors in PF2E.

Fixed issue changing if you want the loot entry to be automatically opened.

Fixed issue with Lootable name

Fixed issue with getting the default Loot Entry name.

Fixed issue with the loot being added to loot entries not correct, and not able to be assigned to players.

Fixed issues with saving throws when a token with tools is addded or removed from the Dialog.

Added option to use handlebars in flavor field when requesting rolls in MATT.

Added the option to select lore rolls in PF2E.

Fixed resizing issues with the saving throw dialog.

## Version 10.5

Fixed issue with Contested Rolls not responding to the ctrl or alt keys.

Added the option for Contested Rolls to have the advantage and disadvantage buttons.

Added the option to use the Meta key to target tokens using the tokenbar.

Prevented players from double-clicking on tokens to request a roll if they aren't allowed to request rolls.

Fixed incompatability with MidiQol.

Fixed issue with Tormenta 20 system.  Thank you Lander13

## Version 10.4

Fixed issue with contested roll not rendering the correct ids

Added the option to show an advantage and disadvantage button in addition to the regular roll button.  For DnD5e.

Fixed issue with initiative requested rolls not having the correct roll data.  This is because the data was faked, since the correct data is never passed through.

Fixed issue refreshing tokenbar when the actor ownership is changed

Fixed issue with updating token bar when active effects are altered.

Added a setting for player permissions required to view tokens on the tokenbar.  This means you can set other players permission to observer or limited so the token will appear on all players tokenbar.

Fixed issue witht he tokenbar wandering to the right anytime it was expanded and collapsed.

Added the option to alt click on a token while in no movement mode to individually assign movement.  This way you can let each player move one by one.

Made the grabbable status a little more noticeable when you're attempting to grab a message.

Fixed issue with the name shown for the loot entity.

Fixed issue with the default requested roll in dnd5e.

Fixed issues with experience point in ds4.

Allowed pf1 to grab requested roll messages.

Fixed issue with the default loot entity name.

Reworked the lootable dialog so that you have more control over what items are being added.  It will now group like items together to conserve space, so if you have multiple skeletons, instead of adding an item for each monster it will just show one set of items, with an increased quantity.  You can also in the dialog set where the loot is going, so in the settings you can set the default value, but you can change this whenever you create loot.

## Version 10.3

Fixed issues with calculating xp in pf2e

Fixed issue with assigning xp that's not a number

Fixed issue with contested rolls not getting the correct request value.

Fixed issue with getting currency when compiling lootables after a combat

Fixed issue with lootable generated for Monk's Enhanced Journal deleting after the first item is updated.

Added the option to start a combat if initiative is requested and no combat is available.

Fixed issue with finding the owner of a token.

Fixed issue where rolling initiative was throwing an error in pf1.

Fixed issue with Saving Throw when no default request has been determined.

Fixed issue where active effects aren't updating the token bar values

Remove tokens added by multilevel tokens.

Only notifying once on movement change if there's more than one GM logged in.

Added the option to use tagger when selecting tokens for a roll request

Fixed issue with pf1 when skipping the dialog is requested.

Moved the inline request roll feature from Monks Enhanced Journal to this module, since it's the one doing the work.

## Version 10.2

Updated the assign XP dialog to allow you to customise the actors that are being assigned XP.  It will remember the last tokens to assigned XP to, can use the current combats tokens, or you can drag and drop and actor onto the dialog to add them to the list.

Also added the option to auto assign XP instead of having to click the add button in the chat card.

Updated the add xp chat card to highlight that the add button is clicakble as it gets a little hidden.

Updated request roll and contested roll to be able to request multiple options.  So if you need to check for either an athletics or an acrobatics roll, you can do that.  Contested Roll does not offer that option in the interface, but can be configured in the API and run from a macro.

Updated the request roll chat message to allow them to be popped out.

Updated the lootable dialog to only clear if the confirm button is visible.  This shouldn't have been an issue, I just wanted to make sure it wasn't going to be one.

Added the option to collapse the tokenbar icons in case ou want more screen room, or don't want to see the player icons.

Fixed an issue updating the selection when changing in the settings how loot is distributed.

Fixed an issue introduced by Foundry when serializing the Roll in the Chat card.

## Version 10.1

Fixed issues with assigning xp, leaving the old xp visible on disabled actors.

Switched the setting to select how to deliver lootables to be more inline with how Enhanced Journals is displaying them.

Fixed lootables to work correctly in v10 and with Enhanced Journals.

Fixed issues when switching scenes and refreshing tokens.

## Version 1.0.71

Fixed an issue that the latest v10 update broke.

## Version 1.0.70

More v10 fixes

## Version 1.0.69

Added v10 support.

## Version 1.0.68

Update assign xp so it only adds actors that are owned by players.

Fixed issue with adjusting xp manually

Fixed issue with contested roll macro command when tokens don't exist.

Fixed issue with contested roll and saving throw, passing in a callback function.

Added setting to allow players to roll.

Fixed issue with finding default tokens for contested roll

Fixed issue with PF2E and the token bar dropdown no longer being shown.

Fixed issue with contested roll Active Tile command.

Added assign xp action to Active Tiles.

## Version 1.0.67

Fixed blind rolls being shown when using Dice So Nice.

Fixed issue when hover over was showing the results even though they were supposed to be hidden.

Added the option to drag and drop stats.

Fixed issue with finding tokens when passing null to request roll.

Added the option to set the resolution of the token bar images.

Fixed inspiration positioning when using vertical orientation.

Restricted the keys used to open a request roll.

Fixed issue when using Active Tiles to request a contested roll.

## Version 1.0.66

Fixed an issue with Contested Roll trying to find a winner when not all rolls were received.

Fixed an issue where editing stats was crashign in PF2E.

Fixed an issue in lootables where it wasn't getting the correct value for currency

Added the option to pass in the name property to the Request Roll macro and have it replace the name of the roll being rolled.

Switched the request roll keyboard shortcut from using Shift to Alt Shift

Fixed issue with tokenbar trying to find tokens when no tokens were passed to it.

Changed the Active Tiles action to clarify Global Movement rather than just Movement.

Changed the contested roll chat message to display the buttons the same way the requested roll does.

## Version 1.0.65

Fixed an issue with the chat card buttons displaying strangely

Fixed an issue with the sounds still playing when the GM has turned them off for self rolls

Fixed an issue with lootables when currency is involved.

## Version 1.0.64

Added checks for saving throw and contested roll request to make sure the roll mode is valid

Added code to use silent and fastForward when requesting a Contested Roll, thank you thatlonelybugbear

Added the contested roll to the actions that can be called using Active Tiles.

Added the option to not play sounds when it's just the GM rolling

Added Item Piles support for TokenBar

Fixed some issue when converting to lootables

Added the option to show the DC to layers when requesting a saving throw

Saving a requested roll to a macro will now use Token names, so if the token is destroyed, or if you're on a diferent scene you can still use the macro.

Added the option to use degrees of success, thank you rlach

Added a little bit of clarity as to how tokenbar is selecting tokens.  So you can turn on debugging now and see whay tokens are getting included and excluded.

Fixed whisper to from the tokenbar for layers that have a space in their name.

Fixed issue where double-clicking a token on the tokenbar was also registering as a single click.  I just found it a bit annoying.

Added the option to change what actions are performed when double clicking the token on the tokenbar.

Added key bindings so you can request a roll by pressing Alt-R and a GM only Roll by pressing Shift-R.

Fixed an issue where the tokenbar would disappear when you changed scenes.

Fixed an issue when trying to grab a saving throw chat message.

## Version 1.0.63

Fixed issue where Lootable currency was being added as a string rather than as numbers.

Fixed issue where a null value in the currency field was causing lootables to ignore that it was there.

Fixed issue with the name change of DnD4e Beta.

Fixed issue with removing second token in contested roll.

Updated integration with Active Tiles.

## Version 1.0.62

Fixed an issue with macros generated not gettign the correct roll mode when calling a requested roll.

Added Save to Macro for contested rolls.

Fixed an issue when determining if there are previous loot entity when creating the new Loot Entity name.

Fixed up the action text when converting so that it accurately reflects what's happened.

Added the option to open the loot entity once the items have been looted.

Fixed an issue where adding a token to a saving throw was failing.

## Version 1.0.61

Fixed issues with converting lootables from combat.

Fixed issues with reverting lootables.

## Version 1.0.60

Fixed issue with additional keys not being passed through properly

Updated Lootables so you can now specify how much coin each actor is providing, as well as which items are being included in looting.
It will now also use Enhanced Journals to create a lootable entity.

Added the option to save a Request to a macro.

Reordered the settings menu.

Fixed issues with assigning XP in multiple systems

## Version 1.0.59

Fixed issues with using Ctrl or Alt to add Advantage or Disadvantage to a roll.

Fixed issues with editing custom stats

Fixed issues with Lootables not changing to Loot Sheet properly.

Fixed an issue when a scene has no Tokens attached to it, or if there's no scene added.

Wrapper Scene.prototype.view properly.

Added option to specify Advantage and Disadvantage with the API when requesting rolls.

Added Current Tokens to the options when selecting an entity for requesting a roll.

Added the Resume anchor when deciding what to do with tokens that passed or failed, once those are dealt with you can now resume actions with all tokens.

## Version 1.0.58

Fixed issue with vertical alignment and no tokens.  The tokenbar shrunk improperly.

Added a line between Target Token and Free Movement in the context menu when clicking on a token.

Fixed an issue that was preventing the module from stopping tokens from moving.

Changed the Active Tiles integration so that you can select global movement rather than leaving the entity blank to indicate a global change.

Updated the code with Active Tiles upgrades

Changed the default of allow movement after turn to false.

Fixed up issue with PF2E rolls.

## Version 1.0.57

Fixed an issue with combat turns in v9.  Refrences to the token involved have changed.

Clarified what's happening if you try and convert lootables but no loot sheet is selected.

## Version 1.0.56

When the saving throw request is closed, informing Active Tiles that the state information is no longer needed.

Moved the token indicators higher in the z-order so they appear above the bars.

Added the option to change the global movement state if no entity is selected.

Added flavor text to the request roll via Active Tiles.

## Version 1.0.55

Added option to return the chat message created when prompting to assign xp

Converted contected roll to use an array of tokens like saving throw does, to maintain some consistency

Recentered the contested roll dialog.

Fixed issue with contested rolls not working from the API, thank you p4535992 and thatlonelybugbear

Added option to specify if individual tokens can be fast forwarded or if they have advantage or disadvatage, in both contested and requested rolls.  This means there's a new way to request these rolls, instead of an array of strings or token ids you can now specify an array of objects.  So `game.MonksTokenBar.requestRoll([{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}], {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'})` is now possible, to give advantage to Thoramir and to auto roll Toadvine.

Added option for flavor text with contested and requested rolls, thank you thatlonelybugbear

Changed how the sounds are played so only the relevant players will hear it.

Added the option to request the roll with all the dice being rolled.

Fixed an issue with contested rolls and who gets to see who passed and who failed.

Added option to grab rolls with contested rolls.

I've also reduce the restrictions when grabbing rolls, so you can now grab any roll and use that in contested or requested rolls.  So this is a bit of a beware, it will grab any roll message you click on.  But it also means that you can grab unrelated rolls if your character wants to roll althletics instead of acrobatics for example.

You can now edit the stats for individual tokens.

Added option to change the width of the tokens being displayed on the token bar.

Stats can now use handlebar notation

Stats can also have text in quotes

Updates tp Spanish and Catalan languages, thank you jvir

Updates to Japanese translation, thank you BrotherSharper

## Version 1.0.54

Fixed issues with Loot sheet not opening due to currency issues.

Fixed issues with lootables not syncing up with players

Added option to select what loot sheet is used.  So you can now use either Loot Sheet or Merchant Sheet

Updated code so that request rolls from Active Tiles can now be delayed until all players have rolled.

Fixed spelling mistake in API that was preventing Contested Roll from being fast forwarded.

Added filter for Active Tiles so you can do one thing with failed tokens, and another with successful ones.

## Version 1.0.53

Changed saving throws to pass information about which tokens passed and failed.

Changed saving throws to continue on [Always, Any Failed, Any Succeeded]

Changed saving throws to set current tokens to those that failed or succeeded.

Started work on integration with CoC7.

## Version 1.0.52

Moved checking for levels and getting xp to the system modules.  Should make assigning xp a little more flexible.

Allowed contested roll to roll all.

Added the option to select multiple tokens using the Shift key when clicking on either the tokens on the token bar, or tokens in the chat message.  Thank-you happy-cujo

Added buttons to the chat message to select either all related tokens, tokens that passed the saving throw, or those that failed the saving throw.  Thank-you happy-cujo

Fixed issue where contested roll wasn't updating the final result.

Moved the gold formula to the settings so that GMs can set their own way of calculating gold.

Changed the saving throw select dialog to alter height according to what's displayed.

Optimized the token bar a little bit.  
Thumbnails are stored between scenes so that it doesn't have to compress the characters image each time.
Moved the needed hooks into the initialization function, so if the tokenbar is disabled, they're not loaded.
Updated the function that renders the tokenbar  and optimized that code that collects the token data.

Fixed an issue where switching scenes rapidly would cause the tokens to disappear.  That was a weird one.

Allow players to see tokens from characters they have observe permissions on.

Added the option to show the tokenbar vertically.

Added option to disable panning when clicking on tokens on the tokenbar. Thank you surged20

Added the option to pass keypress data into the API function.  This will allow calling functions to set Advantage and Disadvantage when rolling all.

Added the option to capture saving throws.  So if a chat card allows you to roll a saving throw you can have it create a Saving Throw roll through Tokenbar instead.

Fixed issue where the results of a saving throw weren't being passed to Active Tiles properly.

Updated Tormenta20 code.  Thank you VHPaiva.

## Version 1.0.51

Fix to pass data back to Active Tiles instead of just true/false

## Version 1.0.50

Fix to make it work with updated Active Tile code.

## Version 1.0.49

Minor fix with the Active Tiles update.  Missed a spot where I didn't convert to the Token from TokenDocument.

## Version 1.0.48

Fixed the fix of an issue with lootable.  Turns out that it was workign properly, but that I was loading the tokens inproperly when manually converting to lootable.

Fixed an issue with resource bars showing up on an update even if they're not supposed to.

Switched use of entities to contents.

Fixed an issue where resource bars weren't aligning properly when more than two attributes were added.

Added the appropriate reference to Catalan and Spanis translations.

Updated the interface with Active Tiles to use the correct information being passed.

## Version 1.0.47 edit

Sorry I keep missing contributions.  Thank you to jvir and Montver for Spanish translations

And thank you to touge as always for the Japanese updates

## Version 1.0.47

Tokenbar will no longer play the request roll sound when roll mode is set to self roll.

Fixed issue with tokens not showing on Old School Essentials

Changed name from Ability to Attribute in SWADE

## Version 1.0.46 edit

Completely forgot to thank supervj for their work on fixing issues with SW5e compatibility!

## Version 1.0.46

Fixing issue with Assigning XP dialog getting NaN for xp to distribute.

Added the option to customise the number of stats being displayed.

When using the requestRoll API you can now call using English names instead of codes.  So calling with "perception" with translate to "skill:prc".

Requesting a roll will now default to the current tokens on the Tokenbar instead of all player controlled.

Moved dynamic items being added to the request roll dialog to the system object

Tokenbar attributes that are an object will default to trying to find the .value of the object.

Fixed issue with using fastForward and requestRoll from the API causing an error.

used libWrapper to encapsulate canDrag override.  This should stop the message getting flagged from DF-QOL.

Added skills to SWADE, so they'll now appear when requesting a Roll.

## Version 1.0.45

Fixing issues with finding the proper tokens for the Tokenbar.

## Version 1.0.44

Allow saving throw to return a value if the request passes or fails.  This is for integration with Monk's Active Tiles.

Added option to stop remaining actions if the saving throw passes of fails.

Updated display name for action to better describe what the request is regarding.

Fixed an issue with the API when requesting a saving throw.

Adding SWADE support.

Added option to bypass chat messages in PF1.

Fixed issues with rolls in PF2.

Updated support for SFRPG to bypass chat messages.

Fixed an issue with distributing XP by levels.

Addedd option to select or deselect tokens from the token bar.

Changed how the saving throws display the dice value... which I'm nervous about 'cause it could go wrong.

## Version 1.0.43

Fixed some minor issues with Active Token Trigger support

Added option to bypass the dialog and roll silently.

## Version 1.0.42

Added support for Monk's Active Token Triggers

Added support for the API function to change movement status using token name

Fixed lootables issue

Fixed issue setting individual token movement

Added option to allow previous token in combat to continue moving to "clean up" while the turn moves on.

Added option to show a movement button on the Combat Tracker, so you can easily give a player movement when it's not their turn.

## Version 1.0.41

Fixing issues with lootables not removing the items properly.

Added alpha to tokens that are lootable

Added notification if requesting a roll and you press the Add+ button and now tokens have been selected

fixed an issue in the code where I referred to a token id instead of a document id

## Version 1.0.40
Fixing issue with lootables calculating gold

Fixing issue with lootables finding correct combatants

Fixing issue with assigning xp dialog

Fixing issue with xp going to Wildshape form

## Version 1.0.38
Updated the code to switch from using game.world.system to game.system.id because game.world.system no longer works with 0.8.x

Added uuid and request options to the chat message created by tokenbar

Fixed issues with lootables

Fixed issue with Initiative calls not working

Removing the chat messages when rolling for initiative

Updated PF2E so that request messages aren't shown.

## Version 1.0.37
Added support so that options used to request the saving throw are added to the chat message

Added token uuid to the chat message

Updated the saving throw API to use strings of token names, making it easier to request a roll in a macro.  A little more accessible if you don't know how to code.

## Version 1.0.36
Support for 0.8.x

## Version 1.0.35
Fixing assign XP issue where actors wern't being assigned XP correctly

Fixing issue where having both XP and lootable windows popping up at the same time were overlapping or one was pushed against the left side of the screen

Fixing an issue where Pathfinder wasn't getting the correct flavor text for requested rolls

## Version 1.0.34
Fixed issue with removing conditions using CUB

Adding support to hide the NPC's name from the players on the contested roll chat message.

Adding support to hide an NPC from the players on the contested roll chat message if they are currently hidden.

Fixed an issue where broken image files were causing an error and preventing the token bar from loading.  Thank you Shade Ninja for catching that.

Fixed an issue where players TokenBars weren't updating the resource bars or displayed stats.

Added support for changing the sound played when requesting a roll

## Version 1.0.32
Updated the code to handle different systems better.

Added better error trapping in case a roll doesn't go as expected.

Added a different interface for selecting a requested roll.  Hopefully making it easier to find the right one quickly.

Added support for PF1, Starfinder, DnD4e, and DnD3e

Added an API to alter the buttons that are shown on the TokenBar.

## Version 1.0.31
Fixing issue with the formula not calculating numerics properly.

Fixing issue, hopefully, with dropping multiple tokens on the board.

Fixing styling issue with the token bar

Adding more logging information

## Version 1.0.30
Fixing issue with replaceAll, changing it back to replace.

## Version 1.0.29
Fixing issues with the formula, and some related spacing issues with any value that overflows

Removing some console logging that didn't really need to be there any more.

Added support for different ways to distribute xp. (Thank you so much Jonas Karlsson)

Swedish translations (Also thank you Jonas, much appreciated)

Adding hooks for dice results

Allow NPC's controlled by a player to move during players turn in combat.  So summoned creatures can be used more effectively.  (Thank you hmqgg)

## Version 1.0.28
Added option to use a formula with the stats displayed

Added support for Star Wars 5e (Thank you baccalla!)

Added Japanese updates (Thank you as always touge!)

## Version 1.0.27
Adding sound effect when a roll has been requested to alert players

Added lootable menu to the token main menu

## Version 1.0.26
Fixing issues with the API, especially with running the function using silent.

Fixing issues with checking for token changes

Fixing issues with Tormenta 20

Fixing issues with Sandbox

Fixing up the rendering speed

Switching the token to use thumbnails of the images to increase the speed of rendering.

## Version 1.0.25
Fixing issue with stacked pathfinder conditions.

Fixing issue with Tormenta20 (Thank you mclemente!)

Fixing issue with request options for requested roll.  This was preventing running the request silently.

## Version 1.0.23
Fixed an issue with the code to find tools.

## Version 1.0.22
Fixed an emergency issue where code is preventing buttons from working

## Version 1.0.21
Fixing issue with toolkits not rolling.

Fixing issue with animated token images being updated.

Adding option to grab player rolls that they didn't roll in the chat message.

Fixing issue with repositioning.

Fixed an issue with the private message context menu showing for players that weren't logged in.

Adding perception as default second stat from pathfinder 2e

Fixing issue with the stat being blanked out if the stat returned a 0.  Converting the value to a string instead.

## Version 1.0.20
Fixing contested roll with OSE

Added option to hold down either Ctrl or Alt when clicking the dice rolls for requested rolls to roll with advantage or disadvantage.

Fixing Pathfinder XP

Fixing css styling

## Version 1.0.19
Adding Initiative to the requested rolls

Added plain dice to the requested rolls

Removed token animation from the TokenBar, it just ended up being too much of a headache.

Updated the function that updates the tokens on the bar.  It will now check for changes first and instead of replacing the entire dataset, it will just update what's needed.  This should catch all the weird cases where the token updates but the bar doesn't.

Respecting the setting if the resource bars are always to be hidden they won't show up on the TokenBar.

Fixing some styling issues with the TokenBar

Added option to split the expereience between players or add directly.

## Version 1.0.18
Fixing issue when a toolkit rool is requested but the item can't be found, then an error is throw.  Added a check to make sure the tool in question can be found.

Added Private Message to the right click menu on the tokens to start a private message with the player that owns that token.

Added support for OSE

Made the second stat customisable

Attempted to allow the TokenBar to be popped out, but that didn't work very well.  Left the code to go back to it at a later time.

## Version 1.0.17
Added support for Death Saving throw

Added support to request a roll for tools.

Added ability to recall the last set of tokens used for a requested roll

Added support for Tormenta20 and translation corrections (Thank you mclemente!)

Added Japanese translations (Thank you touge!)

## Version 1.0.16
Fixed issue with dice tooltip showing when request was sent as a blind gm roll

Added API functionality, but still need to document how to use it

Fixed an issue where npc's converted to lootable weren't able to revert due to no old items saved from being converted to lootable.

## Version 1.0.15
Added option to change defeated enemies into lootables if you have Loot Sheet installed.

Fixed issue with webm tokens not being displayed.

Fixed issue with tokenbar disappearing off the edge of the screen when the browser is resized.  If the token bar is repositioned near the bottom half of the screen it will position relative to the bottom, not the top.  And added a button to the configuration setup to reset the tokenbar position.

## Version 1.0.14
Adding option to disable the token bar, now that it's available for players to see.

Added the option to turn off changing the movement to combat when an encounter is started.

Changed the Add player on the request saving throw to add the currently selected tokens, rather than using it as a toggle switch to add tokens being clicked.  It was very unintuitive.

Changed to the code so that Pathfinder changes to ac and perception are reflected.

## Version 1.0.12
Adding a setting so that players can now see their own tokens on a bar.  Should be helpful for players with companions.

Sort of added the start of customisable stats for the bar.

## Version 1.0.11
Adding support for pathfinder rolls

## Version 1.0.10
Fixed issue with saving throws getting into a loop informing each other that the roll had finished.

Fixed an issue with contested rolls not rendering properly.

## Version 1.0.9
Fixed issue with multiple tokens being added or removed from scene.

You can now reposition the token bar.

Chinese translations

Fixed an issue where multiple tokens associated with a single actor only rolling once.

Remember the last roll mode and reuse it the next time opening the saving throw.

## Version 1.0.8
Fixed issues with the players not able to roll.

Upgraded some of the code behind the scenes to make it all a little more stream lined.

Upgraded the contested roll scripts to use code upgraded for the saving throws.

## Version 1.0.7
TokenBar will respect DnD5e request to disable XP tracking and will hide the XP button on the bar and not open the XP dialog if the checkbox is checked.

Fixed issue with a mass roll not updating properly.

Added the option to show the tokens resource bars.

Cleaned up the code a bit so that macros can call it easier.

## Version 1.0.6
Fixed issue with movement notification showing even though no movement change has happened.

Fixed the bug where a player could still move their token with arrow keys even though movement was locked

## Version 1.0.5
Fixed issue with the global movement status only clearing out the first token's specific movement.  Looks like I wasn't waiting for the setFlag function to complete before moving on to the next one.

Added greater visibility for specific movement settings.  The context menu will now highlight whatever movement setting the token has.

After combat was complete, the Assign XP Dialog was showing for everyone.  Limited that to just the GM.

## Version 1.0.4
Fixing an issue with tokens that don't have passive perception for some reason

## Version 1.0.3

Bug fixes.
The movement restriction wasn't working.
Stripped out the things that weren't working in Pathfinder.
Corrected issues with the turn notification
