import { BaseRolls } from "./base-rolls.js"
import { i18n, log, MonksTokenBar, setting } from "../monks-tokenbar.js"

export class DnD5eRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "misc", text: '', groups: { death: "MonksTokenBar.DeathSavingThrow" } },
            { id: "ability", text: "MonksTokenBar.Ability", groups: this.config.abilities },
            { id: "save", text: "MonksTokenBar.SavingThrow", groups: this.config.abilities },
            { id: "skill", text: "MonksTokenBar.Skill", groups: this.config.skills }
        ].concat(this._requestoptions);

        /*
        this._defaultSetting = foundry.utils.mergeObject(this._defaultSetting, {
            stat2: "skills.prc.passive"
        });*/
    }

    get _supportedSystem() {
        return true;
    }

    get hasCritical() {
        return true;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            if (message.getFlag('monks-tokenbar', 'ignore') === true) {
                let msgid = message.getFlag('monks-tokenbar', 'msgid');
                if (msgid) {
                    let msg = game.messages.get(msgid);
                    if (msg) {
                        let rolls = foundry.utils.duplicate(msg.getFlag('monks-tokenbar', "rolls") || {});
                        let tokenid = message.getFlag('monks-tokenbar', 'tokenid');
                        rolls[tokenid] = message.rolls[0];
                        if (msg.isOwner)
                            msg.setFlag('monks-tokenbar', "rolls", rolls);
                        else
                            MonksTokenBar.emit("setRolls", { msgid, tokenid, roll: rolls[tokenid] });
                        foundry.utils.setProperty(msg, "flags.monks-tokenbar.rolls", rolls);
                    }
                }
                return false;
            } else
                return true;
        });
    }

    get defaultStats() {
        return [{ stat: "attributes.ac.value", icon: "fa-shield-alt" }, { stat: "skills.prc.passive", icon: "fa-eye" }];
    }

    getLevel(actor) {
        let levels = 0;
        if (actor.system?.classes) {
            levels = Object.values(actor.system?.classes).reduce((a, b) => {
                return a + (b?.levels || b?.level || 0);
            }, 0);
        } else
            levels = super.getLevel(actor);

        return levels;
    }

    get showXP() {
        if (!foundry.utils.isNewerVersion(game.system.version, "4.0"))
            return !game.settings.get('dnd5e', 'disableExperienceTracking');
        return game.settings.get('dnd5e', 'levelingMode') != "noxp";
    }

    getXP(actor) {
        return actor?.system?.details?.xp || 0;
    }

    calcXP(actors, monsters) {
        //get the monster xp
        let combatxp = 0;
        for (let monster of monsters) {
            monster.xp = (MonksTokenBar.system.getXP(monster.actor)?.value || 0);
            combatxp += monster.xp;
        };

        return combatxp;
    }

    get useDegrees() {
        return true;
    }

    defaultRequest(app) {
        //let allPlayers = (app.entries.filter(t => t.token.actor?.hasPlayerOwner).length == app.entries.length);
        //if all the tokens have zero hp, then default to death saving throw
        let allZeroHP = app.entries.filter(t => foundry.utils.getProperty(t.token.actor, "system.attributes.hp.value") == 0).length;
        if (allZeroHP == app.entries.length && allZeroHP != 0)
            return { type: 'misc', key: 'death' };

        // If there's an active combat and all the selected tokens are part of it, then off initiative
        if (game.combats.active && !game.combats.active.started) {
            if (!app.entries.find(t => !game.combats.active.combatants.find(c => c.token.id == t.token.id)))
                return { type: 'misc', key: 'init' };
        }
        return { type: 'skill', key: 'prc' }; //allPlayers ? { type: 'skill', key: 'prc' } : null;
    }

    defaultContested() {
        return 'ability:str';
    }

    get canGrab() {
        if (game.modules.get("betterrolls5e")?.active)
            return false;
        return true;
    }

    get showAdvantage() {
        return setting("add-advantage-buttons");
    }

    dynamicRequest(entries) {
        let tools = {};

        for (let entry of entries) {
            for (let item of (entry.token.actor?.items || [])) {
                if (item.type == 'tool') {
                    let sourceID = item.getFlag("core", "sourceId") || MonksTokenBar.slugify(item.name);
                    if (tools[sourceID] == undefined) {
                        tools[sourceID] = { label: item.name, count: 1 };
                    } else {
                        tools[sourceID].count = tools[sourceID].count + 1;
                    }
                }
            }
        }
        /*
        //get the first token's tools
        for (let item of entries[0].token.actor?.items) {
            if (item.type == 'tool') {
                let sourceID = item.getFlag("core", "sourceId") || item.id;
                //let toolid = item.name.toLowerCase().replace(/[^a-z]/gi, '');
                tools[sourceID] = item.name;
            }
        }
        //see if the other tokens have these tools
        if (Object.keys(tools).length > 0) {
            for (let i = 1; i < entries.length; i++) {
                for (let [k, v] of Object.entries(tools)) {
                    let tool = entries[i].token.actor.items.find(t => {
                        return t.type == 'tool' && (t.getFlag("core", "sourceId") || t.id) == k;
                    });
                    if (tool == undefined)
                        delete tools[k];
                }
            }
        }
        */

        if (Object.keys(tools).length == 0)
            return;

        return [{ id: 'tool', text: 'Tools', groups: tools }];
    }

    roll({ id, actor, request, rollMode, fastForward = false, message }, callback, e) {
        let rollfn = null;
        const config = {
            event: e,
            advantage: e.advantage,
            disadvantage: e.disadvantage,
        };
        const messageConfig = {
            create: false,
            rollMode,
        };
        // Actually, it's dialog options in case of skill/ability checks, but roll options for initiative roll
        const options = {
            configure: !Boolean(fastForward),
        };

        switch (request.type) {
            case 'ability':
                rollfn = actor.rollAbilityCheck.bind(actor);
                config.type = 'check';
                config.ability = request.key;
                break;
            case 'save':
                rollfn = actor.rollAbilityCheck.bind(actor);
                config.type = 'save';
                config.ability = request.key;
                break;
            case 'skill':
                rollfn = actor.rollSkill.bind(actor);
                config.skill = request.key;
                break;
            case 'tool':
                const item = actor.items.find(i => i.getFlag("core", "sourceId") === request.key
                    || MonksTokenBar.slugify(i.name) === request.key
                );

                if (item === undefined) {
                    return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoTool") };
                }

                rollfn = item.rollToolCheck.bind(item);
                break;
            case 'misc':
                if (request.key !== 'death') {
                    break;
                }
                // fallthrough
            case 'death':
                rollfn = actor.rollDeathSave.bind(actor);
                break;
            case 'init':
                rollfn = actor.rollInitiative.bind(actor);
                options.messageOptions = {
                    createCombatants: false,
                    rerollInitiative: true,
                    flags: {
                        'monks-tokenbar': {
                            ignore: true,
                            msgid: message.id,
                            tokenid: id,
                        },
                    },
                }
                break;
        }

        if (rollfn === null) {
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
        }

        try {
            return rollfn(config, options, messageConfig)
                .then((rolls) => {
                    const roll = Array.isArray(rolls) && rolls.length
                        ? rolls[0]
                        : rolls;

                    return callback(roll);
                })
                .catch((e) => {
                    console.error(e);
                    return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
                });
        } catch (e) {
            console.error(e);
            return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
        }
    }

    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "system.details.xp.value": parseInt(actor.system.details.xp.value) + parseInt(msgactor.xp)
        });

        if (setting("send-levelup-whisper") && actor.system.details.xp.value >= actor.system.details.xp.max) {
            ChatMessage.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: ChatMessage.getWhisperRecipients(actor.name)
            }).then(() => { });
        }
    }

    parseKeys(e, keys) {
        e.advantage = $(e?.originalEvent?.target).hasClass("advantage");
        e.disadvantage = $(e?.originalEvent?.target).hasClass("disadvantage");
        e.ctrlKey = e.ctrlKey || keys.disadvantage || e.disadvantage;
        e.altKey = e.altKey || keys.advantage || e.advantage;
    }

    getValue(actor, type, key) {
        let prop = type == "skill" ? "skills" : type == "save" ? "saves" : "attributes";
        let value = foundry.utils.getProperty(actor, "system." + prop + "." + key + ".total");
        return value;
    }
}