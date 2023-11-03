import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
// import { CalendarMode } from 'ionic2-calendar/calendar.interface';
import { CalEvent, EventsService } from '../services/events.service';
import { format } from 'date-fns';
import { CalendarComponent, CalendarMode } from 'ionic2-calendar';
import { AnimationController, Platform, ToastController } from '@ionic/angular';
import { es } from 'date-fns/esm/locale'
import { ScheduleOptions, LocalNotifications } from '@capacitor/local-notifications';
import { Calendar } from '@awesome-cordova-plugins/calendar/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  evento: any = {}
  isEventOpen = false
  isOpcionesModo=false
  admin = false
  fechaSeleccionada = ""
  isModalOpen = false;
  showInicio = false;
  showTermino = false;
  usuario = "invitado"

  @ViewChild(CalendarComponent) myCal!: CalendarComponent
  eventsSource: any[] = []
  eventos: any[] = []
  calendar = {
    mode: 'month' as CalendarMode,
    currentDate: new Date(),
    locale: 'es-CL',
    noEventsLabel: 'No hay eventos este día',
    allDayLabel: "Todo el dia"
  }

  swipeEvent(e: any) {
    if (e.direction == 2) {
      //direction 2 = right to left swipe.
      console.log("swipeeee")
    }
  }

  toggleOpcionesModo(valor:boolean){
    this.anim.create().addElement(document.querySelector("#opciones-modo")!)
    .duration(300)
    .fromTo("opacity", 0, 1)
    .fromTo("transform", "translateX("+(valor?'-60px':'0px')+")", "translateX("+(valor?'0px':'-60px')+")")
    .play()
    this.anim.create().addElement(document.querySelectorAll("#opciones-modo>ion-icon")!)
    .duration(300)
    .fromTo("transform", "rotate("+(valor?"90deg":"0deg")+")", "rotate("+(valor?"0deg":"90deg")+")")
    .play()
  }

  newEvent: any = {
    title: "",
    author: "Invitado",
    startTime: null,
    endTime: null,
    allDay: false,
    sponsor: "",
    place: "",
    description: "",
    notify: false
  }

  sliderOptions = {
    threshold: 40,
  };

  markDisabled = (date: Date) => {
    var current = new Date();
    return date < current;
  };

  colores = ["#23B0A6", "#FABD78", "#F2693A", "#EF3686", "#1C7EC3",]
  iconoTema = "contrast"
  // formatInicio = ''
  // formarTermino = ''

  constructor(
    private events: EventsService,
    private platform: Platform,
    private anim: AnimationController,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private calendario: Calendar,
    private toast: ToastController
  ) {
    if (!localStorage.getItem("tema")) {
      localStorage.setItem("tema", "claro")

    } this.poneTema()
    localStorage.removeItem("usuario")
  }

  verEvento(isOpen: boolean, evento: any) {
    this.zone.run(() => {
      this.isEventOpen = isOpen;
      this.evento = evento
    })
  }

  agregarACalendario(evento: any) {
    this.zone.run(() => {
      if (evento.notify) {
        this.calendario.deleteEvent(
          evento.title, // title
          evento.place, // location
          evento.description, // notes
          evento.startTime, // start date
          evento.endTime// end date
        );
      } else {
        this.calendario.createEvent(
          evento.title, // title
          evento.place, // location
          evento.description, // notes
          evento.startTime, // start date
          evento.endTime// end date
        );
      }

      this.eventos.forEach((e) => {
        if (e.id == evento.id) {
          e.notify = !e.notify
        }
      })
      this.events.setData(this.eventos)

      this.anim.create()
        .addElement(document.querySelector("#notificar" + evento.id)!)
        .duration(300)
        .keyframes([
          { offset: 0, transform: "rotate(0deg)" },
          { offset: 0.3, transform: "rotate(26deg)" },
          { offset: 0.7, transform: "rotate(-26deg)" },
          { offset: 1, transform: "rotate(0deg)" },
        ])
        .onFinish(() => {
          this.mostrarToast(
            evento.notify ?
              'Evento agregado a tu calendario.' :
              'Evento eliminado de tu calendario.')
        })
        .play()
    })
  }

  ngAfterViewInit() {
    this.animaSplash()
    this.platform.ready().then(async () => {

      this.eventsSource = await this.events.getData()

      this.cdr.detectChanges();
    });
  }

  ionViewDidEnter() {
    if (localStorage.getItem("usuario")) {
      this.newEvent.author = JSON.parse(localStorage.getItem("usuario")!)["nombre"]
      this.admin = true
    } else {
      this.admin = false
    }
  }

  cerrarModal() {
    this.isModalOpen = false
  }

  cambiaVista(valor: string) {
    this.calendar.mode = valor as CalendarMode
    if(valor == 'day' || valor=='week'){
      document.querySelector(".eventos-border")?.classList.add("oculto")
      document.querySelector(".eventos-border")?.classList.remove("visible")
      document.querySelector(".calendar-container")?.classList.add("full")
      document.querySelector(".calendar-container")?.classList.remove("middle")
    }else{
      document.querySelector(".eventos-border")?.classList.add("visible")
      document.querySelector(".eventos-border")?.classList.remove("oculto")
      document.querySelector(".calendar-container")?.classList.add("middle")
      document.querySelector(".calendar-container")?.classList.remove("full")
    }  
    this.toggleOpcionesModo(false)
  }

  sheduleEvent() {
    const toAdd: CalEvent = {
      id: this.eventos.length + 1,
      title: this.newEvent.title,
      startTime: new Date(this.newEvent.startTime),
      endTime: new Date(this.newEvent.endTime),
      allDay: this.newEvent.allDay,
      author: this.usuario,
      sponsor: this.newEvent.sponsor,
      place: this.newEvent.place,
      description: this.newEvent.description,
      notify: this.newEvent.notify
    }
    this.eventsSource.push(toAdd)
    this.myCal.loadEvents()
    this.events.addData(toAdd)
    this.newEvent = {
      title: "",
      startTime: null,
      endTime: null,
      allDay: false,
      author: "",
      sponsor: "",
      notify: false
    }
    this.setOpen(false)
  }


  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  checkear() {
    console.log("Chekeando")
    this.newEvent.allDay = !this.newEvent.allDay
    console.log(this.newEvent)
  }

  onViewTitleChanged(evt: any) {
    console.log("Cambia")
  }

  async onCurrentDateChanged(evt: any) {

    // this.fechaSeleccionada = format(evt, "eeee dd 'de' MMM 'de' yyyy - HH:mm", { locale: es })
    // console.log(evt)
    // this.cdr.detectChanges();

  }

  onTimeSelected(evt: { selectedTime: Date, events: any[], disabled: boolean }) {
    //ESTO PROVOCA EL CAMBIO DE FECHA SELECCIONADA AL HACER CLIC
    this.fechaSeleccionada = format(evt.selectedTime, "MMMM dd 'de' yyyy", { locale: es })
    this.newEvent.startTime = format(evt.selectedTime, "yyyy-MM-dd'T'HH:mm:ss")
    this.newEvent.endTime = format(evt.selectedTime.setHours(evt.selectedTime.getHours() + 1), "yyyy-MM-dd'T'HH:mm:ss")
    // this.newEvent.endTime = evt.getHours() + 1
    // this.newEvent.startTime = format(evt.selectedTime, "yyyy-MM-dd'T'HH:mm:ss",)
    // const later = evt.selectedTime.setHours(evt.selectedTime.getHours() + 1)
    // this.newEvent.endTime = format(later, "yyyy-MM-dd'T'HH:mm:ss")
    this.eventos = evt.events.sort((n1, n2) => {
      if (n1.allDay) {
        return -1;
      } else if (n2.allDay) {
        return 1;
      } else {
        return n1.startTime - n2.startTime;
      }
    });

    // if (evt.events.length > 0) {
    this.anim.create()
      .addElement(document.querySelector(".eventos")!)
      .duration(300)
      .fromTo("opacity", 0, 1)
      .fromTo("transform", "translateY(+100px)", "translateY(0px)")
      .fromTo("opacity", "0", "1")
      .play()
    // }

    // console.log(evt)

    // if (this.calendar.mode == 'day' || this.calendar.mode == 'week') {
    //   this.setOpen(true)
    // }
    this.cdr.detectChanges();
  }

  // Focus today
  today() {
    this.myCal.currentDate = new Date();
    // this.myCal.slideNext()

  }

  onEventSelected(evt: any) {
    // console.log(evt)
    this.verEvento(true, evt)
  }

  inicioChanged(value: any) {
    this.newEvent.startTime = value
  }

  terminoChanged(value: any) {
    this.newEvent.endTime = value
  }

  // async sheduleNotification() {
  //   await LocalNotifications.checkPermissions();
  //   let options: ScheduleOptions = {
  //     notifications: [
  //       {
  //         id: 111,
  //         title: "Reminder notification",
  //         body: "Explore new variety of offers",
  //         largeBody: "get 30% discount on new products!.",
  //         summaryText: "Exciting offers!!!",
  //         iconColor: "#000000",
  //         schedule: {
  //           at: new Date(new Date().getTime() + 3000),
  //           allowWhileIdle: true
  //         },
  //       }
  //     ]
  //   }

  //   try {
  //     await LocalNotifications.schedule(options)
  //   } catch (ex: any) {
  //     alert(JSON.stringify(ex))
  //   }
  // }


  async cambiaModo() {
    this.animaRotate("#modo", () => {
      if (localStorage.getItem("tema") == "claro") {
        localStorage.setItem("tema", "oscuro")
        // this.iconoTema = "flashlight"
      } else {
        localStorage.setItem("tema", "claro")
        // this.iconoTema = "moon"
      }
      this.poneTema()
    })

  }

  async poneTema() {
    this.zone.run(() => {
      if (localStorage.getItem("tema") == "oscuro") {
        document.documentElement.style.setProperty('--fondo-calendario', '#282E48');
        document.documentElement.style.setProperty('--fondo-eventos', '#22273d');
        document.documentElement.style.setProperty('--fondo-menu', '#101010');
        document.documentElement.style.setProperty('--color-icon-header', '#a5a5a5');
        document.documentElement.style.setProperty('--color-titulo', '#9a9a9a');
        document.documentElement.style.setProperty('--texto-eventos', '#dadada');
        document.documentElement.style.setProperty('--color-icon-footer', '#c0c0c0');
        document.documentElement.style.setProperty('--fondo-input', '#bababa');
        document.documentElement.style.setProperty('--texto-input', '#424242');
        document.documentElement.style.setProperty('--texto-nombre-dias', '#8e8e8e');
        document.documentElement.style.setProperty('--fondo-footer', '#1C1F32');

      } else {
        console.log("Aplicando tema claro")
        document.documentElement.style.setProperty('--fondo-calendario', '#E8E8E8');
        document.documentElement.style.setProperty('--fondo-eventos', '#F0F0F0');
        document.documentElement.style.setProperty('--fondo-menu', '#F1F1F1');
        document.documentElement.style.setProperty('--color-icon-header', '#101010');
        document.documentElement.style.setProperty('--color-titulo', '#3b3b3b');
        document.documentElement.style.setProperty('--texto-eventos', '#000');
        document.documentElement.style.setProperty('--color-icon-footer', '#000');
        document.documentElement.style.setProperty('--fondo-input', '#fff');
        document.documentElement.style.setProperty('--texto-input', '#424242');
        document.documentElement.style.setProperty('--fondo-footer', '#F1F1F1');
      }
    })

  }

  async animaSplash() {
    this.anim.create().addElement(document.querySelector("#splash")!)
      .duration(200).delay(100).keyframes([
        // { offset: 0.1, transform: "scale(1.2)" },
        // { offset: 0.3, transform: "scale(1)" },
        { offset: 0.7, opacity: 1 },
        { offset: 1, opacity: 0 },
      ])
      .play()
    this.anim.create().addElement(document.querySelector(".logo-splash")!)
      .duration(200).delay(100).keyframes([
        { offset: 0.1, transform: "scale(1.2)" },
        { offset: 0.3, transform: "scale(1)" },
        { offset: 0.7, transform: "scale(1) rotate(200deg)" },
        { offset: 1, transform: "scale(0) rotate(400deg) translateY(400px)" },
      ])
      .onFinish(() => {
        document.querySelector("#splash")!.setAttribute("style", "display:none")
      }).play()

  }

  animaRotate(selector: string, action: () => void) {
    this.anim.create()
      .addElement(document.querySelector(selector)!)
      .duration(300)
      .keyframes([
        { offset: 0, transform: "rotate(0deg)" },
        { offset: 0.3, transform: "rotate(26deg)" },
        { offset: 0.7, transform: "rotate(-26deg)" },
        { offset: 1, transform: "rotate(0deg)" },
      ])
      .onFinish(action)
      .play()
  }

  async mostrarToast(texto: string) {
    const toast = await this.toast.create({
      message: texto,
      duration: 3000,
      position: 'bottom',
      icon: 'notifications-circle-outline',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}
