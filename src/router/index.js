import AppLayout from "@/layout/AppLayout.vue";
import {createRouter, createWebHistory} from 'vue-router'
import Login from "@/views/Login.vue";
import Menu from "@/views/Menu.vue";
import Register from "@/views/Register.vue";
import Pedido from "@/views/Pedido.vue";


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: {redirectIfAuth: true},
        },
        {
            path: '/register',
            name: 'register',
            component: Register,
            meta: {redirectIfAuth: true},
        },
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '',
                    name: 'principal',
                    component: Menu,
                    meta: {redirectIfAuth: false},
                },
                {
                    path: 'menu',
                    name: 'menu',
                    component: Menu,
                    meta: {redirectIfAuth: false},
                },
                {
                    path: 'pedidos',
                    name: 'pedidos',
                    component: Pedido,
                    meta: {requiredAuth: true},
                }
            ]
        },
    ]
});
//intercepta las direcciones si tiene permiso
router.beforeEach((to, from, next) => {
    let token = localStorage.getItem("access_token");
    if (to.meta.requiredAuth) {
        if (!token) {
            return next({name: "login"});
        }
        return next();
    }
    if (to.meta.redirectIfAuth && token) {
        return next({name: 'menu'});
    }
    return next();
});

export default router
