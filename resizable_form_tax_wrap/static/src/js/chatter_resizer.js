/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { FormRenderer } from "@web/views/form/form_renderer";
import { onMounted, onPatched, onWillUnmount, useRef } from "@odoo/owl";

// Odoo decides on its own whether the chatter sits beside the form
// (aside mode) or below it, based on the available width. This module
// does NOT override that decision - it only adds a drag handle to
// widen/narrow the chatter WHEN Odoo has already chosen aside mode.
//
// The critical detail that this file exists to handle: OWL patches the
// existing chatter element in place when the layout flips from aside to
// bottom - it does not build a fresh node. Any inline styles written
// during aside mode therefore SURVIVE the flip, and pin the bottom
// chatter to a fixed pixel width with flex:0 0 auto, which is not what
// standard Odoo does. This cannot be fixed from SCSS either, because an
// inline `!important` beats a stylesheet `!important`.
//
// So: everything written to the element here must be explicitly
// reverted the moment aside mode ends.
const STORAGE_KEY = "resizable_chatter_rows.chatter_extra_width";
const MIN_CHATTER_WIDTH = 220; // real floor - see min-width override below
const MIN_LEFT_PANE = 120; // always leave at least this much room for the form

// Matches the chatter container in EITHER mode. Deliberately does not
// include `.o-aside` - we need to still find the element after Odoo has
// dropped that class, precisely so we can clean up after ourselves.
//
// Several class names are listed because the chatter markup has changed
// across versions and this file is shared between the 18.0 and 18.0
// branches of the module. Only one of these will match on any given
// version; the rest are harmless no-ops.
const CHATTER_SELECTOR = [
    ".o-mail-Form-chatter", // 17.0 / 18.0 / 18.0
    ".o-mail-ChatterContainer", // some 17.x/18.x builds
    ".o_FormRenderer_chatterContainer", // legacy
    ".o-mail-Chatter", // inner chatter, fallback
].join(", ");

patch(FormRenderer.prototype, {
    setup() {
        super.setup();

        // FormCompiler stamps t-ref="compiled_view_root" onto the first
        // child of the compiled arch, which gives a reliable handle on
        // THIS form instance's own root. Declared here rather than
        // relying on form_height_resizer.js having done it, so this file
        // stands on its own regardless of asset order.
        this.formRootRef = useRef("compiled_view_root");

        // A pure viewport resize (dragging the window edge, changing
        // browser zoom) does not always produce an OWL patch, so the
        // aside/bottom flip could otherwise go unnoticed until the next
        // unrelated re-render.
        this._onChatterViewportResize = () => this._syncChatterResizer();
        window.addEventListener("resize", this._onChatterViewportResize);

        onMounted(() => this._syncChatterResizer());
        onPatched(() => this._syncChatterResizer());
        onWillUnmount(() => {
            window.removeEventListener("resize", this._onChatterViewportResize);
            const chatter = this._findChatter();
            if (chatter) {
                this._detachChatterResizer(chatter);
            }
        });
    },

    /**
     * Scoped to THIS form's own DOM subtree where possible. A plain
     * document.querySelector would return the first chatter in the whole
     * document, which is the wrong one when a form dialog is open on top
     * of a form view - the dialog's renderer would end up styling the
     * background form's chatter.
     */
    _findChatter() {
        const root = this.formRootRef && this.formRootRef.el;
        const scope = (root && root.closest(".o_form_view")) || document;
        return scope.querySelector(CHATTER_SELECTOR);
    },

    /**
     * Single entry point. On every render, works out whether the chatter
     * is currently in aside mode and routes to setup or teardown.
     */
    _syncChatterResizer() {
        const chatter = this._findChatter();
        if (!chatter) {
            return;
        }
        if (chatter.classList.contains("o-aside")) {
            this._attachChatterResizer(chatter);
        } else {
            this._detachChatterResizer(chatter);
        }
    },

    /**
     * Removes every trace of this module from the chatter element, so it
     * renders exactly as standard Odoo does in bottom mode.
     *
     * Safe to call repeatedly - removeProperty() and remove() are both
     * no-ops when there is nothing to undo.
     */
    _detachChatterResizer(chatter) {
        chatter.style.removeProperty("width");
        chatter.style.removeProperty("min-width");
        chatter.style.removeProperty("flex");

        const handle = chatter.querySelector(":scope > .o_chatter_resize_handle");
        if (handle) {
            handle.remove();
        }

        // Drop the sheet-expansion class too. In bottom mode the sheet
        // already has the full width, so leaving the cap lifted there
        // would stretch content wider than standard Odoo.
        const renderer =
            chatter.closest(".o_form_renderer") ||
            chatter.closest(".o_form_view") ||
            chatter.parentElement;
        if (renderer) {
            renderer.classList.remove("o_chatter_manual_width");
        }

        // Clear the cached natural width so that a later flip back to
        // aside re-measures it rather than reusing a stale value taken
        // at a different window size.
        delete chatter.dataset.chatterResizerNatural;
    },

    /**
     * Adds the drag handle and restores the saved width. No-ops when the
     * handle is already present, so repeated patches don't stack up
     * duplicate handles or listeners.
     */
    _attachChatterResizer(chatter) {
        if (chatter.querySelector(":scope > .o_chatter_resize_handle")) {
            return;
        }

        // Beat mail's own baked-in $o-chatter-min-width, which otherwise
        // silently wins and stops the chatter shrinking - the drag just
        // appears to stop working, with no error.
        chatter.style.setProperty("min-width", "0", "important");
        chatter.style.setProperty("flex", "0 0 auto", "important");

        // Measure the untouched default width BEFORE applying anything,
        // so "natural" reflects Odoo's real default rather than a
        // leftover explicit width from an earlier render.
        const naturalWidth = (() => {
            const hadExplicit = chatter.style.width;
            chatter.style.removeProperty("width");
            const w = chatter.getBoundingClientRect().width;
            if (hadExplicit) {
                chatter.style.width = hadExplicit;
            }
            return w;
        })();
        chatter.dataset.chatterResizerNatural = String(naturalWidth);

        // The form sheet is capped by Odoo's own $o-sheet-max-width. That
        // cap is what leaves a blank gap between the sheet and the
        // chatter after the chatter is narrowed: the CONTAINER gets
        // wider, but the white sheet inside refuses to grow past the cap.
        // Lifting the cap is only correct once the person has actually
        // moved the handle, so it's gated behind a class that is toggled
        // off again whenever the width is back at Odoo's default.
        const renderer =
            chatter.closest(".o_form_renderer") ||
            chatter.closest(".o_form_view") ||
            chatter.parentElement;

        const applyWidth = (width) => {
            const dynamicMax = window.innerWidth - MIN_LEFT_PANE;
            const clamped = Math.min(dynamicMax, Math.max(MIN_CHATTER_WIDTH, width));
            chatter.style.setProperty("width", `${clamped}px`, "important");
            if (renderer) {
                // 1px of slack so floating-point rounding on the measured
                // natural width doesn't leave the class stuck on.
                const isManual = Math.abs(clamped - naturalWidth) > 1;
                renderer.classList.toggle("o_chatter_manual_width", isManual);
            }
            return clamped;
        };

        const saved = parseFloat(localStorage.getItem(STORAGE_KEY) || "0");
        applyWidth(saved ? naturalWidth + saved : naturalWidth);

        const handle = document.createElement("div");
        handle.className = "o_chatter_resize_handle";
        handle.title = "Drag to resize the chatter panel";
        chatter.prepend(handle);

        handle.addEventListener("mousedown", (downEv) => {
            downEv.preventDefault();
            const startX = downEv.clientX;
            const startWidth = chatter.getBoundingClientRect().width;
            document.body.classList.add("o_chatter_resizing");

            const onMove = (moveEv) => {
                // Dragging left (toward the rest of the form) widens the
                // chatter; dragging right narrows it back down, all the
                // way to MIN_CHATTER_WIDTH now the built-in floor is
                // neutralized above.
                const delta = startX - moveEv.clientX;
                applyWidth(startWidth + delta);
            };
            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.body.classList.remove("o_chatter_resizing");
                const finalWidth = chatter.getBoundingClientRect().width;
                localStorage.setItem(STORAGE_KEY, String(finalWidth - naturalWidth));
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    },
});
