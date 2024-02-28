export default class Settings {
    static async registerSettings() {
        game.settings.register('brrt', 'identitypoolid', {
            name: 'AWS Identity Pool ID',
            scope: 'world',
            config: true,
            hint: 'The identity pool to get voice synthesize credentials',
            type: String,
            requiresReload: true,
            default: ''
        });

        game.settings.register('brrt', 'region', {
            name: 'AWS Region',
            scope: 'world',
            config: true,
            hint: 'The region where voices will be generated',
            choices: {
                "us-east-1": "us-east-1",
                "us-east-2": "us-east-2",
                "us-west-1": "us-west-1",
                "us-west-2": "us-east-2",
                "ca-central-1": "ca-central-1",
            },
            type: String,
            requiresReload: true,
            default: 'us-east-2'
        });

        game.settings.register('brrt', 'engine', {
            name: 'AWS Polly voice engine',
            scope: 'world',
            config: true,
            hint: 'What kind of voice engine to use',
            choices: {
                "standard": "Standard",
                "neural": "Neural",
                "long-form": "Long Form"
            },
            type: String,
            requiresReload: true,
            default: 'standard'
        });

        AWS.config.update({
            region: game.settings.get('brrt', 'region')
        });
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: game.settings.get('brrt', 'identitypoolid') });
        AWS.config.credentials.get((error) => {
            if (error) {
                ui.notifications.warn('Unable to retrieve credentials for guest identity pool.');
            }
        });

        const polly = new AWS.Polly({ apiVersion: '2016-06-10' });
        const languageCodes = ['en-AU', 'en-GB', 'en-GB-WLS', 'en-IN', 'en-US', 'en-NZ', 'en-ZA', 'en-IE'];

        async function describeVoicesForLanguage(languageCode) {
            return new Promise((resolve, reject) => {
                var params = {
                    Engine: game.settings.get('brrt', 'engine'),
                    IncludeAdditionalLanguageCodes: true,
                    LanguageCode: languageCode,
                };
                polly.describeVoices(params, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data.Voices);
                    }
                });
            });
        }

        async function fetchVoices() {
            const allVoices = [];

            for (const languageCode of languageCodes) {
                try {
                    const voices = await describeVoicesForLanguage(languageCode);
                    allVoices.push(...voices);
                } catch (error) {
                    console.error(`Error fetching voices for ${languageCode}:`, error);
                }
            }

            return allVoices;
        }

        game.settings.register('brrt', 'voice', {
            name: 'AWS Polly voice',
            scope: 'world',
            config: true,
            type: String,
            choices: (await fetchVoices()).reduce((accumulator, voice) => {
                accumulator[voice.Id] = voice.Name + ', ' + voice.Gender + ', ' + voice.LanguageName;
                return accumulator;
            }, {}),
            default: 'Geraint'
        });

        game.settings.register('brrt', 'samplerate', {
            name: 'AWS Polly sample rate',
            scope: 'world',
            config: true,
            type: Number,
            choices: {
                8000: "8000",
                16000: "16000",
                22050: "22050",
                24000: "24000"
            },
            default: 8000
        });

        game.settings.register('brrt', 'actor', {
            name: 'Actor',
            scope: 'world',
            config: true,
            hint: 'Which actor to generate a voice for',
            type: String,
            choices: game.data.actors.reduce((accumulator, actor) => {
                accumulator[actor._id] = actor.name;
                return accumulator;
            }, {}),
            default: ''
        });
    }
}