import { AfterViewInit, ChangeDetectorRef, ElementRef, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { NgxMatDateAdapter } from './core/date-adapter';
import * as i0 from "@angular/core";
export declare class NgxMatTimepickerComponent<D> implements ControlValueAccessor, OnInit, AfterViewInit, OnChanges {
    _dateAdapter: NgxMatDateAdapter<D>;
    private cd;
    private formBuilder;
    form: UntypedFormGroup;
    disabled: boolean;
    showSpinners: boolean;
    stepHour: number;
    stepMinute: number;
    stepSecond: number;
    showSeconds: boolean;
    disableMinute: boolean;
    enableMeridian: boolean;
    defaultTime: number[];
    color: ThemePalette;
    meridian: string;
    /** Hour */
    private get hour();
    private get minute();
    private get second();
    /** Whether or not the form is valid */
    get valid(): boolean;
    private _onChange;
    private _onTouched;
    private _disabled;
    private _model;
    private _destroyed;
    pattern: RegExp;
    /** Used to auto switch focus when input 2 number in time inputs */
    private inputFields;
    inputHour: ElementRef;
    inputMinute: ElementRef;
    inputSecond: ElementRef;
    constructor(_dateAdapter: NgxMatDateAdapter<D>, cd: ChangeDetectorRef, formBuilder: UntypedFormBuilder);
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    /**
     * Writes a new value to the element.
     * @param obj
     */
    writeValue(val: D): void;
    /** Registers a callback function that is called when the control's value changes in the UI. */
    registerOnChange(fn: (_: any) => {}): void;
    /**
     * Set the function to be called when the control receives a touch event.
     */
    registerOnTouched(fn: () => {}): void;
    /** Enables or disables the appropriate DOM element */
    setDisabledState(isDisabled: boolean): void;
    /**
     * Format input
     * @param input
     */
    formatInput(input: HTMLInputElement): void;
    /** Toggle meridian */
    toggleMeridian(): void;
    /** Change property of time */
    change(prop: string, up?: boolean): void;
    /** Update controls of form by model */
    private _updateHourMinuteSecond;
    /** Update model */
    private _updateModel;
    /**
     * Get next value by property
     * @param prop
     * @param up
     */
    private _getNextValueByProp;
    /**
     * Set disable states
     */
    private _setDisableStates;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxMatTimepickerComponent<any>, [{ optional: true; }, null, null]>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NgxMatTimepickerComponent<any>, "ngx-mat-timepicker", ["ngxMatTimepicker"], { "disabled": { "alias": "disabled"; "required": false; }; "showSpinners": { "alias": "showSpinners"; "required": false; }; "stepHour": { "alias": "stepHour"; "required": false; }; "stepMinute": { "alias": "stepMinute"; "required": false; }; "stepSecond": { "alias": "stepSecond"; "required": false; }; "showSeconds": { "alias": "showSeconds"; "required": false; }; "disableMinute": { "alias": "disableMinute"; "required": false; }; "enableMeridian": { "alias": "enableMeridian"; "required": false; }; "defaultTime": { "alias": "defaultTime"; "required": false; }; "color": { "alias": "color"; "required": false; }; }, {}, never, never, false, never>;
}
