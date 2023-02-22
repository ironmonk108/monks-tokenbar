import { i18n, log, MonksTokenBar, setting, warn } from "../monks-tokenbar.js";

export class LootablesApp extends Application {
    constructor(entity, options) {
        super(options);

        let lootsheet = setting('loot-sheet');
        this.lootEntity = setting("loot-entity");
        this.openLoot = setting("open-loot");
        this.createCanvasObject = setting("create-canvas-object");
        this.clearItems = false;
        this.entityName = "";

        let tokens = [];
        if (entity != undefined && entity instanceof Combat) {
            tokens = entity.combatants.filter(c => {
                return c.actor?.token && c.token?.disposition != 1 && (setting("only-use-defeated") ? c.defeated : true)
            }).map(c => {
                return c.token;
            });
            this.combat = entity;
        } else {
            tokens = entity || canvas.tokens.controlled.filter(t => t.actor != undefined);
            if (tokens != undefined && !$.isArray(tokens))
                tokens = [tokens];
        }

        this.currency = Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {}).reduce((a, v) => ({ ...a, [v]: 0 }), {});

        this.entries = [];
        this.noitems = [];

        for (let t of tokens) {
            let document = t.document || t;
            let token = t instanceof Token ? t : canvas.tokens.get(t.id);
            let entry = {
                id: document.id,
                token: token,
                actorId: document.actor.id,
                name: document.actor.name,
                img: document.texture.src,
                quantity: 1,
                items: []
            };
            if (!document.actorLink && this.lootEntity != "convert") {
                let _entry = this.entries.find(e => e.actorId == t.actor.id);
                if (_entry) {
                    entry = _entry;
                    entry.quantity += 1;
                } else
                    this.entries.push(entry);
            } else
                this.entries.push(entry);

            // Update the entry items
            let actorItems = (document.actorData.items || t.actor.items);

            let items = actorItems
                .filter(item => {
                    // Weapons are fine, unless they're natural
                    let result = false;
                    if (item.name == "-")
                        return false;

                    if (item.type == 'weapon') {
                        result = item.system.weaponType != 'natural';
                    }
                    // Equipment's fine, unless it's natural armor
                    else if (item.type == 'equipment') {
                        if (!item.system.armor)
                            result = true;
                        else
                            result = item.system.armor.type != 'natural';
                    } else
                        result = !(['class', 'spell', 'feat', 'action', 'lore', 'melee', 'condition', 'spellcastingEntry'].includes(item.type));

                    return result;
                }).map(i => {
                    return {
                        id: this.lootEntity == "convert" ? i._id : getProperty(i, "flags.core.sourceId") || i._id,
                        name: i.name,
                        img: i.img,
                        from: t.name,
                        sysQty: i.system.quantity,
                        quantity: 1,
                        data: (i instanceof Item ? i.toObject() : i)
                    };
                });

            if (items.length) {
                for (let item of items) {
                    let _item = entry.items.find(i => i.id == item.id && i.sysQty == item.sysQty);
                    if (_item) {
                        _item.quantity += 1;
                    } else
                        entry.items.push(item);
                }

                for (let item of entry.items) {
                    item.count = item.quantity;
                }
            } else if (!this.noitems.find(e => e == entry.name)) {
                this.noitems.push(entry.name);
            }

            entry.items = entry.items.sort((a, b) => { return a.name.localeCompare(b.name); });

            let actorCurrency = (document.actorData.currency || document.actor.system.currency);
            if (actorCurrency) {
                for (let [key, value] of Object.entries(actorCurrency)) {
                    let val = (value.value ?? value);
                    if (isNaN(val)) val = 0;
                    this.currency[key] = (this.currency[key] ?? 0) + val;
                }
            }
        };
        this.entries = this.entries.sort((a, b) => { return a.name.localeCompare(b.name); });

        if (setting("auto-gold-cr")) {
            this.calcGold();
        }
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "lootables",
            title: i18n("MonksTokenBar.Lootables"),
            template: "./modules/monks-tokenbar/templates/lootables.html",
            width: 500,
            popOut: true,
            dragDrop: [{ dropSelector: ".entry-list" }],
            scrollY: [".entry-list"]
        });
    }

    async getData(options) {
        let notes = "";
        let lootsheet = setting('loot-sheet');
        let lootentity = setting('loot-entity');
        let sheetName = "";
        switch (lootsheet) {
            case 'lootsheetnpc5e': sheetName = "Loot Sheet NPC 5e"; break;
            case 'merchantsheetnpc': sheetName = "Merchant Sheet"; break;
            case 'monks-enhanced-journal': sheetName = "Monk's Enhanced Journal"; break;
            case 'item-piles': sheetName = "Item Piles"; break;
        }

        let entity;
        try {
            entity = await fromUuid(lootentity);
        } catch { }

        let convertEntity = lootentity == "convert";
        let createEntity = (entity == undefined || entity instanceof Folder || entity instanceof JournalEntry);

        if (convertEntity)
            notes = `Convert tokens to lootable using ${sheetName}`;
        else {
            let entityName = "New " + (this.isLootActor(lootsheet) ? "Actor" : "Loot Journal Entry");
            if (this.isLootActor(lootsheet)) {
                entityName = await this.getEntityName(entity || lootentity);
            } else {
                entityName = await this.getEntityName(entity || lootentity);
            }
            notes = `${entityName}, using ${sheetName}${setting("create-canvas-object") ? `, and create a ${(this.isLootActor(lootsheet) ? "Token" : "Note")} on the Canvas` : ''}`;
        }

        let hasLootable = lootsheet != 'none' && MonksTokenBar.getLootSheetOptions()[lootsheet] != undefined;

        let openLootOptions = {
            'none': game.i18n.localize("MonksTokenBar.None"),
            'gm': game.i18n.localize("MonksTokenBar.GMOnly"),
            'players': game.i18n.localize("MonksTokenBar.PlayersOnly"),
            'everyone': game.i18n.localize("MonksTokenBar.Everyone"),
        }

        return {
            hasLootable: hasLootable,
            notes: notes,
            createEntity: createEntity,
            convertEntity: convertEntity,
            placeholder: this.getLootableName(entity),
            currency: this.currency,
            entries: this.entries,
            noitems: this.noitems.join(", "),
            actionText: (convertEntity ? i18n('MonksTokenBar.ConvertToLootable') : (createEntity ? i18n('MonksTokenBar.TransferToNewLootable') : i18n('MonksTokenBar.TransferToLootable'))),
            lootEntity: this.lootEntity,
            openLoot: this.openLoot,
            createCanvasObject: this.createCanvasObject,
            clearItems: this.clearItems,
            entityName: this.entityName,
            openLootOptions: openLootOptions
        };
    }

    isLootActor(lootsheet) {
        return ['lootsheetnpc5e', 'merchantsheetnpc', 'item-piles'].includes(lootsheet);
    }

    getCurrency(currency) {
        if (!currency)
            return 0;
        return (currency.value != undefined ? currency.value : currency) || 0;
    }

    async activateListeners(html) {
        super.activateListeners(html);

        $('.dialog-button.convert-to-lootable', html).click(this.convert.bind(this));
        $('.reset-loot', html).click(this.resetLoot.bind(this));
        $('.delete-loot', html).click(this.deleteLoot.bind(this));
        $('.loot-item-quantity', html).blur(this.updateLoot.bind(this));

        $('.delete-entry', html).click(this.deleteEntry.bind(this));

        $('[name="create-canvas-object"]', html).click(() => { this.createCanvasObject = $('[name="create-canvas-object"]', html).prop("checked"); });
        $('[name="open-loot"]', html).change(() => { this.openLoot = $('[name="open-loot"]', html).val(); });
        $('[name="clear-items"]', html).click(() => { this.clearItems = $('[name="clear-items"]', html).prop("checked"); });
        $('[name="entity-name"]', html).blur(() => { this.entityName = $('[name="entity-name"]', html).val(); });
        $('[name="loot-entity"]', html).on("change", this.changeEntity.bind(this));

        $('.add-gold', html).click(this.calcGold.bind(this));

        $(".currency-value", html).blur((event) => { this.currency[event.currentTarget.name] = $(event.currentTarget).val(); });

        let sheet = setting('loot-sheet');

        let entity;
        try {
            entity = await fromUuid(this.lootEntity);
        } catch { }

        let convertEntity = this.lootEntity == "convert";
        let createEntity = (entity == undefined || entity instanceof Folder || entity instanceof JournalEntry);

        let hasLootable = sheet != 'none' && MonksTokenBar.getLootSheetOptions()[sheet] != undefined;
        $('[name="loot-entity"]', html).closest('.form-group').toggle(hasLootable);
        $('[name="open-loot"]', html).closest('.form-group').toggle(hasLootable && !convertEntity);
        $('[name="clear-items"]', html).closest('.form-group').toggle(hasLootable && !createEntity && !convertEntity);
        $('[name="entity-name"]', html).closest('.form-group').toggle(hasLootable && createEntity && !convertEntity);
        $('[name="create-canvas-object"]', html).closest('.form-group').toggle(hasLootable && !convertEntity);

        let ctrl = $('[name="loot-entity"]', html);
        let list = await MonksTokenBar.lootEntryListing(ctrl, html, (sheet == "monks-enhanced-journal" ? game.journal : game.actors), this.lootEntity);
        $('[data-uuid="convert"]', list).remove();
        list.insertAfter(ctrl);
        list.toggleClass("disabled", this.lootEntity == "convert");
        ctrl.hide();

        this.setPosition({ height: "auto" });
    };

    async changeEntity(event) {
        this.lootEntity = $(event.currentTarget).val();

        let sheet = setting('loot-sheet');

        let entity;
        try {
            entity = await fromUuid(this.lootEntity);
        } catch { }

        let convertEntity = this.lootEntity == "convert";
        let createEntity = (entity == undefined || entity instanceof Folder || entity instanceof JournalEntry);

        $('[name="clear-items"]', this.element).closest('.form-group').toggle(!createEntity && !convertEntity);
        $('[name="entity-name"]', this.element).closest('.form-group').toggle(createEntity && !convertEntity);
    }

    convert() {
        this.convertToLootable({
            name: this.entityName,
            clear: this.clearItems,
            lootEntity: this.lootEntity,
            openLoot: this.openLoot,
            createCanvasObject: this.createCanvasObject,
            currency: this.currency
        });
    }

    deleteEntry(event) {
        let elem = event.currentTarget.closest(".entry");
        let entryId = elem.dataset.entryId;

        this.entries.findSplice(e => e.id == entryId);
        $(elem).remove();
        this.setPosition({ height: "auto" });
    }

    resetLoot(event) {
        let itemElem = event.currentTarget.closest(".item");
        let itemId = itemElem.dataset.itemId;
        let entryId = event.currentTarget.closest(".entry").dataset.entryId;

        let entry = this.entries.find(e => e.id == entryId);
        let item = entry.items.find(i => i.id == itemId);
        item.quantity = item.count;
        $('.loot-item-quantity', itemElem).val(item.count);
        $(itemElem).removeClass("notincluded");
    }

    deleteLoot(event) {
        let itemElem = event.currentTarget.closest(".item");
        let itemId = itemElem.dataset.itemId;
        let entryId = event.currentTarget.closest(".entry").dataset.entryId;

        let entry = this.entries.find(e => e.id == entryId);
        if (entry.id == "") {
            entry.items.findSplice(i => i.id == itemId);
            $(itemElem).remove();
        } else {
            let item = entry.items.find(i => i.id == itemId);
            item.quantity = 0;
            $('.loot-item-quantity', itemElem).val(0);
            $(itemElem).addClass("notincluded");
        }
    }

    updateLoot(event) {
        let itemElem = event.currentTarget.closest(".item");
        let itemId = itemElem.dataset.itemId;
        let entryId = event.currentTarget.closest(".entry").dataset.entryId;

        let entry = this.entries.find(e => e.id == entryId);
        let item = entry.items.find(i => i.id == itemId);
        item.quantity = $(event.currentTarget).val();
        $(itemElem).toggleClass("notincluded", item.quantity == 0);
    }

    calcGold() {
        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        for (let entry of this.entries) {
            // If the actor has no gold, assign gold by CR: gold = 0.6e(0.15*CR)
            let goldformula = setting('gold-formula');
            let gold = 0;
            try {
                const compiled = Handlebars.compile(goldformula);
                let content = compiled({ actor: entry.token?.actor }, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true }).trim();

                gold = eval(content) * entry.quantity;
            } catch {}

            // Ensure it can divide evenly across all looting players
            gold = gold + (gold % Math.max(lootingUsers.length, 1)) ?? 0;
            this.currency.gp = (this.currency.gp ?? 0) + gold;
        }
        this.render(true);
    }

    async _onDrop(event) {
        // Try to extract the data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        }
        catch (err) {
            return false;
        }

        if (this.lootEntity == "convert")
            return ui.notifications.warn("Cannot drop items when converting ");

        // Identify the drop target
        if (data.type == "Item") {
            let entry = {
                id: "",
                name: "",
                quantity: 1,
                items: []
            };

            let _entry = this.entries.find(e => e.id == "");
            if (_entry) {
                entry = _entry;
            } else {
                this.entries.push(entry);
                this.entries = this.entries.sort((a, b) => { return a.name.localeCompare(b.name); });
            }

            let i = data.data || await fromUuid(data.uuid);
            let item = {
                id: getProperty(i, "flags.core.sourceId") || i._id,
                name: i.name,
                img: i.img,
                sysQty: i.system.quantity,
                quantity: 1,
                count: 1,
                data: (i instanceof Item ? i.toObject() : i)
            };

            let _item = entry.items.find(i => i.id == item.id && i.sysQty == item.sysQty);
            if (_item) {
                _item.quantity += 1;
                _item.count = _item.quantity;
            } else {
                entry.items.push(item);
                entry.items = entry.items.sort((a, b) => { return a.name.localeCompare(b.name); });
            }

            this.render(true);
        }/* else if (data.type == "Actor") {
            let entry = {
                id: t.id,
                token: t,
                actorId: t.actor.id,
                name: t.actor.name,
                img: t.document.texture.src,
                quantity: 1,
                items: []
            };
            if (!t.document.actorLink && this.lootEntity != "convert") {
                let _entry = this.entries.find(e => e.actorId == t.actor.id);
                if (_entry) {
                    entry = _entry;
                    entry.quantity += 1;
                } else
                    this.entries.push(entry);
            } else
                this.entries.push(entry);

            let items = actorItems
                .filter(item => {
                    // Weapons are fine, unless they're natural
                    let result = false;
                    if (item.type == 'weapon') {
                        result = item.system.weaponType != 'natural';
                    }
                    // Equipment's fine, unless it's natural armor
                    else if (item.type == 'equipment') {
                        if (!item.system.armor)
                            result = true;
                        else
                            result = item.system.armor.type != 'natural';
                    } else
                        result = !(['class', 'spell', 'feat', 'action', 'lore'].includes(item.type));

                    return result;
                }).map(i => {
                    return {
                        id: this.lootEntity == "convert" ? i._id : getProperty(i, "flags.core.sourceId") || i._id,
                        name: i.name,
                        img: i.img,
                        from: t.name,
                        sysQty: i.system.quantity,
                        quantity: 1,
                        data: (i instanceof Item ? i.toObject() : i)
                    };
                });

            if (items.length) {
                for (let item of items) {
                    let _item = entry.items.find(i => i.id == item.id && i.sysQty == item.sysQty);
                    if (_item) {
                        _item.quantity += 1;
                    } else
                        entry.items.push(item);
                }

                for (let item of entry.items) {
                    item.count = item.quantity;
                }
            } else if (!this.noitems.find(e => e == entry.name)) {
                this.noitems.push(entry.name);
            }

            entry.items = entry.items.sort((a, b) => { return a.name.localeCompare(b.name); });

            let actorCurrency = (t.document.actorData.currency || t.actor.system.currency);
            for (let [key, value] of Object.entries(actorCurrency)) {
                this.currency[key] = (this.currency[key] ?? 0) + value;
            }
        }*/
    }

    async getEntityName(entity) {
        if (entity instanceof JournalEntryPage || entity instanceof Actor)
            return "Adding to " + entity.name;
        else if (entity instanceof JournalEntry)
            return "Adding new loot page to " + entity.name;
        else if (entity instanceof Folder)
            return (entity.documentClass.documentName == "JournalEntry" ? "Creating new Journal Entry within " + entity.name + " folder" : "Creating Actor within " + entity.name + " folder");
        else if (entity == "convert")
            return "Convert tokens";
        else if (entity)
            return `Creating ${(entity?.documentClass?.documentName || entity?.parent?.documentClass?.documentName) == "JournalEntry" ? "Journal Entry" : "Actor"} in the root folder`;
        else
            return "Unknown";
    }

    getLootableName(entity) {
        //find the folder and find the next available 'Loot Entry (x)'
        let lootSheet = setting('loot-sheet');
        let collection = (this.isLootActor(lootSheet) ? game.actors : game.journal);

        let lootname = i18n(setting("loot-name"));

        let idx = lootname.indexOf('{{#}}');
        if (idx > -1) {
            let start = lootname.substring(0, idx).trim();
            let end = lootname.substring(idx + 5).trim();
            let num = "";
            let documents = (entity == undefined ? collection.filter(e => e.folder == undefined) : entity.contents || entity.pages || entity.parent?.contents || entity.parent?.pages);
            if (documents && documents.length) {
                for (let doc of documents) {
                    if ((doc.name.startsWith(start) || start == "") && (doc.name.endsWith(end) || end == "")) {
                        let val = Number(doc.name.substr(start.length, doc.name.length - start.length - end.length));
                        if (!isNaN(val))
                            num = Math.max(num || 0, val);
                    }
                }
            }

            lootname = lootname.replace("{{#}}", !isNaN(num) ? num + 1 : "");
        }
        return lootname;
    }

    async convertToLootable({ clear = false, name = null, lootEntity = null, openLoot = null, createCanvasObject = null, currency = {} }) {
        // Limit selection to Players and Trusted Players
        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        let lootSheet = setting('loot-sheet');
        lootEntity = lootEntity || setting('loot-entity');

        if (lootSheet == 'none')
            return;

        let msg = "";
        let created = false;

        if (lootEntity == 'convert') {
            if (lootSheet == "item-piles") {
                let tokens = this.entries.map(t => t.token).filter(t => !!t);
                ItemPiles.API.turnTokensIntoItemPiles(tokens);
            } else {
                for (let entry of this.entries) {
                    if (!entry.items.length)
                        continue;

                    // Don't run this on PC tokens by mistake
                    if (entry.actor.type === 'character')
                        continue;

                    // Change sheet to lootable, and give players permissions.
                    let newActorData = {};
                    if (lootSheet == 'lootsheetnpc5e') {
                        newActorData = {
                            'flags': {
                                'core': {
                                    'sheetClass': 'dnd5e.LootSheetNPC5e'
                                },
                                'lootsheetnpc5e': {
                                    'lootsheettype': 'Loot'
                                },
                                'monks-tokenbar': {
                                    'converted': true
                                }
                            }
                        };
                    } else if (lootSheet == 'merchantsheetnpc') {
                        newActorData = {
                            'flags': {
                                'core': {
                                    'sheetClass': 'core.a'
                                },
                                'monks-tokenbar': {
                                    'converted': true
                                }
                            }
                        };
                    }

                    if (!['dnd5e.LootSheet5eNPC', 'core.a'].includes(entry.actor.data?.flags?.core?.sheetClass))
                        newActorData.flags['monks-tokenbar'].oldsheetClass = entry.actor.data?.flags?.core?.sheetClass; //token.actor._getSheetClass();

                    // Remove items that shouldn't be lootable
                    let oldItems = [];
                    let newItems = entry.actor.items
                        .filter(item => {
                            let itemData = entry.items.find(i => i._id == item.id);
                            if (itemData.quantity == 0)
                                oldItems.push(item);

                            return itemData.quantity > 0;
                        });

                    newActorData.items = newItems;
                    //only store the old items if the there are old items to avoid overwriting a second time
                    if (oldItems.length > 0) {
                        if (entry.actor.getFlag('monks-tokenbar', 'olditems') != undefined)
                            oldItems = oldItems.concat(entry.actor.getFlag('monks-tokenbar', 'olditems'));
                        newActorData.flags["monks-tokenbar"].olditems = oldItems;
                    }
                    //await token.actor.update(newActorData);

                    // This section is a workaround for the fact that the LootSheetNPC module
                    // currently uses an older currency schema, compared to current 5e expectations.
                    // Need to convert the actor's currency data to the LS schema here to avoid
                    // breakage. If there is already currency on the actor, it is retained.

                    /*
                    for (let curr of ['cp', 'sp', 'ep', 'gp', 'pp']) {
                        if (typeof (entry.actor.system.currency[curr]) === "number" || entry.actor.system.currency[curr] == undefined) {
                            let oldCurrencyData = entry.actor.system.currency[curr];
                            newActorData[`system.currency.${curr}`] = { 'value': oldCurrencyData || 0 };
                        }
                    }*/

                    /*
                    for (let curr of Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {})) {
                        if (entry.currency[curr] != undefined)
                            newActorData[`system.currency.${curr}`] = (entry.actor.system.currency[curr].hasOwnProperty("value") ? { value: entry.currency[curr] } : entry.currency[curr]);
                    }
                    */

                    newActorData = expandObject(newActorData);

                    entry.actor._sheet = null;

                    MonksTokenBar.emit('refreshsheet', { tokenid: entry?.id });
                    await entry.actor.update(newActorData);

                    let oldIds = oldItems.map(i => i.id);
                    if (oldIds.length > 0) {
                        for (let id of oldIds) {
                            let item = entry.actor.items.find(i => i.id == id);
                            if (item)
                                await item.delete();
                        }
                        //await Item.deleteDocuments(oldIds, {parent: token.actor});
                    }

                    // Update permissions to level 2, so players can loot
                    let permissions = {};
                    Object.assign(permissions, entry.actor.ownership);
                    lootingUsers.forEach(user => {
                        permissions[user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
                    });

                    // If using Combat Utility Belt, need to remove any of its condition overlays
                    // before we can add the chest icon overlay.
                    if (game.modules.get("combat-utility-belt")?.active) {
                        await game.cub.removeAllConditions(entry.actor);
                    }

                    if (entry.token) {
                        let oldAlpha = entry.token.alpha;
                        await entry.token.update({
                            "overlayEffect": 'icons/svg/chest.svg',
                            "alpha": 0.6,
                            "actorData": {
                                "actor": {
                                    "flags": {
                                        "loot": {
                                            "playersPermission": 2
                                        }
                                    }
                                },
                                "permission": permissions
                            },
                            "flags.monks-tokenbar.alpha": oldAlpha
                        });
                    }
                }
            }

            msg = `Actors have been converted to lootable`;
        } else {
            let collection = (this.isLootActor(lootSheet) ? game.actors : game.journal);

            let entity;
            try {
                entity = await fromUuid(lootEntity);
            } catch { }

            if (entity == undefined)
                warn("Could not find Loot Entity, defaulting to creating one");

            created = (entity == undefined || entity instanceof Folder || entity instanceof JournalEntry);
            if (created) {
                //create the entity in the Correct Folder
                if (name == undefined || name == '')
                    name = this.getLootableName(entity);

                if ((entity instanceof Folder || entity == undefined) && collection.documentName == "JournalEntry") {
                    entity = await JournalEntry.create({ folder: entity, name: name, ownership: { 'default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } }, { render: false });
                }

                if (this.isLootActor(lootSheet)) {
                    if (lootSheet !== "item-piles") {
                        const cls = collection.documentClass;
                        entity = await cls.create({ folder: entity, name: name, img: 'icons/svg/chest.svg', type: 'npc', flags: { core: { 'sheetClass': (lootSheet == "lootsheetnpc5e" ? 'dnd5e.LootSheetNPC5e' : 'core.a') } }, ownership: { 'default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } });
                        ui.actors.render();
                        MonksTokenBar.emit("refreshDirectory", { name: "actors" });
                    }
                } else {
                    entity = await JournalEntryPage.create({ name: name, type: "text", flags: { "monks-enhanced-journal": { type: "loot", purchasing: "confirm" } }, ownership: { 'default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER } }, { parent: entity, render: false });
                    ui.journal.render();
                    MonksTokenBar.emit("refreshDirectory", { name: "journal" });
                }
            }

            if (!entity)
                return ui.notifications.warn("Could not find Loot Entity");

            if (clear) {
                if (this.isLootActor(lootSheet)) {
                    for (let item of entity.items) {
                        await item.delete();
                    }
                } else {
                    await entity.setFlag('monks-enhanced-journal', 'items', []);
                }
            }

            let ptAvg = { x: 0, y: 0, count: 0 };
            let items = [];

            for (let entry of this.entries) {
                ptAvg.x += entry.token.x;
                ptAvg.y += entry.token.y;
                ptAvg.count++;

                let loots = entry.items.filter(i => i.quantity != "0");
                for (let loot of loots) {
                    let item = loot.data;
                    let sysPrice = game.MonksEnhancedJournal.getSystemPrice(item);
                    let price = game.MonksEnhancedJournal.getPrice(sysPrice);

                    if (typeof loot.quantity == "string" && loot.quantity.indexOf("d") != -1) {
                        let r = new Roll(loot.quantity);
                        await r.evaluate({ async: true });
                        loot.quantity = r.total;
                    } else
                        loot.quantity = parseInt(loot.quantity);

                    if (isNaN(loot.quantity))
                        loot.quantity = 1;

                    item._id = randomID();
                    setProperty(item, "flags.monks-enhanced-journal.quantity", loot.quantity);
                    setProperty(item, "flags.monks-enhanced-journal.price", price.value + " " + price.currency);
                    setProperty(item, "flags.monks-enhanced-journal.from", loot.from);
                    if (lootSheet !== 'monks-enhanced-journal') {
                        //+++ Need to set to correct system quantity
                        setProperty(item, "system.quantity", loot.quantity);
                    }

                    items.push(item);
                }
            }

            if (this.isLootActor(lootSheet)) {
                if (lootSheet == "item-piles") {
                    let ipOptions = {
                        position: { x: ptAvg.x / ptAvg.count, y: ptAvg.y / ptAvg.count },
                        items,
                        //itemPileFlags: { enabled: true }
                    };
                    if (entity instanceof Folder) {
                        let folder = entity;
                        let foldernames = [folder.name];
                        while (folder.folder) {
                            folder = folder.folder;
                            foldernames.unshift(folder.name);
                        }
                        if (name == undefined || name == '')
                            name = this.getLootableName(entity);
                        ipOptions.actor = name;
                        ipOptions.actorOverrides = { name: name };
                        ipOptions.tokenOverrides = { name: name };
                        ipOptions.folders = foldernames;
                        ipOptions.createActor = true;
                        let uuids = await ItemPiles.API.createItemPile(ipOptions);
                        entity = await fromUuid(uuids.actorUuid);
                    } else if (entity instanceof Actor) {
                        await entity.update({"flags.item-piles.data.enabled": true});
                        await ItemPiles.API.addItems(entity, items, { removeExistingActorItems: clear });
                    }

                    /*
                    for (let entry of this.entries) {
                        await entry.token.document.update({ hidden: true });
                    }
                    */
                } else {
                    let itemData = items.map(i => {
                        let data = i.data;
                        data.system.quantity = i.quantity * i.sysQty;
                        if (data.system.equipped != undefined)
                            data.system.equipped = false;
                        return data;
                    });
                    entity.createEmbeddedDocuments("Item", itemData);

                    let entityCurr = entity.system.currency || {};
                    for (let curr of Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {})) {
                        if (currency[curr] != undefined) {
                            if (typeof currency[curr] == "string" && currency[curr].indexOf("d") != -1) {
                                let r = new Roll(currency[curr]);
                                await r.evaluate({ async: true });
                                currency[curr] = r.total;
                            } else {
                                currency[curr] = parseInt(currency[curr]);
                            }

                            if (isNaN(currency[curr]))
                                currency[curr] = 0;

                            let value = entityCurr[curr].value ?? entityCurr[curr];
                            value = currency[curr] + parseInt(value || 0);
                            entityCurr[curr] = (entityCurr[curr].hasOwnProperty("value") ? { value: value } : value);
                        }
                    }

                    entity.update({ data: { currency: entityCurr } });
                }
            } else if (lootSheet == 'monks-enhanced-journal') {
                let entityItems = duplicate(entity.getFlag('monks-enhanced-journal', 'items') || []);
                entityItems = entityItems.concat(items);
                await entity.setFlag('monks-enhanced-journal', 'items', entityItems);

                let entityCurr = entity.getFlag("monks-enhanced-journal", "currency") || {};
                for (let curr of Object.keys(CONFIG[game.system.id.toUpperCase()]?.currencies || {})) {
                    if (currency[curr] != undefined) {
                        if (typeof currency[curr] == "string" && currency[curr].indexOf("d") != -1) {
                            let r = new Roll(currency[curr]);
                            await r.evaluate({ async: true });
                            currency[curr] = r.total;
                        } else {
                            currency[curr] = parseInt(currency[curr]);
                        }

                        if (isNaN(currency[curr]))
                            currency[curr] = 0;

                        let value = entityCurr[curr]?.value ?? entityCurr[curr];
                        value = currency[curr] + parseInt(value || 0);
                        entityCurr[curr] = value;
                    }
                }
                await entity.setFlag('monks-enhanced-journal', 'currency', entityCurr);
            }

            name = name || entity.name;
            msg = (created ?
                `${name} has been created, items have been transferred to it` :
                `Items have been transferred to ${name}`);

            let createObject = (setting("create-canvas-object") || createCanvasObject);
            if (createObject && !(lootSheet == "item-piles" && created) && this.lootEntity != "convert") {
                let pt = { x: ptAvg.x / ptAvg.count, y: ptAvg.y / ptAvg.count };
                // Snap to Grid
                let snap = canvas.grid.getSnappedPosition(pt.x, pt.y, canvas[(this.isLootActor(lootSheet) ? 'tokens' : 'notes')].gridPrecision);
                pt.x = snap.x;
                pt.y = snap.y;

                // Validate the final position
                if (canvas.dimensions.rect.contains(pt.x, pt.y)) {
                    if (this.isLootActor(lootSheet)) {
                        const td = await entity.getTokenData(mergeObject(pt, { texture: { src: "icons/svg/chest.svg" } }));

                        const cls = getDocumentClass("Token");
                        await cls.create(td, { parent: canvas.scene });
                    } else if (lootSheet == 'monks-enhanced-journal') {
                        let data = {
                            x: parseInt(pt.x + (canvas.scene.dimensions.size / 2)),
                            y: parseInt(pt.y + (canvas.scene.dimensions.size / 2)),
                            entryId: entity.parent.id,
                            pageId: entity.id,
                            icon: "icons/svg/chest.svg"
                        };

                        const cls = getDocumentClass("Note");
                        await cls.create(data, { parent: canvas.scene });
                    }
                }

                /*
                for (let entry of this.entries) {
                    await entry.token.document.update({hidden: true});
                }*/

                msg += ` and a ${this.isLootActor(lootSheet) ? "Token" : "Note"} has been added to the canvas`
            }

            let open = openLoot || setting('open-loot');
            if (open != "none" && entity) {
                if (open != 'players') {
                    if (game.modules.get('monks-enhanced-journal')?.active && lootSheet == 'monks-enhanced-journal') {
                        if (!game.MonksEnhancedJournal.openJournalEntry(entity))
                            entity.sheet.render(true);
                    } else
                        entity.sheet.render(true);
                }
                if (open != 'gm') {
                    MonksTokenBar.emit("renderLootable", { entityid: entity.uuid });
                }
            }
        }

        if(msg != "")
            ui.notifications.info(msg);
        if (this.combat)
            MonksTokenBar.emit("closeLootable", { id: this.combat.id });
        this.close();
    }

    static async revertLootable(app) {
        let actor = app.token.actor;

        log('Reverting lootable', actor);

        if (actor == undefined)
            return;

        $('.revert-lootable', app.element).remove();
        await app.close(true);

        let actorData = {
            'flags': {
                'core': {
                    'sheetClass': (actor.flags['monks-tokenbar'].oldsheetClass || null)
                },
                'monks-tokenbar': {
                    'converted': false
                }
            }
        };

        let newItems = [];
        if (actor.getFlag('monks-tokenbar', 'olditems')?.length) {
            actorData.items = duplicate(actor.items);
            for (let olditem of actor.getFlag('monks-tokenbar', 'olditems')) {
                if (actorData.items.findIndex(i => { return i._id == olditem._id; }) < 0)
                    actorData.items.push(olditem);
            }

            actorData.flags["monks-tokenbar"].olditems = [];
        }

        MonksTokenBar.emit('refreshsheet', { tokenid: app.token?.id } );

        //if (newItems.length > 0)
        //    await Item.create(newItems, { parent: actor });
        await actor.update(actorData); /*.then((token) => {
            //if (app._state === Application.RENDER_STATES.CLOSED)
            //    token.actor.sheet.render(true);
        });*/

        let lootingUsers = game.users.contents.filter(user => { return user.role >= 1 && user.role <= 2 });
        let permissions = {};
        Object.assign(permissions, actor.ownership);
        lootingUsers.forEach(user => {
            permissions[user.id] = 0;
        });
        await app.token.update({
            "overlayEffect": null,
            "alpha": app.token.getFlag('monks-tokenbar', 'alpha'),
            "actorData": {
                "permission": permissions
            }
        });

        actor._sheet = null;

        let waitClose = 40;
        while (app._state !== Application.RENDER_STATES.CLOSED && waitClose-- > 0) {
            await new Promise((r) => setTimeout(r, 100));
        }
        if (app._state === Application.RENDER_STATES.CLOSED)
            actor.sheet.render(true);
    }
}
