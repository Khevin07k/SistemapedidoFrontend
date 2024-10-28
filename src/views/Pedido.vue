<script setup>

import {onMounted, ref, computed, nextTick} from "vue";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import servicesMenu from "@/services/menu.service.js";
import servicesPedido from "@/services/pedido.service.js";

const userDialog = ref(false);
const menus = ref({});
const menu = ref({});

// Pedidos
const pedido = ref({
    id: null,
    Imagen: '',
    Nombre: '',
    Precio: 0,
    Cantidad: 0,
});
const pedidos = ref([]);

const addPedido = (menu) => {
    // Buscar si el ítem ya existe en pedidos
    const existingPedido = pedidos.value.find(p => p.id === menu.id);
    if (existingPedido) {
        // Si ya existe, incrementar la cantidad
        existingPedido.Cantidad++;
    } else {
        // Si no existe, crear un nuevo pedido
        pedido.value = {
            id: menu.id,
            Imagen: menu.image,
            Nombre: menu.Nombre,
            Precio: menu.Precio,
            Cantidad: 1
        };
        // Agregar el nuevo pedido al array de pedidos
        pedidos.value.push({...pedido.value});
    }
};

const mostrarAlerta = ref(false);
const pedidoRealizado = ref(false);


const decrementarCantidad = (pedido) => {
    if (pedido.Cantidad > 1) {
        pedido.Cantidad--;
    }
}

const incrementarCantidad = (pedido) => {
    pedido.Cantidad++;
}

const eliminarPedido = (pedido) => {
    const index = pedidos.value.indexOf(pedido);
    if (index !== -1) {
        pedidos.value.splice(index, 1);
    }
}

// Cálculo del total a pagar
const totalAPagar = computed(() => {
    return pedidos.value.reduce((total, pedido) => {
        return total + (pedido.Precio * pedido.Cantidad);
    }, 0).toFixed(2);
});

// Función para realizar el pedido
const realizarPedido = async () => {
    // Recuperar datos del localStorage
    const datos = localStorage.getItem('user');
    const user = datos ? JSON.parse(datos) : null;

    // if (user) {
    //     const clienteid = user.data.id; // Asegúrate de que el ID del cliente esté disponible
    //     console.log('Cliente ID:', clienteid); // Para verificar que se está recuperando correctamente
    // } else {
    //     console.error('No se encontró el usuario en localStorage'); // Manejo de error
    //     return; // Salir si no hay usuario
    // }

    try {
        // Agregar subtotal a cada pedido
        const pedidosConSubtotal = pedidos.value.map(pedido => ({
            ...pedido,
            total: (pedido.Precio * pedido.Cantidad).toFixed(2) // Calcula el subtotal y lo formatea
        }));

        const pedidoData = {
            cliente_id: user.data.id, // Usar el cliente ID recuperado
            pedidos: pedidosConSubtotal, // Usar el array de pedidos con subtotal
            TotalPagar: totalAPagar.value,
        };
        //console.log(pedidoData);
        // Llamar al servicio para enviar el pedido al servidor
        const response = await servicesPedido.guardar(pedidoData);
        //console.log(response);


    } catch (error) {
        console.error('Error al realizar el pedido:', error);
    }
    
    userDialog.value = true;
};

const confirmarPago = () => {
	userDialog.value = false;
    // mostrarModal.value = false;
    mostrarAlerta.value = true;
    pedidoRealizado.value = true;
    setTimeout(() => {
        mostrarAlerta.value = false;
    }, 3000); // La alerta desaparecerá después de 3 segundos*/
};

const cerrarModal = () => {
	userDialog.value = false;
    // mostrarModal.value = false;
};

//funcion eventos
onMounted(() => {
    getListar();
});


async function getListar() {
	try {
		const { data } = await servicesMenu.listar();
		// menus.value = data;
		menus.value = data.map(item => ({
            id: item.id,
			Nombre: item.Nombre,
			image: "http://localhost:8000/"+item.FotoMenu, // Asume que el servidor devuelve una URL de imagen
			Precio: item.Precio,
			Descripcion: item.Descripcion
		}));
		//console.log(menus.value);
	} catch (error) {
		console.error("Error al cargar el menú:", error);
	}
}

// Función para generar el recibo

const pdfUrl = ref(null);
const showPdfPreview = ref(false);
const showPdfContent = ref(false);

const generarYDescargarPDF = async () => {
    try {
        // Crear un elemento temporal
        const element = document.createElement('div');
        element.style.width = '210mm'; // Ancho de una página A4
        element.style.padding = '20mm'; // Margen de 2cm
        element.innerHTML = `
            <h2 style="text-align: center; color: #333; font-size: 24px; margin-bottom: 20px;">Recibo de Pedido</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Producto</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Cantidad</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Precio</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.value.map(pedido => {
                        const precio = parseFloat(pedido.Precio);
                        const total = precio * pedido.Cantidad;
                        return `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 12px;">${pedido.Nombre}</td>
                                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${pedido.Cantidad}</td>
                                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${precio.toFixed(2)}</td>
                                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${total.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <p style="text-align: right; font-weight: bold; margin-top: 20px; font-size: 18px;">Total a pagar: $${totalAPagar.value}</p>
        `;

        // Añadir el elemento al body temporalmente (necesario para html2canvas)
        document.body.appendChild(element);

        // Generar el PDF
        const canvas = await html2canvas(element, {
            scale: 2, // Aumenta la calidad de la imagen
        });

        // Remover el elemento temporal
        document.body.removeChild(element);

        const imgData = canvas.toDataURL('image/png');

        // Crear un nuevo PDF en tamaño carta
        const pdf = new jsPDF({
            format: 'letter',
            unit: 'mm'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20; // 2cm de margen

        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);

        // Descargar el PDF
        pdf.save('recibo.pdf');
    } catch (error) {
        console.error('Error al generar el PDF:', error);
    }
};

// Agregar esta propiedad computada
const subtotalPorPedido = computed(() => {
    return pedidos.value.map(pedido => ({
        ...pedido,
        total: (pedido.Precio * pedido.Cantidad).toFixed(2) // Calcula el subtotal y lo formatea
    }));
});

</script>

<template>
    <div id="pedido-content" style="display: none;">
        <h2>Recibo de Pedido</h2>
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="pedido in subtotalPorPedido" :key="pedido.id">
                    <td class="px-4 py-2">{{ pedido.Nombre }}</td>
                    <td class="px-4 py-2">{{ pedido.Cantidad }}</td>
                    <td class="px-4 py-2">{{ pedido.Precio }}</td>
                    <td class="px-4 py-2">{{ pedido.total }}</td> <!-- Usar la propiedad computada -->
                </tr>
            </tbody>
        </table>
        <p>Total a pagar: {{ totalAPagar }}</p>
    </div>


	<Dialog
		v-model:visible="userDialog"
		:style="{ width: '450px' }"
		:modal="true"
	>
		<div class="flex flex-col gap-6">
			<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
				Pague por QR
			</h3>
			<div class="mt-2">
				<img src="https://t3.gstatic.com/licensed-image?q=tbn:ANd9GcREk1UchFScf-y2IlTgVGSdRqnWKtEqtCslcJ7XfDT2EYMg_dpRN47ZULq-i0BNmxcg" alt="Código QR para pago" class="mx-auto">
				<p class="text-sm text-gray-500 mt-2">
					Escanee el código QR para realizar el pago
				</p>
			</div>
		</div>
		<template #footer>
			<button type="button" @click="confirmarPago" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm">
				Pagar
			</button>
			<button type="button" @click="cerrarModal" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
				Cancelar
			</button>
		</template>
		</Dialog>



<!-- Alerta de pedido exitoso -->
<div v-if="mostrarAlerta" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Éxito!</strong>
        <span class="block sm:inline">Su pedido ha sido exitoso.</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3" @click="mostrarAlerta = false">
            <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
        </span>
    </div>

    <div class="flex flex-wrap -mx-4">
        <!-- Menu -->
        <div class="w-full md:w-1/2 px-4">
            <div class="m-1">
                <h2 class="text-center text-2xl font-bold mb-4">Menu</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="menu in menus" class="bg-white shadow-md rounded-lg overflow-hidden">
                        <img :src="menu.image" class="w-full h-48 object-cover">
                        <div class="p-4">
                            <h5 class="font-bold text-lg mb-2">{{ menu.Nombre }}</h5>
                            <p class="text-gray-700 text-base mb-4">{{ menu.Descripcion }}</p>
                            <div class="flex justify-between items-center">
                                <p class="text-sm text-gray-600">Precio: {{ menu.Precio }}</p>
                                <button @click="addPedido(menu)" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Pedido -->
        <div class="w-full md:w-1/2 px-4">
            <h2 class="text-center text-2xl font-bold mb-4">Pedidos</h2>
            <table class="w-full">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left">Nº</th>
                        <th class="px-4 py-2 text-left">Descripcion</th>
                        <th class="px-4 py-2 text-left">Cantidad</th>
                        <th class="px-4 py-2 text-left">SubTotal</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pedido in pedidos" class="border-b">
                        <td class="px-4 py-2">{{ pedido.id }}</td>
                        <td class="px-4 py-2">
                            <div class="flex items-center">
                                <img :src="pedido.Imagen" class="w-12 h-12 object-cover mr-2">
                                <strong>{{ pedido.Nombre }}</strong>
                            </div>
                        </td>
                        <td class="px-4 py-2">
                            <div class="flex items-center">
                                <button @click="decrementarCantidad(pedido)" class="bg-gray-200 text-gray-800 font-bold py-1 px-2 rounded-l">
                                    -
                                </button>
                                <span class="bg-gray-100 text-gray-800 font-medium px-4 py-1">{{ pedido.Cantidad }}</span>
                                <button @click="incrementarCantidad(pedido)" class="bg-gray-200 text-gray-800 font-bold py-1 px-2 rounded-r">
                                    +
                                </button>
                            </div>
                        </td>
                        <td class="px-4 py-2">{{ pedido.Precio * pedido.Cantidad }}</td>
                        <td class="px-4 py-2">
                            <button @click="eliminarPedido(pedido)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"></td>
                        <td class="px-4 py-2 text-right"><strong>Total a pagar:</strong></td>
                        <td class="px-4 py-2"><strong>{{ totalAPagar }}</strong></td>
                    </tr>
                    <tr>
                        <td colspan="4">
                            <div class="flex justify-end mt-4">
                                <button @click="realizarPedido" :disabled="pedidoRealizado" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2">
                                    Pedir
                                </button>
                                <button v-if="pedidoRealizado" @click="generarYDescargarPDF" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                                    Generar Recibo
                                </button>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</template>

<style scoped>
.hidden {
    position: absolute;
    left: -9999px;
    top: -9999px;
}
</style>



