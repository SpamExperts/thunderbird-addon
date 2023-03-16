document.addEventListener('DOMContentLoaded', async function () {
    let { menu } = await browser.storage.local.get('menu');
    let { toolbar } = await browser.storage.local.get('toolbar');
    let { action } = await browser.storage.local.get('action');

    document.querySelector('#menu').checked = menu;
    document.querySelector('#toolbar').checked = toolbar;
    document.querySelectorAll("input[type='radio'][name=action]").forEach(radio => {
        radio.checked = radio.value === action;
    });
});

document.querySelector("form").addEventListener("change", function () {
    const menu = document.querySelector("#menu").checked;
    const toolbar = document.querySelector("#toolbar").checked;
    const action = document.querySelector("input[type='radio'][name=action]:checked").value;
    browser.storage.local.set({
        menu,
        toolbar,
        action,
    });
    browser.menus.update("report", {
        visible: menu,
    });
    if (toolbar) {
        browser.messageDisplayAction.enable();
    } else {
        browser.messageDisplayAction.disable();
    }
});
