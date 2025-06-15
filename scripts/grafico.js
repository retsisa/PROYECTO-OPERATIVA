class GraficoPL {
    constructor() {
        this.graphContainer = document.getElementById('graph-container');
        this.containerWidth = this.graphContainer.offsetWidth;
        this.containerHeight = this.graphContainer.offsetHeight;
        this.centerX = this.containerWidth / 2;
        this.centerY = this.containerHeight / 2;
        this.scale = 30;  
        this.constraintsCount = 0;
        
        this.initEventListeners();
        this.addConstraint(); // Agregar primera restricción por defecto
    }
    
    initEventListeners() {
        document.getElementById('add-constraint').addEventListener('click', () => this.addConstraint());
        document.getElementById('remove-constraint').addEventListener('click', () => this.removeConstraint());
        document.getElementById('solve-btn').addEventListener('click', () => this.solveProblem());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetProblem());
    }
    
    addConstraint() {
        this.constraintsCount++;
        const container = document.getElementById('constraints-container');
        
        const constraintDiv = document.createElement('div');
        constraintDiv.className = 'form-group constraint';
        constraintDiv.dataset.id = this.constraintsCount;
        
        constraintDiv.innerHTML = `
            <label for="constraint-${this.constraintsCount}">Restricción ${this.constraintsCount}:</label>
            <div class="constraint-input">
                <input type="number" id="constraint-${this.constraintsCount}-x" placeholder="a">
                <span>x +</span>
                <input type="number" id="constraint-${this.constraintsCount}-y" placeholder="b">
                <span>y</span>
                <select id="constraint-${this.constraintsCount}-inequality">
                    <option value="<=">≤</option>
                    <option value=">=">≥</option>
                    <option value="==">=</option>
                </select>
                <input type="number" id="constraint-${this.constraintsCount}-c" placeholder="c">
            </div>
        `;
        
        container.appendChild(constraintDiv);
    }
    
    removeConstraint() {
        if (this.constraintsCount > 1) {
            const container = document.getElementById('constraints-container');
            const lastConstraint = container.querySelector(`.constraint[data-id="${this.constraintsCount}"]`);
            container.removeChild(lastConstraint);
            this.constraintsCount--;
        }
    }
    
    resetProblem() {
        const container = document.getElementById('constraints-container');
        container.innerHTML = '';
        this.constraintsCount = 0;
        
        document.getElementById('objective-type').value = 'max';
        document.getElementById('obj-x').value = '';
        document.getElementById('obj-y').value = '';
        
        document.getElementById('results').classList.add('hidden');
        this.clearGraph();
        this.addConstraint();
    }
    
    clearGraph() {
        const elementsToRemove = document.querySelectorAll('.constraint-line, .feasible-region, .vertex-point, .vertex-label, .tick, .tick-label');
        elementsToRemove.forEach(el => el.remove());
    }
    
    solveProblem() {
        const problemType = document.getElementById('objective-type').value;
        const objX = parseFloat(document.getElementById('obj-x').value) || 0;
        const objY = parseFloat(document.getElementById('obj-y').value) || 0;
        
        const constraints = [];
        for (let i = 1; i <= this.constraintsCount; i++) {
            const x = parseFloat(document.getElementById(`constraint-${i}-x`).value) || 0;
            const y = parseFloat(document.getElementById(`constraint-${i}-y`).value) || 0;
            const inequality = document.getElementById(`constraint-${i}-inequality`).value;
            const c = parseFloat(document.getElementById(`constraint-${i}-c`).value) || 0;
            
            if (x !== 0 || y !== 0) {
                constraints.push({ a: x, b: y, inequality, c });
            }
        }
        
        if (constraints.length < 2) {
            alert('Se necesitan al menos 2 restricciones válidas para resolver el problema.');
            return;
        }
        
        const vertices = this.calculateVertices(constraints);
        const evaluatedVertices = vertices.map(v => ({
            x: v.x,
            y: v.y,
            z: objX * v.x + objY * v.y
        }));
        
        let optimalVertex;
        if (problemType === 'max') {
            optimalVertex = evaluatedVertices.reduce((max, v) => v.z > max.z ? v : max);
        } else {
            optimalVertex = evaluatedVertices.reduce((min, v) => v.z < min.z ? v : min);
        }
        
        this.displayResults(problemType, optimalVertex, evaluatedVertices);
        this.drawGraph(constraints, vertices, optimalVertex);
    }
    
    calculateVertices(constraints) {
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
        
        // Filtrar puntos factibles
        const feasibleVertices = vertices.filter(point => {
            return constraints.every(constraint => {
                const leftSide = constraint.a * point.x + constraint.b * point.y;
                
                switch (constraint.inequality) {
                    case '<=': return leftSide <= constraint.c + 0.0001; // Tolerancia numérica
                    case '>=': return leftSide >= constraint.c - 0.0001;
                    case '==': return Math.abs(leftSide - constraint.c) < 0.0001;
                    default: return true;
                }
            });
        });
        
        // Eliminar duplicados
        const uniqueVertices = [];
        const seen = new Set();
        
        feasibleVertices.forEach(point => {
            const key = `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueVertices.push(point);
            }
        });
        
        return uniqueVertices;
    }
    
    displayResults(problemType, optimalVertex, vertices) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.classList.remove('hidden');
        
        const solutionText = document.getElementById('solution-text');
        solutionText.innerHTML = `
            <p><strong>Problema de ${problemType === 'max' ? 'maximización' : 'minimización'}</strong></p>
            <p>Solución óptima encontrada en:</p>
            <p><strong>x = ${optimalVertex.x.toFixed(2)}, y = ${optimalVertex.y.toFixed(2)}</strong></p>
            <p>Valor de la función objetivo: <strong>Z = ${optimalVertex.z.toFixed(2)}</strong></p>
        `;
        
        const verticesTable = document.getElementById('vertices-table').querySelector('tbody');
        verticesTable.innerHTML = '';
        
        vertices.forEach((vertex, index) => {
            const row = document.createElement('tr');
            if (vertex.x === optimalVertex.x && vertex.y === optimalVertex.y) {
                row.style.backgroundColor = '#e8f8f5';
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${vertex.x.toFixed(2)}</td>
                <td>${vertex.y.toFixed(2)}</td>
                <td>${vertex.z.toFixed(2)}</td>
            `;
            
            verticesTable.appendChild(row);
        });
    }
    
    drawGraph(constraints, vertices, optimalVertex) {
        this.clearGraph();
        this.drawAxes();
        
        constraints.forEach(constraint => {
            this.drawConstraint(constraint);
        });
        
        this.drawFeasibleRegion(vertices);
        
        vertices.forEach(vertex => {
            this.drawVertex(vertex, vertex.x === optimalVertex.x && vertex.y === optimalVertex.y);
        });
    }
    
    drawAxes() {
        const xRange = Math.floor(this.containerWidth / (2 * this.scale));
        const yRange = Math.floor(this.containerHeight / (2 * this.scale));
        
        // Eje X
        for (let x = -xRange; x <= xRange; x++) {
            if (x !== 0) {
                const xPos = this.centerX + x * this.scale;
                
                const tick = document.createElement('div');
                tick.className = 'tick x-tick';
                tick.style.left = `${xPos}px`;
                this.graphContainer.appendChild(tick);
                
                if (x % 2 === 0) {
                    const label = document.createElement('div');
                    label.className = 'tick-label x-tick-label';
                    label.textContent = x;
                    label.style.left = `${xPos}px`;
                    this.graphContainer.appendChild(label);
                }
            }
        }
        
        // Eje Y
        for (let y = -yRange; y <= yRange; y++) {
            if (y !== 0) {
                const yPos = this.centerY - y * this.scale;
                
                const tick = document.createElement('div');
                tick.className = 'tick y-tick';
                tick.style.top = `${yPos}px`;
                this.graphContainer.appendChild(tick);
                
                if (y % 2 === 0) {
                    const label = document.createElement('div');
                    label.className = 'tick-label y-tick-label';
                    label.textContent = y;
                    label.style.top = `${yPos}px`;
                    this.graphContainer.appendChild(label);
                }
            }
        }
        
        // Etiquetas de ejes
        const xLabel = document.createElement('div');
        xLabel.className = 'axis-label x-axis-label';
        xLabel.textContent = 'x';
        xLabel.style.left = `${this.containerWidth - 20}px`;
        xLabel.style.bottom = `${this.centerY - 20}px`;
        this.graphContainer.appendChild(xLabel);
        
        const yLabel = document.createElement('div');
        yLabel.className = 'axis-label y-axis-label';
        yLabel.textContent = 'y';
        yLabel.style.left = `${this.centerX + 10}px`;
        yLabel.style.top = '10px';
        this.graphContainer.appendChild(yLabel);
    }
    
    drawConstraint(constraint) {
        let point1, point2;
        
        if (constraint.b !== 0) {
            // Puntos para línea no vertical
            const x1 = -10;
            const y1 = (constraint.c - constraint.a * x1) / constraint.b;
            
            const x2 = 10;
            const y2 = (constraint.c - constraint.a * x2) / constraint.b;
            
            point1 = { x: x1, y: y1 };
            point2 = { x: x2, y: y2 };
        } else {
            // Línea vertical
            const x = constraint.c / constraint.a;
            point1 = { x: x, y: -10 };
            point2 = { x: x, y: 10 };
        }
        
        // Convertir a coordenadas de píxeles
        const x1 = this.centerX + point1.x * this.scale;
        const y1 = this.centerY - point1.y * this.scale;
        const x2 = this.centerX + point2.x * this.scale;
        const y2 = this.centerY - point2.y * this.scale;
        
        // Calcular ángulo y longitud
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Crear línea
        const line = document.createElement('div');
        line.className = 'constraint-line';
        line.style.width = `${length}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        // Color según tipo de desigualdad
        if (constraint.inequality === '<=') {
            line.style.backgroundColor = '#3498db';
        } else if (constraint.inequality === '>=') {
            line.style.backgroundColor = '#e74c3c';
        } else {
            line.style.backgroundColor = '#2ecc71';
        }
        
        this.graphContainer.appendChild(line);
        
        // Etiqueta de restricción
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        const label = document.createElement('div');
        label.className = 'constraint-label';
        label.textContent = `${constraint.a}x + ${constraint.b}y ${constraint.inequality} ${constraint.c}`;
        label.style.left = `${midX + 10}px`;
        label.style.top = `${midY - 10}px`;
        this.graphContainer.appendChild(label);
    }
    
    drawFeasibleRegion(vertices) {
        if (vertices.length < 3) return;
        
        // Ordenar vértices en sentido horario
        const center = {
            x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
            y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
        };
        
        vertices.sort((a, b) => {
            return Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x);
        });
        
        // Crear cadena de puntos para SVG
        const points = vertices.map(v => {
            const x = this.centerX + v.x * this.scale;
            const y = this.centerY - v.y * this.scale;
            return `${x},${y}`;
        }).join(' ');
        
        // Crear polígono SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.zIndex = '1';
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', 'rgba(52, 152, 219, 0.3)');
        polygon.setAttribute('stroke', '#3498db');
        polygon.setAttribute('stroke-width', '1');
        
        svg.appendChild(polygon);
        this.graphContainer.appendChild(svg);
    }
    
    drawVertex(vertex, isOptimal) {
        const x = this.centerX + vertex.x * this.scale;
        const y = this.centerY - vertex.y * this.scale;
        
        const point = document.createElement('div');
        point.className = 'vertex-point' + (isOptimal ? ' optimal-point' : '');
        point.style.left = `${x}px`;
        point.style.top = `${y}px`;
        this.graphContainer.appendChild(point);
        
        const label = document.createElement('div');
        label.className = 'vertex-label';
        label.textContent = `(${vertex.x.toFixed(1)}, ${vertex.y.toFixed(1)})`;
        label.style.left = `${x + 15}px`;
        label.style.top = `${y - 10}px`;
        this.graphContainer.appendChild(label);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new GraficoPL();
});