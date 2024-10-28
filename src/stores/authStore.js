// src/stores/authStore.js
import { defineStore } from 'pinia';
import authApi from "@/services/auth.service.js";

export const useAuthStore = defineStore('auth', {
    state: () => {
        // Intentar recuperar el estado inicial del localStorage
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        const status = localStorage.getItem('status');

        console.log('Inicializando store con:', {
            token,
            userData,
            status
        });

        return {
            user: userData ? JSON.parse(userData) : null,
            token: token || null,
            isAuthenticated: status === "true"
        };
    },

    getters: {
        isLoggedIn: (state) => {
            console.log('Getter isLoggedIn:', {
                isAuthenticated: state.isAuthenticated,
                hasUser: !!state.user
            });
            return state.isAuthenticated && !!state.user;
        },
        currentUser: (state) => {
            console.log('Getter currentUser:', state.user);
            return state.user;
        },
        userImage: (state) => state.user?.image || '',
        userName: (state) => state.user?.name || '',
        userEmail: (state) => state.user?.email || '',
    },

    actions: {
        async login(credentials) {
            try {
                const { data } = await authApi.login(credentials);
                console.log("Respuesta del login:", data);

                if (!data || !data.data) {
                    throw new Error('Respuesta inválida del servidor');
                }

                // Actualizar el estado
                this.$patch({
                    token: data.access_token,
                    user: data.data,
                    isAuthenticated: true
                });

                // Guardar en localStorage
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.data));
                localStorage.setItem("status", "true");

                return data;
            } catch (error) {
                console.error("Error en login:", error);
                await this.logout();
                throw error;
            }
        },

        async autoLogin() {
            console.log('Ejecutando autoLogin');
            try {
                const token = localStorage.getItem('access_token');
                const userData = localStorage.getItem('user');
                const status = localStorage.getItem('status');

                console.log('Datos encontrados:', {
                    token: !!token,
                    userData,
                    status
                });

                if (token && userData && status === "true") {
                    const parsedUser = JSON.parse(userData);
                    console.log('Usuario recuperado:', parsedUser);

                    this.$patch({
                        token,
                        user: parsedUser,
                        isAuthenticated: true
                    });

                    console.log('Estado actualizado:', this.$state);
                } else {
                    console.log('No hay datos de sesión válidos');
                    await this.logout();
                }
            } catch (error) {
                console.error('Error en autoLogin:', error);
                await this.logout();
            }
        },

        async logout() {
            try {
                if (this.token) {
                    await authApi.logout();
                }
            } catch (error) {
                console.error('Error en logout:', error);
            } finally {
                // Limpiar el estado usando $patch
                this.$patch({
                    user: null,
                    token: null,
                    isAuthenticated: false
                });

                // Limpiar localStorage
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                localStorage.setItem("status", "false");

                //console.log("Logout completado");
            }
        },

        // Método para actualizar el usuario
        updateUser(userData) {
            this.$patch({
                user: { ...this.user, ...userData }
            });
            localStorage.setItem('user', JSON.stringify(this.user));
        }
    },
});