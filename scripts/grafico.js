class LinearProgramSolver {
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
});