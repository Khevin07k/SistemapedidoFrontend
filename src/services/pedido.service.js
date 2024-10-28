import { Api } from "./api.service.js";


export default {
    listar: () => {
        return Api().get("/pedido");
    },
    guardar: (datos) => {
        return Api().post("/pedidoClient/", datos);
    },
    /*mostrar: (id) => {
        return Api().get("/pedido/"+id);
    },
    update: (id, datos) => {
        return Api().put("/pedido/"+id, datos);
    },
    eliminar: (id) => {
        return Api().delete("/pedido/"+id);
    },*/
}