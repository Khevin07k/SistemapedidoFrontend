<script setup>
import {onMounted, ref} from 'vue';
import servicesMenu from "@/services/menu.service.js";
// import Carousel from 'primevue/carousel';

const menus = ref({
});

//funcion eventos
onMounted(() => {
	getListar();
});

async function getListar() {
	try {
        const { data } = await servicesMenu.listar();
		// menus.value = data;
        menus.value = data.map(item => ({
			Nombre: item.Nombre,
            image: "http://localhost:8000/"+item.FotoMenu, // Asume que el servidor devuelve una URL de imagen
            Precio: item.Precio,
            Descripcion: item.Descripcion
        }));
		console.log(menus.value);
    } catch (error) {
        console.error("Error al cargar el menú:", error);
    }
}

const title = ref("Platos");


</script>

<template>
	<div class="col-12 gap-4">
        <div class="col-12 col-span-12 gap-4">
            <div class="card">
                <Carousel :value="menus" :numVisible="1" :numScroll="1" circular :autoplayInterval="3000">
                    <template #item="slotProps">
                        <div class="border border-surface-200 dark:border-surface-700 rounded p-2">
                            <div class="mb-4">
                                <div class="relative mx-auto">
                                    <img
                                        :src="slotProps.data.image"
                                        :alt="slotProps.data.Nombre"
                                        class="w-full rounded"
                                    />
                                </div>
                            </div>
                            <div>{{ slotProps.data.Descripcion }}</div>
                            <div class="mb-4 font-medium">{{ slotProps.data.Precio }}</div>
                        </div>
                    </template>
                </Carousel>
            </div>
        </div>
    </div>

</template>

<style scoped>
.carousel-item {
	height: 50rem;
}
</style>
