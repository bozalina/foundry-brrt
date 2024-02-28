import AWS from "aws-sdk"

export default class Speech {
    constructor() {
        this.polly = new AWS.Polly({ apiVersion: '2016-06-10' });

        if (navigator.mediaDevices == undefined) {
            ui.notifications.warn(game.i18n.localize('Could not connect to audio devices - are you on an insecure connection such as HTTP?'))
        }
    }

    async speakText(text) {
        try {
            let voice = game.settings.get('brrt', 'voice');
            let samplerate = game.settings.get('brrt', 'samplerate');
            let engine = game.settings.get('brrt', 'engine');

            const speechParams = {
                OutputFormat: 'mp3',
                Text: text,
                VoiceId: voice,
                Engine: engine,
                SampleRate: samplerate.toString()
            };

            var signer = new AWS.Polly.Presigner(speechParams, this.polly)

            signer.getSynthesizeSpeechUrl(speechParams, (error, signedUrl) => {
                if (error) {
                    console.error('Error getting synthesize speech url:', error);
                } else {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createBufferSource();
                    fetch(signedUrl)
                        .then(response => response.arrayBuffer())
                        .then(data => audioContext.decodeAudioData(data))
                        .then(buffer => {
                            source.buffer = buffer;
                            source.connect(audioContext.destination);

                            source.start();
                        })
                        .catch(error => console.error('Error fetching or decoding audio data:', error));
                }
            });
        }
        catch (error) {
            console.error('Error speaking text:', error);
        }
    }
}
