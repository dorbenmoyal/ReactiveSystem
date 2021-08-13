/**
 * This file defines the actions of the app
 */

export const actions = {
    INIT : 'INIT',
    CHANGE_VALUE : 'CHANGE_VALUE',
    PRINT_CURRENT_STATE : 'PRINT_CURRENT_STATE'
}


export const changeValue = (payload) => {
    return {
        type: actions.CHANGE_VALUE,
        payload : payload
    };
};

export const printCurrentState = () => {
    return {
        type: actions.PRINT_CURRENT_STATE
    };
};

export const init = (payload) => {
    return {
        type: actions.INIT,
        payload : payload
    };
};