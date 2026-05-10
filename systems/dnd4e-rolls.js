import { BaseRolls } from "./base-rolls.js"
import { i18n, MonksTokenBar, log, setting } from "../monks-tokenbar.js"

export class DnD4eRolls extends BaseRolls {
    constructor() {
        super();

        this._config = CONFIG.DND4EBETA || CONFIG.DND4E;

        let savingThrow = foundry.utils.duplicate(this.config.def);
        delete savingThrow.ac;

        this._requestoptions = [
            { id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: savingThrow },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.skills }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            log(message);
            /*if (message?.flags?.pf2e?.context != undefined && (message.flags.pf2e.context?.options?.includes("ignore") || message.flags.pf2e.context.type == 'ignore'))
                return false;
            else
                return true;*/
        });
    }

    /*
    get showXP() {
        return !game.settings.get('dnd4eBeta', 'disableExperienceTracking');
    }*/

    getXP(actor) {
        return actor?.system.details.exp;
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
        return [{ stat: "defences.ac.value", icon: "fa-shield-alt" }, { stat: "skills.prc.total", icon: "fa-eye" }];
    }

    defaultRequest(app) {
        let allPlayers = (app.entries.filter(t => t.token.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? { type: 'skill', key: 'prc' } : null);
    }

    defaultContested() {
        return 'ability:str';
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollfn = null;
        let options = { rollMode: rollMode, fastForward: fastForward, chatMessage: false, fromMars5eChatCard: true, event: e };
        let context = actor;
        if (request.type == 'ability') {
            rollfn = actor.rollAbility
        }
        else if (request.type == 'save') {
            rollfn = actor.rollDef;
        }
        else if (request.type == 'skill') {
            rollfn = actor.rollSkill;
        }

        if (rollfn != undefined) {
            try {
                return rollfn.call(context, request.key, options).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
            } catch{
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
            }
        } else
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }

    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "system.details.exp": parseInt(actor.system.details.exp) + parseInt(msgactor.xp)
        });
    }
}