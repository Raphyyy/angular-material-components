/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOWN_ARROW, END, ENTER, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW, SPACE, } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Optional, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { DateRange } from '@angular/material/datepicker';
import { NgxMatCalendarCell, NgxMatCalendarBody } from './calendar-body';
import { createMissingDateImplError } from './utils/date-utils';
import * as i0 from "@angular/core";
import * as i1 from "./core/date-adapter";
import * as i2 from "@angular/cdk/bidi";
import * as i3 from "./calendar-body";
export const yearsPerPage = 24;
export const yearsPerRow = 4;
/**
 * An internal component used to display a year selector in the datepicker.
 * @docs-private
 */
export class NgxMatMultiYearView {
    _changeDetectorRef;
    _dateAdapter;
    _dir;
    _rerenderSubscription = Subscription.EMPTY;
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
        this._setSelectedYear(value);
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
    /** Emits when a new year is selected. */
    selectedChange = new EventEmitter();
    /** Emits the selected year. This doesn't imply a change on the selected date */
    yearSelected = new EventEmitter();
    /** Emits when any date is activated. */
    activeDateChange = new EventEmitter();
    /** The body of calendar table */
    _matCalendarBody;
    /** Grid of calendar cells representing the currently displayed years. */
    _years;
    /** The year that today falls on. */
    _todayYear;
    /** The year of the selected date. Null if the selected date is null. */
    _selectedYear;
    constructor(_changeDetectorRef, _dateAdapter, _dir) {
        this._changeDetectorRef = _changeDetectorRef;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
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
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatMultiYearView, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Component });
    /** @nocollapse */ static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.11", type: NgxMatMultiYearView, selector: "ngx-mat-multi-year-view", inputs: { activeDate: "activeDate", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter" }, outputs: { selectedChange: "selectedChange", yearSelected: "yearSelected", activeDateChange: "activeDateChange" }, viewQueries: [{ propertyName: "_matCalendarBody", first: true, predicate: NgxMatCalendarBody, descendants: true }], exportAs: ["ngxMatMultiYearView"], ngImport: i0, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [rows]=\"_years\"\r\n         [todayValue]=\"_todayYear\"\r\n         [startValue]=\"_selectedYear!\"\r\n         [endValue]=\"_selectedYear!\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_getActiveCell()\"\r\n         (selectedValueChange)=\"_yearSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n\r\n", dependencies: [{ kind: "component", type: i3.NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: ["label", "rows", "todayValue", "startValue", "endValue", "labelMinRequiredCells", "numCols", "activeCell", "isRange", "cellAspectRatio", "comparisonStart", "comparisonEnd", "previewStart", "previewEnd"], outputs: ["selectedValueChange", "previewChange"], exportAs: ["NgxMatCalendarBody"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatMultiYearView, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-multi-year-view', exportAs: 'ngxMatMultiYearView', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"4\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [rows]=\"_years\"\r\n         [todayValue]=\"_todayYear\"\r\n         [startValue]=\"_selectedYear!\"\r\n         [endValue]=\"_selectedYear!\"\r\n         [numCols]=\"4\"\r\n         [cellAspectRatio]=\"4 / 7\"\r\n         [activeCell]=\"_getActiveCell()\"\r\n         (selectedValueChange)=\"_yearSelected($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n\r\n" }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }, { type: i1.NgxMatDateAdapter, decorators: [{
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
            }], yearSelected: [{
                type: Output
            }], activeDateChange: [{
                type: Output
            }], _matCalendarBody: [{
                type: ViewChild,
                args: [NgxMatCalendarBody]
            }] } });
export function isSameMultiYearView(dateAdapter, date1, date2, minDate, maxDate) {
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
export function getActiveOffset(dateAdapter, activeDate, minDate, maxDate) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGkteWVhci12aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIvbXVsdGkteWVhci12aWV3LnRzIiwiLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIvbXVsdGkteWVhci12aWV3Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFVBQVUsRUFDVixHQUFHLEVBQ0gsS0FBSyxFQUNMLElBQUksRUFDSixVQUFVLEVBQ1YsU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsUUFBUSxFQUNSLEtBQUssR0FDTixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFFTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUNULFlBQVksRUFDWixLQUFLLEVBQ0wsUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsaUJBQWlCLEdBRWxCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQTJCLE1BQU0saUJBQWlCLENBQUM7QUFFbEcsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7Ozs7O0FBRWhFLE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUM7QUFFL0IsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztBQUU3Qjs7O0dBR0c7QUFRSCxNQUFNLE9BQU8sbUJBQW1CO0lBMEVWO0lBQ1c7SUFDQztJQTNFeEIscUJBQXFCLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztJQUVuRCwrRkFB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LDRFQUE0RTtBQUM1RSxTQUFTLGVBQWUsQ0FBRSxDQUFTLEVBQUUsQ0FBUztJQUM1QyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAbGljZW5zZVxyXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxyXG4gKlxyXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxyXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXHJcbiAqL1xyXG5cclxuaW1wb3J0IHtcclxuICBET1dOX0FSUk9XLFxyXG4gIEVORCxcclxuICBFTlRFUixcclxuICBIT01FLFxyXG4gIExFRlRfQVJST1csXHJcbiAgUEFHRV9ET1dOLFxyXG4gIFBBR0VfVVAsXHJcbiAgUklHSFRfQVJST1csXHJcbiAgVVBfQVJST1csXHJcbiAgU1BBQ0UsXHJcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcclxuaW1wb3J0IHtcclxuICBBZnRlckNvbnRlbnRJbml0LFxyXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxyXG4gIENoYW5nZURldGVjdG9yUmVmLFxyXG4gIENvbXBvbmVudCxcclxuICBFdmVudEVtaXR0ZXIsXHJcbiAgSW5wdXQsXHJcbiAgT3B0aW9uYWwsXHJcbiAgT3V0cHV0LFxyXG4gIFZpZXdDaGlsZCxcclxuICBWaWV3RW5jYXBzdWxhdGlvbixcclxuICBPbkRlc3Ryb3ksXHJcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcclxuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge3N0YXJ0V2l0aH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xyXG5pbXBvcnQgeyBEYXRlUmFuZ2UgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9kYXRlcGlja2VyJztcclxuaW1wb3J0IHsgTmd4TWF0Q2FsZW5kYXJDZWxsLCBOZ3hNYXRDYWxlbmRhckJvZHksIE5neE1hdENhbGVuZGFyVXNlckV2ZW50IH0gZnJvbSAnLi9jYWxlbmRhci1ib2R5JztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZUFkYXB0ZXIgfSBmcm9tICcuL2NvcmUvZGF0ZS1hZGFwdGVyJztcclxuaW1wb3J0IHsgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IgfSBmcm9tICcuL3V0aWxzL2RhdGUtdXRpbHMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHllYXJzUGVyUGFnZSA9IDI0O1xyXG5cclxuZXhwb3J0IGNvbnN0IHllYXJzUGVyUm93ID0gNDtcclxuXHJcbi8qKlxyXG4gKiBBbiBpbnRlcm5hbCBjb21wb25lbnQgdXNlZCB0byBkaXNwbGF5IGEgeWVhciBzZWxlY3RvciBpbiB0aGUgZGF0ZXBpY2tlci5cclxuICogQGRvY3MtcHJpdmF0ZVxyXG4gKi9cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICduZ3gtbWF0LW11bHRpLXllYXItdmlldycsXHJcbiAgdGVtcGxhdGVVcmw6ICdtdWx0aS15ZWFyLXZpZXcuaHRtbCcsXHJcbiAgZXhwb3J0QXM6ICduZ3hNYXRNdWx0aVllYXJWaWV3JyxcclxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxyXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBOZ3hNYXRNdWx0aVllYXJWaWV3PEQ+IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95IHtcclxuICBwcml2YXRlIF9yZXJlbmRlclN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcclxuXHJcbiAgLyoqIFRoZSBkYXRlIHRvIGRpc3BsYXkgaW4gdGhpcyBtdWx0aS15ZWFyIHZpZXcgKGV2ZXJ5dGhpbmcgb3RoZXIgdGhhbiB0aGUgeWVhciBpcyBpZ25vcmVkKS4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBhY3RpdmVEYXRlKCk6IEQgeyByZXR1cm4gdGhpcy5fYWN0aXZlRGF0ZTsgfVxyXG4gIHNldCBhY3RpdmVEYXRlKHZhbHVlOiBEKSB7XHJcbiAgICBsZXQgb2xkQWN0aXZlRGF0ZSA9IHRoaXMuX2FjdGl2ZURhdGU7XHJcbiAgICBjb25zdCB2YWxpZERhdGUgPVxyXG4gICAgICAgIHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpIHx8IHRoaXMuX2RhdGVBZGFwdGVyLnRvZGF5KCk7XHJcbiAgICB0aGlzLl9hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuY2xhbXBEYXRlKHZhbGlkRGF0ZSwgdGhpcy5taW5EYXRlLCB0aGlzLm1heERhdGUpO1xyXG5cclxuICAgIGlmICghaXNTYW1lTXVsdGlZZWFyVmlldyhcclxuICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIsIG9sZEFjdGl2ZURhdGUsIHRoaXMuX2FjdGl2ZURhdGUsIHRoaXMubWluRGF0ZSwgdGhpcy5tYXhEYXRlKSkge1xyXG4gICAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHByaXZhdGUgX2FjdGl2ZURhdGU6IEQ7XHJcblxyXG4gIC8qKiBUaGUgY3VycmVudGx5IHNlbGVjdGVkIGRhdGUuICovXHJcbiAgQElucHV0KClcclxuICBnZXQgc2VsZWN0ZWQoKTogRGF0ZVJhbmdlPEQ+IHwgRCB8IG51bGwgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWQ7IH1cclxuICBzZXQgc2VsZWN0ZWQodmFsdWU6IERhdGVSYW5nZTxEPiB8IEQgfCBudWxsKSB7XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlUmFuZ2UpIHtcclxuICAgICAgdGhpcy5fc2VsZWN0ZWQgPSB2YWx1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX3NlbGVjdGVkID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKHZhbHVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fc2V0U2VsZWN0ZWRZZWFyKHZhbHVlKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBfc2VsZWN0ZWQ6IERhdGVSYW5nZTxEPiB8IEQgfCBudWxsO1xyXG5cclxuXHJcbiAgLyoqIFRoZSBtaW5pbXVtIHNlbGVjdGFibGUgZGF0ZS4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBtaW5EYXRlKCk6IEQgfCBudWxsIHsgcmV0dXJuIHRoaXMuX21pbkRhdGU7IH1cclxuICBzZXQgbWluRGF0ZSh2YWx1ZTogRCB8IG51bGwpIHtcclxuICAgIHRoaXMuX21pbkRhdGUgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUodmFsdWUpKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBfbWluRGF0ZTogRCB8IG51bGw7XHJcblxyXG4gIC8qKiBUaGUgbWF4aW11bSBzZWxlY3RhYmxlIGRhdGUuICovXHJcbiAgQElucHV0KClcclxuICBnZXQgbWF4RGF0ZSgpOiBEIHwgbnVsbCB7IHJldHVybiB0aGlzLl9tYXhEYXRlOyB9XHJcbiAgc2V0IG1heERhdGUodmFsdWU6IEQgfCBudWxsKSB7XHJcbiAgICB0aGlzLl9tYXhEYXRlID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKHZhbHVlKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgX21heERhdGU6IEQgfCBudWxsO1xyXG5cclxuICAvKiogQSBmdW5jdGlvbiB1c2VkIHRvIGZpbHRlciB3aGljaCBkYXRlcyBhcmUgc2VsZWN0YWJsZS4gKi9cclxuICBASW5wdXQoKSBkYXRlRmlsdGVyOiAoZGF0ZTogRCkgPT4gYm9vbGVhbjtcclxuXHJcbiAgLyoqIEVtaXRzIHdoZW4gYSBuZXcgeWVhciBpcyBzZWxlY3RlZC4gKi9cclxuICBAT3V0cHV0KCkgcmVhZG9ubHkgc2VsZWN0ZWRDaGFuZ2U6IEV2ZW50RW1pdHRlcjxEPiA9IG5ldyBFdmVudEVtaXR0ZXI8RD4oKTtcclxuXHJcbiAgLyoqIEVtaXRzIHRoZSBzZWxlY3RlZCB5ZWFyLiBUaGlzIGRvZXNuJ3QgaW1wbHkgYSBjaGFuZ2Ugb24gdGhlIHNlbGVjdGVkIGRhdGUgKi9cclxuICBAT3V0cHV0KCkgcmVhZG9ubHkgeWVhclNlbGVjdGVkOiBFdmVudEVtaXR0ZXI8RD4gPSBuZXcgRXZlbnRFbWl0dGVyPEQ+KCk7XHJcblxyXG4gIC8qKiBFbWl0cyB3aGVuIGFueSBkYXRlIGlzIGFjdGl2YXRlZC4gKi9cclxuICBAT3V0cHV0KCkgcmVhZG9ubHkgYWN0aXZlRGF0ZUNoYW5nZTogRXZlbnRFbWl0dGVyPEQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxEPigpO1xyXG5cclxuICAvKiogVGhlIGJvZHkgb2YgY2FsZW5kYXIgdGFibGUgKi9cclxuICBAVmlld0NoaWxkKE5neE1hdENhbGVuZGFyQm9keSkgX21hdENhbGVuZGFyQm9keTogTmd4TWF0Q2FsZW5kYXJCb2R5O1xyXG5cclxuICAvKiogR3JpZCBvZiBjYWxlbmRhciBjZWxscyByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgeWVhcnMuICovXHJcbiAgX3llYXJzOiBOZ3hNYXRDYWxlbmRhckNlbGxbXVtdO1xyXG5cclxuICAvKiogVGhlIHllYXIgdGhhdCB0b2RheSBmYWxscyBvbi4gKi9cclxuICBfdG9kYXlZZWFyOiBudW1iZXI7XHJcblxyXG4gIC8qKiBUaGUgeWVhciBvZiB0aGUgc2VsZWN0ZWQgZGF0ZS4gTnVsbCBpZiB0aGUgc2VsZWN0ZWQgZGF0ZSBpcyBudWxsLiAqL1xyXG4gIF9zZWxlY3RlZFllYXI6IG51bWJlciB8IG51bGw7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcclxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBwdWJsaWMgX2RhdGVBZGFwdGVyOiBOZ3hNYXREYXRlQWRhcHRlcjxEPixcclxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI/OiBEaXJlY3Rpb25hbGl0eSkge1xyXG4gICAgaWYgKCF0aGlzLl9kYXRlQWRhcHRlcikge1xyXG4gICAgICB0aHJvdyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvcignTmd4TWF0RGF0ZUFkYXB0ZXInKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIudG9kYXkoKTtcclxuICB9XHJcblxyXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcclxuICAgIHRoaXMuX3JlcmVuZGVyU3Vic2NyaXB0aW9uID0gdGhpcy5fZGF0ZUFkYXB0ZXIubG9jYWxlQ2hhbmdlc1xyXG4gICAgICAucGlwZShzdGFydFdpdGgobnVsbCkpXHJcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5faW5pdCgpKTtcclxuICB9XHJcblxyXG4gIG5nT25EZXN0cm95KCkge1xyXG4gICAgdGhpcy5fcmVyZW5kZXJTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuICB9XHJcblxyXG4gIC8qKiBJbml0aWFsaXplcyB0aGlzIG11bHRpLXllYXIgdmlldy4gKi9cclxuICBfaW5pdCgpIHtcclxuICAgIHRoaXMuX3RvZGF5WWVhciA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5fZGF0ZUFkYXB0ZXIudG9kYXkoKSk7XHJcblxyXG4gICAgLy8gV2Ugd2FudCBhIHJhbmdlIHllYXJzIHN1Y2ggdGhhdCB3ZSBtYXhpbWl6ZSB0aGUgbnVtYmVyIG9mXHJcbiAgICAvLyBlbmFibGVkIGRhdGVzIHZpc2libGUgYXQgb25jZS4gVGhpcyBwcmV2ZW50cyBpc3N1ZXMgd2hlcmUgdGhlIG1pbmltdW0geWVhclxyXG4gICAgLy8gaXMgdGhlIGxhc3QgaXRlbSBvZiBhIHBhZ2UgT1IgdGhlIG1heGltdW0geWVhciBpcyB0aGUgZmlyc3QgaXRlbSBvZiBhIHBhZ2UuXHJcblxyXG4gICAgLy8gVGhlIG9mZnNldCBmcm9tIHRoZSBhY3RpdmUgeWVhciB0byB0aGUgXCJzbG90XCIgZm9yIHRoZSBzdGFydGluZyB5ZWFyIGlzIHRoZVxyXG4gICAgLy8gKmFjdHVhbCogZmlyc3QgcmVuZGVyZWQgeWVhciBpbiB0aGUgbXVsdGkteWVhciB2aWV3LlxyXG4gICAgY29uc3QgYWN0aXZlWWVhciA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5fYWN0aXZlRGF0ZSk7XHJcbiAgICBjb25zdCBtaW5ZZWFyT2ZQYWdlID0gYWN0aXZlWWVhciAtIGdldEFjdGl2ZU9mZnNldChcclxuICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIsIHRoaXMuYWN0aXZlRGF0ZSwgdGhpcy5taW5EYXRlLCB0aGlzLm1heERhdGUpO1xyXG5cclxuICAgIHRoaXMuX3llYXJzID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gMCwgcm93OiBudW1iZXJbXSA9IFtdOyBpIDwgeWVhcnNQZXJQYWdlOyBpKyspIHtcclxuICAgICAgcm93LnB1c2gobWluWWVhck9mUGFnZSArIGkpO1xyXG4gICAgICBpZiAocm93Lmxlbmd0aCA9PSB5ZWFyc1BlclJvdykge1xyXG4gICAgICAgIHRoaXMuX3llYXJzLnB1c2gocm93Lm1hcCh5ZWFyID0+IHRoaXMuX2NyZWF0ZUNlbGxGb3JZZWFyKHllYXIpKSk7XHJcbiAgICAgICAgcm93ID0gW107XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEhhbmRsZXMgd2hlbiBhIG5ldyB5ZWFyIGlzIHNlbGVjdGVkLiAqL1xyXG4gIF95ZWFyU2VsZWN0ZWQoZXZlbnQ6IE5neE1hdENhbGVuZGFyVXNlckV2ZW50PG51bWJlcj4pIHtcclxuICAgIGNvbnN0IHllYXIgPSBldmVudC52YWx1ZTtcclxuICAgIHRoaXMueWVhclNlbGVjdGVkLmVtaXQodGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZSh5ZWFyLCAwLCAxKSk7XHJcbiAgICBsZXQgbW9udGggPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aCh0aGlzLmFjdGl2ZURhdGUpO1xyXG4gICAgbGV0IGRheXNJbk1vbnRoID1cclxuICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5nZXROdW1EYXlzSW5Nb250aCh0aGlzLl9kYXRlQWRhcHRlci5jcmVhdGVEYXRlKHllYXIsIG1vbnRoLCAxKSk7XHJcbiAgICB0aGlzLnNlbGVjdGVkQ2hhbmdlLmVtaXQodGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZSh5ZWFyLCBtb250aCxcclxuICAgICAgICBNYXRoLm1pbih0aGlzLl9kYXRlQWRhcHRlci5nZXREYXRlKHRoaXMuYWN0aXZlRGF0ZSksIGRheXNJbk1vbnRoKSkpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEhhbmRsZXMga2V5ZG93biBldmVudHMgb24gdGhlIGNhbGVuZGFyIGJvZHkgd2hlbiBjYWxlbmRhciBpcyBpbiBtdWx0aS15ZWFyIHZpZXcuICovXHJcbiAgX2hhbmRsZUNhbGVuZGFyQm9keUtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcclxuICAgIGNvbnN0IG9sZEFjdGl2ZURhdGUgPSB0aGlzLl9hY3RpdmVEYXRlO1xyXG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLl9pc1J0bCgpO1xyXG5cclxuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xyXG4gICAgICBjYXNlIExFRlRfQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJZZWFycyh0aGlzLl9hY3RpdmVEYXRlLCBpc1J0bCA/IDEgOiAtMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJZZWFycyh0aGlzLl9hY3RpdmVEYXRlLCBpc1J0bCA/IC0xIDogMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgVVBfQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJZZWFycyh0aGlzLl9hY3RpdmVEYXRlLCAteWVhcnNQZXJSb3cpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIERPV05fQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJZZWFycyh0aGlzLl9hY3RpdmVEYXRlLCB5ZWFyc1BlclJvdyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgSE9NRTpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhclllYXJzKHRoaXMuX2FjdGl2ZURhdGUsXHJcbiAgICAgICAgICAtZ2V0QWN0aXZlT2Zmc2V0KHRoaXMuX2RhdGVBZGFwdGVyLCB0aGlzLmFjdGl2ZURhdGUsIHRoaXMubWluRGF0ZSwgdGhpcy5tYXhEYXRlKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgRU5EOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyWWVhcnModGhpcy5fYWN0aXZlRGF0ZSxcclxuICAgICAgICAgIHllYXJzUGVyUGFnZSAtIGdldEFjdGl2ZU9mZnNldChcclxuICAgICAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIsIHRoaXMuYWN0aXZlRGF0ZSwgdGhpcy5taW5EYXRlLCB0aGlzLm1heERhdGUpIC0gMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUEFHRV9VUDpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPVxyXG4gICAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhclllYXJzKFxyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlRGF0ZSwgZXZlbnQuYWx0S2V5ID8gLXllYXJzUGVyUGFnZSAqIDEwIDogLXllYXJzUGVyUGFnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUEFHRV9ET1dOOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyWWVhcnMoXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmVEYXRlLCBldmVudC5hbHRLZXkgPyB5ZWFyc1BlclBhZ2UgKiAxMCA6IHllYXJzUGVyUGFnZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgRU5URVI6XHJcbiAgICAgIGNhc2UgU1BBQ0U6XHJcbiAgICAgICAgdGhpcy5feWVhclNlbGVjdGVkKHt2YWx1ZTogdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0WWVhcih0aGlzLl9hY3RpdmVEYXRlKSwgZXZlbnR9KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICAvLyBEb24ndCBwcmV2ZW50IGRlZmF1bHQgb3IgZm9jdXMgYWN0aXZlIGNlbGwgb24ga2V5cyB0aGF0IHdlIGRvbid0IGV4cGxpY2l0bHkgaGFuZGxlLlxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLl9kYXRlQWRhcHRlci5jb21wYXJlRGF0ZShvbGRBY3RpdmVEYXRlLCB0aGlzLmFjdGl2ZURhdGUpKSB7XHJcbiAgICAgIHRoaXMuYWN0aXZlRGF0ZUNoYW5nZS5lbWl0KHRoaXMuYWN0aXZlRGF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZm9jdXNBY3RpdmVDZWxsKCk7XHJcbiAgICAvLyBQcmV2ZW50IHVuZXhwZWN0ZWQgZGVmYXVsdCBhY3Rpb25zIHN1Y2ggYXMgZm9ybSBzdWJtaXNzaW9uLlxyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICB9XHJcblxyXG4gIF9nZXRBY3RpdmVDZWxsKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gZ2V0QWN0aXZlT2Zmc2V0KHRoaXMuX2RhdGVBZGFwdGVyLCB0aGlzLmFjdGl2ZURhdGUsIHRoaXMubWluRGF0ZSwgdGhpcy5tYXhEYXRlKTtcclxuICB9XHJcblxyXG4gIC8qKiBGb2N1c2VzIHRoZSBhY3RpdmUgY2VsbCBhZnRlciB0aGUgbWljcm90YXNrIHF1ZXVlIGlzIGVtcHR5LiAqL1xyXG4gIF9mb2N1c0FjdGl2ZUNlbGwoKSB7XHJcbiAgICB0aGlzLl9tYXRDYWxlbmRhckJvZHkuX2ZvY3VzQWN0aXZlQ2VsbCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqIENyZWF0ZXMgYW4gTWF0Q2FsZW5kYXJDZWxsIGZvciB0aGUgZ2l2ZW4geWVhci4gKi9cclxuICBwcml2YXRlIF9jcmVhdGVDZWxsRm9yWWVhcih5ZWFyOiBudW1iZXIpIHtcclxuICAgIGxldCB5ZWFyTmFtZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXJOYW1lKHRoaXMuX2RhdGVBZGFwdGVyLmNyZWF0ZURhdGUoeWVhciwgMCwgMSkpO1xyXG4gICAgcmV0dXJuIG5ldyBOZ3hNYXRDYWxlbmRhckNlbGwoeWVhciwgeWVhck5hbWUsIHllYXJOYW1lLCB0aGlzLl9zaG91bGRFbmFibGVZZWFyKHllYXIpKTtcclxuICB9XHJcblxyXG4gIC8qKiBXaGV0aGVyIHRoZSBnaXZlbiB5ZWFyIGlzIGVuYWJsZWQuICovXHJcbiAgcHJpdmF0ZSBfc2hvdWxkRW5hYmxlWWVhcih5ZWFyOiBudW1iZXIpIHtcclxuICAgIC8vIGRpc2FibGUgaWYgdGhlIHllYXIgaXMgZ3JlYXRlciB0aGFuIG1heERhdGUgbG93ZXIgdGhhbiBtaW5EYXRlXHJcbiAgICBpZiAoeWVhciA9PT0gdW5kZWZpbmVkIHx8IHllYXIgPT09IG51bGwgfHxcclxuICAgICAgICAodGhpcy5tYXhEYXRlICYmIHllYXIgPiB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMubWF4RGF0ZSkpIHx8XHJcbiAgICAgICAgKHRoaXMubWluRGF0ZSAmJiB5ZWFyIDwgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0WWVhcih0aGlzLm1pbkRhdGUpKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZW5hYmxlIGlmIGl0IHJlYWNoZXMgaGVyZSBhbmQgdGhlcmUncyBubyBmaWx0ZXIgZGVmaW5lZFxyXG4gICAgaWYgKCF0aGlzLmRhdGVGaWx0ZXIpIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmlyc3RPZlllYXIgPSB0aGlzLl9kYXRlQWRhcHRlci5jcmVhdGVEYXRlKHllYXIsIDAsIDEpO1xyXG5cclxuICAgIC8vIElmIGFueSBkYXRlIGluIHRoZSB5ZWFyIGlzIGVuYWJsZWQgY291bnQgdGhlIHllYXIgYXMgZW5hYmxlZC5cclxuICAgIGZvciAobGV0IGRhdGUgPSBmaXJzdE9mWWVhcjsgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0WWVhcihkYXRlKSA9PSB5ZWFyO1xyXG4gICAgICBkYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJEYXlzKGRhdGUsIDEpKSB7XHJcbiAgICAgIGlmICh0aGlzLmRhdGVGaWx0ZXIoZGF0ZSkpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBjaGVjay5cclxuICAgKiBAcmV0dXJucyBUaGUgZ2l2ZW4gb2JqZWN0IGlmIGl0IGlzIGJvdGggYSBkYXRlIGluc3RhbmNlIGFuZCB2YWxpZCwgb3RoZXJ3aXNlIG51bGwuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZ2V0VmFsaWREYXRlT3JOdWxsKG9iajogYW55KTogRCB8IG51bGwge1xyXG4gICAgcmV0dXJuICh0aGlzLl9kYXRlQWRhcHRlci5pc0RhdGVJbnN0YW5jZShvYmopICYmIHRoaXMuX2RhdGVBZGFwdGVyLmlzVmFsaWQob2JqKSkgPyBvYmogOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGUgdXNlciBoYXMgdGhlIFJUTCBsYXlvdXQgZGlyZWN0aW9uLiAqL1xyXG4gIHByaXZhdGUgX2lzUnRsKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2RpciAmJiB0aGlzLl9kaXIudmFsdWUgPT09ICdydGwnO1xyXG4gIH1cclxuXHJcbiAgLyoqIFNldHMgdGhlIGN1cnJlbnRseS1oaWdobGlnaHRlZCB5ZWFyIGJhc2VkIG9uIGEgbW9kZWwgdmFsdWUuICovXHJcbiAgcHJpdmF0ZSBfc2V0U2VsZWN0ZWRZZWFyKHZhbHVlOiBEYXRlUmFuZ2U8RD4gfCBEIHwgbnVsbCkge1xyXG4gICAgdGhpcy5fc2VsZWN0ZWRZZWFyID0gbnVsbDtcclxuXHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlUmFuZ2UpIHtcclxuICAgICAgY29uc3QgZGlzcGxheVZhbHVlID0gdmFsdWUuc3RhcnQgfHwgdmFsdWUuZW5kO1xyXG5cclxuICAgICAgaWYgKGRpc3BsYXlWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX3NlbGVjdGVkWWVhciA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIoZGlzcGxheVZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICh2YWx1ZSkge1xyXG4gICAgICB0aGlzLl9zZWxlY3RlZFllYXIgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1NhbWVNdWx0aVllYXJWaWV3PEQ+KFxyXG4gIGRhdGVBZGFwdGVyOiBOZ3hNYXREYXRlQWRhcHRlcjxEPiwgZGF0ZTE6IEQsIGRhdGUyOiBELCBtaW5EYXRlOiBEIHwgbnVsbCwgbWF4RGF0ZTogRCB8IG51bGwpOiBib29sZWFuIHtcclxuICBjb25zdCB5ZWFyMSA9IGRhdGVBZGFwdGVyLmdldFllYXIoZGF0ZTEpO1xyXG4gIGNvbnN0IHllYXIyID0gZGF0ZUFkYXB0ZXIuZ2V0WWVhcihkYXRlMik7XHJcbiAgY29uc3Qgc3RhcnRpbmdZZWFyID0gZ2V0U3RhcnRpbmdZZWFyKGRhdGVBZGFwdGVyLCBtaW5EYXRlLCBtYXhEYXRlKTtcclxuICByZXR1cm4gTWF0aC5mbG9vcigoeWVhcjEgLSBzdGFydGluZ1llYXIpIC8geWVhcnNQZXJQYWdlKSA9PT1cclxuICAgICAgICAgIE1hdGguZmxvb3IoKHllYXIyIC0gc3RhcnRpbmdZZWFyKSAvIHllYXJzUGVyUGFnZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXaGVuIHRoZSBtdWx0aS15ZWFyIHZpZXcgaXMgZmlyc3Qgb3BlbmVkLCB0aGUgYWN0aXZlIHllYXIgd2lsbCBiZSBpbiB2aWV3LlxyXG4gKiBTbyB3ZSBjb21wdXRlIGhvdyBtYW55IHllYXJzIGFyZSBiZXR3ZWVuIHRoZSBhY3RpdmUgeWVhciBhbmQgdGhlICpzbG90KiB3aGVyZSBvdXJcclxuICogXCJzdGFydGluZ1llYXJcIiB3aWxsIHJlbmRlciB3aGVuIHBhZ2VkIGludG8gdmlldy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVPZmZzZXQ8RD4oXHJcbiAgZGF0ZUFkYXB0ZXI6IE5neE1hdERhdGVBZGFwdGVyPEQ+LCBhY3RpdmVEYXRlOiBELCBtaW5EYXRlOiBEIHwgbnVsbCwgbWF4RGF0ZTogRCB8IG51bGwpOiBudW1iZXIge1xyXG4gIGNvbnN0IGFjdGl2ZVllYXIgPSBkYXRlQWRhcHRlci5nZXRZZWFyKGFjdGl2ZURhdGUpO1xyXG4gIHJldHVybiBldWNsaWRlYW5Nb2R1bG8oKGFjdGl2ZVllYXIgLSBnZXRTdGFydGluZ1llYXIoZGF0ZUFkYXB0ZXIsIG1pbkRhdGUsIG1heERhdGUpKSxcclxuICAgIHllYXJzUGVyUGFnZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXZSBwaWNrIGEgXCJzdGFydGluZ1wiIHllYXIgc3VjaCB0aGF0IGVpdGhlciB0aGUgbWF4aW11bSB5ZWFyIHdvdWxkIGJlIGF0IHRoZSBlbmRcclxuICogb3IgdGhlIG1pbmltdW0geWVhciB3b3VsZCBiZSBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldFN0YXJ0aW5nWWVhcjxEPihcclxuICBkYXRlQWRhcHRlcjogTmd4TWF0RGF0ZUFkYXB0ZXI8RD4sIG1pbkRhdGU6IEQgfCBudWxsLCBtYXhEYXRlOiBEIHwgbnVsbCk6IG51bWJlciB7XHJcbiAgbGV0IHN0YXJ0aW5nWWVhciA9IDA7XHJcbiAgaWYgKG1heERhdGUpIHtcclxuICAgIGNvbnN0IG1heFllYXIgPSBkYXRlQWRhcHRlci5nZXRZZWFyKG1heERhdGUpO1xyXG4gICAgc3RhcnRpbmdZZWFyID0gbWF4WWVhciAtIHllYXJzUGVyUGFnZSArIDE7XHJcbiAgfSBlbHNlIGlmIChtaW5EYXRlKSB7XHJcbiAgICBzdGFydGluZ1llYXIgPSBkYXRlQWRhcHRlci5nZXRZZWFyKG1pbkRhdGUpO1xyXG4gIH1cclxuICByZXR1cm4gc3RhcnRpbmdZZWFyO1xyXG59XHJcblxyXG4vKiogR2V0cyByZW1haW5kZXIgdGhhdCBpcyBub24tbmVnYXRpdmUsIGV2ZW4gaWYgZmlyc3QgbnVtYmVyIGlzIG5lZ2F0aXZlICovXHJcbmZ1bmN0aW9uIGV1Y2xpZGVhbk1vZHVsbyAoYTogbnVtYmVyLCBiOiBudW1iZXIpOiBudW1iZXIge1xyXG4gIHJldHVybiAoYSAlIGIgKyBiKSAlIGI7XHJcbn1cclxuIiwiPHRhYmxlIGNsYXNzPVwibWF0LWNhbGVuZGFyLXRhYmxlXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPlxyXG4gIDx0aGVhZCBjbGFzcz1cIm1hdC1jYWxlbmRhci10YWJsZS1oZWFkZXJcIj5cclxuICAgIDx0cj48dGggY2xhc3M9XCJtYXQtY2FsZW5kYXItdGFibGUtaGVhZGVyLWRpdmlkZXJcIiBjb2xzcGFuPVwiNFwiPjwvdGg+PC90cj5cclxuICA8L3RoZWFkPlxyXG4gIDx0Ym9keSBuZ3gtbWF0LWNhbGVuZGFyLWJvZHlcclxuICAgICAgICAgW3Jvd3NdPVwiX3llYXJzXCJcclxuICAgICAgICAgW3RvZGF5VmFsdWVdPVwiX3RvZGF5WWVhclwiXHJcbiAgICAgICAgIFtzdGFydFZhbHVlXT1cIl9zZWxlY3RlZFllYXIhXCJcclxuICAgICAgICAgW2VuZFZhbHVlXT1cIl9zZWxlY3RlZFllYXIhXCJcclxuICAgICAgICAgW251bUNvbHNdPVwiNFwiXHJcbiAgICAgICAgIFtjZWxsQXNwZWN0UmF0aW9dPVwiNCAvIDdcIlxyXG4gICAgICAgICBbYWN0aXZlQ2VsbF09XCJfZ2V0QWN0aXZlQ2VsbCgpXCJcclxuICAgICAgICAgKHNlbGVjdGVkVmFsdWVDaGFuZ2UpPVwiX3llYXJTZWxlY3RlZCgkZXZlbnQpXCJcclxuICAgICAgICAgKGtleWRvd24pPVwiX2hhbmRsZUNhbGVuZGFyQm9keUtleWRvd24oJGV2ZW50KVwiPlxyXG4gIDwvdGJvZHk+XHJcbjwvdGFibGU+XHJcblxyXG4iXX0=