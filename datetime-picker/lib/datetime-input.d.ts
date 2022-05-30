import { ElementRef, EventEmitter, OnDestroy } from '@angular/core';
import { AbstractControl, ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { NgxMatDateAdapter } from './core/date-adapter';
import { NgxMatDateFormats } from './core/date-formats';
import { NgxMatDatetimePicker } from './datetime-picker.component';
import * as i0 from "@angular/core";
/** @docs-private */
export declare const MAT_DATEPICKER_VALUE_ACCESSOR: any;
/** @docs-private */
export declare const MAT_DATEPICKER_VALIDATORS: any;
/**
 * An event used for datepicker input and change events. We don't always have access to a native
 * input or change event because the event may have been triggered by the user clicking on the
 * calendar popup. For consistency, we always use MatDatetimePickerInputEvent instead.
 */
export declare class MatDatetimePickerInputEvent<D> {
    /** Reference to the datepicker input component that emitted the event. */
    target: NgxMatDatetimeInput<D>;
    /** Reference to the native input element associated with the datepicker input. */
    targetElement: HTMLElement;
    /** The new value for the target datepicker input. */
    value: D | null;
    constructor(
    /** Reference to the datepicker input component that emitted the event. */
    target: NgxMatDatetimeInput<D>, 
    /** Reference to the native input element associated with the datepicker input. */
    targetElement: HTMLElement);
}
/** Directive used to connect an input to a matDatetimePicker. */
export declare class NgxMatDatetimeInput<D> implements ControlValueAccessor, OnDestroy, Validator {
    private _elementRef;
    _dateAdapter: NgxMatDateAdapter<D>;
    private _dateFormats;
    private _formField;
    /** The datepicker that this input is associated with. */
    set ngxMatDatetimePicker(value: NgxMatDatetimePicker<D>);
    _datepicker: NgxMatDatetimePicker<D>;
    /** Function that can be used to filter out dates within the datepicker. */
    set ngxMatDatetimePickerFilter(value: (date: D | null) => boolean);
    _dateFilter: (date: D | null) => boolean;
    /** The value of the input. */
    get value(): D | null;
    set value(value: D | null);
    private _value;
    /** The minimum valid date. */
    get min(): D | null;
    set min(value: D | null);
    private _min;
    /** The maximum valid date. */
    get max(): D | null;
    set max(value: D | null);
    private _max;
    /** Whether the datepicker-input is disabled. */
    get disabled(): boolean;
    set disabled(value: boolean);
    private _disabled;
    /** Emits when a `change` event is fired on this `<input>`. */
    readonly dateChange: EventEmitter<MatDatetimePickerInputEvent<D>>;
    /** Emits when an `input` event is fired on this `<input>`. */
    readonly dateInput: EventEmitter<MatDatetimePickerInputEvent<D>>;
    /** Emits when the value changes (either due to user input or programmatic change). */
    _valueChange: EventEmitter<D>;
    /** Emits when the disabled state has changed */
    stateChanges: EventEmitter<void>;
    _onTouched: () => void;
    private _cvaOnChange;
    private _validatorOnChange;
    private _datepickerSubscription;
    private _localeSubscription;
    /** The form control validator for whether the input parses. */
    private _parseValidator;
    /** The form control validator for the min date. */
    private _minValidator;
    /** The form control validator for the max date. */
    private _maxValidator;
    /** The form control validator for the date filter. */
    private _filterValidator;
    /** The combined form control validator for this input. */
    private _validator;
    /** Whether the last value set on the input was valid. */
    private _lastValueValid;
    constructor(_elementRef: ElementRef<HTMLInputElement>, _dateAdapter: NgxMatDateAdapter<D>, _dateFormats: NgxMatDateFormats, _formField: MatFormField);
    ngOnDestroy(): void;
    /** @docs-private */
    registerOnValidatorChange(fn: () => void): void;
    /** @docs-private */
    validate(c: AbstractControl): ValidationErrors | null;
    /**
     * @deprecated
     * @breaking-change 8.0.0 Use `getConnectedOverlayOrigin` instead
     */
    getPopupConnectionElementRef(): ElementRef;
    /**
     * Gets the element that the datepicker popup should be connected to.
     * @return The element to connect the popup to.
     */
    getConnectedOverlayOrigin(): ElementRef;
    writeValue(value: D): void;
    registerOnChange(fn: (value: any) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    _onKeydown(event: KeyboardEvent): void;
    _onInput(value: string): void;
    _onChange(): void;
    /** Returns the palette used by the input's form field, if any. */
    _getThemePalette(): ThemePalette;
    /** Handles blur events on the input. */
    _onBlur(): void;
    /** Handles focus events on the input. */
    _onFocus(): void;
    /** Formats a value and sets it on the input element. */
    private _formatValue;
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    private _getValidDateOrNull;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxMatDatetimeInput<any>, [null, { optional: true; }, { optional: true; }, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<NgxMatDatetimeInput<any>, "input[ngxMatDatetimePicker]", ["ngxMatDatetimePickerInput"], { "ngxMatDatetimePicker": "ngxMatDatetimePicker"; "ngxMatDatetimePickerFilter": "ngxMatDatetimePickerFilter"; "value": "value"; "min": "min"; "max": "max"; "disabled": "disabled"; }, { "dateChange": "dateChange"; "dateInput": "dateInput"; }, never>;
}
