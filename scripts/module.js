import Speech from "./Speech.mjs";
import Settings from "./Settings.mjs";

Hooks.on('chatBubble', async (token, html, message, options) => {
    if (token.actor.id == window.game.settings.get('brrt', 'actor')) {
        await window.game.speech.speakText(message);
    }
});

Hooks.once('init', async function () {
    await Settings.registerSettings();
    window.game.speech = new Speech()
});

