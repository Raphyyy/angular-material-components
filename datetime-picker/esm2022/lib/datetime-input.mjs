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
    target;
    targetElement;
    /** The new value for the target datepicker input. */
    value;
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
    _elementRef;
    _dateAdapter;
    _dateFormats;
    _formField;
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
    _datepicker;
    /** Function that can be used to filter out dates within the datepicker. */
    set ngxMatDatetimePickerFilter(value) {
        this._dateFilter = value;
        this._validatorOnChange();
    }
    _dateFilter;
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
    _value;
    /** The minimum valid date. */
    get min() { return this._min; }
    set min(value) {
        this._min = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
        this._validatorOnChange();
    }
    _min;
    /** The maximum valid date. */
    get max() { return this._max; }
    set max(value) {
        this._max = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
        this._validatorOnChange();
    }
    _max;
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
    _disabled;
    /** Emits when a `change` event is fired on this `<input>`. */
    dateChange = new EventEmitter();
    /** Emits when an `input` event is fired on this `<input>`. */
    dateInput = new EventEmitter();
    /** Emits when the value changes (either due to user input or programmatic change). */
    _valueChange = new EventEmitter();
    /** Emits when the disabled state has changed */
    stateChanges = new EventEmitter();
    _onTouched = () => { };
    _cvaOnChange = () => { };
    _validatorOnChange = () => { };
    _datepickerSubscription = Subscription.EMPTY;
    _localeSubscription = Subscription.EMPTY;
    /** The form control validator for whether the input parses. */
    _parseValidator = () => {
        return this._lastValueValid ?
            null : { 'matDatetimePickerParse': { 'text': this._elementRef.nativeElement.value } };
    };
    /** The form control validator for the min date. */
    _minValidator = (control) => {
        const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
        return (!this.min || !controlValue ||
            this._dateAdapter.compareDateWithTime(this.min, controlValue, this._datepicker.showSeconds) <= 0) ?
            null : { 'matDatetimePickerMin': { 'min': this.min, 'actual': controlValue } };
    };
    /** The form control validator for the max date. */
    _maxValidator = (control) => {
        const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
        return (!this.max || !controlValue ||
            this._dateAdapter.compareDateWithTime(this.max, controlValue, this._datepicker.showSeconds) >= 0) ?
            null : { 'matDatetimePickerMax': { 'max': this.max, 'actual': controlValue } };
    };
    /** The form control validator for the date filter. */
    _filterValidator = (control) => {
        const controlValue = this._getValidDateOrNull(this._dateAdapter.deserialize(control.value));
        return !this._dateFilter || !controlValue || this._dateFilter(controlValue) ?
            null : { 'matDatetimePickerFilter': true };
    };
    /** The combined form control validator for this input. */
    _validator = Validators.compose([this._parseValidator, this._minValidator, this._maxValidator, this._filterValidator]);
    /** Whether the last value set on the input was valid. */
    _lastValueValid = false;
    constructor(_elementRef, _dateAdapter, _dateFormats, _formField) {
        this._elementRef = _elementRef;
        this._dateAdapter = _dateAdapter;
        this._dateFormats = _dateFormats;
        this._formField = _formField;
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
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimeInput, deps: [{ token: i0.ElementRef }, { token: i1.NgxMatDateAdapter, optional: true }, { token: NGX_MAT_DATE_FORMATS, optional: true }, { token: i2.MatFormField, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
    /** @nocollapse */ static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "18.2.11", type: NgxMatDatetimeInput, selector: "input[ngxMatDatetimePicker]", inputs: { ngxMatDatetimePicker: "ngxMatDatetimePicker", ngxMatDatetimePickerFilter: "ngxMatDatetimePickerFilter", value: "value", min: "min", max: "max", disabled: "disabled" }, outputs: { dateChange: "dateChange", dateInput: "dateInput" }, host: { listeners: { "input": "_onInput($event.target.value)", "change": "_onChange()", "blur": "_onBlur()", "focus": "_onFocus()", "dblclick": "_onFocus()", "keydown": "_onKeydown($event)" }, properties: { "attr.aria-haspopup": "_datepicker ? \"dialog\" : null", "attr.aria-owns": "(_datepicker?.opened && _datepicker.id) || null", "attr.min": "min ? _dateAdapter.toIso8601(min) : null", "attr.max": "max ? _dateAdapter.toIso8601(max) : null", "disabled": "disabled" } }, providers: [
            MAT_DATEPICKER_VALUE_ACCESSOR,
            MAT_DATEPICKER_VALIDATORS,
            { provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: NgxMatDatetimeInput },
        ], exportAs: ["ngxMatDatetimePickerInput"], ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimeInput, decorators: [{
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
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i1.NgxMatDateAdapter, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [NGX_MAT_DATE_FORMATS]
                }] }, { type: i2.MatFormField, decorators: [{
                    type: Optional
                }] }], propDecorators: { ngxMatDatetimePicker: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZXRpbWUtaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9wcm9qZWN0cy9kYXRldGltZS1waWNrZXIvc3JjL2xpYi9kYXRldGltZS1pbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDbkQsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM1SCxPQUFPLEVBQXlDLGFBQWEsRUFBRSxpQkFBaUIsRUFBNEMsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFHL0osT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDbkUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUVwQyxPQUFPLEVBQXFCLG9CQUFvQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFOUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7Ozs7QUFFaEUsb0JBQW9CO0FBQ3BCLE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUFRO0lBQzlDLE9BQU8sRUFBRSxpQkFBaUI7SUFDMUIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztJQUNsRCxLQUFLLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFFRixvQkFBb0I7QUFDcEIsTUFBTSxDQUFDLE1BQU0seUJBQXlCLEdBQVE7SUFDMUMsT0FBTyxFQUFFLGFBQWE7SUFDdEIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztJQUNsRCxLQUFLLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFHRjs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLDJCQUEyQjtJQU16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QStCO3dCQUMxQyxVQUFVLEVBQUUsYUFBYTt3QkFDekIsUUFBUSxFQUFFLFdBQVc7d0JBQ3JCLFNBQVMsRUFBRSxZQUFZO3dCQUN2QixZQUFZLEVBQUUsWUFBWTt3QkFDMUIsV0FBVyxFQUFFLG9CQUFvQjtxQkFDcEM7b0JBQ0QsUUFBUSxFQUFFLDJCQUEyQjtpQkFDeEM7OzBCQXVKUSxRQUFROzswQkFDUixRQUFROzswQkFBSSxNQUFNOzJCQUFDLG9CQUFvQjs7MEJBQ3ZDLFFBQVE7eUNBckpULG9CQUFvQjtzQkFEdkIsS0FBSztnQkFzQkYsMEJBQTBCO3NCQUQ3QixLQUFLO2dCQVNGLEtBQUs7c0JBRFIsS0FBSztnQkFrQkYsR0FBRztzQkFETixLQUFLO2dCQVVGLEdBQUc7c0JBRE4sS0FBSztnQkFVRixRQUFRO3NCQURYLEtBQUs7Z0JBc0JhLFVBQVU7c0JBQTVCLE1BQU07Z0JBSVksU0FBUztzQkFBM0IsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAbGljZW5zZVxyXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxyXG4gKlxyXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxyXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgRE9XTl9BUlJPVyB9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XHJcbmltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgRXZlbnRFbWl0dGVyLCBmb3J3YXJkUmVmLCBJbmplY3QsIElucHV0LCBPbkRlc3Ryb3ksIE9wdGlvbmFsLCBPdXRwdXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgQWJzdHJhY3RDb250cm9sLCBDb250cm9sVmFsdWVBY2Nlc3NvciwgTkdfVkFMSURBVE9SUywgTkdfVkFMVUVfQUNDRVNTT1IsIFZhbGlkYXRpb25FcnJvcnMsIFZhbGlkYXRvciwgVmFsaWRhdG9yRm4sIFZhbGlkYXRvcnMgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IFRoZW1lUGFsZXR0ZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2NvcmUnO1xyXG5pbXBvcnQgeyBNYXRGb3JtRmllbGQgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9mb3JtLWZpZWxkJztcclxuaW1wb3J0IHsgTUFUX0lOUFVUX1ZBTFVFX0FDQ0VTU09SIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvaW5wdXQnO1xyXG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZUFkYXB0ZXIgfSBmcm9tICcuL2NvcmUvZGF0ZS1hZGFwdGVyJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZUZvcm1hdHMsIE5HWF9NQVRfREFURV9GT1JNQVRTIH0gZnJvbSAnLi9jb3JlL2RhdGUtZm9ybWF0cyc7XHJcbmltcG9ydCB7IE5neE1hdERhdGV0aW1lUGlja2VyIH0gZnJvbSAnLi9kYXRldGltZS1waWNrZXIuY29tcG9uZW50JztcclxuaW1wb3J0IHsgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IgfSBmcm9tICcuL3V0aWxzL2RhdGUtdXRpbHMnO1xyXG5cclxuLyoqIEBkb2NzLXByaXZhdGUgKi9cclxuZXhwb3J0IGNvbnN0IE1BVF9EQVRFUElDS0VSX1ZBTFVFX0FDQ0VTU09SOiBhbnkgPSB7XHJcbiAgICBwcm92aWRlOiBOR19WQUxVRV9BQ0NFU1NPUixcclxuICAgIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IE5neE1hdERhdGV0aW1lSW5wdXQpLFxyXG4gICAgbXVsdGk6IHRydWVcclxufTtcclxuXHJcbi8qKiBAZG9jcy1wcml2YXRlICovXHJcbmV4cG9ydCBjb25zdCBNQVRfREFURVBJQ0tFUl9WQUxJREFUT1JTOiBhbnkgPSB7XHJcbiAgICBwcm92aWRlOiBOR19WQUxJREFUT1JTLFxyXG4gICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gTmd4TWF0RGF0ZXRpbWVJbnB1dCksXHJcbiAgICBtdWx0aTogdHJ1ZVxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBBbiBldmVudCB1c2VkIGZvciBkYXRlcGlja2VyIGlucHV0IGFuZCBjaGFuZ2UgZXZlbnRzLiBXZSBkb24ndCBhbHdheXMgaGF2ZSBhY2Nlc3MgdG8gYSBuYXRpdmVcclxuICogaW5wdXQgb3IgY2hhbmdlIGV2ZW50IGJlY2F1c2UgdGhlIGV2ZW50IG1heSBoYXZlIGJlZW4gdHJpZ2dlcmVkIGJ5IHRoZSB1c2VyIGNsaWNraW5nIG9uIHRoZVxyXG4gKiBjYWxlbmRhciBwb3B1cC4gRm9yIGNvbnNpc3RlbmN5LCB3ZSBhbHdheXMgdXNlIE1hdERhdGV0aW1lUGlja2VySW5wdXRFdmVudCBpbnN0ZWFkLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIE1hdERhdGV0aW1lUGlja2VySW5wdXRFdmVudDxEPiB7XHJcbiAgICAvKiogVGhlIG5ldyB2YWx1ZSBmb3IgdGhlIHRhcmdldCBkYXRlcGlja2VyIGlucHV0LiAqL1xyXG4gICAgdmFsdWU6IEQgfCBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGRhdGVwaWNrZXIgaW5wdXQgY29tcG9uZW50IHRoYXQgZW1pdHRlZCB0aGUgZXZlbnQuICovXHJcbiAgICAgICAgcHVibGljIHRhcmdldDogTmd4TWF0RGF0ZXRpbWVJbnB1dDxEPixcclxuICAgICAgICAvKiogUmVmZXJlbmNlIHRvIHRoZSBuYXRpdmUgaW5wdXQgZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIGRhdGVwaWNrZXIgaW5wdXQuICovXHJcbiAgICAgICAgcHVibGljIHRhcmdldEVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudGFyZ2V0LnZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqIERpcmVjdGl2ZSB1c2VkIHRvIGNvbm5lY3QgYW4gaW5wdXQgdG8gYSBtYXREYXRldGltZVBpY2tlci4gKi9cclxuQERpcmVjdGl2ZSh7XHJcbiAgICBzZWxlY3RvcjogJ2lucHV0W25neE1hdERhdGV0aW1lUGlja2VyXScsXHJcbiAgICBwcm92aWRlcnM6IFtcclxuICAgICAgICBNQVRfREFURVBJQ0tFUl9WQUxVRV9BQ0NFU1NPUixcclxuICAgICAgICBNQVRfREFURVBJQ0tFUl9WQUxJREFUT1JTLFxyXG4gICAgICAgIHsgcHJvdmlkZTogTUFUX0lOUFVUX1ZBTFVFX0FDQ0VTU09SLCB1c2VFeGlzdGluZzogTmd4TWF0RGF0ZXRpbWVJbnB1dCB9LFxyXG4gICAgXSxcclxuICAgIGhvc3Q6IHtcclxuICAgICAgICAnW2F0dHIuYXJpYS1oYXNwb3B1cF0nOiAnX2RhdGVwaWNrZXIgPyBcImRpYWxvZ1wiIDogbnVsbCcsXHJcbiAgICAgICAgJ1thdHRyLmFyaWEtb3duc10nOiAnKF9kYXRlcGlja2VyPy5vcGVuZWQgJiYgX2RhdGVwaWNrZXIuaWQpIHx8IG51bGwnLFxyXG4gICAgICAgICdbYXR0ci5taW5dJzogJ21pbiA/IF9kYXRlQWRhcHRlci50b0lzbzg2MDEobWluKSA6IG51bGwnLFxyXG4gICAgICAgICdbYXR0ci5tYXhdJzogJ21heCA/IF9kYXRlQWRhcHRlci50b0lzbzg2MDEobWF4KSA6IG51bGwnLFxyXG4gICAgICAgICdbZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcclxuICAgICAgICAnKGlucHV0KSc6ICdfb25JbnB1dCgkZXZlbnQudGFyZ2V0LnZhbHVlKScsXHJcbiAgICAgICAgJyhjaGFuZ2UpJzogJ19vbkNoYW5nZSgpJyxcclxuICAgICAgICAnKGJsdXIpJzogJ19vbkJsdXIoKScsXHJcbiAgICAgICAgJyhmb2N1cyknOiAnX29uRm9jdXMoKScsXHJcbiAgICAgICAgJyhkYmxjbGljayknOiAnX29uRm9jdXMoKScsXHJcbiAgICAgICAgJyhrZXlkb3duKSc6ICdfb25LZXlkb3duKCRldmVudCknLFxyXG4gICAgfSxcclxuICAgIGV4cG9ydEFzOiAnbmd4TWF0RGF0ZXRpbWVQaWNrZXJJbnB1dCcsXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBOZ3hNYXREYXRldGltZUlucHV0PEQ+IGltcGxlbWVudHMgQ29udHJvbFZhbHVlQWNjZXNzb3IsIE9uRGVzdHJveSwgVmFsaWRhdG9yIHtcclxuICAgIC8qKiBUaGUgZGF0ZXBpY2tlciB0aGF0IHRoaXMgaW5wdXQgaXMgYXNzb2NpYXRlZCB3aXRoLiAqL1xyXG4gICAgQElucHV0KClcclxuICAgIHNldCBuZ3hNYXREYXRldGltZVBpY2tlcih2YWx1ZTogTmd4TWF0RGF0ZXRpbWVQaWNrZXI8RD4pIHtcclxuICAgICAgICBpZiAoIXZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2RhdGVwaWNrZXIgPSB2YWx1ZTtcclxuICAgICAgICB0aGlzLl9kYXRlcGlja2VyLl9yZWdpc3RlcklucHV0KHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX2RhdGVwaWNrZXJTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGF0ZXBpY2tlclN1YnNjcmlwdGlvbiA9IHRoaXMuX2RhdGVwaWNrZXIuX3NlbGVjdGVkQ2hhbmdlZC5zdWJzY3JpYmUoKHNlbGVjdGVkOiBEKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBzZWxlY3RlZDtcclxuICAgICAgICAgICAgdGhpcy5fY3ZhT25DaGFuZ2Uoc2VsZWN0ZWQpO1xyXG4gICAgICAgICAgICB0aGlzLl9vblRvdWNoZWQoKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRlSW5wdXQuZW1pdChuZXcgTWF0RGF0ZXRpbWVQaWNrZXJJbnB1dEV2ZW50KHRoaXMsIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCkpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGVDaGFuZ2UuZW1pdChuZXcgTWF0RGF0ZXRpbWVQaWNrZXJJbnB1dEV2ZW50KHRoaXMsIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgX2RhdGVwaWNrZXI6IE5neE1hdERhdGV0aW1lUGlja2VyPEQ+O1xyXG5cclxuICAgIC8qKiBGdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGZpbHRlciBvdXQgZGF0ZXMgd2l0aGluIHRoZSBkYXRlcGlja2VyLiAqL1xyXG4gICAgQElucHV0KClcclxuICAgIHNldCBuZ3hNYXREYXRldGltZVBpY2tlckZpbHRlcih2YWx1ZTogKGRhdGU6IEQgfCBudWxsKSA9PiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0ZUZpbHRlciA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuX3ZhbGlkYXRvck9uQ2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgICBfZGF0ZUZpbHRlcjogKGRhdGU6IEQgfCBudWxsKSA9PiBib29sZWFuO1xyXG5cclxuICAgIC8qKiBUaGUgdmFsdWUgb2YgdGhlIGlucHV0LiAqL1xyXG4gICAgQElucHV0KClcclxuICAgIGdldCB2YWx1ZSgpOiBEIHwgbnVsbCB7IHJldHVybiB0aGlzLl92YWx1ZTsgfVxyXG4gICAgc2V0IHZhbHVlKHZhbHVlOiBEIHwgbnVsbCkge1xyXG4gICAgICAgIHZhbHVlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUodmFsdWUpO1xyXG4gICAgICAgIHRoaXMuX2xhc3RWYWx1ZVZhbGlkID0gIXZhbHVlIHx8IHRoaXMuX2RhdGVBZGFwdGVyLmlzVmFsaWQodmFsdWUpO1xyXG4gICAgICAgIHZhbHVlID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHZhbHVlKTtcclxuICAgICAgICBjb25zdCBvbGREYXRlID0gdGhpcy52YWx1ZTtcclxuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuX2Zvcm1hdFZhbHVlKHZhbHVlKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9kYXRlQWRhcHRlci5zYW1lRGF0ZShvbGREYXRlLCB2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5fdmFsdWVDaGFuZ2UuZW1pdCh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcHJpdmF0ZSBfdmFsdWU6IEQgfCBudWxsO1xyXG5cclxuICAgIC8qKiBUaGUgbWluaW11bSB2YWxpZCBkYXRlLiAqL1xyXG4gICAgQElucHV0KClcclxuICAgIGdldCBtaW4oKTogRCB8IG51bGwgeyByZXR1cm4gdGhpcy5fbWluOyB9XHJcbiAgICBzZXQgbWluKHZhbHVlOiBEIHwgbnVsbCkge1xyXG4gICAgICAgIHRoaXMuX21pbiA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpO1xyXG4gICAgICAgIHRoaXMuX3ZhbGlkYXRvck9uQ2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgICBwcml2YXRlIF9taW46IEQgfCBudWxsO1xyXG5cclxuICAgIC8qKiBUaGUgbWF4aW11bSB2YWxpZCBkYXRlLiAqL1xyXG4gICAgQElucHV0KClcclxuICAgIGdldCBtYXgoKTogRCB8IG51bGwgeyByZXR1cm4gdGhpcy5fbWF4OyB9XHJcbiAgICBzZXQgbWF4KHZhbHVlOiBEIHwgbnVsbCkge1xyXG4gICAgICAgIHRoaXMuX21heCA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZSh2YWx1ZSkpO1xyXG4gICAgICAgIHRoaXMuX3ZhbGlkYXRvck9uQ2hhbmdlKCk7XHJcbiAgICB9XHJcbiAgICBwcml2YXRlIF9tYXg6IEQgfCBudWxsO1xyXG5cclxuICAgIC8qKiBXaGV0aGVyIHRoZSBkYXRlcGlja2VyLWlucHV0IGlzIGRpc2FibGVkLiAqL1xyXG4gICAgQElucHV0KClcclxuICAgIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuICEhdGhpcy5fZGlzYWJsZWQ7IH1cclxuICAgIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gdmFsdWUgIT0gbnVsbCAmJiBgJHt2YWx1ZX1gICE9PSAnZmFsc2UnO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9kaXNhYmxlZCAhPT0gbmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGlzYWJsZWQgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZUNoYW5nZXMuZW1pdCh1bmRlZmluZWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gV2UgbmVlZCB0byBudWxsIGNoZWNrIHRoZSBgYmx1cmAgbWV0aG9kLCBiZWNhdXNlIGl0J3MgdW5kZWZpbmVkIGR1cmluZyBTU1IuXHJcbiAgICAgICAgaWYgKG5ld1ZhbHVlICYmIGVsZW1lbnQuYmx1cikge1xyXG4gICAgICAgICAgICAvLyBOb3JtYWxseSwgbmF0aXZlIGlucHV0IGVsZW1lbnRzIGF1dG9tYXRpY2FsbHkgYmx1ciBpZiB0aGV5IHR1cm4gZGlzYWJsZWQuIFRoaXMgYmVoYXZpb3JcclxuICAgICAgICAgICAgLy8gaXMgcHJvYmxlbWF0aWMsIGJlY2F1c2UgaXQgd291bGQgbWVhbiB0aGF0IGl0IHRyaWdnZXJzIGFub3RoZXIgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSxcclxuICAgICAgICAgICAgLy8gd2hpY2ggdGhlbiBjYXVzZXMgYSBjaGFuZ2VkIGFmdGVyIGNoZWNrZWQgZXJyb3IgaWYgdGhlIGlucHV0IGVsZW1lbnQgd2FzIGZvY3VzZWQgYmVmb3JlLlxyXG4gICAgICAgICAgICBlbGVtZW50LmJsdXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbjtcclxuXHJcbiAgICAvKiogRW1pdHMgd2hlbiBhIGBjaGFuZ2VgIGV2ZW50IGlzIGZpcmVkIG9uIHRoaXMgYDxpbnB1dD5gLiAqL1xyXG4gICAgQE91dHB1dCgpIHJlYWRvbmx5IGRhdGVDaGFuZ2U6IEV2ZW50RW1pdHRlcjxNYXREYXRldGltZVBpY2tlcklucHV0RXZlbnQ8RD4+ID1cclxuICAgICAgICBuZXcgRXZlbnRFbWl0dGVyPE1hdERhdGV0aW1lUGlja2VySW5wdXRFdmVudDxEPj4oKTtcclxuXHJcbiAgICAvKiogRW1pdHMgd2hlbiBhbiBgaW5wdXRgIGV2ZW50IGlzIGZpcmVkIG9uIHRoaXMgYDxpbnB1dD5gLiAqL1xyXG4gICAgQE91dHB1dCgpIHJlYWRvbmx5IGRhdGVJbnB1dDogRXZlbnRFbWl0dGVyPE1hdERhdGV0aW1lUGlja2VySW5wdXRFdmVudDxEPj4gPVxyXG4gICAgICAgIG5ldyBFdmVudEVtaXR0ZXI8TWF0RGF0ZXRpbWVQaWNrZXJJbnB1dEV2ZW50PEQ+PigpO1xyXG5cclxuICAgIC8qKiBFbWl0cyB3aGVuIHRoZSB2YWx1ZSBjaGFuZ2VzIChlaXRoZXIgZHVlIHRvIHVzZXIgaW5wdXQgb3IgcHJvZ3JhbW1hdGljIGNoYW5nZSkuICovXHJcbiAgICBfdmFsdWVDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEQgfCBudWxsPigpO1xyXG5cclxuICAgIC8qKiBFbWl0cyB3aGVuIHRoZSBkaXNhYmxlZCBzdGF0ZSBoYXMgY2hhbmdlZCAqL1xyXG4gICAgc3RhdGVDaGFuZ2VzID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG5cclxuICAgIF9vblRvdWNoZWQgPSAoKSA9PiB7IH07XHJcblxyXG4gICAgcHJpdmF0ZSBfY3ZhT25DaGFuZ2U6ICh2YWx1ZTogYW55KSA9PiB2b2lkID0gKCkgPT4geyB9O1xyXG5cclxuICAgIHByaXZhdGUgX3ZhbGlkYXRvck9uQ2hhbmdlID0gKCkgPT4geyB9O1xyXG5cclxuICAgIHByaXZhdGUgX2RhdGVwaWNrZXJTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XHJcblxyXG4gICAgcHJpdmF0ZSBfbG9jYWxlU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xyXG5cclxuICAgIC8qKiBUaGUgZm9ybSBjb250cm9sIHZhbGlkYXRvciBmb3Igd2hldGhlciB0aGUgaW5wdXQgcGFyc2VzLiAqL1xyXG4gICAgcHJpdmF0ZSBfcGFyc2VWYWxpZGF0b3I6IFZhbGlkYXRvckZuID0gKCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbGFzdFZhbHVlVmFsaWQgP1xyXG4gICAgICAgICAgICBudWxsIDogeyAnbWF0RGF0ZXRpbWVQaWNrZXJQYXJzZSc6IHsgJ3RleHQnOiB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudmFsdWUgfSB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBUaGUgZm9ybSBjb250cm9sIHZhbGlkYXRvciBmb3IgdGhlIG1pbiBkYXRlLiAqL1xyXG4gICAgcHJpdmF0ZSBfbWluVmFsaWRhdG9yOiBWYWxpZGF0b3JGbiA9IChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICAgICAgY29uc3QgY29udHJvbFZhbHVlID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKHRoaXMuX2RhdGVBZGFwdGVyLmRlc2VyaWFsaXplKGNvbnRyb2wudmFsdWUpKTtcclxuICAgICAgICByZXR1cm4gKCF0aGlzLm1pbiB8fCAhY29udHJvbFZhbHVlIHx8XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGVBZGFwdGVyLmNvbXBhcmVEYXRlV2l0aFRpbWUodGhpcy5taW4sIGNvbnRyb2xWYWx1ZSwgdGhpcy5fZGF0ZXBpY2tlci5zaG93U2Vjb25kcykgPD0gMCkgP1xyXG4gICAgICAgICAgICBudWxsIDogeyAnbWF0RGF0ZXRpbWVQaWNrZXJNaW4nOiB7ICdtaW4nOiB0aGlzLm1pbiwgJ2FjdHVhbCc6IGNvbnRyb2xWYWx1ZSB9IH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFRoZSBmb3JtIGNvbnRyb2wgdmFsaWRhdG9yIGZvciB0aGUgbWF4IGRhdGUuICovXHJcbiAgICBwcml2YXRlIF9tYXhWYWxpZGF0b3I6IFZhbGlkYXRvckZuID0gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+IHtcclxuICAgICAgICBjb25zdCBjb250cm9sVmFsdWUgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUoY29udHJvbC52YWx1ZSkpO1xyXG4gICAgICAgIHJldHVybiAoIXRoaXMubWF4IHx8ICFjb250cm9sVmFsdWUgfHxcclxuICAgICAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuY29tcGFyZURhdGVXaXRoVGltZSh0aGlzLm1heCwgY29udHJvbFZhbHVlLCB0aGlzLl9kYXRlcGlja2VyLnNob3dTZWNvbmRzKSA+PSAwKSA/XHJcbiAgICAgICAgICAgIG51bGwgOiB7ICdtYXREYXRldGltZVBpY2tlck1heCc6IHsgJ21heCc6IHRoaXMubWF4LCAnYWN0dWFsJzogY29udHJvbFZhbHVlIH0gfTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogVGhlIGZvcm0gY29udHJvbCB2YWxpZGF0b3IgZm9yIHRoZSBkYXRlIGZpbHRlci4gKi9cclxuICAgIHByaXZhdGUgX2ZpbHRlclZhbGlkYXRvcjogVmFsaWRhdG9yRm4gPSAoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IHRoaXMuX2dldFZhbGlkRGF0ZU9yTnVsbCh0aGlzLl9kYXRlQWRhcHRlci5kZXNlcmlhbGl6ZShjb250cm9sLnZhbHVlKSk7XHJcbiAgICAgICAgcmV0dXJuICF0aGlzLl9kYXRlRmlsdGVyIHx8ICFjb250cm9sVmFsdWUgfHwgdGhpcy5fZGF0ZUZpbHRlcihjb250cm9sVmFsdWUpID9cclxuICAgICAgICAgICAgbnVsbCA6IHsgJ21hdERhdGV0aW1lUGlja2VyRmlsdGVyJzogdHJ1ZSB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBUaGUgY29tYmluZWQgZm9ybSBjb250cm9sIHZhbGlkYXRvciBmb3IgdGhpcyBpbnB1dC4gKi9cclxuICAgIHByaXZhdGUgX3ZhbGlkYXRvcjogVmFsaWRhdG9yRm4gfCBudWxsID1cclxuICAgICAgICBWYWxpZGF0b3JzLmNvbXBvc2UoXHJcbiAgICAgICAgICAgIFt0aGlzLl9wYXJzZVZhbGlkYXRvciwgdGhpcy5fbWluVmFsaWRhdG9yLCB0aGlzLl9tYXhWYWxpZGF0b3IsIHRoaXMuX2ZpbHRlclZhbGlkYXRvcl0pO1xyXG5cclxuICAgIC8qKiBXaGV0aGVyIHRoZSBsYXN0IHZhbHVlIHNldCBvbiB0aGUgaW5wdXQgd2FzIHZhbGlkLiAqL1xyXG4gICAgcHJpdmF0ZSBfbGFzdFZhbHVlVmFsaWQgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxJbnB1dEVsZW1lbnQ+LFxyXG4gICAgICAgIEBPcHRpb25hbCgpIHB1YmxpYyBfZGF0ZUFkYXB0ZXI6IE5neE1hdERhdGVBZGFwdGVyPEQ+LFxyXG4gICAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoTkdYX01BVF9EQVRFX0ZPUk1BVFMpIHByaXZhdGUgX2RhdGVGb3JtYXRzOiBOZ3hNYXREYXRlRm9ybWF0cyxcclxuICAgICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9mb3JtRmllbGQ6IE1hdEZvcm1GaWVsZCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fZGF0ZUFkYXB0ZXIpIHtcclxuICAgICAgICAgICAgdGhyb3cgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IoJ05neE1hdERhdGVBZGFwdGVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5fZGF0ZUZvcm1hdHMpIHtcclxuICAgICAgICAgICAgdGhyb3cgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IoJ05HWF9NQVRfREFURV9GT1JNQVRTJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXllZCBkYXRlIHdoZW4gdGhlIGxvY2FsZSBjaGFuZ2VzLlxyXG4gICAgICAgIHRoaXMuX2xvY2FsZVN1YnNjcmlwdGlvbiA9IF9kYXRlQWRhcHRlci5sb2NhbGVDaGFuZ2VzLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG5nT25EZXN0cm95KCkge1xyXG4gICAgICAgIHRoaXMuX2RhdGVwaWNrZXJTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuICAgICAgICB0aGlzLl9sb2NhbGVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuICAgICAgICB0aGlzLl92YWx1ZUNoYW5nZS5jb21wbGV0ZSgpO1xyXG4gICAgICAgIHRoaXMuc3RhdGVDaGFuZ2VzLmNvbXBsZXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEBkb2NzLXByaXZhdGUgKi9cclxuICAgIHJlZ2lzdGVyT25WYWxpZGF0b3JDaGFuZ2UoZm46ICgpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLl92YWxpZGF0b3JPbkNoYW5nZSA9IGZuO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBAZG9jcy1wcml2YXRlICovXHJcbiAgICB2YWxpZGF0ZShjOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbGlkYXRvciA/IHRoaXMuX3ZhbGlkYXRvcihjKSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAZGVwcmVjYXRlZFxyXG4gICAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBVc2UgYGdldENvbm5lY3RlZE92ZXJsYXlPcmlnaW5gIGluc3RlYWRcclxuICAgICAqL1xyXG4gICAgZ2V0UG9wdXBDb25uZWN0aW9uRWxlbWVudFJlZigpOiBFbGVtZW50UmVmIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb25uZWN0ZWRPdmVybGF5T3JpZ2luKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSBlbGVtZW50IHRoYXQgdGhlIGRhdGVwaWNrZXIgcG9wdXAgc2hvdWxkIGJlIGNvbm5lY3RlZCB0by5cclxuICAgICAqIEByZXR1cm4gVGhlIGVsZW1lbnQgdG8gY29ubmVjdCB0aGUgcG9wdXAgdG8uXHJcbiAgICAgKi9cclxuICAgIGdldENvbm5lY3RlZE92ZXJsYXlPcmlnaW4oKTogRWxlbWVudFJlZiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Zvcm1GaWVsZCA/IHRoaXMuX2Zvcm1GaWVsZC5nZXRDb25uZWN0ZWRPdmVybGF5T3JpZ2luKCkgOiB0aGlzLl9lbGVtZW50UmVmO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgQ29udHJvbFZhbHVlQWNjZXNzb3IuXHJcbiAgICB3cml0ZVZhbHVlKHZhbHVlOiBEKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgQ29udHJvbFZhbHVlQWNjZXNzb3IuXHJcbiAgICByZWdpc3Rlck9uQ2hhbmdlKGZuOiAodmFsdWU6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuX2N2YU9uQ2hhbmdlID0gZm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cclxuICAgIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5fb25Ub3VjaGVkID0gZm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cclxuICAgIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xyXG4gICAgfVxyXG5cclxuICAgIF9vbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcclxuICAgICAgICBjb25zdCBpc0FsdERvd25BcnJvdyA9IGV2ZW50LmFsdEtleSAmJiBldmVudC5rZXlDb2RlID09PSBET1dOX0FSUk9XO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fZGF0ZXBpY2tlciAmJiBpc0FsdERvd25BcnJvdyAmJiAhdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnJlYWRPbmx5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGVwaWNrZXIub3BlbigpO1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfb25JbnB1dCh2YWx1ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgbGFzdFZhbHVlV2FzVmFsaWQgPSB0aGlzLl9sYXN0VmFsdWVWYWxpZDtcclxuICAgICAgICBsZXQgZGF0ZSA9IHRoaXMuX2RhdGVBZGFwdGVyLnBhcnNlKHZhbHVlLCB0aGlzLl9kYXRlRm9ybWF0cy5wYXJzZS5kYXRlSW5wdXQpO1xyXG4gICAgICAgIHRoaXMuX2xhc3RWYWx1ZVZhbGlkID0gIWRhdGUgfHwgdGhpcy5fZGF0ZUFkYXB0ZXIuaXNWYWxpZChkYXRlKTtcclxuICAgICAgICBkYXRlID0gdGhpcy5fZ2V0VmFsaWREYXRlT3JOdWxsKGRhdGUpO1xyXG5cclxuICAgICAgICBjb25zdCBpc1NhbWVUaW1lID0gdGhpcy5fZGF0ZUFkYXB0ZXIuaXNTYW1lVGltZShkYXRlLCB0aGlzLl92YWx1ZSk7XHJcblxyXG4gICAgICAgIGlmICgoZGF0ZSAhPSBudWxsICYmICghaXNTYW1lVGltZSB8fCAhdGhpcy5fZGF0ZUFkYXB0ZXIuc2FtZURhdGUoZGF0ZSwgdGhpcy5fdmFsdWUpKSlcclxuICAgICAgICAgICAgfHwgKGRhdGUgPT0gbnVsbCAmJiB0aGlzLl92YWx1ZSAhPSBudWxsKSkge1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IGRhdGU7XHJcbiAgICAgICAgICAgIHRoaXMuX2N2YU9uQ2hhbmdlKGRhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZUNoYW5nZS5lbWl0KGRhdGUpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGVJbnB1dC5lbWl0KG5ldyBNYXREYXRldGltZVBpY2tlcklucHV0RXZlbnQodGhpcywgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXN0VmFsdWVXYXNWYWxpZCAhPT0gdGhpcy5fbGFzdFZhbHVlVmFsaWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fdmFsaWRhdG9yT25DaGFuZ2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX29uQ2hhbmdlKCkge1xyXG4gICAgICAgIHRoaXMuZGF0ZUNoYW5nZS5lbWl0KG5ldyBNYXREYXRldGltZVBpY2tlcklucHV0RXZlbnQodGhpcywgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFJldHVybnMgdGhlIHBhbGV0dGUgdXNlZCBieSB0aGUgaW5wdXQncyBmb3JtIGZpZWxkLCBpZiBhbnkuICovXHJcbiAgICBfZ2V0VGhlbWVQYWxldHRlKCk6IFRoZW1lUGFsZXR0ZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Zvcm1GaWVsZCA/IHRoaXMuX2Zvcm1GaWVsZC5jb2xvciA6IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICAvKiogSGFuZGxlcyBibHVyIGV2ZW50cyBvbiB0aGUgaW5wdXQuICovXHJcbiAgICBfb25CbHVyKCkge1xyXG4gICAgICAgIC8vIFJlZm9ybWF0IHRoZSBpbnB1dCBvbmx5IGlmIHdlIGhhdmUgYSB2YWxpZCB2YWx1ZS5cclxuICAgICAgICBpZiAodGhpcy52YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9mb3JtYXRWYWx1ZSh0aGlzLnZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX29uVG91Y2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBIYW5kbGVzIGZvY3VzIGV2ZW50cyBvbiB0aGUgaW5wdXQuICovXHJcbiAgICBfb25Gb2N1cygpIHtcclxuICAgICAgICAvLyBDbG9zZSBkYXRldGltZSBwaWNrZXIgaWYgb3BlbmVkXHJcbiAgICAgICAgaWYgKHRoaXMuX2RhdGVwaWNrZXI/Lm9wZW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRlcGlja2VyLmNhbmNlbCgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fZGF0ZXBpY2tlciAmJiAhdGhpcy5fZGF0ZXBpY2tlci5vcGVuZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fdmFsdWVDaGFuZ2UuZW1pdCh0aGlzLl92YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGVwaWNrZXIub3BlbigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiogRm9ybWF0cyBhIHZhbHVlIGFuZCBzZXRzIGl0IG9uIHRoZSBpbnB1dCBlbGVtZW50LiAqL1xyXG4gICAgcHJpdmF0ZSBfZm9ybWF0VmFsdWUodmFsdWU6IEQgfCBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnZhbHVlID1cclxuICAgICAgICAgICAgdmFsdWUgPyB0aGlzLl9kYXRlQWRhcHRlci5mb3JtYXQodmFsdWUsIHRoaXMuX2RhdGVGb3JtYXRzLmRpc3BsYXkuZGF0ZUlucHV0KSA6ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIG9iaiBUaGUgb2JqZWN0IHRvIGNoZWNrLlxyXG4gICAgICogQHJldHVybnMgVGhlIGdpdmVuIG9iamVjdCBpZiBpdCBpcyBib3RoIGEgZGF0ZSBpbnN0YW5jZSBhbmQgdmFsaWQsIG90aGVyd2lzZSBudWxsLlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIF9nZXRWYWxpZERhdGVPck51bGwob2JqOiBhbnkpOiBEIHwgbnVsbCB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLl9kYXRlQWRhcHRlci5pc0RhdGVJbnN0YW5jZShvYmopICYmIHRoaXMuX2RhdGVBZGFwdGVyLmlzVmFsaWQob2JqKSkgPyBvYmogOiBudWxsO1xyXG4gICAgfVxyXG5cclxufVxyXG4iXX0=