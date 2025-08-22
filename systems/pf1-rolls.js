import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting, MonksTokenBar } from "../monks-tokenbar.js"

export class PF1Rolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.savingThrows },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return true;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            log(message);
            /*
            if (message?.flags?.pf2e?.context != undefined && (message.flags.pf2e.context?.options?.includes("ignore") || message.flags.pf2e.context.type == 'ignore'))
                return false;
            else
                return true;*/
        });
    }

    get defaultStats() {
        return [{ stat: "attributes.ac.normal.total", icon: "fa-shield-alt" }, { stat: "skills.per.mod", icon: "fa-eye" }];
    }

    defaultRequest(app) {
        let allPlayers = (app.entries.filter(t => t.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? { type: 'skill', key: 'per' } : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    get canGrab() {
        if (game.modules.get("betterrolls5e")?.active)
            return false;
        return true;
    }

    getXP(actor) {
        return actor?.system.details.xp;
    }

    calcXP(actors, monsters) {
        let partySize = actors.length < 4 ? 3 : actors.length > 5 ? 6 : 4;
        //get the monster xp
        let combatxp = 0;
        for (let monster of monsters) {
            monster.xp = (MonksTokenBar.system.getXP(monster.actor)?.value || 0);
            let monsterXP = monster.xp / partySize;
            // round up to the nearest 5
            monsterXP = Math.ceil(monsterXP / 5) * 5;
            combatxp += monsterXP;
        };

        

        return combatxp * actors.length;
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = { rollMode: rollMode, event: e, skipDialog: fastForward, chatMessage: false };
        if (request.type == 'ability') {
            rollfn = actor.rollAbilityTest;
        }
        else if (request.type == 'save') {
            rollfn = actor.rollSavingThrow;
        }
        else if (request.type == 'skill') {
            rollfn = actor.rollSkill;
        }

        if (rollfn != undefined) {
            try {
                return rollfn.call(actor, request.key, opts)
                    .then((msg) => {
                        if (msg) {
                            let roll = Roll.fromJSON(msg.rolls[0]);
                            return callback(roll);
                        }
                    })
                    .catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch(err)
            {
                log('Error:', err);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            }
        } else
            return { id: id, error: true, msg: actor.name + i18n("MonksTokenBar.ActorNoRollFunction") };
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
}