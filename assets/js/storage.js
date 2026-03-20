
/* =========================
   Local Storage
========================= */


const appName = 'habit-tracker';
const version = "7";

var account = "main";



const storage = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : (fallback ?? null);
        } catch (e) { console.warn('Storage read error', e); return fallback ?? null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.warn('Storage write error', e); }
    }
};






var LS_KEYS = {};
let habits;
let completions;
let orderMap;
let options;

function setStorage(accountName) {

    // Load options first (account selection is stored there)
    LS_KEYS.OPTIONS = [appName, ('v' + version), 'options'].join('.');
    options = storage.get(LS_KEYS.OPTIONS, {});


    if (accountName) account = accountName;
    else if (options.selectedAccount) account = options.selectedAccount;


    LS_KEYS.HABITS = [appName, ('v' + version), account, 'habits'].join('.');
    LS_KEYS.COMPLETIONS = [appName, ('v' + version), account, 'completions'].join('.');
    LS_KEYS.ORDER = [appName, ('v' + version), account, 'orderMap'].join('.');


    habits = storage.get(LS_KEYS.HABITS, []);
    completions = storage.get(LS_KEYS.COMPLETIONS, {});
    orderMap = storage.get(LS_KEYS.ORDER, { start: [], day: [], end: [], any: [], inverse: [], interval: [] });


    options.savedAccounts = options.savedAccounts ?? [];

    // Register account in the saved accounts list if not already present
    if (!options.savedAccounts.includes(account)) {
        options.savedAccounts.push(account);
    }

    options.selectedAccount = account;

    storage.set(LS_KEYS.OPTIONS, options);
}
setStorage();



function saveAll() {
    storage.set(LS_KEYS.HABITS, habits);
    storage.set(LS_KEYS.COMPLETIONS, completions);
    storage.set(LS_KEYS.ORDER, orderMap);
    storage.set(LS_KEYS.OPTIONS, options);
}
function clearAll() {
    habits = [];
    completions = {};
    orderMap = { start: [], day: [], end: [], any: [], inverse: [], interval: [] };
    options = {};
}