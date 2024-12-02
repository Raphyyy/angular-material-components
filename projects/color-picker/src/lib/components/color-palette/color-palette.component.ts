import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input } from '@angular/core';
import { Color } from '../../models';

@Component({
    selector: 'ngx-mat-color-palette',
    templateUrl: 'color-palette.component.html',
    styleUrls: ['color-palette.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {
        'class': 'ngx-mat-color-palette'
    },
    standalone: false
})
export class NgxMatColorPaletteComponent implements OnInit {

  @Output() colorChanged: EventEmitter<Color> = new EventEmitter<Color>();

  @Input() color: Color;

  constructor() { }

  ngOnInit() {
  }

  public handleColorChanged(color: Color) {
    this.colorChanged.emit(color);
  }

}
