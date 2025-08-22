import { MonksTokenBar, log, error, i18n, setting } from "../monks-tokenbar.js";
import { PickIcon } from "./pick-icon.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class EditStats extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(object, options = {}) {
        let stats = object?.getFlag('monks-tokenbar', 'stats') || MonksTokenBar.stats;
        options.height = 62 + (Math.max(stats.length, 4) * 27);

        super(object, options);

        this.object = object;
        this.stats = (Array.isArray(stats) ? stats : []).map(s => {
            s.id = s.id || foundry.utils.randomID();
            return s;
        });
        //let's just grab the first player character we can find
        let player = game.actors.find(a => a.type == 'character');
        if (player) {
            let attributes = getDocumentClass("Token")?.getTrackedAttributes(player.system ?? {});
            if (attributes)
                this.attributes = attributes.value.concat(attributes.bar).map(a => a.join('.'));
        }
    }

    static DEFAULT_OPTIONS = {
        id: "editstats",
        tag: "form",
        classes: ["editstats"],
        sheetConfig: false,
        window: {
            contentClasses: ["standard-form"],
            icon: "fa-solid fa-align-justify",
            resizable: true,
            title: 'Edit Stats'
        },
        actions: {
            resetDefault: EditStats.resetDefaults,
            changeIcon: EditStats.changeIcon,
            changeText: EditStats.changeText,
            changeColor: EditStats.changeColor,
            addStat: EditStats.addStat,
            removeStat: EditStats.removeStat
        },
        position: { width: 600 },
        form: {
            handler: EditStats.onSubmitForm,
            closeOnSubmit: true
        }
    };

    static PARTS = {
        form: {
            classes: ["standard-form"],
            template: "modules/monks-tokenbar/templates/editstats/editstats.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    get title() {
        return this.object instanceof Actor ? `Edit Stats: ${this.object.name }` : 'Edit Stats';
    }

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case "form":
                this._prepareBodyContext(context, options);
                break;
            case "footer":
                context.buttons = this.prepareButtons();
        }

        return context;
    }

    _prepareBodyContext(context, options) {
        let rgb2hex = (s) => s.match(/[0-9]+/g).reduce((a, b) => a + (b | 256).toString(16).slice(1), '#');

        let stats = this.stats.map(s => {
            let defStat = MonksTokenBar.stats.find(stat => stat.stat === s.stat);
            let defaultColor = defStat?.color || '#f0f0f0';
            if (defaultColor.startsWith('rgb'))
                defaultColor = rgb2hex(defaultColor);
            s.color = s.color || defaultColor;
            return s;

        })
        return foundry.utils.mergeObject(context, {
            hasObject: this.object instanceof Actor,
            stats
        });
    }

    prepareButtons() {
        return [
            {
                type: "button",
                icon: "fas fa-undo",
                label: this.object instanceof Actor ? "Clear Custom Stats" : "Reset Defaults",
                action: "resetDefault"
            },
            {
                type: "submit",
                icon: "far fa-save",
                label: "Save Changes",
            }
        ];
    }

    static onSubmitForm(event, form) {
        if (this.object && Object.keys(this.object).length != 0) {
            this.object.setFlag('monks-tokenbar', 'stats', this.stats);
        }else
            game.settings.set('monks-tokenbar', 'stats', this.stats);
        MonksTokenBar.tokenbar.refresh();
        this.submitting = true;
    }

    static addStat(event) {
        this.stats.push({ id: foundry.utils.randomID(), stat: "", icon: "fa-address-book" });
        this.render(true);
    }

    static removeStat(event, target) {
        let statId = target.closest('.stat').dataset.id;
        this.stats.findSplice(s => s.id === statId);
        $('.stat[data-id="' + statId + '"]', this.element).remove();
    }

    static resetDefaults() {
        if (Object.keys(this.object).length != 0) {
            this.stats = MonksTokenBar.stats;
            this.object.unsetFlag('monks-tokenbar', 'stats');
            this.close();
        }
        else
            this.stats = MonksTokenBar.system.defaultStats;
        this.render(true);
        //let that = this;
        //window.setTimeout(function () { that.setPosition(); }, 100);
    }

    static changeIcon(event, target) {
        this.statid = target.closest('.stat').dataset.id;
        let stat = this.stats.find(s => s.id == this.statid);
        new PickIcon({ stat, parent: this }).render(true);
    }

    setIcon(id, icon) {
        let stat = this.stats.find(s => s.id == id);
        stat.icon = icon;
        $('.stat[data-id="' + id + '"] .icon button', this.element).attr('class', 'inline-control icon fa-solid ' + icon);
        $('.stat[data-id="' + id + '"] .icon input', this.element).val(icon);
    }

    static changeText(event) {
        let statid = event.currentTarget.closest('.stat').dataset.id;
        let stat = this.stats.find(s => s.id == statid);
        stat.stat = $(event.currentTarget).val();
        if (!this.submitting)
            this.render(true);
    }

    static changeColor(event) {
        let statid = event.currentTarget.closest('.stat').dataset.id;
        let stat = this.stats.find(s => s.id == statid);
        stat.color = $(event.currentTarget).val();
        if (!this.submitting)
            this.render(true);
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        //dragDrop: [{ dragSelector: ".icon", dropSelector: ".item-list" }]
        new foundry.applications.ux.DragDrop.implementation({
            dragSelector: ".stat",
            dropSelector: ".stat-list",
            permissions: {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this)
            },
            callbacks: {
                dragstart: this._onDragStart.bind(this),
                drop: this._onDrop.bind(this)
            }
        }).bind(this.element);

        $('.name [name="name"]', this.element).blur(EditStats.changeText.bind(this));
        $('.color [name="color"] input[type="text"]', this.element).change(EditStats.changeColor.bind(this));
        $('.color [name="color"] input[type="color"]', this.element).on('change', function (event) {
            $(this).prev().val($(this).val()).change();

        });

        if (this.attributes) {
            let that = this;

            var substringMatcher = function (strs) {
                return function findMatches(q, cb) {
                    var matches, substrRegex;

                    // an array that will be populated with substring matches
                    matches = [];

                    // regex used to determine if a string contains the substring `q`
                    substrRegex = new RegExp(q, 'i');

                    // iterate through the pool of strings and for any string that
                    // contains the substring `q`, add it to the `matches` array
                    $.each(strs, function (i, str) {
                        if (substrRegex.test(str)) {
                            matches.push(str);
                        }
                    });

                    cb(matches);
                };
            };

            $('.name [name="name"]', this.element).typeahead(
                {
                    minLength: 1,
                    hint: true,
                    highlight: true
                },
                {
                    source: substringMatcher(that.attributes)
                }
            );
        }
    };

    _canDragStart() {
        return this.object instanceof Actor ? this.object.isOwner : game.user.isGM;
    }

    _canDragDrop() {
        return this.object instanceof Actor ? this.object.isOwner : game.user.isGM;
    }

    _onDragStart(event) {
        let statId = event.target.closest(".sound")?.dataset.id;
        const dragData = { id: statId };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    _onDrop(event) {
        // Try to extract the data
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);

        // Identify the drop target
        const target = event.target.closest(".stat") || null;

        // Call the drop handler
        if (target && target.dataset.id) {
            if (data.id === target.dataset.id) return; // Don't drop on yourself

            let from = this.stats.findIndex(a => a.id == data.id);
            let to = this.stats.findIndex(a => a.id == target.dataset.id);
            log('from', from, 'to', to);
            this.stats.splice(to, 0, this.stats.splice(from, 1)[0]);

            if (from < to)
                $('.stat-list .stat[data-id="' + data.id + '"]', this.element).insertAfter(target);
            else
                $('.stat-list .stat[data-id="' + data.id + '"]', this.element).insertBefore(target);
        }
    }
}