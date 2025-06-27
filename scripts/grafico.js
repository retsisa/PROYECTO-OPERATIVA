/*class LinearProgramSolver {
    constructor() {
        this.chart = null;
        this.constraintsCount = 0;
        this.initEventListeners();
        this.addConstraint(); // Restricción inicial
        this.updateConstraintCount();
    }

    initEventListeners() {
        document.getElementById('add-constraint').addEventListener('click', () => {
            this.addConstraint();
            this.updateConstraintCount();
        });
        
        document.getElementById('remove-constraint').addEventListener('click', () => {
            this.removeConstraint();
            this.updateConstraintCount();
        });
        
        document.getElementById('solve-btn').addEventListener('click', () => this.solveProblem());
        document.getElementById('example-btn').addEventListener('click', () => this.loadIBMExample());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetProblem());
    }

    updateConstraintCount() {
        document.getElementById('constraint-count').textContent = `(${this.constraintsCount} actual)`;
    }

    addConstraint() {
        this.constraintsCount++;
        const container = document.getElementById('constraints-container');
        
        const constraintDiv = document.createElement('div');
        constraintDiv.className = 'constraint';
        constraintDiv.dataset.id = this.constraintsCount;
        constraintDiv.innerHTML = `
            <div class="form-group">
                <div class="constraint-input">
                    <input type="number" id="constraint-${this.constraintsCount}-x" placeholder="a"> x +
                    <input type="number" id="constraint-${this.constraintsCount}-y" placeholder="b"> y
                    <select id="constraint-${this.constraintsCount}-inequality">
                        <option value="<=">≤</option>
                        <option value=">=">≥</option>
                        <option value="==">=</option>
                    </select>
                    <input type="number" id="constraint-${this.constraintsCount}-c" placeholder="c">
                    <button class="remove-btn" data-id="${this.constraintsCount}">×</button>
                </div>
            </div>
        `;
        container.appendChild(constraintDiv);
        
        constraintDiv.querySelector('.remove-btn').addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            this.removeSpecificConstraint(id);
        });
    }

    removeConstraint() {
        if (this.constraintsCount > 1) {
            const container = document.getElementById('constraints-container');
            const lastConstraint = container.querySelector(`.constraint[data-id="${this.constraintsCount}"]`);
            container.removeChild(lastConstraint);
            this.constraintsCount--;
        } else {
            alert("Debe haber al menos una restricción");
        }
    }

    removeSpecificConstraint(id) {
        if (this.constraintsCount > 1) {
            const container = document.getElementById('constraints-container');
            const constraint = container.querySelector(`.constraint[data-id="${id}"]`);
            container.removeChild(constraint);
            this.constraintsCount--;
            this.renumberConstraints();
        } else {
            alert("Debe haber al menos una restricción");
        }
    }

    renumberConstraints() {
        const container = document.getElementById('constraints-container');
        const constraints = container.querySelectorAll('.constraint');
        
        this.constraintsCount = constraints.length;
        
        constraints.forEach((constraint, index) => {
            const newId = index + 1;
            constraint.dataset.id = newId;
            
            const inputs = constraint.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.id = input.id.replace(/constraint-\d+/, `constraint-${newId}`);
            });
            
            const btn = constraint.querySelector('.remove-btn');
            if (btn) btn.setAttribute('data-id', newId);
        });
        
        this.updateConstraintCount();
    }

    resetProblem() {
        const container = document.getElementById('constraints-container');
        container.innerHTML = '';
        this.constraintsCount = 0;
        
        document.getElementById('problem-type').value = 'max';
        document.getElementById('coef-x').value = '';
        document.getElementById('coef-y').value = '';
        
        document.getElementById('solution-steps').innerHTML = '';
        if (this.chart) this.chart.destroy();
        
        this.addConstraint();
        this.updateConstraintCount();
    }

    loadIBMExample() {
        this.resetProblem();
        
        document.getElementById('coef-x').value = '100';
        document.getElementById('coef-y').value = '60';
        
        // Agregar restricciones del ejemplo IBM
        this.addConstraintWithValues(2, 3, '<=', 350);
        this.addConstraintWithValues(0.5, 0.25, '<=', 60);
        this.addConstraintWithValues(1, 1, '>=', 90);
    }

    addConstraintWithValues(a, b, inequality, c) {
        this.constraintsCount++;
        const container = document.getElementById('constraints-container');
        
        const constraintDiv = document.createElement('div');
        constraintDiv.className = 'constraint';
        constraintDiv.dataset.id = this.constraintsCount;
        constraintDiv.innerHTML = `
            <div class="form-group">
                <div class="constraint-input">
                    <input type="number" value="${a}" id="constraint-${this.constraintsCount}-x"> x +
                    <input type="number" value="${b}" id="constraint-${this.constraintsCount}-y"> y
                    <select id="constraint-${this.constraintsCount}-inequality">
                        <option value="<=" ${inequality === '<=' ? 'selected' : ''}>≤</option>
                        <option value=">=" ${inequality === '>=' ? 'selected' : ''}>≥</option>
                        <option value="==" ${inequality === '==' ? 'selected' : ''}>=</option>
                    </select>
                    <input type="number" value="${c}" id="constraint-${this.constraintsCount}-c">
                    <button class="remove-btn" data-id="${this.constraintsCount}">×</button>
                </div>
            </div>
        `;
        container.appendChild(constraintDiv);
        
        constraintDiv.querySelector('.remove-btn').addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            this.removeSpecificConstraint(id);
        });
        
        this.updateConstraintCount();
    }

    solveProblem() {
        const problemType = document.getElementById('problem-type').value;
        const coefX = parseFloat(document.getElementById('coef-x').value) || 0;
        const coefY = parseFloat(document.getElementById('coef-y').value) || 0;
        
        const constraints = [];
        for (let i = 1; i <= this.constraintsCount; i++) {
            const xInput = document.getElementById(`constraint-${i}-x`);
            const yInput = document.getElementById(`constraint-${i}-y`);
            const inequalitySelect = document.getElementById(`constraint-${i}-inequality`);
            const cInput = document.getElementById(`constraint-${i}-c`);
            
            // Verificar que los elementos existen antes de usarlos
            if (xInput && yInput && inequalitySelect && cInput) {
                const a = parseFloat(xInput.value) || 0;
                const b = parseFloat(yInput.value) || 0;
                const inequality = inequalitySelect.value;
                const c = parseFloat(cInput.value) || 0;
                
                if (a !== 0 || b !== 0) {
                    constraints.push({ a, b, inequality, c });
                }
            }
        }
        
        if (constraints.length < 2) {
            alert('Se necesitan al menos 2 restricciones válidas');
            return;
        }
        
        const solution = this.calculateSolution(constraints, problemType, coefX, coefY);
        this.displaySolution(solution, constraints, problemType, coefX, coefY);
        this.drawGraph(solution, constraints, coefX, coefY);
    }

    calculateSolution(constraints, problemType, coefX, coefY) {
        const vertices = this.findVertices(constraints);
        const feasibleVertices = vertices.filter(point => 
            this.isPointFeasible(point, constraints)
        );
        
        const evaluatedVertices = feasibleVertices.map(point => ({
            x: point.x,
            y: point.y,
            z: coefX * point.x + coefY * point.y
        }));
        
        let optimalVertex;
        if (problemType === 'max') {
            optimalVertex = evaluatedVertices.reduce((max, v) => v.z > max.z ? v : max, {z: -Infinity});
        } else {
            optimalVertex = evaluatedVertices.reduce((min, v) => v.z < min.z ? v : min, {z: Infinity});
        }
        
        return {
            vertices: evaluatedVertices,
            optimalVertex,
            feasibleVertices
        };
    }

    findVertices(constraints) {
        const vertices = [];
        
        // Intersecciones con ejes
        constraints.forEach(constraint => {
            if (constraint.a !== 0) vertices.push({ x: constraint.c / constraint.a, y: 0 });
            if (constraint.b !== 0) vertices.push({ x: 0, y: constraint.c / constraint.b });
        });
        
        // Intersecciones entre restricciones
        for (let i = 0; i < constraints.length; i++) {
            for (let j = i + 1; j < constraints.length; j++) {
                const c1 = constraints[i];
                const c2 = constraints[j];
                
                const det = c1.a * c2.b - c2.a * c1.b;
                
                if (det !== 0) {
                    const x = (c2.b * c1.c - c1.b * c2.c) / det;
                    const y = (c1.a * c2.c - c2.a * c1.c) / det;
                    vertices.push({ x, y });
                }
            }
        }
        
        return vertices;
    }

    isPointFeasible(point, constraints) {
        return constraints.every(constraint => {
            const leftSide = constraint.a * point.x + constraint.b * point.y;
            
            switch (constraint.inequality) {
                case '<=': return leftSide <= constraint.c + 0.0001;
                case '>=': return leftSide >= constraint.c - 0.0001;
                case '==': return Math.abs(leftSide - constraint.c) < 0.0001;
                default: return true;
            }
        });
    }

    displaySolution(solution, constraints, problemType, coefX, coefY) {
        const stepsContainer = document.getElementById('solution-steps');
        stepsContainer.innerHTML = '';
        
        // Paso 1: Modelo matemático
        stepsContainer.innerHTML += `
            <div class="solution-step">
                <h3>Paso 1: Modelo Matemático</h3>
                <p><strong>Función objetivo:</strong> ${problemType === 'max' ? 'Maximizar' : 'Minimizar'} Z = ${coefX}x + ${coefY}y</p>
                <p><strong>Restricciones:</strong></p>
                <ol>
                    ${constraints.map((c, i) => `
                        <li>${c.a}x + ${c.b}y ${c.inequality} ${c.c}</li>
                    `).join('')}
                </ol>
            </div>
        `;
        
        // Paso 2: Puntos de las restricciones
        stepsContainer.innerHTML += `
            <div class="solution-step">
                <h3>Paso 2: Puntos para Graficar</h3>
                <table>
                    <tr><th>Restricción</th><th>Punto 1 (x=0)</th><th>Punto 2 (y=0)</th></tr>
                    ${constraints.map(c => `
                        <tr>
                            <td>${c.a}x + ${c.b}y ${c.inequality} ${c.c}</td>
                            <td>(0, ${c.b !== 0 ? (c.c / c.b).toFixed(2) : '∞'})</td>
                            <td>(${c.a !== 0 ? (c.c / c.a).toFixed(2) : '∞'}, 0)</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        
        // Paso 3: Vértices
        stepsContainer.innerHTML += `
            <div class="solution-step">
                <h3>Paso 3: Vértices Encontrados</h3>
                <table>
                    <tr><th>Vértice</th><th>Coordenadas</th><th>¿Factible?</th></tr>
                    ${solution.vertices.map((v, i) => `
                        <tr>
                            <td>${String.fromCharCode(65 + i)}</td>
                            <td>(${v.x.toFixed(2)}, ${v.y.toFixed(2)})</td>
                            <td>${this.isPointFeasible(v, constraints) ? '✅ Sí' : '❌ No'}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        
        // Paso 4: Evaluación
        stepsContainer.innerHTML += `
            <div class="solution-step">
                <h3>Paso 4: Evaluación de Vértices</h3>
                <table>
                    <tr><th>Vértice</th><th>x</th><th>y</th><th>Z = ${coefX}x + ${coefY}y</th></tr>
                    ${solution.vertices.filter(v => this.isPointFeasible(v, constraints)).map((v, i) => `
                        <tr ${v.x === solution.optimalVertex.x && v.y === solution.optimalVertex.y ? 'class="optimal-vertex"' : ''}>
                            <td>${String.fromCharCode(65 + i)}</td>
                            <td>${v.x.toFixed(2)}</td>
                            <td>${v.y.toFixed(2)}</td>
                            <td>${v.z.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
        
        // Paso 5: Solución óptima
        stepsContainer.innerHTML += `
            <div class="solution-step optimal-solution">
                <h3>Paso 5: Solución Óptima</h3>
                <p><strong>Producir:</strong> ${solution.optimalVertex.x.toFixed(2)} unidades de x y ${solution.optimalVertex.y.toFixed(2)} unidades de y</p>
                <p><strong>Valor óptimo:</strong> Z = ${solution.optimalVertex.z.toFixed(2)}</p>
            </div>
        `;
    }

    drawGraph(solution, constraints, coefX, coefY) {
        const ctx = document.getElementById('graphCanvas').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
    
        // Ordenar vértices para crear el polígono correctamente
        const orderedVertices = this.orderVerticesClockwise(solution.feasibleVertices);
        
        // Crear datasets para Chart.js
        const datasets = [
            // Restricciones (líneas)
            ...constraints.map((c, i) => ({
                label: `${c.a}x + ${c.b}y ${c.inequality} ${c.c}`,
                data: this.getConstraintPoints(c),
                borderColor: this.getConstraintColor(i),
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                type: 'line'
            })),
            
            // Región factible (área sombreada)
            {
                label: 'Región Factible',
                data: orderedVertices,
                backgroundColor: 'rgba(61, 158, 158, 0.4)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                type: 'line'
            },
            
            // Vértices (puntos)
            {
                label: 'Vértices',
                data: solution.feasibleVertices,
                backgroundColor: solution.feasibleVertices.map(v => 
                    (v.x === solution.optimalVertex.x && v.y === solution.optimalVertex.y) 
                        ? 'rgba(255, 99, 132, 1)' 
                        : 'rgba(54, 162, 235, 1)'
                ),
                pointRadius: 6,
                borderWidth: 2,
                showLine: false
            },
            
            // Solución óptima (punto destacado)
            {
                label: 'Solución Óptima',
                data: [solution.optimalVertex],
                backgroundColor: 'rgba(255, 99, 132, 1)',
                pointRadius: 8,
                borderWidth: 2,
                showLine: false
            }
        ];
        
        this.chart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Variable x' },
                        min: 0,
                        suggestedMax: Math.max(...solution.vertices.map(v => v.x)) * 1.2
                    },
                    y: {
                        title: { display: true, text: 'Variable y' },
                        min: 0,
                        suggestedMax: Math.max(...solution.vertices.map(v => v.y)) * 1.2
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: (${context.parsed.x}, ${context.parsed.y})`;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            filter: (item) => !item.text.includes('Solución Óptima') // Ocultar leyenda redundante
                        }
                    }
                }
            }
        });
    }
    
    // Nueva función para ordenar vértices en sentido horario
    orderVerticesClockwise(vertices) {
        if (vertices.length < 3) return vertices;
        
        // Calcular centroide
        const centroid = {
            x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
            y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
        };
        
        // Ordenar por ángulo polar
        return [...vertices].sort((a, b) => {
            const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
            const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
            return angleA - angleB;
        });
    }

    getConstraintPoints(constraint) {
        const points = [];
        if (constraint.b !== 0) points.push({ x: 0, y: constraint.c / constraint.b });
        if (constraint.a !== 0) points.push({ x: constraint.c / constraint.a, y: 0 });
        if (constraint.a !== 0 && constraint.b !== 0) {
            points.push({ x: constraint.c / constraint.a * 1.5, y: 0 });
        }
        return points;
    }

    getConstraintColor(index) {
        const colors = [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)'
        ];
        return colors[index % colors.length];
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    window.solver = new LinearProgramSolver();
});*/

document.addEventListener('DOMContentLoaded', function() {
    const tipoOptimizacionSelect = document.getElementById('tipo-optimizacion');
    const coefX1Input = document.getElementById('coef-x1');
    const coefX2Input = document.getElementById('coef-x2');
    const restriccionesContainer = document.getElementById('restricciones-container');
    const agregarRestriccionBtn = document.getElementById('agregar-restriccion');
    const resolverBtn = document.getElementById('resolver-btn');
    const resultadosCard = document.getElementById('resultados-card');
    const graficoCanvas = document.getElementById('grafico');
    const pasosContainer = document.getElementById('pasos-container');
    const solucionInfo = document.getElementById('solucion-info');
    
    let restricciones = [];
    let grafico = null;
    
    // Agregar primera restricción por defecto
    agregarRestriccion();
    agregarRestriccion();
    
    // Función para agregar una nueva restricción
    agregarRestriccionBtn.addEventListener('click', agregarRestriccion);
    
    function agregarRestriccion() {
        const restriccionId = restricciones.length;
        const restriccionDiv = document.createElement('div');
        restriccionDiv.className = 'restriccion';
        restriccionDiv.style.marginBottom = '20px';
        restriccionDiv.style.padding = '15px';
        restriccionDiv.style.backgroundColor = '#f9f9f9';
        restriccionDiv.style.borderRadius = '8px';
        
        const titulo = document.createElement('h4');
        titulo.textContent = `Restricción ${restriccionId + 1}`;
        restriccionDiv.appendChild(titulo);
        
        const inputsDiv = document.createElement('div');
        inputsDiv.className = 'input-section';
        
        // Coeficiente x1
        const grupoX1 = document.createElement('div');
        grupoX1.className = 'input-group';
        
        const labelX1 = document.createElement('label');
        labelX1.textContent = 'Coeficiente x₁:';
        
        const inputX1 = document.createElement('input');
        inputX1.type = 'number';
        inputX1.step = 'any';
        inputX1.value = [1, 2, 1][restriccionId] || 1;
        inputX1.dataset.restriccion = restriccionId;
        inputX1.dataset.variable = 'x1';
        inputX1.classList.add('coef-restriccion');
        
        grupoX1.appendChild(labelX1);
        grupoX1.appendChild(inputX1);
        inputsDiv.appendChild(grupoX1);
        
        // Coeficiente x2
        const grupoX2 = document.createElement('div');
        grupoX2.className = 'input-group';
        
        const labelX2 = document.createElement('label');
        labelX2.textContent = 'Coeficiente x₂:';
        
        const inputX2 = document.createElement('input');
        inputX2.type = 'number';
        inputX2.step = 'any';
        inputX2.value = [1, 1, 2][restriccionId] || 1;
        inputX2.dataset.restriccion = restriccionId;
        inputX2.dataset.variable = 'x2';
        inputX2.classList.add('coef-restriccion');
        
        grupoX2.appendChild(labelX2);
        grupoX2.appendChild(inputX2);
        inputsDiv.appendChild(grupoX2);
        
        // Operador
        const grupoOp = document.createElement('div');
        grupoOp.className = 'input-group';
        
        const labelOp = document.createElement('label');
        labelOp.textContent = 'Operador:';
        
        const selectOp = document.createElement('select');
        selectOp.dataset.restriccion = restriccionId;
        selectOp.classList.add('operador-restriccion');
        
        const opciones = ['≤', '≥', '='];
        opciones.forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            option.textContent = op;
            selectOp.appendChild(option);
        });
        
        // Valor por defecto para la primera restricción
        if (restriccionId === 0) selectOp.value = '≤';
        if (restriccionId === 1) selectOp.value = '≤';
        
        grupoOp.appendChild(labelOp);
        grupoOp.appendChild(selectOp);
        inputsDiv.appendChild(grupoOp);
        
        // Lado derecho
        const grupoRHS = document.createElement('div');
        grupoRHS.className = 'input-group';
        
        const labelRHS = document.createElement('label');
        labelRHS.textContent = 'Valor:';
        
        const inputRHS = document.createElement('input');
        inputRHS.type = 'number';
        inputRHS.step = 'any';
        inputRHS.value = [10, 12, 8][restriccionId] || 0;
        inputRHS.dataset.restriccion = restriccionId;
        inputRHS.classList.add('rhs-restriccion');
        
        grupoRHS.appendChild(labelRHS);
        grupoRHS.appendChild(inputRHS);
        inputsDiv.appendChild(grupoRHS);
        
        // Botón para eliminar
        const eliminarBtn = document.createElement('button');
        eliminarBtn.textContent = 'Eliminar';
        eliminarBtn.style.backgroundColor = '#dc3545';
        eliminarBtn.addEventListener('click', function() {
            restriccionesContainer.removeChild(restriccionDiv);
            actualizarNumeracion();
        });
        
        inputsDiv.appendChild(eliminarBtn);
        restriccionDiv.appendChild(inputsDiv);
        restriccionesContainer.appendChild(restriccionDiv);
        
        // Actualizar contador de restricciones
        actualizarNumeracion();
    }
    
    function actualizarNumeracion() {
        const restriccionesDivs = document.querySelectorAll('.restriccion');
        restriccionesDivs.forEach((div, index) => {
            div.querySelector('h4').textContent = `Restricción ${index + 1}`;
        });
    }
    
    // Resolver el problema gráficamente
    resolverBtn.addEventListener('click', function() {
        // Leer datos del problema
        const tipoOptimizacion = tipoOptimizacionSelect.value;
        const coefFO = {
            x1: parseFloat(coefX1Input.value),
            x2: parseFloat(coefX2Input.value)
        };
        
        // Leer restricciones
        restricciones = [];
        const restriccionesDivs = document.querySelectorAll('.restriccion');
        
        restriccionesDivs.forEach(div => {
            const restriccionId = div.querySelector('.coef-restriccion').dataset.restriccion;
            
            restricciones.push({
                x1: parseFloat(div.querySelector(`.coef-restriccion[data-variable="x1"]`).value),
                x2: parseFloat(div.querySelector(`.coef-restriccion[data-variable="x2"]`).value),
                operador: div.querySelector('.operador-restriccion').value,
                valor: parseFloat(div.querySelector('.rhs-restriccion').value)
            });
        });
        
        // Validar datos
        if (isNaN(coefFO.x1)) coefFO.x1 = 0;
        if (isNaN(coefFO.x2)) coefFO.x2 = 0;
        
        restricciones = restricciones.filter(r => !isNaN(r.x1) && !isNaN(r.x2) && !isNaN(r.valor));
        
        if (restricciones.length < 2) {
            alert('Se necesitan al menos 2 restricciones para el método gráfico');
            return;
        }
        
        // Resolver el problema
        const { vertices, solucion, pasos } = resolverProblemaGrafico(coefFO, restricciones, tipoOptimizacion);
        
        // Mostrar resultados
        mostrarResultados(vertices, solucion, pasos);
        resultadosCard.style.display = 'block';
    });
    
    // Función para resolver el problema gráfico
    function resolverProblemaGrafico(coefFO, restricciones, tipoOptimizacion) {
        const pasos = [];
        
        // Paso 1: Graficar restricciones
        pasos.push({
            titulo: "Paso 1: Graficar Restricciones",
            descripcion: "Convertir cada restricción a ecuación y encontrar puntos de corte con ejes."
        });
        
        // Convertir restricciones a ecuaciones para graficar
        const lineas = restricciones.map(r => {
            // Ecuación: r.x1 * x + r.x2 * y = r.valor
            // Encontrar puntos de corte con ejes
            let puntoX, puntoY;
            
            // Corte con eje Y (x=0)
            if (r.x2 !== 0) {
                puntoY = r.valor / r.x2;
            } else {
                puntoY = null; // Línea vertical
            }
            
            // Corte con eje X (y=0)
            if (r.x1 !== 0) {
                puntoX = r.valor / r.x1;
            } else {
                puntoX = null; // Línea horizontal
            }
            
            return {
                ...r,
                puntoX,
                puntoY,
                color: getRandomColor()
            };
        });
        
        pasos.push({
            titulo: "Puntos de Corte con Ejes",
            descripcion: "Puntos donde cada restricción corta los ejes X e Y.",
            lineas
        });
        
        // Paso 2: Encontrar región factible
        pasos.push({
            titulo: "Paso 2: Determinar Región Factible",
            descripcion: "Identificar el área que satisface todas las restricciones simultáneamente."
        });
        
        // Paso 3: Encontrar vértices de la región factible
        pasos.push({
            titulo: "Paso 3: Encontrar Vértices de la Región Factible",
            descripcion: "Calcular los puntos de intersección entre las restricciones."
        });
        
        // Calcular intersecciones entre todas las restricciones
        const vertices = [];
        
        for (let i = 0; i < restricciones.length; i++) {
            for (let j = i + 1; j < restricciones.length; j++) {
                const interseccion = calcularInterseccion(restricciones[i], restricciones[j]);
                
                if (interseccion && esFactible(interseccion, restricciones)) {
                    vertices.push(interseccion);
                }
            }
        }
        
        // Agregar puntos de corte con ejes que sean factibles
        lineas.forEach(linea => {
            if (linea.puntoX !== null) {
                const punto = { x: linea.puntoX, y: 0 };
                if (esFactible(punto, restricciones)) vertices.push(punto);
            }
            
            if (linea.puntoY !== null) {
                const punto = { x: 0, y: linea.puntoY };
                if (esFactible(punto, restricciones)) vertices.push(punto);
            }
        });
        
        // Eliminar duplicados
        const verticesUnicos = [];
        const existeVertice = {};
        
        vertices.forEach(v => {
            const key = `${v.x.toFixed(2)},${v.y.toFixed(2)}`;
            if (!existeVertice[key]) {
                existeVertice[key] = true;
                verticesUnicos.push(v);
            }
        });
        
        pasos.push({
            titulo: "Vértices de la Región Factible",
            descripcion: "Puntos que definen los límites de la región factible.",
            vertices: verticesUnicos
        });
        
        // Paso 4: Evaluar función objetivo en vértices
        pasos.push({
            titulo: "Paso 4: Evaluar Función Objetivo en Vértices",
            descripcion: "Calcular Z = " + (tipoOptimizacion === 'max' ? 'Max' : 'Min') + 
                        `(${coefFO.x1}x₁ + ${coefFO.x2}x₂) en cada vértice.`
        });
        
        // Evaluar función objetivo en cada vértice
        verticesUnicos.forEach(v => {
            v.z = coefFO.x1 * v.x + coefFO.x2 * v.y;
        });
        
        // Encontrar solución óptima
        let solucion;
        if (tipoOptimizacion === 'max') {
            solucion = verticesUnicos.reduce((max, v) => v.z > max.z ? v : max);
        } else {
            solucion = verticesUnicos.reduce((min, v) => v.z < min.z ? v : min);
        }
        
        pasos.push({
            titulo: "Solución Óptima",
            descripcion: `El ${tipoOptimizacion === 'max' ? 'máximo' : 'mínimo'} valor de Z se encuentra en (${solucion.x.toFixed(2)}, ${solucion.y.toFixed(2)}).`,
            solucion
        });
        
        return {
            vertices: verticesUnicos,
            solucion,
            pasos,
            lineas
        };
    }
    
    // Función para calcular intersección entre dos restricciones
    function calcularInterseccion(r1, r2) {
        const denominador = r1.x1 * r2.x2 - r1.x2 * r2.x1;
        
        if (denominador === 0) {
            return null; // Rectas paralelas
        }
        
        const x = (r1.x2 * r2.valor - r2.x2 * r1.valor) / denominador;
        const y = (r2.x1 * r1.valor - r1.x1 * r2.valor) / denominador;
        
        return { x, y };
    }
    
    // Función para verificar si un punto es factible
    function esFactible(punto, restricciones) {
        return restricciones.every(r => {
            const valorLadoIzq = r.x1 * punto.x + r.x2 * punto.y;
            
            switch (r.operador) {
                case '≤': return valorLadoIzq <= r.valor;
                case '≥': return valorLadoIzq >= r.valor;
                case '=': return Math.abs(valorLadoIzq - r.valor) < 0.001;
                default: return true;
            }
        });
    }
    
    // Función para mostrar resultados
    function mostrarResultados(vertices, solucion, pasos) {
        // Limpiar resultados anteriores
        pasosContainer.innerHTML = '';
        
        // Mostrar pasos del algoritmo
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
            
            // Mostrar detalles adicionales si existen
            if (paso.lineas) {
                const detalles = document.createElement('div');
                detalles.style.marginTop = '10px';
                
                paso.lineas.forEach((linea, i) => {
                    const detalle = document.createElement('div');
                    detalle.style.marginBottom = '5px';
                    
                    let texto = `Restricción ${i+1}: ${linea.x1}x₁ + ${linea.x2}x₂ ${linea.operador} ${linea.valor}`;
                    if (linea.puntoX !== null) texto += ` | Corte X: (${linea.puntoX.toFixed(2)}, 0)`;
                    if (linea.puntoY !== null) texto += ` | Corte Y: (0, ${linea.puntoY.toFixed(2)})`;
                    
                    detalle.textContent = texto;
                    detalles.appendChild(detalle);
                });
                
                stepDiv.appendChild(detalles);
            }
            
            if (paso.vertices) {
                const detalles = document.createElement('div');
                detalles.style.marginTop = '10px';
                
                paso.vertices.forEach((v, i) => {
                    const detalle = document.createElement('div');
                    detalle.style.marginBottom = '5px';
                    detalle.textContent = `Vértice ${i+1}: (${v.x.toFixed(2)}, ${v.y.toFixed(2)}) | Z = ${v.z.toFixed(2)}`;
                    detalles.appendChild(detalle);
                });
                
                stepDiv.appendChild(detalles);
            }
            
            pasosContainer.appendChild(stepDiv);
        });
        
        // Mostrar solución óptima
        solucionInfo.innerHTML = `
            <div>Valor óptimo: <strong>${solucion.z.toFixed(2)}</strong></div>
            <div>En el punto: <strong>(${solucion.x.toFixed(2)}, ${solucion.y.toFixed(2)})</strong></div>
            <div>Donde x₁ = ${solucion.x.toFixed(2)}, x₂ = ${solucion.y.toFixed(2)}</div>
        `;

        const centro = {
            x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
            y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
        };
        
        // Ordenar vértices en sentido horario
        const verticesOrdenados = [...vertices].sort((a, b) => {
            const angleA = Math.atan2(a.y - centro.y, a.x - centro.x);
            const angleB = Math.atan2(b.y - centro.y, b.x - centro.x);
            return angleA - angleB;
        });
        
        // Asegurarse de que el primer y último punto sean iguales para cerrar el polígono
        if (verticesOrdenados.length > 0) {
            verticesOrdenados.push({...verticesOrdenados[0]});
        }
        
        // Crear gráfico
        if (grafico) grafico.destroy();
        
        const ctx = graficoCanvas.getContext('2d');
        grafico = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    // Restricciones como líneas
                    ...pasos[1].lineas.map(linea => ({
                        label: `${linea.x1}x₁ + ${linea.x2}x₂ ${linea.operador} ${linea.valor}`,
                        data: [
                            { x: linea.puntoX, y: 0 },
                            { x: 0, y: linea.puntoY }
                        ],
                        showLine: true,
                        borderColor: linea.color,
                        backgroundColor: linea.color,
                        borderWidth: 2,
                        pointRadius: 0
                    })),
                    
                    // Región factible (relleno)
                    {
                        label: 'Región Factible',
                        data: verticesOrdenados, // Asegúrate que los vértices estén en orden
                        backgroundColor: 'rgba(100, 200, 100, 0.6)', // Verde más intenso con 60% opacidad
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        fill: true // Asegurarse que se rellene el área
                    },
                    
                    // Solución óptima
                    {
                        label: 'Solución Óptima',
                        data: [solucion],
                        backgroundColor: 'rgba(255, 99, 132, 1)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        pointRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        title: {
                            display: true,
                            text: 'x₁'
                        },
                        min: 0,
                        max: Math.max(10, ...vertices.map(v => v.x)) * 1.2
                    },
                    y: {
                        type: 'linear',
                        position: 'center',
                        title: {
                            display: true,
                            text: 'x₂'
                        },
                        min: 0,
                        max: Math.max(10, ...vertices.map(v => v.y)) * 1.2
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
    
    // Función auxiliar para generar colores aleatorios
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});