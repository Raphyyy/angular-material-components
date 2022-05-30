/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PlatformModule } from '@angular/cdk/platform';
import { NgModule } from '@angular/core';
import { NgxMatDateAdapter } from './date-adapter';
import { NgxMatNativeDateAdapter } from './native-date-adapter';
import { NGX_MAT_NATIVE_DATE_FORMATS } from './native-date-formats';
import { NGX_MAT_DATE_FORMATS } from './date-formats';
import * as i0 from "@angular/core";
export class NgxNativeDateModule {
}
/** @nocollapse */ /** @nocollapse */ NgxNativeDateModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
/** @nocollapse */ /** @nocollapse */ NgxNativeDateModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, imports: [PlatformModule] });
/** @nocollapse */ /** @nocollapse */ NgxNativeDateModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, providers: [
        { provide: NgxMatDateAdapter, useClass: NgxMatNativeDateAdapter },
    ], imports: [[PlatformModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxNativeDateModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [PlatformModule],
                    providers: [
                        { provide: NgxMatDateAdapter, useClass: NgxMatNativeDateAdapter },
                    ],
                }]
        }] });
export class NgxMatNativeDateModule {
}
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, imports: [NgxNativeDateModule] });
/** @nocollapse */ /** @nocollapse */ NgxMatNativeDateModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, providers: [{ provide: NGX_MAT_DATE_FORMATS, useValue: NGX_MAT_NATIVE_DATE_FORMATS }], imports: [[NgxNativeDateModule]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: NgxMatNativeDateModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [NgxNativeDateModule],
                    providers: [{ provide: NGX_MAT_DATE_FORMATS, useValue: NGX_MAT_NATIVE_DATE_FORMATS }],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlLWRhdGUubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIvY29yZS9uYXRpdmUtZGF0ZS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkQsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDaEUsT0FBTyxFQUFFLDJCQUEyQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDcEUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sZ0JBQWdCLENBQUM7O0FBU3RELE1BQU0sT0FBTyxtQkFBbUI7O3NKQUFuQixtQkFBbUI7dUpBQW5CLG1CQUFtQixZQUxsQixjQUFjO3VKQUtmLG1CQUFtQixhQUpqQjtRQUNQLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBRSx1QkFBdUIsRUFBRTtLQUNwRSxZQUhRLENBQUMsY0FBYyxDQUFDOzJGQUtoQixtQkFBbUI7a0JBTi9CLFFBQVE7bUJBQUM7b0JBQ04sT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO29CQUN6QixTQUFTLEVBQUU7d0JBQ1AsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLHVCQUF1QixFQUFFO3FCQUNwRTtpQkFDSjs7QUFPRCxNQUFNLE9BQU8sc0JBQXNCOzt5SkFBdEIsc0JBQXNCOzBKQUF0QixzQkFBc0IsWUFOdEIsbUJBQW1COzBKQU1uQixzQkFBc0IsYUFGcEIsQ0FBQyxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsMkJBQTJCLEVBQUUsQ0FBQyxZQUQ1RSxDQUFDLG1CQUFtQixDQUFDOzJGQUdyQixzQkFBc0I7a0JBSmxDLFFBQVE7bUJBQUM7b0JBQ04sT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQUM7b0JBQzlCLFNBQVMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLFFBQVEsRUFBRSwyQkFBMkIsRUFBRSxDQUFDO2lCQUN4RiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAbGljZW5zZVxyXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxyXG4gKlxyXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxyXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUGxhdGZvcm1Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xyXG5pbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBOZ3hNYXREYXRlQWRhcHRlciB9IGZyb20gJy4vZGF0ZS1hZGFwdGVyJztcclxuaW1wb3J0IHsgTmd4TWF0TmF0aXZlRGF0ZUFkYXB0ZXIgfSBmcm9tICcuL25hdGl2ZS1kYXRlLWFkYXB0ZXInO1xyXG5pbXBvcnQgeyBOR1hfTUFUX05BVElWRV9EQVRFX0ZPUk1BVFMgfSBmcm9tICcuL25hdGl2ZS1kYXRlLWZvcm1hdHMnO1xyXG5pbXBvcnQgeyBOR1hfTUFUX0RBVEVfRk9STUFUUyB9IGZyb20gJy4vZGF0ZS1mb3JtYXRzJztcclxuXHJcblxyXG5ATmdNb2R1bGUoe1xyXG4gICAgaW1wb3J0czogW1BsYXRmb3JtTW9kdWxlXSxcclxuICAgIHByb3ZpZGVyczogW1xyXG4gICAgICAgIHsgcHJvdmlkZTogTmd4TWF0RGF0ZUFkYXB0ZXIsIHVzZUNsYXNzOiBOZ3hNYXROYXRpdmVEYXRlQWRhcHRlciB9LFxyXG4gICAgXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIE5neE5hdGl2ZURhdGVNb2R1bGUgeyB9XHJcblxyXG5ATmdNb2R1bGUoe1xyXG4gICAgaW1wb3J0czogW05neE5hdGl2ZURhdGVNb2R1bGVdLFxyXG4gICAgcHJvdmlkZXJzOiBbeyBwcm92aWRlOiBOR1hfTUFUX0RBVEVfRk9STUFUUywgdXNlVmFsdWU6IE5HWF9NQVRfTkFUSVZFX0RBVEVfRk9STUFUUyB9XSxcclxufSlcclxuZXhwb3J0IGNsYXNzIE5neE1hdE5hdGl2ZURhdGVNb2R1bGUgeyB9XHJcbiJdfQ==