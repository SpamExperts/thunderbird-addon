const version = "2.0.0";

function initializeDefaultPreferences() {
    browser.storage.local.get("menu").then((item) => {
        if (Object.entries(item).length === 0) {
            browser.storage.local.set({ "menu": true })
        }
    });
    browser.storage.local.get("toolbar").then((item) => {
        if (Object.entries(item).length === 0) {
            browser.storage.local.set({ "toolbar": true })
        }
    });
    browser.storage.local.get("action").then((item) => {
        if (Object.entries(item).length === 0) {
            browser.storage.local.set({ "action": "trash" })
        }
    });
}

function createMenuAction() {
    browser.menus.create({
        id: "report",
        title: "Report spam",
        visible: true,
        onclick: (info) => {
            info?.selectedMessages?.messages?.forEach((message) => {
                browser.messages.getRaw(message.id).then((raw) => {
                    performAction(message.id);
                    sendReportToServer(raw);
                });
            });
        }
    });
}

function handleToolbarAction() {
    browser.messageDisplayAction.onClicked.addListener((tab) => {
        browser.messageDisplay.getDisplayedMessage(tab.id).then((message) => {
            browser.messages.getRaw(message.id).then((raw) => {
                performAction(message.id);
                sendReportToServer(raw);
            });
        });
    });
}

async function performAction(messageId) {
    const folders = await getFoldersForMessageAccount(messageId);
    const junkFolder = folders.find(folder => folder.type === "junk");

    browser.storage.local.get("action").then(({ action }) => {
        browser.messages.update(messageId, { "junk": true });
        switch (action) {
            case "delete":
                browser.messages.delete([ messageId ], true);
                break;
            case "trash":
                browser.messages.delete([ messageId ], false);
                break;
            case "junk":
                if (junkFolder) {
                    browser.messages.move([ messageId ], junkFolder);
                }
                break
        }
    });
}

async function getFoldersForMessageAccount(msgId) {
    let msg = await messenger.messages.get(msgId);
    let account = await messenger.accounts.get(msg.folder.accountId);
    return account.folders.reduce((a, folder) => {
        return a.concat(folder, folder.subFolders);
    }, []);
}

async function sendReportToServer(rawMessage) {
    await fetch('https://spamreport.spamrl.com/spamreport.php', {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "omit",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            'X-Reported-Via': "Expertspam/" + version + " (Thunderbird)",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: `mailContent=${ encodeURIComponent(rawMessage) }`,
    });
}

function main() {
    initializeDefaultPreferences();
    createMenuAction();
    handleToolbarAction();
}

main();
