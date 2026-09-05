// ===== File Tree Module =====
// Displays hierarchical file list, handles file selection
(function(){
  'use strict';

  function init(){
    console.log('[FileTree] init called');
    console.log('[FileTree] AppState.audioFiles:', AppState.get('audioFiles'));
    bindUI();
    const files = AppState.get('audioFiles');
    console.log('[FileTree] Files to render:', files ? files.length : 'null');
    if(files && files.length) renderTree(files);
    else console.warn('[FileTree] No files to render');
  }

  function destroy(){}

  function bindUI(){
    // Build tree from AppState
    EventBus.on('state:audioFiles', (files)=>{
      renderTree(files);
    });
  }

  function renderTree(files){
    const container = $('file-tree');
    if(!container || !files.length) return;

    // Build tree structure
    const tree = {};
    files.forEach(a => {
      const parts = a.path.split('/').filter(Boolean);
      let node = tree;
      parts.forEach((p, i) => {
        if(i === parts.length - 1){
          if(!node.__files__) node.__files__ = [];
          node.__files__.push(a);
        } else {
          if(!node[p]) node[p] = {};
          node = node[p];
        }
      });
    });

    container.innerHTML = renderTreeHtml(tree);
    bindClicks(container, files);
  }

  function renderNode(obj, depth){
    depth = depth || 0;
    let html = '';
    const keys = Object.keys(obj).filter(k=>k!=='__files__').sort();
    const files = obj.__files__ || [];

    keys.forEach(k => {
      const hasFiles = obj[k].__files__ && obj[k].__files__.length;
      const hasFolders = Object.keys(obj[k]).some(x=>x!=='__files__');
      if(hasFiles || hasFolders){
        const indent = depth * 16;
        html += `<div class="tree-item tree-folder" data-folder="${k}" style="padding-left:${indent + 8}px">`;
        html += `<span class="icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg></span>`;
        html += `<span class="name">${k}</span>`;
        html += `</div>`;
        html += renderNode(obj[k], depth + 1);
      }
    });

    files.forEach(f => {
      const indent = depth * 16;
      html += `<div class="tree-item tree-audio" data-name="${f.name}" style="padding-left:${indent + 8}px">`;
      html += `<span class="icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></span>`;
      html += `<span class="name">${f.name}</span>`;
      html += `</div>`;
    });

    return html;
  }

  function renderTreeHtml(obj, depth){
    return renderNode(obj, depth || 0);
  }

  function bindClicks(container, files){
    container.querySelectorAll('.tree-audio').forEach(el => {
      el.addEventListener('click', ()=>{
        const name = el.dataset.name;
        const entry = files.find(a=> a.name === name);
        if(entry) selectAudio(entry);
      });
    });
  }

  function selectAudio(entry){
    AppState.set('currentAudio', entry);
    $('current-file').textContent = entry.path;
    $('track-title').textContent = entry.name;
    $('track-path').textContent = entry.path;
    $('empty-state').style.display = 'none';
    $('player-content').style.display = 'block';

    // Highlight active
    document.querySelectorAll('.tree-item').forEach(el=> el.classList.remove('active'));
    const treeItem = document.querySelector(`.tree-audio[data-name="${CSS.escape(entry.name)}"]`);
    if(treeItem) treeItem.classList.add('active');

    PlayerModule.load(entry.url);
    EventBus.emit('audio:changed', entry);
  }

  // Public API
  window.FileTreeModule = {
    init, destroy,
    selectAudio
  };

  ModuleRegistry.register('file-tree', window.FileTreeModule);
})();
