import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ESCAPE, UP_ARROW } from '@angular/cdk/keycodes';
import { OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, Inject, Input, Optional, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { mixinColor } from '@angular/material/core';
import { matDatepickerAnimations, MAT_DATEPICKER_SCROLL_STRATEGY } from '@angular/material/datepicker';
import { merge, Subject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { NgxMatCalendar } from './calendar';
import { NgxMatTimepickerComponent } from './timepicker.component';
import { createMissingDateImplError, DEFAULT_STEP } from './utils/date-utils';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/portal";
import * as i3 from "@angular/forms";
import * as i4 from "@angular/material/icon";
import * as i5 from "@angular/material/button";
import * as i6 from "./timepicker.component";
import * as i7 from "./calendar";
import * as i8 from "@angular/material/dialog";
import * as i9 from "@angular/cdk/overlay";
import * as i10 from "./core/date-adapter";
import * as i11 from "@angular/cdk/bidi";
/** Used to generate a unique ID for each datepicker instance. */
let datepickerUid = 0;
// Boilerplate for applying mixins to MatDatepickerContent.
/** @docs-private */
const _MatDatetimepickerContentBase = mixinColor(class {
    _elementRef;
    constructor(_elementRef) {
        this._elementRef = _elementRef;
    }
});
/**
 * Component used as the content for the datepicker dialog and popup. We use this instead of using
 * NgxMatCalendar directly as the content so we can control the initial focus. This also gives us a
 * place to put additional features of the popup that are not part of the calendar itself in the
 * future. (e.g. confirmation buttons).
 * @docs-private
 */
export class NgxMatDatetimeContent extends _MatDatetimepickerContentBase {
    cd;
    _viewContainerRef;
    /** Reference to the internal calendar component. */
    _calendar;
    /** Reference to the internal time picker component. */
    _timePicker;
    /** Reference to the datepicker that created the overlay. */
    datepicker;
    /** Whether the datepicker is above or below the input. */
    _isAbove;
    /** Whether or not the selected date is valid (min,max...) */
    get valid() {
        if (this.datepicker.hideTime)
            return this.datepicker.valid;
        return this._timePicker && this._timePicker.valid && this.datepicker.valid;
    }
    get isViewMonth() {
        if (!this._calendar || this._calendar.currentView == null)
            return true;
        return this._calendar.currentView == 'month';
    }
    _templateCustomIconPortal;
    constructor(elementRef, cd, _viewContainerRef) {
        super(elementRef);
        this.cd = cd;
        this._viewContainerRef = _viewContainerRef;
    }
    ngAfterViewInit() {
        this._calendar.focusActiveCell();
        if (this.datepicker._customIcon) {
            this._templateCustomIconPortal = new TemplatePortal(this.datepicker._customIcon, this._viewContainerRef);
            this.cd.detectChanges();
        }
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimeContent, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i0.ViewContainerRef }], target: i0.ɵɵFactoryTarget.Component });
    /** @nocollapse */ static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.11", type: NgxMatDatetimeContent, selector: "ngx-mat-datetime-content", inputs: { color: "color" }, host: { properties: { "@transformPanel": "\"enter\"", "class.mat-datepicker-content-touch": "datepicker.touchUi" }, classAttribute: "mat-datepicker-content" }, viewQueries: [{ propertyName: "_calendar", first: true, predicate: NgxMatCalendar, descendants: true }, { propertyName: "_timePicker", first: true, predicate: NgxMatTimepickerComponent, descendants: true }], exportAs: ["ngxMatDatetimeContent"], usesInheritance: true, ngImport: i0, template: "<ngx-mat-calendar cdkTrapFocus [id]=\"datepicker.id\" [ngClass]=\"datepicker.panelClass\" [startAt]=\"datepicker.startAt\"\r\n    [startView]=\"datepicker.startView\" [minDate]=\"datepicker._minDate\" [maxDate]=\"datepicker._maxDate\"\r\n    [dateFilter]=\"datepicker._dateFilter\" [headerComponent]=\"datepicker.calendarHeaderComponent\"\r\n    [selected]=\"datepicker._selected\" [dateClass]=\"datepicker.dateClass\" [@fadeInCalendar]=\"'enter'\"\r\n    (selectedChange)=\"datepicker.select($event)\" (yearSelected)=\"datepicker._selectYear($event)\"\r\n    (monthSelected)=\"datepicker._selectMonth($event)\">\r\n</ngx-mat-calendar>\r\n<ng-container *ngIf=\"isViewMonth\">\r\n    <div *ngIf=\"!datepicker._hideTime\" class=\"time-container\" [class.disable-seconds]=\"!datepicker._showSeconds\">\r\n        <ngx-mat-timepicker [showSpinners]=\"datepicker._showSpinners\" [showSeconds]=\"datepicker._showSeconds\"\r\n            [disabled]=\"datepicker._disabled\" [stepHour]=\"datepicker._stepHour\" [stepMinute]=\"datepicker._stepMinute\"\r\n            [stepSecond]=\"datepicker._stepSecond\" [(ngModel)]=\"datepicker._selected\" [color]=\"datepicker._color\"\r\n            [enableMeridian]=\"datepicker._enableMeridian\" [disableMinute]=\"datepicker._disableMinute\">\r\n        </ngx-mat-timepicker>\r\n    </div>\r\n    <div class=\"actions\">\r\n        <button mat-button (click)=\"datepicker.ok()\" mat-stroked-button [color]=\"datepicker._color\" cdkFocusInitial\r\n            [disabled]=\"!valid\">\r\n            <mat-icon *ngIf=\"!datepicker._customIcon\">done</mat-icon>\r\n            <ng-template [cdkPortalOutlet]=\"_templateCustomIconPortal\"></ng-template>\r\n        </button>\r\n    </div>\r\n</ng-container>", styles: [".mat-datepicker-content{display:block;border-radius:4px;box-shadow:0 2px 4px -1px #0003,0 4px 5px #00000024,0 1px 10px #0000001f;background-color:#fff}.mat-datepicker-content .mat-calendar{width:296px}.mat-datepicker-content .time-container{display:flex;position:relative;padding-top:5px;justify-content:center}.mat-datepicker-content .time-container.disable-seconds .ngx-mat-timepicker .table{margin-left:9px}.mat-datepicker-content .time-container:before{content:\"\";position:absolute;top:0;left:0;right:0;height:1px;background-color:#0000001f}.mat-datepicker-content .actions{display:flex;padding:5px 15px 10px;justify-content:flex-end}\n"], dependencies: [{ kind: "directive", type: i1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.CdkPortalOutlet, selector: "[cdkPortalOutlet]", inputs: ["cdkPortalOutlet"], outputs: ["attached"], exportAs: ["cdkPortalOutlet"] }, { kind: "directive", type: i3.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i3.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i4.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { kind: "component", type: i5.MatButton, selector: "    button[mat-button], button[mat-raised-button], button[mat-flat-button],    button[mat-stroked-button]  ", exportAs: ["matButton"] }, { kind: "component", type: i6.NgxMatTimepickerComponent, selector: "ngx-mat-timepicker", inputs: ["disabled", "showSpinners", "stepHour", "stepMinute", "stepSecond", "showSeconds", "disableMinute", "enableMeridian", "defaultTime", "color"], exportAs: ["ngxMatTimepicker"] }, { kind: "component", type: i7.NgxMatCalendar, selector: "ngx-mat-calendar", inputs: ["headerComponent", "startAt", "startView", "selected", "minDate", "maxDate", "dateFilter", "dateClass"], outputs: ["selectedChange", "yearSelected", "monthSelected", "_userSelection"], exportAs: ["ngxMatCalendar"] }], animations: [
            matDatepickerAnimations.transformPanel,
            matDatepickerAnimations.fadeInCalendar,
        ], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimeContent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-mat-datetime-content', host: {
                        'class': 'mat-datepicker-content',
                        '[@transformPanel]': '"enter"',
                        '[class.mat-datepicker-content-touch]': 'datepicker.touchUi',
                    }, animations: [
                        matDatepickerAnimations.transformPanel,
                        matDatepickerAnimations.fadeInCalendar,
                    ], exportAs: 'ngxMatDatetimeContent', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, inputs: ['color'], template: "<ngx-mat-calendar cdkTrapFocus [id]=\"datepicker.id\" [ngClass]=\"datepicker.panelClass\" [startAt]=\"datepicker.startAt\"\r\n    [startView]=\"datepicker.startView\" [minDate]=\"datepicker._minDate\" [maxDate]=\"datepicker._maxDate\"\r\n    [dateFilter]=\"datepicker._dateFilter\" [headerComponent]=\"datepicker.calendarHeaderComponent\"\r\n    [selected]=\"datepicker._selected\" [dateClass]=\"datepicker.dateClass\" [@fadeInCalendar]=\"'enter'\"\r\n    (selectedChange)=\"datepicker.select($event)\" (yearSelected)=\"datepicker._selectYear($event)\"\r\n    (monthSelected)=\"datepicker._selectMonth($event)\">\r\n</ngx-mat-calendar>\r\n<ng-container *ngIf=\"isViewMonth\">\r\n    <div *ngIf=\"!datepicker._hideTime\" class=\"time-container\" [class.disable-seconds]=\"!datepicker._showSeconds\">\r\n        <ngx-mat-timepicker [showSpinners]=\"datepicker._showSpinners\" [showSeconds]=\"datepicker._showSeconds\"\r\n            [disabled]=\"datepicker._disabled\" [stepHour]=\"datepicker._stepHour\" [stepMinute]=\"datepicker._stepMinute\"\r\n            [stepSecond]=\"datepicker._stepSecond\" [(ngModel)]=\"datepicker._selected\" [color]=\"datepicker._color\"\r\n            [enableMeridian]=\"datepicker._enableMeridian\" [disableMinute]=\"datepicker._disableMinute\">\r\n        </ngx-mat-timepicker>\r\n    </div>\r\n    <div class=\"actions\">\r\n        <button mat-button (click)=\"datepicker.ok()\" mat-stroked-button [color]=\"datepicker._color\" cdkFocusInitial\r\n            [disabled]=\"!valid\">\r\n            <mat-icon *ngIf=\"!datepicker._customIcon\">done</mat-icon>\r\n            <ng-template [cdkPortalOutlet]=\"_templateCustomIconPortal\"></ng-template>\r\n        </button>\r\n    </div>\r\n</ng-container>", styles: [".mat-datepicker-content{display:block;border-radius:4px;box-shadow:0 2px 4px -1px #0003,0 4px 5px #00000024,0 1px 10px #0000001f;background-color:#fff}.mat-datepicker-content .mat-calendar{width:296px}.mat-datepicker-content .time-container{display:flex;position:relative;padding-top:5px;justify-content:center}.mat-datepicker-content .time-container.disable-seconds .ngx-mat-timepicker .table{margin-left:9px}.mat-datepicker-content .time-container:before{content:\"\";position:absolute;top:0;left:0;right:0;height:1px;background-color:#0000001f}.mat-datepicker-content .actions{display:flex;padding:5px 15px 10px;justify-content:flex-end}\n"] }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i0.ViewContainerRef }], propDecorators: { _calendar: [{
                type: ViewChild,
                args: [NgxMatCalendar]
            }], _timePicker: [{
                type: ViewChild,
                args: [NgxMatTimepickerComponent]
            }] } });
// TODO(mmalerba): We use a component instead of a directive here so the user can use implicit
// template reference variables (e.g. #d vs #d="matDatepicker"). We can change this to a directive
// if angular adds support for `exportAs: '$implicit'` on directives.
/** Component responsible for managing the datepicker popup/dialog. */
export class NgxMatDatetimePicker {
    _dialog;
    _overlay;
    _ngZone;
    _viewContainerRef;
    _dateAdapter;
    _dir;
    _document;
    _scrollStrategy;
    /** An input indicating the type of the custom header component for the calendar, if set. */
    calendarHeaderComponent;
    /** Custom icon set by the consumer. */
    _customIcon;
    /** The date to open the calendar to initially. */
    get startAt() {
        // If an explicit startAt is set we start there, otherwise we start at whatever the currently
        // selected value is.
        return this._startAt || (this.datepickerInput ? this.datepickerInput.value : null);
    }
    set startAt(value) {
        this._startAt = this._getValidDateOrNull(this._dateAdapter.deserialize(value));
    }
    _startAt;
    /** The view that the calendar should start in. */
    startView = 'month';
    /** Default Color palette to use on the datepicker's calendar. */
    get defaultColor() {
        return this._defaultColor;
    }
    set defaultColor(value) {
        this._defaultColor = value;
    }
    _defaultColor = 'primary';
    /** Color palette to use on the datepicker's calendar. */
    get color() {
        return this._color ||
            (this.datepickerInput ? this.datepickerInput._getThemePalette() : 'primary');
    }
    set color(value) {
        this._color = value;
    }
    _color;
    /**
     * Whether the calendar UI is in touch mode. In touch mode the calendar opens in a dialog rather
     * than a popup and elements have more padding to allow for bigger touch targets.
     */
    get touchUi() { return this._touchUi; }
    set touchUi(value) {
        this._touchUi = coerceBooleanProperty(value);
    }
    _touchUi = false;
    get hideTime() { return this._hideTime; }
    set hideTime(value) {
        this._hideTime = coerceBooleanProperty(value);
    }
    _hideTime = false;
    /** Whether the datepicker pop-up should be disabled. */
    get disabled() {
        return this._disabled === undefined && this.datepickerInput ?
            this.datepickerInput.disabled : !!this._disabled;
    }
    set disabled(value) {
        const newValue = coerceBooleanProperty(value);
        if (newValue !== this._disabled) {
            this._disabled = newValue;
            this.stateChanges.next(newValue);
        }
    }
    _disabled;
    /**
     * Emits selected year in multiyear view.
     * This doesn't imply a change on the selected date.
     */
    yearSelected = new EventEmitter();
    /**
     * Emits selected month in year view.
     * This doesn't imply a change on the selected date.
     */
    monthSelected = new EventEmitter();
    /** Classes to be passed to the date picker panel. Supports the same syntax as `ngClass`. */
    panelClass;
    /** Function that can be used to add custom CSS classes to dates. */
    dateClass;
    /** Emits when the datepicker has been opened. */
    openedStream = new EventEmitter();
    /** Emits when the datepicker has been closed. */
    closedStream = new EventEmitter();
    /** Whether the calendar is open. */
    get opened() { return this._opened; }
    set opened(value) { value ? this.open() : this.close(); }
    _opened = false;
    /** Whether the timepicker'spinners is shown. */
    get showSpinners() { return this._showSpinners; }
    set showSpinners(value) { this._showSpinners = value; }
    _showSpinners = true;
    /** Whether the second part is disabled. */
    get showSeconds() { return this._showSeconds; }
    set showSeconds(value) { this._showSeconds = value; }
    _showSeconds = false;
    /** Step hour */
    get stepHour() { return this._stepHour; }
    set stepHour(value) { this._stepHour = value; }
    _stepHour = DEFAULT_STEP;
    /** Step minute */
    get stepMinute() { return this._stepMinute; }
    set stepMinute(value) { this._stepMinute = value; }
    _stepMinute = DEFAULT_STEP;
    /** Step second */
    get stepSecond() { return this._stepSecond; }
    set stepSecond(value) { this._stepSecond = value; }
    _stepSecond = DEFAULT_STEP;
    /** Enable meridian */
    get enableMeridian() { return this._enableMeridian; }
    set enableMeridian(value) { this._enableMeridian = value; }
    _enableMeridian = false;
    /** disable minute */
    get disableMinute() { return this._disableMinute; }
    set disableMinute(value) { this._disableMinute = value; }
    _disableMinute;
    /** Step second */
    get defaultTime() { return this._defaultTime; }
    set defaultTime(value) { this._defaultTime = value; }
    _defaultTime;
    _hasBackdrop = true;
    /** The id for the datepicker calendar. */
    id = `mat-datepicker-${datepickerUid++}`;
    /** The currently selected date. */
    get _selected() { return this._validSelected; }
    set _selected(value) { this._validSelected = value; }
    _validSelected = null;
    /** The minimum selectable date. */
    get _minDate() {
        return this.datepickerInput && this.datepickerInput.min;
    }
    /** The maximum selectable date. */
    get _maxDate() {
        return this.datepickerInput && this.datepickerInput.max;
    }
    get valid() {
        const minValidators = this._minValidator();
        const maxValidators = this._maxValidator();
        return minValidators == null && maxValidators == null;
    }
    get _dateFilter() {
        return this.datepickerInput && this.datepickerInput._dateFilter;
    }
    /** A reference to the overlay when the calendar is opened as a popup. */
    _popupRef;
    /** A reference to the dialog when the calendar is opened as a dialog. */
    _dialogRef;
    /** A portal containing the calendar for this datepicker. */
    _calendarPortal;
    /** Reference to the component instantiated in popup mode. */
    _popupComponentRef;
    /** The element that was focused before the datepicker was opened. */
    _focusedElementBeforeOpen = null;
    /** Subscription to value changes in the associated input element. */
    _inputSubscription = Subscription.EMPTY;
    /** The input element this datepicker is associated with. */
    datepickerInput;
    /** Emits when the datepicker is disabled. */
    stateChanges = new Subject();
    /** Emits new selected date when selected date changes. */
    _selectedChanged = new Subject();
    /** Raw value before  */
    _rawValue;
    constructor(_dialog, _overlay, _ngZone, _viewContainerRef, scrollStrategy, _dateAdapter, _dir, _document) {
        this._dialog = _dialog;
        this._overlay = _overlay;
        this._ngZone = _ngZone;
        this._viewContainerRef = _viewContainerRef;
        this._dateAdapter = _dateAdapter;
        this._dir = _dir;
        this._document = _document;
        if (!this._dateAdapter) {
            throw createMissingDateImplError('NgxMatDateAdapter');
        }
        this._scrollStrategy = scrollStrategy;
    }
    ngOnDestroy() {
        this.close();
        if (this._popupRef) {
            this._popupRef.dispose();
            this._popupComponentRef = null;
        }
        this._inputSubscription.unsubscribe();
        this.stateChanges.complete();
    }
    /** The form control validator for the min date. */
    _minValidator = () => {
        return (!this._minDate || !this._selected ||
            this._dateAdapter.compareDateWithTime(this._minDate, this._selected, this.showSeconds) <= 0) ?
            null : { 'matDatetimePickerMin': { 'min': this._minDate, 'actual': this._selected } };
    };
    /** The form control validator for the max date. */
    _maxValidator = () => {
        return (!this._maxDate || !this._selected ||
            this._dateAdapter.compareDateWithTime(this._maxDate, this._selected, this.showSeconds) >= 0) ?
            null : { 'matDatetimePickerMax': { 'max': this._maxDate, 'actual': this._selected } };
    };
    /** Selects the given date */
    select(date) {
        this._dateAdapter.copyTime(date, this._selected);
        this._selected = date;
    }
    /** Emits the selected year in multiyear view */
    _selectYear(normalizedYear) {
        this.yearSelected.emit(normalizedYear);
    }
    /** Emits selected month in year view */
    _selectMonth(normalizedMonth) {
        this.monthSelected.emit(normalizedMonth);
    }
    /** OK button handler and close*/
    ok() {
        const cloned = this._dateAdapter.clone(this._selected);
        this._selectedChanged.next(cloned);
        this.close();
    }
    /** Cancel and close */
    cancel() {
        this._selected = this._rawValue;
        this.close();
    }
    /**
     * Register an input with this datepicker.
     * @param input The datepicker input to register with this datepicker.
     */
    _registerInput(input) {
        if (this.datepickerInput) {
            throw Error('A NgxMatDatepicker can only be associated with a single input.');
        }
        this.datepickerInput = input;
        this._inputSubscription =
            this.datepickerInput._valueChange.subscribe((value) => this._selected = value);
    }
    /** Open the calendar. */
    open() {
        this._rawValue = this._selected != null
            ? this._dateAdapter.clone(this._selected) : null;
        if (this._selected == null) {
            this._selected = this._dateAdapter.today();
            if (this.defaultTime != null) {
                this._dateAdapter.setTimeByDefaultValues(this._selected, this.defaultTime);
            }
        }
        if (this._opened || this.disabled) {
            return;
        }
        if (!this.datepickerInput) {
            throw Error('Attempted to open an NgxMatDatepicker with no associated input.');
        }
        if (this._document) {
            this._focusedElementBeforeOpen = this._document.activeElement;
        }
        this.touchUi ? this._openAsDialog() : this._openAsPopup();
        this._opened = true;
        this.openedStream.emit();
    }
    /** Close the calendar. */
    close() {
        if (!this._opened) {
            return;
        }
        if (this._popupRef && this._popupRef.hasAttached()) {
            this._popupRef.detach();
        }
        if (this._dialogRef) {
            this._dialogRef.close();
            this._dialogRef = null;
        }
        if (this._calendarPortal && this._calendarPortal.isAttached) {
            this._calendarPortal.detach();
        }
        const completeClose = () => {
            // The `_opened` could've been reset already if
            // we got two events in quick succession.
            if (this._opened) {
                this._opened = false;
                this.closedStream.emit();
                this._focusedElementBeforeOpen = null;
            }
        };
        if (this._focusedElementBeforeOpen &&
            typeof this._focusedElementBeforeOpen.focus === 'function') {
            // Because IE moves focus asynchronously, we can't count on it being restored before we've
            // marked the datepicker as closed. If the event fires out of sequence and the element that
            // we're refocusing opens the datepicker on focus, the user could be stuck with not being
            // able to close the calendar at all. We work around it by making the logic, that marks
            // the datepicker as closed, async as well.
            this._focusedElementBeforeOpen.focus();
            setTimeout(completeClose);
        }
        else {
            completeClose();
        }
    }
    /** Open the calendar as a dialog. */
    _openAsDialog() {
        // Usually this would be handled by `open` which ensures that we can only have one overlay
        // open at a time, however since we reset the variables in async handlers some overlays
        // may slip through if the user opens and closes multiple times in quick succession (e.g.
        // by holding down the enter key).
        if (this._dialogRef) {
            this._dialogRef.close();
        }
        this._dialogRef = this._dialog.open(NgxMatDatetimeContent, {
            direction: this._dir ? this._dir.value : 'ltr',
            viewContainerRef: this._viewContainerRef,
            panelClass: 'mat-datepicker-dialog',
            hasBackdrop: this._hasBackdrop
        });
        this._dialogRef.afterClosed().subscribe(() => this.close());
        this._dialogRef.componentInstance.datepicker = this;
        this._setColor();
    }
    /** Open the calendar as a popup. */
    _openAsPopup() {
        if (!this._calendarPortal) {
            this._calendarPortal = new ComponentPortal(NgxMatDatetimeContent, this._viewContainerRef);
        }
        if (!this._popupRef) {
            this._createPopup();
        }
        if (!this._popupRef.hasAttached()) {
            this._popupComponentRef = this._popupRef.attach(this._calendarPortal);
            this._popupComponentRef.instance.datepicker = this;
            this._setColor();
            // Update the position once the calendar has rendered.
            this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
                this._popupRef.updatePosition();
            });
        }
    }
    /** Create the popup. */
    _createPopup() {
        const overlayConfig = new OverlayConfig({
            positionStrategy: this._createPopupPositionStrategy(),
            hasBackdrop: this._hasBackdrop,
            backdropClass: 'mat-overlay-transparent-backdrop',
            direction: this._dir,
            scrollStrategy: this._scrollStrategy(),
            panelClass: 'mat-datepicker-popup',
        });
        this._popupRef = this._overlay.create(overlayConfig);
        this._popupRef.overlayElement.setAttribute('role', 'dialog');
        merge(this._popupRef.backdropClick(), this._popupRef.detachments(), this._popupRef.keydownEvents().pipe(filter(event => {
            // Closing on alt + up is only valid when there's an input associated with the datepicker.
            return event.keyCode === ESCAPE ||
                (this.datepickerInput && event.altKey && event.keyCode === UP_ARROW);
        }))).subscribe(event => {
            if (event) {
                event.preventDefault();
            }
            (this._hasBackdrop && event) ? this.cancel() : this.close();
        });
    }
    /** Create the popup PositionStrategy. */
    _createPopupPositionStrategy() {
        return this._overlay.position()
            .flexibleConnectedTo(this.datepickerInput.getConnectedOverlayOrigin())
            .withTransformOriginOn('.mat-datepicker-content')
            .withFlexibleDimensions(false)
            .withViewportMargin(8)
            .withLockedPosition()
            .withPositions([
            {
                originX: 'start',
                originY: 'bottom',
                overlayX: 'start',
                overlayY: 'top'
            },
            {
                originX: 'start',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'bottom'
            },
            {
                originX: 'end',
                originY: 'bottom',
                overlayX: 'end',
                overlayY: 'top'
            },
            {
                originX: 'end',
                originY: 'top',
                overlayX: 'end',
                overlayY: 'bottom'
            }
        ]);
    }
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    _getValidDateOrNull(obj) {
        return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
    }
    /** Passes the current theme color along to the calendar overlay. */
    _setColor() {
        const color = this.color;
        if (this._popupComponentRef) {
            this._popupComponentRef.instance.color = color;
        }
        if (this._dialogRef) {
            this._dialogRef.componentInstance.color = color;
        }
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimePicker, deps: [{ token: i8.MatDialog }, { token: i9.Overlay }, { token: i0.NgZone }, { token: i0.ViewContainerRef }, { token: MAT_DATEPICKER_SCROLL_STRATEGY }, { token: i10.NgxMatDateAdapter, optional: true }, { token: i11.Directionality, optional: true }, { token: DOCUMENT, optional: true }], target: i0.ɵɵFactoryTarget.Component });
    /** @nocollapse */ static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.11", type: NgxMatDatetimePicker, selector: "ngx-mat-datetime-picker", inputs: { calendarHeaderComponent: "calendarHeaderComponent", startAt: "startAt", startView: "startView", defaultColor: "defaultColor", color: "color", touchUi: "touchUi", hideTime: "hideTime", disabled: "disabled", panelClass: "panelClass", dateClass: "dateClass", opened: "opened", showSpinners: "showSpinners", showSeconds: "showSeconds", stepHour: "stepHour", stepMinute: "stepMinute", stepSecond: "stepSecond", enableMeridian: "enableMeridian", disableMinute: "disableMinute", defaultTime: "defaultTime" }, outputs: { yearSelected: "yearSelected", monthSelected: "monthSelected", openedStream: "opened", closedStream: "closed" }, queries: [{ propertyName: "_customIcon", first: true, predicate: TemplateRef, descendants: true }], exportAs: ["ngxMatDatetimePicker"], ngImport: i0, template: '', isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimePicker, decorators: [{
            type: Component,
            args: [{
                    selector: 'ngx-mat-datetime-picker',
                    template: '',
                    exportAs: 'ngxMatDatetimePicker',
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: () => [{ type: i8.MatDialog }, { type: i9.Overlay }, { type: i0.NgZone }, { type: i0.ViewContainerRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [MAT_DATEPICKER_SCROLL_STRATEGY]
                }] }, { type: i10.NgxMatDateAdapter, decorators: [{
                    type: Optional
                }] }, { type: i11.Directionality, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DOCUMENT]
                }] }], propDecorators: { calendarHeaderComponent: [{
                type: Input
            }], _customIcon: [{
                type: ContentChild,
                args: [TemplateRef]
            }], startAt: [{
                type: Input
            }], startView: [{
                type: Input
            }], defaultColor: [{
                type: Input
            }], color: [{
                type: Input
            }], touchUi: [{
                type: Input
            }], hideTime: [{
                type: Input
            }], disabled: [{
                type: Input
            }], yearSelected: [{
                type: Output
            }], monthSelected: [{
                type: Output
            }], panelClass: [{
                type: Input
            }], dateClass: [{
                type: Input
            }], openedStream: [{
                type: Output,
                args: ['opened']
            }], closedStream: [{
                type: Output,
                args: ['closed']
            }], opened: [{
                type: Input
            }], showSpinners: [{
                type: Input
            }], showSeconds: [{
                type: Input
            }], stepHour: [{
                type: Input
            }], stepMinute: [{
                type: Input
            }], stepSecond: [{
                type: Input
            }], enableMeridian: [{
                type: Input
            }], disableMinute: [{
                type: Input
            }], defaultTime: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZXRpbWUtcGlja2VyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Byb2plY3RzL2RhdGV0aW1lLXBpY2tlci9zcmMvbGliL2RhdGV0aW1lLXBpY2tlci5jb21wb25lbnQudHMiLCIuLi8uLi8uLi9wcm9qZWN0cy9kYXRldGltZS1waWNrZXIvc3JjL2xpYi9kYXRldGltZS1jb250ZW50LmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQzlELE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDekQsT0FBTyxFQUFXLGFBQWEsRUFBZ0QsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RyxPQUFPLEVBQUUsZUFBZSxFQUFpQixjQUFjLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDM0MsT0FBTyxFQUFpQix1QkFBdUIsRUFBcUIsU0FBUyxFQUFnQixZQUFZLEVBQWMsWUFBWSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQXFCLFFBQVEsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBb0IsaUJBQWlCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFNVEsT0FBTyxFQUFZLFVBQVUsRUFBZ0IsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RSxPQUFPLEVBQTZCLHVCQUF1QixFQUFFLDhCQUE4QixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFbEksT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3BELE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUc1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QUFLO3NCQURSLEtBQUs7Z0JBZUYsT0FBTztzQkFEVixLQUFLO2dCQVFGLFFBQVE7c0JBRFgsS0FBSztnQkFTRixRQUFRO3NCQURYLEtBQUs7Z0JBbUJhLFlBQVk7c0JBQTlCLE1BQU07Z0JBTVksYUFBYTtzQkFBL0IsTUFBTTtnQkFHRSxVQUFVO3NCQUFsQixLQUFLO2dCQUdHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBR1ksWUFBWTtzQkFBN0IsTUFBTTt1QkFBQyxRQUFRO2dCQUdFLFlBQVk7c0JBQTdCLE1BQU07dUJBQUMsUUFBUTtnQkFLWixNQUFNO3NCQURULEtBQUs7Z0JBT0YsWUFBWTtzQkFEZixLQUFLO2dCQU9GLFdBQVc7c0JBRGQsS0FBSztnQkFPRixRQUFRO3NCQURYLEtBQUs7Z0JBT0YsVUFBVTtzQkFEYixLQUFLO2dCQU9GLFVBQVU7c0JBRGIsS0FBSztnQkFPRixjQUFjO3NCQURqQixLQUFLO2dCQU9GLGFBQWE7c0JBRGhCLEtBQUs7Z0JBT0YsV0FBVztzQkFEZCxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBsaWNlbnNlXHJcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXHJcbiAqXHJcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXHJcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcclxuICovXHJcblxyXG5pbXBvcnQgeyBEaXJlY3Rpb25hbGl0eSB9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcclxuaW1wb3J0IHsgY29lcmNlQm9vbGVhblByb3BlcnR5IH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcclxuaW1wb3J0IHsgRVNDQVBFLCBVUF9BUlJPVyB9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XHJcbmltcG9ydCB7IE92ZXJsYXksIE92ZXJsYXlDb25maWcsIE92ZXJsYXlSZWYsIFBvc2l0aW9uU3RyYXRlZ3ksIFNjcm9sbFN0cmF0ZWd5IH0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xyXG5pbXBvcnQgeyBDb21wb25lbnRQb3J0YWwsIENvbXBvbmVudFR5cGUsIFRlbXBsYXRlUG9ydGFsIH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XHJcbmltcG9ydCB7IERPQ1VNRU5UIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcclxuaW1wb3J0IHsgQWZ0ZXJWaWV3SW5pdCwgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIENvbXBvbmVudFJlZiwgQ29udGVudENoaWxkLCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIEluamVjdCwgSW5wdXQsIE5nWm9uZSwgT25EZXN0cm95LCBPcHRpb25hbCwgT3V0cHV0LCBUZW1wbGF0ZVJlZiwgVmlld0NoaWxkLCBWaWV3Q29udGFpbmVyUmVmLCBWaWV3RW5jYXBzdWxhdGlvbiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3JzIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBDYW5Db2xvciwgbWl4aW5Db2xvciwgVGhlbWVQYWxldHRlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvY29yZSc7XHJcbmltcG9ydCB7IE1hdENhbGVuZGFyQ2VsbENzc0NsYXNzZXMsIG1hdERhdGVwaWNrZXJBbmltYXRpb25zLCBNQVRfREFURVBJQ0tFUl9TQ1JPTExfU1RSQVRFR1kgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9kYXRlcGlja2VyJztcclxuaW1wb3J0IHsgTWF0RGlhbG9nLCBNYXREaWFsb2dSZWYgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9kaWFsb2cnO1xyXG5pbXBvcnQgeyBtZXJnZSwgU3ViamVjdCwgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IGZpbHRlciwgdGFrZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHsgTmd4TWF0Q2FsZW5kYXIgfSBmcm9tICcuL2NhbGVuZGFyJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZUFkYXB0ZXIgfSBmcm9tICcuL2NvcmUvZGF0ZS1hZGFwdGVyJztcclxuaW1wb3J0IHsgTmd4TWF0RGF0ZXRpbWVJbnB1dCB9IGZyb20gJy4vZGF0ZXRpbWUtaW5wdXQnO1xyXG5pbXBvcnQgeyBOZ3hNYXRUaW1lcGlja2VyQ29tcG9uZW50IH0gZnJvbSAnLi90aW1lcGlja2VyLmNvbXBvbmVudCc7XHJcbmltcG9ydCB7IGNyZWF0ZU1pc3NpbmdEYXRlSW1wbEVycm9yLCBERUZBVUxUX1NURVAgfSBmcm9tICcuL3V0aWxzL2RhdGUtdXRpbHMnO1xyXG5cclxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgSUQgZm9yIGVhY2ggZGF0ZXBpY2tlciBpbnN0YW5jZS4gKi9cclxubGV0IGRhdGVwaWNrZXJVaWQgPSAwO1xyXG5cclxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBNYXREYXRlcGlja2VyQ29udGVudC5cclxuLyoqIEBkb2NzLXByaXZhdGUgKi9cclxuY29uc3QgX01hdERhdGV0aW1lcGlja2VyQ29udGVudEJhc2UgPSBtaXhpbkNvbG9yKFxyXG4gIGNsYXNzIHtcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBfZWxlbWVudFJlZjogRWxlbWVudFJlZikgeyB9XHJcbiAgfSxcclxuKTtcclxuXHJcbi8qKlxyXG4gKiBDb21wb25lbnQgdXNlZCBhcyB0aGUgY29udGVudCBmb3IgdGhlIGRhdGVwaWNrZXIgZGlhbG9nIGFuZCBwb3B1cC4gV2UgdXNlIHRoaXMgaW5zdGVhZCBvZiB1c2luZ1xyXG4gKiBOZ3hNYXRDYWxlbmRhciBkaXJlY3RseSBhcyB0aGUgY29udGVudCBzbyB3ZSBjYW4gY29udHJvbCB0aGUgaW5pdGlhbCBmb2N1cy4gVGhpcyBhbHNvIGdpdmVzIHVzIGFcclxuICogcGxhY2UgdG8gcHV0IGFkZGl0aW9uYWwgZmVhdHVyZXMgb2YgdGhlIHBvcHVwIHRoYXQgYXJlIG5vdCBwYXJ0IG9mIHRoZSBjYWxlbmRhciBpdHNlbGYgaW4gdGhlXHJcbiAqIGZ1dHVyZS4gKGUuZy4gY29uZmlybWF0aW9uIGJ1dHRvbnMpLlxyXG4gKiBAZG9jcy1wcml2YXRlXHJcbiAqL1xyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ25neC1tYXQtZGF0ZXRpbWUtY29udGVudCcsXHJcbiAgdGVtcGxhdGVVcmw6ICdkYXRldGltZS1jb250ZW50LmNvbXBvbmVudC5odG1sJyxcclxuICBzdHlsZVVybHM6IFsnZGF0ZXRpbWUtY29udGVudC5jb21wb25lbnQuc2NzcyddLFxyXG4gIGhvc3Q6IHtcclxuICAgICdjbGFzcyc6ICdtYXQtZGF0ZXBpY2tlci1jb250ZW50JyxcclxuICAgICdbQHRyYW5zZm9ybVBhbmVsXSc6ICdcImVudGVyXCInLFxyXG4gICAgJ1tjbGFzcy5tYXQtZGF0ZXBpY2tlci1jb250ZW50LXRvdWNoXSc6ICdkYXRlcGlja2VyLnRvdWNoVWknLFxyXG4gIH0sXHJcbiAgYW5pbWF0aW9uczogW1xyXG4gICAgbWF0RGF0ZXBpY2tlckFuaW1hdGlvbnMudHJhbnNmb3JtUGFuZWwsXHJcbiAgICBtYXREYXRlcGlja2VyQW5pbWF0aW9ucy5mYWRlSW5DYWxlbmRhcixcclxuICBdLFxyXG4gIGV4cG9ydEFzOiAnbmd4TWF0RGF0ZXRpbWVDb250ZW50JyxcclxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxyXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxyXG4gIGlucHV0czogWydjb2xvciddLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgTmd4TWF0RGF0ZXRpbWVDb250ZW50PEQ+IGV4dGVuZHMgX01hdERhdGV0aW1lcGlja2VyQ29udGVudEJhc2VcclxuICBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIENhbkNvbG9yIHtcclxuXHJcbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgaW50ZXJuYWwgY2FsZW5kYXIgY29tcG9uZW50LiAqL1xyXG4gIEBWaWV3Q2hpbGQoTmd4TWF0Q2FsZW5kYXIpIF9jYWxlbmRhcjogTmd4TWF0Q2FsZW5kYXI8RD47XHJcblxyXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGludGVybmFsIHRpbWUgcGlja2VyIGNvbXBvbmVudC4gKi9cclxuICBAVmlld0NoaWxkKE5neE1hdFRpbWVwaWNrZXJDb21wb25lbnQpIF90aW1lUGlja2VyOiBOZ3hNYXRUaW1lcGlja2VyQ29tcG9uZW50PEQ+O1xyXG5cclxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBkYXRlcGlja2VyIHRoYXQgY3JlYXRlZCB0aGUgb3ZlcmxheS4gKi9cclxuICBkYXRlcGlja2VyOiBOZ3hNYXREYXRldGltZVBpY2tlcjxEPjtcclxuXHJcbiAgLyoqIFdoZXRoZXIgdGhlIGRhdGVwaWNrZXIgaXMgYWJvdmUgb3IgYmVsb3cgdGhlIGlucHV0LiAqL1xyXG4gIF9pc0Fib3ZlOiBib29sZWFuO1xyXG5cclxuICAvKiogV2hldGhlciBvciBub3QgdGhlIHNlbGVjdGVkIGRhdGUgaXMgdmFsaWQgKG1pbixtYXguLi4pICovXHJcbiAgZ2V0IHZhbGlkKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKHRoaXMuZGF0ZXBpY2tlci5oaWRlVGltZSkgcmV0dXJuIHRoaXMuZGF0ZXBpY2tlci52YWxpZDtcclxuICAgIHJldHVybiB0aGlzLl90aW1lUGlja2VyICYmIHRoaXMuX3RpbWVQaWNrZXIudmFsaWQgJiYgdGhpcy5kYXRlcGlja2VyLnZhbGlkO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGlzVmlld01vbnRoKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCF0aGlzLl9jYWxlbmRhciB8fCB0aGlzLl9jYWxlbmRhci5jdXJyZW50VmlldyA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcclxuICAgIHJldHVybiB0aGlzLl9jYWxlbmRhci5jdXJyZW50VmlldyA9PSAnbW9udGgnO1xyXG4gIH1cclxuXHJcbiAgX3RlbXBsYXRlQ3VzdG9tSWNvblBvcnRhbDogVGVtcGxhdGVQb3J0YWw8YW55PjtcclxuXHJcbiAgY29uc3RydWN0b3IoZWxlbWVudFJlZjogRWxlbWVudFJlZiwgcHJpdmF0ZSBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYsXHJcbiAgICBwcml2YXRlIF92aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmKSB7XHJcbiAgICBzdXBlcihlbGVtZW50UmVmKTtcclxuICB9XHJcblxyXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcclxuICAgIHRoaXMuX2NhbGVuZGFyLmZvY3VzQWN0aXZlQ2VsbCgpO1xyXG4gICAgaWYgKHRoaXMuZGF0ZXBpY2tlci5fY3VzdG9tSWNvbikge1xyXG4gICAgICB0aGlzLl90ZW1wbGF0ZUN1c3RvbUljb25Qb3J0YWwgPSBuZXcgVGVtcGxhdGVQb3J0YWwoXHJcbiAgICAgICAgdGhpcy5kYXRlcGlja2VyLl9jdXN0b21JY29uLFxyXG4gICAgICAgIHRoaXMuX3ZpZXdDb250YWluZXJSZWZcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5jZC5kZXRlY3RDaGFuZ2VzKCk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcbi8vIFRPRE8obW1hbGVyYmEpOiBXZSB1c2UgYSBjb21wb25lbnQgaW5zdGVhZCBvZiBhIGRpcmVjdGl2ZSBoZXJlIHNvIHRoZSB1c2VyIGNhbiB1c2UgaW1wbGljaXRcclxuLy8gdGVtcGxhdGUgcmVmZXJlbmNlIHZhcmlhYmxlcyAoZS5nLiAjZCB2cyAjZD1cIm1hdERhdGVwaWNrZXJcIikuIFdlIGNhbiBjaGFuZ2UgdGhpcyB0byBhIGRpcmVjdGl2ZVxyXG4vLyBpZiBhbmd1bGFyIGFkZHMgc3VwcG9ydCBmb3IgYGV4cG9ydEFzOiAnJGltcGxpY2l0J2Agb24gZGlyZWN0aXZlcy5cclxuLyoqIENvbXBvbmVudCByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgdGhlIGRhdGVwaWNrZXIgcG9wdXAvZGlhbG9nLiAqL1xyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ25neC1tYXQtZGF0ZXRpbWUtcGlja2VyJyxcclxuICB0ZW1wbGF0ZTogJycsXHJcbiAgZXhwb3J0QXM6ICduZ3hNYXREYXRldGltZVBpY2tlcicsXHJcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXHJcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcclxufSlcclxuZXhwb3J0IGNsYXNzIE5neE1hdERhdGV0aW1lUGlja2VyPEQ+IGltcGxlbWVudHMgT25EZXN0cm95LCBDYW5Db2xvciB7XHJcblxyXG4gIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiAoKSA9PiBTY3JvbGxTdHJhdGVneTtcclxuXHJcbiAgLyoqIEFuIGlucHV0IGluZGljYXRpbmcgdGhlIHR5cGUgb2YgdGhlIGN1c3RvbSBoZWFkZXIgY29tcG9uZW50IGZvciB0aGUgY2FsZW5kYXIsIGlmIHNldC4gKi9cclxuICBASW5wdXQoKSBjYWxlbmRhckhlYWRlckNvbXBvbmVudDogQ29tcG9uZW50VHlwZTxhbnk+O1xyXG5cclxuICAvKiogQ3VzdG9tIGljb24gc2V0IGJ5IHRoZSBjb25zdW1lci4gKi9cclxuICBAQ29udGVudENoaWxkKFRlbXBsYXRlUmVmKSBfY3VzdG9tSWNvbjogVGVtcGxhdGVSZWY8YW55PjtcclxuXHJcbiAgLyoqIFRoZSBkYXRlIHRvIG9wZW4gdGhlIGNhbGVuZGFyIHRvIGluaXRpYWxseS4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBzdGFydEF0KCk6IEQgfCBudWxsIHtcclxuICAgIC8vIElmIGFuIGV4cGxpY2l0IHN0YXJ0QXQgaXMgc2V0IHdlIHN0YXJ0IHRoZXJlLCBvdGhlcndpc2Ugd2Ugc3RhcnQgYXQgd2hhdGV2ZXIgdGhlIGN1cnJlbnRseVxyXG4gICAgLy8gc2VsZWN0ZWQgdmFsdWUgaXMuXHJcbiAgICByZXR1cm4gdGhpcy5fc3RhcnRBdCB8fCAodGhpcy5kYXRlcGlja2VySW5wdXQgPyB0aGlzLmRhdGVwaWNrZXJJbnB1dC52YWx1ZSA6IG51bGwpO1xyXG4gIH1cclxuICBzZXQgc3RhcnRBdCh2YWx1ZTogRCB8IG51bGwpIHtcclxuICAgIHRoaXMuX3N0YXJ0QXQgPSB0aGlzLl9nZXRWYWxpZERhdGVPck51bGwodGhpcy5fZGF0ZUFkYXB0ZXIuZGVzZXJpYWxpemUodmFsdWUpKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBfc3RhcnRBdDogRCB8IG51bGw7XHJcblxyXG4gIC8qKiBUaGUgdmlldyB0aGF0IHRoZSBjYWxlbmRhciBzaG91bGQgc3RhcnQgaW4uICovXHJcbiAgQElucHV0KCkgc3RhcnRWaWV3OiAnbW9udGgnIHwgJ3llYXInIHwgJ211bHRpLXllYXInID0gJ21vbnRoJztcclxuXHJcbiAgLyoqIERlZmF1bHQgQ29sb3IgcGFsZXR0ZSB0byB1c2Ugb24gdGhlIGRhdGVwaWNrZXIncyBjYWxlbmRhci4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBkZWZhdWx0Q29sb3IoKTogVGhlbWVQYWxldHRlIHtcclxuICAgIHJldHVybiB0aGlzLl9kZWZhdWx0Q29sb3I7XHJcbiAgfVxyXG4gIHNldCBkZWZhdWx0Q29sb3IodmFsdWU6IFRoZW1lUGFsZXR0ZSkge1xyXG4gICAgdGhpcy5fZGVmYXVsdENvbG9yID0gdmFsdWU7XHJcbiAgfVxyXG4gIF9kZWZhdWx0Q29sb3I6IFRoZW1lUGFsZXR0ZSA9ICdwcmltYXJ5JztcclxuXHJcbiAgLyoqIENvbG9yIHBhbGV0dGUgdG8gdXNlIG9uIHRoZSBkYXRlcGlja2VyJ3MgY2FsZW5kYXIuICovXHJcbiAgQElucHV0KClcclxuICBnZXQgY29sb3IoKTogVGhlbWVQYWxldHRlIHtcclxuICAgIHJldHVybiB0aGlzLl9jb2xvciB8fFxyXG4gICAgICAodGhpcy5kYXRlcGlja2VySW5wdXQgPyB0aGlzLmRhdGVwaWNrZXJJbnB1dC5fZ2V0VGhlbWVQYWxldHRlKCkgOiAncHJpbWFyeScpO1xyXG4gIH1cclxuICBzZXQgY29sb3IodmFsdWU6IFRoZW1lUGFsZXR0ZSkge1xyXG4gICAgdGhpcy5fY29sb3IgPSB2YWx1ZTtcclxuICB9XHJcbiAgX2NvbG9yOiBUaGVtZVBhbGV0dGU7XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgdGhlIGNhbGVuZGFyIFVJIGlzIGluIHRvdWNoIG1vZGUuIEluIHRvdWNoIG1vZGUgdGhlIGNhbGVuZGFyIG9wZW5zIGluIGEgZGlhbG9nIHJhdGhlclxyXG4gICAqIHRoYW4gYSBwb3B1cCBhbmQgZWxlbWVudHMgaGF2ZSBtb3JlIHBhZGRpbmcgdG8gYWxsb3cgZm9yIGJpZ2dlciB0b3VjaCB0YXJnZXRzLlxyXG4gICAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IHRvdWNoVWkoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl90b3VjaFVpOyB9XHJcbiAgc2V0IHRvdWNoVWkodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgIHRoaXMuX3RvdWNoVWkgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xyXG4gIH1cclxuICBwcml2YXRlIF90b3VjaFVpID0gZmFsc2U7XHJcblxyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IGhpZGVUaW1lKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5faGlkZVRpbWU7IH1cclxuICBzZXQgaGlkZVRpbWUodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgIHRoaXMuX2hpZGVUaW1lID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcclxuICB9XHJcbiAgcHVibGljIF9oaWRlVGltZSA9IGZhbHNlO1xyXG5cclxuICAvKiogV2hldGhlciB0aGUgZGF0ZXBpY2tlciBwb3AtdXAgc2hvdWxkIGJlIGRpc2FibGVkLiAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkID09PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRlcGlja2VySW5wdXQgP1xyXG4gICAgICB0aGlzLmRhdGVwaWNrZXJJbnB1dC5kaXNhYmxlZCA6ICEhdGhpcy5fZGlzYWJsZWQ7XHJcbiAgfVxyXG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgY29uc3QgbmV3VmFsdWUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xyXG5cclxuICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5fZGlzYWJsZWQpIHtcclxuICAgICAgdGhpcy5fZGlzYWJsZWQgPSBuZXdWYWx1ZTtcclxuICAgICAgdGhpcy5zdGF0ZUNoYW5nZXMubmV4dChuZXdWYWx1ZSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBfZGlzYWJsZWQ6IGJvb2xlYW47XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXRzIHNlbGVjdGVkIHllYXIgaW4gbXVsdGl5ZWFyIHZpZXcuXHJcbiAgICogVGhpcyBkb2Vzbid0IGltcGx5IGEgY2hhbmdlIG9uIHRoZSBzZWxlY3RlZCBkYXRlLlxyXG4gICAqL1xyXG4gIEBPdXRwdXQoKSByZWFkb25seSB5ZWFyU2VsZWN0ZWQ6IEV2ZW50RW1pdHRlcjxEPiA9IG5ldyBFdmVudEVtaXR0ZXI8RD4oKTtcclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdHMgc2VsZWN0ZWQgbW9udGggaW4geWVhciB2aWV3LlxyXG4gICAqIFRoaXMgZG9lc24ndCBpbXBseSBhIGNoYW5nZSBvbiB0aGUgc2VsZWN0ZWQgZGF0ZS5cclxuICAgKi9cclxuICBAT3V0cHV0KCkgcmVhZG9ubHkgbW9udGhTZWxlY3RlZDogRXZlbnRFbWl0dGVyPEQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxEPigpO1xyXG5cclxuICAvKiogQ2xhc3NlcyB0byBiZSBwYXNzZWQgdG8gdGhlIGRhdGUgcGlja2VyIHBhbmVsLiBTdXBwb3J0cyB0aGUgc2FtZSBzeW50YXggYXMgYG5nQ2xhc3NgLiAqL1xyXG4gIEBJbnB1dCgpIHBhbmVsQ2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdO1xyXG5cclxuICAvKiogRnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBhZGQgY3VzdG9tIENTUyBjbGFzc2VzIHRvIGRhdGVzLiAqL1xyXG4gIEBJbnB1dCgpIGRhdGVDbGFzczogKGRhdGU6IEQpID0+IE1hdENhbGVuZGFyQ2VsbENzc0NsYXNzZXM7XHJcblxyXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBkYXRlcGlja2VyIGhhcyBiZWVuIG9wZW5lZC4gKi9cclxuICBAT3V0cHV0KCdvcGVuZWQnKSBvcGVuZWRTdHJlYW06IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcclxuXHJcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGRhdGVwaWNrZXIgaGFzIGJlZW4gY2xvc2VkLiAqL1xyXG4gIEBPdXRwdXQoJ2Nsb3NlZCcpIGNsb3NlZFN0cmVhbTogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xyXG5cclxuXHJcbiAgLyoqIFdoZXRoZXIgdGhlIGNhbGVuZGFyIGlzIG9wZW4uICovXHJcbiAgQElucHV0KClcclxuICBnZXQgb3BlbmVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fb3BlbmVkOyB9XHJcbiAgc2V0IG9wZW5lZCh2YWx1ZTogYm9vbGVhbikgeyB2YWx1ZSA/IHRoaXMub3BlbigpIDogdGhpcy5jbG9zZSgpOyB9XHJcbiAgcHJpdmF0ZSBfb3BlbmVkID0gZmFsc2U7XHJcblxyXG4gIC8qKiBXaGV0aGVyIHRoZSB0aW1lcGlja2VyJ3NwaW5uZXJzIGlzIHNob3duLiAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IHNob3dTcGlubmVycygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3Nob3dTcGlubmVyczsgfVxyXG4gIHNldCBzaG93U3Bpbm5lcnModmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fc2hvd1NwaW5uZXJzID0gdmFsdWU7IH1cclxuICBwdWJsaWMgX3Nob3dTcGlubmVycyA9IHRydWU7XHJcblxyXG4gIC8qKiBXaGV0aGVyIHRoZSBzZWNvbmQgcGFydCBpcyBkaXNhYmxlZC4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBzaG93U2Vjb25kcygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3Nob3dTZWNvbmRzOyB9XHJcbiAgc2V0IHNob3dTZWNvbmRzKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX3Nob3dTZWNvbmRzID0gdmFsdWU7IH1cclxuICBwdWJsaWMgX3Nob3dTZWNvbmRzID0gZmFsc2U7XHJcblxyXG4gIC8qKiBTdGVwIGhvdXIgKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBzdGVwSG91cigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fc3RlcEhvdXI7IH1cclxuICBzZXQgc3RlcEhvdXIodmFsdWU6IG51bWJlcikgeyB0aGlzLl9zdGVwSG91ciA9IHZhbHVlOyB9XHJcbiAgcHVibGljIF9zdGVwSG91cjogbnVtYmVyID0gREVGQVVMVF9TVEVQO1xyXG5cclxuICAvKiogU3RlcCBtaW51dGUgKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBzdGVwTWludXRlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9zdGVwTWludXRlOyB9XHJcbiAgc2V0IHN0ZXBNaW51dGUodmFsdWU6IG51bWJlcikgeyB0aGlzLl9zdGVwTWludXRlID0gdmFsdWU7IH1cclxuICBwdWJsaWMgX3N0ZXBNaW51dGU6IG51bWJlciA9IERFRkFVTFRfU1RFUDtcclxuXHJcbiAgLyoqIFN0ZXAgc2Vjb25kICovXHJcbiAgQElucHV0KClcclxuICBnZXQgc3RlcFNlY29uZCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fc3RlcFNlY29uZDsgfVxyXG4gIHNldCBzdGVwU2Vjb25kKHZhbHVlOiBudW1iZXIpIHsgdGhpcy5fc3RlcFNlY29uZCA9IHZhbHVlOyB9XHJcbiAgcHVibGljIF9zdGVwU2Vjb25kOiBudW1iZXIgPSBERUZBVUxUX1NURVA7XHJcblxyXG4gIC8qKiBFbmFibGUgbWVyaWRpYW4gKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBlbmFibGVNZXJpZGlhbigpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2VuYWJsZU1lcmlkaWFuOyB9XHJcbiAgc2V0IGVuYWJsZU1lcmlkaWFuKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX2VuYWJsZU1lcmlkaWFuID0gdmFsdWU7IH1cclxuICBwdWJsaWMgX2VuYWJsZU1lcmlkaWFuOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gIC8qKiBkaXNhYmxlIG1pbnV0ZSAqL1xyXG4gIEBJbnB1dCgpXHJcbiAgZ2V0IGRpc2FibGVNaW51dGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9kaXNhYmxlTWludXRlOyB9XHJcbiAgc2V0IGRpc2FibGVNaW51dGUodmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fZGlzYWJsZU1pbnV0ZSA9IHZhbHVlOyB9XHJcbiAgcHVibGljIF9kaXNhYmxlTWludXRlOiBib29sZWFuO1xyXG5cclxuICAvKiogU3RlcCBzZWNvbmQgKi9cclxuICBASW5wdXQoKVxyXG4gIGdldCBkZWZhdWx0VGltZSgpOiBudW1iZXJbXSB7IHJldHVybiB0aGlzLl9kZWZhdWx0VGltZTsgfVxyXG4gIHNldCBkZWZhdWx0VGltZSh2YWx1ZTogbnVtYmVyW10pIHsgdGhpcy5fZGVmYXVsdFRpbWUgPSB2YWx1ZTsgfVxyXG4gIHB1YmxpYyBfZGVmYXVsdFRpbWU6IG51bWJlcltdO1xyXG5cclxuICBwcml2YXRlIF9oYXNCYWNrZHJvcDogYm9vbGVhbiA9IHRydWU7XHJcblxyXG4gIC8qKiBUaGUgaWQgZm9yIHRoZSBkYXRlcGlja2VyIGNhbGVuZGFyLiAqL1xyXG4gIGlkOiBzdHJpbmcgPSBgbWF0LWRhdGVwaWNrZXItJHtkYXRlcGlja2VyVWlkKyt9YDtcclxuXHJcbiAgLyoqIFRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZGF0ZS4gKi9cclxuICBnZXQgX3NlbGVjdGVkKCk6IEQgfCBudWxsIHsgcmV0dXJuIHRoaXMuX3ZhbGlkU2VsZWN0ZWQ7IH1cclxuICBzZXQgX3NlbGVjdGVkKHZhbHVlOiBEIHwgbnVsbCkgeyB0aGlzLl92YWxpZFNlbGVjdGVkID0gdmFsdWU7IH1cclxuICBwcml2YXRlIF92YWxpZFNlbGVjdGVkOiBEIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIC8qKiBUaGUgbWluaW11bSBzZWxlY3RhYmxlIGRhdGUuICovXHJcbiAgZ2V0IF9taW5EYXRlKCk6IEQgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGVwaWNrZXJJbnB1dCAmJiB0aGlzLmRhdGVwaWNrZXJJbnB1dC5taW47XHJcbiAgfVxyXG5cclxuICAvKiogVGhlIG1heGltdW0gc2VsZWN0YWJsZSBkYXRlLiAqL1xyXG4gIGdldCBfbWF4RGF0ZSgpOiBEIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRlcGlja2VySW5wdXQgJiYgdGhpcy5kYXRlcGlja2VySW5wdXQubWF4O1xyXG4gIH1cclxuXHJcbiAgZ2V0IHZhbGlkKCk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgbWluVmFsaWRhdG9ycyA9IHRoaXMuX21pblZhbGlkYXRvcigpO1xyXG4gICAgY29uc3QgbWF4VmFsaWRhdG9ycyA9IHRoaXMuX21heFZhbGlkYXRvcigpO1xyXG4gICAgcmV0dXJuIG1pblZhbGlkYXRvcnMgPT0gbnVsbCAmJiBtYXhWYWxpZGF0b3JzID09IG51bGw7XHJcbiAgfVxyXG5cclxuICBnZXQgX2RhdGVGaWx0ZXIoKTogKGRhdGU6IEQgfCBudWxsKSA9PiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGVwaWNrZXJJbnB1dCAmJiB0aGlzLmRhdGVwaWNrZXJJbnB1dC5fZGF0ZUZpbHRlcjtcclxuICB9XHJcblxyXG4gIC8qKiBBIHJlZmVyZW5jZSB0byB0aGUgb3ZlcmxheSB3aGVuIHRoZSBjYWxlbmRhciBpcyBvcGVuZWQgYXMgYSBwb3B1cC4gKi9cclxuICBfcG9wdXBSZWY6IE92ZXJsYXlSZWY7XHJcblxyXG4gIC8qKiBBIHJlZmVyZW5jZSB0byB0aGUgZGlhbG9nIHdoZW4gdGhlIGNhbGVuZGFyIGlzIG9wZW5lZCBhcyBhIGRpYWxvZy4gKi9cclxuICBwcml2YXRlIF9kaWFsb2dSZWY6IE1hdERpYWxvZ1JlZjxOZ3hNYXREYXRldGltZUNvbnRlbnQ8RD4+IHwgbnVsbDtcclxuXHJcbiAgLyoqIEEgcG9ydGFsIGNvbnRhaW5pbmcgdGhlIGNhbGVuZGFyIGZvciB0aGlzIGRhdGVwaWNrZXIuICovXHJcbiAgcHJpdmF0ZSBfY2FsZW5kYXJQb3J0YWw6IENvbXBvbmVudFBvcnRhbDxOZ3hNYXREYXRldGltZUNvbnRlbnQ8RD4+O1xyXG5cclxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnQgaW5zdGFudGlhdGVkIGluIHBvcHVwIG1vZGUuICovXHJcbiAgcHJpdmF0ZSBfcG9wdXBDb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxOZ3hNYXREYXRldGltZUNvbnRlbnQ8RD4+IHwgbnVsbDtcclxuXHJcbiAgLyoqIFRoZSBlbGVtZW50IHRoYXQgd2FzIGZvY3VzZWQgYmVmb3JlIHRoZSBkYXRlcGlja2VyIHdhcyBvcGVuZWQuICovXHJcbiAgcHJpdmF0ZSBfZm9jdXNlZEVsZW1lbnRCZWZvcmVPcGVuOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHZhbHVlIGNoYW5nZXMgaW4gdGhlIGFzc29jaWF0ZWQgaW5wdXQgZWxlbWVudC4gKi9cclxuICBwcml2YXRlIF9pbnB1dFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcclxuXHJcbiAgLyoqIFRoZSBpbnB1dCBlbGVtZW50IHRoaXMgZGF0ZXBpY2tlciBpcyBhc3NvY2lhdGVkIHdpdGguICovXHJcbiAgZGF0ZXBpY2tlcklucHV0OiBOZ3hNYXREYXRldGltZUlucHV0PEQ+O1xyXG5cclxuICAvKiogRW1pdHMgd2hlbiB0aGUgZGF0ZXBpY2tlciBpcyBkaXNhYmxlZC4gKi9cclxuICByZWFkb25seSBzdGF0ZUNoYW5nZXMgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xyXG5cclxuICAvKiogRW1pdHMgbmV3IHNlbGVjdGVkIGRhdGUgd2hlbiBzZWxlY3RlZCBkYXRlIGNoYW5nZXMuICovXHJcbiAgcmVhZG9ubHkgX3NlbGVjdGVkQ2hhbmdlZCA9IG5ldyBTdWJqZWN0PEQ+KCk7XHJcblxyXG4gIC8qKiBSYXcgdmFsdWUgYmVmb3JlICAqL1xyXG4gIHByaXZhdGUgX3Jhd1ZhbHVlOiBEO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9kaWFsb2c6IE1hdERpYWxvZyxcclxuICAgIHByaXZhdGUgX292ZXJsYXk6IE92ZXJsYXksXHJcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcclxuICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXHJcbiAgICBASW5qZWN0KE1BVF9EQVRFUElDS0VSX1NDUk9MTF9TVFJBVEVHWSkgc2Nyb2xsU3RyYXRlZ3k6IGFueSxcclxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RhdGVBZGFwdGVyOiBOZ3hNYXREYXRlQWRhcHRlcjxEPixcclxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHksXHJcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIF9kb2N1bWVudDogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuX2RhdGVBZGFwdGVyKSB7XHJcbiAgICAgIHRocm93IGNyZWF0ZU1pc3NpbmdEYXRlSW1wbEVycm9yKCdOZ3hNYXREYXRlQWRhcHRlcicpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5ID0gc2Nyb2xsU3RyYXRlZ3k7XHJcbiAgfVxyXG5cclxuICBuZ09uRGVzdHJveSgpIHtcclxuICAgIHRoaXMuY2xvc2UoKTtcclxuXHJcbiAgICBpZiAodGhpcy5fcG9wdXBSZWYpIHtcclxuICAgICAgdGhpcy5fcG9wdXBSZWYuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLl9wb3B1cENvbXBvbmVudFJlZiA9IG51bGw7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9pbnB1dFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xyXG4gICAgdGhpcy5zdGF0ZUNoYW5nZXMuY29tcGxldGUoKTtcclxuICB9XHJcblxyXG4gIC8qKiBUaGUgZm9ybSBjb250cm9sIHZhbGlkYXRvciBmb3IgdGhlIG1pbiBkYXRlLiAqL1xyXG4gIHByaXZhdGUgX21pblZhbGlkYXRvciA9ICgpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCA9PiB7XHJcbiAgICByZXR1cm4gKCF0aGlzLl9taW5EYXRlIHx8ICF0aGlzLl9zZWxlY3RlZCB8fFxyXG4gICAgICB0aGlzLl9kYXRlQWRhcHRlci5jb21wYXJlRGF0ZVdpdGhUaW1lKHRoaXMuX21pbkRhdGUsIHRoaXMuX3NlbGVjdGVkLCB0aGlzLnNob3dTZWNvbmRzKSA8PSAwKSA/XHJcbiAgICAgIG51bGwgOiB7ICdtYXREYXRldGltZVBpY2tlck1pbic6IHsgJ21pbic6IHRoaXMuX21pbkRhdGUsICdhY3R1YWwnOiB0aGlzLl9zZWxlY3RlZCB9IH07XHJcbiAgfVxyXG5cclxuICAvKiogVGhlIGZvcm0gY29udHJvbCB2YWxpZGF0b3IgZm9yIHRoZSBtYXggZGF0ZS4gKi9cclxuICBwcml2YXRlIF9tYXhWYWxpZGF0b3IgPSAoKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT4ge1xyXG4gICAgcmV0dXJuICghdGhpcy5fbWF4RGF0ZSB8fCAhdGhpcy5fc2VsZWN0ZWQgfHxcclxuICAgICAgdGhpcy5fZGF0ZUFkYXB0ZXIuY29tcGFyZURhdGVXaXRoVGltZSh0aGlzLl9tYXhEYXRlLCB0aGlzLl9zZWxlY3RlZCwgdGhpcy5zaG93U2Vjb25kcykgPj0gMCkgP1xyXG4gICAgICBudWxsIDogeyAnbWF0RGF0ZXRpbWVQaWNrZXJNYXgnOiB7ICdtYXgnOiB0aGlzLl9tYXhEYXRlLCAnYWN0dWFsJzogdGhpcy5fc2VsZWN0ZWQgfSB9O1xyXG4gIH1cclxuXHJcbiAgLyoqIFNlbGVjdHMgdGhlIGdpdmVuIGRhdGUgKi9cclxuICBzZWxlY3QoZGF0ZTogRCk6IHZvaWQge1xyXG4gICAgdGhpcy5fZGF0ZUFkYXB0ZXIuY29weVRpbWUoZGF0ZSwgdGhpcy5fc2VsZWN0ZWQpO1xyXG4gICAgdGhpcy5fc2VsZWN0ZWQgPSBkYXRlO1xyXG4gIH1cclxuXHJcbiAgLyoqIEVtaXRzIHRoZSBzZWxlY3RlZCB5ZWFyIGluIG11bHRpeWVhciB2aWV3ICovXHJcbiAgX3NlbGVjdFllYXIobm9ybWFsaXplZFllYXI6IEQpOiB2b2lkIHtcclxuICAgIHRoaXMueWVhclNlbGVjdGVkLmVtaXQobm9ybWFsaXplZFllYXIpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEVtaXRzIHNlbGVjdGVkIG1vbnRoIGluIHllYXIgdmlldyAqL1xyXG4gIF9zZWxlY3RNb250aChub3JtYWxpemVkTW9udGg6IEQpOiB2b2lkIHtcclxuICAgIHRoaXMubW9udGhTZWxlY3RlZC5lbWl0KG5vcm1hbGl6ZWRNb250aCk7XHJcbiAgfVxyXG5cclxuICAvKiogT0sgYnV0dG9uIGhhbmRsZXIgYW5kIGNsb3NlKi9cclxuICBwdWJsaWMgb2soKTogdm9pZCB7XHJcbiAgICBjb25zdCBjbG9uZWQgPSB0aGlzLl9kYXRlQWRhcHRlci5jbG9uZSh0aGlzLl9zZWxlY3RlZCk7XHJcbiAgICB0aGlzLl9zZWxlY3RlZENoYW5nZWQubmV4dChjbG9uZWQpO1xyXG4gICAgdGhpcy5jbG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqIENhbmNlbCBhbmQgY2xvc2UgKi9cclxuICBwdWJsaWMgY2FuY2VsKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fc2VsZWN0ZWQgPSB0aGlzLl9yYXdWYWx1ZTtcclxuICAgIHRoaXMuY2xvc2UoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIGFuIGlucHV0IHdpdGggdGhpcyBkYXRlcGlja2VyLlxyXG4gICAqIEBwYXJhbSBpbnB1dCBUaGUgZGF0ZXBpY2tlciBpbnB1dCB0byByZWdpc3RlciB3aXRoIHRoaXMgZGF0ZXBpY2tlci5cclxuICAgKi9cclxuICBfcmVnaXN0ZXJJbnB1dChpbnB1dDogTmd4TWF0RGF0ZXRpbWVJbnB1dDxEPik6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuZGF0ZXBpY2tlcklucHV0KSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdBIE5neE1hdERhdGVwaWNrZXIgY2FuIG9ubHkgYmUgYXNzb2NpYXRlZCB3aXRoIGEgc2luZ2xlIGlucHV0LicpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYXRlcGlja2VySW5wdXQgPSBpbnB1dDtcclxuICAgIHRoaXMuX2lucHV0U3Vic2NyaXB0aW9uID1cclxuICAgICAgdGhpcy5kYXRlcGlja2VySW5wdXQuX3ZhbHVlQ2hhbmdlLnN1YnNjcmliZSgodmFsdWU6IEQgfCBudWxsKSA9PiB0aGlzLl9zZWxlY3RlZCA9IHZhbHVlKTtcclxuICB9XHJcblxyXG4gIC8qKiBPcGVuIHRoZSBjYWxlbmRhci4gKi9cclxuICBvcGVuKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fcmF3VmFsdWUgPSB0aGlzLl9zZWxlY3RlZCAhPSBudWxsXHJcbiAgICAgID8gdGhpcy5fZGF0ZUFkYXB0ZXIuY2xvbmUodGhpcy5fc2VsZWN0ZWQpIDogbnVsbDtcclxuXHJcbiAgICBpZiAodGhpcy5fc2VsZWN0ZWQgPT0gbnVsbCkge1xyXG4gICAgICB0aGlzLl9zZWxlY3RlZCA9IHRoaXMuX2RhdGVBZGFwdGVyLnRvZGF5KCk7XHJcbiAgICAgIGlmICh0aGlzLmRlZmF1bHRUaW1lICE9IG51bGwpIHtcclxuICAgICAgICB0aGlzLl9kYXRlQWRhcHRlci5zZXRUaW1lQnlEZWZhdWx0VmFsdWVzKHRoaXMuX3NlbGVjdGVkLCB0aGlzLmRlZmF1bHRUaW1lKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9vcGVuZWQgfHwgdGhpcy5kaXNhYmxlZCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMuZGF0ZXBpY2tlcklucHV0KSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdBdHRlbXB0ZWQgdG8gb3BlbiBhbiBOZ3hNYXREYXRlcGlja2VyIHdpdGggbm8gYXNzb2NpYXRlZCBpbnB1dC4nKTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLl9kb2N1bWVudCkge1xyXG4gICAgICB0aGlzLl9mb2N1c2VkRWxlbWVudEJlZm9yZU9wZW4gPSB0aGlzLl9kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudG91Y2hVaSA/IHRoaXMuX29wZW5Bc0RpYWxvZygpIDogdGhpcy5fb3BlbkFzUG9wdXAoKTtcclxuICAgIHRoaXMuX29wZW5lZCA9IHRydWU7XHJcbiAgICB0aGlzLm9wZW5lZFN0cmVhbS5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICAvKiogQ2xvc2UgdGhlIGNhbGVuZGFyLiAqL1xyXG4gIGNsb3NlKCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLl9vcGVuZWQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX3BvcHVwUmVmICYmIHRoaXMuX3BvcHVwUmVmLmhhc0F0dGFjaGVkKCkpIHtcclxuICAgICAgdGhpcy5fcG9wdXBSZWYuZGV0YWNoKCk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fZGlhbG9nUmVmKSB7XHJcbiAgICAgIHRoaXMuX2RpYWxvZ1JlZi5jbG9zZSgpO1xyXG4gICAgICB0aGlzLl9kaWFsb2dSZWYgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX2NhbGVuZGFyUG9ydGFsICYmIHRoaXMuX2NhbGVuZGFyUG9ydGFsLmlzQXR0YWNoZWQpIHtcclxuICAgICAgdGhpcy5fY2FsZW5kYXJQb3J0YWwuZGV0YWNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY29tcGxldGVDbG9zZSA9ICgpID0+IHtcclxuICAgICAgLy8gVGhlIGBfb3BlbmVkYCBjb3VsZCd2ZSBiZWVuIHJlc2V0IGFscmVhZHkgaWZcclxuICAgICAgLy8gd2UgZ290IHR3byBldmVudHMgaW4gcXVpY2sgc3VjY2Vzc2lvbi5cclxuICAgICAgaWYgKHRoaXMuX29wZW5lZCkge1xyXG4gICAgICAgIHRoaXMuX29wZW5lZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY2xvc2VkU3RyZWFtLmVtaXQoKTtcclxuICAgICAgICB0aGlzLl9mb2N1c2VkRWxlbWVudEJlZm9yZU9wZW4gPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0aGlzLl9mb2N1c2VkRWxlbWVudEJlZm9yZU9wZW4gJiZcclxuICAgICAgdHlwZW9mIHRoaXMuX2ZvY3VzZWRFbGVtZW50QmVmb3JlT3Blbi5mb2N1cyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAvLyBCZWNhdXNlIElFIG1vdmVzIGZvY3VzIGFzeW5jaHJvbm91c2x5LCB3ZSBjYW4ndCBjb3VudCBvbiBpdCBiZWluZyByZXN0b3JlZCBiZWZvcmUgd2UndmVcclxuICAgICAgLy8gbWFya2VkIHRoZSBkYXRlcGlja2VyIGFzIGNsb3NlZC4gSWYgdGhlIGV2ZW50IGZpcmVzIG91dCBvZiBzZXF1ZW5jZSBhbmQgdGhlIGVsZW1lbnQgdGhhdFxyXG4gICAgICAvLyB3ZSdyZSByZWZvY3VzaW5nIG9wZW5zIHRoZSBkYXRlcGlja2VyIG9uIGZvY3VzLCB0aGUgdXNlciBjb3VsZCBiZSBzdHVjayB3aXRoIG5vdCBiZWluZ1xyXG4gICAgICAvLyBhYmxlIHRvIGNsb3NlIHRoZSBjYWxlbmRhciBhdCBhbGwuIFdlIHdvcmsgYXJvdW5kIGl0IGJ5IG1ha2luZyB0aGUgbG9naWMsIHRoYXQgbWFya3NcclxuICAgICAgLy8gdGhlIGRhdGVwaWNrZXIgYXMgY2xvc2VkLCBhc3luYyBhcyB3ZWxsLlxyXG4gICAgICB0aGlzLl9mb2N1c2VkRWxlbWVudEJlZm9yZU9wZW4uZm9jdXMoKTtcclxuICAgICAgc2V0VGltZW91dChjb21wbGV0ZUNsb3NlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbXBsZXRlQ2xvc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKiBPcGVuIHRoZSBjYWxlbmRhciBhcyBhIGRpYWxvZy4gKi9cclxuICBwcml2YXRlIF9vcGVuQXNEaWFsb2coKTogdm9pZCB7XHJcbiAgICAvLyBVc3VhbGx5IHRoaXMgd291bGQgYmUgaGFuZGxlZCBieSBgb3BlbmAgd2hpY2ggZW5zdXJlcyB0aGF0IHdlIGNhbiBvbmx5IGhhdmUgb25lIG92ZXJsYXlcclxuICAgIC8vIG9wZW4gYXQgYSB0aW1lLCBob3dldmVyIHNpbmNlIHdlIHJlc2V0IHRoZSB2YXJpYWJsZXMgaW4gYXN5bmMgaGFuZGxlcnMgc29tZSBvdmVybGF5c1xyXG4gICAgLy8gbWF5IHNsaXAgdGhyb3VnaCBpZiB0aGUgdXNlciBvcGVucyBhbmQgY2xvc2VzIG11bHRpcGxlIHRpbWVzIGluIHF1aWNrIHN1Y2Nlc3Npb24gKGUuZy5cclxuICAgIC8vIGJ5IGhvbGRpbmcgZG93biB0aGUgZW50ZXIga2V5KS5cclxuICAgIGlmICh0aGlzLl9kaWFsb2dSZWYpIHtcclxuICAgICAgdGhpcy5fZGlhbG9nUmVmLmNsb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZGlhbG9nUmVmID0gdGhpcy5fZGlhbG9nLm9wZW48Tmd4TWF0RGF0ZXRpbWVDb250ZW50PEQ+PihOZ3hNYXREYXRldGltZUNvbnRlbnQsIHtcclxuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXIgPyB0aGlzLl9kaXIudmFsdWUgOiAnbHRyJyxcclxuICAgICAgdmlld0NvbnRhaW5lclJlZjogdGhpcy5fdmlld0NvbnRhaW5lclJlZixcclxuICAgICAgcGFuZWxDbGFzczogJ21hdC1kYXRlcGlja2VyLWRpYWxvZycsXHJcbiAgICAgIGhhc0JhY2tkcm9wOiB0aGlzLl9oYXNCYWNrZHJvcFxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5fZGlhbG9nUmVmLmFmdGVyQ2xvc2VkKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuY2xvc2UoKSk7XHJcbiAgICB0aGlzLl9kaWFsb2dSZWYuY29tcG9uZW50SW5zdGFuY2UuZGF0ZXBpY2tlciA9IHRoaXM7XHJcbiAgICB0aGlzLl9zZXRDb2xvcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqIE9wZW4gdGhlIGNhbGVuZGFyIGFzIGEgcG9wdXAuICovXHJcbiAgcHJpdmF0ZSBfb3BlbkFzUG9wdXAoKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMuX2NhbGVuZGFyUG9ydGFsKSB7XHJcbiAgICAgIHRoaXMuX2NhbGVuZGFyUG9ydGFsID0gbmV3IENvbXBvbmVudFBvcnRhbDxOZ3hNYXREYXRldGltZUNvbnRlbnQ8RD4+KE5neE1hdERhdGV0aW1lQ29udGVudCxcclxuICAgICAgICB0aGlzLl92aWV3Q29udGFpbmVyUmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuX3BvcHVwUmVmKSB7XHJcbiAgICAgIHRoaXMuX2NyZWF0ZVBvcHVwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLl9wb3B1cFJlZi5oYXNBdHRhY2hlZCgpKSB7XHJcbiAgICAgIHRoaXMuX3BvcHVwQ29tcG9uZW50UmVmID0gdGhpcy5fcG9wdXBSZWYuYXR0YWNoKHRoaXMuX2NhbGVuZGFyUG9ydGFsKTtcclxuICAgICAgdGhpcy5fcG9wdXBDb21wb25lbnRSZWYuaW5zdGFuY2UuZGF0ZXBpY2tlciA9IHRoaXM7XHJcbiAgICAgIHRoaXMuX3NldENvbG9yKCk7XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIHBvc2l0aW9uIG9uY2UgdGhlIGNhbGVuZGFyIGhhcyByZW5kZXJlZC5cclxuICAgICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLmFzT2JzZXJ2YWJsZSgpLnBpcGUodGFrZSgxKSkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICB0aGlzLl9wb3B1cFJlZi51cGRhdGVQb3NpdGlvbigpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKiBDcmVhdGUgdGhlIHBvcHVwLiAqL1xyXG4gIHByaXZhdGUgX2NyZWF0ZVBvcHVwKCk6IHZvaWQge1xyXG4gICAgY29uc3Qgb3ZlcmxheUNvbmZpZyA9IG5ldyBPdmVybGF5Q29uZmlnKHtcclxuICAgICAgcG9zaXRpb25TdHJhdGVneTogdGhpcy5fY3JlYXRlUG9wdXBQb3NpdGlvblN0cmF0ZWd5KCksXHJcbiAgICAgIGhhc0JhY2tkcm9wOiB0aGlzLl9oYXNCYWNrZHJvcCxcclxuICAgICAgYmFja2Ryb3BDbGFzczogJ21hdC1vdmVybGF5LXRyYW5zcGFyZW50LWJhY2tkcm9wJyxcclxuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXIsXHJcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLl9zY3JvbGxTdHJhdGVneSgpLFxyXG4gICAgICBwYW5lbENsYXNzOiAnbWF0LWRhdGVwaWNrZXItcG9wdXAnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5fcG9wdXBSZWYgPSB0aGlzLl9vdmVybGF5LmNyZWF0ZShvdmVybGF5Q29uZmlnKTtcclxuICAgIHRoaXMuX3BvcHVwUmVmLm92ZXJsYXlFbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsICdkaWFsb2cnKTtcclxuXHJcbiAgICBtZXJnZShcclxuICAgICAgdGhpcy5fcG9wdXBSZWYuYmFja2Ryb3BDbGljaygpLFxyXG4gICAgICB0aGlzLl9wb3B1cFJlZi5kZXRhY2htZW50cygpLFxyXG4gICAgICB0aGlzLl9wb3B1cFJlZi5rZXlkb3duRXZlbnRzKCkucGlwZShmaWx0ZXIoZXZlbnQgPT4ge1xyXG4gICAgICAgIC8vIENsb3Npbmcgb24gYWx0ICsgdXAgaXMgb25seSB2YWxpZCB3aGVuIHRoZXJlJ3MgYW4gaW5wdXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkYXRlcGlja2VyLlxyXG4gICAgICAgIHJldHVybiBldmVudC5rZXlDb2RlID09PSBFU0NBUEUgfHxcclxuICAgICAgICAgICh0aGlzLmRhdGVwaWNrZXJJbnB1dCAmJiBldmVudC5hbHRLZXkgJiYgZXZlbnQua2V5Q29kZSA9PT0gVVBfQVJST1cpO1xyXG4gICAgICB9KSlcclxuICAgICkuc3Vic2NyaWJlKGV2ZW50ID0+IHtcclxuICAgICAgaWYgKGV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgKHRoaXMuX2hhc0JhY2tkcm9wICYmIGV2ZW50KSA/IHRoaXMuY2FuY2VsKCkgOiB0aGlzLmNsb3NlKCk7XHJcblxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKiogQ3JlYXRlIHRoZSBwb3B1cCBQb3NpdGlvblN0cmF0ZWd5LiAqL1xyXG4gIHByaXZhdGUgX2NyZWF0ZVBvcHVwUG9zaXRpb25TdHJhdGVneSgpOiBQb3NpdGlvblN0cmF0ZWd5IHtcclxuICAgIHJldHVybiB0aGlzLl9vdmVybGF5LnBvc2l0aW9uKClcclxuICAgICAgLmZsZXhpYmxlQ29ubmVjdGVkVG8odGhpcy5kYXRlcGlja2VySW5wdXQuZ2V0Q29ubmVjdGVkT3ZlcmxheU9yaWdpbigpKVxyXG4gICAgICAud2l0aFRyYW5zZm9ybU9yaWdpbk9uKCcubWF0LWRhdGVwaWNrZXItY29udGVudCcpXHJcbiAgICAgIC53aXRoRmxleGlibGVEaW1lbnNpb25zKGZhbHNlKVxyXG4gICAgICAud2l0aFZpZXdwb3J0TWFyZ2luKDgpXHJcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24oKVxyXG4gICAgICAud2l0aFBvc2l0aW9ucyhbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgb3JpZ2luWDogJ3N0YXJ0JyxcclxuICAgICAgICAgIG9yaWdpblk6ICdib3R0b20nLFxyXG4gICAgICAgICAgb3ZlcmxheVg6ICdzdGFydCcsXHJcbiAgICAgICAgICBvdmVybGF5WTogJ3RvcCdcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIG9yaWdpblg6ICdzdGFydCcsXHJcbiAgICAgICAgICBvcmlnaW5ZOiAndG9wJyxcclxuICAgICAgICAgIG92ZXJsYXlYOiAnc3RhcnQnLFxyXG4gICAgICAgICAgb3ZlcmxheVk6ICdib3R0b20nXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBvcmlnaW5YOiAnZW5kJyxcclxuICAgICAgICAgIG9yaWdpblk6ICdib3R0b20nLFxyXG4gICAgICAgICAgb3ZlcmxheVg6ICdlbmQnLFxyXG4gICAgICAgICAgb3ZlcmxheVk6ICd0b3AnXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBvcmlnaW5YOiAnZW5kJyxcclxuICAgICAgICAgIG9yaWdpblk6ICd0b3AnLFxyXG4gICAgICAgICAgb3ZlcmxheVg6ICdlbmQnLFxyXG4gICAgICAgICAgb3ZlcmxheVk6ICdib3R0b20nXHJcbiAgICAgICAgfVxyXG4gICAgICBdKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBjaGVjay5cclxuICAgKiBAcmV0dXJucyBUaGUgZ2l2ZW4gb2JqZWN0IGlmIGl0IGlzIGJvdGggYSBkYXRlIGluc3RhbmNlIGFuZCB2YWxpZCwgb3RoZXJ3aXNlIG51bGwuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZ2V0VmFsaWREYXRlT3JOdWxsKG9iajogYW55KTogRCB8IG51bGwge1xyXG4gICAgcmV0dXJuICh0aGlzLl9kYXRlQWRhcHRlci5pc0RhdGVJbnN0YW5jZShvYmopICYmIHRoaXMuX2RhdGVBZGFwdGVyLmlzVmFsaWQob2JqKSkgPyBvYmogOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqIFBhc3NlcyB0aGUgY3VycmVudCB0aGVtZSBjb2xvciBhbG9uZyB0byB0aGUgY2FsZW5kYXIgb3ZlcmxheS4gKi9cclxuICBwcml2YXRlIF9zZXRDb2xvcigpOiB2b2lkIHtcclxuICAgIGNvbnN0IGNvbG9yID0gdGhpcy5jb2xvcjtcclxuICAgIGlmICh0aGlzLl9wb3B1cENvbXBvbmVudFJlZikge1xyXG4gICAgICB0aGlzLl9wb3B1cENvbXBvbmVudFJlZi5pbnN0YW5jZS5jb2xvciA9IGNvbG9yO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX2RpYWxvZ1JlZikge1xyXG4gICAgICB0aGlzLl9kaWFsb2dSZWYuY29tcG9uZW50SW5zdGFuY2UuY29sb3IgPSBjb2xvcjtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcbiIsIjxuZ3gtbWF0LWNhbGVuZGFyIGNka1RyYXBGb2N1cyBbaWRdPVwiZGF0ZXBpY2tlci5pZFwiIFtuZ0NsYXNzXT1cImRhdGVwaWNrZXIucGFuZWxDbGFzc1wiIFtzdGFydEF0XT1cImRhdGVwaWNrZXIuc3RhcnRBdFwiXHJcbiAgICBbc3RhcnRWaWV3XT1cImRhdGVwaWNrZXIuc3RhcnRWaWV3XCIgW21pbkRhdGVdPVwiZGF0ZXBpY2tlci5fbWluRGF0ZVwiIFttYXhEYXRlXT1cImRhdGVwaWNrZXIuX21heERhdGVcIlxyXG4gICAgW2RhdGVGaWx0ZXJdPVwiZGF0ZXBpY2tlci5fZGF0ZUZpbHRlclwiIFtoZWFkZXJDb21wb25lbnRdPVwiZGF0ZXBpY2tlci5jYWxlbmRhckhlYWRlckNvbXBvbmVudFwiXHJcbiAgICBbc2VsZWN0ZWRdPVwiZGF0ZXBpY2tlci5fc2VsZWN0ZWRcIiBbZGF0ZUNsYXNzXT1cImRhdGVwaWNrZXIuZGF0ZUNsYXNzXCIgW0BmYWRlSW5DYWxlbmRhcl09XCInZW50ZXInXCJcclxuICAgIChzZWxlY3RlZENoYW5nZSk9XCJkYXRlcGlja2VyLnNlbGVjdCgkZXZlbnQpXCIgKHllYXJTZWxlY3RlZCk9XCJkYXRlcGlja2VyLl9zZWxlY3RZZWFyKCRldmVudClcIlxyXG4gICAgKG1vbnRoU2VsZWN0ZWQpPVwiZGF0ZXBpY2tlci5fc2VsZWN0TW9udGgoJGV2ZW50KVwiPlxyXG48L25neC1tYXQtY2FsZW5kYXI+XHJcbjxuZy1jb250YWluZXIgKm5nSWY9XCJpc1ZpZXdNb250aFwiPlxyXG4gICAgPGRpdiAqbmdJZj1cIiFkYXRlcGlja2VyLl9oaWRlVGltZVwiIGNsYXNzPVwidGltZS1jb250YWluZXJcIiBbY2xhc3MuZGlzYWJsZS1zZWNvbmRzXT1cIiFkYXRlcGlja2VyLl9zaG93U2Vjb25kc1wiPlxyXG4gICAgICAgIDxuZ3gtbWF0LXRpbWVwaWNrZXIgW3Nob3dTcGlubmVyc109XCJkYXRlcGlja2VyLl9zaG93U3Bpbm5lcnNcIiBbc2hvd1NlY29uZHNdPVwiZGF0ZXBpY2tlci5fc2hvd1NlY29uZHNcIlxyXG4gICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGF0ZXBpY2tlci5fZGlzYWJsZWRcIiBbc3RlcEhvdXJdPVwiZGF0ZXBpY2tlci5fc3RlcEhvdXJcIiBbc3RlcE1pbnV0ZV09XCJkYXRlcGlja2VyLl9zdGVwTWludXRlXCJcclxuICAgICAgICAgICAgW3N0ZXBTZWNvbmRdPVwiZGF0ZXBpY2tlci5fc3RlcFNlY29uZFwiIFsobmdNb2RlbCldPVwiZGF0ZXBpY2tlci5fc2VsZWN0ZWRcIiBbY29sb3JdPVwiZGF0ZXBpY2tlci5fY29sb3JcIlxyXG4gICAgICAgICAgICBbZW5hYmxlTWVyaWRpYW5dPVwiZGF0ZXBpY2tlci5fZW5hYmxlTWVyaWRpYW5cIiBbZGlzYWJsZU1pbnV0ZV09XCJkYXRlcGlja2VyLl9kaXNhYmxlTWludXRlXCI+XHJcbiAgICAgICAgPC9uZ3gtbWF0LXRpbWVwaWNrZXI+XHJcbiAgICA8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+XHJcbiAgICAgICAgPGJ1dHRvbiBtYXQtYnV0dG9uIChjbGljayk9XCJkYXRlcGlja2VyLm9rKClcIiBtYXQtc3Ryb2tlZC1idXR0b24gW2NvbG9yXT1cImRhdGVwaWNrZXIuX2NvbG9yXCIgY2RrRm9jdXNJbml0aWFsXHJcbiAgICAgICAgICAgIFtkaXNhYmxlZF09XCIhdmFsaWRcIj5cclxuICAgICAgICAgICAgPG1hdC1pY29uICpuZ0lmPVwiIWRhdGVwaWNrZXIuX2N1c3RvbUljb25cIj5kb25lPC9tYXQtaWNvbj5cclxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlIFtjZGtQb3J0YWxPdXRsZXRdPVwiX3RlbXBsYXRlQ3VzdG9tSWNvblBvcnRhbFwiPjwvbmctdGVtcGxhdGU+XHJcbiAgICAgICAgPC9idXR0b24+XHJcbiAgICA8L2Rpdj5cclxuPC9uZy1jb250YWluZXI+Il19