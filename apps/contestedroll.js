import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js";

export class ContestedRollApp extends Application {
    constructor(entries, options = {}) {
        super(options);
        this.opts = options;

        this.rollmode = options?.rollmode || options?.rollMode || (game.user.getFlag("monks-tokenbar", "lastmodeCR") || 'roll');
        if (!["roll", "gmroll", "blindroll", "selfroll"].includes(this.rollmode))
            this.rollmode = "roll";
        this.requestoptions = (options.requestoptions || MonksTokenBar.system.contestedoptions);

        this.requestoptions = this.requestoptions.filter(g => g.groups);
        for (let attr of this.requestoptions) {
            attr.groups = foundry.utils.duplicate(attr.groups);
            for (let [k, v] of Object.entries(attr.groups)) {
                attr.groups[k] = v?.label || v;
            }
        }

        this.hidenpcname = (options?.hidenpcname != undefined ? options?.hidenpcname : null) || (game.user.getFlag("monks-tokenbar", "lastmodeHideNPCName") != undefined ? game.user.getFlag("monks-tokenbar", "lastmodeHideNPCName") : null) || false;
        this.flavor = options.flavor;

        let available = canvas.tokens.controlled.filter(t => t.actor.type != "group");
        if (game.user.targets.values()?.next()?.value)
            available.splice(Math.min(available.length, 2) - 1, 0, game.user.targets.values()?.next()?.value);

        this.entries = $.extend([{ token: null, request: MonksTokenBar.system.defaultContested() }, { token: null, request: MonksTokenBar.system.defaultContested() }], entries);

        this.entries = this.entries.map(e => {
            if (e.token == undefined)
                e.token = available.shift();
            e.request = MonksTokenBar.findBestRequest(e.request, this.requestoptions);
            return e;
        });

        this.callback = options.callback;
    }

    static get defaultOptions() {
       // let top = ($('#tokenbar').position()?.top || $('#hotbar').position()?.top || 300) - 260;
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "contestedroll",
            title: i18n("MonksTokenBar.ContestedRoll"),
            template: "./modules/monks-tokenbar/templates/contestedroll.html",
            width: 450,
            //top: top,
            popOut: true
        });
    }

    getData(options) {
        return {
            entries: this.entries,
            rollmode: this.rollmode,
            options: this.requestoptions,
            hidenpcname: this.hidenpcname,
            flavor: this.flavor,
        };
    }

    removeToken(e) {
        const idx = parseInt($(e.currentTarget).attr('data-index'));
        this.entries[idx].token = null;
        this.render(true);
    }

    async requestRoll(roll, evt) {
        let msg = null;
        if (this.entries[0].token != undefined && this.entries[1].token != undefined) {
            let msgEntries = this.entries.map((item, index) => {
                if (index > 1)
                    return null;

                let requests = item.request instanceof Array ? item.request : [item.request];
                requests = requests.map(r => {
                    if (!r) return;
                    r.name = MonksTokenBar.getRequestName(this.requestoptions, r);
                    return r;
                }).filter(r => !!r);

                let actor = item.token?.actor ? item.token.actor : item.token;
                let name = item.token.name;

                if (game.modules.get("anonymous")?.active) {
                    const api = game.modules.get("anonymous")?.api;
                    if (!api.playersSeeName(actor))
                        name = api.getName(actor);
                }
                
                return {
                    id: item.token.id,
                    uuid: item.token.document?.uuid || item.token.uuid,
                    actorid: actor.id,
                    requests: requests,
                    icon: (VideoHelper.hasVideoExtension(item.token?.document?.texture.src) || !item.token?.document?.texture ? actor.img : item.token.document.texture.src),
                    name: name,
                    realname: item.token.name,
                    showname: actor.hasPlayerOwner || this.hidenpcname !== true,
                    showtoken: actor.hasPlayerOwner || item.token.document.hidden !== true,
                    npc: !actor.hasPlayerOwner,
                    passed: 'waiting',
                    keys: item.keys,
                };
            });

            let flavor = this.flavor;
            let rollmode = this.rollmode; //$('#contestedroll-rollmode', this.element).val();
            game.user.setFlag("monks-tokenbar", "lastmodeCR", rollmode);
            game.user.setFlag("monks-tokenbar", "lastmodeHideNPCName", this.hidenpcname);
            let modename = (rollmode == 'roll' ? i18n("MonksTokenBar.PublicRoll") : (rollmode == 'gmroll' ? i18n("MonksTokenBar.PrivateGMRoll") : (rollmode == 'blindroll' ? i18n("MonksTokenBar.BlindGMRoll") : i18n("MonksTokenBar.SelfRoll"))));
            let requestdata = {
                rollmode: rollmode,
                modename: modename,
                tokens: msgEntries,
                canGrab: MonksTokenBar.system.canGrab,
                showAdvantage: MonksTokenBar.system.showAdvantage,
                options: this.opts,
                what: 'contestedroll',
            };

            Hooks.callAll('monks-tokenbar.requestContested', requestdata);

            const html = await renderTemplate("./modules/monks-tokenbar/templates/contestedrollchatmsg.html", requestdata);

            delete requestdata.tokens;
            delete requestdata.canGrab;
            for (let i = 0; i < msgEntries.length; i++)
                requestdata["token" + msgEntries[i].id] = msgEntries[i];

            let requestedPlayers = [game.user.id];
            for (let i = 0; i < 2; i++) {
                let token = this.entries[i].token;
                if (token.actor != undefined) {
                    for (var key in token.actor.ownership) {
                        if (key != 'default' && token.actor.ownership[key] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
                            if (requestedPlayers.find(t => t == key) == undefined)
                                requestedPlayers.push(key);
                        }
                    }
                }
            }

            log('create chat request');
            let chatData = {
                user: game.user.id,
                content: html,
                flavor: flavor,
                flags: { core: { canPopout: true } }
            };
            if (rollmode == 'selfroll')
                chatData.whisper = [game.user.id];
            else if (rollmode == 'blindroll')
                chatData.whisper = requestedPlayers;

            //chatData.flags["monks-tokenbar"] = {"testmsg":"testing"};
            foundry.utils.setProperty(chatData, "flags.monks-tokenbar", requestdata);
            msg = await ChatMessage.create(chatData, {});
            msg.mtb_callback = this.opts.callback;
            if (setting('request-roll-sound-file') != '' && rollmode != 'selfroll' && roll !== false)
                MonksTokenBar.playSound(setting('request-roll-sound-file'), requestedPlayers);
            this.requestingResults = true;
            this.close();

            if (this['active-tiles'])
                msg.setFlag('monks-tokenbar', 'active-tiles', this['active-tiles']);

            if (roll === true)
                ContestedRoll.onRollAll('all', msg, evt);
            else {
                let ids = this.entries.filter(e => e.fastForward).map(e => e.id);
                if (ids.length > 0)
                    ContestedRoll.onRollAbility(ids, msg, true, this.opts);
            }
        } else
            ui.notifications.warn(i18n("MonksTokenBar.RequestActorMissing"));

        return msg;
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.item-delete', html).click($.proxy(this.removeToken, this));

        $('.dialog-button.request', html).click($.proxy(this.requestRoll, this));
        $('.dialog-button.request-roll', html).click($.proxy(this.requestRoll, this, true));
        $('.dialog-button.save-macro', html).click(this.saveToMacro.bind(this));
        $('.dialog-button.copy-macro', html).click(this.copyMacro.bind(this));

        $('#monks-tokenbar-flavor', html).blur($.proxy(function (e) {
            this.flavor = $(e.currentTarget).val();
        }, this));

        $('#contestedroll-hidenpc', html).change($.proxy(function (e) {
            this.hidenpcname = $(e.currentTarget).is(':checked');
        }, this));

        $('.request-roll', html).change($.proxy(function (e) {
            let value = $(e.currentTarget).val();
            let parts = value.split(":");
            let type = parts.length > 1 ? parts[0] : "";
            let key = parts.length > 1 ? parts[1] : parts[0];
            this.entries[e.target.dataset.index].request = { type, key, slug: `${type}${type ? ':' : ''}${key}` };
        }, this));
        $('#contestedroll-rollmode', html).change($.proxy(function (e) {
            this.rollmode = $(e.currentTarget).val();
        }, this));

        // Not sure why the contested roll value isn't being displayed.  The value is there, but the select isn't displaying it.
        window.setTimeout(() => { 
            $('.request-roll[data-index="0"]', html).val(this.entries[0].request[0].slug);
            $('.request-roll[data-index="1"]', html).val(this.entries[1].request[0].slug);
        }, 100);
    };

    async copyMacro() {
        //copy the request to the clipboard
        let macroCmd = `game.MonksTokenBar.requestContestedRoll({token:${this.entries[0].token ? `'${this.entries[0].token?.name}'` : "null"}, request:${this.entries[0].request ? JSON.stringify(this.entries[0].request) : 'null'}},{token:${this.entries[1].token ? `'${this.entries[1].token?.name}'` : "null"}, request:${this.entries[1].request ? JSON.stringify(this.entries[1].request) : 'null'}},{silent:false, fastForward:false${this.flavor != undefined ? ", flavor:\"" + this.flavor.replaceAll("\"", "`") + "\"" : ''}, rollMode:'${this.rollmode}'})`;
        await game.clipboard.copyPlainText(macroCmd);
        ui.notifications.info(i18n("MonksTokenBar.MacroCopied"));
    }

    async saveToMacro() {
        let name = "Contested Roll";

        let folder = game.folders.find(f => { return f.type == "Macro" && f.name == "Monk's Tokenbar" });
        if (!folder) {
            folder = await Folder.create(new Folder({ "type": "Macro", "folder": null, "name": "Monk's Tokenbar", "color": null, "sorting": "a" }));
        }

        let macroCmd = `game.MonksTokenBar.requestContestedRoll({token:${this.entries[0].token ? `'${this.entries[0].token?.name}'` : "null"}, request:${this.entries[0].request ? JSON.stringify(this.entries[0].request) : 'null'}},{token:${this.entries[1].token ? `'${this.entries[1].token?.name}'` : "null"}, request:${this.entries[1].request ? JSON.stringify(this.entries[1].request) : 'null'}},{silent:false, fastForward:false${this.flavor != undefined ? ", flavor:\"" + this.flavor.replaceAll("\"", "`") + "\"" : ''}, rollMode:'${this.rollmode}'})`;

        const macro = await Macro.create({ name: name, type: "script", scope: "global", command: macroCmd, folder: folder.id });
        macro.sheet.render(true);
    }
}

export class ContestedRoll {
    /*
     *         if (!game.user.isGM) {
            MonksTokenBar.emit('rollability', { type: 'contestedroll', senderId: game.user.id, response: [{ actorid: actorid, roll: roll }], msgid: message.id });
        } else {
            const revealDice = MonksTokenBar.revealDice();
            await ContestedRoll.updateContestedRoll([{ actorid: actorid, roll: roll }], message, revealDice && !fastForward);
        }*/
    static async rollDice(dice) {
        let r = new Roll(dice);
        r.evaluate();
        return r;
    }

    static async returnRoll (id, roll, actor, rollmode, msgId) {
        log("Roll", roll, actor);

        if (roll != undefined) {
            let finishroll;

            let canSee = (rollmode == 'roll' ? null : ChatMessage.getWhisperRecipients("GM").map(w => { return w.id }));
            let cantSee = [];
            let owners = actor.ownership.default == CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER ?
                game.users.filter(u => !u.isGM).map(u => u.id) :
                Object.entries(actor.ownership).filter(([k, v]) => game.users.get(k)?.isGM === false && v == CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map(([k, v]) => k);

            if (rollmode == 'gmroll') {
                canSee = canSee.concat(owners);
                cantSee = game.users.filter(u => !canSee.includes(u.id)).map(u => u.id);
            } else if (rollmode == 'blindroll')
                cantSee = owners;

            if (game.dice3d != undefined && roll instanceof Roll && roll.ignoreDice !== true && MonksTokenBar.system.showRoll && !game.settings.get("core", "noCanvas") && game.system.id != "dnd5e") {
                let promises = [game.dice3d.showForRoll(roll, game.user, true, canSee, cantSee.includes(game.user.id), (rollmode == 'selfroll' ? msgId : null))];
                if (cantSee.length) {
                    roll.ghost = true;
                    promises.push(game.dice3d.showForRoll(roll, game.user, true, cantSee, canSee.includes(game.user.id), null));
                }
                finishroll = Promise.all(promises).then(() => {
                    return { id: id, roll: roll, reveal: true, userid: game.userId };
                });
            } else {
                finishroll = new Promise((resolve) => {
                    resolve({ id: id, roll: roll, reveal: true, userid: game.userId })
                });
            }
            const sound = MonksTokenBar.getDiceSound();
            if (sound != undefined && (rollmode != 'selfroll' || setting('gm-sound')))
                MonksTokenBar.playSound(sound, (rollmode == 'roll' || rollmode == 'gmroll' ? 'all' : canSee.concat(cantSee)));

            return { id: id, roll: roll, finish: finishroll };
        }
    }

    static async _rollAbility(data, requests, rollmode, ffwd, e, msgId) {
        //let actor = game.actors.get(data.actorid);
        let tokenOrActor = await fromUuid(data.uuid)
        let actor = tokenOrActor?.actor ? tokenOrActor.actor : tokenOrActor;
        let fastForward = ffwd || (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey);

        if (actor != undefined) {
            let request = requests instanceof Array ? (requests.length == 1 ? requests[0] : null) : requests;
            if (!request && requests.length > 1) {
                // Select which of the requests to use
                if (ffwd) {
                    request = requests[0];
                } else {
                    let buttons = requests.map(r => {
                        let value = MonksTokenBar.system.getValue(actor, r.type, r.key, e);
                        let label = r.name + (value != undefined ? ` (${value > 0 ? "+" : ""}${value})` : '');
                        return {
                            label: label,
                            callback: () => r
                        }
                    });
                    request = await Dialog.wait({
                        title: "Please pick a roll",
                        content: "",
                        focus: true,
                        close: () => { return null; },
                        buttons: buttons
                    }, { classes: ["savingthrow-picker"], width: 300 });
                }
            }

            if (!request)
                return;

            if (request.type == 'dice') {
                //roll the dice
                return ContestedRoll.rollDice(request.key).then((roll) => {
                    return ContestedRoll.returnRoll(data.id, roll, actor, rollmode).then((result) => { if (result) result.request = request; return result; });
                });
            } else {
                if (MonksTokenBar.system._supportedSystem) { //game.system.id == 'dnd5e' || game.system.id == 'sw5e' || game.system.id == 'pf1' || game.system.id == 'pf2e' || game.system.id == 'tormenta20' || game.system.id == 'ose' || game.system.id == 'sfrpg') {
                    return MonksTokenBar.system.roll({ id: data.id, actor: actor, request: request, fastForward: fastForward }, function (roll) {
                        return ContestedRoll.returnRoll(data.id, roll, actor, rollmode, msgId).then((result) => { if (result) result.request = request; return result; });
                    }, e);
                } else
                    ui.notifications.warn(i18n("MonksTokenBar.UnknownSystem"));
            }
        }
    }

    static async onRollAbility(ids, message, fastForward, evt) {
        if (fastForward == undefined) fastForward = setting("bypass-roll-dialog");
        if (ids == undefined) return;
        if (!$.isArray(ids))
            ids = [ids];

        if (evt && evt.preventDefault && evt.stopPropagation) {
            evt.preventDefault();
            evt.stopPropagation();
        }

        let flags = message.flags['monks-tokenbar'];
        let rollmode = message.getFlag('monks-tokenbar', 'rollmode');

        let promises = [];
        for (let id of ids) {
            let msgtoken = flags["token" + id];
            if (msgtoken != undefined && msgtoken.roll == undefined) {
                //let actor = game.actors.get(msgtoken.actorid);
                let tokenOrActor = await fromUuid(msgtoken.uuid);
                let actor = tokenOrActor?.actor ? tokenOrActor.actor : tokenOrActor;
                if (actor != undefined) {
                    //roll the dice, using standard details from actor
                    let keys = msgtoken.keys || {};
                    let e = Object.assign({}, evt);
                    if (!e.target)
                        e.target = evt?.target;
                    e.ctrlKey = evt?.ctrlKey;
                    e.altKey = evt?.altKey;
                    e.shiftKey = evt?.shiftKey;
                    e.metaKey = evt?.metaKey;

                    for (let [k, v] of Object.entries(keys))
                        e[k] = evt[k] || v;
                    MonksTokenBar.system.parseKeys(e, keys);

                    promises.push(ContestedRoll._rollAbility({ id: id, uuid: msgtoken.uuid }, msgtoken.requests, rollmode, fastForward, e, message.id));
                }
            }
        };

        return Promise.all(promises).then(async (response) => {
            log('roll all finished', response);
            if (!game.user.isGM) {
                let responses = response.map(r => { return { id: r.id, roll: r.roll, request: r.request }; });
                MonksTokenBar.emit('rollability',
                    {
                        type: 'contestedroll',
                        msgid: message.id,
                        response: responses
                    }
                );

                let promises = response.filter(r => r.finish != undefined).map(r => { return r.finish; });
                if (promises.length) {
                    Promise.all(promises).then(response => {
                        ContestedRoll.finishRolling(response, message);
                    });
                }
            } else {
                const revealDice = MonksTokenBar.revealDice();
                return await ContestedRoll.updateMessage(response, message, revealDice);
            }
        });

    }

    static async updateMessage(updates, message, reveal = true) {
        if (updates == undefined) return;

        let content = $(message.content);

        let flags = {};
        let promises = [];

        for (let update of updates) {
            if (update != undefined) {
                let msgtoken = foundry.utils.duplicate(message.getFlag('monks-tokenbar', 'token' + update.id));
                log('updating actor', msgtoken, update.roll);

                if (update.roll) {
                    let tooltip = '';
                    update.roll = MonksTokenBar.intoRoll(update.roll);
                    if (update.roll instanceof Roll) {
                        msgtoken.roll = update.roll.toJSON();
                        if (msgtoken.roll.terms.length)
                            msgtoken.roll.terms = foundry.utils.duplicate(msgtoken.roll.terms);
                        for (let i = 0; i < msgtoken.roll.terms.length; i++) {
                            if (msgtoken.roll.terms[i] instanceof foundry.dice.terms.RollTerm)
                                msgtoken.roll.terms[i] = msgtoken.roll.terms[i].toJSON();
                        }
                        msgtoken.total = update.roll.total;
                        msgtoken.reveal = update.reveal || reveal;
                        msgtoken.request = update.request;
                        tooltip = await update.roll.getTooltip();

                        Hooks.callAll('tokenBarUpdateRoll', this, message, update.id, msgtoken.roll);
                    }

                    $('.item[data-item-id="' + update.id + '"] .dice-roll .dice-tooltip', content).remove();
                    let tooltipElem = $(tooltip);
                    if (!tooltipElem.hasClass("dice-tooltip") && !tooltipElem.hasClass("dice-tooltip-collapser")) {
                        tooltipElem = $("<div>").addClass("dice-tooltip").append(tooltipElem);
                    }

                    $(tooltip).removeClass("expanded").insertAfter($('.item[data-item-id="' + update.id + '"] .item-row', content));
                    $('.item[data-item-id="' + update.id + '"] .item-row .item-roll', content).remove();
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls .dice-total', content).remove();
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls', content).append(
                        `<div class="reroll"></div><div class="dice-total flexrow noselect" style="display:none;">
                        <div class= "dice-result noselect ${(msgtoken.reveal ? 'reveal' : '')}"><span class="total">${msgtoken.total}</span></div >
                        <a class="item-control roll-result" title="${(game.user.isGM || rollmode == 'roll' ? i18n("MonksTokenBar.RollResult") : '')}" data-control="rollResult">
                            <i class="fas"></i>
                        </a>
                    </div >`);
                    flags["token" + update.id] = msgtoken;
                } else if (update.error === true) {
                    ui.notifications.warn(msgtoken.name + ' ' + update.msg);

                    $('.item[data-item-id="' + update.id + '"] .item-row .item-roll', content).remove();
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls .dice-total', content).remove();
                    $('.item[data-item-id="' + update.id + '"] .item-row .roll-controls', content).append(
                        `<div class="dice-total flexrow noselect"><div class="dice-result noselect">Error!</div ></div >`);
                    msgtoken.reveal = true;
                    msgtoken.error = true;
                    flags["token" + update.id] = msgtoken;
                }

                if (update.finish != undefined)
                    promises.push(update.finish);
            }
        }

        if (game.system.id == 'dnd5e') {
            let rolls = [];
            for (let key of Object.keys(foundry.utils.getProperty(message, "flags.monks-tokenbar"))) {
                if (key.startsWith('token')) {
                    let token = flags[key] || message.flags['monks-tokenbar'][key];
                    if (token.roll) {
                        rolls.push(token.roll);
                    }
                }
            }
            message.rolls = rolls;
            await message.update({ rolls });
        }

        await message.update({ content: content[0].outerHTML, flags: { 'monks-tokenbar': flags } }).then(() => {
            ContestedRoll.checkResult(message);
        });

        if (promises.length) {
            Promise.all(promises).then(response => {
                log('rolls revealed', response);
                ContestedRoll.finishRolling(response, message);
            });
        }

        let count = 0;
        let winner = null;
        let tokenresults = Object.entries(message.flags['monks-tokenbar'])
            .filter(([k, v]) => {
                return k.startsWith('token')
            })
            .map(([k, token]) => {
                if (token.roll) {
                    count++;

                    if (!winner || winner.result < token.roll?.total)
                        winner = { id: token.id, result: token.roll.total };
                }

                return {
                    id: token.id,
                    uuid: token.uuid,
                    roll: token.roll,
                    name: token.name,
                    actor: game.actors.get(token.actorid)
                }
            });

        if (count == tokenresults.length) {
            // Set the winner
            let tkn = tokenresults.find(t => t.id == winner.id);
            tkn.passed = true;

            let result = { tokenresults: tokenresults, passed: winner };

            Hooks.callAll('monks-tokenbar.updateContested', result, message);

            if (message.getFlag('monks-tokenbar', 'active-tiles')) {
                let restart = message.getFlag('monks-tokenbar', 'active-tiles');
                let tile = await fromUuid(restart.tile);

                if (restart.action.data.usetokens == 'fail' || restart.action.data.usetokens == 'succeed') {
                    result.tokens = result.tokenresults.filter(r => r.passed == (restart.action.data.usetokens == 'succeed'));
                } else {
                    result.tokens = foundry.utils.duplicate(result.tokenresults);
                }
                for (let i = 0; i < result.tokens.length; i++) {
                    result.tokens[i] = await fromUuid(result.tokens[i].uuid);
                }

                tile.resumeActions(restart.id, result);
            }

            if (message.mtb_callback)
                message.mtb_callback.call(message, result, message.getFlag('monks-tokenbar', 'options'));
            return result;
        }
    }

    static async finishRolling(updates, message, event) {
        if (event?.stopPropagation) event.stopPropagation();
        if (event?.preventDefault) event.preventDefault();

        if (updates.length == 0) return;

        if (!game.user.isGM) {
            let response = updates.filter(r => { return r.userid == game.userId; });
            if (response.length) {
                MonksTokenBar.emit('finishroll',
                    {
                        type: 'contestedroll',
                        response: response,
                        msgid: message.id
                    }
                );
            }
        } else {
            let flags = {};
            for (let update of updates) {
                let msgtoken = foundry.utils.duplicate(message.getFlag('monks-tokenbar', 'token' + update.id));
                msgtoken.reveal = true;
                msgtoken.tempreveal = true;
                if (!msgtoken.roll && update.roll) {
                    //if the roll was not set, then set it
                    msgtoken.roll = MonksTokenBar.intoRoll(update.roll);
                }
                flags["token" + update.id] = msgtoken;
                log("Finish Rolling", msgtoken);
            }
            message.update({ flags: { 'monks-tokenbar': flags } });
        }
    }

    static getTokens(message) {
        let tokens = [];
        for (let [k, v] of Object.entries(message.flags['monks-tokenbar'])) {
            if (k.startsWith('token')) tokens.push(v);
        }
        return tokens;
    }

    static async checkResult(message) {
        //check to see that all tokens have been rolled
        let flags = {};
        let tokens = ContestedRoll.getTokens(message);

        let allRolled = (tokens[0].roll != undefined && tokens[1].roll != undefined);
        for (let i = 0; i < 2; i++) {
            let j = (i + 1) % 2;
            let passed = (!allRolled ? 'waiting' : (tokens[i].roll.total > tokens[j].roll.total ? 'won' : (tokens[i].roll.total < tokens[j].roll.total ? 'failed' : 'tied')));
            if (tokens[i].passed != passed) {
                let msgtoken = foundry.utils.duplicate(tokens[i]);
                msgtoken.passed = passed;
                flags['token' + msgtoken.id] = msgtoken;
            }
        }

        if(Object.values(flags).length > 0)
            message.update({ flags: { 'monks-tokenbar': flags } });

        /*
        if (tokens[0].roll != undefined && tokens[1].roll != undefined) {
            tokens[0].passed = (tokens[0].roll.total > tokens[1].roll.total ? 'won' : (tokens[0].roll.total < tokens[1].roll.total ? 'failed' : 'tied'));
            tokens[1].passed = (tokens[0].roll.total < tokens[1].roll.total ? 'won' : (tokens[0].roll.total > tokens[1].roll.total ? 'failed' : 'tied'));
        } else {
            tokens[0].passed = 'waiting';
            tokens[1].passed = 'waiting';
        }*/
    }

    static checkReveal(actors) {
        let hidden = actors.find(a => { return a.reveal !== true; });
        return (hidden == undefined);
    }

    static async setRollSuccess(tokenid, message, success, event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();

        let flags = {};
        let tokens = ContestedRoll.getTokens(message);
        for (let i = 0; i < 2; i++) {
            let passed = (tokens[i].id == tokenid ? 'won' : 'failed');
            if(tokens[i].passed != passed) {
                let msgtoken = foundry.utils.duplicate(tokens[i]);
                msgtoken.passed = passed;
                flags['token' + msgtoken.id] = msgtoken;
            }
        }

        if (Object.values(flags).length > 0)
            message.update({ flags: { 'monks-tokenbar': flags } });
    }

    static async onRollAll(tokentype, message, e) {
        if (game.user.isGM) {
            let flags = message.flags['monks-tokenbar'];
            let tokens = Object.keys(flags)
                .filter(key => key.startsWith('token'))
                .map(key => flags[key]);

            let ids = tokens.map(a => a.id);

            return ContestedRoll.onRollAbility(ids, message, true, e);
        }
    }

    static async _onClickToken(tokenId, event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
        event.cancelBubble = true;
        event.returnValue = false;

        let token = canvas.tokens.get(tokenId);
        let animate = MonksTokenBar.manageTokenControl(token, { shiftKey: event?.originalEvent?.shiftKey });

        return (animate ? canvas.animatePan({ x: token.x, y: token.y }) : true);
    }

    static async rerollFromMessage(message, tokenid, { heroPoint = !1, keep = "new" } = {}) {
        let msgToken = message.getFlag("monks-tokenbar", `token${tokenid}`);
        if (!msgToken) return;

        let token = fromUuidSync(msgToken.uuid);
        if (!token) return;

        let actor = token?.actor ? token.actor : token;

        if (!(actor.isOwner || game.user.isGM)) {
            return ui.notifications.error("Can't reroll for an actor you don't own");
        }

        if (heroPoint) {
            if (actor instanceof Actor && actor.type == "character") {
                const heroPointCount = actor.heroPoints.value;
                if (heroPointCount)
                    await token.actor.update({ "system.resources.heroPoints.value": Math.clamp(heroPointCount - 1, 0, 3) });
                else {
                    return ui.notifications.warn("Does not have a hero point");
                }
            } else {
                return ui.notifications.error("No actor selected");
            }
        }

        const oldRoll = msgToken.roll;
        const newData = foundry.utils.deepClone(oldRoll.data);
        const newOptions = { ...oldRoll.options, isReroll: !0 };
        const formula = oldRoll.formula.replace("2d20kh", "1d20").replace("2d20kl", "1d20");
        const newRoll = await new Roll(formula, newData, newOptions).evaluate();
        const rollmode = message.getFlag("monks-tokenbar", "rollmode");

        if (game.dice3d != undefined && newRoll instanceof Roll && newRoll.ignoreDice !== true && MonksTokenBar.system.showRoll && !game.settings.get("core", "noCanvas") && game.system.id != "dnd5e") {
            let canSee = (rollmode == 'roll' ? null : ChatMessage.getWhisperRecipients("GM").map(w => { return w.id }));
            let cantSee = [];
            let owners = actor.ownership.default == CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER ?
                game.users.filter(u => !u.isGM).map(u => u.id) :
                Object.entries(actor.ownership).filter(([k, v]) => game.users.get(k)?.isGM === false && v == CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER).map(([k, v]) => k);

            if (rollmode == 'gmroll') {
                canSee = canSee.concat(owners);
                cantSee = game.users.filter(u => !canSee.includes(u.id)).map(u => u.id);
            } else if (rollmode == 'blindroll')
                cantSee = owners;

            let promises = [game.dice3d.showForRoll(newRoll, game.user, true, canSee, cantSee.includes(game.user.id), (rollmode == 'selfroll' ? message.id : null))];
            if (cantSee.length) {
                roll.ghost = true;
                promises.push(game.dice3d.showForRoll(newRoll, game.user, true, cantSee, canSee.includes(game.user.id), null));
            }
            await Promise.all(promises);
        }

        if (!game.user.isGM) {
            MonksTokenBar.emit('updateReroll',
                {
                    type: 'contestedroll',
                    msgid: message.id,
                    tokenid: tokenid,
                    roll: newRoll,
                    options: { heroPoint, keep }
                }
            );
        } else {
            ContestedRoll.updateReroll(message, tokenid, newRoll, { heroPoint, keep });
        }
    }

    static async updateReroll(message, tokenid, roll, { heroPoint = !1, keep = "new" } = {}) {
        let msgToken = message.getFlag("monks-tokenbar", `token${tokenid}`);
        if (!msgToken) return;

        let requests = message.getFlag('monks-tokenbar', 'requests');

        const oldRoll = msgToken.roll;
        let keptRoll = roll;
        if (keep === "best" && oldRoll.total > roll.total || keep === "worst" && oldRoll.total < roll.total) {
            keptRoll = oldRoll;
        }

        let dc = message.getFlag('monks-tokenbar', 'dc');
        if ($.isNumeric(dc)) {
            dc = parseInt(dc);
            Object.assign(msgToken, MonksTokenBar.system.rollSuccess(keptRoll, dc, msgToken.actorid, msgToken.request || requests[0]));
        }

        msgToken.roll = keptRoll;
        msgToken.oldroll = oldRoll;
        msgToken.reroll = roll.toJSON();;
        msgToken.total = keptRoll.total;
        msgToken.rerollIcon = heroPoint ? "hospital-symbol" : "dice";
        message.setFlag("monks-tokenbar", `token${tokenid}`, msgToken);
        let flags = {};
        flags[`token${tokenid}`] = msgToken;

        let content = $(message.content);

        $(`.item[data-item-id="${tokenid}"] .reroll`, content).html(`<i class="fas fa-${msgToken.rerollIcon}"></i>`);
        $(`.item[data-item-id="${tokenid}"] .dice-roll .dice-total .total`, content).html(msgToken.total);

        let tooltip = await roll.getTooltip();
        let tooltipElem = $(tooltip);
        if (tooltipElem.hasClass("dice-tooltip")) {
            tooltipElem = $(".tooltip-part", tooltipElem).toggleClass("ignored", keptRoll == oldRoll);
        }
        $(`.item[data-item-id="${tokenid}"] .dice-tooltip .tooltip-part:gt(0)`, content).remove();
        $(`.item[data-item-id="${tokenid}"] .dice-tooltip .tooltip-part`, content).toggleClass("ignored", keptRoll == roll);
        $(`.item[data-item-id="${tokenid}"] .dice-tooltip`, content).append(tooltipElem);

        await message.update({ content: content[0].outerHTML, flags: flags });
    }
}

Hooks.on('controlToken', (token, delta) => {
    if (MonksTokenBar && MonksTokenBar.system && token.document.actor?.type != "group") {
        let contestedroll = MonksTokenBar.system.contestedroll;
        if (game.user.isGM && delta === true && contestedroll != undefined && contestedroll._state != -1) {
            for (let entry of contestedroll.entries) {
                if (entry.token == undefined) {
                    entry.token = token;
                    break;
                }
            }
            contestedroll.render(true);
        }
    }
});

Hooks.on("renderContestedRollApp", (app, html) => {
    for (let i = 0; i < 2; i++) {
        let request = app.entries[i].request instanceof Array ? app.entries[i].request : [app.entries[i].request];
        $(`.request-roll[data-index="${i}"]`, html).val(request.type + ":" + request.key);
    }
    $('#contestedroll-rollmode', html).val(app.rollmode);
});

Hooks.on("renderChatMessage", async (message, html, data) => {
    const svgCard = html.find(".monks-tokenbar.contested-roll");
    if (svgCard.length !== 0) {
        html.addClass("monks-tokenbar");
        if (!game.user.isGM)
            html.find(".gm-only").remove();
        if (game.user.isGM)
            html.find(".player-only").remove();

        //let dc = message.getFlag('monks-tokenbar', 'dc');
        let rollmode = message.getFlag('monks-tokenbar', 'rollmode');
        let revealAll = ContestedRoll.checkReveal(ContestedRoll.getTokens(message));

        let items = $('.item', html);
        for (let i = 0; i < items.length; i++) {
            var item = items[i];
            let tokenId = $(item).attr('data-item-id');
            let msgtoken = message.getFlag('monks-tokenbar', 'token' + tokenId); //actors.find(a => { return a.id == actorId; });
            if (msgtoken) {
                //let actor = game.actors.get(msgtoken.actorid);
                let tokenOrActor = await fromUuid(msgtoken.uuid);
                let actor = tokenOrActor?.actor ? tokenOrActor.actor : tokenOrActor;

                $(item).toggle(game.user.isGM || rollmode == 'roll' || rollmode == 'gmroll' || (rollmode == 'blindroll' && actor.isOwner));

                if (game.user.isGM || actor?.isOwner)
                    $('.item-image', item).on('click', $.proxy(ContestedRoll._onClickToken, this, msgtoken.id));
                $('.token-roll-container', item).contextmenu((ev) => {
                    MonksTokenBar.contextId = tokenId;//$(ev.currentTarget).closest(".item").data("itemId");
                    let elem = $(ev.currentTarget).closest(".item");
                    elem.closest(".chat-message").css("position", "relative");
                    var r = document.querySelector(':root');
                    r.style.setProperty('--monks-tokenbar-context-top', `${elem.position().top + elem.height()}px`);
                });
                $('.item-roll', item).toggle(msgtoken.roll == undefined && (game.user.isGM || (actor.isOwner && rollmode != 'selfroll'))).click($.proxy(ContestedRoll.onRollAbility, this, msgtoken.id, message, null));
                $('.dice-total', item).toggle(msgtoken.error === true || (msgtoken.roll != undefined && (game.user.isGM || rollmode == 'roll' || (actor.isOwner && rollmode != 'selfroll'))));

                if (msgtoken.roll != undefined && msgtoken.roll.class.includes("Roll")) {
                    //let roll = Roll.fromData(msgtoken.roll);
                    let showroll = game.user.isGM || rollmode == 'roll' || (rollmode == 'gmroll' && actor.isOwner);
                    $('.dice-result', item).toggleClass('reveal', showroll && msgtoken.reveal).toggle(showroll || (rollmode == 'blindroll' && actor.isOwner));
                    if (!msgtoken.reveal || (rollmode == 'blindroll' && !game.user.isGM))
                        $('.dice-result .total', item).html(!msgtoken.reveal ? '...' : '-');

                    let crit = MonksTokenBar.system.isCritical(msgtoken.roll);

                    if (game.user.isGM || rollmode == 'roll' || rollmode == 'gmroll') {
                        $('.dice-result', item)
                            .toggleClass('success', crit == "critical")
                            .toggleClass('fail', crit == "fumble");
                    }

                    if (!msgtoken.reveal && game.user.isGM)
                        $('.dice-result', item).on('click', $.proxy(ContestedRoll.finishRolling, ContestedRoll, [{ id: msgtoken.id, reveal: true }], message));
                    if (!actor.isOwner)
                        $('.dice-tooltip', item).remove();
                    else
                        $('.dice-tooltip', item).toggleClass('noshow', !showroll);

                    if (game.user.isGM)
                        $('.roll-result', item).click($.proxy(ContestedRoll.setRollSuccess, this, msgtoken.id, message, true));

                    $('.roll-result', item).toggleClass('result-passed selected', msgtoken.passed == 'won' && revealAll && (game.user.isGM || rollmode == 'roll'));
                    let resultClass = 'fa-ellipsis-h';
                    if (revealAll) {
                        if ((msgtoken.passed == 'won' || msgtoken.passed == 'failed') && (game.user.isGM || rollmode == 'roll')) {
                            resultClass = (msgtoken.passed == 'won' ? 'fa-check' : 'fa-times');
                        } else
                            resultClass = (rollmode != 'blindroll' ? 'fa-minus' : '');
                    }
                    $('.roll-result i', item).attr('class', `fas ${resultClass}`);
                        /*
                        .toggleClass('fa-check', msgtoken.passed == 'won' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-times', msgtoken.passed == 'failed' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-minus', msgtoken.passed == 'tied' && revealAll && (game.user.isGM || rollmode != 'blindroll'))
                        .toggleClass('fa-ellipsis-h', (msgtoken.passed == 'waiting' || !revealAll) && msgtoken.roll != undefined && (game.user.isGM || rollmode != 'blindroll'));
                        */
                }
            }

            $('.select-all', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, (ti) => {
                return ti;
            }));
            $('.select-saved', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, ti => ti?.passed === "won"));
            $('.select-failed', html).on('click', $.proxy(MonksTokenBar.selectActors, MonksTokenBar, message, ti => ti?.passed === "failed"));

            $('.grab-message', html).off('click.grabbing').on('click.grabbing', MonksTokenBar.setGrabMessage.bind(MonksTokenBar, message));

            //if there hasn't been a roll, then show the button if this is the GM or if this token is controlled by the current user

            //if this is the GM, and there's a roll, show the pass/fail buttons
            //highlight a button if the token hasn't had a result selected
            //toggle the button, if a result has been selected

            //if this is not the GM, and the results should be shown, and a result has been selected, then show the result
        };
    }
});