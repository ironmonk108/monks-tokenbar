import { BaseRolls } from "./base-rolls.js"
import { i18n, MonksTokenBar, log, setting } from "../monks-tokenbar.js"

export class DrawSteelRolls extends BaseRolls {
    static DEGREES = {
        FAILURE_WITH_CONSEQUENCE: "failure-with-a-consequence",
        FAILURE: "failure",
        SUCCESS: "success",
        SUCCESS_WITH_CONSEQUENCE: "success-with-a-consequence",
        SUCCESS_WITH_REWARD: "success-with-a-reward"
    };

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

    get canReroll() {
        return false;
    }

    get showRoll() {
        return false;
    }

    get useDegrees() {
        return true;
    }

    get hasCritical() {
        return true;
    }

    getLevel(actor) {
        return actor.getRollData().level;
    }

    isCritical(roll) {
        if (!roll.terms[0] instanceof foundry.dice.terms.Die) return undefined;
        if (!roll.terms[0].number === 2) return undefined;
        if (!roll.terms[0].faces === 10) return undefined;
        if (!roll._evaluated) return undefined;

        const total = roll.terms[0].results.reduce((sum, d) => sum + d.result, 0);

        if (total >= roll.terms[0].options.criticalTreshold) return "critical"
        return false;
    }

    rollSuccess(roll, dc, actorId, request) {
        let total = roll.total;

        if (this.isCritical(roll)) return { passed: "success", degree: DrawSteelRolls.DEGREES.SUCCESS_WITH_REWARD };

        // Calculate tier based on total
        let tier = total >= 17 ? 3 : (total >= 12 ? 2 : 1);

        // Adjust tier based on edges and banes
        if (roll.options.edges === 2 && roll.options.banes === 0) tier++;
        else if (roll.options.edges === 0 && roll.options.banes === 2) tier--;

        // Clamp tier to valid range
        tier = Math.max(1, Math.min(3, tier));

        // Lookup table for outcomes: [tier 1, tier 2, tier 3]
        const { FAILURE_WITH_CONSEQUENCE, FAILURE, SUCCESS, SUCCESS_WITH_CONSEQUENCE, SUCCESS_WITH_REWARD } = DrawSteelRolls.DEGREES;
        const outcomes = {
            17: [
                { passed: "failed", degree: FAILURE_WITH_CONSEQUENCE },
                { passed: false, degree: FAILURE },
                { passed: true, degree: SUCCESS }
            ],
            12: [
                { passed: false, degree: FAILURE },
                { passed: true, degree: SUCCESS_WITH_CONSEQUENCE },
                { passed: true, degree: SUCCESS }
            ],
            0: [
                { passed: true, degree: SUCCESS_WITH_CONSEQUENCE },
                { passed: true, degree: SUCCESS },
                { passed: "success", degree: SUCCESS_WITH_REWARD }
            ]
        };

        const threshold = dc >= 17 ? 17 : (dc >= 12 ? 12 : 0);
        return outcomes[threshold][tier - 1];
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
            return rollFn.call(actor, request.key, options).then((rolls) => {
                let roll;
                if (rolls instanceof ChatMessage) {
                    let msg = rolls;
                    const versionParts = game.system.version.split('.').map(Number);
                    if (versionParts[0] === 0 && versionParts[1] >= 10) {
                        // Version 0.10.*
                        roll = rolls.system.parts.find(part => part.type === "test")?.rolls[0];
                    } else if (game.system.version === "0.9.2") {
                        // Version 0.9.2
                        rolls = msg.rolls;
                        roll = Array.isArray(rolls) && rolls.length ? rolls[rolls.length - 1] : rolls;
                    } else {
                        // All other versions
                        return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
                    }
                    msg.delete();
                }
                else {
                    roll = Array.isArray(rolls) && rolls.length ? rolls[rolls.length - 1] : rolls;
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