import { MonksTokenBar, log, i18n, setting } from "../monks-tokenbar.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
export class ApplicationSheetConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options, ...args) {
        super(options);
        this.#type = options.type;
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        id: "sheet-config-{id}",
        tag: "form",
        classes: ["sheet-config"],
        sheetConfig: false,
        window: {
            contentClasses: ["standard-form"],
            icon: "fa-solid fa-gear"
        },
        position: { width: 500 },
        form: {
            handler: ApplicationSheetConfig.onSubmitForm,
            closeOnSubmit: true
        }
    };

    /** @override */
    static PARTS = {
        form: {
            classes: ["standard-form"],
            template: "modules/monks-tokenbar/templates/sheets/application-sheet-config.hbs"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    #type;
    #defaults;


    /** @override */
    get title() {
        return game.i18n.format("SHEETS.ConfigureTitle", { prefix: i18n(`MonksTokenBar.THEME.${this.#type}`)});
    }

    async _preparePartContext(partId, context, options) {
        context.partId = partId;
        switch (partId) {
            case "footer": await this._prepareFooterContext(context, options); break;
            case "form": await this._prepareFormContext(context, options); break;
        }
        return context;
    }

    async _prepareFooterContext(context, options) {
        context.buttons = [{
            type: "submit",
            icon: "fa-solid fa-floppy-disk",
            label: "SHEETS.Save"
        }];
    }

    async _prepareFormContext(context, options) {
        const themes = game.settings.get("core", "sheetThemes");

        context.defaults = this.#defaults = {
            theme: {
                field: new foundry.data.fields.StringField({
                    label: "SHEETS.Theme",
                    choices: {
                        dark: "SETTINGS.UI.FIELDS.colorScheme.choices.dark",
                        light: "SETTINGS.UI.FIELDS.colorScheme.choices.light",
                    }
                }),
                name: `themes.${this.#type}`,
                value: game.user.getFlag("monks-tokenbar", `themes.${this.#type}`, ""),
            }
        };
    }

    _onClose(_options) { }

    _onFirstRender(_context, _options) { }

    static async onSubmitForm(event, form, formData) {
        const { object } = formData;

        let theme = object[`themes.${this.#type}`];
        let oldTheme = game.user.getFlag("monks-tokenbar", `themes.${this.#type}`, "");

        if (theme == "") {
            game.user.unsetFlag("monks-tokenbar", `themes.${this.#type}`);
        } else {
            game.user.setFlag("monks-tokenbar", `themes.${this.#type}`, theme);
        }

        const defaultSheetChanged = theme !== oldTheme;

        if (defaultSheetChanged) {
            const { colorScheme } = game.settings.get("core", "uiConfig");
            theme = theme || colorScheme.applications || "dark"
            $(`.sheet.${this.#type}`).removeClass('theme-light theme-dark').addClass(`theme-${theme}`);
        }
    }
}