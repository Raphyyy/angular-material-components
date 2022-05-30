/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const DEFAULT_DATE_INPUT = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"
};
export const NGX_MAT_NATIVE_DATE_FORMATS = {
    parse: {
        dateInput: DEFAULT_DATE_INPUT,
    },
    display: {
        dateInput: DEFAULT_DATE_INPUT,
        monthYearLabel: { year: 'numeric', month: 'short' },
        dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
        monthYearA11yLabel: { year: 'numeric', month: 'long' },
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlLWRhdGUtZm9ybWF0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2RhdGV0aW1lLXBpY2tlci9zcmMvbGliL2NvcmUvbmF0aXZlLWRhdGUtZm9ybWF0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQTs7Ozs7O0dBTUc7QUFFSCxNQUFNLGtCQUFrQixHQUFHO0lBQ3pCLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsU0FBUztJQUNqRCxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUztDQUNyRSxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sMkJBQTJCLEdBQXNCO0lBQzVELEtBQUssRUFBRTtRQUNMLFNBQVMsRUFBRSxrQkFBa0I7S0FDOUI7SUFDRCxPQUFPLEVBQUU7UUFDUCxTQUFTLEVBQUUsa0JBQWtCO1FBQzdCLGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtRQUNuRCxhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRTtRQUNqRSxrQkFBa0IsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTtLQUN2RDtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ3hNYXREYXRlRm9ybWF0cyB9IGZyb20gJy4vZGF0ZS1mb3JtYXRzJztcclxuXHJcbi8qKlxyXG4gKiBAbGljZW5zZVxyXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxyXG4gKlxyXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxyXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXHJcbiAqL1xyXG5cclxuY29uc3QgREVGQVVMVF9EQVRFX0lOUFVUID0ge1xyXG4gIHllYXI6ICdudW1lcmljJywgbW9udGg6ICdudW1lcmljJywgZGF5OiAnbnVtZXJpYycsXHJcbiAgaG91cjEyOiBmYWxzZSwgaG91cjogXCIyLWRpZ2l0XCIsIG1pbnV0ZTogXCIyLWRpZ2l0XCIsIHNlY29uZDogXCIyLWRpZ2l0XCJcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IE5HWF9NQVRfTkFUSVZFX0RBVEVfRk9STUFUUzogTmd4TWF0RGF0ZUZvcm1hdHMgPSB7XHJcbiAgcGFyc2U6IHtcclxuICAgIGRhdGVJbnB1dDogREVGQVVMVF9EQVRFX0lOUFVULFxyXG4gIH0sXHJcbiAgZGlzcGxheToge1xyXG4gICAgZGF0ZUlucHV0OiBERUZBVUxUX0RBVEVfSU5QVVQsXHJcbiAgICBtb250aFllYXJMYWJlbDogeyB5ZWFyOiAnbnVtZXJpYycsIG1vbnRoOiAnc2hvcnQnIH0sXHJcbiAgICBkYXRlQTExeUxhYmVsOiB7IHllYXI6ICdudW1lcmljJywgbW9udGg6ICdsb25nJywgZGF5OiAnbnVtZXJpYycgfSxcclxuICAgIG1vbnRoWWVhckExMXlMYWJlbDogeyB5ZWFyOiAnbnVtZXJpYycsIG1vbnRoOiAnbG9uZycgfSxcclxuICB9XHJcbn07XHJcbiJdfQ==