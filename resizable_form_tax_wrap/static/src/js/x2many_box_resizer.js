/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ListRenderer } from "@web/views/list/list_renderer";
import { onMounted, onPatched } from "@odoo/owl";

// Adds a drag strip along the entire bottom edge of an embedded
// one2many/many2many list (Order Lines, etc.) to resize its HEIGHT.
//
// Width is intentionally NOT manually resizable here. Width should just
// always match whatever the sheet's own current width is - if the sheet
// gets wider (e.g. because the chatter panel got resized elsewhere), the
// list should simply follow automatically, with nothing to drag and no
// separate state to keep in sync. That is exactly what leaving `width`
// alone already gives us for free (the list's wrapper is a block
// element, 100% of its container by default) - every earlier attempt to
// ALSO make width independently draggable ran into some new way of
// overflowing the page, so this version drops that idea rather than keep
// patching around it.
const STORAGE_PREFIX = "resizable_chatter_rows.x2many_height.";
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 3000;

patch(ListRenderer.prototype, {
    setup() {
        super.setup();
        onMounted(() => this._setupX2ManyBoxResizer());
        onPatched(() => this._setupX2ManyBoxResizer());
    },

    /**
     * Only applies to one2many/many2many lists embedded in a form
     * (identified by the nearest .o_field_x2many/.o_field_one2many/
     * .o_field_many2many ancestor) - the main list view of an app
     * (Sales > Orders, etc.) has no such ancestor and is left alone.
     */
    _setupX2ManyBoxResizer() {
        const table = this.tableRef && this.tableRef.el;
        if (!table) {
            return;
        }
        const container = table.closest(
            ".o_field_x2many, .o_field_one2many, .o_field_many2many"
        );
        if (!container) {
            return;
        }
        // Guard on the edge element rather than a dataset flag, so a
        // reused container node can never end up with two strips stacked
        // on top of each other (or with none at all after a re-render).
        if (container.querySelector(":scope > .o_x2many_resize_edge_bottom")) {
            return;
        }
        const scrollBox = table.closest(".o_list_renderer") || table.parentElement;
        if (!scrollBox) {
            return;
        }
        if (!container.style.position) {
            container.style.position = "relative";
        }
        scrollBox.classList.add("o_x2many_resizable_box");

        const resModel = (this.props.list && this.props.list.resModel) || "unknown_model";
        const fieldName = container.getAttribute("name") || "unknown_field";
        const storageKey = `${STORAGE_PREFIX}${resModel}.${fieldName}`;

        const applyHeight = (height) => {
            const h = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height));
            scrollBox.style.setProperty("height", `${h}px`, "important");
            scrollBox.style.setProperty("max-height", "none", "important");
        };

        const saved = parseFloat(localStorage.getItem(storageKey) || "0");
        if (saved) {
            applyHeight(saved);
        }

        const bottomEdge = document.createElement("div");
        bottomEdge.className = "o_x2many_resize_edge o_x2many_resize_edge_bottom";
        bottomEdge.title = "Drag to resize this list's height";

        bottomEdge.addEventListener("mousedown", (downEv) => {
            downEv.preventDefault();
            downEv.stopPropagation();
            const startY = downEv.clientY;
            const startHeight = scrollBox.getBoundingClientRect().height;
            document.body.classList.add("o_x2many_resizing");
            document.body.style.cursor = "ns-resize";

            const onMove = (moveEv) => {
                applyHeight(startHeight + (moveEv.clientY - startY));
            };
            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.body.classList.remove("o_x2many_resizing");
                document.body.style.cursor = "";
                const finalHeight = scrollBox.getBoundingClientRect().height;
                localStorage.setItem(storageKey, String(finalHeight));
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });

        container.append(bottomEdge);
    },
});
