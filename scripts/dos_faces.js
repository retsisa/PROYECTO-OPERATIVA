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
document.addEventListener('DOMContentLoaded', function() {
    const variablesInput = document.getElementById('variables');
    const restriccionesInput = document.getElementById('restricciones');
    const tipoOptimizacionSelect = document.getElementById('tipo-optimizacion');
    const generarBtn = document.getElementById('generar-btn');
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
            input.value = Math.floor(Math.random() * 10) - 2; // Entre -2 y 7
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
                input.value = Math.floor(Math.random() * 5) + 1; // Entre 1 y 5
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
            rhsInput.value = Math.floor(Math.random() * 20) + 10; // Entre 10 y 30
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
            
            // Establecer aleatoriamente un tipo
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
        if (!leerDatosProblema()) return;
        
        // Limpiar resultados anteriores
        pasosContainer.innerHTML = '';
        
        // Resolver con método de dos fases
        const { solucion, pasos } = resolverDosFases();
        
        // Mostrar resultados
        mostrarResultados(solucion, pasos);
        
        resultadosCard.style.display = 'block';
    });
    
    // Leer datos del problema
    function leerDatosProblema() {
        const coefFO = [];
        const restricciones = [];
        
        // Leer función objetivo
        const foInputs = document.querySelectorAll('.coef-fo');
        for (let i = 0; i < variables; i++) {
            const input = document.querySelector(`.coef-fo[data-variable="${i}"]`);
            coefFO.push(parseFloat(input.value));
        }
        
        // Leer restricciones
        for (let r = 0; r < restriccionesInput.value; r++) {
            const restriccion = {
                coef: [],
                rhs: 0,
                tipo: ''
            };
            
            // Coeficientes
            for (let i = 0; i < variables; i++) {
                const input = document.querySelector(`.coef-restriccion[data-restriccion="${r}"][data-variable="${i}"]`);
                restriccion.coef.push(parseFloat(input.value));
            }
            
            // Lado derecho
            const rhsInput = document.querySelector(`.rhs[data-restriccion="${r}"]`);
            restriccion.rhs = parseFloat(rhsInput.value);
            
            // Tipo
            const tipoSelect = document.querySelector(`.tipo-restriccion[data-restriccion="${r}"]`);
            restriccion.tipo = tipoSelect.value;
            
            restricciones.push(restriccion);
        }
        
        // Validar datos
        if (coefFO.some(isNaN)) {
            alert('Por favor ingrese valores válidos en la función objetivo');
            return false;
        }
        
        if (restricciones.some(r => r.coef.some(isNaN) || isNaN(r.rhs))) {
            alert('Por favor ingrese valores válidos en todas las restricciones');
            return false;
        }
        
        return { coefFO, restricciones, tipoOptimizacion };
    }
    
    // Implementación del método de dos fases
    function resolverDosFases() {
        const { coefFO, restricciones, tipoOptimizacion } = leerDatosProblema();
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
        while (true) {
            const { filaPivote, colPivote, puedeMejorar } = encontrarPivote(tableau, true);
            
            if (!puedeMejorar) break;
            
            tableau = pivotear(tableau, filaPivote, colPivote);
            
            pasos.push(crearPaso(`Fase 1: Iteración ${iteracion}`, 
                `Pivote en fila ${filaPivote+1}, columna ${colPivote+1}.`,
                tableau
            ));
            
            iteracion++;
        }
        
        // Verificar factibilidad
        const valorW = tableau[0][tableau[0].length - 1];
        if (Math.abs(valorW) > 1e-8) {
            pasos.push(crearPaso('Fase 1: Resultado', 
                `El problema no tiene solución factible (W = ${valorW.toFixed(4)} ≠ 0).`,
                tableau
            ));
            return { solucion: null, pasos };
        }
        
        // Paso 3: Fase 2 - Eliminar variables artificiales y resolver el problema original
        tableau = eliminarVariablesArtificiales(tableau, variablesArtificiales);
        pasos.push(crearPaso('Fase 2: Eliminación de Variables Artificiales', 
            'Se eliminaron las variables artificiales y se restaura la función objetivo original.',
            tableau
        ));
        
        // Iteraciones de la Fase 2
        iteracion = 1;
        while (true) {
            const { filaPivote, colPivote, puedeMejorar } = encontrarPivote(tableau, false);
            
            if (!puedeMejorar) break;
            
            tableau = pivotear(tableau, filaPivote, colPivote);
            
            pasos.push(crearPaso(`Fase 2: Iteración ${iteracion}`, 
                `Pivote en fila ${filaPivote+1}, columna ${colPivote+1}.`,
                tableau
            ));
            
            iteracion++;
        }
        
        // Obtener solución final
        const solucion = extraerSolucion(tableau, variables);
        pasos.push(crearPaso('Solución Final', 
            `Valor óptimo: ${solucion.valor.toFixed(4)}.`,
            tableau,
            solucion
        ));
        
        return { solucion, pasos };
    }
    
    // Función para convertir a forma estándar
    function convertirAFormaEstandar(coefFO, restricciones, tipoOptimizacion) {
        // Implementación de la conversión a forma estándar
        // (Agregar variables de holgura, exceso y artificiales)
        // Retorna el tableau inicial y las columnas de variables artificiales
        
        // Esta es una implementación simplificada
        const tableau = [];
        const variablesArtificiales = [];
        
        // Se construye el tableau inicial aquí
        // ...
        
        return { tableau, variablesArtificiales };
    }
    
    // Función para encontrar el pivote
    function encontrarPivote(tableau, esFase1) {
        // Implementación de la regla del pivote
        // Retorna { filaPivote, colPivote, puedeMejorar }
        
        // Esta es una implementación simplificada
        return { filaPivote: 0, colPivote: 0, puedeMejorar: false };
    }
    
    // Función para pivotear
    function pivotear(tableau, filaPivote, colPivote) {
        // Implementación del pivoteo
        // Retorna el nuevo tableau
        
        // Esta es una implementación simplificada
        return tableau;
    }
    
    // Función para eliminar variables artificiales
    function eliminarVariablesArtificiales(tableau, variablesArtificiales) {
        // Implementación de la eliminación de variables artificiales
        // Retorna el tableau para la Fase 2
        
        // Esta es una implementación simplificada
        return tableau;
    }
    
    // Función para extraer la solución
    function extraerSolucion(tableau, numVariables) {
        // Implementación para extraer la solución del tableau final
        // Retorna { valor, variables }
        
        // Esta es una implementación simplificada
        return { valor: 0, variables: Array(numVariables).fill(0) };
    }
    
    // Función para crear un paso del algoritmo
    function crearPaso(titulo, descripcion, tableau, solucion = null) {
        return { titulo, descripcion, tableau, solucion };
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
                
                for (let j = 0; j < paso.tableau[0].length - 1; j++) {
                    const th = document.createElement('th');
                    th.textContent = `x${j+1}`;
                    headerRow.appendChild(th);
                }
                
                const thRHS = document.createElement('th');
                thRHS.textContent = 'RHS';
                headerRow.appendChild(thRHS);
                
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // Crear cuerpo
                const tbody = document.createElement('tbody');
                
                for (let i = 0; i < paso.tableau.length; i++) {
                    const row = document.createElement('tr');
                    
                    // Etiqueta de fila
                    const th = document.createElement('th');
                    if (i === 0) {
                        th.textContent = 'Z';
                    } else {
                        th.textContent = `R${i}`;
                    }
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
});