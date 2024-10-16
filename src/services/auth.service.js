import { Api } from './api.service';

export default{
    login:(credentials)=>{
        return Api().post("/login",credentials);
    },
    register:(dat)=>{
        return Api().post("/register",dat);
    },
    profile:()=>{
        return Api().get("/profile",dat);
    },
    logout:()=>{
        return Api().post("/logout"+id);
    },


}