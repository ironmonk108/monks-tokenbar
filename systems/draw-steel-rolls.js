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

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollFn = actor.rollCharacteristic;

        if (rollFn == undefined) {
            return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
        }

        let options = {
            rollMode: rollMode, // Is not really used by draw-steel at the moment
            evaluation: "evaluate",
            event: e
        };

        try {
            return rollFn.call(actor, request.key, options).then((rolls) => {
                const roll = Array.isArray(rolls) && rolls.length ? rolls[0] : rolls;
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