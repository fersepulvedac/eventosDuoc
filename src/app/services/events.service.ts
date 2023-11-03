import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

const STORAGE_KEY = 'myevents'

export interface CalEvent{
  id: number,
  author: string,
  sponsor: string,
  title: string,
  startTime: Date,
  endTime: Date
  allDay: boolean,
  place: string,
  description: string,
  notify: boolean
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  constructor(private storage: Storage) { }

  async init(){
    await this.storage.create()
  }

  async getData(){
    return await this.storage.get(STORAGE_KEY) || []
  }

  async addData(item: CalEvent){
    const data = await this.getData()
    data.push(item)
    return this.storage.set(STORAGE_KEY, data)
  }

  async setData(eventos:any){
    return this.storage.set(STORAGE_KEY, eventos)
  }
}
