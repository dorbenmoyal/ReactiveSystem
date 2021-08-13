import {isNumeric} from '../utils/utils.js';
import log from 'npmlog';

//regex for valid user input characters
var inputArgumentsRegExp = new RegExp(/[0-9()+\-*/.=,{}\s+]/g);


/**
 * Main validation function
 * This function will validate user input in 3 steps
 * 1)Validate the use input
 * 2)Validate the input characters
 * 3)Validate the input content (and formulas)
 * @args - user argument as sended from console
 */
export function validateUserInput(args) {
    if (!validateArgsLength(args)) {
        return false;
    }
    const userInput = args[0];
    if (!validateInputCharacters(userInput)) {
        return false;
    }

    if (!validateInputContent(userInput)) {
        log.error("Invalid input:")
        log.error("Please check your input content")
        return false;
    }

    return true;
}

/**
 * Validate that the use enter only one argument
 * @args - user argument as sended from console
 */
function validateArgsLength(args) {
    if (args.length == 0) {
        log.error("Please run the app with argumet");
        return false;
    }

    if (args.length > 1) {
        log.error("Only One argument supported at time")
        return false;
    }
    return true;
}

/**
 * Validate if the characters is valid
 * @userInput - user args as a string
 */
function validateInputCharacters(userInput) {
    let regxMatchResult = userInput.match(inputArgumentsRegExp);
    if (regxMatchResult == null || regxMatchResult.length != userInput.length) {
        log.error("Invalid input:")
        log.error("Please make sure your args contains only numbers and arithmetic characters ")
        return false;
    }
    return true;
}

/**
 * Validate the content of the input and if it make sense 
 * @userInput - user args as a string
 */
function validateInputContent(userInput) {
    let splittedUsrInput = userInput.split(',');
    splittedUsrInput = splittedUsrInput.map(s=> s.trim());
    let isContentValid = splittedUsrInput.some(element => {
        if (element.charAt(0) != '=') {
            return !isNumeric(element)
        } else if (element.charAt(0)=='='){
            return !isFormulaValid(element)
        }
    });
    return !isContentValid;
}

/**
 * Validate the change command (b) 
 * @userInput - user args as a string
 */
export function validateChangeInput (userInput,state){
        let errMessage = ''
        if(userInput == null || userInput == undefined || userInput == ''){
            errMessage = "Empty input"
            return [false,errMessage];
        }

        if((userInput[0]<0) || (userInput[0]>=state.row.length)){
            errMessage = "User input index outside of range";
            return [false,errMessage];
        }
        let numCheck = !userInput.some(s=>!isNumeric(s));
        if(!numCheck){
            errMessage = "input contains non numeric values";
        }

        return [numCheck,errMessage];
}

/**
 * Validate of the formula is valid
 * @element - the formula
 */
function isFormulaValid(element){
    try{
        let mathExp = element.slice(1,element.length);
        mathExp = mathExp.replace(/}/g, '');
        mathExp = mathExp.replace(/{/g, '');
        eval(mathExp)
    }catch(ex){
        //In case of slicing failure or eval  
        return false;
    }
    return true;
}

