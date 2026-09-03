// ===== Settings Module =====
// Settings panel for audio/bookmark paths
(function(){
  'use strict';

  function init(){
    bindUI();
  }

  function destroy(){}

  function bindUI(){
    const btn = $('settings-btn');
    const modal = $('settings-modal');
    const closeBtn = $('close-settings');
    const saveBtn = $('save-config');
    const cfgAudioDir = $('cfg-audio-dir');
    const cfgBookmarkDir = $('cfg-bookmark-dir');

    if(!btn || !modal) return;

    btn.addEventListener('click', async ()=>{
      const cfg = AppState.getConfig();
      cfgAudioDir.value = cfg.audioDir || '';
      cfgBookmarkDir.value = cfg.bookmarkDir || '';
      modal.style.display = 'flex';
    });

    if(closeBtn) closeBtn.addEventListener('click', ()=>{
      modal.style.display = 'none';
    });

    modal.addEventListener('click', e=>{
      if(e.target === modal) modal.style.display = 'none';
    });

    if(saveBtn) saveBtn.addEventListener('click', async ()=>{
      const audioDir = cfgAudioDir.value.trim();
      const bookmarkDir = cfgBookmarkDir.value.trim();
      if(!audioDir || !bookmarkDir){
        DomUtils.toast('路径不能为空', 'info');
        return;
      }
      const ok = await AppState.saveConfig({audioDir, bookmarkDir});
      if(ok){
        DomUtils.toast('已保存，正在重新加载...', 'success');
        modal.style.display = 'none';
        setTimeout(()=> location.reload(), 500);
      } else {
        DomUtils.toast('保存失败', 'info');
      }
    });
  }

  // Public API
  window.SettingsModule = {
    init, destroy
  };

  ModuleRegistry.register('settings', window.SettingsModule);
})();
