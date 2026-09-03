// ===== App State =====
// Global application state container
(function(){
  'use strict';

  const state = {
    config: {
      audioDir: '',
      bookmarkDir: '',
      modules: ['player', 'bookmarks', 'file-tree', 'settings']  // default enabled modules
    },
    audioFiles: [],       // [{name, baseName, path, url}]
    currentAudio: null,   // currently selected audio entry
    bookmarks: [],        // [{time, note}] for current audio
    playing: false,
    speed: 1
  };

  window.AppState = {
    get(key){ return state[key]; },
    set(key, value){
      state[key] = value;
      EventBus.emit('state:' + key, value);
    },
    getConfig(){ return {...state.config}; },
    setConfig(cfg){
      Object.assign(state.config, cfg);
      EventBus.emit('state:config', state.config);
    },
    // Load config from server
    async loadConfig(){
      try{
        const resp = await fetch('/api/config');
        if(!resp.ok) throw new Error('Failed');
        const data = await resp.json();
        state.config.audioDir = data.audioDir || '';
        state.config.bookmarkDir = data.bookmarkDir || '';
        state.config.modules = data.modules || state.config.modules;
        return state.config;
      }catch(e){
        console.error('Failed to load config:', e);
        return state.config;
      }
    },
    // Save config to server
    async saveConfig(cfg){
      try{
        const resp = await fetch('/api/config', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(cfg)
        });
        const data = await resp.json();
        if(data.ok){
          Object.assign(state.config, data);
          EventBus.emit('state:config', state.config);
          return true;
        }
        return false;
      }catch(e){
        console.error('Failed to save config:', e);
        return false;
      }
    },
    // Load audio file list from server
    async loadAudioList(){
      try{
        const resp = await fetch('/api/audio-list');
        if(!resp.ok) throw new Error('Failed');
        const list = await resp.json();
        state.audioFiles = list.map(item => ({
          name: item.name,
          baseName: item.name.replace(/\.[^.]+$/,''),
          path: item.path,
          url: '/audio/' + item.path
        }));
        EventBus.emit('state:audioFiles', state.audioFiles);
        return state.audioFiles;
      }catch(e){
        console.error('Failed to load audio list:', e);
        return [];
      }
    }
  };
})();
