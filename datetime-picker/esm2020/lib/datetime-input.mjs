/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOWN_ARROW } from '@angular/cdk/keycodes';
import { Directive, EventEmitter, forwardRef, Inject, Input, Optional, Output } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { MAT_INPUT_VALUE_ACCESSOR } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { NGX_MAT_DATE_FORMATS } from './core/date-formats';
import { createMissingDateImplError } from './utils/date-utils';
import * as i0 from "@angular/core";
import * as i1 from "./core/date-adapter";
import * as i2 from "@angular/material/form-field";
/** @docs-private */
export const MAT_DATEPICKER_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NgxMatDatetimeInput),
    multi: true
};
/** @docs-private */
export const MAT_DATEPICKER_VALIDATORS = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => NgxMatDatetimeInput),
    multi: true
};
/**
 * An event used for datepicker input and change events. We don't always have access to a native
 * input or change event because the event may have been triggered by the user clicking on the
 * calendar popup. For consistency, we always use MatDatetimePickerInputEvent instead.
 */
export class MatDatetimePickerInputEvent {
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
export class NgxMatDatetimeInput {
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
        // Close datetime picker if opened
        if (this._datepicker?.opened) {
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
/** @nocollapse */ /** @nocollapse */ NgxMatDatetimeInput.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatDatetimeInput, deps: [{ token: i0.ElementRef }, { token: i1.NgxMatDateAdapter, optional: true }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i2.MatFormField, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
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
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.NgxMatDateAdapter, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [NGX_MAT_DATE_FORMATS]
                }] }, { type: i2.MatFormField, decorators: [{
                    type: Optional
                }] }]; }, propDecorators: { ngxMatDatetimePicker: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZXRpbWUtaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9wcm9qZWN0cy9kYXRldGltZS1waWNrZXIvc3JjL2xpYi9kYXRldGltZS1pbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDbkQsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM1SCxPQUFPLEVBQXlDLGFBQWEsRUFBRSxpQkFBaUIsRUFBNEMsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFHL0osT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDbkUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUVwQyxPQUFPLEVBQXFCLG9CQUFvQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFOUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7Ozs7QUFFaEUsb0JBQW9CO0FBQ3BCLE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUFRO0lBQzlDLE9BQU8sRUFBRSxpQkFBaUI7SUFDMUIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztJQUNsRCxLQUFLLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFFRixvQkFBb0I7QUFDcEIsTUFBTSxDQUFDLE1BQU0seUJBQXlCLEdBQVE7SUFDMUMsT0FBTyxFQUFFLGFBQWE7SUFDdEIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztJQUNsRCxLQUFLLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFHRjs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLDJCQUEyQjtJQUlw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QUs7Z0JBU0YsS0FBSztzQkFEUixLQUFLO2dCQWtCRixHQUFHO3NCQUROLEtBQUs7Z0JBVUYsR0FBRztzQkFETixLQUFLO2dCQVVGLFFBQVE7c0JBRFgsS0FBSztnQkFzQmEsVUFBVTtzQkFBNUIsTUFBTTtnQkFJWSxTQUFTO3NCQUEzQixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBsaWNlbnNlXHJcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXHJcbiAqXHJcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXHJcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcclxuICovXHJcblxyXG5pbXBvcnQgeyBET1dOX0FSUk9XIH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcclxuaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIGZvcndhcmRSZWYsIEluamVjdCwgSW5wdXQsIE9uRGVzdHJveSwgT3B0aW9uYWwsIE91dHB1dCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBBYnN0cmFjdENvbnRyb2wsIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBOR19WQUxJREFUT1JTLCBOR19WQUxVRV9BQ0NFU1NPUiwgVmFsaWRhdGlvbkVycm9ycywgVmFsaWRhdG9yLCBWYWxpZGF0b3JGbiwgVmFsaWRhdG9ycyB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuaW1wb3J0IHsgVGhlbWVQYWxldHRlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvY29yZSc7XHJcbmltcG9ydCB7IE1hdEZvcm1GaWVsZCB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2Zvcm0tZmllbGQnO1xyXG5pbXBvcnQgeyBNQVRfSU5QVVRfVkFMVUVfQUNDRVNTT1IgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9pbnB1dCc7XHJcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBOZ3hNYXREYXRlQWRhcHRlciB9IGZyb20gJy4vY29yZS9kYXRlLWFkYXB0ZXInO1xyXG5pbXBvcnQgeyBOZ3hNYXREYXRlRm9ybWF0cywgTkdYX01BVF9EQVRFX0ZPUk1BVFMgfSBmcm9tICcuL2NvcmUvZGF0ZS1mb3JtYXRzJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZXRpbWVQaWNrZXIgfSBmcm9tICcuL2RhdGV0aW1lLXBpY2tlci5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvciB9IGZyb20gJy4vdXRpbHMvZGF0ZS11dGlscyc7XHJcblxyXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xyXG5leHBvcnQgY29uc3QgTUFUX0RBVEVQSUNLRVJfVkFMVUVfQUNDRVNTT1I6IGFueSA9IHtcclxuICAgIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxyXG4gICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gTmd4TWF0RGF0ZXRpbWVJbnB1dCksXHJcbiAgICBtdWx0aTogdHJ1ZVxyXG59O1xyXG5cclxuLyoqIEBkb2NzLXByaXZhdGUgKi9cclxuZXhwb3J0IGNvbnN0IE1BVF9EQVRFUElDS0VSX1ZBTElEQVRPUlM6IGFueSA9IHtcclxuICAgIHByb3ZpZGU6IE5HX1ZBTElEQVRPUlMsXHJcbiAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBOZ3hNYXREYXRldGltZUlucHV0KSxcclxuICAgIG11bHRpOiB0cnVlXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEFuIGV2ZW50IHVzZWQgZm9yIGRhdGVwaWNrZXIgaW5wdXQgYW5kIGNoYW5nZSBldmVudHMuIFdlIGRvbid0IGFsd2F5cyBoYXZlIGFjY2VzcyB0byBhIG5hdGl2ZVxyXG4gKiBpbnB1dCBvciBjaGFuZ2UgZXZlbnQgYmVjYXVzZSB0aGUgZXZlbnQgbWF5IGhhdmUgYmVlbiB0cmlnZ2VyZWQgYnkgdGhlIHVzZXIgY2xpY2tpbmcgb24gdGhlXHJcbiAqIGNhbGVuZGFyIHBvcHVwLiBGb3IgY29uc2lzdGVuY3ksIHdlIGFsd2F5cyB1c2UgTWF0RGF0ZXRpbWVQaWNrZXJJbnB1dEV2ZW50IGluc3RlYWQuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgTWF0RGF0ZXRpbWVQaWNrZXJJbnB1dEV2ZW50PEQ+IHtcclxuICAgIC8qKiBUaGUgbmV3IHZhbHVlIGZvciB0aGUgdGFyZ2V0IGRhdGVwaWNrZXIgaW5wdXQuICovXHJcbiAgICB2YWx1ZTogRCB8IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgLyoqIFJlZmVyZW5jZSB0byB0aGUgZGF0ZXBpY2tlciBpbnB1dCBjb21wb25lbnQgdGhhdCBlbWl0dGVkIHRoZSBldmVudC4gKi9cclxuICAgICAgICBwdWJsaWMgdGFyZ2V0OiBOZ3hNYXREYXRldGltZUlucHV0PEQ+LFxyXG4gICAgICAgIC8qKiBSZWZlcmVuY2UgdG8gdGhlIG5hdGl2ZSBpbnB1dCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGF0ZXBpY2tlciBpbnB1dC4gKi9cclxuICAgICAgICBwdWJsaWMgdGFyZ2V0RWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy50YXJnZXQudmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKiogRGlyZWN0aXZlIHVzZWQgdG8gY29ubmVjdCBhbiBpbnB1dCB0byBhIG1hdERhdGV0aW1lUGlja2VyLiAqL1xyXG5ARGlyZWN0aXZlKHtcclxuICAgIHNlbGVjdG9yOiAnaW5wdXRbbmd4TWF0RGF0ZXRpbWVQaWNrZXJdJyxcclxuICAgIHByb3ZpZGVyczogW1xyXG4gICAgICAgIE1BVF9EQVRFUElDS0VSX1ZBTFVFX0FDQ0VTU09SLFxyXG4gICAgICAgIE1BVF9EQVRFUElDS0VSX1ZBTElEQVRPUlMsXHJcbiAgICAgICAgeyBwcm92aWRlOiBNQVRfSU5QVVRfVkFMVUVfQUNDRVNTT1IsIHVzZUV4aXN0aW5nOiBOZ3hNYXREYXRldGltZUlucHV0IH0sXHJcbiAgICBdLFxyXG4gICAgaG9zdDoge1xyXG4gICAgICAgICdbYXR0ci5hcmlhLWhhc3BvcHVwXSc6ICdfZGF0ZXBpY2tlciA/IFwiZGlhbG9nXCIgOiBudWxsJyxcclxuICAgICAgICAnW2F0dHIuYXJpYS1vd25zXSc6ICcoX2RhdGVwaWNrZXI/Lm9wZW5lZCAmJiBfZGF0ZXBpY2tlci5pZCkgfHwgbnVsbCcsXHJcbiAgICAgICAgJ1thdHRyLm1pbl0nOiAnbWluID8gX2RhdGVBZGFwdGVyLnRvSXNvODYwMShtaW4pIDogbnVsbCcsXHJcbiAgICAgICAgJ1thdHRyLm1heF0nOiAnbWF4ID8gX2RhdGVBZGFwdGVyLnRvSXNvODYwMShtYXgpIDogbnVsbCcsXHJcbiAgICAgICAgJ1tkaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxyXG4gICAgICAgICcoaW5wdXQpJzogJ19vbklucHV0KCRldmVudC50YXJnZXQudmFsdWUpJyxcclxuICAgICAgICAnKGNoYW5nZSknOiAnX29uQ2hhbmdlKCknLFxyXG4gICAgICAgICcoYmx1ciknOiAnX29uQmx1cigpJyxcclxuICAgICAgICAnKGZvY3VzKSc6ICdfb25Gb2N1cygpJyxcclxuICAgICAgICAnKGRibGNsaWNrKSc6ICdfb25Gb2N1cygpJyxcclxuICAgICAgICAnKGtleWRvd24pJzogJ19vbktleWRvd24oJGV2ZW50KScsXHJcbiAgICB9LFxyXG4gICAgZXhwb3J0QXM6ICduZ3hNYXREYXRldGltZVBpY2tlcklucHV0JyxcclxufSlcclxuZXhwb3J0IGNsYXNzIE5neE1hdERhdGV0aW1lSW5wdXQ8RD4gaW1wbGVtZW50cyBDb250cm9sVmFsdWVBY2Nlc3NvciwgT25EZXN0cm95LCBWYWxpZGF0b3Ige1xyXG4gICAgLyoqIFRoZSBkYXRlcGlja2VyIHRoYXQgdGhpcyBpbnB1dCBpcyBhc3NvY2lhdGVkIHdpdGguICovXHJcbiAgICBASW5wdXQoKVxyXG4gICAgc2V0IG5neE1hdERhdGV0aW1lUGlja2VyKHZhbHVlOiBOZ3hNYXREYXRldGltZVBpY2tlcjxEPikge1xyXG4gICAgICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fZGF0ZXBpY2tlciA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuX2RhdGVwaWNrZXIuX3JlZ2lzdGVySW5wdXQodGhpcyk7XHJcbiAgICAgICAgdGhpcy5fZGF0ZXBpY2tlclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9kYXRlcGlja2VyU3Vic2NyaXB0aW9uID0gdGhpcy5fZGF0ZXBpY2tlci5fc2VsZWN0ZWRDaGFuZ2VkLnN1YnNjcmliZSgoc2VsZWN0ZWQ6IEQpID0+IHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHNlbGVjdGVkO1xyXG4gICAgICAgICAgICB0aGlzLl9jdmFPbkNoYW5nZShzZWxlY3RlZCk7XHJcbiAgICAgICAgICAgIHRoaXMuX29uVG91Y2hlZCgpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGVJbnB1dC5lbWl0KG5ldyBNYXREYXRldGltZVBpY2tlcklucHV0RXZlbnQodGhpcywgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZUNoYW5nZS5lbWl0KG5ldyBNYXREYXRldGltZVBpY2tlcklucHV0RXZlbnQodGhpcywgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBfZGF0ZXBpY2tlcjogTmd4TWF0RGF0ZXRpbWVQaWNrZXI8RD47XHJcblxyXG4gICAgLyoqIEZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmlsdGVyIG91dCBkYXRlcyB3aXRoaW4gdGhlIGRhdGVwaWNrZXIuICovXHJcbiAgICBASW5wdXQoKVxyXG4gICAgc2V0IG5neE1hdERhdGV0aW1lUGlja2VyRmlsdGVyKHZhbHVlOiAoZGF0ZTogRCB8IG51bGwpID0+IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLl9kYXRlRmlsdGVyID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5fdmFsaWRhdG9yT25DaGFuZ2UoKTtcclxuICAgIH1cclxuICAgIF9kYXRlRmlsdGVyOiAoZGF0ZTogRCB8IG51bGwpID0+IGJvb2xlYW47XHJcblxyXG4gICAgLyoqIFRoZSB2YWx1ZSBvZiB0aGUgaW5wdXQuICovXHJcbiAgICBASW5wdXQoKVxyXG4gICAgZ2V0IHZhbHVlKCk6IEQgfCBudWxsIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XHJcbiAgICBzZXQgdmFsdWUodmFsdWU6IEQgfCBudWxsKSB7XHJcbiAgICAgICAgdmFsdWUgPSB0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSk7XHJcbiAgICAgICAgdGhpcy5fbGFzdFZhbHVlVmFsaWQgPSAhdmFsdWUgfHwgdGhpcy5fZGF0ZUFkYXB0ZXIuaXNWYWxpZCh2YWx1ZSk7XHJcbiAgICAgICAgdmFsdWUgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodmFsdWUpO1xyXG4gICAgICAgIGNvbnN0IG9sZERhdGUgPSB0aGlzLnZhbHVlO1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5fZm9ybWF0VmFsdWUodmFsdWUpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX2RhdGVBZGFwdGVyLnNhbWVEYXRlKG9sZERhdGUsIHZhbHVlKSkge1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZUNoYW5nZS5lbWl0KHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwcml2YXRlIF92YWx1ZTogRCB8IG51bGw7XHJcblxyXG4gICAgLyoqIFRoZSBtaW5pbXVtIHZhbGlkIGRhdGUuICovXHJcbiAgICBASW5wdXQoKVxyXG4gICAgZ2V0IG1pbigpOiBEIHwgbnVsbCB7IHJldHVybiB0aGlzLl9taW47IH1cclxuICAgIHNldCBtaW4odmFsdWU6IEQgfCBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5fbWluID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKHZhbHVlKSk7XHJcbiAgICAgICAgdGhpcy5fdmFsaWRhdG9yT25DaGFuZ2UoKTtcclxuICAgIH1cclxuICAgIHByaXZhdGUgX21pbjogRCB8IG51bGw7XHJcblxyXG4gICAgLyoqIFRoZSBtYXhpbXVtIHZhbGlkIGRhdGUuICovXHJcbiAgICBASW5wdXQoKVxyXG4gICAgZ2V0IG1heCgpOiBEIHwgbnVsbCB7IHJldHVybiB0aGlzLl9tYXg7IH1cclxuICAgIHNldCBtYXgodmFsdWU6IEQgfCBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5fbWF4ID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKHZhbHVlKSk7XHJcbiAgICAgICAgdGhpcy5fdmFsaWRhdG9yT25DaGFuZ2UoKTtcclxuICAgIH1cclxuICAgIHByaXZhdGUgX21heDogRCB8IG51bGw7XHJcblxyXG4gICAgLyoqIFdoZXRoZXIgdGhlIGRhdGVwaWNrZXItaW5wdXQgaXMgZGlzYWJsZWQuICovXHJcbiAgICBASW5wdXQoKVxyXG4gICAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gISF0aGlzLl9kaXNhYmxlZDsgfVxyXG4gICAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgbmV3VmFsdWUgPSB2YWx1ZSAhPSBudWxsICYmIGAke3ZhbHVlfWAgIT09ICdmYWxzZSc7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2Rpc2FibGVkICE9PSBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlQ2hhbmdlcy5lbWl0KHVuZGVmaW5lZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRvIG51bGwgY2hlY2sgdGhlIGBibHVyYCBtZXRob2QsIGJlY2F1c2UgaXQncyB1bmRlZmluZWQgZHVyaW5nIFNTUi5cclxuICAgICAgICBpZiAobmV3VmFsdWUgJiYgZWxlbWVudC5ibHVyKSB7XHJcbiAgICAgICAgICAgIC8vIE5vcm1hbGx5LCBuYXRpdmUgaW5wdXQgZWxlbWVudHMgYXV0b21hdGljYWxseSBibHVyIGlmIHRoZXkgdHVybiBkaXNhYmxlZC4gVGhpcyBiZWhhdmlvclxyXG4gICAgICAgICAgICAvLyBpcyBwcm9ibGVtYXRpYywgYmVjYXVzZSBpdCB3b3VsZCBtZWFuIHRoYXQgaXQgdHJpZ2dlcnMgYW5vdGhlciBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLFxyXG4gICAgICAgICAgICAvLyB3aGljaCB0aGVuIGNhdXNlcyBhIGNoYW5nZWQgYWZ0ZXIgY2hlY2tlZCBlcnJvciBpZiB0aGUgaW5wdXQgZWxlbWVudCB3YXMgZm9jdXNlZCBiZWZvcmUuXHJcbiAgICAgICAgICAgIGVsZW1lbnQuYmx1cigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuO1xyXG5cclxuICAgIC8qKiBFbWl0cyB3aGVuIGEgYGNoYW5nZWAgZXZlbnQgaXMgZmlyZWQgb24gdGhpcyBgPGlucHV0PmAuICovXHJcbiAgICBAT3V0cHV0KCkgcmVhZG9ubHkgZGF0ZUNoYW5nZTogRXZlbnRFbWl0dGVyPE1hdERhdGV0aW1lUGlja2VySW5wdXRFdmVudDxEPj4gPVxyXG4gICAgICAgIG5ldyBFdmVudEVtaXR0ZXI8TWF0RGF0ZXRpbWVQaWNrZXJJbnB1dEV2ZW50PEQ+PigpO1xyXG5cclxuICAgIC8qKiBFbWl0cyB3aGVuIGFuIGBpbnB1dGAgZXZlbnQgaXMgZmlyZWQgb24gdGhpcyBgPGlucHV0PmAuICovXHJcbiAgICBAT3V0cHV0KCkgcmVhZG9ubHkgZGF0ZUlucHV0OiBFdmVudEVtaXR0ZXI8TWF0RGF0ZXRpbWVQaWNrZXJJbnB1dEV2ZW50PEQ+PiA9XHJcbiAgICAgICAgbmV3IEV2ZW50RW1pdHRlcjxNYXREYXRldGltZVBpY2tlcklucHV0RXZlbnQ8RD4+KCk7XHJcblxyXG4gICAgLyoqIEVtaXRzIHdoZW4gdGhlIHZhbHVlIGNoYW5nZXMgKGVpdGhlciBkdWUgdG8gdXNlciBpbnB1dCBvciBwcm9ncmFtbWF0aWMgY2hhbmdlKS4gKi9cclxuICAgIF92YWx1ZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8RCB8IG51bGw+KCk7XHJcblxyXG4gICAgLyoqIEVtaXRzIHdoZW4gdGhlIGRpc2FibGVkIHN0YXRlIGhhcyBjaGFuZ2VkICovXHJcbiAgICBzdGF0ZUNoYW5nZXMgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XHJcblxyXG4gICAgX29uVG91Y2hlZCA9ICgpID0+IHsgfTtcclxuXHJcbiAgICBwcml2YXRlIF9jdmFPbkNoYW5nZTogKHZhbHVlOiBhbnkpID0+IHZvaWQgPSAoKSA9PiB7IH07XHJcblxyXG4gICAgcHJpdmF0ZSBfdmFsaWRhdG9yT25DaGFuZ2UgPSAoKSA9PiB7IH07XHJcblxyXG4gICAgcHJpdmF0ZSBfZGF0ZXBpY2tlclN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcclxuXHJcbiAgICBwcml2YXRlIF9sb2NhbGVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XHJcblxyXG4gICAgLyoqIFRoZSBmb3JtIGNvbnRyb2wgdmFsaWRhdG9yIGZvciB3aGV0aGVyIHRoZSBpbnB1dCBwYXJzZXMuICovXHJcbiAgICBwcml2YXRlIF9wYXJzZVZhbGlkYXRvcjogVmFsaWRhdG9yRm4gPSAoKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9sYXN0VmFsdWVWYWxpZCA/XHJcbiAgICAgICAgICAgIG51bGwgOiB7ICdtYXREYXRldGltZVBpY2tlclBhcnNlJzogeyAndGV4dCc6IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC52YWx1ZSB9IH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFRoZSBmb3JtIGNvbnRyb2wgdmFsaWRhdG9yIGZvciB0aGUgbWluIGRhdGUuICovXHJcbiAgICBwcml2YXRlIF9taW5WYWxpZGF0b3I6IFZhbGlkYXRvckZuID0gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgICBjb25zdCBjb250cm9sVmFsdWUgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUoY29udHJvbC52YWx1ZSkpO1xyXG4gICAgICAgIHJldHVybiAoIXRoaXMubWluIHx8ICFjb250cm9sVmFsdWUgfHxcclxuICAgICAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuY29tcGFyZURhdGVXaXRoVGltZSh0aGlzLm1pbiwgY29udHJvbFZhbHVlLCB0aGlzLl9kYXRlcGlja2VyLnNob3dTZWNvbmRzKSA8PSAwKSA/XHJcbiAgICAgICAgICAgIG51bGwgOiB7ICdtYXREYXRldGltZVBpY2tlck1pbic6IHsgJ21pbic6IHRoaXMubWluLCAnYWN0dWFsJzogY29udHJvbFZhbHVlIH0gfTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogVGhlIGZvcm0gY29udHJvbCB2YWxpZGF0b3IgZm9yIHRoZSBtYXggZGF0ZS4gKi9cclxuICAgIHByaXZhdGUgX21heFZhbGlkYXRvcjogVmFsaWRhdG9yRm4gPSAoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZShjb250cm9sLnZhbHVlKSk7XHJcbiAgICAgICAgcmV0dXJuICghdGhpcy5tYXggfHwgIWNvbnRyb2xWYWx1ZSB8fFxyXG4gICAgICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5jb21wYXJlRGF0ZVdpdGhUaW1lKHRoaXMubWF4LCBjb250cm9sVmFsdWUsIHRoaXMuX2RhdGVwaWNrZXIuc2hvd1NlY29uZHMpID49IDApID9cclxuICAgICAgICAgICAgbnVsbCA6IHsgJ21hdERhdGV0aW1lUGlja2VyTWF4JzogeyAnbWF4JzogdGhpcy5tYXgsICdhY3R1YWwnOiBjb250cm9sVmFsdWUgfSB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBUaGUgZm9ybSBjb250cm9sIHZhbGlkYXRvciBmb3IgdGhlIGRhdGUgZmlsdGVyLiAqL1xyXG4gICAgcHJpdmF0ZSBfZmlsdGVyVmFsaWRhdG9yOiBWYWxpZGF0b3JGbiA9IChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbFZhbHVlID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKGNvbnRyb2wudmFsdWUpKTtcclxuICAgICAgICByZXR1cm4gIXRoaXMuX2RhdGVGaWx0ZXIgfHwgIWNvbnRyb2xWYWx1ZSB8fCB0aGlzLl9kYXRlRmlsdGVyKGNvbnRyb2xWYWx1ZSkgP1xyXG4gICAgICAgICAgICBudWxsIDogeyAnbWF0RGF0ZXRpbWVQaWNrZXJGaWx0ZXInOiB0cnVlIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFRoZSBjb21iaW5lZCBmb3JtIGNvbnRyb2wgdmFsaWRhdG9yIGZvciB0aGlzIGlucHV0LiAqL1xyXG4gICAgcHJpdmF0ZSBfdmFsaWRhdG9yOiBWYWxpZGF0b3JGbiB8IG51bGwgPVxyXG4gICAgICAgIFZhbGlkYXRvcnMuY29tcG9zZShcclxuICAgICAgICAgICAgW3RoaXMuX3BhcnNlVmFsaWRhdG9yLCB0aGlzLl9taW5WYWxpZGF0b3IsIHRoaXMuX21heFZhbGlkYXRvciwgdGhpcy5fZmlsdGVyVmFsaWRhdG9yXSk7XHJcblxyXG4gICAgLyoqIFdoZXRoZXIgdGhlIGxhc3QgdmFsdWUgc2V0IG9uIHRoZSBpbnB1dCB3YXMgdmFsaWQuICovXHJcbiAgICBwcml2YXRlIF9sYXN0VmFsdWVWYWxpZCA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTElucHV0RWxlbWVudD4sXHJcbiAgICAgICAgQE9wdGlvbmFsKCkgcHVibGljIF9kYXRlQWRhcHRlcjogTmd4TWF0RGF0ZUFkYXB0ZXI8RD4sXHJcbiAgICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChOR1hfTUFUX0RBVEVfRk9STUFUUykgcHJpdmF0ZSBfZGF0ZUZvcm1hdHM6IE5neE1hdERhdGVGb3JtYXRzLFxyXG4gICAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2Zvcm1GaWVsZDogTWF0Rm9ybUZpZWxkKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9kYXRlQWRhcHRlcikge1xyXG4gICAgICAgICAgICB0aHJvdyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvcignTmd4TWF0RGF0ZUFkYXB0ZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLl9kYXRlRm9ybWF0cykge1xyXG4gICAgICAgICAgICB0aHJvdyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvcignTkdYX01BVF9EQVRFX0ZPUk1BVFMnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheWVkIGRhdGUgd2hlbiB0aGUgbG9jYWxlIGNoYW5nZXMuXHJcbiAgICAgICAgdGhpcy5fbG9jYWxlU3Vic2NyaXB0aW9uID0gX2RhdGVBZGFwdGVyLmxvY2FsZUNoYW5nZXMuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbmdPbkRlc3Ryb3koKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0ZXBpY2tlclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gICAgICAgIHRoaXMuX2xvY2FsZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlQ2hhbmdlLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgdGhpcy5zdGF0ZUNoYW5nZXMuY29tcGxldGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xyXG4gICAgcmVnaXN0ZXJPblZhbGlkYXRvckNoYW5nZShmbjogKCkgPT4gdm9pZCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuX3ZhbGlkYXRvck9uQ2hhbmdlID0gZm47XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEBkb2NzLXByaXZhdGUgKi9cclxuICAgIHZhbGlkYXRlKGM6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdmFsaWRhdG9yID8gdGhpcy5fdmFsaWRhdG9yKGMpIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBkZXByZWNhdGVkXHJcbiAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wIFVzZSBgZ2V0Q29ubmVjdGVkT3ZlcmxheU9yaWdpbmAgaW5zdGVhZFxyXG4gICAgICovXHJcbiAgICBnZXRQb3B1cENvbm5lY3Rpb25FbGVtZW50UmVmKCk6IEVsZW1lbnRSZWYge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbm5lY3RlZE92ZXJsYXlPcmlnaW4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldHMgdGhlIGVsZW1lbnQgdGhhdCB0aGUgZGF0ZXBpY2tlciBwb3B1cCBzaG91bGQgYmUgY29ubmVjdGVkIHRvLlxyXG4gICAgICogQHJldHVybiBUaGUgZWxlbWVudCB0byBjb25uZWN0IHRoZSBwb3B1cCB0by5cclxuICAgICAqL1xyXG4gICAgZ2V0Q29ubmVjdGVkT3ZlcmxheU9yaWdpbigpOiBFbGVtZW50UmVmIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZm9ybUZpZWxkID8gdGhpcy5fZm9ybUZpZWxkLmdldENvbm5lY3RlZE92ZXJsYXlPcmlnaW4oKSA6IHRoaXMuX2VsZW1lbnRSZWY7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cclxuICAgIHdyaXRlVmFsdWUodmFsdWU6IEQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cclxuICAgIHJlZ2lzdGVyT25DaGFuZ2UoZm46ICh2YWx1ZTogYW55KSA9PiB2b2lkKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fY3ZhT25DaGFuZ2UgPSBmbjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIENvbnRyb2xWYWx1ZUFjY2Vzc29yLlxyXG4gICAgcmVnaXN0ZXJPblRvdWNoZWQoZm46ICgpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl9vblRvdWNoZWQgPSBmbjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIENvbnRyb2xWYWx1ZUFjY2Vzc29yLlxyXG4gICAgc2V0RGlzYWJsZWRTdGF0ZShpc0Rpc2FibGVkOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgX29uS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCkge1xyXG4gICAgICAgIGNvbnN0IGlzQWx0RG93bkFycm93ID0gZXZlbnQuYWx0S2V5ICYmIGV2ZW50LmtleUNvZGUgPT09IERPV05fQVJST1c7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9kYXRlcGlja2VyICYmIGlzQWx0RG93bkFycm93ICYmICF0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucmVhZE9ubHkpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGF0ZXBpY2tlci5vcGVuKCk7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9vbklucHV0KHZhbHVlOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBsYXN0VmFsdWVXYXNWYWxpZCA9IHRoaXMuX2xhc3RWYWx1ZVZhbGlkO1xyXG4gICAgICAgIGxldCBkYXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIucGFyc2UodmFsdWUsIHRoaXMuX2RhdGVGb3JtYXRzLnBhcnNlLmRhdGVJbnB1dCk7XHJcbiAgICAgICAgdGhpcy5fbGFzdFZhbHVlVmFsaWQgPSAhZGF0ZSB8fCB0aGlzLl9kYXRlQWRhcHRlci5pc1ZhbGlkKGRhdGUpO1xyXG4gICAgICAgIGRhdGUgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwoZGF0ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGlzU2FtZVRpbWUgPSB0aGlzLl9kYXRlQWRhcHRlci5pc1NhbWVUaW1lKGRhdGUsIHRoaXMuX3ZhbHVlKTtcclxuXHJcbiAgICAgICAgaWYgKChkYXRlICE9IG51bGwgJiYgKCFpc1NhbWVUaW1lIHx8ICF0aGlzLl9kYXRlQWRhcHRlci5zYW1lRGF0ZShkYXRlLCB0aGlzLl92YWx1ZSkpKVxyXG4gICAgICAgICAgICB8fCAoZGF0ZSA9PSBudWxsICYmIHRoaXMuX3ZhbHVlICE9IG51bGwpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gZGF0ZTtcclxuICAgICAgICAgICAgdGhpcy5fY3ZhT25DaGFuZ2UoZGF0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlQ2hhbmdlLmVtaXQoZGF0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZUlucHV0LmVtaXQobmV3IE1hdERhdGV0aW1lUGlja2VySW5wdXRFdmVudCh0aGlzLCB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxhc3RWYWx1ZVdhc1ZhbGlkICE9PSB0aGlzLl9sYXN0VmFsdWVWYWxpZCkge1xyXG4gICAgICAgICAgICB0aGlzLl92YWxpZGF0b3JPbkNoYW5nZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfb25DaGFuZ2UoKSB7XHJcbiAgICAgICAgdGhpcy5kYXRlQ2hhbmdlLmVtaXQobmV3IE1hdERhdGV0aW1lUGlja2VySW5wdXRFdmVudCh0aGlzLCB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogUmV0dXJucyB0aGUgcGFsZXR0ZSB1c2VkIGJ5IHRoZSBpbnB1dCdzIGZvcm0gZmllbGQsIGlmIGFueS4gKi9cclxuICAgIF9nZXRUaGVtZVBhbGV0dGUoKTogVGhlbWVQYWxldHRlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZm9ybUZpZWxkID8gdGhpcy5fZm9ybUZpZWxkLmNvbG9yIDogdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBIYW5kbGVzIGJsdXIgZXZlbnRzIG9uIHRoZSBpbnB1dC4gKi9cclxuICAgIF9vbkJsdXIoKSB7XHJcbiAgICAgICAgLy8gUmVmb3JtYXQgdGhlIGlucHV0IG9ubHkgaWYgd2UgaGF2ZSBhIHZhbGlkIHZhbHVlLlxyXG4gICAgICAgIGlmICh0aGlzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1hdFZhbHVlKHRoaXMudmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fb25Ub3VjaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEhhbmRsZXMgZm9jdXMgZXZlbnRzIG9uIHRoZSBpbnB1dC4gKi9cclxuICAgIF9vbkZvY3VzKCkge1xyXG4gICAgICAgIC8vIENsb3NlIGRhdGV0aW1lIHBpY2tlciBpZiBvcGVuZWRcclxuICAgICAgICBpZiAodGhpcy5fZGF0ZXBpY2tlcj8ub3BlbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGVwaWNrZXIuY2FuY2VsKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9kYXRlcGlja2VyICYmICF0aGlzLl9kYXRlcGlja2VyLm9wZW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZUNoYW5nZS5lbWl0KHRoaXMuX3ZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5fZGF0ZXBpY2tlci5vcGVuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiBGb3JtYXRzIGEgdmFsdWUgYW5kIHNldHMgaXQgb24gdGhlIGlucHV0IGVsZW1lbnQuICovXHJcbiAgICBwcml2YXRlIF9mb3JtYXRWYWx1ZSh2YWx1ZTogRCB8IG51bGwpIHtcclxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudmFsdWUgPVxyXG4gICAgICAgICAgICB2YWx1ZSA/IHRoaXMuX2RhdGVBZGFwdGVyLmZvcm1hdCh2YWx1ZSwgdGhpcy5fZGF0ZUZvcm1hdHMuZGlzcGxheS5kYXRlSW5wdXQpIDogJyc7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gb2JqIFRoZSBvYmplY3QgdG8gY2hlY2suXHJcbiAgICAgKiBAcmV0dXJucyBUaGUgZ2l2ZW4gb2JqZWN0IGlmIGl0IGlzIGJvdGggYSBkYXRlIGluc3RhbmNlIGFuZCB2YWxpZCwgb3RoZXJ3aXNlIG51bGwuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgX2dldFZhbGlkRGF0ZU9yTnVsbChvYmo6IGFueSk6IEQgfCBudWxsIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuX2RhdGVBZGFwdGVyLmlzRGF0ZUluc3RhbmNlKG9iaikgJiYgdGhpcy5fZGF0ZUFkYXB0ZXIuaXNWYWxpZChvYmopKSA/IG9iaiA6IG51bGw7XHJcbiAgICB9XHJcblxyXG59XHJcbiJdfQ==