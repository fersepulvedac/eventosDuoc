import { NgModule, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';

import { NgCalendarModule } from 'ionic2-calendar';
import { registerLocaleData } from '@angular/common';
import localeCL from '@angular/common/locales/es-CL';
registerLocaleData(localeCL, 'es-CL');

import { Calendar } from '@awesome-cordova-plugins/calendar/ngx';

@NgModule({
  imports: [
    NgCalendarModule,
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  providers: [Calendar, { provide: LOCALE_ID, useValue: 'es-CL' }],
  declarations: [HomePage]
})
export class HomePageModule {}
