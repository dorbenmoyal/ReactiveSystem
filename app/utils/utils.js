import log from 'npmlog';

/**
 * Gets string and return if number or not
 * @str - string
 */
export function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) &&
        !isNaN(parseFloat(str))
}


/**
* Gets string in format for ex : 2,=2*{0} and return a math expression : 2*2
* @formula - the formula of the non valid expression
*/
export function getMathExp(formula, row) {
    let formatedExp = '';
    let curlyBracketsCounter = 0;
    let numbersToResolve = formula.match(/[^{\}]+(?=})/g);
    let currentInCurly = false;
    for (const c of formula) {
        if (c == '=')
            continue;

        if (c == "}") {
            currentInCurly = false;
            continue;
        }
        if (currentInCurly)
            continue;

        if (c == "{") {
            currentInCurly = true;
            formatedExp += row[numbersToResolve[curlyBracketsCounter]];
            curlyBracketsCounter++;
        }
        else
            formatedExp += c;

    }
    return formatedExp;
}

/**
 * Prints the row and warrning and errors.
 * @str - state
 */
export function printRow(state){
    let row = state.row;
    let printFormat = row.map((el,index) =>{
        return `[${index} : ${el}]`;
    });
    printWarnings(state);
    printErrors(state);


    console.log(printFormat);
}

/**
 * print warnings
 * @str - state
 */
function printWarnings(state){
    if(state.selfReferences.length>0){
        log.warn("The following cells point to themself",state.selfReferences);
    }
    if(state.eachOtherReferences.length>0){
        log.warn("The following cells points to each other ",state.eachOtherReferences);
    }

}

/**
 * print Errors
 * @str - state
 */
function printErrors(state){
    if(state.outOfBoundsIndexes!=''){
        log.error("The following cells contains References to cells that does not exist",state.outOfBoundsIndexes)
    }
    if(state.graphHasCycle){
        log.error("Cannot resolve formulas cycle reference found")

    }
}



