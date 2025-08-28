//Path=*

async function Run() {
    await PageLoaded();
}

async function PageLoaded() {
    await uwc.dom.waitForElement(() => document.body);
}

Run();