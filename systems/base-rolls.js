import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js"
import { SavingThrowApp } from "../apps/savingthrow.js";
import { ContestedRollApp } from "../apps/contestedroll.js";
import { AssignXPApp } from "../apps/assignxp.js";

export class BaseRolls {
    constructor() {
        this._config = CONFIG[game.system.id.toUpperCase()];
        this._requestoptions = [{
            id: "dice", text: "Dice", cssclass: "dice-group", groups: { "1d2": "1d2", "1d4": "1d4", "1d6": "1d6", "1d8": "1d8", "1d10": "1d10", "1d12": "1d12", "1d20": "1d20", "1d100": "1d100" }
        }];
    }

    get _supportedSystem() {
        return false;
    }

    getValue(actor, type, key) {
        return null;
    }

    rollProperties(request) {
        return [];
    }

    isCritical(roll) {
        if (!(roll.terms[0] instanceof foundry.dice.terms.Die) && (roll.terms[0].faces === 20) || !roll._evaluated) return undefined;
        if (Number.isNumeric(roll.options.critical) && roll.dice[0].total >= roll.options.critical) return 'critical';
        if (Number.isNumeric(roll.options.fumble) && roll.dice[0].total <= roll.options.fumble) return 'fumble';
        return false;
    }

    static activateHooks() {
    }

    get requestoptions() {
        return this._requestoptions;
    }

    get contestedoptions() {
        return this._requestoptions.filter(o => { return o.id != 'save' && o.id != 'misc' });
    }

    get config() {
        return this._config;
    }

    get canReroll() {
        return true;
    }

    get showRoll() {
        return true;
    }

    get useDegrees() {
        return false;
    }

    get hasCritical() {
        return false;
    }

    rollSuccess(roll, dc, actorId, request) {
        let passed = roll?.total >= dc;
        return { passed };
    }

    get showXP() {
        return false;
    }

    calcXP(actors, monsters) {
        return 0;
    }

    getXP (actor) {
        return { value: 0, max: 0 };
    }

    getLevel(actor) {
        return actor.system.details?.level?.value ?? actor.system.details?.level ?? 0;
    }

    get dcLabel() {
        return "MonksTokenBar.SavingDC";
    }

    get defaultStats() {
        return [];
    }

    getButtons() {
        var buttons = [];
        if (setting("show-movement") && game.user.isGM) {
            buttons.push([
                {
                    id: 'movement-free',
                    title: 'MonksTokenBar.FreeMovement',
                    icon: 'fa-running',
                    condition: () => game.user.isGM && setting("show-movement"),
                    click: (game.user.isGM ?
                        (event) => {
                            event.preventDefault();
                            MonksTokenBar.changeGlobalMovement('free');
                        } : null)
                },
                {
                    id: 'movement-none',
                    title: 'MonksTokenBar.NoMovement',
                    icon: 'fa-street-view',
                    condition: () => game.user.isGM && setting("show-movement"),
                    click: (game.user.isGM ?
                        (event) => {
                            event.preventDefault();
                            MonksTokenBar.changeGlobalMovement('none');
                        } : null)
                },
                {
                    id: 'movement-combat',
                    title: 'MonksTokenBar.CombatTurn',
                    icon: 'fa-fist-raised',
                    condition: () => game.user.isGM && setting("show-movement"),
                    enabled: () => game.user.isGM && game.combat?.started,
                    click: (game.user.isGM ? (event) => {
                        event.preventDefault();
                        MonksTokenBar.changeGlobalMovement('combat');
                    } : null)
                }
            ]);
        }
        if (MonksTokenBar.system._supportedSystem && (game.user.isGM || setting("allow-player"))) {
            buttons.push([
                {
                    id: 'request-roll',
                    title: 'MonksTokenBar.RequestRoll',
                    icon: 'fa-tools',
                    condition: () => game.user.isGM || setting("allow-player"),
                    click: async (event) => {
                        event.preventDefault();
                        this.savingthrow = await new SavingThrowApp().render(true);
                    }
                },
                {
                    id: 'contested-roll',
                    title: 'MonksTokenBar.ContestedRoll',
                    icon: 'fa-people-arrows',
                    condition: () => game.user.isGM || setting("allow-player"),
                    click: async (event) => {
                        event.preventDefault();
                        this.contestedroll = await new ContestedRollApp().render(true);
                    }
                },
                {
                    id: 'assign-xp',
                    title: 'MonksTokenBar.AssignXP',
                    icon: 'fa-book-medical',
                    condition: () => game.user.isGM && MonksTokenBar.system.showXP,
                    click: (event) => {
                        event.preventDefault();
                        new AssignXPApp().render(true);
                    }
                }
            ]);
        }
        return buttons;
    }

    defaultRequest() {
        return null;
    }

    defaultContested() {
        return null;
    }

    get canGrab() {
        return false;
    }

    get showAdvantage() {
        return false;
    }

    dynamicRequest(tokens) {
        return [];
    }

    roll({ id }, callback, e) {
        return { id: id, error: true, msg: i18n("MonksTokenBar.ActorNoRollFunction") };
    }

    async assignXP(msgactor) {

    }

    async checkXP(actor) {

    }

    parseKeys(e, keys) {

    }

    getCurrency() {
        let lootsheet = setting('loot-sheet');
        let currency = Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {});
        if (lootsheet == "monks-enhanced-journal" && game.modules.get("monks-enhanced-journal")?.active) {
            currency = game.MonksEnhancedJournal.currencies.filter(c => c.convert != null);
        }

        return currency;
    }
}