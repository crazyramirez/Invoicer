// Función para añadir conceptos
document.getElementById('add-concepto').addEventListener('click', function() {
    const container = document.getElementById('conceptos-container');
    const conceptoDiv = document.createElement('div');
    conceptoDiv.classList.add('concepto');
  
    conceptoDiv.innerHTML = `
      <input type="text" class="descripcion" placeholder="Descripción del concepto" required>
      <input type="number" class="cantidad" placeholder="Cantidad" min="0" required>
      <input type="number" class="importe" placeholder="Importe unitario" min="0" required>
      <button type="button" class="remove-concepto">-</button>
    `;
  
    // Añadir el nuevo concepto al contenedor
    container.appendChild(conceptoDiv);
  
    // Añadir event listener para eliminar el concepto
    addRemoveConceptoListener(conceptoDiv);
  
    // Añadir event listeners para recalcular los totales cuando se modifiquen cantidad o importe
    conceptoDiv.querySelector('.cantidad').addEventListener('input', calcularTotales);
    conceptoDiv.querySelector('.importe').addEventListener('input', calcularTotales);
  
    calcularTotales(); // Recalcular los totales cuando se añade un nuevo concepto
    
    // Habilitar todos los botones de eliminar si hay más de un concepto
    updateRemoveButtons();
});

// Función para añadir el event listener de eliminación a un concepto
function addRemoveConceptoListener(conceptoDiv) {
    conceptoDiv.querySelector('.remove-concepto').addEventListener('click', function() {
        const container = document.getElementById('conceptos-container');
        if (container.children.length > 1) {
            conceptoDiv.remove();
            calcularTotales(); // Recalcular los totales después de eliminar un concepto
            updateRemoveButtons(); // Actualizar el estado de los botones de eliminar
        }
    });
}

// Función para actualizar el estado de los botones de eliminar
function updateRemoveButtons() {
    const container = document.getElementById('conceptos-container');
    const removeButtons = container.querySelectorAll('.remove-concepto');
    const disableButtons = container.children.length === 1;
    
    removeButtons.forEach(button => {
        button.disabled = disableButtons;
    });
}

// Evento DOMContentLoaded para inicializar los listeners en los conceptos existentes
document.addEventListener('DOMContentLoaded', function() {
    const conceptos = document.querySelectorAll('#conceptos-container .concepto');
    conceptos.forEach(concepto => {
        addRemoveConceptoListener(concepto);
        
        // Añadir event listeners para recalcular los totales cuando se modifiquen cantidad o importe
        concepto.querySelector('.cantidad').addEventListener('input', calcularTotales);
        concepto.querySelector('.importe').addEventListener('input', calcularTotales);
    });

    // Calcular totales iniciales
    calcularTotales();

    // Inicializar la fecha de la factura
    const fechaFactura = document.getElementById('fecha-factura');
    const hoy = new Date().toISOString().split('T')[0];
    fechaFactura.value = hoy;
    fechaFactura.max = hoy;

    // Actualizar el estado inicial de los botones de eliminar
    updateRemoveButtons();
});

document.addEventListener('input', function(event) {
    if (event.target && event.target.type === 'number') {
        console.log('Input de tipo number editado');
        calcularTotales(); // Llamar a la función para recalcular los totales
    }
});

// Función para calcular el subtotal, IVA y total en tiempo real
function calcularTotales() {
    const conceptos = document.querySelectorAll('.concepto');
    let subtotal = 0;
  
    conceptos.forEach(concepto => {
        const cantidad = parseFloat(concepto.querySelector('.cantidad').value) || 0;
        const importe = parseFloat(concepto.querySelector('.importe').value) || 0;
        subtotal += cantidad * importe;
    });
  
    const iva = parseFloat(document.getElementById('iva').value) || 0;
    const ivaCalc = subtotal * (iva / 100);
    const total = subtotal + ivaCalc;
  
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('iva-calc').textContent = ivaCalc.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

// Event listener para recalcular totales cuando se modifique el IVA
document.getElementById('iva').addEventListener('input', calcularTotales);

// Función para generar el PDF
document.getElementById('generate-pdf').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Función auxiliar para formatear importes
    function formatImporte(valor) {
        return new Intl.NumberFormat('de-DE', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(valor).replace('€', '').trim() + ' €';
    }

    // Función auxiliar para formatear la fecha
    function formatFecha(fechaString) {
        const fecha = new Date(fechaString);
        const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
        return fecha.toLocaleDateString('es-ES', opciones);
    }

    // Configuración de márgenes
    const marginLeft = 20;
    const marginRight = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Configuración de fuentes y colores
    doc.setFont("helvetica");
    doc.setTextColor(80, 80, 80); // Gris oscuro para el texto principal

    // Obtener el título y la fecha del campo HTML
    const tituloFactura = document.getElementById('titulo-factura').value;
    const fechaFactura = document.getElementById('fecha-factura').value;
    const fechaFormateada = formatFecha(fechaFactura);

    // Título y fecha 
    doc.setFontSize(15);
    doc.setTextColor(100, 100, 100); // Gris más oscuro para el título
    doc.text(tituloFactura, marginLeft, 20);
    doc.setDrawColor(200, 200, 200);
    doc.setFontSize(11);
    doc.text("Fecha de emisión: " + fechaFormateada, marginLeft, 28);
    doc.line(marginLeft, 33, pageWidth - marginRight, 33);

    // Información de la empresa y el cliente
    const empresaNombre = document.getElementById('empresa-nombre').value;
    const empresaCIF = document.getElementById('empresa-cif').value;
    const empresaDireccion = document.getElementById('empresa-direccion').value;

    const clienteNombre = document.getElementById('cliente-nombre').value;
    const clienteCIF = document.getElementById('cliente-cif').value;
    const clienteDireccion = document.getElementById('cliente-direccion').value;

    // Dibujar datos de la empresa (alineado a la izquierda)
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.text(empresaNombre, marginLeft, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`CIF: ${empresaCIF}`, marginLeft, 57);
    const empresaDireccionLines = doc.splitTextToSize(empresaDireccion, 80);
    empresaDireccionLines.forEach((line, index) => {
        doc.text(line, marginLeft, 62 + (index * 5));
    });

    // Dibujar datos del cliente (alineado a la derecha)
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text("Facturado a:", pageWidth - marginRight, 43, null, null, "right");
    doc.setFont("helvetica", "bold");
    doc.text(clienteNombre, pageWidth - marginRight, 50, null, null, "right");
    doc.setFont("helvetica", "normal");
    doc.text(`CIF: ${clienteCIF}`, pageWidth - marginRight, 57, null, null, "right");
    const clienteDireccionLines = doc.splitTextToSize(clienteDireccion, 80);
    clienteDireccionLines.forEach((line, index) => {
        doc.text(line, pageWidth - marginRight, 62 + (index * 5), null, null, "right");
    });

    // Descripción del proyecto
    const descripcionGeneral = document.getElementById('descripcion-general').value;
    doc.setFontSize(10);
    const descripcionLines = doc.splitTextToSize(descripcionGeneral, contentWidth);
    let yPosition = 95;
    descripcionLines.forEach((line, index) => {
        doc.text(line, marginLeft, yPosition);
        yPosition += 7; // Incrementamos 7 unidades por cada línea
    });

    let contain_desc = false;
    if (descripcionLines.length > 0) {
        contain_desc = true;
    }

    // Recoger los conceptos del formulario
    const conceptosContainer = document.getElementById('conceptos-container');
    const conceptosElements = conceptosContainer.querySelectorAll('.concepto');
    const conceptos = Array.from(conceptosElements).map(concepto => {
        return {
            descripcion: concepto.querySelector('.descripcion').value,
            cantidad: parseFloat(concepto.querySelector('.cantidad').value) || 0,
            importe: parseFloat(concepto.querySelector('.importe').value) || 0
        };
    }).filter(concepto => concepto.cantidad > 0 && concepto.importe > 0);

    // Calcular subtotal, IVA y total
    const subtotal = conceptos.reduce((sum, concepto) => sum + (concepto.cantidad * concepto.importe), 0);
    const iva = parseFloat(document.getElementById('iva').value) || 0;
    const ivaCalc = subtotal * (iva / 100);
    const total = subtotal + ivaCalc;

    // Agregar conceptos al PDF solo si hay conceptos y el total es mayor que 0
    if (conceptos.length > 0 && total > 0) {
        if (contain_desc) { 
            yPosition += 20;
        }
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "bold");
        doc.text("CONCEPTO", marginLeft, yPosition);
        doc.text("CANTIDAD", marginLeft + 90, yPosition);
        doc.text("IMPORTE", marginLeft + 120, yPosition);
        doc.text("TOTAL", pageWidth - marginRight, yPosition, null, null, "right");
        doc.setFont("helvetica", "normal");
        
        yPosition += 4;
        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);

        conceptos.forEach(concepto => {
            yPosition += 10;
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            doc.text(concepto.descripcion, marginLeft, yPosition);
            doc.setFont("helvetica", "normal");
            doc.text(concepto.cantidad.toString(), marginLeft + 90, yPosition);
            doc.text(formatImporte(concepto.importe), marginLeft + 120, yPosition);
            doc.text(formatImporte(concepto.cantidad * concepto.importe), pageWidth - marginRight, yPosition, null, null, "right");
        });

        // Totales
        yPosition += 8;
        doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
        yPosition += 8;
        
        doc.text("SUBTOTAL", pageWidth - marginRight - 50, yPosition);
        doc.text(formatImporte(subtotal), pageWidth - marginRight, yPosition, null, null, "right");
        
        yPosition += 8;
        doc.text(`IVA ${iva}%`, pageWidth - marginRight - 50, yPosition);
        doc.text(formatImporte(ivaCalc), pageWidth - marginRight, yPosition, null, null, "right");
        
        yPosition += 8;
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL", pageWidth - marginRight - 50, yPosition);
        doc.text(formatImporte(total), pageWidth - marginRight, yPosition, null, null, "right");
    }

    // Información de pago
    yPosition = 260;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    // Obtener el texto del textarea
    const infoPago = document.getElementById('info-pago').value;
    const infoPayoLines = doc.splitTextToSize(infoPago, contentWidth);
    doc.setFont("helvetica", "normal");

    infoPayoLines.forEach((line, index) => {
        doc.text(line, marginLeft, yPosition + (index * 7));
    });

    // Guardar el PDF
    doc.save('factura.pdf');
});
