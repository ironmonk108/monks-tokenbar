import { BaseRolls } from "./base-rolls.js"
import { i18n, log, MonksTokenBar, setting } from "../monks-tokenbar.js"

export class DS4Rolls extends BaseRolls {
    constructor() {
        super();

        this._config = CONFIG.DS4
        /* TODO: No point in exposing, until rolling dice is fixed
        this._requestoptions = [
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: this.config.i18nKeys.checks },
        ].concat(this._requestoptions);
        */
    }

    get _supportedSystem() {
        return true;
    }

    get showXP() {
        return true;
    }

    getLevel(actor) {
        return actor.system.progression?.level || 0;
    }

    calcXP(actors, monsters)  {
        let combatxp = 0;
        for (let monster of monsters) {
            monster.xp = (MonksTokenBar.system.getXP(monster.actor)?.value || 0);
            combatxp += monster.xp;
        };

        return combatxp;
    }

    getXP(actor) {
        return {
            value: actor?.system.progression?.experiencePoints || actor?.system.baseInfo?.experiencePoints || 0
        };
    }

    get defaultStats() {
        return [{ stat: "combatValues.hitPoints.value", icon: "fa-heart" },
        { stat: "combatValues.defense.total", icon: "fa-shield-alt" },
        { stat: "checks.perception", icon: "fa-eye" }];
    }

    /*  TODO: Rolls technically work, but results are not returned by the DS4 system (Promise<void>)

        defaultRequest(app) {
            let allPlayers = (app.entries.filter(t => t.token.actor?.hasPlayerOwner).length == app.entries.length);
            return (allPlayers ? 'skill:perception' : null);
        }
    
        defaultContested() {
            return 'skill:perception';
        }
    
        roll({ id, actor, request, fastForward = false }, callback, e) {
            let rollfn = null;
    
            rollfn = actor.rollCheck;
    
            if (rollfn != undefined) {
                try {
                    return rollfn.call(actor, request.key).then((roll) => { return callback(roll); }).catch(() => { return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") } });
                } catch {
                    return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
                }
            } else
                return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
        }
    */
    async assignXP(msgactor) {
        let actor = game.actors.get(msgactor.id);
        await actor.update({
            "system.progression.experiencePoints": parseInt(actor.system.progression.experiencePoints) + parseInt(msgactor.xp)
        });

        let levels = [
            0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13700, 15600, 17700, 20000
        ];

        // level list is zero-based
        if (setting("send-levelup-whisper") && actor.system.progression.experiencePoints >= levels[MonksTokenBar.system.getLevel(actor)]) {
            foundry.documents.ChatMessage.implementation.create({
                user: game.user.id,
                content: i18n("MonksTokenBar.Levelup"),
                whisper: foundry.documents.ChatMessage.implementation.getWhisperRecipients(actor.name)
            }).then(() => { });
        }
    }
}
