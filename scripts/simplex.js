class SimplexSolver {
    constructor() {
        this.tableaus = [];
        this.initEventListeners();
        this.updateProblemDimensions();
    }

    initEventListeners() {
        document.getElementById('update-dimensions').addEventListener('click', () => this.updateProblemDimensions());
        document.getElementById('solve-btn').addEventListener('click', () => this.solveProblem());
        document.getElementById('example-btn').addEventListener('click', () => this.loadExample());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetProblem());
    }

    updateProblemDimensions() {
        const numVariables = parseInt(document.getElementById('num-variables').value);
        const numConstraints = parseInt(document.getElementById('num-constraints').value);
        
        this.createObjectiveInputs(numVariables);
        this.createConstraintInputs(numVariables, numConstraints);
    }

    createObjectiveInputs(numVariables) {
        const container = document.getElementById('objective-function');
        container.innerHTML = 'Z = ';
        
        for (let i = 0; i < numVariables; i++) {
            const varName = String.fromCharCode(120 + i); // 120 = 'x' en ASCII
            container.innerHTML += `
                <input type="number" id="obj-coef-${i}" placeholder="0"> ${varName}
                ${i < numVariables - 1 ? '+' : ''}
            `;
        }
    }

    createConstraintInputs(numVariables, numConstraints) {
        const container = document.getElementById('constraints-container');
        container.innerHTML = '';
        
        for (let i = 0; i < numConstraints; i++) {
            const constraintDiv = document.createElement('div');
            constraintDiv.className = 'constraint';
            constraintDiv.innerHTML = '<div class="constraint-input">';
            
            for (let j = 0; j < numVariables; j++) {
                const varName = String.fromCharCode(120 + j);
                constraintDiv.innerHTML += `
                    <input type="number" id="constraint-${i}-var-${j}" placeholder="0"> ${varName}
                    ${j < numVariables - 1 ? '+' : ''}
                `;
            }
            
            constraintDiv.innerHTML += `
                <select id="constraint-${i}-inequality">
                    <option value="<=">≤</option>
                    <option value=">=">≥</option>
                    <option value="==">=</option>
                </select>
                <input type="number" id="constraint-${i}-rhs" placeholder="0">
                </div>
            `;
            
            container.appendChild(constraintDiv);
        }
    }

    solveProblem() {
        const problemType = document.getElementById('problem-type').value;
        const numVariables = parseInt(document.getElementById('num-variables').value);
        
        // Obtener función objetivo
        const objective = [];
        for (let i = 0; i < numVariables; i++) {
            objective.push(parseFloat(document.getElementById(`obj-coef-${i}`).value) || 0);
        }
        
        // Obtener restricciones
        const numConstraints = parseInt(document.getElementById('num-constraints').value);
        const constraints = [];
        
        for (let i = 0; i < numConstraints; i++) {
            const constraint = {
                coefficients: [],
                inequality: document.getElementById(`constraint-${i}-inequality`).value,
                rhs: parseFloat(document.getElementById(`constraint-${i}-rhs`).value) || 0
            };
            
            for (let j = 0; j < numVariables; j++) {
                constraint.coefficients.push(
                    parseFloat(document.getElementById(`constraint-${i}-var-${j}`).value) || 0
                );
            }
            
            constraints.push(constraint);
        }
        
        // Validar datos
        if (!this.validateInputs(objective, constraints)) {
            return;
        }
        
        // Convertir a forma estándar
        const standardForm = this.convertToStandardForm(problemType, objective, constraints);
        
        // Resolver con Simplex
        this.tableaus = [];
        const solution = this.runSimplex(standardForm);
        
        // Mostrar resultados
        this.displaySolution(solution, standardForm);
    }

    validateInputs(objective, constraints) {
        // Validación básica
        if (objective.some(isNaN)) {
            alert('La función objetivo tiene coeficientes inválidos');
            return false;
        }
        
        if (constraints.some(c => c.coefficients.some(isNaN) || isNaN(c.rhs))) {
            alert('Una o más restricciones tienen valores inválidos');
            return false;
        }
        
        return true;
    }
    
    loadExample() {
        // Cargar un ejemplo predefinido
        document.getElementById('problem-type').value = 'max';
        document.getElementById('num-variables').value = 2;
        document.getElementById('num-constraints').value = 3;
        this.updateProblemDimensions();
        
        // Función objetivo: Z = 3x + 2y
        document.getElementById('obj-coef-0').value = 3;
        document.getElementById('obj-coef-1').value = 2;
        
        // Restricciones
        document.getElementById('constraint-0-var-0').value = 1;
        document.getElementById('constraint-0-var-1').value = 1;
        document.getElementById('constraint-0-inequality').value = '<=';
        document.getElementById('constraint-0-rhs').value = 4;
        
        document.getElementById('constraint-1-var-0').value = 2;
        document.getElementById('constraint-1-var-1').value = 1;
        document.getElementById('constraint-1-inequality').value = '<=';
        document.getElementById('constraint-1-rhs').value = 5;
        
        document.getElementById('constraint-2-var-0').value = -1;
        document.getElementById('constraint-2-var-1').value = 1;
        document.getElementById('constraint-2-inequality').value = '<=';
        document.getElementById('constraint-2-rhs').value = 1;
    }

    resetProblem() {
        document.getElementById('problem-type').value = 'max';
        document.getElementById('num-variables').value = 2;
        document.getElementById('num-constraints').value = 2;
        this.updateProblemDimensions();
        document.getElementById('solution-steps').innerHTML = 
            '<p class="info-message">Ingrese los datos del problema y haga clic en "Resolver"</p>';
    }
    convertToStandardForm(problemType, objective, constraints) {
        // Convertir a problema de maximización
        let objectiveCoefficients = problemType === 'max' 
            ? [...objective] 
            : objective.map(c => -c);
        
        // Contar variables de holgura, exceso y artificiales necesarias
        let numSlack = 0;
        let numSurplus = 0;
        let numArtificial = 0;
        
        constraints.forEach(constraint => {
            if (constraint.inequality === '<=') numSlack++;
            if (constraint.inequality === '>=') numSurplus++;
            if (constraint.inequality === '>=' || constraint.inequality === '==') numArtificial++;
        });
        
        // Crear matriz de coeficientes aumentada
        const matrix = [];
        let slackIndex = 0;
        let artificialIndex = 0;
        
        constraints.forEach((constraint, i) => {
            const row = [];
            
            // Coeficientes de variables originales
            row.push(...constraint.coefficients);
            
            // Variables de holgura
            for (let j = 0; j < numSlack; j++) {
                row.push(j === slackIndex && constraint.inequality === '<=' ? 1 : 0);
            }
            if (constraint.inequality === '<=') slackIndex++;
            
            // Variables de exceso
            for (let j = 0; j < numSurplus; j++) {
                row.push(j === artificialIndex && constraint.inequality === '>=' ? -1 : 0);
            }
            
            // Variables artificiales
            for (let j = 0; j < numArtificial; j++) {
                row.push(j === artificialIndex && 
                        (constraint.inequality === '>=' || constraint.inequality === '==') ? 1 : 0);
            }
            if (constraint.inequality === '>=' || constraint.inequality === '==') artificialIndex++;
            
            // Lado derecho
            row.push(constraint.rhs);
            
            matrix.push(row);
        });
        
        // Función objetivo aumentada
        const objectiveRow = [...objectiveCoefficients];
        for (let i = 0; i < numSlack + numSurplus; i++) {
            objectiveRow.push(0);
        }
        for (let i = 0; i < numArtificial; i++) {
            objectiveRow.push(problemType === 'max' ? -M : M); // M es un número muy grande
        }
        objectiveRow.push(0); // Para Z
        
        return {
            objective: objectiveRow,
            constraints: matrix,
            numDecisionVars: objective.length,
            numSlackVars: numSlack,
            numSurplusVars: numSurplus,
            numArtificialVars: numArtificial,
            isMaximization: problemType === 'max'
        };
    }
    
    runSimplex(standardForm) {
        const M = 999999; // Número grande para variables artificiales
        let tableau = this.createInitialTableau(standardForm);
        this.tableaus.push(this.deepCopyTableau(tableau));
        
        let iteration = 0;
        const maxIterations = 20;
        
        while (iteration < maxIterations) {
            if (this.isOptimal(tableau, standardForm.isMaximization)) {
                break;
            }
            
            const enteringCol = this.selectEnteringVariable(tableau, standardForm.isMaximization);
            const leavingRow = this.selectLeavingVariable(tableau, enteringCol);
            
            if (leavingRow === -1) {
                return {
                    tableaus: this.tableaus,
                    optimalSolution: null,
                    iterations: iteration,
                    isOptimal: false,
                    isUnbounded: true
                };
            }
            
            tableau = this.pivot(tableau, leavingRow, enteringCol);
            this.tableaus.push(this.deepCopyTableau(tableau));
            iteration++;
        }
        
        return {
            tableaus: this.tableaus,
            optimalSolution: this.extractSolution(tableau, standardForm),
            iterations: iteration,
            isOptimal: iteration < maxIterations,
            isUnbounded: false
        };
    }
    
    displaySolution(solution, standardForm) {
        const stepsContainer = document.getElementById('solution-steps');
        stepsContainer.innerHTML = '';
        
        if (solution.isUnbounded) {
            stepsContainer.innerHTML = `
                <div class="solution-step error">
                    <h3>Problema no acotado</h3>
                    <p>El problema no tiene solución óptima finita.</p>
                </div>
            `;
            return;
        }
        
        // Paso 1: Mostrar el problema original
        stepsContainer.innerHTML += `
            <div class="solution-step">
                <h3>Paso 1: Formulación del Problema</h3>
                <p><strong>Función objetivo:</strong> 
                    ${standardForm.isMaximization ? 'Maximizar' : 'Minimizar'} 
                    Z = ${standardForm.objective.slice(0, standardForm.numDecisionVars)
                        .map((c, i) => `${c}${String.fromCharCode(120 + i)}`)
                        .join(' + ')}</p>
                <p><strong>Restricciones:</strong></p>
                <ol>
                    ${standardForm.constraints.map((row, i) => {
                        const constraintStr = row.slice(0, standardForm.numDecisionVars)
                            .map((c, j) => c !== 0 ? `${c}${String.fromCharCode(120 + j)}` : '')
                            .filter(s => s !== '')
                            .join(' + ');
                        
                        const rhs = row[row.length - 1];
                        return `<li>${constraintStr} ≤ ${rhs}</li>`;
                    }).join('')}
                </ol>
            </div>
        `;
        
        // Mostrar cada tableau
        solution.tableaus.forEach((tableau, index) => {
            stepsContainer.innerHTML += `
                <div class="solution-step">
                    <h3>Paso ${index + 2}: ${index === solution.tableaus.length - 1 ? 'Tabla Final' : `Iteración ${index + 1}`}</h3>
                    ${this.createTableauHTML(tableau, index, standardForm)}
                </div>
            `;
        });
        
        // Solución óptima
        if (solution.isOptimal && solution.optimalSolution) {
            stepsContainer.innerHTML += `
                <div class="solution-step optimal-solution">
                    <h3>Solución Óptima</h3>
                    <p><strong>Valores de las variables:</strong></p>
                    <ul>
                        ${solution.optimalSolution.variables.map((val, i) => `
                            <li>${String.fromCharCode(120 + i)} = ${val.toFixed(4)}</li>
                        `).join('')}
                    </ul>
                    <p><strong>Valor óptimo de Z:</strong> ${solution.optimalSolution.z.toFixed(4)}</p>
                </div>
            `;
        }
    }

    createInitialTableau(standardForm) {
        const numVars = standardForm.numDecisionVars + standardForm.numSlackVars + 
                       standardForm.numSurplusVars + standardForm.numArtificialVars;
        const numRows = standardForm.constraints.length;
        
        const tableau = [];
        
        // Filas de restricciones
        standardForm.constraints.forEach(row => {
            tableau.push([...row]);
        });
        
        // Fila objetivo
        tableau.push([...standardForm.objective]);
        
        return tableau;
    }
    
    isOptimal(tableau, isMaximization) {
        const lastRow = tableau[tableau.length - 1];
        
        for (let i = 0; i < lastRow.length - 1; i++) {
            if (isMaximization && lastRow[i] > 0) return false;
            if (!isMaximization && lastRow[i] < 0) return false;
        }
        
        return true;
    }
    
    selectEnteringVariable(tableau, isMaximization) {
        const lastRow = tableau[tableau.length - 1];
        let enteringCol = 0;
        
        if (isMaximization) {
            let max = -Infinity;
            for (let i = 0; i < lastRow.length - 1; i++) {
                if (lastRow[i] > max) {
                    max = lastRow[i];
                    enteringCol = i;
                }
            }
        } else {
            let min = Infinity;
            for (let i = 0; i < lastRow.length - 1; i++) {
                if (lastRow[i] < min) {
                    min = lastRow[i];
                    enteringCol = i;
                }
            }
        }
        
        return enteringCol;
    }
    
    selectLeavingVariable(tableau, enteringCol) {
        const lastCol = tableau[0].length - 1;
        let minRatio = Infinity;
        let leavingRow = -1;
        
        for (let i = 0; i < tableau.length - 1; i++) {
            if (tableau[i][enteringCol] > 0) {
                const ratio = tableau[i][lastCol] / tableau[i][enteringCol];
                if (ratio < minRatio) {
                    minRatio = ratio;
                    leavingRow = i;
                }
            }
        }
        
        return leavingRow;
    }
    
    pivot(tableau, pivotRow, pivotCol) {
        const newTableau = JSON.parse(JSON.stringify(tableau));
        const pivotElement = newTableau[pivotRow][pivotCol];
        
        // Normalizar fila pivote
        for (let j = 0; j < newTableau[pivotRow].length; j++) {
            newTableau[pivotRow][j] /= pivotElement;
        }
        
        // Actualizar otras filas
        for (let i = 0; i < newTableau.length; i++) {
            if (i !== pivotRow) {
                const factor = newTableau[i][pivotCol];
                for (let j = 0; j < newTableau[i].length; j++) {
                    newTableau[i][j] -= factor * newTableau[pivotRow][j];
                }
            }
        }
        
        return newTableau;
    }
    
    extractSolution(tableau, standardForm) {
        const solution = {
            variables: new Array(standardForm.numDecisionVars).fill(0),
            z: tableau[tableau.length - 1][tableau[0].length - 1]
        };
        
        const numVars = standardForm.numDecisionVars + standardForm.numSlackVars + 
                       standardForm.numSurplusVars + standardForm.numArtificialVars;
        
        for (let j = 0; j < standardForm.numDecisionVars; j++) {
            let count = 0;
            let rowIndex = -1;
            
            for (let i = 0; i < tableau.length - 1; i++) {
                if (Math.abs(tableau[i][j] - 1) < 0.0001) {
                    let isBasic = true;
                    for (let k = 0; k < numVars; k++) {
                        if (k !== j && Math.abs(tableau[i][k]) > 0.0001) {
                            isBasic = false;
                            break;
                        }
                    }
                    
                    if (isBasic) {
                        count++;
                        rowIndex = i;
                    }
                }
            }
            
            if (count === 1) {
                solution.variables[j] = tableau[rowIndex][tableau[0].length - 1];
            }
        }
        
        return solution;
    }
    
    createTableauHTML(tableau, iteration, standardForm) {
        let html = '<div class="tableau-container"><table class="simplex-tableau">';
        const numRows = tableau.length;
        const numCols = tableau[0].length;
        
        // Encabezados
        html += '<tr><th>Base</th>';
        
        // Variables de decisión
        for (let i = 0; i < standardForm.numDecisionVars; i++) {
            html += `<th>${String.fromCharCode(120 + i)}</th>`;
        }
        
        // Variables de holgura
        for (let i = 0; i < standardForm.numSlackVars; i++) {
            html += `<th>s<sub>${i + 1}</sub></th>`;
        }
        
        // Variables de exceso
        for (let i = 0; i < standardForm.numSurplusVars; i++) {
            html += `<th>e<sub>${i + 1}</sub></th>`;
        }
        
        // Variables artificiales
        for (let i = 0; i < standardForm.numArtificialVars; i++) {
            html += `<th>a<sub>${i + 1}</sub></th>`;
        }
        
        html += '<th>Solución</th></tr>';
        
        // Filas de restricciones
        for (let i = 0; i < numRows - 1; i++) {
            html += '<tr>';
            
            // Identificar variable básica
            let basicVar = '';
            for (let j = 0; j < numCols - 1; j++) {
                if (Math.abs(tableau[i][j] - 1) < 0.0001) {
                    let isBasic = true;
                    for (let k = 0; k < numRows - 1; k++) {
                        if (k !== i && Math.abs(tableau[k][j]) > 0.0001) {
                            isBasic = false;
                            break;
                        }
                    }
                    
                    if (isBasic) {
                        if (j < standardForm.numDecisionVars) {
                            basicVar = String.fromCharCode(120 + j);
                        } else if (j < standardForm.numDecisionVars + standardForm.numSlackVars) {
                            basicVar = `s<sub>${j - standardForm.numDecisionVars + 1}</sub>`;
                        } else if (j < standardForm.numDecisionVars + standardForm.numSlackVars + standardForm.numSurplusVars) {
                            basicVar = `e<sub>${j - standardForm.numDecisionVars - standardForm.numSlackVars + 1}</sub>`;
                        } else {
                            basicVar = `a<sub>${j - standardForm.numDecisionVars - standardForm.numSlackVars - standardForm.numSurplusVars + 1}</sub>`;
                        }
                        break;
                    }
                }
            }
            
            html += `<td>${basicVar}</td>`;
            
            // Coeficientes
            for (let j = 0; j < numCols; j++) {
                const isPivot = iteration < this.tableaus.length - 1 && 
                               i === this.getPivotRow(this.tableaus[iteration], iteration) && 
                               j === this.getPivotCol(this.tableaus[iteration], iteration, standardForm.isMaximization);
                
                html += `<td ${isPivot ? 'class="pivot-element"' : ''}>${tableau[i][j].toFixed(4)}</td>`;
            }
            
            html += '</tr>';
        }
        
        // Fila objetivo
        html += '<tr><td>Z</td>';
        for (let j = 0; j < numCols; j++) {
            html += `<td>${tableau[numRows - 1][j].toFixed(4)}</td>`;
        }
        html += '</tr>';
        
        html += '</table></div>';
        return html;
    }
}



// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    window.simplexSolver = new SimplexSolver();
});