//COMIDAS

function MostrarAlimentos(data){
  try{
  document.querySelector("#form-agregar").style.display = "none";
  document.querySelector("#grid-agregar").style.display = "block";
  let grid = document.querySelector("#grid-agregar");
  let listado = "<ion-row>";
  for(let i=0; i < data.length; i++){
    if(i % 10 == 0 && i > 0){
      listado += "</ion-row><ion-row>";
    }
    listado += `
    <ion-col>
      <ion-card button="true" onclick="AgregarAlimento(event)" id="${data[i].id}">
        <img alt="Silhouette of mountains" src="${imgURL+data[i].imagen}.png" />
        <ion-card-header>
          <ion-card-title>${data[i].nombre}</ion-card-title>
          <ion-card-subtitle>Porcion: ${data[i].porcion}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>Calorias: ${data[i].calorias}</ion-item>
            <ion-item>Carbohidratos: ${data[i].carbohidratos}</ion-item>
            <ion-item>Grasas: ${data[i].grasas}</ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-col>`
  }
  listado += "</ion-row>";
  grid.innerHTML = listado;
  comidas = data;
  } catch(e){
    console.log(e.message);
  }
}

function AgregarAlimento(event){
  try{
  document.querySelector("#grid-agregar").style.display = "none";
  let form = document.querySelector("#form-agregar");
  let alimento = comidas.find(x => x.id == event.currentTarget.id);
  let hoy = new Date(Date.now());
  let fechaMax = `${hoy.getFullYear()}-12-31`
  let fechaMin = `${hoy.getFullYear()}-01-01`;
  form.innerHTML = "";
  form.innerHTML = `
  <ion-list>
  <img alt="Silhouette of mountains" class="agregar-imagen" src="${imgURL+alimento.imagen}.png"/>
  <ion-label>${alimento.nombre}</ion-label>
    <ion-item>
      <ion-input label="Cantidad" type="number" placeholder="Ejemplo ${alimento.porcion}" id="txtCantidad-A"></ion-input>
      <ion-text color="danger">(*)</ion-text>
    </ion-item>
    <ion-item>
    <ion-datetime presentation="date-time" min="${fechaMin}" max="${fechaMax}" id="txtFecha"></ion-datetime>
    </ion-item>
    <ion-item><p id="p-Agregar"></p></ion-item>
    <ion-item>
      <ion-button class="center" onclick='ObtenerAlimentos(MostrarAlimentos)'>Volver</ion-button>
      <ion-button class="center" onclick=AgregarPorcion('${alimento.id}')>Agregar Comida</ion-button>
    </ion-item>
  </ion-list>
  <br>
  
  `
  form.style.display = "block";
  }catch(e){
    console.log(e.message);
  }
}

function AgregarPorcion(idAlimento){
  try{
    document.querySelector("#p-Agregar").innerHTML = "";
    let cantidad = document.querySelector("#txtCantidad-A").value.trim();
    let fecha = document.querySelector("#txtFecha").value;
    let alimento = comidas.find(x => x.id == idAlimento);    
    Vacios(cantidad, fecha, alimento);
    ValidarAgregarComida(cantidad, alimento)
    let date = new Date(fecha);
    document.querySelector("#txtCantidad-A").value = "";
    if(Session()){
      AgregarAPI(idAlimento, cantidad, date);
    } else {
      router.push("/");
    }    
  }catch(e){
    document.querySelector("#p-Agregar").innerHTML = e.message;
  }
}

  function AgregarAPI(idAlimento, cantidad, date){
    try{
      let idUsuario = localStorage.getItem("id");
      fetch(`${baseURL}/registros.php`,{
        method: "POST",
        headers:{
          "Content-Type": "application/json",
          "apiKey": localStorage.getItem("token"),
          "iduser": idUsuario
        },
        body:JSON.stringify(
          {
          "idAlimento": idAlimento,
          "idUsuario": idUsuario,
          "cantidad": cantidad,
          "fecha": date.getFullYear()+"-"+(date.getMonth() + 1)+"-"+date.getDate()
        }
      )
      })
      .then(res => res.json())
      .then(data => {
        if(data.codigo == 200){
          document.querySelector("#p-Agregar").innerHTML = "Comida agregada";
        } else {
          document.querySelector("#p-Agregar").innerHTML = data.mensaje;
        }
      })
      .catch(e => console.log(e));
    }
    catch(e){
      console.log(e.message);
    }
  }

function APIObtenerRegistros(fnc){
  document.querySelector("#p-ListarComidas").innerHTML = "";
  try{
    if(Session()){
      let token = localStorage.getItem("token");
      let id = localStorage.getItem("id");
      fetch(`${baseURL}/registros.php?idUsuario=${id}`,
      {
        headers:{
          "Content-Type":"application/json",
          "apiKey": token,
          "iduser":id
        }
      }
      )
      .then(res => res.json())
      .then(data => {
        if(data.codigo == 200){
          FormatearRegistros(data.registros);
          if(fnc != undefined){
            fnc()
          }
        }else {
          document.querySelector("#p-ListarComidas").innerHTML = "Solicitud fallida";
        }
      })
      .catch(e => document.querySelector("#p-ListarComidas").innerHTML = e.message)
    } else {
      document.querySelector("#p-ListarComidas").innerHTML = "Error en la solicitud debe iniciar session";
    }
  }catch(e)
  {
    console.log(e.message);
  }
}

function FormatearRegistros(data){
  data.forEach(consumidos => {
    let match = comidas.find(alimento => alimento.id == consumidos.idAlimento)
    consumidos.nombre = match.nombre
    consumidos.img = match.imagen
    consumidos.calorias = match.calorias
    consumidos.porcion = match.porcion
    return consumidos
  })
  dietaUsuario = data;
}

function RenderizarComidas(){
  console.log(dietaUsuario)
  let filaTabla = document.querySelector("#listar-comidas-grid");
  let content = `
  <ion-row>
    <ion-col></ion-col>
    <ion-col>Alimento</ion-col>
    <ion-col>Cantidad</ion-col>
    <ion-col>Calorias</ion-col>
    <ion-col>Fecha</ion-col>
    <ion-col></ion-col>
  </ion-row>`;
  if(dietaUsuario.length > 0){
    dietaUsuario.forEach(x => {
      let porcion = x.porcion.substring(0,x.porcion.length-1)
      let unidad = x.porcion.substring(x.porcion.length-1,x.porcion.length)
      console.log(x);
      content += `
      <ion-row>
        <ion-col><img alt="Silhouette of mountains" class="agregar-imagen" src="${imgURL+x.img}.png"/></ion-col>
        <ion-col>${x.nombre}</ion-col>
        <ion-col>${x.cantidad}${unidad}</ion-col>
        <ion-col>${x.cantidad/porcion*x.calorias} cal</ion-col>
        <ion-col>${x.fecha}</ion-col>
        <ion-col><ion-button class="center" onclick=EliminarAlimento('${x.id}')>Eliminar</ion-button></ion-col>
      </ion-row>
    `})
  filaTabla.innerHTML = content;
  } else {
    document.querySelector("#p-ListarComidas").innerHTML = "No hay comidas";
  }
}

function EliminarAlimento(id){
  try{
    if(Session()){
      fetch(`${baseURL}/registros.php?idRegistro=${id}`,{
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "apikey": localStorage.getItem("token"),
          "iduser": localStorage.getItem("id")
        }
      })
      .then(res => res.json())
      .then(data => {
        if(data.codigo == 200){
          APIObtenerRegistros(RenderizarComidas); 
        }
        document.querySelector("#p-ListarComidas").innerHTML = data.mensaje;
      })
      .catch(e => document.querySelector("#p-ListarComidas").innerHTML = e.message)
    }else {
      document.querySelector("#p-ListarComidas").innerHTML = "Error en la solicitud debe iniciar session";
    }
  }catch(e){
    console.log(e);
  }
}

function ValidarAgregarComida(calorias, alimento){
  if(isNaN(calorias) || calorias < 1){
    throw new Error("Ingrese una cantidad de calorias valida")
  }
  if(alimento == null || alimento == undefined || comidas.find(x => x == alimento) == undefined){
    throw new Error("El alimento no es valido")
  }

}


function Volver(){
  router.back();
}
