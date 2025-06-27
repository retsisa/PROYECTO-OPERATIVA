/*class TwoPhaseSolver {
    constructor() {
        this.M = 999999; // Número grande para variables artificiales
        this.tableausPhase1 = [];
        this.tableausPhase2 = [];
        this.solutionSteps = document.getElementById('solution-steps');
        this.initEventListeners();
    }
    
    initEventListeners() {
        document.getElementById('solve-btn').addEventListener('click', () => this.solveProblem());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetProblem());
    }
    
    resetProblem() {
        this.solutionSteps.innerHTML = '';
        this.tableausPhase1 = [];
        this.tableausPhase2 = [];
    }
    
    solveProblem() {
        this.resetProblem();
        
        // Fase 1: Convertir a forma estándar y minimizar variables artificiales
        this.solutionSteps.innerHTML += '<h2>Fase 1: Minimización de Variables Artificiales</h2>';
        const phase1Result = this.runPhase1();
        
        if (phase1Result.optimalValue > 0) {
            this.solutionSteps.innerHTML += `
                <div class="error">
                    <p>El problema no tiene solución factible (W > 0).</p>
                </div>
            `;
            return;
        }
        
        // Fase 2: Resolver el problema original
        this.solutionSteps.innerHTML += '<h2>Fase 2: Resolución del Problema Original</h2>';
        this.runPhase2(phase1Result.finalTableau);
    }
    
    runPhase1() {
        // Coeficientes originales para la función objetivo
        const originalObjective = [150, 100];
        
        // Configuración de restricciones
        const constraints = [
            { coefficients: [1, 1], inequality: '<=', rhs: 30 },  // x_p + x_h ≤ 30
            { coefficients: [1, 0], inequality: '>=', rhs: 10 },  // x_p ≥ 10
            { coefficients: [0, 1], inequality: '>=', rhs: 10 }   // x_h ≥ 10
        ];
        
        // Convertir a forma estándar para Fase 1
        let numDecisionVars = 2;
        let numSlack = 0;
        let numSurplus = 0;
        let numArtificial = 0;
        
        constraints.forEach(constraint => {
            if (constraint.inequality === '<=') numSlack++;
            if (constraint.inequality === '>=') numSurplus++;
            if (constraint.inequality === '>=' || constraint.inequality === '==') numArtificial++;
        });
        
        // Crear tabla para Fase 1 (minimizar suma de variables artificiales)
        const initialTableau = [];
        let artificialIndex = 0;
        
        // Filas de restricciones
        constraints.forEach((constraint, i) => {
            const row = [];
            
            // Variables de decisión
            row.push(...constraint.coefficients);
            
            // Variables de holgura
            for (let j = 0; j < numSlack; j++) {
                row.push(j === i && constraint.inequality === '<=' ? 1 : 0);
            }
            
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
            
            initialTableau.push(row);
        });
        
        // Función objetivo de Fase 1 (minimizar suma de variables artificiales)
        const phase1Objective = new Array(numDecisionVars + numSlack + numSurplus).fill(0);
        for (let i = numDecisionVars + numSlack + numSurplus; i < numDecisionVars + numSlack + numSurplus + numArtificial; i++) {
            phase1Objective[i] = 1;
        }
        phase1Objective.push(0); // Para W
        
        // Modificar la función objetivo para expresarla en términos de variables no básicas
        const modifiedPhase1Objective = [...phase1Objective];
        for (let i = 0; i < initialTableau.length; i++) {
            const artificialCol = numDecisionVars + numSlack + numSurplus + i;
            if (phase1Objective[artificialCol] === 1) {
                for (let j = 0; j < modifiedPhase1Objective.length; j++) {
                    modifiedPhase1Objective[j] -= initialTableau[i][j];
                }
            }
        }
        
        initialTableau.push(modifiedPhase1Objective);
        this.tableausPhase1.push(this.deepCopyTableau(initialTableau));
        
        // Mostrar tabla inicial de Fase 1
        this.displayTableau(initialTableau, 'Tabla Inicial Fase 1', true);
        
        // Resolver Fase 1
        let tableau = this.deepCopyTableau(initialTableau);
        let iteration = 1;
        
        while (true) {
            // Verificar optimalidad (todos los coeficientes en W ≥ 0)
            const lastRow = tableau[tableau.length - 1];
            let isOptimal = true;
            
            for (let j = 0; j < lastRow.length - 1; j++) {
                if (lastRow[j] < -0.0001) {
                    isOptimal = false;
                    break;
                }
            }
            
            if (isOptimal) break;
            
            // Seleccionar variable entrante (más negativa en W)
            let enteringCol = 0;
            let minVal = 0;
            
            for (let j = 0; j < lastRow.length - 1; j++) {
                if (lastRow[j] < minVal) {
                    minVal = lastRow[j];
                    enteringCol = j;
                }
            }
            
            // Seleccionar variable saliente (mínima razón positiva)
            let leavingRow = -1;
            let minRatio = Infinity;
            
            for (let i = 0; i < tableau.length - 1; i++) {
                if (tableau[i][enteringCol] > 0) {
                    const ratio = tableau[i][tableau[i].length - 1] / tableau[i][enteringCol];
                    if (ratio < minRatio) {
                        minRatio = ratio;
                        leavingRow = i;
                    }
                }
            }
            
            if (leavingRow === -1) {
                console.log("Problema no acotado en Fase 1");
                break;
            }
            
            // Pivoteo
            tableau = this.pivot(tableau, leavingRow, enteringCol);
            this.tableausPhase1.push(this.deepCopyTableau(tableau));
            
            // Mostrar tabla de iteración
            this.displayTableau(tableau, `Iteración ${iteration} Fase 1`, true);
            iteration++;
        }
        
        // Resultado de Fase 1
        const wValue = tableau[tableau.length - 1][tableau[0].length - 1];
        
        return {
            optimalValue: wValue,
            finalTableau: tableau
        };
    }
    
    runPhase2(phase1FinalTableau) {
        // Eliminar fila W y columnas de variables artificiales
        const phase2Tableau = [];
        const numArtificial = 2; // Tenemos 2 variables artificiales (una para cada restricción >=)
        
        for (let i = 0; i < phase1FinalTableau.length - 1; i++) {
            const row = phase1FinalTableau[i];
            const newRow = row.slice(0, row.length - numArtificial - 1);
            newRow.push(row[row.length - 1]);
            phase2Tableau.push(newRow);
        }
        
        // Agregar función objetivo original
        const originalObjective = [150, 100, 0, 0, 0]; // x_p, x_h, s1, s2, s3, Z
        phase2Tableau.push([...originalObjective, 0]);
        
        // Modificar la función objetivo para expresarla en términos de variables no básicas
        const lastRow = phase2Tableau.length - 1;
        
        // Identificar variables básicas
        for (let j = 0; j < originalObjective.length; j++) {
            let basicRow = -1;
            
            for (let i = 0; i < phase2Tableau.length - 1; i++) {
                if (Math.abs(phase2Tableau[i][j] - 1) < 0.0001) {
                    let isBasic = true;
                    for (let k = 0; k < phase2Tableau.length - 1; k++) {
                        if (k !== i && Math.abs(phase2Tableau[k][j]) > 0.0001) {
                            isBasic = false;
                            break;
                        }
                    }
                    
                    if (isBasic) {
                        basicRow = i;
                        break;
                    }
                }
            }
            
            if (basicRow !== -1) {
                const factor = phase2Tableau[lastRow][j];
                for (let k = 0; k < phase2Tableau[lastRow].length; k++) {
                    phase2Tableau[lastRow][k] -= factor * phase2Tableau[basicRow][k];
                }
            }
        }
        
        this.tableausPhase2.push(this.deepCopyTableau(phase2Tableau));
        this.displayTableau(phase2Tableau, 'Tabla Inicial Fase 2', false);
        
        // Resolver Fase 2
        let tableau = this.deepCopyTableau(phase2Tableau);
        let iteration = 1;
        
        while (true) {
            // Verificar optimalidad (todos los coeficientes en Z ≤ 0 para maximización)
            const lastRow = tableau[tableau.length - 1];
            let isOptimal = true;
            
            for (let j = 0; j < lastRow.length - 1; j++) {
                if (lastRow[j] > 0.0001) {
                    isOptimal = false;
                    break;
                }
            }
            
            if (isOptimal) break;
            
            // Seleccionar variable entrante (más positiva en Z para maximización)
            let enteringCol = 0;
            let maxVal = 0;
            
            for (let j = 0; j < lastRow.length - 1; j++) {
                if (lastRow[j] > maxVal) {
                    maxVal = lastRow[j];
                    enteringCol = j;
                }
            }
            
            // Seleccionar variable saliente (mínima razón positiva)
            let leavingRow = -1;
            let minRatio = Infinity;
            
            for (let i = 0; i < tableau.length - 1; i++) {
                if (tableau[i][enteringCol] > 0) {
                    const ratio = tableau[i][tableau[i].length - 1] / tableau[i][enteringCol];
                    if (ratio < minRatio) {
                        minRatio = ratio;
                        leavingRow = i;
                    }
                }
            }
            
            if (leavingRow === -1) {
                console.log("Problema no acotado en Fase 2");
                break;
            }
            
            // Pivoteo
            tableau = this.pivot(tableau, leavingRow, enteringCol);
            this.tableausPhase2.push(this.deepCopyTableau(tableau));
            
            // Mostrar tabla de iteración
            this.displayTableau(tableau, `Iteración ${iteration} Fase 2`, false);
            iteration++;
        }
        
        // Mostrar solución final
        this.displayFinalSolution(tableau);
    }
    
    pivot(tableau, pivotRow, pivotCol) {
        const newTableau = this.deepCopyTableau(tableau);
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
    
    deepCopyTableau(tableau) {
        return JSON.parse(JSON.stringify(tableau));
    }
    
    displayTableau(tableau, title, isPhase1) {
        const numDecisionVars = 2;
        const numSlack = 1;
        const numSurplus = 2;
        const numArtificial = isPhase1 ? 2 : 0;
        
        let html = `
            <div class="phase">
                <h3>${title}</h3>
                <div class="table-container">
                    <table>
                        <tr>
                            <th>Base</th>
                            <th>x<sub>p</sub></th>
                            <th>x<sub>h</sub></th>
                            <th>s<sub>1</sub></th>
                            <th>s<sub>2</sub></th>
                            <th>s<sub>3</sub></th>
                            ${isPhase1 ? '<th>a<sub>1</sub></th><th>a<sub>2</sub></th>' : ''}
                            <th>Solución</th>
                        </tr>
        `;
        
        // Filas de restricciones
        for (let i = 0; i < tableau.length - 1; i++) {
            html += '<tr>';
            
            // Identificar variable básica
            let basicVar = '';
            for (let j = 0; j < tableau[i].length - 1; j++) {
                if (Math.abs(tableau[i][j] - 1) < 0.0001) {
                    let isBasic = true;
                    for (let k = 0; k < tableau.length - 1; k++) {
                        if (k !== i && Math.abs(tableau[k][j]) > 0.0001) {
                            isBasic = false;
                            break;
                        }
                    }
                    
                    if (isBasic) {
                        if (j < numDecisionVars) {
                            basicVar = j === 0 ? 'x<sub>p</sub>' : 'x<sub>h</sub>';
                        } else if (j < numDecisionVars + numSlack) {
                            basicVar = 's<sub>1</sub>';
                        } else if (j < numDecisionVars + numSlack + numSurplus) {
                            basicVar = j === numDecisionVars + numSlack ? 's<sub>2</sub>' : 's<sub>3</sub>';
                        } else if (isPhase1) {
                            basicVar = j === numDecisionVars + numSlack + numSurplus ? 'a<sub>1</sub>' : 'a<sub>2</sub>';
                        }
                        break;
                    }
                }
            }
            
            html += `<td>${basicVar}</td>`;
            
            // Coeficientes
            for (let j = 0; j < tableau[i].length; j++) {
                const value = tableau[i][j];
                html += `<td>${Math.abs(value) < 0.0001 ? '0' : value.toFixed(4)}</td>`;
            }
            
            html += '</tr>';
        }
        
        // Fila objetivo (W o Z)
        html += '<tr><td>';
        html += isPhase1 ? 'W' : 'Z';
        html += '</td>';
        
        for (let j = 0; j < tableau[tableau.length - 1].length; j++) {
            const value = tableau[tableau.length - 1][j];
            html += `<td>${Math.abs(value) < 0.0001 ? '0' : value.toFixed(4)}</td>`;
        }
        
        html += `
                    </tr>
                </table>
            </div>
        `;
        
        this.solutionSteps.innerHTML += html;
    }
    
    displayFinalSolution(finalTableau) {
        // Extraer valores de las variables
        const xp = this.getBasicVariableValue(finalTableau, 0); // Columna x_p
        const xh = this.getBasicVariableValue(finalTableau, 1); // Columna x_h
        const z = -finalTableau[finalTableau.length - 1][finalTableau[0].length - 1];
        
        this.solutionSteps.innerHTML += `
            <div class="solution">
                <h3>Solución Óptima</h3>
                <p>Valores de las variables:</p>
                <ul>
                    <li>x<sub>p</sub> (Cursos prácticos) = ${xp.toFixed(2)}</li>
                    <li>x<sub>h</sub> (Cursos humanísticos) = ${xh.toFixed(2)}</li>
                </ul>
                <p>Valor óptimo de Z (Ingresos): ${z.toFixed(2)}</p>
                <p>Interpretación: La UPEA debe ofrecer ${xp.toFixed(0)} cursos prácticos y ${xh.toFixed(0)} cursos humanísticos para maximizar sus ingresos a $${z.toFixed(0)}.</p>
            </div>
        `;
    }
    
    getBasicVariableValue(tableau, col) {
        for (let i = 0; i < tableau.length - 1; i++) {
            if (Math.abs(tableau[i][col] - 1) < 0.0001) {
                let isBasic = true;
                for (let j = 0; j < tableau.length - 1; j++) {
                    if (j !== i && Math.abs(tableau[j][col]) > 0.0001) {
                        isBasic = false;
                        break;
                    }
                }
                
                if (isBasic) {
                    return tableau[i][tableau[i].length - 1];
                }
            }
        }
        return 0;
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    window.solver = new TwoPhaseSolver();
});*/
/*document.addEventListener('DOMContentLoaded', function() {
    const variablesInput = document.getElementById('variables');
    const restriccionesInput = document.getElementById('restricciones');
    const tipoOptimizacionSelect = document.getElementById('tipo-optimizacion');
    const generarBtn = document.getElementById('generar-btn');
    const ejemploBtn = document.getElementById('ejemplo-btn');
    const resolverBtn = document.getElementById('resolver-btn');
    const problemaCard = document.getElementById('problema-card');
    const resultadosCard = document.getElementById('resultados-card');
    const funcionObjetivoContainer = document.getElementById('funcion-objetivo-container');
    const restriccionesContainer = document.getElementById('restricciones-container');
    const pasosContainer = document.getElementById('pasos-container');
    
    let variables = 0;
    let restricciones = 0;
    let tipoOptimizacion = 'min';
    
    // Generar inputs para el problema
    generarBtn.addEventListener('click', function() {
        variables = parseInt(variablesInput.value);
        restricciones = parseInt(restriccionesInput.value);
        tipoOptimizacion = tipoOptimizacionSelect.value;
        
        if (variables < 1 || restricciones < 1) {
            alert('Por favor ingrese valores válidos (mayores a 0)');
            return;
        }
        
        generarInputsProblema();
        problemaCard.style.display = 'block';
        resultadosCard.style.display = 'none';
    });
    
    // Cargar ejemplo predefinido
    ejemploBtn.addEventListener('click', function() {
        variablesInput.value = 2;
        restriccionesInput.value = 3;
        tipoOptimizacionSelect.value = 'min';
        
        variables = 2;
        restricciones = 3;
        tipoOptimizacion = 'min';
        
        generarInputsProblema();
        problemaCard.style.display = 'block';
        resultadosCard.style.display = 'none';
        
        // Función objetivo: Minimizar Z = 4x1 + x2
        document.querySelector('.coef-fo[data-variable="0"]').value = 4;
        document.querySelector('.coef-fo[data-variable="1"]').value = 1;
        
        // Restricción 1: 3x1 + x2 = 3
        document.querySelector('.coef-restriccion[data-restriccion="0"][data-variable="0"]').value = 3;
        document.querySelector('.coef-restriccion[data-restriccion="0"][data-variable="1"]').value = 1;
        document.querySelector('.rhs[data-restriccion="0"]').value = 3;
        document.querySelector('.tipo-restriccion[data-restriccion="0"]').value = '=';
        
        // Restricción 2: 4x1 + 3x2 ≥ 6
        document.querySelector('.coef-restriccion[data-restriccion="1"][data-variable="0"]').value = 4;
        document.querySelector('.coef-restriccion[data-restriccion="1"][data-variable="1"]').value = 3;
        document.querySelector('.rhs[data-restriccion="1"]').value = 6;
        document.querySelector('.tipo-restriccion[data-restriccion="1"]').value = '≥';
        
        // Restricción 3: x1 + 2x2 ≤ 4
        document.querySelector('.coef-restriccion[data-restriccion="2"][data-variable="0"]').value = 1;
        document.querySelector('.coef-restriccion[data-restriccion="2"][data-variable="1"]').value = 2;
        document.querySelector('.rhs[data-restriccion="2"]').value = 4;
        document.querySelector('.tipo-restriccion[data-restriccion="2"]').value = '≤';
    });
    
    // Función para generar los inputs del problema
    function generarInputsProblema() {
        // Limpiar contenedores
        funcionObjetivoContainer.innerHTML = '<h3>Función Objetivo</h3>';
        restriccionesContainer.innerHTML = '<h3>Restricciones</h3>';
        
        // Generar función objetivo
        const foDiv = document.createElement('div');
        foDiv.className = 'input-section';
        
        // Agregar coeficientes de variables
        for (let i = 0; i < variables; i++) {
            const grupo = document.createElement('div');
            grupo.className = 'input-group';
            
            const label = document.createElement('label');
            label.textContent = `Coeficiente x${i+1}:`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.value = Math.floor(Math.random() * 10) - 2;
            input.dataset.variable = i;
            input.classList.add('coef-fo');
            
            grupo.appendChild(label);
            grupo.appendChild(input);
            foDiv.appendChild(grupo);
        }
        
        funcionObjetivoContainer.appendChild(foDiv);
        
        // Generar restricciones
        for (let r = 0; r < restricciones; r++) {
            const resDiv = document.createElement('div');
            resDiv.className = 'restriccion';
            resDiv.style.marginBottom = '20px';
            
            const titulo = document.createElement('h4');
            titulo.textContent = `Restricción ${r+1}`;
            resDiv.appendChild(titulo);
            
            const inputsDiv = document.createElement('div');
            inputsDiv.className = 'input-section';
            
            // Coeficientes de variables
            for (let i = 0; i < variables; i++) {
                const grupo = document.createElement('div');
                grupo.className = 'input-group';
                
                const label = document.createElement('label');
                label.textContent = `Coeficiente x${i+1}:`;
                
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.value = Math.floor(Math.random() * 5) + 1;
                input.dataset.variable = i;
                input.dataset.restriccion = r;
                input.classList.add('coef-restriccion');
                
                grupo.appendChild(label);
                grupo.appendChild(input);
                inputsDiv.appendChild(grupo);
            }
            
            // Lado derecho (RHS)
            const rhsGrupo = document.createElement('div');
            rhsGrupo.className = 'input-group';
            
            const rhsLabel = document.createElement('label');
            rhsLabel.textContent = 'Lado derecho (≥, ≤, =):';
            
            const rhsInput = document.createElement('input');
            rhsInput.type = 'number';
            rhsInput.step = 'any';
            rhsInput.value = Math.floor(Math.random() * 20) + 10;
            rhsInput.dataset.restriccion = r;
            rhsInput.classList.add('rhs');
            
            rhsGrupo.appendChild(rhsLabel);
            rhsGrupo.appendChild(rhsInput);
            inputsDiv.appendChild(rhsGrupo);
            
            // Tipo de restricción
            const tipoGrupo = document.createElement('div');
            tipoGrupo.className = 'input-group';
            
            const tipoLabel = document.createElement('label');
            tipoLabel.textContent = 'Tipo:';
            
            const tipoSelect = document.createElement('select');
            tipoSelect.dataset.restriccion = r;
            tipoSelect.classList.add('tipo-restriccion');
            
            const opciones = ['≤', '=', '≥'];
            opciones.forEach(op => {
                const option = document.createElement('option');
                option.value = op;
                option.textContent = op;
                tipoSelect.appendChild(option);
            });
            
            tipoSelect.selectedIndex = Math.floor(Math.random() * 3);
            
            tipoGrupo.appendChild(tipoLabel);
            tipoGrupo.appendChild(tipoSelect);
            inputsDiv.appendChild(tipoGrupo);
            
            resDiv.appendChild(inputsDiv);
            restriccionesContainer.appendChild(resDiv);
        }
    }
    
    // Resolver el problema con el método de dos fases
    resolverBtn.addEventListener('click', function() {
        const datosProblema = leerDatosProblema();
        if (!datosProblema) return;
        
        pasosContainer.innerHTML = '';
        
        try {
            const { solucion, pasos } = resolverDosFases(datosProblema);
            mostrarResultados(solucion, pasos);
            resultadosCard.style.display = 'block';
        } catch (error) {
            alert(`Error al resolver: ${error.message}`);
            console.error(error);
        }
    });
    
    // Leer datos del problema
    function leerDatosProblema() {
        const coefFO = [];
        const restriccionesData = [];
        
        // Leer función objetivo
        const foInputs = document.querySelectorAll('.coef-fo');
        for (let i = 0; i < variables; i++) {
            const input = document.querySelector(`.coef-fo[data-variable="${i}"]`);
            const value = parseFloat(input.value);
            if (isNaN(value)) {
                alert(`Valor inválido en coeficiente x${i+1} de la función objetivo`);
                return null;
            }
            coefFO.push(value);
        }
        
        // Leer restricciones
        const restriccionDivs = document.querySelectorAll('.restriccion');
        for (let r = 0; r < restriccionDivs.length; r++) {
            const restriccion = {
                coef: [],
                rhs: 0,
                tipo: ''
            };
            
            // Coeficientes
            for (let i = 0; i < variables; i++) {
                const input = document.querySelector(`.coef-restriccion[data-restriccion="${r}"][data-variable="${i}"]`);
                const value = parseFloat(input.value);
                if (isNaN(value)) {
                    alert(`Valor inválido en coeficiente x${i+1} de la restricción ${r+1}`);
                    return null;
                }
                restriccion.coef.push(value);
            }
            
            // Lado derecho
            const rhsInput = document.querySelector(`.rhs[data-restriccion="${r}"]`);
            restriccion.rhs = parseFloat(rhsInput.value);
            if (isNaN(restriccion.rhs)) {
                alert(`Valor inválido en lado derecho de la restricción ${r+1}`);
                return null;
            }
            
            // Tipo
            const tipoSelect = document.querySelector(`.tipo-restriccion[data-restriccion="${r}"]`);
            restriccion.tipo = tipoSelect.value;
            
            restriccionesData.push(restriccion);
        }
        
        return { 
            coefFO, 
            restricciones: restriccionesData, 
            tipoOptimizacion: tipoOptimizacionSelect.value 
        };
    }
    
    // Implementación del método de dos fases
    function resolverDosFases(datosProblema) {
        const { coefFO, restricciones, tipoOptimizacion } = datosProblema;
        const pasos = [];
        
        // Paso 1: Convertir a forma estándar
        const { tableau, variablesArtificiales } = convertirAFormaEstandar(coefFO, restricciones, tipoOptimizacion);
        pasos.push(crearPaso('Fase 1: Conversión a Forma Estándar', 
            `Se agregaron ${variablesArtificiales.length} variables artificiales.`,
            tableau
        ));
        
        // Paso 2: Fase 1 - Minimizar la suma de variables artificiales
        pasos.push(crearPaso('Fase 1: Objetivo Inicial', 
            'Se minimiza la suma de variables artificiales (W).',
            tableau
        ));
        
        // Iteraciones de la Fase 1
        let iteracion = 1;
        let currentTableau = JSON.parse(JSON.stringify(tableau));
        
        while (true) {
            const { filaPivote, colPivote, puedeMejorar } = encontrarPivote(currentTableau, true);
            
            if (!puedeMejorar) break;
            
            currentTableau = pivotear(currentTableau, filaPivote, colPivote);
            
            pasos.push(crearPaso(`Fase 1: Iteración ${iteracion}`, 
                `Pivote en fila ${filaPivote+1}, columna ${colPivote+1}.`,
                currentTableau,
                null,
                {filaPivote, colPivote}
            ));
            
            iteracion++;
        }
        
        // Verificar factibilidad
        const valorW = currentTableau[0][currentTableau[0].length - 1];
        if (Math.abs(valorW) > 1e-8) {
            pasos.push(crearPaso('Fase 1: Resultado', 
                `El problema no tiene solución factible (W = ${valorW.toFixed(4)} ≠ 0).`,
                currentTableau
            ));
            return { solucion: null, pasos };
        }
        
        // Paso 3: Fase 2 - Eliminar variables artificiales y resolver el problema original
        currentTableau = eliminarVariablesArtificiales(currentTableau, variablesArtificiales);
        pasos.push(crearPaso('Fase 2: Eliminación de Variables Artificiales', 
            'Se eliminaron las variables artificiales y se restaura la función objetivo original.',
            currentTableau
        ));
        
        // Iteraciones de la Fase 2
        iteracion = 1;
        while (true) {
            const { filaPivote, colPivote, puedeMejorar } = encontrarPivote(currentTableau, false);
            
            if (!puedeMejorar) break;
            
            currentTableau = pivotear(currentTableau, filaPivote, colPivote);
            
            pasos.push(crearPaso(`Fase 2: Iteración ${iteracion}`, 
                `Pivote en fila ${filaPivote+1}, columna ${colPivote+1}.`,
                currentTableau,
                null,
                {filaPivote, colPivote}
            ));
            
            iteracion++;
        }
        
        // Obtener solución final
        const solucion = extraerSolucion(currentTableau, variables);
        pasos.push(crearPaso('Solución Final', 
            `Valor óptimo: ${solucion.valor.toFixed(4)}.`,
            currentTableau,
            solucion
        ));
        
        return { solucion, pasos };
    }
    
    // Función para convertir a forma estándar
    function convertirAFormaEstandar(coefFO, restricciones, tipoOptimizacion) {
        const numVariables = coefFO.length;
        const numRestricciones = restricciones.length;
        
        // Contadores para variables adicionales
        let numHolgura = 0;
        let numExceso = 0;
        let numArtificiales = 0;
        
        // Identificar tipos de variables necesarias
        restricciones.forEach(restriccion => {
            if (restriccion.tipo === '≤') numHolgura++;
            else if (restriccion.tipo === '≥') {
                numExceso++;
                numArtificiales++;
            }
            else if (restriccion.tipo === '=') numArtificiales++;
        });
        
        // Inicializar tableau
        const totalColumnas = numVariables + numHolgura + numExceso + numArtificiales + 1; // +1 para RHS
        const tableau = [];
        
        // Fila 0: Función objetivo original (para Fase 2)
        const filaZ = new Array(totalColumnas).fill(0);
        for (let i = 0; i < numVariables; i++) {
            filaZ[i] = tipoOptimizacion === 'min' ? coefFO[i] : -coefFO[i];
        }
        filaZ[totalColumnas - 1] = 0; // RHS
        tableau.push(filaZ);
        
        // Fila 1: Función objetivo de la Fase 1 (W)
        const filaW = new Array(totalColumnas).fill(0);
        
        // Variables para mapear posiciones
        let colHolgura = numVariables;
        let colExceso = numVariables + numHolgura;
        let colArtificial = numVariables + numHolgura + numExceso;
        const variablesArtificiales = [];
        
        // Agregar restricciones al tableau
        restricciones.forEach((restriccion, i) => {
            const fila = new Array(totalColumnas).fill(0);
            
            // Coeficientes de variables originales
            for (let j = 0; j < numVariables; j++) {
                fila[j] = restriccion.coef[j];
            }
            
            // Variables de holgura/exceso/artificiales
            if (restriccion.tipo === '≤') {
                fila[colHolgura] = 1;
                colHolgura++;
            } else if (restriccion.tipo === '≥') {
                fila[colExceso] = -1;
                fila[colArtificial] = 1;
                variablesArtificiales.push(colArtificial);
                
                // Actualizar filaW (coeficiente 1 para variables artificiales)
                filaW[colArtificial] = 1;
                
                colExceso++;
                colArtificial++;
            } else if (restriccion.tipo === '=') {
                fila[colArtificial] = 1;
                variablesArtificiales.push(colArtificial);
                
                // Actualizar filaW
                filaW[colArtificial] = 1;
                
                colArtificial++;
            }
            
            // Lado derecho
            fila[totalColumnas - 1] = restriccion.rhs;
            
            tableau.push(fila);
        });
        
        // Actualizar filaW para que solo tenga 1 en las columnas de variables artificiales
        tableau.unshift(filaW);
        
        return { tableau, variablesArtificiales };
    }
    
    // Función para encontrar el pivote
    function encontrarPivote(tableau, esFase1) {
        const numFilas = tableau.length;
        const numColumnas = tableau[0].length;
        const filaObj = esFase1 ? 0 : 1; // Fila 0 es W en Fase 1, fila 1 es Z en Fase 2
        
        // Encontrar columna pivote (más negativo en fila objetivo)
        let colPivote = -1;
        let minValor = 0;
        
        for (let j = 0; j < numColumnas - 1; j++) {
            const valor = tableau[filaObj][j];
            if (valor < minValor) {
                minValor = valor;
                colPivote = j;
            }
        }
        
        if (colPivote === -1) {
            return { filaPivote: -1, colPivote: -1, puedeMejorar: false };
        }
        
        // Encontrar fila pivote (mínima razón positiva)
        let filaPivote = -1;
        let minRazon = Infinity;
        
        for (let i = 2; i < numFilas; i++) { // Saltar filas W y Z
            if (tableau[i][colPivote] <= 0) continue;
            
            const razon = tableau[i][numColumnas - 1] / tableau[i][colPivote];
            if (razon >= 0 && razon < minRazon) {
                minRazon = razon;
                filaPivote = i;
            }
        }
        
        if (filaPivote === -1) {
            return { filaPivote: -1, colPivote: -1, puedeMejorar: false };
        }
        
        return { filaPivote, colPivote, puedeMejorar: true };
    }
    
    // Función para pivotear
    function pivotear(tableau, filaPivote, colPivote) {
        const nuevoTableau = JSON.parse(JSON.stringify(tableau));
        const numFilas = nuevoTableau.length;
        const numColumnas = nuevoTableau[0].length;
        const elementoPivote = nuevoTableau[filaPivote][colPivote];
        
        // Normalizar fila pivote
        for (let j = 0; j < numColumnas; j++) {
            nuevoTableau[filaPivote][j] /= elementoPivote;
        }
        
        // Actualizar otras filas
        for (let i = 0; i < numFilas; i++) {
            if (i === filaPivote) continue;
            
            const factor = nuevoTableau[i][colPivote];
            for (let j = 0; j < numColumnas; j++) {
                nuevoTableau[i][j] -= factor * nuevoTableau[filaPivote][j];
            }
        }
        
        return nuevoTableau;
    }
    
    // Función para eliminar variables artificiales
    function eliminarVariablesArtificiales(tableau, variablesArtificiales) {
        // Eliminar fila W (fase 1)
        const nuevoTableau = tableau.slice(1);
        
        // Eliminar columnas de variables artificiales
        variablesArtificiales.sort((a, b) => b - a); // Orden descendente
        
        for (const col of variablesArtificiales) {
            for (let i = 0; i < nuevoTableau.length; i++) {
                nuevoTableau[i].splice(col, 1);
            }
        }
        
        return nuevoTableau;
    }
    
    // Función para extraer la solución
    function extraerSolucion(tableau, numVariables) {
        const numFilas = tableau.length;
        const numColumnas = tableau[0].length;
        const variables = new Array(numVariables).fill(0);
        
        // Para cada variable original
        for (let j = 0; j < numVariables; j++) {
            let countUnos = 0;
            let filaUnicoUno = -1;
            
            // Buscar columna con un solo 1 y otros 0
            for (let i = 1; i < numFilas; i++) {
                if (tableau[i][j] === 1) {
                    countUnos++;
                    filaUnicoUno = i;
                } else if (tableau[i][j] !== 0) {
                    countUnos = 2; // No es básica
                    break;
                }
            }
            
            if (countUnos === 1) {
                variables[j] = tableau[filaUnicoUno][numColumnas - 1];
            }
        }
        
        const valorOptimo = tableau[0][numColumnas - 1] * (tipoOptimizacion === 'min' ? 1 : -1);
        
        return { valor: valorOptimo, variables };
    }
    
    // Función para crear un paso del algoritmo
    function crearPaso(titulo, descripcion, tableau, solucion = null, pivote = null) {
        return { titulo, descripcion, tableau, solucion, filaPivote: pivote?.filaPivote, colPivote: pivote?.colPivote };
    }
    
    // Mostrar resultados
    function mostrarResultados(solucion, pasos) {
        pasos.forEach(paso => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';
            
            const title = document.createElement('div');
            title.className = 'step-title';
            title.textContent = paso.titulo;
            stepDiv.appendChild(title);
            
            const desc = document.createElement('div');
            desc.textContent = paso.descripcion;
            stepDiv.appendChild(desc);
            
            // Mostrar tableau
            if (paso.tableau) {
                const tableauDiv = document.createElement('div');
                tableauDiv.style.overflowX = 'auto';
                tableauDiv.style.margin = '15px 0';
                
                const table = document.createElement('table');
                
                // Crear encabezados
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                headerRow.appendChild(document.createElement('th'));
                
                // Variables originales
                for (let j = 0; j < variables; j++) {
                    const th = document.createElement('th');
                    th.textContent = `x${j+1}`;
                    headerRow.appendChild(th);
                }
                
                // Variables de holgura/exceso/artificiales
                const totalColumnas = paso.tableau[0].length;
                let colActual = variables;
                
                // Variables de holgura (si)
                for (let i = 0; i < totalColumnas - variables - 1; i++) {
                    const th = document.createElement('th');
                    th.textContent = `s${i+1}`;
                    headerRow.appendChild(th);
                    colActual++;
                }
                
                // Columna RHS
                const thRHS = document.createElement('th');
                thRHS.textContent = 'RHS';
                headerRow.appendChild(thRHS);
                
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // Crear cuerpo
                const tbody = document.createElement('tbody');
                
                // Etiquetas de filas
                const etiquetas = ['W', 'Z'];
                for (let i = 1; i <= restricciones; i++) {
                    etiquetas.push(`R${i}`);
                }
                
                for (let i = 0; i < paso.tableau.length; i++) {
                    const row = document.createElement('tr');
                    
                    // Etiqueta de fila
                    const th = document.createElement('th');
                    th.textContent = etiquetas[i] || '';
                    row.appendChild(th);
                    
                    // Valores
                    for (let j = 0; j < paso.tableau[i].length; j++) {
                        const td = document.createElement('td');
                        td.textContent = paso.tableau[i][j].toFixed(2);
                        
                        // Resaltar pivote si es necesario
                        if (paso.filaPivote === i && paso.colPivote === j) {
                            td.classList.add('pivot');
                        }
                        
                        row.appendChild(td);
                    }
                    
                    tbody.appendChild(row);
                }
                
                tableauDiv.appendChild(table);
                stepDiv.appendChild(tableauDiv);
            }
            
            // Mostrar solución si existe
            if (paso.solucion) {
                const solDiv = document.createElement('div');
                solDiv.className = 'solution-card';
                
                const solTitle = document.createElement('div');
                solTitle.className = 'solution-title';
                solTitle.textContent = 'Solución:';
                solDiv.appendChild(solTitle);
                
                const solValor = document.createElement('div');
                solValor.textContent = `Valor óptimo: ${paso.solucion.valor.toFixed(4)}`;
                solDiv.appendChild(solValor);
                
                for (let i = 0; i < paso.solucion.variables.length; i++) {
                    const varDiv = document.createElement('div');
                    varDiv.textContent = `x${i+1} = ${paso.solucion.variables[i].toFixed(4)}`;
                    solDiv.appendChild(varDiv);
                }
                
                stepDiv.appendChild(solDiv);
            }
            
            pasosContainer.appendChild(stepDiv);
        });
    }
});*/

let numVars = 3;
        let numConstraints = 2;

        function setupProblem() {
            numVars = parseInt(document.getElementById('numVars').value);
            numConstraints = parseInt(document.getElementById('numConstraints').value);

            createObjectiveInputs();
            createConstraintInputs();
            document.getElementById('problemInputs').classList.remove('hidden');
        }

        function createObjectiveInputs() {
            const container = document.getElementById('objectiveInputs');
            container.innerHTML = '';
            
            const row = document.createElement('div');
            row.className = 'input-row';
            
            row.innerHTML = '<span>Z = </span>';
            
            for (let i = 0; i < numVars; i++) {
                if (i > 0) row.innerHTML += '<span> + </span>';
                row.innerHTML += `<input type="number" id="c${i}" value="0" step="0.1"> <span>x${i+1}</span>`;
            }
            
            container.appendChild(row);
        }

        function createConstraintInputs() {
            const container = document.getElementById('constraintInputs');
            container.innerHTML = '';
            
            for (let i = 0; i < numConstraints; i++) {
                const row = document.createElement('div');
                row.className = 'input-row';
                
                let html = '';
                for (let j = 0; j < numVars; j++) {
                    if (j > 0) html += '<span> + </span>';
                    html += `<input type="number" id="a${i}_${j}" value="0" step="0.1"> <span>x${j+1}</span>`;
                }
                
                html += `
                    <select id="op${i}">
                        <option value="=">=</option>
                        <option value="<=">≤</option>
                        <option value=">=">≥</option>
                    </select>
                    <input type="number" id="b${i}" value="0" step="0.1">
                `;
                
                row.innerHTML = html;
                container.appendChild(row);
            }
        }

        function solveTwoPhase() {
            try {
                const problem = getProblemData();
                const solution = twoPhaseMethod(problem);
                displaySolution(solution);
                document.getElementById('results').classList.remove('hidden');
            } catch (error) {
                displayError(error.message);
                document.getElementById('results').classList.remove('hidden');
            }
        }

        function getProblemData() {
            const c = [];
            for (let i = 0; i < numVars; i++) {
                c.push(parseFloat(document.getElementById(`c${i}`).value) || 0);
            }

            const A = [];
            const b = [];
            const operators = [];

            for (let i = 0; i < numConstraints; i++) {
                const row = [];
                for (let j = 0; j < numVars; j++) {
                    row.push(parseFloat(document.getElementById(`a${i}_${j}`).value) || 0);
                }
                A.push(row);
                b.push(parseFloat(document.getElementById(`b${i}`).value) || 0);
                operators.push(document.getElementById(`op${i}`).value);
            }

            return { c, A, b, operators };
        }

        function twoPhaseMethod(problem) {
            const steps = [];
            
            // Fase 1: Convertir a forma estándar y resolver problema auxiliar
            const phase1Problem = setupPhase1(problem);
            steps.push({
                phase: 1,
                title: "Configuración de la Fase 1",
                description: "Convertir el problema a forma estándar y crear problema auxiliar",
                tableau: [...phase1Problem.tableau]
            });

            // Resolver Fase 1
            const phase1Solution = solveSimplex(phase1Problem.tableau, 1);
            steps.push(...phase1Solution.steps);

            // Verificar factibilidad
            if (phase1Solution.objectiveValue > 1e-6) {
                throw new Error("El problema no tiene solución factible");
            }

            // Fase 2: Resolver problema original
            const phase2Problem = setupPhase2(phase1Solution.finalTableau, problem);
            steps.push({
                phase: 2,
                title: "Configuración de la Fase 2",
                description: "Eliminar variables artificiales y usar función objetivo original",
                tableau: [...phase2Problem.tableau]
            });

            const phase2Solution = solveSimplex(phase2Problem.tableau, 2);
            steps.push(...phase2Solution.steps);

            return {
                steps,
                optimalValue: -phase2Solution.objectiveValue,
                optimalSolution: extractSolution(phase2Solution.finalTableau, numVars),
                iterations: phase1Solution.iterations + phase2Solution.iterations
            };
        }

        function setupPhase1(problem) {
            const { c, A, b, operators } = problem;
            let tableau = [];
            let artificialVars = 0;
            
            // Crear tableau inicial
            for (let i = 0; i < numConstraints; i++) {
                let row = [...A[i]];
                
                // Agregar variables de holgura/exceso
                for (let j = 0; j < numConstraints; j++) {
                    if (i === j) {
                        if (operators[i] === '<=') row.push(1);
                        else if (operators[i] === '>=') row.push(-1);
                        else row.push(0);
                    } else {
                        row.push(0);
                    }
                }
                
                // Agregar variables artificiales
                for (let j = 0; j < numConstraints; j++) {
                    if (i === j && (operators[i] === '>=' || operators[i] === '=')) {
                        row.push(1);
                        artificialVars++;
                    } else {
                        row.push(0);
                    }
                }
                
                row.push(b[i]);
                tableau.push(row);
            }
            
            // Función objetivo para Fase 1 (minimizar suma de variables artificiales)
            let objRow = new Array(numVars + numConstraints + artificialVars + 1).fill(0);
            let colIndex = numVars + numConstraints;
            for (let i = 0; i < numConstraints; i++) {
                if (operators[i] === '>=' || operators[i] === '=') {
                    objRow[colIndex] = 1;
                    colIndex++;
                }
            }
            
            tableau.push(objRow);
            
            // Eliminar variables artificiales de la función objetivo
            for (let i = 0; i < numConstraints; i++) {
                if (operators[i] === '>=' || operators[i] === '=') {
                    for (let j = 0; j < tableau[0].length; j++) {
                        tableau[tableau.length - 1][j] -= tableau[i][j];
                    }
                }
            }
            
            return { tableau, artificialVars };
        }

        function setupPhase2(phase1Tableau, originalProblem) {
            // Eliminar columnas de variables artificiales
            let tableau = [];
            const numCols = numVars + numConstraints + 1;
            
            for (let i = 0; i < phase1Tableau.length - 1; i++) {
                let row = [];
                for (let j = 0; j < numCols; j++) {
                    row.push(phase1Tableau[i][j]);
                }
                tableau.push(row);
            }
            
            // Crear nueva función objetivo
            let objRow = new Array(numCols).fill(0);
            for (let i = 0; i < numVars; i++) {
                objRow[i] = -originalProblem.c[i]; // Negativo para maximización
            }
            tableau.push(objRow);
            
            return { tableau };
        }

        function solveSimplex(tableau, phase) {
            const steps = [];
            let iteration = 0;
            const maxIterations = 100;
            
            while (iteration < maxIterations) {
                // Buscar variable de entrada
                const enteringCol = findEnteringVariable(tableau);
                if (enteringCol === -1) break; // Óptimo encontrado
                
                // Buscar variable de salida
                const leavingRow = findLeavingVariable(tableau, enteringCol);
                if (leavingRow === -1) {
                    throw new Error("Problema no acotado");
                }
                
                // Realizar pivoteo
                pivot(tableau, leavingRow, enteringCol);
                
                iteration++;
                steps.push({
                    phase,
                    title: `Iteración ${iteration}`,
                    description: `Variable x${enteringCol + 1} entra, fila ${leavingRow + 1} sale`,
                    tableau: tableau.map(row => [...row])
                });
            }
            
            if (iteration >= maxIterations) {
                throw new Error("Máximo número de iteraciones alcanzado");
            }
            
            const objValue = tableau[tableau.length - 1][tableau[0].length - 1];
            
            return {
                steps,
                finalTableau: tableau,
                objectiveValue: objValue,
                iterations: iteration
            };
        }

        function findEnteringVariable(tableau) {
            const objRow = tableau[tableau.length - 1];
            let minIndex = -1;
            let minValue = 0;
            
            for (let j = 0; j < objRow.length - 1; j++) {
                if (objRow[j] < minValue) {
                    minValue = objRow[j];
                    minIndex = j;
                }
            }
            
            return minIndex;
        }

        function findLeavingVariable(tableau, enteringCol) {
            let minRatio = Infinity;
            let leavingRow = -1;
            
            for (let i = 0; i < tableau.length - 1; i++) {
                if (tableau[i][enteringCol] > 0) {
                    const ratio = tableau[i][tableau[i].length - 1] / tableau[i][enteringCol];
                    if (ratio < minRatio) {
                        minRatio = ratio;
                        leavingRow = i;
                    }
                }
            }
            
            return leavingRow;
        }

        function pivot(tableau, pivotRow, pivotCol) {
            const pivotElement = tableau[pivotRow][pivotCol];
            
            // Normalizar fila pivote
            for (let j = 0; j < tableau[pivotRow].length; j++) {
                tableau[pivotRow][j] /= pivotElement;
            }
            
            // Eliminar otras entradas en la columna pivote
            for (let i = 0; i < tableau.length; i++) {
                if (i !== pivotRow) {
                    const factor = tableau[i][pivotCol];
                    for (let j = 0; j < tableau[i].length; j++) {
                        tableau[i][j] -= factor * tableau[pivotRow][j];
                    }
                }
            }
        }

        function extractSolution(tableau, numOriginalVars) {
            const solution = new Array(numOriginalVars).fill(0);
            
            for (let j = 0; j < numOriginalVars; j++) {
                // Buscar si la variable es básica
                let isBasic = false;
                let basicRow = -1;
                let oneCount = 0;
                
                for (let i = 0; i < tableau.length - 1; i++) {
                    if (Math.abs(tableau[i][j] - 1) < 1e-6) {
                        oneCount++;
                        basicRow = i;
                    } else if (Math.abs(tableau[i][j]) > 1e-6) {
                        break;
                    }
                }
                
                if (oneCount === 1 && basicRow !== -1) {
                    solution[j] = tableau[basicRow][tableau[basicRow].length - 1];
                }
            }
            
            return solution;
        }

        function displaySolution(solution) {
            const container = document.getElementById('solution');
            container.innerHTML = '';
            
            if (solution.steps.length === 0) {
                container.innerHTML = '<div class="error-box"><strong>Error:</strong> No se pudo resolver el problema</div>';
                return;
            }
            
            // Mostrar pasos del algoritmo
            solution.steps.forEach((step, index) => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'step';
                stepDiv.innerHTML = `
                    <div class="step-title">
                        <span class="phase-indicator phase-${step.phase}">Fase ${step.phase}</span>
                        ${step.title}
                    </div>
                    <p><strong>Descripción:</strong> ${step.description}</p>
                    <div class="table-container">
                        ${createTableauHTML(step.tableau)}
                    </div>
                `;
                container.appendChild(stepDiv);
            });
            
            // Mostrar solución óptima
            const solutionDiv = document.createElement('div');
            solutionDiv.className = 'solution-box';
            solutionDiv.innerHTML = `
                <div class="solution-title">Solución Óptima Encontrada</div>
                <p><strong>Valor óptimo:</strong> Z = ${-(solution.optimalValue.toFixed(4))}</p>
                <p><strong>Variables:</strong></p>
                <ul>
                    ${solution.optimalSolution.map((val, i) => 
                        `<li>x${i+1} = ${val.toFixed(4)}</li>`
                    ).join('')}
                </ul>
                <p><strong>Total de iteraciones:</strong> ${solution.iterations}</p>
            `;
            container.appendChild(solutionDiv);
        }

        function createTableauHTML(tableau) {
            let html = '<table><thead><tr>';
            
            // Headers
            for (let j = 0; j < numVars; j++) {
                html += `<th>x${j+1}</th>`;
            }
            for (let j = 0; j < numConstraints; j++) {
                html += `<th>s${j+1}</th>`;
            }
            html += '<th>RHS</th></tr></thead><tbody>';
            
            // Filas del tableau
            for (let i = 0; i < tableau.length; i++) {
                html += '<tr>';
                for (let j = 0; j < tableau[i].length; j++) {
                    const value = Math.abs(tableau[i][j]) < 1e-10 ? 0 : tableau[i][j];
                    html += `<td>${value.toFixed(3)}</td>`;
                }
                html += '</tr>';
            }
            
            html += '</tbody></table>';
            return html;
        }

        function displayError(message) {
            const container = document.getElementById('solution');
            container.innerHTML = `<div class="error-box"><strong>Error:</strong> ${message}</div>`;
        }

        function clearResults() {
            document.getElementById('results').classList.add('hidden');
        }

        // Inicializar con problema de ejemplo
        window.onload = function() {
            setupProblem();
            
            // Ejemplo: Max Z = 3x1 + 2x2 + x3
            // s.a: x1 + x2 + x3 = 6
            //      2x1 + x2 ≤ 8
            document.getElementById('c0').value = 3;
            document.getElementById('c1').value = 2;
            document.getElementById('c2').value = 1;
            
            document.getElementById('a0_0').value = 1;
            document.getElementById('a0_1').value = 1;
            document.getElementById('a0_2').value = 1;
            document.getElementById('op0').value = '=';
            document.getElementById('b0').value = 6;
            
            document.getElementById('a1_0').value = 2;
            document.getElementById('a1_1').value = 1;
            document.getElementById('a1_2').value = 0;
            document.getElementById('op1').value = '<=';
            document.getElementById('b1').value = 8;
        };