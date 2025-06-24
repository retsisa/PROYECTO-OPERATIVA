document.addEventListener('DOMContentLoaded', function() {
    const origenesInput = document.getElementById('origenes');
    const destinosInput = document.getElementById('destinos');
    const generarBtn = document.getElementById('generar-btn');
    const calcularBtn = document.getElementById('calcular-btn');
    const costosCard = document.getElementById('costos-card');
    const resultadosCard = document.getElementById('resultados-card');
    const costosTable = document.getElementById('costos-table');
    const asignacionesContainer = document.getElementById('asignaciones-container');
    const costoTotal = document.getElementById('costo-total');
    const balanceInfo = document.getElementById('balance-info');
    const pasosContainer = document.getElementById('pasos-container');
    
    let costos = [];
    let ofertas = [];
    let demandas = [];
    
    // Generar tabla de costos
    generarBtn.addEventListener('click', function() {
        const origenes = parseInt(origenesInput.value);
        const destinos = parseInt(destinosInput.value);
        
        if (origenes < 1 || destinos < 1) {
            alert('Por favor ingrese valores válidos (mayores a 0)');
            return;
        }
        
        generarTablaCostos(origenes, destinos);
        costosCard.style.display = 'block';
        resultadosCard.style.display = 'none';
    });
    
    // Función para generar la tabla de costos
    function generarTablaCostos(origenes, destinos) {
        // Limpiar tabla existente
        costosTable.innerHTML = '';
        
        // Crear encabezados
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')); // Celda vacía superior izquierda
        
        for (let j = 0; j < destinos; j++) {
            const th = document.createElement('th');
            th.textContent = `Destino ${j+1}`;
            headerRow.appendChild(th);
        }
        
        // Añadir columna de oferta
        const thOferta = document.createElement('th');
        thOferta.textContent = 'Oferta';
        headerRow.appendChild(thOferta);
        
        thead.appendChild(headerRow);
        costosTable.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        for (let i = 0; i < origenes; i++) {
            const row = document.createElement('tr');
            
            // Encabezado de fila
            const thOrigen = document.createElement('th');
            thOrigen.textContent = `Origen ${i+1}`;
            row.appendChild(thOrigen);
            
            // Celdas de costos
            for (let j = 0; j < destinos; j++) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.value = Math.floor(Math.random() * 10) + 1; // Valor aleatorio entre 1 y 10
                input.dataset.i = i;
                input.dataset.j = j;
                input.classList.add('costo-input');
                td.appendChild(input);
                row.appendChild(td);
            }
            
            // Celda de oferta
            const tdOferta = document.createElement('td');
            const inputOferta = document.createElement('input');
            inputOferta.type = 'number';
            inputOferta.min = '0';
            inputOferta.value = Math.floor(Math.random() * 100) + 50; // Valor aleatorio entre 50 y 150
            inputOferta.dataset.i = i;
            inputOferta.classList.add('oferta-input');
            tdOferta.appendChild(inputOferta);
            row.appendChild(tdOferta);
            
            tbody.appendChild(row);
        }
        
        // Fila de demandas
        const demandaRow = document.createElement('tr');
        demandaRow.appendChild(document.createElement('th')).textContent = 'Demanda';
        
        for (let j = 0; j < destinos; j++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.value = Math.floor(Math.random() * 100) + 30; // Valor aleatorio entre 30 y 130
            input.dataset.j = j;
            input.classList.add('demanda-input');
            td.appendChild(input);
            demandaRow.appendChild(td);
        }
        
        // Celda vacía al final
        demandaRow.appendChild(document.createElement('td'));
        
        tbody.appendChild(demandaRow);
        costosTable.appendChild(tbody);
    }
    
    // Resolver el problema con el método Vogel
    calcularBtn.addEventListener('click', function() {
        if (!leerDatos()) return;
        
        // Balancear el problema si es necesario
        const balanceResult = balancearProblema();
        
        // Mostrar información de balance
        mostrarBalanceInfo(balanceResult);
        
        // Resolver con método Vogel
        const {asignacion, costoTotal, pasos} = resolverVogel();
        
        // Mostrar resultados
        mostrarSolucion(asignacion, costoTotal, pasos);
        
        resultadosCard.style.display = 'block';
    });
    
    // Leer datos de la tabla
    function leerDatos() {
        costos = [];
        ofertas = [];
        demandas = [];
        
        const origenes = parseInt(origenesInput.value);
        const destinos = parseInt(destinosInput.value);
        
        // Leer costos
        const costoInputs = document.querySelectorAll('.costo-input');
        for (let i = 0; i < origenes; i++) {
            costos[i] = [];
            for (let j = 0; j < destinos; j++) {
                const input = document.querySelector(`.costo-input[data-i="${i}"][data-j="${j}"]`);
                costos[i][j] = parseFloat(input.value);
            }
        }
        
        // Leer ofertas
        const ofertaInputs = document.querySelectorAll('.oferta-input');
        for (let i = 0; i < origenes; i++) {
            const input = document.querySelector(`.oferta-input[data-i="${i}"]`);
            ofertas[i] = parseFloat(input.value);
        }
        
        // Leer demandas
        const demandaInputs = document.querySelectorAll('.demanda-input');
        for (let j = 0; j < destinos; j++) {
            const input = document.querySelector(`.demanda-input[data-j="${j}"]`);
            demandas[j] = parseFloat(input.value);
        }
        
        // Validar datos
        if (costos.some(row => row.some(isNaN))) {
            alert('Por favor ingrese valores válidos en todos los costos');
            return false;
        }
        
        if (ofertas.some(isNaN) || demandas.some(isNaN)) {
            alert('Por favor ingrese valores válidos en todas las ofertas y demandas');
            return false;
        }
        
        return true;
    }
    
    // Balancear el problema de transporte
    function balancearProblema() {
        const totalOferta = ofertas.reduce((a, b) => a + b, 0);
        const totalDemanda = demandas.reduce((a, b) => a + b, 0);
        const diferencia = Math.abs(totalOferta - totalDemanda);
        
        let balanceado = false;
        let mensaje = '';
        
        if (totalOferta === totalDemanda) {
            balanceado = true;
            mensaje = 'El problema está balanceado. Total oferta = total demanda.';
        } else if (totalOferta > totalDemanda) {
            // Agregar destino ficticio
            demandas.push(diferencia);
            for (let i = 0; i < costos.length; i++) {
                costos[i].push(0);
            }
            mensaje = `Se agregó un destino ficticio con demanda ${diferencia} y costos 0`;
        } else {
            // Agregar origen ficticio
            ofertas.push(diferencia);
            costos.push(new Array(demandas.length).fill(0));
            mensaje = `Se agregó un origen ficticio con oferta ${diferencia} y costos 0`;
        }
        
        return {
            balanceado,
            totalOferta,
            totalDemanda,
            diferencia,
            mensaje
        };
    }
    
    // Mostrar información de balance
    function mostrarBalanceInfo(result) {
        balanceInfo.innerHTML = `
            <div class="solution-item">Total Oferta: ${result.totalOferta}</div>
            <div class="solution-item">Total Demanda: ${result.totalDemanda}</div>
            <div class="solution-item">Diferencia: ${result.diferencia}</div>
            <div class="solution-item" style="font-weight: bold; color: ${result.balanceado ? 'green' : 'orange'}">${result.mensaje}</div>
        `;
    }
    
    // Implementación del método Vogel
    function resolverVogel() {
        const pasos = [];
        const asignacion = Array(costos.length).fill().map(() => Array(costos[0].length).fill(0));
        const ofertasActuales = [...ofertas];
        const demandasActuales = [...demandas];
        let costoTotal = 0;
        
        // Paso 0: Inicialización
        pasos.push({
            titulo: "Inicialización",
            descripcion: `Creando matriz de asignación ${costos.length}x${costos[0].length}`
        });
        
        // Mientras quede oferta o demanda por asignar
        while (ofertasActuales.some(x => x > 0) && demandasActuales.some(x => x > 0)) {
            const paso = {
                titulo: `Paso ${pasos.length}`,
                descripcion: '',
                detalles: []
            };
            
            // Calcular penalizaciones por fila
            const penalizacionesFilas = [];
            for (let i = 0; i < costos.length; i++) {
                if (ofertasActuales[i] > 0) {
                    // Encontrar los dos costos más bajos en la fila
                    const costosFila = costos[i]
                        .map((costo, j) => ({costo, j, activo: demandasActuales[j] > 0}))
                        .filter(c => c.activo)
                        .map(c => c.costo)
                        .sort((a, b) => a - b);
                    
                    if (costosFila.length >= 2) {
                        penalizacionesFilas[i] = costosFila[1] - costosFila[0];
                    } else if (costosFila.length === 1) {
                        penalizacionesFilas[i] = costosFila[0];
                    } else {
                        penalizacionesFilas[i] = -Infinity;
                    }
                } else {
                    penalizacionesFilas[i] = -Infinity;
                }
            }
            
            // Calcular penalizaciones por columna
            const penalizacionesColumnas = [];
            for (let j = 0; j < costos[0].length; j++) {
                if (demandasActuales[j] > 0) {
                    // Encontrar los dos costos más bajos en la columna
                    const costosColumna = costos
                        .map((fila, i) => ({costo: fila[j], i, activo: ofertasActuales[i] > 0}))
                        .filter(c => c.activo)
                        .map(c => c.costo)
                        .sort((a, b) => a - b);
                    
                    if (costosColumna.length >= 2) {
                        penalizacionesColumnas[j] = costosColumna[1] - costosColumna[0];
                    } else if (costosColumna.length === 1) {
                        penalizacionesColumnas[j] = costosColumna[0];
                    } else {
                        penalizacionesColumnas[j] = -Infinity;
                    }
                } else {
                    penalizacionesColumnas[j] = -Infinity;
                }
            }
            
            paso.detalles.push(`Penalizaciones filas: [${penalizacionesFilas.join(', ')}]`);
            paso.detalles.push(`Penalizaciones columnas: [${penalizacionesColumnas.join(', ')}]`);
            
            // Encontrar la máxima penalización
            const maxPenalFila = Math.max(...penalizacionesFilas);
            const maxPenalCol = Math.max(...penalizacionesColumnas);
            
            let iSelec, jSelec;
            
            if (maxPenalFila >= maxPenalCol) {
                iSelec = penalizacionesFilas.indexOf(maxPenalFila);
                // En la fila seleccionada, encontrar la columna con menor costo
                let minCosto = Infinity;
                for (let j = 0; j < costos[0].length; j++) {
                    if (demandasActuales[j] > 0 && costos[iSelec][j] < minCosto) {
                        minCosto = costos[iSelec][j];
                        jSelec = j;
                    }
                }
                paso.descripcion = `Máxima penalización en fila ${iSelec+1} (${maxPenalFila}). Seleccionada celda (${iSelec+1},${jSelec+1}) con costo ${minCosto}`;
            } else {
                jSelec = penalizacionesColumnas.indexOf(maxPenalCol);
                // En la columna seleccionada, encontrar la fila con menor costo
                let minCosto = Infinity;
                for (let i = 0; i < costos.length; i++) {
                    if (ofertasActuales[i] > 0 && costos[i][jSelec] < minCosto) {
                        minCosto = costos[i][jSelec];
                        iSelec = i;
                    }
                }
                paso.descripcion = `Máxima penalización en columna ${jSelec+1} (${maxPenalCol}). Seleccionada celda (${iSelec+1},${jSelec+1}) con costo ${minCosto}`;
            }
            
            // Asignar la máxima cantidad posible
            const cantidad = Math.min(ofertasActuales[iSelec], demandasActuales[jSelec]);
            asignacion[iSelec][jSelec] = cantidad;
            costoTotal += cantidad * costos[iSelec][jSelec];
            
            paso.detalles.push(`Asignando ${cantidad} unidades de origen ${iSelec+1} a destino ${jSelec+1}`);
            
            // Actualizar ofertas y demandas
            ofertasActuales[iSelec] -= cantidad;
            demandasActuales[jSelec] -= cantidad;
            
            paso.detalles.push(`Oferta actual origen ${iSelec+1}: ${ofertasActuales[iSelec]}`);
            paso.detalles.push(`Demanda actual destino ${jSelec+1}: ${demandasActuales[jSelec]}`);
            
            pasos.push(paso);
        }
        
        pasos.push({
            titulo: "Solución Final",
            descripcion: `Todas las ofertas y demandas han sido satisfechas. Costo total: ${costoTotal}`
        });
        
        return {
            asignacion,
            costoTotal,
            pasos
        };
    }
    
    // Mostrar la solución
    function mostrarSolucion(asignacion, costo, pasos) {
        // Mostrar asignaciones
        asignacionesContainer.innerHTML = '';
        
        for (let i = 0; i < asignacion.length; i++) {
            for (let j = 0; j < asignacion[i].length; j++) {
                if (asignacion[i][j] > 0) {
                    const asignacionDiv = document.createElement('div');
                    asignacionDiv.className = 'solution-item';
                    
                    const origen = i < ofertas.length ? `Origen ${i+1}` : `Origen ficticio`;
                    const destino = j < demandas.length ? `Destino ${j+1}` : `Destino ficticio`;
                    
                    asignacionDiv.textContent = `${origen} → ${destino}: ${asignacion[i][j]} unidades (Costo: ${asignacion[i][j] * costos[i][j]})`;
                    asignacionesContainer.appendChild(asignacionDiv);
                }
            }
        }
        
        // Mostrar costo total
        costoTotal.textContent = `Costo Total: $${costo}`;
        
        // Mostrar pasos del algoritmo
        pasosContainer.innerHTML = '<div class="card-title">Pasos del Algoritmo</div>';
        
        pasos.forEach((paso, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';
            
            const title = document.createElement('div');
            title.className = 'step-title';
            title.textContent = paso.titulo;
            stepDiv.appendChild(title);
            
            const desc = document.createElement('div');
            desc.textContent = paso.descripcion;
            stepDiv.appendChild(desc);
            
            if (paso.detalles && paso.detalles.length > 0) {
                const detalles = document.createElement('div');
                detalles.style.marginTop = '10px';
                detalles.style.fontSize = '0.9rem';
                
                paso.detalles.forEach(detalle => {
                    const detalleP = document.createElement('div');
                    detalleP.textContent = '• ' + detalle;
                    detalles.appendChild(detalleP);
                });
                
                stepDiv.appendChild(detalles);
            }
            
            pasosContainer.appendChild(stepDiv);
        });
    }
    
    // Generar tabla inicial con valores por defecto
    generarBtn.click();
});