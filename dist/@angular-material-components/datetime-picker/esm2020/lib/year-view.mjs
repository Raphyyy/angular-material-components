/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOWN_ARROW, END, ENTER, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW, SPACE, } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Optional, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { DateRange } from '@angular/material/datepicker';
import { NgxMatCalendarBody, NgxMatCalendarCell } from './calendar-body';
import { NGX_MAT_DATE_FORMATS } from './core/date-formats';
import { createMissingDateImplError } from './utils/date-utils';
import * as i0 from "@angular/core";
import * as i1 from "./core/date-adapter";
import * as i2 from "@angular/cdk/bidi";
import * as i3 from "./calendar-body";
/**
 * An internal component used to display a single year in the datepicker.
 * @docs-private
 */
export class NgxMatYearView {
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
/** @nocollapse */ /** @nocollapse */ NgxMatYearView.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatYearView, deps: [{ token: i0.ChangeDetectorRef }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i1.NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatYearView.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatYearView, selector: "ngx-mat-year-view", inputs: { activeDate: "activeDate", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter" }, outputs: { selectedChange: "selectedChange", monthSelected: "monthSelected", activeDateChange: "activeDateChange" }, viewQueries: [{ propertyName: "_matCalendarBody", first: true, predicate: NgxMatCalendarBody, descendants: true }], exportAs: ["ngxMatYearView"], ngImport: i0, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_yearLabel\"\r\n         [rows]=\"_months\"\r\n         [todayValue]=\"_todayMonth!\"\r\n         [startValue]=\"_selectedMonth!\"\r\n         [endValue]=\"_selectedMonth!\"\r\n         [labelMinRequiredCells]=\"2\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_dateAdapter.getMonth(activeDate)\"\r\n         (selectedValueChange)=\"_monthSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n", components: [{ type: i3.NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: ["label", "rows", "todayValue", "startValue", "endValue", "labelMinRequiredCells", "numCols", "activeCell", "isRange", "cellAspectRatio", "comparisonStart", "comparisonEnd", "previewStart", "previewEnd"], outputs: ["selectedValueChange", "previewChange"], exportAs: ["NgxMatCalendarBody"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatYearView, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-year-view', exportAs: 'ngxMatYearView', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_yearLabel\"\r\n         [rows]=\"_months\"\r\n         [todayValue]=\"_todayMonth!\"\r\n         [startValue]=\"_selectedMonth!\"\r\n         [endValue]=\"_selectedMonth!\"\r\n         [labelMinRequiredCells]=\"2\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_dateAdapter.getMonth(activeDate)\"\r\n         (selectedValueChange)=\"_monthSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n" }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [NGX_MAT_DATE_FORMATS]
                }] }, { type: i1.NgxMatDateAdapter, decorators: [{
                    type: Optional
                }] }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }]; }, propDecorators: { activeDate: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieWVhci12aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIveWVhci12aWV3LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIveWVhci12aWV3Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFVBQVUsRUFDVixHQUFHLEVBQ0gsS0FBSyxFQUNMLElBQUksRUFDSixVQUFVLEVBQ1YsU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsUUFBUSxFQUNSLEtBQUssR0FDTixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFFTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUNULFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULGlCQUFpQixHQUVsQixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3BDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDekQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUEyQixNQUFNLGlCQUFpQixDQUFDO0FBQ2xHLE9BQU8sRUFBRSxvQkFBb0IsRUFBcUIsTUFBTSxxQkFBcUIsQ0FBQztBQUU5RSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQzs7Ozs7QUFFaEU7OztHQUdHO0FBUUgsTUFBTSxPQUFPLGNBQWM7SUE2RXpCLFlBQW9CLGtCQUFxQyxFQUNMLFlBQStCLEVBQzlELFlBQWtDLEVBQ2pDLElBQXFCO1FBSHZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7UUFDTCxpQkFBWSxHQUFaLFlBQVksQ0FBbUI7UUFDOUQsaUJBQVksR0FBWixZQUFZLENBQXNCO1FBQ2pDLFNBQUksR0FBSixJQUFJLENBQWlCO1FBL0VuQywwQkFBcUIsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBaURuRCwwQ0FBMEM7UUFDdkIsbUJBQWMsR0FBb0IsSUFBSSxZQUFZLEVBQUssQ0FBQztRQUUzRSxpRkFBaUY7UUFDOUQsa0JBQWEsR0FBb0IsSUFBSSxZQUFZLEVBQUssQ0FBQztRQUUxRSx3Q0FBd0M7UUFDckIscUJBQWdCLEdBQW9CLElBQUksWUFBWSxFQUFLLENBQUM7UUF3QjNFLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3RCLE1BQU0sMEJBQTBCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUN2RDtRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3RCLE1BQU0sMEJBQTBCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztTQUMxRDtRQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMvQyxDQUFDO0lBdEZELHlGQUF5RjtJQUN6RixJQUNJLFVBQVUsS0FBUSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ2hELElBQUksVUFBVSxDQUFDLEtBQVE7UUFDckIsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNyQyxNQUFNLFNBQVMsR0FDYixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RGLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzVGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUdELG1DQUFtQztJQUNuQyxJQUNJLFFBQVEsS0FBOEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUNsRSxJQUFJLFFBQVEsQ0FBQyxLQUE4QjtRQUN6QyxJQUFJLEtBQUssWUFBWSxTQUFTLEVBQUU7WUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7U0FDeEI7YUFBTTtZQUNMLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDakY7UUFFRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUdELG1DQUFtQztJQUNuQyxJQUNJLE9BQU8sS0FBZSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ2pELElBQUksT0FBTyxDQUFDLEtBQWU7UUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNqRixDQUFDO0lBR0QsbUNBQW1DO0lBQ25DLElBQ0ksT0FBTyxLQUFlLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDakQsSUFBSSxPQUFPLENBQUMsS0FBZTtRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUErQ0Qsa0JBQWtCO1FBQ2hCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWE7YUFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNyQixTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDM0MsQ0FBQztJQUVELDRDQUE0QztJQUM1QyxjQUFjLENBQUMsS0FBc0M7UUFDbkQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUMxQixNQUFNLGNBQWMsR0FDbEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVyRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV4QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRXhFLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUNuRCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxFQUNqRCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELGlGQUFpRjtJQUNqRiwwQkFBMEIsQ0FBQyxLQUFvQjtRQUM3Qyw2RkFBNkY7UUFDN0Ysd0ZBQXdGO1FBQ3hGLDRGQUE0RjtRQUU1RixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUU1QixRQUFRLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDckIsS0FBSyxVQUFVO2dCQUNiLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4RixNQUFNO1lBQ1IsS0FBSyxXQUFXO2dCQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4RixNQUFNO1lBQ1IsS0FBSyxRQUFRO2dCQUNYLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVFLE1BQU07WUFDUixLQUFLLFVBQVU7Z0JBQ2IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLE1BQU07WUFDUixLQUFLLElBQUk7Z0JBQ1AsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQ3BFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQ3BFLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDckQsTUFBTTtZQUNSLEtBQUssT0FBTztnQkFDVixJQUFJLENBQUMsVUFBVTtvQkFDYixJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLE1BQU07WUFDUixLQUFLLFNBQVM7Z0JBQ1osSUFBSSxDQUFDLFVBQVU7b0JBQ2IsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlFLE1BQU07WUFDUixLQUFLLEtBQUssQ0FBQztZQUNYLEtBQUssS0FBSztnQkFDUixJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRixNQUFNO1lBQ1I7Z0JBQ0Usc0ZBQXNGO2dCQUN0RixPQUFPO1NBQ1Y7UUFFRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDakUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDN0M7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN4Qiw4REFBOEQ7UUFDOUQsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxrQ0FBa0M7SUFDbEMsS0FBSztRQUNILElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWpFLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFELDZGQUE2RjtRQUM3RixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUM1RSxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRUQsa0VBQWtFO0lBQ2xFLGdCQUFnQjtRQUNkLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzNDLENBQUM7SUFFRDs7O09BR0c7SUFDSyxzQkFBc0IsQ0FBQyxJQUFjO1FBQzNDLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzVGLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDNUMsQ0FBQztJQUVELHNEQUFzRDtJQUM5QyxtQkFBbUIsQ0FBQyxLQUFhLEVBQUUsU0FBaUI7UUFDMUQsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQ3RDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQ2xGLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDaEQsT0FBTyxJQUFJLGtCQUFrQixDQUMzQixLQUFLLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7SUFFRCwwQ0FBMEM7SUFDbEMsa0JBQWtCLENBQUMsS0FBYTtRQUV0QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFOUQsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxJQUFJO1lBQ3ZDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDO1lBQ25ELElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDdEQsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXhFLGtFQUFrRTtRQUNsRSxLQUFLLElBQUksSUFBSSxHQUFHLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQ3JFLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDbkQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6QixPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRDs7O09BR0c7SUFDSywyQkFBMkIsQ0FBQyxJQUFZLEVBQUUsS0FBYTtRQUM3RCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUxRCxPQUFPLElBQUksR0FBRyxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQztTQUNqRTtRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVEOzs7T0FHRztJQUNLLDRCQUE0QixDQUFDLElBQVksRUFBRSxLQUFhO1FBQzlELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTFELE9BQU8sSUFBSSxHQUFHLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxPQUFPLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1NBQ2pFO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssbUJBQW1CLENBQUMsR0FBUTtRQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEcsQ0FBQztJQUVELGdFQUFnRTtJQUN4RCxNQUFNO1FBQ1osT0FBTyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQztJQUNoRCxDQUFDO0lBRUQsZ0VBQWdFO0lBQ3hELGlCQUFpQixDQUFDLEtBQThCO1FBQ3RELElBQUksS0FBSyxZQUFZLFNBQVMsRUFBRTtZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO2dCQUM1RCxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzFDO2FBQU07WUFDTCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMxRDtJQUNILENBQUM7O2lKQS9SVSxjQUFjLG1EQThFSCxvQkFBb0I7cUlBOUUvQixjQUFjLDhWQTREZCxrQkFBa0IsOEVDbEgvQiwydkJBa0JBOzJGRG9DYSxjQUFjO2tCQVAxQixTQUFTOytCQUNFLG1CQUFtQixZQUVuQixnQkFBZ0IsaUJBQ1gsaUJBQWlCLENBQUMsSUFBSSxtQkFDcEIsdUJBQXVCLENBQUMsTUFBTTs7MEJBZ0Y1QyxRQUFROzswQkFBSSxNQUFNOzJCQUFDLG9CQUFvQjs7MEJBQ3ZDLFFBQVE7OzBCQUNSLFFBQVE7NENBM0VQLFVBQVU7c0JBRGIsS0FBSztnQkFlRixRQUFRO3NCQURYLEtBQUs7Z0JBZUYsT0FBTztzQkFEVixLQUFLO2dCQVNGLE9BQU87c0JBRFYsS0FBSztnQkFRRyxVQUFVO3NCQUFsQixLQUFLO2dCQUdhLGNBQWM7c0JBQWhDLE1BQU07Z0JBR1ksYUFBYTtzQkFBL0IsTUFBTTtnQkFHWSxnQkFBZ0I7c0JBQWxDLE1BQU07Z0JBR3dCLGdCQUFnQjtzQkFBOUMsU0FBUzt1QkFBQyxrQkFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGxpY2Vuc2VcclxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuICpcclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcclxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxyXG4gKi9cclxuXHJcbmltcG9ydCB7XHJcbiAgRE9XTl9BUlJPVyxcclxuICBFTkQsXHJcbiAgRU5URVIsXHJcbiAgSE9NRSxcclxuICBMRUZUX0FSUk9XLFxyXG4gIFBBR0VfRE9XTixcclxuICBQQUdFX1VQLFxyXG4gIFJJR0hUX0FSUk9XLFxyXG4gIFVQX0FSUk9XLFxyXG4gIFNQQUNFLFxyXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XHJcbmltcG9ydCB7XHJcbiAgQWZ0ZXJDb250ZW50SW5pdCxcclxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcclxuICBDaGFuZ2VEZXRlY3RvclJlZixcclxuICBDb21wb25lbnQsXHJcbiAgRXZlbnRFbWl0dGVyLFxyXG4gIEluamVjdCxcclxuICBJbnB1dCxcclxuICBPcHRpb25hbCxcclxuICBPdXRwdXQsXHJcbiAgVmlld0NoaWxkLFxyXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxyXG4gIE9uRGVzdHJveSxcclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgRGlyZWN0aW9uYWxpdHkgfSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XHJcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBzdGFydFdpdGggfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XHJcbmltcG9ydCB7IERhdGVSYW5nZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2RhdGVwaWNrZXInO1xyXG5pbXBvcnQgeyBOZ3hNYXRDYWxlbmRhckJvZHksIE5neE1hdENhbGVuZGFyQ2VsbCwgTmd4TWF0Q2FsZW5kYXJVc2VyRXZlbnQgfSBmcm9tICcuL2NhbGVuZGFyLWJvZHknO1xyXG5pbXBvcnQgeyBOR1hfTUFUX0RBVEVfRk9STUFUUywgTmd4TWF0RGF0ZUZvcm1hdHMgfSBmcm9tICcuL2NvcmUvZGF0ZS1mb3JtYXRzJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZUFkYXB0ZXIgfSBmcm9tICcuL2NvcmUvZGF0ZS1hZGFwdGVyJztcclxuaW1wb3J0IHsgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IgfSBmcm9tICcuL3V0aWxzL2RhdGUtdXRpbHMnO1xyXG5cclxuLyoqXHJcbiAqIEFuIGludGVybmFsIGNvbXBvbmVudCB1c2VkIHRvIGRpc3BsYXkgYSBzaW5nbGUgeWVhciBpbiB0aGUgZGF0ZXBpY2tlci5cclxuICogQGRvY3MtcHJpdmF0ZVxyXG4gKi9cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICduZ3gtbWF0LXllYXItdmlldycsXHJcbiAgdGVtcGxhdGVVcmw6ICd5ZWFyLXZpZXcuaHRtbCcsXHJcbiAgZXhwb3J0QXM6ICduZ3hNYXRZZWFyVmlldycsXHJcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcclxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxyXG59KVxyXG5leHBvcnQgY2xhc3MgTmd4TWF0WWVhclZpZXc8RD4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xyXG4gIHByaXZhdGUgX3JlcmVuZGVyU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xyXG5cclxuICAvKiogVGhlIGRhdGUgdG8gZGlzcGxheSBpbiB0aGlzIHllYXIgdmlldyAoZXZlcnl0aGluZyBvdGhlciB0aGFuIHRoZSB5ZWFyIGlzIGlnbm9yZWQpLiAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IGFjdGl2ZURhdGUoKTogRCB7IHJldHVybiB0aGlzLl9hY3RpdmVEYXRlOyB9XHJcbiAgc2V0IGFjdGl2ZURhdGUodmFsdWU6IEQpIHtcclxuICAgIGxldCBvbGRBY3RpdmVEYXRlID0gdGhpcy5fYWN0aXZlRGF0ZTtcclxuICAgIGNvbnN0IHZhbGlkRGF0ZSA9XHJcbiAgICAgIHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpIHx8IHRoaXMuX2RhdGVBZGFwdGVyLnRvZGF5KCk7XHJcbiAgICB0aGlzLl9hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuY2xhbXBEYXRlKHZhbGlkRGF0ZSwgdGhpcy5taW5EYXRlLCB0aGlzLm1heERhdGUpO1xyXG4gICAgaWYgKHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIob2xkQWN0aXZlRGF0ZSkgIT09IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5fYWN0aXZlRGF0ZSkpIHtcclxuICAgICAgdGhpcy5faW5pdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwcml2YXRlIF9hY3RpdmVEYXRlOiBEO1xyXG5cclxuICAvKiogVGhlIGN1cnJlbnRseSBzZWxlY3RlZCBkYXRlLiAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IHNlbGVjdGVkKCk6IERhdGVSYW5nZTxEPiB8IEQgfCBudWxsIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkOyB9XHJcbiAgc2V0IHNlbGVjdGVkKHZhbHVlOiBEYXRlUmFuZ2U8RD4gfCBEIHwgbnVsbCkge1xyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZVJhbmdlKSB7XHJcbiAgICAgIHRoaXMuX3NlbGVjdGVkID0gdmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9zZWxlY3RlZCA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3NldFNlbGVjdGVkTW9udGgodmFsdWUpO1xyXG4gIH1cclxuICBwcml2YXRlIF9zZWxlY3RlZDogRGF0ZVJhbmdlPEQ+IHwgRCB8IG51bGw7XHJcblxyXG4gIC8qKiBUaGUgbWluaW11bSBzZWxlY3RhYmxlIGRhdGUuICovXHJcbiAgQElucHV0KClcclxuICBnZXQgbWluRGF0ZSgpOiBEIHwgbnVsbCB7IHJldHVybiB0aGlzLl9taW5EYXRlOyB9XHJcbiAgc2V0IG1pbkRhdGUodmFsdWU6IEQgfCBudWxsKSB7XHJcbiAgICB0aGlzLl9taW5EYXRlID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKHZhbHVlKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgX21pbkRhdGU6IEQgfCBudWxsO1xyXG5cclxuICAvKiogVGhlIG1heGltdW0gc2VsZWN0YWJsZSBkYXRlLiAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IG1heERhdGUoKTogRCB8IG51bGwgeyByZXR1cm4gdGhpcy5fbWF4RGF0ZTsgfVxyXG4gIHNldCBtYXhEYXRlKHZhbHVlOiBEIHwgbnVsbCkge1xyXG4gICAgdGhpcy5fbWF4RGF0ZSA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpO1xyXG4gIH1cclxuICBwcml2YXRlIF9tYXhEYXRlOiBEIHwgbnVsbDtcclxuXHJcbiAgLyoqIEEgZnVuY3Rpb24gdXNlZCB0byBmaWx0ZXIgd2hpY2ggZGF0ZXMgYXJlIHNlbGVjdGFibGUuICovXHJcbiAgQElucHV0KCkgZGF0ZUZpbHRlcjogKGRhdGU6IEQpID0+IGJvb2xlYW47XHJcblxyXG4gIC8qKiBFbWl0cyB3aGVuIGEgbmV3IG1vbnRoIGlzIHNlbGVjdGVkLiAqL1xyXG4gIEBPdXRwdXQoKSByZWFkb25seSBzZWxlY3RlZENoYW5nZTogRXZlbnRFbWl0dGVyPEQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxEPigpO1xyXG5cclxuICAvKiogRW1pdHMgdGhlIHNlbGVjdGVkIG1vbnRoLiBUaGlzIGRvZXNuJ3QgaW1wbHkgYSBjaGFuZ2Ugb24gdGhlIHNlbGVjdGVkIGRhdGUgKi9cclxuICBAT3V0cHV0KCkgcmVhZG9ubHkgbW9udGhTZWxlY3RlZDogRXZlbnRFbWl0dGVyPEQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxEPigpO1xyXG5cclxuICAvKiogRW1pdHMgd2hlbiBhbnkgZGF0ZSBpcyBhY3RpdmF0ZWQuICovXHJcbiAgQE91dHB1dCgpIHJlYWRvbmx5IGFjdGl2ZURhdGVDaGFuZ2U6IEV2ZW50RW1pdHRlcjxEPiA9IG5ldyBFdmVudEVtaXR0ZXI8RD4oKTtcclxuXHJcbiAgLyoqIFRoZSBib2R5IG9mIGNhbGVuZGFyIHRhYmxlICovXHJcbiAgQFZpZXdDaGlsZChOZ3hNYXRDYWxlbmRhckJvZHkpIF9tYXRDYWxlbmRhckJvZHk6IE5neE1hdENhbGVuZGFyQm9keTtcclxuXHJcbiAgLyoqIEdyaWQgb2YgY2FsZW5kYXIgY2VsbHMgcmVwcmVzZW50aW5nIHRoZSBtb250aHMgb2YgdGhlIHllYXIuICovXHJcbiAgX21vbnRoczogTmd4TWF0Q2FsZW5kYXJDZWxsW11bXTtcclxuXHJcbiAgLyoqIFRoZSBsYWJlbCBmb3IgdGhpcyB5ZWFyIChlLmcuIFwiMjAxN1wiKS4gKi9cclxuICBfeWVhckxhYmVsOiBzdHJpbmc7XHJcblxyXG4gIC8qKiBUaGUgbW9udGggaW4gdGhpcyB5ZWFyIHRoYXQgdG9kYXkgZmFsbHMgb24uIE51bGwgaWYgdG9kYXkgaXMgaW4gYSBkaWZmZXJlbnQgeWVhci4gKi9cclxuICBfdG9kYXlNb250aDogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIG1vbnRoIGluIHRoaXMgeWVhciB0aGF0IHRoZSBzZWxlY3RlZCBEYXRlIGZhbGxzIG9uLlxyXG4gICAqIE51bGwgaWYgdGhlIHNlbGVjdGVkIERhdGUgaXMgaW4gYSBkaWZmZXJlbnQgeWVhci5cclxuICAgKi9cclxuICBfc2VsZWN0ZWRNb250aDogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxyXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChOR1hfTUFUX0RBVEVfRk9STUFUUykgcHJpdmF0ZSBfZGF0ZUZvcm1hdHM6IE5neE1hdERhdGVGb3JtYXRzLFxyXG4gICAgQE9wdGlvbmFsKCkgcHVibGljIF9kYXRlQWRhcHRlcjogTmd4TWF0RGF0ZUFkYXB0ZXI8RD4sXHJcbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI/OiBEaXJlY3Rpb25hbGl0eSkge1xyXG4gICAgaWYgKCF0aGlzLl9kYXRlQWRhcHRlcikge1xyXG4gICAgICB0aHJvdyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvcignTmd4TWF0RGF0ZUFkYXB0ZXInKTtcclxuICAgIH1cclxuICAgIGlmICghdGhpcy5fZGF0ZUZvcm1hdHMpIHtcclxuICAgICAgdGhyb3cgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IoJ05HWF9NQVRfREFURV9GT1JNQVRTJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLnRvZGF5KCk7XHJcbiAgfVxyXG5cclxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XHJcbiAgICB0aGlzLl9yZXJlbmRlclN1YnNjcmlwdGlvbiA9IHRoaXMuX2RhdGVBZGFwdGVyLmxvY2FsZUNoYW5nZXNcclxuICAgICAgLnBpcGUoc3RhcnRXaXRoKG51bGwpKVxyXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2luaXQoKSk7XHJcbiAgfVxyXG5cclxuICBuZ09uRGVzdHJveSgpIHtcclxuICAgIHRoaXMuX3JlcmVuZGVyU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XHJcbiAgfVxyXG5cclxuICAvKiogSGFuZGxlcyB3aGVuIGEgbmV3IG1vbnRoIGlzIHNlbGVjdGVkLiAqL1xyXG4gIF9tb250aFNlbGVjdGVkKGV2ZW50OiBOZ3hNYXRDYWxlbmRhclVzZXJFdmVudDxudW1iZXI+KSB7XHJcbiAgICBjb25zdCBtb250aCA9IGV2ZW50LnZhbHVlO1xyXG4gICAgY29uc3Qgbm9ybWFsaXplZERhdGUgPVxyXG4gICAgICB0aGlzLl9kYXRlQWRhcHRlci5jcmVhdGVEYXRlKHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5hY3RpdmVEYXRlKSwgbW9udGgsIDEpO1xyXG5cclxuICAgIHRoaXMubW9udGhTZWxlY3RlZC5lbWl0KG5vcm1hbGl6ZWREYXRlKTtcclxuXHJcbiAgICBjb25zdCBkYXlzSW5Nb250aCA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldE51bURheXNJbk1vbnRoKG5vcm1hbGl6ZWREYXRlKTtcclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkQ2hhbmdlLmVtaXQodGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZShcclxuICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0WWVhcih0aGlzLmFjdGl2ZURhdGUpLCBtb250aCxcclxuICAgICAgTWF0aC5taW4odGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0RGF0ZSh0aGlzLmFjdGl2ZURhdGUpLCBkYXlzSW5Nb250aCkpKTtcclxuICB9XHJcblxyXG4gIC8qKiBIYW5kbGVzIGtleWRvd24gZXZlbnRzIG9uIHRoZSBjYWxlbmRhciBib2R5IHdoZW4gY2FsZW5kYXIgaXMgaW4geWVhciB2aWV3LiAqL1xyXG4gIF9oYW5kbGVDYWxlbmRhckJvZHlLZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XHJcbiAgICAvLyBUT0RPKG1tYWxlcmJhKTogV2UgY3VycmVudGx5IGFsbG93IGtleWJvYXJkIG5hdmlnYXRpb24gdG8gZGlzYWJsZWQgZGF0ZXMsIGJ1dCBqdXN0IHByZXZlbnRcclxuICAgIC8vIGRpc2FibGVkIG9uZXMgZnJvbSBiZWluZyBzZWxlY3RlZC4gVGhpcyBtYXkgbm90IGJlIGlkZWFsLCB3ZSBzaG91bGQgbG9vayBpbnRvIHdoZXRoZXJcclxuICAgIC8vIG5hdmlnYXRpb24gc2hvdWxkIHNraXAgb3ZlciBkaXNhYmxlZCBkYXRlcywgYW5kIGlmIHNvLCBob3cgdG8gaW1wbGVtZW50IHRoYXQgZWZmaWNpZW50bHkuXHJcblxyXG4gICAgY29uc3Qgb2xkQWN0aXZlRGF0ZSA9IHRoaXMuX2FjdGl2ZURhdGU7XHJcbiAgICBjb25zdCBpc1J0bCA9IHRoaXMuX2lzUnRsKCk7XHJcblxyXG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XHJcbiAgICAgIGNhc2UgTEVGVF9BUlJPVzpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhck1vbnRocyh0aGlzLl9hY3RpdmVEYXRlLCBpc1J0bCA/IDEgOiAtMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJNb250aHModGhpcy5fYWN0aXZlRGF0ZSwgaXNSdGwgPyAtMSA6IDEpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFVQX0FSUk9XOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyTW9udGhzKHRoaXMuX2FjdGl2ZURhdGUsIC00KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBET1dOX0FSUk9XOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyTW9udGhzKHRoaXMuX2FjdGl2ZURhdGUsIDQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEhPTUU6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJNb250aHModGhpcy5fYWN0aXZlRGF0ZSxcclxuICAgICAgICAgIC10aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aCh0aGlzLl9hY3RpdmVEYXRlKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgRU5EOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyTW9udGhzKHRoaXMuX2FjdGl2ZURhdGUsXHJcbiAgICAgICAgICAxMSAtIHRoaXMuX2RhdGVBZGFwdGVyLmdldE1vbnRoKHRoaXMuX2FjdGl2ZURhdGUpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBQQUdFX1VQOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9XHJcbiAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhclllYXJzKHRoaXMuX2FjdGl2ZURhdGUsIGV2ZW50LmFsdEtleSA/IC0xMCA6IC0xKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBQQUdFX0RPV046XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID1cclxuICAgICAgICAgIHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyWWVhcnModGhpcy5fYWN0aXZlRGF0ZSwgZXZlbnQuYWx0S2V5ID8gMTAgOiAxKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBFTlRFUjpcclxuICAgICAgY2FzZSBTUEFDRTpcclxuICAgICAgICB0aGlzLl9tb250aFNlbGVjdGVkKHsgdmFsdWU6IHRoaXMuX2RhdGVBZGFwdGVyLmdldE1vbnRoKHRoaXMuX2FjdGl2ZURhdGUpLCBldmVudCB9KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICAvLyBEb24ndCBwcmV2ZW50IGRlZmF1bHQgb3IgZm9jdXMgYWN0aXZlIGNlbGwgb24ga2V5cyB0aGF0IHdlIGRvbid0IGV4cGxpY2l0bHkgaGFuZGxlLlxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fZGF0ZUFkYXB0ZXIuY29tcGFyZURhdGUob2xkQWN0aXZlRGF0ZSwgdGhpcy5hY3RpdmVEYXRlKSkge1xyXG4gICAgICB0aGlzLmFjdGl2ZURhdGVDaGFuZ2UuZW1pdCh0aGlzLmFjdGl2ZURhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2ZvY3VzQWN0aXZlQ2VsbCgpO1xyXG4gICAgLy8gUHJldmVudCB1bmV4cGVjdGVkIGRlZmF1bHQgYWN0aW9ucyBzdWNoIGFzIGZvcm0gc3VibWlzc2lvbi5cclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfVxyXG5cclxuICAvKiogSW5pdGlhbGl6ZXMgdGhpcyB5ZWFyIHZpZXcuICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLl9zZXRTZWxlY3RlZE1vbnRoKHRoaXMuc2VsZWN0ZWQpO1xyXG4gICAgdGhpcy5fdG9kYXlNb250aCA9IHRoaXMuX2dldE1vbnRoSW5DdXJyZW50WWVhcih0aGlzLl9kYXRlQWRhcHRlci50b2RheSgpKTtcclxuICAgIHRoaXMuX3llYXJMYWJlbCA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXJOYW1lKHRoaXMuYWN0aXZlRGF0ZSk7XHJcblxyXG4gICAgbGV0IG1vbnRoTmFtZXMgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aE5hbWVzKCdzaG9ydCcpO1xyXG4gICAgLy8gRmlyc3Qgcm93IG9mIG1vbnRocyBvbmx5IGNvbnRhaW5zIDUgZWxlbWVudHMgc28gd2UgY2FuIGZpdCB0aGUgeWVhciBsYWJlbCBvbiB0aGUgc2FtZSByb3cuXHJcbiAgICB0aGlzLl9tb250aHMgPSBbWzAsIDEsIDIsIDNdLCBbNCwgNSwgNiwgN10sIFs4LCA5LCAxMCwgMTFdXS5tYXAocm93ID0+IHJvdy5tYXAoXHJcbiAgICAgIG1vbnRoID0+IHRoaXMuX2NyZWF0ZUNlbGxGb3JNb250aChtb250aCwgbW9udGhOYW1lc1ttb250aF0pKSk7XHJcbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcclxuICB9XHJcblxyXG4gIC8qKiBGb2N1c2VzIHRoZSBhY3RpdmUgY2VsbCBhZnRlciB0aGUgbWljcm90YXNrIHF1ZXVlIGlzIGVtcHR5LiAqL1xyXG4gIF9mb2N1c0FjdGl2ZUNlbGwoKSB7XHJcbiAgICB0aGlzLl9tYXRDYWxlbmRhckJvZHkuX2ZvY3VzQWN0aXZlQ2VsbCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbW9udGggaW4gdGhpcyB5ZWFyIHRoYXQgdGhlIGdpdmVuIERhdGUgZmFsbHMgb24uXHJcbiAgICogUmV0dXJucyBudWxsIGlmIHRoZSBnaXZlbiBEYXRlIGlzIGluIGFub3RoZXIgeWVhci5cclxuICAgKi9cclxuICBwcml2YXRlIF9nZXRNb250aEluQ3VycmVudFllYXIoZGF0ZTogRCB8IG51bGwpIHtcclxuICAgIHJldHVybiBkYXRlICYmIHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIoZGF0ZSkgPT0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0WWVhcih0aGlzLmFjdGl2ZURhdGUpID9cclxuICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGgoZGF0ZSkgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqIENyZWF0ZXMgYW4gTWF0Q2FsZW5kYXJDZWxsIGZvciB0aGUgZ2l2ZW4gbW9udGguICovXHJcbiAgcHJpdmF0ZSBfY3JlYXRlQ2VsbEZvck1vbnRoKG1vbnRoOiBudW1iZXIsIG1vbnRoTmFtZTogc3RyaW5nKSB7XHJcbiAgICBsZXQgYXJpYUxhYmVsID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZm9ybWF0KFxyXG4gICAgICB0aGlzLl9kYXRlQWRhcHRlci5jcmVhdGVEYXRlKHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5hY3RpdmVEYXRlKSwgbW9udGgsIDEpLFxyXG4gICAgICB0aGlzLl9kYXRlRm9ybWF0cy5kaXNwbGF5Lm1vbnRoWWVhckExMXlMYWJlbCk7XHJcbiAgICByZXR1cm4gbmV3IE5neE1hdENhbGVuZGFyQ2VsbChcclxuICAgICAgbW9udGgsIG1vbnRoTmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpLCBhcmlhTGFiZWwsIHRoaXMuX3Nob3VsZEVuYWJsZU1vbnRoKG1vbnRoKSk7XHJcbiAgfVxyXG5cclxuICAvKiogV2hldGhlciB0aGUgZ2l2ZW4gbW9udGggaXMgZW5hYmxlZC4gKi9cclxuICBwcml2YXRlIF9zaG91bGRFbmFibGVNb250aChtb250aDogbnVtYmVyKSB7XHJcblxyXG4gICAgY29uc3QgYWN0aXZlWWVhciA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5hY3RpdmVEYXRlKTtcclxuXHJcbiAgICBpZiAobW9udGggPT09IHVuZGVmaW5lZCB8fCBtb250aCA9PT0gbnVsbCB8fFxyXG4gICAgICB0aGlzLl9pc1llYXJBbmRNb250aEFmdGVyTWF4RGF0ZShhY3RpdmVZZWFyLCBtb250aCkgfHxcclxuICAgICAgdGhpcy5faXNZZWFyQW5kTW9udGhCZWZvcmVNaW5EYXRlKGFjdGl2ZVllYXIsIG1vbnRoKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmRhdGVGaWx0ZXIpIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmlyc3RPZk1vbnRoID0gdGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZShhY3RpdmVZZWFyLCBtb250aCwgMSk7XHJcblxyXG4gICAgLy8gSWYgYW55IGRhdGUgaW4gdGhlIG1vbnRoIGlzIGVuYWJsZWQgY291bnQgdGhlIG1vbnRoIGFzIGVuYWJsZWQuXHJcbiAgICBmb3IgKGxldCBkYXRlID0gZmlyc3RPZk1vbnRoOyB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aChkYXRlKSA9PSBtb250aDtcclxuICAgICAgZGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyRGF5cyhkYXRlLCAxKSkge1xyXG4gICAgICBpZiAodGhpcy5kYXRlRmlsdGVyKGRhdGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUZXN0cyB3aGV0aGVyIHRoZSBjb21iaW5hdGlvbiBtb250aC95ZWFyIGlzIGFmdGVyIHRoaXMubWF4RGF0ZSwgY29uc2lkZXJpbmdcclxuICAgKiBqdXN0IHRoZSBtb250aCBhbmQgeWVhciBvZiB0aGlzLm1heERhdGVcclxuICAgKi9cclxuICBwcml2YXRlIF9pc1llYXJBbmRNb250aEFmdGVyTWF4RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIpIHtcclxuICAgIGlmICh0aGlzLm1heERhdGUpIHtcclxuICAgICAgY29uc3QgbWF4WWVhciA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5tYXhEYXRlKTtcclxuICAgICAgY29uc3QgbWF4TW9udGggPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aCh0aGlzLm1heERhdGUpO1xyXG5cclxuICAgICAgcmV0dXJuIHllYXIgPiBtYXhZZWFyIHx8ICh5ZWFyID09PSBtYXhZZWFyICYmIG1vbnRoID4gbWF4TW9udGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRlc3RzIHdoZXRoZXIgdGhlIGNvbWJpbmF0aW9uIG1vbnRoL3llYXIgaXMgYmVmb3JlIHRoaXMubWluRGF0ZSwgY29uc2lkZXJpbmdcclxuICAgKiBqdXN0IHRoZSBtb250aCBhbmQgeWVhciBvZiB0aGlzLm1pbkRhdGVcclxuICAgKi9cclxuICBwcml2YXRlIF9pc1llYXJBbmRNb250aEJlZm9yZU1pbkRhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyKSB7XHJcbiAgICBpZiAodGhpcy5taW5EYXRlKSB7XHJcbiAgICAgIGNvbnN0IG1pblllYXIgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMubWluRGF0ZSk7XHJcbiAgICAgIGNvbnN0IG1pbk1vbnRoID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGgodGhpcy5taW5EYXRlKTtcclxuXHJcbiAgICAgIHJldHVybiB5ZWFyIDwgbWluWWVhciB8fCAoeWVhciA9PT0gbWluWWVhciAmJiBtb250aCA8IG1pbk1vbnRoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gb2JqIFRoZSBvYmplY3QgdG8gY2hlY2suXHJcbiAgICogQHJldHVybnMgVGhlIGdpdmVuIG9iamVjdCBpZiBpdCBpcyBib3RoIGEgZGF0ZSBpbnN0YW5jZSBhbmQgdmFsaWQsIG90aGVyd2lzZSBudWxsLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2dldFZhbGlkRGF0ZU9yTnVsbChvYmo6IGFueSk6IEQgfCBudWxsIHtcclxuICAgIHJldHVybiAodGhpcy5fZGF0ZUFkYXB0ZXIuaXNEYXRlSW5zdGFuY2Uob2JqKSAmJiB0aGlzLl9kYXRlQWRhcHRlci5pc1ZhbGlkKG9iaikpID8gb2JqIDogbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHVzZXIgaGFzIHRoZSBSVEwgbGF5b3V0IGRpcmVjdGlvbi4gKi9cclxuICBwcml2YXRlIF9pc1J0bCgpIHtcclxuICAgIHJldHVybiB0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJztcclxuICB9XHJcblxyXG4gIC8qKiBTZXRzIHRoZSBjdXJyZW50bHktc2VsZWN0ZWQgbW9udGggYmFzZWQgb24gYSBtb2RlbCB2YWx1ZS4gKi9cclxuICBwcml2YXRlIF9zZXRTZWxlY3RlZE1vbnRoKHZhbHVlOiBEYXRlUmFuZ2U8RD4gfCBEIHwgbnVsbCkge1xyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZVJhbmdlKSB7XHJcbiAgICAgIHRoaXMuX3NlbGVjdGVkTW9udGggPSB0aGlzLl9nZXRNb250aEluQ3VycmVudFllYXIodmFsdWUuc3RhcnQpIHx8XHJcbiAgICAgICAgdGhpcy5fZ2V0TW9udGhJbkN1cnJlbnRZZWFyKHZhbHVlLmVuZCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9zZWxlY3RlZE1vbnRoID0gdGhpcy5fZ2V0TW9udGhJbkN1cnJlbnRZZWFyKHZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiPHRhYmxlIGNsYXNzPVwibWF0LWNhbGVuZGFyLXRhYmxlXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPlxyXG4gIDx0aGVhZCBjbGFzcz1cIm1hdC1jYWxlbmRhci10YWJsZS1oZWFkZXJcIj5cclxuICAgIDx0cj48dGggY2xhc3M9XCJtYXQtY2FsZW5kYXItdGFibGUtaGVhZGVyLWRpdmlkZXJcIiBjb2xzcGFuPVwiNFwiPjwvdGg+PC90cj5cclxuICA8L3RoZWFkPlxyXG4gIDx0Ym9keSBuZ3gtbWF0LWNhbGVuZGFyLWJvZHlcclxuICAgICAgICAgW2xhYmVsXT1cIl95ZWFyTGFiZWxcIlxyXG4gICAgICAgICBbcm93c109XCJfbW9udGhzXCJcclxuICAgICAgICAgW3RvZGF5VmFsdWVdPVwiX3RvZGF5TW9udGghXCJcclxuICAgICAgICAgW3N0YXJ0VmFsdWVdPVwiX3NlbGVjdGVkTW9udGghXCJcclxuICAgICAgICAgW2VuZFZhbHVlXT1cIl9zZWxlY3RlZE1vbnRoIVwiXHJcbiAgICAgICAgIFtsYWJlbE1pblJlcXVpcmVkQ2VsbHNdPVwiMlwiXHJcbiAgICAgICAgIFtudW1Db2xzXT1cIjRcIlxyXG4gICAgICAgICBbY2VsbEFzcGVjdFJhdGlvXT1cIjQgLyA3XCJcclxuICAgICAgICAgW2FjdGl2ZUNlbGxdPVwiX2RhdGVBZGFwdGVyLmdldE1vbnRoKGFjdGl2ZURhdGUpXCJcclxuICAgICAgICAgKHNlbGVjdGVkVmFsdWVDaGFuZ2UpPVwiX21vbnRoU2VsZWN0ZWQoJGV2ZW50KVwiXHJcbiAgICAgICAgIChrZXlkb3duKT1cIl9oYW5kbGVDYWxlbmRhckJvZHlLZXlkb3duKCRldmVudClcIj5cclxuICA8L3Rib2R5PlxyXG48L3RhYmxlPlxyXG4iXX0=