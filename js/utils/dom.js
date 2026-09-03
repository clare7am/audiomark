// ===== DOM Utilities =====
(function(){
  'use strict';

  window.$ = function(id){
    return document.getElementById(id);
  };

  window.DomUtils = {
    /**
     * Show toast notification
     * @param {string} msg - message text
     * @param {'success'|'info'} type - toast type
     */
    toast(msg, type='info'){
      const el = $('toast');
      if(!el) return;
      clearTimeout(el._timer);
      el.textContent = msg;
      el.className = 'toast show ' + type;
      el._timer = setTimeout(()=> el.className = 'toast', 2500);
    },

    /**
     * Create element with attributes and children
     */
    el(tag, attrs={}, children=[]){
      const elem = document.createElement(tag);
      if(attrs.className) elem.className = attrs.className;
      if(attrs.id) elem.id = attrs.id;
      if(attrs.html !== undefined) elem.innerHTML = attrs.html;
      if(attrs.text !== undefined) elem.textContent = attrs.text;
      if(attrs.style && typeof attrs.style === 'object'){
        Object.assign(elem.style, attrs.style);
      }
      if(attrs.attrs && typeof attrs.attrs === 'object'){
        Object.entries(attrs.attrs).forEach(([k,v])=> elem.setAttribute(k, v));
      }
      if(attrs.on && typeof attrs.on === 'object'){
        Object.entries(attrs.on).forEach(([k,v])=> elem.addEventListener(k, v));
      }
      children.forEach(child=>{
        if(typeof child === 'string') elem.appendChild(document.createTextNode(child));
        else if(child instanceof Node) elem.appendChild(child);
      });
      return elem;
    }
  };
})();
