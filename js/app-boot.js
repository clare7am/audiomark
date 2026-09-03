// ===== Bootstrap =====
// Application entry point: load config, init modules
(function(){
  'use strict';

  async function boot(){
    console.log('[1] Boot starting...');

    // Load config
    const config = await AppState.loadConfig();
    console.log('[2] Config loaded:', config);

    // Initialize modules FIRST (so event listeners are registered)
    console.log('[3] Initializing modules...');
    ModuleRegistry.initAll(config.modules);
    console.log('[3] Modules init done');

    // Load audio list (emits state:audioFiles event)
    console.log('[4] Loading audio list...');
    const files = await AppState.loadAudioList();
    console.log('[4] Files found:', files.length);

    if(!files.length){
      console.warn('[4] No audio files found');
      const fileTree = $('file-tree');
      if(fileTree) fileTree.innerHTML = '<div style="padding:20px;color:var(--text3);text-align:center">audio 文件夹为空<br>请放入音频文件后刷新页面</div>';
      return;
    }

    // Auto-select first audio
    const firstFile = files[0];
    console.log('[5] Selecting:', firstFile.name);
    AppState.set('currentAudio', firstFile);

    // Update UI
    $('current-file').textContent = firstFile.path;
    $('track-title').textContent = firstFile.name;
    $('track-path').textContent = firstFile.path;
    $('empty-state').style.display = 'none';
    $('player-content').style.display = 'block';
    $('progress-fill').style.width = '0%';
    $('time-current').textContent = '00:00';

    // Load audio player
    console.log('[6] Loading audio...');
    PlayerModule.load(firstFile.url);
    EventBus.emit('audio:changed', firstFile);

    console.log('[7] Boot complete!');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
