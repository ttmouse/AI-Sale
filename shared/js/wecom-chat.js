// ============================================================
// 企微聊天组件 — 可复用的 WeCom 风格聊天界面
// 直接复用场景9的UI元素，供各场景调用
// 使用: <div id="phone-container"></div>
//       WecomChat.render('phone-container');
//       WecomChat.addMessage('customer', '内容');
// ============================================================

const WecomChat = (() => {
  'use strict';

  // ===== 注入 CSS（首次调用时注入一次）=====
  var _cssInjected = false;
  function _injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;
    var css = ''
      + '#phone { width:375px; height:812px; background:#000; border-radius:40px; overflow:hidden; position:relative; display:flex; flex-direction:column; flex-shrink:0; }'
      + '#top-bar { flex-shrink:0; position:relative; z-index:100; }'
      + '#status-bar { display:flex; align-items:center; justify-content:space-between; height:28px; padding:0 20px; background:#0C0C0E; flex-shrink:0; }'
      + '#status-time { font-size:12px; font-weight:600; color:rgba(255,255,255,.9); font-family:-apple-system,BlinkMacSystemFont,sans-serif; }'
      + '#status-icons { display:flex; align-items:center; gap:5px; }'
      + '#status-icons svg { display:block; }'
      + '#nav-bar { display:flex; align-items:center; justify-content:space-between; height:44px; padding:0 12px; background:#0C0C0E; flex-shrink:0; }'
      + '#nav-back { background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center; color:rgba(255,255,255,.9); }'
      + '#nav-title { flex:1; text-align:center; font-size:16px; font-weight:500; color:rgba(255,255,255,.9); font-family:-apple-system,BlinkMacSystemFont,sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 8px; }'
      + '#nav-menu { background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center; color:rgba(255,255,255,.9); }'
      + '#chat-area { flex:1; overflow-y:auto; overflow-x:hidden; padding:16px 14px 12px; background:#000; position:relative; z-index:1; scroll-behavior:smooth; }'
      + '#chat-area::-webkit-scrollbar { width:3px; }'
      + '#chat-area::-webkit-scrollbar-track { background:transparent; }'
      + '#chat-area::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:2px; }'
      + '#messages { display:flex; flex-direction:column; gap:14px; min-height:100%; }'
      + '.msg { max-width:82%; animation:msgIn .35s ease-out; flex-shrink:0; line-height:1.5; }'
      + '@keyframes msgIn { 0%{opacity:0;transform:translateY(6px) scale(.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }'
      + '.msg-customer { align-self:flex-start; display:flex; align-items:flex-start; gap:14px; max-width:82%; }'
      + '.msg-customer .msg-avatar { width:40px; height:40px; border-radius:4px; background:#3a3a3e; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.7); font-size:14px; font-weight:600; flex-shrink:0; }'
      + '.msg-customer .msg-bubble { position:relative; }'
      + '.msg-customer .msg-bubble .msg-content { background:#2C2C2C; color:#D5D5D5; padding:10px 12px; border-radius:4px; font-size:15px; word-break:break-word; line-height:1.5; }'
      + '.msg-customer .msg-bubble::before { content:""; position:absolute; top:14px; left:-5px; width:0; height:0; border:5px solid transparent; border-right-color:#2C2C2C; border-left:0; border-bottom-width:4px; border-top-width:6px; }'
      + '.msg-sales { align-self:flex-end; display:flex; align-items:flex-start; gap:14px; max-width:82%; }'
      + '.msg-sales .msg-avatar { width:40px; height:40px; border-radius:4px; background:#075A9A; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:600; flex-shrink:0; }'
      + '.msg-sales .msg-bubble { position:relative; }'
      + '.msg-sales .msg-bubble .msg-content { background:#075A9A; color:#fff; padding:10px 12px; border-radius:4px; font-size:15px; word-break:break-word; line-height:1.5; }'
      + '.msg-sales .msg-bubble::before { content:""; position:absolute; top:14px; right:-5px; width:0; height:0; border:5px solid transparent; border-right:0; border-left-color:#075A9A; border-bottom-width:4px; border-top-width:6px; }'

      + '#toolbar { background:#0C0C0E; border-top:0.5px solid rgba(255,255,255,.06); flex-shrink:0; position:relative; z-index:50; padding:8px 0; }'
      + '.tool-scroll { display:flex; gap:10px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; padding:0 12px; scrollbar-width:none; }'
      + '.tool-scroll::-webkit-scrollbar { display:none; }'
      + '.tool-btn { display:flex; align-items:center; gap:7px; padding:0 15px; background:#2a2a2e; border:none; border-radius:18px; color:rgba(255,255,255,.85); font-size:14px; cursor:pointer; transition:all .15s; white-space:nowrap; flex-shrink:0; height:36px; font-family:inherit; }'
      + '.tool-btn:active { background:#3a3a3e; transform:scale(.96); }'
      + '.tool-btn .tool-icon { width:17px; height:17px; flex-shrink:0; color:rgba(255,255,255,.65); display:block; }'
      + '.tool-btn .tool-label { font-size:14px; font-weight:400; letter-spacing:.3px; color:rgba(255,255,255,.85); }'
      + '#input-bar { display:flex; align-items:center; gap:0; padding:8px 12px; background:#0C0C0E; flex-shrink:0; }'
      + '#input-bar .attach-btn { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; background:transparent; cursor:pointer; flex-shrink:0; }'
      + '#input-bar .attach-btn svg { width:28px; height:28px; fill:rgba(255,255,255,.9); }'
      + '#input-bar input { flex:1; height:40px; border-radius:8px; border:none; background:#27282C; color:#e5e5e5; padding:0 14px; font-size:15px; outline:none; margin:0 8px; }'
      + '#input-bar input::placeholder { color:rgba(255,255,255,.3); }'
      + '#input-bar .right-btn { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; background:transparent; cursor:pointer; flex-shrink:0; transition:all .15s; }'
      + '#input-bar .right-btn:active { background:rgba(255,255,255,.1); }'
      + '#input-bar .right-btn svg { width:24px; height:24px; fill:rgba(255,255,255,.9); }'
      + '.fp-overlay { position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,.5); z-index:200; opacity:0; pointer-events:none; transition:opacity .3s ease; }'
      + '.fp-overlay.open { opacity:1; pointer-events:auto; }'
      + '.fp-page { position:absolute; top:0; left:0; width:100%; height:100%; background:#111214; z-index:210; transform:translateY(100%); transition:transform .35s cubic-bezier(.22,1,.36,1); display:flex; flex-direction:column; overflow:hidden; will-change:transform; }'
      + '.fp-page.open { transform:translateY(0); }'
      + '.fp-header { display:flex; align-items:center; height:52px; padding:0 12px; background:#111214; border-bottom:0.5px solid rgba(255,255,255,.06); flex-shrink:0; }'
      + '.fp-close { width:44px; height:44px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; color:rgba(255,255,255,.9); font-size:26px; cursor:pointer; flex-shrink:0; }'
      + '.fp-close:active { opacity:.6; }'
      + '.fp-title { flex:1; text-align:center; font-size:17px; font-weight:500; color:rgba(255,255,255,.9); }'
      + '.fp-spacer { width:44px; flex-shrink:0; }'
      + '.fp-body { flex:1; overflow-y:auto; padding:16px; background:#111214; }'
      + '.fp-body::-webkit-scrollbar { width:3px; }'
      + '.fp-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:2px; }'
      + '.sb-section { margin-bottom:16px; }'
      + '.sb-section-title { font-size:11px; font-weight:600; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px; }'
      + '.sb-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:0.5px solid rgba(255,255,255,.05); font-size:13px; }'
      + '.sb-row:last-child { border-bottom:none; }'
      + '.sb-key { color:rgba(255,255,255,.4); min-width:72px; flex-shrink:0; font-size:12px; }'
      + '.sb-val { color:rgba(255,255,255,.85); font-weight:500; }'
      + '.sb-val-empty { color:rgba(255,255,255,.25); font-weight:300; font-style:italic; }'
      + '.sb-section-divider { height:0.5px; background:rgba(255,255,255,.06); margin:4px 0 12px; }'
      + '.sb-progress-dots { display:flex; align-items:center; gap:2px; padding:6px 0; }'
      + '.sb-pdot { width:10px; height:10px; border-radius:50%; background:rgba(255,255,255,.12); flex-shrink:0; }'
      + '.sb-pdot.done { background:#10B981; }'
      + '.sb-pdot.cur { background:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,.2); }'
      + '.sb-pbar { flex:1; height:3px; background:rgba(255,255,255,.08); border-radius:2px; }'
      + '.sb-pbar.filled { background:#10B981; }'
      + '.sb-check { font-size:12px; color:rgba(255,255,255,.55); padding:4px 0; padding-left:14px; position:relative; line-height:1.5; }'
      + '.sb-check::before { content:"\u2713"; position:absolute; left:0; color:#10B981; font-weight:700; }'
      + '.sb-pending { font-size:12px; color:rgba(255,255,255,.3); padding:4px 0; padding-left:14px; position:relative; line-height:1.5; }'
      + '.sb-pending::before { content:"\u25A1"; position:absolute; left:0; color:rgba(255,255,255,.2); }'
      + '.sb-flow-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border:0.5px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); border-radius:6px; font-size:12px; cursor:pointer; color:rgba(255,255,255,.7); margin:3px; transition:all .15s; font-family:inherit; }'
      + '.sb-flow-btn:active { background:rgba(255,255,255,.1); transform:scale(.96); }'
      + '.sb-flow-btn svg { width:14px; height:14px; }'
      + '.sb-tag { display:inline-block; padding:3px 10px; background:rgba(255,255,255,.05); border:0.5px solid rgba(255,255,255,.08); border-radius:14px; font-size:12px; color:rgba(255,255,255,.5); margin:3px; }'
      + '.sb-next-sug { font-size:14px; font-weight:600; color:rgba(255,255,255,.85); margin-bottom:6px; line-height:1.4; }'
      + '.sb-next-reason { font-size:12px; color:rgba(255,255,255,.35); margin-bottom:8px; line-height:1.5; }'
      + '.sb-next-script { background:rgba(255,255,255,.03); border:0.5px solid rgba(255,255,255,.08); border-radius:8px; padding:10px 12px; font-size:12px; color:rgba(255,255,255,.5); line-height:1.6; }'
      + '.sb-stage-info { font-size:12px; color:rgba(255,255,255,.45); padding:4px 0 6px; }'
      + '.sb-stage-info strong { color:rgba(255,255,255,.8); }'
      + '.sb-stage-change { display:inline-block; padding:1px 6px; background:#FEF3C7; color:#92400E; border-radius:3px; font-size:10px; font-weight:600; margin-left:4px; }'
      + '.sb-copy-btn { margin-top:6px; padding:6px 14px; border:0.5px solid rgba(7,90,154,.4); background:rgba(7,90,154,.2); color:#60A5FA; border-radius:6px; font-size:12px; cursor:pointer; font-family:inherit; transition:all .15s; }'
      + '.sb-copy-btn:hover { background:rgba(7,90,154,.3); }'
      + '.sb-copy-btn:active { transform:scale(.96); }'
      + '.ht-entry { padding:10px 0; border-bottom:0.5px solid rgba(255,255,255,.05); }'
      + '.ht-entry:last-child { border-bottom:none; }'
      + '.ht-time { font-size:10px; color:rgba(255,255,255,.3); font-family:"Geist Mono",monospace; margin-bottom:4px; }'
      + '.ht-item { display:flex; align-items:flex-start; gap:6px; padding:3px 0; font-size:12px; line-height:1.5; }'
      + '.ht-badge { display:inline-block; padding:1px 6px; border-radius:3px; font-size:9px; font-weight:600; color:#fff; flex-shrink:0; margin-top:1px; }'
      + '.ht-badge-stage { background:#8B5CF6; }'
      + '.ht-badge-field { background:#3B82F6; }'
      + '.ht-badge-done { background:#10B981; }'
      + '.ht-badge-init { background:#6B7280; }'
      + '.ht-text { color:rgba(255,255,255,.65); }'
      + '.ht-empty { font-size:12px; color:rgba(255,255,255,.25); text-align:center; padding:30px 0; }'
      + '.sb-tabs { display:flex; border-bottom:0.5px solid rgba(255,255,255,.06); margin-bottom:12px; }'
      + '.sb-tab { flex:1; padding:8px 0; font-size:12px; color:rgba(255,255,255,.4); text-align:center; cursor:pointer; border:none; background:none; font-family:inherit; transition:all .15s; border-bottom:2px solid transparent; }'
      + '.sb-tab.active { color:#60A5FA; border-bottom-color:#60A5FA; }'
      + '.sb-tab:active { opacity:.7; }'
      + '.sb-tab.disabled { color:rgba(255,255,255,.15); cursor:default; }'
      + '.sb-order-empty { font-size:12px; color:rgba(255,255,255,.3); text-align:center; padding:20px 16px; line-height:1.6; }'
      + '.sb-order-item { padding:8px 0; border-bottom:0.5px solid rgba(255,255,255,.05); }'
      + '.sb-order-item:last-child { border-bottom:none; }'
      + '.sb-order-label { font-size:10px; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.04em; margin-bottom:2px; }'
      + '.sb-order-value { font-size:13px; color:rgba(255,255,255,.8); font-weight:500; }';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ===== HTML 模板 =====
  function phoneHTML() {
    return '<div id="phone">'
      + '  <div id="top-bar">'
      + '    <div id="status-bar">'
      + '      <span id="status-time">9:41</span>'
      + '      <div id="status-icons">'
      + '        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="0.5" fill="white" fill-opacity="0.9"/><rect x="4.5" y="4.5" width="3" height="7.5" rx="0.5" fill="white" fill-opacity="0.9"/><rect x="9" y="2" width="3" height="10" rx="0.5" fill="white" fill-opacity="0.9"/><rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="white" fill-opacity="0.9"/></svg>'
      + '        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="white" fill-opacity="0.9"/><path d="M8 6.7c-1.2 0-2.3.5-3.1 1.2l.9.9c.6-.5 1.4-.8 2.2-.8s1.6.3 2.2.8l.9-.9c-.8-.7-1.9-1.2-3.1-1.2z" fill="white" fill-opacity="0.9"/><path d="M8 3.5c-2.2 0-4.2.9-5.7 2.3l.9.9C4.4 5.5 6.1 4.8 8 4.8s3.6.7 4.8 1.9l.9-.9C12.2 4.4 10.2 3.5 8 3.5z" fill="white" fill-opacity="0.9"/></svg>'
      + '        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="1" width="19" height="10" rx="2.5" stroke="white" stroke-opacity="0.9" fill="none"/><rect x="20" y="3.5" width="3" height="5" rx="1" fill="white" fill-opacity="0.4"/><rect x="2" y="2.5" width="16" height="7" rx="1.5" fill="white" fill-opacity="0.9"/></svg>'
      + '      </div>'
      + '    </div>'
      + '    <div id="nav-bar">'
      + '      <button id="nav-back"><svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9l8 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
      + '      <span id="nav-title">' + _title + '</span>'
      + '      <button id="nav-menu"><svg width="18" height="4" viewBox="0 0 18 4" fill="none"><circle cx="2" cy="2" r="2" fill="white" fill-opacity="0.9"/><circle cx="9" cy="2" r="2" fill="white" fill-opacity="0.9"/><circle cx="16" cy="2" r="2" fill="white" fill-opacity="0.9"/></svg></button>'
      + '    </div>'
      + '  </div>'
      + '  <div id="chat-area">'
      + '    <div id="messages"></div>'
      + '  </div>'
      + '  <div id="toolbar">'
      + '    <div class="tool-scroll">'
      + TOOLBAR_BTNS
      + '    </div>'
      + '  </div>'
      + '  <div id="input-bar">'
      + '    <button class="attach-btn">'
      + '      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '        <g transform="translate(-10, -14)">'
      + '          <path d="M23.9998 14.6667C31.3634 14.6667 37.3326 20.636 37.3328 27.9997C37.3328 35.3635 31.3636 41.3327 23.9998 41.3327C16.6361 41.3325 10.6667 35.3634 10.6667 27.9997C10.6669 20.6362 16.6362 14.6669 23.9998 14.6667ZM23.9998 16.2663C17.5199 16.2665 12.2665 21.5198 12.2664 27.9997C12.2664 34.4797 17.5198 39.7329 23.9998 39.7331C30.4799 39.7331 35.7332 34.4798 35.7332 27.9997C35.733 21.5197 30.4798 16.2663 23.9998 16.2663ZM25.5427 20.4577C27.4728 22.3879 28.6667 25.0544 28.6667 27.9997C28.6667 30.9452 27.473 33.6124 25.5427 35.5427L24.4109 34.4108C26.1013 32.7204 27.0671 30.4385 27.0671 27.9997C27.0671 25.561 26.1012 23.2789 24.4109 21.5886L25.5427 20.4577ZM22.9031 23.0974C24.1576 24.352 24.9333 26.0853 24.9333 27.9997C24.9333 29.9143 24.1578 31.6483 22.9031 32.903L21.7712 31.7712C22.766 30.7764 23.3337 29.4349 23.3337 27.9997C23.3337 26.5647 22.7658 25.2239 21.7712 24.2292L22.9031 23.0974ZM20.2625 25.737C20.8415 26.316 21.1999 27.1162 21.2 27.9997C21.2 28.8834 20.8415 29.6833 20.2625 30.2624L17.9998 27.9997L20.2625 25.737Z" fill="white" fill-opacity="0.9"/>'
      + '        </g>'
      + '      </svg>'
      + '    </button>'
      + '    <input type="text" placeholder="输入消息...">'
      + '    <button class="right-btn">'
      + '      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '        <g transform="translate(-297, -14)">'
      + '          <path d="M311 14.6667C318.363 14.6667 324.333 20.636 324.333 27.9997C324.333 35.3635 318.364 41.3327 311 41.3327C303.636 41.3325 297.667 35.3634 297.667 27.9997C297.667 20.6362 303.636 14.6669 311 14.6667ZM311 16.2663C304.52 16.2665 299.267 21.5198 299.266 27.9997C299.266 34.4797 304.52 39.7329 311 39.7331C317.48 39.7331 322.733 34.4798 322.733 27.9997C322.733 21.5197 317.48 16.2663 311 16.2663ZM319 28.6667C319 33.0848 315.418 36.6667 311 36.6667C306.582 36.6665 303 33.0847 303 28.6667H319ZM304.802 30.2663C305.512 33.0266 308.018 35.066 311 35.0661C313.982 35.0661 316.488 33.0267 317.198 30.2663H304.802ZM306.334 21.9997C307.438 21.9999 308.334 22.8954 308.334 23.9997C308.334 25.1042 307.438 25.9995 306.334 25.9997C305.229 25.9997 304.334 25.1043 304.334 23.9997C304.334 22.8953 305.229 21.9997 306.334 21.9997ZM315.667 21.9997C316.771 21.9997 317.667 22.8953 317.667 23.9997C317.667 25.1043 316.771 25.9997 315.667 25.9997C314.562 25.9997 313.667 25.1043 313.667 23.9997C313.667 22.8953 314.562 21.9997 315.667 21.9997Z" fill="white" fill-opacity="0.9"/>'
      + '        </g>'
      + '      </svg>'
      + '    </button>'
      + '    <button class="right-btn">'
      + '      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '        <g transform="translate(-337, -14)">'
      + '          <path d="M351 14.6667C358.363 14.6667 364.333 20.636 364.333 27.9997C364.333 35.3635 358.364 41.3327 351 41.3327C343.636 41.3325 337.667 35.3634 337.667 27.9997C337.667 20.6362 343.636 14.6669 351 14.6667ZM351 16.2663C344.52 16.2665 339.267 21.5198 339.266 27.9997C339.266 34.4797 344.52 39.7329 351 39.7331C357.48 39.7331 362.733 34.4798 362.733 27.9997C362.733 21.5197 357.48 16.2663 351 16.2663ZM351.801 27.1999H357.667V28.8005H351.801V34.6667H350.2V28.8005H344.334V27.1999H350.2V21.3337H351.801V27.1999Z" fill="white" fill-opacity="0.9"/>'
      + '        </g>'
      + '      </svg>'
      + '    </button>'
      + '  </div>'
      + '  <div class="fp-overlay" id="profile-overlay"></div>'
      + '  <div class="fp-page" id="profile-page">'
      + '    <div class="fp-header">'
      + '      <button class="fp-close" id="profile-close">&times;</button>'
      + '      <span class="fp-title">客户画像</span>'
      + '      <span class="fp-spacer"></span>'
      + '    </div>'
      + '    <div class="fp-body" id="profile-body"></div>'
      + '  </div>'
      + '  <div class="fp-page" id="history-page">'
      + '    <div class="fp-header">'
      + '      <button class="fp-close" id="history-back">&larr;</button>'
      + '      <span class="fp-title">跟进记录</span>'
      + '      <span class="fp-spacer"></span>'
      + '    </div>'
      + '    <div class="fp-body" id="history-body"></div>'
      + '  </div>'
      + '</div>';
  }

  // ===== 工具栏按钮 HTML =====
  var TOOLBAR_BTNS = ''
    + '<button class="tool-btn" id="btn-customer-profile">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    + '  <span class="tool-label">客户画像</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16l-6.4 4.8L8 14l-6-4.8h7.6z"/></svg>'
    + '  <span class="tool-label">AI 分析</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    + '  <span class="tool-label">快捷回复</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
    + '  <span class="tool-label">产品图鉴</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    + '  <span class="tool-label">异议话术</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    + '  <span class="tool-label">客户标签</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
    + '  <span class="tool-label">发送方案</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
    + '  <span class="tool-label">预约试菜</span>'
    + '</button>';

  var _title = '企业微信';
  var _customerName = '';
  var _salesName = '';
  var _history = [];
  var _prevAnnKey = '';
  var _currentAnn = null;
  var _activeTab = 'profile';

  // ===== 设置标题 =====
  function setTitle(title) {
    _title = title || '企业微信';
    _customerName = _title;
    var el = document.getElementById('nav-title');
    if (el) el.textContent = _title;
  }

  // ===== 设置销售信息 =====
  function setSalesInfo(salesName) {
    _salesName = salesName || '';
  }

  // ===== 全屏页面：打开/关闭 =====
  function openProfile() {
    var page = document.getElementById('profile-page');
    var overlay = document.getElementById('profile-overlay');
    if (page && overlay) { page.classList.add('open'); overlay.classList.add('open'); }
  }
  function closeProfile() {
    var page = document.getElementById('profile-page');
    var overlay = document.getElementById('profile-overlay');
    var historyPage = document.getElementById('history-page');
    if (historyPage) historyPage.classList.remove('open');
    if (page && overlay) { page.classList.remove('open'); overlay.classList.remove('open'); }
  }

  // ===== 历史记录页面：打开/关闭 =====
  function openHistory() {
    var historyPage = document.getElementById('history-page');
    var overlay = document.getElementById('profile-overlay');
    if (!historyPage) return;
    if (overlay) overlay.classList.add('open');

    var body = document.getElementById('history-body');
    if (body) {
      var html = '';
      if (_history.length === 0) {
        html = '<div class="ht-empty">暂无跟进记录</div>';
      } else {
        for (var i = _history.length - 1; i >= 0; i--) {
          var entry = _history[i];
          html += '<div class="ht-entry">';
          html += '<div class="ht-time">' + entry.time + '</div>';
          entry.items.forEach(function(item) {
            var badgeCls = 'ht-badge';
            if (item.t === '\u9636\u6BB5\u63A8\u8FDB') badgeCls += ' ht-badge-stage';
            else if (item.t === '\u5B57\u6BB5\u66F4\u65B0') badgeCls += ' ht-badge-field';
            else if (item.t === '\u5B8C\u6210') badgeCls += ' ht-badge-done';
            html += '<div class="ht-item"><span class="' + badgeCls + '">' + item.t + '</span><span class="ht-text">' + item.d + '</span></div>';
          });
          html += '</div>';
        }
      }
      body.innerHTML = html;
    }
    historyPage.classList.add('open');
  }
  function closeHistory() {
    var historyPage = document.getElementById('history-page');
    if (historyPage) historyPage.classList.remove('open');
  }

  // ===== 更新侧边栏内容（含标签页）=====
  function updateSidebar(ann) {
    if (!ann) return;

    // --- 变更检测：追加历史记录 ---
    var currKey = JSON.stringify({
      stage: ann.progress ? ann.progress.currentStage : null,
      stageChange: ann.progress ? ann.progress.stageChange : null,
      fields: ann.fields ? Object.keys(ann.fields).reduce(function(o,k){
        o[k] = (ann.fields[k]||{}).value; return o;
      }, {}) : null,
      completed: ann.progress ? (ann.progress.completed||[]) : [],
    });
    if (_prevAnnKey && currKey !== _prevAnnKey) {
      var prev = JSON.parse(_prevAnnKey);
      var entries = [];
      if (ann.progress && ann.progress.stageChange) {
        entries.push({ t: '\u9636\u6BB5\u63A8\u8FDB', d: ann.progress.currentStage + ' \u00B7 ' + ann.progress.stageChange });
      }
      if (ann.fields && prev.fields) {
        Object.keys(ann.fields).forEach(function(k) {
          var cv = (ann.fields[k]||{}).value;
          var pv = prev.fields[k];
          if (cv && cv !== pv) {
            entries.push({ t: '\u5B57\u6BB5\u66F4\u65B0', d: k + '\uFF1A' + (pv || '\u7A7A') + ' \u2192 ' + cv });
          }
        });
      }
      if (ann.progress && ann.progress.completed) {
        var newDone = ann.progress.completed.filter(function(item) {
          return prev.completed.indexOf(item) === -1;
        });
        newDone.forEach(function(item) { entries.push({ t: '\u5B8C\u6210', d: item }); });
      }
      if (entries.length > 0) {
        var time = new Date();
        var ts = time.getHours().toString().padStart(2,'0') + ':' + time.getMinutes().toString().padStart(2,'0');
        _history.push({ time: ts, items: entries });
      }
    }
    _prevAnnKey = currKey;
    _currentAnn = ann;

    // 初始记录：客户来源+渠道
    if (_history.length === 0) {
      var source = '';
      if (ann.fields && ann.fields['\u5BA2\u6237\u6765\u6E90']) source = ann.fields['\u5BA2\u6237\u6765\u6E90'].value;
      var intent = '';
      if (ann.fields && ann.fields['\u521D\u59CB\u610F\u5411']) intent = ann.fields['\u521D\u59CB\u610F\u5411'].value;
      var initItems = [{ t: '\u5BA2\u6237\u6DFB\u52A0', d: '\u6765\u6E90\uFF1A' + (source || '\u672A\u77E5') }];
      if (intent) initItems.push({ t: '\u521D\u59CB\u610F\u5411', d: intent });
      var now = new Date();
      _history.push({
        time: now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0'),
        items: initItems
      });
    }

    _renderBody();
  }

  // ===== 渲染主体内容 =====
  function _renderBody() {
    var body = document.getElementById('profile-body');
    if (!body || !_currentAnn) return;
    var ann = _currentAnn;

    var html = '';

    // 联系信息栏
    html += '<div style="display:flex;align-items:center;gap:10px;padding:0 0 12px 0;border-bottom:0.5px solid rgba(255,255,255,.06);margin-bottom:12px;">';
    html += '<div style="width:36px;height:36px;border-radius:50%;background:#075A9A;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:600;flex-shrink:0;">\u9500</div>';
    var sourceVal = '';
    if (ann.fields && ann.fields['\u5BA2\u6237\u6765\u6E90']) sourceVal = ann.fields['\u5BA2\u6237\u6765\u6E90'].value;
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="font-size:14px;font-weight:600;color:rgba(255,255,255,.9);">' + (_customerName || '\u5BA2\u6237') + '</div>';
    html += '<div style="font-size:11px;color:rgba(255,255,255,.4);">\u9500\u552E\uFF1A' + (_salesName || '\u672A\u77E5') + (sourceVal ? ' | \u6765\u6E90\uFF1A' + sourceVal : '') + '</div>';
    html += '</div>';
    html += '</div>';

    // Tab 切换栏
    var allStages = ['P1','P2','P3','P4','P5','P6','P7'];
    var curStage = ann.progress ? ann.progress.currentStage : 'P1';
    var stageIdx = allStages.indexOf(curStage);
    var hasOrder = stageIdx >= 4;

    html += '<div class="sb-tabs">';
    html += '<button class="sb-tab' + (_activeTab === 'profile' ? ' active' : '') + '" data-tab="profile">\u753B\u50CF</button>';
    html += '<button class="sb-tab' + (_activeTab === 'history' ? ' active' : '') + '" data-tab="history">\u8BB0\u5F55</button>';
    html += '<button class="sb-tab' + (hasOrder ? '' : ' disabled') + (_activeTab === 'order' ? ' active' : '') + '" data-tab="order">\u8BA2\u5355</button>';

    html += '</div>';

    // 标签页内容
    if (_activeTab === 'profile') {
      html += _renderProfileTab(ann);
    } else if (_activeTab === 'history') {
      html += _renderHistoryTab();
    } else if (_activeTab === 'order') {
      html += _renderOrderTab(ann, hasOrder);
    }

    body.innerHTML = html;
  }

  function _renderProfileTab(ann) {
    var h = '';

    // 下一步建议
    if (ann.nextAction) {
      var na = ann.nextAction;
      h += '<div class="sb-section">';
      h += '<div class="sb-section-title">\u4E0B\u4E00\u6B65\u5EFA\u8BAE</div>';
      h += '<div class="sb-next-sug">' + na.suggestion + '</div>';
      if (na.reason) h += '<div class="sb-next-reason">' + na.reason + '</div>';
      if (na.recommendedScript) {
        var scriptId = 'script-' + Date.now() + '-' + Math.random().toString(36).substr(2,4);
        h += '<div style="position:relative;">';
        h += '<div class="sb-next-script" id="' + scriptId + '">' + na.recommendedScript + '</div>';
        h += '<button onclick="var t=document.getElementById(\'' + scriptId + '\').textContent;navigator.clipboard.writeText(t).then(function(){this.textContent=\'\u2713 \u5DF2\u590D\u5236\';var _this=this;setTimeout(function(){_this.textContent=\'\u590D\u5236\u8BDD\u672F\';},1500);}.bind(this)).catch(function(){})" class="sb-copy-btn">\u590D\u5236\u8BDD\u672F</button>';
        h += '</div>';
      }
      h += '</div>';
    }

    // 流程动作
    if (ann.flows && ann.flows.length > 0) {
      h += '<div class="sb-section">';
      h += '<div class="sb-section-title">\u6D41\u7A0B\u52A8\u4F5C</div>';
      ann.flows.forEach(function(f) {
        h += '<button class="sb-flow-btn" onclick="window.showToast(\'' + f.label.replace(/'/g, "\\'") + ' \u5DF2\u521B\u5EFA\')">'
          + _iconHtmlSidebar(f.icon || 'circle') + '<span>' + f.label + '</span></button>';
      });
      h += '</div>';
    }

    // 项目推进状态
    if (ann.progress) {
      var p = ann.progress;
      h += '<div class="sb-section">';
      h += '<div class="sb-section-title">\u9879\u76EE\u63A8\u8FDB\u72B6\u6001</div>';

      var allStages = ['P1','P2','P3','P4','P5','P6','P7'];
      var curIdx = allStages.indexOf(p.currentStage);
      if (curIdx < 0) curIdx = 0;
      h += '<div class="sb-progress-dots">';
      allStages.forEach(function(s, i) {
        var cls = 'sb-pdot';
        if (i < curIdx) cls += ' done';
        else if (i === curIdx) cls += ' cur';
        h += '<div class="' + cls + '" title="' + s + '"></div>';
        if (i < allStages.length - 1) {
          h += '<div class="' + (i < curIdx ? 'sb-pbar filled' : 'sb-pbar') + '"></div>';
        }
      });
      h += '</div>';

      h += '<div class="sb-stage-info">\u5F53\u524D\u9636\u6BB5\uFF1A<strong>' + p.currentStage + '</strong>';
      if (p.stageChange) h += ' <span class="sb-stage-change">' + p.stageChange + '</span>';
      h += '</div>';

      if (p.completed && p.completed.length > 0) {
        p.completed.forEach(function(item) { h += '<div class="sb-check">' + item + '</div>'; });
      }
      if (p.pending && p.pending.length > 0) {
        p.pending.forEach(function(item) { h += '<div class="sb-pending">' + item + '</div>'; });
      }
      h += '</div>';
    }

    // 字段面板
    if (ann.fields) {
      h += '<div class="sb-section">';
      h += '<div class="sb-section-title">\u5BA2\u6237\u753B\u50CF</div>';
      var order = ann._fieldOrder || Object.keys(ann.fields);
      order.forEach(function(key) {
        var f = ann.fields[key];
        if (!f) return;
        var isEmpty = !f.value || f.status === 'empty';
        h += '<div class="sb-row"><span class="sb-key">' + key + '</span><span class="' + (isEmpty ? 'sb-val sb-val-empty' : 'sb-val') + '">' + (isEmpty ? '\u2014' : f.value) + '</span></div>';
      });
      h += '</div>';
    }

    return h;
  }

  function _renderHistoryTab() {
    var h = '';
    if (_history.length === 0) {
      h = '<div class="ht-empty">\u6682\u65E0\u8DDF\u8FDB\u8BB0\u5F55</div>';
    } else {
      for (var i = _history.length - 1; i >= 0; i--) {
        var entry = _history[i];
        h += '<div class="ht-entry">';
        h += '<div class="ht-time">' + entry.time + '</div>';
        entry.items.forEach(function(item) {
          var badgeCls = 'ht-badge';
          if (item.t === '\u9636\u6BB5\u63A8\u8FDB') badgeCls += ' ht-badge-stage';
          else if (item.t === '\u5B57\u6BB5\u66F4\u65B0') badgeCls += ' ht-badge-field';
          else if (item.t === '\u5B8C\u6210') badgeCls += ' ht-badge-done';
          h += '<div class="ht-item"><span class="' + badgeCls + '">' + item.t + '</span><span class="ht-text">' + item.d + '</span></div>';
        });
        h += '</div>';
      }
    }
    return h;
  }

  function _renderOrderTab(ann, hasOrder) {
    if (!hasOrder) {
      return '<div class="sb-order-empty">\u5BA2\u6237\u5C1A\u672A\u8FBE\u5230\u8BA2\u5355/\u5408\u540C\u9636\u6BB5<br>\u5F53\u524D\u9636\u6BB5\uFF1A' + (ann.progress ? ann.progress.currentStage : '-') + '</div>';
    }
    var orderFields = ['\u63A8\u8350\u4EA7\u54C1', '\u65B9\u6848\u72B6\u6001', '\u5BA2\u6237\u610F\u5411'];
    var h = '<div class="sb-section">';
    h += '<div class="sb-section-title">\u8BA2\u5355/\u5408\u540C\u4FE1\u606F</div>';
    if (ann.fields) {
      orderFields.forEach(function(key) {
        var f = ann.fields[key];
        if (f && f.value) {
          h += '<div class="sb-order-item"><div class="sb-order-label">' + key + '</div><div class="sb-order-value">' + f.value + '</div></div>';
        }
      });
    }
    h += '</div>';
    return h;
  }

  // ===== 小图标 =====
  function _iconHtmlSidebar(name) {
    var icons = {
      'user-plus': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
      'calendar-plus': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>',
      'send': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      'tag': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
      'circle': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
    };
    return icons[name] || icons['circle'];
  }

  // ===== 渲染 =====
  function render(containerId, title) {
    if (title) _title = title;
    _injectCSS();
    var container = document.getElementById(containerId);
    if (!container) return false;
    container.innerHTML = phoneHTML();

    // 绑定客户画像事件
    var profileBtn = document.getElementById('btn-customer-profile');
    var closeBtn = document.getElementById('profile-close');
    var overlay = document.getElementById('profile-overlay');
    if (profileBtn) profileBtn.addEventListener('click', function() { openProfile(); });
    if (closeBtn) closeBtn.addEventListener('click', function() { closeProfile(); });
    if (overlay) overlay.addEventListener('click', function() { closeProfile(); });

    // 绑定 Tab 切换（profile-body 内动态生成，使用事件委托）
    var profileBody = document.getElementById('profile-body');
    if (profileBody) profileBody.addEventListener('click', function(e) {
      var tab = e.target.getAttribute('data-tab');
      if (tab && tab !== '' && _activeTab !== tab) {
        if (tab === 'order' && (!_currentAnn || !_currentAnn.progress || ['P1','P2','P3','P4'].indexOf(_currentAnn.progress.currentStage) >= 0)) return;
        _activeTab = tab;
        _renderProfile();
      }
    });

    // 绑定历史记录返回
    var historyBack = document.getElementById('history-back');
    if (historyBack) historyBack.addEventListener('click', function() { closeHistory(); });

    // Tab 切换（事件委托）
    var profileBody = document.getElementById('profile-body');
    if (profileBody) profileBody.addEventListener('click', function(e) {
      var tab = e.target.getAttribute('data-tab');
      if (tab && !e.target.classList.contains('disabled')) {
        _activeTab = tab;
        _renderBody();
      }
    });

    return true;
  }

  // ===== 添加消息 =====
  function addMessage(type, content) {
    var msgsEl = document.getElementById('messages');
    if (!msgsEl) return;

    var div = document.createElement('div');
    div.className = 'msg msg-' + type;

    if (type === 'customer') {
      div.innerHTML = '<div class="msg-avatar">\u5BA2</div>'
        + '<div class="msg-bubble"><div class="msg-content">' + _escape(content) + '</div></div>';
    } else if (type === 'sales') {
      div.innerHTML = '<div class="msg-bubble"><div class="msg-content">' + _escape(content)
        + '</div></div></div>'
        + '<div class="msg-avatar">\u9500</div>';
    }

    msgsEl.appendChild(div);
    var chatArea = document.getElementById('chat-area');
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
  }

  // ===== 清空消息 =====
  function clearMessages() {
    var msgsEl = document.getElementById('messages');
    if (msgsEl) msgsEl.innerHTML = '';
  }

  function _escape(text) {
    return (text || '').replace(/\n/g, '<br>');
  }

  return {
    render: render,
    addMessage: addMessage,
    clearMessages: clearMessages,
    setTitle: setTitle,
    openProfile: openProfile,
    closeProfile: closeProfile,
    openHistory: openHistory,
    closeHistory: closeHistory,
    updateSidebar: updateSidebar,
    setSalesInfo: setSalesInfo,
  };
})();

if (typeof window !== 'undefined') {
  window.WecomChat = WecomChat;
}
