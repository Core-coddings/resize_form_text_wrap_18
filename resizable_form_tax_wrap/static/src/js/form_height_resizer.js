/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { FormRenderer } from "@web/views/form/form_renderer";
import { onMounted, onPatched, onWillUnmount, useRef } from "@odoo/owl";

// Odoo's whole app shell (.o_web_client > .o_action_manager > .o_action)
// is deliberately locked to height:100% with overflow:hidden at every
// level - only .o_content scrolls internally (see
// web/static/src/webclient/webclient_layout.scss). That's why there's
// no "page" to grow: the browser tab itself can't get taller, and
// .o_content just clips/scrolls internally past the fold.
//
// Odoo already has a precedent for turning this off - on narrow
// (mobile-width) screens it deliberately makes .o_action scroll instead
// of .o_content (same file, @include media-breakpoint-down(md)). We
// reuse that exact technique, triggered by dragging instead of by screen
// width: swap .o_content to overflow:visible + let its content flow
// naturally, and let the surrounding .o_action scroll instead. That
// reveals however many rows exist directly, at the cost of the page
// needing a normal scrollbar once content is taller than the window -
// the same trade-off Odoo itself already makes on mobile.
//
// IMPORTANT: .o_content and .o_action are part of the app SHELL, not the
// form. They are reused across view switches. Anything written to them
// here must be undone when the form unmounts, or the next view (a list,
// a kanban) inherits overflow:visible and loses its own scrolling.
const STORAGE_KEY = "resizable_chatter_rows.form_extra_height";
const MIN_EXTRA = 0;
const MAX_EXTRA = 6000; // generous ceiling - most lists never need this much

patch(FormRenderer.prototype, {
    setup() {
        super.setup();
        // FormCompiler stamps `t-ref="compiled_view_root"` onto the first
        // child of the compiled arch (see
        // web/static/src/views/form/form_compiler.js) - grabbing the same
        // ref name here reliably scopes us to THIS form instance's own
        // root element, unlike guessing at classes that may not actually
        // exist in the rendered DOM.
        this.formRootRef = useRef("compiled_view_root");
        this._heightResizerContent = null;
        this._heightResizerAction = null;

        onMounted(() => this._setupFormHeightResizer());
        onPatched(() => this._setupFormHeightResizer());
        onWillUnmount(() => this._teardownFormHeightResizer());
    },

    _setupFormHeightResizer() {
        const root = this.formRootRef && this.formRootRef.el;
        if (!root) {
            return;
        }
        const content = root.closest(".o_content");
        if (!content) {
            return;
        }
        // Guard on the handle actually being present rather than on a
        // dataset flag alone: .o_content survives view switches, so a
        // stale flag would block re-attaching when coming back to a form.
        if (content.querySelector(":scope > .o_form_height_resize_handle")) {
            return;
        }

        const action = content.closest(".o_action");
        this._heightResizerContent = content;
        this._heightResizerAction = action;

        const handle = document.createElement("div");
        handle.className = "o_form_height_resize_handle";
        handle.title = "Drag down to expand the form, drag up to collapse it back";
        content.appendChild(handle);

        const applyExtra = (extra) => {
            const clamped = Math.min(MAX_EXTRA, Math.max(MIN_EXTRA, extra));
            content.style.setProperty("--o-form-extra-height", `${clamped}px`);
            const expanded = clamped > 0;
            content.classList.toggle("o_form_manually_expanded", expanded);
            if (action) {
                action.classList.toggle("o_form_manually_expanded", expanded);
            }
            return clamped;
        };

        const saved = parseFloat(localStorage.getItem(STORAGE_KEY) || "0");
        applyExtra(saved);

        handle.addEventListener("mousedown", (downEv) => {
            downEv.preventDefault();
            const startY = downEv.clientY;
            const startExtra =
                parseFloat(content.style.getPropertyValue("--o-form-extra-height")) || 0;
            document.body.classList.add("o_form_height_resizing");

            const onMove = (moveEv) => {
                const delta = moveEv.clientY - startY;
                applyExtra(startExtra + delta);
            };
            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.body.classList.remove("o_form_height_resizing");
                const finalExtra =
                    parseFloat(content.style.getPropertyValue("--o-form-extra-height")) || 0;
                localStorage.setItem(STORAGE_KEY, String(finalExtra));
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    },

    /**
     * Hands the shell back to Odoo exactly as we found it. Without this,
     * navigating from an expanded form to a list view leaves
     * overflow:visible on .o_content and the list can no longer scroll.
     */
    _teardownFormHeightResizer() {
        const content = this._heightResizerContent;
        const action = this._heightResizerAction;

        if (content) {
            const handle = content.querySelector(":scope > .o_form_height_resize_handle");
            if (handle) {
                handle.remove();
            }
            content.classList.remove("o_form_manually_expanded");
            content.style.removeProperty("--o-form-extra-height");
            delete content.dataset.heightResizerReady;
        }
        if (action) {
            action.classList.remove("o_form_manually_expanded");
        }

        this._heightResizerContent = null;
        this._heightResizerAction = null;
    },
});
