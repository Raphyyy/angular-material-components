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
    _changeDetectorRef;
    _dateFormats;
    _dateAdapter;
    _dir;
    _rerenderSubscription = Subscription.EMPTY;
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
    _activeDate;
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
    _selected;
    /** The minimum selectable date. */
    get minDate() { return this._minDate; }
    set minDate(value) {
        this._minDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    _minDate;
    /** The maximum selectable date. */
    get maxDate() { return this._maxDate; }
    set maxDate(value) {
        this._maxDate = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    _maxDate;
    /** A function used to filter which dates are selectable. */
    dateFilter;
    /** Emits when a new month is selected. */
    selectedChange = new EventEmitter();
    /** Emits the selected month. This doesn't imply a change on the selected date */
    monthSelected = new EventEmitter();
    /** Emits when any date is activated. */
    activeDateChange = new EventEmitter();
    /** The body of calendar table */
    _matCalendarBody;
    /** Grid of calendar cells representing the months of the year. */
    _months;
    /** The label for this year (e.g. "2017"). */
    _yearLabel;
    /** The month in this year that today falls on. Null if today is in a different year. */
    _todayMonth;
    /**
     * The month in this year that the selected Date falls on.
     * Null if the selected Date is in a different year.
     */
    _selectedMonth;
    constructor(_changeDetectorRef, _dateFormats, _dateAdapter, _dir) {
        this._changeDetectorRef = _changeDetectorRef;
        this._dateFormats = _dateFormats;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        if (!this._dateFormats) {
            throw createMissingDateImplError('NGX_MAT_DATE_FORMATS');
        }
        this._activeDate = this._dateAdapter.today();
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
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatYearView, deps: [{ token: i0.ChangeDetectorRef }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i1.NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Component });
    /** @nocollapse */ static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.11", type: NgxMatYearView, selector: "ngx-mat-year-view", inputs: { activeDate: "activeDate", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter" }, outputs: { selectedChange: "selectedChange", monthSelected: "monthSelected", activeDateChange: "activeDateChange" }, viewQueries: [{ propertyName: "_matCalendarBody", first: true, predicate: NgxMatCalendarBody, descendants: true }], exportAs: ["ngxMatYearView"], ngImport: i0, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_yearLabel\"\r\n         [rows]=\"_months\"\r\n         [todayValue]=\"_todayMonth!\"\r\n         [startValue]=\"_selectedMonth!\"\r\n         [endValue]=\"_selectedMonth!\"\r\n         [labelMinRequiredCells]=\"2\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_dateAdapter.getMonth(activeDate)\"\r\n         (selectedValueChange)=\"_monthSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n", dependencies: [{ kind: "component", type: i3.NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: ["label", "rows", "todayValue", "startValue", "endValue", "labelMinRequiredCells", "numCols", "activeCell", "isRange", "cellAspectRatio", "comparisonStart", "comparisonEnd", "previewStart", "previewEnd"], outputs: ["selectedValueChange", "previewChange"], exportAs: ["NgxMatCalendarBody"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatYearView, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-year-view', exportAs: 'ngxMatYearView', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_yearLabel\"\r\n         [rows]=\"_months\"\r\n         [todayValue]=\"_todayMonth!\"\r\n         [startValue]=\"_selectedMonth!\"\r\n         [endValue]=\"_selectedMonth!\"\r\n         [labelMinRequiredCells]=\"2\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_dateAdapter.getMonth(activeDate)\"\r\n         (selectedValueChange)=\"_monthSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n" }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [NGX_MAT_DATE_FORMATS]
                }] }, { type: i1.NgxMatDateAdapter, decorators: [{
                    type: Optional
                }] }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }], propDecorators: { activeDate: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieWVhci12aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIveWVhci12aWV3LnRzIiwiLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIveWVhci12aWV3Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFVBQVUsRUFDVixHQUFHLEVBQ0gsS0FBSyxFQUNMLElBQUksRUFDSixVQUFVLEVBQ1YsU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsUUFBUSxFQUNSLEtBQUssR0FDTixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFFTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUNULFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULGlCQUFpQixHQUVsQixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3BDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDekQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUEyQixNQUFNLGlCQUFpQixDQUFDO0FBQ2xHLE9BQU8sRUFBRSxvQkFBb0IsRUFBcUIsTUFBTSxxQkFBcUIsQ0FBQztBQUU5RSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQzs7Ozs7QUFFaEU7OztHQUdHO0FBUUgsTUFBTSxPQUFPLGNBQWM7SUE2RUw7SUFDZ0M7SUFDL0I7SUFDQztJQS9FZCxxQkFBcUIsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBRW5ELHlGQUF5RjtJQUN6RixJQUNJLFVBQVUsS0FBUSxPQUFPLElBQUksQ0FBQyxX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QztnQkFDNUQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQyxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7SUFDSCxDQUFDOzJIQS9SVSxjQUFjLG1EQThFSCxvQkFBb0I7K0dBOUUvQixjQUFjLDhWQTREZCxrQkFBa0IsOEVDbEgvQiwydkJBa0JBOzs0RkRvQ2EsY0FBYztrQkFQMUIsU0FBUzsrQkFDRSxtQkFBbUIsWUFFbkIsZ0JBQWdCLGlCQUNYLGlCQUFpQixDQUFDLElBQUksbUJBQ3BCLHVCQUF1QixDQUFDLE1BQU07OzBCQWdGNUMsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxvQkFBb0I7OzBCQUN2QyxRQUFROzswQkFDUixRQUFRO3lDQTNFUCxVQUFVO3NCQURiLEtBQUs7Z0JBZUYsUUFBUTtzQkFEWCxLQUFLO2dCQWVGLE9BQU87c0JBRFYsS0FBSztnQkFTRixPQUFPO3NCQURWLEtBQUs7Z0JBUUcsVUFBVTtzQkFBbEIsS0FBSztnQkFHYSxjQUFjO3NCQUFoQyxNQUFNO2dCQUdZLGFBQWE7c0JBQS9CLE1BQU07Z0JBR1ksZ0JBQWdCO3NCQUFsQyxNQUFNO2dCQUd3QixnQkFBZ0I7c0JBQTlDLFNBQVM7dUJBQUMsa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBsaWNlbnNlXHJcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXHJcbiAqXHJcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXHJcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcclxuICovXHJcblxyXG5pbXBvcnQge1xyXG4gIERPV05fQVJST1csXHJcbiAgRU5ELFxyXG4gIEVOVEVSLFxyXG4gIEhPTUUsXHJcbiAgTEVGVF9BUlJPVyxcclxuICBQQUdFX0RPV04sXHJcbiAgUEFHRV9VUCxcclxuICBSSUdIVF9BUlJPVyxcclxuICBVUF9BUlJPVyxcclxuICBTUEFDRSxcclxufSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xyXG5pbXBvcnQge1xyXG4gIEFmdGVyQ29udGVudEluaXQsXHJcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXHJcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXHJcbiAgQ29tcG9uZW50LFxyXG4gIEV2ZW50RW1pdHRlcixcclxuICBJbmplY3QsXHJcbiAgSW5wdXQsXHJcbiAgT3B0aW9uYWwsXHJcbiAgT3V0cHV0LFxyXG4gIFZpZXdDaGlsZCxcclxuICBWaWV3RW5jYXBzdWxhdGlvbixcclxuICBPbkRlc3Ryb3ksXHJcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IERpcmVjdGlvbmFsaXR5IH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xyXG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgc3RhcnRXaXRoIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5pbXBvcnQgeyBEYXRlUmFuZ2UgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9kYXRlcGlja2VyJztcclxuaW1wb3J0IHsgTmd4TWF0Q2FsZW5kYXJCb2R5LCBOZ3hNYXRDYWxlbmRhckNlbGwsIE5neE1hdENhbGVuZGFyVXNlckV2ZW50IH0gZnJvbSAnLi9jYWxlbmRhci1ib2R5JztcclxuaW1wb3J0IHsgTkdYX01BVF9EQVRFX0ZPUk1BVFMsIE5neE1hdERhdGVGb3JtYXRzIH0gZnJvbSAnLi9jb3JlL2RhdGUtZm9ybWF0cyc7XHJcbmltcG9ydCB7IE5neE1hdERhdGVBZGFwdGVyIH0gZnJvbSAnLi9jb3JlL2RhdGUtYWRhcHRlcic7XHJcbmltcG9ydCB7IGNyZWF0ZU1pc3NpbmdEYXRlSW1wbEVycm9yIH0gZnJvbSAnLi91dGlscy9kYXRlLXV0aWxzJztcclxuXHJcbi8qKlxyXG4gKiBBbiBpbnRlcm5hbCBjb21wb25lbnQgdXNlZCB0byBkaXNwbGF5IGEgc2luZ2xlIHllYXIgaW4gdGhlIGRhdGVwaWNrZXIuXHJcbiAqIEBkb2NzLXByaXZhdGVcclxuICovXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnbmd4LW1hdC15ZWFyLXZpZXcnLFxyXG4gIHRlbXBsYXRlVXJsOiAneWVhci12aWV3Lmh0bWwnLFxyXG4gIGV4cG9ydEFzOiAnbmd4TWF0WWVhclZpZXcnLFxyXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXHJcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hcclxufSlcclxuZXhwb3J0IGNsYXNzIE5neE1hdFllYXJWaWV3PEQ+IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95IHtcclxuICBwcml2YXRlIF9yZXJlbmRlclN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcclxuXHJcbiAgLyoqIFRoZSBkYXRlIHRvIGRpc3BsYXkgaW4gdGhpcyB5ZWFyIHZpZXcgKGV2ZXJ5dGhpbmcgb3RoZXIgdGhhbiB0aGUgeWVhciBpcyBpZ25vcmVkKS4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBhY3RpdmVEYXRlKCk6IEQgeyByZXR1cm4gdGhpcy5fYWN0aXZlRGF0ZTsgfVxyXG4gIHNldCBhY3RpdmVEYXRlKHZhbHVlOiBEKSB7XHJcbiAgICBsZXQgb2xkQWN0aXZlRGF0ZSA9IHRoaXMuX2FjdGl2ZURhdGU7XHJcbiAgICBjb25zdCB2YWxpZERhdGUgPVxyXG4gICAgICB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUodmFsdWUpKSB8fCB0aGlzLl9kYXRlQWRhcHRlci50b2RheSgpO1xyXG4gICAgdGhpcy5fYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmNsYW1wRGF0ZSh2YWxpZERhdGUsIHRoaXMubWluRGF0ZSwgdGhpcy5tYXhEYXRlKTtcclxuICAgIGlmICh0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKG9sZEFjdGl2ZURhdGUpICE9PSB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMuX2FjdGl2ZURhdGUpKSB7XHJcbiAgICAgIHRoaXMuX2luaXQoKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHJpdmF0ZSBfYWN0aXZlRGF0ZTogRDtcclxuXHJcbiAgLyoqIFRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZGF0ZS4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBzZWxlY3RlZCgpOiBEYXRlUmFuZ2U8RD4gfCBEIHwgbnVsbCB7IHJldHVybiB0aGlzLl9zZWxlY3RlZDsgfVxyXG4gIHNldCBzZWxlY3RlZCh2YWx1ZTogRGF0ZVJhbmdlPEQ+IHwgRCB8IG51bGwpIHtcclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGVSYW5nZSkge1xyXG4gICAgICB0aGlzLl9zZWxlY3RlZCA9IHZhbHVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fc2VsZWN0ZWQgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUodmFsdWUpKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9zZXRTZWxlY3RlZE1vbnRoKHZhbHVlKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBfc2VsZWN0ZWQ6IERhdGVSYW5nZTxEPiB8IEQgfCBudWxsO1xyXG5cclxuICAvKiogVGhlIG1pbmltdW0gc2VsZWN0YWJsZSBkYXRlLiAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IG1pbkRhdGUoKTogRCB8IG51bGwgeyByZXR1cm4gdGhpcy5fbWluRGF0ZTsgfVxyXG4gIHNldCBtaW5EYXRlKHZhbHVlOiBEIHwgbnVsbCkge1xyXG4gICAgdGhpcy5fbWluRGF0ZSA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpO1xyXG4gIH1cclxuICBwcml2YXRlIF9taW5EYXRlOiBEIHwgbnVsbDtcclxuXHJcbiAgLyoqIFRoZSBtYXhpbXVtIHNlbGVjdGFibGUgZGF0ZS4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBtYXhEYXRlKCk6IEQgfCBudWxsIHsgcmV0dXJuIHRoaXMuX21heERhdGU7IH1cclxuICBzZXQgbWF4RGF0ZSh2YWx1ZTogRCB8IG51bGwpIHtcclxuICAgIHRoaXMuX21heERhdGUgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUodmFsdWUpKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBfbWF4RGF0ZTogRCB8IG51bGw7XHJcblxyXG4gIC8qKiBBIGZ1bmN0aW9uIHVzZWQgdG8gZmlsdGVyIHdoaWNoIGRhdGVzIGFyZSBzZWxlY3RhYmxlLiAqL1xyXG4gIEBJbnB1dCgpIGRhdGVGaWx0ZXI6IChkYXRlOiBEKSA9PiBib29sZWFuO1xyXG5cclxuICAvKiogRW1pdHMgd2hlbiBhIG5ldyBtb250aCBpcyBzZWxlY3RlZC4gKi9cclxuICBAT3V0cHV0KCkgcmVhZG9ubHkgc2VsZWN0ZWRDaGFuZ2U6IEV2ZW50RW1pdHRlcjxEPiA9IG5ldyBFdmVudEVtaXR0ZXI8RD4oKTtcclxuXHJcbiAgLyoqIEVtaXRzIHRoZSBzZWxlY3RlZCBtb250aC4gVGhpcyBkb2Vzbid0IGltcGx5IGEgY2hhbmdlIG9uIHRoZSBzZWxlY3RlZCBkYXRlICovXHJcbiAgQE91dHB1dCgpIHJlYWRvbmx5IG1vbnRoU2VsZWN0ZWQ6IEV2ZW50RW1pdHRlcjxEPiA9IG5ldyBFdmVudEVtaXR0ZXI8RD4oKTtcclxuXHJcbiAgLyoqIEVtaXRzIHdoZW4gYW55IGRhdGUgaXMgYWN0aXZhdGVkLiAqL1xyXG4gIEBPdXRwdXQoKSByZWFkb25seSBhY3RpdmVEYXRlQ2hhbmdlOiBFdmVudEVtaXR0ZXI8RD4gPSBuZXcgRXZlbnRFbWl0dGVyPEQ+KCk7XHJcblxyXG4gIC8qKiBUaGUgYm9keSBvZiBjYWxlbmRhciB0YWJsZSAqL1xyXG4gIEBWaWV3Q2hpbGQoTmd4TWF0Q2FsZW5kYXJCb2R5KSBfbWF0Q2FsZW5kYXJCb2R5OiBOZ3hNYXRDYWxlbmRhckJvZHk7XHJcblxyXG4gIC8qKiBHcmlkIG9mIGNhbGVuZGFyIGNlbGxzIHJlcHJlc2VudGluZyB0aGUgbW9udGhzIG9mIHRoZSB5ZWFyLiAqL1xyXG4gIF9tb250aHM6IE5neE1hdENhbGVuZGFyQ2VsbFtdW107XHJcblxyXG4gIC8qKiBUaGUgbGFiZWwgZm9yIHRoaXMgeWVhciAoZS5nLiBcIjIwMTdcIikuICovXHJcbiAgX3llYXJMYWJlbDogc3RyaW5nO1xyXG5cclxuICAvKiogVGhlIG1vbnRoIGluIHRoaXMgeWVhciB0aGF0IHRvZGF5IGZhbGxzIG9uLiBOdWxsIGlmIHRvZGF5IGlzIGluIGEgZGlmZmVyZW50IHllYXIuICovXHJcbiAgX3RvZGF5TW9udGg6IG51bWJlciB8IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBtb250aCBpbiB0aGlzIHllYXIgdGhhdCB0aGUgc2VsZWN0ZWQgRGF0ZSBmYWxscyBvbi5cclxuICAgKiBOdWxsIGlmIHRoZSBzZWxlY3RlZCBEYXRlIGlzIGluIGEgZGlmZmVyZW50IHllYXIuXHJcbiAgICovXHJcbiAgX3NlbGVjdGVkTW9udGg6IG51bWJlciB8IG51bGw7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcclxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoTkdYX01BVF9EQVRFX0ZPUk1BVFMpIHByaXZhdGUgX2RhdGVGb3JtYXRzOiBOZ3hNYXREYXRlRm9ybWF0cyxcclxuICAgIEBPcHRpb25hbCgpIHB1YmxpYyBfZGF0ZUFkYXB0ZXI6IE5neE1hdERhdGVBZGFwdGVyPEQ+LFxyXG4gICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyPzogRGlyZWN0aW9uYWxpdHkpIHtcclxuICAgIGlmICghdGhpcy5fZGF0ZUFkYXB0ZXIpIHtcclxuICAgICAgdGhyb3cgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IoJ05neE1hdERhdGVBZGFwdGVyJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMuX2RhdGVGb3JtYXRzKSB7XHJcbiAgICAgIHRocm93IGNyZWF0ZU1pc3NpbmdEYXRlSW1wbEVycm9yKCdOR1hfTUFUX0RBVEVfRk9STUFUUycpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2FjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci50b2RheSgpO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xyXG4gICAgdGhpcy5fcmVyZW5kZXJTdWJzY3JpcHRpb24gPSB0aGlzLl9kYXRlQWRhcHRlci5sb2NhbGVDaGFuZ2VzXHJcbiAgICAgIC5waXBlKHN0YXJ0V2l0aChudWxsKSlcclxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9pbml0KCkpO1xyXG4gIH1cclxuXHJcbiAgbmdPbkRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLl9yZXJlbmRlclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEhhbmRsZXMgd2hlbiBhIG5ldyBtb250aCBpcyBzZWxlY3RlZC4gKi9cclxuICBfbW9udGhTZWxlY3RlZChldmVudDogTmd4TWF0Q2FsZW5kYXJVc2VyRXZlbnQ8bnVtYmVyPikge1xyXG4gICAgY29uc3QgbW9udGggPSBldmVudC52YWx1ZTtcclxuICAgIGNvbnN0IG5vcm1hbGl6ZWREYXRlID1cclxuICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZSh0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMuYWN0aXZlRGF0ZSksIG1vbnRoLCAxKTtcclxuXHJcbiAgICB0aGlzLm1vbnRoU2VsZWN0ZWQuZW1pdChub3JtYWxpemVkRGF0ZSk7XHJcblxyXG4gICAgY29uc3QgZGF5c0luTW9udGggPSB0aGlzLl9kYXRlQWRhcHRlci5nZXROdW1EYXlzSW5Nb250aChub3JtYWxpemVkRGF0ZSk7XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZENoYW5nZS5lbWl0KHRoaXMuX2RhdGVBZGFwdGVyLmNyZWF0ZURhdGUoXHJcbiAgICAgIHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5hY3RpdmVEYXRlKSwgbW9udGgsXHJcbiAgICAgIE1hdGgubWluKHRoaXMuX2RhdGVBZGFwdGVyLmdldERhdGUodGhpcy5hY3RpdmVEYXRlKSwgZGF5c0luTW9udGgpKSk7XHJcbiAgfVxyXG5cclxuICAvKiogSGFuZGxlcyBrZXlkb3duIGV2ZW50cyBvbiB0aGUgY2FsZW5kYXIgYm9keSB3aGVuIGNhbGVuZGFyIGlzIGluIHllYXIgdmlldy4gKi9cclxuICBfaGFuZGxlQ2FsZW5kYXJCb2R5S2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xyXG4gICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIGN1cnJlbnRseSBhbGxvdyBrZXlib2FyZCBuYXZpZ2F0aW9uIHRvIGRpc2FibGVkIGRhdGVzLCBidXQganVzdCBwcmV2ZW50XHJcbiAgICAvLyBkaXNhYmxlZCBvbmVzIGZyb20gYmVpbmcgc2VsZWN0ZWQuIFRoaXMgbWF5IG5vdCBiZSBpZGVhbCwgd2Ugc2hvdWxkIGxvb2sgaW50byB3aGV0aGVyXHJcbiAgICAvLyBuYXZpZ2F0aW9uIHNob3VsZCBza2lwIG92ZXIgZGlzYWJsZWQgZGF0ZXMsIGFuZCBpZiBzbywgaG93IHRvIGltcGxlbWVudCB0aGF0IGVmZmljaWVudGx5LlxyXG5cclxuICAgIGNvbnN0IG9sZEFjdGl2ZURhdGUgPSB0aGlzLl9hY3RpdmVEYXRlO1xyXG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLl9pc1J0bCgpO1xyXG5cclxuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xyXG4gICAgICBjYXNlIExFRlRfQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJNb250aHModGhpcy5fYWN0aXZlRGF0ZSwgaXNSdGwgPyAxIDogLTEpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFJJR0hUX0FSUk9XOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyTW9udGhzKHRoaXMuX2FjdGl2ZURhdGUsIGlzUnRsID8gLTEgOiAxKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBVUF9BUlJPVzpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhck1vbnRocyh0aGlzLl9hY3RpdmVEYXRlLCAtNCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgRE9XTl9BUlJPVzpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhck1vbnRocyh0aGlzLl9hY3RpdmVEYXRlLCA0KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBIT01FOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyTW9udGhzKHRoaXMuX2FjdGl2ZURhdGUsXHJcbiAgICAgICAgICAtdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGgodGhpcy5fYWN0aXZlRGF0ZSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEVORDpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhck1vbnRocyh0aGlzLl9hY3RpdmVEYXRlLFxyXG4gICAgICAgICAgMTEgLSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aCh0aGlzLl9hY3RpdmVEYXRlKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUEFHRV9VUDpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPVxyXG4gICAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJZZWFycyh0aGlzLl9hY3RpdmVEYXRlLCBldmVudC5hbHRLZXkgPyAtMTAgOiAtMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUEFHRV9ET1dOOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9XHJcbiAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhclllYXJzKHRoaXMuX2FjdGl2ZURhdGUsIGV2ZW50LmFsdEtleSA/IDEwIDogMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgRU5URVI6XHJcbiAgICAgIGNhc2UgU1BBQ0U6XHJcbiAgICAgICAgdGhpcy5fbW9udGhTZWxlY3RlZCh7IHZhbHVlOiB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aCh0aGlzLl9hY3RpdmVEYXRlKSwgZXZlbnQgfSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgLy8gRG9uJ3QgcHJldmVudCBkZWZhdWx0IG9yIGZvY3VzIGFjdGl2ZSBjZWxsIG9uIGtleXMgdGhhdCB3ZSBkb24ndCBleHBsaWNpdGx5IGhhbmRsZS5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuX2RhdGVBZGFwdGVyLmNvbXBhcmVEYXRlKG9sZEFjdGl2ZURhdGUsIHRoaXMuYWN0aXZlRGF0ZSkpIHtcclxuICAgICAgdGhpcy5hY3RpdmVEYXRlQ2hhbmdlLmVtaXQodGhpcy5hY3RpdmVEYXRlKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9mb2N1c0FjdGl2ZUNlbGwoKTtcclxuICAgIC8vIFByZXZlbnQgdW5leHBlY3RlZCBkZWZhdWx0IGFjdGlvbnMgc3VjaCBhcyBmb3JtIHN1Ym1pc3Npb24uXHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEluaXRpYWxpemVzIHRoaXMgeWVhciB2aWV3LiAqL1xyXG4gIF9pbml0KCkge1xyXG4gICAgdGhpcy5fc2V0U2VsZWN0ZWRNb250aCh0aGlzLnNlbGVjdGVkKTtcclxuICAgIHRoaXMuX3RvZGF5TW9udGggPSB0aGlzLl9nZXRNb250aEluQ3VycmVudFllYXIodGhpcy5fZGF0ZUFkYXB0ZXIudG9kYXkoKSk7XHJcbiAgICB0aGlzLl95ZWFyTGFiZWwgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyTmFtZSh0aGlzLmFjdGl2ZURhdGUpO1xyXG5cclxuICAgIGxldCBtb250aE5hbWVzID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGhOYW1lcygnc2hvcnQnKTtcclxuICAgIC8vIEZpcnN0IHJvdyBvZiBtb250aHMgb25seSBjb250YWlucyA1IGVsZW1lbnRzIHNvIHdlIGNhbiBmaXQgdGhlIHllYXIgbGFiZWwgb24gdGhlIHNhbWUgcm93LlxyXG4gICAgdGhpcy5fbW9udGhzID0gW1swLCAxLCAyLCAzXSwgWzQsIDUsIDYsIDddLCBbOCwgOSwgMTAsIDExXV0ubWFwKHJvdyA9PiByb3cubWFwKFxyXG4gICAgICBtb250aCA9PiB0aGlzLl9jcmVhdGVDZWxsRm9yTW9udGgobW9udGgsIG1vbnRoTmFtZXNbbW9udGhdKSkpO1xyXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XHJcbiAgfVxyXG5cclxuICAvKiogRm9jdXNlcyB0aGUgYWN0aXZlIGNlbGwgYWZ0ZXIgdGhlIG1pY3JvdGFzayBxdWV1ZSBpcyBlbXB0eS4gKi9cclxuICBfZm9jdXNBY3RpdmVDZWxsKCkge1xyXG4gICAgdGhpcy5fbWF0Q2FsZW5kYXJCb2R5Ll9mb2N1c0FjdGl2ZUNlbGwoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIG1vbnRoIGluIHRoaXMgeWVhciB0aGF0IHRoZSBnaXZlbiBEYXRlIGZhbGxzIG9uLlxyXG4gICAqIFJldHVybnMgbnVsbCBpZiB0aGUgZ2l2ZW4gRGF0ZSBpcyBpbiBhbm90aGVyIHllYXIuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZ2V0TW9udGhJbkN1cnJlbnRZZWFyKGRhdGU6IEQgfCBudWxsKSB7XHJcbiAgICByZXR1cm4gZGF0ZSAmJiB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKGRhdGUpID09IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5hY3RpdmVEYXRlKSA/XHJcbiAgICAgIHRoaXMuX2RhdGVBZGFwdGVyLmdldE1vbnRoKGRhdGUpIDogbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKiBDcmVhdGVzIGFuIE1hdENhbGVuZGFyQ2VsbCBmb3IgdGhlIGdpdmVuIG1vbnRoLiAqL1xyXG4gIHByaXZhdGUgX2NyZWF0ZUNlbGxGb3JNb250aChtb250aDogbnVtYmVyLCBtb250aE5hbWU6IHN0cmluZykge1xyXG4gICAgbGV0IGFyaWFMYWJlbCA9IHRoaXMuX2RhdGVBZGFwdGVyLmZvcm1hdChcclxuICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZSh0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMuYWN0aXZlRGF0ZSksIG1vbnRoLCAxKSxcclxuICAgICAgdGhpcy5fZGF0ZUZvcm1hdHMuZGlzcGxheS5tb250aFllYXJBMTF5TGFiZWwpO1xyXG4gICAgcmV0dXJuIG5ldyBOZ3hNYXRDYWxlbmRhckNlbGwoXHJcbiAgICAgIG1vbnRoLCBtb250aE5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSwgYXJpYUxhYmVsLCB0aGlzLl9zaG91bGRFbmFibGVNb250aChtb250aCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqIFdoZXRoZXIgdGhlIGdpdmVuIG1vbnRoIGlzIGVuYWJsZWQuICovXHJcbiAgcHJpdmF0ZSBfc2hvdWxkRW5hYmxlTW9udGgobW9udGg6IG51bWJlcikge1xyXG5cclxuICAgIGNvbnN0IGFjdGl2ZVllYXIgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMuYWN0aXZlRGF0ZSk7XHJcblxyXG4gICAgaWYgKG1vbnRoID09PSB1bmRlZmluZWQgfHwgbW9udGggPT09IG51bGwgfHxcclxuICAgICAgdGhpcy5faXNZZWFyQW5kTW9udGhBZnRlck1heERhdGUoYWN0aXZlWWVhciwgbW9udGgpIHx8XHJcbiAgICAgIHRoaXMuX2lzWWVhckFuZE1vbnRoQmVmb3JlTWluRGF0ZShhY3RpdmVZZWFyLCBtb250aCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5kYXRlRmlsdGVyKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpcnN0T2ZNb250aCA9IHRoaXMuX2RhdGVBZGFwdGVyLmNyZWF0ZURhdGUoYWN0aXZlWWVhciwgbW9udGgsIDEpO1xyXG5cclxuICAgIC8vIElmIGFueSBkYXRlIGluIHRoZSBtb250aCBpcyBlbmFibGVkIGNvdW50IHRoZSBtb250aCBhcyBlbmFibGVkLlxyXG4gICAgZm9yIChsZXQgZGF0ZSA9IGZpcnN0T2ZNb250aDsgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGgoZGF0ZSkgPT0gbW9udGg7XHJcbiAgICAgIGRhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhckRheXMoZGF0ZSwgMSkpIHtcclxuICAgICAgaWYgKHRoaXMuZGF0ZUZpbHRlcihkYXRlKSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGVzdHMgd2hldGhlciB0aGUgY29tYmluYXRpb24gbW9udGgveWVhciBpcyBhZnRlciB0aGlzLm1heERhdGUsIGNvbnNpZGVyaW5nXHJcbiAgICoganVzdCB0aGUgbW9udGggYW5kIHllYXIgb2YgdGhpcy5tYXhEYXRlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaXNZZWFyQW5kTW9udGhBZnRlck1heERhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyKSB7XHJcbiAgICBpZiAodGhpcy5tYXhEYXRlKSB7XHJcbiAgICAgIGNvbnN0IG1heFllYXIgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMubWF4RGF0ZSk7XHJcbiAgICAgIGNvbnN0IG1heE1vbnRoID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGgodGhpcy5tYXhEYXRlKTtcclxuXHJcbiAgICAgIHJldHVybiB5ZWFyID4gbWF4WWVhciB8fCAoeWVhciA9PT0gbWF4WWVhciAmJiBtb250aCA+IG1heE1vbnRoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUZXN0cyB3aGV0aGVyIHRoZSBjb21iaW5hdGlvbiBtb250aC95ZWFyIGlzIGJlZm9yZSB0aGlzLm1pbkRhdGUsIGNvbnNpZGVyaW5nXHJcbiAgICoganVzdCB0aGUgbW9udGggYW5kIHllYXIgb2YgdGhpcy5taW5EYXRlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaXNZZWFyQW5kTW9udGhCZWZvcmVNaW5EYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlcikge1xyXG4gICAgaWYgKHRoaXMubWluRGF0ZSkge1xyXG4gICAgICBjb25zdCBtaW5ZZWFyID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0WWVhcih0aGlzLm1pbkRhdGUpO1xyXG4gICAgICBjb25zdCBtaW5Nb250aCA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldE1vbnRoKHRoaXMubWluRGF0ZSk7XHJcblxyXG4gICAgICByZXR1cm4geWVhciA8IG1pblllYXIgfHwgKHllYXIgPT09IG1pblllYXIgJiYgbW9udGggPCBtaW5Nb250aCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIG9iaiBUaGUgb2JqZWN0IHRvIGNoZWNrLlxyXG4gICAqIEByZXR1cm5zIFRoZSBnaXZlbiBvYmplY3QgaWYgaXQgaXMgYm90aCBhIGRhdGUgaW5zdGFuY2UgYW5kIHZhbGlkLCBvdGhlcndpc2UgbnVsbC5cclxuICAgKi9cclxuICBwcml2YXRlIF9nZXRWYWxpZERhdGVPck51bGwob2JqOiBhbnkpOiBEIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gKHRoaXMuX2RhdGVBZGFwdGVyLmlzRGF0ZUluc3RhbmNlKG9iaikgJiYgdGhpcy5fZGF0ZUFkYXB0ZXIuaXNWYWxpZChvYmopKSA/IG9iaiA6IG51bGw7XHJcbiAgfVxyXG5cclxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSB1c2VyIGhhcyB0aGUgUlRMIGxheW91dCBkaXJlY3Rpb24uICovXHJcbiAgcHJpdmF0ZSBfaXNSdGwoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fZGlyICYmIHRoaXMuX2Rpci52YWx1ZSA9PT0gJ3J0bCc7XHJcbiAgfVxyXG5cclxuICAvKiogU2V0cyB0aGUgY3VycmVudGx5LXNlbGVjdGVkIG1vbnRoIGJhc2VkIG9uIGEgbW9kZWwgdmFsdWUuICovXHJcbiAgcHJpdmF0ZSBfc2V0U2VsZWN0ZWRNb250aCh2YWx1ZTogRGF0ZVJhbmdlPEQ+IHwgRCB8IG51bGwpIHtcclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGVSYW5nZSkge1xyXG4gICAgICB0aGlzLl9zZWxlY3RlZE1vbnRoID0gdGhpcy5fZ2V0TW9udGhJbkN1cnJlbnRZZWFyKHZhbHVlLnN0YXJ0KSB8fFxyXG4gICAgICAgIHRoaXMuX2dldE1vbnRoSW5DdXJyZW50WWVhcih2YWx1ZS5lbmQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fc2VsZWN0ZWRNb250aCA9IHRoaXMuX2dldE1vbnRoSW5DdXJyZW50WWVhcih2YWx1ZSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsIjx0YWJsZSBjbGFzcz1cIm1hdC1jYWxlbmRhci10YWJsZVwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj5cclxuICA8dGhlYWQgY2xhc3M9XCJtYXQtY2FsZW5kYXItdGFibGUtaGVhZGVyXCI+XHJcbiAgICA8dHI+PHRoIGNsYXNzPVwibWF0LWNhbGVuZGFyLXRhYmxlLWhlYWRlci1kaXZpZGVyXCIgY29sc3Bhbj1cIjRcIj48L3RoPjwvdHI+XHJcbiAgPC90aGVhZD5cclxuICA8dGJvZHkgbmd4LW1hdC1jYWxlbmRhci1ib2R5XHJcbiAgICAgICAgIFtsYWJlbF09XCJfeWVhckxhYmVsXCJcclxuICAgICAgICAgW3Jvd3NdPVwiX21vbnRoc1wiXHJcbiAgICAgICAgIFt0b2RheVZhbHVlXT1cIl90b2RheU1vbnRoIVwiXHJcbiAgICAgICAgIFtzdGFydFZhbHVlXT1cIl9zZWxlY3RlZE1vbnRoIVwiXHJcbiAgICAgICAgIFtlbmRWYWx1ZV09XCJfc2VsZWN0ZWRNb250aCFcIlxyXG4gICAgICAgICBbbGFiZWxNaW5SZXF1aXJlZENlbGxzXT1cIjJcIlxyXG4gICAgICAgICBbbnVtQ29sc109XCI0XCJcclxuICAgICAgICAgW2NlbGxBc3BlY3RSYXRpb109XCI0IC8gN1wiXHJcbiAgICAgICAgIFthY3RpdmVDZWxsXT1cIl9kYXRlQWRhcHRlci5nZXRNb250aChhY3RpdmVEYXRlKVwiXHJcbiAgICAgICAgIChzZWxlY3RlZFZhbHVlQ2hhbmdlKT1cIl9tb250aFNlbGVjdGVkKCRldmVudClcIlxyXG4gICAgICAgICAoa2V5ZG93bik9XCJfaGFuZGxlQ2FsZW5kYXJCb2R5S2V5ZG93bigkZXZlbnQpXCI+XHJcbiAgPC90Ym9keT5cclxuPC90YWJsZT5cclxuIl19