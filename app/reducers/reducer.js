import _ from 'lodash';
import { getMathExp, printRow} from '../utils/utils.js';
import { actions } from '../actions/actions.js';
import Graph from 'graph-data-structure';
import {validateChangeInput} from '../validation/validtor.js';
import log from 'npmlog';


/**
 * Initial state of the app
 */
const initialState = {
    row: [],                   //Calculated row
    formulas: [],              //Array of formulas represented as list of tuples with index in the row array and the formula
    formulasDependencies: [],  //Array of objects {cell , dependsOnCells[]}
    selfReferences: [],        //Cells who points to themself
    eachOtherReferences: [],   //Cells who points to each other
    outOfBoundsIndexes: '',    //Indexes out of bounds 
    graph : [],                //Graph of references
    graphHasCycle : false      //Graph has a cycle

};


/**
 * The reducer which updated the state based on an action
 * @state - The initial state of the app
 * @action - The Action Sended
 */
export function reducer(state = initialState, action) {
    switch (action.type) {
        case actions.INIT:
            return calculateInitialState(state, action.payload);
        case actions.CHANGE_VALUE:
            return valueChanged(state,action.payload);
        case actions.PRINT_CURRENT_STATE:
            printRow(state);
            return state;
    }
}

/**
 * In case of value Changed event
 * @state - The current state of the app
 * @userInput - The user input
 */
function valueChanged(state,userInput){
    userInput = _.trimStart(userInput,'b').trimStart(' ');
    userInput = userInput.split(' ');
    const isValidInput = validateChangeInput(userInput,state);
    
    if(!isValidInput[0]){
        log.error(isValidInput[1])
        return state;
    }

    //look for the adjacent the the indexed the user enter
    let inputIndexAdjacent = [];
    state.formulasDependencies.forEach(f=>{
        if(f.dependsOn.includes(parseInt(userInput[0]))){
            inputIndexAdjacent.push(f.cell);
        }
    });

    
    //if there is no adjacents we simply modify the row with the new input
    if(inputIndexAdjacent.length == 0){
        state.row[userInput[0]] = userInput[1];
    }else{
        let cellsToRecalculate = state.formulas.filter(f=>inputIndexAdjacent.includes(f[0]));
        state.row[userInput[0]] = userInput[1];
        resolveChangedFormulas(state,cellsToRecalculate);
    }

    return state;
}

/**
 * function to initiate state for the first input
 * @state - The initial state of the app
 * @userInput - The userInput
 */
function calculateInitialState(state, userInput) {
    let clonedState = { ...state };
    clonedState = createRowAndIndexFormulas(clonedState, userInput);
    clonedState = calculateFormulasCellsDependencies(clonedState);
    clonedState = buildGraph(clonedState);
    clonedState = aggregateCellsReferencesMessages(clonedState);
    clonedState = resolveFormulas(clonedState);

    return clonedState;
}

/**
 * function to resolve all the formulas
 * @state - The  state of the app
 */
function resolveFormulas(state) {
    let row = state.row;
    let formulas = state.formulas;
    //Filter out the formulas that can be calculated
    let formulasToResolve = state.formulas.filter(f => !state.selfReferences.includes(f[0]));
    formulasToResolve = formulas.filter(f => !_.flatten(state.eachOtherReferences).includes(f[0]))
    formulasToResolve = filterIndexOutOfBoundsReferences(formulasToResolve, row.length, state);
    let notResolvedCounter = formulasToResolve.length;
    let isCycleInGraph = false;
    isCycleInGraph = state.graph.hasCycle();
    state.graphHasCycle = isCycleInGraph;
    while (notResolvedCounter > 0 && !isCycleInGraph) {
        formulasToResolve.forEach(f => {
            let resolveResult = resolveSingleFormula(f, row);
            if (resolveResult)
                notResolvedCounter--;
        });
    }
    return state;
}

/**
 * function to resolve only cells that were affected 
 * @state - The  state of the app
 * @changedFormulas - Only the formulas that affected from user change cell
 */
function resolveChangedFormulas(state,changedFormulas) {
    let row = state.row;
    //Filter out the formulas that can be calculated
    let notResolvedCounter = changedFormulas.length;
    while (notResolvedCounter > 0 ) {
        changedFormulas.forEach(f => {
            let resolveResult = resolveSingleFormula(f, row);
            if (resolveResult)
                notResolvedCounter--;
        });
    }
    return state;
}

/**
 * Filter out the refrences that out of range and save the error messages in the state.
 * @formulas - The formulas to check on 
 * @rowLength - The row length
 * @state - The state of the app 
 */
function filterIndexOutOfBoundsReferences(formulas, rowLength, state) {
    return formulas.filter(formula => {
        let indexesToResolve = formula[1].match(/[^{\}]+(?=})/g);
        let indexesOutOfBound = indexesToResolve?.filter(s => s >= rowLength || s < 0) == undefined? [] : indexesToResolve?.filter(s => s >= rowLength || s < 0);
        if (indexesOutOfBound?.length > 0) {
            state.outOfBoundsIndexes += `| Cell : ${formula[0]} indexes : ${indexesOutOfBound} | `;
        }
        return indexesOutOfBound?.length == 0;
    })
}

/**
 * Resolving single formula
 * @formula - formula
 * @row - The current row
 */
function resolveSingleFormula(formula, row) {

    let formulaIndex = formula[0];
    let indexesToResolve = formula[1].match(/[^{\}]+(?=})/g);
    let cannotResolve = indexesToResolve?.some(s => row[s] == null);

    if (cannotResolve)
        return false;
    let matExpressionToResolve = getMathExp(formula[1], row);
    try {
        row[formulaIndex] = eval(matExpressionToResolve);
    } catch (ex) {
        return false;
    }
    return true;
}

/**
 * Part of the initialize process this function create the row and save the indexes of the formulas
 * @userInput - the user input
 * @state - The state of the app
 */
function createRowAndIndexFormulas(state, userInput) {
    let splittedUsrInput = userInput.split(',');
    state.row = _.fill(Array(splittedUsrInput.length), null);
    splittedUsrInput = splittedUsrInput.map(s => s.trim());
    let indexedFormulas = [];
    splittedUsrInput.forEach((element, index) => {
        if (element.charAt(0) == '=')
            indexedFormulas.push([index, element]);
        else {
            state.row[index] = element;
        }
    });
    state.formulas = indexedFormulas;
    return state;
}

/**
 * Calculates the cells dependencies and save them in key value data structure which key is the cell and values
 * is the depended on indexes
 * @state - The current state of the app
 */
function calculateFormulasCellsDependencies(state) {
    let formulasDependencies = [];
    state.formulas.forEach((formula) => {
        let dependentValues = formula[1].match(/[^{\}]+(?=})/g);
        dependentValues?.forEach(dv => {
            let dvVal = parseInt(dv);
            let indexOfCurrentFormula = formulasDependencies.findIndex(f => f.cell == formula[0]);
            indexOfCurrentFormula == -1 ? formulasDependencies.push({ cell: formula[0], dependsOn: [dvVal] }) :
                formulasDependencies[indexOfCurrentFormula].dependsOn.push(dvVal);
        });
    });
    state.formulasDependencies = formulasDependencies;
    return state;
}

/**
 * Building a graph from the state.formulasDependencies
 * @state - The current state of the app
 */
function buildGraph(state){
    let graph = Graph();
    state.formulasDependencies.forEach(f=>{
        graph.addNode(f.cell);
        graph.addEdge(f.cell,f.dependsOn);
    });
    state.graph = graph;
    return state;
}

/**
 * going over the formulas Dependencies and look for :
 * 1)Self reference cells
 * 2)Each Other cells refrences
 * 3)Save them in the state
 * @state - The current state of the app
 */
function aggregateCellsReferencesMessages(state) {
    for (let element of state.formulasDependencies) {
        let currentCell = element.cell;
        let isSelfReferences = element.dependsOn.includes(currentCell) ? true : false;
        if (isSelfReferences)
            state.selfReferences.push(currentCell);//In case of self Reference

        let findCellsOfCurrentDependOnCell = state.formulasDependencies.filter(f => element.dependsOn.includes(f.cell));
        let eachOtherReferences = findCellsOfCurrentDependOnCell.filter(f => f.dependsOn.includes(currentCell));
        let pairsRefrencingLst = eachOtherReferences.map(f => { return [currentCell, f.cell] });

        //Distincts from repeating the opposits References
        pairsRefrencingLst.forEach(p => {
            let res = state.eachOtherReferences.filter(f => {
                return (f[0] == p[0] && f[1] == p[1]) || (f[0] == p[1] && f[1] == p[0])
            }).length > 0;
            if (!res && (p[0] != p[1]))
                state.eachOtherReferences.push(p);
        });
    };

    return state;
}
