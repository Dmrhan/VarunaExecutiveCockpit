export const TtsService = {
    speak: (text: string, lang: string = 'tr-TR') => {
        if (!('speechSynthesis' in window)) {
            console.warn("TTS not supported in this browser.");
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Wait for voices to load if they haven't yet (Chrome quirk)
        const loadVoicesAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();

            // Priority: Google Voice -> Microsoft Neural -> Any 'tr' voice
            let selectedVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("tr"));
            if (!selectedVoice) selectedVoice = voices.find(v => v.name.includes("Samantha") && v.lang.includes("tr")); // Common MacOS high-quality
            if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes("tr"));

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log("Selected Voice:", selectedVoice.name);
            }

            // Adjust for more natural flow
            utterance.rate = 0.9; // Slightly slower is often more intelligible and "natural"
            utterance.pitch = 1.0;

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = loadVoicesAndSpeak;
        } else {
            loadVoicesAndSpeak();
        }
    },

    stop: () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
};
