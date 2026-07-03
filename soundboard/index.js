const { createApp, ref, computed, reactive } = Vue;

createApp({
  setup() {
    // UI reactive states
    const searchQuery = ref('');
    
    // Store active HTML5 Audio Objects using their index as the key
    const activeSounds = reactive({});
    const sounds = ref(soundList);

    // Compute live filtered array output based only on Name
    const filteredSounds = computed(() => {
      return sounds.value
        .map((sound, index) => ({ ...sound, originalIndex: index })) // Track original index for playback management
        .filter(sound => sound.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
    });

    // Tracks overall count of actively playing tracks
    const playingSoundsCount = computed(() => {
      return Object.keys(activeSounds).length;
    });

    // Action handling using the array index instead of an ID
    const playSound = (sound) => {
      const idx = sound.originalIndex;
      const audio = new Audio(sound.file);
      
      // If this specific pad is already playing, stop it to restart cleanly
      if (activeSounds[idx]) {
        activeSounds[idx].pause();
        delete activeSounds[idx];
      }

      activeSounds[idx] = audio;
      audio.play().catch(err => {
        console.warn(`Could not play audio track for ${sound.name}:`, err);
        delete activeSounds[idx];
      });

      // Cleanup when audio finishes playing
      audio.onended = () => {
        delete activeSounds[idx];
      };
    };

    const stopAll = () => {
      Object.keys(activeSounds).forEach(idx => {
        activeSounds[idx].pause();
        delete activeSounds[idx];
      });
    };

    return {
      searchQuery,
      filteredSounds,
      activeSounds,
      playingSoundsCount,
      playSound,
      stopAll
    };
  }
}).mount('#app');
