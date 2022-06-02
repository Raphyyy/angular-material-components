import { Component, forwardRef, Input, Optional, ViewChild, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { createMissingDateImplError, DEFAULT_STEP, formatTwoDigitTimeValue, LIMIT_TIMES, MERIDIANS, NUMERIC_REGEX, PATTERN_INPUT_HOUR, PATTERN_INPUT_MINUTE, PATTERN_INPUT_SECOND } from './utils/date-utils';
import * as i0 from "@angular/core";
import * as i1 from "./core/date-adapter";
import * as i2 from "@angular/forms";
import * as i3 from "@angular/material/button";
import * as i4 from "@angular/material/icon";
import * as i5 from "@angular/material/form-field";
import * as i6 from "@angular/common";
import * as i7 from "@angular/material/input";
export class NgxMatTimepickerComponent {
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
/** @nocollapse */ /** @nocollapse */ NgxMatTimepickerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatTimepickerComponent, deps: [{ token: i1.NgxMatDateAdapter, optional: true }, { token: i0.ChangeDetectorRef }, { token: i2.FormBuilder }], target: i0.ɵɵFactoryTarget.Component });
/** @nocollapse */ /** @nocollapse */ NgxMatTimepickerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.0.1", type: NgxMatTimepickerComponent, selector: "ngx-mat-timepicker", inputs: { disabled: "disabled", showSpinners: "showSpinners", stepHour: "stepHour", stepMinute: "stepMinute", stepSecond: "stepSecond", showSeconds: "showSeconds", disableMinute: "disableMinute", enableMeridian: "enableMeridian", defaultTime: "defaultTime", color: "color" }, host: { classAttribute: "ngx-mat-timepicker" }, providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef((() => NgxMatTimepickerComponent)),
            multi: true
        }
    ], viewQueries: [{ propertyName: "inputHour", first: true, predicate: ["inputHour"], descendants: true }, { propertyName: "inputMinute", first: true, predicate: ["inputMinute"], descendants: true }, { propertyName: "inputSecond", first: true, predicate: ["inputSecond"], descendants: true }], exportAs: ["ngxMatTimepicker"], usesOnChanges: true, ngImport: i0, template: "<form [formGroup]=\"form\">\r\n  <table class=\"ngx-mat-timepicker-table\">\r\n    <tbody class=\"ngx-mat-timepicker-tbody\">\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('hour', true)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('minute', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('second', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n\r\n      <tr>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputHour matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" formControlName=\"hour\" autocomplete=\"false\" name=\"\"\r\n              (keydown.ArrowUp)=\"change('hour', true); $event.preventDefault()\" (focus)=\"inputHour.select()\"\r\n              (keydown.ArrowDown)=\"change('hour', false); $event.preventDefault()\" (blur)=\"change('hour')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputMinute matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"false\" name=\"\"\r\n              formControlName=\"minute\" (keydown.ArrowUp)=\"change('minute', true); $event.preventDefault()\" (focus)=\"inputMinute.select()\"\r\n              (keydown.ArrowDown)=\"change('minute', false); $event.preventDefault()\" (blur)=\"change('minute')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td *ngIf=\"showSeconds\" class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputSecond matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"false\" name=\"\"\r\n              formControlName=\"second\" (keydown.ArrowUp)=\"change('second', true); $event.preventDefault()\" (focus)=\"inputSecond.select()\"\r\n              (keydown.ArrowDown)=\"change('second', false); $event.preventDefault()\" (blur)=\"change('second')\">\r\n          </mat-form-field>\r\n        </td>\r\n\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-meridian\">\r\n          <button mat-button (click)=\"toggleMeridian()\" mat-stroked-button [color]=\"color\" [disabled]=\"disabled\">\r\n            {{meridian}}\r\n          </button>\r\n        </td>\r\n      </tr>\r\n\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('hour', false)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('minute', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td *ngIf=\"showSeconds\"></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('second', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n</form>", styles: [".ngx-mat-timepicker{font-size:13px}.ngx-mat-timepicker form{min-width:90px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td{text-align:center}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-spacer{font-weight:bold}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-meridian .mat-button{min-width:64px;line-height:36px;min-width:0;border-radius:50%;width:36px;height:36px;padding:0;flex-shrink:0}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button{height:24px;width:24px;line-height:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button .mat-icon{font-size:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-form-field{width:20px;max-width:20px;text-align:center}\n"], components: [{ type: i3.MatButton, selector: "button[mat-button], button[mat-raised-button], button[mat-icon-button],             button[mat-fab], button[mat-mini-fab], button[mat-stroked-button],             button[mat-flat-button]", inputs: ["disabled", "disableRipple", "color"], exportAs: ["matButton"] }, { type: i4.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { type: i5.MatFormField, selector: "mat-form-field", inputs: ["color", "appearance", "hideRequiredMarker", "hintLabel", "floatLabel"], exportAs: ["matFormField"] }], directives: [{ type: i2.ɵNgNoValidate, selector: "form:not([ngNoForm]):not([ngNativeValidate])" }, { type: i2.NgControlStatusGroup, selector: "[formGroupName],[formArrayName],[ngModelGroup],[formGroup],form:not([ngNoForm]),[ngForm]" }, { type: i2.FormGroupDirective, selector: "[formGroup]", inputs: ["formGroup"], outputs: ["ngSubmit"], exportAs: ["ngForm"] }, { type: i6.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i7.MatInput, selector: "input[matInput], textarea[matInput], select[matNativeControl],      input[matNativeControl], textarea[matNativeControl]", inputs: ["disabled", "id", "placeholder", "required", "type", "errorStateMatcher", "aria-describedby", "value", "readonly"], exportAs: ["matInput"] }, { type: i2.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i2.MaxLengthValidator, selector: "[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]", inputs: ["maxlength"] }, { type: i2.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i2.FormControlName, selector: "[formControlName]", inputs: ["formControlName", "disabled", "ngModel"], outputs: ["ngModelChange"] }], encapsulation: i0.ViewEncapsulation.None });
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
                    ], exportAs: 'ngxMatTimepicker', encapsulation: ViewEncapsulation.None, template: "<form [formGroup]=\"form\">\r\n  <table class=\"ngx-mat-timepicker-table\">\r\n    <tbody class=\"ngx-mat-timepicker-tbody\">\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('hour', true)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('minute', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('second', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n\r\n      <tr>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputHour matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" formControlName=\"hour\" autocomplete=\"false\" name=\"\"\r\n              (keydown.ArrowUp)=\"change('hour', true); $event.preventDefault()\" (focus)=\"inputHour.select()\"\r\n              (keydown.ArrowDown)=\"change('hour', false); $event.preventDefault()\" (blur)=\"change('hour')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputMinute matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"false\" name=\"\"\r\n              formControlName=\"minute\" (keydown.ArrowUp)=\"change('minute', true); $event.preventDefault()\" (focus)=\"inputMinute.select()\"\r\n              (keydown.ArrowDown)=\"change('minute', false); $event.preventDefault()\" (blur)=\"change('minute')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td *ngIf=\"showSeconds\" class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputSecond matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" autocomplete=\"false\" name=\"\"\r\n              formControlName=\"second\" (keydown.ArrowUp)=\"change('second', true); $event.preventDefault()\" (focus)=\"inputSecond.select()\"\r\n              (keydown.ArrowDown)=\"change('second', false); $event.preventDefault()\" (blur)=\"change('second')\">\r\n          </mat-form-field>\r\n        </td>\r\n\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-meridian\">\r\n          <button mat-button (click)=\"toggleMeridian()\" mat-stroked-button [color]=\"color\" [disabled]=\"disabled\">\r\n            {{meridian}}\r\n          </button>\r\n        </td>\r\n      </tr>\r\n\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('hour', false)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('minute', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td *ngIf=\"showSeconds\"></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('second', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n</form>", styles: [".ngx-mat-timepicker{font-size:13px}.ngx-mat-timepicker form{min-width:90px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td{text-align:center}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-spacer{font-weight:bold}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-meridian .mat-button{min-width:64px;line-height:36px;min-width:0;border-radius:50%;width:36px;height:36px;padding:0;flex-shrink:0}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button{height:24px;width:24px;line-height:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button .mat-icon{font-size:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-form-field{width:20px;max-width:20px;text-align:center}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.NgxMatDateAdapter, decorators: [{
                    type: Optional
                }] }, { type: i0.ChangeDetectorRef }, { type: i2.FormBuilder }]; }, propDecorators: { disabled: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXBpY2tlci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9wcm9qZWN0cy9kYXRldGltZS1waWNrZXIvc3JjL2xpYi90aW1lcGlja2VyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uL3Byb2plY3RzL2RhdGV0aW1lLXBpY2tlci9zcmMvbGliL3RpbWVwaWNrZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFvQyxTQUFTLEVBQWMsVUFBVSxFQUFFLEtBQUssRUFBcUIsUUFBUSxFQUFpQixTQUFTLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDckwsT0FBTyxFQUFnRCxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3RyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQy9CLE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFekQsT0FBTyxFQUFFLDBCQUEwQixFQUFFLFlBQVksRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDOzs7Ozs7Ozs7QUFtQjlNLE1BQU0sT0FBTyx5QkFBeUI7SUFzRHBDLFlBQStCLFlBQWtDLEVBQ3ZELEVBQXFCLEVBQVUsV0FBd0I7UUFEbEMsaUJBQVksR0FBWixZQUFZLENBQXNCO1FBQ3ZELE9BQUUsR0FBRixFQUFFLENBQW1CO1FBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWE7UUFuRHhELGFBQVEsR0FBRyxLQUFLLENBQUM7UUFDakIsaUJBQVksR0FBRyxJQUFJLENBQUM7UUFDcEIsYUFBUSxHQUFXLFlBQVksQ0FBQztRQUNoQyxlQUFVLEdBQVcsWUFBWSxDQUFDO1FBQ2xDLGVBQVUsR0FBVyxZQUFZLENBQUM7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RUFBRSxvQkFBb0I7cUJBQzlCLGFBQ1U7d0JBQ1Q7NEJBQ0UsT0FBTyxFQUFFLGlCQUFpQjs0QkFDMUIsV0FBVyxFQUFFLFVBQVUsRUFBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUM7NEJBQ3hELEtBQUssRUFBRSxJQUFJO3lCQUNaO3FCQUNGLFlBQ1Msa0JBQWtCLGlCQUNiLGlCQUFpQixDQUFDLElBQUk7OzBCQXdEeEIsUUFBUTtzR0FsRFosUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLFFBQVE7c0JBQWhCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQXFDa0IsU0FBUztzQkFBaEMsU0FBUzt1QkFBQyxXQUFXO2dCQUNJLFdBQVc7c0JBQXBDLFNBQVM7dUJBQUMsYUFBYTtnQkFDRSxXQUFXO3NCQUFwQyxTQUFTO3VCQUFDLGFBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZnRlclZpZXdJbml0LCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBmb3J3YXJkUmVmLCBJbnB1dCwgT25DaGFuZ2VzLCBPbkluaXQsIE9wdGlvbmFsLCBTaW1wbGVDaGFuZ2VzLCBWaWV3Q2hpbGQsIFZpZXdFbmNhcHN1bGF0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBGb3JtQnVpbGRlciwgRm9ybUdyb3VwLCBOR19WQUxVRV9BQ0NFU1NPUiwgVmFsaWRhdG9ycyB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcclxuaW1wb3J0IHsgVGhlbWVQYWxldHRlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvY29yZSc7XHJcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgZGVib3VuY2VUaW1lLCB0YWtlVW50aWwgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XHJcbmltcG9ydCB7IE5neE1hdERhdGVBZGFwdGVyIH0gZnJvbSAnLi9jb3JlL2RhdGUtYWRhcHRlcic7XHJcbmltcG9ydCB7IGNyZWF0ZU1pc3NpbmdEYXRlSW1wbEVycm9yLCBERUZBVUxUX1NURVAsIGZvcm1hdFR3b0RpZ2l0VGltZVZhbHVlLCBMSU1JVF9USU1FUywgTUVSSURJQU5TLCBOVU1FUklDX1JFR0VYLCBQQVRURVJOX0lOUFVUX0hPVVIsIFBBVFRFUk5fSU5QVVRfTUlOVVRFLCBQQVRURVJOX0lOUFVUX1NFQ09ORCB9IGZyb20gJy4vdXRpbHMvZGF0ZS11dGlscyc7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ25neC1tYXQtdGltZXBpY2tlcicsXHJcbiAgdGVtcGxhdGVVcmw6ICcuL3RpbWVwaWNrZXIuY29tcG9uZW50Lmh0bWwnLFxyXG4gIHN0eWxlVXJsczogWycuL3RpbWVwaWNrZXIuY29tcG9uZW50LnNjc3MnXSxcclxuICBob3N0OiB7XHJcbiAgICAnY2xhc3MnOiAnbmd4LW1hdC10aW1lcGlja2VyJ1xyXG4gIH0sXHJcbiAgcHJvdmlkZXJzOiBbXHJcbiAgICB7XHJcbiAgICAgIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxyXG4gICAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBOZ3hNYXRUaW1lcGlja2VyQ29tcG9uZW50KSxcclxuICAgICAgbXVsdGk6IHRydWVcclxuICAgIH1cclxuICBdLFxyXG4gIGV4cG9ydEFzOiAnbmd4TWF0VGltZXBpY2tlcicsXHJcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcclxufSlcclxuZXhwb3J0IGNsYXNzIE5neE1hdFRpbWVwaWNrZXJDb21wb25lbnQ8RD4gaW1wbGVtZW50cyBDb250cm9sVmFsdWVBY2Nlc3NvciwgT25Jbml0LCBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMge1xyXG5cclxuICBwdWJsaWMgZm9ybTogRm9ybUdyb3VwO1xyXG5cclxuICBASW5wdXQoKSBkaXNhYmxlZCA9IGZhbHNlO1xyXG4gIEBJbnB1dCgpIHNob3dTcGlubmVycyA9IHRydWU7XHJcbiAgQElucHV0KCkgc3RlcEhvdXI6IG51bWJlciA9IERFRkFVTFRfU1RFUDtcclxuICBASW5wdXQoKSBzdGVwTWludXRlOiBudW1iZXIgPSBERUZBVUxUX1NURVA7XHJcbiAgQElucHV0KCkgc3RlcFNlY29uZDogbnVtYmVyID0gREVGQVVMVF9TVEVQO1xyXG4gIEBJbnB1dCgpIHNob3dTZWNvbmRzID0gZmFsc2U7XHJcbiAgQElucHV0KCkgZGlzYWJsZU1pbnV0ZSA9IGZhbHNlO1xyXG4gIEBJbnB1dCgpIGVuYWJsZU1lcmlkaWFuID0gZmFsc2U7XHJcbiAgQElucHV0KCkgZGVmYXVsdFRpbWU6IG51bWJlcltdO1xyXG4gIEBJbnB1dCgpIGNvbG9yOiBUaGVtZVBhbGV0dGUgPSAncHJpbWFyeSc7XHJcblxyXG4gIHB1YmxpYyBtZXJpZGlhbjogc3RyaW5nID0gTUVSSURJQU5TLkFNO1xyXG5cclxuICAvKiogSG91ciAqL1xyXG4gIHByaXZhdGUgZ2V0IGhvdXIoKSB7XHJcbiAgICBsZXQgdmFsID0gTnVtYmVyKHRoaXMuZm9ybS5jb250cm9sc1snaG91ciddLnZhbHVlKTtcclxuICAgIHJldHVybiBpc05hTih2YWwpID8gMCA6IHZhbDtcclxuICB9O1xyXG5cclxuICBwcml2YXRlIGdldCBtaW51dGUoKSB7XHJcbiAgICBsZXQgdmFsID0gTnVtYmVyKHRoaXMuZm9ybS5jb250cm9sc1snbWludXRlJ10udmFsdWUpO1xyXG4gICAgcmV0dXJuIGlzTmFOKHZhbCkgPyAwIDogdmFsO1xyXG4gIH07XHJcblxyXG4gIHByaXZhdGUgZ2V0IHNlY29uZCgpIHtcclxuICAgIGxldCB2YWwgPSBOdW1iZXIodGhpcy5mb3JtLmNvbnRyb2xzWydzZWNvbmQnXS52YWx1ZSk7XHJcbiAgICByZXR1cm4gaXNOYU4odmFsKSA/IDAgOiB2YWw7XHJcbiAgfTtcclxuXHJcbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoZSBmb3JtIGlzIHZhbGlkICovXHJcbiAgcHVibGljIGdldCB2YWxpZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmZvcm0udmFsaWQ7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9vbkNoYW5nZTogYW55ID0gKCkgPT4geyB9O1xyXG4gIHByaXZhdGUgX29uVG91Y2hlZDogYW55ID0gKCkgPT4geyB9O1xyXG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuO1xyXG4gIHByaXZhdGUgX21vZGVsOiBEO1xyXG5cclxuICBwcml2YXRlIF9kZXN0cm95ZWQ6IFN1YmplY3Q8dm9pZD4gPSBuZXcgU3ViamVjdDx2b2lkPigpO1xyXG5cclxuICBwdWJsaWMgcGF0dGVybiA9IFBBVFRFUk5fSU5QVVRfSE9VUjtcclxuXHJcbiAgLyoqIFVzZWQgdG8gYXV0byBzd2l0Y2ggZm9jdXMgd2hlbiBpbnB1dCAyIG51bWJlciBpbiB0aW1lIGlucHV0cyAqL1xyXG4gIHByaXZhdGUgaW5wdXRGaWVsZHM6IEFycmF5PEhUTUxJbnB1dEVsZW1lbnQ+O1xyXG5cclxuICBAVmlld0NoaWxkKFwiaW5wdXRIb3VyXCIpIGlucHV0SG91cjogRWxlbWVudFJlZjtcclxuICBAVmlld0NoaWxkKFwiaW5wdXRNaW51dGVcIikgaW5wdXRNaW51dGU6IEVsZW1lbnRSZWY7XHJcbiAgQFZpZXdDaGlsZChcImlucHV0U2Vjb25kXCIpIGlucHV0U2Vjb25kOiBFbGVtZW50UmVmO1xyXG5cclxuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBwdWJsaWMgX2RhdGVBZGFwdGVyOiBOZ3hNYXREYXRlQWRhcHRlcjxEPixcclxuICAgIHByaXZhdGUgY2Q6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIGZvcm1CdWlsZGVyOiBGb3JtQnVpbGRlcikge1xyXG4gICAgaWYgKCF0aGlzLl9kYXRlQWRhcHRlcikge1xyXG4gICAgICB0aHJvdyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvcignTmd4TWF0RGF0ZUFkYXB0ZXInKTtcclxuICAgIH1cclxuICAgIHRoaXMuZm9ybSA9IHRoaXMuZm9ybUJ1aWxkZXIuZ3JvdXAoXHJcbiAgICAgIHtcclxuICAgICAgICBob3VyOiBbeyB2YWx1ZTogbnVsbCwgZGlzYWJsZWQ6IHRoaXMuZGlzYWJsZWQgfSwgW1ZhbGlkYXRvcnMucmVxdWlyZWQsIFZhbGlkYXRvcnMucGF0dGVybihQQVRURVJOX0lOUFVUX0hPVVIpXV0sXHJcbiAgICAgICAgbWludXRlOiBbeyB2YWx1ZTogbnVsbCwgZGlzYWJsZWQ6IHRoaXMuZGlzYWJsZWQgfSwgW1ZhbGlkYXRvcnMucmVxdWlyZWQsIFZhbGlkYXRvcnMucGF0dGVybihQQVRURVJOX0lOUFVUX01JTlVURSldXSxcclxuICAgICAgICBzZWNvbmQ6IFt7IHZhbHVlOiBudWxsLCBkaXNhYmxlZDogdGhpcy5kaXNhYmxlZCB9LCBbVmFsaWRhdG9ycy5yZXF1aXJlZCwgVmFsaWRhdG9ycy5wYXR0ZXJuKFBBVFRFUk5fSU5QVVRfU0VDT05EKV1dXHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgbmdPbkluaXQoKSB7XHJcbiAgICB0aGlzLmZvcm0udmFsdWVDaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCksIGRlYm91bmNlVGltZSg0MDApKS5zdWJzY3JpYmUodmFsID0+IHtcclxuICAgICAgdGhpcy5fdXBkYXRlTW9kZWwoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlclZpZXdJbml0KCkge1xyXG4gICAgdGhpcy5pbnB1dEZpZWxkcyA9IFtcclxuICAgICAgdGhpcy5pbnB1dEhvdXIubmF0aXZlRWxlbWVudCxcclxuICAgICAgdGhpcy5pbnB1dE1pbnV0ZS5uYXRpdmVFbGVtZW50LFxyXG4gICAgXTtcclxuICAgIGlmICh0aGlzLnNob3dTZWNvbmRzKSB7XHJcbiAgICAgIHRoaXMuaW5wdXRGaWVsZHMucHVzaCh0aGlzLmlucHV0U2Vjb25kLm5hdGl2ZUVsZW1lbnQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xyXG4gICAgaWYgKGNoYW5nZXMuZGlzYWJsZWQgfHwgY2hhbmdlcy5kaXNhYmxlTWludXRlKSB7XHJcbiAgICAgIHRoaXMuX3NldERpc2FibGVTdGF0ZXMoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIG5nT25EZXN0cm95KCkge1xyXG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcclxuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV3JpdGVzIGEgbmV3IHZhbHVlIHRvIHRoZSBlbGVtZW50LlxyXG4gICAqIEBwYXJhbSBvYmpcclxuICAgKi9cclxuICB3cml0ZVZhbHVlKHZhbDogRCk6IHZvaWQge1xyXG4gICAgaWYgKHZhbCAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuX21vZGVsID0gdmFsO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fbW9kZWwgPSB0aGlzLl9kYXRlQWRhcHRlci50b2RheSgpO1xyXG4gICAgICBpZiAodGhpcy5kZWZhdWx0VGltZSAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuc2V0VGltZUJ5RGVmYXVsdFZhbHVlcyh0aGlzLl9tb2RlbCwgdGhpcy5kZWZhdWx0VGltZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuX3VwZGF0ZUhvdXJNaW51dGVTZWNvbmQoKTtcclxuICB9XHJcblxyXG4gIC8qKiBSZWdpc3RlcnMgYSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250cm9sJ3MgdmFsdWUgY2hhbmdlcyBpbiB0aGUgVUkuICovXHJcbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKF86IGFueSkgPT4ge30pOiB2b2lkIHtcclxuICAgIHRoaXMuX29uQ2hhbmdlID0gZm47XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBjb250cm9sIHJlY2VpdmVzIGEgdG91Y2ggZXZlbnQuXHJcbiAgICovXHJcbiAgcmVnaXN0ZXJPblRvdWNoZWQoZm46ICgpID0+IHt9KTogdm9pZCB7XHJcbiAgICB0aGlzLl9vblRvdWNoZWQgPSBmbjtcclxuICB9XHJcblxyXG4gIC8qKiBFbmFibGVzIG9yIGRpc2FibGVzIHRoZSBhcHByb3ByaWF0ZSBET00gZWxlbWVudCAqL1xyXG4gIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgdGhpcy5fZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xyXG4gICAgdGhpcy5jZC5tYXJrRm9yQ2hlY2soKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcm1hdCBpbnB1dFxyXG4gICAqIEBwYXJhbSBpbnB1dCBcclxuICAgKi9cclxuICBwdWJsaWMgZm9ybWF0SW5wdXQoaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQpIHtcclxuICAgIGlucHV0LnZhbHVlID0gaW5wdXQudmFsdWUucmVwbGFjZShOVU1FUklDX1JFR0VYLCAnJyk7XHJcblxyXG4gICAgLy8gSWYgaW5wdXQgbGVuZ3RoIGlzIDIsIHN3aXRjaCBmb2N1cyB0byB0aGUgbmV4dCA8aW5wdXQ+XHJcbiAgICBpZiAoaW5wdXQudmFsdWUubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgIGNvbnN0IGlucHV0SW5kZXggPSB0aGlzLmlucHV0RmllbGRzLmZpbmRJbmRleChpbnB1dEZpZWxkID0+IGlucHV0RmllbGQgPT09IGlucHV0KTtcclxuXHJcbiAgICAgIGlmIChpbnB1dEluZGV4ICE9PSAtMSAmJiBpbnB1dEluZGV4ICE9PSB0aGlzLmlucHV0RmllbGRzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICB0aGlzLmlucHV0RmllbGRzW2lucHV0SW5kZXggKyAxXS5mb2N1cygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiogVG9nZ2xlIG1lcmlkaWFuICovXHJcbiAgcHVibGljIHRvZ2dsZU1lcmlkaWFuKCkge1xyXG4gICAgdGhpcy5tZXJpZGlhbiA9ICh0aGlzLm1lcmlkaWFuID09PSBNRVJJRElBTlMuQU0pID8gTUVSSURJQU5TLlBNIDogTUVSSURJQU5TLkFNO1xyXG4gICAgdGhpcy5jaGFuZ2UoJ2hvdXInKTtcclxuICB9XHJcblxyXG4gIC8qKiBDaGFuZ2UgcHJvcGVydHkgb2YgdGltZSAqL1xyXG4gIHB1YmxpYyBjaGFuZ2UocHJvcDogc3RyaW5nLCB1cD86IGJvb2xlYW4pIHtcclxuICAgIGNvbnN0IG5leHQgPSB0aGlzLl9nZXROZXh0VmFsdWVCeVByb3AocHJvcCwgdXApO1xyXG4gICAgdGhpcy5mb3JtLmNvbnRyb2xzW3Byb3BdLnNldFZhbHVlKGZvcm1hdFR3b0RpZ2l0VGltZVZhbHVlKG5leHQpLCB7IG9ubHlTZWxmOiBmYWxzZSwgZW1pdEV2ZW50OiBmYWxzZSB9KTtcclxuICAgIHRoaXMuX3VwZGF0ZU1vZGVsKCk7XHJcbiAgfVxyXG5cclxuICAvKiogVXBkYXRlIGNvbnRyb2xzIG9mIGZvcm0gYnkgbW9kZWwgKi9cclxuICBwcml2YXRlIF91cGRhdGVIb3VyTWludXRlU2Vjb25kKCkge1xyXG4gICAgbGV0IF9ob3VyID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0SG91cih0aGlzLl9tb2RlbCk7XHJcbiAgICBjb25zdCBfbWludXRlID0gdGhpcy5fZGF0ZUFkYXB0ZXIuZ2V0TWludXRlKHRoaXMuX21vZGVsKTtcclxuICAgIGNvbnN0IF9zZWNvbmQgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRTZWNvbmQodGhpcy5fbW9kZWwpO1xyXG5cclxuICAgIGlmICh0aGlzLmVuYWJsZU1lcmlkaWFuKSB7XHJcbiAgICAgIGlmIChfaG91ciA+PSBMSU1JVF9USU1FUy5tZXJpZGlhbikge1xyXG4gICAgICAgIF9ob3VyID0gX2hvdXIgLSBMSU1JVF9USU1FUy5tZXJpZGlhbjtcclxuICAgICAgICB0aGlzLm1lcmlkaWFuID0gTUVSSURJQU5TLlBNO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubWVyaWRpYW4gPSBNRVJJRElBTlMuQU07XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF9ob3VyID09PSAwKSB7XHJcbiAgICAgICAgX2hvdXIgPSBMSU1JVF9USU1FUy5tZXJpZGlhbjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZm9ybS5jb250cm9sc1snaG91ciddLnNldFZhbHVlKGZvcm1hdFR3b0RpZ2l0VGltZVZhbHVlKF9ob3VyKSk7XHJcbiAgICB0aGlzLmZvcm0uY29udHJvbHNbJ21pbnV0ZSddLnNldFZhbHVlKGZvcm1hdFR3b0RpZ2l0VGltZVZhbHVlKF9taW51dGUpKTtcclxuICAgIHRoaXMuZm9ybS5jb250cm9sc1snc2Vjb25kJ10uc2V0VmFsdWUoZm9ybWF0VHdvRGlnaXRUaW1lVmFsdWUoX3NlY29uZCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqIFVwZGF0ZSBtb2RlbCAqL1xyXG4gIHByaXZhdGUgX3VwZGF0ZU1vZGVsKCkge1xyXG4gICAgbGV0IF9ob3VyID0gdGhpcy5ob3VyO1xyXG5cclxuICAgIGlmICh0aGlzLmVuYWJsZU1lcmlkaWFuKSB7XHJcbiAgICAgIGlmICh0aGlzLm1lcmlkaWFuID09PSBNRVJJRElBTlMuQU0gJiYgX2hvdXIgPT09IExJTUlUX1RJTUVTLm1lcmlkaWFuKSB7XHJcbiAgICAgICAgX2hvdXIgPSAwO1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWVyaWRpYW4gPT09IE1FUklESUFOUy5QTSAmJiBfaG91ciAhPT0gTElNSVRfVElNRVMubWVyaWRpYW4pIHtcclxuICAgICAgICBfaG91ciA9IF9ob3VyICsgTElNSVRfVElNRVMubWVyaWRpYW47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9kYXRlQWRhcHRlci5zZXRIb3VyKHRoaXMuX21vZGVsLCBfaG91cik7XHJcbiAgICB0aGlzLl9kYXRlQWRhcHRlci5zZXRNaW51dGUodGhpcy5fbW9kZWwsIHRoaXMubWludXRlKTtcclxuICAgIHRoaXMuX2RhdGVBZGFwdGVyLnNldFNlY29uZCh0aGlzLl9tb2RlbCwgdGhpcy5zZWNvbmQpO1xyXG4gICAgdGhpcy5fb25DaGFuZ2UodGhpcy5fbW9kZWwpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IG5leHQgdmFsdWUgYnkgcHJvcGVydHlcclxuICAgKiBAcGFyYW0gcHJvcCBcclxuICAgKiBAcGFyYW0gdXBcclxuICAgKi9cclxuICBwcml2YXRlIF9nZXROZXh0VmFsdWVCeVByb3AocHJvcDogc3RyaW5nLCB1cD86IGJvb2xlYW4pOiBudW1iZXIge1xyXG4gICAgY29uc3Qga2V5UHJvcCA9IHByb3BbMF0udG9VcHBlckNhc2UoKSArIHByb3Auc2xpY2UoMSk7XHJcbiAgICBjb25zdCBtaW4gPSBMSU1JVF9USU1FU1tgbWluJHtrZXlQcm9wfWBdO1xyXG4gICAgbGV0IG1heCA9IExJTUlUX1RJTUVTW2BtYXgke2tleVByb3B9YF07XHJcblxyXG4gICAgaWYgKHByb3AgPT09ICdob3VyJyAmJiB0aGlzLmVuYWJsZU1lcmlkaWFuKSB7XHJcbiAgICAgIG1heCA9IExJTUlUX1RJTUVTLm1lcmlkaWFuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBuZXh0O1xyXG4gICAgaWYgKHVwID09IG51bGwpIHtcclxuICAgICAgbmV4dCA9IHRoaXNbcHJvcF0gJSAobWF4KTtcclxuICAgICAgaWYgKHByb3AgPT09ICdob3VyJyAmJiB0aGlzLmVuYWJsZU1lcmlkaWFuKSB7XHJcbiAgICAgICAgaWYgKG5leHQgPT09IDApIG5leHQgPSBtYXg7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG5leHQgPSB1cCA/IHRoaXNbcHJvcF0gKyB0aGlzW2BzdGVwJHtrZXlQcm9wfWBdIDogdGhpc1twcm9wXSAtIHRoaXNbYHN0ZXAke2tleVByb3B9YF07XHJcbiAgICAgIGlmIChwcm9wID09PSAnaG91cicgJiYgdGhpcy5lbmFibGVNZXJpZGlhbikge1xyXG4gICAgICAgIG5leHQgPSBuZXh0ICUgKG1heCArIDEpO1xyXG4gICAgICAgIGlmIChuZXh0ID09PSAwKSBuZXh0ID0gdXAgPyAxIDogbWF4O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5leHQgPSBuZXh0ICUgbWF4O1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh1cCkge1xyXG4gICAgICAgIG5leHQgPSBuZXh0ID4gbWF4ID8gKG5leHQgLSBtYXggKyBtaW4pIDogbmV4dDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuZXh0ID0gbmV4dCA8IG1pbiA/IChuZXh0IC0gbWluICsgbWF4KSA6IG5leHQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5leHQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgZGlzYWJsZSBzdGF0ZXNcclxuICAgKi9cclxuICBwcml2YXRlIF9zZXREaXNhYmxlU3RhdGVzKCkge1xyXG4gICAgaWYgKHRoaXMuZGlzYWJsZWQpIHtcclxuICAgICAgdGhpcy5mb3JtLmRpc2FibGUoKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmZvcm0uZW5hYmxlKCk7XHJcbiAgICAgIGlmICh0aGlzLmRpc2FibGVNaW51dGUpIHtcclxuICAgICAgICB0aGlzLmZvcm0uZ2V0KCdtaW51dGUnKS5kaXNhYmxlKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuc2hvd1NlY29uZHMpIHtcclxuICAgICAgICAgIHRoaXMuZm9ybS5nZXQoJ3NlY29uZCcpLmRpc2FibGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcbiIsIjxmb3JtIFtmb3JtR3JvdXBdPVwiZm9ybVwiPlxyXG4gIDx0YWJsZSBjbGFzcz1cIm5neC1tYXQtdGltZXBpY2tlci10YWJsZVwiPlxyXG4gICAgPHRib2R5IGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLXRib2R5XCI+XHJcbiAgICAgIDx0ciAqbmdJZj1cInNob3dTcGlubmVyc1wiPlxyXG4gICAgICAgIDx0ZD5cclxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG1hdC1pY29uLWJ1dHRvbiBhcmlhLWxhYmVsPVwiZXhwYW5kX2xlc3MgaWNvblwiIChjbGljayk9XCJjaGFuZ2UoJ2hvdXInLCB0cnVlKVwiXHJcbiAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZFwiPlxyXG4gICAgICAgICAgICA8bWF0LWljb24+ZXhwYW5kX2xlc3M8L21hdC1pY29uPlxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPC90ZD5cclxuICAgICAgICA8dGQ+PC90ZD5cclxuICAgICAgICA8dGQ+XHJcbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBtYXQtaWNvbi1idXR0b24gYXJpYS1sYWJlbD1cImV4cGFuZF9sZXNzIGljb25cIiAoY2xpY2spPVwiY2hhbmdlKCdtaW51dGUnLCB0cnVlKVwiXHJcbiAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZCB8fCBkaXNhYmxlTWludXRlXCI+XHJcbiAgICAgICAgICAgIDxtYXQtaWNvbj5leHBhbmRfbGVzczwvbWF0LWljb24+XHJcbiAgICAgICAgICA8L2J1dHRvbj4gPC90ZD5cclxuICAgICAgICA8dGQ+PC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJzaG93U2Vjb25kc1wiPlxyXG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgbWF0LWljb24tYnV0dG9uIGFyaWEtbGFiZWw9XCJleHBhbmRfbGVzcyBpY29uXCIgKGNsaWNrKT1cImNoYW5nZSgnc2Vjb25kJywgdHJ1ZSlcIlxyXG4gICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWQgfHwgZGlzYWJsZU1pbnV0ZVwiPlxyXG4gICAgICAgICAgICA8bWF0LWljb24+ZXhwYW5kX2xlc3M8L21hdC1pY29uPlxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJlbmFibGVNZXJpZGlhblwiIGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLXNwYWNlclwiPjwvdGQ+XHJcbiAgICAgICAgPHRkICpuZ0lmPVwiZW5hYmxlTWVyaWRpYW5cIj48L3RkPlxyXG4gICAgICA8L3RyPlxyXG5cclxuICAgICAgPHRyPlxyXG4gICAgICAgIDx0ZD5cclxuICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBhcHBlYXJhbmNlPVwibGVnYWN5XCI+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiICNpbnB1dEhvdXIgbWF0SW5wdXQgKGlucHV0KT1cImZvcm1hdElucHV0KCRhbnkoJGV2ZW50KS50YXJnZXQpXCIgbWF4bGVuZ3RoPVwiMlwiIGZvcm1Db250cm9sTmFtZT1cImhvdXJcIiBhdXRvY29tcGxldGU9XCJmYWxzZVwiIG5hbWU9XCJcIlxyXG4gICAgICAgICAgICAgIChrZXlkb3duLkFycm93VXApPVwiY2hhbmdlKCdob3VyJywgdHJ1ZSk7ICRldmVudC5wcmV2ZW50RGVmYXVsdCgpXCIgKGZvY3VzKT1cImlucHV0SG91ci5zZWxlY3QoKVwiXHJcbiAgICAgICAgICAgICAgKGtleWRvd24uQXJyb3dEb3duKT1cImNoYW5nZSgnaG91cicsIGZhbHNlKTsgJGV2ZW50LnByZXZlbnREZWZhdWx0KClcIiAoYmx1cik9XCJjaGFuZ2UoJ2hvdXInKVwiPlxyXG4gICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cclxuICAgICAgICA8L3RkPlxyXG4gICAgICAgIDx0ZCBjbGFzcz1cIm5neC1tYXQtdGltZXBpY2tlci1zcGFjZXJcIj4mIzU4OzwvdGQ+XHJcbiAgICAgICAgPHRkPlxyXG4gICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGFwcGVhcmFuY2U9XCJsZWdhY3lcIj5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgI2lucHV0TWludXRlIG1hdElucHV0IChpbnB1dCk9XCJmb3JtYXRJbnB1dCgkYW55KCRldmVudCkudGFyZ2V0KVwiIG1heGxlbmd0aD1cIjJcIiBhdXRvY29tcGxldGU9XCJmYWxzZVwiIG5hbWU9XCJcIlxyXG4gICAgICAgICAgICAgIGZvcm1Db250cm9sTmFtZT1cIm1pbnV0ZVwiIChrZXlkb3duLkFycm93VXApPVwiY2hhbmdlKCdtaW51dGUnLCB0cnVlKTsgJGV2ZW50LnByZXZlbnREZWZhdWx0KClcIiAoZm9jdXMpPVwiaW5wdXRNaW51dGUuc2VsZWN0KClcIlxyXG4gICAgICAgICAgICAgIChrZXlkb3duLkFycm93RG93bik9XCJjaGFuZ2UoJ21pbnV0ZScsIGZhbHNlKTsgJGV2ZW50LnByZXZlbnREZWZhdWx0KClcIiAoYmx1cik9XCJjaGFuZ2UoJ21pbnV0ZScpXCI+XHJcbiAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxyXG4gICAgICAgIDwvdGQ+XHJcbiAgICAgICAgPHRkICpuZ0lmPVwic2hvd1NlY29uZHNcIiBjbGFzcz1cIm5neC1tYXQtdGltZXBpY2tlci1zcGFjZXJcIj4mIzU4OzwvdGQ+XHJcbiAgICAgICAgPHRkICpuZ0lmPVwic2hvd1NlY29uZHNcIj5cclxuICAgICAgICAgIDxtYXQtZm9ybS1maWVsZCBhcHBlYXJhbmNlPVwibGVnYWN5XCI+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiICNpbnB1dFNlY29uZCBtYXRJbnB1dCAoaW5wdXQpPVwiZm9ybWF0SW5wdXQoJGFueSgkZXZlbnQpLnRhcmdldClcIiBtYXhsZW5ndGg9XCIyXCIgYXV0b2NvbXBsZXRlPVwiZmFsc2VcIiBuYW1lPVwiXCJcclxuICAgICAgICAgICAgICBmb3JtQ29udHJvbE5hbWU9XCJzZWNvbmRcIiAoa2V5ZG93bi5BcnJvd1VwKT1cImNoYW5nZSgnc2Vjb25kJywgdHJ1ZSk7ICRldmVudC5wcmV2ZW50RGVmYXVsdCgpXCIgKGZvY3VzKT1cImlucHV0U2Vjb25kLnNlbGVjdCgpXCJcclxuICAgICAgICAgICAgICAoa2V5ZG93bi5BcnJvd0Rvd24pPVwiY2hhbmdlKCdzZWNvbmQnLCBmYWxzZSk7ICRldmVudC5wcmV2ZW50RGVmYXVsdCgpXCIgKGJsdXIpPVwiY2hhbmdlKCdzZWNvbmQnKVwiPlxyXG4gICAgICAgICAgPC9tYXQtZm9ybS1maWVsZD5cclxuICAgICAgICA8L3RkPlxyXG5cclxuICAgICAgICA8dGQgKm5nSWY9XCJlbmFibGVNZXJpZGlhblwiIGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLXNwYWNlclwiPjwvdGQ+XHJcbiAgICAgICAgPHRkICpuZ0lmPVwiZW5hYmxlTWVyaWRpYW5cIiBjbGFzcz1cIm5neC1tYXQtdGltZXBpY2tlci1tZXJpZGlhblwiPlxyXG4gICAgICAgICAgPGJ1dHRvbiBtYXQtYnV0dG9uIChjbGljayk9XCJ0b2dnbGVNZXJpZGlhbigpXCIgbWF0LXN0cm9rZWQtYnV0dG9uIFtjb2xvcl09XCJjb2xvclwiIFtkaXNhYmxlZF09XCJkaXNhYmxlZFwiPlxyXG4gICAgICAgICAgICB7e21lcmlkaWFufX1cclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDwvdGQ+XHJcbiAgICAgIDwvdHI+XHJcblxyXG4gICAgICA8dHIgKm5nSWY9XCJzaG93U3Bpbm5lcnNcIj5cclxuICAgICAgICA8dGQ+XHJcbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBtYXQtaWNvbi1idXR0b24gYXJpYS1sYWJlbD1cImV4cGFuZF9tb3JlIGljb25cIiAoY2xpY2spPVwiY2hhbmdlKCdob3VyJywgZmFsc2UpXCJcclxuICAgICAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCI+XHJcbiAgICAgICAgICAgIDxtYXQtaWNvbj5leHBhbmRfbW9yZTwvbWF0LWljb24+XHJcbiAgICAgICAgICA8L2J1dHRvbj4gPC90ZD5cclxuICAgICAgICA8dGQ+PC90ZD5cclxuICAgICAgICA8dGQ+XHJcbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBtYXQtaWNvbi1idXR0b24gYXJpYS1sYWJlbD1cImV4cGFuZF9tb3JlIGljb25cIiAoY2xpY2spPVwiY2hhbmdlKCdtaW51dGUnLCBmYWxzZSlcIlxyXG4gICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWQgfHwgZGlzYWJsZU1pbnV0ZVwiPlxyXG4gICAgICAgICAgICA8bWF0LWljb24+ZXhwYW5kX21vcmU8L21hdC1pY29uPlxyXG4gICAgICAgICAgPC9idXR0b24+IDwvdGQ+XHJcbiAgICAgICAgPHRkICpuZ0lmPVwic2hvd1NlY29uZHNcIj48L3RkPlxyXG4gICAgICAgIDx0ZCAqbmdJZj1cInNob3dTZWNvbmRzXCI+XHJcbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBtYXQtaWNvbi1idXR0b24gYXJpYS1sYWJlbD1cImV4cGFuZF9tb3JlIGljb25cIiAoY2xpY2spPVwiY2hhbmdlKCdzZWNvbmQnLCBmYWxzZSlcIlxyXG4gICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWQgfHwgZGlzYWJsZU1pbnV0ZVwiPlxyXG4gICAgICAgICAgICA8bWF0LWljb24+ZXhwYW5kX21vcmU8L21hdC1pY29uPlxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJlbmFibGVNZXJpZGlhblwiIGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLXNwYWNlclwiPjwvdGQ+XHJcbiAgICAgICAgPHRkICpuZ0lmPVwiZW5hYmxlTWVyaWRpYW5cIj48L3RkPlxyXG4gICAgICA8L3RyPlxyXG4gICAgPC90Ym9keT5cclxuICA8L3RhYmxlPlxyXG48L2Zvcm0+Il19