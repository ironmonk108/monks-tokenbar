import { MonksTokenBar, log, error, i18n, setting } from "../monks-tokenbar.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ResetPosition extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "tokenbar-resetposition",
        tag: "div",
        sheetConfig: false,
        position: { width: 1, height: 1 },
    };

    static PARTS = {
        form: {
            template: "modules/monks-tokenbar/templates/resetposition.html"
        }
    };

    static async resetPosition(app) {
        await game.user.unsetFlag("monks-tokenbar", "position");
        if (MonksTokenBar.tokenbar != undefined)
            MonksTokenBar.tokenbar.render(true);
        app.close({ force: true });
    }
}

Hooks.on("renderResetPosition", ResetPosition.resetPosition);