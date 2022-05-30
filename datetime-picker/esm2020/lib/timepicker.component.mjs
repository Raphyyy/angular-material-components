import { Component, forwardRef, Input, Optional, ViewEncapsulation } from '@angular/core';
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
    ], exportAs: ["ngxMatTimepicker"], usesOnChanges: true, ngImport: i0, template: "<form [formGroup]=\"form\">\r\n  <table class=\"ngx-mat-timepicker-table\">\r\n    <tbody class=\"ngx-mat-timepicker-tbody\">\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('hour', true)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('minute', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('second', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n\r\n      <tr>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputHour matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" formControlName=\"hour\"\r\n              (keydown.ArrowUp)=\"change('hour', true); $event.preventDefault()\" (focus)=\"inputHour.select()\"\r\n              (keydown.ArrowDown)=\"change('hour', false); $event.preventDefault()\" (blur)=\"change('hour')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputMinute matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\"\r\n              formControlName=\"minute\" (keydown.ArrowUp)=\"change('minute', true); $event.preventDefault()\" (focus)=\"inputMinute.select()\"\r\n              (keydown.ArrowDown)=\"change('minute', false); $event.preventDefault()\" (blur)=\"change('minute')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td *ngIf=\"showSeconds\" class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputSecond matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\"\r\n              formControlName=\"second\" (keydown.ArrowUp)=\"change('second', true); $event.preventDefault()\" (focus)=\"inputSecond.select()\"\r\n              (keydown.ArrowDown)=\"change('second', false); $event.preventDefault()\" (blur)=\"change('second')\">\r\n          </mat-form-field>\r\n        </td>\r\n\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-meridian\">\r\n          <button mat-button (click)=\"toggleMeridian()\" mat-stroked-button [color]=\"color\" [disabled]=\"disabled\">\r\n            {{meridian}}\r\n          </button>\r\n        </td>\r\n      </tr>\r\n\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('hour', false)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('minute', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td *ngIf=\"showSeconds\"></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('second', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n</form>", styles: [".ngx-mat-timepicker{font-size:13px}.ngx-mat-timepicker form{min-width:90px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td{text-align:center}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-spacer{font-weight:bold}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-meridian .mat-button{min-width:64px;line-height:36px;min-width:0;border-radius:50%;width:36px;height:36px;padding:0;flex-shrink:0}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button{height:24px;width:24px;line-height:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button .mat-icon{font-size:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-form-field{width:20px;max-width:20px;text-align:center}\n"], components: [{ type: i3.MatButton, selector: "button[mat-button], button[mat-raised-button], button[mat-icon-button],             button[mat-fab], button[mat-mini-fab], button[mat-stroked-button],             button[mat-flat-button]", inputs: ["disabled", "disableRipple", "color"], exportAs: ["matButton"] }, { type: i4.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { type: i5.MatFormField, selector: "mat-form-field", inputs: ["color", "appearance", "hideRequiredMarker", "hintLabel", "floatLabel"], exportAs: ["matFormField"] }], directives: [{ type: i2.ɵNgNoValidate, selector: "form:not([ngNoForm]):not([ngNativeValidate])" }, { type: i2.NgControlStatusGroup, selector: "[formGroupName],[formArrayName],[ngModelGroup],[formGroup],form:not([ngNoForm]),[ngForm]" }, { type: i2.FormGroupDirective, selector: "[formGroup]", inputs: ["formGroup"], outputs: ["ngSubmit"], exportAs: ["ngForm"] }, { type: i6.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i7.MatInput, selector: "input[matInput], textarea[matInput], select[matNativeControl],      input[matNativeControl], textarea[matNativeControl]", inputs: ["disabled", "id", "placeholder", "required", "type", "errorStateMatcher", "aria-describedby", "value", "readonly"], exportAs: ["matInput"] }, { type: i2.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i2.MaxLengthValidator, selector: "[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]", inputs: ["maxlength"] }, { type: i2.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i2.FormControlName, selector: "[formControlName]", inputs: ["formControlName", "disabled", "ngModel"], outputs: ["ngModelChange"] }], encapsulation: i0.ViewEncapsulation.None });
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
                    ], exportAs: 'ngxMatTimepicker', encapsulation: ViewEncapsulation.None, template: "<form [formGroup]=\"form\">\r\n  <table class=\"ngx-mat-timepicker-table\">\r\n    <tbody class=\"ngx-mat-timepicker-tbody\">\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('hour', true)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('minute', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_less icon\" (click)=\"change('second', true)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_less</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n\r\n      <tr>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputHour matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\" formControlName=\"hour\"\r\n              (keydown.ArrowUp)=\"change('hour', true); $event.preventDefault()\" (focus)=\"inputHour.select()\"\r\n              (keydown.ArrowDown)=\"change('hour', false); $event.preventDefault()\" (blur)=\"change('hour')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td>\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputMinute matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\"\r\n              formControlName=\"minute\" (keydown.ArrowUp)=\"change('minute', true); $event.preventDefault()\" (focus)=\"inputMinute.select()\"\r\n              (keydown.ArrowDown)=\"change('minute', false); $event.preventDefault()\" (blur)=\"change('minute')\">\r\n          </mat-form-field>\r\n        </td>\r\n        <td *ngIf=\"showSeconds\" class=\"ngx-mat-timepicker-spacer\">&#58;</td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <mat-form-field appearance=\"legacy\">\r\n            <input type=\"text\" #inputSecond matInput (input)=\"formatInput($any($event).target)\" maxlength=\"2\"\r\n              formControlName=\"second\" (keydown.ArrowUp)=\"change('second', true); $event.preventDefault()\" (focus)=\"inputSecond.select()\"\r\n              (keydown.ArrowDown)=\"change('second', false); $event.preventDefault()\" (blur)=\"change('second')\">\r\n          </mat-form-field>\r\n        </td>\r\n\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-meridian\">\r\n          <button mat-button (click)=\"toggleMeridian()\" mat-stroked-button [color]=\"color\" [disabled]=\"disabled\">\r\n            {{meridian}}\r\n          </button>\r\n        </td>\r\n      </tr>\r\n\r\n      <tr *ngIf=\"showSpinners\">\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('hour', false)\"\r\n            [disabled]=\"disabled\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td></td>\r\n        <td>\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('minute', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button> </td>\r\n        <td *ngIf=\"showSeconds\"></td>\r\n        <td *ngIf=\"showSeconds\">\r\n          <button type=\"button\" mat-icon-button aria-label=\"expand_more icon\" (click)=\"change('second', false)\"\r\n            [disabled]=\"disabled || disableMinute\">\r\n            <mat-icon>expand_more</mat-icon>\r\n          </button>\r\n        </td>\r\n        <td *ngIf=\"enableMeridian\" class=\"ngx-mat-timepicker-spacer\"></td>\r\n        <td *ngIf=\"enableMeridian\"></td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n</form>", styles: [".ngx-mat-timepicker{font-size:13px}.ngx-mat-timepicker form{min-width:90px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td{text-align:center}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-spacer{font-weight:bold}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td.ngx-mat-timepicker-meridian .mat-button{min-width:64px;line-height:36px;min-width:0;border-radius:50%;width:36px;height:36px;padding:0;flex-shrink:0}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button{height:24px;width:24px;line-height:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-icon-button .mat-icon{font-size:24px}.ngx-mat-timepicker form .ngx-mat-timepicker-table .ngx-mat-timepicker-tbody tr td .mat-form-field{width:20px;max-width:20px;text-align:center}\n"] }]
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
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXBpY2tlci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9wcm9qZWN0cy9kYXRldGltZS1waWNrZXIvc3JjL2xpYi90aW1lcGlja2VyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uL3Byb2plY3RzL2RhdGV0aW1lLXBpY2tlci9zcmMvbGliL3RpbWVwaWNrZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFxQixTQUFTLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBcUIsUUFBUSxFQUFpQixpQkFBaUIsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMvSSxPQUFPLEVBQWdELGlCQUFpQixFQUFFLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRTdHLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDL0IsT0FBTyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUV6RCxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsWUFBWSxFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7Ozs7Ozs7OztBQW1COU0sTUFBTSxPQUFPLHlCQUF5QjtJQStDcEMsWUFBK0IsWUFBa0MsRUFDdkQsRUFBcUIsRUFBVSxXQUF3QjtRQURsQyxpQkFBWSxHQUFaLFlBQVksQ0FBc0I7UUFDdkQsT0FBRSxHQUFGLEVBQUUsQ0FBbUI7UUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQTVDeEQsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUNqQixpQkFBWSxHQUFHLElBQUksQ0FBQztRQUNwQixhQUFRLEdBQVcsWUFBWSxDQUFDO1FBQ2hDLGVBQVUsR0FBVyxZQUFZLENBQUM7UUFDbEMsZUFBVSxHQUFXLFlBQVksQ0FBQztRQUNsQyxnQkFB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Q2xDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtvQkFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ25DO2FBQ0Y7U0FDRjtJQUNILENBQUM7OzRKQXBPVSx5QkFBeUI7Z0pBQXpCLHlCQUF5QixpWEFWekI7UUFDVDtZQUNFLE9BQU8sRUFBRSxpQkFBaUI7WUFDMUIsV0FBVyxFQUFFLFVBQVUsRUFBQyxHQUFHLEVBQUUsQ0FBQyx5QkFBeUIsRUFBQztZQUN4RCxLQUFLLEVBQUUsSUFBSTtTQUNaO0tBQ0YsK0VDckJILDR2SUFvRk87MkZEM0RNLHlCQUF5QjtrQkFqQnJDLFNBQVM7K0JBQ0Usb0JBQW9CLFFBR3hCO3dCQUNKLE9BQU8sRUFBRSxvQkFBb0I7cUJBQzlCLGFBQ1U7d0JBQ1Q7NEJBQ0UsT0FBTyxFQUFFLGlCQUFpQjs0QkFDMUIsV0FBVyxFQUFFLFVBQVUsRUFBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUM7NEJBQ3hELEtBQUssRUFBRSxJQUFJO3lCQUNaO3FCQUNGLFlBQ1Msa0JBQWtCLGlCQUNiLGlCQUFpQixDQUFDLElBQUk7OzBCQWlEeEIsUUFBUTtzR0EzQ1osUUFBUTtzQkFBaEIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLFFBQVE7c0JBQWhCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csYUFBYTtzQkFBckIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudCwgZm9yd2FyZFJlZiwgSW5wdXQsIE9uQ2hhbmdlcywgT25Jbml0LCBPcHRpb25hbCwgU2ltcGxlQ2hhbmdlcywgVmlld0VuY2Fwc3VsYXRpb24gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgQ29udHJvbFZhbHVlQWNjZXNzb3IsIEZvcm1CdWlsZGVyLCBGb3JtR3JvdXAsIE5HX1ZBTFVFX0FDQ0VTU09SLCBWYWxpZGF0b3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBUaGVtZVBhbGV0dGUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9jb3JlJztcclxuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBkZWJvdW5jZVRpbWUsIHRha2VVbnRpbCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZUFkYXB0ZXIgfSBmcm9tICcuL2NvcmUvZGF0ZS1hZGFwdGVyJztcclxuaW1wb3J0IHsgY3JlYXRlTWlzc2luZ0RhdGVJbXBsRXJyb3IsIERFRkFVTFRfU1RFUCwgZm9ybWF0VHdvRGlnaXRUaW1lVmFsdWUsIExJTUlUX1RJTUVTLCBNRVJJRElBTlMsIE5VTUVSSUNfUkVHRVgsIFBBVFRFUk5fSU5QVVRfSE9VUiwgUEFUVEVSTl9JTlBVVF9NSU5VVEUsIFBBVFRFUk5fSU5QVVRfU0VDT05EIH0gZnJvbSAnLi91dGlscy9kYXRlLXV0aWxzJztcclxuXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnbmd4LW1hdC10aW1lcGlja2VyJyxcclxuICB0ZW1wbGF0ZVVybDogJy4vdGltZXBpY2tlci5jb21wb25lbnQuaHRtbCcsXHJcbiAgc3R5bGVVcmxzOiBbJy4vdGltZXBpY2tlci5jb21wb25lbnQuc2NzcyddLFxyXG4gIGhvc3Q6IHtcclxuICAgICdjbGFzcyc6ICduZ3gtbWF0LXRpbWVwaWNrZXInXHJcbiAgfSxcclxuICBwcm92aWRlcnM6IFtcclxuICAgIHtcclxuICAgICAgcHJvdmlkZTogTkdfVkFMVUVfQUNDRVNTT1IsXHJcbiAgICAgIHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IE5neE1hdFRpbWVwaWNrZXJDb21wb25lbnQpLFxyXG4gICAgICBtdWx0aTogdHJ1ZVxyXG4gICAgfVxyXG4gIF0sXHJcbiAgZXhwb3J0QXM6ICduZ3hNYXRUaW1lcGlja2VyJyxcclxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgTmd4TWF0VGltZXBpY2tlckNvbXBvbmVudDxEPiBpbXBsZW1lbnRzIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBPbkluaXQsIE9uQ2hhbmdlcyB7XHJcblxyXG4gIHB1YmxpYyBmb3JtOiBGb3JtR3JvdXA7XHJcblxyXG4gIEBJbnB1dCgpIGRpc2FibGVkID0gZmFsc2U7XHJcbiAgQElucHV0KCkgc2hvd1NwaW5uZXJzID0gdHJ1ZTtcclxuICBASW5wdXQoKSBzdGVwSG91cjogbnVtYmVyID0gREVGQVVMVF9TVEVQO1xyXG4gIEBJbnB1dCgpIHN0ZXBNaW51dGU6IG51bWJlciA9IERFRkFVTFRfU1RFUDtcclxuICBASW5wdXQoKSBzdGVwU2Vjb25kOiBudW1iZXIgPSBERUZBVUxUX1NURVA7XHJcbiAgQElucHV0KCkgc2hvd1NlY29uZHMgPSBmYWxzZTtcclxuICBASW5wdXQoKSBkaXNhYmxlTWludXRlID0gZmFsc2U7XHJcbiAgQElucHV0KCkgZW5hYmxlTWVyaWRpYW4gPSBmYWxzZTtcclxuICBASW5wdXQoKSBkZWZhdWx0VGltZTogbnVtYmVyW107XHJcbiAgQElucHV0KCkgY29sb3I6IFRoZW1lUGFsZXR0ZSA9ICdwcmltYXJ5JztcclxuXHJcbiAgcHVibGljIG1lcmlkaWFuOiBzdHJpbmcgPSBNRVJJRElBTlMuQU07XHJcblxyXG4gIC8qKiBIb3VyICovXHJcbiAgcHJpdmF0ZSBnZXQgaG91cigpIHtcclxuICAgIGxldCB2YWwgPSBOdW1iZXIodGhpcy5mb3JtLmNvbnRyb2xzWydob3VyJ10udmFsdWUpO1xyXG4gICAgcmV0dXJuIGlzTmFOKHZhbCkgPyAwIDogdmFsO1xyXG4gIH07XHJcblxyXG4gIHByaXZhdGUgZ2V0IG1pbnV0ZSgpIHtcclxuICAgIGxldCB2YWwgPSBOdW1iZXIodGhpcy5mb3JtLmNvbnRyb2xzWydtaW51dGUnXS52YWx1ZSk7XHJcbiAgICByZXR1cm4gaXNOYU4odmFsKSA/IDAgOiB2YWw7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBnZXQgc2Vjb25kKCkge1xyXG4gICAgbGV0IHZhbCA9IE51bWJlcih0aGlzLmZvcm0uY29udHJvbHNbJ3NlY29uZCddLnZhbHVlKTtcclxuICAgIHJldHVybiBpc05hTih2YWwpID8gMCA6IHZhbDtcclxuICB9O1xyXG5cclxuICAvKiogV2hldGhlciBvciBub3QgdGhlIGZvcm0gaXMgdmFsaWQgKi9cclxuICBwdWJsaWMgZ2V0IHZhbGlkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZm9ybS52YWxpZDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX29uQ2hhbmdlOiBhbnkgPSAoKSA9PiB7IH07XHJcbiAgcHJpdmF0ZSBfb25Ub3VjaGVkOiBhbnkgPSAoKSA9PiB7IH07XHJcbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW47XHJcbiAgcHJpdmF0ZSBfbW9kZWw6IEQ7XHJcblxyXG4gIHByaXZhdGUgX2Rlc3Ryb3llZDogU3ViamVjdDx2b2lkPiA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XHJcblxyXG4gIHB1YmxpYyBwYXR0ZXJuID0gUEFUVEVSTl9JTlBVVF9IT1VSO1xyXG5cclxuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBwdWJsaWMgX2RhdGVBZGFwdGVyOiBOZ3hNYXREYXRlQWRhcHRlcjxEPixcclxuICAgIHByaXZhdGUgY2Q6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIGZvcm1CdWlsZGVyOiBGb3JtQnVpbGRlcikge1xyXG4gICAgaWYgKCF0aGlzLl9kYXRlQWRhcHRlcikge1xyXG4gICAgICB0aHJvdyBjcmVhdGVNaXNzaW5nRGF0ZUltcGxFcnJvcignTmd4TWF0RGF0ZUFkYXB0ZXInKTtcclxuICAgIH1cclxuICAgIHRoaXMuZm9ybSA9IHRoaXMuZm9ybUJ1aWxkZXIuZ3JvdXAoXHJcbiAgICAgIHtcclxuICAgICAgICBob3VyOiBbeyB2YWx1ZTogbnVsbCwgZGlzYWJsZWQ6IHRoaXMuZGlzYWJsZWQgfSwgW1ZhbGlkYXRvcnMucmVxdWlyZWQsIFZhbGlkYXRvcnMucGF0dGVybihQQVRURVJOX0lOUFVUX0hPVVIpXV0sXHJcbiAgICAgICAgbWludXRlOiBbeyB2YWx1ZTogbnVsbCwgZGlzYWJsZWQ6IHRoaXMuZGlzYWJsZWQgfSwgW1ZhbGlkYXRvcnMucmVxdWlyZWQsIFZhbGlkYXRvcnMucGF0dGVybihQQVRURVJOX0lOUFVUX01JTlVURSldXSxcclxuICAgICAgICBzZWNvbmQ6IFt7IHZhbHVlOiBudWxsLCBkaXNhYmxlZDogdGhpcy5kaXNhYmxlZCB9LCBbVmFsaWRhdG9ycy5yZXF1aXJlZCwgVmFsaWRhdG9ycy5wYXR0ZXJuKFBBVFRFUk5fSU5QVVRfU0VDT05EKV1dXHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgbmdPbkluaXQoKSB7XHJcbiAgICB0aGlzLmZvcm0udmFsdWVDaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCksIGRlYm91bmNlVGltZSg0MDApKS5zdWJzY3JpYmUodmFsID0+IHtcclxuICAgICAgdGhpcy5fdXBkYXRlTW9kZWwoKTtcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XHJcbiAgICBpZiAoY2hhbmdlcy5kaXNhYmxlZCB8fCBjaGFuZ2VzLmRpc2FibGVNaW51dGUpIHtcclxuICAgICAgdGhpcy5fc2V0RGlzYWJsZVN0YXRlcygpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbmdPbkRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xyXG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBXcml0ZXMgYSBuZXcgdmFsdWUgdG8gdGhlIGVsZW1lbnQuXHJcbiAgICogQHBhcmFtIG9ialxyXG4gICAqL1xyXG4gIHdyaXRlVmFsdWUodmFsOiBEKTogdm9pZCB7XHJcbiAgICBpZiAodmFsICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5fbW9kZWwgPSB2YWw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9tb2RlbCA9IHRoaXMuX2RhdGVBZGFwdGVyLnRvZGF5KCk7XHJcbiAgICAgIGlmICh0aGlzLmRlZmF1bHRUaW1lICE9IG51bGwpIHtcclxuICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5zZXRUaW1lQnlEZWZhdWx0VmFsdWVzKHRoaXMuX21vZGVsLCB0aGlzLmRlZmF1bHRUaW1lKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5fdXBkYXRlSG91ck1pbnV0ZVNlY29uZCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRyb2wncyB2YWx1ZSBjaGFuZ2VzIGluIHRoZSBVSS4gKi9cclxuICByZWdpc3Rlck9uQ2hhbmdlKGZuOiAoXzogYW55KSA9PiB7fSk6IHZvaWQge1xyXG4gICAgdGhpcy5fb25DaGFuZ2UgPSBmbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGNvbnRyb2wgcmVjZWl2ZXMgYSB0b3VjaCBldmVudC5cclxuICAgKi9cclxuICByZWdpc3Rlck9uVG91Y2hlZChmbjogKCkgPT4ge30pOiB2b2lkIHtcclxuICAgIHRoaXMuX29uVG91Y2hlZCA9IGZuO1xyXG4gIH1cclxuXHJcbiAgLyoqIEVuYWJsZXMgb3IgZGlzYWJsZXMgdGhlIGFwcHJvcHJpYXRlIERPTSBlbGVtZW50ICovXHJcbiAgc2V0RGlzYWJsZWRTdGF0ZShpc0Rpc2FibGVkOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XHJcbiAgICB0aGlzLmNkLm1hcmtGb3JDaGVjaygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRm9ybWF0IGlucHV0XHJcbiAgICogQHBhcmFtIGlucHV0IFxyXG4gICAqL1xyXG4gIHB1YmxpYyBmb3JtYXRJbnB1dChpbnB1dDogSFRNTElucHV0RWxlbWVudCkge1xyXG4gICAgaW5wdXQudmFsdWUgPSBpbnB1dC52YWx1ZS5yZXBsYWNlKE5VTUVSSUNfUkVHRVgsICcnKTtcclxuICB9XHJcblxyXG4gIC8qKiBUb2dnbGUgbWVyaWRpYW4gKi9cclxuICBwdWJsaWMgdG9nZ2xlTWVyaWRpYW4oKSB7XHJcbiAgICB0aGlzLm1lcmlkaWFuID0gKHRoaXMubWVyaWRpYW4gPT09IE1FUklESUFOUy5BTSkgPyBNRVJJRElBTlMuUE0gOiBNRVJJRElBTlMuQU07XHJcbiAgICB0aGlzLmNoYW5nZSgnaG91cicpO1xyXG4gIH1cclxuXHJcbiAgLyoqIENoYW5nZSBwcm9wZXJ0eSBvZiB0aW1lICovXHJcbiAgcHVibGljIGNoYW5nZShwcm9wOiBzdHJpbmcsIHVwPzogYm9vbGVhbikge1xyXG4gICAgY29uc3QgbmV4dCA9IHRoaXMuX2dldE5leHRWYWx1ZUJ5UHJvcChwcm9wLCB1cCk7XHJcbiAgICB0aGlzLmZvcm0uY29udHJvbHNbcHJvcF0uc2V0VmFsdWUoZm9ybWF0VHdvRGlnaXRUaW1lVmFsdWUobmV4dCksIHsgb25seVNlbGY6IGZhbHNlLCBlbWl0RXZlbnQ6IGZhbHNlIH0pO1xyXG4gICAgdGhpcy5fdXBkYXRlTW9kZWwoKTtcclxuICB9XHJcblxyXG4gIC8qKiBVcGRhdGUgY29udHJvbHMgb2YgZm9ybSBieSBtb2RlbCAqL1xyXG4gIHByaXZhdGUgX3VwZGF0ZUhvdXJNaW51dGVTZWNvbmQoKSB7XHJcbiAgICBsZXQgX2hvdXIgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRIb3VyKHRoaXMuX21vZGVsKTtcclxuICAgIGNvbnN0IF9taW51dGUgPSB0aGlzLl9kYXRlQWRhcHRlci5nZXRNaW51dGUodGhpcy5fbW9kZWwpO1xyXG4gICAgY29uc3QgX3NlY29uZCA9IHRoaXMuX2RhdGVBZGFwdGVyLmdldFNlY29uZCh0aGlzLl9tb2RlbCk7XHJcblxyXG4gICAgaWYgKHRoaXMuZW5hYmxlTWVyaWRpYW4pIHtcclxuICAgICAgaWYgKF9ob3VyID49IExJTUlUX1RJTUVTLm1lcmlkaWFuKSB7XHJcbiAgICAgICAgX2hvdXIgPSBfaG91ciAtIExJTUlUX1RJTUVTLm1lcmlkaWFuO1xyXG4gICAgICAgIHRoaXMubWVyaWRpYW4gPSBNRVJJRElBTlMuUE07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5tZXJpZGlhbiA9IE1FUklESUFOUy5BTTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoX2hvdXIgPT09IDApIHtcclxuICAgICAgICBfaG91ciA9IExJTUlUX1RJTUVTLm1lcmlkaWFuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5mb3JtLmNvbnRyb2xzWydob3VyJ10uc2V0VmFsdWUoZm9ybWF0VHdvRGlnaXRUaW1lVmFsdWUoX2hvdXIpKTtcclxuICAgIHRoaXMuZm9ybS5jb250cm9sc1snbWludXRlJ10uc2V0VmFsdWUoZm9ybWF0VHdvRGlnaXRUaW1lVmFsdWUoX21pbnV0ZSkpO1xyXG4gICAgdGhpcy5mb3JtLmNvbnRyb2xzWydzZWNvbmQnXS5zZXRWYWx1ZShmb3JtYXRUd29EaWdpdFRpbWVWYWx1ZShfc2Vjb25kKSk7XHJcbiAgfVxyXG5cclxuICAvKiogVXBkYXRlIG1vZGVsICovXHJcbiAgcHJpdmF0ZSBfdXBkYXRlTW9kZWwoKSB7XHJcbiAgICBsZXQgX2hvdXIgPSB0aGlzLmhvdXI7XHJcblxyXG4gICAgaWYgKHRoaXMuZW5hYmxlTWVyaWRpYW4pIHtcclxuICAgICAgaWYgKHRoaXMubWVyaWRpYW4gPT09IE1FUklESUFOUy5BTSAmJiBfaG91ciA9PT0gTElNSVRfVElNRVMubWVyaWRpYW4pIHtcclxuICAgICAgICBfaG91ciA9IDA7XHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tZXJpZGlhbiA9PT0gTUVSSURJQU5TLlBNICYmIF9ob3VyICE9PSBMSU1JVF9USU1FUy5tZXJpZGlhbikge1xyXG4gICAgICAgIF9ob3VyID0gX2hvdXIgKyBMSU1JVF9USU1FUy5tZXJpZGlhbjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2RhdGVBZGFwdGVyLnNldEhvdXIodGhpcy5fbW9kZWwsIF9ob3VyKTtcclxuICAgIHRoaXMuX2RhdGVBZGFwdGVyLnNldE1pbnV0ZSh0aGlzLl9tb2RlbCwgdGhpcy5taW51dGUpO1xyXG4gICAgdGhpcy5fZGF0ZUFkYXB0ZXIuc2V0U2Vjb25kKHRoaXMuX21vZGVsLCB0aGlzLnNlY29uZCk7XHJcbiAgICB0aGlzLl9vbkNoYW5nZSh0aGlzLl9tb2RlbCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgbmV4dCB2YWx1ZSBieSBwcm9wZXJ0eVxyXG4gICAqIEBwYXJhbSBwcm9wIFxyXG4gICAqIEBwYXJhbSB1cFxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2dldE5leHRWYWx1ZUJ5UHJvcChwcm9wOiBzdHJpbmcsIHVwPzogYm9vbGVhbik6IG51bWJlciB7XHJcbiAgICBjb25zdCBrZXlQcm9wID0gcHJvcFswXS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKTtcclxuICAgIGNvbnN0IG1pbiA9IExJTUlUX1RJTUVTW2BtaW4ke2tleVByb3B9YF07XHJcbiAgICBsZXQgbWF4ID0gTElNSVRfVElNRVNbYG1heCR7a2V5UHJvcH1gXTtcclxuXHJcbiAgICBpZiAocHJvcCA9PT0gJ2hvdXInICYmIHRoaXMuZW5hYmxlTWVyaWRpYW4pIHtcclxuICAgICAgbWF4ID0gTElNSVRfVElNRVMubWVyaWRpYW47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG5leHQ7XHJcbiAgICBpZiAodXAgPT0gbnVsbCkge1xyXG4gICAgICBuZXh0ID0gdGhpc1twcm9wXSAlIChtYXgpO1xyXG4gICAgICBpZiAocHJvcCA9PT0gJ2hvdXInICYmIHRoaXMuZW5hYmxlTWVyaWRpYW4pIHtcclxuICAgICAgICBpZiAobmV4dCA9PT0gMCkgbmV4dCA9IG1heDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbmV4dCA9IHVwID8gdGhpc1twcm9wXSArIHRoaXNbYHN0ZXAke2tleVByb3B9YF0gOiB0aGlzW3Byb3BdIC0gdGhpc1tgc3RlcCR7a2V5UHJvcH1gXTtcclxuICAgICAgaWYgKHByb3AgPT09ICdob3VyJyAmJiB0aGlzLmVuYWJsZU1lcmlkaWFuKSB7XHJcbiAgICAgICAgbmV4dCA9IG5leHQgJSAobWF4ICsgMSk7XHJcbiAgICAgICAgaWYgKG5leHQgPT09IDApIG5leHQgPSB1cCA/IDEgOiBtYXg7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmV4dCA9IG5leHQgJSBtYXg7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHVwKSB7XHJcbiAgICAgICAgbmV4dCA9IG5leHQgPiBtYXggPyAobmV4dCAtIG1heCArIG1pbikgOiBuZXh0O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5leHQgPSBuZXh0IDwgbWluID8gKG5leHQgLSBtaW4gKyBtYXgpIDogbmV4dDtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV4dDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCBkaXNhYmxlIHN0YXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgX3NldERpc2FibGVTdGF0ZXMoKSB7XHJcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xyXG4gICAgICB0aGlzLmZvcm0uZGlzYWJsZSgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuZm9ybS5lbmFibGUoKTtcclxuICAgICAgaWYgKHRoaXMuZGlzYWJsZU1pbnV0ZSkge1xyXG4gICAgICAgIHRoaXMuZm9ybS5nZXQoJ21pbnV0ZScpLmRpc2FibGUoKTtcclxuICAgICAgICBpZiAodGhpcy5zaG93U2Vjb25kcykge1xyXG4gICAgICAgICAgdGhpcy5mb3JtLmdldCgnc2Vjb25kJykuZGlzYWJsZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuIiwiPGZvcm0gW2Zvcm1Hcm91cF09XCJmb3JtXCI+XHJcbiAgPHRhYmxlIGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLXRhYmxlXCI+XHJcbiAgICA8dGJvZHkgY2xhc3M9XCJuZ3gtbWF0LXRpbWVwaWNrZXItdGJvZHlcIj5cclxuICAgICAgPHRyICpuZ0lmPVwic2hvd1NwaW5uZXJzXCI+XHJcbiAgICAgICAgPHRkPlxyXG4gICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgbWF0LWljb24tYnV0dG9uIGFyaWEtbGFiZWw9XCJleHBhbmRfbGVzcyBpY29uXCIgKGNsaWNrKT1cImNoYW5nZSgnaG91cicsIHRydWUpXCJcclxuICAgICAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCI+XHJcbiAgICAgICAgICAgIDxtYXQtaWNvbj5leHBhbmRfbGVzczwvbWF0LWljb24+XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L3RkPlxyXG4gICAgICAgIDx0ZD48L3RkPlxyXG4gICAgICAgIDx0ZD5cclxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG1hdC1pY29uLWJ1dHRvbiBhcmlhLWxhYmVsPVwiZXhwYW5kX2xlc3MgaWNvblwiIChjbGljayk9XCJjaGFuZ2UoJ21pbnV0ZScsIHRydWUpXCJcclxuICAgICAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkIHx8IGRpc2FibGVNaW51dGVcIj5cclxuICAgICAgICAgICAgPG1hdC1pY29uPmV4cGFuZF9sZXNzPC9tYXQtaWNvbj5cclxuICAgICAgICAgIDwvYnV0dG9uPiA8L3RkPlxyXG4gICAgICAgIDx0ZD48L3RkPlxyXG4gICAgICAgIDx0ZCAqbmdJZj1cInNob3dTZWNvbmRzXCI+XHJcbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBtYXQtaWNvbi1idXR0b24gYXJpYS1sYWJlbD1cImV4cGFuZF9sZXNzIGljb25cIiAoY2xpY2spPVwiY2hhbmdlKCdzZWNvbmQnLCB0cnVlKVwiXHJcbiAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZCB8fCBkaXNhYmxlTWludXRlXCI+XHJcbiAgICAgICAgICAgIDxtYXQtaWNvbj5leHBhbmRfbGVzczwvbWF0LWljb24+XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L3RkPlxyXG4gICAgICAgIDx0ZCAqbmdJZj1cImVuYWJsZU1lcmlkaWFuXCIgY2xhc3M9XCJuZ3gtbWF0LXRpbWVwaWNrZXItc3BhY2VyXCI+PC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJlbmFibGVNZXJpZGlhblwiPjwvdGQ+XHJcbiAgICAgIDwvdHI+XHJcblxyXG4gICAgICA8dHI+XHJcbiAgICAgICAgPHRkPlxyXG4gICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGFwcGVhcmFuY2U9XCJsZWdhY3lcIj5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgI2lucHV0SG91ciBtYXRJbnB1dCAoaW5wdXQpPVwiZm9ybWF0SW5wdXQoJGFueSgkZXZlbnQpLnRhcmdldClcIiBtYXhsZW5ndGg9XCIyXCIgZm9ybUNvbnRyb2xOYW1lPVwiaG91clwiXHJcbiAgICAgICAgICAgICAgKGtleWRvd24uQXJyb3dVcCk9XCJjaGFuZ2UoJ2hvdXInLCB0cnVlKTsgJGV2ZW50LnByZXZlbnREZWZhdWx0KClcIiAoZm9jdXMpPVwiaW5wdXRIb3VyLnNlbGVjdCgpXCJcclxuICAgICAgICAgICAgICAoa2V5ZG93bi5BcnJvd0Rvd24pPVwiY2hhbmdlKCdob3VyJywgZmFsc2UpOyAkZXZlbnQucHJldmVudERlZmF1bHQoKVwiIChibHVyKT1cImNoYW5nZSgnaG91cicpXCI+XHJcbiAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxyXG4gICAgICAgIDwvdGQ+XHJcbiAgICAgICAgPHRkIGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLXNwYWNlclwiPiYjNTg7PC90ZD5cclxuICAgICAgICA8dGQ+XHJcbiAgICAgICAgICA8bWF0LWZvcm0tZmllbGQgYXBwZWFyYW5jZT1cImxlZ2FjeVwiPlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiAjaW5wdXRNaW51dGUgbWF0SW5wdXQgKGlucHV0KT1cImZvcm1hdElucHV0KCRhbnkoJGV2ZW50KS50YXJnZXQpXCIgbWF4bGVuZ3RoPVwiMlwiXHJcbiAgICAgICAgICAgICAgZm9ybUNvbnRyb2xOYW1lPVwibWludXRlXCIgKGtleWRvd24uQXJyb3dVcCk9XCJjaGFuZ2UoJ21pbnV0ZScsIHRydWUpOyAkZXZlbnQucHJldmVudERlZmF1bHQoKVwiIChmb2N1cyk9XCJpbnB1dE1pbnV0ZS5zZWxlY3QoKVwiXHJcbiAgICAgICAgICAgICAgKGtleWRvd24uQXJyb3dEb3duKT1cImNoYW5nZSgnbWludXRlJywgZmFsc2UpOyAkZXZlbnQucHJldmVudERlZmF1bHQoKVwiIChibHVyKT1cImNoYW5nZSgnbWludXRlJylcIj5cclxuICAgICAgICAgIDwvbWF0LWZvcm0tZmllbGQ+XHJcbiAgICAgICAgPC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJzaG93U2Vjb25kc1wiIGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLXNwYWNlclwiPiYjNTg7PC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJzaG93U2Vjb25kc1wiPlxyXG4gICAgICAgICAgPG1hdC1mb3JtLWZpZWxkIGFwcGVhcmFuY2U9XCJsZWdhY3lcIj5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgI2lucHV0U2Vjb25kIG1hdElucHV0IChpbnB1dCk9XCJmb3JtYXRJbnB1dCgkYW55KCRldmVudCkudGFyZ2V0KVwiIG1heGxlbmd0aD1cIjJcIlxyXG4gICAgICAgICAgICAgIGZvcm1Db250cm9sTmFtZT1cInNlY29uZFwiIChrZXlkb3duLkFycm93VXApPVwiY2hhbmdlKCdzZWNvbmQnLCB0cnVlKTsgJGV2ZW50LnByZXZlbnREZWZhdWx0KClcIiAoZm9jdXMpPVwiaW5wdXRTZWNvbmQuc2VsZWN0KClcIlxyXG4gICAgICAgICAgICAgIChrZXlkb3duLkFycm93RG93bik9XCJjaGFuZ2UoJ3NlY29uZCcsIGZhbHNlKTsgJGV2ZW50LnByZXZlbnREZWZhdWx0KClcIiAoYmx1cik9XCJjaGFuZ2UoJ3NlY29uZCcpXCI+XHJcbiAgICAgICAgICA8L21hdC1mb3JtLWZpZWxkPlxyXG4gICAgICAgIDwvdGQ+XHJcblxyXG4gICAgICAgIDx0ZCAqbmdJZj1cImVuYWJsZU1lcmlkaWFuXCIgY2xhc3M9XCJuZ3gtbWF0LXRpbWVwaWNrZXItc3BhY2VyXCI+PC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJlbmFibGVNZXJpZGlhblwiIGNsYXNzPVwibmd4LW1hdC10aW1lcGlja2VyLW1lcmlkaWFuXCI+XHJcbiAgICAgICAgICA8YnV0dG9uIG1hdC1idXR0b24gKGNsaWNrKT1cInRvZ2dsZU1lcmlkaWFuKClcIiBtYXQtc3Ryb2tlZC1idXR0b24gW2NvbG9yXT1cImNvbG9yXCIgW2Rpc2FibGVkXT1cImRpc2FibGVkXCI+XHJcbiAgICAgICAgICAgIHt7bWVyaWRpYW59fVxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPC90ZD5cclxuICAgICAgPC90cj5cclxuXHJcbiAgICAgIDx0ciAqbmdJZj1cInNob3dTcGlubmVyc1wiPlxyXG4gICAgICAgIDx0ZD5cclxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG1hdC1pY29uLWJ1dHRvbiBhcmlhLWxhYmVsPVwiZXhwYW5kX21vcmUgaWNvblwiIChjbGljayk9XCJjaGFuZ2UoJ2hvdXInLCBmYWxzZSlcIlxyXG4gICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIj5cclxuICAgICAgICAgICAgPG1hdC1pY29uPmV4cGFuZF9tb3JlPC9tYXQtaWNvbj5cclxuICAgICAgICAgIDwvYnV0dG9uPiA8L3RkPlxyXG4gICAgICAgIDx0ZD48L3RkPlxyXG4gICAgICAgIDx0ZD5cclxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG1hdC1pY29uLWJ1dHRvbiBhcmlhLWxhYmVsPVwiZXhwYW5kX21vcmUgaWNvblwiIChjbGljayk9XCJjaGFuZ2UoJ21pbnV0ZScsIGZhbHNlKVwiXHJcbiAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZCB8fCBkaXNhYmxlTWludXRlXCI+XHJcbiAgICAgICAgICAgIDxtYXQtaWNvbj5leHBhbmRfbW9yZTwvbWF0LWljb24+XHJcbiAgICAgICAgICA8L2J1dHRvbj4gPC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJzaG93U2Vjb25kc1wiPjwvdGQ+XHJcbiAgICAgICAgPHRkICpuZ0lmPVwic2hvd1NlY29uZHNcIj5cclxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG1hdC1pY29uLWJ1dHRvbiBhcmlhLWxhYmVsPVwiZXhwYW5kX21vcmUgaWNvblwiIChjbGljayk9XCJjaGFuZ2UoJ3NlY29uZCcsIGZhbHNlKVwiXHJcbiAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZCB8fCBkaXNhYmxlTWludXRlXCI+XHJcbiAgICAgICAgICAgIDxtYXQtaWNvbj5leHBhbmRfbW9yZTwvbWF0LWljb24+XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L3RkPlxyXG4gICAgICAgIDx0ZCAqbmdJZj1cImVuYWJsZU1lcmlkaWFuXCIgY2xhc3M9XCJuZ3gtbWF0LXRpbWVwaWNrZXItc3BhY2VyXCI+PC90ZD5cclxuICAgICAgICA8dGQgKm5nSWY9XCJlbmFibGVNZXJpZGlhblwiPjwvdGQ+XHJcbiAgICAgIDwvdHI+XHJcbiAgICA8L3Rib2R5PlxyXG4gIDwvdGFibGU+XHJcbjwvZm9ybT4iXX0=