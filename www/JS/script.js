const baseURL = "https://calcount.develotion.com";
const imgURL = "https://calcount.develotion.com/imgs/";
const router = document.querySelector("#router");
const filtrarCalendario = document.querySelector("#calendario-filtrar");
const geoAPIKEY = "099b7b5ea83443df92da2d5303f22cad";

let comidas;
let paises;
let fechasFiltradas;
let dietaUsuario;
let marcadores = [] //{latitud: -34.90328, longitud: -56.18816}
let map;
let latitudDispo;
let longitudDispo;
let userCalorias;


navigator.geolocation.getCurrentPosition(GuardarUbicacion, MostrarErrorMapa)

App();

function App(){
  EventL();
}

//EVENT LISTENER

function EventL(){
  document.querySelector("#calendario-filtrar").addEventListener("ionChange", ParsearFechas);
  //MENU
  router.addEventListener("ionRouteWillChange", Nav);
  
  //BOTONES
  document.querySelector("#btnRegistro").addEventListener("click", Registro);
  document.querySelector("#btnLogin").addEventListener("click", Login);
}



function Nav(evt){
  MostrarMenu()
  Ocultar();
  LimpiarCampos();

  if(!Session()){
    switch (evt.detail.to) {
      case "/Registro":
        ObtenerPaises();
        document.querySelector("#registro").style.display = "block";
      break;
      case "/Login":
        document.querySelector("#login").style.display = "block";
      break;
      default:
        router.push("/Login");
      break;
    }
  } else {
    switch (evt.detail.to) {
      case "/Logout":
        localStorage.clear();
        document.querySelector("#id-User").innerHTML = "";
        router.push("/Login");
      case "/Informe":
        ObtenerAlimentos();
        setTimeout(() => {
          APIObtenerRegistros(RenderizarInforme);
        }, 1500);
        
        document.querySelector("#informe").style.display = "block";
        break;
      case "/AgregarComida":
        ObtenerAlimentos(MostrarAlimentos);
        document.querySelector("#agregarComida").style.display = "block";
      break;
      case "/ListarComidas":
        ObtenerAlimentos();
        APIObtenerRegistros(RenderizarComidas);
        document.querySelector("#listarComidas").style.display = "block";
      break;
      case "/FiltrarComidas":
        ObtenerAlimentos();
        APIObtenerRegistros();
        document.querySelector("#filtrar-form").style.display = "block";
        document.querySelector("#filtrarComidas").style.display = "block";
      break;
      case "/Mapa":
        setTimeout(() => {
          CargarMarcadores()
        }, 1000);
        document.querySelector("#mapa").style.display = "block";
      break;
      default:
        router.push("/Informe");
      break;
  }
}
}

function MostrarMenu(){
  let token = localStorage.getItem("token");
  let menuUser = document.querySelectorAll(".user")
  let menuVisitor = document.querySelectorAll(".visitor")
  menuUser.forEach(x => x.style.display = "none");
  menuVisitor.forEach(x => x.style.display = "none");
  if(token !== null && token !== ""){
    menuUser.forEach(x => x.style.display = "block");
    document.querySelector("#id-User").innerHTML = " Hello! " + localStorage.getItem("id");
  } else {
    menuVisitor.forEach(x => x.style.display = "block");
  }
}
function CerrarMenu(){
  document.querySelector("#menu").close();
}

//REGISTRO

function Registro(){
  document.querySelector("#p-Registro").innerHTML = "";
  try {
    let usuario = document.querySelector("#txtUsuario-R").value.trim();
    let password = document.querySelector("#txtPassword-R").value.trim();
    let idPais = document.querySelector("#slcPais-R").value;
    let caloriasDiarias = document.querySelector("#txtCalorias-R").value.trim();
    Vacios(usuario, password, idPais, caloriasDiarias);
    ValidarRegistro(usuario, password, idPais, caloriasDiarias);
    RegistroAPI({usuario, password, idPais, caloriasDiarias})
    
  }catch(e){
    document.querySelector("#p-Registro").innerHTML = e.message;
  }
}

function RegistroAPI(user){
  fetch(`${baseURL}/usuarios.php`,{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(user)
  })
  .then(res => res.json())
  .then(data => {
    if(data != undefined && data.mensaje !== undefined && data.codigo == 409){
      document.querySelector("#p-Registro").innerHTML = data.mensaje;
    } else {
      localStorage.setItem("token", data.apiKey);
      localStorage.setItem("id", data.id);
      router.push("/Informe")
    }
  })
  .catch(e => console.log(e))
}

function ValidarRegistro(usuario, password, codPais, calorias){
  if(usuario.length > 20){
    document.querySelector("#txtUsuario-R").value = ""
    throw new Error("El nombre de usuario no puede tener mas de 20 caracteres");
  }
  if(password.length > 20 || password.length < 4){
    document.querySelector("#txtPassword-R").value = "";
    throw new Error("La constrasena debe tener entre 4 y 20 caracteres");
  }
  if(codPais.NaN || !paises.find(pais => pais.id == codPais)){
    throw new Error("Ingrese un pais valido");
  }
  if(isNaN(calorias) || calorias <= 0){
    document.querySelector("#txtCalorias-R").value = "";
    throw new Error("Ingrese un valor para calorias valido");
  }
}

//LOGIN

function Login(){
  document.querySelector("#p-Login").innerHTML = "";
  try{
    let usuario = document.querySelector("#txtUsuario-L").value.trim();
    let password = document.querySelector("#txtPassword-L").value.trim();
    Vacios(usuario, password);
    LoginAPI({usuario, password})
  }catch(e){
    document.querySelector("#p-Login").innerHTML = e.message;
  }
}

function LoginAPI(user){
  fetch(`${baseURL}/login.php`,{
    method: "POST",
    headers:{"Content-Type": "application/json"},
    body: JSON.stringify(user)
  })
  .then(res => res.json())
  .then(data => {
    if(data.codigo == 409){
      document.querySelector("#p-Login").innerHTML = data.mensaje;
      document.querySelector("#txtPassword-L").value = ""
    }else {
      localStorage.setItem("token", data.apiKey);
      localStorage.setItem("id", data.id);
      userCalorias = data.caloriasDiarias;
      router.push("/Informe");
    }
  })
  .catch(e => console.log(e))
}

//AUXILIARES

//OBTENER PAISES

function ObtenerPaises(){
  fetch(`${baseURL}/paises.php`,
 {
   headers: { "Content-Type": "application/json"}
 })
 .then(res => {
   return res.json();
 })
 .then(data => {
  if(data.codigo !== undefined && data.codigo == 200){
   let slcPais = document.querySelector("#slcPais-R");
   slcPais.innerHTML = `<div slot="label">Pais <ion-text color="danger">(*)</ion-text></div>`;
   data.paises.forEach(pais =>{
   slcPais.innerHTML += `<ion-select-option value="${pais.id}">${pais.name}</ion-select-option>`
   })
   paises = data.paises;
  }
 })
 .catch(e => console.log(e.message))
}


//OBTENER COMIDAS
function ObtenerAlimentos(fnc){
  fetch(`${baseURL}/alimentos.php`,
 {
   headers: {
    "Content-Type": "application/json",
    "apikey": localStorage.getItem("token"),
    "iduser": localStorage.getItem("id")
  }
 })
 .then(res => {
   return res.json();
 })
 .then(data => {
  if(data.codigo != undefined && data.codigo == 200){
    comidas = data.alimentos;
    if(fnc != undefined){
      fnc(data.alimentos);
    }
  }
 })
 .catch(e => console.log(e.message))
}

//EXISTE SESSION

function Session(){
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("id");
  return (token != null && token != undefined) && (idUsuario != null && idUsuario != undefined)
}

function Ocultar(){
  let pantallas = document.querySelectorAll(".ion-page");
  for(let i = 1; i<pantallas.length; i++){
    pantallas[i].style.display = "none";
  }
}

function LimpiarCampos(){
  LimpiarRegistro();
  LimpiarLogin();
  LimpiarFiltro();
  document.querySelector("#p-Mapa").innerHTML = ""
}

function LimpiarRegistro(){
  document.querySelector("#txtUsuario-R").value = "";
  document.querySelector("#txtPassword-R").value = "";
  document.querySelector("#slcPais-R").value = "";
  document.querySelector("#txtCalorias-R").value = "";

  document.querySelector("#p-Registro").innerHTML = "";
}

function LimpiarLogin(){
  document.querySelector("#txtUsuario-L").value = ""
  document.querySelector("#txtPassword-L").value = ""

  document.querySelector("#p-Login").innerHTML = ""
}

function LimpiarFiltro(){
  fechasFiltradas = []
  document.querySelector("#filtrar-comidas-grid").style.display = "none";
  document.querySelector("#p-ListarComidas").innerHTML = ""
}
function Vacios(){
  let vacio;
  for(let i = 0; i<arguments.length; i++){
    if(arguments[i] == "" || arguments[i] == undefined){
      vacio = true;
    }
  }
  if(vacio){
    throw new Error("Complete todos los campos obligatorios");
  }
}

function ParsearFechas(){
  console.log(filtrarCalendario.value);
  if(filtrarCalendario.value != undefined && filtrarCalendario.value.length <= 2){
    fechasFiltradas = [];
    filtrarCalendario.value.forEach(fecha => fechasFiltradas.push(new Date(fecha)))
  }
}

filtrarCalendario.isDateEnabled = (dateString) => {
  let hoy = new Date();
  let mesAnterior = new Date(hoy.setMonth(hoy.getMonth() - 1))
  let mesSiguiente = new Date(hoy.setMonth(hoy.getMonth() + 2))
  let date = new Date(dateString);
  
  // || (fechasFiltradas.find(fecha => fecha.getTime() === date.getTime()) != undefined)
  return (filtrarCalendario.value == undefined || filtrarCalendario.value.length <= 1) && (date > mesAnterior && date < mesSiguiente);
};

function FiltrarReset(){
  fechasFiltradas = []
  location.reload();
}


function FiltrarComidas(){
  try{
    document.querySelector("#p-FiltrarComidas").innerHTML = ""
    let grid = document.querySelector("#filtrar-comidas-grid");
    if(fechasFiltradas == undefined || fechasFiltradas.length < 2){
      console.log("A")
      document.querySelector("#p-FiltrarComidas").innerHTML = "Debe seleccionar 2 fechas para continuar"
    } else {
      if(dietaUsuario != undefined && dietaUsuario.length > 0){
        let comidasFiltradas = FiltrarComidasFecha();
        if(comidasFiltradas != undefined){
          let content = `
          <ion-row>
            <ion-col></ion-col>
            <ion-col>Alimento</ion-col>
            <ion-col>Cantidad</ion-col>
            <ion-col>Calorias</ion-col>
            <ion-col>Fecha</ion-col>
          </ion-row>`;
          comidasFiltradas.forEach(x => {
              let porcion = x.porcion.substring(0,x.porcion.length-1)
              let unidad = x.porcion.substring(x.porcion.length-1,x.porcion.length)
              content += `
              <ion-row>
                <ion-col><img alt="Silhouette of mountains" class="agregar-imagen" src="${imgURL+x.idAlimento}.png"/></ion-col>
                <ion-col>${x.nombre}</ion-col>
                <ion-col>${x.cantidad}${unidad}</ion-col>
                <ion-col>${x.cantidad/porcion*x.calorias} cal</ion-col>
                <ion-col>${x.fecha}</ion-col>
              </ion-row>
            `})
          document.querySelector("#filtrar-form").style.display = "none"
          content += `<ion-item>
                        <ion-button class="center" color="danger" onclick="FiltrarReset()">Atras</ion-button>
                      </ion-item>`
          grid.innerHTML = content;
          document.querySelector("#filtrar-comidas-grid").style.display = "block";
        } else {
          document.querySelector("#p-FiltrarComidas").innerHTML = "No consumio comidas en esas fechas"
        }
      }else{
        document.querySelector("#p-FiltrarComidas").innerHTML = "No posee registros"
      }
    }
  }catch(e){
    console.log(e)
  }
}


function FiltrarComidasFecha(){
  fechasFiltradas.sort(function (a,b){
    return a.getTime()-b.getTime();
  })
  let filtro = dietaUsuario.filter(comida => {
    let fecha = new Date(comida.fecha)
    if(fecha > fechasFiltradas[0] && fecha < fechasFiltradas[1]){
      return comida
    }
  })
  console.log(filtro)
  return filtro;
}


//INFORME

function RenderizarInforme(){
  try{
  if(dietaUsuario != undefined){
    let calorias = 0;
    let caloriasHoy = 0;
    dietaUsuario.map(x => {
      let porcion = x.porcion.substring(0,x.porcion.length-1)
      calorias += (x.cantidad / porcion * x.calorias);
      })
    
    dietaUsuario.map(comida => {
      let fecha = new Date(comida.fecha);
      let porcion = comida.porcion.substring(0,comida.porcion.length-1)
      fecha.setDate(fecha.getDate() + 1);
      if(EsHoy(fecha)){
        caloriasHoy += (comida.cantidad / porcion * comida.calorias);
      }
    })
    EstiloMensaje(caloriasHoy, userCalorias);
    document.querySelector("#card-informe-calTotal").innerHTML = `Calorias totales: ${calorias} cal`
    document.querySelector("#card-informe-calHoy").innerHTML = `Dia actual: ${caloriasHoy} cal`;
    
  }else {
    document.querySelector("#card-informe-calTotal").innerHTML = "No posee registros"
  }
  }catch(e){
    document.querySelector("#card-informe-calTotal").innerHTML = e.message;
  }
}

function EstiloMensaje(dia, promedio){
  console.log(dia, promedio);
  let mensaje = document.querySelector("#card-informe-calHoy"); //
  if(dia > promedio * 0.9 && dia < promedio * 1.10 ){
    mensaje.style.backgroundColor = "yellow";
  } else if(dia > promedio){
    mensaje.style.backgroundColor = "red";
  } else {
    mensaje.style.backgroundColor = "green";
  }
}

function EsHoy(fecha){
  let diaActual = new Date();
  let year1 = fecha.getFullYear();
  let month1 = fecha.getMonth();
  let day1 = fecha.getDate();

  let year2 = diaActual.getFullYear();
  let month2 = diaActual.getMonth();
  let day2 = diaActual.getDate();

  return year1 === year2 && month1 === month2 && day1 === day2;
}

//MAPA

function CargarMarcadores(){
  console.log(map);
  if(map != undefined || map != null){
    map.remove();
    CargarMapa()
  }else {
    CargarMapa()
  }

  marcadores.map(marcador => {
    //.bindPopup("<input type=button onclick=Prueba() value=Prueba>").openPopup()
    L.marker([marcador.latitud, marcador.longitud]).addTo(map)
    .bindPopup("Usted").openPopup()
  });
}

function CargarMapa(){
  document.querySelector("#p-Mapa").innerHTML = ""
  let lat = latitudDispo
  let long = longitudDispo
  if(lat == undefined && long == undefined){
    lat = -34.9032800;
    long = -56.1881600;
  }
  map = L.map('map').setView([lat, long], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ''
  }).addTo(map);

  if(latitudDispo != undefined && longitudDispo != undefined){
    L.circle([latitudDispo, longitudDispo], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 150
  }).addTo(map);
  } else {
    document.querySelector("#p-Mapa").innerHTML = "Debe activar su servicio de ubicacion"
  }
}

// MAPA USUARIOS

function UsuariosPais(cantidad){
  try{
    fetch(`${baseURL}/usuariosPorPais.php`,{
      headers: {
        "Content-Type": "application/json",
        "apikey": localStorage.getItem("token"),
        "iduser": localStorage.getItem("id")
      }
    })
    .then(res => res.json())
    .then(data => {
      if(data.codigo == 200){
        let paises = data.paises.filter(pais => paisesGeoJSON.find(geo => geo.pais == pais.name) != undefined)
        paises = paises.filter(pais => pais.cantidadDeUsuarios > cantidad);
        console.log(paises);
        ResultadosMapa(paises);
      }else {
        document.querySelector("#p-Mapa").innerHTML = "Debe activar su servicio de ubicacion"
      }
    })
    .catch(e => console.log("ERROR FETCH: "+e))
  }catch(e){
    console.log(e.message);
  }
}

function UsuariosMapa(){
  try{
    let numero  = document.querySelector("#txt-Mapa").value
    document.querySelector("#txt-Mapa").value = "";
    if(numero == undefined || isNaN(numero) || numero <= 0){
      throw new Error("Ingrese un valor valido");
    } else {
      document.querySelector("#p-Mapa").innerHTML = "Procesando solicitud";
      UsuariosPais(numero)
    }
  }catch(e){
    document.querySelector("#p-Mapa").innerHTML = e.message
  }
}

function ResultadosMapa(data){
  if(data.length > 0){
    document.querySelector("#p-Mapa").innerHTML = `${data.length} Resultados`;
    map.remove();
    map = L.map('map');
    map.createPane('labels');
    map.getPane('labels').style.zIndex = 650;
    map.getPane('labels').style.pointerEvents = 'none';

    let positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap, ©CartoDB'
    }).addTo(map);
    let positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
    attribution: '©OpenStreetMap, ©CartoDB',
    pane: 'labels'
    }).addTo(map);
    data.forEach(pais => {
      let dataGEO = paisesGeoJSON.find(x => x.pais == pais.name)
      let geojson = L.geoJson(dataGEO.data).addTo(map);
      geojson.eachLayer(function (layer) {
      layer.bindPopup(layer.feature.properties.name);
      });
      map.fitBounds(geojson.getBounds());
    })
    
  }else {
    document.querySelector("#p-Mapa").innerHTML = "0 Resultados";
  }
  
}

function GuardarUbicacion(geolocation){
  latitudDispo = geolocation.coords.latitude;
  longitudDispo = geolocation.coords.longitude;
}

//Recibo codigo y mensaje de error
function MostrarErrorMapa(Error){
  console.log(Error)
  console.log(Error.message)
}


function minCalendario (){
  let hoy = new Date();

    return new Date(hoy.setMonth(hoy.getMonth() - 1));

}