import { registerSettings, divideXpOptions } from "./settings.js";
import { TokenBar } from "./apps/tokenbar.js";
import { AssignXP, AssignXPApp } from "./apps/assignxp.js";
import { SavingThrow, SavingThrowApp } from "./apps/savingthrow.js";
import { ContestedRoll, ContestedRollApp } from "./apps/contestedroll.js";
import { LootablesApp } from "./apps/lootables.js";
import { MonksTokenBarAPI } from "./monks-tokenbar-api.js";
import { dcconfiginit } from "./plugins/dcconfig.plugin.js"

import { BaseRolls } from "./systems/base-rolls.js";
import { DS4Rolls } from "./systems/ds4-rolls.js";
import { DnD5eRolls } from "./systems/dnd5e-rolls.js";
import { DnD4eRolls } from "./systems/dnd4e-rolls.js";
import { D35eRolls } from "./systems/d35e-rolls.js";
import { PF1Rolls } from "./systems/pf1-rolls.js";
import { PF2eRolls } from "./systems/pf2e-rolls.js";
import { Tormenta20Rolls } from "./systems/tormenta20-rolls.js";
import { OSERolls } from "./systems/ose-rolls.js";
import { SFRPGRolls } from "./systems/sfrpg-rolls.js";
import { SwadeRolls } from "./systems/swade-rolls.js";
import { SW5eRolls } from "./systems/sw5e-rolls.js";
import { CoC7Rolls } from "./systems/coc7-rolls.js";
import { T2K4ERolls } from "./systems/t2k4e-rolls.js";


export let debug = (...args) => {
    if (MonksTokenBar.debugEnabled > 1) console.log("DEBUG: monks-tokenbar | ", ...args);
};
export let log = (...args) => console.log("monks-tokenbar | ", ...args);
export let warn = (...args) => {
    if (MonksTokenBar.debugEnabled > 0) console.warn("monks-tokenbar | ", ...args);
};
export let error = (...args) => console.error("monks-tokenbar | ", ...args);
export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    return game.settings.get("monks-tokenbar", key);
};

export let patchFunc = (prop, func, type = "WRAPPER") => {
    let nonLibWrapper = () => {
        const oldFunc = eval(prop);
        eval(`${prop} = function (event) {
            return func.call(this, ${type != "OVERRIDE" ? "oldFunc.bind(this)," : ""} ...arguments);
        }`);
    }
    if (game.modules.get("lib-wrapper")?.active) {
        try {
            libWrapper.register("monks-enhanced-journal", prop, func, type);
        } catch (e) {
            nonLibWrapper();
        }
    } else {
        nonLibWrapper();
    }
}

export const MTB_MOVEMENT_TYPE = {
    FREE: 'free',
    NONE: 'none',
    COMBAT: 'combat'
}

/*
export let manageTokenControl = (token, isShiftPressed) => {
    if (!token) return;

    const options = { releaseOthers: !isShiftPressed };
    const testControl = token._controlled && isShiftPressed;
    testControl ? token.release(options) : token.control(options);
}*/

export class MonksTokenBar {
    static tracker = false;
    static tokenbar = null;

    static debugEnabled = 0;

    static slugify(str) {
        if (str == undefined)
            return "";

        str = str.replace(/^\s+|\s+$/g, '');

        // Make the string lowercase
        str = str.toLowerCase();

        const characterMap = {
            'Á': 'A', 'Ä': 'A', 'Â': 'A', 'À': 'A', 'Ã': 'A', 'Å': 'A', 'Č': 'C', 'Ç': 'C',
            'Ć': 'C', 'Ď': 'D', 'É': 'E', 'Ě': 'E', 'Ë': 'E', 'È': 'E', 'Ê': 'E', 'Ẽ': 'E',
            'Ĕ': 'E', 'Ȇ': 'E', 'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I', 'Ň': 'N', 'Ñ': 'N',
            'Ó': 'O', 'Ö': 'O', 'Ò': 'O', 'Ô': 'O', 'Õ': 'O', 'Ø': 'O', 'Ř': 'R', 'Ŕ': 'R',
            'Š': 'S', 'Ť': 'T', 'Ú': 'U', 'Ů': 'U', 'Ü': 'U', 'Ù': 'U', 'Û': 'U', 'Ý': 'Y',
            'Ÿ': 'Y', 'Ž': 'Z', 'á': 'a', 'ä': 'a', 'â': 'a', 'à': 'a', 'ã': 'a', 'å': 'a',
            'č': 'c', 'ç': 'c', 'ć': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e', 'ë': 'e', 'è': 'e',
            'ê': 'e', 'ẽ': 'e', 'ĕ': 'e', 'ȇ': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
            'ň': 'n', 'ñ': 'n', 'ó': 'o', 'ö': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'o',
            'ð': 'o', 'ř': 'r', 'ŕ': 'r', 'š': 's', 'ť': 't', 'ú': 'u', 'ů': 'u', 'ü': 'u',
            'ù': 'u', 'û': 'u', 'ý': 'y', 'ÿ': 'y', 'ž': 'z', 'þ': 'b', 'Þ': 'B', 'Đ': 'D',
            'đ': 'd', 'ß': 'B', 'Æ': 'A', 'a': 'a', '·': '-', '/': '-', '_': '-', ',': '-'
        };
        const pattern = new RegExp(`[${Object.keys(characterMap).join('')}]`, 'g');
        str = str.replace(pattern, match => characterMap[match]);

        // Remove invalid chars
        str = str.replace(/[^a-z0-9 -]/g, '')
            // Collapse whitespace and replace by -
            .replace(/\s+/g, '-')
            // Collapse dashes
            .replace(/-+/g, '-');

        return str;
    }

    /**
     * @param {(Roll|Roll[]|Object)} roll 
     */
    static intoRoll(roll) {
        if (roll instanceof Roll) {
            return roll;
        }

        return Roll.fromData(roll);
    }

    static init() {
        log("initializing");
        // element statics

        try {
            Object.defineProperty(User.prototype, "isTheGM", {
                get: function isTheGM() {
                    return this == (game.users.find(u => u.hasRole("GAMEMASTER") && u.active) || game.users.find(u => u.hasRole("ASSISTANT") && u.active));
                }
            });
        } catch { }

        MonksTokenBar.SOCKET = "module.monks-tokenbar";

        CONFIG.TextEditor.enrichers.push({ id: 'MonksTokenBarRequest', pattern: /@(Request|Contested)\[([^\]]+)\](?:{([^}]+)})?/gi, enricher: MonksTokenBar._createRequestRoll });

        game.keybindings.register('monks-tokenbar', 'request-roll', {
            name: 'MonksTokenBar.RequestRoll',
            editable: [{ key: 'KeyR', modifiers: [KeyboardManager.MODIFIER_KEYS?.ALT] }],
            restricted: true,
            onDown: (data) => {
                let roll = game.user.getFlag("monks-tokenbar", "lastmodeST");
                if (roll == "selfroll") roll = "blindroll";
                new SavingThrowApp(null, { rollmode: roll }).render(true);
            },
        });

        game.keybindings.register('monks-tokenbar', 'request-roll-gm', {
            name: 'MonksTokenBar.RequestRollGM',
            editable: [{ key: 'KeyR', modifiers: [KeyboardManager.MODIFIER_KEYS?.ALT, KeyboardManager.MODIFIER_KEYS?.SHIFT] }],
            restricted: true,
            onDown: (data) => {
                new SavingThrowApp(null, {rollmode: "selfroll"}).render(true);
            },
        });

        registerSettings();

        Handlebars.registerHelper({ selectGroups: MonksTokenBar.selectGroups });

        /*
        if (setting('stats') == undefined) {
            //check and see if the user has selected something other than the default
            if (setting('stat1-icon') != undefined || setting('stat1-resource') != undefined || setting('stat2-icon') != undefined || setting('stat2-resource') != undefined) {
                let oldstats = {};
                if (setting('stat1-resource') != undefined)
                    oldstats[setting('stat1-resource')] = setting('stat1-icon');
                if (setting('stat2-resource') != undefined)
                    oldstats[setting('stat2-resource')] = setting('stat2-icon');
                game.settings.set('monks-tokenbar', 'stats', oldstats);
            }
        }*/

        patchFunc("Token.prototype._canDrag", function (wrapped, ...args) {
            let result = wrapped(...args);
            return (MonksTokenBar.allowMovement(this.document, false) ? result : false);
        });

        patchFunc("ChatLog.prototype._getEntryContextOptions", function (wrapped, ...args) {
            let menu = wrapped.call(...args);

            let canHeroPointReroll = ($li) => {
                const message = game.messages.get($li[0].dataset.messageId, { strict: !0 });
                if (!message.getFlag("monks-tokenbar", "what"))
                    return false;

                let msgToken = message.getFlag("monks-tokenbar", `token${MonksTokenBar.contextId}`);
                if (!msgToken)
                    return false;

                let token = fromUuidSync(msgToken.uuid);
                let actor = token?.actor ? token.actor : token;

                return game.system.id == "pf2e" && !!msgToken.roll && actor.type == "character" && actor.heroPoints.value > 0 && (game.user.isGM || actor.isOwner);

                //return game.user.isGM && !!message.flags.pf2e.context
                //message.isRerollable && !!actor?.isOfType("character") && actor.heroPoints.value > 0
            };
            let canReroll = ($li) => {
                const message = game.messages.get($li[0].dataset.messageId, { strict: !0 });

                if (!MonksTokenBar.system.canReroll)
                    return false;

                if (!message.getFlag("monks-tokenbar", "what"))
                    return false;

                let msgToken = message.getFlag("monks-tokenbar", `token${MonksTokenBar.contextId}`);
                if (!msgToken)
                    return false;

                let token = fromUuidSync(msgToken.uuid);
                let actor = token?.actor ? token.actor : token;

                return !!msgToken.roll && actor?.type == "character" && (game.user.isGM || actor.isOwner);
            };

            return [...menu, ...[
                {
                    name: "PF2E.RerollMenu.HeroPoint",
                    icon: '<i class="fas fa-hospital-symbol"></i>',
                    condition: canHeroPointReroll,
                    callback: $li => {
                        const message = game.messages.get($li[0].dataset.messageId, { strict: !0 });
                        let what = message.getFlag("monks-tokenbar", "what");
                        if (what == "savingthrow")
                            SavingThrow.rerollFromMessage(message, MonksTokenBar.contextId, { heroPoint: !0 });
                        else if (what == "contestedroll")
                            ContestedRoll.rerollFromMessage(message, MonksTokenBar.contextId, { heroPoint: !0 });
                    }
                },
                {
                    name: "Reroll and keep the new result",
                    icon: '<i class="fas fa-dice"></i>',
                    condition: canReroll,
                    callback: $li => {
                        const message = game.messages.get($li[0].dataset.messageId, { strict: !0 });
                        let what = message.getFlag("monks-tokenbar", "what");
                        if (what == "savingthrow")
                            SavingThrow.rerollFromMessage(message, MonksTokenBar.contextId);
                        else if (what == "contestedroll")
                            ContestedRoll.rerollFromMessage(message, MonksTokenBar.contextId);
                    }
                },
                {
                    name: "Reroll and keep the worst result",
                    icon: '<i class="fas fa-dice-one"></i>',
                    condition: canReroll,
                    callback: $li => {
                        const message = game.messages.get($li[0].dataset.messageId, { strict: !0 });
                        let what = message.getFlag("monks-tokenbar", "what");
                        if (what == "savingthrow")
                            SavingThrow.rerollFromMessage(message, MonksTokenBar.contextId, { keep: "worst" });
                        else if (what == "contestedroll")
                            ContestedRoll.rerollFromMessage(message, MonksTokenBar.contextId, { keep: "worst" });
                    }
                },
                {
                    name: "Reroll and keep the better result",
                    icon: '<i class="fas fa-dice-six"></i>',
                    condition: canReroll,
                    callback: $li => {
                        const message = game.messages.get($li[0].dataset.messageId, { strict: !0 });
                        let what = message.getFlag("monks-tokenbar", "what");
                        if (what == "savingthrow")
                            SavingThrow.rerollFromMessage(message, MonksTokenBar.contextId, { keep: "best" });
                        else if (what == "contestedroll")
                            ContestedRoll.rerollFromMessage(message, MonksTokenBar.contextId, { keep: "best" });
                    }
                }
            ]];
        });

        /*
        patchFunc("Scene.prototype.view", async function (wrapped, ...args) {
            if (MonksTokenBar.tokenbar) {
                MonksTokenBar.tokenbar.entries = [];
                MonksTokenBar.tokenbar.refresh();
            }
            return await wrapped.call(this, ...args);
        });
        */
    }

    static selectGroups(choices, options) {
        const localize = options.hash['localize'] ?? false;
        let selected = options.hash['selected'] ?? null;
        let blank = options.hash['blank'] || null;
        selected = selected instanceof Array ? selected.map(String) : [String(selected)];

        // Create an option
        const option = (groupid, id, label) => {
            if (localize) label = game.i18n.has(label) ? game.i18n.localize(label) : label;
            let key = (groupid ? groupid + ":" : "") + id;
            let isSelected = selected.includes(key);
            html += `<option value="${key}" ${isSelected ? "selected" : ""}>${label}</option>`
        };

        // Create the options
        let html = "";
        if (blank) option("", blank);
        if (choices instanceof Array) {
            for (let group of choices) {
                let label = (localize ? game.i18n.localize(group.text) : group.text);
                html += `<optgroup label="${label}">`;
                Object.entries(group.groups).forEach(e => option(group.id, ...e));
                html += `</optgroup>`;
            }
        } else {
            if (game.system.id == "burningwheel") {
                const a = RegExp.escape(Handlebars.escapeExpression(choices))
                    , s = new RegExp(` value=["']${a}["']`);
                return options.fn(this).replace(s, "$& selected")
            } else
                Object.entries(choices).forEach(e => option(...e));
        }
        return new Handlebars.SafeString(html);
    }

    static getTokenEntries(tokens) {
        if (typeof tokens == 'string')
            tokens = tokens.split(',').map(function (item) { return item.trim(); });

        let findToken = function (t) {
            if (typeof t == 'string') {
                t = canvas.tokens.placeables.find(p => p.name == t || p.id == t) || game.actors.find(p => p.name == t || p.id == t);
            } else if (!(t instanceof Token || t instanceof Actor))
                t = null;

            if (t?.actor?.type == "group") {
                return Array.from(t.actor.system.members);
            } else if (t?.actor?.type == "party") {
                return Array.from(t.actor.members);
            } else
                return [t];
        }

        tokens = (tokens || []).flatMap(t => {
            if (typeof t == 'string' && t.startsWith('{') && t.endsWith('}'))
                t = JSON.parse(t);

            let ts = findToken(typeof t == 'object' && t.token && t.constructor.name == 'Object' ? t.token : t);

            return ts.map(tkn => {
                if (!tkn && !t.request) return null;

                tkn = {
                    token: tkn,
                    keys: { ctrlKey: t.ctrlKey, shiftKey: t.shiftKey, altKey: t.altKey, advantage: t.advantage, disadvantage: t.disadvantage },
                    request: t.request,
                    fastForward: t.fastForward
                };

                Object.defineProperty(tkn, 'id', {
                    get: function () {
                        return this.token.id;
                    }
                });

                return (!!tkn.token || !!tkn.request ? tkn : null);
            })
        }).filter(c => !!c);

        return tokens;
    }

    static async chatCardAction(event) {
        if (!setting('capture-savingthrows'))
            return;

        let _getChatCardActor = async function (card) {
            // Case 1 - a synthetic actor from a Token
            if (card.dataset.tokenId) {
                const token = await fromUuid(card.dataset.tokenId);
                if (!token) return null;
                return token.actor;
            }

            // Case 2 - use Actor ID directory
            const actorId = card.dataset.actorId;
            return game.actors.get(actorId) || null;
        }

        let _getChatCardTargets = function (card) {
            let targets = canvas.tokens.controlled.filter(t => !!t.actor);
            if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
            if (!targets.length) ui.notifications.warn(game.i18n.localize("DND5E.ActionWarningNoToken"));
            return targets;
        }

        // Extract card data
        const button = event.currentTarget;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;

        if (action === 'save') {
            if (!(game.user.isGM || message.isAuthor)) return;

            const actor = await _getChatCardActor(card);
            if (!actor) return;

            const storedData = message.getFlag("dnd5e", "itemData");
            const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);

            const targets = _getChatCardTargets(card);
            const entries = MonksTokenBar.getTokenEntries(targets);
            if (entries.length) {
                let savingthrow = new SavingThrowApp(entries, { request: 'save:' + button.dataset.ability, dc: item.system.save.dc });
                savingthrow.requestRoll();

                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
        }
    }

    static get stats() {
        let stats = setting('stats');
        return (stats.default ? MonksTokenBar.system.defaultStats : stats) || [];
    }

    static setTokenSize(size) {
        size = size || setting("token-size");
        var r = document.querySelector(':root');
        r.style.setProperty('--tokenbar-token-size', size + "px");
    }

    static revealDice() {
        return game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") || !game.dice3d.isEnabled() : true;
    }

    static ready() {
        game.socket.on(MonksTokenBar.SOCKET, MonksTokenBar.onMessage);

        game.settings.settings.get("monks-tokenbar.stats").default = MonksTokenBar.system.defaultStats;

        tinyMCE.PluginManager.add('dcconfig', dcconfiginit);

        MonksTokenBar.setTokenSize();

        if ((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar")) {
            MonksTokenBar.tokenbar = new TokenBar();
            MonksTokenBar.tokenbar.refresh();
        }

        if (game.user.isGM && setting('loot-sheet') != 'none' && (game.modules.get(setting('loot-sheet'))?.active || setting("loot-sheet") == "pf2e")) {
            let npcObject = (CONFIG.Actor.sheetClasses.npc || CONFIG.Actor.sheetClasses.minion);
            if (npcObject != undefined) {
                let npcSheetNames = Object.values(npcObject)
                    .map((sheetClass) => sheetClass.cls)
                    .map((sheet) => sheet.name);

                npcSheetNames.forEach((sheetName) => {
                    Hooks.on("render" + sheetName, (app, html, data) => {
                        // only for GMs or the owner of this npc
                        if (app?.token?.actor?.getFlag('monks-tokenbar', 'converted') && app.element.find(".revert-lootable").length == 0) {
                            const link = $('<a class="revert-lootable"><i class="fas fa-backward"></i>Revert Lootable</a>');
                            link.on("click", () => LootablesApp.revertLootable(app));
                            app.element.find(".window-title").after(link);
                        }
                    });
                });
            }
        }
    }

    static playSound(sound, users) {
        foundry.audio.AudioHelper.play({ src: sound }, (users == 'all' ? true : false));
        if (users != 'all' && (users.length > 1 || users[0] != game.user.id))
            MonksTokenBar.emit('playSound', { sound: sound, users: users });
    }

    static emit(action, args = {}) {
        args.action = action;
        args.senderId = game.user.id;
        game.socket.emit(MonksTokenBar.SOCKET, args, (resp) => { });
    }

    static async onMessage(data) {
        switch (data.action) {
            case 'rollability': {
                if (game.user.isGM) {
                    let message = game.messages.get(data.msgid);
                    const revealDice = MonksTokenBar.revealDice();
                    for (let response of data.response) {
                        response.roll = MonksTokenBar.intoRoll(response.roll);
                    }
                    if (data.type == 'savingthrow')
                        SavingThrow.updateMessage(data.response, message, revealDice);
                    else if (data.type == 'contestedroll')
                        ContestedRoll.updateMessage(data.response, message, revealDice);
                }
            } break;
            case 'finishroll': {
                if (game.user.isGM) {
                    let message = game.messages.get(data.msgid);
                    if (data.type == 'savingthrow')
                        SavingThrow.finishRolling(data.response, message);
                    else if (data.type == 'contestedroll')
                        ContestedRoll.finishRolling(data.response, message);
                }
            } break;
            case 'assignxp': {
                if (game.user.isTheGM) {
                    let message = game.messages.get(data.msgid);
                    AssignXP.onAssignXP(data.actorid, message);
                }
            } break;
            case 'assigndeathst': {
                if (game.user.isTheGM) {
                    let message = game.messages.get(data.msgid);
                    SavingThrow.onAssignDeathST(data.tokenid, message);
                }
            } break;
            case 'movementchange': {
                if (data.tokenid == undefined || canvas.tokens.get(data.tokenid)?.isOwner) {
                    ui.notifications.warn(data.msg);
                    if (MonksTokenBar.tokenbar != undefined) {
                        MonksTokenBar.tokenbar.render(true);
                    }
                }
            } break;
            case 'refreshsheet': {
                if (game.user.id != data.senderId) {
                    let actor = canvas.tokens.get(data.tokenid)?.actor;
                    if (actor) {
                        actor._sheet = null;
                    }
                }
            } break;
            case 'playSound': {
                if (data.users.includes(game.user.id)) {
                    console.log('Playing sound', data.sound);
                    foundry.audio.AudioHelper.play({ src: data.sound }, false);
                }
            } break;
            case 'renderLootable': {
                let entity = fromUuid(data.entityid).then(entity => {
                    if (game.modules.get('monks-enhanced-journal')?.active && setting('loot-sheet') == 'monks-enhanced-journal') {
                        if (!game.MonksEnhancedJournal.openJournalEntry(entity))
                            entity.sheet.render(true);
                    } else
                        entity.sheet.render(true);
                })
            } break;
            case 'closeLootable': {
                $(`#lootables[data-combat-id="${data.id}"] a.close`).click();
            } break;
            case 'setRolls': {
                if (game.user.isGM) {
                    let msg = game.messages.get(data.msgid);
                    if (msg) {
                        let rolls = foundry.utils.duplicate(msg.getFlag('monks-tokenbar', "rolls") || {});
                        rolls[data.tokenid] = data.roll;
                        await msg.setFlag('monks-tokenbar', "rolls", rolls);

                        let response = { id: data.tokenid, roll: Roll.fromData(data.roll), finish: null, reveal: true }

                        const revealDice = MonksTokenBar.revealDice();
                        await SavingThrow.updateMessage([response], msg, revealDice);
                    }
                }
            } break;
            case 'updateReroll': {
                if (game.user.isTheGM) {
                    let msg = game.messages.get(data.msgid);
                    if (msg) {
                        if (data.type == "savingthrow")
                            SavingThrow.updateReroll(msg, data.tokenid, Roll.fromData(data.roll), data.options);
                        else if(data.type == "contestedroll")
                            ContestedRoll.updateReroll(msg, data.tokenid, Roll.fromData(data.roll), data.options);
                    }
                }
            } break;
        }
    }

    static manageTokenControl(tokens, options) {
        let { shiftKey, force } = options;

        //if !shift then release all currently selected
        if (!shiftKey || force)
            canvas.tokens.releaseAll();

        if (!tokens) return;
        tokens = (tokens instanceof Array ? tokens : [tokens]);

        //select all token for control
        const controlOptions = { releaseOthers: !shiftKey && !force };
        tokens.forEach(token => (token._controlled && shiftKey && tokens.length == 1 ? token.release(controlOptions) : token.control(controlOptions)));

        //document.getSelection().removeAllRanges();

        return !shiftKey;
    }

    static isMovement(movement) {
        return movement != undefined && MTB_MOVEMENT_TYPE[movement.toUpperCase()] != undefined;
    }

    static getDiceSound() {
        const has3DDiceSound = game.modules.get("dice-so-nice")?.active;
        return (!has3DDiceSound ? CONFIG.sounds.dice : null);
    }

    static async changeGlobalMovement(movement) {
        if (movement == MTB_MOVEMENT_TYPE.COMBAT && (game.combat == undefined || !game.combat.started))
            return;

        log('Changing global movement', movement);
        await game.settings.set("monks-tokenbar", "movement", movement);
        //clear all the tokens individual movement settings
        if (MonksTokenBar.tokenbar != undefined) {
            let tokenbar = MonksTokenBar.tokenbar;
            for (let i = 0; i < tokenbar.entries.length; i++) {
                await tokenbar.entries[i].token?.setFlag("monks-tokenbar", "movement", null);
                if (tokenbar.entries[i].token)
                    tokenbar.entries[i].token._movementNotified = null;
            };
            tokenbar.render(true);
        }

        MonksTokenBar.displayNotification(movement);
    }

    static async changeTokenMovement(movement, tokens) {
        if (tokens == undefined)
            return;

        if (!MonksTokenBar.isMovement(movement))
            return;

        tokens = tokens instanceof Array ? tokens : [tokens];

        log('Changing token movement', tokens);

        let newMove = (game.settings.get("monks-tokenbar", "movement") != movement ? movement : null);
        for (let token of tokens) {
            if (token instanceof Token)
                token = token.document;
            let oldMove = token.getFlag("monks-tokenbar", "movement");
            if (newMove != oldMove) {
                await token.setFlag("monks-tokenbar", "movement", newMove);
                delete token._movementNotified;

                let dispMove = token.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
                MonksTokenBar.displayNotification(dispMove, token);

                /*if (MonksTokenBar.tokenbar != undefined) {
                    let tkn = MonksTokenBar.tokenbar.entries.find(t => { return t.id == token.id });
                    if (tkn != undefined)
                        tkn.movement = newMove;
                } */
            }
        }

        //if (MonksTokenBar.tokenbar != undefined)
        //    MonksTokenBar.tokenbar.render(true);
    }

    static async changeTokenPanning(tokens) {
        if (tokens == undefined)
            return;

        tokens = tokens instanceof Array ? tokens : [tokens];

        log('Changing token panning', tokens);

        for (let token of tokens) {
            let oldPanning = token.getFlag("monks-tokenbar", "nopanning");
            await token.setFlag("monks-tokenbar", "nopanning", !oldPanning);
        }
    }

    static displayNotification(movement, token) {
        if (game.settings.get("monks-tokenbar", "notify-on-change")) {
            let msg = (token != undefined ? token.name + ": " : "") + i18n("MonksTokenBar.MovementChanged") + (movement == MTB_MOVEMENT_TYPE.FREE ? i18n("MonksTokenBar.FreeMovement") : (movement == MTB_MOVEMENT_TYPE.NONE ? i18n("MonksTokenBar.NoMovement") : i18n("MonksTokenBar.CombatTurn")));
            ui.notifications.warn(msg);
            log('display notification');
            MonksTokenBar.emit('movementchange',
                {
                    msg: msg,
                    tokenid: token?.id
                }
            );
        }
    }

    static allowMovement(token, notify = true) {
        let blockCombat = function (token) {
            //combat movement is only acceptable if the token is the current token.
            //or the previous token
            //let allowPrevMove = game.settings.get("combatdetails", "allow-previous-move");

            let curCombat = game.combats.active;
            if (setting('debug'))
                log('checking on combat ', curCombat, (curCombat && curCombat.started));

            if (curCombat && curCombat.started) {
                let entry = curCombat.combatant;
                let allowNpc = false;
                if (game.settings.get("monks-tokenbar", "free-npc-combat")) {
                    let curPermission = entry.actor?.ownership ?? {};
                    let tokPermission = token.actor?.ownership ?? {};
                    let ownedUsers = Object.keys(curPermission).filter(k => curPermission[k] === 3);
                    allowNpc = ownedUsers.some(u => tokPermission[u] === 3 && !game.users?.get(u)?.isGM)
                        && curCombat.turns.every(t => { return t.tokenId !== token.id; });
                }
                if (setting('free-vehicle-combat') && entry.actor?.type == "vehicle" && entry.actor?.isOwner)
                    allowNpc = true;

                log('Checking movement', entry.name, token.name, entry, token.id, token, allowNpc);
                return !(entry.tokenId == token.id || allowNpc || (setting("allow-after-movement") && curCombat.previous.tokenId == token.id));
            }

            return true;
        }

        if (!game.user.isGM && token != undefined) {
            let movement = token.getFlag("monks-tokenbar", "movement") || game.settings.get("monks-tokenbar", "movement") || MTB_MOVEMENT_TYPE.FREE;
            if (setting('debug'))
                log('movement ', movement, token);
            if (movement == MTB_MOVEMENT_TYPE.NONE ||
                (movement == MTB_MOVEMENT_TYPE.COMBAT && blockCombat(token))) {
                //prevent the token from moving
                if (setting('debug'))
                    log('blocking movement');
                if (notify && (!(token._movementNotified ?? false))) {
                    ui.notifications.warn(movement == MTB_MOVEMENT_TYPE.COMBAT ? i18n("MonksTokenBar.CombatTurnMovementLimited") : i18n("MonksTokenBar.NormalMovementLimited"));
                    token._movementNotified = true;
                    setTimeout(function (token) {
                        delete token._movementNotified;
                        log('unsetting notified', token);
                    }, 2000, token);
                }
                return false;
            }
        }

        return true;
    }

    static async onDeleteCombat(combat) {
        if (game.user.isGM) {
            if (combat.started == true) {
                let showXP = game.settings.get("monks-tokenbar", "show-xp-dialog") && MonksTokenBar.system.showXP;
                let showLoot = setting("loot-sheet") != 'none' && (game.modules.get(setting("loot-sheet"))?.active || setting("loot-sheet") == "pf2e");

                let axpa;
                if (showXP) {
                    axpa = new AssignXPApp(combat, showLoot ? { classes: ["dual"] } : null);
                    await axpa.render(true);
                }
                /*
                if (game.settings.get("monks-tokenbar", "show-xp-dialog") && (game.system.id !== "sw5e" || (game.system.id === "sw5e" && !game.settings.get('sw5e', 'disableExperienceTracking')))) {
                    axpa = new AssignXPApp(combat);
                    await axpa.render(true);
                }*/

                if (showLoot) {
                    let lapp = new LootablesApp(combat, showXP ? { classes: ["dual"] } : null);
                    if (!lapp.entries.length)
                        lapp.close();
                    else {
                        await lapp.render(true);
                    }
                }
            }

            if (game.combats.combats.length == 0) {
                //set movement to free movement
                let movement = setting("movement-after-combat");
                if (movement != 'ignore')
                    MonksTokenBar.changeGlobalMovement(movement);
            }
        }
    }

    static getNameList(list) {
        list = list.filter(g => g.groups);
        for (let attr of list) {
            attr.label = attr.label ?? attr.text;
            attr.groups = foundry.utils.duplicate(attr.groups);
            for (let [k, v] of Object.entries(attr.groups)) {
                attr.groups[k] = v?.label || v?.text || v;
            }
        }

        return list;
    }

    static getRequestName(requestoptions, request, actors) {
        let name = '';
        switch (request.type) {
            case 'ability': name = i18n("MonksTokenBar.AbilityCheck"); break;
            case 'save': name = i18n("MonksTokenBar.SavingThrow"); break;
            case 'dice': name = i18n("MonksTokenBar.Roll"); break;
            default:
                name = (request.key != 'death' && request.key != 'init' ? i18n("MonksTokenBar.Check") : "");
        }
        let rt = requestoptions.find(o => {
            return o.id == (request.type || request.key);
        });
        if (!rt && actors) {
            for (let actor of actors) {
                let item = actor.items.find(i => i.type == request.type && (MonksTokenBar.slugify(i.name) == request.key || i.getFlag("core", "sourceId") == request.key));
                if (item) {
                    rt = { text: item.name };
                    break;
                }
            }
        }
        let req = (rt?.groups && rt?.groups[request.key]) || (request.type == "dice" && request.name);
        let flavor = i18n(req?.label || req || rt?.text || "MonksTokenBar.Unknown");
        switch (game.i18n.lang) {
            case "pt-BR":
            case "es":
                name = name + ": " + flavor;
                break;
            case "en":
            default:
                name = flavor + " " + name;
        }
        return name;
    }

    static findBestRequest(requests, options) {
        if (requests) {
            let opt = options.filter(o => o);
            requests = requests instanceof Array ? requests : [requests];
            for (let i = 0; i < requests.length; i++) {
                let request = requests[i];
                if (!request)
                    continue;

                let type = request.type
                let key = request.key
                if (typeof request == "string") {
                    if (request.indexOf(':') > -1) {
                        let parts = request.split(':');
                        type = parts[0];
                        key = parts[1];
                    } else
                        key = request;
                }

                //correct the type if it's a string
                if (type && type.toLowerCase() == "saving")
                    type = "save";

                let optType = (type ? opt.find(o => o.id == type.toLowerCase() || i18n(o.text).toLowerCase() == type.toLowerCase()) : null);

                //correct the key
                optType = (optType ? [optType] : opt).find(g => {
                    return Object.entries(g.groups).find(([k, v]) => {
                        let result = i18n(v).toLowerCase() == key.toLowerCase() || k == key.toLowerCase();
                        if (result) key = k;
                        return result;
                    });
                });

                if (optType)
                    requests[i] = { type: optType.id, key: key, slug: `${optType.id}${optType.id ? ':' : ''}${key}` };
            }

            return requests;
        }
        return null;
    }

    static setGrabMessage(message, event) {
        if (!MonksTokenBar.system.canGrab)
            return;

        if (MonksTokenBar.grabmessage != undefined) {
            $('#chat-log .chat-message[data-message-id="' + MonksTokenBar.grabmessage.id + '"]').removeClass('grabbing');
        }

        if (MonksTokenBar.grabmessage == message)
            MonksTokenBar.grabmessage = null;
        else {
            MonksTokenBar.grabmessage = message;
            if (message != undefined)
                $('#chat-log .chat-message[data-message-id="' + MonksTokenBar.grabmessage.id + '"]').addClass('grabbing');
        }

        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        event.cancelBubble = true;
        event.returnValue = false;
    }

    static selectActors(message, filter, event) {
        let tokens = Object.entries(message.flags['monks-tokenbar'])
            .map(([k, v]) => { return (k.startsWith('token') ? v : null) })
            .filter(filter)
            .map(t => { return canvas.tokens.get(t?.id); })
            .filter(t => t);

        MonksTokenBar.manageTokenControl(tokens, { shiftKey: event?.originalEvent?.shiftKey, force: true });

        if (event) {
            if (event.stopPropagation) event.stopPropagation();
            if (event.preventDefault) event.preventDefault();
            event.cancelBubble = true;
            event.returnValue = false;
        }
    }

    static onClickMessage(message, html) {
        if (MonksTokenBar.grabmessage != undefined) {
            //make sure this message matches the grab message
            if (message.rolls.length) {
                let tokenId = message.speaker.token;
                let msgtoken = MonksTokenBar.grabmessage.getFlag('monks-tokenbar', 'token' + tokenId);

                if (msgtoken != undefined) {
                    if (MonksTokenBar.grabmessage.getFlag('monks-tokenbar', 'what') == 'contestedroll')
                        ContestedRoll.updateMessage([{ id: tokenId, roll: message.rolls[0] }], MonksTokenBar.grabmessage);
                    else
                        SavingThrow.updateMessage([{ id: tokenId, roll: message.rolls[0] }], MonksTokenBar.grabmessage);
                    if (setting('delete-after-grab'))
                        message.delete();
                    MonksTokenBar.grabmessage = null;
                }
            }
        }
    }

    static toggleMovement(combatant, event) {
        event.preventDefault();
        event.stopPropagation();

        let movement = (combatant.token.getFlag('monks-tokenbar', 'movement') == MTB_MOVEMENT_TYPE.FREE ? MTB_MOVEMENT_TYPE.COMBAT : MTB_MOVEMENT_TYPE.FREE);
        this.changeTokenMovement(movement, combatant.token.object);
        $(event.currentTarget).toggleClass('active', movement);
    }

    static getLootSheetOptions(lootType) {
        let lootsheetoptions = { 'none': 'Do not convert' };
        if (game.modules.get("lootsheetnpc5e")?.active)
            lootsheetoptions['lootsheetnpc5e'] = "Loot Sheet NPC 5e";
        if (game.modules.get("merchantsheetnpc")?.active)
            lootsheetoptions['merchantsheetnpc'] = "Merchant Sheet NPC";
        if (game.modules.get("item-piles")?.active)
            lootsheetoptions['item-piles'] = "Item Piles";
        if (game.modules.get("monks-enhanced-journal")?.active && game.modules.get("monks-enhanced-journal").version > "1.0.39" && lootType !='convert')
            lootsheetoptions['monks-enhanced-journal'] = "Monk's Enhanced Journal";
        if (game.system.id == "pf2e")
            lootsheetoptions['pf2e'] = "PF2e Party Stash";

        return lootsheetoptions;
    }

    static refreshDirectory(data) {
        ui[data.name]?.render();
    }

    static async lootEntryListing(ctrl, html, collection = game.journal, uuid) {
        async function selectItem(event) {
            event.preventDefault();
            event.stopPropagation();
            let id = event.currentTarget.dataset.uuid;
            ctrl.val(id).change();

            let name = await getEntityName(id);

            $('.journal-select-text', ctrl.next()).html(name);
            $('.journal-list.open').removeClass('open');
            $(event.currentTarget).addClass('selected').siblings('.selected').removeClass('selected');
        }

        async function getEntityName(id) {
            let entity = null;
            try {
                entity = (id ? await fromUuid(id) : null);
            } catch {
                entity = "";
            }

            if (entity instanceof JournalEntryPage || entity instanceof Actor)
                return "<i>Adding</i> to <b>" + entity.name + "</b>";
            else if (entity instanceof JournalEntry)
                return "<i>Adding</i> new loot page to <b>" + entity.name + "</b>";
            else if (entity instanceof Folder)
                return (entity.documentClass.documentName == "JournalEntry" ? "<i>Creating</i> new Journal Entry within <b>" + entity.name + "</b> folder" : "<i>Creating</i> Actor within <b>" + entity.name + "</b> folder");
            else if (id == "convert")
                return "<i>Convert</i> tokens";
            else if (id == "root") {
                let lootsheet = setting('loot-sheet');
                let isLootActor = ['lootsheetnpc5e', 'merchantsheetnpc', 'item-piles'].includes(lootsheet);
                return `<i>Creating</i> ${isLootActor ? "Actor" : "Journal Entry"} in the <b>root</b> folder`;
            } else
                return "Unknown";
        }

        function getEntries(folderID, contents) {
            let createItem = $('<li>').addClass('journal-item create-item').attr('data-uuid', folderID || "root").html($('<div>').addClass('journal-title').toggleClass('selected', uuid == undefined).html("-- create entry here --")).click(selectItem.bind())
            let result = collection.preventCreate ? [] : [createItem];
            return result.concat((contents || [])
                .filter(c => {
                    return (c instanceof JournalEntry && c.pages.size == 1 && foundry.utils.getProperty(c.pages.contents[0], "flags.monks-enhanced-journal.type") == "loot") || (c instanceof Actor)
                })
                .sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0; })
                .map(e => {
                    return $('<li>').addClass('journal-item flexrow').toggleClass('selected', uuid == (e.pages?.contents[0].uuid || e.uuid)).attr('data-uuid', e.pages?.contents[0].uuid || e.uuid).html($('<div>').addClass('journal-title').html(e.name)).click(selectItem.bind())
                }));
        }

        function createFolder(folder, icon = "fa-folder-open") {
            return $('<li>').addClass('journal-item folder flexcol collapse').append($('<div>').addClass('journal-title').append($("<i>").addClass(`fas ${icon}`)).append(folder.name)).append(
                $('<ul>')
                    .addClass('subfolder')
                    .append(getFolders(folder?.children?.map(c => c.folder)))
                    .append(getEntries(folder.uuid, folder.documents || folder.contents)))
                .click(function (event) { event.preventDefault(); event.stopPropagation(); $(this).toggleClass('collapse'); });
        }

        function getFolders(folders) {
            return (folders || []).sort((a, b) => { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0; }).map(f => {
                return createFolder(f);
            });
        }

        let list = $('<ul>')
            .addClass('journal-list')
            .append($('<li>').addClass('journal-item convert-item').attr('data-uuid', 'convert').toggle(collection.documentName == "Actor" && collection.preventCreate !== true).html($('<div>').addClass('journal-title').toggleClass('selected', uuid == 'convert').html("-- convert tokens --")).click(selectItem.bind()))
            .append(getFolders(collection.directory?.folders?.filter(f => f.folder == null)))
            .append(getEntries(null, collection.contents.filter(j => j.folder == null)));

        $(html).click(function () { list.removeClass('open') });

        let name = await getEntityName(uuid);

        return $('<div>')
            .addClass('journal-select')
            .attr('tabindex', '0')
            .append($('<div>').addClass('flexrow').css({ font: ctrl.css('font') }).append($('<span>').addClass("journal-select-text").html(name)).append($('<i>').addClass('fas fa-chevron-down')))
            .append(list)
            .click(function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                if ($(evt.currentTarget).hasClass("disabled"))
                    return;
                $('.journal-list', html).removeClass('open');
                list.toggleClass('open');
            });
    }

    static _createRequestRoll(match, ...args) {
        let [command, options, name] = match.slice(1, 5);
        // Define default inline data
        let [request, ...props] = options.split(' ');

        for (let i = 0; i < props.length; i++) {
            if (props[i].startsWith('dc:') || props[i].startsWith('rollmode') || props[i].startsWith('silent') || props[i].startsWith('fastForward'))
                break;
            request += ` ${props[i]}`;
        }

        let dataset = {
            requesttype: command,
            request: request,
        }

        if (command == "Contested") {
            dataset.request1 = props[0];
        }

        let dc = props.filter(p => $.isNumeric(p) || p.toLowerCase().startsWith('dc')).map(p => !$.isNumeric(p) ? parseInt(p.toLowerCase().replace('dc:', '')) : p);
        if (dc.length)
            dataset.dc = parseInt(dc[0]);
        let rollmode = props.filter(p => { if ($.isNumeric(p)) return false; return p.toLowerCase().startsWith('rollmode') }).map(p => p.toLowerCase().replace('rollmode:', ''));
        if (rollmode.length) {
            if (["roll", "gmroll", "blindroll", "selfroll"].includes(rollmode[0]))
                dataset.rollmode = rollmode;
        }
        if (props.find(p => p == 'silent') != undefined)
            dataset.silent = true;
        if (props.find(p => p == 'fastForward') != undefined)
            dataset.fastForward = true;
        if (name)
            dataset.flavor = name;

        const data = {
            cls: ["inline-request-roll"],
            title: `${i18n("MonksTokenBar.RequestRoll")}: ${request} ${dc}`,
            label: name || i18n("MonksTokenBar.RequestRoll"),
            dataset: dataset
        };

        // Construct and return the formed link element
        const a = document.createElement('a');
        a.classList.add(...data.cls);
        a.title = data.title;
        for (let [k, v] of Object.entries(data.dataset)) {
            a.dataset[k] = v;
        }
        a.innerHTML = `<i class="fas fa-dice-d20"></i> ${data.label}`;
        return a;
    }

    static _onClickInlineRequestRoll(event) {
        event.preventDefault();
        const a = event.currentTarget;

        let options = foundry.utils.duplicate(a.dataset);
        if (options.dc) options.dc = parseInt(options.dc);
        if (options.fastForward) options.fastForward = true;
        if (options.silent) options.silent = true;

        if (options.request.indexOf(":") > -1) {
            let [type, key] = options.request.split(":");
            options.request = { type, key };
        }
        if (options.request.endsWith("Saving Throw")) {
            options.request = { type: "save", key: options.request.replace("Saving Throw", "").trim() };
        }
        if (options.request1 && options.request1.indexOf(":") > -1) {
            let [type, key] = options.request1.split(":");
            options.request1 = { type, key };
        }

        let requesttype = a.dataset.requesttype.toLowerCase();
        if (requesttype == 'request')
            MonksTokenBarAPI.requestRoll(canvas.tokens.controlled, options);
        else if (requesttype == 'contested') 
            MonksTokenBarAPI.requestContestedRoll({ request: options.request }, { request: options.request1 }, options);
    }
}

Hooks.once('init', async function () {
    log('Initializing Combat Details');
    // Assign custom classes and constants here
    // Register custom module settings
    MonksTokenBar.init();
    MonksTokenBarAPI.init();

    //$('body').on('click', $.proxy(MonksTokenBar.setGrabMessage, MonksTokenBar, null));
});

Hooks.on("deleteCombat", MonksTokenBar.onDeleteCombat);

Hooks.on("updateCombat", function (combat, delta) {
    if (game.user.isTheGM) {
        if (MonksTokenBar.tokenbar) {
            for (let entry of MonksTokenBar.tokenbar.entries) {
                if (entry.token)
                    entry.token._movementNotified = null;
            }
        }

        if (delta.round === 1 && combat.turn === 0 && combat.started === true && setting("change-to-combat")) {
            MonksTokenBar.changeGlobalMovement(MTB_MOVEMENT_TYPE.COMBAT);
        }
    }
});

Hooks.on("setup", () => {
    MonksTokenBar.system = new BaseRolls();
    switch (game.system.id.toLowerCase()) {
        case 'dnd5e':
            MonksTokenBar.system = new DnD5eRolls(); break;
        case 'sw5e':
            MonksTokenBar.system = new SW5eRolls(); break;
        case 'd35e':
            MonksTokenBar.system = new D35eRolls(); break;
        case 'dnd4ebeta':
        case 'dnd4e':
            MonksTokenBar.system = new DnD4eRolls(); break;
        case 'ds4':
            MonksTokenBar.system = new DS4Rolls(); break;
        case 'pf1':
            MonksTokenBar.system = new PF1Rolls(); break;
        case 'pf2e':
            MonksTokenBar.system = new PF2eRolls(); break;
        case 'tormenta20':
            MonksTokenBar.system = new Tormenta20Rolls(); break;
        case 'sfrpg':
            MonksTokenBar.system = new SFRPGRolls(); break;
        case 'ose':
            MonksTokenBar.system = new OSERolls(); break;
        case 'swade':
            MonksTokenBar.system = new SwadeRolls(); break;
        case 'coc7':
            MonksTokenBar.system = new CoC7Rolls(); break;
        case 't2k4e':
            MonksTokenBar.system = new T2K4ERolls(); break; 
    }

    MonksTokenBar.system.constructor.activateHooks();
});

Hooks.on("ready", MonksTokenBar.ready);

Hooks.on('preUpdateToken', (document, update, options, userId) => {
    if ((update.x != undefined || update.y != undefined) && !game.user.isGM) {
        let allow = MonksTokenBar.allowMovement(document);
        if (!allow) {
            delete update.x;
            delete update.y;
        }
    }
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (game.user.isGM && setting('show-lootable-menu') && setting('loot-sheet') != 'none' && MonksTokenBar.getLootSheetOptions()[setting('loot-sheet')] != undefined) {
        let tokenControls = controls.find(control => control.name === "token")
        tokenControls.tools.push({
            name: "togglelootable",
            title: "MonksTokenBar.TransferLoot",
            icon: "fas fa-dolly-flatbed",
            onClick: () => {
                if (setting('loot-sheet') == 'none') {
                    ui.notifications.warn('No lootsheet selected');
                    return;
                }
                new LootablesApp().render(true);
            },
            toggle: false,
            button: true
        });
    }
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
    $('[name="monks-tokenbar.loot-sheet"]', html).on('change', async () => {
        let sheet = $('[name="monks-tokenbar.loot-sheet"]', html).val();

        let hasLootable = sheet != 'none' && MonksTokenBar.getLootSheetOptions()[sheet] != undefined;
        $('[name="monks-tokenbar.loot-entity"]', html).closest('.form-group').toggle(hasLootable);
        $('[name="monks-tokenbar.open-loot"]', html).closest('.form-group').toggle(hasLootable);
        $('[name="monks-tokenbar.show-lootable-menu"]', html).closest('.form-group').toggle(hasLootable);
        $('[name="monks-tokenbar.create-canvas-object"]', html).closest('.form-group').toggle(sheet != "pf2e");
        $('[name="monks-tokenbar.loot-name"]', html).closest('.form-group').toggle(sheet != "pf2e");

        let entityid = setting('loot-entity');
        let ctrl = $('[name="monks-tokenbar.loot-entity"]', html);
        if (ctrl.next().hasClass("journal-select"))
            ctrl.next().remove();

        let collection = sheet == "pf2e" ? { documentName: "Actor", contents: game.actors.contents.filter(a => a.type == "party"), preventCreate: true } : (sheet == "monks-enhanced-journal" ? game.journal : game.actors);
        let list = await MonksTokenBar.lootEntryListing(ctrl, html, collection, entityid);
        list.insertAfter(ctrl);
        ctrl.hide();
    }).change();

    $('[name="monks-tokenbar.loot-entity"]', html).on('change', async () => {
        let entity = $('[name="monks-tokenbar.loot-entity"]', html).val();

        $('[name="monks-tokenbar.loot-name"]', html).closest('.form-group').toggle(entity.startsWith("Folder") || !entity);
    }).change();

    $('[name="monks-tokenbar.loot-name"]', html).val(i18n($('[name="monks-tokenbar.loot-name"]', html).val()));

    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenBar.TokenbarSettings")).insertBefore($('[name="monks-tokenbar.allow-player"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenBar.IconSettings")).insertBefore($('[name="monks-tokenbar.token-size"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenBar.MovementSettings")).insertBefore($('[name="monks-tokenbar.notify-on-change"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenBar.AfterCombatSettings")).insertBefore($('[name="monks-tokenbar.send-levelup-whisper"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenBar.LootableSettings")).insertBefore($('[name="monks-tokenbar.show-lootable-menu"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksTokenBar.RequestRollSettings")).insertBefore($('[name="monks-tokenbar.allow-roll"]').parents('div.form-group:first'));
});

Hooks.on("renderCombatTracker", (app, html, data) => {
    if (setting("show-on-tracker") && game.user.isGM) {
        $('.combatant', html).each(function () {
            let id = this.dataset.combatantId;
            let combatant = app.viewed.combatants.find(c => c.id == id);
            if (combatant && combatant.hasPlayerOwner && combatant.token) {
                $($('<a>')
                    .addClass('combatant-control')
                    .toggleClass('active', combatant.token.getFlag('monks-tokenbar', 'movement') == MTB_MOVEMENT_TYPE.FREE)
                    .attr('data-tooltip', 'Allow Movement')
                    .attr('data-control', 'toggleMovement')
                    .html('<i class="fas fa-running"></i>')
                    .click(MonksTokenBar.toggleMovement.bind(MonksTokenBar, combatant))
                ).insertBefore($('.token-effects', this));
            }
        })

    }
});

Hooks.on("renderTokenConfig", (app, html, data) => {
    if (game.user.isGM) {
        let include = app.token.getFlag('monks-tokenbar', 'include') || 'default';
        include = (include === true ? 'include' : (include === false ? 'exclude' : include || 'default'));
        //(app.object.actor != undefined && app.object.actor?.hasPlayerOwner && (game.user.isGM || app.object.actor?.isOwner) && (app.object.actor?.type != 'npc' || app.object.document.disposition == 1));
        let group = $('<div>')
            .addClass('form-group')
            .append($('<label>').html('Show on Tokenbar'))
            .append($('<select>').attr('name', 'flags.monks-tokenbar.include')
                .append($('<option>').attr('value', 'default').html('Default').prop('selected', include == 'default'))
                .append($('<option>').attr('value', 'include').html('Include').prop('selected', include == 'include'))
                .append($('<option>').attr('value', 'exclude').html('Exclude').prop('selected', include == 'exclude')));

        $('div[data-tab="character"]', html).append(group);

        app.setPosition();
    }
});

Hooks.on("renderChatMessage", async (message, html, data) => {
    $('.item-card button[data-action="save"]', html).click(MonksTokenBar.chatCardAction.bind(message));

    if (message.rolls.length != undefined && message.isRoll) {
        //check grab this roll
        if (MonksTokenBar.system.canGrab)
            $(html).on('click', $.proxy(MonksTokenBar.onClickMessage, MonksTokenBar, message, html));
    }

    const levelCard = html.find(".monks-tokenbar.level-up");
    if (levelCard.length !== 0) {
        let actor = await fromUuid(message.getFlag("monks-tokenbar", "actor"));
        let level = parseInt(message.getFlag("monks-tokenbar", "level"));
        $('.add-level', html).click(() => {
            if ($('.add-level', html).hasClass("disabled"))
                return;

            const currLevel = parseInt(foundry.utils.getProperty(actor, "system.details.level.value"));
            if (currLevel < level) {
                actor.update({ "system.details.level.value": level, "system.details.xp.value": actor.system.details.xp.value - actor.system.details.xp.max });
            }
            $('.add-level', html).addClass("disabled");
        }).toggleClass("disabled", !(actor && actor.system.details.xp.value >= actor.system.details.xp.max));
    }
});

Hooks.on("updateSetting", (setting, value, options) => {
    if (setting.key == "monks-tokenbar.minimum-ownership" && MonksTokenBar.tokenbar) {
        MonksTokenBar.tokenbar.refresh();
    }
});

Hooks.on("setupTileActions", (app) => {
    app.registerTileGroup('monks-tokenbar', "Monk's Token Bar");
    app.registerTileAction('monks-tokenbar', 'setmovement', {
        name: 'Change Movement Mode',
        stop: true,
        ctrls: [
            {
                id: "global",
                name: "Change Global Movement",
                type: "checkbox",
                onClick: (app) => {
                    app.checkConditional();
                    app.setPosition({ height: 'auto' });
                },
                defvalue: true
            },
            {
                id: "entity",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                options: { show: ['token', 'within', 'players', 'previous'] },
                restrict: (entity) => { return (entity instanceof Token); },
                conditional: (app) => {
                    return !$('input[name="data.global"]', app.element).prop('checked');
                }
            },
            {
                id: "movement",
                name: "Allow Movement",
                list: "movement",
                type: "list"
            }
        ],
        group: 'monks-tokenbar',
        values: {
            'movement': {
                "none": 'MonksTokenBar.NoMovement',
                "free": 'MonksTokenBar.FreeMovement',
                "combat": 'MonksTokenBar.CombatTurn'
            }
        },
        fn: async (args = {}) => {
            const { action } = args;

            if (!!action.data.global)
                MonksTokenBar.changeGlobalMovement(action.data.movement);
            else {
                let entities = await game.MonksActiveTiles.getEntities(args);
                MonksTokenBar.changeTokenMovement((typeof action.data.movement == 'boolean' ? (action.data.movement ? MTB_MOVEMENT_TYPE.FREE : MTB_MOVEMENT_TYPE.NONE) : action.data.movement), entities);
                return { tokens: entities };
            }
        },
        content: async (trigger, action) => {
            let entityName = (!!action.data.global ? 'Everyone' : await game.MonksActiveTiles.entityName(action.data?.entity));
            return `<span class="action-style">${trigger.name}</span> of <span class="entity-style">${entityName}</span> to <span class="details-style">"${i18n(trigger.values.movement[action.data?.movement])}"</span>`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'requestroll', {
        name: 'Request Roll',
        ctrls: [
            {
                id: "entity",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                options: { show: ['token', 'within', 'players', 'previous', 'tagger'] },
                restrict: (entity) => { return (entity instanceof Token); },
                defaultType: "tokens"
            },
            {
                id: "request",
                name: "Request",
                list: () => { return MonksTokenBar.getNameList(MonksTokenBar.system._requestoptions); },
                type: "list",
                required: true
            },
            {
                id: "dc",
                name: "DC",
                type: "text",
                "class": "small-field"
            },
            {
                id: "flavor",
                name: "Flavor Text",
                type: "text"
            },
            {
                id: "rollmode",
                name: "Roll Mode",
                list: "rollmode",
                type: "list"
            },
            {
                id: "silent",
                name: "Bypass Dialog",
                type: "checkbox"
            },
            {
                id: "fastforward",
                name: "Auto Roll",
                type: "checkbox"
            },
            {
                id: "usetokens",
                name: "Continue with",
                list: "usetokens",
                type: "list"
            },
            {
                id: "continue",
                name: "Continue if",
                list: "continue",
                type: "list"
            }
        ],
        values: {
            'rollmode': {
                "roll": i18n('MonksTokenBar.PublicRoll'),
                "gmroll": i18n('MonksTokenBar.PrivateGMRoll'),
                "blindroll": i18n('MonksTokenBar.BlindGMRoll'),
                "selfroll": i18n('MonksTokenBar.SelfRoll')
            },
            'usetokens': {
                "all": "All Tokens",
                "fail": "Tokens that Fail",
                "succeed": "Tokens that Succeed"
            },
            'continue': {
                "always": "Always",
                "failed": "Any Failed",
                "passed": "Any Passed",
                "allfail": "All Failed",
                "allpass": "All Passed"
            }
        },
        group: 'monks-tokenbar',
        fn: async (args = {}) => {
            const { action, tile, tokens, userid, value, method, change, event } = args;
            let entities = await game.MonksActiveTiles.getEntities(args);

            //if (entities.length == 0)
            //    return;

            entities = entities.map(e => e.object);

            let request = await game.MonksActiveTiles.getValue(action.data?.request, args);

            let parts = request.split(':');
            let type = (parts.length > 1 ? parts[0] : '');
            let key = (parts.length > 1 ? parts[1] : parts[0]);

            let flavor = await game.MonksActiveTiles.getValue(action.data.flavor, args);

            /*
            if (flavor && flavor.includes("{{")) {
                let context = {
                    actor: tokens[0]?.actor?.toObject(false),
                    token: tokens[0]?.toObject(false),
                    speaker: tokens[0],
                    tile: tile.toObject(false),
                    entities: entities,
                    user: game.users.get(userid),
                    value: value,
                    scene: canvas.scene,
                    method: method,
                    change: change
                };

                const compiled = Handlebars.compile(flavor);
                flavor = compiled(context, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true }).trim();
            }
            */

            let dc = await game.MonksActiveTiles.getValue(action.data.dc, args);

            let savingthrow = new SavingThrowApp(MonksTokenBar.getTokenEntries(entities), { rollmode: action.data.rollmode, request: [{ type, key }], dc, flavor });
            savingthrow['active-tiles'] = { id: args._id, tile: args.tile.uuid, action: action };
            if (action.data.silent === true) {
                let msg = await savingthrow.requestRoll();
                if (action.data.fastforward === true) {
                    //need to delay slightly so the original action has time to save a state properly.
                    window.setTimeout(function () {
                        SavingThrow.onRollAll('all', msg, event?.nativeEvent);
                    }, 100);
                }
            }
            else
                savingthrow.render(true);

            //if we got here then we need to pause before continuing and wait until the request has been fulfilled
            return { pause: true, tokens: entities };
        },
        content: async (trigger, action) => {
            let parts = action.data?.request.split(':');
            let type = (parts.length > 1 ? parts[0] : '');
            let key = (parts.length > 1 ? parts[1] : parts[0]);
            let name = MonksTokenBar.getRequestName(MonksTokenBar.system.requestoptions, { type, key });
            let ctrl = trigger.ctrls.find(c => c.id == "entity");
            let entityName = await game.MonksActiveTiles.entityName(action.data?.entity || ctrl?.defvalue || "previous");
            return `<span class="action-style">${name}</span>${(action.data?.dc ? ', <span class="details-style">"DC' + action.data?.dc + '"</span>' : '')} for <span class="entity-style">${entityName}</span> ${(action.data?.usetokens != 'all' || action.data?.continue != 'always' ? ", Continue " + (action.data?.continue != 'always' ? ' if ' + trigger.values.continue[action.data?.continue] : '') + (action.data?.usetokens != 'all' ? ' with ' + trigger.values.usetokens[action.data?.usetokens] : '') : '')}`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'requestcontested', {
        name: 'Request Contested Roll',
        ctrls: [
            {
                id: "entity1",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                required: true,
                options: { show: ['token', 'within', 'players', 'previous'] },
                restrict: (entity) => { return (entity instanceof Token); },
                defaultType: 'tokens',
                placeholder: "Please select a token"
            },
            {
                id: "request1",
                name: "Request",
                list: () => { return MonksTokenBar.getNameList(MonksTokenBar.system.contestedoptions); },
                type: "list",
                required: true
            },
            {
                id: "entity2",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                required: true,
                options: { show: ['token', 'within', 'players', 'previous'] },
                restrict: (entity) => { return (entity instanceof Token); },
                defaultType: 'tokens',
                placeholder: "Please select a token"
            },
            {
                id: "request2",
                name: "Request",
                list: () => { return MonksTokenBar.getNameList(MonksTokenBar.system.contestedoptions); },
                type: "list",
                required: true
            },
            {
                id: "flavor",
                name: "Flavor Text",
                type: "text"
            },
            {
                id: "rollmode",
                name: "Roll Mode",
                list: "rollmode",
                type: "list"
            },
            {
                id: "silent",
                name: "Bypass Dialog",
                type: "checkbox"
            },
            {
                id: "fastforward",
                name: "Auto Roll",
                type: "checkbox"
            },
            {
                id: "usetokens",
                name: "Continue with",
                list: "usetokens",
                type: "list"
            }
        ],
        values: {
            'rollmode': {
                "roll": i18n('MonksTokenBar.PublicRoll'),
                "gmroll": i18n('MonksTokenBar.PrivateGMRoll'),
                "blindroll": i18n('MonksTokenBar.BlindGMRoll'),
                "selfroll": i18n('MonksTokenBar.SelfRoll')
            },
            'usetokens': {
                "all": "All Tokens",
                "fail": "Tokens that Fail",
                "succeed": "Tokens that Succeed"
            },
        },
        group: 'monks-tokenbar',
        fn: async (args = {}) => {
            const { action, tile, tokens, userid, value, method, change, event } = args;
            let entities1 = await game.MonksActiveTiles.getEntities(args, "tokens", action.data.entity1);
            let entities2 = await game.MonksActiveTiles.getEntities(args, "tokens", action.data.entity2);

            //if (entities1.length == 0 || entities2.length == 0)
            //    return;

            let entity1 = entities1[0].object;
            let entity2 = entities2[0].object;
            if (entity1.id == entity2.id && entities2.length > 1)
                entity2 = entities2[1].object;

            if (entity1.id == entity2.id)
                return;

            let request1 = foundry.utils.mergeObject((MonksTokenBar.getTokenEntries([entity1])[0] || {}), { request: action.data.request1 });
            let idx2 = entity1.id == entity2.id ? 1 : 0;
            let request2 = foundry.utils.mergeObject((MonksTokenBar.getTokenEntries([entity2])[idx2] || {}), { request: action.data.request2 });

            let flavor = action.data.flavor;

            if (flavor && flavor.includes("{{")) {
                let context = {
                    actor: tokens[0]?.actor?.toObject(false),
                    token: tokens[0]?.toObject(false),
                    speaker: tokens[0],
                    tile: tile.toObject(false),
                    entities: [entity1, entity2],
                    user: game.users.get(userid),
                    value: value,
                    scene: canvas.scene,
                    method: method,
                    change: change
                };

                const compiled = Handlebars.compile(flavor);
                flavor = compiled(context, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true }).trim();
            }

            let contested = new ContestedRollApp(
                [request1, request2],
                { rollmode: action.data.rollmode, request: action.data.request, flavor: flavor });
            contested['active-tiles'] = { id: args._id, tile: args.tile.uuid, action: action };
            if (action.data.silent === true) {
                let msg = await contested.requestRoll();
                if (action.data.fastforward === true) {
                    //need to delay slightly so the original action has time to save a state properly.
                    window.setTimeout(function () {
                        ContestedRoll.onRollAll('all', msg, event);
                    }, 100);
                }
            }
            else
                contested.render(true);

            //if we got here then we need to pause before continuing and wait until the request has been fulfilled
            return { pause: true, tokens: [entity1, entity2] };
        },
        content: async (trigger, action) => {
            let parts = action.data?.request1.split(':');
            let requesttype = (parts.length > 1 ? parts[0] : '');
            let request = (parts.length > 1 ? parts[1] : parts[0]);
            let name1 = MonksTokenBar.getRequestName(MonksTokenBar.system.requestoptions, { type: requesttype, key: request });
            parts = action.data?.request2.split(':');
            requesttype = (parts.length > 1 ? parts[0] : '');
            request = (parts.length > 1 ? parts[1] : parts[0]);
            let name2 = MonksTokenBar.getRequestName(MonksTokenBar.system.requestoptions, { type: requesttype, key: request });

            let entityName1 = await game.MonksActiveTiles.entityName(action.data?.entity1);
            let entityName2 = await game.MonksActiveTiles.entityName(action.data?.entity2);
            return `<span class="action-style">Contested Roll</span> <span class="entity-style">${entityName1}</span> <span class="details-style">"${name1}"</span> vs. <span class="entity-style">${entityName2}</span> <span class="details-style">"${name2}"</span> ${(action.data?.usetokens != 'all' ? ", Continue with " + trigger.values.usetokens[action.data?.usetokens] : '')}`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'filterrequest', {
        name: 'Redirect Request Results',
        group: 'monks-tokenbar',
        ctrls: [
            {
                id: "passed",
                name: "Passed Tokens Goto",
                type: "text"
            },
            {
                id: "failed",
                name: "Failed Tokens Goto",
                type: "text"
            },
            {
                id: "resume",
                name: "Continue to Landing",
                type: "text"
            },
        ],
        fn: async (args = {}) => {
            const { action, value } = args;

            let goto = [];
            if (action.data.failed) {
                var failed = await game.MonksActiveTiles.getValue(action.data.failed, args, null, { prop: "" });
                let data = { tokens: await Promise.all((value.tokenresults || []).filter(r => !r.passed).map(async (t) => { return await fromUuid(t.uuid); })), tag: failed };
                if (data.tokens.length)
                    goto.push(data);
            }

            if (action.data.passed) {
                var passed = await game.MonksActiveTiles.getValue(action.data.passed, args, null, { prop: "" });
                let data = { tokens: await Promise.all((value.tokenresults || []).filter(r => r.passed).map(async (t) => { return await fromUuid(t.uuid); })), tag: passed };
                if (data.tokens.length)
                    goto.push(data);
            }

            if (action.data.resume)
                goto.push({ tokens: value.tokens, tag: action.data.resume });

            return { goto: goto };
        },
        content: async (trigger, action, actions) => {
            return `<span class="logic-style">${trigger.name}</span>${(action.data.passed ? ', Passed goto <span class="tag-style">' + action.data.passed + '</span>' : '')}${(action.data.failed ? ', Failed goto <span class="tag-style">' + action.data.failed + '</span>' : '')}${(action.data.resume ? ', Resume at <span class="tag-style">' + action.data.resume + '</span>' : '')}`;
        }
    });

    app.registerTileAction('monks-tokenbar', 'assignxp', {
        name: 'Assign XP',
        ctrls: [
            {
                id: "entity",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                options: { show: ['token', 'within', 'players', 'previous'] },
                restrict: (entity) => { return (entity instanceof Token); },
                defaultType: "tokens"
            },
            {
                id: "xp",
                name: "XP",
                required: true,
                type: "number"
            },
            {
                id: "reason",
                name: "Reason",
                type: "text"
            },
            {
                id: "dividexp",
                name: "Divide XP",
                list: () => {
                    return divideXpOptions
                },
                type: "list"
            },
            {
                id: "silent",
                name: "Bypass Dialog",
                type: "checkbox"
            },
            {
                id: "fastforward",
                name: "Auto Assign",
                type: "checkbox"
            },
        ],
        group: 'monks-tokenbar',
        fn: async (args = {}) => {
            const { action, tile } = args;
            let entities = await game.MonksActiveTiles.getEntities(args);

            if (entities.length == 0)
                return;

            entities = entities.map(e => e.object);

            let xp = await game.MonksActiveTiles.getValue(action.data.xp, args);

            let assignxp = new AssignXPApp(entities, { xp: xp, reason: action.data.reason, dividexp: action.data.dividexp});
            if (action.data.silent === true) {
                let msg = await assignxp.assign();
                if (msg && action.data.fastforward === true)
                    return AssignXP.onAssignAllXP(msg);
                else
                    return msg;
            } else
                assignxp.render(true);

        },
        content: async (trigger, action) => {
            let ctrl = trigger.ctrls.find(c => c.id == "entity");
            let entityName = await game.MonksActiveTiles.entityName(action.data?.entity || ctrl?.defvalue || "previous");
            return `<span class="action-style">${trigger.name}</span> <span class="details-style">"${action.data?.xp}XP"</span> to <span class="entity-style">${entityName}</span>`;
        }
    });
});

Hooks.on("renderJournalSheet", (sheet, html, data) => {
    $("a.inline-request-roll", html).off("click").click(MonksTokenBar._onClickInlineRequestRoll.bind(sheet));
});

Hooks.on("renderJournalPageSheet", (sheet, html, data) => {
    $("a.inline-request-roll", html).off("click").click(MonksTokenBar._onClickInlineRequestRoll.bind(sheet));
});

Hooks.on("preUpdateChatMessage", (message, data, dif, userId) => {
    if (game.user.isGM && data.whisper != undefined) {
        let rollmode = message.getFlag('monks-tokenbar', 'rollmode');
        if (data.whisper.length == 0 && rollmode != "roll") {
            foundry.utils.setProperty(data, "flags.monks-tokenbar.oldroll", rollmode);
            foundry.utils.setProperty(data, "flags.monks-tokenbar.rollmode", "roll");
        } else if (data.whisper.length && rollmode == "roll") {
            let oldroll = message.getFlag('monks-tokenbar', 'oldrollmode') || "gmroll";
            foundry.utils.setProperty(data, "flags.monks-tokenbar.rollmode", oldroll);
        }
    }
});

Hooks.on("updateChatMessage", (message, data, dif, userId) => {
    let rollmode = message.getFlag('monks-tokenbar', 'rollmode');
    if (rollmode && message._rollExpanded) {
        message._rollExpanded = false;
    }
});

Hooks.on("updateActor", (actor, data, dif, userId) => {
    if (foundry.utils.getProperty(data, "system.details.xp") != undefined && game.user.isTheGM) {
        MonksTokenBar.system.checkXP(actor);
    }
});

Hooks.on("canvasInit", () => {
    if (MonksTokenBar.tokenbar) {
        MonksTokenBar.tokenbar.entries = [];
        MonksTokenBar.tokenbar.refresh();
    }
});

Hooks.on("updateUser", (user, data, options, userId) => {
    if (setting("include-actor") && foundry.utils.hasProperty(data, "character") && MonksTokenBar.tokenbar) {
        MonksTokenBar.tokenbar.refresh();
    }
});

Hooks.on("diceSoNiceRollComplete", (messageid) => {
    if (game.user.isGM) {
        let message = game.messages.find(m => m.id == messageid);
        if (message != undefined) {
            let flags = {};
            for (let key of Object.keys(foundry.utils.getProperty(message, "flags.monks-tokenbar") || {})) {
                if (key.startsWith('token')) {
                    let token = message.flags['monks-tokenbar'][key];
                    if (token.tempreveal && !token.reveal)
                        flags["token" + token.id] = { reveal: true };
                }
            }

            if (Object.keys(flags).length > 0)
                message.update({ flags: { 'monks-tokenbar': flags } });
        }
    }
})
