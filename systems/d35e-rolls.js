import { BaseRolls } from "./base-rolls.js"
import { i18n, MonksTokenBar, log, setting } from "../monks-tokenbar.js"

export class D35eRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "misc", text: '', groups: { init: i18n("MonksTokenBar.Initiative") } },
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.savingThrows },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return !game.settings.get('D35E', 'disableExperienceTracking');
    }

    getXP(actor) {
        return actor?.system.details.xp;
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

    get defaultStats() {
        return [{ stat: "attributes.ac.normal.total", icon: "fa-shield-alt" }, {stat:"skills.spt.value", icon: "fa-eye"}];
    }

    defaultRequest(app) {
        let allPlayers = (app.entries.filter(t => t.token.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? { type: 'skill', key: 'spt' } : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollfn = null;
        let options = { rollMode: rollMode, fastForward: fastForward, chatMessage: false, fromMars5eChatCard: true, event: e };
        let context = actor;
        let sysRequest = request.key;
        if (request.type == 'ability') {
            rollfn = actor.rollAbilityTest;
        }
        else if (request.type == 'save') {
            rollfn = actor.rollSavingThrow;
        }
        else if (request.type == 'skill') {
            rollfn = actor.rollSkill;
        } else {
            if (request.key == 'init') {
                rollfn = actor.rollInitiative;
                sysRequest = { createCombatants: false, rerollInitiative: game.user.isGM };
            }
        }

        if (rollfn != undefined) {
            try {
                if (request.type == 'save')
                    return rollfn.call(context, sysRequest, null, null, options).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                else
                    return rollfn.call(context, sysRequest, options).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch{
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
            }
        } else
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
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