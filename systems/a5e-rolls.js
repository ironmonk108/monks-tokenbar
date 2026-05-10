import { BaseRolls } from "./base-rolls.js";
import { i18n, MonksTokenBar, log } from "../monks-tokenbar.js";

export class A5eRolls extends BaseRolls {
    constructor() {
        super();

        this._requestoptions = [
            { id: "ability", text: "MonksTokenBar.Ability", groups: this.config.abilities },
            { id: "save", text: "MonksTokenBar.SavingThrow", groups: this.config.abilities },
            { id: "skill", text: "MonksTokenBar.Skill", groups: this.config.skills }
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message) => {
            log(message);
        });
    }

    async assignXP(msgactor) {
        const actor = game.actors.get(msgactor.id);

        await actor.update({
            "system.details.xp": parseInt(actor.system.details.xp) + parseInt(msgactor.xp)
        });
    }

    calcXP(actors, monsters) {
        return monsters.reduce((totalXP, monster) => {
            return totalXP + MonksTokenBar.system.getXP(monster.actor) || 0;
        }, 0);
    }

    get defaultStats() {
        return [
            { stat: "attributes.ac.value", icon: "fa-shield-alt" },
            { stat: "skills.prc.passive", icon: "fa-eye" }
        ];
    }

    getXP(actor) {
        const cr = parseFloat(actor?.system?.details?.cr || 0);
        let baseXp = 0;

        if (cr === 0.125) baseXp = CONFIG.A5E.CR_EXP_LEVELS['1/8'];
        else if (cr === 0.25) baseXp = CONFIG.A5E.CR_EXP_LEVELS['1/4'];
        else if (cr === 0.5) baseXp = CONFIG.A5E.CR_EXP_LEVELS['1/2'];
        else baseXp = CONFIG.A5E.CR_EXP_LEVELS[parseInt(cr, 10) > 30 ? 30 : cr];

        return actor?.system?.details?.elite ? baseXp * 2 : baseXp;
    }

    roll({ id, actor, request }, callback) {
        let rollfn = null;

        if (request.type == 'ability') rollfn = actor.rollAbilityCheck;
        else if (request.type == 'save') rollfn = actor.rollSavingThrow;
        else if (request.type == 'skill') rollfn = actor.rollSkillCheck;

        if (rollfn) {
            try {
                return rollfn.call(actor, request.key).then((roll) => {
                    return callback(roll);
                }).catch((e) => {
                    console.error(e);
                    return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
                });
            } catch (e) {
                console.error(e);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
            }
        } else
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }
}