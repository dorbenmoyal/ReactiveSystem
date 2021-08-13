import log from 'npmlog';
import { createStore } from 'redux';
import { reducer } from './reducers/reducer.js';
import { changeValue, printCurrentState, init } from '../app/actions/actions.js'
import { validateUserInput} from './validation/validtor.js';
import promptSync from 'prompt-sync';
import _ from 'lodash';
const store = createStore(reducer);
const prompt = promptSync();
const args = process.argv.slice(2);

/**
 * Application entry point
 */
function applicationStart() {
    //let args = ["=2*{1},4,=3*{1},=4*{1},=5*{1},=6*{1},=7*{1}"];
    let isArgumentsValid = validateUserInput(args);
    if (!isArgumentsValid) {
        //Exit app in case of invalid arguments
        log.error("Invalid arguments exiting process ")
        process.exit();
    }
    let userInput = args[0];
    store.dispatch(init(userInput));
    start();
}


/**
 * state prompting the Menu
 */
function start() {
    while (true) {
        promptMenu();
    }

}

/**
 * Prompt Menu to user
 */
function promptMenu() {
    // console.log("Store before:",store.getState());

    console.log('Menu:');
    console.log('       a. Print row');
    console.log('       b. Change a value');
    console.log('       c. print state (Debug)');
    console.log('       e. exit');

    const userInput = prompt();

    switch (userInput) {
        case 'a':
            store.dispatch(printCurrentState());
            break;
        case 'c':
            console.log("Store", JSON.stringify(store.getState(), undefined, 2));
            break;
        case 'e':
            process.exit();
            break;
        default:
            if (userInput.startsWith('b')) {
                store.dispatch(changeValue(userInput))
            } else {
                console.log('Invalid menu input please try again...')
            }
            break;
    }

}

applicationStart();