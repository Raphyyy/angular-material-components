import { Inject, Injectable, Optional } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatDateAdapter } from './date-adapter';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
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
catch {
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
export class NgxMatNativeDateAdapter extends NgxMatDateAdapter {
    /** Whether to clamp the date between 1 and 9999 to avoid IE and Edge errors. */
    _clampDate;
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
    useUtcForDisplay = true;
    constructor(matDateLocale, platform) {
        super();
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
            displayFormat = { ...displayFormat, timeZone: 'utc' };
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
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatNativeDateAdapter, deps: [{ token: MAT_DATE_LOCALE, optional: true }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
    /** @nocollapse */ static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatNativeDateAdapter });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatNativeDateAdapter, decorators: [{
            type: Injectable
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MAT_DATE_LOCALE]
                }] }, { type: i1.Platform }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlLWRhdGUtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2RhdGV0aW1lLXBpY2tlci9zcmMvbGliL2NvcmUvbmF0aXZlLWRhdGUtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3pELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGdCQUFnQixDQUFDOzs7QUFFbkQsNkRBQTZEO0FBQzdELGlEQUFpRDtBQUNqRCxJQUFJLGlCQUEwQixDQUFDO0FBRS9CLDZGQUE2RjtBQUM3Riw4RkFBOEY7QUFDOUYscURBQXFEO0FBQ3JELHNEQUFzRDtBQUN0RCxxREFBcUQ7QUFDckQsSUFBSSxDQUFDO0lBQ0gsaUJBQWlCLEdBQUcsT0FBTyxJQUFJLElBQUksV0FBVyxDQUFDO0FBQ2pELENBQUM7QUFBQyxNQUFNLENBQUM7SUFDUCxpQkFBaUIsR0FBRyxLQUFLLENBQUM7QUFDNUIsQ0FBQztBQUVELG1FQUFtRTtBQUNuRSxNQUFNLG1CQUFtQixHQUFHO0lBQzFCLE1BQU0sRUFBRTtRQUNOLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVztRQUNyRixTQUFTLEVBQUUsVUFBVSxFQUFFLFVBQVU7S0FDbEM7SUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQztJQUM3RixRQUFRLEVBQUUsQ0FBQyxHQUFH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QTFSVSx1QkFBdUIsa0JBa0JGLGVBQWU7K0hBbEJwQyx1QkFBdUI7OzRGQUF2Qix1QkFBdUI7a0JBRG5DLFVBQVU7OzBCQW1CSSxRQUFROzswQkFBSSxNQUFNOzJCQUFDLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQGxpY2Vuc2VcclxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuICpcclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcclxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxyXG4gKi9cclxuXHJcbmltcG9ydCB7IFBsYXRmb3JtIH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcclxuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlLCBPcHRpb25hbCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBNQVRfREFURV9MT0NBTEUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9jb3JlJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZUFkYXB0ZXIgfSBmcm9tICcuL2RhdGUtYWRhcHRlcic7XHJcblxyXG4vLyBUT0RPKG1tYWxlcmJhKTogUmVtb3ZlIHdoZW4gd2Ugbm8gbG9uZ2VyIHN1cHBvcnQgc2FmYXJpIDkuXHJcbi8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIHRoZSBJbnRsIEFQSS4gKi9cclxubGV0IFNVUFBPUlRTX0lOVExfQVBJOiBib29sZWFuO1xyXG5cclxuLy8gV2UgbmVlZCBhIHRyeS9jYXRjaCBhcm91bmQgdGhlIHJlZmVyZW5jZSB0byBgSW50bGAsIGJlY2F1c2UgYWNjZXNzaW5nIGl0IGluIHNvbWUgY2FzZXMgY2FuXHJcbi8vIGNhdXNlIElFIHRvIHRocm93LiBUaGVzZSBjYXNlcyBhcmUgdGllZCB0byBwYXJ0aWN1bGFyIHZlcnNpb25zIG9mIFdpbmRvd3MgYW5kIGNhbiBoYXBwZW4gaWZcclxuLy8gdGhlIGNvbnN1bWVyIGlzIHByb3ZpZGluZyBhIHBvbHlmaWxsZWQgYE1hcGAuIFNlZTpcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9DaGFrcmFDb3JlL2lzc3Vlcy8zMTg5XHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvaXNzdWVzLzE1Njg3XHJcbnRyeSB7XHJcbiAgU1VQUE9SVFNfSU5UTF9BUEkgPSB0eXBlb2YgSW50bCAhPSAndW5kZWZpbmVkJztcclxufSBjYXRjaCB7XHJcbiAgU1VQUE9SVFNfSU5UTF9BUEkgPSBmYWxzZTtcclxufVxyXG5cclxuLyoqIFRoZSBkZWZhdWx0IG1vbnRoIG5hbWVzIHRvIHVzZSBpZiBJbnRsIEFQSSBpcyBub3QgYXZhaWxhYmxlLiAqL1xyXG5jb25zdCBERUZBVUxUX01PTlRIX05BTUVTID0ge1xyXG4gICdsb25nJzogW1xyXG4gICAgJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJyxcclxuICAgICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ1xyXG4gIF0sXHJcbiAgJ3Nob3J0JzogWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddLFxyXG4gICduYXJyb3cnOiBbJ0onLCAnRicsICdNJywgJ0EnLCAnTScsICdKJywgJ0onLCAnQScsICdTJywgJ08nLCAnTicsICdEJ11cclxufTtcclxuXHJcblxyXG4vKiogVGhlIGRlZmF1bHQgZGF0ZSBuYW1lcyB0byB1c2UgaWYgSW50bCBBUEkgaXMgbm90IGF2YWlsYWJsZS4gKi9cclxuY29uc3QgREVGQVVMVF9EQVRFX05BTUVTID0gcmFuZ2UoMzEsIGkgPT4gU3RyaW5nKGkgKyAxKSk7XHJcblxyXG5cclxuLyoqIFRoZSBkZWZhdWx0IGRheSBvZiB0aGUgd2VlayBuYW1lcyB0byB1c2UgaWYgSW50bCBBUEkgaXMgbm90IGF2YWlsYWJsZS4gKi9cclxuY29uc3QgREVGQVVMVF9EQVlfT0ZfV0VFS19OQU1FUyA9IHtcclxuICAnbG9uZyc6IFsnU3VuZGF5JywgJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknLCAnU2F0dXJkYXknXSxcclxuICAnc2hvcnQnOiBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddLFxyXG4gICduYXJyb3cnOiBbJ1MnLCAnTScsICdUJywgJ1cnLCAnVCcsICdGJywgJ1MnXVxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBNYXRjaGVzIHN0cmluZ3MgdGhhdCBoYXZlIHRoZSBmb3JtIG9mIGEgdmFsaWQgUkZDIDMzMzkgc3RyaW5nXHJcbiAqIChodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzMzOSkuIE5vdGUgdGhhdCB0aGUgc3RyaW5nIG1heSBub3QgYWN0dWFsbHkgYmUgYSB2YWxpZCBkYXRlXHJcbiAqIGJlY2F1c2UgdGhlIHJlZ2V4IHdpbGwgbWF0Y2ggc3RyaW5ncyBhbiB3aXRoIG91dCBvZiBib3VuZHMgbW9udGgsIGRhdGUsIGV0Yy5cclxuICovXHJcbmNvbnN0IElTT184NjAxX1JFR0VYID1cclxuICAvXlxcZHs0fS1cXGR7Mn0tXFxkezJ9KD86VFxcZHsyfTpcXGR7Mn06XFxkezJ9KD86XFwuXFxkKyk/KD86WnwoPzooPzpcXCt8LSlcXGR7Mn06XFxkezJ9KSk/KT8kLztcclxuXHJcblxyXG4vKiogQ3JlYXRlcyBhbiBhcnJheSBhbmQgZmlsbHMgaXQgd2l0aCB2YWx1ZXMuICovXHJcbmZ1bmN0aW9uIHJhbmdlPFQ+KGxlbmd0aDogbnVtYmVyLCB2YWx1ZUZ1bmN0aW9uOiAoaW5kZXg6IG51bWJlcikgPT4gVCk6IFRbXSB7XHJcbiAgY29uc3QgdmFsdWVzQXJyYXkgPSBBcnJheShsZW5ndGgpO1xyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgIHZhbHVlc0FycmF5W2ldID0gdmFsdWVGdW5jdGlvbihpKTtcclxuICB9XHJcbiAgcmV0dXJuIHZhbHVlc0FycmF5O1xyXG59XHJcblxyXG4vKiogQWRhcHRzIHRoZSBuYXRpdmUgSlMgRGF0ZSBmb3IgdXNlIHdpdGggY2RrLWJhc2VkIGNvbXBvbmVudHMgdGhhdCB3b3JrIHdpdGggZGF0ZXMuICovXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIE5neE1hdE5hdGl2ZURhdGVBZGFwdGVyIGV4dGVuZHMgTmd4TWF0RGF0ZUFkYXB0ZXI8RGF0ZT4ge1xyXG5cclxuICAvKiogV2hldGhlciB0byBjbGFtcCB0aGUgZGF0ZSBiZXR3ZWVuIDEgYW5kIDk5OTkgdG8gYXZvaWQgSUUgYW5kIEVkZ2UgZXJyb3JzLiAqL1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX2NsYW1wRGF0ZTogYm9vbGVhbjtcclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciB0byB1c2UgYHRpbWVab25lOiAndXRjJ2Agd2l0aCBgSW50bC5EYXRlVGltZUZvcm1hdGAgd2hlbiBmb3JtYXR0aW5nIGRhdGVzLlxyXG4gICAqIFdpdGhvdXQgdGhpcyBgSW50bC5EYXRlVGltZUZvcm1hdGAgc29tZXRpbWVzIGNob29zZXMgdGhlIHdyb25nIHRpbWVab25lLCB3aGljaCBjYW4gdGhyb3cgb2ZmXHJcbiAgICogdGhlIHJlc3VsdC4gKGUuZy4gaW4gdGhlIGVuLVVTIGxvY2FsZSBgbmV3IERhdGUoMTgwMCwgNywgMTQpLnRvTG9jYWxlRGF0ZVN0cmluZygpYFxyXG4gICAqIHdpbGwgcHJvZHVjZSBgJzgvMTMvMTgwMCdgLlxyXG4gICAqXHJcbiAgICogVE9ETyhtbWFsZXJiYSk6IGRyb3AgdGhpcyB2YXJpYWJsZS4gSXQncyBub3QgYmVpbmcgdXNlZCBpbiB0aGUgY29kZSByaWdodCBub3cuIFdlJ3JlIG5vd1xyXG4gICAqIGdldHRpbmcgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIERhdGUgb2JqZWN0IGZyb20gaXRzIHV0YyByZXByZXNlbnRhdGlvbi4gV2UncmUga2VlcGluZ1xyXG4gICAqIGl0IGhlcmUgZm9yIHNvbWV0aW1lLCBqdXN0IGZvciBwcmVjYXV0aW9uLCBpbiBjYXNlIHdlIGRlY2lkZSB0byByZXZlcnQgc29tZSBvZiB0aGVzZSBjaGFuZ2VzXHJcbiAgICogdGhvdWdoLlxyXG4gICAqL1xyXG4gIHVzZVV0Y0ZvckRpc3BsYXk6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBASW5qZWN0KE1BVF9EQVRFX0xPQ0FMRSkgbWF0RGF0ZUxvY2FsZTogc3RyaW5nLCBwbGF0Zm9ybTogUGxhdGZvcm0pIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICBzdXBlci5zZXRMb2NhbGUobWF0RGF0ZUxvY2FsZSk7XHJcblxyXG4gICAgLy8gSUUgZG9lcyBpdHMgb3duIHRpbWUgem9uZSBjb3JyZWN0aW9uLCBzbyB3ZSBkaXNhYmxlIHRoaXMgb24gSUUuXHJcbiAgICB0aGlzLnVzZVV0Y0ZvckRpc3BsYXkgPSAhcGxhdGZvcm0uVFJJREVOVDtcclxuICAgIHRoaXMuX2NsYW1wRGF0ZSA9IHBsYXRmb3JtLlRSSURFTlQgfHwgcGxhdGZvcm0uRURHRTtcclxuICB9XHJcblxyXG4gIGdldFllYXIoZGF0ZTogRGF0ZSk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gIH1cclxuXHJcbiAgZ2V0TW9udGgoZGF0ZTogRGF0ZSk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRNb250aCgpO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0ZShkYXRlOiBEYXRlKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBkYXRlLmdldERhdGUoKTtcclxuICB9XHJcblxyXG4gIGdldERheU9mV2VlayhkYXRlOiBEYXRlKTogbnVtYmVyIHtcclxuICAgIHJldHVybiBkYXRlLmdldERheSgpO1xyXG4gIH1cclxuXHJcbiAgZ2V0TW9udGhOYW1lcyhzdHlsZTogJ2xvbmcnIHwgJ3Nob3J0JyB8ICduYXJyb3cnKTogc3RyaW5nW10ge1xyXG4gICAgaWYgKFNVUFBPUlRTX0lOVExfQVBJKSB7XHJcbiAgICAgIGNvbnN0IGR0ZiA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KHRoaXMubG9jYWxlLCB7IG1vbnRoOiBzdHlsZSwgdGltZVpvbmU6ICd1dGMnIH0pO1xyXG4gICAgICByZXR1cm4gcmFuZ2UoMTIsIGkgPT5cclxuICAgICAgICB0aGlzLl9zdHJpcERpcmVjdGlvbmFsaXR5Q2hhcmFjdGVycyh0aGlzLl9mb3JtYXQoZHRmLCBuZXcgRGF0ZSgyMDE3LCBpLCAxKSkpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBERUZBVUxUX01PTlRIX05BTUVTW3N0eWxlXTtcclxuICB9XHJcblxyXG4gIGdldERhdGVOYW1lcygpOiBzdHJpbmdbXSB7XHJcbiAgICBpZiAoU1VQUE9SVFNfSU5UTF9BUEkpIHtcclxuICAgICAgY29uc3QgZHRmID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodGhpcy5sb2NhbGUsIHsgZGF5OiAnbnVtZXJpYycsIHRpbWVab25lOiAndXRjJyB9KTtcclxuICAgICAgcmV0dXJuIHJhbmdlKDMxLCBpID0+IHRoaXMuX3N0cmlwRGlyZWN0aW9uYWxpdHlDaGFyYWN0ZXJzKFxyXG4gICAgICAgIHRoaXMuX2Zvcm1hdChkdGYsIG5ldyBEYXRlKDIwMTcsIDAsIGkgKyAxKSkpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBERUZBVUxUX0RBVEVfTkFNRVM7XHJcbiAgfVxyXG5cclxuICBnZXREYXlPZldlZWtOYW1lcyhzdHlsZTogJ2xvbmcnIHwgJ3Nob3J0JyB8ICduYXJyb3cnKTogc3RyaW5nW10ge1xyXG4gICAgaWYgKFNVUFBPUlRTX0lOVExfQVBJKSB7XHJcbiAgICAgIGNvbnN0IGR0ZiA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KHRoaXMubG9jYWxlLCB7IHdlZWtkYXk6IHN0eWxlLCB0aW1lWm9uZTogJ3V0YycgfSk7XHJcbiAgICAgIHJldHVybiByYW5nZSg3LCBpID0+IHRoaXMuX3N0cmlwRGlyZWN0aW9uYWxpdHlDaGFyYWN0ZXJzKFxyXG4gICAgICAgIHRoaXMuX2Zvcm1hdChkdGYsIG5ldyBEYXRlKDIwMTcsIDAsIGkgKyAxKSkpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBERUZBVUxUX0RBWV9PRl9XRUVLX05BTUVTW3N0eWxlXTtcclxuICB9XHJcblxyXG4gIGdldFllYXJOYW1lKGRhdGU6IERhdGUpOiBzdHJpbmcge1xyXG4gICAgaWYgKFNVUFBPUlRTX0lOVExfQVBJKSB7XHJcbiAgICAgIGNvbnN0IGR0ZiA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KHRoaXMubG9jYWxlLCB7IHllYXI6ICdudW1lcmljJywgdGltZVpvbmU6ICd1dGMnIH0pO1xyXG4gICAgICByZXR1cm4gdGhpcy5fc3RyaXBEaXJlY3Rpb25hbGl0eUNoYXJhY3RlcnModGhpcy5fZm9ybWF0KGR0ZiwgZGF0ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFN0cmluZyh0aGlzLmdldFllYXIoZGF0ZSkpO1xyXG4gIH1cclxuXHJcbiAgZ2V0Rmlyc3REYXlPZldlZWsoKTogbnVtYmVyIHtcclxuICAgIC8vIFdlIGNhbid0IHRlbGwgdXNpbmcgbmF0aXZlIEpTIERhdGUgd2hhdCB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrIGlzLCB3ZSBkZWZhdWx0IHRvIFN1bmRheS5cclxuICAgIHJldHVybiAwO1xyXG4gIH1cclxuXHJcbiAgZ2V0TnVtRGF5c0luTW9udGgoZGF0ZTogRGF0ZSk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXREYXRlKHRoaXMuX2NyZWF0ZURhdGVXaXRoT3ZlcmZsb3coXHJcbiAgICAgIHRoaXMuZ2V0WWVhcihkYXRlKSwgdGhpcy5nZXRNb250aChkYXRlKSArIDEsIDApKTtcclxuICB9XHJcblxyXG4gIGNsb25lKGRhdGU6IERhdGUpOiBEYXRlIHtcclxuICAgIHJldHVybiBuZXcgRGF0ZShkYXRlLmdldFRpbWUoKSk7XHJcbiAgfVxyXG5cclxuICBjcmVhdGVEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF0ZTogbnVtYmVyKTogRGF0ZSB7XHJcbiAgICAvLyBDaGVjayBmb3IgaW52YWxpZCBtb250aCBhbmQgZGF0ZSAoZXhjZXB0IHVwcGVyIGJvdW5kIG9uIGRhdGUgd2hpY2ggd2UgaGF2ZSB0byBjaGVjayBhZnRlclxyXG4gICAgLy8gY3JlYXRpbmcgdGhlIERhdGUpLlxyXG4gICAgaWYgKG1vbnRoIDwgMCB8fCBtb250aCA+IDExKSB7XHJcbiAgICAgIHRocm93IEVycm9yKGBJbnZhbGlkIG1vbnRoIGluZGV4IFwiJHttb250aH1cIi4gTW9udGggaW5kZXggaGFzIHRvIGJlIGJldHdlZW4gMCBhbmQgMTEuYCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGUgPCAxKSB7XHJcbiAgICAgIHRocm93IEVycm9yKGBJbnZhbGlkIGRhdGUgXCIke2RhdGV9XCIuIERhdGUgaGFzIHRvIGJlIGdyZWF0ZXIgdGhhbiAwLmApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCByZXN1bHQgPSB0aGlzLl9jcmVhdGVEYXRlV2l0aE92ZXJmbG93KHllYXIsIG1vbnRoLCBkYXRlKTtcclxuICAgIC8vIENoZWNrIHRoYXQgdGhlIGRhdGUgd2Fzbid0IGFib3ZlIHRoZSB1cHBlciBib3VuZCBmb3IgdGhlIG1vbnRoLCBjYXVzaW5nIHRoZSBtb250aCB0byBvdmVyZmxvd1xyXG4gICAgaWYgKHJlc3VsdC5nZXRNb250aCgpICE9IG1vbnRoKSB7XHJcbiAgICAgIHRocm93IEVycm9yKGBJbnZhbGlkIGRhdGUgXCIke2RhdGV9XCIgZm9yIG1vbnRoIHdpdGggaW5kZXggXCIke21vbnRofVwiLmApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICB0b2RheSgpOiBEYXRlIHtcclxuICAgIHJldHVybiBuZXcgRGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgcGFyc2UodmFsdWU6IGFueSk6IERhdGUgfCBudWxsIHtcclxuICAgIC8vIFdlIGhhdmUgbm8gd2F5IHVzaW5nIHRoZSBuYXRpdmUgSlMgRGF0ZSB0byBzZXQgdGhlIHBhcnNlIGZvcm1hdCBvciBsb2NhbGUsIHNvIHdlIGlnbm9yZSB0aGVzZVxyXG4gICAgLy8gcGFyYW1ldGVycy5cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcclxuICAgICAgcmV0dXJuIG5ldyBEYXRlKHZhbHVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZSA/IG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWUpKSA6IG51bGw7XHJcbiAgfVxyXG5cclxuICBmb3JtYXQoZGF0ZTogRGF0ZSwgZGlzcGxheUZvcm1hdDogT2JqZWN0KTogc3RyaW5nIHtcclxuICAgIGlmICghdGhpcy5pc1ZhbGlkKGRhdGUpKSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdOYXRpdmVEYXRlQWRhcHRlcjogQ2Fubm90IGZvcm1hdCBpbnZhbGlkIGRhdGUuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFNVUFBPUlRTX0lOVExfQVBJKSB7XHJcbiAgICAgIC8vIE9uIElFIGFuZCBFZGdlIHRoZSBpMThuIEFQSSB3aWxsIHRocm93IGEgaGFyZCBlcnJvciB0aGF0IGNhbiBjcmFzaCB0aGUgZW50aXJlIGFwcFxyXG4gICAgICAvLyBpZiB3ZSBhdHRlbXB0IHRvIGZvcm1hdCBhIGRhdGUgd2hvc2UgeWVhciBpcyBsZXNzIHRoYW4gMSBvciBncmVhdGVyIHRoYW4gOTk5OS5cclxuICAgICAgaWYgKHRoaXMuX2NsYW1wRGF0ZSAmJiAoZGF0ZS5nZXRGdWxsWWVhcigpIDwgMSB8fCBkYXRlLmdldEZ1bGxZZWFyKCkgPiA5OTk5KSkge1xyXG4gICAgICAgIGRhdGUgPSB0aGlzLmNsb25lKGRhdGUpO1xyXG4gICAgICAgIGRhdGUuc2V0RnVsbFllYXIoTWF0aC5tYXgoMSwgTWF0aC5taW4oOTk5OSwgZGF0ZS5nZXRGdWxsWWVhcigpKSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkaXNwbGF5Rm9ybWF0ID0geyAuLi5kaXNwbGF5Rm9ybWF0LCB0aW1lWm9uZTogJ3V0YycgfTtcclxuXHJcbiAgICAgIGNvbnN0IGR0ZiA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KHRoaXMubG9jYWxlLCBkaXNwbGF5Rm9ybWF0KTtcclxuICAgICAgcmV0dXJuIHRoaXMuX3N0cmlwRGlyZWN0aW9uYWxpdHlDaGFyYWN0ZXJzKHRoaXMuX2Zvcm1hdChkdGYsIGRhdGUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9zdHJpcERpcmVjdGlvbmFsaXR5Q2hhcmFjdGVycyhkYXRlLnRvRGF0ZVN0cmluZygpKTtcclxuICB9XHJcblxyXG4gIGFkZENhbGVuZGFyWWVhcnMoZGF0ZTogRGF0ZSwgeWVhcnM6IG51bWJlcik6IERhdGUge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkQ2FsZW5kYXJNb250aHMoZGF0ZSwgeWVhcnMgKiAxMik7XHJcbiAgfVxyXG5cclxuICBhZGRDYWxlbmRhck1vbnRocyhkYXRlOiBEYXRlLCBtb250aHM6IG51bWJlcik6IERhdGUge1xyXG4gICAgbGV0IG5ld0RhdGUgPSB0aGlzLl9jcmVhdGVEYXRlV2l0aE92ZXJmbG93KFxyXG4gICAgICB0aGlzLmdldFllYXIoZGF0ZSksIHRoaXMuZ2V0TW9udGgoZGF0ZSkgKyBtb250aHMsIHRoaXMuZ2V0RGF0ZShkYXRlKSk7XHJcblxyXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0byB3aW5kIHVwIGluIHRoZSB3cm9uZyBtb250aCBpZiB0aGUgb3JpZ2luYWwgbW9udGggaGFzIG1vcmUgZGF5cyB0aGFuIHRoZSBuZXdcclxuICAgIC8vIG1vbnRoLiBJbiB0aGlzIGNhc2Ugd2Ugd2FudCB0byBnbyB0byB0aGUgbGFzdCBkYXkgb2YgdGhlIGRlc2lyZWQgbW9udGguXHJcbiAgICAvLyBOb3RlOiB0aGUgYWRkaXRpb25hbCArIDEyICUgMTIgZW5zdXJlcyB3ZSBlbmQgdXAgd2l0aCBhIHBvc2l0aXZlIG51bWJlciwgc2luY2UgSlMgJSBkb2Vzbid0XHJcbiAgICAvLyBndWFyYW50ZWUgdGhpcy5cclxuICAgIGlmICh0aGlzLmdldE1vbnRoKG5ld0RhdGUpICE9ICgodGhpcy5nZXRNb250aChkYXRlKSArIG1vbnRocykgJSAxMiArIDEyKSAlIDEyKSB7XHJcbiAgICAgIG5ld0RhdGUgPSB0aGlzLl9jcmVhdGVEYXRlV2l0aE92ZXJmbG93KHRoaXMuZ2V0WWVhcihuZXdEYXRlKSwgdGhpcy5nZXRNb250aChuZXdEYXRlKSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ld0RhdGU7XHJcbiAgfVxyXG5cclxuICBhZGRDYWxlbmRhckRheXMoZGF0ZTogRGF0ZSwgZGF5czogbnVtYmVyKTogRGF0ZSB7XHJcbiAgICByZXR1cm4gdGhpcy5fY3JlYXRlRGF0ZVdpdGhPdmVyZmxvdyhcclxuICAgICAgdGhpcy5nZXRZZWFyKGRhdGUpLCB0aGlzLmdldE1vbnRoKGRhdGUpLCB0aGlzLmdldERhdGUoZGF0ZSkgKyBkYXlzKTtcclxuICB9XHJcblxyXG4gIHRvSXNvODYwMShkYXRlOiBEYXRlKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgIGRhdGUuZ2V0VVRDRnVsbFllYXIoKSxcclxuICAgICAgdGhpcy5fMmRpZ2l0KGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLFxyXG4gICAgICB0aGlzLl8yZGlnaXQoZGF0ZS5nZXRVVENEYXRlKCkpXHJcbiAgICBdLmpvaW4oJy0nKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGdpdmVuIHZhbHVlIGlmIGdpdmVuIGEgdmFsaWQgRGF0ZSBvciBudWxsLiBEZXNlcmlhbGl6ZXMgdmFsaWQgSVNPIDg2MDEgc3RyaW5nc1xyXG4gICAqIChodHRwczovL3d3dy5pZXRmLm9yZy9yZmMvcmZjMzMzOS50eHQpIGludG8gdmFsaWQgRGF0ZXMgYW5kIGVtcHR5IHN0cmluZyBpbnRvIG51bGwuIFJldHVybnMgYW5cclxuICAgKiBpbnZhbGlkIGRhdGUgZm9yIGFsbCBvdGhlciB2YWx1ZXMuXHJcbiAgICovXHJcbiAgZGVzZXJpYWxpemUodmFsdWU6IGFueSk6IERhdGUgfCBudWxsIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICAvLyBUaGUgYERhdGVgIGNvbnN0cnVjdG9yIGFjY2VwdHMgZm9ybWF0cyBvdGhlciB0aGFuIElTTyA4NjAxLCBzbyB3ZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGVcclxuICAgICAgLy8gc3RyaW5nIGlzIHRoZSByaWdodCBmb3JtYXQgZmlyc3QuXHJcbiAgICAgIGlmIChJU09fODYwMV9SRUdFWC50ZXN0KHZhbHVlKSkge1xyXG4gICAgICAgIGxldCBkYXRlID0gbmV3IERhdGUodmFsdWUpO1xyXG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoZGF0ZSkpIHtcclxuICAgICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN1cGVyLmRlc2VyaWFsaXplKHZhbHVlKTtcclxuICB9XHJcblxyXG4gIGlzRGF0ZUluc3RhbmNlKG9iajogYW55KSB7XHJcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRGF0ZTtcclxuICB9XHJcblxyXG4gIGlzVmFsaWQoZGF0ZTogRGF0ZSkge1xyXG4gICAgcmV0dXJuICFpc05hTihkYXRlLmdldFRpbWUoKSk7XHJcbiAgfVxyXG5cclxuICBpbnZhbGlkKCk6IERhdGUge1xyXG4gICAgcmV0dXJuIG5ldyBEYXRlKE5hTik7XHJcbiAgfVxyXG5cclxuICBnZXRIb3VyKGRhdGU6IERhdGUpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIGRhdGUuZ2V0SG91cnMoKTtcclxuICB9XHJcbiAgZ2V0TWludXRlKGRhdGU6IERhdGUpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIGRhdGUuZ2V0TWludXRlcygpO1xyXG4gIH1cclxuICBnZXRTZWNvbmQoZGF0ZTogRGF0ZSk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRTZWNvbmRzKClcclxuICB9XHJcblxyXG4gIHNldEhvdXIoZGF0ZTogRGF0ZSwgdmFsdWU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgZGF0ZS5zZXRIb3Vycyh2YWx1ZSk7XHJcbiAgfVxyXG4gIHNldE1pbnV0ZShkYXRlOiBEYXRlLCB2YWx1ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBkYXRlLnNldE1pbnV0ZXModmFsdWUpO1xyXG4gIH1cclxuICBzZXRTZWNvbmQoZGF0ZTogRGF0ZSwgdmFsdWU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgZGF0ZS5zZXRTZWNvbmRzKHZhbHVlKTtcclxuICB9XHJcblxyXG4gIC8qKiBDcmVhdGVzIGEgZGF0ZSBidXQgYWxsb3dzIHRoZSBtb250aCBhbmQgZGF0ZSB0byBvdmVyZmxvdy4gKi9cclxuICBwcml2YXRlIF9jcmVhdGVEYXRlV2l0aE92ZXJmbG93KHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF0ZTogbnVtYmVyKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF0ZSk7XHJcblxyXG4gICAgLy8gV2UgbmVlZCB0byBjb3JyZWN0IGZvciB0aGUgZmFjdCB0aGF0IEpTIG5hdGl2ZSBEYXRlIHRyZWF0cyB5ZWFycyBpbiByYW5nZSBbMCwgOTldIGFzXHJcbiAgICAvLyBhYmJyZXZpYXRpb25zIGZvciAxOXh4LlxyXG4gICAgaWYgKHllYXIgPj0gMCAmJiB5ZWFyIDwgMTAwKSB7XHJcbiAgICAgIHJlc3VsdC5zZXRGdWxsWWVhcih0aGlzLmdldFllYXIocmVzdWx0KSAtIDE5MDApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhZHMgYSBudW1iZXIgdG8gbWFrZSBpdCB0d28gZGlnaXRzLlxyXG4gICAqIEBwYXJhbSBuIFRoZSBudW1iZXIgdG8gcGFkLlxyXG4gICAqIEByZXR1cm5zIFRoZSBwYWRkZWQgbnVtYmVyLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgXzJkaWdpdChuOiBudW1iZXIpIHtcclxuICAgIHJldHVybiAoJzAwJyArIG4pLnNsaWNlKC0yKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN0cmlwIG91dCB1bmljb2RlIExUUiBhbmQgUlRMIGNoYXJhY3RlcnMuIEVkZ2UgYW5kIElFIGluc2VydCB0aGVzZSBpbnRvIGZvcm1hdHRlZCBkYXRlcyB3aGlsZVxyXG4gICAqIG90aGVyIGJyb3dzZXJzIGRvIG5vdC4gV2UgcmVtb3ZlIHRoZW0gdG8gbWFrZSBvdXRwdXQgY29uc2lzdGVudCBhbmQgYmVjYXVzZSB0aGV5IGludGVyZmVyZSB3aXRoXHJcbiAgICogZGF0ZSBwYXJzaW5nLlxyXG4gICAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyB0byBzdHJpcCBkaXJlY3Rpb24gY2hhcmFjdGVycyBmcm9tLlxyXG4gICAqIEByZXR1cm5zIFRoZSBzdHJpcHBlZCBzdHJpbmcuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfc3RyaXBEaXJlY3Rpb25hbGl0eUNoYXJhY3RlcnMoc3RyOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvW1xcdTIwMGVcXHUyMDBmXS9nLCAnJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXaGVuIGNvbnZlcnRpbmcgRGF0ZSBvYmplY3QgdG8gc3RyaW5nLCBqYXZhc2NyaXB0IGJ1aWx0LWluIGZ1bmN0aW9ucyBtYXkgcmV0dXJuIHdyb25nXHJcbiAgICogcmVzdWx0cyBiZWNhdXNlIGl0IGFwcGxpZXMgaXRzIGludGVybmFsIERTVCBydWxlcy4gVGhlIERTVCBydWxlcyBhcm91bmQgdGhlIHdvcmxkIGNoYW5nZVxyXG4gICAqIHZlcnkgZnJlcXVlbnRseSwgYW5kIHRoZSBjdXJyZW50IHZhbGlkIHJ1bGUgaXMgbm90IGFsd2F5cyB2YWxpZCBpbiBwcmV2aW91cyB5ZWFycyB0aG91Z2guXHJcbiAgICogV2Ugd29yayBhcm91bmQgdGhpcyBwcm9ibGVtIGJ1aWxkaW5nIGEgbmV3IERhdGUgb2JqZWN0IHdoaWNoIGhhcyBpdHMgaW50ZXJuYWwgVVRDXHJcbiAgICogcmVwcmVzZW50YXRpb24gd2l0aCB0aGUgbG9jYWwgZGF0ZSBhbmQgdGltZS5cclxuICAgKiBAcGFyYW0gZHRmIEludGwuRGF0ZVRpbWVGb3JtYXQgb2JqZWN0LCBjb250YWluZyB0aGUgZGVzaXJlZCBzdHJpbmcgZm9ybWF0LiBJdCBtdXN0IGhhdmVcclxuICAgKiAgICB0aW1lWm9uZSBzZXQgdG8gJ3V0YycgdG8gd29yayBmaW5lLlxyXG4gICAqIEBwYXJhbSBkYXRlIERhdGUgZnJvbSB3aGljaCB3ZSB3YW50IHRvIGdldCB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGFjY29yZGluZyB0byBkdGZcclxuICAgKiBAcmV0dXJucyBBIERhdGUgb2JqZWN0IHdpdGggaXRzIFVUQyByZXByZXNlbnRhdGlvbiBiYXNlZCBvbiB0aGUgcGFzc2VkIGluIGRhdGUgaW5mb1xyXG4gICAqL1xyXG4gIHByaXZhdGUgX2Zvcm1hdChkdGY6IEludGwuRGF0ZVRpbWVGb3JtYXQsIGRhdGU6IERhdGUpIHtcclxuICAgIC8vIFBhc3NpbmcgdGhlIHllYXIgdG8gdGhlIGNvbnN0cnVjdG9yIGNhdXNlcyB5ZWFyIG51bWJlcnMgPDEwMCB0byBiZSBjb252ZXJ0ZWQgdG8gMTl4eC5cclxuICAgIC8vIFRvIHdvcmsgYXJvdW5kIHRoaXMgd2UgdXNlIGBzZXRVVENGdWxsWWVhcmAgYW5kIGBzZXRVVENIb3Vyc2AgaW5zdGVhZC5cclxuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgZC5zZXRVVENGdWxsWWVhcihkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCkpO1xyXG4gICAgZC5zZXRVVENIb3VycyhkYXRlLmdldEhvdXJzKCksIGRhdGUuZ2V0TWludXRlcygpLCBkYXRlLmdldFNlY29uZHMoKSwgZGF0ZS5nZXRNaWxsaXNlY29uZHMoKSk7XHJcbiAgICByZXR1cm4gZHRmLmZvcm1hdChkKTtcclxuICB9XHJcbn1cclxuIl19