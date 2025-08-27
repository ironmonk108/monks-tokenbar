import { MonksTokenBar, log, error, debug, i18n, setting, MTB_MOVEMENT_TYPE } from "../monks-tokenbar.js";
import { SavingThrowApp } from "./savingthrow.js";
import { EditStats } from "./editstats.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class TokenBar extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options) {
        super(options);

        this.entries = [];
        this.thumbnails = {};

        this._hover = null;
        this._collapsed = setting("tokenbar-collapsed");

        Hooks.on('canvasReady', () => {
            this.refresh();
        });

        Hooks.on("createToken", (token) => {
            this.refresh();
        });

        Hooks.on("deleteToken", (token) => {
            this.refresh();
        });

        Hooks.on('updateToken', (document, data, options) => {
            if ((game.user.isGM || setting("allow-player")) && foundry.utils.getProperty(data, "flags.monks-tokenbar.include") != undefined) {
                this.refresh();
            } else if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let entry = this.entries.find(t => t.token?.id == document.id);
                if (entry)
                    this.updateEntry(entry, options.ignoreRefresh !== true)
            }
        });

        Hooks.on('updateItem', (item, data, options) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let entry = this.entries.find(t => item.actor && t.actor?.id == item.actor.id);
                if (entry != undefined) {
                    this.updateEntry(entry);
                }
            }
        });

        Hooks.on('updateOwnedItem', (actor, item, data) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let entry = this.entries.find(t => t.actor?.id == actor.id);
                if (entry != undefined) {
                    let that = this;
                    setTimeout(function () { that.updateEntry(entry); }, 100); //delay slightly so the PF2E condition can be rendered properly.
                }
            }
        });

        Hooks.on('updateActor', (actor, data) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let entry = this.entries.find(t => t.actor?.id == actor.id);
                if (data.ownership != undefined) {
                    this.refresh();
                } else if (entry != undefined) {
                    this.updateEntry(entry)
                }
            }
        });

        Hooks.on("updateActiveEffect", (effect) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                let actor = effect.parent;
                if (actor instanceof Actor) {
                    let entry = this.entries.find(t => t.actor?.id == actor.id);
                    if (entry != undefined) {
                        this.updateEntry(entry)
                    } else if (actor.ownership != undefined) {
                        this.refresh();
                    }
                }
            }
        });

        Hooks.on("createItem", (item) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                if (item.type == 'effect') {
                    if (item.actor) {
                        let entry = this.entries.find(t => t.actor?.id == item.actor.id);
                        if (entry != undefined) {
                            this.updateEntry(entry)
                        }
                    }
                }
            }
        });

        Hooks.on("deleteItem", (item) => {
            if (((game.user.isGM || setting("allow-player")) && !setting("disable-tokenbar"))) {
                if (item.type == 'effect') {
                    let entry = this.entries.find(t => t.actor?.id == item.actor.id);
                    if (entry != undefined) {
                        this.updateEntry(entry)
                    }
                }
            }
        });

        //updateActiveEffect 

        this.buttons = MonksTokenBar.system.getButtons();
    }

    static DEFAULT_OPTIONS = {
        id: "tokenbar",
        tag: "div",
        classes: ["sheet", "tokenbar"],
        window: {
            contentClasses: ["flexrow"],
            icon: "fas fa-people-arrows",
            resizable: false,
        },
        actions: {
            buttonClicked: TokenBar._onButtonClick,
            tokenClick: TokenBar._onClickToken
        },
    };

    static PARTS = {
        buttons: { template: "./modules/monks-tokenbar/templates/tokenbar/buttons.hbs" },
        tokenlist: { template: "./modules/monks-tokenbar/templates/tokenbar/token-list.hbs" }
    };

    nonDismissible = true;

    persistPosition = foundry.utils.debounce(this.onPersistPosition.bind(this), 1000);

    onPersistPosition(position) {
        game.user.setFlag("monks-tokenbar", "position", { left: position.left, top: position.top });
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this._createContextMenus(this.element);
    }

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case "buttons":
                this._prepareButtonContext(context, options);
                break;
            case "tokenlist":
                this._prepareTokenListContext(context, options);
                break;
        }

        return context;
    }

    _prepareButtonContext(context, options) {
        let movement = setting("movement");
        let buttons = this.buttons.map(group => {
            let buttons =  group.map(button => {
                let btn = foundry.utils.duplicate(button);
                if (button.condition && !button.condition())
                    return null;
                if (button.enabled && !button.enabled())
                    btn.disabled = true;
                if (btn.id == `movement-${movement}`)
                    btn.active = true;
                return btn;
            });
            buttons = buttons.filter(b => !!b);
            if (buttons.length == 0)
                return null;
            return buttons;
        }).filter(b => !!b);
        return foundry.utils.mergeObject(context, {
            movement,
            buttons
        });
    }

    _prepareTokenListContext(context, options) {

        return foundry.utils.mergeObject(context, {
            entries: this.entries,
        });
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        $(".token", this.element).dblclick(this._onDblClickToken.bind(this));//.hover(this._onHoverToken.bind(this));
        $(this.element).toggleClass("vertical", setting('show-vertical') == "true");

        new foundry.applications.ux.DragDrop.implementation({
            dragSelector: ".token",
            permissions: {
                dragstart: this._canDragStart.bind(this),
            },
            callbacks: {
                dragstart: this._onDragStart.bind(this),
            }
        }).bind(this.element);
    }

    /*
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "tokenbar-window",
            template: "./modules/monks-tokenbar/templates/tokenbar.html",
            popOut: false,
            dragDrop: [{ dragSelector: ".token" }],
        });
    }
    */

    /*
    getData(options) {
        let css = [
            !game.user.isGM ? "hidectrl" : null,
            setting('show-vertical') == "true" ? "vertical" : null,
        ].filter(c => !!c).join(" ");
        let pos = this.getPos();

        let collapseIcon;
        if (setting('show-vertical') == "true")
            collapseIcon = this._collapsed ? "fa-caret-down": "fa-caret-up";
        else
            collapseIcon = this._collapsed ? "fa-caret-right" : "fa-caret-left";

        return {
            entries: this.entries,
            movement: setting("movement"),
            cssClass: css,
            pos: pos,
            buttons: this.buttons,
            collapsed: this._collapsed,
            collapseIcon: collapseIcon
        };
    }
    */

    getPos() {
        this.pos = game.user.getFlag("monks-tokenbar", "position");

        if (this.pos == undefined) {
            this.pos = {
                left: 15, right: '', top: '', bottom: 230
            };
            game.user.setFlag("monks-tokenbar", "position", this.pos);
        }

        let result = '';
        if (this.pos != undefined) {
            result = Object.entries(this.pos).filter(k => {
                return k[1] != null;
            }).map(k => {
                return k[0] + ":" + k[1] + 'px';
            }).join('; ');
        }

        return result;
    }

    setPosition(position) {
        position = super.setPosition(position);
        this.persistPosition(position);
        return position;
    }

    _createContextMenus() {
        let context = this._createContextMenu(this._getEntryContextOptions, ".token", {
            fixed: true,
            hookName: "getTokenbarContextOptions",
            parentClassHooks: false
        });

        let oldRender = context.render;
        context.render = async function (target, options = {}) {
            let result = oldRender.call(this, target, options);

            //Highlight the current movement if different from the global
            let id = target.dataset.tokenId || target.dataset.actorId;
            const entry = MonksTokenBar?.tokenbar.entries.find(t => t.token?.id === id || t.actor?.id === id);
            let movement = entry?.token?.getFlag("monks-tokenbar", "movement");
            let html = $("#context-menu");
            if (movement != undefined) {
                $('i[data-movement="' + movement + '"]', html).parent().addClass('selected');
            }

            //Highlight if nopanning option is selected
            let nopanning = entry?.token?.getFlag("monks-tokenbar", "nopanning");
            if (nopanning) {
                $('i.no-panning', html).parent().addClass('selected');
            }

            return result;
        };
    }

    _canDragStart(selector) {
        return game.user.isGM || game.user.can("ACTOR_CREATE");
    }

    _onDragStart(event) {
        const target = event.currentTarget;

        let actorId = target.dataset.actorId;
        let actor = game.actors.get(actorId);
        if (!actor || !actor.isOwner) return false;

        const dragData = { uuid: `Actor.${actorId}`, type: "Actor" };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    refresh() {
        //need this so that if a whole bunch of tokens are added or refreshed at once, then we wait until the last one is done before trying to refresh
        var that = this;
        if (this.refreshTimer != null)
            clearTimeout(this.refreshTimer);

        this.refreshTimer = setTimeout(async function () {
            await that.getCurrentTokens();
            that.refreshTimer = null;
            that.render(true);
        }, 100);
    }

    static processStat (formula, data) {
        if (formula == undefined || formula == '')
            return null;

        if (formula.includes("{{")) {
            const compiled = Handlebars.compile(formula);
            formula = compiled(data, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true }).trim();
        }
        //formula = formula.replaceAll('@', '');
        formula = formula.replace(/@/g, '');
        let dataRgx = new RegExp(/([a-z.0-9_\-]+)/gi);
        let result = formula.replace(dataRgx, (match, term) => {
            let value = parseInt(term);
            if (isNaN(value)) {
                value = foundry.utils.getProperty(data, term);
                return (value == undefined || value == null ? null : String(typeof value == 'object' ? value.value : value).trim());
            } else
                return value;
        });

        if (result == undefined || result == 'null')
            return null;

        try {
            result = eval(result);
        } catch{ }
        return String(result).replace(/["']/g, "");
    }

    async getCurrentTokens() {
        //log('Get current Tokens');
        if (game.system.id == "pf2e" && setting("use-party")) {
            this.entries = game.actors.party.members.map(a => {
                if (!a)
                    return null;

                let token = canvas.tokens.placeables.find(t => t.actor?.id == a.id);
                let canView = (game.user.isGM || a.isOwner || a.testUserPermission(game.user, setting("minimum-ownership") || "LIMITED"));

                if (!canView)
                    return null;

                if (token) {
                    return {
                        id: token.id,
                        token: token.document,
                        actor: a,
                        name: token.name,
                        img: null,
                        thumb: null,
                        movement: token.document.flags["monks-tokenbar"]?.movement,
                        stats: {},
                        resource1: {},
                        resource2: {},
                        cssClass: ""
                    }
                } else {
                    return {
                        id: a.id,
                        token: null,
                        actor: a,
                        name: a.name,
                        img: null,
                        thumb: null,
                        stats: {},
                        resource1: {},
                        resource2: {},
                        cssClass: "only-actor"
                    }
                }
            }).filter(a => !!a);
        } else {
            this.entries = (canvas.scene?.tokens || [])
                .filter(t => {
                    let include = t.getFlag('monks-tokenbar', 'include');
                    include = (include === true ? 'include' : (include === false ? 'exclude' : include || 'default'));

                    let hasActor = (t.actor != undefined);
                    let canView = (game.user.isGM || t.actor?.isOwner || t.actor?.testUserPermission(game.user, setting("minimum-ownership") || "LIMITED"));
                    let showOnline = setting("show-offline") || game.users.find(u => u.active && u.character?.id == t.actor?.id);
                    let disp = ((t.actor?.hasPlayerOwner && t.disposition == 1 && include != 'exclude') || include === 'include');

                    let mlt = !!foundry.utils.getProperty(t, "flags.multilevel-tokens.stoken");

                    let addToken = hasActor && canView && disp && !mlt && showOnline;
                    debug("Checking token", t, "addToken", addToken, "Has Actor", hasActor, "Can View", canView, "Disposition", disp, "Included", include, "Online", showOnline);

                    return addToken;
                }).map(t => {
                    return {
                        id: t.id,
                        token: t,
                        actor: t.actor,
                        name: t.name,
                        img: null,
                        thumb: null,
                        movement: t.flags["monks-tokenbar"]?.movement,
                        stats: {},
                        resource1: {},
                        resource2: {},
                        cssClass: ""
                    }
                });

            if (setting("include-actor")) {
                for (let user of game.users) {
                    if ((user.active || setting("show-offline")) && !user.isGM && user.character && !this.entries.find(t => t.actor?.id === user.character?.id)) {
                        this.entries.push({
                            id: user.character.id,
                            token: null,
                            actor: user.character,
                            name: user.character.name,
                            img: null,
                            thumb: null,
                            stats: {},
                            resource1: {},
                            resource2: {},
                            cssClass: "only-actor"
                        });
                    }
                }
            }

            if (setting("filter-duplicates")) {
                this.entries = this.entries.filter((t, i, a) => {
                    let isGood = a.findIndex(e => e.actor?.id === t.actor?.id) === i;
                    if (!isGood && t.token) {
                        let original = this.entries.find(e => e.actor?.id === t.actor?.id);
                        if (original) {
                            if (original.tokens == undefined) {
                                original.tokens = [original.token, t.token];
                                original.tokenIdx = 0;
                            }  else
                                original.tokens.push(t.token);
                        }
                    }
                    return isGood;
                });
            }
        }

        this.entries = this.entries.sort(function (a, b) {
            let aName = a.token?.name || a.actor?.name || "";
            let bName = b.token?.name || b.actor?.name || "";
            return aName.localeCompare(bName);
        })

        for (let t of this.entries)
            await this.updateEntry(t, false);

        //this is causing token to disappear
        //if(this.entries.length)
        //    this.entries[0].token.constructor.updateDocuments(this.entries.map(t => { return { _id: t.id, 'flags.monks-tokenbar.-=notified': null } }), { parent: canvas.scene, options: { ignoreRefresh: true } })
    }

    getResourceBar(token, bar) {
        let resource = {};
        if (token.displayBars > 0) {
            let attr = token.getBarAttribute(bar);
            if (attr.attribute == "attributes.hp")
                attr = foundry.utils.mergeObject(attr, (foundry.utils.getProperty(token, "actor.system.attributes.hp") || {}));

            if (attr != undefined && attr.type == "bar") {
                let { value, max, temp, tempmax } = attr;
                temp = Number(temp || 0);
                tempmax = Number(tempmax || 0);
                value = Number(value);

                const effectiveMax = Math.max(0, max + tempmax);
                let displayMax = max + (tempmax > 0 ? tempmax : 0);

                const tempPct = Math.clamp(temp, 0, displayMax) / displayMax;
                const valuePct = Math.clamp(value, 0, effectiveMax) / displayMax;
                const colorPct = Math.clamp(value, 0, effectiveMax) / displayMax;

                if (value != undefined) {
                    let color = (bar === "bar1") ? [(1 - (colorPct / 2)), colorPct, 0] : [(0.5 * colorPct), (0.7 * colorPct), 0.5 + (colorPct / 2)];
                    resource = {
                        value,
                        valuePct: (valuePct * 100),
                        tempPct: (tempPct * 100),
                        color: 'rgba(' + parseInt(color[0] * 255) + ',' + parseInt(color[1] * 255) + ',' + parseInt(color[2] * 255) + ', 0.7)'
                    };
                }
            }
        }

        return resource;
    }

    async updateEntry(entry, refresh = true) {
        let diff = {};

        if (game.settings.get("monks-tokenbar", "show-resource-bars") && entry.token) {
            if (entry?.resource1?.value != entry.token.getBarAttribute('bar1')?.value) {
                diff.resource1 = this.getResourceBar(entry.token, "bar1");
            }
            if (entry?.resource2?.value != entry.token.getBarAttribute('bar2')?.value) {
                diff.resource2 = this.getResourceBar(entry.token, "bar2");
            }
        }

        let viewstats = entry.actor?.getFlag('monks-tokenbar', 'stats') || MonksTokenBar.stats;
        let diffstats = {};
        let defaultColor = '#f0f0f0';

        for (let stat of viewstats.filter(s => s.stat)) {
            let value = TokenBar.processStat(stat.stat, entry.actor.system) || TokenBar.processStat(stat.stat, entry.token);

            let defStat = MonksTokenBar.stats.find(s => s.stat == stat.stat);

            if (entry.stats[stat.stat] == undefined) {
                entry.stats[stat.stat] = { icon: stat.icon, color: stat.color || defStat.color || defaultColor, value: value, hidden: (!setting("show-undefined") && value == undefined) };
                diffstats[stat.stat] = entry.stats[stat.stat];
            }
            else {
                let tokenstat = foundry.utils.duplicate(entry.stats[stat.stat]);
                if (tokenstat.value != value) {
                    tokenstat.value = value;
                    tokenstat.hidden = (!setting("show-undefined") && value == undefined);
                    diffstats[stat.stat] = tokenstat;
                }
            }
        }
        for (let [k, v] of Object.entries(entry.stats)) {
            if (!viewstats.find(s => s.stat == k))
                delete entry.stats[k];
        }
        if (Object.keys(diffstats).length > 0) {
            diff.stats = diffstats;
        }

        if (entry.img != (setting("token-pictures") == "actor" && entry.actor != undefined ? entry.actor.img : entry.token?.texture.src || entry.actor?.img)) {
            diff.img = (setting("token-pictures") == "actor" && entry.actor != undefined ? entry.actor.img : entry.token?.texture.src || entry.actor?.img);
            let thumb = this.thumbnails[diff.img];
            if (!thumb) {
                try {
                    thumb = await foundry.helpers.media.ImageHelper.createThumbnail(diff.img, { width: setting("resolution-size"), height: setting("resolution-size") });
                    this.thumbnails[diff.img] = (thumb?.thumb || thumb);
                } catch {
                    thumb = 'icons/svg/mystery-man.svg';
                }
            }

            diff.thumb = (thumb?.thumb || thumb);
            if (setting("use-token-scaling")) {
                diff.texture = entry.token?.texture;
            }
        }

        if (entry.token && entry.movement != foundry.utils.getProperty(entry.token, "flags.monks-tokenbar.movement")) {
            diff.movement = foundry.utils.getProperty(entry.token, "flags.monks-tokenbar.movement");
        }

        if (entry.inspiration != (entry.actor.system?.attributes?.inspiration && setting('show-inspiration')))
            diff.inspiration = (entry.actor.system?.attributes?.inspiration && setting('show-inspiration'));

        if (setting("show-disable-panning-option")) {
            if (entry.nopanning != entry.token?.flags['monks-tokenbar']?.nopanning) {
                diff.nopanning = entry.token?.flags['monks-tokenbar']?.nopanning;
            }
        } else {
            diff.nopanning = false;
        }

        if (Object.keys(diff).length > 0) {
            foundry.utils.mergeObject(entry, diff);
            if(refresh)
                this.render();
        }
    }

    static _onButtonClick(event, target) {
        if (game.user.isGM || setting("allow-player")) {
            let buttonId = target.id;
            for (let group of (this.buttons || [])) {
                for (let button of group) {
                    if (button.id == buttonId && button.click) {
                        button.click.call(this, event);
                        target.blur();
                        return;
                    }
                }
            }
        }

    }

    _getEntryContextOptions() {
        let menuitems = [
            {
                name: "MonksTokenBar.PrivateMessage",
                icon: '<i class="fas fa-microphone"></i>',
                condition: li => {
                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);
                    if (!game.user.isGM && entry.actor?.isOwner)
                        return false;

                    let players = game.users.contents
                        .filter(u =>
                            !u.isGM && (entry.actor.ownership[u.id] == 3 || entry.actor.ownership.default == 3)
                        );
                    return players.length > 0;
                },
                callback: li => {
                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);
                    let players = game.users.contents
                        .filter(u =>
                            !u.isGM && (entry.actor?.ownership[u.id] == 3 || entry.actor?.ownership.default == 3)
                        )
                        .map(u => {
                            return (u.name.indexOf(" ") > -1 ? "[" + u.name + "]" : u.name);
                        });
                    if (ui.sidebar.activeTab !== "chat")
                        ui.sidebar.changeTab("chat", "primary");

                    $("#chat-message").val('/w ' + players.join(' ') + ' ');
                    $("#chat-message").focus();
                }
            },
            {
                name: "MonksTokenBar.ExcludeFromTokenBar",
                icon: '<i class="fas fa-ban"></i>',
                condition: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    return game.user.isGM && entry?.token;
                },
                callback: (li) => {
                    foundry.applications.api.DialogV2.confirm({
                        window: {
                            title: "Exclude Token",
                        },
                        content: "Are you sure you wish to remove this token from the Tokenbar?",
                        yes: {
                            callback: () => {
                                let id = li.dataset.tokenId;
                                const entry = this.entries.find(t => t.token?.id === id);
                                if (entry)
                                    entry.token.setFlag("monks-tokenbar", "include", "exclude");
                            }
                        }
                    });
                }
            },
            {
                name: "MonksTokenBar.EditCharacter",
                icon: '<i class="fas fa-edit"></i>',
                condition: li => {
                    const entry = this.entries.find(t => t.actor?.id === li.dataset.actorId);
                    if (game.user.isGM && entry?.actor)
                        return true;
                    if (entry?.actor && entry?.actor?.testUserPermission(game.user, "OWNER"))
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.actor?.id === li.dataset.actorId);
                    if (entry.actor) entry.actor.sheet.render(true);
                }
            },
            {
                name: "MonksTokenBar.EditToken",
                icon: '<i class="fas fa-edit"></i>',
                condition: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    if (game.user.isGM && entry?.token)
                        return true;
                    if (entry?.actor?.testUserPermission(game.user, "OWNER") && entry?.token)
                        return true;
                    return false;
                },
                callback: li => {
                    const entry = this.entries.find(t => t.token?.id === li.dataset.tokenId);
                    if (entry.token) entry.token.sheet.render(true)
                }
            },
            {
                name: "MonksTokenBar.EditStats",
                icon: '<i class="fas fa-list-ul"></i>',
                condition: li => {
                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);
                    return (game.user.isGM && entry);
                },
                callback: li => {
                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);
                    if (entry)
                        new EditStats(entry.actor).render(true);
                }
            },
            {
                name: "MonksTokenBar.AddHeroPoint",
                icon: '<i class="fas fa-circle-h"></i>',
                condition: li => {
                    if (game.system.id != "pf2e")
                        return false;

                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);

                    return (game.user.isGM && entry && entry.actor?.type == "character");
                },
                callback: li => {
                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);
                    if (entry) {
                        let heroPoints = Math.min((foundry.utils.getProperty(entry.actor, 'system.resources.heroPoints.value') ?? 0) + 1, 3);
                        Actor.updateDocuments([{ _id: entry.actor.id, 'system.resources.heroPoints.value': heroPoints }]);
                        ChatMessage.create({ content: `${entry.actor.name} gained a Hero Point!` });
                    }
                }
            },
            {
                name: "MonksTokenBar.AddInspiration",
                icon: '<i class="fas fa-crown"></i>',
                condition: li => {
                    if (game.system.id != "dnd5e")
                        return false;

                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);

                    return (game.user.isGM && entry);
                },
                callback: li => {
                    let id = li.dataset.tokenId || li.dataset.actorId;
                    const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);
                    if (entry) {
                        Actor.updateDocuments([{ _id: entry.actor.id, 'system.attributes.inspiration': true }]);
                        ChatMessage.create({ content: `${entry.actor.name} gained Inspiration!` });
                    }
                }
            },
            {
                name: "MonksTokenBar.DisablePanning",
                icon: '<i class="fas fa-user-slash no-panning"></i>',
                condition: li => {
                    if (game.settings.get("monks-tokenbar", "show-disable-panning-option")) {
                        let id = li.dataset.tokenId;
                        if (!id) return false;

                        const entry = this.entries.find(t => t.token?.id === id);

                        if (game.user.isGM && entry?.token)
                            return true;
                        if (entry?.token && entry?.token?.actor?.testUserPermission(game.user, "OWNER"))
                            return true;
                    }
                    return false;
                },
                callback: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    MonksTokenBar.changeTokenPanning(entry.token);
                }
            },
            {
                name: "MonksTokenBar.TargetToken",
                icon: '<i class="fas fa-bullseye"></i>',
                condition: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);

                    return (game.user.isGM && entry?.token);
                },
                callback: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    if (entry) {
                        const targeted = !entry.token.isTargeted;
                        entry.token._object?.setTarget(targeted, { releaseOthers: false });
                    }
                }
            },
            {
                name: "MonksTokenBar.FreeMovement",
                icon: '<i class="fas fa-running" data-movement="free"></i>',
                condition: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    return (game.user.isGM && entry?.token)
                },
                callback: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    if (entry) {
                        MonksTokenBar.changeTokenMovement(MTB_MOVEMENT_TYPE.FREE, entry.token);
                    }
                }
            },
            {
                name: "MonksTokenBar.NoMovement",
                icon: '<i class="fas fa-street-view" data-movement="none"></i>',
                condition: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    return (game.user.isGM && entry?.token)
                },
                callback: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    if (entry) {
                        MonksTokenBar.changeTokenMovement(MTB_MOVEMENT_TYPE.NONE, entry.token);
                    }
                }
            },
            {
                name: "MonksTokenBar.CombatTurn",
                icon: '<i class="fas fa-fist-raised" data-movement="combat"></i>',
                condition: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    return (game.user.isGM && entry?.token)
                },
                callback: li => {
                    let id = li.dataset.tokenId;
                    if (!id) return false;

                    const entry = this.entries.find(t => t.token?.id === id);
                    if (entry) {
                        MonksTokenBar.changeTokenMovement(MTB_MOVEMENT_TYPE.COMBAT, entry.token);
                    }
                }
            }
        ];

        return menuitems;
    }

    /*
    toggleCollapse(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this._collapsed) this.expand();
        else this.collapse();
    }

    collapse() {
        if (this._collapsed) return;
        const toggle = this.element.find(".toggle-collapse");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideUp(200, () => {
                bar.addClass("collapsed");
                if (setting('show-vertical') == "true")
                    icon.removeClass("fa-caret-up").addClass("fa-caret-down");
                else
                    icon.removeClass("fa-caret-left").addClass("fa-caret-right");
                this._collapsed = true;
                game.settings.set('monks-tokenbar', 'tokenbar-collapsed', this._collapsed);
                resolve(true);
            });
        });
    }

    expand() {
        if (!this._collapsed) return true;
        const toggle = this.element.find(".toggle-collapse");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideDown(200, () => {
                bar.css("display", "");
                bar.removeClass("collapsed");
                if (setting('show-vertical') == "true")
                    icon.removeClass("fa-caret-down").addClass("fa-caret-up");
                else
                    icon.removeClass("fa-caret-right").addClass("fa-caret-left");
                this._collapsed = false;
                game.settings.set('monks-tokenbar', 'tokenbar-collapsed', this._collapsed);
                resolve(true);
            });
        });
    }*/

    getEntry(id) {
        return this.entries.find(t => t.id === id);
    }
    
    static async _onClickToken(event, target) {
        event.preventDefault();
        const li = target;
        const id = li.dataset.tokenId || li.dataset.actorId;
        const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);

        let that = this;
        if (!this.dbltimer) {
            this.dbltimer = window.setTimeout(async function () {
                if (that.doubleclick !== true) {
                    if (event?.ctrlKey || event?.metaKey) {
                        let token = canvas.tokens.get(entry?.id);
                        if (!token)
                            return;
                        if (game.user.targets.has(token)) {
                            // remove from targets
                            token.setTarget(false, { user: game.user, releaseOthers: false, groupSelection: false });
                        } else {
                            // add to user targets
                            token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: false });
                        }
                    } else if (event?.altKey && setting("movement") == "none" && game.user.isGM) {
                        if (entry && (entry.movement == undefined || entry.movement == "")) {
                            // Dungeon mode
                            for (let entry of that.entries) {
                                if (entry.movement == "free") {
                                    entry.movement = null;
                                    await entry.token.unsetFlag("monks-tokenbar", "movement");
                                }
                            }
                            if (entry.token) {
                                entry.movement = "free";
                                await entry.token.setFlag("monks-tokenbar", "movement", "free");
                            }
                            that.render(true);
                        }
                    } else {
                        if (game.user.isGM || entry.actor?.testUserPermission(game.user, "OBSERVER")) {
                            let token = entry?.token;
                            if (entry?.tokens) {
                                token = entry.tokens[entry.tokenIdx];
                                entry.tokenIdx = (entry.tokenIdx + 1) % entry.tokens.length;
                            }
                            if (token) {
                                let animate = false;
                                if (token._object)
                                    animate = MonksTokenBar.manageTokenControl(token._object, { shiftKey: event?.shiftKey });
                                if (token.getFlag("monks-tokenbar", "nopanning"))
                                    animate = false;
                                (animate ? canvas.animatePan({ x: token?._object?.x, y: token?._object?.y }) : true);
                            }
                        }
                    }
                }
                that.doubleclick = false;
                delete that.dbltimer;
            }, 200);
        }
    }

    async _onDblClickToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        let id = li.dataset.tokenId || li.dataset.actorId;
        const entry = this.entries.find(t => t.token?.id === id || t.actor?.id === id);

        if (setting("dblclick-action") == "request" && (game.user.isGM || setting("allow-roll"))) {
            let entries = MonksTokenBar.getTokenEntries([entry.token._object]);
            new SavingThrowApp(entries).render(true);
        } else {
            if (entry.actor)
                entry.actor.sheet.render(true);
        }
        this.doubleclick = true;
    }

    /*
    _onHoverToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const hasAction = !li.classList.contains("inactive");

        // Remove any existing tooltip
        const tooltip = li.querySelector(".tooltip");
        if ( tooltip ) li.removeChild(tooltip);

        // Handle hover-in
        if (event.type === "mouseenter") {
            const id = li.dataset.tokenId || li.dataset.actorId;
            this._hover = id;
            if (hasAction) {
                const entry = this.entries.find(e => e.token?.id === id || e.actor?.id === id);
                const tooltip = document.createElement("SPAN");
                tooltip.classList.add("tooltip");
                tooltip.textContent = entry?.token?.name || entry?.actor?.name;
                $("body").appendChild(tooltip);
            }
        }

        // Handle hover-out
        else {
            this._hover = null;
        }
    }
    */
}

