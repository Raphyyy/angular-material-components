import * as i7 from '@angular/cdk/portal';
import { ComponentPortal, TemplatePortal, PortalModule } from '@angular/cdk/portal';
import * as i0 from '@angular/core';
import { InjectionToken, EventEmitter, Component, ViewEncapsulation, ChangeDetectionStrategy, Input, Output, Injectable, Optional, Inject, ViewChild, forwardRef, TemplateRef, ContentChild, Directive, NgModule } from '@angular/core';
import { Subscription, Subject, merge } from 'rxjs';
import { ESCAPE, SPACE, ENTER, PAGE_DOWN, PAGE_UP, END, HOME, DOWN_ARROW, UP_ARROW, RIGHT_ARROW, LEFT_ARROW } from '@angular/cdk/keycodes';
import { take, startWith, takeUntil, debounceTime, filter } from 'rxjs/operators';
import * as i1$1 from '@angular/material/datepicker';
import { DateRange, matDatepickerAnimations, MAT_DATEPICKER_SCROLL_STRATEGY, MatDatepickerModule, MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER } from '@angular/material/datepicker';
import * as i1 from '@angular/common';
import { DOCUMENT, CommonModule } from '@angular/common';
import { DateAdapter, mixinColor, MAT_DATE_LOCALE } from '@angular/material/core';
import * as i2 from '@angular/cdk/bidi';
import * as i3 from '@angular/material/button';
import { MatButtonModule } from '@angular/material/button';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import * as i9 from '@angular/cdk/overlay';
import { OverlayConfig } from '@angular/cdk/overlay';
import * as i2$1 from '@angular/forms';
import { Validators, NG_VALUE_ACCESSOR, NG_VALIDATORS, ReactiveFormsModule, FormsModule } from '@angular/forms';
import * as i4 from '@angular/material/icon';
import { MatIconModule } from '@angular/material/icon';
import * as i2$2 from '@angular/material/form-field';
import * as i7$1 from '@angular/material/input';
import { MAT_INPUT_VALUE_ACCESSOR, MatInputModule } from '@angular/material/input';
import * as i8 from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import * as i1$2 from '@angular/cdk/platform';
import { PlatformModule } from '@angular/cdk/platform';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const NGX_MAT_DATE_FORMATS = new InjectionToken('ngx-mat-date-formats');

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * An internal class that represents the data corresponding to a single calendar cell.
 * @docs-private
 */
class NgxMatCalendarCell {
    constructor(value, displayValue, ariaLabel, enabled, cssClasses = {}, compareValue = value, rawValue) {
        this.value = value;
        this.displayValue = displayValue;
        this.ariaLabel = ariaLabel;
        this.enabled = enabled;
        this.cssClasses = cssClasses;
        this.compareValue = compareValue;
        this.rawValue = rawValue;
    }
}
/**
 * An internal component used to display calendar data in a table.
 * @docs-private
 */
class NgxMatCalendarBody {
    constructor(_elementRef, _ngZone) {
        this._elementRef = _elementRef;
        this._ngZone = _ngZone;
        /** The number of columns in the table. */
        this.numCols = 7;
        /** The cell number of the active cell in the table. */
        this.activeCell = 0;
        /** Whether a range is being selected. */
        this.isRange = false;
        /**
         * The aspect ratio (width / height) to use for the cells in the table. This aspect ratio will be
         * maintained even as the table resizes.
         */
        this.cellAspectRatio = 1;
        /** Start of the preview range. */
        this.previewStart = null;
        /** End of the preview range. */
        this.previewEnd = null;
        /** Emits when a new value is selected. */
        this.selectedValueChange = new EventEmitter();
        /** Emits when the preview has changed as a result of a user action. */
        this.previewChange = new EventEmitter();
        /**
         * Event handler for when the user enters an element
         * inside the calendar body (e.g. by hovering in or focus).
         */
        this._enterHandler = (event) => {
            if (this._skipNextFocus && event.type === 'focus') {
                this._skipNextFocus = false;
                return;
            }
            // We only need to hit the zone when we're selecting a range.
            if (event.target && this.isRange) {
                const cell = this._getCellFromElement(event.target);
                if (cell) {
                    this._ngZone.run(() => this.previewChange.emit({ value: cell.enabled ? cell : null, event }));
                }
            }
        };
        /**
         * Event handler for when the user's pointer leaves an element
         * inside the calendar body (e.g. by hovering out or blurring).
         */
        this._leaveHandler = (event) => {
            // We only need to hit the zone when we're selecting a range.
            if (this.previewEnd !== null && this.isRange) {
                // Only reset the preview end value when leaving cells. This looks better, because
                // we have a gap between the cells and the rows and we don't want to remove the
                // range just for it to show up again when the user moves a few pixels to the side.
                if (event.target && isTableCell(event.target)) {
                    this._ngZone.run(() => this.previewChange.emit({ value: null, event }));
                }
            }
        };
        _ngZone.runOutsideAngular(() => {
            const element = _elementRef.nativeElement;
            element.addEventListener('mouseenter', this._enterHandler, true);
            element.addEventListener('focus', this._enterHandler, true);
            element.addEventListener('mouseleave', this._leaveHandler, true);
            element.addEventListener('blur', this._leaveHandler, true);
        });
    }
    /** Called when a cell is clicked. */
    _cellClicked(cell, event) {
        if (cell.enabled) {
            this.selectedValueChange.emit({ value: cell.value, event });
        }
    }
    /** Returns whether a cell should be marked as selected. */
    _isSelected(cell) {
        return this.startValue === cell.compareValue || this.endValue === cell.compareValue;
    }
    ngOnChanges(changes) {
        const columnChanges = changes['numCols'];
        const { rows, numCols } = this;
        if (changes['rows'] || columnChanges) {
            this._firstRowOffset = rows && rows.length && rows[0].length ? numCols - rows[0].length : 0;
            this._showPaddedRow =
                (rows.length === 5 && this._firstRowOffset >= this.labelMinRequiredCells) ||
                    (rows.length === 4 && this._firstRowOffset === 0);
        }
        if (changes['cellAspectRatio'] || columnChanges || !this._cellPadding) {
            this._cellPadding = `${50 * this.cellAspectRatio / numCols}%`;
        }
        if (columnChanges || !this._cellWidth) {
            this._cellWidth = `${100 / numCols}%`;
        }
    }
    ngOnDestroy() {
        const element = this._elementRef.nativeElement;
        element.removeEventListener('mouseenter', this._enterHandler, true);
        element.removeEventListener('focus', this._enterHandler, true);
        element.removeEventListener('mouseleave', this._leaveHandler, true);
        element.removeEventListener('blur', this._leaveHandler, true);
    }
    /** Returns whether a cell is active. */
    _isActiveCell(rowIndex, colIndex) {
        let cellNumber = rowIndex * this.numCols + colIndex;
        // Account for the fact that the first row may not have as many cells.
        if (rowIndex) {
            cellNumber -= this._firstRowOffset;
        }
        return cellNumber == this.activeCell;
    }
    /** Focuses the active cell after the microtask queue is empty. */
    _focusActiveCell(movePreview = true) {
        this._ngZone.runOutsideAngular(() => {
            this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
                const activeCell = this._elementRef.nativeElement.querySelector('.ngx-mat-calendar-body-active');
                if (activeCell) {
                    if (!movePreview) {
                        this._skipNextFocus = true;
                    }
                    activeCell.focus();
                }
            });
        });
    }
    /** Gets whether a value is the start of the main range. */
    _isRangeStart(value) {
        return isStart(value, this.startValue, this.endValue);
    }
    /** Gets whether a value is the end of the main range. */
    _isRangeEnd(value) {
        return isEnd(value, this.startValue, this.endValue);
    }
    /** Gets whether a value is within the currently-selected range. */
    _isInRange(value) {
        return isInRange(value, this.startValue, this.endValue, this.isRange);
    }
    /** Gets whether a value is the start of the comparison range. */
    _isComparisonStart(value) {
        return isStart(value, this.comparisonStart, this.comparisonEnd);
    }
    /** Whether the cell is a start bridge cell between the main and comparison ranges. */
    _isComparisonBridgeStart(value, rowIndex, colIndex) {
        if (!this._isComparisonStart(value) || this._isRangeStart(value) || !this._isInRange(value)) {
            return false;
        }
        let previousCell = this.rows[rowIndex][colIndex - 1];
        if (!previousCell) {
            const previousRow = this.rows[rowIndex - 1];
            previousCell = previousRow && previousRow[previousRow.length - 1];
        }
        return previousCell && !this._isRangeEnd(previousCell.compareValue);
    }
    /** Whether the cell is an end bridge cell between the main and comparison ranges. */
    _isComparisonBridgeEnd(value, rowIndex, colIndex) {
        if (!this._isComparisonEnd(value) || this._isRangeEnd(value) || !this._isInRange(value)) {
            return false;
        }
        let nextCell = this.rows[rowIndex][colIndex + 1];
        if (!nextCell) {
            const nextRow = this.rows[rowIndex + 1];
            nextCell = nextRow && nextRow[0];
        }
        return nextCell && !this._isRangeStart(nextCell.compareValue);
    }
    /** Gets whether a value is the end of the comparison range. */
    _isComparisonEnd(value) {
        return isEnd(value, this.comparisonStart, this.comparisonEnd);
    }
    /** Gets whether a value is within the current comparison range. */
    _isInComparisonRange(value) {
        return isInRange(value, this.comparisonStart, this.comparisonEnd, this.isRange);
    }
    /** Gets whether a value is the start of the preview range. */
    _isPreviewStart(value) {
        return isStart(value, this.previewStart, this.previewEnd);
    }
    /** Gets whether a value is the end of the preview range. */
    _isPreviewEnd(value) {
        return isEnd(value, this.previewStart, this.previewEnd);
    }
    /** Gets whether a value is inside the preview range. */
    _isInPreview(value) {
        return isInRange(value, this.previewStart, this.previewEnd, this.isRange);
    }
    /** Finds the NgxMatCalendarCell that corresponds to a DOM node. */
    _getCellFromElement(element) {
        let cell;
        if (isTableCell(element)) {
            cell = element;
        }
        else if (isTableCell(element.parentNode)) {
            cell = element.parentNode;
        }
        if (cell) {
            const row = cell.getAttribute('data-ngx-mat-row');
            const col = cell.getAttribute('data-ngx-mat-col');
            if (row && col) {
                return this.rows[parseInt(row)][parseInt(col)];
            }
        }
        return null;
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatCalendarBody.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatCalendarBody, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatCalendarBody.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: { label: "label", rows: "rows", todayValue: "todayValue", startValue: "startValue", endValue: "endValue", labelMinRequiredCells: "labelMinRequiredCells", numCols: "numCols", activeCell: "activeCell", isRange: "isRange", cellAspectRatio: "cellAspectRatio", comparisonStart: "comparisonStart", comparisonEnd: "comparisonEnd", previewStart: "previewStart", previewEnd: "previewEnd" }, outputs: { selectedValueChange: "selectedValueChange", previewChange: "previewChange" }, host: { attributes: { "role": "grid", "aria-readonly": "true" }, classAttribute: "ngx-mat-calendar-body" }, exportAs: ["NgxMatCalendarBody"], usesOnChanges: true, ngImport: i0, template: "<!--\r\n  If there's not enough space in the first row, create a separate label row. We mark this row as\r\n  aria-hidden because we don't want it to be read out as one of the weeks in the month.\r\n-->\r\n<tr *ngIf=\"_firstRowOffset < labelMinRequiredCells\" aria-hidden=\"true\">\r\n  <td class=\"mat-calendar-body-label\"\r\n      [attr.colspan]=\"numCols\"\r\n      [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n    {{label}}\r\n  </td>\r\n</tr>\r\n\r\n<!-- Create the first row separately so we can include a special spacer cell. -->\r\n<tr *ngFor=\"let row of rows; let rowIndex = index\" role=\"row\">\r\n  <!--\r\n    We mark this cell as aria-hidden so it doesn't get read out as one of the days in the week.\r\n    The aspect ratio of the table cells is maintained by setting the top and bottom padding as a\r\n    percentage of the width (a variant of the trick described here:\r\n    https://www.w3schools.com/howto/howto_css_aspect_ratio.asp).\r\n  -->\r\n  <td *ngIf=\"rowIndex === 0 && _firstRowOffset\"\r\n      aria-hidden=\"true\"\r\n      class=\"mat-calendar-body-label\"\r\n      [attr.colspan]=\"_firstRowOffset\"\r\n      [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n    {{_firstRowOffset >= labelMinRequiredCells ? label : ''}}\r\n  </td>\r\n  <td *ngFor=\"let item of row; let colIndex = index\"\r\n      role=\"gridcell\"\r\n      class=\"mat-calendar-body-cell\"\r\n      [ngClass]=\"item.cssClasses\"\r\n      [tabindex]=\"_isActiveCell(rowIndex, colIndex) ? 0 : -1\"\r\n      [attr.data-mat-row]=\"rowIndex\"\r\n      [attr.data-mat-col]=\"colIndex\"\r\n      [class.mat-calendar-body-disabled]=\"!item.enabled\"\r\n      [class.mat-calendar-body-active]=\"_isActiveCell(rowIndex, colIndex)\"\r\n      [class.mat-calendar-body-range-start]=\"_isRangeStart(item.compareValue)\"\r\n      [class.mat-calendar-body-range-end]=\"_isRangeEnd(item.compareValue)\"\r\n      [class.mat-calendar-body-in-range]=\"_isInRange(item.compareValue)\"\r\n      [class.mat-calendar-body-comparison-bridge-start]=\"_isComparisonBridgeStart(item.compareValue, rowIndex, colIndex)\"\r\n      [class.mat-calendar-body-comparison-bridge-end]=\"_isComparisonBridgeEnd(item.compareValue, rowIndex, colIndex)\"\r\n      [class.mat-calendar-body-comparison-start]=\"_isComparisonStart(item.compareValue)\"\r\n      [class.mat-calendar-body-comparison-end]=\"_isComparisonEnd(item.compareValue)\"\r\n      [class.mat-calendar-body-in-comparison-range]=\"_isInComparisonRange(item.compareValue)\"\r\n      [class.mat-calendar-body-preview-start]=\"_isPreviewStart(item.compareValue)\"\r\n      [class.mat-calendar-body-preview-end]=\"_isPreviewEnd(item.compareValue)\"\r\n      [class.mat-calendar-body-in-preview]=\"_isInPreview(item.compareValue)\"\r\n      [attr.aria-label]=\"item.ariaLabel\"\r\n      [attr.aria-disabled]=\"!item.enabled || null\"\r\n      [attr.aria-selected]=\"_isSelected(item)\"\r\n      (click)=\"_cellClicked(item, $event)\"\r\n      [style.width]=\"_cellWidth\"\r\n      [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n      <div class=\"mat-calendar-body-cell-content mat-focus-indicator\"\r\n        [class.mat-calendar-body-selected]=\"_isSelected(item)\"\r\n        [class.mat-calendar-body-today]=\"todayValue === item.compareValue\">\r\n        {{item.displayValue}}\r\n      </div>\r\n      <div class=\"mat-calendar-body-cell-preview\"></div>\r\n  </td>\r\n</tr>\r\n<tr *ngIf=\"_showPaddedRow\" aria-hidden=\"true\">\r\n  <td [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n  </td>\r\n</tr>", styles: [".mat-calendar-body{min-width:224px}.mat-calendar-body-label{height:0;line-height:0;text-align:left;padding-left:4.7142857143%;padding-right:4.7142857143%}.mat-calendar-body-cell{position:relative;height:0;line-height:0;text-align:center;outline:none;cursor:pointer}.mat-calendar-body-cell:before,.mat-calendar-body-cell:after,.mat-calendar-body-cell-preview{content:\"\";position:absolute;top:5%;left:0;z-index:0;box-sizing:border-box;height:90%;width:100%}.mat-calendar-body-range-start:not(.mat-calendar-body-in-comparison-range):before,.mat-calendar-body-range-start:after,.mat-calendar-body-comparison-start:not(.mat-calendar-body-comparison-bridge-start):before,.mat-calendar-body-comparison-start:after,.mat-calendar-body-preview-start .mat-calendar-body-cell-preview{left:5%;width:95%;border-top-left-radius:999px;border-bottom-left-radius:999px}[dir=rtl] .mat-calendar-body-range-start:not(.mat-calendar-body-in-comparison-range):before,[dir=rtl] .mat-calendar-body-range-start:after,[dir=rtl] .mat-calendar-body-comparison-start:not(.mat-calendar-body-comparison-bridge-start):before,[dir=rtl] .mat-calendar-body-comparison-start:after,[dir=rtl] .mat-calendar-body-preview-start .mat-calendar-body-cell-preview{left:0;border-radius:0 999px 999px 0}.mat-calendar-body-range-end:not(.mat-calendar-body-in-comparison-range):before,.mat-calendar-body-range-end:after,.mat-calendar-body-comparison-end:not(.mat-calendar-body-comparison-bridge-end):before,.mat-calendar-body-comparison-end:after,.mat-calendar-body-preview-end .mat-calendar-body-cell-preview{width:95%;border-top-right-radius:999px;border-bottom-right-radius:999px}[dir=rtl] .mat-calendar-body-range-end:not(.mat-calendar-body-in-comparison-range):before,[dir=rtl] .mat-calendar-body-range-end:after,[dir=rtl] .mat-calendar-body-comparison-end:not(.mat-calendar-body-comparison-bridge-end):before,[dir=rtl] .mat-calendar-body-comparison-end:after,[dir=rtl] .mat-calendar-body-preview-end .mat-calendar-body-cell-preview{left:5%;border-radius:999px 0 0 999px}[dir=rtl] .mat-calendar-body-comparison-bridge-start.mat-calendar-body-range-end:after,[dir=rtl] .mat-calendar-body-comparison-bridge-end.mat-calendar-body-range-start:after{width:95%;border-top-right-radius:999px;border-bottom-right-radius:999px}.mat-calendar-body-comparison-start.mat-calendar-body-range-end:after,[dir=rtl] .mat-calendar-body-comparison-start.mat-calendar-body-range-end:after,.mat-calendar-body-comparison-end.mat-calendar-body-range-start:after,[dir=rtl] .mat-calendar-body-comparison-end.mat-calendar-body-range-start:after{width:90%}.mat-calendar-body-in-preview .mat-calendar-body-cell-preview{border-top:dashed 1px;border-bottom:dashed 1px}.mat-calendar-body-preview-start .mat-calendar-body-cell-preview{border-left:dashed 1px}[dir=rtl] .mat-calendar-body-preview-start .mat-calendar-body-cell-preview{border-left:0;border-right:dashed 1px}.mat-calendar-body-preview-end .mat-calendar-body-cell-preview{border-right:dashed 1px}[dir=rtl] .mat-calendar-body-preview-end .mat-calendar-body-cell-preview{border-right:0;border-left:dashed 1px}.mat-calendar-body-disabled{cursor:default}.mat-calendar-body-cell-content{top:5%;left:5%;z-index:1;display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:90%;height:90%;line-height:1;border-width:1px;border-style:solid;border-radius:999px}.mat-calendar-body-cell-content.mat-focus-indicator{position:absolute}.cdk-high-contrast-active .mat-calendar-body-cell-content{border:none}.cdk-high-contrast-active .mat-datepicker-popup:not(:empty),.cdk-high-contrast-active .mat-calendar-body-selected{outline:solid 1px}.cdk-high-contrast-active .mat-calendar-body-today{outline:dotted 1px}.cdk-high-contrast-active .cdk-keyboard-focused .mat-calendar-body-active>.mat-calendar-body-cell-content:not(.mat-calendar-body-selected),.cdk-high-contrast-active .cdk-program-focused .mat-calendar-body-active>.mat-calendar-body-cell-content:not(.mat-calendar-body-selected){outline:dotted 2px}[dir=rtl] .mat-calendar-body-label{text-align:right}@media (hover: none){.mat-calendar-body-cell:not(.mat-calendar-body-disabled):hover>.mat-calendar-body-cell-content:not(.mat-calendar-body-selected){background-color:transparent}}\n"], directives: [{ type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { type: i1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatCalendarBody, decorators: [{
            type: Component,
            args: [{ selector: '[ngx-mat-calendar-body]', host: {
                        'class': 'ngx-mat-calendar-body',
                        'role': 'grid',
                        'aria-readonly': 'true'
                    }, exportAs: 'NgxMatCalendarBody', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<!--\r\n  If there's not enough space in the first row, create a separate label row. We mark this row as\r\n  aria-hidden because we don't want it to be read out as one of the weeks in the month.\r\n-->\r\n<tr *ngIf=\"_firstRowOffset < labelMinRequiredCells\" aria-hidden=\"true\">\r\n  <td class=\"mat-calendar-body-label\"\r\n      [attr.colspan]=\"numCols\"\r\n      [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n    {{label}}\r\n  </td>\r\n</tr>\r\n\r\n<!-- Create the first row separately so we can include a special spacer cell. -->\r\n<tr *ngFor=\"let row of rows; let rowIndex = index\" role=\"row\">\r\n  <!--\r\n    We mark this cell as aria-hidden so it doesn't get read out as one of the days in the week.\r\n    The aspect ratio of the table cells is maintained by setting the top and bottom padding as a\r\n    percentage of the width (a variant of the trick described here:\r\n    https://www.w3schools.com/howto/howto_css_aspect_ratio.asp).\r\n  -->\r\n  <td *ngIf=\"rowIndex === 0 && _firstRowOffset\"\r\n      aria-hidden=\"true\"\r\n      class=\"mat-calendar-body-label\"\r\n      [attr.colspan]=\"_firstRowOffset\"\r\n      [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n    {{_firstRowOffset >= labelMinRequiredCells ? label : ''}}\r\n  </td>\r\n  <td *ngFor=\"let item of row; let colIndex = index\"\r\n      role=\"gridcell\"\r\n      class=\"mat-calendar-body-cell\"\r\n      [ngClass]=\"item.cssClasses\"\r\n      [tabindex]=\"_isActiveCell(rowIndex, colIndex) ? 0 : -1\"\r\n      [attr.data-mat-row]=\"rowIndex\"\r\n      [attr.data-mat-col]=\"colIndex\"\r\n      [class.mat-calendar-body-disabled]=\"!item.enabled\"\r\n      [class.mat-calendar-body-active]=\"_isActiveCell(rowIndex, colIndex)\"\r\n      [class.mat-calendar-body-range-start]=\"_isRangeStart(item.compareValue)\"\r\n      [class.mat-calendar-body-range-end]=\"_isRangeEnd(item.compareValue)\"\r\n      [class.mat-calendar-body-in-range]=\"_isInRange(item.compareValue)\"\r\n      [class.mat-calendar-body-comparison-bridge-start]=\"_isComparisonBridgeStart(item.compareValue, rowIndex, colIndex)\"\r\n      [class.mat-calendar-body-comparison-bridge-end]=\"_isComparisonBridgeEnd(item.compareValue, rowIndex, colIndex)\"\r\n      [class.mat-calendar-body-comparison-start]=\"_isComparisonStart(item.compareValue)\"\r\n      [class.mat-calendar-body-comparison-end]=\"_isComparisonEnd(item.compareValue)\"\r\n      [class.mat-calendar-body-in-comparison-range]=\"_isInComparisonRange(item.compareValue)\"\r\n      [class.mat-calendar-body-preview-start]=\"_isPreviewStart(item.compareValue)\"\r\n      [class.mat-calendar-body-preview-end]=\"_isPreviewEnd(item.compareValue)\"\r\n      [class.mat-calendar-body-in-preview]=\"_isInPreview(item.compareValue)\"\r\n      [attr.aria-label]=\"item.ariaLabel\"\r\n      [attr.aria-disabled]=\"!item.enabled || null\"\r\n      [attr.aria-selected]=\"_isSelected(item)\"\r\n      (click)=\"_cellClicked(item, $event)\"\r\n      [style.width]=\"_cellWidth\"\r\n      [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n      <div class=\"mat-calendar-body-cell-content mat-focus-indicator\"\r\n        [class.mat-calendar-body-selected]=\"_isSelected(item)\"\r\n        [class.mat-calendar-body-today]=\"todayValue === item.compareValue\">\r\n        {{item.displayValue}}\r\n      </div>\r\n      <div class=\"mat-calendar-body-cell-preview\"></div>\r\n  </td>\r\n</tr>\r\n<tr *ngIf=\"_showPaddedRow\" aria-hidden=\"true\">\r\n  <td [style.paddingTop]=\"_cellPadding\"\r\n      [style.paddingBottom]=\"_cellPadding\">\r\n  </td>\r\n</tr>", styles: [".mat-calendar-body{min-width:224px}.mat-calendar-body-label{height:0;line-height:0;text-align:left;padding-left:4.7142857143%;padding-right:4.7142857143%}.mat-calendar-body-cell{position:relative;height:0;line-height:0;text-align:center;outline:none;cursor:pointer}.mat-calendar-body-cell:before,.mat-calendar-body-cell:after,.mat-calendar-body-cell-preview{content:\"\";position:absolute;top:5%;left:0;z-index:0;box-sizing:border-box;height:90%;width:100%}.mat-calendar-body-range-start:not(.mat-calendar-body-in-comparison-range):before,.mat-calendar-body-range-start:after,.mat-calendar-body-comparison-start:not(.mat-calendar-body-comparison-bridge-start):before,.mat-calendar-body-comparison-start:after,.mat-calendar-body-preview-start .mat-calendar-body-cell-preview{left:5%;width:95%;border-top-left-radius:999px;border-bottom-left-radius:999px}[dir=rtl] .mat-calendar-body-range-start:not(.mat-calendar-body-in-comparison-range):before,[dir=rtl] .mat-calendar-body-range-start:after,[dir=rtl] .mat-calendar-body-comparison-start:not(.mat-calendar-body-comparison-bridge-start):before,[dir=rtl] .mat-calendar-body-comparison-start:after,[dir=rtl] .mat-calendar-body-preview-start .mat-calendar-body-cell-preview{left:0;border-radius:0 999px 999px 0}.mat-calendar-body-range-end:not(.mat-calendar-body-in-comparison-range):before,.mat-calendar-body-range-end:after,.mat-calendar-body-comparison-end:not(.mat-calendar-body-comparison-bridge-end):before,.mat-calendar-body-comparison-end:after,.mat-calendar-body-preview-end .mat-calendar-body-cell-preview{width:95%;border-top-right-radius:999px;border-bottom-right-radius:999px}[dir=rtl] .mat-calendar-body-range-end:not(.mat-calendar-body-in-comparison-range):before,[dir=rtl] .mat-calendar-body-range-end:after,[dir=rtl] .mat-calendar-body-comparison-end:not(.mat-calendar-body-comparison-bridge-end):before,[dir=rtl] .mat-calendar-body-comparison-end:after,[dir=rtl] .mat-calendar-body-preview-end .mat-calendar-body-cell-preview{left:5%;border-radius:999px 0 0 999px}[dir=rtl] .mat-calendar-body-comparison-bridge-start.mat-calendar-body-range-end:after,[dir=rtl] .mat-calendar-body-comparison-bridge-end.mat-calendar-body-range-start:after{width:95%;border-top-right-radius:999px;border-bottom-right-radius:999px}.mat-calendar-body-comparison-start.mat-calendar-body-range-end:after,[dir=rtl] .mat-calendar-body-comparison-start.mat-calendar-body-range-end:after,.mat-calendar-body-comparison-end.mat-calendar-body-range-start:after,[dir=rtl] .mat-calendar-body-comparison-end.mat-calendar-body-range-start:after{width:90%}.mat-calendar-body-in-preview .mat-calendar-body-cell-preview{border-top:dashed 1px;border-bottom:dashed 1px}.mat-calendar-body-preview-start .mat-calendar-body-cell-preview{border-left:dashed 1px}[dir=rtl] .mat-calendar-body-preview-start .mat-calendar-body-cell-preview{border-left:0;border-right:dashed 1px}.mat-calendar-body-preview-end .mat-calendar-body-cell-preview{border-right:dashed 1px}[dir=rtl] .mat-calendar-body-preview-end .mat-calendar-body-cell-preview{border-right:0;border-left:dashed 1px}.mat-calendar-body-disabled{cursor:default}.mat-calendar-body-cell-content{top:5%;left:5%;z-index:1;display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:90%;height:90%;line-height:1;border-width:1px;border-style:solid;border-radius:999px}.mat-calendar-body-cell-content.mat-focus-indicator{position:absolute}.cdk-high-contrast-active .mat-calendar-body-cell-content{border:none}.cdk-high-contrast-active .mat-datepicker-popup:not(:empty),.cdk-high-contrast-active .mat-calendar-body-selected{outline:solid 1px}.cdk-high-contrast-active .mat-calendar-body-today{outline:dotted 1px}.cdk-high-contrast-active .cdk-keyboard-focused .mat-calendar-body-active>.mat-calendar-body-cell-content:not(.mat-calendar-body-selected),.cdk-high-contrast-active .cdk-program-focused .mat-calendar-body-active>.mat-calendar-body-cell-content:not(.mat-calendar-body-selected){outline:dotted 2px}[dir=rtl] .mat-calendar-body-label{text-align:right}@media (hover: none){.mat-calendar-body-cell:not(.mat-calendar-body-disabled):hover>.mat-calendar-body-cell-content:not(.mat-calendar-body-selected){background-color:transparent}}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { label: [{
                type: Input
            }], rows: [{
                type: Input
            }], todayValue: [{
                type: Input
            }], startValue: [{
                type: Input
            }], endValue: [{
                type: Input
            }], labelMinRequiredCells: [{
                type: Input
            }], numCols: [{
                type: Input
            }], activeCell: [{
                type: Input
            }], isRange: [{
                type: Input
            }], cellAspectRatio: [{
                type: Input
            }], comparisonStart: [{
                type: Input
            }], comparisonEnd: [{
                type: Input
            }], previewStart: [{
                type: Input
            }], previewEnd: [{
                type: Input
            }], selectedValueChange: [{
                type: Output
            }], previewChange: [{
                type: Output
            }] } });
/** Checks whether a node is a table cell element. */
function isTableCell(node) {
    return node.nodeName === 'TD';
}
/** Checks whether a value is the start of a range. */
function isStart(value, start, end) {
    return end !== null && start !== end && value < end && value === start;
}
/** Checks whether a value is the end of a range. */
function isEnd(value, start, end) {
    return start !== null && start !== end && value >= start && value === end;
}
/** Checks whether a value is inside of a range. */
function isInRange(value, start, end, rangeEnabled) {
    return rangeEnabled && start !== null && end !== null && start !== end &&
        value >= start && value <= end;
}

class NgxMatDateAdapter extends DateAdapter {
    /**
     * Check if two date have same time
     * @param a Date 1
     * @param b Date 2
     */
    isSameTime(a, b) {
        if (a == null || b == null)
            return true;
        return this.getHour(a) === this.getHour(b)
            && this.getMinute(a) === this.getMinute(b)
            && this.getSecond(a) === this.getSecond(b);
    }
    /**
     * Copy time from a date to a another date
     * @param toDate
     * @param fromDate
     */
    copyTime(toDate, fromDate) {
        this.setHour(toDate, this.getHour(fromDate));
        this.setMinute(toDate, this.getMinute(fromDate));
        this.setSecond(toDate, this.getSecond(fromDate));
    }
    /**
   * Compares two dates.
   * @param first The first date to compare.
   * @param second The second date to compare.
   * @returns 0 if the dates are equal, a number less than 0 if the first date is earlier,
   *     a number greater than 0 if the first date is later.
   */
    compareDateWithTime(first, second, showSeconds) {
        let res = super.compareDate(first, second) ||
            this.getHour(first) - this.getHour(second) ||
            this.getMinute(first) - this.getMinute(second);
        if (showSeconds) {
            res = res || this.getSecond(first) - this.getSecond(second);
        }
        return res;
    }
    /**
     * Set time by using default values
     * @param defaultTime List default values [hour, minute, second]
     */
    setTimeByDefaultValues(date, defaultTime) {
        if (!Array.isArray(defaultTime)) {
            throw Error('@Input DefaultTime should be an array');
        }
        this.setHour(date, defaultTime[0] || 0);
        this.setMinute(date, defaultTime[1] || 0);
        this.setSecond(date, defaultTime[2] || 0);
    }
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Injection token used to customize the date range selection behavior. */
const NGX_MAT_DATE_RANGE_SELECTION_STRATEGY = new InjectionToken('NGX_MAT_DATE_RANGE_SELECTION_STRATEGY');
/** Provides the default date range selection behavior. */
class DefaultNgxMatCalendarRangeStrategy {
    constructor(_dateAdapter) {
        this._dateAdapter = _dateAdapter;
    }
    selectionFinished(date, currentRange) {
        let { start, end } = currentRange;
        if (start == null) {
            start = date;
        }
        else if (end == null && date && this._dateAdapter.compareDate(date, start) >= 0) {
            end = date;
        }
        else {
            start = date;
            end = null;
        }
        return new DateRange(start, end);
    }
    createPreview(activeDate, currentRange) {
        let start = null;
        let end = null;
        if (currentRange.start && !currentRange.end && activeDate) {
            start = currentRange.start;
            end = activeDate;
        }
        return new DateRange(start, end);
    }
}
/** @nocollapse */ /** @nocollapse */ DefaultNgxMatCalendarRangeStrategy.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: DefaultNgxMatCalendarRangeStrategy, deps: [{ token: NgxMatDateAdapter }], target: i0.ɵɵFactoryTarget.Injectable });
/** @nocollapse */ /** @nocollapse */ DefaultNgxMatCalendarRangeStrategy.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: DefaultNgxMatCalendarRangeStrategy });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: DefaultNgxMatCalendarRangeStrategy, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: NgxMatDateAdapter }]; } });

const LIMIT_TIMES = {
    minHour: 0,
    maxHour: 24,
    minMinute: 0,
    maxMinute: 60,
    minSecond: 0,
    maxSecond: 60,
    meridian: 12
};
const MERIDIANS = {
    AM: 'AM',
    PM: 'PM'
};
const DEFAULT_STEP = 1;
const NUMERIC_REGEX = /[^0-9]/g;
const PATTERN_INPUT_HOUR = /^(2[0-3]|[0-1][0-9]|[0-9])$/;
const PATTERN_INPUT_MINUTE = /^([0-5][0-9]|[0-9])$/;
const PATTERN_INPUT_SECOND = /^([0-5][0-9]|[0-9])$/;
function formatTwoDigitTimeValue(val) {
    const txt = val.toString();
    return txt.length > 1 ? txt : `0${txt}`;
}
function createMissingDateImplError(provider) {
    return Error(`NgxMatDatepicker: No provider found for ${provider}. You must import one of the following ` +
        `modules at your application root: NgxMatNativeDateModule, NgxMatMomentModule, or provide a ` +
        `custom implementation.`);
}
/** Formats a range of years. */
function formatYearRange(start, end) {
    return `${start} \u2013 ${end}`;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const DAYS_PER_WEEK = 7;
/**
 * An internal component used to display a single month in the datepicker.
 * @docs-private
 */
class NgxMatMonthView {
    constructor(_changeDetectorRef, _dateFormats, _dateAdapter, _dir, _rangeStrategy) {
        this._changeDetectorRef = _changeDetectorRef;
        this._dateFormats = _dateFormats;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        this._rangeStrategy = _rangeStrategy;
        this._rerenderSubscription = Subscription.EMPTY;
        /** Emits when a new date is selected. */
        this.selectedChange = new EventEmitter();
        /** Emits when any date is selected. */
        this._userSelection = new EventEmitter();
        /** Emits when any date is activated. */
        this.activeDateChange = new EventEmitter();
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        if (!this._dateFormats) {
            throw createMissingDateImplError('NGX_MAT_DATE_FORMATS');
        }
        this._activeDate = this._dateAdapter.today();
    }
    /**
     * The date to display in this month view (everything other than the month and year is ignored).
     */
    get activeDate() { return this._activeDate; }
    set activeDate(value) {
        const oldActiveDate = this._activeDate;
        const validDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value)) || this._dateAdapter.today();
        this._activeDate = this._dateAdapter.clampDate(validDate, this.minDate, this.maxDate);
        if (!this._hasSameMonthAndYear(oldActiveDate, this._activeDate)) {
            this._init();
        }
    }
    /** The currently selected date. */
    get selected() { return this._selected; }
    set selected(value) {
        if (value instanceof DateRange) {
            this._selected = value;
        }
        else {
            this._selected = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
        }
        this._setRanges(this._selected);
    }
    /** The minimum selectable date. */
    get minDate() { return this._minDate; }
    set minDate(value) {
        this._minDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /** The maximum selectable date. */
    get maxDate() { return this._maxDate; }
    set maxDate(value) {
        this._maxDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    ngAfterContentInit() {
        this._rerenderSubscription = this._dateAdapter.localeChanges
            .pipe(startWith(null))
            .subscribe(() => this._init());
    }
    ngOnDestroy() {
        this._rerenderSubscription.unsubscribe();
    }
    /** Handles when a new date is selected. */
    _dateSelected(event) {
        const date = event.value;
        const selectedYear = this._dateAdapter.getYear(this.activeDate);
        const selectedMonth = this._dateAdapter.getMonth(this.activeDate);
        const selectedDate = this._dateAdapter.createDate(selectedYear, selectedMonth, date);
        let rangeStartDate;
        let rangeEndDate;
        if (this._selected instanceof DateRange) {
            rangeStartDate = this._getDateInCurrentMonth(this._selected.start);
            rangeEndDate = this._getDateInCurrentMonth(this._selected.end);
        }
        else {
            rangeStartDate = rangeEndDate = this._getDateInCurrentMonth(this._selected);
        }
        if (rangeStartDate !== date || rangeEndDate !== date) {
            this.selectedChange.emit(selectedDate);
        }
        this._userSelection.emit({ value: selectedDate, event: event.event });
    }
    /** Handles keydown events on the calendar body when calendar is in month view. */
    _handleCalendarBodyKeydown(event) {
        // TODO(mmalerba): We currently allow keyboard navigation to disabled dates, but just prevent
        // disabled ones from being selected. This may not be ideal, we should look into whether
        // navigation should skip over disabled dates, and if so, how to implement that efficiently.
        const oldActiveDate = this._activeDate;
        const isRtl = this._isRtl();
        switch (event.keyCode) {
            case LEFT_ARROW:
                this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, isRtl ? 1 : -1);
                break;
            case RIGHT_ARROW:
                this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, isRtl ? -1 : 1);
                break;
            case UP_ARROW:
                this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, -7);
                break;
            case DOWN_ARROW:
                this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, 7);
                break;
            case HOME:
                this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, 1 - this._dateAdapter.getDate(this._activeDate));
                break;
            case END:
                this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, (this._dateAdapter.getNumDaysInMonth(this._activeDate) -
                    this._dateAdapter.getDate(this._activeDate)));
                break;
            case PAGE_UP:
                this.activeDate = event.altKey ?
                    this._dateAdapter.addCalendarYears(this._activeDate, -1) :
                    this._dateAdapter.addCalendarMonths(this._activeDate, -1);
                break;
            case PAGE_DOWN:
                this.activeDate = event.altKey ?
                    this._dateAdapter.addCalendarYears(this._activeDate, 1) :
                    this._dateAdapter.addCalendarMonths(this._activeDate, 1);
                break;
            case ENTER:
            case SPACE:
                if (!this.dateFilter || this.dateFilter(this._activeDate)) {
                    this._dateSelected({ value: this._dateAdapter.getDate(this._activeDate), event });
                    // Prevent unexpected default actions such as form submission.
                    event.preventDefault();
                }
                return;
            case ESCAPE:
                // Abort the current range selection if the user presses escape mid-selection.
                if (this._previewEnd != null) {
                    this._previewStart = this._previewEnd = null;
                    this.selectedChange.emit(null);
                    this._userSelection.emit({ value: null, event });
                    event.preventDefault();
                    event.stopPropagation(); // Prevents the overlay from closing.
                }
                return;
            default:
                // Don't prevent default or focus active cell on keys that we don't explicitly handle.
                return;
        }
        if (this._dateAdapter.compareDate(oldActiveDate, this.activeDate)) {
            this.activeDateChange.emit(this.activeDate);
        }
        this._focusActiveCell();
        // Prevent unexpected default actions such as form submission.
        event.preventDefault();
    }
    /** Initializes this month view. */
    _init() {
        this._setRanges(this.selected);
        this._todayDate = this._getCellCompareValue(this._dateAdapter.today());
        this._monthLabel =
            this._dateAdapter.getMonthNames('short')[this._dateAdapter.getMonth(this.activeDate)]
                .toLocaleUpperCase();
        let firstOfMonth = this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate), this._dateAdapter.getMonth(this.activeDate), 1);
        this._firstWeekOffset =
            (DAYS_PER_WEEK + this._dateAdapter.getDayOfWeek(firstOfMonth) -
                this._dateAdapter.getFirstDayOfWeek()) % DAYS_PER_WEEK;
        this._initWeekdays();
        this._createWeekCells();
        this._changeDetectorRef.markForCheck();
    }
    /** Focuses the active cell after the microtask queue is empty. */
    _focusActiveCell(movePreview) {
        this._matCalendarBody._focusActiveCell(movePreview);
    }
    /** Called when the user has activated a new cell and the preview needs to be updated. */
    _previewChanged({ event, value: cell }) {
        if (this._rangeStrategy) {
            // We can assume that this will be a range, because preview
            // events aren't fired for single date selections.
            const value = cell ? cell.rawValue : null;
            const previewRange = this._rangeStrategy.createPreview(value, this.selected, event);
            this._previewStart = this._getCellCompareValue(previewRange.start);
            this._previewEnd = this._getCellCompareValue(previewRange.end);
            // Note that here we need to use `detectChanges`, rather than `markForCheck`, because
            // the way `_focusActiveCell` is set up at the moment makes it fire at the wrong time
            // when navigating one month back using the keyboard which will cause this handler
            // to throw a "changed after checked" error when updating the preview state.
            this._changeDetectorRef.detectChanges();
        }
    }
    /** Initializes the weekdays. */
    _initWeekdays() {
        const firstDayOfWeek = this._dateAdapter.getFirstDayOfWeek();
        const narrowWeekdays = this._dateAdapter.getDayOfWeekNames('narrow');
        const longWeekdays = this._dateAdapter.getDayOfWeekNames('long');
        // Rotate the labels for days of the week based on the configured first day of the week.
        let weekdays = longWeekdays.map((long, i) => {
            return { long, narrow: narrowWeekdays[i] };
        });
        this._weekdays = weekdays.slice(firstDayOfWeek).concat(weekdays.slice(0, firstDayOfWeek));
    }
    /** Creates MatCalendarCells for the dates in this month. */
    _createWeekCells() {
        const daysInMonth = this._dateAdapter.getNumDaysInMonth(this.activeDate);
        const dateNames = this._dateAdapter.getDateNames();
        this._weeks = [[]];
        for (let i = 0, cell = this._firstWeekOffset; i < daysInMonth; i++, cell++) {
            if (cell == DAYS_PER_WEEK) {
                this._weeks.push([]);
                cell = 0;
            }
            const date = this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate), this._dateAdapter.getMonth(this.activeDate), i + 1);
            const enabled = this._shouldEnableDate(date);
            const ariaLabel = this._dateAdapter.format(date, this._dateFormats.display.dateA11yLabel);
            const cellClasses = this.dateClass ? this.dateClass(date) : undefined;
            this._weeks[this._weeks.length - 1].push(new NgxMatCalendarCell(i + 1, dateNames[i], ariaLabel, enabled, cellClasses, this._getCellCompareValue(date), date));
        }
    }
    /** Date filter for the month */
    _shouldEnableDate(date) {
        return !!date &&
            (!this.minDate || this._dateAdapter.compareDate(date, this.minDate) >= 0) &&
            (!this.maxDate || this._dateAdapter.compareDate(date, this.maxDate) <= 0) &&
            (!this.dateFilter || this.dateFilter(date));
    }
    /**
     * Gets the date in this month that the given Date falls on.
     * Returns null if the given Date is in another month.
     */
    _getDateInCurrentMonth(date) {
        return date && this._hasSameMonthAndYear(date, this.activeDate) ?
            this._dateAdapter.getDate(date) : null;
    }
    /** Checks whether the 2 dates are non-null and fall within the same month of the same year. */
    _hasSameMonthAndYear(d1, d2) {
        return !!(d1 && d2 && this._dateAdapter.getMonth(d1) == this._dateAdapter.getMonth(d2) &&
            this._dateAdapter.getYear(d1) == this._dateAdapter.getYear(d2));
    }
    /** Gets the value that will be used to one cell to another. */
    _getCellCompareValue(date) {
        if (date) {
            // We use the time since the Unix epoch to compare dates in this view, rather than the
            // cell values, because we need to support ranges that span across multiple months/years.
            const year = this._dateAdapter.getYear(date);
            const month = this._dateAdapter.getMonth(date);
            const day = this._dateAdapter.getDate(date);
            return new Date(year, month, day).getTime();
        }
        return null;
    }
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    _getValidDateOrNull(obj) {
        return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
    }
    /** Determines whether the user has the RTL layout direction. */
    _isRtl() {
        return this._dir && this._dir.value === 'rtl';
    }
    /** Sets the current range based on a model value. */
    _setRanges(selectedValue) {
        if (selectedValue instanceof DateRange) {
            this._rangeStart = this._getCellCompareValue(selectedValue.start);
            this._rangeEnd = this._getCellCompareValue(selectedValue.end);
            this._isRange = true;
        }
        else {
            this._rangeStart = this._rangeEnd = this._getCellCompareValue(selectedValue);
            this._isRange = false;
        }
        this._comparisonRangeStart = this._getCellCompareValue(this.comparisonStart);
        this._comparisonRangeEnd = this._getCellCompareValue(this.comparisonEnd);
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatMonthView.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatMonthView, deps: [{ token: i0.ChangeDetectorRef }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }, { token: NGX_MAT_DATE_RANGE_SELECTION_STRATEGY, optional: true }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatMonthView.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatMonthView, selector: "ngx-mat-month-view", inputs: { activeDate: "activeDate", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter", dateClass: "dateClass", comparisonStart: "comparisonStart", comparisonEnd: "comparisonEnd" }, outputs: { selectedChange: "selectedChange", _userSelection: "_userSelection", activeDateChange: "activeDateChange" }, viewQueries: [{ propertyName: "_matCalendarBody", first: true, predicate: NgxMatCalendarBody, descendants: true }], exportAs: ["ngxMatMonthView"], ngImport: i0, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr>\r\n      <th scope=\"col\" *ngFor=\"let day of _weekdays\" [attr.aria-label]=\"day.long\">{{day.narrow}}</th>\r\n    </tr>\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"7\" aria-hidden=\"true\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_monthLabel\"\r\n         [rows]=\"_weeks\"\r\n         [todayValue]=\"_todayDate!\"\r\n         [startValue]=\"_rangeStart!\"\r\n         [endValue]=\"_rangeEnd!\"\r\n         [comparisonStart]=\"_comparisonRangeStart\"\r\n         [comparisonEnd]=\"_comparisonRangeEnd\"\r\n         [previewStart]=\"_previewStart\"\r\n         [previewEnd]=\"_previewEnd\"\r\n         [isRange]=\"_isRange\"\r\n         [labelMinRequiredCells]=\"3\"\r\n         [activeCell]=\"_dateAdapter.getDate(activeDate) - 1\"\r\n         (selectedValueChange)=\"_dateSelected($event)\"\r\n         (previewChange)=\"_previewChanged($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n", components: [{ type: NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: ["label", "rows", "todayValue", "startValue", "endValue", "labelMinRequiredCells", "numCols", "activeCell", "isRange", "cellAspectRatio", "comparisonStart", "comparisonEnd", "previewStart", "previewEnd"], outputs: ["selectedValueChange", "previewChange"], exportAs: ["NgxMatCalendarBody"] }], directives: [{ type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatMonthView, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-month-view', exportAs: 'ngxMatMonthView', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr>\r\n      <th scope=\"col\" *ngFor=\"let day of _weekdays\" [attr.aria-label]=\"day.long\">{{day.narrow}}</th>\r\n    </tr>\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"7\" aria-hidden=\"true\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_monthLabel\"\r\n         [rows]=\"_weeks\"\r\n         [todayValue]=\"_todayDate!\"\r\n         [startValue]=\"_rangeStart!\"\r\n         [endValue]=\"_rangeEnd!\"\r\n         [comparisonStart]=\"_comparisonRangeStart\"\r\n         [comparisonEnd]=\"_comparisonRangeEnd\"\r\n         [previewStart]=\"_previewStart\"\r\n         [previewEnd]=\"_previewEnd\"\r\n         [isRange]=\"_isRange\"\r\n         [labelMinRequiredCells]=\"3\"\r\n         [activeCell]=\"_dateAdapter.getDate(activeDate) - 1\"\r\n         (selectedValueChange)=\"_dateSelected($event)\"\r\n         (previewChange)=\"_previewChanged($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n" }]
        }], ctorParameters: function () {
        return [{ type: i0.ChangeDetectorRef }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [NGX_MAT_DATE_FORMATS]
                    }] }, { type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: i2.Directionality, decorators: [{
                        type: Optional
                    }] }, { type: undefined, decorators: [{
                        type: Inject,
                        args: [NGX_MAT_DATE_RANGE_SELECTION_STRATEGY]
                    }, {
                        type: Optional
                    }] }];
    }, propDecorators: { activeDate: [{
                type: Input
            }], selected: [{
                type: Input
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], dateFilter: [{
                type: Input
            }], dateClass: [{
                type: Input
            }], comparisonStart: [{
                type: Input
            }], comparisonEnd: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], _userSelection: [{
                type: Output
            }], activeDateChange: [{
                type: Output
            }], _matCalendarBody: [{
                type: ViewChild,
                args: [NgxMatCalendarBody]
            }] } });

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const yearsPerPage = 24;
const yearsPerRow = 4;
/**
 * An internal component used to display a year selector in the datepicker.
 * @docs-private
 */
class NgxMatMultiYearView {
    constructor(_changeDetectorRef, _dateAdapter, _dir) {
        this._changeDetectorRef = _changeDetectorRef;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        this._rerenderSubscription = Subscription.EMPTY;
        /** Emits when a new year is selected. */
        this.selectedChange = new EventEmitter();
        /** Emits the selected year. This doesn't imply a change on the selected date */
        this.yearSelected = new EventEmitter();
        /** Emits when any date is activated. */
        this.activeDateChange = new EventEmitter();
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        this._activeDate = this._dateAdapter.today();
    }
    /** The date to display in this multi-year view (everything other than the year is ignored). */
    get activeDate() { return this._activeDate; }
    set activeDate(value) {
        let oldActiveDate = this._activeDate;
        const validDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value)) || this._dateAdapter.today();
        this._activeDate = this._dateAdapter.clampDate(validDate, this.minDate, this.maxDate);
        if (!isSameMultiYearView(this._dateAdapter, oldActiveDate, this._activeDate, this.minDate, this.maxDate)) {
            this._init();
        }
    }
    /** The currently selected date. */
    get selected() { return this._selected; }
    set selected(value) {
        if (value instanceof DateRange) {
            this._selected = value;
        }
        else {
            this._selected = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
        }
        this._setSelectedYear(value);
    }
    /** The minimum selectable date. */
    get minDate() { return this._minDate; }
    set minDate(value) {
        this._minDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /** The maximum selectable date. */
    get maxDate() { return this._maxDate; }
    set maxDate(value) {
        this._maxDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    ngAfterContentInit() {
        this._rerenderSubscription = this._dateAdapter.localeChanges
            .pipe(startWith(null))
            .subscribe(() => this._init());
    }
    ngOnDestroy() {
        this._rerenderSubscription.unsubscribe();
    }
    /** Initializes this multi-year view. */
    _init() {
        this._todayYear = this._dateAdapter.getYear(this._dateAdapter.today());
        // We want a range years such that we maximize the number of
        // enabled dates visible at once. This prevents issues where the minimum year
        // is the last item of a page OR the maximum year is the first item of a page.
        // The offset from the active year to the "slot" for the starting year is the
        // *actual* first rendered year in the multi-year view.
        const activeYear = this._dateAdapter.getYear(this._activeDate);
        const minYearOfPage = activeYear - getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate);
        this._years = [];
        for (let i = 0, row = []; i < yearsPerPage; i++) {
            row.push(minYearOfPage + i);
            if (row.length == yearsPerRow) {
                this._years.push(row.map(year => this._createCellForYear(year)));
                row = [];
            }
        }
        this._changeDetectorRef.markForCheck();
    }
    /** Handles when a new year is selected. */
    _yearSelected(event) {
        const year = event.value;
        this.yearSelected.emit(this._dateAdapter.createDate(year, 0, 1));
        let month = this._dateAdapter.getMonth(this.activeDate);
        let daysInMonth = this._dateAdapter.getNumDaysInMonth(this._dateAdapter.createDate(year, month, 1));
        this.selectedChange.emit(this._dateAdapter.createDate(year, month, Math.min(this._dateAdapter.getDate(this.activeDate), daysInMonth)));
    }
    /** Handles keydown events on the calendar body when calendar is in multi-year view. */
    _handleCalendarBodyKeydown(event) {
        const oldActiveDate = this._activeDate;
        const isRtl = this._isRtl();
        switch (event.keyCode) {
            case LEFT_ARROW:
                this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, isRtl ? 1 : -1);
                break;
            case RIGHT_ARROW:
                this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, isRtl ? -1 : 1);
                break;
            case UP_ARROW:
                this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, -yearsPerRow);
                break;
            case DOWN_ARROW:
                this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, yearsPerRow);
                break;
            case HOME:
                this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, -getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate));
                break;
            case END:
                this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, yearsPerPage - getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate) - 1);
                break;
            case PAGE_UP:
                this.activeDate =
                    this._dateAdapter.addCalendarYears(this._activeDate, event.altKey ? -yearsPerPage * 10 : -yearsPerPage);
                break;
            case PAGE_DOWN:
                this.activeDate =
                    this._dateAdapter.addCalendarYears(this._activeDate, event.altKey ? yearsPerPage * 10 : yearsPerPage);
                break;
            case ENTER:
            case SPACE:
                this._yearSelected({ value: this._dateAdapter.getYear(this._activeDate), event });
                break;
            default:
                // Don't prevent default or focus active cell on keys that we don't explicitly handle.
                return;
        }
        if (this._dateAdapter.compareDate(oldActiveDate, this.activeDate)) {
            this.activeDateChange.emit(this.activeDate);
        }
        this._focusActiveCell();
        // Prevent unexpected default actions such as form submission.
        event.preventDefault();
    }
    _getActiveCell() {
        return getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate);
    }
    /** Focuses the active cell after the microtask queue is empty. */
    _focusActiveCell() {
        this._matCalendarBody._focusActiveCell();
    }
    /** Creates an MatCalendarCell for the given year. */
    _createCellForYear(year) {
        let yearName = this._dateAdapter.getYearName(this._dateAdapter.createDate(year, 0, 1));
        return new NgxMatCalendarCell(year, yearName, yearName, this._shouldEnableYear(year));
    }
    /** Whether the given year is enabled. */
    _shouldEnableYear(year) {
        // disable if the year is greater than maxDate lower than minDate
        if (year === undefined || year === null ||
            (this.maxDate && year > this._dateAdapter.getYear(this.maxDate)) ||
            (this.minDate && year < this._dateAdapter.getYear(this.minDate))) {
            return false;
        }
        // enable if it reaches here and there's no filter defined
        if (!this.dateFilter) {
            return true;
        }
        const firstOfYear = this._dateAdapter.createDate(year, 0, 1);
        // If any date in the year is enabled count the year as enabled.
        for (let date = firstOfYear; this._dateAdapter.getYear(date) == year; date = this._dateAdapter.addCalendarDays(date, 1)) {
            if (this.dateFilter(date)) {
                return true;
            }
        }
        return false;
    }
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    _getValidDateOrNull(obj) {
        return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
    }
    /** Determines whether the user has the RTL layout direction. */
    _isRtl() {
        return this._dir && this._dir.value === 'rtl';
    }
    /** Sets the currently-highlighted year based on a model value. */
    _setSelectedYear(value) {
        this._selectedYear = null;
        if (value instanceof DateRange) {
            const displayValue = value.start || value.end;
            if (displayValue) {
                this._selectedYear = this._dateAdapter.getYear(displayValue);
            }
        }
        else if (value) {
            this._selectedYear = this._dateAdapter.getYear(value);
        }
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatMultiYearView.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatMultiYearView, deps: [{ token: i0.ChangeDetectorRef }, { token: NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatMultiYearView.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatMultiYearView, selector: "ngx-mat-multi-year-view", inputs: { activeDate: "activeDate", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter" }, outputs: { selectedChange: "selectedChange", yearSelected: "yearSelected", activeDateChange: "activeDateChange" }, viewQueries: [{ propertyName: "_matCalendarBody", first: true, predicate: NgxMatCalendarBody, descendants: true }], exportAs: ["ngxMatMultiYearView"], ngImport: i0, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [rows]=\"_years\"\r\n         [todayValue]=\"_todayYear\"\r\n         [startValue]=\"_selectedYear!\"\r\n         [endValue]=\"_selectedYear!\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_getActiveCell()\"\r\n         (selectedValueChange)=\"_yearSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n\r\n", components: [{ type: NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: ["label", "rows", "todayValue", "startValue", "endValue", "labelMinRequiredCells", "numCols", "activeCell", "isRange", "cellAspectRatio", "comparisonStart", "comparisonEnd", "previewStart", "previewEnd"], outputs: ["selectedValueChange", "previewChange"], exportAs: ["NgxMatCalendarBody"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatMultiYearView, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-multi-year-view', exportAs: 'ngxMatMultiYearView', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [rows]=\"_years\"\r\n         [todayValue]=\"_todayYear\"\r\n         [startValue]=\"_selectedYear!\"\r\n         [endValue]=\"_selectedYear!\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_getActiveCell()\"\r\n         (selectedValueChange)=\"_yearSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n\r\n" }]
        }], ctorParameters: function () {
        return [{ type: i0.ChangeDetectorRef }, { type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: i2.Directionality, decorators: [{
                        type: Optional
                    }] }];
    }, propDecorators: { activeDate: [{
                type: Input
            }], selected: [{
                type: Input
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], dateFilter: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], yearSelected: [{
                type: Output
            }], activeDateChange: [{
                type: Output
            }], _matCalendarBody: [{
                type: ViewChild,
                args: [NgxMatCalendarBody]
            }] } });
function isSameMultiYearView(dateAdapter, date1, date2, minDate, maxDate) {
    const year1 = dateAdapter.getYear(date1);
    const year2 = dateAdapter.getYear(date2);
    const startingYear = getStartingYear(dateAdapter, minDate, maxDate);
    return Math.floor((year1 - startingYear) / yearsPerPage) ===
        Math.floor((year2 - startingYear) / yearsPerPage);
}
/**
 * When the multi-year view is first opened, the active year will be in view.
 * So we compute how many years are between the active year and the *slot* where our
 * "startingYear" will render when paged into view.
 */
function getActiveOffset(dateAdapter, activeDate, minDate, maxDate) {
    const activeYear = dateAdapter.getYear(activeDate);
    return euclideanModulo((activeYear - getStartingYear(dateAdapter, minDate, maxDate)), yearsPerPage);
}
/**
 * We pick a "starting" year such that either the maximum year would be at the end
 * or the minimum year would be at the beginning of a page.
 */
function getStartingYear(dateAdapter, minDate, maxDate) {
    let startingYear = 0;
    if (maxDate) {
        const maxYear = dateAdapter.getYear(maxDate);
        startingYear = maxYear - yearsPerPage + 1;
    }
    else if (minDate) {
        startingYear = dateAdapter.getYear(minDate);
    }
    return startingYear;
}
/** Gets remainder that is non-negative, even if first number is negative */
function euclideanModulo(a, b) {
    return (a % b + b) % b;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * An internal component used to display a single year in the datepicker.
 * @docs-private
 */
class NgxMatYearView {
    constructor(_changeDetectorRef, _dateFormats, _dateAdapter, _dir) {
        this._changeDetectorRef = _changeDetectorRef;
        this._dateFormats = _dateFormats;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        this._rerenderSubscription = Subscription.EMPTY;
        /** Emits when a new month is selected. */
        this.selectedChange = new EventEmitter();
        /** Emits the selected month. This doesn't imply a change on the selected date */
        this.monthSelected = new EventEmitter();
        /** Emits when any date is activated. */
        this.activeDateChange = new EventEmitter();
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        if (!this._dateFormats) {
            throw createMissingDateImplError('NGX_MAT_DATE_FORMATS');
        }
        this._activeDate = this._dateAdapter.today();
    }
    /** The date to display in this year view (everything other than the year is ignored). */
    get activeDate() { return this._activeDate; }
    set activeDate(value) {
        let oldActiveDate = this._activeDate;
        const validDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value)) || this._dateAdapter.today();
        this._activeDate = this._dateAdapter.clampDate(validDate, this.minDate, this.maxDate);
        if (this._dateAdapter.getYear(oldActiveDate) !== this._dateAdapter.getYear(this._activeDate)) {
            this._init();
        }
    }
    /** The currently selected date. */
    get selected() { return this._selected; }
    set selected(value) {
        if (value instanceof DateRange) {
            this._selected = value;
        }
        else {
            this._selected = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
        }
        this._setSelectedMonth(value);
    }
    /** The minimum selectable date. */
    get minDate() { return this._minDate; }
    set minDate(value) {
        this._minDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /** The maximum selectable date. */
    get maxDate() { return this._maxDate; }
    set maxDate(value) {
        this._maxDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    ngAfterContentInit() {
        this._rerenderSubscription = this._dateAdapter.localeChanges
            .pipe(startWith(null))
            .subscribe(() => this._init());
    }
    ngOnDestroy() {
        this._rerenderSubscription.unsubscribe();
    }
    /** Handles when a new month is selected. */
    _monthSelected(event) {
        const month = event.value;
        const normalizedDate = this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate), month, 1);
        this.monthSelected.emit(normalizedDate);
        const daysInMonth = this._dateAdapter.getNumDaysInMonth(normalizedDate);
        this.selectedChange.emit(this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate), month, Math.min(this._dateAdapter.getDate(this.activeDate), daysInMonth)));
    }
    /** Handles keydown events on the calendar body when calendar is in year view. */
    _handleCalendarBodyKeydown(event) {
        // TODO(mmalerba): We currently allow keyboard navigation to disabled dates, but just prevent
        // disabled ones from being selected. This may not be ideal, we should look into whether
        // navigation should skip over disabled dates, and if so, how to implement that efficiently.
        const oldActiveDate = this._activeDate;
        const isRtl = this._isRtl();
        switch (event.keyCode) {
            case LEFT_ARROW:
                this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, isRtl ? 1 : -1);
                break;
            case RIGHT_ARROW:
                this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, isRtl ? -1 : 1);
                break;
            case UP_ARROW:
                this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, -4);
                break;
            case DOWN_ARROW:
                this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, 4);
                break;
            case HOME:
                this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, -this._dateAdapter.getMonth(this._activeDate));
                break;
            case END:
                this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, 11 - this._dateAdapter.getMonth(this._activeDate));
                break;
            case PAGE_UP:
                this.activeDate =
                    this._dateAdapter.addCalendarYears(this._activeDate, event.altKey ? -10 : -1);
                break;
            case PAGE_DOWN:
                this.activeDate =
                    this._dateAdapter.addCalendarYears(this._activeDate, event.altKey ? 10 : 1);
                break;
            case ENTER:
            case SPACE:
                this._monthSelected({ value: this._dateAdapter.getMonth(this._activeDate), event });
                break;
            default:
                // Don't prevent default or focus active cell on keys that we don't explicitly handle.
                return;
        }
        if (this._dateAdapter.compareDate(oldActiveDate, this.activeDate)) {
            this.activeDateChange.emit(this.activeDate);
        }
        this._focusActiveCell();
        // Prevent unexpected default actions such as form submission.
        event.preventDefault();
    }
    /** Initializes this year view. */
    _init() {
        this._setSelectedMonth(this.selected);
        this._todayMonth = this._getMonthInCurrentYear(this._dateAdapter.today());
        this._yearLabel = this._dateAdapter.getYearName(this.activeDate);
        let monthNames = this._dateAdapter.getMonthNames('short');
        // First row of months only contains 5 elements so we can fit the year label on the same row.
        this._months = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]].map(row => row.map(month => this._createCellForMonth(month, monthNames[month])));
        this._changeDetectorRef.markForCheck();
    }
    /** Focuses the active cell after the microtask queue is empty. */
    _focusActiveCell() {
        this._matCalendarBody._focusActiveCell();
    }
    /**
     * Gets the month in this year that the given Date falls on.
     * Returns null if the given Date is in another year.
     */
    _getMonthInCurrentYear(date) {
        return date && this._dateAdapter.getYear(date) == this._dateAdapter.getYear(this.activeDate) ?
            this._dateAdapter.getMonth(date) : null;
    }
    /** Creates an MatCalendarCell for the given month. */
    _createCellForMonth(month, monthName) {
        let ariaLabel = this._dateAdapter.format(this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate), month, 1), this._dateFormats.display.monthYearA11yLabel);
        return new NgxMatCalendarCell(month, monthName.toLocaleUpperCase(), ariaLabel, this._shouldEnableMonth(month));
    }
    /** Whether the given month is enabled. */
    _shouldEnableMonth(month) {
        const activeYear = this._dateAdapter.getYear(this.activeDate);
        if (month === undefined || month === null ||
            this._isYearAndMonthAfterMaxDate(activeYear, month) ||
            this._isYearAndMonthBeforeMinDate(activeYear, month)) {
            return false;
        }
        if (!this.dateFilter) {
            return true;
        }
        const firstOfMonth = this._dateAdapter.createDate(activeYear, month, 1);
        // If any date in the month is enabled count the month as enabled.
        for (let date = firstOfMonth; this._dateAdapter.getMonth(date) == month; date = this._dateAdapter.addCalendarDays(date, 1)) {
            if (this.dateFilter(date)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Tests whether the combination month/year is after this.maxDate, considering
     * just the month and year of this.maxDate
     */
    _isYearAndMonthAfterMaxDate(year, month) {
        if (this.maxDate) {
            const maxYear = this._dateAdapter.getYear(this.maxDate);
            const maxMonth = this._dateAdapter.getMonth(this.maxDate);
            return year > maxYear || (year === maxYear && month > maxMonth);
        }
        return false;
    }
    /**
     * Tests whether the combination month/year is before this.minDate, considering
     * just the month and year of this.minDate
     */
    _isYearAndMonthBeforeMinDate(year, month) {
        if (this.minDate) {
            const minYear = this._dateAdapter.getYear(this.minDate);
            const minMonth = this._dateAdapter.getMonth(this.minDate);
            return year < minYear || (year === minYear && month < minMonth);
        }
        return false;
    }
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    _getValidDateOrNull(obj) {
        return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
    }
    /** Determines whether the user has the RTL layout direction. */
    _isRtl() {
        return this._dir && this._dir.value === 'rtl';
    }
    /** Sets the currently-selected month based on a model value. */
    _setSelectedMonth(value) {
        if (value instanceof DateRange) {
            this._selectedMonth = this._getMonthInCurrentYear(value.start) ||
                this._getMonthInCurrentYear(value.end);
        }
        else {
            this._selectedMonth = this._getMonthInCurrentYear(value);
        }
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatYearView.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatYearView, deps: [{ token: i0.ChangeDetectorRef }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatYearView.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatYearView, selector: "ngx-mat-year-view", inputs: { activeDate: "activeDate", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter" }, outputs: { selectedChange: "selectedChange", monthSelected: "monthSelected", activeDateChange: "activeDateChange" }, viewQueries: [{ propertyName: "_matCalendarBody", first: true, predicate: NgxMatCalendarBody, descendants: true }], exportAs: ["ngxMatYearView"], ngImport: i0, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_yearLabel\"\r\n         [rows]=\"_months\"\r\n         [todayValue]=\"_todayMonth!\"\r\n         [startValue]=\"_selectedMonth!\"\r\n         [endValue]=\"_selectedMonth!\"\r\n         [labelMinRequiredCells]=\"2\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_dateAdapter.getMonth(activeDate)\"\r\n         (selectedValueChange)=\"_monthSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n", components: [{ type: NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: ["label", "rows", "todayValue", "startValue", "endValue", "labelMinRequiredCells", "numCols", "activeCell", "isRange", "cellAspectRatio", "comparisonStart", "comparisonEnd", "previewStart", "previewEnd"], outputs: ["selectedValueChange", "previewChange"], exportAs: ["NgxMatCalendarBody"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatYearView, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-year-view', exportAs: 'ngxMatYearView', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_yearLabel\"\r\n         [rows]=\"_months\"\r\n         [todayValue]=\"_todayMonth!\"\r\n         [startValue]=\"_selectedMonth!\"\r\n         [endValue]=\"_selectedMonth!\"\r\n         [labelMinRequiredCells]=\"2\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_dateAdapter.getMonth(activeDate)\"\r\n         (selectedValueChange)=\"_monthSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n" }]
        }], ctorParameters: function () {
        return [{ type: i0.ChangeDetectorRef }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [NGX_MAT_DATE_FORMATS]
                    }] }, { type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: i2.Directionality, decorators: [{
                        type: Optional
                    }] }];
    }, propDecorators: { activeDate: [{
                type: Input
            }], selected: [{
                type: Input
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], dateFilter: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], monthSelected: [{
                type: Output
            }], activeDateChange: [{
                type: Output
            }], _matCalendarBody: [{
                type: ViewChild,
                args: [NgxMatCalendarBody]
            }] } });

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Default header for NgxMatCalendar */
class NgxMatCalendarHeader {
    constructor(_intl, calendar, _dateAdapter, _dateFormats, changeDetectorRef) {
        this._intl = _intl;
        this.calendar = calendar;
        this._dateAdapter = _dateAdapter;
        this._dateFormats = _dateFormats;
        this.calendar.stateChanges.subscribe(() => changeDetectorRef.markForCheck());
    }
    /** The label for the current calendar view. */
    get periodButtonText() {
        if (this.calendar.currentView == 'month') {
            return this._dateAdapter
                .format(this.calendar.activeDate, this._dateFormats.display.monthYearLabel)
                .toLocaleUpperCase();
        }
        if (this.calendar.currentView == 'year') {
            return this._dateAdapter.getYearName(this.calendar.activeDate);
        }
        // The offset from the active year to the "slot" for the starting year is the
        // *actual* first rendered year in the multi-year view, and the last year is
        // just yearsPerPage - 1 away.
        const activeYear = this._dateAdapter.getYear(this.calendar.activeDate);
        const minYearOfPage = activeYear - getActiveOffset(this._dateAdapter, this.calendar.activeDate, this.calendar.minDate, this.calendar.maxDate);
        const maxYearOfPage = minYearOfPage + yearsPerPage - 1;
        const minYearName = this._dateAdapter.getYearName(this._dateAdapter.createDate(minYearOfPage, 0, 1));
        const maxYearName = this._dateAdapter.getYearName(this._dateAdapter.createDate(maxYearOfPage, 0, 1));
        return formatYearRange(minYearName, maxYearName);
    }
    get periodButtonLabel() {
        return this.calendar.currentView == 'month' ?
            this._intl.switchToMultiYearViewLabel : this._intl.switchToMonthViewLabel;
    }
    /** The label for the previous button. */
    get prevButtonLabel() {
        return {
            'month': this._intl.prevMonthLabel,
            'year': this._intl.prevYearLabel,
            'multi-year': this._intl.prevMultiYearLabel
        }[this.calendar.currentView];
    }
    /** The label for the next button. */
    get nextButtonLabel() {
        return {
            'month': this._intl.nextMonthLabel,
            'year': this._intl.nextYearLabel,
            'multi-year': this._intl.nextMultiYearLabel
        }[this.calendar.currentView];
    }
    /** Handles user clicks on the period label. */
    currentPeriodClicked() {
        this.calendar.currentView = this.calendar.currentView == 'month' ? 'multi-year' : 'month';
    }
    /** Handles user clicks on the previous button. */
    previousClicked() {
        this.calendar.activeDate = this.calendar.currentView == 'month' ?
            this._dateAdapter.addCalendarMonths(this.calendar.activeDate, -1) :
            this._dateAdapter.addCalendarYears(this.calendar.activeDate, this.calendar.currentView == 'year' ? -1 : -yearsPerPage);
    }
    /** Handles user clicks on the next button. */
    nextClicked() {
        this.calendar.activeDate = this.calendar.currentView == 'month' ?
            this._dateAdapter.addCalendarMonths(this.calendar.activeDate, 1) :
            this._dateAdapter.addCalendarYears(this.calendar.activeDate, this.calendar.currentView == 'year' ? 1 : yearsPerPage);
    }
    /** Whether the previous period button is enabled. */
    previousEnabled() {
        if (!this.calendar.minDate) {
            return true;
        }
        return !this.calendar.minDate ||
            !this._isSameView(this.calendar.activeDate, this.calendar.minDate);
    }
    /** Whether the next period button is enabled. */
    nextEnabled() {
        return !this.calendar.maxDate ||
            !this._isSameView(this.calendar.activeDate, this.calendar.maxDate);
    }
    /** Whether the two dates represent the same view in the current view mode (month or year). */
    _isSameView(date1, date2) {
        if (this.calendar.currentView == 'month') {
            return this._dateAdapter.getYear(date1) == this._dateAdapter.getYear(date2) &&
                this._dateAdapter.getMonth(date1) == this._dateAdapter.getMonth(date2);
        }
        if (this.calendar.currentView == 'year') {
            return this._dateAdapter.getYear(date1) == this._dateAdapter.getYear(date2);
        }
        // Otherwise we are in 'multi-year' view.
        return isSameMultiYearView(this._dateAdapter, date1, date2, this.calendar.minDate, this.calendar.maxDate);
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatCalendarHeader.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatCalendarHeader, deps: [{ token: i1$1.MatDatepickerIntl }, { token: forwardRef(() => NgxMatCalendar) }, { token: NgxMatDateAdapter, optional: true }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatCalendarHeader.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatCalendarHeader, selector: "ngx-mat-calendar-header", exportAs: ["ngxMatCalendarHeader"], ngImport: i0, template: "<div class=\"mat-calendar-header\">\r\n  <div class=\"mat-calendar-controls\">\r\n    <button mat-button type=\"button\" class=\"mat-calendar-period-button\"\r\n            (click)=\"currentPeriodClicked()\" [attr.aria-label]=\"periodButtonLabel\"\r\n            cdkAriaLive=\"polite\">\r\n      {{periodButtonText}}\r\n      <div class=\"mat-calendar-arrow\"\r\n           [class.mat-calendar-invert]=\"calendar.currentView != 'month'\"></div>\r\n    </button>\r\n\r\n    <div class=\"mat-calendar-spacer\"></div>\r\n\r\n    <ng-content></ng-content>\r\n\r\n    <button mat-icon-button type=\"button\" class=\"mat-calendar-previous-button\"\r\n            [disabled]=\"!previousEnabled()\" (click)=\"previousClicked()\"\r\n            [attr.aria-label]=\"prevButtonLabel\">\r\n    </button>\r\n\r\n    <button mat-icon-button type=\"button\" class=\"mat-calendar-next-button\"\r\n            [disabled]=\"!nextEnabled()\" (click)=\"nextClicked()\"\r\n            [attr.aria-label]=\"nextButtonLabel\">\r\n    </button>\r\n  </div>\r\n</div>\r\n", components: [{ type: i3.MatButton, selector: "button[mat-button], button[mat-raised-button], button[mat-icon-button],             button[mat-fab], button[mat-mini-fab], button[mat-stroked-button],             button[mat-flat-button]", inputs: ["disabled", "disableRipple", "color"], exportAs: ["matButton"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatCalendarHeader, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-calendar-header', exportAs: 'ngxMatCalendarHeader', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"mat-calendar-header\">\r\n  <div class=\"mat-calendar-controls\">\r\n    <button mat-button type=\"button\" class=\"mat-calendar-period-button\"\r\n            (click)=\"currentPeriodClicked()\" [attr.aria-label]=\"periodButtonLabel\"\r\n            cdkAriaLive=\"polite\">\r\n      {{periodButtonText}}\r\n      <div class=\"mat-calendar-arrow\"\r\n           [class.mat-calendar-invert]=\"calendar.currentView != 'month'\"></div>\r\n    </button>\r\n\r\n    <div class=\"mat-calendar-spacer\"></div>\r\n\r\n    <ng-content></ng-content>\r\n\r\n    <button mat-icon-button type=\"button\" class=\"mat-calendar-previous-button\"\r\n            [disabled]=\"!previousEnabled()\" (click)=\"previousClicked()\"\r\n            [attr.aria-label]=\"prevButtonLabel\">\r\n    </button>\r\n\r\n    <button mat-icon-button type=\"button\" class=\"mat-calendar-next-button\"\r\n            [disabled]=\"!nextEnabled()\" (click)=\"nextClicked()\"\r\n            [attr.aria-label]=\"nextButtonLabel\">\r\n    </button>\r\n  </div>\r\n</div>\r\n" }]
        }], ctorParameters: function () {
        return [{ type: i1$1.MatDatepickerIntl }, { type: NgxMatCalendar, decorators: [{
                        type: Inject,
                        args: [forwardRef(() => NgxMatCalendar)]
                    }] }, { type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [NGX_MAT_DATE_FORMATS]
                    }] }, { type: i0.ChangeDetectorRef }];
    } });
/**
 * A calendar that is used as part of the datepicker.
 * @docs-private
 */
class NgxMatCalendar {
    constructor(_intl, _dateAdapter, _dateFormats, _changeDetectorRef) {
        this._dateAdapter = _dateAdapter;
        this._dateFormats = _dateFormats;
        this._changeDetectorRef = _changeDetectorRef;
        /**
         * Used for scheduling that focus should be moved to the active cell on the next tick.
         * We need to schedule it, rather than do it immediately, because we have to wait
         * for Angular to re-evaluate the view children.
         */
        this._moveFocusOnNextTick = false;
        /** Whether the calendar should be started in month or year view. */
        this.startView = 'month';
        /** Emits when the currently selected date changes. */
        this.selectedChange = new EventEmitter();
        /**
         * Emits the year chosen in multiyear view.
         * This doesn't imply a change on the selected date.
         */
        this.yearSelected = new EventEmitter();
        /**
         * Emits the month chosen in year view.
         * This doesn't imply a change on the selected date.
         */
        this.monthSelected = new EventEmitter();
        /** Emits when any date is selected. */
        this._userSelection = new EventEmitter();
        /**
         * Emits whenever there is a state change that the header may need to respond to.
         */
        this.stateChanges = new Subject();
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxDateAdapter');
        }
        if (!this._dateFormats) {
            throw createMissingDateImplError('NGX_MAT_DATE_FORMATS');
        }
        this._intlChanges = _intl.changes.subscribe(() => {
            _changeDetectorRef.markForCheck();
            this.stateChanges.next();
        });
    }
    /** A date representing the period (month or year) to start the calendar in. */
    get startAt() { return this._startAt; }
    set startAt(value) {
        this._startAt = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /** The currently selected date. */
    get selected() { return this._selected; }
    set selected(value) {
        this._selected = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /** The minimum selectable date. */
    get minDate() { return this._minDate; }
    set minDate(value) {
        this._minDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /** The maximum selectable date. */
    get maxDate() { return this._maxDate; }
    set maxDate(value) {
        this._maxDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /**
     * The current active date. This determines which time period is shown and which date is
     * highlighted when using keyboard navigation.
     */
    get activeDate() { return this._clampedActiveDate; }
    set activeDate(value) {
        this._clampedActiveDate = this._dateAdapter.clampDate(value, this.minDate, this.maxDate);
        this.stateChanges.next();
        this._changeDetectorRef.markForCheck();
    }
    /** Whether the calendar is in month view. */
    get currentView() { return this._currentView; }
    set currentView(value) {
        this._currentView = value;
        this._moveFocusOnNextTick = true;
        this._changeDetectorRef.markForCheck();
    }
    ngAfterContentInit() {
        this._calendarHeaderPortal = new ComponentPortal(this.headerComponent || NgxMatCalendarHeader);
        this.activeDate = this.startAt || this._dateAdapter.today();
        // Assign to the private property since we don't want to move focus on init.
        this._currentView = this.startView;
    }
    ngAfterViewChecked() {
        if (this._moveFocusOnNextTick) {
            this._moveFocusOnNextTick = false;
            this.focusActiveCell();
        }
    }
    ngOnDestroy() {
        this._intlChanges.unsubscribe();
        this.stateChanges.complete();
    }
    ngOnChanges(changes) {
        const change = changes['minDate'] || changes['maxDate'] || changes['dateFilter'];
        if (change && !change.firstChange) {
            const view = this._getCurrentViewComponent();
            if (view) {
                // We need to `detectChanges` manually here, because the `minDate`, `maxDate` etc. are
                // passed down to the view via data bindings which won't be up-to-date when we call `_init`.
                this._changeDetectorRef.detectChanges();
                view._init();
            }
        }
        this.stateChanges.next();
    }
    focusActiveCell() {
        this._getCurrentViewComponent()._focusActiveCell();
    }
    /** Updates today's date after an update of the active date */
    updateTodaysDate() {
        let view = this.currentView == 'month' ? this.monthView :
            (this.currentView == 'year' ? this.yearView : this.multiYearView);
        view.ngAfterContentInit();
    }
    /** Handles date selection in the month view. */
    _dateSelected(date) {
        if (date && !this._dateAdapter.sameDate(date, this.selected)) {
            this.selectedChange.emit(date);
        }
    }
    /** Handles year selection in the multiyear view. */
    _yearSelectedInMultiYearView(normalizedYear) {
        this.yearSelected.emit(normalizedYear);
    }
    /** Handles month selection in the year view. */
    _monthSelectedInYearView(normalizedMonth) {
        this.monthSelected.emit(normalizedMonth);
    }
    _userSelected() {
        this._userSelection.emit();
    }
    /** Handles year/month selection in the multi-year/year views. */
    _goToDateInView(date, view) {
        this.activeDate = date;
        this.currentView = view;
    }
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    _getValidDateOrNull(obj) {
        return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
    }
    /** Returns the component instance that corresponds to the current calendar view. */
    _getCurrentViewComponent() {
        return this.monthView || this.yearView || this.multiYearView;
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatCalendar.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatCalendar, deps: [{ token: i1$1.MatDatepickerIntl }, { token: NgxMatDateAdapter, optional: true }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatCalendar.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatCalendar, selector: "ngx-mat-calendar", inputs: { headerComponent: "headerComponent", startAt: "startAt", startView: "startView", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter", dateClass: "dateClass" }, outputs: { selectedChange: "selectedChange", yearSelected: "yearSelected", monthSelected: "monthSelected", _userSelection: "_userSelection" }, host: { classAttribute: "mat-calendar" }, viewQueries: [{ propertyName: "monthView", first: true, predicate: NgxMatMonthView, descendants: true }, { propertyName: "yearView", first: true, predicate: NgxMatYearView, descendants: true }, { propertyName: "multiYearView", first: true, predicate: NgxMatMultiYearView, descendants: true }], exportAs: ["ngxMatCalendar"], usesOnChanges: true, ngImport: i0, template: "\r\n<ng-template [cdkPortalOutlet]=\"_calendarHeaderPortal\"></ng-template>\r\n\r\n<div class=\"mat-calendar-content\" [ngSwitch]=\"currentView\" cdkMonitorSubtreeFocus tabindex=\"-1\">\r\n  <ngx-mat-month-view\r\n      *ngSwitchCase=\"'month'\"\r\n      [(activeDate)]=\"activeDate\"\r\n      [selected]=\"selected\"\r\n      [dateFilter]=\"dateFilter\"\r\n      [maxDate]=\"maxDate\"\r\n      [minDate]=\"minDate\"\r\n      [dateClass]=\"dateClass\"\r\n      (selectedChange)=\"_dateSelected($event)\"\r\n      (_userSelection)=\"_userSelected()\">\r\n  </ngx-mat-month-view>\r\n\r\n  <ngx-mat-year-view\r\n      *ngSwitchCase=\"'year'\"\r\n      [(activeDate)]=\"activeDate\"\r\n      [selected]=\"selected\"\r\n      [dateFilter]=\"dateFilter\"\r\n      [maxDate]=\"maxDate\"\r\n      [minDate]=\"minDate\"\r\n      (monthSelected)=\"_monthSelectedInYearView($event)\"\r\n      (selectedChange)=\"_goToDateInView($event, 'month')\">\r\n  </ngx-mat-year-view>\r\n\r\n  <ngx-mat-multi-year-view\r\n      *ngSwitchCase=\"'multi-year'\"\r\n      [(activeDate)]=\"activeDate\"\r\n      [selected]=\"selected\"\r\n      [dateFilter]=\"dateFilter\"\r\n      [maxDate]=\"maxDate\"\r\n      [minDate]=\"minDate\"\r\n      (yearSelected)=\"_yearSelectedInMultiYearView($event)\"\r\n      (selectedChange)=\"_goToDateInView($event, 'year')\">\r\n  </ngx-mat-multi-year-view>\r\n</div>\r\n", styles: [".mat-calendar{display:block}.mat-calendar-header{padding:8px 8px 0}.mat-calendar-content{padding:0 8px 8px;outline:none}.mat-calendar-controls{display:flex;margin:5% calc(4.71429% - 16px)}.mat-calendar-spacer{flex:1 1 auto}.mat-calendar-period-button{min-width:0}.mat-calendar-arrow{display:inline-block;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top-width:5px;border-top-style:solid;margin:0 0 0 5px;vertical-align:middle}.mat-calendar-arrow.mat-calendar-invert{transform:rotate(180deg)}[dir=rtl] .mat-calendar-arrow{margin:0 5px 0 0}.mat-calendar-previous-button,.mat-calendar-next-button{position:relative}.mat-calendar-previous-button:after,.mat-calendar-next-button:after{top:0;left:0;right:0;bottom:0;position:absolute;content:\"\";margin:15.5px;border:0 solid currentColor;border-top-width:2px}[dir=rtl] .mat-calendar-previous-button,[dir=rtl] .mat-calendar-next-button{transform:rotate(180deg)}.mat-calendar-previous-button:after{border-left-width:2px;transform:translate(2px) rotate(-45deg)}.mat-calendar-next-button:after{border-right-width:2px;transform:translate(-2px) rotate(45deg)}.mat-calendar-table{border-spacing:0;border-collapse:collapse;width:100%}.mat-calendar-table-header th{text-align:center;padding:0 0 8px}.mat-calendar-table-header-divider{position:relative;height:1px}.mat-calendar-table-header-divider:after{content:\"\";position:absolute;top:0;left:-8px;right:-8px;height:1px}\n"], components: [{ type: NgxMatMonthView, selector: "ngx-mat-month-view", inputs: ["activeDate", "selected", "minDate", "maxDate", "dateFilter", "dateClass", "comparisonStart", "comparisonEnd"], outputs: ["selectedChange", "_userSelection", "activeDateChange"], exportAs: ["ngxMatMonthView"] }, { type: NgxMatYearView, selector: "ngx-mat-year-view", inputs: ["activeDate", "selected", "minDate", "maxDate", "dateFilter"], outputs: ["selectedChange", "monthSelected", "activeDateChange"], exportAs: ["ngxMatYearView"] }, { type: NgxMatMultiYearView, selector: "ngx-mat-multi-year-view", inputs: ["activeDate", "selected", "minDate", "maxDate", "dateFilter"], outputs: ["selectedChange", "yearSelected", "activeDateChange"], exportAs: ["ngxMatMultiYearView"] }], directives: [{ type: i7.CdkPortalOutlet, selector: "[cdkPortalOutlet]", inputs: ["cdkPortalOutlet"], outputs: ["attached"], exportAs: ["cdkPortalOutlet"] }, { type: i1.NgSwitch, selector: "[ngSwitch]", inputs: ["ngSwitch"] }, { type: i1.NgSwitchCase, selector: "[ngSwitchCase]", inputs: ["ngSwitchCase"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatCalendar, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-calendar', host: {
                        'class': 'mat-calendar',
                    }, exportAs: 'ngxMatCalendar', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "\r\n<ng-template [cdkPortalOutlet]=\"_calendarHeaderPortal\"></ng-template>\r\n\r\n<div class=\"mat-calendar-content\" [ngSwitch]=\"currentView\" cdkMonitorSubtreeFocus tabindex=\"-1\">\r\n  <ngx-mat-month-view\r\n      *ngSwitchCase=\"'month'\"\r\n      [(activeDate)]=\"activeDate\"\r\n      [selected]=\"selected\"\r\n      [dateFilter]=\"dateFilter\"\r\n      [maxDate]=\"maxDate\"\r\n      [minDate]=\"minDate\"\r\n      [dateClass]=\"dateClass\"\r\n      (selectedChange)=\"_dateSelected($event)\"\r\n      (_userSelection)=\"_userSelected()\">\r\n  </ngx-mat-month-view>\r\n\r\n  <ngx-mat-year-view\r\n      *ngSwitchCase=\"'year'\"\r\n      [(activeDate)]=\"activeDate\"\r\n      [selected]=\"selected\"\r\n      [dateFilter]=\"dateFilter\"\r\n      [maxDate]=\"maxDate\"\r\n      [minDate]=\"minDate\"\r\n      (monthSelected)=\"_monthSelectedInYearView($event)\"\r\n      (selectedChange)=\"_goToDateInView($event, 'month')\">\r\n  </ngx-mat-year-view>\r\n\r\n  <ngx-mat-multi-year-view\r\n      *ngSwitchCase=\"'multi-year'\"\r\n      [(activeDate)]=\"activeDate\"\r\n      [selected]=\"selected\"\r\n      [dateFilter]=\"dateFilter\"\r\n      [maxDate]=\"maxDate\"\r\n      [minDate]=\"minDate\"\r\n      (yearSelected)=\"_yearSelectedInMultiYearView($event)\"\r\n      (selectedChange)=\"_goToDateInView($event, 'year')\">\r\n  </ngx-mat-multi-year-view>\r\n</div>\r\n", styles: [".mat-calendar{display:block}.mat-calendar-header{padding:8px 8px 0}.mat-calendar-content{padding:0 8px 8px;outline:none}.mat-calendar-controls{display:flex;margin:5% calc(4.71429% - 16px)}.mat-calendar-spacer{flex:1 1 auto}.mat-calendar-period-button{min-width:0}.mat-calendar-arrow{display:inline-block;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top-width:5px;border-top-style:solid;margin:0 0 0 5px;vertical-align:middle}.mat-calendar-arrow.mat-calendar-invert{transform:rotate(180deg)}[dir=rtl] .mat-calendar-arrow{margin:0 5px 0 0}.mat-calendar-previous-button,.mat-calendar-next-button{position:relative}.mat-calendar-previous-button:after,.mat-calendar-next-button:after{top:0;left:0;right:0;bottom:0;position:absolute;content:\"\";margin:15.5px;border:0 solid currentColor;border-top-width:2px}[dir=rtl] .mat-calendar-previous-button,[dir=rtl] .mat-calendar-next-button{transform:rotate(180deg)}.mat-calendar-previous-button:after{border-left-width:2px;transform:translate(2px) rotate(-45deg)}.mat-calendar-next-button:after{border-right-width:2px;transform:translate(-2px) rotate(45deg)}.mat-calendar-table{border-spacing:0;border-collapse:collapse;width:100%}.mat-calendar-table-header th{text-align:center;padding:0 0 8px}.mat-calendar-table-header-divider{position:relative;height:1px}.mat-calendar-table-header-divider:after{content:\"\";position:absolute;top:0;left:-8px;right:-8px;height:1px}\n"] }]
        }], ctorParameters: function () {
        return [{ type: i1$1.MatDatepickerIntl }, { type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [NGX_MAT_DATE_FORMATS]
                    }] }, { type: i0.ChangeDetectorRef }];
    }, propDecorators: { headerComponent: [{
                type: Input
            }], startAt: [{
                type: Input
            }], startView: [{
                type: Input
            }], selected: [{
                type: Input
            }], minDate: [{
                type: Input
            }], maxDate: [{
                type: Input
            }], dateFilter: [{
                type: Input
            }], dateClass: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], yearSelected: [{
                type: Output
            }], monthSelected: [{
                type: Output
            }], _userSelection: [{
                type: Output
            }], monthView: [{
                type: ViewChild,
                args: [NgxMatMonthView]
            }], yearView: [{
                type: ViewChild,
                args: [NgxMatYearView]
            }], multiYearView: [{
                type: ViewChild,
                args: [NgxMatMultiYearView]
            }] } });

class NgxMatTimepickerComponent {
    constructor(_dateAdapter, cd, formBuilder) {
        this._dateAdapter = _dateAdapter;
        this.cd = cd;
        this.formBuilder = formBuilder;
        this.disabled = false;
        this.showSpinners = true;
        this.stepHour = DEFAULT_STEP;
        this.stepMinute = DEFAULT_STEP;
        this.stepSecond = DEFAULT_STEP;
        this.showSeconds = false;
        this.disableMinute = false;
        this.enableMeridian = false;
        this.color = 'primary';
        this.meridian = MERIDIANS.AM;
        this._onChange = () => { };
        this._onTouched = () => { };
        this._destroyed = new Subject();
        this.pattern = PATTERN_INPUT_HOUR;
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        this.form = this.formBuilder.group({
            hour: [{ value: null, disabled: this.disabled }, [Validators.required, Validators.pattern(PATTERN_INPUT_HOUR)]],
            minute: [{ value: null, disabled: this.disabled }, [Validators.required, Validators.pattern(PATTERN_INPUT_MINUTE)]],
            second: [{ value: null, disabled: this.disabled }, [Validators.required, Validators.pattern(PATTERN_INPUT_SECOND)]]
        });
    }
    /** Hour */
    get hour() {
        let val = Number(this.form.controls['hour'].value);
        return isNaN(val) ? 0 : val;
    }
    ;
    get minute() {
        let val = Number(this.form.controls['minute'].value);
        return isNaN(val) ? 0 : val;
    }
    ;
    get second() {
        let val = Number(this.form.controls['second'].value);
        return isNaN(val) ? 0 : val;
    }
    ;
    /** Whether or not the form is valid */
    get valid() {
        return this.form.valid;
    }
    ngOnInit() {
        this.form.valueChanges.pipe(takeUntil(this._destroyed), debounceTime(400)).subscribe(val => {
            this._updateModel();
        });
    }
    ngAfterViewInit() {
        this.inputFields = [
            this.inputHour.nativeElement,
            this.inputMinute.nativeElement,
        ];
        if (this.showSeconds) {
            this.inputFields.push(this.inputSecond.nativeElement);
        }
    }
    ngOnChanges(changes) {
        if (changes.disabled || changes.disableMinute) {
            this._setDisableStates();
        }
    }
    ngOnDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Writes a new value to the element.
     * @param obj
     */
    writeValue(val) {
        if (val != null) {
            this._model = val;
        }
        else {
            this._model = this._dateAdapter.today();
            if (this.defaultTime != null) {
                this._dateAdapter.setTimeByDefaultValues(this._model, this.defaultTime);
            }
        }
        this._updateHourMinuteSecond();
    }
    /** Registers a callback function that is called when the control's value changes in the UI. */
    registerOnChange(fn) {
        this._onChange = fn;
    }
    /**
     * Set the function to be called when the control receives a touch event.
     */
    registerOnTouched(fn) {
        this._onTouched = fn;
    }
    /** Enables or disables the appropriate DOM element */
    setDisabledState(isDisabled) {
        this._disabled = isDisabled;
        this.cd.markForCheck();
    }
    /**
     * Format input
     * @param input
     */
    formatInput(input) {
        input.value = input.value.replace(NUMERIC_REGEX, '');
        // If input length is 2, switch focus to the next <input>
        if (input.value.length === 2) {
            const inputIndex = this.inputFields.findIndex(inputField => inputField === input);
            if (inputIndex !== -1 && inputIndex !== this.inputFields.length - 1) {
                this.inputFields[inputIndex + 1].focus();
            }
        }
    }
    /** Toggle meridian */
    toggleMeridian() {
        this.meridian = (this.meridian === MERIDIANS.AM) ? MERIDIANS.PM : MERIDIANS.AM;
        this.change('hour');
    }
    /** Change property of time */
    change(prop, up) {
        const next = this._getNextValueByProp(prop, up);
        this.form.controls[prop].setValue(formatTwoDigitTimeValue(next), { onlySelf: false, emitEvent: false });
        this._updateModel();
    }
    /** Update controls of form by model */
    _updateHourMinuteSecond() {
        let _hour = this._dateAdapter.getHour(this._model);
        const _minute = this._dateAdapter.getMinute(this._model);
        const _second = this._dateAdapter.getSecond(this._model);
        if (this.enableMeridian) {
            if (_hour >= LIMIT_TIMES.meridian) {
                _hour = _hour - LIMIT_TIMES.meridian;
                this.meridian = MERIDIANS.PM;
            }
            else {
                this.meridian = MERIDIANS.AM;
            }
            if (_hour === 0) {
                _hour = LIMIT_TIMES.meridian;
            }
        }
        this.form.controls['hour'].setValue(formatTwoDigitTimeValue(_hour));
        this.form.controls['minute'].setValue(formatTwoDigitTimeValue(_minute));
        this.form.controls['second'].setValue(formatTwoDigitTimeValue(_second));
    }
    /** Update model */
    _updateModel() {
        let _hour = this.hour;
        if (this.enableMeridian) {
            if (this.meridian === MERIDIANS.AM && _hour === LIMIT_TIMES.meridian) {
                _hour = 0;
            }
            else if (this.meridian === MERIDIANS.PM && _hour !== LIMIT_TIMES.meridian) {
                _hour = _hour + LIMIT_TIMES.meridian;
            }
        }
        this._dateAdapter.setHour(this._model, _hour);
        this._dateAdapter.setMinute(this._model, this.minute);
        this._dateAdapter.setSecond(this._model, this.second);
        this._onChange(this._model);
    }
    /**
     * Get next value by property
     * @param prop
     * @param up
     */
    _getNextValueByProp(prop, up) {
        const keyProp = prop[0].toUpperCase() + prop.slice(1);
        const min = LIMIT_TIMES[`min${keyProp}`];
        let max = LIMIT_TIMES[`max${keyProp}`];
        if (prop === 'hour' && this.enableMeridian) {
            max = LIMIT_TIMES.meridian;
        }
        let next;
        if (up == null) {
            next = this[prop] % (max);
            if (prop === 'hour' && this.enableMeridian) {
                if (next === 0)
                    next = max;
            }
        }
        else {
            next = up ? this[prop] + this[`step${keyProp}`] : this[prop] - this[`step${keyProp}`];
            if (prop === 'hour' && this.enableMeridian) {
                next = next % (max + 1);
                if (next === 0)
                    next = up ? 1 : max;
            }
            else {
                next = next % max;
            }
            if (up) {
                next = next > max ? (next - max + min) : next;
            }
            else {
                next = next < min ? (next - min + max) : next;
            }
        }
        return next;
    }
    /**
     * Set disable states
     */
    _setDisableStates() {
        if (this.disabled) {
            this.form.disable();
        }
        else {
            this.form.enable();
            if (this.disableMinute) {
                this.form.get('minute').disable();
                if (this.showSeconds) {
                    this.form.get('second').disable();
                }
            }
        }
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatTimepickerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatTimepickerComponent, deps: [{ token: NgxMatDateAdapter, optional: true }, { token: i0.ChangeDetectorRef }, { token: i2$1.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatTimepickerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatTimepickerComponent, selector: "ngx-mat-timepicker", inputs: { disabled: "disabled", showSpinners: "showSpinners", stepHour: "stepHour", stepMinute: "stepMinute", stepSecond: "stepSecond", showSeconds: "showSeconds", disableMinute: "disableMinute", enableMeridian: "enableMeridian", defaultTime: "defaultTime", color: "color" }, host: { classAttribute: "ngx-mat-timepicker" }, providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef((() => NgxMatTimepickerComponent)),
            multi: true
        }
    ], viewQueries: [{ propertyName: "inputHour", first: true, predicate: ["inputHour"], descendants: true }, { propertyName: "inputMinute", first: true, predicate: ["inputMinute"], descendants: true }, { propertyName: "inputSecond", first: true, predicate: ["inputSecond"], descendants: true }], exportAs: ["ngxMatTimepicker"], usesOnChanges: true, ngImport: i0, template: "<form [formGroup]=\"form\">\r\n  <table class=\"ngx-mat-timepicker-table\">\r\n    <tbody class=\"ngx-mat-timepicker-tbody\">\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('hour', true)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('minute', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('second', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n\r\n      <tr>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputHour matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" formControlName=\"hour\" autocomplete=\"nope\" name=\"\"\r\n              (keydown.ArrowUp)=\"change('hour', true); $event.preventDefault()\" (focus)=\"inputHour.select()\"\r\n              (keydown.ArrowDown)=\"change('hour', false); $event.preventDefault()\" (blur)=\"change('hour')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputMinute matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"nope\" name=\"\"\r\n              formControlName=\"minute\" (keydown.ArrowUp)=\"change('minute', true); $event.preventDefault()\" (focus)=\"inputMinute.select()\"\r\n              (keydown.ArrowDown)=\"change('minute', false); $event.preventDefault()\" (blur)=\"change('minute')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td *ngIf=\"showSeconds\" class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputSecond matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"nope\" name=\"\"\r\n              formControlName=\"second\" (keydown.ArrowUp)=\"change('second', true); $event.preventDefault()\" (focus)=\"inputSecond.select()\"\r\n              (keydown.ArrowDown)=\"change('second', false); $event.preventDefault()\" (blur)=\"change('second')\">\r\n          </mat-form-field>\r\n        </td>\r\n\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-meridian\">\r\n          <button mat-button (click)=\"toggleMeridian()\" mat-stroked-button [color]=\"color\" [disabled]=\"disabled\">\r\n            {{meridian}}\r\n          </button>\r\n        </td>\r\n      </tr>\r\n\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('hour', false)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('minute', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td *ngIf=\"showSeconds\"></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('second', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n</form>", styles: [".ngx-mat-timepicker{font-size:13px}.ngx-mat-timepicker form{min-width:90px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td{text-align:center}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-spacer{font-weight:bold}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-meridian .mat-button{min-width:64px;line-height:36px;min-width:0;border-radius:50%;width:36px;height:36px;padding:0;flex-shrink:0}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button{height:24px;width:24px;line-height:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button .mat-icon{font-size:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-form-field{width:20px;max-width:20px;text-align:center}\n"], components: [{ type: i3.MatButton, selector: "button[mat-button], button[mat-raised-button], button[mat-icon-button],             button[mat-fab], button[mat-mini-fab], button[mat-stroked-button],             button[mat-flat-button]", inputs: ["disabled", "disableRipple", "color"], exportAs: ["matButton"] }, { type: i4.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { type: i2$2.MatFormField, selector: "mat-form-field", inputs: ["color", "appearance", "hideRequiredMarker", "hintLabel", "floatLabel"], exportAs: ["matFormField"] }], directives: [{ type: i2$1.ɵNgNoValidate, selector: "form:not([ngNoForm]):not([ngNativeValidate])" }, { type: i2$1.NgControlStatusGroup, selector: "[formGroupName],[formArrayName],[ngModelGroup],[formGroup],form:not([ngNoForm]),[ngForm]" }, { type: i2$1.FormGroupDirective, selector: "[formGroup]", inputs: ["formGroup"], outputs: ["ngSubmit"], exportAs: ["ngForm"] }, { type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i7$1.MatInput, selector: "input[matInput], textarea[matInput], select[matNativeControl],      input[matNativeControl], textarea[matNativeControl]", inputs: ["disabled", "id", "placeholder", "required", "type", "errorStateMatcher", "aria-describedby", "value", "readonly"], exportAs: ["matInput"] }, { type: i2$1.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i2$1.MaxLengthValidator, selector: "[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]", inputs: ["maxlength"] }, { type: i2$1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i2$1.FormControlName, selector: "[formControlName]", inputs: ["formControlName", "disabled", "ngModel"], outputs: ["ngModelChange"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatTimepickerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-timepicker', host: {
                        'class': 'ngx-mat-timepicker'
                    }, providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef((() => NgxMatTimepickerComponent)),
                            multi: true
                        }
                    ], exportAs: 'ngxMatTimepicker', encapsulation: ViewEncapsulation.None, template: "<form [formGroup]=\"form\">\r\n  <table class=\"ngx-mat-timepicker-table\">\r\n    <tbody class=\"ngx-mat-timepicker-tbody\">\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('hour', true)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('minute', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('second', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n\r\n      <tr>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputHour matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" formControlName=\"hour\" autocomplete=\"nope\" name=\"\"\r\n              (keydown.ArrowUp)=\"change('hour', true); $event.preventDefault()\" (focus)=\"inputHour.select()\"\r\n              (keydown.ArrowDown)=\"change('hour', false); $event.preventDefault()\" (blur)=\"change('hour')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputMinute matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"nope\" name=\"\"\r\n              formControlName=\"minute\" (keydown.ArrowUp)=\"change('minute', true); $event.preventDefault()\" (focus)=\"inputMinute.select()\"\r\n              (keydown.ArrowDown)=\"change('minute', false); $event.preventDefault()\" (blur)=\"change('minute')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td *ngIf=\"showSeconds\" class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputSecond matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"nope\" name=\"\"\r\n              formControlName=\"second\" (keydown.ArrowUp)=\"change('second', true); $event.preventDefault()\" (focus)=\"inputSecond.select()\"\r\n              (keydown.ArrowDown)=\"change('second', false); $event.preventDefault()\" (blur)=\"change('second')\">\r\n          </mat-form-field>\r\n        </td>\r\n\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-meridian\">\r\n          <button mat-button (click)=\"toggleMeridian()\" mat-stroked-button [color]=\"color\" [disabled]=\"disabled\">\r\n            {{meridian}}\r\n          </button>\r\n        </td>\r\n      </tr>\r\n\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('hour', false)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('minute', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td *ngIf=\"showSeconds\"></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('second', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n</form>", styles: [".ngx-mat-timepicker{font-size:13px}.ngx-mat-timepicker form{min-width:90px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td{text-align:center}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-spacer{font-weight:bold}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-meridian .mat-button{min-width:64px;line-height:36px;min-width:0;border-radius:50%;width:36px;height:36px;padding:0;flex-shrink:0}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button{height:24px;width:24px;line-height:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button .mat-icon{font-size:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-form-field{width:20px;max-width:20px;text-align:center}\n"] }]
        }], ctorParameters: function () {
        return [{ type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: i0.ChangeDetectorRef }, { type: i2$1.FormBuilder }];
    }, propDecorators: { disabled: [{
                type: Input
            }], showSpinners: [{
                type: Input
            }], stepHour: [{
                type: Input
            }], stepMinute: [{
                type: Input
            }], stepSecond: [{
                type: Input
            }], showSeconds: [{
                type: Input
            }], disableMinute: [{
                type: Input
            }], enableMeridian: [{
                type: Input
            }], defaultTime: [{
                type: Input
            }], color: [{
                type: Input
            }], inputHour: [{
                type: ViewChild,
                args: ["inputHour"]
            }], inputMinute: [{
                type: ViewChild,
                args: ["inputMinute"]
            }], inputSecond: [{
                type: ViewChild,
                args: ["inputSecond"]
            }] } });

/** Used to generate a unique ID for each datepicker instance. */
let datepickerUid = 0;
// Boilerplate for applying mixins to MatDatepickerContent.
/** @docs-private */
const _MatDatetimepickerContentBase = mixinColor(class {
    constructor(_elementRef) {
        this._elementRef = _elementRef;
    }
});
/**
 * Component used as the content for the datepicker dialog and popup. We use this instead of using
 * NgxMatCalendar directly as the content so we can control the initial focus. This also gives us a
 * place to put additional features of the popup that are not part of the calendar itself in the
 * future. (e.g. confirmation buttons).
 * @docs-private
 */
class NgxMatDatetimeContent extends _MatDatetimepickerContentBase {
    constructor(elementRef, cd, _viewContainerRef) {
        super(elementRef);
        this.cd = cd;
        this._viewContainerRef = _viewContainerRef;
    }
    /** Whether or not the selected date is valid (min,max...) */
    get valid() {
        if (this.datepicker.hideTime)
            return this.datepicker.valid;
        return this._timePicker && this._timePicker.valid && this.datepicker.valid;
    }
    get isViewMonth() {
        if (!this._calendar || this._calendar.currentView == null)
            return true;
        return this._calendar.currentView == 'month';
    }
    ngAfterViewInit() {
        this._calendar.focusActiveCell();
        if (this.datepicker._customIcon) {
            this._templateCustomIconPortal = new TemplatePortal(this.datepicker._customIcon, this._viewContainerRef);
            this.cd.detectChanges();
        }
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimeContent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimeContent, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimeContent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatDatetimeContent, selector: "ngx-mat-datetime-content", inputs: { color: "color" }, host: { properties: { "@transformPanel": "\"enter\"", "class.mat-datepicker-content-touch": "datepicker.touchUi" }, classAttribute: "mat-datepicker-content" }, viewQueries: [{ propertyName: "_calendar", first: true, predicate: NgxMatCalendar, descendants: true }, { propertyName: "_timePicker", first: true, predicate: NgxMatTimepickerComponent, descendants: true }], exportAs: ["ngxMatDatetimeContent"], usesInheritance: true, ngImport: i0, template: "<ngx-mat-calendar cdkTrapFocus [id]=\"datepicker.id\" [ngClass]=\"datepicker.panelClass\" [startAt]=\"datepicker.startAt\"\r\n    [startView]=\"datepicker.startView\" [minDate]=\"datepicker._minDate\" [maxDate]=\"datepicker._maxDate\"\r\n    [dateFilter]=\"datepicker._dateFilter\" [headerComponent]=\"datepicker.calendarHeaderComponent\"\r\n    [selected]=\"datepicker._selected\" [dateClass]=\"datepicker.dateClass\" [@fadeInCalendar]=\"'enter'\"\r\n    (selectedChange)=\"datepicker.select($event)\" (yearSelected)=\"datepicker._selectYear($event)\"\r\n    (monthSelected)=\"datepicker._selectMonth($event)\">\r\n</ngx-mat-calendar>\r\n<ng-container *ngIf=\"isViewMonth\">\r\n    <div *ngIf=\"!datepicker._hideTime\" class=\"time-container\" [class.disable-seconds]=\"!datepicker._showSeconds\">\r\n        <ngx-mat-timepicker [showSpinners]=\"datepicker._showSpinners\" [showSeconds]=\"datepicker._showSeconds\"\r\n            [disabled]=\"datepicker._disabled\" [stepHour]=\"datepicker._stepHour\" [stepMinute]=\"datepicker._stepMinute\"\r\n            [stepSecond]=\"datepicker._stepSecond\" [(ngModel)]=\"datepicker._selected\" [color]=\"datepicker._color\"\r\n            [enableMeridian]=\"datepicker._enableMeridian\" [disableMinute]=\"datepicker._disableMinute\">\r\n        </ngx-mat-timepicker>\r\n    </div>\r\n    <div class=\"actions\">\r\n        <button mat-button (click)=\"datepicker.ok()\" mat-stroked-button [color]=\"datepicker._color\" cdkFocusInitial\r\n            [disabled]=\"!valid\">\r\n            <mat-icon *ngIf=\"!datepicker._customIcon\">done</mat-icon>\r\n            <ng-template [cdkPortalOutlet]=\"_templateCustomIconPortal\"></ng-template>\r\n        </button>\r\n    </div>\r\n</ng-container>", styles: [".mat-datepicker-content{display:block;border-radius:4px;box-shadow:0 2px 4px -1px #0003,0 4px 5px #00000024,0 1px 10px #0000001f}.mat-datepicker-content .mat-calendar{width:296px}.mat-datepicker-content .time-container{display:flex;position:relative;padding-top:5px;justify-content:center}.mat-datepicker-content .time-container.disable-seconds .ngx-mat-timepicker .table{margin-left:9px}.mat-datepicker-content .time-container:before{content:\"\";position:absolute;top:0;left:0;right:0;height:1px;background-color:#0000001f}.mat-datepicker-content .actions{display:flex;padding:5px 15px 10px;justify-content:flex-end}\n"], components: [{ type: NgxMatCalendar, selector: "ngx-mat-calendar", inputs: ["headerComponent", "startAt", "startView", "selected", "minDate", "maxDate", "dateFilter", "dateClass"], outputs: ["selectedChange", "yearSelected", "monthSelected", "_userSelection"], exportAs: ["ngxMatCalendar"] }, { type: NgxMatTimepickerComponent, selector: "ngx-mat-timepicker", inputs: ["disabled", "showSpinners", "stepHour", "stepMinute", "stepSecond", "showSeconds", "disableMinute", "enableMeridian", "defaultTime", "color"], exportAs: ["ngxMatTimepicker"] }, { type: i3.MatButton, selector: "button[mat-button], button[mat-raised-button], button[mat-icon-button],             button[mat-fab], button[mat-mini-fab], button[mat-stroked-button],             button[mat-flat-button]", inputs: ["disabled", "disableRipple", "color"], exportAs: ["matButton"] }, { type: i4.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }], directives: [{ type: i1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i2$1.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i2$1.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i7.CdkPortalOutlet, selector: "[cdkPortalOutlet]", inputs: ["cdkPortalOutlet"], outputs: ["attached"], exportAs: ["cdkPortalOutlet"] }], animations: [
        matDatepickerAnimations.transformPanel,
        matDatepickerAnimations.fadeInCalendar,
    ], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimeContent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-datetime-content', host: {
                        'class': 'mat-datepicker-content',
                        '[@transformPanel]': '"enter"',
                        '[class.mat-datepicker-content-touch]': 'datepicker.touchUi',
                    }, animations: [
                        matDatepickerAnimations.transformPanel,
                        matDatepickerAnimations.fadeInCalendar,
                    ], exportAs: 'ngxMatDatetimeContent', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, inputs: ['color'], template: "<ngx-mat-calendar cdkTrapFocus [id]=\"datepicker.id\" [ngClass]=\"datepicker.panelClass\" [startAt]=\"datepicker.startAt\"\r\n    [startView]=\"datepicker.startView\" [minDate]=\"datepicker._minDate\" [maxDate]=\"datepicker._maxDate\"\r\n    [dateFilter]=\"datepicker._dateFilter\" [headerComponent]=\"datepicker.calendarHeaderComponent\"\r\n    [selected]=\"datepicker._selected\" [dateClass]=\"datepicker.dateClass\" [@fadeInCalendar]=\"'enter'\"\r\n    (selectedChange)=\"datepicker.select($event)\" (yearSelected)=\"datepicker._selectYear($event)\"\r\n    (monthSelected)=\"datepicker._selectMonth($event)\">\r\n</ngx-mat-calendar>\r\n<ng-container *ngIf=\"isViewMonth\">\r\n    <div *ngIf=\"!datepicker._hideTime\" class=\"time-container\" [class.disable-seconds]=\"!datepicker._showSeconds\">\r\n        <ngx-mat-timepicker [showSpinners]=\"datepicker._showSpinners\" [showSeconds]=\"datepicker._showSeconds\"\r\n            [disabled]=\"datepicker._disabled\" [stepHour]=\"datepicker._stepHour\" [stepMinute]=\"datepicker._stepMinute\"\r\n            [stepSecond]=\"datepicker._stepSecond\" [(ngModel)]=\"datepicker._selected\" [color]=\"datepicker._color\"\r\n            [enableMeridian]=\"datepicker._enableMeridian\" [disableMinute]=\"datepicker._disableMinute\">\r\n        </ngx-mat-timepicker>\r\n    </div>\r\n    <div class=\"actions\">\r\n        <button mat-button (click)=\"datepicker.ok()\" mat-stroked-button [color]=\"datepicker._color\" cdkFocusInitial\r\n            [disabled]=\"!valid\">\r\n            <mat-icon *ngIf=\"!datepicker._customIcon\">done</mat-icon>\r\n            <ng-template [cdkPortalOutlet]=\"_templateCustomIconPortal\"></ng-template>\r\n        </button>\r\n    </div>\r\n</ng-container>", styles: [".mat-datepicker-content{display:block;border-radius:4px;box-shadow:0 2px 4px -1px #0003,0 4px 5px #00000024,0 1px 10px #0000001f}.mat-datepicker-content .mat-calendar{width:296px}.mat-datepicker-content .time-container{display:flex;position:relative;padding-top:5px;justify-content:center}.mat-datepicker-content .time-container.disable-seconds .ngx-mat-timepicker .table{margin-left:9px}.mat-datepicker-content .time-container:before{content:\"\";position:absolute;top:0;left:0;right:0;height:1px;background-color:#0000001f}.mat-datepicker-content .actions{display:flex;padding:5px 15px 10px;justify-content:flex-end}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i0.ViewContainerRef }]; }, propDecorators: { _calendar: [{
                type: ViewChild,
                args: [NgxMatCalendar]
            }], _timePicker: [{
                type: ViewChild,
                args: [NgxMatTimepickerComponent]
            }] } });
// TODO(mmalerba): We use a component instead of a directive here so the user can use implicit
// template reference variables (e.g. #d vs #d="matDatepicker"). We can change this to a directive
// if angular adds support for `exportAs: '$implicit'` on directives.
/** Component responsible for managing the datepicker popup/dialog. */
class NgxMatDatetimePicker {
    constructor(_dialog, _overlay, _ngZone, _viewContainerRef, scrollStrategy, _dateAdapter, _dir, _document) {
        this._dialog = _dialog;
        this._overlay = _overlay;
        this._ngZone = _ngZone;
        this._viewContainerRef = _viewContainerRef;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        this._document = _document;
        /** The view that the calendar should start in. */
        this.startView = 'month';
        this._defaultColor = 'primary';
        this._touchUi = false;
        this._hideTime = false;
        /**
         * Emits selected year in multiyear view.
         * This doesn't imply a change on the selected date.
         */
        this.yearSelected = new EventEmitter();
        /**
         * Emits selected month in year view.
         * This doesn't imply a change on the selected date.
         */
        this.monthSelected = new EventEmitter();
        /** Emits when the datepicker has been opened. */
        this.openedStream = new EventEmitter();
        /** Emits when the datepicker has been closed. */
        this.closedStream = new EventEmitter();
        this._opened = false;
        this._showSpinners = true;
        this._showSeconds = false;
        this._stepHour = DEFAULT_STEP;
        this._stepMinute = DEFAULT_STEP;
        this._stepSecond = DEFAULT_STEP;
        this._enableMeridian = false;
        this._hasBackdrop = true;
        /** The id for the datepicker calendar. */
        this.id = `mat-datepicker-${datepickerUid++}`;
        this._validSelected = null;
        /** The element that was focused before the datepicker was opened. */
        this._focusedElementBeforeOpen = null;
        /** Subscription to value changes in the associated input element. */
        this._inputSubscription = Subscription.EMPTY;
        /** Emits when the datepicker is disabled. */
        this.stateChanges = new Subject();
        /** Emits new selected date when selected date changes. */
        this._selectedChanged = new Subject();
        /** The form control validator for the min date. */
        this._minValidator = () => {
            return (!this._minDate || !this._selected ||
                this._dateAdapter.compareDateWithTime(this._minDate, this._selected, this.showSeconds) <= 0) ?
                null : { 'matDatetimePickerMin': { 'min': this._minDate, 'actual': this._selected } };
        };
        /** The form control validator for the max date. */
        this._maxValidator = () => {
            return (!this._maxDate || !this._selected ||
                this._dateAdapter.compareDateWithTime(this._maxDate, this._selected, this.showSeconds) >= 0) ?
                null : { 'matDatetimePickerMax': { 'max': this._maxDate, 'actual': this._selected } };
        };
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        this._scrollStrategy = scrollStrategy;
    }
    /** The date to open the calendar to initially. */
    get startAt() {
        // If an explicit startAt is set we start there, otherwise we start at whatever the currently
        // selected value is.
        return this._startAt || (this.datepickerInput ? this.datepickerInput.value : null);
    }
    set startAt(value) {
        this._startAt = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    /** Default Color palette to use on the datepicker's calendar. */
    get defaultColor() {
        return this._defaultColor;
    }
    set defaultColor(value) {
        this._defaultColor = value;
    }
    /** Color palette to use on the datepicker's calendar. */
    get color() {
        return this._color ||
            (this.datepickerInput ? this.datepickerInput._getThemePalette() : 'primary');
    }
    set color(value) {
        this._color = value;
    }
    /**
     * Whether the calendar UI is in touch mode. In touch mode the calendar opens in a dialog rather
     * than a popup and elements have more padding to allow for bigger touch targets.
     */
    get touchUi() { return this._touchUi; }
    set touchUi(value) {
        this._touchUi = coerceBooleanProperty(value);
    }
    get hideTime() { return this._hideTime; }
    set hideTime(value) {
        this._hideTime = coerceBooleanProperty(value);
    }
    /** Whether the datepicker pop-up should be disabled. */
    get disabled() {
        return this._disabled === undefined && this.datepickerInput ?
            this.datepickerInput.disabled : !!this._disabled;
    }
    set disabled(value) {
        const newValue = coerceBooleanProperty(value);
        if (newValue !== this._disabled) {
            this._disabled = newValue;
            this.stateChanges.next(newValue);
        }
    }
    /** Whether the calendar is open. */
    get opened() { return this._opened; }
    set opened(value) { value ? this.open() : this.close(); }
    /** Whether the timepicker'spinners is shown. */
    get showSpinners() { return this._showSpinners; }
    set showSpinners(value) { this._showSpinners = value; }
    /** Whether the second part is disabled. */
    get showSeconds() { return this._showSeconds; }
    set showSeconds(value) { this._showSeconds = value; }
    /** Step hour */
    get stepHour() { return this._stepHour; }
    set stepHour(value) { this._stepHour = value; }
    /** Step minute */
    get stepMinute() { return this._stepMinute; }
    set stepMinute(value) { this._stepMinute = value; }
    /** Step second */
    get stepSecond() { return this._stepSecond; }
    set stepSecond(value) { this._stepSecond = value; }
    /** Enable meridian */
    get enableMeridian() { return this._enableMeridian; }
    set enableMeridian(value) { this._enableMeridian = value; }
    /** disable minute */
    get disableMinute() { return this._disableMinute; }
    set disableMinute(value) { this._disableMinute = value; }
    /** Step second */
    get defaultTime() { return this._defaultTime; }
    set defaultTime(value) { this._defaultTime = value; }
    /** The currently selected date. */
    get _selected() { return this._validSelected; }
    set _selected(value) { this._validSelected = value; }
    /** The minimum selectable date. */
    get _minDate() {
        return this.datepickerInput && this.datepickerInput.min;
    }
    /** The maximum selectable date. */
    get _maxDate() {
        return this.datepickerInput && this.datepickerInput.max;
    }
    get valid() {
        const minValidators = this._minValidator();
        const maxValidators = this._maxValidator();
        return minValidators == null && maxValidators == null;
    }
    get _dateFilter() {
        return this.datepickerInput && this.datepickerInput._dateFilter;
    }
    ngOnDestroy() {
        this.close();
        if (this._popupRef) {
            this._popupRef.dispose();
            this._popupComponentRef = null;
        }
        this._inputSubscription.unsubscribe();
        this.stateChanges.complete();
    }
    /** Selects the given date */
    select(date) {
        this._dateAdapter.copyTime(date, this._selected);
        this._selected = date;
    }
    /** Emits the selected year in multiyear view */
    _selectYear(normalizedYear) {
        this.yearSelected.emit(normalizedYear);
    }
    /** Emits selected month in year view */
    _selectMonth(normalizedMonth) {
        this.monthSelected.emit(normalizedMonth);
    }
    /** OK button handler and close*/
    ok() {
        const cloned = this._dateAdapter.clone(this._selected);
        this._selectedChanged.next(cloned);
        this.close();
    }
    /** Cancel and close */
    cancel() {
        this._selected = this._rawValue;
        this.close();
    }
    /**
     * Register an input with this datepicker.
     * @param input The datepicker input to register with this datepicker.
     */
    _registerInput(input) {
        if (this.datepickerInput) {
            throw Error('A NgxMatDatepicker can only be associated with a single input.');
        }
        this.datepickerInput = input;
        this._inputSubscription =
            this.datepickerInput._valueChange.subscribe((value) => this._selected = value);
    }
    /** Open the calendar. */
    open() {
        this._rawValue = this._selected != null
            ? this._dateAdapter.clone(this._selected) : null;
        if (this._selected == null) {
            this._selected = this._dateAdapter.today();
            if (this.defaultTime != null) {
                this._dateAdapter.setTimeByDefaultValues(this._selected, this.defaultTime);
            }
        }
        if (this._opened || this.disabled) {
            return;
        }
        if (!this.datepickerInput) {
            throw Error('Attempted to open an NgxMatDatepicker with no associated input.');
        }
        if (this._document) {
            this._focusedElementBeforeOpen = this._document.activeElement;
        }
        this.touchUi ? this._openAsDialog() : this._openAsPopup();
        this._opened = true;
        this.openedStream.emit();
    }
    /** Close the calendar. */
    close() {
        if (!this._opened) {
            return;
        }
        if (this._popupRef && this._popupRef.hasAttached()) {
            this._popupRef.detach();
        }
        if (this._dialogRef) {
            this._dialogRef.close();
            this._dialogRef = null;
        }
        if (this._calendarPortal && this._calendarPortal.isAttached) {
            this._calendarPortal.detach();
        }
        const completeClose = () => {
            // The `_opened` could've been reset already if
            // we got two events in quick succession.
            if (this._opened) {
                this._opened = false;
                this.closedStream.emit();
                this._focusedElementBeforeOpen = null;
            }
        };
        if (this._focusedElementBeforeOpen &&
            typeof this._focusedElementBeforeOpen.focus === 'function') {
            // Because IE moves focus asynchronously, we can't count on it being restored before we've
            // marked the datepicker as closed. If the event fires out of sequence and the element that
            // we're refocusing opens the datepicker on focus, the user could be stuck with not being
            // able to close the calendar at all. We work around it by making the logic, that marks
            // the datepicker as closed, async as well.
            this._focusedElementBeforeOpen.focus();
            setTimeout(completeClose);
        }
        else {
            completeClose();
        }
    }
    /** Open the calendar as a dialog. */
    _openAsDialog() {
        // Usually this would be handled by `open` which ensures that we can only have one overlay
        // open at a time, however since we reset the variables in async handlers some overlays
        // may slip through if the user opens and closes multiple times in quick succession (e.g.
        // by holding down the enter key).
        if (this._dialogRef) {
            this._dialogRef.close();
        }
        this._dialogRef = this._dialog.open(NgxMatDatetimeContent, {
            direction: this._dir ? this._dir.value : 'ltr',
            viewContainerRef: this._viewContainerRef,
            panelClass: 'mat-datepicker-dialog',
            hasBackdrop: this._hasBackdrop
        });
        this._dialogRef.afterClosed().subscribe(() => this.close());
        this._dialogRef.componentInstance.datepicker = this;
        this._setColor();
    }
    /** Open the calendar as a popup. */
    _openAsPopup() {
        if (!this._calendarPortal) {
            this._calendarPortal = new ComponentPortal(NgxMatDatetimeContent, this._viewContainerRef);
        }
        if (!this._popupRef) {
            this._createPopup();
        }
        if (!this._popupRef.hasAttached()) {
            this._popupComponentRef = this._popupRef.attach(this._calendarPortal);
            this._popupComponentRef.instance.datepicker = this;
            this._setColor();
            // Update the position once the calendar has rendered.
            this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
                this._popupRef.updatePosition();
            });
        }
    }
    /** Create the popup. */
    _createPopup() {
        const overlayConfig = new OverlayConfig({
            positionStrategy: this._createPopupPositionStrategy(),
            hasBackdrop: this._hasBackdrop,
            backdropClass: 'mat-overlay-transparent-backdrop',
            direction: this._dir,
            scrollStrategy: this._scrollStrategy(),
            panelClass: 'mat-datepicker-popup',
        });
        this._popupRef = this._overlay.create(overlayConfig);
        this._popupRef.overlayElement.setAttribute('role', 'dialog');
        merge(this._popupRef.backdropClick(), this._popupRef.detachments(), this._popupRef.keydownEvents().pipe(filter(event => {
            // Closing on alt + up is only valid when there's an input associated with the datepicker.
            return event.keyCode === ESCAPE ||
                (this.datepickerInput && event.altKey && event.keyCode === UP_ARROW);
        }))).subscribe(event => {
            if (event) {
                event.preventDefault();
            }
            (this._hasBackdrop && event) ? this.cancel() : this.close();
        });
    }
    /** Create the popup PositionStrategy. */
    _createPopupPositionStrategy() {
        return this._overlay.position()
            .flexibleConnectedTo(this.datepickerInput.getConnectedOverlayOrigin())
            .withTransformOriginOn('.mat-datepicker-content')
            .withFlexibleDimensions(false)
            .withViewportMargin(8)
            .withLockedPosition()
            .withPositions([
            {
                originX: 'start',
                originY: 'bottom',
                overlayX: 'start',
                overlayY: 'top'
            },
            {
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'bottom'
            },
            {
                originX: 'end',
                originY: 'bottom',
                overlayX: 'end',
                overlayY: 'top'
            },
            {
                originX: 'end',
                originY: 'top',
                overlayX: 'end',
                overlayY: 'bottom'
            }
        ]);
    }
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    _getValidDateOrNull(obj) {
        return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
    }
    /** Passes the current theme color along to the calendar overlay. */
    _setColor() {
        const color = this.color;
        if (this._popupComponentRef) {
            this._popupComponentRef.instance.color = color;
        }
        if (this._dialogRef) {
            this._dialogRef.componentInstance.color = color;
        }
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimePicker.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimePicker, deps: [{ token: i8.MatDialog }, { token: i9.Overlay }, { token: i0.NgZone }, { token: i0.ViewContainerRef }, { token: MAT_DATEPICKER_SCROLL_STRATEGY }, { token: NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }, { token: DOCUMENT, optional: true }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimePicker.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatDatetimePicker, selector: "ngx-mat-datetime-picker", inputs: { calendarHeaderComponent: "calendarHeaderComponent", startAt: "startAt", startView: "startView", defaultColor: "defaultColor", color: "color", touchUi: "touchUi", hideTime: "hideTime", disabled: "disabled", panelClass: "panelClass", dateClass: "dateClass", opened: "opened", showSpinners: "showSpinners", showSeconds: "showSeconds", stepHour: "stepHour", stepMinute: "stepMinute", stepSecond: "stepSecond", enableMeridian: "enableMeridian", disableMinute: "disableMinute", defaultTime: "defaultTime" }, outputs: { yearSelected: "yearSelected", monthSelected: "monthSelected", openedStream: "opened", closedStream: "closed" }, queries: [{ propertyName: "_customIcon", first: true, predicate: TemplateRef, descendants: true }], exportAs: ["ngxMatDatetimePicker"], ngImport: i0, template: '', isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimePicker, decorators: [{
            type: Component,
            args: [{
                    selector: 'ngx-mat-datetime-picker',
                    template: '',
                    exportAs: 'ngxMatDatetimePicker',
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: function () {
        return [{ type: i8.MatDialog }, { type: i9.Overlay }, { type: i0.NgZone }, { type: i0.ViewContainerRef }, { type: undefined, decorators: [{
                        type: Inject,
                        args: [MAT_DATEPICKER_SCROLL_STRATEGY]
                    }] }, { type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: i2.Directionality, decorators: [{
                        type: Optional
                    }] }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [DOCUMENT]
                    }] }];
    }, propDecorators: { calendarHeaderComponent: [{
                type: Input
            }], _customIcon: [{
                type: ContentChild,
                args: [TemplateRef]
            }], startAt: [{
                type: Input
            }], startView: [{
                type: Input
            }], defaultColor: [{
                type: Input
            }], color: [{
                type: Input
            }], touchUi: [{
                type: Input
            }], hideTime: [{
                type: Input
            }], disabled: [{
                type: Input
            }], yearSelected: [{
                type: Output
            }], monthSelected: [{
                type: Output
            }], panelClass: [{
                type: Input
            }], dateClass: [{
                type: Input
            }], openedStream: [{
                type: Output,
                args: ['opened']
            }], closedStream: [{
                type: Output,
                args: ['closed']
            }], opened: [{
                type: Input
            }], showSpinners: [{
                type: Input
            }], showSeconds: [{
                type: Input
            }], stepHour: [{
                type: Input
            }], stepMinute: [{
                type: Input
            }], stepSecond: [{
                type: Input
            }], enableMeridian: [{
                type: Input
            }], disableMinute: [{
                type: Input
            }], defaultTime: [{
                type: Input
            }] } });

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @docs-private */
const MAT_DATEPICKER_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NgxMatDatetimeInput),
    multi: true
};
/** @docs-private */
const MAT_DATEPICKER_VALIDATORS = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => NgxMatDatetimeInput),
    multi: true
};
/**
 * An event used for datepicker input and change events. We don't always have access to a native
 * input or change event because the event may have been triggered by the user clicking on the
 * calendar popup. For consistency, we always use MatDatetimePickerInputEvent instead.
 */
class MatDatetimePickerInputEvent {
    constructor(
    /** Reference to the datepicker input component that emitted the event. */
    target, 
    /** Reference to the native input element associated with the datepicker input. */
    targetElement) {
        this.target = target;
        this.targetElement = targetElement;
        this.value = this.target.value;
    }
}
/** Directive used to connect an input to a matDatetimePicker. */
class NgxMatDatetimeInput {
    constructor(_elementRef, _dateAdapter, _dateFormats, _formField) {
        this._elementRef = _elementRef;
        this._dateAdapter = _dateAdapter;
        this._dateFormats = _dateFormats;
        this._formField = _formField;
        /** Emits when a `change` event is fired on this `<input>`. */
        this.dateChange = new EventEmitter();
        /** Emits when an `input` event is fired on this `<input>`. */
        this.dateInput = new EventEmitter();
        /** Emits when the value changes (either due to user input or programmatic change). */
        this._valueChange = new EventEmitter();
        /** Emits when the disabled state has changed */
        this.stateChanges = new EventEmitter();
        this._onTouched = () => { };
        this._cvaOnChange = () => { };
        this._validatorOnChange = () => { };
        this._datepickerSubscription = Subscription.EMPTY;
        this._localeSubscription = Subscription.EMPTY;
        /** The form control validator for whether the input parses. */
        this._parseValidator = () => {
            return this._lastValueValid ?
                null : { 'matDatetimePickerParse': { 'text': this._elementRef.nativeElement.value } };
        };
        /** The form control validator for the min date. */
        this._minValidator = (control) => {
            const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
            return (!this.min || !controlValue ||
                this._dateAdapter.compareDateWithTime(this.min, controlValue, this._datepicker.showSeconds) <= 0) ?
                null : { 'matDatetimePickerMin': { 'min': this.min, 'actual': controlValue } };
        };
        /** The form control validator for the max date. */
        this._maxValidator = (control) => {
            const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
            return (!this.max || !controlValue ||
                this._dateAdapter.compareDateWithTime(this.max, controlValue, this._datepicker.showSeconds) >= 0) ?
                null : { 'matDatetimePickerMax': { 'max': this.max, 'actual': controlValue } };
        };
        /** The form control validator for the date filter. */
        this._filterValidator = (control) => {
            const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
            return !this._dateFilter || !controlValue || this._dateFilter(controlValue) ?
                null : { 'matDatetimePickerFilter': true };
        };
        /** The combined form control validator for this input. */
        this._validator = Validators.compose([this._parseValidator, this._minValidator, this._maxValidator, this._filterValidator]);
        /** Whether the last value set on the input was valid. */
        this._lastValueValid = false;
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        if (!this._dateFormats) {
            throw createMissingDateImplError('NGX_MAT_DATE_FORMATS');
        }
        // Update the displayed date when the locale changes.
        this._localeSubscription = _dateAdapter.localeChanges.subscribe(() => {
            this.value = this.value;
        });
    }
    /** The datepicker that this input is associated with. */
    set ngxMatDatetimePicker(value) {
        if (!value) {
            return;
        }
        this._datepicker = value;
        this._datepicker._registerInput(this);
        this._datepickerSubscription.unsubscribe();
        this._datepickerSubscription = this._datepicker._selectedChanged.subscribe((selected) => {
            this.value = selected;
            this._cvaOnChange(selected);
            this._onTouched();
            this.dateInput.emit(new MatDatetimePickerInputEvent(this, this._elementRef.nativeElement));
            this.dateChange.emit(new MatDatetimePickerInputEvent(this, this._elementRef.nativeElement));
        });
    }
    /** Function that can be used to filter out dates within the datepicker. */
    set ngxMatDatetimePickerFilter(value) {
        this._dateFilter = value;
        this._validatorOnChange();
    }
    /** The value of the input. */
    get value() { return this._value; }
    set value(value) {
        value = this._dateAdapter.deserialize(value);
        this._lastValueValid = !value || this._dateAdapter.isValid(value);
        value = this._getValidDateOrNull(value);
        const oldDate = this.value;
        this._value = value;
        this._formatValue(value);
        if (!this._dateAdapter.sameDate(oldDate, value)) {
            this._valueChange.emit(value);
        }
    }
    /** The minimum valid date. */
    get min() { return this._min; }
    set min(value) {
        this._min = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
        this._validatorOnChange();
    }
    /** The maximum valid date. */
    get max() { return this._max; }
    set max(value) {
        this._max = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
        this._validatorOnChange();
    }
    /** Whether the datepicker-input is disabled. */
    get disabled() { return !!this._disabled; }
    set disabled(value) {
        const newValue = value != null && `${value}` !== 'false';
        const element = this._elementRef.nativeElement;
        if (this._disabled !== newValue) {
            this._disabled = newValue;
            this.stateChanges.emit(undefined);
        }
        // We need to null check the `blur` method, because it's undefined during SSR.
        if (newValue && element.blur) {
            // Normally, native input elements automatically blur if they turn disabled. This behavior
            // is problematic, because it would mean that it triggers another change detection cycle,
            // which then causes a changed after checked error if the input element was focused before.
            element.blur();
        }
    }
    ngOnDestroy() {
        this._datepickerSubscription.unsubscribe();
        this._localeSubscription.unsubscribe();
        this._valueChange.complete();
        this.stateChanges.complete();
    }
    /** @docs-private */
    registerOnValidatorChange(fn) {
        this._validatorOnChange = fn;
    }
    /** @docs-private */
    validate(c) {
        return this._validator ? this._validator(c) : null;
    }
    /**
     * @deprecated
     * @breaking-change 8.0.0 Use `getConnectedOverlayOrigin` instead
     */
    getPopupConnectionElementRef() {
        return this.getConnectedOverlayOrigin();
    }
    /**
     * Gets the element that the datepicker popup should be connected to.
     * @return The element to connect the popup to.
     */
    getConnectedOverlayOrigin() {
        return this._formField ? this._formField.getConnectedOverlayOrigin() : this._elementRef;
    }
    // Implemented as part of ControlValueAccessor.
    writeValue(value) {
        this.value = value;
    }
    // Implemented as part of ControlValueAccessor.
    registerOnChange(fn) {
        this._cvaOnChange = fn;
    }
    // Implemented as part of ControlValueAccessor.
    registerOnTouched(fn) {
        this._onTouched = fn;
    }
    // Implemented as part of ControlValueAccessor.
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    _onKeydown(event) {
        const isAltDownArrow = event.altKey && event.keyCode === DOWN_ARROW;
        if (this._datepicker && isAltDownArrow && !this._elementRef.nativeElement.readOnly) {
            this._datepicker.open();
            event.preventDefault();
        }
    }
    _onInput(value) {
        const lastValueWasValid = this._lastValueValid;
        let date = this._dateAdapter.parse(value, this._dateFormats.parse.dateInput);
        this._lastValueValid = !date || this._dateAdapter.isValid(date);
        date = this._getValidDateOrNull(date);
        const isSameTime = this._dateAdapter.isSameTime(date, this._value);
        if ((date != null && (!isSameTime || !this._dateAdapter.sameDate(date, this._value)))
            || (date == null && this._value != null)) {
            this._value = date;
            this._cvaOnChange(date);
            this._valueChange.emit(date);
            this.dateInput.emit(new MatDatetimePickerInputEvent(this, this._elementRef.nativeElement));
        }
        else if (lastValueWasValid !== this._lastValueValid) {
            this._validatorOnChange();
        }
    }
    _onChange() {
        this.dateChange.emit(new MatDatetimePickerInputEvent(this, this._elementRef.nativeElement));
    }
    /** Returns the palette used by the input's form field, if any. */
    _getThemePalette() {
        return this._formField ? this._formField.color : undefined;
    }
    /** Handles blur events on the input. */
    _onBlur() {
        // Reformat the input only if we have a valid value.
        if (this.value) {
            this._formatValue(this.value);
        }
        this._onTouched();
    }
    /** Handles focus events on the input. */
    _onFocus() {
        var _a;
        // Close datetime picker if opened
        if ((_a = this._datepicker) === null || _a === void 0 ? void 0 : _a.opened) {
            this._datepicker.cancel();
        }
        else if (this._datepicker && !this._datepicker.opened) {
            this._valueChange.emit(this._value);
            this._datepicker.open();
        }
    }
    /** Formats a value and sets it on the input element. */
    _formatValue(value) {
        this._elementRef.nativeElement.value =
            value ? this._dateAdapter.format(value, this._dateFormats.display.dateInput) : '';
    }
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    _getValidDateOrNull(obj) {
        return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimeInput.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimeInput, deps: [{ token: i0.ElementRef }, { token: NgxMatDateAdapter, optional: true }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i2$2.MatFormField, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimeInput.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatDatetimeInput, selector: "input[ngxMatDatetimePicker]", inputs: { ngxMatDatetimePicker: "ngxMatDatetimePicker", ngxMatDatetimePickerFilter: "ngxMatDatetimePickerFilter", value: "value", min: "min", max: "max", disabled: "disabled" }, outputs: { dateChange: "dateChange", dateInput: "dateInput" }, host: { listeners: { "input": "_onInput($event.target.value)", "change": "_onChange()", "blur": "_onBlur()", "focus": "_onFocus()", "dblclick": "_onFocus()", "keydown": "_onKeydown($event)" }, properties: { "attr.aria-haspopup": "_datepicker ? \"dialog\" : null", "attr.aria-owns": "(_datepicker?.opened && _datepicker.id) || null", "attr.min": "min ? _dateAdapter.toIso8601(min) : null", "attr.max": "max ? _dateAdapter.toIso8601(max) : null", "disabled": "disabled" } }, providers: [
        MAT_DATEPICKER_VALUE_ACCESSOR,
        MAT_DATEPICKER_VALIDATORS,
        { provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: NgxMatDatetimeInput },
    ], exportAs: ["ngxMatDatetimePickerInput"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimeInput, decorators: [{
            type: Directive,
            args: [{
                    selector: 'input[ngxMatDatetimePicker]',
                    providers: [
                        MAT_DATEPICKER_VALUE_ACCESSOR,
                        MAT_DATEPICKER_VALIDATORS,
                        { provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: NgxMatDatetimeInput },
                    ],
                    host: {
                        '[attr.aria-haspopup]': '_datepicker ? "dialog" : null',
                        '[attr.aria-owns]': '(_datepicker?.opened && _datepicker.id) || null',
                        '[attr.min]': 'min ? _dateAdapter.toIso8601(min) : null',
                        '[attr.max]': 'max ? _dateAdapter.toIso8601(max) : null',
                        '[disabled]': 'disabled',
                        '(input)': '_onInput($event.target.value)',
                        '(change)': '_onChange()',
                        '(blur)': '_onBlur()',
                        '(focus)': '_onFocus()',
                        '(dblclick)': '_onFocus()',
                        '(keydown)': '_onKeydown($event)',
                    },
                    exportAs: 'ngxMatDatetimePickerInput',
                }]
        }], ctorParameters: function () {
        return [{ type: i0.ElementRef }, { type: NgxMatDateAdapter, decorators: [{
                        type: Optional
                    }] }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [NGX_MAT_DATE_FORMATS]
                    }] }, { type: i2$2.MatFormField, decorators: [{
                        type: Optional
                    }] }];
    }, propDecorators: { ngxMatDatetimePicker: [{
                type: Input
            }], ngxMatDatetimePickerFilter: [{
                type: Input
            }], value: [{
                type: Input
            }], min: [{
                type: Input
            }], max: [{
                type: Input
            }], disabled: [{
                type: Input
            }], dateChange: [{
                type: Output
            }], dateInput: [{
                type: Output
            }] } });

class NgxMatTimepickerModule {
}
/** @nocollapse */ /** @nocollapse */ NgxMatTimepickerModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatTimepickerModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
/** @nocollapse */ /** @nocollapse */ NgxMatTimepickerModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatTimepickerModule, declarations: [NgxMatTimepickerComponent], imports: [CommonModule,
        MatInputModule,
        ReactiveFormsModule,
        FormsModule,
        MatIconModule,
        MatButtonModule], exports: [NgxMatTimepickerComponent] });
/** @nocollapse */ /** @nocollapse */ NgxMatTimepickerModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatTimepickerModule, imports: [[
            CommonModule,
            MatInputModule,
            ReactiveFormsModule,
            FormsModule,
            MatIconModule,
            MatButtonModule,
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatTimepickerModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        CommonModule,
                        MatInputModule,
                        ReactiveFormsModule,
                        FormsModule,
                        MatIconModule,
                        MatButtonModule,
                    ],
                    exports: [
                        NgxMatTimepickerComponent
                    ],
                    declarations: [
                        NgxMatTimepickerComponent
                    ]
                }]
        }] });

class NgxMatDatetimePickerModule {
}
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimePickerModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimePickerModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimePickerModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimePickerModule, declarations: [NgxMatDatetimePicker,
        NgxMatDatetimeContent,
        NgxMatDatetimeInput,
        NgxMatCalendar,
        NgxMatMonthView,
        NgxMatCalendarBody,
        NgxMatYearView,
        NgxMatMultiYearView,
        NgxMatCalendarHeader], imports: [CommonModule,
        MatDatepickerModule,
        MatDialogModule,
        PortalModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        NgxMatTimepickerModule], exports: [NgxMatDatetimePicker,
        NgxMatDatetimeInput,
        NgxMatCalendar,
        NgxMatMonthView,
        NgxMatCalendarBody,
        NgxMatYearView,
        NgxMatMultiYearView,
        NgxMatCalendarHeader] });
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimePickerModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimePickerModule, providers: [
        MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER,
        {
            provide: NGX_MAT_DATE_RANGE_SELECTION_STRATEGY,
            useClass: DefaultNgxMatCalendarRangeStrategy
        }
    ], imports: [[
            CommonModule,
            MatDatepickerModule,
            MatDialogModule,
            PortalModule,
            FormsModule,
            MatIconModule,
            MatButtonModule,
            MatInputModule,
            NgxMatTimepickerModule
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimePickerModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        CommonModule,
                        MatDatepickerModule,
                        MatDialogModule,
                        PortalModule,
                        FormsModule,
                        MatIconModule,
                        MatButtonModule,
                        MatInputModule,
                        NgxMatTimepickerModule
                    ],
                    exports: [
                        NgxMatDatetimePicker,
                        NgxMatDatetimeInput,
                        NgxMatCalendar,
                        NgxMatMonthView,
                        NgxMatCalendarBody,
                        NgxMatYearView,
                        NgxMatMultiYearView,
                        NgxMatCalendarHeader
                    ],
                    declarations: [
                        NgxMatDatetimePicker,
                        NgxMatDatetimeContent,
                        NgxMatDatetimeInput,
                        NgxMatCalendar,
                        NgxMatMonthView,
                        NgxMatCalendarBody,
                        NgxMatYearView,
                        NgxMatMultiYearView,
                        NgxMatCalendarHeader
                    ],
                    entryComponents: [
                        NgxMatDatetimeContent,
                        NgxMatCalendarHeader
                    ],
                    providers: [
                        MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER,
                        {
                            provide: NGX_MAT_DATE_RANGE_SELECTION_STRATEGY,
                            useClass: DefaultNgxMatCalendarRangeStrategy
                        }
                    ]
                }]
        }] });

// TODO(mmalerba): Remove when we no longer support safari 9.
/** Whether the browser supports the Intl API. */
let SUPPORTS_INTL_API;
// We need a try/catch around the reference to `Intl`, because accessing it in some cases can
// cause IE to throw. These cases are tied to particular versions of Windows and can happen if
// the consumer is providing a polyfilled `Map`. See:
// https://github.com/Microsoft/ChakraCore/issues/3189
// https://github.com/angular/components/issues/15687
try {
    SUPPORTS_INTL_API = typeof Intl != 'undefined';
}
catch (_a) {
    SUPPORTS_INTL_API = false;
}
/** The default month names to use if Intl API is not available. */
const DEFAULT_MONTH_NAMES = {
    'long': [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December'
    ],
    'short': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    'narrow': ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
};
/** The default date names to use if Intl API is not available. */
const DEFAULT_DATE_NAMES = range(31, i => String(i + 1));
/** The default day of the week names to use if Intl API is not available. */
const DEFAULT_DAY_OF_WEEK_NAMES = {
    'long': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'short': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'narrow': ['S', 'M', 'T', 'W', 'T', 'F', 'S']
};
/**
 * Matches strings that have the form of a valid RFC 3339 string
 * (https://tools.ietf.org/html/rfc3339). Note that the string may not actually be a valid date
 * because the regex will match strings an with out of bounds month, date, etc.
 */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/;
/** Creates an array and fills it with values. */
function range(length, valueFunction) {
    const valuesArray = Array(length);
    for (let i = 0; i < length; i++) {
        valuesArray[i] = valueFunction(i);
    }
    return valuesArray;
}
/** Adapts the native JS Date for use with cdk-based components that work with dates. */
class NgxMatNativeDateAdapter extends NgxMatDateAdapter {
    constructor(matDateLocale, platform) {
        super();
        /**
         * Whether to use `timeZone: 'utc'` with `Intl.DateTimeFormat` when formatting dates.
         * Without this `Intl.DateTimeFormat` sometimes chooses the wrong timeZone, which can throw off
         * the result. (e.g. in the en-US locale `new Date(1800, 7, 14).toLocaleDateString()`
         * will produce `'8/13/1800'`.
         *
         * TODO(mmalerba): drop this variable. It's not being used in the code right now. We're now
         * getting the string representation of a Date object from its utc representation. We're keeping
         * it here for sometime, just for precaution, in case we decide to revert some of these changes
         * though.
         */
        this.useUtcForDisplay = true;
        super.setLocale(matDateLocale);
        // IE does its own time zone correction, so we disable this on IE.
        this.useUtcForDisplay = !platform.TRIDENT;
        this._clampDate = platform.TRIDENT || platform.EDGE;
    }
    getYear(date) {
        return date.getFullYear();
    }
    getMonth(date) {
        return date.getMonth();
    }
    getDate(date) {
        return date.getDate();
    }
    getDayOfWeek(date) {
        return date.getDay();
    }
    getMonthNames(style) {
        if (SUPPORTS_INTL_API) {
            const dtf = new Intl.DateTimeFormat(this.locale, { month: style, timeZone: 'utc' });
            return range(12, i => this._stripDirectionalityCharacters(this._format(dtf, new Date(2017, i, 1))));
        }
        return DEFAULT_MONTH_NAMES[style];
    }
    getDateNames() {
        if (SUPPORTS_INTL_API) {
            const dtf = new Intl.DateTimeFormat(this.locale, { day: 'numeric', timeZone: 'utc' });
            return range(31, i => this._stripDirectionalityCharacters(this._format(dtf, new Date(2017, 0, i + 1))));
        }
        return DEFAULT_DATE_NAMES;
    }
    getDayOfWeekNames(style) {
        if (SUPPORTS_INTL_API) {
            const dtf = new Intl.DateTimeFormat(this.locale, { weekday: style, timeZone: 'utc' });
            return range(7, i => this._stripDirectionalityCharacters(this._format(dtf, new Date(2017, 0, i + 1))));
        }
        return DEFAULT_DAY_OF_WEEK_NAMES[style];
    }
    getYearName(date) {
        if (SUPPORTS_INTL_API) {
            const dtf = new Intl.DateTimeFormat(this.locale, { year: 'numeric', timeZone: 'utc' });
            return this._stripDirectionalityCharacters(this._format(dtf, date));
        }
        return String(this.getYear(date));
    }
    getFirstDayOfWeek() {
        // We can't tell using native JS Date what the first day of the week is, we default to Sunday.
        return 0;
    }
    getNumDaysInMonth(date) {
        return this.getDate(this._createDateWithOverflow(this.getYear(date), this.getMonth(date) + 1, 0));
    }
    clone(date) {
        return new Date(date.getTime());
    }
    createDate(year, month, date) {
        // Check for invalid month and date (except upper bound on date which we have to check after
        // creating the Date).
        if (month < 0 || month > 11) {
            throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
        }
        if (date < 1) {
            throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
        }
        let result = this._createDateWithOverflow(year, month, date);
        // Check that the date wasn't above the upper bound for the month, causing the month to overflow
        if (result.getMonth() != month) {
            throw Error(`Invalid date "${date}" for month with index "${month}".`);
        }
        return result;
    }
    today() {
        return new Date();
    }
    parse(value) {
        // We have no way using the native JS Date to set the parse format or locale, so we ignore these
        // parameters.
        if (typeof value == 'number') {
            return new Date(value);
        }
        return value ? new Date(Date.parse(value)) : null;
    }
    format(date, displayFormat) {
        if (!this.isValid(date)) {
            throw Error('NativeDateAdapter: Cannot format invalid date.');
        }
        if (SUPPORTS_INTL_API) {
            // On IE and Edge the i18n API will throw a hard error that can crash the entire app
            // if we attempt to format a date whose year is less than 1 or greater than 9999.
            if (this._clampDate && (date.getFullYear() < 1 || date.getFullYear() > 9999)) {
                date = this.clone(date);
                date.setFullYear(Math.max(1, Math.min(9999, date.getFullYear())));
            }
            displayFormat = Object.assign(Object.assign({}, displayFormat), { timeZone: 'utc' });
            const dtf = new Intl.DateTimeFormat(this.locale, displayFormat);
            return this._stripDirectionalityCharacters(this._format(dtf, date));
        }
        return this._stripDirectionalityCharacters(date.toDateString());
    }
    addCalendarYears(date, years) {
        return this.addCalendarMonths(date, years * 12);
    }
    addCalendarMonths(date, months) {
        let newDate = this._createDateWithOverflow(this.getYear(date), this.getMonth(date) + months, this.getDate(date));
        // It's possible to wind up in the wrong month if the original month has more days than the new
        // month. In this case we want to go to the last day of the desired month.
        // Note: the additional + 12 % 12 ensures we end up with a positive number, since JS % doesn't
        // guarantee this.
        if (this.getMonth(newDate) != ((this.getMonth(date) + months) % 12 + 12) % 12) {
            newDate = this._createDateWithOverflow(this.getYear(newDate), this.getMonth(newDate), 0);
        }
        return newDate;
    }
    addCalendarDays(date, days) {
        return this._createDateWithOverflow(this.getYear(date), this.getMonth(date), this.getDate(date) + days);
    }
    toIso8601(date) {
        return [
            date.getUTCFullYear(),
            this._2digit(date.getUTCMonth() + 1),
            this._2digit(date.getUTCDate())
        ].join('-');
    }
    /**
     * Returns the given value if given a valid Date or null. Deserializes valid ISO 8601 strings
     * (https://www.ietf.org/rfc/rfc3339.txt) into valid Dates and empty string into null. Returns an
     * invalid date for all other values.
     */
    deserialize(value) {
        if (typeof value === 'string') {
            if (!value) {
                return null;
            }
            // The `Date` constructor accepts formats other than ISO 8601, so we need to make sure the
            // string is the right format first.
            if (ISO_8601_REGEX.test(value)) {
                let date = new Date(value);
                if (this.isValid(date)) {
                    return date;
                }
            }
        }
        return super.deserialize(value);
    }
    isDateInstance(obj) {
        return obj instanceof Date;
    }
    isValid(date) {
        return !isNaN(date.getTime());
    }
    invalid() {
        return new Date(NaN);
    }
    getHour(date) {
        return date.getHours();
    }
    getMinute(date) {
        return date.getMinutes();
    }
    getSecond(date) {
        return date.getSeconds();
    }
    setHour(date, value) {
        date.setHours(value);
    }
    setMinute(date, value) {
        date.setMinutes(value);
    }
    setSecond(date, value) {
        date.setSeconds(value);
    }
    /** Creates a date but allows the month and date to overflow. */
    _createDateWithOverflow(year, month, date) {
        const result = new Date(year, month, date);
        // We need to correct for the fact that JS native Date treats years in range [0, 99] as
        // abbreviations for 19xx.
        if (year >= 0 && year < 100) {
            result.setFullYear(this.getYear(result) - 1900);
        }
        return result;
    }
    /**
     * Pads a number to make it two digits.
     * @param n The number to pad.
     * @returns The padded number.
     */
    _2digit(n) {
        return ('00' + n).slice(-2);
    }
    /**
     * Strip out unicode LTR and RTL characters. Edge and IE insert these into formatted dates while
     * other browsers do not. We remove them to make output consistent and because they interfere with
     * date parsing.
     * @param str The string to strip direction characters from.
     * @returns The stripped string.
     */
    _stripDirectionalityCharacters(str) {
        return str.replace(/[\u200e\u200f]/g, '');
    }
    /**
     * When converting Date object to string, javascript built-in functions may return wrong
     * results because it applies its internal DST rules. The DST rules around the world change
     * very frequently, and the current valid rule is not always valid in previous years though.
     * We work around this problem building a new Date object which has its internal UTC
     * representation with the local date and time.
     * @param dtf Intl.DateTimeFormat object, containg the desired string format. It must have
     *    timeZone set to 'utc' to work fine.
     * @param date Date from which we want to get the string representation according to dtf
     * @returns A Date object with its UTC representation based on the passed in date info
     */
    _format(dtf, date) {
        // Passing the year to the constructor causes year numbers <100 to be converted to 19xx.
        // To work around this we use `setUTCFullYear` and `setUTCHours` instead.
        const d = new Date();
        d.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        d.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
        return dtf.format(d);
    }
}
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateAdapter.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateAdapter, deps: [{ token: MAT_DATE_LOCALE, optional: true }, { token: i1$2.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateAdapter.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateAdapter });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateAdapter, decorators: [{
            type: Injectable
        }], ctorParameters: function () {
        return [{ type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [MAT_DATE_LOCALE]
                    }] }, { type: i1$2.Platform }];
    } });

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const DEFAULT_DATE_INPUT = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"
};
const NGX_MAT_NATIVE_DATE_FORMATS = {
    parse: {
        dateInput: DEFAULT_DATE_INPUT,
    },
    display: {
        dateInput: DEFAULT_DATE_INPUT,
        monthYearLabel: { year: 'numeric', month: 'short' },
        dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
        monthYearA11yLabel: { year: 'numeric', month: 'long' },
    }
};

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
class NgxNativeDateModule {
}
/** @nocollapse */ /** @nocollapse */ NgxNativeDateModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
/** @nocollapse */ /** @nocollapse */ NgxNativeDateModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, imports: [PlatformModule] });
/** @nocollapse */ /** @nocollapse */ NgxNativeDateModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, providers: [
        { provide: NgxMatDateAdapter, useClass: NgxMatNativeDateAdapter },
    ], imports: [[PlatformModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [PlatformModule],
                    providers: [
                        { provide: NgxMatDateAdapter, useClass: NgxMatNativeDateAdapter },
                    ],
                }]
        }] });
class NgxMatNativeDateModule {
}
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, imports: [NgxNativeDateModule] });
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, providers: [{ provide: NGX_MAT_DATE_FORMATS, useValue: NGX_MAT_NATIVE_DATE_FORMATS }], imports: [[NgxNativeDateModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [NgxNativeDateModule],
                    providers: [{ provide: NGX_MAT_DATE_FORMATS, useValue: NGX_MAT_NATIVE_DATE_FORMATS }],
                }]
        }] });

/*
 * Public API Surface of ngx-mat-datetime-picker
 */

/**
 * Generated bundle index. Do not edit.
 */

export { DefaultNgxMatCalendarRangeStrategy, MAT_DATEPICKER_VALIDATORS, MAT_DATEPICKER_VALUE_ACCESSOR, MatDatetimePickerInputEvent, NGX_MAT_DATE_FORMATS, NGX_MAT_DATE_RANGE_SELECTION_STRATEGY, NGX_MAT_NATIVE_DATE_FORMATS, NgxMatCalendar, NgxMatCalendarBody, NgxMatCalendarCell, NgxMatCalendarHeader, NgxMatDateAdapter, NgxMatDatetimeContent, NgxMatDatetimeInput, NgxMatDatetimePicker, NgxMatDatetimePickerModule, NgxMatMonthView, NgxMatMultiYearView, NgxMatNativeDateAdapter, NgxMatNativeDateModule, NgxMatTimepickerComponent, NgxMatTimepickerModule, NgxMatYearView, NgxNativeDateModule, getActiveOffset, isSameMultiYearView, yearsPerPage, yearsPerRow };
//# sourceMappingURL=angular-material-components-datetime-picker.mjs.map
