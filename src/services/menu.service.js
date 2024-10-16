import { Api } from "./api.service.js";


export default {
    listar: () => {
        return Api().get("/listarMenu");
    },
    /*guardar: (datos) => {
        return Api().post("/menu/", datos);
    },
    mostrar: (id) => {
        return Api().get("/menu/"+id);
    },
    update: (id, datos) => {
        return Api().put("/menu/"+id, datos);
    },
    eliminar: (id) => {
        return Api().delete("/menu/"+id);
    },*/
};
