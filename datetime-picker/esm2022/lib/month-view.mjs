/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOWN_ARROW, END, ENTER, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW, SPACE, ESCAPE, } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Optional, Output, ViewEncapsulation, ViewChild, } from '@angular/core';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { DateRange } from '@angular/material/datepicker';
import { NgxMatCalendarBody, NgxMatCalendarCell } from './calendar-body';
import { NGX_MAT_DATE_FORMATS } from './core/date-formats';
import { NGX_MAT_DATE_RANGE_SELECTION_STRATEGY } from './date-range-selection-strategy';
import { createMissingDateImplError } from './utils/date-utils';
import * as i0 from "@angular/core";
import * as i1 from "./core/date-adapter";
import * as i2 from "@angular/cdk/bidi";
import * as i3 from "@angular/common";
import * as i4 from "./calendar-body";
const DAYS_PER_WEEK = 7;
/**
 * An internal component used to display a single month in the datepicker.
 * @docs-private
 */
export class NgxMatMonthView {
    _changeDetectorRef;
    _dateFormats;
    _dateAdapter;
    _dir;
    _rangeStrategy;
    _rerenderSubscription = Subscription.EMPTY;
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
        this._setRanges(this._selected);
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
    /** Function used to filter which dates are selectable. */
    dateFilter;
    /** Function that can be used to add custom CSS classes to dates. */
    dateClass;
    /** Start of the comparison range. */
    comparisonStart;
    /** End of the comparison range. */
    comparisonEnd;
    /** Emits when a new date is selected. */
    selectedChange = new EventEmitter();
    /** Emits when any date is selected. */
    _userSelection = new EventEmitter();
    /** Emits when any date is activated. */
    activeDateChange = new EventEmitter();
    /** The body of calendar table */
    _matCalendarBody;
    /** The label for this month (e.g. "January 2017"). */
    _monthLabel;
    /** Grid of calendar cells representing the dates of the month. */
    _weeks;
    /** The number of blank cells in the first row before the 1st of the month. */
    _firstWeekOffset;
    /** Start value of the currently-shown date range. */
    _rangeStart;
    /** End value of the currently-shown date range. */
    _rangeEnd;
    /** Start value of the currently-shown comparison date range. */
    _comparisonRangeStart;
    /** End value of the currently-shown comparison date range. */
    _comparisonRangeEnd;
    /** Start of the preview range. */
    _previewStart;
    /** End of the preview range. */
    _previewEnd;
    /** Whether the user is currently selecting a range of dates. */
    _isRange;
    /** The date of the month that today falls on. Null if today is in another month. */
    _todayDate;
    /** The names of the weekdays. */
    _weekdays;
    constructor(_changeDetectorRef, _dateFormats, _dateAdapter, _dir, _rangeStrategy) {
        this._changeDetectorRef = _changeDetectorRef;
        this._dateFormats = _dateFormats;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        this._rangeStrategy = _rangeStrategy;
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
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatMonthView, deps: [{ token: i0.ChangeDetectorRef }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i1.NgxMatDateAdapter, optional: true }, { token: i2.Directionality, optional: true }, { token: NGX_MAT_DATE_RANGE_SELECTION_STRATEGY, optional: true }], target: i0.ɵɵFactoryTarget.Component });
    /** @nocollapse */ static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.11", type: NgxMatMonthView, selector: "ngx-mat-month-view", inputs: { activeDate: "activeDate", selected: "selected", minDate: "minDate", maxDate: "maxDate", dateFilter: "dateFilter", dateClass: "dateClass", comparisonStart: "comparisonStart", comparisonEnd: "comparisonEnd" }, outputs: { selectedChange: "selectedChange", _userSelection: "_userSelection", activeDateChange: "activeDateChange" }, viewQueries: [{ propertyName: "_matCalendarBody", first: true, predicate: NgxMatCalendarBody, descendants: true }], exportAs: ["ngxMatMonthView"], ngImport: i0, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr>\r\n      <th scope=\"col\" *ngFor=\"let day of _weekdays\" [attr.aria-label]=\"day.long\">{{day.narrow}}</th>\r\n    </tr>\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"7\" aria-hidden=\"true\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_monthLabel\"\r\n         [rows]=\"_weeks\"\r\n         [todayValue]=\"_todayDate!\"\r\n         [startValue]=\"_rangeStart!\"\r\n         [endValue]=\"_rangeEnd!\"\r\n         [comparisonStart]=\"_comparisonRangeStart\"\r\n         [comparisonEnd]=\"_comparisonRangeEnd\"\r\n         [previewStart]=\"_previewStart\"\r\n         [previewEnd]=\"_previewEnd\"\r\n         [isRange]=\"_isRange\"\r\n         [labelMinRequiredCells]=\"3\"\r\n         [activeCell]=\"_dateAdapter.getDate(activeDate) - 1\"\r\n         (selectedValueChange)=\"_dateSelected($event)\"\r\n         (previewChange)=\"_previewChanged($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n", dependencies: [{ kind: "directive", type: i3.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "component", type: i4.NgxMatCalendarBody, selector: "[ngx-mat-calendar-body]", inputs: ["label", "rows", "todayValue", "startValue", "endValue", "labelMinRequiredCells", "numCols", "activeCell", "isRange", "cellAspectRatio", "comparisonStart", "comparisonEnd", "previewStart", "previewEnd"], outputs: ["selectedValueChange", "previewChange"], exportAs: ["NgxMatCalendarBody"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatMonthView, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-month-view', exportAs: 'ngxMatMonthView', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<table class=\"mat-calendar-table\" role=\"presentation\">\r\n  <thead class=\"mat-calendar-table-header\">\r\n    <tr>\r\n      <th scope=\"col\" *ngFor=\"let day of _weekdays\" [attr.aria-label]=\"day.long\">{{day.narrow}}</th>\r\n    </tr>\r\n    <tr><th class=\"mat-calendar-table-header-divider\" colspan=\"7\" aria-hidden=\"true\"></th></tr>\r\n  </thead>\r\n  <tbody ngx-mat-calendar-body\r\n         [label]=\"_monthLabel\"\r\n         [rows]=\"_weeks\"\r\n         [todayValue]=\"_todayDate!\"\r\n         [startValue]=\"_rangeStart!\"\r\n         [endValue]=\"_rangeEnd!\"\r\n         [comparisonStart]=\"_comparisonRangeStart\"\r\n         [comparisonEnd]=\"_comparisonRangeEnd\"\r\n         [previewStart]=\"_previewStart\"\r\n         [previewEnd]=\"_previewEnd\"\r\n         [isRange]=\"_isRange\"\r\n         [labelMinRequiredCells]=\"3\"\r\n         [activeCell]=\"_dateAdapter.getDate(activeDate) - 1\"\r\n         (selectedValueChange)=\"_dateSelected($event)\"\r\n         (previewChange)=\"_previewChanged($event)\"\r\n         (keydown)=\"_handleCalendarBodyKeydown($event)\">\r\n  </tbody>\r\n</table>\r\n" }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [NGX_MAT_DATE_FORMATS]
                }] }, { type: i1.NgxMatDateAdapter, decorators: [{
                    type: Optional
                }] }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [NGX_MAT_DATE_RANGE_SELECTION_STRATEGY]
                }, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9udGgtdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Byb2plY3RzL2RhdGV0aW1lLXBpY2tlci9zcmMvbGliL21vbnRoLXZpZXcudHMiLCIuLi8uLi8uLi9wcm9qZWN0cy9kYXRldGltZS1waWNrZXIvc3JjL2xpYi9tb250aC12aWV3Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFVBQVUsRUFDVixHQUFHLEVBQ0gsS0FBSyxFQUNMLElBQUksRUFDSixVQUFVLEVBQ1YsU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsUUFBUSxFQUNSLEtBQUssRUFDTCxNQUFNLEdBQ1AsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBRUwsdUJBQXVCLEVBRXZCLFNBQVMsRUFDVCxZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFDTCxRQUFRLEVBQ1IsTUFBTSxFQUNOLGlCQUFpQixFQUNqQixTQUFTLEdBRVYsTUFBTSxlQUFlLENBQUM7QUFHdkIsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3pELE9BQU8sRUFBeUQsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNoSSxPQUFPLEVBQUUsb0JBQW9CLEVBQXFCLE1BQU0scUJBQXFCLENBQUM7QUFFOUUsT0FBTyxFQUFFLHFDQUFxQyxFQUFvQyxNQUFNLGlDQUFpQyxDQUFDO0FBQzFILE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLG9CQUFvQixDQUFDOzs7Ozs7QUFJaEUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBR3hCOzs7R0FHRztBQVFILE1BQU0sT0FBTyxlQUFlO0lBOEdOO0lBQzBDO0lBQy9CO0lBQ0M7SUFFUjtJQWxIaEIscUJBQXFCLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztJQUVuRDs7T0FFRztJQUNILElBQ0ksVUFBVSxLQUFRLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDaEQsSUFBSSxVQUFVLENBQUMsS0FBUTtRQUNyQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3ZDLE1BQU0sU0FBUyxHQUNYLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEcsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEYsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7WUFDaEUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2YsQ0FBQztJQUNILENBQUM7SUFDTyxXQUFXLENBQUk7SUFFdkIsbUNBQW1DO0lBQ25DLElBQ0ksUUFBUSxLQUE4QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ2xFLElBQUksUUFBUSxDQUFDLEtBQThCO1FBQ3pDLElBQUksS0FBSyxZQUFZLFNBQVMsRUFBRSxDQUFDO1lBQy9CLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3pCLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUNPLFNBQVMsQ0FBMEI7SUFFM0MsbUNBQW1DO0lBQ25DLElBQ0ksT0FBTyxLQUFlLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDakQsSUFBSSxPQUFPLENBQUMsS0FBZTtRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFDTyxRQUFRLENBQVc7SUFFM0IsbUNBQW1DO0lBQ25DLElBQ0ksT0FBTyxLQUFlLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDakQsSUFBSSxPQUFPLENBQUMsS0FBZTtRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFDTyxRQUFRLENBQVc7SUFFM0IsMERBQTBEO0lBQ2pELFVBQVUsQ0FBdUI7SUFFMUMsb0VBQW9FO0lBQzNELFNBQVMsQ0FBNEM7SUFFOUQscUNBQXFDO0lBQzVCLGVBQWUsQ0FBVztJQUVuQyxtQ0FBbUM7SUFDMUIsYUFBYSxDQUFXO0lBRWpDLHlDQUF5QztJQUN0QixjQUFjLEdBQTJCLElBQUksWUFBWSxFQUFZLENBQUM7SUFFekYsdUNBQXVDO0lBQ3BCLGNBQWMsR0FDN0IsSUFBSSxZQUFZLEVBQXFDLENBQUM7SUFFMUQsd0NBQXdDO0lBQ3JCLGdCQUFnQixHQUFvQixJQUFJLFlBQVksRUFBSyxDQUFDO0lBRTdFLGlDQUFpQztJQUNGLGdCQUFnQixDQUFxQjtJQUVwRSxzREFBc0Q7SUFDdEQsV0FBVyxDQUFTO0lBRXBCLGtFQUFrRTtJQUNsRSxNQUFNLENBQXlCO0lBRS9CLDhFQUE4RTtJQUM5RSxnQkFBZ0IsQ0FBUztJQUV6QixxREFBcUQ7SUFDckQsV0FBVyxDQUFnQjtJQUUzQixtREFBbUQ7SUFDbkQsU0FBUyxDQUFnQjtJQUV6QixnRUFBZ0U7SUFDaEUscUJBQXFCLENBQWdCO0lBRXJDLDhEQUE4RDtJQUM5RCxtQkFBbUIsQ0FBZ0I7SUFFbkMsa0NBQWtDO0lBQ2xDLGFBQWEsQ0FBZ0I7SUFFN0IsZ0NBQWdDO0lBQ2hDLFdBQVcsQ0FBZ0I7SUFFM0IsZ0VBQWdFO0lBQ2hFLFFBQVEsQ0FBVTtJQUVsQixvRkFBb0Y7SUFDcEYsVUFBVSxDQUFnQjtJQUUxQixpQ0FBaUM7SUFDakMsU0FBUyxDQUFtQztJQUU1QyxZQUFvQixrQkFBcUMsRUFDSyxZQUErQixFQUM5RCxZQUFrQyxFQUNqQyxJQUFxQixFQUU3QixjQUFvRDtRQUx4RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW1CO1FBQ0ssaUJBQVksR0FBWixZQUFZLENBQW1CO1FBQzlELGlCQUFZLEdBQVosWUFBWSxDQUFzQjtRQUNqQyxTQUFJLEdBQUosSUFBSSxDQUFpQjtRQUU3QixtQkFBYyxHQUFkLGNBQWMsQ0FBc0M7UUFDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QixNQUFNLDBCQUEwQixDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkIsTUFBTSwwQkFBMEIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVELGtCQUFrQjtRQUNoQixJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhO2FBQ3pELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDckIsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzNDLENBQUM7SUFFRCwyQ0FBMkM7SUFDM0MsYUFBYSxDQUFDLEtBQXNDO1FBQ2xELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDekIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsRSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JGLElBQUksY0FBNkIsQ0FBQztRQUNsQyxJQUFJLFlBQTJCLENBQUM7UUFFaEMsSUFBSSxJQUFJLENBQUMsU0FBUyxZQUFZLFNBQVMsRUFBRSxDQUFDO1lBQ3hDLGNBQWMsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuRSxZQUFZLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakUsQ0FBQzthQUFNLENBQUM7WUFDTixjQUFjLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELElBQUksY0FBYyxLQUFLLElBQUksSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVELElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVELGtGQUFrRjtJQUNsRiwwQkFBMEIsQ0FBQyxLQUFvQjtRQUM3Qyw2RkFBNkY7UUFDN0Ysd0ZBQXdGO1FBQ3hGLDRGQUE0RjtRQUU1RixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUU1QixRQUFRLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixLQUFLLFVBQVU7Z0JBQ2IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RixNQUFNO1lBQ1IsS0FBSyxXQUFXO2dCQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEYsTUFBTTtZQUNSLEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUUsTUFBTTtZQUNSLEtBQUssVUFBVTtnQkFDYixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLE1BQU07WUFDUixLQUFLLElBQUk7Z0JBQ1AsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUNoRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUNoRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztvQkFDcEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEQsTUFBTTtZQUNSLEtBQUssT0FBTztnQkFDVixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU07WUFDUixLQUFLLFNBQVM7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN6RCxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdELE1BQU07WUFDUixLQUFLLEtBQUssQ0FBQztZQUNYLEtBQUssS0FBSztnQkFDUixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO29CQUMxRCxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO29CQUNoRiw4REFBOEQ7b0JBQzlELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDekIsQ0FBQztnQkFDRCxPQUFPO1lBQ1QsS0FBSyxNQUFNO2dCQUNULDhFQUE4RTtnQkFDOUUsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO29CQUM3QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7b0JBQy9DLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDdkIsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMscUNBQXFDO2dCQUNoRSxDQUFDO2dCQUNELE9BQU87WUFDVDtnQkFDRSxzRkFBc0Y7Z0JBQ3RGLE9BQU87UUFDWCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDbEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hCLDhEQUE4RDtRQUM5RCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELG1DQUFtQztJQUNuQyxLQUFLO1FBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksQ0FBQyxXQUFXO1lBQ1osSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNoRixpQkFBaUIsRUFBRSxDQUFDO1FBRTdCLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFDdEYsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxnQkFBZ0I7WUFDakIsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDO2dCQUM1RCxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUMsR0FBRyxhQUFhLENBQUM7UUFFNUQsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRUQsa0VBQWtFO0lBQ2xFLGdCQUFnQixDQUFDLFdBQXFCO1FBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQseUZBQXlGO0lBQ3pGLGVBQWUsQ0FBQyxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUF3RDtRQUN6RixJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN4QiwyREFBMkQ7WUFDM0Qsa0RBQWtEO1lBQ2xELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzNDLE1BQU0sWUFBWSxHQUNkLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRS9ELHFGQUFxRjtZQUNyRixxRkFBcUY7WUFDckYsa0ZBQWtGO1lBQ2xGLDRFQUE0RTtZQUM1RSxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDMUMsQ0FBQztJQUNILENBQUM7SUFFRCxnQ0FBZ0M7SUFDeEIsYUFBYTtRQUNuQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDN0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWpFLHdGQUF3RjtRQUN4RixJQUFJLFFBQVEsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLE9BQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQzVGLENBQUM7SUFFRCw0REFBNEQ7SUFDcEQsZ0JBQWdCO1FBQ3RCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDbkQsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQzNFLElBQUksSUFBSSxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDckIsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNYLENBQUM7WUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FDbkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUMxQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzFELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRXRFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksa0JBQWtCLENBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQ2xGLFNBQVMsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7SUFDSCxDQUFDO0lBRUQsZ0NBQWdDO0lBQ3hCLGlCQUFpQixDQUFDLElBQU87UUFDL0IsT0FBTyxDQUFDLENBQUMsSUFBSTtZQUNULENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssc0JBQXNCLENBQUMsSUFBYztRQUMzQyxPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDN0MsQ0FBQztJQUVELCtGQUErRjtJQUN2RixvQkFBb0IsQ0FBQyxFQUFZLEVBQUUsRUFBWTtRQUNyRCxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQzVFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUVELCtEQUErRDtJQUN2RCxvQkFBb0IsQ0FBQyxJQUFjO1FBQ3pDLElBQUksSUFBSSxFQUFFLENBQUM7WUFDVCxzRkFBc0Y7WUFDdEYseUZBQXlGO1lBQ3pGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9DLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM5QyxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssbUJBQW1CLENBQUMsR0FBUTtRQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEcsQ0FBQztJQUVELGdFQUFnRTtJQUN4RCxNQUFNO1FBQ1osT0FBTyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQztJQUNoRCxDQUFDO0lBRUQscURBQXFEO0lBQzdDLFVBQVUsQ0FBQyxhQUFzQztRQUN2RCxJQUFJLGFBQWEsWUFBWSxTQUFTLEVBQUUsQ0FBQztZQUN2QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDN0UsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0UsQ0FBQzsySEFyWFUsZUFBZSxtREErR00sb0JBQW9CLDRIQUdoQyxxQ0FBcUM7K0dBbEg5QyxlQUFlLDZiQXdFZixrQkFBa0IsK0VDdEkvQix5bUNBeUJBOzs0RkRxQ2EsZUFBZTtrQkFQM0IsU0FBUzsrQkFDRSxvQkFBb0IsWUFFcEIsaUJBQWlCLGlCQUNaLGlCQUFpQixDQUFDLElBQUksbUJBQ3BCLHVCQUF1QixDQUFDLE1BQU07OzBCQWlIbEMsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxvQkFBb0I7OzBCQUN2QyxRQUFROzswQkFDUixRQUFROzswQkFDUixNQUFNOzJCQUFDLHFDQUFxQzs7MEJBQUcsUUFBUTt5Q0EzR2hFLFVBQVU7c0JBRGIsS0FBSztnQkFlRixRQUFRO3NCQURYLEtBQUs7Z0JBZUYsT0FBTztzQkFEVixLQUFLO2dCQVNGLE9BQU87c0JBRFYsS0FBSztnQkFRRyxVQUFVO3NCQUFsQixLQUFLO2dCQUdHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBR0csZUFBZTtzQkFBdkIsS0FBSztnQkFHRyxhQUFhO3NCQUFyQixLQUFLO2dCQUdhLGNBQWM7c0JBQWhDLE1BQU07Z0JBR1ksY0FBYztzQkFBaEMsTUFBTTtnQkFJWSxnQkFBZ0I7c0JBQWxDLE1BQU07Z0JBR3dCLGdCQUFnQjtzQkFBOUMsU0FBUzt1QkFBQyxrQkFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGxpY2Vuc2VcclxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuICpcclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcclxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxyXG4gKi9cclxuXHJcbmltcG9ydCB7XHJcbiAgRE9XTl9BUlJPVyxcclxuICBFTkQsXHJcbiAgRU5URVIsXHJcbiAgSE9NRSxcclxuICBMRUZUX0FSUk9XLFxyXG4gIFBBR0VfRE9XTixcclxuICBQQUdFX1VQLFxyXG4gIFJJR0hUX0FSUk9XLFxyXG4gIFVQX0FSUk9XLFxyXG4gIFNQQUNFLFxyXG4gIEVTQ0FQRSxcclxufSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xyXG5pbXBvcnQge1xyXG4gIEFmdGVyQ29udGVudEluaXQsXHJcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXHJcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXHJcbiAgQ29tcG9uZW50LFxyXG4gIEV2ZW50RW1pdHRlcixcclxuICBJbmplY3QsXHJcbiAgSW5wdXQsXHJcbiAgT3B0aW9uYWwsXHJcbiAgT3V0cHV0LFxyXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxyXG4gIFZpZXdDaGlsZCxcclxuICBPbkRlc3Ryb3ksXHJcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcclxuXHJcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHtzdGFydFdpdGh9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHsgRGF0ZVJhbmdlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvZGF0ZXBpY2tlcic7XHJcbmltcG9ydCB7IE5neE1hdENhbGVuZGFyQ2VsbENzc0NsYXNzZXMsIE5neE1hdENhbGVuZGFyVXNlckV2ZW50LCBOZ3hNYXRDYWxlbmRhckJvZHksIE5neE1hdENhbGVuZGFyQ2VsbCB9IGZyb20gJy4vY2FsZW5kYXItYm9keSc7XHJcbmltcG9ydCB7IE5HWF9NQVRfREFURV9GT1JNQVRTLCBOZ3hNYXREYXRlRm9ybWF0cyB9IGZyb20gJy4vY29yZS9kYXRlLWZvcm1hdHMnO1xyXG5pbXBvcnQgeyBOZ3hNYXREYXRlQWRhcHRlciB9IGZyb20gJy4vY29yZS9kYXRlLWFkYXB0ZXInO1xyXG5pbXBvcnQgeyBOR1hfTUFUX0RBVEVfUkFOR0VfU0VMRUNUSU9OX1NUUkFURUdZLCBOZ3hNYXREYXRlUmFuZ2VTZWxlY3Rpb25TdHJhdGVneSB9IGZyb20gJy4vZGF0ZS1yYW5nZS1zZWxlY3Rpb24tc3RyYXRlZ3knO1xyXG5pbXBvcnQgeyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvciB9IGZyb20gJy4vdXRpbHMvZGF0ZS11dGlscyc7XHJcblxyXG5cclxuXHJcbmNvbnN0IERBWVNfUEVSX1dFRUsgPSA3O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBbiBpbnRlcm5hbCBjb21wb25lbnQgdXNlZCB0byBkaXNwbGF5IGEgc2luZ2xlIG1vbnRoIGluIHRoZSBkYXRlcGlja2VyLlxyXG4gKiBAZG9jcy1wcml2YXRlXHJcbiAqL1xyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ25neC1tYXQtbW9udGgtdmlldycsXHJcbiAgdGVtcGxhdGVVcmw6ICdtb250aC12aWV3Lmh0bWwnLFxyXG4gIGV4cG9ydEFzOiAnbmd4TWF0TW9udGhWaWV3JyxcclxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxyXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBOZ3hNYXRNb250aFZpZXc8RD4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xyXG4gIHByaXZhdGUgX3JlcmVuZGVyU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgZGF0ZSB0byBkaXNwbGF5IGluIHRoaXMgbW9udGggdmlldyAoZXZlcnl0aGluZyBvdGhlciB0aGFuIHRoZSBtb250aCBhbmQgeWVhciBpcyBpZ25vcmVkKS5cclxuICAgKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBhY3RpdmVEYXRlKCk6IEQgeyByZXR1cm4gdGhpcy5fYWN0aXZlRGF0ZTsgfVxyXG4gIHNldCBhY3RpdmVEYXRlKHZhbHVlOiBEKSB7XHJcbiAgICBjb25zdCBvbGRBY3RpdmVEYXRlID0gdGhpcy5fYWN0aXZlRGF0ZTtcclxuICAgIGNvbnN0IHZhbGlkRGF0ZSA9XHJcbiAgICAgICAgdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKHZhbHVlKSkgfHwgdGhpcy5fZGF0ZUFkYXB0ZXIudG9kYXkoKTtcclxuICAgIHRoaXMuX2FjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5jbGFtcERhdGUodmFsaWREYXRlLCB0aGlzLm1pbkRhdGUsIHRoaXMubWF4RGF0ZSk7XHJcbiAgICBpZiAoIXRoaXMuX2hhc1NhbWVNb250aEFuZFllYXIob2xkQWN0aXZlRGF0ZSwgdGhpcy5fYWN0aXZlRGF0ZSkpIHtcclxuICAgICAgdGhpcy5faW5pdCgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwcml2YXRlIF9hY3RpdmVEYXRlOiBEO1xyXG5cclxuICAvKiogVGhlIGN1cnJlbnRseSBzZWxlY3RlZCBkYXRlLiAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IHNlbGVjdGVkKCk6IERhdGVSYW5nZTxEPiB8IEQgfCBudWxsIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkOyB9XHJcbiAgc2V0IHNlbGVjdGVkKHZhbHVlOiBEYXRlUmFuZ2U8RD4gfCBEIHwgbnVsbCkge1xyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZVJhbmdlKSB7XHJcbiAgICAgIHRoaXMuX3NlbGVjdGVkID0gdmFsdWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9zZWxlY3RlZCA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3NldFJhbmdlcyh0aGlzLl9zZWxlY3RlZCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgX3NlbGVjdGVkOiBEYXRlUmFuZ2U8RD4gfCBEIHwgbnVsbDtcclxuXHJcbiAgLyoqIFRoZSBtaW5pbXVtIHNlbGVjdGFibGUgZGF0ZS4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBtaW5EYXRlKCk6IEQgfCBudWxsIHsgcmV0dXJuIHRoaXMuX21pbkRhdGU7IH1cclxuICBzZXQgbWluRGF0ZSh2YWx1ZTogRCB8IG51bGwpIHtcclxuICAgIHRoaXMuX21pbkRhdGUgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUodmFsdWUpKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBfbWluRGF0ZTogRCB8IG51bGw7XHJcblxyXG4gIC8qKiBUaGUgbWF4aW11bSBzZWxlY3RhYmxlIGRhdGUuICovXHJcbiAgQElucHV0KClcclxuICBnZXQgbWF4RGF0ZSgpOiBEIHwgbnVsbCB7IHJldHVybiB0aGlzLl9tYXhEYXRlOyB9XHJcbiAgc2V0IG1heERhdGUodmFsdWU6IEQgfCBudWxsKSB7XHJcbiAgICB0aGlzLl9tYXhEYXRlID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKHZhbHVlKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgX21heERhdGU6IEQgfCBudWxsO1xyXG5cclxuICAvKiogRnVuY3Rpb24gdXNlZCB0byBmaWx0ZXIgd2hpY2ggZGF0ZXMgYXJlIHNlbGVjdGFibGUuICovXHJcbiAgQElucHV0KCkgZGF0ZUZpbHRlcjogKGRhdGU6IEQpID0+IGJvb2xlYW47XHJcblxyXG4gIC8qKiBGdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGFkZCBjdXN0b20gQ1NTIGNsYXNzZXMgdG8gZGF0ZXMuICovXHJcbiAgQElucHV0KCkgZGF0ZUNsYXNzOiAoZGF0ZTogRCkgPT4gTmd4TWF0Q2FsZW5kYXJDZWxsQ3NzQ2xhc3NlcztcclxuXHJcbiAgLyoqIFN0YXJ0IG9mIHRoZSBjb21wYXJpc29uIHJhbmdlLiAqL1xyXG4gIEBJbnB1dCgpIGNvbXBhcmlzb25TdGFydDogRCB8IG51bGw7XHJcblxyXG4gIC8qKiBFbmQgb2YgdGhlIGNvbXBhcmlzb24gcmFuZ2UuICovXHJcbiAgQElucHV0KCkgY29tcGFyaXNvbkVuZDogRCB8IG51bGw7XHJcblxyXG4gIC8qKiBFbWl0cyB3aGVuIGEgbmV3IGRhdGUgaXMgc2VsZWN0ZWQuICovXHJcbiAgQE91dHB1dCgpIHJlYWRvbmx5IHNlbGVjdGVkQ2hhbmdlOiBFdmVudEVtaXR0ZXI8RCB8IG51bGw+ID0gbmV3IEV2ZW50RW1pdHRlcjxEIHwgbnVsbD4oKTtcclxuXHJcbiAgLyoqIEVtaXRzIHdoZW4gYW55IGRhdGUgaXMgc2VsZWN0ZWQuICovXHJcbiAgQE91dHB1dCgpIHJlYWRvbmx5IF91c2VyU2VsZWN0aW9uOiBFdmVudEVtaXR0ZXI8Tmd4TWF0Q2FsZW5kYXJVc2VyRXZlbnQ8RCB8IG51bGw+PiA9XHJcbiAgICAgIG5ldyBFdmVudEVtaXR0ZXI8Tmd4TWF0Q2FsZW5kYXJVc2VyRXZlbnQ8RCB8IG51bGw+PigpO1xyXG5cclxuICAvKiogRW1pdHMgd2hlbiBhbnkgZGF0ZSBpcyBhY3RpdmF0ZWQuICovXHJcbiAgQE91dHB1dCgpIHJlYWRvbmx5IGFjdGl2ZURhdGVDaGFuZ2U6IEV2ZW50RW1pdHRlcjxEPiA9IG5ldyBFdmVudEVtaXR0ZXI8RD4oKTtcclxuXHJcbiAgLyoqIFRoZSBib2R5IG9mIGNhbGVuZGFyIHRhYmxlICovXHJcbiAgQFZpZXdDaGlsZChOZ3hNYXRDYWxlbmRhckJvZHkpIF9tYXRDYWxlbmRhckJvZHk6IE5neE1hdENhbGVuZGFyQm9keTtcclxuXHJcbiAgLyoqIFRoZSBsYWJlbCBmb3IgdGhpcyBtb250aCAoZS5nLiBcIkphbnVhcnkgMjAxN1wiKS4gKi9cclxuICBfbW9udGhMYWJlbDogc3RyaW5nO1xyXG5cclxuICAvKiogR3JpZCBvZiBjYWxlbmRhciBjZWxscyByZXByZXNlbnRpbmcgdGhlIGRhdGVzIG9mIHRoZSBtb250aC4gKi9cclxuICBfd2Vla3M6IE5neE1hdENhbGVuZGFyQ2VsbFtdW107XHJcblxyXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGJsYW5rIGNlbGxzIGluIHRoZSBmaXJzdCByb3cgYmVmb3JlIHRoZSAxc3Qgb2YgdGhlIG1vbnRoLiAqL1xyXG4gIF9maXJzdFdlZWtPZmZzZXQ6IG51bWJlcjtcclxuXHJcbiAgLyoqIFN0YXJ0IHZhbHVlIG9mIHRoZSBjdXJyZW50bHktc2hvd24gZGF0ZSByYW5nZS4gKi9cclxuICBfcmFuZ2VTdGFydDogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgLyoqIEVuZCB2YWx1ZSBvZiB0aGUgY3VycmVudGx5LXNob3duIGRhdGUgcmFuZ2UuICovXHJcbiAgX3JhbmdlRW5kOiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvKiogU3RhcnQgdmFsdWUgb2YgdGhlIGN1cnJlbnRseS1zaG93biBjb21wYXJpc29uIGRhdGUgcmFuZ2UuICovXHJcbiAgX2NvbXBhcmlzb25SYW5nZVN0YXJ0OiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvKiogRW5kIHZhbHVlIG9mIHRoZSBjdXJyZW50bHktc2hvd24gY29tcGFyaXNvbiBkYXRlIHJhbmdlLiAqL1xyXG4gIF9jb21wYXJpc29uUmFuZ2VFbmQ6IG51bWJlciB8IG51bGw7XHJcblxyXG4gIC8qKiBTdGFydCBvZiB0aGUgcHJldmlldyByYW5nZS4gKi9cclxuICBfcHJldmlld1N0YXJ0OiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvKiogRW5kIG9mIHRoZSBwcmV2aWV3IHJhbmdlLiAqL1xyXG4gIF9wcmV2aWV3RW5kOiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAvKiogV2hldGhlciB0aGUgdXNlciBpcyBjdXJyZW50bHkgc2VsZWN0aW5nIGEgcmFuZ2Ugb2YgZGF0ZXMuICovXHJcbiAgX2lzUmFuZ2U6IGJvb2xlYW47XHJcblxyXG4gIC8qKiBUaGUgZGF0ZSBvZiB0aGUgbW9udGggdGhhdCB0b2RheSBmYWxscyBvbi4gTnVsbCBpZiB0b2RheSBpcyBpbiBhbm90aGVyIG1vbnRoLiAqL1xyXG4gIF90b2RheURhdGU6IG51bWJlciB8IG51bGw7XHJcblxyXG4gIC8qKiBUaGUgbmFtZXMgb2YgdGhlIHdlZWtkYXlzLiAqL1xyXG4gIF93ZWVrZGF5czoge2xvbmc6IHN0cmluZywgbmFycm93OiBzdHJpbmd9W107XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcclxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KE5HWF9NQVRfREFURV9GT1JNQVRTKSBwcml2YXRlIF9kYXRlRm9ybWF0czogTmd4TWF0RGF0ZUZvcm1hdHMsXHJcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgcHVibGljIF9kYXRlQWRhcHRlcjogTmd4TWF0RGF0ZUFkYXB0ZXI8RD4sXHJcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyPzogRGlyZWN0aW9uYWxpdHksXHJcbiAgICAgICAgICAgICAgQEluamVjdChOR1hfTUFUX0RBVEVfUkFOR0VfU0VMRUNUSU9OX1NUUkFURUdZKSBAT3B0aW9uYWwoKVxyXG4gICAgICAgICAgICAgICAgICBwcml2YXRlIF9yYW5nZVN0cmF0ZWd5PzogTmd4TWF0RGF0ZVJhbmdlU2VsZWN0aW9uU3RyYXRlZ3k8RD4pIHtcclxuICAgIGlmICghdGhpcy5fZGF0ZUFkYXB0ZXIpIHtcclxuICAgICAgdGhyb3cgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IoJ05neE1hdERhdGVBZGFwdGVyJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMuX2RhdGVGb3JtYXRzKSB7XHJcbiAgICAgIHRocm93IGNyZWF0ZU1pc3NpbmdEYXRlSW1wbEVycm9yKCdOR1hfTUFUX0RBVEVfRk9STUFUUycpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2FjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci50b2RheSgpO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xyXG4gICAgdGhpcy5fcmVyZW5kZXJTdWJzY3JpcHRpb24gPSB0aGlzLl9kYXRlQWRhcHRlci5sb2NhbGVDaGFuZ2VzXHJcbiAgICAgIC5waXBlKHN0YXJ0V2l0aChudWxsKSlcclxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9pbml0KCkpO1xyXG4gIH1cclxuXHJcbiAgbmdPbkRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLl9yZXJlbmRlclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEhhbmRsZXMgd2hlbiBhIG5ldyBkYXRlIGlzIHNlbGVjdGVkLiAqL1xyXG4gIF9kYXRlU2VsZWN0ZWQoZXZlbnQ6IE5neE1hdENhbGVuZGFyVXNlckV2ZW50PG51bWJlcj4pIHtcclxuICAgIGNvbnN0IGRhdGUgPSBldmVudC52YWx1ZTtcclxuICAgIGNvbnN0IHNlbGVjdGVkWWVhciA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFllYXIodGhpcy5hY3RpdmVEYXRlKTtcclxuICAgIGNvbnN0IHNlbGVjdGVkTW9udGggPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aCh0aGlzLmFjdGl2ZURhdGUpO1xyXG4gICAgY29uc3Qgc2VsZWN0ZWREYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZShzZWxlY3RlZFllYXIsIHNlbGVjdGVkTW9udGgsIGRhdGUpO1xyXG4gICAgbGV0IHJhbmdlU3RhcnREYXRlOiBudW1iZXIgfCBudWxsO1xyXG4gICAgbGV0IHJhbmdlRW5kRGF0ZTogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgICBpZiAodGhpcy5fc2VsZWN0ZWQgaW5zdGFuY2VvZiBEYXRlUmFuZ2UpIHtcclxuICAgICAgcmFuZ2VTdGFydERhdGUgPSB0aGlzLl9nZXREYXRlSW5DdXJyZW50TW9udGgodGhpcy5fc2VsZWN0ZWQuc3RhcnQpO1xyXG4gICAgICByYW5nZUVuZERhdGUgPSB0aGlzLl9nZXREYXRlSW5DdXJyZW50TW9udGgodGhpcy5fc2VsZWN0ZWQuZW5kKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJhbmdlU3RhcnREYXRlID0gcmFuZ2VFbmREYXRlID0gdGhpcy5fZ2V0RGF0ZUluQ3VycmVudE1vbnRoKHRoaXMuX3NlbGVjdGVkKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmFuZ2VTdGFydERhdGUgIT09IGRhdGUgfHwgcmFuZ2VFbmREYXRlICE9PSBkYXRlKSB7XHJcbiAgICAgIHRoaXMuc2VsZWN0ZWRDaGFuZ2UuZW1pdChzZWxlY3RlZERhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3VzZXJTZWxlY3Rpb24uZW1pdCh7dmFsdWU6IHNlbGVjdGVkRGF0ZSwgZXZlbnQ6IGV2ZW50LmV2ZW50fSk7XHJcbiAgfVxyXG5cclxuICAvKiogSGFuZGxlcyBrZXlkb3duIGV2ZW50cyBvbiB0aGUgY2FsZW5kYXIgYm9keSB3aGVuIGNhbGVuZGFyIGlzIGluIG1vbnRoIHZpZXcuICovXHJcbiAgX2hhbmRsZUNhbGVuZGFyQm9keUtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcclxuICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBjdXJyZW50bHkgYWxsb3cga2V5Ym9hcmQgbmF2aWdhdGlvbiB0byBkaXNhYmxlZCBkYXRlcywgYnV0IGp1c3QgcHJldmVudFxyXG4gICAgLy8gZGlzYWJsZWQgb25lcyBmcm9tIGJlaW5nIHNlbGVjdGVkLiBUaGlzIG1heSBub3QgYmUgaWRlYWwsIHdlIHNob3VsZCBsb29rIGludG8gd2hldGhlclxyXG4gICAgLy8gbmF2aWdhdGlvbiBzaG91bGQgc2tpcCBvdmVyIGRpc2FibGVkIGRhdGVzLCBhbmQgaWYgc28sIGhvdyB0byBpbXBsZW1lbnQgdGhhdCBlZmZpY2llbnRseS5cclxuXHJcbiAgICBjb25zdCBvbGRBY3RpdmVEYXRlID0gdGhpcy5fYWN0aXZlRGF0ZTtcclxuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5faXNSdGwoKTtcclxuXHJcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcclxuICAgICAgY2FzZSBMRUZUX0FSUk9XOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyRGF5cyh0aGlzLl9hY3RpdmVEYXRlLCBpc1J0bCA/IDEgOiAtMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJEYXlzKHRoaXMuX2FjdGl2ZURhdGUsIGlzUnRsID8gLTEgOiAxKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBVUF9BUlJPVzpcclxuICAgICAgICB0aGlzLmFjdGl2ZURhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhckRheXModGhpcy5fYWN0aXZlRGF0ZSwgLTcpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIERPV05fQVJST1c6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJEYXlzKHRoaXMuX2FjdGl2ZURhdGUsIDcpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEhPTUU6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJEYXlzKHRoaXMuX2FjdGl2ZURhdGUsXHJcbiAgICAgICAgICAgIDEgLSB0aGlzLl9kYXRlQWRhcHRlci5nZXREYXRlKHRoaXMuX2FjdGl2ZURhdGUpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBFTkQ6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJEYXlzKHRoaXMuX2FjdGl2ZURhdGUsXHJcbiAgICAgICAgICAgICh0aGlzLl9kYXRlQWRhcHRlci5nZXROdW1EYXlzSW5Nb250aCh0aGlzLl9hY3RpdmVEYXRlKSAtXHJcbiAgICAgICAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0RGF0ZSh0aGlzLl9hY3RpdmVEYXRlKSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFBBR0VfVVA6XHJcbiAgICAgICAgdGhpcy5hY3RpdmVEYXRlID0gZXZlbnQuYWx0S2V5ID9cclxuICAgICAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuYWRkQ2FsZW5kYXJZZWFycyh0aGlzLl9hY3RpdmVEYXRlLCAtMSkgOlxyXG4gICAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhck1vbnRocyh0aGlzLl9hY3RpdmVEYXRlLCAtMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgUEFHRV9ET1dOOlxyXG4gICAgICAgIHRoaXMuYWN0aXZlRGF0ZSA9IGV2ZW50LmFsdEtleSA/XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGVBZGFwdGVyLmFkZENhbGVuZGFyWWVhcnModGhpcy5fYWN0aXZlRGF0ZSwgMSkgOlxyXG4gICAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5hZGRDYWxlbmRhck1vbnRocyh0aGlzLl9hY3RpdmVEYXRlLCAxKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBFTlRFUjpcclxuICAgICAgY2FzZSBTUEFDRTpcclxuICAgICAgICBpZiAoIXRoaXMuZGF0ZUZpbHRlciB8fCB0aGlzLmRhdGVGaWx0ZXIodGhpcy5fYWN0aXZlRGF0ZSkpIHtcclxuICAgICAgICAgIHRoaXMuX2RhdGVTZWxlY3RlZCh7dmFsdWU6IHRoaXMuX2RhdGVBZGFwdGVyLmdldERhdGUodGhpcy5fYWN0aXZlRGF0ZSksIGV2ZW50fSk7XHJcbiAgICAgICAgICAvLyBQcmV2ZW50IHVuZXhwZWN0ZWQgZGVmYXVsdCBhY3Rpb25zIHN1Y2ggYXMgZm9ybSBzdWJtaXNzaW9uLlxyXG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICBjYXNlIEVTQ0FQRTpcclxuICAgICAgICAvLyBBYm9ydCB0aGUgY3VycmVudCByYW5nZSBzZWxlY3Rpb24gaWYgdGhlIHVzZXIgcHJlc3NlcyBlc2NhcGUgbWlkLXNlbGVjdGlvbi5cclxuICAgICAgICBpZiAodGhpcy5fcHJldmlld0VuZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICB0aGlzLl9wcmV2aWV3U3RhcnQgPSB0aGlzLl9wcmV2aWV3RW5kID0gbnVsbDtcclxuICAgICAgICAgIHRoaXMuc2VsZWN0ZWRDaGFuZ2UuZW1pdChudWxsKTtcclxuICAgICAgICAgIHRoaXMuX3VzZXJTZWxlY3Rpb24uZW1pdCh7dmFsdWU6IG51bGwsIGV2ZW50fSk7XHJcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7IC8vIFByZXZlbnRzIHRoZSBvdmVybGF5IGZyb20gY2xvc2luZy5cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIC8vIERvbid0IHByZXZlbnQgZGVmYXVsdCBvciBmb2N1cyBhY3RpdmUgY2VsbCBvbiBrZXlzIHRoYXQgd2UgZG9uJ3QgZXhwbGljaXRseSBoYW5kbGUuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9kYXRlQWRhcHRlci5jb21wYXJlRGF0ZShvbGRBY3RpdmVEYXRlLCB0aGlzLmFjdGl2ZURhdGUpKSB7XHJcbiAgICAgIHRoaXMuYWN0aXZlRGF0ZUNoYW5nZS5lbWl0KHRoaXMuYWN0aXZlRGF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZm9jdXNBY3RpdmVDZWxsKCk7XHJcbiAgICAvLyBQcmV2ZW50IHVuZXhwZWN0ZWQgZGVmYXVsdCBhY3Rpb25zIHN1Y2ggYXMgZm9ybSBzdWJtaXNzaW9uLlxyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICB9XHJcblxyXG4gIC8qKiBJbml0aWFsaXplcyB0aGlzIG1vbnRoIHZpZXcuICovXHJcbiAgX2luaXQoKSB7XHJcbiAgICB0aGlzLl9zZXRSYW5nZXModGhpcy5zZWxlY3RlZCk7XHJcbiAgICB0aGlzLl90b2RheURhdGUgPSB0aGlzLl9nZXRDZWxsQ29tcGFyZVZhbHVlKHRoaXMuX2RhdGVBZGFwdGVyLnRvZGF5KCkpO1xyXG4gICAgdGhpcy5fbW9udGhMYWJlbCA9XHJcbiAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGhOYW1lcygnc2hvcnQnKVt0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aCh0aGlzLmFjdGl2ZURhdGUpXVxyXG4gICAgICAgICAgICAudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuXHJcbiAgICBsZXQgZmlyc3RPZk1vbnRoID0gdGhpcy5fZGF0ZUFkYXB0ZXIuY3JlYXRlRGF0ZSh0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMuYWN0aXZlRGF0ZSksXHJcbiAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TW9udGgodGhpcy5hY3RpdmVEYXRlKSwgMSk7XHJcbiAgICB0aGlzLl9maXJzdFdlZWtPZmZzZXQgPVxyXG4gICAgICAgIChEQVlTX1BFUl9XRUVLICsgdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0RGF5T2ZXZWVrKGZpcnN0T2ZNb250aCkgLVxyXG4gICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5nZXRGaXJzdERheU9mV2VlaygpKSAlIERBWVNfUEVSX1dFRUs7XHJcblxyXG4gICAgdGhpcy5faW5pdFdlZWtkYXlzKCk7XHJcbiAgICB0aGlzLl9jcmVhdGVXZWVrQ2VsbHMoKTtcclxuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEZvY3VzZXMgdGhlIGFjdGl2ZSBjZWxsIGFmdGVyIHRoZSBtaWNyb3Rhc2sgcXVldWUgaXMgZW1wdHkuICovXHJcbiAgX2ZvY3VzQWN0aXZlQ2VsbChtb3ZlUHJldmlldz86IGJvb2xlYW4pIHtcclxuICAgIHRoaXMuX21hdENhbGVuZGFyQm9keS5fZm9jdXNBY3RpdmVDZWxsKG1vdmVQcmV2aWV3KTtcclxuICB9XHJcblxyXG4gIC8qKiBDYWxsZWQgd2hlbiB0aGUgdXNlciBoYXMgYWN0aXZhdGVkIGEgbmV3IGNlbGwgYW5kIHRoZSBwcmV2aWV3IG5lZWRzIHRvIGJlIHVwZGF0ZWQuICovXHJcbiAgX3ByZXZpZXdDaGFuZ2VkKHtldmVudCwgdmFsdWU6IGNlbGx9OiBOZ3hNYXRDYWxlbmRhclVzZXJFdmVudDxOZ3hNYXRDYWxlbmRhckNlbGw8RD4gfCBudWxsPikge1xyXG4gICAgaWYgKHRoaXMuX3JhbmdlU3RyYXRlZ3kpIHtcclxuICAgICAgLy8gV2UgY2FuIGFzc3VtZSB0aGF0IHRoaXMgd2lsbCBiZSBhIHJhbmdlLCBiZWNhdXNlIHByZXZpZXdcclxuICAgICAgLy8gZXZlbnRzIGFyZW4ndCBmaXJlZCBmb3Igc2luZ2xlIGRhdGUgc2VsZWN0aW9ucy5cclxuICAgICAgY29uc3QgdmFsdWUgPSBjZWxsID8gY2VsbC5yYXdWYWx1ZSEgOiBudWxsO1xyXG4gICAgICBjb25zdCBwcmV2aWV3UmFuZ2UgPVxyXG4gICAgICAgICAgdGhpcy5fcmFuZ2VTdHJhdGVneS5jcmVhdGVQcmV2aWV3KHZhbHVlLCB0aGlzLnNlbGVjdGVkIGFzIERhdGVSYW5nZTxEPiwgZXZlbnQpO1xyXG4gICAgICB0aGlzLl9wcmV2aWV3U3RhcnQgPSB0aGlzLl9nZXRDZWxsQ29tcGFyZVZhbHVlKHByZXZpZXdSYW5nZS5zdGFydCk7XHJcbiAgICAgIHRoaXMuX3ByZXZpZXdFbmQgPSB0aGlzLl9nZXRDZWxsQ29tcGFyZVZhbHVlKHByZXZpZXdSYW5nZS5lbmQpO1xyXG5cclxuICAgICAgLy8gTm90ZSB0aGF0IGhlcmUgd2UgbmVlZCB0byB1c2UgYGRldGVjdENoYW5nZXNgLCByYXRoZXIgdGhhbiBgbWFya0ZvckNoZWNrYCwgYmVjYXVzZVxyXG4gICAgICAvLyB0aGUgd2F5IGBfZm9jdXNBY3RpdmVDZWxsYCBpcyBzZXQgdXAgYXQgdGhlIG1vbWVudCBtYWtlcyBpdCBmaXJlIGF0IHRoZSB3cm9uZyB0aW1lXHJcbiAgICAgIC8vIHdoZW4gbmF2aWdhdGluZyBvbmUgbW9udGggYmFjayB1c2luZyB0aGUga2V5Ym9hcmQgd2hpY2ggd2lsbCBjYXVzZSB0aGlzIGhhbmRsZXJcclxuICAgICAgLy8gdG8gdGhyb3cgYSBcImNoYW5nZWQgYWZ0ZXIgY2hlY2tlZFwiIGVycm9yIHdoZW4gdXBkYXRpbmcgdGhlIHByZXZpZXcgc3RhdGUuXHJcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKiBJbml0aWFsaXplcyB0aGUgd2Vla2RheXMuICovXHJcbiAgcHJpdmF0ZSBfaW5pdFdlZWtkYXlzKCkge1xyXG4gICAgY29uc3QgZmlyc3REYXlPZldlZWsgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRGaXJzdERheU9mV2VlaygpO1xyXG4gICAgY29uc3QgbmFycm93V2Vla2RheXMgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXREYXlPZldlZWtOYW1lcygnbmFycm93Jyk7XHJcbiAgICBjb25zdCBsb25nV2Vla2RheXMgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXREYXlPZldlZWtOYW1lcygnbG9uZycpO1xyXG5cclxuICAgIC8vIFJvdGF0ZSB0aGUgbGFiZWxzIGZvciBkYXlzIG9mIHRoZSB3ZWVrIGJhc2VkIG9uIHRoZSBjb25maWd1cmVkIGZpcnN0IGRheSBvZiB0aGUgd2Vlay5cclxuICAgIGxldCB3ZWVrZGF5cyA9IGxvbmdXZWVrZGF5cy5tYXAoKGxvbmcsIGkpID0+IHtcclxuICAgICAgICByZXR1cm4ge2xvbmcsIG5hcnJvdzogbmFycm93V2Vla2RheXNbaV19O1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLl93ZWVrZGF5cyA9IHdlZWtkYXlzLnNsaWNlKGZpcnN0RGF5T2ZXZWVrKS5jb25jYXQod2Vla2RheXMuc2xpY2UoMCwgZmlyc3REYXlPZldlZWspKTtcclxuICB9XHJcblxyXG4gIC8qKiBDcmVhdGVzIE1hdENhbGVuZGFyQ2VsbHMgZm9yIHRoZSBkYXRlcyBpbiB0aGlzIG1vbnRoLiAqL1xyXG4gIHByaXZhdGUgX2NyZWF0ZVdlZWtDZWxscygpIHtcclxuICAgIGNvbnN0IGRheXNJbk1vbnRoID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TnVtRGF5c0luTW9udGgodGhpcy5hY3RpdmVEYXRlKTtcclxuICAgIGNvbnN0IGRhdGVOYW1lcyA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldERhdGVOYW1lcygpO1xyXG4gICAgdGhpcy5fd2Vla3MgPSBbW11dO1xyXG4gICAgZm9yIChsZXQgaSA9IDAsIGNlbGwgPSB0aGlzLl9maXJzdFdlZWtPZmZzZXQ7IGkgPCBkYXlzSW5Nb250aDsgaSsrLCBjZWxsKyspIHtcclxuICAgICAgaWYgKGNlbGwgPT0gREFZU19QRVJfV0VFSykge1xyXG4gICAgICAgIHRoaXMuX3dlZWtzLnB1c2goW10pO1xyXG4gICAgICAgIGNlbGwgPSAwO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLl9kYXRlQWRhcHRlci5jcmVhdGVEYXRlKFxyXG4gICAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKHRoaXMuYWN0aXZlRGF0ZSksXHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGVBZGFwdGVyLmdldE1vbnRoKHRoaXMuYWN0aXZlRGF0ZSksIGkgKyAxKTtcclxuICAgICAgY29uc3QgZW5hYmxlZCA9IHRoaXMuX3Nob3VsZEVuYWJsZURhdGUoZGF0ZSk7XHJcbiAgICAgIGNvbnN0IGFyaWFMYWJlbCA9IHRoaXMuX2RhdGVBZGFwdGVyLmZvcm1hdChkYXRlLCB0aGlzLl9kYXRlRm9ybWF0cy5kaXNwbGF5LmRhdGVBMTF5TGFiZWwpO1xyXG4gICAgICBjb25zdCBjZWxsQ2xhc3NlcyA9IHRoaXMuZGF0ZUNsYXNzID8gdGhpcy5kYXRlQ2xhc3MoZGF0ZSkgOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICB0aGlzLl93ZWVrc1t0aGlzLl93ZWVrcy5sZW5ndGggLSAxXS5wdXNoKG5ldyBOZ3hNYXRDYWxlbmRhckNlbGw8RD4oaSArIDEsIGRhdGVOYW1lc1tpXSxcclxuICAgICAgICAgIGFyaWFMYWJlbCwgZW5hYmxlZCwgY2VsbENsYXNzZXMsIHRoaXMuX2dldENlbGxDb21wYXJlVmFsdWUoZGF0ZSkhLCBkYXRlKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiogRGF0ZSBmaWx0ZXIgZm9yIHRoZSBtb250aCAqL1xyXG4gIHByaXZhdGUgX3Nob3VsZEVuYWJsZURhdGUoZGF0ZTogRCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhZGF0ZSAmJlxyXG4gICAgICAgICghdGhpcy5taW5EYXRlIHx8IHRoaXMuX2RhdGVBZGFwdGVyLmNvbXBhcmVEYXRlKGRhdGUsIHRoaXMubWluRGF0ZSkgPj0gMCkgJiZcclxuICAgICAgICAoIXRoaXMubWF4RGF0ZSB8fCB0aGlzLl9kYXRlQWRhcHRlci5jb21wYXJlRGF0ZShkYXRlLCB0aGlzLm1heERhdGUpIDw9IDApICYmXHJcbiAgICAgICAgKCF0aGlzLmRhdGVGaWx0ZXIgfHwgdGhpcy5kYXRlRmlsdGVyKGRhdGUpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGRhdGUgaW4gdGhpcyBtb250aCB0aGF0IHRoZSBnaXZlbiBEYXRlIGZhbGxzIG9uLlxyXG4gICAqIFJldHVybnMgbnVsbCBpZiB0aGUgZ2l2ZW4gRGF0ZSBpcyBpbiBhbm90aGVyIG1vbnRoLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2dldERhdGVJbkN1cnJlbnRNb250aChkYXRlOiBEIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xyXG4gICAgcmV0dXJuIGRhdGUgJiYgdGhpcy5faGFzU2FtZU1vbnRoQW5kWWVhcihkYXRlLCB0aGlzLmFjdGl2ZURhdGUpID9cclxuICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5nZXREYXRlKGRhdGUpIDogbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgMiBkYXRlcyBhcmUgbm9uLW51bGwgYW5kIGZhbGwgd2l0aGluIHRoZSBzYW1lIG1vbnRoIG9mIHRoZSBzYW1lIHllYXIuICovXHJcbiAgcHJpdmF0ZSBfaGFzU2FtZU1vbnRoQW5kWWVhcihkMTogRCB8IG51bGwsIGQyOiBEIHwgbnVsbCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhKGQxICYmIGQyICYmIHRoaXMuX2RhdGVBZGFwdGVyLmdldE1vbnRoKGQxKSA9PSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aChkMikgJiZcclxuICAgICAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKGQxKSA9PSB0aGlzLl9kYXRlQWRhcHRlci5nZXRZZWFyKGQyKSk7XHJcbiAgfVxyXG5cclxuICAvKiogR2V0cyB0aGUgdmFsdWUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gb25lIGNlbGwgdG8gYW5vdGhlci4gKi9cclxuICBwcml2YXRlIF9nZXRDZWxsQ29tcGFyZVZhbHVlKGRhdGU6IEQgfCBudWxsKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICBpZiAoZGF0ZSkge1xyXG4gICAgICAvLyBXZSB1c2UgdGhlIHRpbWUgc2luY2UgdGhlIFVuaXggZXBvY2ggdG8gY29tcGFyZSBkYXRlcyBpbiB0aGlzIHZpZXcsIHJhdGhlciB0aGFuIHRoZVxyXG4gICAgICAvLyBjZWxsIHZhbHVlcywgYmVjYXVzZSB3ZSBuZWVkIHRvIHN1cHBvcnQgcmFuZ2VzIHRoYXQgc3BhbiBhY3Jvc3MgbXVsdGlwbGUgbW9udGhzL3llYXJzLlxyXG4gICAgICBjb25zdCB5ZWFyID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0WWVhcihkYXRlKTtcclxuICAgICAgY29uc3QgbW9udGggPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNb250aChkYXRlKTtcclxuICAgICAgY29uc3QgZGF5ID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0RGF0ZShkYXRlKTtcclxuICAgICAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXkpLmdldFRpbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBjaGVjay5cclxuICAgKiBAcmV0dXJucyBUaGUgZ2l2ZW4gb2JqZWN0IGlmIGl0IGlzIGJvdGggYSBkYXRlIGluc3RhbmNlIGFuZCB2YWxpZCwgb3RoZXJ3aXNlIG51bGwuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZ2V0VmFsaWREYXRlT3JOdWxsKG9iajogYW55KTogRCB8IG51bGwge1xyXG4gICAgcmV0dXJuICh0aGlzLl9kYXRlQWRhcHRlci5pc0RhdGVJbnN0YW5jZShvYmopICYmIHRoaXMuX2RhdGVBZGFwdGVyLmlzVmFsaWQob2JqKSkgPyBvYmogOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGUgdXNlciBoYXMgdGhlIFJUTCBsYXlvdXQgZGlyZWN0aW9uLiAqL1xyXG4gIHByaXZhdGUgX2lzUnRsKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2RpciAmJiB0aGlzLl9kaXIudmFsdWUgPT09ICdydGwnO1xyXG4gIH1cclxuXHJcbiAgLyoqIFNldHMgdGhlIGN1cnJlbnQgcmFuZ2UgYmFzZWQgb24gYSBtb2RlbCB2YWx1ZS4gKi9cclxuICBwcml2YXRlIF9zZXRSYW5nZXMoc2VsZWN0ZWRWYWx1ZTogRGF0ZVJhbmdlPEQ+IHwgRCB8IG51bGwpIHtcclxuICAgIGlmIChzZWxlY3RlZFZhbHVlIGluc3RhbmNlb2YgRGF0ZVJhbmdlKSB7XHJcbiAgICAgIHRoaXMuX3JhbmdlU3RhcnQgPSB0aGlzLl9nZXRDZWxsQ29tcGFyZVZhbHVlKHNlbGVjdGVkVmFsdWUuc3RhcnQpO1xyXG4gICAgICB0aGlzLl9yYW5nZUVuZCA9IHRoaXMuX2dldENlbGxDb21wYXJlVmFsdWUoc2VsZWN0ZWRWYWx1ZS5lbmQpO1xyXG4gICAgICB0aGlzLl9pc1JhbmdlID0gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX3JhbmdlU3RhcnQgPSB0aGlzLl9yYW5nZUVuZCA9IHRoaXMuX2dldENlbGxDb21wYXJlVmFsdWUoc2VsZWN0ZWRWYWx1ZSk7XHJcbiAgICAgIHRoaXMuX2lzUmFuZ2UgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9jb21wYXJpc29uUmFuZ2VTdGFydCA9IHRoaXMuX2dldENlbGxDb21wYXJlVmFsdWUodGhpcy5jb21wYXJpc29uU3RhcnQpO1xyXG4gICAgdGhpcy5fY29tcGFyaXNvblJhbmdlRW5kID0gdGhpcy5fZ2V0Q2VsbENvbXBhcmVWYWx1ZSh0aGlzLmNvbXBhcmlzb25FbmQpO1xyXG4gIH1cclxufVxyXG4iLCI8dGFibGUgY2xhc3M9XCJtYXQtY2FsZW5kYXItdGFibGVcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+XHJcbiAgPHRoZWFkIGNsYXNzPVwibWF0LWNhbGVuZGFyLXRhYmxlLWhlYWRlclwiPlxyXG4gICAgPHRyPlxyXG4gICAgICA8dGggc2NvcGU9XCJjb2xcIiAqbmdGb3I9XCJsZXQgZGF5IG9mIF93ZWVrZGF5c1wiIFthdHRyLmFyaWEtbGFiZWxdPVwiZGF5LmxvbmdcIj57e2RheS5uYXJyb3d9fTwvdGg+XHJcbiAgICA8L3RyPlxyXG4gICAgPHRyPjx0aCBjbGFzcz1cIm1hdC1jYWxlbmRhci10YWJsZS1oZWFkZXItZGl2aWRlclwiIGNvbHNwYW49XCI3XCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC90aD48L3RyPlxyXG4gIDwvdGhlYWQ+XHJcbiAgPHRib2R5IG5neC1tYXQtY2FsZW5kYXItYm9keVxyXG4gICAgICAgICBbbGFiZWxdPVwiX21vbnRoTGFiZWxcIlxyXG4gICAgICAgICBbcm93c109XCJfd2Vla3NcIlxyXG4gICAgICAgICBbdG9kYXlWYWx1ZV09XCJfdG9kYXlEYXRlIVwiXHJcbiAgICAgICAgIFtzdGFydFZhbHVlXT1cIl9yYW5nZVN0YXJ0IVwiXHJcbiAgICAgICAgIFtlbmRWYWx1ZV09XCJfcmFuZ2VFbmQhXCJcclxuICAgICAgICAgW2NvbXBhcmlzb25TdGFydF09XCJfY29tcGFyaXNvblJhbmdlU3RhcnRcIlxyXG4gICAgICAgICBbY29tcGFyaXNvbkVuZF09XCJfY29tcGFyaXNvblJhbmdlRW5kXCJcclxuICAgICAgICAgW3ByZXZpZXdTdGFydF09XCJfcHJldmlld1N0YXJ0XCJcclxuICAgICAgICAgW3ByZXZpZXdFbmRdPVwiX3ByZXZpZXdFbmRcIlxyXG4gICAgICAgICBbaXNSYW5nZV09XCJfaXNSYW5nZVwiXHJcbiAgICAgICAgIFtsYWJlbE1pblJlcXVpcmVkQ2VsbHNdPVwiM1wiXHJcbiAgICAgICAgIFthY3RpdmVDZWxsXT1cIl9kYXRlQWRhcHRlci5nZXREYXRlKGFjdGl2ZURhdGUpIC0gMVwiXHJcbiAgICAgICAgIChzZWxlY3RlZFZhbHVlQ2hhbmdlKT1cIl9kYXRlU2VsZWN0ZWQoJGV2ZW50KVwiXHJcbiAgICAgICAgIChwcmV2aWV3Q2hhbmdlKT1cIl9wcmV2aWV3Q2hhbmdlZCgkZXZlbnQpXCJcclxuICAgICAgICAgKGtleWRvd24pPVwiX2hhbmRsZUNhbGVuZGFyQm9keUtleWRvd24oJGV2ZW50KVwiPlxyXG4gIDwvdGJvZHk+XHJcbjwvdGFibGU+XHJcbiJdfQ==