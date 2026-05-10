import { BaseRolls } from "./base-rolls.js"
import { i18n, log, setting, error, MonksTokenBar } from "../monks-tokenbar.js"

export class PF2eRolls extends BaseRolls {
    constructor() {
        super();

        const configSkills = this.config.skills;
        const skills = Object.keys(this.config.skills).reduce(function (result, key) {
            result[key] = configSkills[key].label
            return result
        }, {}) 

        this._requestoptions = [
            { id: "attribute", text: i18n("MonksTokenBar.Attribute"), groups: { perception: i18n("PF2E.PerceptionLabel") } },
            //{ id: "ability", text: i18n("MonksTokenBar.Ability"), groups: this.config.abilities },
            { id: "save", text: i18n("MonksTokenBar.SavingThrow"), groups: this.config.saves },
            { id: "skill", text: i18n("MonksTokenBar.Skill"), groups: skills }
        ].concat(this._requestoptions);

        /*
        this._defaultSetting = foundry.utils.mergeObject(this._defaultSetting, {
            stat2: "attributes.perception.value + 10"
        });*/
    }

    get _supportedSystem() {
        return true;
    }

    get hasCritical() {
        return true;
    }

    rollProperties(request) {
        return [];
    }

    get contestedoptions() {
        return this._requestoptions;
    }

    static activateHooks() {
        Hooks.on("preCreateChatMessage", (message, option, userid) => {
            let ctx = message.getFlag('pf2e', 'context');
            if (ctx != undefined && (ctx.options?.includes("ignore") || ctx.type == 'ignore'))
                return false;
            else
                return true;
        });
    }

    get defaultStats() {
        return [{ stat: "attributes.ac.value", icon: "fa-shield-alt" }, { stat: "perception.value + 10", icon: "fa-eye" }];
    }

    defaultRequest(app) {
        let allPlayers = (app.entries.filter(t => t.token?.actor?.hasPlayerOwner).length == app.entries.length);
        return (allPlayers ? { type: 'attribute', key: 'perception' } : null);
    }

    defaultContested() {
        return 'skill:athletics';
    }

    dynamicRequest(entries) {
        let lore = {};

        for (let entry of entries) {
            for (let item of (entry.token.actor?.items || entry.token?.items || [])) {
                if (item.type == 'lore') {
                    let sourceID = MonksTokenBar.slugify(item.name);
                    if (lore[sourceID] == undefined) {
                        lore[sourceID] = { label: item.name, count: 1 };
                    } else {
                        lore[sourceID].count = lore[sourceID].count + 1;
                    }
                }
            }
        }

        if (Object.keys(lore).length == 0)
            return;

        return [{ id: 'lore', text: 'Lore', groups: lore }];
    }

    get showXP() {
        return true;
    }

    getXP(actor) {
        return actor?.system.details.xp;
    }

    calcXP(actors, monsters) {
        var apl = { count: 0, levels: 0 };
        var xp = 0;
        let npcLevels = [];
        let hazardLevels = [];

        if (actors.length == 0 || monsters.length == 0)
            return 0;

        //get the actors
        for (let actor of actors) {
            apl.count = apl.count + 1;
            apl.levels = apl.levels + MonksTokenBar.system.getLevel(actor.actor);
        };
        let calcAPL = apl.count > 0 ? Math.round(apl.levels / apl.count) : 0;

        //get the monster xp
        for (let monster of monsters) {
            if (monster.actor.type == "hazard") {
                hazardLevels.push({
                    level: parseInt(MonksTokenBar.system.getLevel(monster.actor), 10),
                    isComplex: monster.actor.system.details.isComplex ?? false,
                });
            } else {
                npcLevels.push(parseInt(MonksTokenBar.system.getLevel(monster.actor), 10));
            }
        };

        xp = game.pf2e.gm.calculateXP(calcAPL, apl.count, npcLevels, hazardLevels, {
            proficiencyWithoutLevel: game.settings.get('pf2e', 'proficiencyVariant') === 'ProficiencyWithoutLevel',
        });

        return xp.xpPerPlayer;
    }

    get useDegrees() {
        return true;
    }

    rollSuccess(roll, dc, actorId, request) {
        let handleDegreeAdjusting = (relevantREs) => {
            let type = success > 0 ? success > 1 ? "criticalSuccess" : "success" : success < 0 ? "criticalFailure" : "failure";

            let edgeCases = { "to-critical-failure": -1, "to-failure": 0, "to-success": 1, "to-critical-success": 2 };
            let edgeCaseREs = relevantREs.filter(re => !!re.adjustment[type] && !!edgeCases[re.adjustment[type]]);

            if (edgeCaseREs.length) {
                // if there are any edge cases, we need to deal with them first
                success = edgeCases[edgeCaseREs[0].adjustment[type]];
                return [edgeCaseREs[0].label];
            } else {
                let degreeReasons = [];
                let adjustments = { "one-degree-better": 1, "two-degrees-better": 2, "one-degree-worse": -1, "two-degrees-worse": -2 };
                for (let re of relevantREs.filter(re => !!re.adjustment[type])) {
                    degreeReasons.push(re.label);
                    let adjustment = re.adjustment[type];
                    success = success + (adjustments[adjustment] ?? 0);
                }
                return degreeReasons;
            }
        }

        let total = roll.total;
        let success = (total >= dc) ? 1 : 0;
        if (total >= dc + 10) success++;
        if (total <= dc - 10) success--;

        const diceResult = roll.terms[0]?.results?.find(r => r.active)?.result;
        if (diceResult === 1) success--;
        if (diceResult === 20) success++;

        let properties = [];

        if (actorId && request) {
            let actor = game.actors.get(actorId);
            if (actor) {
                const relevantREs = actor.rules.filter(re => re.key === "AdjustDegreeOfSuccess" && re.selector === request.key);
                properties = handleDegreeAdjusting(relevantREs);
            }
        }

        let passed = success > 0 ? success > 1 ? "success" : true : success < 0 ? "failed" : false;
        return { passed, properties };
    }

    roll({ id, actor, request, rollMode, fastForward = false }, callback, e) {
        let rollfn = null;
        let opts = {
            event: e,
            skipDialog: fastForward,
            rollMode,
            createMessage: false,
            speaker: ChatMessage.getSpeaker({
                actor: actor
            })
        };

        if (request.type == 'attribute') {
            rollfn = actor[request.key].check.roll;
            actor = actor[request.key].check
            opts.options = ["ignore"];
        }
        else if (request.type == 'save') {
            rollfn = actor.saves[request.key].check.roll;
            actor = actor.saves[request.key].check;
        }
        else if (request.type == 'skill') {
            if (actor.skills[request.key]) {
                rollfn = actor.skills[request.key].check.roll;
                actor = actor.skills[request.key].check;
            } else
                return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoSkill") };
        }
        else if (request.type == 'lore') {
            let lore = actor.items.find(i => { return i.type == request.type && MonksTokenBar.slugify(i.name) == request.key; });
            if (lore != undefined) {
                let slug = lore.name.slugify();
                //opts = actor.getRollOptions(["all", "skill-check", slug]);
                rollfn = actor.skills[slug].check.roll;
                actor = actor.skills[slug].check;
            } else
                return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoLore") };
        }

        if (rollfn != undefined) {
            try {
                return rollfn.call(actor, opts).then((roll) => {
                    return callback(roll);
                }).catch((e) => {
                    console.error(e);
                    return { id: id, error: true, msg: i18n("MonksTokenBar.UnknownError") }
                });
            } catch (err) {
                console.error(err);
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

        MonksTokenBar.system.checkXP(actor);
    }

    async checkXP(actor) {
        if (setting("send-levelup-whisper") && game.user.isTheGM && actor.system.details.xp.value >= actor.system.details.xp.max) {
            const level = parseInt(foundry.utils.getProperty(actor, "system.details.level.value")) + 1;
            const html = await foundry.applications.handlebars.renderTemplate("./modules/monks-tokenbar/templates/levelup.html", { level: level, name: actor.name, xp: actor.system.details.xp.value });
            ChatMessage.create({
                user: game.user.id,
                content: html,
                whisper: ChatMessage.getWhisperRecipients(actor.name),
                flags: {
                    "monks-tokenbar": { level: level, actor: actor.uuid }
                }
            });
        }
    }

    getValue(actor, type, key) {
        let prop = type == "skill" ? "skills" : type == "save" ? "saves" : "attributes";
        let value = foundry.utils.getProperty(actor, prop + "." + key + ".mod");
        return value;
    }
}
