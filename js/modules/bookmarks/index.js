// ===== Bookmarks Module =====
// Bookmark management: add, edit, delete, save, load
(function(){
  'use strict';

  let bookmarks = [];
  function getAudio(){ return document.getElementById('audio'); }

  function init(){
    bindUI();
    render();
    // Listen for config changes to auto-load bookmarks
    EventBus.on('audio:changed', ()=>{
      bookmarks = [];
      render();
      loadBookmarks();
    });
  }

  function destroy(){}

  function bindUI(){
    const addBtn = $('add-bookmark');
    const saveBtn = $('save-bookmarks');
    const loadBtn = $('load-bookmarks');

    if(addBtn) addBtn.addEventListener('click', addBookmark);
    if(saveBtn) saveBtn.addEventListener('click', saveBookmarks);
    if(loadBtn) loadBtn.addEventListener('click', loadBookmarks);
  }

  function addBookmark(){
    const a = getAudio();
    if(!a || !a.duration) return;
    const time = a.currentTime;
    // Avoid duplicates at same time
    const exists = bookmarks.find(b=> Math.abs(b.time - time) < 0.1);
    if(exists){
      DomUtils.toast('该时间点已有书签', 'info');
      return;
    }
    bookmarks.push({time, note: ''});
    bookmarks.sort((a,b)=> a.time - b.time);
    render();
    renderMarkers();
    DomUtils.toast(`书签已添加 ${TimeUtils.format(time)}`, 'success');
    EventBus.emit('bookmarks:changed', bookmarks);
  }

  function deleteBookmark(idx){
    bookmarks.splice(idx, 1);
    render();
    renderMarkers();
    DomUtils.toast('书签已删除', 'info');
    EventBus.emit('bookmarks:changed', bookmarks);
  }

  function updateNote(idx, value){
    bookmarks[idx].note = value;
  }

  function render(){
    const list = $('bookmarks-list');
    const count = $('bookmark-count');
    if(!list) return;

    if(count) count.textContent = bookmarks.length;

    if(!bookmarks.length){
      list.innerHTML = '<div class="no-bookmarks">暂无书签，点击按钮添加</div>';
      return;
    }

    list.innerHTML = bookmarks.map((b, i)=>`
      <div class="bookmark-card" data-idx="${i}">
        <span class="time" data-idx="${i}">${TimeUtils.format(b.time)}</span>
        <textarea class="note-area" data-idx="${i}" placeholder="添加笔记...">${b.note||''}</textarea>
        <div class="actions">
          <button class="jump" data-idx="${i}">⏯ 跳转</button>
          <button class="del" data-idx="${i}">🗑 删除</button>
        </div>
      </div>
    `).join('');

    // Bind events
    list.querySelectorAll('.time, .jump').forEach(el=>{
      el.addEventListener('click', ()=>{
        const idx = parseInt(el.dataset.idx);
        PlayerModule.seekTo(bookmarks[idx].time);
      });
    });
    list.querySelectorAll('.note-area').forEach(el=>{
      el.addEventListener('input', ()=>{
        updateNote(parseInt(el.dataset.idx), el.value);
      });
    });
    list.querySelectorAll('.del').forEach(el=>{
      el.addEventListener('click', ()=>{
        deleteBookmark(parseInt(el.dataset.idx));
      });
    });
  }

  function renderMarkers(){
    const bar = $('progress-fill')?.parentElement;
    if(!bar) return;
    bar.querySelectorAll('.bookmark-marker').forEach(m=> m.remove());
    const a = getAudio();
    if(!a || !a.duration || !bookmarks.length) return;

    bookmarks.forEach(b=>{
      const pct = (b.time / a.duration) * 100;
      const marker = document.createElement('div');
      marker.className = 'bookmark-marker';
      marker.style.left = pct + '%';
      marker.title = TimeUtils.format(b.time) + (b.note ? '\n'+b.note : '');
      marker.addEventListener('click', ()=>{
        PlayerModule.seekTo(b.time);
      });
      bar.appendChild(marker);
    });
  }

  async function loadBookmarks(){
    const entry = AppState.get('currentAudio');
    if(!entry) return;
    try{
      const resp = await fetch(`/api/bookmark/${encodeURIComponent(entry.name)}`);
      if(resp.ok){
        const data = await resp.json();
        if(data.bookmarks && data.bookmarks.length){
          bookmarks = data.bookmarks.sort((a,b)=> a.time - b.time);
          render();
          renderMarkers();
          DomUtils.toast(`自动加载 ${bookmarks.length} 个书签`, 'success');
          return;
        }
      }
    }catch(e){}
    render();
    renderMarkers();
  }

  async function saveBookmarks(){
    const entry = AppState.get('currentAudio');
    if(!bookmarks.length){
      DomUtils.toast('没有书签可保存', 'info');
      return;
    }
    const data = {
      fileName: entry.name,
      bookmarks: bookmarks.map(b=> ({time: b.time, note: b.note}))
    };
    try{
      const resp = await fetch('/api/bookmark', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      const res = await resp.json();
      if(res.ok) DomUtils.toast(`书签已保存`, 'success');
      else DomUtils.toast('保存失败: '+(res.error||''), 'info');
    }catch(e){
      DomUtils.toast('保存失败: '+e.message, 'info');
    }
  }

  // Public API
  window.BookmarkModule = {
    init, destroy,
    getAll: ()=> [...bookmarks],
    add: addBookmark,
    delete: deleteBookmark,
    updateNote,
    load: loadBookmarks,
    save: saveBookmarks
  };

  ModuleRegistry.register('bookmarks', window.BookmarkModule);
})();
