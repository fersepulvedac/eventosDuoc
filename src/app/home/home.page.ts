import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
// import { CalendarMode } from 'ionic2-calendar/calendar.interface';
import { CalEvent, EventsService } from '../services/events.service';
import { format } from 'date-fns';
import { CalendarComponent, CalendarMode } from 'ionic2-calendar';
import { AlertController, AnimationController, Platform, ToastController } from '@ionic/angular';
import { es } from 'date-fns/esm/locale'
import { ScheduleOptions, LocalNotifications } from '@capacitor/local-notifications';
import { Calendar } from '@awesome-cordova-plugins/calendar/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  isEditingEvent = false
  evento: any = {}
  isEventOpen = false
  isOpcionesModo = false
  admin = false
  fechaSeleccionada = ""
  isModalOpen = false;
  showInicio = false;
  showTermino = false;
  usuario = "invitado"

  numerosRomanos = [
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'
  ];

  @ViewChild(CalendarComponent) myCal!: CalendarComponent
  eventsSource: any[] = [] // LOS DEL CALENDARIO
  eventos: any[] = [] //LOS MISMOS PERO ORDENADOS ALL DAY PRIMERO
  calendar = {
    mode: 'month' as CalendarMode,
    currentDate: new Date(),
    locale: 'es-CL',
    noEventsLabel: 'No hay eventos este día',
    allDayLabel: "Todo el dia",
  }

  swipeEvent(e: any) {
    if (e.direction == 2) {
      //direction 2 = right to left swipe.
      console.log("swipeeee")
    }
  }

  mostrandoOpcionesVista = false

  toggleOpcionesModo() {
    let valor = !this.mostrandoOpcionesVista
    let op = "calc(((100vw - 7.5rem)/6) - 0.25rem)"
    let cantidad = "calc(6rem + 30px + 8vh)"
    this.anim.create().addElement(document.querySelector("#opciones-modo")!)
      .duration(400)
      .fromTo("opacity", `${valor ? 0 : 1}`, `${valor ? 1 : 0}`)
      .fromTo("transform", `translateX(${op}) translateY(${valor ? cantidad : '0px'})`, `translateX(${op}) translateY(${valor ? '0px' : cantidad})`)
      .play()
    this.anim.create().addElement(document.querySelectorAll("#opciones-modo>.icon-opciones-modo")!)
      .duration(500)
      .fromTo("transform", `rotate(${valor ? '-90deg' : '0deg'})`, `rotate(${valor ? '0deg' : '-90deg'})`)
      .play()
    this.mostrandoOpcionesVista = valor
  }

  newEvent: any = {
    id: -1,
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
    private toast: ToastController,
    private alert: AlertController
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
      let termino = new Date(evento.endTime)
      if (evento.allDay) {
        termino.setHours(23)
        termino.setMinutes(59)
      }
      if (termino < new Date()) {
        this.mostrarToast("Este eventó ya terminó!.")
        return
      }
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

      this.eventsSource.forEach((e) => {
        if (e.id == evento.id) {
          e.notify = !e.notify
        }
      })
      this.events.setData(this.eventsSource)

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

  ionViewDidEnter() {
    if (localStorage.getItem("usuario")) {
      this.newEvent.author = JSON.parse(localStorage.getItem("usuario")!)["nombre"]
      this.admin = true
    } else {
      this.admin = false
    }
  }

  ngAfterViewInit() {
    this.animaSplash()
    this.platform.ready().then(async () => {

      this.eventsSource = await this.events.getData()
      if (this.calendar.mode == 'month') {
        this.cdr.detectChanges();
      }
    });
  }

  async pregunta(texto: string, action: () => void) {
    const alert = await this.alert.create({
      header: 'Confirmar',
      // subHeader: texto,
      message: texto,
      buttons: [{
        text: "Si",
        handler: action
      },
      {
        text: "No"
      }],
    });
    await alert.present();
  }


  async sheduleEvent() {
    if(this.newEvent.title.length == 0){
      document.querySelector("#input-titulo")!.classList.add("incompleto")
      return
    }
    let inicio = new Date(this.newEvent.startTime)
    let final = new Date(this.newEvent.endTime)
    if (this.newEvent.allDay) {
      inicio.setHours(8);
      inicio.setMinutes(0);
      final.setHours(23);
      final.setMinutes(0);
    }
    const toAdd: CalEvent = {
      id: this.eventsSource.length + 1,
      title: this.newEvent.title,
      startTime: inicio,
      endTime: final,
      allDay: this.newEvent.allDay,
      author: this.usuario,
      sponsor: this.newEvent.sponsor,
      place: this.newEvent.place,
      description: this.newEvent.description,
      notify: this.newEvent.notify
    }
    //SI ESTOY EDITANDO UN EVENTO...
    if (this.isEditingEvent) {
      for (let i = 0; i < this.eventsSource.length; i++) {
        if (this.eventsSource[i].id == this.evento.id) {
          toAdd.id = this.evento.id
          this.eventsSource[i] = toAdd
          await this.events.setData(this.eventsSource)
          break
        }
      }
      this.isEditingEvent = false
      //SINO LO AÑADO A LA LISTA.
    } else {
      await this.events.addData(toAdd)
    }
    this.eventsSource = await this.events.getData()
    this.myCal.loadEvents()
    this.zone.run(() => {
      this.newEvent = {
        id: -1,
        title: "",
        author: this.usuario,
        startTime: null,
        endTime: null,
        allDay: false,
        sponsor: "",
        place: "",
        description: "",
        notify: false
      }
      this.myCal.currentDate = inicio
    })
    this.setOpen(false)
  }
  
  eliminarEvento(){
    this.pregunta("¿Seguro de eliminar?", async ()=>{
      for (let i = 0; i < this.eventsSource.length; i++) {
        if (this.eventsSource[i].id == this.evento.id) {

          this.eventsSource.splice(i, 1)
          await this.events.setData(this.eventsSource)
          this.eventsSource = await this.events.getData()
          this.myCal.loadEvents()
          this.isEventOpen = false
          break
        }
      }
    })
  }

  cerrarModal() {
    this.isModalOpen = false
    this.cancelarClick()
  }

  async cambiaVista(valor: string) {
    this.toggleOpcionesModo()
    // await new Promise(resolve => setTimeout(resolve, 300));
    this.calendar.mode = valor as CalendarMode
    if (valor == 'day' || valor == 'week') {
      document.querySelector(".eventos-border")?.classList.add("oculto")
      document.querySelector(".eventos-border")?.classList.remove("visible")
      document.querySelector(".calendar-container")?.classList.add("full")
      document.querySelector(".calendar-container")?.classList.remove("middle")
    } else {
      document.querySelector(".eventos-border")?.classList.add("visible")
      document.querySelector(".eventos-border")?.classList.remove("oculto")
      document.querySelector(".calendar-container")?.classList.add("middle")
      document.querySelector(".calendar-container")?.classList.remove("full")
    }

  }




  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
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
    this.fechaSeleccionada = format(evt.selectedTime, "MMMM dd 'de' yyyy", { locale: es })
    this.newEvent.startTime = format(evt.selectedTime, "yyyy-MM-dd'T'HH:mm:ss")

    let fin = new Date(this.newEvent.startTime)
    fin.setHours(fin.getHours() + 1)
    this.newEvent.endTime = format(fin, "yyyy-MM-dd'T'HH:mm:ss")

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
    // if (this.calendar.mode == 'month') {
      this.cdr.detectChanges();
    // }

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
        document.documentElement.style.setProperty('--texto-eventos-calendario', '#fff');
        document.documentElement.style.setProperty('--color-grilla', '#dddddd11');
        document.documentElement.style.setProperty('--color-text-muted', '#bababa');
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
        document.documentElement.style.setProperty('--texto-eventos-calendario', '#000');
        document.documentElement.style.setProperty('--color-grilla', '#00000011');
        document.documentElement.style.setProperty('--color-text-muted', '#848484');
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

  editarClick(evento: any) {
    this.newEvent.id = evento.id
    this.isEditingEvent = true
    this.newEvent.title = evento.title
    this.newEvent.allDay = evento.allDay
    this.newEvent.startTime = format(evento.startTime, "yyyy-MM-dd'T'HH:mm:ss")
    this.newEvent.endTime = format(evento.endTime, "yyyy-MM-dd'T'HH:mm:ss")
    this.newEvent.sponsor = evento.sponsor
    this.newEvent.place = evento.place
    this.newEvent.description = evento.description
    this.isEventOpen = false
    this.setOpen(true)
  }

  cancelarClick() {
    if (this.isEditingEvent) {
      this.newEvent.id = -1
      this.newEvent.title = ""
      this.newEvent.allDay = false
      this.newEvent.startTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
      this.newEvent.endTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
      this.newEvent.sponsor = ""
      this.newEvent.place = ""
      this.newEvent.description = ""
      this.isEditingEvent = false
    }

  }
}
