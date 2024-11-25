import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule, MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxMatCalendar, NgxMatCalendarHeader } from './calendar';
import { NgxMatCalendarBody } from './calendar-body';
import { DefaultNgxMatCalendarRangeStrategy, NGX_MAT_DATE_RANGE_SELECTION_STRATEGY } from './date-range-selection-strategy';
import { NgxMatDatetimeInput } from './datetime-input';
import { NgxMatDatetimeContent, NgxMatDatetimePicker } from './datetime-picker.component';
import { NgxMatMonthView } from './month-view';
import { NgxMatMultiYearView } from './multi-year-view';
import { NgxMatTimepickerModule } from './timepicker.module';
import { NgxMatYearView } from './year-view';
import * as i0 from "@angular/core";
export class NgxMatDatetimePickerModule {
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimePickerModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    /** @nocollapse */ static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimePickerModule, declarations: [NgxMatDatetimePicker,
            NgxMatDatetimeContent,
            NgxMatDatetimeInput,
            NgxMatCalendar,
            NgxMatMonthView,
            NgxMatCalendarBody,
            NgxMatYearView,
            NgxMatMultiYearView,
            NgxMatCalendarHeader], imports: [CommonModule,
            MatDatepickerModule,
            MatDialogModule,
            PortalModule,
            FormsModule,
            MatIconModule,
            MatButtonModule,
            MatInputModule,
            NgxMatTimepickerModule], exports: [NgxMatDatetimePicker,
            NgxMatDatetimeInput,
            NgxMatCalendar,
            NgxMatMonthView,
            NgxMatCalendarBody,
            NgxMatYearView,
            NgxMatMultiYearView,
            NgxMatCalendarHeader] });
    /** @nocollapse */ static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimePickerModule, providers: [
            MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER,
            {
                provide: NGX_MAT_DATE_RANGE_SELECTION_STRATEGY,
                useClass: DefaultNgxMatCalendarRangeStrategy
            }
        ], imports: [CommonModule,
            MatDatepickerModule,
            MatDialogModule,
            PortalModule,
            FormsModule,
            MatIconModule,
            MatButtonModule,
            MatInputModule,
            NgxMatTimepickerModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.11", ngImport: i0, type: NgxMatDatetimePickerModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        CommonModule,
                        MatDatepickerModule,
                        MatDialogModule,
                        PortalModule,
                        FormsModule,
                        MatIconModule,
                        MatButtonModule,
                        MatInputModule,
                        NgxMatTimepickerModule
                    ],
                    exports: [
                        NgxMatDatetimePicker,
                        NgxMatDatetimeInput,
                        NgxMatCalendar,
                        NgxMatMonthView,
                        NgxMatCalendarBody,
                        NgxMatYearView,
                        NgxMatMultiYearView,
                        NgxMatCalendarHeader
                    ],
                    declarations: [
                        NgxMatDatetimePicker,
                        NgxMatDatetimeContent,
                        NgxMatDatetimeInput,
                        NgxMatCalendar,
                        NgxMatMonthView,
                        NgxMatCalendarBody,
                        NgxMatYearView,
                        NgxMatMultiYearView,
                        NgxMatCalendarHeader
                    ],
                    providers: [
                        MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER,
                        {
                            provide: NGX_MAT_DATE_RANGE_SELECTION_STRATEGY,
                            useClass: DefaultNgxMatCalendarRangeStrategy
                        }
                    ]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZXRpbWUtcGlja2VyLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Byb2plY3RzL2RhdGV0aW1lLXBpY2tlci9zcmMvbGliL2RhdGV0aW1lLXBpY2tlci5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDM0QsT0FBTyxFQUFFLG1CQUFtQixFQUFFLCtDQUErQyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDcEgsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQzNELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDekQsT0FBTyxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNsRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNyRCxPQUFPLEVBQUUsa0NBQWtDLEVBQUUscUNBQXFDLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUM1SCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUN2RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUMxRixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQy9DLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ3hELE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzdELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxhQUFhLENBQUM7O0FBMkM3QyxNQUFNLE9BQU8sMEJBQTBCOzJIQUExQiwwQkFBMEI7NEhBQTFCLDBCQUEwQixpQkFsQi9CLG9CQUFvQjtZQUNwQixxQkFBcUI7WUFDckIsbUJBQW1CO1lBQ25CLGNBQWM7WUFDZCxlQUFlO1lBQ2Ysa0JBQWtCO1lBQ2xCLGNBQWM7WUFDZCxtQkFBbUI7WUFDbkIsb0JBQW9CLGFBN0JwQixZQUFZO1lBQ1osbUJBQW1CO1lBQ25CLGVBQWU7WUFDZixZQUFZO1lBQ1osV0FBVztZQUNYLGFBQWE7WUFDYixlQUFlO1lBQ2YsY0FBYztZQUNkLHNCQUFzQixhQUd0QixvQkFBb0I7WUFDcEIsbUJBQW1CO1lBQ25CLGNBQWM7WUFDZCxlQUFlO1lBQ2Ysa0JBQWtCO1lBQ2xCLGNBQWM7WUFDZCxtQkFBbUI7WUFDbkIsb0JBQW9COzRIQXFCZiwwQkFBMEIsYUFSeEI7WUFDUCwrQ0FBK0M7WUFDL0M7Z0JBQ0ksT0FBTyxFQUFFLHFDQUFxQztnQkFDOUMsUUFBUSxFQUFFLGtDQUFrQzthQUMvQztTQUNKLFlBckNHLFlBQVk7WUFDWixtQkFBbUI7WUFDbkIsZUFBZTtZQUNmLFlBQVk7WUFDWixXQUFXO1lBQ1gsYUFBYTtZQUNiLGVBQWU7WUFDZixjQUFjO1lBQ2Qsc0JBQXNCOzs0RkErQmpCLDBCQUEwQjtrQkF6Q3RDLFFBQVE7bUJBQUM7b0JBQ04sT0FBTyxFQUFFO3dCQUNMLFlBQVk7d0JBQ1osbUJBQW1CO3dCQUNuQixlQUFlO3dCQUNmLFlBQVk7d0JBQ1osV0FBVzt3QkFDWCxhQUFhO3dCQUNiLGVBQWU7d0JBQ2YsY0FBYzt3QkFDZCxzQkFBc0I7cUJBQ3pCO29CQUNELE9BQU8sRUFBRTt3QkFDTCxvQkFBb0I7d0JBQ3BCLG1CQUFtQjt3QkFDbkIsY0FBYzt3QkFDZCxlQUFlO3dCQUNmLGtCQUFrQjt3QkFDbEIsY0FBYzt3QkFDZCxtQkFBbUI7d0JBQ25CLG9CQUFvQjtxQkFDdkI7b0JBQ0QsWUFBWSxFQUFFO3dCQUNWLG9CQUFvQjt3QkFDcEIscUJBQXFCO3dCQUNyQixtQkFBbUI7d0JBQ25CLGNBQWM7d0JBQ2QsZUFBZTt3QkFDZixrQkFBa0I7d0JBQ2xCLGNBQWM7d0JBQ2QsbUJBQW1CO3dCQUNuQixvQkFBb0I7cUJBQ3ZCO29CQUNELFNBQVMsRUFBRTt3QkFDUCwrQ0FBK0M7d0JBQy9DOzRCQUNJLE9BQU8sRUFBRSxxQ0FBcUM7NEJBQzlDLFFBQVEsRUFBRSxrQ0FBa0M7eUJBQy9DO3FCQUNKO2lCQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9ydGFsTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XHJcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XHJcbmltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IEZvcm1zTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xyXG5pbXBvcnQgeyBNYXRCdXR0b25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9idXR0b24nO1xyXG5pbXBvcnQgeyBNYXREYXRlcGlja2VyTW9kdWxlLCBNQVRfREFURVBJQ0tFUl9TQ1JPTExfU1RSQVRFR1lfRkFDVE9SWV9QUk9WSURFUiB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2RhdGVwaWNrZXInO1xyXG5pbXBvcnQgeyBNYXREaWFsb2dNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9kaWFsb2cnO1xyXG5pbXBvcnQgeyBNYXRJY29uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvaWNvbic7XHJcbmltcG9ydCB7IE1hdElucHV0TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvaW5wdXQnO1xyXG5pbXBvcnQgeyBOZ3hNYXRDYWxlbmRhciwgTmd4TWF0Q2FsZW5kYXJIZWFkZXIgfSBmcm9tICcuL2NhbGVuZGFyJztcclxuaW1wb3J0IHsgTmd4TWF0Q2FsZW5kYXJCb2R5IH0gZnJvbSAnLi9jYWxlbmRhci1ib2R5JztcclxuaW1wb3J0IHsgRGVmYXVsdE5neE1hdENhbGVuZGFyUmFuZ2VTdHJhdGVneSwgTkdYX01BVF9EQVRFX1JBTkdFX1NFTEVDVElPTl9TVFJBVEVHWSB9IGZyb20gJy4vZGF0ZS1yYW5nZS1zZWxlY3Rpb24tc3RyYXRlZ3knO1xyXG5pbXBvcnQgeyBOZ3hNYXREYXRldGltZUlucHV0IH0gZnJvbSAnLi9kYXRldGltZS1pbnB1dCc7XHJcbmltcG9ydCB7IE5neE1hdERhdGV0aW1lQ29udGVudCwgTmd4TWF0RGF0ZXRpbWVQaWNrZXIgfSBmcm9tICcuL2RhdGV0aW1lLXBpY2tlci5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyBOZ3hNYXRNb250aFZpZXcgfSBmcm9tICcuL21vbnRoLXZpZXcnO1xyXG5pbXBvcnQgeyBOZ3hNYXRNdWx0aVllYXJWaWV3IH0gZnJvbSAnLi9tdWx0aS15ZWFyLXZpZXcnO1xyXG5pbXBvcnQgeyBOZ3hNYXRUaW1lcGlja2VyTW9kdWxlIH0gZnJvbSAnLi90aW1lcGlja2VyLm1vZHVsZSc7XHJcbmltcG9ydCB7IE5neE1hdFllYXJWaWV3IH0gZnJvbSAnLi95ZWFyLXZpZXcnO1xyXG5cclxuQE5nTW9kdWxlKHtcclxuICAgIGltcG9ydHM6IFtcclxuICAgICAgICBDb21tb25Nb2R1bGUsXHJcbiAgICAgICAgTWF0RGF0ZXBpY2tlck1vZHVsZSxcclxuICAgICAgICBNYXREaWFsb2dNb2R1bGUsXHJcbiAgICAgICAgUG9ydGFsTW9kdWxlLFxyXG4gICAgICAgIEZvcm1zTW9kdWxlLFxyXG4gICAgICAgIE1hdEljb25Nb2R1bGUsXHJcbiAgICAgICAgTWF0QnV0dG9uTW9kdWxlLFxyXG4gICAgICAgIE1hdElucHV0TW9kdWxlLFxyXG4gICAgICAgIE5neE1hdFRpbWVwaWNrZXJNb2R1bGVcclxuICAgIF0sXHJcbiAgICBleHBvcnRzOiBbXHJcbiAgICAgICAgTmd4TWF0RGF0ZXRpbWVQaWNrZXIsXHJcbiAgICAgICAgTmd4TWF0RGF0ZXRpbWVJbnB1dCxcclxuICAgICAgICBOZ3hNYXRDYWxlbmRhcixcclxuICAgICAgICBOZ3hNYXRNb250aFZpZXcsXHJcbiAgICAgICAgTmd4TWF0Q2FsZW5kYXJCb2R5LFxyXG4gICAgICAgIE5neE1hdFllYXJWaWV3LFxyXG4gICAgICAgIE5neE1hdE11bHRpWWVhclZpZXcsXHJcbiAgICAgICAgTmd4TWF0Q2FsZW5kYXJIZWFkZXJcclxuICAgIF0sXHJcbiAgICBkZWNsYXJhdGlvbnM6IFtcclxuICAgICAgICBOZ3hNYXREYXRldGltZVBpY2tlcixcclxuICAgICAgICBOZ3hNYXREYXRldGltZUNvbnRlbnQsXHJcbiAgICAgICAgTmd4TWF0RGF0ZXRpbWVJbnB1dCxcclxuICAgICAgICBOZ3hNYXRDYWxlbmRhcixcclxuICAgICAgICBOZ3hNYXRNb250aFZpZXcsXHJcbiAgICAgICAgTmd4TWF0Q2FsZW5kYXJCb2R5LFxyXG4gICAgICAgIE5neE1hdFllYXJWaWV3LFxyXG4gICAgICAgIE5neE1hdE11bHRpWWVhclZpZXcsXHJcbiAgICAgICAgTmd4TWF0Q2FsZW5kYXJIZWFkZXJcclxuICAgIF0sXHJcbiAgICBwcm92aWRlcnM6IFtcclxuICAgICAgICBNQVRfREFURVBJQ0tFUl9TQ1JPTExfU1RSQVRFR1lfRkFDVE9SWV9QUk9WSURFUixcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByb3ZpZGU6IE5HWF9NQVRfREFURV9SQU5HRV9TRUxFQ1RJT05fU1RSQVRFR1ksXHJcbiAgICAgICAgICAgIHVzZUNsYXNzOiBEZWZhdWx0Tmd4TWF0Q2FsZW5kYXJSYW5nZVN0cmF0ZWd5XHJcbiAgICAgICAgfVxyXG4gICAgXVxyXG59KVxyXG5leHBvcnQgY2xhc3MgTmd4TWF0RGF0ZXRpbWVQaWNrZXJNb2R1bGUgeyB9XHJcbiJdfQ==