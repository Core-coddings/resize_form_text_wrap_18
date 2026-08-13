/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ListRenderer } from "@web/views/list/list_renderer";
import { onMounted, onPatched } from "@odoo/owl";

const STORAGE_KEY = "resizable_chatter_rows.row_padding";
const MIN_PADDING = 0; // fully compact
const MAX_EXTRA_ABOVE_DEFAULT = 200; // how much taller than stock it can get

patch(ListRenderer.prototype, {
    setup() {
        super.setup();
        onMounted(() => this._setupRowResizer());
        onPatched(() => this._setupRowResizer());
    },

    /**
     * Adds (once per table) a small drag grip in the corner of the last
     * header cell - NOT a direct child of <thead>/<tr>, which aren't
     * allowed to contain arbitrary elements and previously broke the
     * table's native layout/height. Dragging it changes
     * `--o-list-row-padding` on the table, which the accompanying SCSS
     * uses for every body row's vertical padding - a manual "row height"
     * control (both thinner and taller than Odoo's default), since Odoo
     * only ships this for column width.
     */
    _setupRowResizer() {
        const table = this.tableRef && this.tableRef.el;
        if (!table) {
            return;
        }
        const lastHeaderCell = table.querySelector("thead tr:last-child > th:last-child");
        const sampleBodyCell = table.querySelector(".o_data_row > td");
        if (!lastHeaderCell || !sampleBodyCell) {
            return; // view not fully rendered yet - retry on the next patch
        }
        // Guard on the handle itself rather than a dataset flag: if OWL
        // reuses the table node but rebuilds the header, a stale flag
        // would leave the grip missing with no way to re-add it.
        if (lastHeaderCell.querySelector(":scope > .o_list_row_resize_handle")) {
            return;
        }
        // Clear any grip left on a previous last-header-cell (e.g. after
        // optional columns were toggled and the last column changed).
        const orphan = table.querySelector("thead .o_list_row_resize_handle");
        if (orphan) {
            const oldAnchor = orphan.parentElement;
            orphan.remove();
            if (oldAnchor) {
                oldAnchor.classList.remove("o_list_row_resize_anchor");
            }
        }

        // Auto-detect Odoo's own stock padding instead of guessing a
        // number, so the table looks pixel-identical to standard Odoo
        // until the person actually drags the handle.
        const basePadding = parseFloat(getComputedStyle(sampleBodyCell).paddingTop) || 6;

        const saved = localStorage.getItem(STORAGE_KEY);
        const initialPadding = saved !== null ? parseFloat(saved) : basePadding;
        table.style.setProperty("--o-list-row-padding", `${initialPadding}px`);

        lastHeaderCell.classList.add("o_list_row_resize_anchor");
        const handle = document.createElement("div");
        handle.className = "o_list_row_resize_handle";
        handle.title = "Drag to resize row height";
        lastHeaderCell.appendChild(handle);

        handle.addEventListener("mousedown", (downEv) => {
            downEv.preventDefault();
            downEv.stopPropagation();
            const startY = downEv.clientY;
            const startPadding =
                parseFloat(table.style.getPropertyValue("--o-list-row-padding")) || basePadding;
            document.body.classList.add("o_list_row_resizing");

            const onMove = (moveEv) => {
                const delta = moveEv.clientY - startY;
                const maxPadding = basePadding + MAX_EXTRA_ABOVE_DEFAULT;
                const newPadding = Math.min(maxPadding, Math.max(MIN_PADDING, startPadding + delta));
                table.style.setProperty("--o-list-row-padding", `${newPadding}px`);
            };
            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.body.classList.remove("o_list_row_resizing");
                const finalPadding = parseFloat(table.style.getPropertyValue("--o-list-row-padding"));
                localStorage.setItem(STORAGE_KEY, String(finalPadding));
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });
    },
});
