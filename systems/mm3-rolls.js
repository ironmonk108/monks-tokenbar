import { BaseRolls } from "./base-rolls.js"
import { i18n, log, MonksTokenBar, setting } from "../monks-tokenbar.js"

export class MM3Rolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "caracteristique", text: "MonksTokenBar.Ability", groups: this.config.caracteristiques },
            { id: "defense", text: "MonksTokenBar.SavingThrow", groups: this.config.defenses },
            { id: "compentence", text: "MonksTokenBar.Skill", groups: this.config.competences }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return false;
    }

    get defaultStats() {
        return [];
    }

    getLevel(actor) {
        let levels = foundry.utils.getProperty(actor, "system.puissance");
        return levels;
    }

    defaultRequest(app) {
        return { type: 'compentence', key: 'perception' };
    }

    defaultContested() {
        return 'caracteristique:force';
    }

    roll({ id, actor, request, rollMode, fastForward = false, message }, callback, e) {
        let rollfn = null;
        let options = { rollMode: rollMode, fastForward: fastForward, chatMessage: false, fromMars5eChatCard: true, event: e, advantage: e.advantage, disadvantage: e.disadvantage };
        let context = actor;
        let sysRequest = request.key;
        if (request.type == 'caracteristique') {
            rollfn = (actor.getFunction ? actor.getFunction("rollAbilityTest") : actor.rollAbilityTest);
        }
        else if (request.type == 'defense') {
            rollfn = actor.rollAbilitySave;
        }
        else if (request.type == 'compentence') {
            rollfn = actor.rollSkill;
        }

        if (rollfn != undefined) {
            try {
                return rollfn.call(context, sysRequest, options).then((roll) => {
                    return callback(roll);
                }).catch((e) => {
                    console.error(e);
                    return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
                });
            } catch (e) {
                console.error(e);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
            }
        } else
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }
}