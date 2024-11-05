import { BaseRolls } from "./base-rolls.js"
import { i18n, MonksTokenBar, log, setting } from "../monks-tokenbar.js"

export class FBLRolls extends BaseRolls {
    constructor() {
        super();

        this._config = CONFIG['fbl'];

        let attributes = {};
        for (let [k, v] of Object.entries(game.model.Actor.character.attribute))
            attributes[k] = v.label;

        let skills = {};
        for (let [k, v] of Object.entries(game.model.Actor.character.skill))
            skills[k] = v.label;

        this._requestoptions = [
            { id: "attribute", text: "MonksTokenBar.Skill", groups: attributes },
            { id: "skill", text: "MonksTokenBar.Ability", groups: skills },
        ];
    }

    get _supportedSystem() {
        return true;
    }

    rollSuccess(roll, dc, actorId, request) {
        let passed = roll.total >= dc;
        return { passed };
;
    }


    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollfn = null;
        let options = { rollMode: rollMode, fastForward: fastForward, chatMessage: false, event: e };
        let context = actor.sheet;
        if (request.type == 'attribute') {
            rollfn = actor.sheet.rollAttribute
        } else if (request.type == 'skill') {
            rollfn = actor.sheet.rollSkill
        }

        if (rollfn != undefined) {
            try {
                return rollfn.call(context, request.key, options).then((roll) => {
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
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") 
        }
    }
}