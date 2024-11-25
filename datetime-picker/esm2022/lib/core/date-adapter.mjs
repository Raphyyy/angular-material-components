import { DateAdapter } from '@angular/material/core';
export class NgxMatDateAdapter extends DateAdapter {
    /**
     * Check if two date have same time
     * @param a Date 1
     * @param b Date 2
     */
    isSameTime(a, b) {
        if (a == null || b == null)
            return true;
        return this.getHour(a) === this.getHour(b)
            && this.getMinute(a) === this.getMinute(b)
            && this.getSecond(a) === this.getSecond(b);
    }
    /**
     * Copy time from a date to a another date
     * @param toDate
     * @param fromDate
     */
    copyTime(toDate, fromDate) {
        this.setHour(toDate, this.getHour(fromDate));
        this.setMinute(toDate, this.getMinute(fromDate));
        this.setSecond(toDate, this.getSecond(fromDate));
    }
    /**
   * Compares two dates.
   * @param first The first date to compare.
   * @param second The second date to compare.
   * @returns 0 if the dates are equal, a number less than 0 if the first date is earlier,
   *     a number greater than 0 if the first date is later.
   */
    compareDateWithTime(first, second, showSeconds) {
        let res = super.compareDate(first, second) ||
            this.getHour(first) - this.getHour(second) ||
            this.getMinute(first) - this.getMinute(second);
        if (showSeconds) {
            res = res || this.getSecond(first) - this.getSecond(second);
        }
        return res;
    }
    /**
     * Set time by using default values
     * @param defaultTime List default values [hour, minute, second]
     */
    setTimeByDefaultValues(date, defaultTime) {
        if (!Array.isArray(defaultTime)) {
            throw Error('@Input DefaultTime should be an array');
        }
        this.setHour(date, defaultTime[0] || 0);
        this.setMinute(date, defaultTime[1] || 0);
        this.setSecond(date, defaultTime[2] || 0);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvZGF0ZXRpbWUtcGlja2VyL3NyYy9saWIvY29yZS9kYXRlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBRXJELE1BQU0sT0FBZ0IsaUJBQXFCLFNBQVEsV0FBYztJQTJDL0Q7Ozs7T0FJRztJQUNILFVBQVUsQ0FBQyxDQUFJLEVBQUUsQ0FBSTtRQUNuQixJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUk7WUFBRSxPQUFPLElBQUksQ0FBQztRQUN4QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7ZUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztlQUN2QyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxRQUFRLENBQUMsTUFBUyxFQUFFLFFBQVc7UUFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVEOzs7Ozs7S0FNQztJQUNELG1CQUFtQixDQUFDLEtBQVEsRUFBRSxNQUFTLEVBQUUsV0FBcUI7UUFDNUQsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pELElBQUksV0FBVyxFQUFFLENBQUM7WUFDaEIsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVEOzs7T0FHRztJQUNILHNCQUFzQixDQUFDLElBQU8sRUFBRSxXQUFxQjtRQUNuRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FFRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERhdGVBZGFwdGVyIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvY29yZSc7XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmd4TWF0RGF0ZUFkYXB0ZXI8RD4gZXh0ZW5kcyBEYXRlQWRhcHRlcjxEPiB7XHJcbiAgLyoqXHJcbiAqIEdldHMgdGhlIGhvdXIgY29tcG9uZW50IG9mIHRoZSBnaXZlbiBkYXRlLlxyXG4gKiBAcGFyYW0gZGF0ZSBUaGUgZGF0ZSB0byBleHRyYWN0IHRoZSBtb250aCBmcm9tLlxyXG4gKiBAcmV0dXJucyBUaGUgaG91ciBjb21wb25lbnQuXHJcbiAqL1xyXG4gIGFic3RyYWN0IGdldEhvdXIoZGF0ZTogRCk6IG51bWJlcjtcclxuXHJcbiAgLyoqXHJcbiogR2V0cyB0aGUgbWludXRlIGNvbXBvbmVudCBvZiB0aGUgZ2l2ZW4gZGF0ZS5cclxuKiBAcGFyYW0gZGF0ZSBUaGUgZGF0ZSB0byBleHRyYWN0IHRoZSBtb250aCBmcm9tLlxyXG4qIEByZXR1cm5zIFRoZSBtaW51dGUgY29tcG9uZW50LlxyXG4qL1xyXG4gIGFic3RyYWN0IGdldE1pbnV0ZShkYXRlOiBEKTogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAqIEdldHMgdGhlIHNlY29uZCBjb21wb25lbnQgb2YgdGhlIGdpdmVuIGRhdGUuXHJcbiAgKiBAcGFyYW0gZGF0ZSBUaGUgZGF0ZSB0byBleHRyYWN0IHRoZSBtb250aCBmcm9tLlxyXG4gICogQHJldHVybnMgVGhlIHNlY29uZCBjb21wb25lbnQuXHJcbiAgKi9cclxuICBhYnN0cmFjdCBnZXRTZWNvbmQoZGF0ZTogRCk6IG51bWJlcjtcclxuXHJcbiAgLyoqXHJcbiAgKiBTZXQgdGhlIGhvdXIgY29tcG9uZW50IG9mIHRoZSBnaXZlbiBkYXRlLlxyXG4gICogQHBhcmFtIGRhdGUgVGhlIGRhdGUgdG8gZXh0cmFjdCB0aGUgbW9udGggZnJvbS5cclxuICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxyXG4gICovXHJcbiAgYWJzdHJhY3Qgc2V0SG91cihkYXRlOiBELCB2YWx1ZTogbnVtYmVyKTogdm9pZDtcclxuXHJcbiAgLyoqXHJcbiAgKiBTZXQgdGhlIHNlY29uZCBjb21wb25lbnQgb2YgdGhlIGdpdmVuIGRhdGUuXHJcbiAgKiBAcGFyYW0gZGF0ZSBUaGUgZGF0ZSB0byBleHRyYWN0IHRoZSBtb250aCBmcm9tLlxyXG4gICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXHJcbiAgKi9cclxuICBhYnN0cmFjdCBzZXRNaW51dGUoZGF0ZTogRCwgdmFsdWU6IG51bWJlcik6IHZvaWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgc2Vjb25kIGNvbXBvbmVudCBvZiB0aGUgZ2l2ZW4gZGF0ZS5cclxuICAgKiBAcGFyYW0gZGF0ZSBUaGUgZGF0ZSB0byBleHRyYWN0IHRoZSBtb250aCBmcm9tLlxyXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxyXG4gICAqL1xyXG4gIGFic3RyYWN0IHNldFNlY29uZChkYXRlOiBELCB2YWx1ZTogbnVtYmVyKTogdm9pZDtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2sgaWYgdHdvIGRhdGUgaGF2ZSBzYW1lIHRpbWVcclxuICAgKiBAcGFyYW0gYSBEYXRlIDFcclxuICAgKiBAcGFyYW0gYiBEYXRlIDJcclxuICAgKi9cclxuICBpc1NhbWVUaW1lKGE6IEQsIGI6IEQpOiBib29sZWFuIHtcclxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcclxuICAgIHJldHVybiB0aGlzLmdldEhvdXIoYSkgPT09IHRoaXMuZ2V0SG91cihiKVxyXG4gICAgICAmJiB0aGlzLmdldE1pbnV0ZShhKSA9PT0gdGhpcy5nZXRNaW51dGUoYilcclxuICAgICAgJiYgdGhpcy5nZXRTZWNvbmQoYSkgPT09IHRoaXMuZ2V0U2Vjb25kKGIpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29weSB0aW1lIGZyb20gYSBkYXRlIHRvIGEgYW5vdGhlciBkYXRlXHJcbiAgICogQHBhcmFtIHRvRGF0ZSBcclxuICAgKiBAcGFyYW0gZnJvbURhdGUgXHJcbiAgICovXHJcbiAgY29weVRpbWUodG9EYXRlOiBELCBmcm9tRGF0ZTogRCkge1xyXG4gICAgdGhpcy5zZXRIb3VyKHRvRGF0ZSwgdGhpcy5nZXRIb3VyKGZyb21EYXRlKSk7XHJcbiAgICB0aGlzLnNldE1pbnV0ZSh0b0RhdGUsIHRoaXMuZ2V0TWludXRlKGZyb21EYXRlKSk7XHJcbiAgICB0aGlzLnNldFNlY29uZCh0b0RhdGUsIHRoaXMuZ2V0U2Vjb25kKGZyb21EYXRlKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICogQ29tcGFyZXMgdHdvIGRhdGVzLlxyXG4gKiBAcGFyYW0gZmlyc3QgVGhlIGZpcnN0IGRhdGUgdG8gY29tcGFyZS5cclxuICogQHBhcmFtIHNlY29uZCBUaGUgc2Vjb25kIGRhdGUgdG8gY29tcGFyZS5cclxuICogQHJldHVybnMgMCBpZiB0aGUgZGF0ZXMgYXJlIGVxdWFsLCBhIG51bWJlciBsZXNzIHRoYW4gMCBpZiB0aGUgZmlyc3QgZGF0ZSBpcyBlYXJsaWVyLFxyXG4gKiAgICAgYSBudW1iZXIgZ3JlYXRlciB0aGFuIDAgaWYgdGhlIGZpcnN0IGRhdGUgaXMgbGF0ZXIuXHJcbiAqL1xyXG4gIGNvbXBhcmVEYXRlV2l0aFRpbWUoZmlyc3Q6IEQsIHNlY29uZDogRCwgc2hvd1NlY29uZHM/OiBib29sZWFuKTogbnVtYmVyIHtcclxuICAgIGxldCByZXMgPSBzdXBlci5jb21wYXJlRGF0ZShmaXJzdCwgc2Vjb25kKSB8fFxyXG4gICAgICB0aGlzLmdldEhvdXIoZmlyc3QpIC0gdGhpcy5nZXRIb3VyKHNlY29uZCkgfHxcclxuICAgICAgdGhpcy5nZXRNaW51dGUoZmlyc3QpIC0gdGhpcy5nZXRNaW51dGUoc2Vjb25kKTtcclxuICAgIGlmIChzaG93U2Vjb25kcykge1xyXG4gICAgICByZXMgPSByZXMgfHwgdGhpcy5nZXRTZWNvbmQoZmlyc3QpIC0gdGhpcy5nZXRTZWNvbmQoc2Vjb25kKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXQgdGltZSBieSB1c2luZyBkZWZhdWx0IHZhbHVlc1xyXG4gICAqIEBwYXJhbSBkZWZhdWx0VGltZSBMaXN0IGRlZmF1bHQgdmFsdWVzIFtob3VyLCBtaW51dGUsIHNlY29uZF1cclxuICAgKi9cclxuICBzZXRUaW1lQnlEZWZhdWx0VmFsdWVzKGRhdGU6IEQsIGRlZmF1bHRUaW1lOiBudW1iZXJbXSkge1xyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGRlZmF1bHRUaW1lKSkge1xyXG4gICAgICB0aHJvdyBFcnJvcignQElucHV0IERlZmF1bHRUaW1lIHNob3VsZCBiZSBhbiBhcnJheScpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRIb3VyKGRhdGUsIGRlZmF1bHRUaW1lWzBdIHx8IDApO1xyXG4gICAgdGhpcy5zZXRNaW51dGUoZGF0ZSwgZGVmYXVsdFRpbWVbMV0gfHwgMCk7XHJcbiAgICB0aGlzLnNldFNlY29uZChkYXRlLCBkZWZhdWx0VGltZVsyXSB8fCAwKTtcclxuICB9XHJcblxyXG59XHJcbiJdfQ==