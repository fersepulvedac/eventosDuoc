import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular'

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  usuario: string | undefined
  clave: string | undefined

  constructor(private storage: Storage, private alert: AlertController, private router: Router) { }

  async ngOnInit() {
    await this.storage.create();
    await this.storage.set("usuarios", [{
      username: "fernando",
      clave: "123456",
      nombre: "Fernando Sepúlveda",
      escuela: "Informática y telecomunicaciones"
    }])
  }

  async login() {
    const usuarios = await this.storage.get('usuarios');
    for (let user of usuarios) {
      if (user.username == this.usuario && user.clave == this.clave) {
        localStorage.setItem("usuario", JSON.stringify(user))
        this.alerta("Bienvenido " + user.nombre + "!.", "Bienvenido", () => {
          this.router.navigate(['/home'])
        })
      }
    }
  }

  async invitado() {
    localStorage.removeItem("usuario")
    this.router.navigate(['/home'])
  }

  async alerta(texto: string, titulo: string, action: () => void) {
    const alert = await this.alert.create({
      header: titulo,
      // subHeader: 'Important message',
      message: texto,
      buttons: [{
        text: "Ok",
        handler: action
      }],
    });

    await alert.present();
  }

}
