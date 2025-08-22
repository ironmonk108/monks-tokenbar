import { i18n, log, MonksTokenBar, setting } from "../monks-tokenbar.js";
import { ApplicationSheetConfig } from "./sheet-configure.js";
import { divideXpOptions } from "../settings.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class AssignXPApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(entities, options = {}) {
        super(options);

        this.customXP = false;

        this.reason = options?.reason || (entities != undefined && entities instanceof Combat ? i18n("MonksTokenBar.CombatExperience") : "");
        this.dividexp = options?.dividexp ? options?.dividexp : setting("divide-xp");
        this.divideXpOptions = divideXpOptions

        this.monsters = [];
        let collectMonsters = true;
        if (entities != undefined) {
            if (entities instanceof Combat) {
                entities = entities.combatants.map(c => c.token);
            } else if (!(entities instanceof Array)) {
                entities = [entities];
            }
        } else {
            if (canvas.tokens.controlled.length > 0) {
                entities = canvas.tokens.controlled;
            } else {
                entities = canvas.tokens.placeables;
                collectMonsters = false;
            }
        }

        this.actors = [];
        this.monsters = [];

        let npcShareXp = setting("npc-xp-sharing");

        for (let entity of entities) {
            if (entity) {
                if (!entity.actor)
                    return;
                let actor = entity.actor.isPolymorphed ? game.actors.find(a => a.id == entity.actor.getFlag(game.system.id, 'originalActor')) : entity.actor;
                let token = entity.document ? entity.document : entity;
                if (token.disposition == 1 && token.actorLink && (actor.hasPlayerOwner || npcShareXp)) {
                    this.actors.push({ actor: actor, xp: 0 });
                } else if (token.disposition != 1 && !actor.hasPlayerOwner && collectMonsters) {
                    this.monsters.push({ actor: actor, defeated: AssignXPApp.isDefeated(actor) });
                }
            }
        }
        this.actors = this.actors.filter((a, index, self) => {
            if (!a) return false;
            return self.findIndex((i) => { return i?.actor.id == a.actor.id }) === index;
        });

        this.initialActors = foundry.utils.duplicate(this.actors);

        this.changeXP(options?.xp);
    }

    static DEFAULT_OPTIONS = {
        id: "assignexperience",
        tag: "form",
        classes: ["sheet", "assignxp"],
        window: {
            contentClasses: ["standard-form"],
            icon: "fa-solid fa-book-medical",
            resizable: false,
            title: "MonksTokenBar.AssignXP",
            controls: [{
                icon: "fa-solid fa-gear",
                label: "SHEETS.ConfigureSheet",
                action: "configureSheet",
                visible: true
            }]
        },
        actions: {
            autoAssign: AssignXPApp.autoAssign,
            assignXP: AssignXPApp.assignXP,
            recalculate: AssignXPApp.recalculateXP,
            addMonster: AssignXPApp.addMonster,
            removeMonster: AssignXPApp.removeMonster,
            addActor: AssignXPApp.addActor,
            removeActor: AssignXPApp.removeActor,
            configureSheet: AssignXPApp.onConfigureSheet,
        },
        position: {
            width: 400
        }
    };

    static PARTS = {
        header: { template: "modules/monks-tokenbar/templates/assignxp/header.hbs" },
        tabs: { template: "templates/generic/tab-navigation.hbs" },
        monsters: { template: "modules/monks-tokenbar/templates/assignxp/monster-tab.hbs", scrollable: [".tab.monsters .monster-list"] },
        players: { template: "modules/monks-tokenbar/templates/assignxp/player-tab.hbs", scrollable: [".tab.players .player-list"] },
        footer: { template: "templates/generic/form-footer.hbs" }
    };

    static TABS = {
        sheet: {
            tabs: [
                { id: "monsters", icon: "fa-solid fa-skull" },
                { id: "players", icon: "fa-solid fa-users" },
            ],
            initial: "players",
            labelPrefix: "MonksTokenBar.ASSIGNXP.TABS"
        }
    };

    _initializeApplicationOptions(options) {
        options = super._initializeApplicationOptions(options);
        const { colorScheme } = game.settings.get("core", "uiConfig");
        const theme = game.user.getFlag("monks-tokenbar", "themes") || {};
        options.classes.push("themed", `theme-${theme.assignxp || colorScheme.applications || "dark"}`);
        return options;
    }

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case "header": this._prepareHeaderContext(context, options); break;
            case "monsters": this._prepareMonsterContext(context, options); break;
            case "players": this._preparePlayerContext(context, options); break;
            case "footer":
                context.buttons = this.prepareButtons();
        }
        if (partId in context.tabs) context.tab = context.tabs[partId];

        return context;
    }

    _prepareHeaderContext(context, options) {
        return foundry.utils.mergeObject(context, {
            xp: this.xp,
            dividexp: this.dividexp,
            reason: this.reason,
            divideXpOptions: this.divideXpOptions
        });
    }

    _prepareMonsterContext(context, options) {
        context.monsters = this.monsters.map(m => {
            return {
                id: m.actor._id,
                name: m.actor.name,
                img: m.actor.img,
                defeated: m.defeated,
                xp: m.xp,
                disabled: m.disabled
            }
        });
        return context;
    }

    _preparePlayerContext(context, options) {
        context.actors = this.actors.map((a) => {
            return {
                id: a.actor._id,
                name: a.actor.name,
                img: a.actor.img,
                xp: a.xp,
                disabled: a.disabled
            }
        });
        return context;
    }

    prepareButtons() {
        return [
            {
                type: "button",
                icon: "fas fa-up-from-line",
                label: "MonksTokenBar.AutoAssign",
                action: "autoAssign"
            },
            {
                type: "button",
                icon: "",
                label: "MonksTokenBar.Assign",
                action: "assignXP"
            }
        ];
    }

    static onConfigureSheet(event) {
        event.stopPropagation(); // Don't trigger other events
        if (event.detail > 1) return; // Ignore repeated clicks

        new ApplicationSheetConfig({
            type: "assignxp",
            position: {
                top: this.position.top + 40,
                left: this.position.left + ((this.position.width - 500) / 2)
            }
        }).render({ force: true });
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this._createContextMenus();

        new foundry.applications.ux.DragDrop.implementation({
            dropSelector: ".tab.players",
            permissions: {
                drop: this._canDragDrop.bind(this)
            },
            callbacks: {
                drop: this._onDrop.bind(this)
            }
        }).bind(this.element);
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        if (this.monsters.length > 0) {
            $('nav.tabs a[data-tab="monsters"]', this.element).append($("<sup>").addClass("creature-count").html(this.monsters.length));
        }
        if (this.actors.length > 0) {
            $('nav.tabs a[data-tab="players"]', this.element).append($("<sup>").addClass("creature-count").html(this.actors.length));
        }

        let that = this;

        $('#dividexp', this.element).change(function () {
            that.dividexp = $(this).find('option:selected').val();
            that.changeXP.call(that);
            that.render(true);
        });

        $('#assign-xp-value', this.element).blur(function () {
            that.xp = parseInt($(this).val() || '0');
            if (isNaN(that.xp))
                that.xp = 0;
            that.customXP = true;
            that.changeXP.call(that, that.xp);
            that.render(true);
        });

        $('.charxp', this.element).blur(this.adjustCharXP.bind(this));
    }

    _createContextMenus() {
        this._createContextMenu(this._getActorContextOptions, ".add-actor", {
            fixed: true,
            parentClassHooks: false,
            eventName: "click"
        });
    }

    _getActorContextOptions() {
        return [
            {
                name: "Add Selected Actors",
                icon: '<i class="fas fa-plus"></i>',
                condition: () => canvas.tokens.controlled.filter(t => t.actor != undefined && t.document.isLinked).length > 0,
                callback: li => {
                    let tokens = canvas.tokens.controlled.filter(t => t.actor != undefined && t.document.isLinked);
                    if (tokens.length == 0)
                        ui.notifications.error('No tokens are currently selected');
                    else {
                        this.addToken(tokens);
                    }
                }
            },
            {
                name: "Use Players",
                icon: '<i class="fas fa-child"></i>',
                callback: li => {
                    this.actors = this.actors.concat(game.users.filter(u => {
                        return !u.isGM && u.character && !this.actors.some(e => e.actor._id == u.character.id)
                    }).map(u => {
                        let actor = u.character;
                        actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);
                        return {
                            actor: actor,
                            xp: 0
                        }
                    }));
                    this.changeXP();
                    this.render(true);
                }
            },
            {
                name: "Use Active Players",
                icon: '<i class="fas fa-users"></i>',
                callback: li => {
                    this.actors = this.actors.concat(game.users.filter(u => {
                        return !u.isGM && u.active && u.character && !this.actors.some(e => e.actor._id == u.character.id)
                    }).map(u => {
                        let actor = u.character;
                        actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);
                        return {
                            actor: actor,
                            xp: 0
                        }
                    }));
                    this.changeXP();
                    this.render(true);
                }
            },
            {
                name: "Use Initial Actors",
                icon: '<i class="fas fa-person-walking-arrow-loop-left"></i>',
                condition: () => this.initialActors && this.initialActors.length > 0,
                callback: li => {
                    this.actors = foundry.utils.duplicate(this.initialActors);
                    this.changeXP();
                    this.render(true);
                }
            },
            {
                name: "Last Used Actors",
                icon: '<i class="fas fa-bolt"></i>',
                condition: () => !!AssignXP.lastTokens,
                callback: li => {
                    if (AssignXP.lastTokens) {
                        this.actors = foundry.utils.duplicate(AssignXP.lastTokens);
                        this.changeXP();
                        this.render(true);
                    }
                }
            }
        ];
    }

    static async autoAssign() {
        let msg = await AssignXPApp.assignXP();
        if (msg) AssignXP.onAssignAllXP(msg);
        return msg;
    }

    static async assignXP() {
        let msg = null;
        let chatactors = this.actors
            .map(a => {
                return {
                    id: a.actor._id,
                    //actor: a.actor,
                    icon: a.actor.img,
                    name: a.actor.name,
                    xp: a.xp,
                    assigned: false
                }
            });

        if (chatactors.length > 0) {
            AssignXP.lastTokens = this.actors;

            let requestdata = {
                xp: this.xp,
                reason: $('#assign-xp-reason', this.element).val(),
                actors: chatactors
            };
            const html = await foundry.applications.handlebars.renderTemplate("./modules/monks-tokenbar/templates/assignxp/chat-message.html", requestdata);

            let chatData = {
                user: game.user.id,
                content: html
            };

            foundry.utils.setProperty(chatData, "flags.monks-tokenbar", requestdata);
            msg = await ChatMessage.create(chatData, {});
            this.close();
        } else
            ui.notifications.warn(i18n("MonksTokenBar.RequestNoneActorSelected"));

        return msg;
    }

    static isDefeated(actor) {
        return (actor && (actor.combatant && actor.combatant.defeated) || actor.statuses.has(CONFIG.specialStatusEffects.DEFEATED));
    }

    static recalculateXP() {
        this.customXP = false;
        this.changeXP();
        this.render(true);
    }

    changeXP(xp) {
        if (xp !== undefined)
            this.xp = xp;
        else if (!this.customXP) {
            this.xp = MonksTokenBar.system.calcXP(this.actors, this.monsters);
        }

        let sortedByLevel = this.actors.sort(function (a, b) {
            const aXP = MonksTokenBar.system.getXP(a.actor);
            const bXP = MonksTokenBar.system.getXP(b.actor);
            
            let value = (MonksTokenBar.system.getLevel(a.actor) + ((aXP?.value ?? 0) / (aXP?.max ?? 1))) - (MonksTokenBar.system.getLevel(b.actor) + ((bXP?.value ?? 0) / (bXP?.max ?? 1)));
            return value;
        });

        sortedByLevel.forEach(x => x.xp = 0);
        switch (this.dividexp) {
            case 'no-split':
                sortedByLevel.forEach(x => x.xp =  this.xp);
                break;
            case 'equal-split':
                sortedByLevel.forEach(x => x.xp = parseInt(this.xp / sortedByLevel.length));
                break;
            case 'robin-hood-split':
                // Take from the rich and give to the poor...
                distributeXp(sortedByLevel, parseInt(this.xp / sortedByLevel.length), 0.5, 1.5);
                break;
            case 'nottingham-split':
                // Take from the poor and give to the rich...
                distributeXp(sortedByLevel, parseInt(this.xp / sortedByLevel.length), 1.5, 0.5);
                break;
        }

        /**
         * Splits the xp among the actors according to the following algorithm: iterate from lowest, compare self with highest unprocessed, if same level just set xp, if different level use appropriate multiplier for poor/rich actor.
         * @param actors {Array}
         * @param charxp {number}
         * @param higherXpMultiplier {number}
         * @param lowerXpMultiplier {number}
         */
        function distributeXp(actors, charxp, higherXpMultiplier, lowerXpMultiplier) {
            const actors_reversed = actors.slice().reverse();
            for (let i = 0; i < actors.length / 2; i++) {
                let poor = actors[i];
                let rich = actors_reversed[i];
                if (MonksTokenBar.system.getLevel(poor.actor) !== MonksTokenBar.system.getLevel(rich.actor)) {
                    rich.xp += Math.ceil(charxp * higherXpMultiplier);
                    poor.xp += Math.floor(charxp * lowerXpMultiplier);
                } else if (poor !== rich) {
                    poor.xp += charxp;
                    rich.xp += charxp;
                } else {
                    poor.xp += charxp;
                }
            }
        }

    }

    addToken(tokens, collection = "actors") {
        if (!$.isArray(tokens))
            tokens = [tokens];

        let failed = [];
        tokens = tokens.filter(t => {
            if (t.actor == undefined)
                return false;
            //don't add this token a second time
            if (this.actors.some(e => e.actor._id == t.actor._id) || this.monsters.some(e => e.actor._id == t.actor._id))
                return false;

            return true;
        });

        if (failed.length > 0)
            ui.notifications.warn(i18n("MonksTokenBar.TokenNoActorAttrs"));

        if (tokens.length > 0)
            this[collection] = this[collection].concat(tokens.map(t => {
                let actor = t.actor;
                actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);
                return { actor: actor, defeated: AssignXPApp.isDefeated(actor) }
            }));

        this.changeXP();
        this.render(true);
    }

    adjustCharXP(event) {
        let id = $(event.currentTarget).closest(".item")[0].dataset.playerId;
        let actor = this.actors.find(a => a.actor._id == id);
        if (actor)
            actor.xp = parseInt($(event.currentTarget).val())
        this.render(true);
    }

    /*
    activateMonster(event) {
        let id = $(event.currentTarget).closest(".item")[0].dataset["itemId"];
        let monster = this.monsters.find(m => m.actor._id == id);
        if (monster)
            monster.active = $(event.currentTarget).prop("checked");

        this.xp = MonksTokenBar.system.calcXP(this.actors, this.monsters.filter(m => m.active));
        this.changeXP.call(this, this.xp);

        this.render(true);
    }
    */

    static addPlayers() {
        this.actors = this.actors.concat(game.users.filter(u => {
            return !u.isGM && u.character && !this.actors.some(e => e.actor._id == u.character.id)
        }).map(u => {
            let actor = u.character;
            actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);
            return {
                actor: actor,
                xp: 0
            }
        }));
        this.changeXP();
        this.render(true);
    }

    static addInitial() {
        this.actors = foundry.utils.duplicate(this.initialActors);
        this.changeXP();
        this.render(true);
    }

    static addLast() {
        if (AssignXP.lastTokens) {
            this.actors = foundry.utils.duplicate(AssignXP.lastTokens);
            this.changeXP();
            this.render(true);
        }
    }

    static addActor() {
        let tokens = canvas.tokens.controlled.filter(t => t.actor != undefined && t.document.isLinked);
        if (tokens.length == 0)
            ui.notifications.error('No tokens are currently selected');
        else {
            this.addToken(tokens);
        }
    }

    static clearActors() {
        this.actors = [];
        this.render(true);
    }

    static removeActor(event, target) {
        let actorId = target.closest(".actor").dataset.actorId;
        let idx = this.actors.findIndex(a => a.actor._id === actorId);
        if (idx > -1) {
            this.actors.splice(idx, 1);
        }
        this.changeXP();
        this.render(true);
    }

    static addMonster() {
        let monsters = canvas.tokens.controlled.filter(t => t.actor != undefined);
        if (monsters.length == 0)
            ui.notifications.error('No tokens are currently selected');
        else {
            this.addToken(monsters, "monsters");
        }
    }

    static removeMonster(event, target) {
        let monsterId = target.closest(".monster").dataset.monsterId;
        let idx = this.monsters.findIndex(a => a.actor._id === monsterId);
        if (idx > -1) {
            this.monsters.splice(idx, 1);
        }
        this.render(true);
    }

    static disableMonsters() {
        this.monsters = this.monsters.map(m => { m.active = false; return m; });
        this.render(true);
    }

    _canDragDrop(selector) {
        return game.user.isGM;
    }

    async _onDrop(event) {
        // Try to extract the data
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);

        // Identify the drop target
        if (data.type == "Actor") {
            let actor = await fromUuid(data.uuid);
            actor = (actor.isPolymorphed ? game.actors.find(a => a.id == actor.getFlag(game.system.id, 'originalActor')) : actor);

            this.actors.push({
                actor: actor,
                xp: 0
            });
            this.changeXP();
            this.render(true);
        }
    }
}

export class AssignXP {
    static lastTokens;
    static async onAssignXP(actorid, message, e) {
        if (game.user.isGM) {
            let actors = JSON.parse(JSON.stringify(message.getFlag('monks-tokenbar', 'actors')));
            let msgactor = actors.find(a => { return a.id === actorid; });

            if (!msgactor.assigned) {
                MonksTokenBar.system.assignXP(msgactor);
                msgactor.assigned = true;
            }
            await message.setFlag('monks-tokenbar', 'actors', actors);
        } else {
            if (e) $(e.target).prop("disabled", true);

            if (!game.users.find(u => u.isGM))
                return ui.notifications.warn("A GM needs to be logged in to receive the XP");
            MonksTokenBar.emit('assignxp', { actorid: actorid, msgid: message.id });
        }
    }

    static async onAssignAllXP(message) {
        if (game.user.isGM) {
            let actors = message.getFlag('monks-tokenbar', 'actors');
            for (let i = 0; i < actors.length; i++) {
                let msgactor = actors[i];
                if (!msgactor.assigned) {
                    await AssignXP.onAssignXP(msgactor.id, message);
                }
            };
        }
    }
}

Hooks.on("renderChatMessageHTML", (message, html, data) => {
    const assignCard = $(".monks-tokenbar.assignxp", html);
    if (assignCard.length !== 0) {
        if (!game.user.isGM)
            $(".gm-only", html).remove();
        if (game.user.isGM)
            $(".player-only", html).remove();

        $('.assign-all', html).click($.proxy(AssignXP.onAssignAllXP, AssignXP, message));

        let actors = message.getFlag('monks-tokenbar', 'actors');

        let items = $('.item', html);
        for (let i = 0; i < items.length; i++) {
            var item = items[i];
            let actorId = $(item).attr('data-item-id');
            let actorData = actors.find(a => { return a.id == actorId; });
            let actor = game.actors.get(actorId);

            let assign = !actorData.assigned && (game.user.isGM || actor.isOwner);
            $('.add-xp', item).toggle(assign).click($.proxy(AssignXP.onAssignXP, this, actorId, message));
        }
    }
});