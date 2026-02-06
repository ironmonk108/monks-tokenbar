import { BaseRolls } from "./base-rolls.js"
import { i18n, MonksTokenBar, log, setting } from "../monks-tokenbar.js"

export class DrawSteelRolls extends BaseRolls {
    constructor() {
        super();

        this._config = CONFIG.DRAW_STEEL;

        this._requestoptions = [
            { id: "test", text: i18n("MonksTokenBar.Ability"), groups: this.config.characteristics },
        ].concat(this._requestoptions);
    }

    get _supportedSystem() {
        return true;
    }

    get showRoll() {
        return false;
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollFn = actor.rollCharacteristic;

        if (rollFn == undefined) {
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
        }

        let options = {
            rollMode: rollMode, // Is not really used by draw-steel at the moment
            evaluation: "message",
            event: e
        };

        try {
            return rollFn.call(actor, request.key, options).then((roll) => {
                if (roll instanceof ChatMessage) {
                    let msg = roll;
                    roll = roll.system.parts.find(part => part.type === "test")?.rolls[0]
                    msg.delete();
                }
                else {
                    roll = Array.isArray(rolls) && rolls.length ? rolls[rolls.length-1] : rolls;
                }
                return callback(roll);
            }).catch((err) => {
                console.error(err);
                return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
            });
        } catch (err) {
            console.error(err);
            return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") };
        }
    }
}