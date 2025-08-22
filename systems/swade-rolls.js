import { BaseRolls } from "./base-rolls.js"
import { i18n, MonksTokenBar, log, setting } from "../monks-tokenbar.js"

export class SwadeRolls extends BaseRolls {
    constructor() {
        super();

        let attributes = {};
        for (let [k, v] of Object.entries(this.config.attributes))
            attributes[k] = v.long;

        this._requestoptions = [
            { id: "ability", text: i18n("MonksTokenBar.Attribute"), groups: attributes }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return false;
    }

    get showRoll() {
        return false;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            log(message);
        });
    }

    get defaultStats() {
        return [{ stat: "stats.toughness.value", icon: "fa-shield-alt" }];
    }

    /*defaultRequest(app) {
        let allPlayers = (app.tokens.filter(t => t.actor?.hasPlayerOwner).length == app.tokens.length);
        return (allPlayers ? 'skill:per' : null);
    }*/

    /*
    defaultContested() {
        return 'ability:str';
    }*/

    dynamicRequest(entries) {
        let skills = {};
        for (let entry of entries) {
            for (let item of (entry.token.actor?.items || [])) {
                if (item.type == 'skill') {
                    let sourceID = MonksTokenBar.slugify(item.name);
                    if (skills[sourceID] == undefined) {
                        skills[sourceID] = { label: item.name, count: 1 };
                    } else {
                        skills[sourceID].count = skills[sourceID].count + 1;
                    }
                }
            }
        }
        /*
        //get the first token's tools
        for (let item of entries[0].token.actor.items) {
            if (item.type == 'skill') {
                skills[item.name] = item.name;
            }
        }
        //see if the other tokens have these tools
        if (Object.keys(skills).length > 0) {
            for (let i = 1; i < entries.length; i++) {
                for (let [k, v] of Object.entries(skills)) {
                    let skill = entries[i].token.actor.items.find(t => {
                        return t.type == 'skill' && t.name == k;
                    });
                    if (skill == undefined)
                        delete skills[k];
                }
            }
        }
        */

        if (Object.keys(skills).length == 0)
            return;

        return [{ id: 'skill', text: 'Skills', groups: skills }];
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = { rollMode: rollMode, event: e, chatMessage: false };
        let sysRequest = request.key;
        if (request.type == 'ability') {
            sysRequest = request.key;
            rollfn = actor.rollAttribute;
        }
        else if (request.type == 'skill') {
            let item = actor.items.find(i => MonksTokenBar.slugify(i.name) == request.key && i.type == 'skill');
            if (item) {
                sysRequest = item.id;
                rollfn = actor.rollSkill;
            }
        } else {
            if (request.key == 'init') {
                rollfn = actor.rollInitiative;
                options.messageOptions = { flags: { 'monks-tokenbar': { ignore: true } } };
                sysRequest = { createCombatants: false, rerollInitiative: true, initiativeOptions: options };
            }
        }

        if (rollfn != undefined) {
            try {
                if (fastForward)
                    opts.suppressChat = true;

                return rollfn.call(actor, sysRequest, opts)
                    .then((roll) => {
                        return callback(roll);
                    })
                    .catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch (err) {
                log('Error:', err);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            }
        } else
            return { id: id, error: true, msg: actor.name + i18n("MonksTokenBar.ActorNoRollFunction") };
    }

    /*
    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "system.details.xp.value": actor.system.details.xp.value + msgactor.xp
        });

        if (setting("send-levelup-whisper") && actor.system.details.xp.value >= actor.system.details.xp.max) {
            ChatMessage.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: ChatMessage.getWhisperRecipients(actor.name)
            }).then(() => { });
        }
    }*/
}